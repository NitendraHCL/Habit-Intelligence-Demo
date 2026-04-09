import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await createSession("dummy-super-admin-001");

    return NextResponse.json({
      user: {
        id: "dummy-super-admin-001",
        email: email,
        name: "Demo Admin",
        role: "SUPER_ADMIN",
        clientId: null,
        clientName: null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
