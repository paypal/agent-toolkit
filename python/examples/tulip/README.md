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

Of this toolkit's 31 real tools, thirteen have a genuine, hard-to-undo
financial, liability, or real-external-party consequence: `pay_order`
(captures/moves real money), `accept_dispute_claim` (accepts real
financial liability), `cancel_subscription` / `cancel_sent_invoice`
(real revenue impact / a real customer-facing cancellation), plus five
methods widened after testing an independent classifier against this
same dataset and re-reviewing where it disagreed: `send_invoice`
(transmits a real payment request to a real customer), and
`create_subscription` / `create_subscription_plan` /
`create_recurring_series` / `activate_recurring_series` (each starts a
real recurring-billing commitment).

A second widening added four more, after re-reading that list against
the tools it *doesn't* contain: `generate_invoice_qr_code` (a scannable
payment surface, generatable for an invoice that was never sent -- an
unheld path to the outcome `send_invoice` is held for),
`setup_invoice_auto_reminders` / `update_invoice_auto_reminder` (an
account-wide standing schedule of future automated customer messages),
and `send_invoice_reminder` (the weakest of the four, and flagged as
such). The `send_invoice` reasoning -- a real external communication,
not a draft -- had simply not been carried to its neighbours; the ground
truth had them filed under "without-notifying-anyone".

Those thirteen are held for a human by
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

This particular demo stubs the underlying PayPal HTTP call so it runs
with no credentials at all. `governance.py`, `classify()`, and the audit
trail are real, unmodified `tulip-agents` code either way -- see below
for the same thing run against a real account.

## Dataset validation

`datasets/` -- four standalone scripts, not shipped as part of the
installable package:

```bash
python datasets/full_catalog.py    # all 31 real tools, hand-reviewed ground truth, 0 mismatches
python datasets/full_run.py        # all 31 run end-to-end (mocked); 13 high-risk never execute, low-risk do
python datasets/adversarial.py     # 29 near-miss method-name variants; 0 false positives/negatives
python datasets/live_sandbox.py    # real PayPal sandbox account, no mocks -- see below
```

`full_run.py` surfaced one real, unrelated finding along the way:
`PayPalAPI.run()` itself refuses `get_merchant_insights` in sandbox mode,
for its own reasons, independent of this gate -- correctly passed through
once this gate allowed it. See `governance.py`'s module docstring for the
full results and what the adversarial dataset does and doesn't prove
(the method name is a closed, fixed dispatch string, not attacker-
controlled free text, so it's a different kind of check than an evasion
test against a free-text query language would be).

### Live sandbox verification -- no mocks

```bash
cd datasets && cp ../.env.sample .env   # fill in real PayPal sandbox Client ID/Secret, free at developer.paypal.com
python live_sandbox.py
```

Real output against a real sandbox account:

```
1. create_order (real, low-risk, should auto-allow)
  EXECUTED -> {"id": "97913981JL2462612", "status": "PAYER_ACTION_REQUIRED", ...}

3. pay_order (real, HIGH-RISK, must be held, must never reach PayPal)
  REQUIRE_HUMAN -> blast radius 5 exceeds the maximum 1; labels ['high-risk'] require human approval

4. Same pay_order, explicit allow-everything policy override
   (expect PayPal's own real ORDER_NOT_APPROVED rejection)
  ALLOWED, THEN REAL PAYPAL API ERROR -> HTTPError: 422 Client Error: ... /capture

primary audit trail: 7 decisions, chain intact: True
override-policy audit trail: 1 decisions, chain intact: True
```

The forced-allow override genuinely reaches PayPal's real API and gets
PayPal's own real business rejection back (no real buyer ever approved
the order via PayPal's own checkout flow) -- proving the override isn't
a stub, and that this gate and PayPal's own business rules are two
independent, composable layers. Two more real findings from that run,
neither a bug in this gate, and one real bug this run caught in this
module's own examples -- see `live_sandbox.py`'s and `governance.py`'s
module docstrings for the full detail.

The other 8 high-risk methods (`accept_dispute_claim`,
`cancel_subscription`, `cancel_sent_invoice`, `send_invoice`,
`create_subscription`, `create_subscription_plan`,
`create_recurring_series`, `activate_recurring_series`) remain verified
only via the mocked `full_run.py` sweep, not live -- exercising most of
them for real needs pre-existing sandbox state (an approved
subscription, a filed dispute) that itself requires a real
buyer-approval redirect flow, out of scope for this pass. Disclosed,
not glossed over.
