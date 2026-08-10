# tulip-agents admission gate

Adds a real per-call admission decision -- allow / require-human / deny,
with a tamper-evident audit trail -- in front of `PayPalAPI.run()`, the
one method every existing framework adapter in this toolkit (`langchain`,
`openai`, `crewai`, `bedrock`) calls to actually execute a real PayPal API
request. A denied or held call never reaches PayPal.

Different from `shared/configuration.py`'s existing `is_tool_allowed()`:
that's a static, developer-configured allow-list set once at startup with
no visibility into a call's actual arguments. `tulip-agents`'
[`admit()`](https://tulipagents.ai) is per-call -- the same method can be
auto-allowed for one request and held for a human for another, and every
decision (not just the held ones) is recorded, independent of PayPal's own
transaction logs.

## What's gated

Of this toolkit's 30 real tools, four have a genuine, hard-to-undo
financial or liability consequence: `pay_order` (captures/moves real
money), `accept_dispute_claim` (accepts real financial liability),
`cancel_subscription` (real revenue impact), `cancel_sent_invoice` (a
real, customer-facing cancellation). Those four are held for a human by
default; everything else -- reads, drafts, listings -- auto-allows. See
`paypal_agent_toolkit/tulip/governance.py`'s module docstring for the full
reasoning, including one real, disclosed gap this toolkit's own top-level
README has: it lists `create_refund`/`get_refund` tools that don't
actually exist in `shared/tools.py` yet.

## Try it

```bash
pip install -r requirements.txt
python app_agent.py
```

No PayPal sandbox account or OpenAI API key required -- see
`app_agent.py`'s module docstring for exactly what's stubbed and why, and
how to point it at a real sandbox account instead.

```
[get_order_details] a real read, auto-allowed]
  -> {"id": "ORDER-1", "status": "COMPLETED", "amount": "42.00 USD"}

[pay_order] captures real money -- held for a human
  -> REQUIRE_HUMAN: blast radius 5 exceeds the maximum 1; labels ['high-risk'] require human approval

audit trail: 2 decisions, chain intact: True
```

## Tests

```bash
pytest test_governance.py -v
```

6 real tests against the actual `GovernedPayPalAPI`/`classify()` code
(monkeypatched execution, no PayPal call) -- including one that
specifically reproduces this toolkit's own `openai/tool.py` call shape
(`on_invoke_tool` is a coroutine calling `.run()` synchronously from
inside an already-running event loop), to confirm the sync/async bridge
in `governance.py` actually holds up under the real call pattern, not
just a simplified one.

**Disclosed, not hidden**: none of this was run against a live PayPal
sandbox account -- no credentials were available while building it. The
governance logic itself (`admit()`, `classify()`, the audit trail) is
real, unmodified `tulip-agents` code exercised through this toolkit's own
real `PayPalTool`/`FunctionTool` machinery; only the underlying PayPal
HTTP call is stubbed.
