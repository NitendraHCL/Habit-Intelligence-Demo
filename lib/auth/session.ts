import { cookies } from "next/headers";
import type { SessionUser, AuthSession } from "@/lib/types";

const SESSION_COOKIE = "hi_session";

const DUMMY_USER: SessionUser = {
  id: "dummy-super-admin-001",
  email: "admin@habithealth.com",
  name: "Demo Admin",
  role: "SUPER_ADMIN",
  clientId: null,
  avatarUrl: null,
};

const CUG_MAP: Record<string, string> = {
  "cisco-001": "HCLHEALTHCARE",
  "hcltech-001": "DUMMY01",
};

export async function hashPassword(_password: string): Promise<string> {
  return "dummy-hash";
}

export async function verifyPassword(_password: string, _hash: string): Promise<boolean> {
  return true;
}

export async function createSession(_userId: string): Promise<string> {
  const token = "dummy-session-token";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function getSession(): Promise<AuthSession | null> {
  return {
    user: DUMMY_USER,
    token: "dummy-session-token",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionCugCode(requestedClientId?: string): Promise<string | null> {
  if (requestedClientId && CUG_MAP[requestedClientId]) {
    return CUG_MAP[requestedClientId];
  }
  // Default to HCLHEALTHCARE
  return "HCLHEALTHCARE";
}

export async function getSessionCugId(requestedClientId?: string): Promise<string | null> {
  return getSessionCugCode(requestedClientId);
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
