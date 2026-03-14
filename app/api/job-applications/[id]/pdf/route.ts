import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getJobApplication, updateJobApplication } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const JOB_PDFS_DIR = path.join(process.cwd(), "data", "job-pdfs");

function ensureJobPdfDir() {
  if (!fs.existsSync(JOB_PDFS_DIR)) {
    fs.mkdirSync(JOB_PDFS_DIR, { recursive: true });
  }
}

function getPdfPath(id: string) {
  ensureJobPdfDir();
  return path.join(JOB_PDFS_DIR, `${id}.pdf`);
}

function userCanAccessProfile(user: { role: string; assigned_profile_id: string | null }, profileId: string | null): boolean {
  if (user.role === "admin") return true;
  return profileId !== null && profileId === user.assigned_profile_id;
}

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
    const row = getJobApplication(id);
    if (!row) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }
    if (!userCanAccessProfile(user, row.profile_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const filePath = getPdfPath(id);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "PDF not found for this application" }, { status: 404 });
    }
    const pdf = fs.readFileSync(filePath);
    const fileName = row.resume_file_name || "resume.pdf";
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to read application PDF" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const row = getJobApplication(id);
    if (!row) {
      return NextResponse.json({ error: "Job application not found" }, { status: 404 });
    }
    if (!userCanAccessProfile(user, row.profile_id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const buffer = await request.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ error: "Empty PDF body" }, { status: 400 });
    }
    const filePath = getPdfPath(id);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    updateJobApplication(id, { resume_file_name: "resume.pdf" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to save application PDF" },
      { status: 500 }
    );
  }
}

