import pytest
from pydantic import ValidationError

from paypal_agent_toolkit.shared.invoices.parameters import (
    Address,
    DateTimeRange,
    Discount,
    InvoiceConditionalRule,
    InvoiceConditionalRuleExpiryTerms,
    RecordPaymentForInvoiceParameters,
    RecordRefundForInvoiceParameters,
    RecurringSeriesSearchFilters,
    SearchInvoicesFilters,
    SearchInvoicingParameters,
    SearchRecurringSeriesFilters,
    UpdateInvoiceBody,
    UpdateInvoicingParameters,
    UpdateRecurringSeriesBody,
)
from tests.factories import minimal_create_invoice_params, minimal_create_recurring_series_params


class TestDateTimeRange:
    def test_expands_bare_date_to_start_of_day(self):
        r = DateTimeRange(start="2024-01-01", end="2024-01-02T23:59:59Z")
        assert r.start == "2024-01-01T00:00:00Z"

    def test_expands_bare_date_to_end_of_day(self):
        r = DateTimeRange(start="2024-01-01T00:00:00Z", end="2024-01-02")
        assert r.end == "2024-01-02T23:59:59Z"

    def test_full_datetime_passed_through_unchanged(self):
        r = DateTimeRange(start="2024-01-01T05:30:00Z", end="2024-01-02T23:59:59Z")
        assert r.start == "2024-01-01T05:30:00Z"

    def test_invalid_string_rejected(self):
        with pytest.raises(ValidationError):
            DateTimeRange(start="not-a-date", end="2024-01-02T23:59:59Z")


class TestAddress:
    def test_empty_string_country_code_becomes_none(self):
        addr = Address(country_code="")
        assert addr.country_code is None

    def test_valid_country_code_kept(self):
        addr = Address(country_code="US")
        assert addr.country_code == "US"

    def test_invalid_country_code_rejected(self):
        with pytest.raises(ValidationError):
            Address(country_code="USA")


class TestDiscount:
    def test_percent_only_is_valid(self):
        Discount(percent="10")

    def test_amount_only_is_valid(self):
        Discount(amount={"currency_code": "USD", "value": "5.00"})

    def test_neither_is_valid(self):
        Discount()

    def test_both_percent_and_amount_rejected(self):
        with pytest.raises(ValidationError):
            Discount(percent="10", amount={"currency_code": "USD", "value": "5.00"})


class TestSearchInvoicesFilters:
    def test_blank_strings_dropped(self):
        f = SearchInvoicesFilters(recipient_email="  ", invoice_number="")
        assert f.recipient_email is None
        assert f.invoice_number is None

    def test_blank_status_list_dropped(self):
        f = SearchInvoicesFilters(status=[])
        assert f.status is None

    def test_valid_status_kept(self):
        f = SearchInvoicesFilters(status=["DRAFT", "SENT"])
        assert f.status == ["DRAFT", "SENT"]

    def test_amount_range_with_blank_values_dropped(self):
        f = SearchInvoicesFilters(
            total_amount_range={
                "lower_amount": {"currency_code": "USD", "value": ""},
                "upper_amount": {"currency_code": "USD", "value": "10.00"},
            }
        )
        assert f.total_amount_range is None

    def test_amount_range_with_valid_values_kept(self):
        f = SearchInvoicesFilters(
            total_amount_range={
                "lower_amount": {"currency_code": "USD", "value": "1.00"},
                "upper_amount": {"currency_code": "USD", "value": "10.00"},
            }
        )
        assert f.total_amount_range is not None

    def test_blank_date_range_dropped(self):
        f = SearchInvoicesFilters(invoice_date_range={"start": "", "end": ""})
        assert f.invoice_date_range is None


class TestRecurringSeriesSearchFilters:
    def test_duplicate_status_rejected(self):
        with pytest.raises(ValidationError):
            RecurringSeriesSearchFilters(status=["ACTIVE", "ACTIVE"])

    def test_unique_status_accepted(self):
        f = RecurringSeriesSearchFilters(status=["ACTIVE", "CANCELLED"])
        assert f.status == ["ACTIVE", "CANCELLED"]

    def test_mutually_exclusive_date_ranges_rejected(self):
        with pytest.raises(ValidationError):
            RecurringSeriesSearchFilters(
                creation_date_range={"start": "2024-01-01T00:00:00Z", "end": "2024-01-02T00:00:00Z"},
                next_occurrence_date_range={"start": "2024-01-01", "end": "2024-01-02"},
            )

    def test_only_one_date_range_is_valid(self):
        f = RecurringSeriesSearchFilters(
            creation_date_range={"start": "2024-01-01T00:00:00Z", "end": "2024-01-02T00:00:00Z"}
        )
        assert f.creation_date_range is not None
        assert f.next_occurrence_date_range is None

    def test_blank_currency_code_dropped(self):
        f = RecurringSeriesSearchFilters(currency_code="")
        assert f.currency_code is None


class TestSearchRecurringSeriesFilters:
    def test_duplicate_search_fields_rejected(self):
        with pytest.raises(ValidationError):
            SearchRecurringSeriesFilters(search_text="abc", search_fields=["ALL", "ALL"])

    def test_unique_search_fields_accepted(self):
        f = SearchRecurringSeriesFilters(search_text="abc", search_fields=["ALL"])
        assert f.search_fields == ["ALL"]

    def test_blank_search_text_dropped(self):
        f = SearchRecurringSeriesFilters(search_text="   ")
        assert f.search_text is None

    def test_blank_search_fields_dropped(self):
        f = SearchRecurringSeriesFilters(search_fields=[])
        assert f.search_fields is None


class TestSearchInvoicingParameters:
    def test_invoice_resource_type_with_recurring_filters_rejected(self):
        with pytest.raises(ValidationError):
            SearchInvoicingParameters(
                resource_type="invoice",
                recurring_series_filters={"search_text": "abc", "search_fields": ["ALL"]},
            )

    def test_recurring_resource_type_with_invoice_filters_rejected(self):
        with pytest.raises(ValidationError):
            SearchInvoicingParameters(
                resource_type="recurring_series",
                invoice_filters={"currency_code": "USD"},
            )

    def test_invoice_resource_type_with_invoice_filters_accepted(self):
        params = SearchInvoicingParameters(
            resource_type="invoice",
            invoice_filters={"currency_code": "USD"},
        )
        assert params.invoice_filters.currency_code == "USD"

    def test_invoice_resource_type_with_empty_recurring_filters_object_accepted(self):
        # An "empty" filters object (all-None fields) does not count as "set" for
        # the mutual-exclusivity check.
        params = SearchInvoicingParameters(
            resource_type="invoice",
            recurring_series_filters={},
        )
        assert params.resource_type == "invoice"

    def test_defaults(self):
        params = SearchInvoicingParameters(resource_type="invoice")
        assert params.page == 1
        assert params.page_size == 20
        assert params.total_required is False


class TestUpdateInvoicingParameters:
    def test_invoice_resource_type_requires_invoice_update(self):
        with pytest.raises(ValidationError):
            UpdateInvoicingParameters(resource_type="invoice")

    def test_invoice_resource_type_requires_invoice_id(self):
        body = minimal_create_invoice_params()
        with pytest.raises(ValidationError):
            UpdateInvoicingParameters(resource_type="invoice", invoice_update=body)

    def test_invoice_resource_type_with_recurring_series_update_rejected(self):
        invoice_body = minimal_create_invoice_params(invoice_id="INV-1")
        recurring_body = minimal_create_recurring_series_params(recurring_series_id="RI-ABCDEFGHIJKLMNOPQ")
        with pytest.raises(ValidationError):
            UpdateInvoicingParameters(
                resource_type="invoice",
                invoice_update=invoice_body,
                recurring_series_update=recurring_body,
            )

    def test_valid_invoice_update(self):
        body = minimal_create_invoice_params(invoice_id="INV-1")
        params = UpdateInvoicingParameters(resource_type="invoice", invoice_update=body)
        assert params.invoice_update.invoice_id == "INV-1"

    def test_recurring_series_resource_type_requires_recurring_series_id(self):
        body = minimal_create_recurring_series_params()
        with pytest.raises(ValidationError):
            UpdateInvoicingParameters(resource_type="recurring_series", recurring_series_update=body)

    def test_valid_recurring_series_update(self):
        body = minimal_create_recurring_series_params(recurring_series_id="RI-ABCDEFGHIJKLMNOPQ")
        params = UpdateInvoicingParameters(resource_type="recurring_series", recurring_series_update=body)
        assert params.recurring_series_update.recurring_series_id == "RI-ABCDEFGHIJKLMNOPQ"


class TestRecordPaymentForInvoiceParameters:
    def test_empty_string_dates_become_none(self):
        params = RecordPaymentForInvoiceParameters(
            invoice_id="INV-1", method="CASH", payment_id="", payment_date="", payment_date_time=""
        )
        assert params.payment_id is None
        assert params.payment_date is None
        assert params.payment_date_time is None

    def test_invalid_invoice_id_rejected(self):
        with pytest.raises(ValidationError):
            RecordPaymentForInvoiceParameters(invoice_id="bad id with spaces", method="CASH")


class TestRecordRefundForInvoiceParameters:
    def test_empty_string_refund_date_becomes_none(self):
        params = RecordRefundForInvoiceParameters(invoice_id="INV-1", method="CASH", refund_date="")
        assert params.refund_date is None


class TestInvoiceConditionalRule:
    def _expiry(self):
        return InvoiceConditionalRuleExpiryTerms(
            rule_expiry_condition="SPECIFIC_DATE", condition_rule_end_date="2024-12-31"
        )

    def test_early_payment_discount_requires_value_and_type(self):
        with pytest.raises(ValidationError):
            InvoiceConditionalRule(
                conditional_rule_type="EARLY_PAYMENT_DISCOUNT",
                rule_expiry_terms=self._expiry(),
            )

    def test_early_payment_discount_percent_in_range_accepted(self):
        rule = InvoiceConditionalRule(
            conditional_rule_type="EARLY_PAYMENT_DISCOUNT",
            conditional_rule_value_type="PERCENT",
            conditional_rule_value="50",
            rule_expiry_terms=self._expiry(),
        )
        assert rule.conditional_rule_value == "50"

    @pytest.mark.parametrize("value", ["0", "101", "-5"])
    def test_early_payment_discount_percent_out_of_range_rejected(self, value):
        with pytest.raises(ValidationError):
            InvoiceConditionalRule(
                conditional_rule_type="EARLY_PAYMENT_DISCOUNT",
                conditional_rule_value_type="PERCENT",
                conditional_rule_value=value,
                rule_expiry_terms=self._expiry(),
            )

    def test_early_payment_discount_amount_type_not_bounded(self):
        rule = InvoiceConditionalRule(
            conditional_rule_type="EARLY_PAYMENT_DISCOUNT",
            conditional_rule_value_type="AMOUNT",
            conditional_rule_value="500",
            rule_expiry_terms=self._expiry(),
        )
        assert rule.conditional_rule_value == "500"

    def test_auto_cancel_does_not_require_value_fields(self):
        rule = InvoiceConditionalRule(
            conditional_rule_type="AUTO_CANCEL",
            rule_expiry_terms=self._expiry(),
        )
        assert rule.conditional_rule_value is None
