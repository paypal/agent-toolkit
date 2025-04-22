
from .parameters import *
import json
import httpx
from typing import Union, Dict, Any



def create_invoice(client, params: dict):
    
    validated = CreateInvoiceParameters(**params)
    invoice_payload = validated.model_dump()

    url = "/v2/invoicing/invoices"
    response = client.post(uri=url, payload=invoice_payload)

    if (
        response.get("rel") == "self"
        and "/v2/invoicing/invoices/" in response.get("href", "")
        and response.get("method") == "GET"
    ):
        invoice_id = response["href"].split("/")[-1]
        try:
            send_result = send_invoice(client, {
                "invoice_id": invoice_id,
                "note": "Thank you for choosing us. If there are any issues, feel free to contact us.",
                "send_to_recipient": True
            })
            return json.dumps({
                "createResult": response,
                "sendResult": send_result
            })
        except Exception:
            return json.dumps(response)

    return json.dumps(response)


def send_invoice(client, params: dict):

    validated = SendInvoiceParameters(**params)
    payload = validated.model_dump()

    invoice_id = payload["invoice_id"]
    url = f"/v2/invoicing/invoices/{invoice_id}/send"

    response =  client.post(uri=url, payload=payload)
    return json.dumps(response)


def list_invoices(client, params: dict):

    validated = ListInvoicesParameters(**params)
    invoice_uri = f"/v2/invoicing/invoices?page_size={validated.page_size or 10}&page={validated.page or 1}&total_required={validated.total_required or 'true'}"
    response = client.get(uri=invoice_uri)

    return json.dumps(response)


def get_invoice(client, params: dict):
    validated = GetInvoiceParameters(**params)
    invoice_id = validated.invoice_id

    url = f"/v2/invoicing/invoices/{invoice_id}"
    response = client.get(uri=url)

    return json.dumps(response)


def send_invoice_reminder(client, params: dict):

    validated = SendInvoiceReminderParameters(**params)
    payload = validated.model_dump()

    invoice_id = payload["invoice_id"]
    url = f"/v2/invoicing/invoices/{invoice_id}/remind"
    print("url: ", url)
    response = client.post(uri=url, payload=payload)
    print("response: ", response)

    if response is None:
        return {"success": True, "invoice_id": invoice_id}
    return json.dumps(response)


def cancel_sent_invoice(client, params: dict):
    
    validated = CancelSentInvoiceParameters(**params)
    payload = validated.model_dump()
    invoice_id = payload["invoice_id"]
    url = f"/v2/invoicing/invoices/{invoice_id}/cancel"

    response = client.post(uri=url, payload=payload)
    
    # PayPal responds with 204 No Content on successful cancellation
    if response is None:
        return {"success": True, "invoice_id": invoice_id}

    return json.dumps(response)


def generate_invoice_qrcode(client, params: dict):

    validated = GenerateInvoiceQrCodeParameters(**params)
    payload = {
        "width": validated.width,
        "height": validated.height
    }

    invoice_id = validated.invoice_id
    url = f"/v2/invoicing/invoices/{invoice_id}/generate-qr-code"

    response = client.post(uri=url, payload=payload)

    if response is None:
        return {"success": True, "invoice_id": invoice_id}

    return json.dumps(response)