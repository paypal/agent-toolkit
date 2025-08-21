from .parameters import *
import json

def get_merchant_insights(client, params: dict):
    validated = GetMerchantInsightsParameters(**params)
    merchant_uri = f"/v1/merchant/insights?start_date={validated.start_date}&end_date={validated.end_date}&insight_type={validated.insight_type}&time_interval={validated.time_interval}"
    result = client.get(uri = merchant_uri)
    return json.dumps(result)