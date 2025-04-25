
from urllib.parse import urlencode
from .parameters import *
import json
from typing import Union, Dict, Any



def list_disputes(client, params: dict):
    
    validated = ListDisputesParameters(**params)
    query_string = urlencode(validated.dict(exclude_none=True))
    uri = f"/v1/customer/disputes?{query_string}"

    response = client.get(uri=uri)
    return json.dumps(response) 


def get_dispute(client, params: dict):
    validated = GetDisputeParameters(**params)
    uri = f"/v1/customer/disputes/{validated.dispute_id}"

    response = client.get(uri=uri)
    return json.dumps(response) 


def accept_dispute_claim(client, params: dict):
    validated = AcceptDisputeClaimParameters(**params)
    uri = f"/v1/customer/disputes/{validated.dispute_id}/accept-claim"

    response = client.post(uri=uri, payload={"note": validated.note})
    return json.dumps(response) 


