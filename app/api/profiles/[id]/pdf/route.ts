import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { getProfile } from "@/lib/db";
import type { ResumeData } from "@/lib/resume-store";
import { requireUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (user.role === "user" && id !== user.assigned_profile_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const row = getProfile(id);
    if (!row) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Derive a safe filename from profile name.
    let baseName = "resume";
    try {
      const data = JSON.parse(row.data) as ResumeData;
      const name = data.profile?.name?.trim();
      if (name) baseName = name;
    } catch {
      // ignore parse errors, fall back to default name
    }
    const safeName =
      baseName
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .toLowerCase() || "resume";

    // Build target URL for print view
    const url = new URL(request.url);
    let baseUrl =
      process.env.PDF_BASE_URL || `${url.protocol}//${url.host}`;
    if (baseUrl.includes("0.0.0.0")) {
      baseUrl = baseUrl.replace("0.0.0.0", "127.0.0.1");
    }
    const targetUrl = `${baseUrl}/print/${id}`;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    // Give React time to hydrate/load profile data
    await page.waitForTimeout(2000);

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.7in",
        bottom: "0.5in",
        left: "0.65in",
        right: "0.65in",
      },
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

