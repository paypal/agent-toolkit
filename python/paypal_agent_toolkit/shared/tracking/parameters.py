from pydantic import BaseModel, Field
from typing import Optional, Literal
from ..regex import ORDER_ID_REGEX, TRANSACTION_ID_REGEX

class CreateShipmentParameters(BaseModel):
    order_id: Optional[str] = Field(
        default=None,
        description="The ID of the order for which to create a shipment",
        pattern=ORDER_ID_REGEX
    )
    tracking_number: str = Field(
        ...,
        description="The tracking number for the shipment. Id is provided by the shipper. This is required to create a shipment."
    )
    transaction_id: str = Field(
        ...,
        description="The transaction ID associated with the shipment. Transaction id available after the order is paid or captured. This is required to create a shipment.",
        pattern=TRANSACTION_ID_REGEX
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
        description="The ID of the order for which to create a shipment.",
        pattern=ORDER_ID_REGEX
    )
    transaction_id: Optional[str] = Field(
        default=None,
        description="The transaction ID associated with the shipment tracking to retrieve.",
        pattern=TRANSACTION_ID_REGEX
    )

class UpdateShipmentTrackingParameters(BaseModel):
    transaction_id: str = Field(
        ...,
        description="The transaction ID associated with the shipment tracking to retrieve.",
        pattern=TRANSACTION_ID_REGEX
    )
    tracking_number: str = Field(
        ...,
        description="The tracking number that you want to update."

    )
    new_tracking_number: Optional[str] = Field(
        default=None,
        description="The new tracking number for the shipment if being updated."
    )
    status: str = Field(
        ...,
        description='The status of the item shipment. It can be "CANCELLED", "DELIVERED", "LOCAL_PICKUP", "ON_HOLD", or "SHIPPED".'
    )
    carrier: Optional[str] = Field(
        default=None,
        description="The carrier handling the shipment."
    )

