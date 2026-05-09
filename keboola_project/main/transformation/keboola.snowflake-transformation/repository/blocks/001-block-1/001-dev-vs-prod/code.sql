/* ===== BLOCK: Block 1 ===== */

/* ===== CODE: out_union_lower_granularity ===== */

CREATE OR REPLACE TABLE out_union_lower_granularity AS
SELECT DATE(date)                   AS date,
       country,
       'google_ads'                 AS source,
       account_id                   AS account_id,
       account_name,
       campaign_id,
       campaign_name,
       campaign_type,
       adgroup_id,
       adgroup_name,
       ad_id,
       ad_name,
       ad_type,
       keyword,
       keyword_match_type,
       local_currency,
       CAST(costs AS NUMERIC)       AS costs,
       CAST(impressions AS NUMERIC) AS impressions,
       CAST(clicks AS NUMERIC)      AS clicks
FROM ga_lower_granularity

UNION ALL

SELECT DATE(date)                           AS date,
       country,
       source,
       account_id                           AS account_id,
       account_name,
       campaign_id,
       campaign_name,
       NULL                                 AS campaign_type,
       adset_id                             AS adgroup_id,
       adset_name                           AS adgroup_name,
       ad_id,
       ad_name,
       NULL                                 AS ad_type,
       NULL                                 AS keyword,
       NULL                                 AS keyword_match_type,
       local_currency,
       CAST(cost_local_currency AS NUMERIC) AS costs,
       CAST(impressions AS NUMERIC)         AS impressions,
       CAST(clicks AS NUMERIC)              AS clicks
FROM fb_lower_granularity

UNION ALL

SELECT DATE(posting_date)                                                           AS date,
       country,
       'commission_junction'                                                        AS source,
       advertiser_id                                                                AS account_id,
       advertiser_name                                                              AS account_name,
       publisher_id                                                                 AS campaign_id,
       publisher_name                                                               AS campaign_name,
       STRING(NULL)                                                                 AS campaign_type,
       STRING(NULL)                                                                 AS adgroup_id,
       STRING(NULL)                                                                 AS adgroup_name,
       STRING(NULL)                                                                 AS ad_id,
       STRING(NULL)                                                                 AS ad_name,
       STRING(NULL)                                                                 AS ad_type,
       STRING(NULL)                                                                 AS keyword,
       STRING(NULL)                                                                 AS keyword_match_type,
    /* Selected costs columns "publisher_commission_usd" and "cj_fee_usd" are already in USD for all countries */
       'USD'                                                                        AS local_currency,
       SUM(CAST(publisher_commission_usd AS NUMERIC) + CAST(cj_fee_usd AS NUMERIC)) AS costs,
       NULL                                                                         AS impressions,
       NULL                                                                         AS clicks
FROM cj_lower_granularity
GROUP BY ALL
    UNION ALL

SELECT DATE(date)                   AS date,
       country,
       source,
       account_id,
       account_name,
       campaign_id,
       campaign_name,
       NULL                         AS campaign_type,
       adgroup_id,
       adgroup_name,
       NULL                         AS ad_id,
       NULL                         AS ad_name,
       NULL                         AS ad_type,
       NULL                         AS keyword,
       NULL                         AS keyword_match_type,
       local_currency,
       CAST(costs AS NUMERIC)       AS costs,
       CAST(impressions AS NUMERIC) AS impressions,
       CAST(clicks AS NUMERIC)      AS clicks
FROM bing_granular

UNION ALL

SELECT DATE(date)                    AS date,
       'US'                          AS country,
       'admarketplace'               AS source,
       NULL                          AS account_id,
       'admarketplace'               AS account_name,
       CAST(Campaign_ID AS STRING)   AS campaign_id,
       CAST(Campaign_Name AS STRING) AS campaign_name,
       NULL                          AS campaign_type,
       CAST(Ad_Group_ID AS STRING)   AS adgroup_id,
       CAST(Ad_Group_Name AS STRING) AS adgroup_name,
       NULL                          AS ad_id,
       NULL                          AS ad_name,
       NULL                          AS ad_type,
       NULL                          AS keyword,
       NULL                          AS keyword_match_type,
       'USD'                         AS local_currency,
       CASE
           WHEN SAFE_CAST(Spend AS NUMERIC) IS NOT NULL THEN SAFE_CAST(Spend AS NUMERIC)
           ELSE NULL
           -- or another suitable default value
           END                       AS costs,
       NULL                          AS impressions,
       -- GDP-1639 Impressions are no longer coming from source Admarketplace
       CASE
           WHEN SAFE_CAST(Clicks AS NUMERIC) IS NOT NULL THEN SAFE_CAST(Clicks AS NUMERIC)
           ELSE NULL
           -- or another suitable default value
           END                       AS clicks
-- admarketplace cost data
FROM marketing_report
WHERE DATE(date) < CURRENT_DATE

UNION ALL

SELECT DATE(FORMAT_DATE('%Y-%m-%d', PARSE_DATE('%m/%d/%Y', report_date)))    AS date,
       'US'                                                                  AS country,
       'mocha'                                                               AS source,
       NULL                                                                  AS account_id,
       'mocha'                                                               AS account_name,
       NULL                                                                  AS campaign_id,
       NULL                                                                  AS campaign_name,
       NULL                                                                  AS campaign_type,
       NULL                                                                  AS adgroup_id,
       NULL                                                                  AS adgroup_name,
       NULL                                                                  AS ad_id,
       NULL                                                                  AS ad_name,
       NULL                                                                  AS ad_type,
       NULL                                                                  AS keyword,
       NULL                                                                  AS keyword_match_type,
       'USD'                                                                 AS local_currency,
       CAST(NULLIF(REPLACE(REPLACE(cost, ',', ''), '$', ''), '') AS NUMERIC) AS costs,
       NULL                                                                  AS impressions,
       CASE
           WHEN SAFE_CAST(clicks AS NUMERIC) IS NOT NULL THEN SAFE_CAST(clicks AS NUMERIC)
           ELSE NULL
           END                                                               AS clicks
FROM Mocha_v1
WHERE DATE(FORMAT_DATE('%Y-%m-%d', PARSE_DATE('%m/%d/%Y', report_date))) < CURRENT_DATE
;

select date,
       country,
       source,
       account_id,
       account_name,
       campaign_id,
       campaign_name,
       campaign_type,
       adgroup_id,
       adgroup_name,
       ad_id,
       ad_name,
       ad_type,
       keyword,
       keyword_match_type,
       local_currency,
       costs,
       impressions,
       clicks
from WORKSPACE_641628.Partner_traffic_cost_data_input_in_c_tr_level_10_union_lower_granularity_union_lower_granularity
limit 100;

/* Data profiling of a column */
select *
from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
where extract(year from SAFE_CAST(date as date)) = extract(year from current_date)
limit 100;

/* Data profiling of a column */
select campaign_type,
       count(*)                                                as row_count,
       cast(count(*) * 100 / sum(count(*)) over () as numeric) as row_count_share
from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
where extract(year from SAFE_CAST(date as date)) = extract(year from current_date)
group by all
order by row_count desc
limit 100;

/* Data profiling of a column */
select ad_type,
       count(*)                                                as row_count,
       cast(count(*) * 100 / sum(count(*)) over () as numeric) as row_count_share
from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
where extract(year from SAFE_CAST(date as date)) = extract(year from current_date)
group by all
order by row_count desc
limit 100;

/* Data profiling of a column */
select keyword_match_type,
       count(*)                                                as row_count,
       cast(count(*) * 100 / sum(count(*)) over () as numeric) as row_count_share
from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
where extract(year from SAFE_CAST(date as date)) = extract(year from current_date)
group by all
order by row_count desc
limit 100;

/* Does case when safe_cast end produce same values as just a safe_cast? */
with _sloupce as (select CASE
                             WHEN SAFE_CAST(Spend AS NUMERIC) IS NOT NULL THEN SAFE_CAST(Spend AS NUMERIC)
                             ELSE NULL
                             END                      AS costs,
                         SAFE_CAST(Spend AS NUMERIC)  AS costs2,
                         CASE
                             WHEN SAFE_CAST(clicks AS NUMERIC) IS NOT NULL THEN SAFE_CAST(clicks AS NUMERIC)
                             ELSE NULL
                             END                      AS clicks,
                         SAFE_CAST(clicks AS NUMERIC) AS clicks2
                  FROM marketing_report)
select *
from _sloupce
where costs != costs2
   or clicks != clicks2;

/* Does the transformation return same results with safe_casts instead of safe_casts in CASE statements? */
(select nullif(safe_cast(date as string), '')               as date,
        nullif(safe_cast(country as string), '')            as country,
        nullif(safe_cast(source as string), '')             as source,
        nullif(safe_cast(account_id as string), '')         as account_id,
        nullif(safe_cast(account_name as string), '')       as account_name,
        nullif(safe_cast(campaign_id as string), '')        as campaign_id,
        nullif(safe_cast(campaign_name as string), '')      as campaign_name,
        nullif(safe_cast(campaign_type as string), '')      as campaign_type,
        nullif(safe_cast(adgroup_id as string), '')         as adgroup_id,
        nullif(safe_cast(adgroup_name as string), '')       as adgroup_name,
        nullif(safe_cast(ad_id as string), '')              as ad_id,
        nullif(safe_cast(ad_name as string), '')            as ad_name,
        nullif(safe_cast(ad_type as string), '')            as ad_type,
        nullif(safe_cast(keyword as string), '')            as keyword,
        nullif(safe_cast(keyword_match_type as string), '') as keyword_match_type,
        nullif(safe_cast(local_currency as string), '')     as local_currency,
        nullif(safe_cast(costs as string), '')              as costs,
        nullif(safe_cast(impressions as string), '')        as impressions,
        nullif(safe_cast(clicks as string), '')             as clicks
 from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
 where date = '2024-03-27'

 except
 distinct

 select nullif(safe_cast(date as string), '')               as date,
        nullif(safe_cast(country as string), '')            as country,
        nullif(safe_cast(source as string), '')             as source,
        nullif(safe_cast(account_id as string), '')         as account_id,
        nullif(safe_cast(account_name as string), '')       as account_name,
        nullif(safe_cast(campaign_id as string), '')        as campaign_id,
        nullif(safe_cast(campaign_name as string), '')      as campaign_name,
        nullif(safe_cast(campaign_type as string), '')      as campaign_type,
        nullif(safe_cast(adgroup_id as string), '')         as adgroup_id,
        nullif(safe_cast(adgroup_name as string), '')       as adgroup_name,
        nullif(safe_cast(ad_id as string), '')              as ad_id,
        nullif(safe_cast(ad_name as string), '')            as ad_name,
        nullif(safe_cast(ad_type as string), '')            as ad_type,
        nullif(safe_cast(keyword as string), '')            as keyword,
        nullif(safe_cast(keyword_match_type as string), '') as keyword_match_type,
        nullif(safe_cast(local_currency as string), '')     as local_currency,
        nullif(safe_cast(costs as string), '')              as costs,
        nullif(safe_cast(impressions as string), '')        as impressions,
        nullif(safe_cast(clicks as string), '')             as clicks
 from in_c_446_tr_level_10_union_lower_granularity.union_lower_granularity
 where date = '2024-03-27')

union all

(select nullif(safe_cast(date as string), '')               as date,
        nullif(safe_cast(country as string), '')            as country,
        nullif(safe_cast(source as string), '')             as source,
        nullif(safe_cast(account_id as string), '')         as account_id,
        nullif(safe_cast(account_name as string), '')       as account_name,
        nullif(safe_cast(campaign_id as string), '')        as campaign_id,
        nullif(safe_cast(campaign_name as string), '')      as campaign_name,
        nullif(safe_cast(campaign_type as string), '')      as campaign_type,
        nullif(safe_cast(adgroup_id as string), '')         as adgroup_id,
        nullif(safe_cast(adgroup_name as string), '')       as adgroup_name,
        nullif(safe_cast(ad_id as string), '')              as ad_id,
        nullif(safe_cast(ad_name as string), '')            as ad_name,
        nullif(safe_cast(ad_type as string), '')            as ad_type,
        nullif(safe_cast(keyword as string), '')            as keyword,
        nullif(safe_cast(keyword_match_type as string), '') as keyword_match_type,
        nullif(safe_cast(local_currency as string), '')     as local_currency,
        nullif(safe_cast(costs as string), '')              as costs,
        nullif(safe_cast(impressions as string), '')        as impressions,
        nullif(safe_cast(clicks as string), '')             as clicks
 from in_c_446_tr_level_10_union_lower_granularity.union_lower_granularity
 where date = '2024-03-27'

 except
 distinct

 select nullif(safe_cast(date as string), '')               as date,
        nullif(safe_cast(country as string), '')            as country,
        nullif(safe_cast(source as string), '')             as source,
        nullif(safe_cast(account_id as string), '')         as account_id,
        nullif(safe_cast(account_name as string), '')       as account_name,
        nullif(safe_cast(campaign_id as string), '')        as campaign_id,
        nullif(safe_cast(campaign_name as string), '')      as campaign_name,
        nullif(safe_cast(campaign_type as string), '')      as campaign_type,
        nullif(safe_cast(adgroup_id as string), '')         as adgroup_id,
        nullif(safe_cast(adgroup_name as string), '')       as adgroup_name,
        nullif(safe_cast(ad_id as string), '')              as ad_id,
        nullif(safe_cast(ad_name as string), '')            as ad_name,
        nullif(safe_cast(ad_type as string), '')            as ad_type,
        nullif(safe_cast(keyword as string), '')            as keyword,
        nullif(safe_cast(keyword_match_type as string), '') as keyword_match_type,
        nullif(safe_cast(local_currency as string), '')     as local_currency,
        nullif(safe_cast(costs as string), '')              as costs,
        nullif(safe_cast(impressions as string), '')        as impressions,
        nullif(safe_cast(clicks as string), '')             as clicks
 from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
 where date = '2024-03-27')
;

/* Let's see detail of rows with a difference */
select *
from (select 'prod'                                              as kbc_storage,
             nullif(safe_cast(date as string), '')               as date,
             nullif(safe_cast(country as string), '')            as country,
             nullif(safe_cast(source as string), '')             as source,
             nullif(safe_cast(account_id as string), '')         as account_id,
             nullif(safe_cast(account_name as string), '')       as account_name,
             nullif(safe_cast(campaign_id as string), '')        as campaign_id,
             nullif(safe_cast(campaign_name as string), '')      as campaign_name,
             nullif(safe_cast(campaign_type as string), '')      as campaign_type,
             nullif(safe_cast(adgroup_id as string), '')         as adgroup_id,
             nullif(safe_cast(adgroup_name as string), '')       as adgroup_name,
             nullif(safe_cast(ad_id as string), '')              as ad_id,
             nullif(safe_cast(ad_name as string), '')            as ad_name,
             nullif(safe_cast(ad_type as string), '')            as ad_type,
             nullif(safe_cast(keyword as string), '')            as keyword,
             nullif(safe_cast(keyword_match_type as string), '') as keyword_match_type,
             nullif(safe_cast(local_currency as string), '')     as local_currency,
             nullif(safe_cast(costs as string), '')              as costs,
             nullif(safe_cast(impressions as string), '')        as impressions,
             nullif(safe_cast(clicks as string), '')             as clicks
      from in_c_tr_level_10_union_lower_granularity.union_lower_granularity
      where date = '2024-03-27'
      union all
      select 'branch'                                            as kbc_storage,
             nullif(safe_cast(date as string), '')               as date,
             nullif(safe_cast(country as string), '')            as country,
             nullif(safe_cast(source as string), '')             as source,
             nullif(safe_cast(account_id as string), '')         as account_id,
             nullif(safe_cast(account_name as string), '')       as account_name,
             nullif(safe_cast(campaign_id as string), '')        as campaign_id,
             nullif(safe_cast(campaign_name as string), '')      as campaign_name,
             nullif(safe_cast(campaign_type as string), '')      as campaign_type,
             nullif(safe_cast(adgroup_id as string), '')         as adgroup_id,
             nullif(safe_cast(adgroup_name as string), '')       as adgroup_name,
             nullif(safe_cast(ad_id as string), '')              as ad_id,
             nullif(safe_cast(ad_name as string), '')            as ad_name,
             nullif(safe_cast(ad_type as string), '')            as ad_type,
             nullif(safe_cast(keyword as string), '')            as keyword,
             nullif(safe_cast(keyword_match_type as string), '') as keyword_match_type,
             nullif(safe_cast(local_currency as string), '')     as local_currency,
             nullif(safe_cast(costs as string), '')              as costs,
             nullif(safe_cast(impressions as string), '')        as impressions,
             nullif(safe_cast(clicks as string), '')             as clicks
      from in_c_446_tr_level_10_union_lower_granularity.union_lower_granularity
      where date = '2024-03-27')
where country = 'NL'
  and source = 'commission_junction'
  and account_id = '5987690'
  and campaign_id = '3592376'
--and adgroup_id = '123882699355'
--and ad_id = '537446060615'
;
