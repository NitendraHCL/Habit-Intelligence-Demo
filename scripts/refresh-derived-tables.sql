-- ============================================================================
-- Refresh Derived Tables — Run daily via cron
-- Usage: psql -h your-rds-host -d Analytics_DW -f refresh-derived-tables.sql
-- ============================================================================

BEGIN;

-- Refresh Monthly Consult Summary
TRUNCATE habit_intelligence.dv_monthly_consult_summary;
INSERT INTO habit_intelligence.dv_monthly_consult_summary
SELECT
  r.cug_code,
  DATE_TRUNC('month', a.slotdate) AS month,
  f.facility_name,
  s.speciality_name AS specialty,
  a.status,
  COUNT(*) AS total_consults,
  COUNT(DISTINCT a.uhid) AS unique_patients,
  SUM(CASE WHEN a.walkinpatient THEN 1 ELSE 0 END) AS walkins,
  SUM(CASE WHEN a.followupvisit != '0' THEN 1 ELSE 0 END) AS followups
FROM fact_kx.appointment a
JOIN fact_kx.registration_fact r ON a.uhid = r.uhid
LEFT JOIN fact_kx.facility_master f ON a.facility_id = f.facility_id
LEFT JOIN public.speciality s ON a.speciality_id = s.speciality_id
WHERE a.status IS NOT NULL
GROUP BY 1, 2, 3, 4, 5;

-- Refresh Daily Consult Summary
TRUNCATE habit_intelligence.dv_daily_consult_summary;
INSERT INTO habit_intelligence.dv_daily_consult_summary
SELECT
  r.cug_code,
  DATE_TRUNC('month', a.slotdate) AS month,
  EXTRACT(DOW FROM a.slotdate) AS day_of_week,
  EXTRACT(HOUR FROM a.slottime::time) AS hour_of_day,
  f.facility_name,
  COUNT(*) AS total_consults
FROM fact_kx.appointment a
JOIN fact_kx.registration_fact r ON a.uhid = r.uhid
LEFT JOIN fact_kx.facility_master f ON a.facility_id = f.facility_id
WHERE a.status = 'Completed' AND a.slottime IS NOT NULL
GROUP BY 1, 2, 3, 4, 5;

-- Refresh Demographic Consult
TRUNCATE habit_intelligence.dv_demographic_consult;
INSERT INTO habit_intelligence.dv_demographic_consult
SELECT
  r.cug_code,
  DATE_TRUNC('month', a.slotdate) AS month,
  r.patient_gender AS gender,
  CASE
    WHEN EXTRACT(YEAR FROM AGE(r."Date_of_birth")) BETWEEN 18 AND 25 THEN '18-25'
    WHEN EXTRACT(YEAR FROM AGE(r."Date_of_birth")) BETWEEN 26 AND 35 THEN '26-35'
    WHEN EXTRACT(YEAR FROM AGE(r."Date_of_birth")) BETWEEN 36 AND 44 THEN '36-44'
    WHEN EXTRACT(YEAR FROM AGE(r."Date_of_birth")) BETWEEN 45 AND 59 THEN '45-59'
    ELSE '60+'
  END AS age_group,
  f.facility_name,
  COUNT(*) AS total_consults,
  COUNT(DISTINCT a.uhid) AS unique_patients
FROM fact_kx.appointment a
JOIN fact_kx.registration_fact r ON a.uhid = r.uhid
LEFT JOIN fact_kx.facility_master f ON a.facility_id = f.facility_id
WHERE a.status = 'Completed'
GROUP BY 1, 2, 3, 4, 5;

-- Refresh Referral Summary
TRUNCATE habit_intelligence.dv_referral_summary;
INSERT INTO habit_intelligence.dv_referral_summary
SELECT
  r2.cug_code,
  DATE_TRUNC('month', ref.g_creation_time) AS month,
  ref.speciality_name AS referring_specialty,
  ref.referral_refer_speciality AS referred_to_specialty,
  ref.refer_status,
  COUNT(*) AS total_referrals,
  COUNT(DISTINCT ref.uhid) AS unique_patients
FROM fact_kx.referral ref
JOIN fact_kx.registration_fact r2 ON ref.uhid = r2.uhid
GROUP BY 1, 2, 3, 4, 5;

-- Refresh Diagnosis Summary
TRUNCATE habit_intelligence.dv_diagnosis_summary;
INSERT INTO habit_intelligence.dv_diagnosis_summary
SELECT
  r.cug_code,
  DATE_TRUNC('month', d.diagnosis_creation_time) AS month,
  d.diagnosis_text,
  d."conditionType" AS condition_type,
  d.treating_doctor_speciality AS specialty,
  COUNT(*) AS total_diagnoses,
  COUNT(DISTINCT d."uhId") AS unique_patients
FROM fact_kx.clinical_diagnosis d
JOIN fact_kx.registration_fact r ON d."uhId" = r.uhid
WHERE d.diagnosis_text IS NOT NULL
GROUP BY 1, 2, 3, 4, 5;

-- Refresh Vitals Summary
TRUNCATE habit_intelligence.dv_vitals_summary;
INSERT INTO habit_intelligence.dv_vitals_summary
SELECT
  r.cug_code,
  DATE_TRUNC('month', v.vitals_creation_time) AS month,
  v.vital_parameter_name,
  CASE
    WHEN v.vital_value < v.vital_reference_range_from THEN 'below_normal'
    WHEN v.vital_value > v.vital_reference_range_to THEN 'above_normal'
    ELSE 'within_normal'
  END AS range_category,
  COUNT(*) AS total_readings,
  AVG(v.vital_value) AS avg_value
FROM fact_kx.vitals v
JOIN fact_kx.registration_fact r ON v.uhid = r.uhid
WHERE v.vital_value IS NOT NULL
GROUP BY 1, 2, 3, 4;

-- Refresh Repeat Visit Analysis
TRUNCATE habit_intelligence.dv_repeat_visit_analysis;
INSERT INTO habit_intelligence.dv_repeat_visit_analysis
WITH monthly_visits AS (
  SELECT
    r.cug_code,
    DATE_TRUNC('month', a.slotdate) AS month,
    a.uhid,
    COUNT(*) AS visit_count
  FROM fact_kx.appointment a
  JOIN fact_kx.registration_fact r ON a.uhid = r.uhid
  WHERE a.status = 'Completed'
  GROUP BY 1, 2, 3
)
SELECT
  cug_code,
  month,
  COUNT(DISTINCT uhid) AS total_patients,
  COUNT(DISTINCT CASE WHEN visit_count > 1 THEN uhid END) AS repeat_patients
FROM monthly_visits
GROUP BY 1, 2;

COMMIT;

-- Log refresh timestamp
DO $$
BEGIN
  RAISE NOTICE 'Derived tables refreshed at %', NOW();
END $$;
