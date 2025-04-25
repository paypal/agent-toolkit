from pydantic import BaseModel, Field
from typing import Optional, Literal


class CreateShipmentParameters(BaseModel):
    order_id: Optional[str] = Field(
        default=None,
        description="The ID of the order for which to create a shipment"
    )
    tracking_number: str = Field(
        ...,
        description="The tracking number for the shipment. Id is provided by the shipper. This is required to create a shipment."
    )
    transaction_id: str = Field(
        ...,
        description="The transaction ID associated with the shipment. Transaction id available after the order is paid or captured. This is required to create a shipment."
    )
    status: Optional[str] = Field(
        default="SHIPPED",
        description='The status of the shipment. It can be "ON_HOLD", "SHIPPED", "DELIVERED", or "CANCELLED".'
    )
    carrier: Optional[str] = Field(
        default=None,
        description="The carrier handling the shipment."
    )


class GetShipmentTrackingParameters(BaseModel):
    order_id: Optional[str] = Field(
        default=None,
        description="The ID of the order for which to create a shipment."
    )
    transaction_id: Optional[str] = Field(
        default=None,
        description="The transaction ID associated with the shipment tracking to retrieve."
    )
