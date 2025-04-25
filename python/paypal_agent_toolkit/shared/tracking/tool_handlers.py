
import json
from typing import Dict, Any
from .parameters import CreateShipmentParameters, GetShipmentTrackingParameters


def create_shipment_tracking(client, params: dict) -> Dict[str, Any]:
    """
    Create a shipment tracking entry.
    """
    validated = CreateShipmentParameters(**params)
    uri = "/v1/shipping/trackers-batch"
   
    # Prepare trackers data - wrapping single shipment in an array
    trackers_data = {
        "trackers": [{
            "tracking_number": validated.tracking_number,
            "transaction_id": validated.transaction_id,
            "status": validated.status,
            "carrier": validated.carrier
        }]
    }
    response = client.post(uri=uri, payload=trackers_data)
    return json.dumps(response)



def get_shipment_tracking(client, params: dict) -> Dict[str, Any]:
    """
    Retrieve shipment tracking information.
    """
    validated = GetShipmentTrackingParameters(**params)
    transaction_id = validated.transaction_id

    # Check if order_id is provided and transaction_id is not
    if validated.order_id and not transaction_id:
        try:
            order_details = client.get_order_details(order_id=validated.order_id)

            if order_details and "purchase_units" in order_details and len(order_details["purchase_units"]) > 0:
                purchase_unit = order_details["purchase_units"][0]

                if "payments" in purchase_unit and "captures" in purchase_unit["payments"] and len(purchase_unit["payments"]["captures"]) > 0:
                    capture_details = purchase_unit["payments"]["captures"][0]
                    transaction_id = capture_details["id"]
                else:
                    raise ValueError("Could not find capture id in the purchase unit details.")
            else:
                raise ValueError("Could not find purchase unit details in order details.")
        except Exception as error:
            raise ValueError(f"Error extracting transaction_id from order details: {str(error)}")

    if not transaction_id:
        raise ValueError("Either transaction_id or order_id must be provided.")

    uri = f"/v1/shipping/trackers?transaction_id={transaction_id}"
    response = client.get(uri=uri)
    return json.dumps(response)
    