CREATE_SHIPMENT_PROMPT = """
Create a shipment for a transaction in PayPal.
This function creates a shipment record for a specific transaction, allowing you to track the shipment status and details.
The transaction_id can fetch from the captured payment details in the order information.
Required parameters are: tracking_number (the tracking number for the shipment), transaction_id (the transaction ID associated with the shipment). 
High level: tracking_number, transaction_id, status (optional), carrier (optional) are required json objects.
Below is the payload request structure:
{
    "tracking_number": "1234567890",
    "transaction_id": "9XJ12345ABC67890",
    "status": "SHIPPED", // Required: ON_HOLD, SHIPPED, DELIVERED, CANCELLED
    "carrier": "UPS" // Required: The carrier handling the shipment. Link to supported carriers: http://developer.paypal.com/docs/tracking/reference/carriers/
}
"""

GET_SHIPMENT_TRACKING_PROMPT = """
Get tracking information for a shipment by ID.
This function retrieves tracking information for a specific shipment using the transaction ID and tracking number.
The transaction_id can fetch from the captured payment details in the order information.
Below is the payload request structure:
"""