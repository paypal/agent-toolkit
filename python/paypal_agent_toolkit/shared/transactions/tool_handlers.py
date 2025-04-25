import json
from datetime import datetime, timedelta
from typing import Dict, Any
from urllib.parse import urlencode
from .parameters import ListTransactionsParameters



def list_transactions(client, params: dict) -> Dict[str, Any]:
    """
    List transactions or search for a specific transaction by ID.
    """
    validated = ListTransactionsParameters(**params)

    # If searching for a specific transaction by ID
    if validated.transaction_id:
        search_months = validated.search_months or 12
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=31)

        for month in range(search_months):
            query_params = validated.dict(exclude={"search_months"})
            query_params["end_date"] = end_date.isoformat() + "Z"
            query_params["start_date"] = start_date.isoformat() + "Z"

            uri = f"/v1/reporting/transactions"
            try:
                response = client.get(uri=uri, payload=query_params)
                response_data = json.loads(response)

                if response_data.get("transaction_details"):
                    for transaction in response_data["transaction_details"]:
                        if transaction["transaction_info"]["transaction_id"] == validated.transaction_id:
                            return {
                                "found": True,
                                "transaction_details": [transaction],
                                "total_items": 1
                            }

                # Move back one month for the next search
                end_date = start_date
                start_date = start_date - timedelta(days=31)

            except Exception as error:
                # Log and continue to the next month
                print(f"Error searching transactions for month {month + 1}: {str(error)}")

        # If transaction not found after searching all months
        return {
            "found": False,
            "transaction_details": [],
            "total_items": 0,
            "message": f"The transaction ID {validated.transaction_id} was not found in the last {search_months} months."
        }

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


