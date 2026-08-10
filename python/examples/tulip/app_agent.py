"""Real, runnable admission-gate demo -- no PayPal sandbox account or
OpenAI API key required to run this.

Builds two real `FunctionTool` objects using this toolkit's own,
unmodified `openai.tool.PayPalTool()` factory -- the same function
`openai/toolkit.py` uses internally -- but backed by a `GovernedPayPalAPI`
instead of a plain `PayPalAPI`. Then calls `on_invoke_tool` directly on
each (the same coroutine the OpenAI Agents SDK runner calls once an LLM
decides to invoke a tool), so this demonstrates the real tool-invocation
path without needing a live LLM call.

This particular script stubs the underlying PayPal HTTP call, so it runs
with no credentials at all -- see `datasets/live_sandbox.py` for the same
governance logic run against a real PayPal sandbox account instead (real
order created, real capture genuinely held, then a forced-allow override
that genuinely reaches PayPal's real API and gets PayPal's own real
`ORDER_NOT_APPROVED` business rejection back). Nothing about the
governance layer itself is stubbed in either case -- `GovernedPayPalAPI`,
`classify()`, `tulip.control.admit()`, and the `AuditTrail` are all real,
unmodified tulip-agents code, exercised through this toolkit's own real
`PayPalTool`/`FunctionTool` machinery.

    pip install -r requirements.txt
    python app_agent.py
"""

from __future__ import annotations

import asyncio
import json

from agents.run_context import RunContextWrapper
from tulip.control import AdmissionError

from paypal_agent_toolkit.openai.tool import PayPalTool
from paypal_agent_toolkit.shared import tools as tools_module
from paypal_agent_toolkit.shared.configuration import Context
from paypal_agent_toolkit.tulip.governance import GovernedPayPalAPI


def _stub_paypal_http_calls() -> None:
    """Stands in for the real PayPal API -- see this file's module
    docstring for the real-sandbox version. Uses the real param key name
    (`order_id`, per `shared/orders/parameters.py`'s `OrderIdParameters`/
    `CaptureOrderParameters`) even though this stub never validates it --
    matching the real schema here is what caught, in `live_sandbox.py`,
    that an earlier draft of this file used the wrong key (`id`) and
    only "worked" because a full stub bypasses real param validation."""
    for tool in tools_module.tools:
        if tool["method"] == "get_order_details":
            tool["execute"] = lambda client, params: json.dumps(
                {
                    "id": params.get("order_id"),
                    "status": "COMPLETED",
                    "amount": "42.00 USD",
                }
            )
        elif tool["method"] == "pay_order":
            tool["execute"] = lambda client, params: json.dumps(
                {"id": params.get("order_id"), "status": "CAPTURED"}
            )


def _tool_by_method(method: str):
    for tool in tools_module.tools:
        if tool["method"] == method:
            return tool
    raise AssertionError(f"no tool named {method!r}")


async def _invoke(function_tool, args: dict) -> str:
    """Same call shape the OpenAI Agents SDK runner uses once an LLM
    decides to call this tool."""
    ctx = RunContextWrapper(context=None)
    return await function_tool.on_invoke_tool(ctx, json.dumps(args))


async def main() -> None:
    _stub_paypal_http_calls()

    api = GovernedPayPalAPI(
        client_id="stub", secret="stub", context=Context(sandbox=True)
    )
    get_order_tool = PayPalTool(api, _tool_by_method("get_order_details"))
    pay_order_tool = PayPalTool(api, _tool_by_method("pay_order"))

    print("[get_order_details] a real read, auto-allowed]")
    result = await _invoke(get_order_tool, {"order_id": "ORDER-1"})
    print(f"  -> {result}\n")

    print("[pay_order] captures real money -- held for a human")
    try:
        result = await _invoke(pay_order_tool, {"order_id": "ORDER-1"})
        print(f"  -> ALLOWED (unexpected): {result}")
    except AdmissionError as e:
        print(f"  -> {e.decision.outcome.upper()}: {e.decision.reason}")

    trail = api.audit_trail()
    n = len(trail.records())
    print(f"\naudit trail: {n} decisions, chain intact: {trail.verify()}")


if __name__ == "__main__":
    asyncio.run(main())
