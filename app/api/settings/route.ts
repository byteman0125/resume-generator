import { NextResponse } from "next/server";
import { getActiveProfileId, setActiveProfileId } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const r = requireActiveUser(request);
    if ("status" in r) return NextResponse.json({ error: r.status === 403 ? "Account inactive" : "Unauthorized" }, { status: r.status });
    const user = r.user;
    const activeProfileId = getActiveProfileId();
    return NextResponse.json({ activeProfileId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const r = requireActiveUser(request);
    if ("status" in r) return NextResponse.json({ error: r.status === 403 ? "Account inactive" : "Unauthorized" }, { status: r.status });
    const user = r.user;
    const body = await request.json();
    let activeProfileId =
      body.activeProfileId === null || body.activeProfileId === undefined
        ? null
        : String(body.activeProfileId);
    if (user.role === "user" && activeProfileId !== null && activeProfileId !== user.assigned_profile_id) {
      activeProfileId = user.assigned_profile_id;
    }
    setActiveProfileId(activeProfileId);
    return NextResponse.json({ activeProfileId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
