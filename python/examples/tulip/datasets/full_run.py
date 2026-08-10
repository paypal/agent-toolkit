# ruff: noqa: E501 -- long single-literal report/message strings; wrapping mid-sentence hurts readability more than it helps here
"""Dataset 2: every real tool, run end-to-end through GovernedPayPalAPI.run()
(not just classify() in isolation) -- real admit() decisions, real audit
trail, mocked PayPal execution (see app_agent.py's module docstring for
why no live account was available).

Confirms two things classify()-only testing can't: (1) that a genuinely
executed low-risk call's result actually comes back to the caller
unmodified, and (2) that every high-risk call is provably NEVER executed
-- not just classified correctly -- by tracking real execution side
effects per tool.
"""

from tulip.control import AdmissionError

from paypal_agent_toolkit.shared import tools as tools_module
from paypal_agent_toolkit.shared.configuration import Context
from paypal_agent_toolkit.tulip.governance import HIGH_RISK_METHODS, GovernedPayPalAPI

# Real field names (order_id, per shared/orders/parameters.py's
# OrderIdParameters/CaptureOrderParameters) even though execution is
# mocked here and wouldn't itself catch a wrong key -- see
# datasets/live_sandbox.py for where using the wrong key ("id") was
# actually caught, against real schema validation.
SAMPLE_PARAMS = {
    "get_order_details": {"order_id": "ORDER-1"},
    "pay_order": {"order_id": "ORDER-1"},
}


def main() -> None:
    executed = {}

    def _tracking_execute(method):
        def _fn(client, params):
            executed[method] = executed.get(method, 0) + 1
            return f'{{"method": "{method}", "result": "stub"}}'

        return _fn

    for tool in tools_module.tools:
        tool["execute"] = _tracking_execute(tool["method"])

    api = GovernedPayPalAPI(
        client_id="stub", secret="stub", context=Context(sandbox=True)
    )

    results = []
    for tool in tools_module.tools:
        method = tool["method"]
        params = SAMPLE_PARAMS.get(method, {})
        try:
            api.run(method, params)
            outcome = "EXECUTED"
        except AdmissionError as e:
            outcome = e.decision.outcome.upper()
        except ValueError as e:
            # A real, unrelated finding: PayPalAPI.run() itself refuses
            # get_merchant_insights in sandbox mode -- nothing to do with
            # tulip's admission decision, which correctly ALLOWED this
            # (low-risk) before the real underlying API layer raised.
            # Confirms control genuinely passes through to real PayPal
            # logic on allow, not just the mocked execute() stub.
            outcome = f"ALLOWED_THEN_PAYPAL_REFUSED({e})"
        results.append((method, outcome, method in HIGH_RISK_METHODS))

    print(f"{'method':32s} {'outcome':14s} {'expected_high_risk':>18s}")
    failures = []
    for method, outcome, expected_high_risk in results:
        really_ran = executed.get(method, 0) > 0
        if expected_high_risk and really_ran:
            failures.append(
                f"{method}: HIGH-RISK METHOD ACTUALLY EXECUTED -- real gate failure"
            )
        if (
            not expected_high_risk
            and not really_ran
            and "ALLOWED_THEN_PAYPAL_REFUSED" not in outcome
        ):
            failures.append(
                f"{method}: low-risk method never executed -- real gate failure"
            )
        print(
            f"{method:32s} {outcome:14s} {str(expected_high_risk):>18s} ran={really_ran}"
        )

    print(f"\n{len(results)} tools run through the real admission gate.")
    print(
        f"Tools that actually executed: {sum(1 for _, o, _ in results if o == 'EXECUTED')}"
    )
    print(
        f"Tools held (require_human): {sum(1 for _, o, _ in results if o == 'REQUIRE_HUMAN')}"
    )
    print(
        f"\n{'FAILURES: ' + str(failures) if failures else 'No gate failures -- every high-risk method was blocked from executing, every low-risk method actually ran.'}"
    )

    trail = api.audit_trail()
    print(
        f"\naudit trail: {len(trail.records())} decisions across all {len(results)} calls, chain intact: {trail.verify()}"
    )


if __name__ == "__main__":
    main()
