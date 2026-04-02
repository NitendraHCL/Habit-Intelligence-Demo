/**
 * Build WHERE clauses for direct fact_kx queries.
 *
 * Assumes these table aliases in the query:
 *   r = fact_kx.registration_fact
 *   a = fact_kx.appointment (or whichever fact table uses slotdate)
 *   f = fact_kx.facility_master
 *
 * Gender and age_group are applied on registration_fact.
 * Date range is applied on the fact table's date column (configurable).
 */

export interface FactKxFilterParams {
  cugCode: string;
  dateFrom?: string;
  dateTo?: string;
  locations?: string[];    // facility names
  genders?: string[];      // ["Male", "Female", "Other"]
  ageGroups?: string[];    // ["<20", "20-35", "36-40", "41-60", "61+"]
  specialties?: string[];
  dateColumn?: string;     // default: "a.slotdate"
}

interface FilterResult {
  where: string;
  params: unknown[];
}

export function buildFactKxFilters(opts: FactKxFilterParams): FilterResult {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  const dateCol = opts.dateColumn || "a.slotdate";

  // Always filter by cug_code
  conditions.push(`r.cug_code = $${idx}`);
  params.push(opts.cugCode);
  idx++;

  // Date range on the fact table's date column
  if (opts.dateFrom) {
    conditions.push(`${dateCol} >= $${idx}::date`);
    params.push(opts.dateFrom);
    idx++;
  }
  if (opts.dateTo) {
    conditions.push(`${dateCol} <= $${idx}::date`);
    params.push(opts.dateTo);
    idx++;
  }

  // Location = mapped_facility_name from cug_facility_mapping
  // The query must join: facility_master f, and we match f.facility_name
  // against the mapped names from cug_facility_mapping
  if (opts.locations?.length) {
    conditions.push(`f.facility_name = ANY($${idx})`);
    params.push(opts.locations);
    idx++;
  }

  // Specialty — from appointment_temp joined via speciality_id on appointment table
  // Assumes alias at = fact_kx.appointment_temp in the query
  if (opts.specialties?.length) {
    conditions.push(`at.speciality_name = ANY($${idx})`);
    params.push(opts.specialties);
    idx++;
  }

  // Gender — map all spelling variants:
  // Male: "Male", "male", "m", "M"
  // Female: "Female", "female", "f", "F"
  // Others: "Other", "Others", "Transgender Male", "Transgender Female", null, ""
  if (opts.genders?.length) {
    const genderConditions = opts.genders.map((g) => {
      const lower = g.toLowerCase();
      if (lower === "male") return "LOWER(TRIM(r.patient_gender)) IN ('male', 'm')";
      if (lower === "female") return "LOWER(TRIM(r.patient_gender)) IN ('female', 'f')";
      // "Others" = everything that's not clearly male or female
      return "(LOWER(TRIM(r.patient_gender)) NOT IN ('male', 'm', 'female', 'f') OR r.patient_gender IS NULL OR TRIM(r.patient_gender) = '')";
    });
    conditions.push(`(${genderConditions.join(" OR ")})`);
  }

  // Age group — parse from patient_age text format ("35 Y", "35 Y, 06 M")
  if (opts.ageGroups?.length) {
    const ageExpr = `CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER)`;
    const ageConds = opts.ageGroups.map((ag) => {
      switch (ag) {
        case "<20": return `${ageExpr} < 20`;
        case "20-35": return `${ageExpr} BETWEEN 20 AND 35`;
        case "36-40": return `${ageExpr} BETWEEN 36 AND 40`;
        case "41-60": return `${ageExpr} BETWEEN 41 AND 60`;
        case "61+": return `${ageExpr} > 60`;
        default: return "FALSE";
      }
    });
    conditions.push(`(${ageConds.join(" OR ")})`);
  }

  return {
    where: conditions.length > 0 ? conditions.join(" AND ") : "1=1",
    params,
  };
}

/**
 * SQL expression to bucket patient_age text into age groups.
 * Use in SELECT clause for grouping by age.
 */
export const AGE_GROUP_EXPR = `
  CASE
    WHEN CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER) < 20 THEN '<20'
    WHEN CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER) BETWEEN 20 AND 35 THEN '20-35'
    WHEN CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER) BETWEEN 36 AND 40 THEN '36-40'
    WHEN CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER) BETWEEN 41 AND 60 THEN '41-60'
    WHEN CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER) > 60 THEN '61+'
    ELSE 'Unknown'
  END
`.trim();

/**
 * SQL expression to normalize gender for display.
 */
export const GENDER_EXPR = `
  CASE
    WHEN LOWER(TRIM(r.patient_gender)) IN ('male', 'm') THEN 'Male'
    WHEN LOWER(TRIM(r.patient_gender)) IN ('female', 'f') THEN 'Female'
    ELSE 'Others'
  END
`.trim();
