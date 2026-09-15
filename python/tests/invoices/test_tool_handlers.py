import json

import pytest
from pydantic import ValidationError

from paypal_agent_toolkit.shared.invoices.tool_handlers import (
    activate_recurring_series,
    cancel_invoice_auto_reminder,
    cancel_recurring_series,
    cancel_sent_invoice,
    create_conditional_rules_for_invoice,
    create_invoice,
    create_recurring_series,
    delete_invoice,
    delete_recurring_series,
    generate_invoice_number,
    generate_invoice_qrcode,
    get_invoice,
    get_recurring_series,
    list_invoices,
    record_payment_for_invoice,
    record_refund_for_invoice,
    search_invoicing,
    send_invoice,
    send_invoice_reminder,
    setup_invoice_auto_reminders,
    update_invoice_auto_reminder,
    update_invoicing,
)
from tests.factories import minimal_create_invoice_params, minimal_create_recurring_series_params

RECURRING_SERIES_ID = "RI-ABCDEFGHIJKLMNOPQ"


class TestCreateInvoice:
    def test_happy_path(self, mock_client):
        mock_client.post.return_value = {"id": "INV2-1"}
        result = create_invoice(mock_client, minimal_create_invoice_params())

        mock_client.post.assert_called_once()
        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices"
        assert kwargs["payload"]["detail"]["currency_code"] == "USD"
        assert json.loads(result) == {"id": "INV2-1"}

    def test_missing_required_field_raises_before_client_call(self, mock_client):
        with pytest.raises(ValidationError):
            create_invoice(mock_client, {"currency_code": "USD"})
        mock_client.post.assert_not_called()

    def test_client_error_propagates(self, mock_client):
        mock_client.post.side_effect = RuntimeError("boom")
        with pytest.raises(RuntimeError):
            create_invoice(mock_client, minimal_create_invoice_params())


class TestSendInvoice:
    def test_happy_path(self, mock_client):
        mock_client.post.return_value = {"status": "SENT"}
        result = send_invoice(mock_client, {"invoice_id": "INV-1"})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1/send"
        assert json.loads(result) == {"status": "SENT"}

    def test_invalid_invoice_id_rejected(self, mock_client):
        with pytest.raises(ValidationError):
            send_invoice(mock_client, {"invoice_id": "has spaces"})
        mock_client.post.assert_not_called()


class TestCreateRecurringSeries:
    def test_happy_path(self, mock_client):
        mock_client.post.return_value = {"id": RECURRING_SERIES_ID}
        result = create_recurring_series(mock_client, minimal_create_recurring_series_params())

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/recurring-invoices"
        assert json.loads(result) == {"id": RECURRING_SERIES_ID}

    def test_missing_required_field_raises(self, mock_client):
        with pytest.raises(ValidationError):
            create_recurring_series(mock_client, {})
        mock_client.post.assert_not_called()


class TestActivateRecurringSeries:
    def test_happy_path_ignores_response_body(self, mock_client):
        mock_client.post.return_value = {"irrelevant": True}
        result = activate_recurring_series(mock_client, {"recurring_series_id": RECURRING_SERIES_ID})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == f"/v2/invoicing/recurring-invoices/{RECURRING_SERIES_ID}/activate"
        assert kwargs["payload"] == {}
        assert json.loads(result) == {"recurring_series_id": RECURRING_SERIES_ID, "status": "ACTIVATED"}

    def test_invalid_id_rejected(self, mock_client):
        with pytest.raises(ValidationError):
            activate_recurring_series(mock_client, {"recurring_series_id": "not-valid"})
        mock_client.post.assert_not_called()


class TestGetRecurringSeries:
    def test_happy_path(self, mock_client):
        mock_client.get.return_value = {"id": RECURRING_SERIES_ID}
        result = get_recurring_series(mock_client, {"recurring_series_id": RECURRING_SERIES_ID})

        mock_client.get.assert_called_once_with(uri=f"/v2/invoicing/recurring-invoices/{RECURRING_SERIES_ID}")
        assert json.loads(result) == {"id": RECURRING_SERIES_ID}


class TestCancelRecurringSeries:
    def test_happy_path_ignores_response_body(self, mock_client):
        mock_client.post.return_value = {"irrelevant": True}
        result = cancel_recurring_series(mock_client, {"recurring_series_id": RECURRING_SERIES_ID})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == f"/v2/invoicing/recurring-invoices/{RECURRING_SERIES_ID}/cancel"
        assert json.loads(result) == {"recurring_series_id": RECURRING_SERIES_ID, "status": "CANCELLED"}


class TestDeleteRecurringSeries:
    def test_happy_path_ignores_response_body(self, mock_client):
        mock_client.delete.return_value = {"irrelevant": True}
        result = delete_recurring_series(mock_client, {"recurring_series_id": RECURRING_SERIES_ID})

        mock_client.delete.assert_called_once_with(uri=f"/v2/invoicing/recurring-invoices/{RECURRING_SERIES_ID}")
        assert json.loads(result) == {"recurring_series_id": RECURRING_SERIES_ID, "status": "DELETED"}


class TestListInvoices:
    def test_defaults(self, mock_client):
        mock_client.get.return_value = {"items": []}
        result = list_invoices(mock_client, {})

        mock_client.get.assert_called_once_with(
            uri="/v2/invoicing/invoices?page_size=100&page=1&total_required=true"
        )
        assert json.loads(result) == {"items": []}

    def test_custom_page_and_size(self, mock_client):
        # total_required=False is falsy, so `validated.total_required or 'true'`
        # collapses it to the string 'true' -- only a truthy value passes through.
        list_invoices(mock_client, {"page": 3, "page_size": 5, "total_required": False})

        mock_client.get.assert_called_once_with(
            uri="/v2/invoicing/invoices?page_size=5&page=3&total_required=true"
        )

    def test_total_required_true_passed_through(self, mock_client):
        list_invoices(mock_client, {"total_required": True})

        mock_client.get.assert_called_once_with(
            uri="/v2/invoicing/invoices?page_size=100&page=1&total_required=True"
        )


class TestGetInvoice:
    def test_happy_path(self, mock_client):
        mock_client.get.return_value = {"id": "INV-1"}
        result = get_invoice(mock_client, {"invoice_id": "INV-1"})

        mock_client.get.assert_called_once_with(uri="/v2/invoicing/invoices/INV-1")
        assert json.loads(result) == {"id": "INV-1"}

    def test_invalid_id_rejected(self, mock_client):
        with pytest.raises(ValidationError):
            get_invoice(mock_client, {"invoice_id": ""})


class TestSendInvoiceReminder:
    def test_happy_path_with_response(self, mock_client):
        mock_client.post.return_value = {"ok": True}
        result = send_invoice_reminder(mock_client, {"invoice_id": "INV-1"})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1/remind"
        assert json.loads(result) == {"ok": True}

    def test_falsy_response_returns_raw_dict_not_json(self, mock_client):
        mock_client.post.return_value = None
        result = send_invoice_reminder(mock_client, {"invoice_id": "INV-1"})

        assert result == {"success": True, "invoice_id": "INV-1"}
        assert not isinstance(result, str)


class TestCancelSentInvoice:
    def test_happy_path_with_response(self, mock_client):
        mock_client.post.return_value = {"status": "CANCELLED"}
        result = cancel_sent_invoice(mock_client, {"invoice_id": "INV-1"})

        assert json.loads(result) == {"status": "CANCELLED"}

    def test_none_response_returns_raw_dict(self, mock_client):
        mock_client.post.return_value = None
        result = cancel_sent_invoice(mock_client, {"invoice_id": "INV-1"})

        assert result == {"success": True, "invoice_id": "INV-1"}


class TestDeleteInvoice:
    def test_happy_path_with_response(self, mock_client):
        mock_client.delete.return_value = {"status": "DELETED"}
        result = delete_invoice(mock_client, {"invoice_id": "INV-1"})

        assert json.loads(result) == {"status": "DELETED"}

    def test_falsy_response_returns_json_success_dict(self, mock_client):
        # delete_invoice is one of the inconsistent handlers that STILL json.dumps
        # the fallback dict, unlike send_invoice_reminder/cancel_sent_invoice.
        mock_client.delete.return_value = {}
        result = delete_invoice(mock_client, {"invoice_id": "INV-1"})

        assert result == json.dumps({"success": True, "invoice_id": "INV-1"})
        assert isinstance(result, str)


class TestGenerateInvoiceQrCode:
    def test_happy_path(self, mock_client):
        mock_client.post.return_value = {"image": "base64..."}
        result = generate_invoice_qrcode(mock_client, {"invoice_id": "INV-1"})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1/generate-qr-code"
        assert kwargs["payload"] == {"width": 300, "height": 300}
        assert json.loads(result) == {"image": "base64..."}

    def test_custom_dimensions(self, mock_client):
        generate_invoice_qrcode(mock_client, {"invoice_id": "INV-1", "width": 100, "height": 200})

        _, kwargs = mock_client.post.call_args
        assert kwargs["payload"] == {"width": 100, "height": 200}

    def test_none_response_returns_raw_dict(self, mock_client):
        mock_client.post.return_value = None
        result = generate_invoice_qrcode(mock_client, {"invoice_id": "INV-1"})

        assert result == {"success": True, "invoice_id": "INV-1"}


class TestGenerateInvoiceNumber:
    def test_happy_path(self, mock_client):
        mock_client.post.return_value = {"invoice_number": "INV-0001"}
        result = generate_invoice_number(mock_client, {})

        mock_client.post.assert_called_once_with(
            uri="/v2/invoicing/generate-next-invoice-number", payload={"fetch_id": False}
        )
        assert json.loads(result) == {"invoice_number": "INV-0001"}


class TestSetupInvoiceAutoReminders:
    def test_happy_path_no_configurations(self, mock_client):
        mock_client.post.return_value = {"ok": True}
        result = setup_invoice_auto_reminders(mock_client, {})

        mock_client.post.assert_called_once_with(uri="/v2/invoicing/setup-reminders", payload={})
        assert json.loads(result) == {"ok": True}

    def test_configurations_passed_through(self, mock_client):
        configurations = [
            {
                "type": "BEFORE_DUE",
                "interval": {"value": 1},
                "repetition": 1,
            }
        ]
        setup_invoice_auto_reminders(mock_client, {"configurations": configurations})

        _, kwargs = mock_client.post.call_args
        assert kwargs["payload"]["configurations"][0]["type"] == "BEFORE_DUE"


class TestUpdateInvoiceAutoReminder:
    def test_happy_path_builds_interval_and_repetition(self, mock_client):
        mock_client.put.return_value = {"ok": True}
        result = update_invoice_auto_reminder(
            mock_client,
            {
                "reminder_configuration_id": "RC-1",
                "type": "BEFORE_DUE",
                "interval": {"value": 3},
                "repetition": 1,
            },
        )

        args, kwargs = mock_client.put.call_args
        assert kwargs["uri"] == "/v2/invoicing/reminders/RC-1"
        assert kwargs["payload"]["interval"] == {"unit": "DAY", "value": 3}
        assert kwargs["payload"]["repetition"] == 1
        assert "reminder_configuration_id" not in kwargs["payload"]
        assert kwargs["headers"] == {"Prefer": "return=representation"}
        assert json.loads(result) == {"ok": True}

    def test_status_none_is_stripped_from_payload(self, mock_client):
        update_invoice_auto_reminder(
            mock_client,
            {
                "reminder_configuration_id": "RC-1",
                "type": "BEFORE_DUE",
                "status": "NONE",
                "interval": {"value": 3},
                "repetition": 1,
            },
        )

        _, kwargs = mock_client.put.call_args
        assert "status" not in kwargs["payload"]

    def test_status_active_kept_in_payload(self, mock_client):
        update_invoice_auto_reminder(
            mock_client,
            {
                "reminder_configuration_id": "RC-1",
                "type": "BEFORE_DUE",
                "status": "ACTIVE",
                "interval": {"value": 3},
                "repetition": 1,
            },
        )

        _, kwargs = mock_client.put.call_args
        assert kwargs["payload"]["status"] == "ACTIVE"


class TestSearchInvoicing:
    def test_dispatches_to_search_invoices(self, mock_client):
        mock_client.post.return_value = {"items": []}
        result = search_invoicing(mock_client, {"resource_type": "invoice"})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/search-invoices?page=1&page_size=20&total_required=false"
        assert json.loads(result) == {"items": []}

    def test_search_invoices_with_filters_and_total_required(self, mock_client):
        search_invoicing(
            mock_client,
            {
                "resource_type": "invoice",
                "invoice_filters": {"currency_code": "USD"},
                "total_required": True,
            },
        )

        _, kwargs = mock_client.post.call_args
        assert "total_required=true" in kwargs["uri"]
        assert kwargs["payload"] == {"currency_code": "USD"}

    def test_dispatches_to_search_recurring_series(self, mock_client):
        mock_client.post.return_value = {"items": []}
        result = search_invoicing(mock_client, {"resource_type": "recurring_series"})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/search-recurring-invoices?page=1&page_size=20"
        assert "total_required" not in kwargs["uri"]
        assert json.loads(result) == {"items": []}

    def test_mismatched_resource_type_and_filters_rejected_before_dispatch(self, mock_client):
        with pytest.raises(ValidationError):
            search_invoicing(
                mock_client,
                {
                    "resource_type": "invoice",
                    "recurring_series_filters": {"search_text": "abc", "search_fields": ["ALL"]},
                },
            )
        mock_client.post.assert_not_called()


class TestUpdateInvoicing:
    def test_dispatches_to_update_invoice(self, mock_client):
        mock_client.put.return_value = {"id": "INV-1"}
        body = minimal_create_invoice_params(invoice_id="INV-1")
        result = update_invoicing(mock_client, {"resource_type": "invoice", "invoice_update": body})

        args, kwargs = mock_client.put.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1"
        assert kwargs["headers"] == {"Prefer": "return=representation"}
        assert json.loads(result) == {"id": "INV-1"}

    def test_update_invoice_query_string_from_send_flags(self, mock_client):
        body = minimal_create_invoice_params(
            invoice_id="INV-1", send_to_recipient=True, send_to_invoicer=False
        )
        update_invoicing(mock_client, {"resource_type": "invoice", "invoice_update": body})

        _, kwargs = mock_client.put.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1?send_to_recipient=true&send_to_invoicer=false"

    def test_dispatches_to_update_recurring_series(self, mock_client):
        mock_client.put.return_value = {"id": RECURRING_SERIES_ID}
        body = minimal_create_recurring_series_params(recurring_series_id=RECURRING_SERIES_ID)
        result = update_invoicing(
            mock_client, {"resource_type": "recurring_series", "recurring_series_update": body}
        )

        _, kwargs = mock_client.put.call_args
        assert kwargs["uri"] == f"/v2/invoicing/recurring-invoices/{RECURRING_SERIES_ID}"
        assert json.loads(result) == {"id": RECURRING_SERIES_ID}

    def test_missing_invoice_update_rejected_before_dispatch(self, mock_client):
        with pytest.raises(ValidationError):
            update_invoicing(mock_client, {"resource_type": "invoice"})
        mock_client.put.assert_not_called()


class TestCancelInvoiceAutoReminder:
    def test_happy_path_with_response(self, mock_client):
        mock_client.post.return_value = {"ok": True}
        result = cancel_invoice_auto_reminder(mock_client, {"invoice_id": "INV-1"})

        mock_client.post.assert_called_once_with(uri="/v2/invoicing/invoices/INV-1/cancel-reminders", payload={})
        assert json.loads(result) == {"ok": True}

    def test_falsy_response_returns_json_success_dict(self, mock_client):
        mock_client.post.return_value = {}
        result = cancel_invoice_auto_reminder(mock_client, {"invoice_id": "INV-1"})

        assert result == json.dumps({"success": True, "invoice_id": "INV-1"})


class TestRecordPaymentForInvoice:
    def test_happy_path_with_response(self, mock_client):
        mock_client.post.return_value = {"id": "PAY-1"}
        result = record_payment_for_invoice(
            mock_client, {"invoice_id": "INV-1", "method": "CASH"}
        )

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1/payments"
        assert "invoice_id" not in kwargs["payload"]
        assert json.loads(result) == {"id": "PAY-1"}

    def test_falsy_response_returns_json_success_dict(self, mock_client):
        mock_client.post.return_value = {}
        result = record_payment_for_invoice(mock_client, {"invoice_id": "INV-1", "method": "CASH"})

        assert result == json.dumps({"success": True, "invoice_id": "INV-1"})

    def test_missing_required_method_rejected(self, mock_client):
        with pytest.raises(ValidationError):
            record_payment_for_invoice(mock_client, {"invoice_id": "INV-1"})
        mock_client.post.assert_not_called()


class TestRecordRefundForInvoice:
    def test_happy_path_with_response(self, mock_client):
        mock_client.post.return_value = {"id": "REF-1"}
        result = record_refund_for_invoice(mock_client, {"invoice_id": "INV-1", "method": "CASH"})

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1/refunds"
        assert json.loads(result) == {"id": "REF-1"}

    def test_falsy_response_returns_json_success_dict(self, mock_client):
        mock_client.post.return_value = {}
        result = record_refund_for_invoice(mock_client, {"invoice_id": "INV-1", "method": "CASH"})

        assert result == json.dumps({"success": True, "invoice_id": "INV-1"})


class TestCreateConditionalRulesForInvoice:
    RULE = {
        "conditional_rule_type": "AUTO_CANCEL",
        "rule_expiry_terms": {
            "rule_expiry_condition": "SPECIFIC_DATE",
            "condition_rule_end_date": "2024-12-31",
        },
    }

    def test_happy_path_with_response(self, mock_client):
        mock_client.post.return_value = {"id": "RULE-1"}
        result = create_conditional_rules_for_invoice(
            mock_client, {"invoice_id": "INV-1", "rules": [self.RULE]}
        )

        _, kwargs = mock_client.post.call_args
        assert kwargs["uri"] == "/v2/invoicing/invoices/INV-1/conditional-rules"
        assert "invoice_id" not in kwargs["payload"]
        assert json.loads(result) == {"id": "RULE-1"}

    def test_falsy_response_returns_json_success_dict(self, mock_client):
        mock_client.post.return_value = {}
        result = create_conditional_rules_for_invoice(
            mock_client, {"invoice_id": "INV-1", "rules": [self.RULE]}
        )

        assert result == json.dumps({"success": True, "invoice_id": "INV-1"})

    def test_empty_rules_list_rejected(self, mock_client):
        with pytest.raises(ValidationError):
            create_conditional_rules_for_invoice(mock_client, {"invoice_id": "INV-1", "rules": []})
        mock_client.post.assert_not_called()
