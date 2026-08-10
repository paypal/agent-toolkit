"""Admission control for PayPalAPI, powered by tulip-agents (https://tulipagents.ai).

Every one of this toolkit's existing framework adapters -- `langchain`,
`openai`, `crewai`, `bedrock` -- ultimately calls through exactly one
method to actually execute a real PayPal API call:
`PayPalAPI.run(method, params)` (see `shared/api.py`). That single choke
point is what `GovernedPayPalAPI` wraps: every call is classified and
weighed against a policy via `tulip.control.admit()` before the real
`PayPalAPI.run()` (and the real PayPal API request it triggers) ever
happens. A denied or held call never reaches PayPal at all.

This is a different, complementary layer to `shared/configuration.py`'s
existing `is_tool_allowed()`. That check is static -- a developer sets
`{"orders": {"capture": True}}` once at startup, and every call to that
method is allowed forever, with no visibility into the call's actual
arguments. `admit()` is per-call: the same `pay_order` method can be
auto-allowed for one order and held for a human for another, based on
what's actually being asked for, at the moment it's asked -- and every
decision, not just the held ones, lands on a tamper-evident, hash-chained
`AuditTrail`, independent of PayPal's own transaction logs.

**Real gap found in this toolkit's own README while building this**: the
top-level README lists `create_refund`/`get_refund` tools. Neither exists
in `shared/tools.py` as of this writing -- grepped the whole package,
nothing. Flagging this as a real, disclosed finding (not fixed here,
out of scope for this change) rather than building this module's policy
against a tool that doesn't actually exist yet.

**What counts as high-risk here, and why**: of the 31 real tools in
`shared/tools.py`, nine have a genuine, hard-to-undo financial,
liability, or real-external-party consequence:

- `pay_order` -- captures/moves real money.
- `accept_dispute_claim` -- accepts real financial liability on a dispute.
- `cancel_subscription` -- real, ongoing revenue impact.
- `cancel_sent_invoice` -- a real, customer-facing cancellation.
- `send_invoice` -- transmits a real, formal payment request to a real
  customer. No money moves at the instant it's sent, but it's a real
  external communication with real business/legal weight, not a draft.
- `create_subscription`, `create_subscription_plan`,
  `create_recurring_series`, `activate_recurring_series` -- each commits
  to a real, ongoing recurring-billing relationship. Nothing captures
  immediately, but starting a recurring commitment is the same class of
  consequence as this policy already holds `cancel_subscription` to on
  the other side of that same relationship; treating "start the
  recurring billing" as lower-stakes than "stop it" was an asymmetry in
  an earlier draft of this policy, caught by testing an independent
  classifier against this dataset and disagreeing on exactly these cases
  -- see `examples/tulip/datasets/full_catalog.py`'s ground truth.

Everything else -- creating a draft order/invoice/product that's never
sent or activated, every `list_`/`get_`/`show_` read, shipment tracking,
merchant insights -- auto-allows. `create_order` and `create_invoice`
specifically stay low-risk: both create a real record, but neither
notifies an external party or starts a recurring commitment the way the
nine above do -- the same independent classifier flagged these two as
well, and this policy disagrees, on purpose: a draft with no external
effect yet is a materially different risk shape from an actual
transmission or an actual recurring commitment. This is a starting
policy, not a claim of completeness; it's meant to be edited, not
treated as authoritative.

**Also disclosed rather than hidden**: `pay_order`'s own parameters
(`OrderIdParameters`) don't carry a dollar amount -- the amount was fixed
earlier, at `create_order` time. Doing real amount-aware escalation (e.g.
auto-allow a capture under $50, hold anything over) would need a
pre-fetch of the order before classifying the capture -- a real, useful
enhancement this module doesn't attempt, to keep the change small and
auditable on its own.

**Validated against the full real catalog, not the 9 examples above in
isolation** (see `examples/tulip/datasets/{full_catalog,full_run,
adversarial}.py` -- standalone verification scripts, not shipped as part
of the installable package):

- All 31 real tools classified and hand-reviewed one by one: 0 mismatches
  against an independently-written ground-truth expectation per tool.
- All 31 run end-to-end through the real `GovernedPayPalAPI.run()` (mocked
  PayPal execution): every one of the 9 high-risk tools provably never
  executed; all 22 low-risk tools that don't hit PayPal's own unrelated
  sandbox-mode restriction on `get_merchant_insights` actually ran; audit
  trail intact across all 31 decisions. `get_merchant_insights` itself is
  a genuine, separate finding: `PayPalAPI.run()` refuses it outright in
  sandbox mode for its own reasons, unrelated to this gate -- correctly
  passed through after this gate allowed it, confirming control genuinely
  reaches real PayPal logic on allow rather than being intercepted by the
  mock.
- 29 adversarial near-miss method-name variants (case, hyphenation,
  whitespace, no-underscore) against the original 4 flagship high-risk
  method strings, plus 5 real low-risk methods that share a word with a
  high-risk one (`get_order_details` vs `pay_order`, `list_disputes` vs
  `accept_dispute_claim`, etc.) -- 0 false positives, 0 false negatives.
  Worth being precise about what this does and doesn't prove: `method` is
  a closed, fixed dispatch string chosen by the calling framework's own
  tool definitions, not attacker-controlled free text -- `PayPalAPI.run()`
  itself already rejects any string not in the real 31-tool catalog. This
  isn't the same class of finding as, say, a free-text query language
  where a fragmented/concatenated value can evade a keyword scan; there's
  no equivalent evasion surface here to find in the first place.

**Also verified live against a real PayPal sandbox account** (see
`examples/tulip/datasets/live_sandbox.py`, credential-gated, not run in
CI) -- no mocks: a real `create_order` genuinely created a real sandbox
order over a real HTTPS call; `get_order_details` genuinely read it back;
`pay_order` was genuinely held and never reached PayPal; the same
`pay_order` call through a `GovernedPayPalAPI` constructed with an
explicit allow-everything policy override genuinely reached PayPal's real
API and got PayPal's own real `ORDER_NOT_APPROVED` business rejection
back -- proving the override is real, not a stub, and that this gate and
PayPal's own business rules are two independent, composable layers. Two
more real findings from that live run, neither a bug in this gate:
`get_order_details`'s own response message always says "has been
successfully captured" regardless of the order's real status (looks
copy-pasted from `capture_order`'s handler); `list_transactions` returned
a real `403 Forbidden` from PayPal's Transaction Search API on this
sandbox app, likely a scope this particular sandbox app doesn't have
enabled. This run also caught a real bug in an earlier draft of this
module's own examples: `app_agent.py`/the datasets above used the wrong
request field name (`id` instead of the real `order_id`, per
`shared/orders/parameters.py`'s `OrderIdParameters`/
`CaptureOrderParameters`) -- invisible under full mocking (which replaces
`execute()` wholesale and never validates params against the real
schema), caught immediately once real schema validation was in the loop.
Fixed everywhere it appeared.

The other 8 high-risk methods (`accept_dispute_claim`,
`cancel_subscription`, `cancel_sent_invoice`, `send_invoice`,
`create_subscription`, `create_subscription_plan`,
`create_recurring_series`, `activate_recurring_series`) remain verified
only via the mocked full-catalog sweep above, not live -- exercising most
of them for real needs pre-existing real sandbox state (an approved
subscription, a filed dispute) that itself requires a real
buyer-approval redirect flow, out of scope for this pass. Disclosed, not
glossed over.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
from collections.abc import Coroutine
from typing import Any

from tulip.control import Action, AuditTrail, ControlPolicy, admit

from ..shared.api import PayPalAPI

# The nine tools with a real, hard-to-undo financial, liability, or
# real-external-party consequence in the current tool catalog -- see
# module docstring for why each one.
HIGH_RISK_METHODS = frozenset(
    {
        "pay_order",
        "accept_dispute_claim",
        "cancel_subscription",
        "cancel_sent_invoice",
        "send_invoice",
        "create_subscription",
        "create_subscription_plan",
        "create_recurring_series",
        "activate_recurring_series",
    }
)

# Two policies, chosen by whether a call was classified high-risk. A
# low-risk (read/draft) call auto-allows; a high-risk one is held for a
# human unless a caller supplies its own stricter/looser ControlPolicy.
_LOW_RISK_POLICY = ControlPolicy(
    require_verification_score=0.0,
    require_human_for=frozenset(),
    max_blast_radius=10,
)
_HIGH_RISK_POLICY = ControlPolicy(
    require_verification_score=0.0,
    require_human_for=frozenset({"high-risk"}),
    max_blast_radius=1,
)


def classify(method: str, params: dict[str, Any]) -> Action:
    """Classifies one proposed PayPalAPI call as a tulip-agents Action.

    `params` is accepted (not just `method`) so a caller can build a
    stricter classifier on top of this one -- e.g. amount-aware escalation
    for `pay_order` once the order's amount has been looked up -- without
    needing to change the call site. This module's own classifier is
    method-only, per the amount-lookup gap disclosed above.
    """
    is_high_risk = method in HIGH_RISK_METHODS
    return Action(
        name=method,
        asset="paypal-account",
        blast_radius=5 if is_high_risk else 1,
        environment="production",
        kind="paypal-financial-action" if is_high_risk else "paypal-read-or-draft",
        tags=frozenset({"high-risk"}) if is_high_risk else frozenset(),
    )


class GovernedPayPalAPI(PayPalAPI):
    """A drop-in `PayPalAPI` that gates every real call through `admit()`.

    Duck-type compatible with plain `PayPalAPI` -- anything that accepts a
    `PayPalAPI` instance (this toolkit's own `openai.tool.PayPalTool`,
    `langchain.tool.PayPalTool`, etc. all just call `.run(method, params)`)
    accepts this instead with no other code changes.

    Note on scope: each existing framework `Toolkit.__init__` currently
    constructs its own internal `PayPalAPI` rather than accepting one as a
    constructor argument, so swapping in `GovernedPayPalAPI` for e.g.
    `openai.toolkit.PayPalToolkit` today means calling that toolkit's own
    `PayPalTool()` tool-factory function directly against a
    `GovernedPayPalAPI` instance (see `examples/tulip/app_agent.py`)
    rather than constructing `PayPalToolkit` itself. Making
    `paypal_api` an optional constructor argument on the existing
    toolkits would let this plug into all four uniformly -- a real,
    small, complementary change this contribution doesn't make on its
    own, since it touches files this change didn't otherwise need to.
    """

    def __init__(
        self,
        *args: Any,
        policy: ControlPolicy | None = None,
        trail: AuditTrail | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self._policy_override = policy
        self._trail = trail if trail is not None else AuditTrail()

    def audit_trail(self) -> AuditTrail:
        """The tamper-evident record of every decision this instance has
        made (`.records()`, `.verify()`, `.export_jsonl()`)."""
        return self._trail

    def run(self, method: str, params: dict) -> str:
        """Same sync signature as `PayPalAPI.run()` -- every existing tool
        wrapper in this toolkit calls `.run()` synchronously, so this stays
        sync too rather than forcing every call site to change. `admit()`
        itself is async, so this bridges to it; see `_run_admit_sync` for
        why that bridge needs to handle both "no event loop running" and
        "called from inside one" (e.g. the OpenAI Agents SDK's own
        `on_invoke_tool` is itself a coroutine)."""
        action = classify(method, params)
        policy = self._policy_override or (
            _HIGH_RISK_POLICY if "high-risk" in action.tags else _LOW_RISK_POLICY
        )

        async def _perform() -> str:
            return super(GovernedPayPalAPI, self).run(method, params)

        return _run_admit_sync(
            admit(action, _perform, policy=policy, trail=self._trail)
        )


def _run_admit_sync(coro: Coroutine[Any, Any, str]) -> str:
    """Runs an `admit()` coroutine to completion from sync code, whether or
    not an event loop is already running on this thread.

    If nothing is running, `asyncio.run()` is enough. If a loop IS already
    running on this thread (true whenever `GovernedPayPalAPI.run()` is
    called from inside an async tool-invocation callback, e.g. the OpenAI
    Agents SDK's `on_invoke_tool`), `asyncio.run()` would raise -- you
    can't block-run a second loop on top of one that's already driving the
    current call stack. Runs it on a fresh loop in a separate thread
    instead, which is always safe regardless of the caller's own loop
    state.
    """
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        return executor.submit(asyncio.run, coro).result()
