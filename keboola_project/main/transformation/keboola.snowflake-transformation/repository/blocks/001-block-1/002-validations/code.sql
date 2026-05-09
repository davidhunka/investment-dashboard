/* ref_attr_class_key column
   Daily counts of records with empty ref_attr_class_key */
create or replace table out_empty_ref_attr_class_key as
select event_date,
       count(*) as rows_with_empty_ref_attr_class_key,
from order_attribution_mkt
where ref_attr_class_key = ''
   OR ref_attr_class_key is NULL
group by event_date;

-- designated to fail if some values are found
create or replace table fail_check as
select IF(rows_with_empty_ref_attr_class_key >= 0, 1 / 0, rows_with_empty_ref_attr_class_key) AS fail_if_non_empty
from out_empty_ref_attr_class_key;

/* gclid column
   compute count of unique gclids for a day */
CREATE OR REPLACE TABLE out_daily_gclid_counts AS
select event_date, count(distinct gclid) as gclid_counts
from order_attribution_mkt
group by all;

-- First check if there is any record for yesterday
-- If not, then probably UE table was not updated

-- designated to fail no record for yesterday is in the unit_economics_hive_attribution_33_new table
create or replace table fail_check_exists as
select IF(count(*) = 0, 1 / 0, count(*)) AS fail_if_row_does_not_exist
from out_daily_gclid_counts
WHERE DATE(event_date) = DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY);

-- Second check if the gclid count is higher then threshold value for yesterday
-- If not, then gbl_order_attribution_validation_aug table was not updated

-- designated to fail if the number of dictinct gclids is lower then min_gclid_count_threshold
create or replace table fail_check_threshold as
select IF(gclid_counts < {{min_gclid_count_threshold}}, 1/0, gclid_counts) AS fail_if_below_threshold
from out_daily_gclid_counts
WHERE DATE(event_date) = DATE_ADD(CURRENT_DATE, INTERVAL -1 DAY);
