LIST_DISPUTES_PROMPT = """
List disputes from PayPal.

This function retrieves a list of disputes with optional pagination and filtering parameters.
"""

GET_DISPUTE_PROMPT = """
Get details for a specific dispute from PayPal.

This tool is used to lists disputes with a summary set of details, which shows the dispute_id, reason, status, dispute_state, dispute_life_cycle_stage, dispute_channel, dispute_amount, create_time and update_time fields.
"""

ACCEPT_DISPUTE_CLAIM_PROMPT = """
Accept liability for a dispute claim.

This tool is used to accept liability for a dispute claim. When you accept liability for a dispute claim, the dispute closes in the customer's favor and PayPal automatically refunds money to the customer from the merchant's account.
"""