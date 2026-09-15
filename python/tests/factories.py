def minimal_invoice_item(**overrides):
    item = {
        "name": "Widget",
        "quantity": "1",
        "unit_amount": {"currency_code": "USD", "value": "10.00"},
    }
    item.update(overrides)
    return item


def minimal_primary_recipient(**overrides):
    recipient = {}
    recipient.update(overrides)
    return recipient


def minimal_create_invoice_params(**overrides):
    params = {
        "currency_code": "USD",
        "primary_recipients": [minimal_primary_recipient()],
        "items": [minimal_invoice_item()],
    }
    params.update(overrides)
    return params


def minimal_create_recurring_series_params(**overrides):
    params = {
        "interval_unit": "MONTH",
        "interval_count": 1,
        "start_series_date": "2024-01-01",
        "currency_code": "USD",
        "primary_recipients": [minimal_primary_recipient()],
    }
    params.update(overrides)
    return params
