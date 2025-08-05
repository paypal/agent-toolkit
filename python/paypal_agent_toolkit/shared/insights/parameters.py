from pydantic import BaseModel, Field
from typing import Optional, Literal

class GetMerchantInsightsParameters(BaseModel):
    start_date: str = Field(
        ..., 
        description="The start date range to filter insights"
    )
    end_date: str = Field(
        ...,
        description="The end date range to filter insights'"
    )
    insight_type: str = Field(
        ..., 
        description='The type of insight to retrieve. It can be "ORDERS" or "SALES"'
    )
    time_interval: str = Field(
        ...,
        description='The time periods used for segmenting metrics data. It can be "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", or "YEARLY"'
    )

