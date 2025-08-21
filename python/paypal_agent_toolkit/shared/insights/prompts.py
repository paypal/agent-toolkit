GET_MERCHANT_INSIGHTS_PROMPT = """
Use this tool to retrieve business intelligence metrics and analytics for a merchant, filtered by start date, end date, insight type, and time interval.

Parameters: 
-start_date (str, required): The start date range to filter insights
-end_date (str, required): The end date range to filter insights
-insight_type (str, required): The type of insight to retrieve
-time_interval (str, required): The time periods used for segmenting metrics data
"""