from pydantic import BaseModel, Field
from typing import Optional, Literal
from ..regex import DISPUTE_ID_REGEX, TRANSACTION_ID_REGEX
# === Disputes Parameters ===

class ListDisputesParameters(BaseModel):
    disputed_transaction_id: Optional[str] = Field(None, description="Filters the disputes in the response by a transaction, by ID.", pattern=TRANSACTION_ID_REGEX)
    dispute_state: Optional[
        Literal[
            "REQUIRED_ACTION",
            "REQUIRED_OTHER_PARTY_ACTION",
            "UNDER_PAYPAL_REVIEW",
            "RESOLVED",
            "OPEN_INQUIRIES",
            "APPEALABLE"
        ]
    ] = Field(default=None, description="OPEN_INQUIRIES")
    page_size: Optional[int] = Field(default=10)


class GetDisputeParameters(BaseModel):
    dispute_id: str = Field(..., description="The order id generated during create call", pattern=DISPUTE_ID_REGEX)


class AcceptDisputeClaimParameters(BaseModel):
    dispute_id: str  = Field(..., description="The PayPal dispute ID.", pattern=DISPUTE_ID_REGEX)
    note: str = Field(..., description="A note about why the seller is accepting the claim")
