"""Offline order-result regressions.

Run from python/: python -B -m unittest discover -s tests -p 'test_order_results.py'
Only the real handlers and parameter models are imported; no API client is used.
"""

import json
import unittest
from unittest.mock import Mock

from paypal_agent_toolkit.shared.orders.tool_handlers import (
    capture_order,
    get_order_details,
)


ORDER_ID = "5O190127TN364715T"


class OrderResultTests(unittest.TestCase):
    def test_lookup_does_not_report_capture_for_order_states(self):
        for status in ("CREATED", "PAYER_ACTION_REQUIRED", "APPROVED", "VOIDED"):
            with self.subTest(status=status):
                response = {"id": ORDER_ID, "status": status, "purchase_units": [{}]}
                client = Mock(spec=["get", "post"])
                client.get.return_value = response

                result = json.loads(get_order_details(client, {"order_id": ORDER_ID}))

                self.assertNotIn("successfully captured", result["message"])
                self.assertEqual(result["status"], status)
                self.assertEqual(result["amount"], "N/A")
                self.assertEqual(result["raw"], response)
                client.get.assert_called_once_with(f"/v2/checkout/orders/{ORDER_ID}")
                client.post.assert_not_called()

    def test_lookup_of_authorized_order_does_not_report_capture(self):
        response = {
            "id": ORDER_ID,
            "intent": "AUTHORIZE",
            "status": "COMPLETED",
            "purchase_units": [{"payments": {"authorizations": [{
                "id": "SYNTHETIC_AUTHORIZATION",
                "status": "CREATED",
                "amount": {"currency_code": "USD", "value": "10.00"},
            }]}}],
        }
        client = Mock(spec=["get", "post"])
        client.get.return_value = response

        result = json.loads(get_order_details(client, {"order_id": ORDER_ID}))

        self.assertNotIn("successfully captured", result["message"])
        self.assertEqual(result["status"], "COMPLETED")
        self.assertEqual(result["amount"], "N/A")
        self.assertEqual(result["raw"], response)
        client.post.assert_not_called()

    def test_capture_response_does_not_report_pending_or_declined_as_success(self):
        for capture_status in ("PENDING", "DECLINED"):
            with self.subTest(capture_status=capture_status):
                response = self.capture_response(capture_status)
                client = Mock(spec=["get", "post"])
                client.post.return_value = response

                result = json.loads(capture_order(client, {"order_id": ORDER_ID}))

                self.assertNotIn("successfully captured", result["message"])
                self.assertEqual(result["status"], response["status"])
                self.assertEqual(result["amount"], "USD 10.00")
                self.assertEqual(result["raw"], response)
                client.post.assert_called_once_with(
                    uri=f"/v2/checkout/orders/{ORDER_ID}/capture", payload=None
                )
                client.get.assert_not_called()

    def test_completed_capture_preserves_result_fields(self):
        response = self.capture_response("COMPLETED")
        for handler in (get_order_details, capture_order):
            with self.subTest(handler=handler.__name__):
                client = Mock(spec=["get", "post"])
                client.get.return_value = client.post.return_value = response

                result = json.loads(handler(client, {"order_id": ORDER_ID}))

                self.assertEqual(set(result), {"message", "status", "amount", "raw"})
                self.assertIn(ORDER_ID, result["message"])
                self.assertEqual(result["status"], "COMPLETED")
                self.assertEqual(result["amount"], "USD 10.00")
                self.assertEqual(result["raw"], response)

    def test_missing_capture_details_do_not_imply_success(self):
        for handler in (get_order_details, capture_order):
            with self.subTest(handler=handler.__name__):
                response = {"id": ORDER_ID, "status": "APPROVED"}
                client = Mock(spec=["get", "post"])
                client.get.return_value = client.post.return_value = response

                result = json.loads(handler(client, {"order_id": ORDER_ID}))

                self.assertNotIn("successfully captured", result["message"])
                self.assertEqual(result["status"], "APPROVED")
                self.assertEqual(result["amount"], "N/A")
                self.assertEqual(result["raw"], response)

    @staticmethod
    def capture_response(capture_status):
        # Order-level completion alone is insufficient to describe capture state.
        return {
            "id": ORDER_ID,
            "status": "COMPLETED",
            "purchase_units": [{"payments": {"captures": [{
                "id": "SYNTHETIC_CAPTURE",
                "status": capture_status,
                "amount": {"currency_code": "USD", "value": "10.00"},
            }]}}],
        }
