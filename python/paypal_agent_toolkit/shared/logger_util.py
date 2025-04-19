
import logging
import json

def mask_bearer_token(token: str) -> str:
    if not token.startswith("Bearer "):
        return token
    raw = token[7:]  # remove "Bearer "
    if len(raw) <= 8:
        return "Bearer ****"
    return f"Bearer {raw[:4]}****{raw[-4:]}"


def logRequestPayload(debug, payload, url, headers):
    logging.debug("POST %s", url)
    if debug:
        # Mask sensitive header before logging
        masked_headers = {
            **headers,
            "Authorization": mask_bearer_token(headers["Authorization"])
        }
        logging.debug("Request Headers:\n%s", json.dumps(masked_headers, indent=2))
    logging.debug("Request Payload:\n%s", json.dumps(payload, indent=2))     


def configure_logging(debug: bool):
    logging.basicConfig(
        level=logging.DEBUG if debug else logging.ERROR,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )