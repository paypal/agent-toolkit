LIST_TRANSACTIONS_PROMPT = """
List transactions from PayPal.

This tool is used to list transactions with optional filtering parameters within a date range of 31 days. This tool can also be used to list details of a transaction given the transaction ID.

- The start_date and end_date should be specified in ISO8601 date and time format. Example dates: 1996-12-19T16:39:57-08:00, 1985-04-12T23:20:50.52Z, 1990-12-31T23:59:60Z
- The transaction_status accepts the following 4 values:
    1. "D" - represents denied transactions.
    2. "P" - represents pending transactions.
    3. "S" - represents successful transactions.
    4. "V" - represents transactions that were reversed.
- The transaction_id is the unique identifier for the transaction.
"""