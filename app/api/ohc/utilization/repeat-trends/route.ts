import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSessionCugId } from "@/lib/auth/session";
import { dwQuery } from "@/lib/db/data-warehouse";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const locations = searchParams.get("locations")?.split(",").filter(Boolean);
    const genders = searchParams.get("genders")?.split(",").filter(Boolean);
    const ageGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean);
    const specialties = searchParams.get("specialties")?.split(",").filter(Boolean);
    const view = searchParams.get("view") || "monthly";

    const cugId = await getSessionCugId(clientId ?? undefined);
    if (!cugId) {
      return NextResponse.json({ error: "No client selected" }, { status: 400 });
    }

    // ── Build query parts ──
    const joins: string[] = [
      "LEFT JOIN fact_kx.cug_facility_mapping c ON a.facility_id = c.mapped_facility_id",
    ];
    const conditions: string[] = [
      `c.cug_id = $1`,
      `a.stage IN ('Completed', 'Prescription Sent', 'Re open')`,
    ];
    const params: unknown[] = [cugId];
    let idx = 2;

    if (dateFrom) {
      conditions.push(`a.slotdate >= $${idx}::date`);
      params.push(dateFrom);
      idx++;
    }
    if (dateTo) {
      conditions.push(`a.slotdate <= $${idx}::date`);
      params.push(dateTo);
      idx++;
    }
    if (locations?.length) {
      conditions.push(`a.facility_name = ANY($${idx})`);
      params.push(locations);
      idx++;
    }
    if (specialties?.length) {
      conditions.push(`a.speciality_name = ANY($${idx})`);
      params.push(specialties);
      idx++;
    }
    if (genders?.length || ageGroups?.length) {
      const regConds: string[] = [];
      if (genders?.length) {
        const gc = genders.map((g) => {
          const l = g.toLowerCase();
          if (l === "male") return "LOWER(TRIM(r.patient_gender)) IN ('male', 'm')";
          if (l === "female") return "LOWER(TRIM(r.patient_gender)) IN ('female', 'f')";
          return "(LOWER(TRIM(r.patient_gender)) NOT IN ('male', 'm', 'female', 'f') OR r.patient_gender IS NULL OR TRIM(r.patient_gender) = '')";
        });
        regConds.push(`(${gc.join(" OR ")})`);
      }
      if (ageGroups?.length) {
        const ae = `CAST(NULLIF(REGEXP_REPLACE(r.patient_age, '[^0-9].*', '', 'g'), '') AS INTEGER)`;
        const ac = ageGroups.map((ag) => {
          switch (ag) {
            case "<20": return `${ae} < 20`;
            case "20-35": return `${ae} BETWEEN 20 AND 35`;
            case "36-40": return `${ae} BETWEEN 36 AND 40`;
            case "41-60": return `${ae} BETWEEN 41 AND 60`;
            case "61+": return `${ae} > 60`;
            default: return "FALSE";
          }
        });
        regConds.push(`(${ac.join(" OR ")})`);
      }
      conditions.push(`a.uhid IN (SELECT r.uhid FROM fact_kx.registration_fact r WHERE ${regConds.join(" AND ")})`);
    }

    const joinClause = joins.join("\n    ");
    const whereClause = conditions.join(" AND ");

    // Aliased versions for the repeat-uhid subquery
    const joinClause2 = joinClause
      .replace(/\ba\b/g, "a2").replace(/\bc\b/g, "c2")
      .replace(/\bf\b/g, "f2").replace(/\bar\b/g, "ar2");
    const whereClause2 = whereClause
      .replace(/\ba\./g, "a2.").replace(/\bc\./g, "c2.")
      .replace(/\bf\./g, "f2.").replace(/\bar\./g, "ar2.");

    // ── Period expression ──
    let periodExpr: string;
    let periodFormat: string;
    switch (view) {
      case "weekly":
        periodExpr = "DATE_TRUNC('week', a.slotdate)";
        periodFormat = `TO_CHAR(DATE_TRUNC('week', a.slotdate), 'YYYY-"W"IW')`;
        break;
      case "yearly":
        periodExpr = "DATE_TRUNC('year', a.slotdate)";
        periodFormat = `TO_CHAR(DATE_TRUNC('year', a.slotdate), 'YYYY')`;
        break;
      default:
        periodExpr = "DATE_TRUNC('month', a.slotdate)";
        periodFormat = `TO_CHAR(DATE_TRUNC('month', a.slotdate), 'YYYY-MM')`;
        break;
    }

    const rows = await dwQuery<{
      label: string;
      repeat_visits: string;
      repeat_patients: string;
    }>(
      `SELECT
        ${periodFormat} AS label,
        COUNT(*) AS repeat_visits,
        COUNT(DISTINCT a.uhid) AS repeat_patients
      FROM fact_kx.appointment_report a
      INNER JOIN (
        SELECT a2.uhid
        FROM fact_kx.appointment_report a2
        ${joinClause2}
        WHERE ${whereClause2}
        GROUP BY a2.uhid
        HAVING COUNT(*) > 1
      ) rpt ON a.uhid = rpt.uhid
      ${joinClause}
      WHERE ${whereClause}
      GROUP BY ${periodExpr}
      ORDER BY ${periodExpr}`,
      params
    );

    const data = rows.map((r) => ({
      label: r.label,
      repeatVisits: Number(r.repeat_visits),
      repeatPatients: Number(r.repeat_patients),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Repeat trends API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
