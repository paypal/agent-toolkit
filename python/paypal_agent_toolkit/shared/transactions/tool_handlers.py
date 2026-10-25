import json
from datetime import datetime, timedelta
from urllib.parse import urlencode
from .parameters import ListTransactionsParameters



def list_transactions(client, params: dict) -> str:
    """
    List transactions or search for a specific transaction by ID.
    """
    validated = ListTransactionsParameters(**params)

    # If searching for a specific transaction by ID
    if validated.transaction_id:
        search_months = validated.search_months or 12
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=31)

        for _ in range(search_months):
            query_params = validated.model_dump(exclude={"search_months"}, exclude_none=True)
            query_params["end_date"] = end_date.isoformat() + "Z"
            query_params["start_date"] = start_date.isoformat() + "Z"

            uri = f"/v1/reporting/transactions?{urlencode(query_params)}"
            # Query failures must propagate, not be reported as an absent payment.
            response_data = client.get(uri=uri)

            if response_data.get("transaction_details"):
                for transaction in response_data["transaction_details"]:
                    if transaction["transaction_info"]["transaction_id"] == validated.transaction_id:
                        return json.dumps({
                            "found": True,
                            "transaction_details": [transaction],
                            "total_items": 1
                        })

            # Move back one month only after a successful query.
            end_date = start_date
            start_date = start_date - timedelta(days=31)

        # If transaction not found after searching all months
        return json.dumps({
            "found": False,
            "transaction_details": [],
            "total_items": 0,
            "message": (
                f"No matching record was returned for transaction ID {validated.transaction_id} "
                f"in the last {search_months} months. PayPal reporting can be delayed; "
                "this does not establish that a payment failed."
            )
        })

    else:
        # Listing transactions without a specific ID
        query_params = validated.dict(exclude={"search_months"})

        if not query_params.get("end_date") and not query_params.get("start_date"):
            query_params["end_date"] = datetime.utcnow().isoformat() + "Z"
            query_params["start_date"] = (datetime.utcnow() - timedelta(days=31)).isoformat() + "Z"
        elif not query_params.get("end_date"):
            start_date = datetime.fromisoformat(query_params["start_date"].replace("Z", ""))
            query_params["end_date"] = (start_date + timedelta(days=31)).isoformat() + "Z"
        elif not query_params.get("start_date"):
            end_date = datetime.fromisoformat(query_params["end_date"].replace("Z", ""))
            query_params["start_date"] = (end_date - timedelta(days=31)).isoformat() + "Z"
        else:
            start_date = datetime.fromisoformat(query_params["start_date"].replace("Z", ""))
            end_date = datetime.fromisoformat(query_params["end_date"].replace("Z", ""))
            day_range = (end_date - start_date).days

            if day_range > 31:
                query_params["start_date"] = (end_date - timedelta(days=31)).isoformat() + "Z"

        query_string = urlencode(query_params)
        uri = f"/v1/reporting/transactions?" + query_string

        response = client.get(uri=uri)
        return json.dumps(response)


