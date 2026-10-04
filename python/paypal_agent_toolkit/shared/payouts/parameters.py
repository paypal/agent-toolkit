from pydantic import BaseModel, Field, model_validator
from typing import List, Literal, Optional
from ..regex import POSITIVE_DECIMAL_STRING_REGEX, PAYOUT_BATCH_ID_REGEX, PAYOUT_ITEM_ID_REGEX


RecipientType = Literal["EMAIL", "PHONE", "PAYPAL_ID", "USER_HANDLE"]


class PayoutAmount(BaseModel):
    currency: str = Field(..., min_length=3, max_length=3, description="The three-character ISO-4217 currency code, for example USD.")
    value: str = Field(..., pattern=POSITIVE_DECIMAL_STRING_REGEX.pattern, description="The amount to pay the receiver, as a positive decimal string (e.g. '10.00'). Use whole numbers for currencies without decimals, such as JPY.")


class SenderBatchHeader(BaseModel):
    sender_batch_id: str = Field(..., min_length=1, max_length=256, description="A unique ID for this payout, used to track it in your own records. PayPal rejects a sender_batch_id that was already used in the last 30 days, which prevents the same payout from being sent twice.")
    recipient_type: Optional[RecipientType] = Field(None, description="The type of every receiver in the batch: EMAIL, PHONE, PAYPAL_ID, or USER_HANDLE (Venmo). If omitted, every item must set its own recipient_type.")
    email_subject: Optional[str] = Field(None, max_length=255, description="The subject line of the email PayPal sends to each recipient.")
    email_message: Optional[str] = Field(None, max_length=1000, description="The message of the email PayPal sends to each recipient.")
    note: Optional[str] = Field(None, max_length=1000, description="A note for the payout. It is combined with each item note in the notification email.")


class PayoutItem(BaseModel):
    recipient_type: Optional[RecipientType] = Field(None, description="The type of receiver for this item: EMAIL, PHONE, PAYPAL_ID, or USER_HANDLE (Venmo). Overrides the recipient_type in sender_batch_header.")
    receiver: str = Field(..., min_length=1, max_length=127, description="The receiver of the payment, matching recipient_type: an email address, a phone number, a PayPal account ID, or a Venmo user handle.")
    amount: PayoutAmount = Field(..., description="The currency and amount to pay the receiver.")
    note: Optional[str] = Field(None, max_length=4000, description="A note to the recipient about this payment. Required for Venmo recipients.")
    sender_item_id: Optional[str] = Field(None, max_length=63, description="Your own ID for this item, used to track it in your records.")
    recipient_wallet: Optional[Literal["PAYPAL", "VENMO"]] = Field(None, description="The wallet that receives the payout. Defaults to PAYPAL. VENMO is available for US recipients only.")
    purpose: Optional[Literal["AWARDS", "PRIZES", "DONATIONS", "GOODS", "SERVICES", "REBATES", "CASHBACK", "DISCOUNTS", "NON_GOODS_OR_SERVICES"]] = Field(None, description="The purpose of the payment.")


class CreatePayoutBatchParameters(BaseModel):
    sender_batch_header: SenderBatchHeader = Field(..., description="The sender-provided header for the payout.")
    items: List[PayoutItem] = Field(..., min_length=1, max_length=15000, description="The payout items, one for each recipient.")

    @model_validator(mode="after")
    def _check_recipient_type(self):
        if self.sender_batch_header.recipient_type is None and any(item.recipient_type is None for item in self.items):
            raise ValueError("recipient_type must be set on sender_batch_header or on every item.")
        return self


class GetPayoutBatchParameters(BaseModel):
    payout_batch_id: str = Field(..., description="The ID of the payout batch to retrieve, returned as batch_header.payout_batch_id by create_payout_batch.", pattern=PAYOUT_BATCH_ID_REGEX.pattern)
    page: int = Field(1, ge=1, le=1000, description="The page number of the payout items to fetch.")
    page_size: int = Field(100, ge=1, le=1000, description="The number of payout items to return per page (maximum 1000).")
    total_required: bool = Field(True, description="Indicates whether the response should include the total count of items and pages.")


class GetPayoutItemParameters(BaseModel):
    payout_item_id: str = Field(..., description="The ID of the payout item to retrieve.", pattern=PAYOUT_ITEM_ID_REGEX.pattern)


class CancelUnclaimedPayoutItemParameters(BaseModel):
    payout_item_id: str = Field(..., description="The ID of the UNCLAIMED payout item to cancel.", pattern=PAYOUT_ITEM_ID_REGEX.pattern)
