CREATE OR REPLACE TABLE "Monthly_Event_Summary" AS
SELECT 
  DATE_TRUNC('month', "events"."start_date") AS "Event_Month",
  COUNT("events"."id") AS "Event_Count"
FROM 
  "events"
GROUP BY 
  "Event_Month"
ORDER BY 
  "Event_Month";
