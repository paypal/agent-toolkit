from paypal_agent_toolkit.shared.invoices.payload_util import (
    _compact,
    build_create_invoice_payload,
    build_create_recurring_series_payload,
)
from tests.factories import minimal_create_invoice_params, minimal_create_recurring_series_params


class TestCompact:
    def test_drops_none_values(self):
        assert _compact({"a": 1, "b": None, "c": "x"}) == {"a": 1, "c": "x"}

    def test_returns_none_when_everything_dropped(self):
        assert _compact({"a": None, "b": None}) is None

    def test_returns_none_for_empty_input(self):
        assert _compact({}) is None

    def test_keeps_falsy_but_not_none_values(self):
        assert _compact({"a": 0, "b": False, "c": ""}) == {"a": 0, "b": False, "c": ""}


class TestBuildCreateInvoicePayload:
    def test_minimal_params_produce_compact_shape(self):
        params = minimal_create_invoice_params()
        payload = build_create_invoice_payload(params)

        assert payload == {
            "detail": {"currency_code": "USD"},
            "primary_recipients": [{}],
            "items": [
                {
                    "name": "Widget",
                    "quantity": "1",
                    "unit_amount": {"currency_code": "USD", "value": "10.00"},
                }
            ],
        }
        # invoicer/configuration/amount are entirely omitted when nothing was provided
        assert "invoicer" not in payload
        assert "configuration" not in payload
        assert "amount" not in payload

    def test_invoicer_fields_are_nested(self):
        params = minimal_create_invoice_params(
            invoicer_business_name="Acme Co",
            invoicer_given_name="Ada",
            invoicer_surname="Lovelace",
            invoicer_email_address="ada@example.com",
            invoicer_tax_id="TAX123",
            invoicer_address_line_1="123 Main St",
            invoicer_city="Springfield",
            invoicer_country_code="US",
        )
        payload = build_create_invoice_payload(params)

        assert payload["invoicer"] == {
            "business_name": "Acme Co",
            "name": {"given_name": "Ada", "surname": "Lovelace"},
            "address": {
                "address_line_1": "123 Main St",
                "admin_area_2": "Springfield",
                "country_code": "US",
            },
            "email_address": "ada@example.com",
            "tax_id": "TAX123",
        }

    def test_reference_invoice_number_date_note_go_under_detail(self):
        params = minimal_create_invoice_params(
            reference="PO-1", invoice_number="INV-1", invoice_date="2024-01-01", note="thanks"
        )
        payload = build_create_invoice_payload(params)

        assert payload["detail"] == {
            "reference": "PO-1",
            "invoice_number": "INV-1",
            "invoice_date": "2024-01-01",
            "currency_code": "USD",
            "note": "thanks",
        }

    def test_pay_by_bank_disabled_by_default_even_with_threshold_flag(self):
        params = minimal_create_invoice_params(pay_by_bank_exclusive_above_threshold=True)
        payload = build_create_invoice_payload(params)

        assert "configuration" not in payload

    def test_pay_by_bank_enabled_without_threshold_rule(self):
        params = minimal_create_invoice_params(enable_pay_by_bank=True)
        payload = build_create_invoice_payload(params)

        assert payload["configuration"] == {
            "payment_method_overrides": [
                {"payment_method_type": "PAY_BY_BANK", "enabled": True}
            ]
        }

    def test_pay_by_bank_enabled_with_threshold_rule(self):
        params = minimal_create_invoice_params(
            enable_pay_by_bank=True, pay_by_bank_exclusive_above_threshold=True
        )
        payload = build_create_invoice_payload(params)

        assert payload["configuration"]["payment_method_overrides"] == [
            {
                "payment_method_type": "PAY_BY_BANK",
                "enabled": True,
                "rules": [
                    {"rule_type": "EXCLUSIVE_ABOVE_AMOUNT_THRESHOLD", "rule_value": "true"}
                ],
            }
        ]

    def test_partial_payment_true_without_minimum_amount(self):
        params = minimal_create_invoice_params(allow_partial_payment=True)
        payload = build_create_invoice_payload(params)

        assert payload["configuration"] == {"partial_payment": {"allow_partial_payment": True}}

    def test_partial_payment_with_minimum_amount(self):
        params = minimal_create_invoice_params(
            allow_partial_payment=True, minimum_partial_payment_amount="5.00"
        )
        payload = build_create_invoice_payload(params)

        assert payload["configuration"]["partial_payment"] == {
            "allow_partial_payment": True,
            "minimum_amount_due": {"currency_code": "USD", "value": "5.00"},
        }

    def test_partial_payment_false_is_still_included(self):
        params = minimal_create_invoice_params(allow_partial_payment=False)
        payload = build_create_invoice_payload(params)

        assert payload["configuration"] == {"partial_payment": {"allow_partial_payment": False}}

    def test_allow_tip_and_theme_color(self):
        params = minimal_create_invoice_params(allow_tip=True, theme_color="#FF0000")
        payload = build_create_invoice_payload(params)

        assert payload["configuration"] == {
            "allow_tip": True,
            "theme": {"primary_color": "#FF0000"},
        }

    def test_shipping_cost_builds_amount_breakdown(self):
        params = minimal_create_invoice_params(shipping_cost="2.50")
        payload = build_create_invoice_payload(params)

        assert payload["amount"] == {
            "breakdown": {"shipping": {"amount": {"currency_code": "USD", "value": "2.50"}}}
        }

    def test_multiple_items_and_recipients_passed_through(self):
        params = minimal_create_invoice_params(
            primary_recipients=[{"billing_info": {"business_name": "A"}}, {}],
            items=[
                {"name": "A", "quantity": "1", "unit_amount": {"currency_code": "USD", "value": "1.00"}},
                {"name": "B", "quantity": "2", "unit_amount": {"currency_code": "USD", "value": "2.00"}},
            ],
        )
        payload = build_create_invoice_payload(params)

        assert len(payload["primary_recipients"]) == 2
        assert len(payload["items"]) == 2


class TestBuildCreateRecurringSeriesPayload:
    def test_minimal_params_produce_compact_shape(self):
        params = minimal_create_recurring_series_params()
        payload = build_create_recurring_series_payload(params)

        assert payload == {
            "plan_detail": {
                "frequency": {"interval_unit": "MONTH", "interval_count": 1},
                "start_series_date": "2024-01-01",
            },
            "recurring_info": {
                "detail": {"currency_code": "USD"},
                "primary_recipients": [{}],
            },
        }

    def test_plan_detail_and_recurring_info_always_present(self):
        # Even with no optional fields, the two top-level keys must exist (they are
        # NOT wrapped in _compact themselves, unlike everything nested inside them).
        params = minimal_create_recurring_series_params()
        payload = build_create_recurring_series_payload(params)

        assert "plan_detail" in payload
        assert "recurring_info" in payload

    def test_total_cycles_included_when_present(self):
        params = minimal_create_recurring_series_params(total_cycles=12)
        payload = build_create_recurring_series_payload(params)

        assert payload["plan_detail"]["total_cycles"] == 12

    def test_items_passed_through_when_present(self):
        params = minimal_create_recurring_series_params(
            items=[{"name": "Widget", "quantity": "1", "unit_amount": {"currency_code": "USD", "value": "1.00"}}]
        )
        payload = build_create_recurring_series_payload(params)

        assert payload["recurring_info"]["items"] == [
            {"name": "Widget", "quantity": "1", "unit_amount": {"currency_code": "USD", "value": "1.00"}}
        ]

    def test_items_omitted_when_absent(self):
        params = minimal_create_recurring_series_params()
        payload = build_create_recurring_series_payload(params)

        assert "items" not in payload["recurring_info"]

    def test_shipping_cost_and_partial_payment(self):
        params = minimal_create_recurring_series_params(
            shipping_cost="3.00", allow_partial_payment=True, minimum_partial_payment_amount="1.00"
        )
        payload = build_create_recurring_series_payload(params)

        assert payload["recurring_info"]["amount"] == {
            "breakdown": {"shipping": {"amount": {"currency_code": "USD", "value": "3.00"}}}
        }
        assert payload["recurring_info"]["configuration"]["partial_payment"] == {
            "allow_partial_payment": True,
            "minimum_amount_due": {"currency_code": "USD", "value": "1.00"},
        }

    def test_no_theme_color_or_pay_by_bank_support(self):
        # build_create_recurring_series_payload has no theme_color / enable_pay_by_bank
        # handling at all (unlike build_create_invoice_payload) -- confirm those keys
        # passed in params are simply ignored, not surfaced anywhere in the output.
        params = minimal_create_recurring_series_params()
        params["theme_color"] = "#000000"
        params["enable_pay_by_bank"] = True
        payload = build_create_recurring_series_payload(params)

        assert "payment_method_overrides" not in str(payload["recurring_info"].get("configuration", {}))
