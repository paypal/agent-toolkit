import json
from typing import Optional
import requests

from ..shared.telemetry import Telemetry

from .logger_util import logRequestPayload, logResponsePayload
from .constants import *
from .configuration import Context
import logging


class PayPalClient:
    def __init__(self, client_id, secret, context: Optional[Context]):
        self.client_id = client_id
        self.secret = secret
        self.context = context
        self.sandbox = context.sandbox
        self.base_url = SANDBOX_BASE_URL if self.sandbox  else LIVE_BASE_URL
    


    def log_request_exception(self, e: requests.exceptions.RequestException, url: Optional[str] = None):
        response = getattr(e, 'response', None)
        if response is not None:
            try:
                logging.error("PayPal Error Response: %s", json.dumps(response.json(), indent=2))
            except ValueError:
                logging.error("PayPal Error Response: Not valid JSON")
            logging.error("Response Headers: %s", json.dumps(dict(response.headers), indent=2))
        if url:
            logging.error("Request to %s failed: %s", url, str(e))
        else:
            logging.error("HTTP request failed: %s", str(e))


    def build_headers(self):
        headers = {
                "Authorization": f"Bearer {self.get_access_token()}",
                "Content-Type": "application/json",
                "User-Agent" : Telemetry.generate_user_agent(source=self.context.source)
            }
        return headers

    def get_access_token(self):
        token_url = f"{self.base_url}/v1/oauth2/token"
        try:
            response = requests.post(
                token_url,
                headers={"Accept": "application/json"},
                data={"grant_type": "client_credentials"},
                auth=(self.client_id, self.secret)
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.log_request_exception(e, token_url)
            raise RuntimeError("Failed to obtain access token from PayPal") from e
        
        
        logging.debug("PayPal Response Headers: %s", json.dumps(dict(response.headers), indent=2))

        token_data = response.json()
        if "access_token" not in token_data:
            raise ValueError("Access token not found in PayPal response")

        return token_data["access_token"]


    def post(self, uri, payload):
       
        url = f"{self.base_url}{uri}"
        headers = self.build_headers()
        logRequestPayload(payload, url, headers)

        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.log_request_exception(e, url)
            raise

        if response.status_code == 204:
            logging.debug("Response Status: 204 No Content")
            return {}
        
        try:
            json_response = response.json()
        except ValueError:
            logging.warning("Response body is not valid JSON or empty, Headers: %s", json.dumps(dict(response.headers), indent=2))
            return {}

        logResponsePayload(response, json_response)

        return json_response



    def get(self, uri):

        url = f"{self.base_url}{uri}"
        headers = self.build_headers()
        
        logRequestPayload( None, url, headers)

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.log_request_exception(e, url)
            logging.error("HTTP request failed: %s", str(e))
            raise

        try:
            json_response = response.json()
        except ValueError:
            logging.warning("Response body is not valid JSON or empty")
            return {}

        logResponsePayload(response, json_response)

        return json_response



    
    
