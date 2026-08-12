"""Real, network-free tests for `paypal_agent_toolkit.tulip.governance`.

No PayPal sandbox account is used here -- the underlying `execute`
functions in `shared/tools.py` are monkeypatched so these tests exercise
the real admission-gate logic (`classify`, `GovernedPayPalAPI.run`, the
sync/async bridge, the audit trail) without a real PayPal API call.
Disclosed explicitly: this is *not* a substitute for a live round trip
against a real PayPal sandbox account, which this contribution wasn't
able to run (see the PR description).
"""

from __future__ import annotations

import asyncio

import pytest
from tulip.control import AdmissionError

from paypal_agent_toolkit.shared import tools as tools_module
from paypal_agent_toolkit.shared.configuration import Context
from paypal_agent_toolkit.tulip.governance import GovernedPayPalAPI, classify


def _api() -> GovernedPayPalAPI:
    return GovernedPayPalAPI(
        client_id="test", secret="test", context=Context(sandbox=True)
    )


def _patch_execute(monkeypatch: pytest.MonkeyPatch, method: str, result: str) -> None:
    """Stands in for the real PayPal HTTP call `shared/tools.py` would
    otherwise make for `method`. Tool entries are plain dicts, so this
    patches the dict item directly and restores it via monkeypatch's own
    context-managed dict item patching rather than attribute patching."""
    for tool in tools_module.tools:
        if tool["method"] == method:
            monkeypatch.setitem(tool, "execute", lambda client, params: result)
            return
    raise AssertionError(f"no tool named {method!r} in shared/tools.py")


def test_classify_flags_all_thirteen_real_high_risk_methods() -> None:
    for method in (
        "pay_order",
        "accept_dispute_claim",
        "cancel_subscription",
        "cancel_sent_invoice",
        "send_invoice",
        "create_subscription",
        "create_subscription_plan",
        "create_recurring_series",
        "activate_recurring_series",
        "generate_invoice_qr_code",
        "setup_invoice_auto_reminders",
        "update_invoice_auto_reminder",
        "send_invoice_reminder",
    ):
        action = classify(method, {})
        assert "high-risk" in action.tags, method
        assert action.blast_radius == 5, method


def test_classify_leaves_reads_and_drafts_low_risk() -> None:
    for method in (
        "get_order_details",
        "list_invoices",
        "create_order",
        "get_merchant_insights",
    ):
        action = classify(method, {})
        assert action.tags == frozenset(), method
        assert action.blast_radius == 1, method


def test_low_risk_call_executes_for_real(monkeypatch: pytest.MonkeyPatch) -> None:
    # Response shape uses "id" -- matches PayPal's real response field name
    # (confirmed live, see datasets/live_sandbox.py); the *request* params
    # use "order_id" -- the real field OrderIdParameters actually expects.
    _patch_execute(
        monkeypatch, "get_order_details", '{"id": "ORDER123", "status": "COMPLETED"}'
    )
    api = _api()
    result = api.run("get_order_details", {"order_id": "ORDER123"})
    assert "ORDER123" in result

    [record] = api.audit_trail().records()
    assert record.payload["outcome"] == "allow"


def test_high_risk_call_is_held_not_executed(monkeypatch: pytest.MonkeyPatch) -> None:
    executed = {"called": False}

    def _fake_capture(client, params):
        executed["called"] = True
        return '{"status": "COMPLETED"}'

    for tool in tools_module.tools:
        if tool["method"] == "pay_order":
            monkeypatch.setitem(tool, "execute", _fake_capture)

    api = _api()
    with pytest.raises(AdmissionError) as excinfo:
        api.run("pay_order", {"order_id": "ORDER123"})

    assert excinfo.value.decision.outcome == "require_human"
    assert executed["called"] is False, (
        "the real capture must never run when the call is held"
    )

    [record] = api.audit_trail().records()
    assert record.payload["outcome"] == "require_human"


def test_audit_trail_survives_mixed_decisions_and_verifies(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_execute(monkeypatch, "get_order_details", "{}")
    api = _api()
    api.run("get_order_details", {"order_id": "X"})
    try:
        api.run("pay_order", {"order_id": "X"})
    except AdmissionError:
        pass
    trail = api.audit_trail()
    assert len(trail.records()) == 2
    assert trail.verify() is True


def test_run_works_when_called_from_inside_a_running_event_loop(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Reproduces the real call shape of this toolkit's own `openai/tool.py`:
    `on_invoke_tool` is a coroutine that calls `api.run(...)` synchronously
    from inside an already-running event loop. Confirms the sync/async
    bridge in `governance.py` handles that, not just the simpler
    no-loop-running case every other test here exercises."""
    _patch_execute(monkeypatch, "get_order_details", '{"ok": true}')
    api = _api()

    async def _invoke_like_openai_does() -> str:
        return api.run("get_order_details", {"order_id": "X"})

    result = asyncio.run(_invoke_like_openai_does())
    assert "ok" in result
