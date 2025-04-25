from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timedelta


def default_start_date() -> str:
    return (datetime.utcnow() - timedelta(days=31)).isoformat(timespec="seconds")


def default_end_date() -> str:
    return datetime.utcnow().isoformat(timespec="seconds")


class ListTransactionsParameters(BaseModel):
    transaction_id: Optional[str] = Field(
        default=None,
        description="The ID of the transaction to retrieve."
    )
    transaction_status: Optional[Literal["D", "P", "S", "V"]] = Field(
        default="S",
        description="Transaction status: D, P, S, or V"
    )
    start_date: Optional[str] = Field(
        default_factory=default_start_date,
        description="Filters the transactions in the response by a start date and time, in ISO8601 format. Seconds required; fractional seconds optional."
    )
    end_date: Optional[str] = Field(
        default_factory=default_end_date,
        description="Filters the transactions in the response by an end date and time, in ISO8601 format. Maximum range is 31 days."
    )
    search_months: Optional[int] = Field(
        default=12,
        description="Number of months to search back for a transaction by ID. Default is 12 months."
    )
    page_size: Optional[int] = Field(default=100)
    page: Optional[int] = Field(default=1)
