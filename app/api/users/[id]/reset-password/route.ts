import { NextResponse } from "next/server";
import { getUserById, updateUserPassword } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";
import { hashPassword, generateRandomPassword } from "@/lib/auth";

/** Admin-only: reset user password and return the new one-time password. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const r = requireActiveUser(_request);
    if ("status" in r) return NextResponse.json({ error: r.status === 403 ? "Account inactive" : "Unauthorized" }, { status: r.status });
    const user = r.user;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const existing = getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const plainPassword = generateRandomPassword(14);
    const password_hash = await hashPassword(plainPassword);
    updateUserPassword(id, password_hash);
    return NextResponse.json({ plainPassword });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
