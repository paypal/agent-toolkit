
import logging
import json

def mask_bearer_token(token: str) -> str:
    if not token.startswith("Bearer "):
        return token
    raw = token[7:]  # remove "Bearer "
    if len(raw) <= 8:
        return "Bearer ****"
    return f"Bearer {raw[:4]}****{raw[-4:]}"


def logRequestPayload(payload, url, headers):
    logging.debug("PayPal POST %s", url)
    # Mask sensitive header before logging
    masked_headers = {
        **headers,
        "Authorization": mask_bearer_token(headers["Authorization"])
    }
    logging.debug("PayPal Request Headers:\n%s", json.dumps(masked_headers, indent=2))
    logging.debug("PayPal Request Payload:\n%s", json.dumps(payload, indent=2))     


def logResponsePayload(response, json_response):
    request_headers = dict(response.request.headers)
    masked_headers = {
        **request_headers,
        "Authorization": mask_bearer_token(request_headers["Authorization"])
    }
    logging.debug("PayPal Request Headers:\n%s", json.dumps(masked_headers, indent=2))
    logging.debug("PayPal Response Headers: %s", json.dumps(dict(response.headers), indent=2))
    logging.debug("PayPal Response Payload: %s", json.dumps(json_response, indent=2))
    