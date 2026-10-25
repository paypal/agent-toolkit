"""Offline regressions for transaction-ID search; no HTTP client is imported.

Run from python/: python -B -m unittest discover -s tests -p 'test_transaction_search.py'
"""

import json
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from pydantic import ValidationError

from paypal_agent_toolkit.shared.transactions.tool_handlers import list_transactions


TRANSACTION_ID = "9XY12345AB678901C"
NOW = datetime(2026, 10, 25, 12, 0, 0)


class RecordingClient:
    """Match PayPalClient.get(uri), including its decoded-dictionary return."""

    def __init__(self, *responses):
        self.responses = iter(responses)
        self.uris = []

    def get(self, uri):
        self.uris.append(uri)
        response = next(self.responses)
        if isinstance(response, Exception):
            raise response
        return response


class TransactionSearchTests(unittest.TestCase):
    def setUp(self):
        clock = patch(
            "paypal_agent_toolkit.shared.transactions.tool_handlers.datetime",
            wraps=datetime,
        )
        self.clock = clock.start()
        self.clock.utcnow.return_value = NOW
        self.addCleanup(clock.stop)

    def test_matching_decoded_response_is_returned_as_json(self):
        match = {"transaction_info": {"transaction_id": TRANSACTION_ID}}
        other = {"transaction_info": {"transaction_id": "1AB23456CD789012E"}}
        client = RecordingClient({"transaction_details": [other, match]})

        result = json.loads(list_transactions(client, {
            "transaction_id": TRANSACTION_ID,
            "search_months": 2,
            "transaction_status": "P",
            "page_size": 20,
            "page": 2,
        }))

        self.assertEqual(result, {
            "found": True, "transaction_details": [match], "total_items": 1,
        })
        self.assertEqual(len(client.uris), 1)
        url = urlparse(client.uris[0])
        self.assertEqual(url.path, "/v1/reporting/transactions")
        query = parse_qs(url.query)
        self.assertEqual(query["transaction_id"], [TRANSACTION_ID])
        self.assertEqual(query["transaction_status"], ["P"])
        self.assertEqual(query["page_size"], ["20"])
        self.assertEqual(query["page"], ["2"])
        self.assertNotIn("search_months", query)
        self.assert_window(query, NOW - timedelta(days=31), NOW)

    def test_empty_window_advances_before_finding_a_match(self):
        match = {"transaction_info": {"transaction_id": TRANSACTION_ID}}
        client = RecordingClient(
            {"transaction_details": []}, {"transaction_details": [match]},
        )

        result = json.loads(list_transactions(client, {
            "transaction_id": TRANSACTION_ID, "search_months": 3,
        }))

        self.assertTrue(result["found"])
        self.assertEqual(len(client.uris), 2)
        for index, uri in enumerate(client.uris):
            end = NOW - timedelta(days=31 * index)
            self.assert_window(parse_qs(urlparse(uri).query), end - timedelta(days=31), end)

    def test_successful_empty_search_returns_json_with_reporting_caveat(self):
        client = RecordingClient({"transaction_details": []}, {"transaction_details": []})

        result = json.loads(list_transactions(client, {
            "transaction_id": TRANSACTION_ID, "search_months": 2,
        }))

        self.assertFalse(result["found"])
        self.assertEqual(result["transaction_details"], [])
        self.assertEqual(result["total_items"], 0)
        self.assertIn(TRANSACTION_ID, result["message"])
        self.assertIn("reporting", result["message"].lower())
        self.assertEqual(len(client.uris), 2)

    def test_query_errors_propagate_instead_of_becoming_not_found(self):
        for error in (TimeoutError("synthetic timeout"), RuntimeError("synthetic HTTP 403")):
            with self.subTest(error=type(error).__name__):
                client = RecordingClient(error)

                with self.assertRaises(type(error)) as caught:
                    list_transactions(client, {
                        "transaction_id": TRANSACTION_ID, "search_months": 2,
                    })

                self.assertIs(caught.exception, error)
                self.assertEqual(len(client.uris), 1)

    def test_error_after_an_empty_window_does_not_report_absence(self):
        error = TimeoutError("synthetic timeout in second window")
        client = RecordingClient({"transaction_details": []}, error)

        with self.assertRaises(TimeoutError) as caught:
            list_transactions(client, {
                "transaction_id": TRANSACTION_ID, "search_months": 3,
            })

        self.assertIs(caught.exception, error)
        self.assertEqual(len(client.uris), 2)

    def test_optional_none_values_are_omitted_from_the_search_query(self):
        client = RecordingClient({"transaction_details": []})

        list_transactions(client, {
            "transaction_id": TRANSACTION_ID,
            "search_months": 1,
            "transaction_status": None,
            "page_size": None,
            "page": None,
        })

        query = parse_qs(urlparse(client.uris[0]).query)
        self.assertEqual(set(query), {"transaction_id", "start_date", "end_date"})

    def test_nonpositive_search_months_are_rejected_before_querying(self):
        for search_months in (0, -1):
            with self.subTest(search_months=search_months):
                client = RecordingClient()

                with self.assertRaises(ValidationError):
                    list_transactions(client, {
                        "transaction_id": TRANSACTION_ID, "search_months": search_months,
                    })

                self.assertEqual(client.uris, [])

    def test_listing_with_explicit_dates_still_returns_the_decoded_response(self):
        response = {"transaction_details": [], "total_items": 0, "page": 1}
        client = RecordingClient(response)

        result = json.loads(list_transactions(client, {
            "start_date": "2026-10-01T00:00:00Z",
            "end_date": "2026-10-02T00:00:00Z",
        }))

        self.assertEqual(result, response)
        self.assertEqual(len(client.uris), 1)

    def assert_window(self, query, start, end):
        for key, expected in (("start_date", start), ("end_date", end)):
            value = query[key][0]
            self.assertTrue(value.endswith("Z"))
            self.assertEqual(datetime.fromisoformat(value[:-1]), expected)
