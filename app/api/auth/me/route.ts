import { NextResponse } from "next/server";
import { getUserById, updateUserLastSeen } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const payload = getAuthFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User no longer exists" }, { status: 401 });
    }
    updateUserLastSeen(payload.userId);
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      assignedProfileId: user.assigned_profile_id,
      startDate: user.start_date,
      active: user.active !== 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Auth check failed" }, { status: 500 });
  }
}
