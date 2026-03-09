import { NextResponse } from "next/server";
import { getProfile, updateProfile, deleteProfile } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = getProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const data = JSON.parse(profile.data);
    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      data,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: { name?: string; data?: unknown } = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.data != null) {
      updates.data = body.data;
      // Keep row name in sync with profile full name so cards and dropdown update
      const profileName = (body.data as { profile?: { name?: string } })?.profile?.name;
      if (typeof profileName === "string" && profileName.trim()) {
        updates.name = profileName.trim();
      }
    }
    updateProfile(id, updates as { name?: string; data?: import("@/lib/resume-store").ResumeData });
    const profile = getProfile(id)!;
    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      updated_at: profile.updated_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteProfile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
