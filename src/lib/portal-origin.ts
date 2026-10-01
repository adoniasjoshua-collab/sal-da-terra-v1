import "server-only";
import { headers } from "next/headers";

// Server Actions only run when Origin matches Host, so the origin is the portal itself.
export async function portalOrigin() {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}
