import { NextResponse } from "next/server";
import { CLIENTS, ASSIGNED_CLIENTS } from "@/lib/dummy-data";

export async function GET() {
  return NextResponse.json({
    user: {
      id: "dummy-super-admin-001",
      email: "admin@habithealth.com",
      name: "Demo Admin",
      role: "SUPER_ADMIN",
      clientId: null,
      avatarUrl: null,
    },
    client: null,
    assignedClients: ASSIGNED_CLIENTS,
  });
}
