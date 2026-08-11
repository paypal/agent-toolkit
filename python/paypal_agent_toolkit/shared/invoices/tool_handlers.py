
from .parameters import *
from .payload_util import build_create_invoice_payload, build_create_recurring_series_payload
import json
import httpx
from typing import Union, Dict, Any



def _submit_invoice(client, invoice_payload: dict):
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


def create_invoice(client, params: dict):

    validated = CreateInvoiceParameters(**params)
    invoice_payload = build_create_invoice_payload(validated.model_dump(exclude_none=True))

    return _submit_invoice(client, invoice_payload)


def send_invoice(client, params: dict):

    validated = SendInvoiceParameters(**params)
    payload = validated.model_dump()

    invoice_id = payload["invoice_id"]
    url = f"/v2/invoicing/invoices/{invoice_id}/send"

    response =  client.post(uri=url, payload=payload)
    return json.dumps(response)


def create_recurring_series(client, params: dict):

    validated = CreateRecurringSeriesParameters(**params)
    payload = build_create_recurring_series_payload(validated.model_dump(exclude_none=True))

    url = "/v2/invoicing/recurring-invoices"
    response = client.post(uri=url, payload=payload)

    return json.dumps(response)


def activate_recurring_series(client, params: dict):

    validated = ActivateRecurringSeriesParameters(**params)
    recurring_series_id = validated.recurring_series_id

    url = f"/v2/invoicing/recurring-invoices/{recurring_series_id}/activate"
    client.post(uri=url, payload={})

    return json.dumps({"recurring_series_id": recurring_series_id, "status": "ACTIVATED"})


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


def delete_invoice(client, params: dict):
    validated = DeleteInvoiceParameters(**params)
    invoice_id = validated.invoice_id
    url = f"/v2/invoicing/invoices/{invoice_id}"

    response = client.delete(uri=url)

    # PayPal responds with 204 No Content on successful deletion (client.delete returns {} for that)
    if not response:
        return json.dumps({"success": True, "invoice_id": invoice_id})

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


def generate_invoice_number(client, params: dict):

    GenerateInvoiceNumberParameters(**params)
    payload = {"fetch_id": False}

    url = "/v2/invoicing/generate-next-invoice-number"
    response = client.post(uri=url, payload=payload)

    return json.dumps(response)


def setup_invoice_auto_reminders(client, params: dict):

    validated = SetupInvoiceAutoReminderParameters(**params)
    payload = validated.model_dump(exclude_none=True)

    url = "/v2/invoicing/setup-reminders"
    response = client.post(uri=url, payload=payload)

    return json.dumps(response)


def update_invoice_auto_reminder(client, params: dict):

    validated = UpdateInvoiceAutoReminderParameters(**params)
    reminder_configuration_id = validated.reminder_configuration_id
    payload = validated.model_dump(exclude_none=True, exclude={"reminder_configuration_id"})
    if payload.get("status") == "NONE":
        payload.pop("status", None)
    payload["interval"] = {"unit": "DAY", "value": validated.interval.value}
    payload["repetition"] = validated.repetition

    url = f"/v2/invoicing/reminders/{reminder_configuration_id}"
    response = client.put(uri=url, payload=payload, headers={"Prefer": "return=representation"})

    return json.dumps(response)


def search_invoicing(client, params: dict):

    validated = SearchInvoicingParameters(**params)

    if validated.resource_type == "invoice":
        return _search_invoices(client, validated)
    return _search_recurring_series(client, validated)


def _search_invoices(client, validated: SearchInvoicingParameters):

    body = (validated.invoice_filters or SearchInvoicesFilters()).model_dump(exclude_none=True)
    total_required = "true" if validated.total_required else "false"
    uri = f"/v2/invoicing/search-invoices?page={validated.page}&page_size={validated.page_size}&total_required={total_required}"
    response = client.post(uri=uri, payload=body)

    return json.dumps(response)


def _search_recurring_series(client, validated: SearchInvoicingParameters):

    body = (validated.recurring_series_filters or SearchRecurringSeriesFilters()).model_dump(exclude_none=True)
    uri = f"/v2/invoicing/search-recurring-invoices?page={validated.page}&page_size={validated.page_size}"
    response = client.post(uri=uri, payload=body)

    return json.dumps(response)


def _update_invoice(client, body: UpdateInvoiceBody):

    payload = build_create_invoice_payload(
        body.model_dump(exclude_none=True, exclude={"invoice_id", "send_to_recipient", "send_to_invoicer"})
    )
    query = "&".join(
        f"{k}={str(v).lower()}"
        for k, v in [("send_to_recipient", body.send_to_recipient), ("send_to_invoicer", body.send_to_invoicer)]
        if v is not None
    )
    url = f"/v2/invoicing/invoices/{body.invoice_id}" + (f"?{query}" if query else "")
    response = client.put(uri=url, payload=payload, headers={"Prefer": "return=representation"})

    return json.dumps(response)


def _update_recurring_series(client, body: UpdateRecurringSeriesBody):

    payload = build_create_recurring_series_payload(
        body.model_dump(exclude_none=True, exclude={"recurring_series_id"})
    )
    url = f"/v2/invoicing/recurring-invoices/{body.recurring_series_id}"
    response = client.put(uri=url, payload=payload, headers={"Prefer": "return=representation"})

    return json.dumps(response)


def update_invoicing(client, params: dict):

    validated = UpdateInvoicingParameters(**params)

    if validated.resource_type == "invoice":
        return _update_invoice(client, validated.invoice_update)
    return _update_recurring_series(client, validated.recurring_series_update)



def cancel_invoice_auto_reminder(client, params: dict):
    validated = CancelInvoiceAutoReminderParameters(**params)
    invoice_id = validated.invoice_id
    url = f"/v2/invoicing/invoices/{invoice_id}/cancel-reminders"

    response = client.post(uri=url, payload={})

    # PayPal responds with 204 No Content on success (client.post returns {} for that)
    if not response:
        return json.dumps({"success": True, "invoice_id": invoice_id})

    return json.dumps(response)


def record_payment_for_invoice(client, params: dict):

    validated = RecordPaymentForInvoiceParameters(**params)
    invoice_id = validated.invoice_id
    payload = validated.model_dump(exclude_none=True, exclude={"invoice_id"})

    url = f"/v2/invoicing/invoices/{invoice_id}/payments"
    response = client.post(uri=url, payload=payload)

    if not response:
        return json.dumps({"success": True, "invoice_id": invoice_id})

    return json.dumps(response)


def record_refund_for_invoice(client, params: dict):

    validated = RecordRefundForInvoiceParameters(**params)
    invoice_id = validated.invoice_id
    payload = validated.model_dump(exclude_none=True, exclude={"invoice_id"})

    url = f"/v2/invoicing/invoices/{invoice_id}/refunds"
    response = client.post(uri=url, payload=payload)

    if not response:
        return json.dumps({"success": True, "invoice_id": invoice_id})

    return json.dumps(response)


def create_conditional_rules_for_invoice(client, params: dict):

    validated = CreateConditionalRulesForInvoiceParameters(**params)
    invoice_id = validated.invoice_id
    payload = validated.model_dump(exclude_none=True, exclude={"invoice_id"})

    url = f"/v2/invoicing/invoices/{invoice_id}/conditional-rules"
    response = client.post(uri=url, payload=payload)

    if not response:
        return json.dumps({"success": True, "invoice_id": invoice_id})

    return json.dumps(response)
