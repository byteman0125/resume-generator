import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { setPdfData, createToken, clearExpiredPdfCache } from "@/lib/pdf-cache";
import { requireUser } from "@/lib/auth";
import {
  LETTER_VIEWPORT,
  LETTER_VIEWPORT_TALL_HEIGHT,
  PDF_MARGIN_TOP_IN,
  PDF_MARGIN_BOTTOM_IN,
  PDF_MARGIN_LEFT_IN,
  PDF_MARGIN_RIGHT_IN,
} from "@/lib/pdf-constants";
import type { ResumeData } from "@/lib/resume-store";

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const data = body?.data as ResumeData | undefined;
    const templateId = typeof body?.templateId === "string" ? body.templateId.trim() || undefined : undefined;
    if (!data || !data.profile || !Array.isArray(data.experience) || !Array.isArray(data.education) || !Array.isArray(data.skills)) {
      return NextResponse.json({ error: "Invalid resume data" }, { status: 400 });
    }

    // Clear expired cache on every PDF request (so local dev works without a cron)
    clearExpiredPdfCache();

    const token = createToken();
    setPdfData(token, data, templateId);

    const url = new URL(request.url);
    let baseUrl = process.env.PDF_BASE_URL || `${url.protocol}//${url.host}`;
    // 0.0.0.0 is invalid for client navigation (Playwright); use localhost so the browser can connect
    if (baseUrl.includes("0.0.0.0")) {
      baseUrl = baseUrl.replace("0.0.0.0", "127.0.0.1");
    }
    const targetUrl = `${baseUrl}/print/preview?token=${encodeURIComponent(token)}`;

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({
      width: LETTER_VIEWPORT.width,
      height: LETTER_VIEWPORT_TALL_HEIGHT,
    });
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 20000 });
    await page.waitForTimeout(500);

    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: `${PDF_MARGIN_TOP_IN}in`,
        bottom: `${PDF_MARGIN_BOTTOM_IN}in`,
        left: `${PDF_MARGIN_LEFT_IN}in`,
        right: `${PDF_MARGIN_RIGHT_IN}in`,
      },
    });

    await browser.close();

    const name = data.profile?.name?.trim() || "resume";
    const safeName = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "resume";

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeName}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
