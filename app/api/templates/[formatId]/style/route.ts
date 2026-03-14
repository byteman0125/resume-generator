import { NextResponse } from "next/server";
import {
  FORMAT_IDS,
  getTemplateStyle,
  writeTemplateStyle,
  type FormatId,
  type TemplateStyleFile,
} from "@/lib/template-style-file";
import { requireUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ formatId: string }> };

function requireAdmin(request: Request) {
  const user = requireUser(request);
  if (!user) return { status: 401 as const, error: "Unauthorized" };
  if (user.role !== "admin") return { status: 403 as const, error: "Forbidden" };
  return { user };
}

export async function GET(request: Request, { params }: RouteParams) {
  const auth = requireAdmin(request);
  if ("status" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { formatId } = await params;
  if (!FORMAT_IDS.includes(formatId as FormatId)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }
  const style = getTemplateStyle(formatId as FormatId);
  return NextResponse.json(style);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = requireAdmin(request);
  if ("status" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { formatId } = await params;
  if (!FORMAT_IDS.includes(formatId as FormatId)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const style = body as TemplateStyleFile;
  const ok = writeTemplateStyle(formatId as FormatId, style);
  if (!ok) {
    return NextResponse.json(
      { error: "Style can only be written in development (local env)" },
      { status: 403 }
    );
  }
  return NextResponse.json(style);
}
