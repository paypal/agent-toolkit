import json
from typing import Optional
import requests

from .logger_util import configure_logging, logRequestPayload
from .constants import *
from .configuration import Context
import logging


class PayPalClient:
    def __init__(self, client_id, secret, context: Optional[Context]):
        self.client_id = client_id
        self.secret = secret
        self.sandbox = context.sandbox
        self.debug = context.debug
        self.base_url = SANDBOX_BASE_URL if self.sandbox  else LIVE_BASE_URL
        configure_logging(self.debug)


    def get_access_token(self):
        response = requests.post(
            f"{self.base_url}/v1/oauth2/token",
            headers={"Accept": "application/json"},
            data={"grant_type": "client_credentials"},
            auth=(self.client_id, self.secret)
        )
        response.raise_for_status()
        return response.json()["access_token"]


    def post(self, uri, payload):
       
        url = f"{self.base_url}{uri}"
        headers = {
                "Authorization": f"Bearer {self.get_access_token()}",
                "Content-Type": "application/json"
            }
        logRequestPayload(self.debug, payload, url, headers)

        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error("HTTP request failed: %s", str(e))
            raise

        if response.status_code == 204:
            logging.debug("Response Status: 204 No Content")
            return {}
        
        try:
            json_response = response.json()
        except ValueError:
            logging.warning("Response body is not valid JSON or empty")
            return {}

        if self.debug:
            logging.debug("Response Payload: %s", json.dumps(json_response, indent=2))

        return json_response
    

    def get(self, uri):

        url = f"{self.base_url}{uri}"
        headers = {
                "Authorization": f"Bearer {self.get_access_token()}",
                "Content-Type": "application/json"
            }
        
        logRequestPayload(self.debug, None, url, headers)

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error("HTTP request failed: %s", str(e))
            raise

        try:
            json_response = response.json()
        except ValueError:
            logging.warning("Response body is not valid JSON or empty")
            return {}

        if self.debug:
            logging.debug("Response Payload: %s", json.dumps(json_response, indent=2))

        return json_response



    
    
