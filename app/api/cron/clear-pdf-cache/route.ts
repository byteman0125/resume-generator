import { NextResponse } from "next/server";
import { clearExpiredPdfCache } from "@/lib/pdf-cache";

/**
 * Scheduled job: clear expired PDF cache files.
 * Call this route periodically (e.g. Vercel Cron, system cron, or GitHub Actions).
 *
 * Auth: set CRON_SECRET in env and send it in the request:
 *   Authorization: Bearer <CRON_SECRET>
 *   or
 *   ?secret=<CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const querySecret = new URL(request.url).searchParams.get("secret");
  const secret = process.env.CRON_SECRET;

  if (secret && secret.length > 0) {
    const provided = bearer ?? querySecret;
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const removed = clearExpiredPdfCache();
    return NextResponse.json({ ok: true, removed });
  } catch (e) {
    console.error("clear-pdf-cache:", e);
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}
