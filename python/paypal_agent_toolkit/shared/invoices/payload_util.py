def _compact(obj: dict) -> dict | None:
    """Drops None-valued keys from a shallow dict; returns None if nothing is left,
    so callers can omit an entire nested object (e.g. name, address) when none of its
    source fields were provided."""
    filtered = {k: v for k, v in obj.items() if v is not None}
    return filtered or None


def build_create_invoice_payload(params: dict) -> dict:
    """Re-nests the flat CreateInvoiceParameters fields into PayPal's actual
    invoicing API request shape."""
    currency_code = params["currency_code"]

    invoicer = _compact({
        "business_name": params.get("invoicer_business_name"),
        "name": _compact({
            "given_name": params.get("invoicer_given_name"),
            "surname": params.get("invoicer_surname"),
        }),
        "address": _compact({
            "address_line_1": params.get("invoicer_address_line_1"),
            "address_line_2": params.get("invoicer_address_line_2"),
            "admin_area_2": params.get("invoicer_city"),
            "admin_area_1": params.get("invoicer_state"),
            "postal_code": params.get("invoicer_postal_code"),
            "country_code": params.get("invoicer_country_code"),
        }),
        "email_address": params.get("invoicer_email_address"),
        "tax_id": params.get("invoicer_tax_id"),
    })

    payment_method_overrides = None
    if params.get("enable_pay_by_bank"):
        rules = None
        if params.get("pay_by_bank_exclusive_above_threshold"):
            rules = [{
                "rule_type": "EXCLUSIVE_ABOVE_AMOUNT_THRESHOLD",
                "rule_value": "true",
            }]
        payment_method_overrides = [_compact({
            "payment_method_type": "PAY_BY_BANK",
            "enabled": True,
            "rules": rules,
        })]

    configuration = _compact({
        "allow_tip": params.get("allow_tip"),
        "theme": {"primary_color": params["theme_color"]} if params.get("theme_color") is not None else None,
        "payment_method_overrides": payment_method_overrides,
    })

    amount = None
    if params.get("shipping_cost") is not None:
        amount = {"breakdown": {"shipping": {"amount": {"currency_code": currency_code, "value": params["shipping_cost"]}}}}

    return _compact({
        "detail": _compact({
            "reference": params.get("reference"),
            "invoice_number": params.get("invoice_number"),
            "invoice_date": params.get("invoice_date"),
            "currency_code": currency_code,
            "note": params.get("note"),
        }),
        "invoicer": invoicer,
        "primary_recipients": params.get("primary_recipients", []),
        "items": params.get("items", []),
        "configuration": configuration,
        "amount": amount,
    })


def build_create_recurring_series_payload(params: dict) -> dict:
    """Re-nests the flat CreateRecurringSeriesParameters fields into PayPal's actual
    recurring-invoicing API request shape."""
    currency_code = params["currency_code"]

    invoicer = _compact({
        "business_name": params.get("invoicer_business_name"),
        "name": _compact({
            "given_name": params.get("invoicer_given_name"),
            "surname": params.get("invoicer_surname"),
        }),
        "address": _compact({
            "address_line_1": params.get("invoicer_address_line_1"),
            "address_line_2": params.get("invoicer_address_line_2"),
            "admin_area_2": params.get("invoicer_city"),
            "admin_area_1": params.get("invoicer_state"),
            "postal_code": params.get("invoicer_postal_code"),
            "country_code": params.get("invoicer_country_code"),
        }),
        "email_address": params.get("invoicer_email_address"),
        "tax_id": params.get("invoicer_tax_id"),
    })

    configuration = _compact({
        "allow_tip": params.get("allow_tip"),
    })

    amount = None
    if params.get("shipping_cost") is not None:
        amount = {"breakdown": {"shipping": {"amount": {"currency_code": currency_code, "value": params["shipping_cost"]}}}}

    return {
        "plan_detail": _compact({
            "frequency": {
                "interval_unit": params["interval_unit"],
                "interval_count": params["interval_count"],
            },
            "start_series_date": params.get("start_series_date"),
            "total_cycles": params.get("total_cycles"),
        }),
        "recurring_info": _compact({
            "detail": _compact({
                "reference": params.get("reference"),
                "currency_code": currency_code,
                "note": params.get("note"),
            }),
            "invoicer": invoicer,
            "primary_recipients": params.get("primary_recipients", []),
            "items": params.get("items"),
            "configuration": configuration,
            "amount": amount,
        }),
    }
