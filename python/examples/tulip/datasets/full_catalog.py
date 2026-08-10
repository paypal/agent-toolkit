# ruff: noqa: E501 -- long single-literal report/message strings; wrapping mid-sentence hurts readability more than it helps here
"""Dataset 1: the FULL real 31-tool catalog from shared/tools.py.

Not a hand-picked sample -- every real tool this toolkit actually ships,
classified by the real, unmodified classify(). Same "sweep the whole
real catalog, don't cherry-pick" methodology used earlier to validate
the Velociraptor admission gate against its real 433-artifact catalog.
"""

from paypal_agent_toolkit.shared.tools import tools as real_tools
from paypal_agent_toolkit.tulip.governance import HIGH_RISK_METHODS, classify

# Hand-reviewed judgment call for every one of the 31 real tools: should
# it be high-risk? This is the "ground truth" this run checks classify()
# against -- independent review, not just re-deriving from HIGH_RISK_METHODS.
#
# The 5 methods marked "widened after independent-classifier review" were
# originally False in this ground truth; an independent model-based
# classifier, run against this same dataset, flagged them anyway (and
# agreed on every other case). Re-reviewed and agreed: starting a real
# recurring-billing commitment or transmitting a real invoice to a real
# customer is the same class of consequence this ground truth already
# held cancel_subscription/cancel_sent_invoice to on the other side of
# that relationship -- treating the "start" side as lower-stakes than the
# "stop" side was a real asymmetry, not a considered choice. Widened.
EXPECTED_HIGH_RISK = {
    "pay_order": True,  # captures/moves real money
    "accept_dispute_claim": True,  # accepts real financial liability
    "cancel_subscription": True,  # real, ongoing revenue impact
    "cancel_sent_invoice": True,  # real customer-facing cancellation
    "send_invoice": True,  # widened after independent-classifier review -- transmits a real, formal payment request to a real customer
    "create_subscription": True,  # widened after independent-classifier review -- starts a real recurring-billing commitment
    "create_subscription_plan": True,  # widened after independent-classifier review -- defines the terms of a real recurring-billing commitment
    "create_recurring_series": True,  # widened after independent-classifier review -- starts a real recurring invoice series
    "activate_recurring_series": True,  # widened after independent-classifier review -- activates a real recurring invoice series
    # Everything else: reads, drafts/creates-without-committing-funds or
    # without-notifying-anyone, listings, reminders, QR generation, tracking updates.
    "create_order": False,  # creates a draft order; no funds move until pay_order, nobody is notified
    "get_order_details": False,
    "create_product": False,
    "list_products": False,
    "show_product_details": False,
    "list_subscription_plans": False,
    "show_subscription_plan_details": False,
    "show_subscription_details": False,
    "create_invoice": False,  # creates a draft invoice; still low-risk -- send_invoice, not create_invoice, is the real external-facing action
    "list_invoices": False,
    "get_invoice": False,
    "send_invoice_reminder": False,
    "generate_invoice_qr_code": False,
    "setup_invoice_auto_reminders": False,
    "update_invoice_auto_reminder": False,
    "list_disputes": False,
    "get_dispute": False,
    "create_shipment_tracking": False,
    "get_shipment_tracking": False,
    "update_shipment_tracking": False,
    "list_transactions": False,
    "get_merchant_insights": False,
}


def main() -> None:
    real_methods = {t["method"] for t in real_tools}
    reviewed_methods = set(EXPECTED_HIGH_RISK)

    missing_from_review = real_methods - reviewed_methods
    extra_in_review = reviewed_methods - real_methods
    print(f"Real tools in shared/tools.py: {len(real_methods)}")
    print(f"Tools reviewed in this dataset: {len(reviewed_methods)}")
    if missing_from_review:
        print(
            f"MISSING FROM REVIEW (real tool, no ground-truth judgment made): {sorted(missing_from_review)}"
        )
    if extra_in_review:
        print(
            f"STALE IN REVIEW (reviewed tool no longer exists): {sorted(extra_in_review)}"
        )

    mismatches = []
    for method in sorted(real_methods):
        expected = EXPECTED_HIGH_RISK.get(method)
        action = classify(method, {})
        actual = "high-risk" in action.tags
        classify_says_high_risk = method in HIGH_RISK_METHODS
        assert (
            actual == classify_says_high_risk
        )  # classify() and the constant must agree
        status = "OK" if expected == actual else "MISMATCH"
        if status == "MISMATCH":
            mismatches.append(method)
        print(
            f"  [{status}] {method:32s} expected={expected} actual={actual} blast_radius={action.blast_radius}"
        )

    print(f"\n{len(mismatches)} mismatch(es) out of {len(real_methods)} real tools.")
    if mismatches:
        print(f"Mismatched: {mismatches}")


if __name__ == "__main__":
    main()
