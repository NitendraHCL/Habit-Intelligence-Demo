import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSessionCugId } from "@/lib/auth/session";
import { dwQuery } from "@/lib/db/data-warehouse";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const cugId = await getSessionCugId(clientId ?? undefined);
    if (!cugId) {
      return NextResponse.json({
        genders: ["Male", "Female", "Others"],
        ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"],
        locations: [],
        specialties: [],
      });
    }

    // Both queries use appointment_report — has facility_id, speciality_name, etc.
    const [locationRows, specialtyRows] = await Promise.all([
      dwQuery<{ facility_name: string }>(
        `SELECT DISTINCT a.facility_name
         FROM fact_kx.appointment_report a
         LEFT JOIN fact_kx.cug_facility_mapping c ON a.facility_id = c.mapped_facility_id
         WHERE c.cug_id = $1
           AND a.facility_name IS NOT NULL
           AND TRIM(a.facility_name) != ''
         ORDER BY a.facility_name`,
        [cugId]
      ),

      // speciality_name is directly on appointment_report — no extra join
      dwQuery<{ speciality_name: string }>(
        `SELECT DISTINCT a.speciality_name
         FROM fact_kx.appointment_report a
         LEFT JOIN fact_kx.cug_facility_mapping c ON a.facility_id = c.mapped_facility_id
         WHERE c.cug_id = $1
           AND a.speciality_name IS NOT NULL
         ORDER BY a.speciality_name`,
        [cugId]
      ),
    ]);

    return NextResponse.json({
      genders: ["Male", "Female", "Others"],
      ageGroups: ["<20", "20-35", "36-40", "41-60", "61+"],
      locations: locationRows.map((r) => r.facility_name),
      specialties: specialtyRows.map((r) => r.speciality_name),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Filters API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
