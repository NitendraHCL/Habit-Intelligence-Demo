import { type NextRequest } from "next/server";

export function parseFilterParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const locations = searchParams.get("locations")?.split(",").filter(Boolean) || [];
  const genders = searchParams.get("genders")?.split(",").filter(Boolean) || [];
  const ageGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean) || [];
  const clientId = searchParams.get("clientId");

  return { dateFrom, dateTo, locations, genders, ageGroups, clientId };
}

export function buildConsultationWhere(params: ReturnType<typeof parseFilterParams>) {
  const where: Record<string, unknown> = {};

  if (params.dateFrom || params.dateTo) {
    where.appointmentDate = {};
    if (params.dateFrom) (where.appointmentDate as Record<string, unknown>).gte = new Date(params.dateFrom);
    if (params.dateTo) (where.appointmentDate as Record<string, unknown>).lte = new Date(params.dateTo);
  }
  if (params.locations.length) where.location = { in: params.locations };
  if (params.genders.length) where.gender = { in: params.genders.map(g => g.toUpperCase()) };
  if (params.ageGroups.length) where.ageGroup = { in: params.ageGroups };
  if (params.clientId) where.clientId = params.clientId;
  where.appointmentStatus = "Completed";

  return where;
}
