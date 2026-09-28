import { type NextRequest, NextResponse } from "next/server";

// Legacy e-mail links land here. GET must not consume the one-time token (link
// scanners and previews prefetch URLs), so forward to the confirmation page.
export function GET(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/convite";
  destination.search = "";
  for (const key of ["token_hash", "type"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) destination.searchParams.set(key, value);
  }
  return NextResponse.redirect(destination);
}
