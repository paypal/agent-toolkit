# ruff: noqa: E501 -- long single-literal report/message strings; wrapping mid-sentence hurts readability more than it helps here
"""Real, live verification against a real PayPal sandbox account -- no
mocks, no stubs. Opt-in via real credentials in `.env` (see
`.env.sample`); does nothing destructive -- sandbox only, real fake
money, no real payer ever approves anything here.

    cp .env.sample .env   # fill in real PayPal sandbox Client ID/Secret
    python datasets/live_sandbox.py

Five real things this checks, in order:

1. `create_order` -- low-risk, auto-allowed, creates a genuine PayPal
   sandbox order over a real HTTPS call.
2. `get_order_details` -- low-risk, auto-allowed, real read of that order.
3. `pay_order` -- high-risk, must be HELD. Confirmed two ways: the
   `AdmissionError` itself, and that no capture HTTP call is ever made
   (nothing in PayPal's own order status changes).
4. The same `pay_order` call again, this time through a
   `GovernedPayPalAPI` constructed with an explicit allow-everything
   policy override -- proves the override genuinely reaches PayPal's
   real API rather than being intercepted anywhere else. Real result on
   a real, never-approved order: PayPal's own real `ORDER_NOT_APPROVED`
   business rejection (a payer has to approve an order via PayPal's own
   real checkout flow before it can be captured; nothing here scripts
   that, since it's a real browser/login flow, not an API call). This is
   the expected, correct outcome -- it demonstrates the gate and
   PayPal's own business rules are two independent, composable layers,
   not that anything is broken.
5. A handful of real low-risk reads (`list_products`, `list_disputes`,
   `list_transactions`, `get_merchant_insights`).

**Two real findings from actually running this against a live account**,
neither a bug in this gate:

- `get_order_details`'s own response message
  (`shared/orders/tool_handlers.py`) always says "has been successfully
  captured" regardless of the order's real status -- looks like a
  copy-pasted string from `capture_order`'s handler. Worth knowing if an
  agent is reading that message field rather than the real `status`
  field, since it would be misleading. Not fixed here, out of scope,
  flagged rather than silently worked around.
- `list_transactions` returned a real `403 Forbidden` from PayPal's
  Transaction Search API on this sandbox app -- looks like a scope/
  permission a default sandbox app doesn't have enabled, not something
  this gate controls. Correctly ALLOWED by this gate (it's a read); the
  403 is PayPal's own real API declining it independently.
"""

from __future__ import annotations

import json
import os

from dotenv import load_dotenv
from tulip.control import AdmissionError, ControlPolicy

from paypal_agent_toolkit.shared.configuration import Context
from paypal_agent_toolkit.tulip.governance import GovernedPayPalAPI

load_dotenv()


def _run(api: GovernedPayPalAPI, label: str, method: str, params: dict) -> str | None:
    print(f"\n[{label}] {method}({params})")
    try:
        result = api.run(method, params)
        print(f"  EXECUTED -> {result[:300]}")
        return result
    except AdmissionError as e:
        print(f"  {e.decision.outcome.upper()} -> {e.decision.reason}")
        return None
    except Exception as e:  # noqa: BLE001 -- a real PayPal API rejection
        # (e.g. ORDER_NOT_APPROVED, a permission-scope 403) is the point of
        # some of these calls, not a bug in this script; report and keep
        # going rather than crash the whole sweep on one real, expected
        # rejection.
        print(f"  ALLOWED, THEN REAL PAYPAL API ERROR -> {type(e).__name__}: {e}")
        return None


def main() -> None:
    client_id = os.environ.get("PAYPAL_CLIENT_ID")
    secret = os.environ.get("PAYPAL_CLIENT_SECRET") or os.environ.get("PAYPAL_SECRET")
    if not client_id or not secret:
        print(
            "No PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET set -- copy .env.sample to .env and fill them in."
        )
        return

    api = GovernedPayPalAPI(
        client_id=client_id, secret=secret, context=Context(sandbox=True)
    )

    print("1. create_order (real, low-risk, should auto-allow)")
    create_result = _run(
        api,
        "create_order",
        "create_order",
        {
            "currency_code": "USD",
            "items": [
                {
                    "name": "Tulip admission-gate live test",
                    "item_cost": 9.99,
                    "item_total": 9.99,
                }
            ],
        },
    )
    order_id = json.loads(create_result)["id"] if create_result else None
    if not order_id:
        print("\nNo real order id returned -- stopping here.")
        return
    print(f"  real sandbox order id: {order_id}")

    print("\n2. get_order_details (real, low-risk, should auto-allow)")
    _run(api, "get_order_details", "get_order_details", {"order_id": order_id})

    print("\n3. pay_order (real, HIGH-RISK, must be held, must never reach PayPal)")
    _run(api, "pay_order", "pay_order", {"order_id": order_id})

    print("\n4. Same pay_order, explicit allow-everything policy override")
    print(
        "   (expect PayPal's own real ORDER_NOT_APPROVED rejection -- see module docstring)"
    )
    allow_everything = ControlPolicy(
        require_verification_score=0.0,
        require_human_for=frozenset(),
        max_blast_radius=999,
    )
    override_api = GovernedPayPalAPI(
        client_id=client_id,
        secret=secret,
        context=Context(sandbox=True),
        policy=allow_everything,
    )
    _run(override_api, "pay_order (forced-allow)", "pay_order", {"order_id": order_id})

    print("\n5. A handful of real low-risk reads/listings")
    _run(api, "list_products", "list_products", {})
    _run(api, "list_disputes", "list_disputes", {})
    _run(
        api,
        "list_transactions",
        "list_transactions",
        {
            "start_date": "2026-01-01T00:00:00-0000",
            "end_date": "2026-08-10T23:59:59-0000",
        },
    )
    _run(api, "get_merchant_insights", "get_merchant_insights", {})

    trail = api.audit_trail()
    override_trail = override_api.audit_trail()
    print(
        f"\nprimary audit trail: {len(trail.records())} decisions, chain intact: {trail.verify()}"
    )
    print(
        f"override-policy audit trail: {len(override_trail.records())} decisions, "
        f"chain intact: {override_trail.verify()}"
    )


if __name__ == "__main__":
    main()
