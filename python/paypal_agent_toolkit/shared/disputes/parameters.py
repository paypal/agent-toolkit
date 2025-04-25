from pydantic import BaseModel, Field
from typing import Optional, Literal

# === Disputes Parameters ===

class ListDisputesParameters(BaseModel):
    disputed_transaction_id: Optional[str] = None
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
    dispute_id: str = Field(..., description="The order id generated during create call")


class AcceptDisputeClaimParameters(BaseModel):
    dispute_id: str
    note: str = Field(..., description="A note about why the seller is accepting the claim")
