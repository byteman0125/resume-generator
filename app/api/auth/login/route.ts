import { NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }
    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (user.role === "user" && (!user.assigned_profile_id || user.assigned_profile_id.trim() === "")) {
      return NextResponse.json(
        { error: "Login not allowed until an admin assigns you a profile" },
        { status: 401 }
      );
    }
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      assignedProfileId: user.assigned_profile_id,
    });
    return NextResponse.json({ token });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
