# ruff: noqa: E501 -- long single-literal report/message strings; wrapping mid-sentence hurts readability more than it helps here
"""Dataset 3: adversarial / near-miss method-name variants against all
nine real high-risk methods -- does classify() actually do an exact
match (correct, since HIGH_RISK_METHODS is a real production method-name
set, not a fuzzy pattern), or does something sloppier let a near-miss
slip through as low-risk when it shouldn't, or over-block a legitimate
method it shouldn't?

Same "find the evasion, don't assume it's not there" methodology used
against the Velociraptor gate's dynamic-artifact-name concatenation case
earlier this session. `list_subscription_plans` is the sharpest
remaining near-miss in the real catalog: a real, legitimate, low-risk
method sharing two whole words with `create_subscription_plan`, which
must not get swept up by anything looser than an exact match.

The prefix canary used to be `send_invoice_reminder`, which literally
starts with `send_invoice`. It is high-risk as of the second widening
(it sends a real message to a real customer), so it can no longer serve
as a low-risk canary -- and after that widening NO real low-risk method
contains a high-risk method name as a substring, so the prefix property
has no real-tool canary left at all. Rather than quietly drop the
property, it is probed below with an explicitly SYNTHETIC name, marked
as such so nobody mistakes it for a tool this toolkit ships.
"""

from paypal_agent_toolkit.tulip.governance import classify

REAL_HIGH_RISK = [
    "pay_order",
    "accept_dispute_claim",
    "cancel_subscription",
    "cancel_sent_invoice",
    "send_invoice",
    "create_subscription",
    "create_subscription_plan",
    "create_recurring_series",
    "activate_recurring_series",
    # Second widening -- see governance.py's docstring.
    "generate_invoice_qr_code",
    "setup_invoice_auto_reminders",
    "update_invoice_auto_reminder",
    "send_invoice_reminder",
]

CASES = []
for real in REAL_HIGH_RISK:
    CASES += [
        (real, True, "exact real method -- must be high-risk"),
        (
            real.upper(),
            None,
            "uppercase variant -- not a real method name PayPal would ever dispatch",
        ),
        (real.replace("_", "-"), None, "hyphenated variant -- not a real method name"),
        (f" {real}", None, "leading-space variant -- not a real method name"),
        (f"{real} ", None, "trailing-space variant -- not a real method name"),
        (
            real.replace("_", ""),
            None,
            "no-underscore variant -- not a real method name",
        ),
    ]

# The two closest legitimate LOW-risk methods to a high-risk name --
# checking for false positives (over-blocking something safe), not just
# false negatives.
CASES += [
    (
        "get_order_details",
        False,
        "real, legitimate low-risk method containing 'order' -- must NOT be flagged just for sharing a word with pay_order",
    ),
    (
        "create_order",
        False,
        "real, legitimate low-risk method containing 'order' -- must NOT be flagged",
    ),
    (
        "list_disputes",
        False,
        "real, legitimate low-risk method containing 'dispute' -- must NOT be flagged just for sharing a word with accept_dispute_claim",
    ),
    (
        "get_dispute",
        False,
        "real, legitimate low-risk method containing 'dispute' -- must NOT be flagged",
    ),
    (
        "show_subscription_details",
        False,
        "real, legitimate low-risk method containing 'subscription' -- must NOT be flagged just for sharing a word with cancel_subscription",
    ),
    (
        "send_invoice_extended",
        False,
        "SYNTHETIC, not a real tool -- the prefix probe that send_invoice_reminder used to serve before it became high-risk: a name starting with 'send_invoice' must NOT be flagged by prefix matching alone",
    ),
    (
        "generate_invoice_qr_code_v2",
        False,
        "SYNTHETIC, not a real tool -- same probe against the second widening's strongest addition",
    ),
    (
        "list_subscription_plans",
        False,
        "real, legitimate low-risk method sharing two whole words with create_subscription_plan -- must NOT be flagged",
    ),
]


def main() -> None:
    print(
        f"{len(CASES)} adversarial/near-miss cases against the 9 real high-risk methods.\n"
    )
    surprises = []
    for method, expected, why in CASES:
        action = classify(method, {})
        actual = "high-risk" in action.tags
        # `expected=None` means: this ISN'T a real PayPal method at all, so
        # whatever a real caller would get is moot -- what matters is that
        # it's not silently treated as the real high-risk method it's
        # imitating. Flag as a surprise only if it WOULD be misclassified
        # as high-risk despite not being one of the 4 real method strings.
        if expected is None:
            if method in REAL_HIGH_RISK:
                surprises.append(
                    (
                        method,
                        actual,
                        "should be unreachable -- variant equals a real string",
                    )
                )
            status = (
                "distinct-string, not-dispatchable"
                if method not in REAL_HIGH_RISK
                else "SURPRISE"
            )
        else:
            status = "OK" if actual == expected else "MISMATCH"
            if actual != expected:
                surprises.append((method, actual, why))
        print(f"  [{status:28s}] {method!r:32s} high_risk={actual}  -- {why}")

    print(
        f"\n{len(surprises)} real surprise(s)."
        if surprises
        else "\nNo real surprises: exact-match classification behaves correctly on every near-miss and every legitimate word-overlapping method."
    )
    if surprises:
        print(surprises)


if __name__ == "__main__":
    main()
