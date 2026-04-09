import { NextRequest, NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  // Bypass all auth — dummy mode
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/api/:path*", "/login"],
};
