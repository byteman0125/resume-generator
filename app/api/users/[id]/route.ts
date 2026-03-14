import { NextResponse } from "next/server";
import {
  getUserById,
  updateUser,
  updateUserPassword,
  deleteUser,
  countAdminUsers,
  getProfile,
} from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword, generateRandomPassword } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const existing = getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const body = await request.json();
    const updates: {
      username?: string;
      role?: "admin" | "user";
      assigned_profile_id?: string | null;
      start_date?: string | null;
    } = {};
    if (typeof body.username === "string") updates.username = body.username.trim();
    if (body.role === "user" || body.role === "admin") updates.role = body.role;
    if ("assigned_profile_id" in body)
      updates.assigned_profile_id =
        typeof body.assigned_profile_id === "string"
          ? body.assigned_profile_id.trim() || null
          : null;
    if ("start_date" in body)
      updates.start_date =
        typeof body.start_date === "string" ? body.start_date.trim() || null : null;

    let plainPassword: string | undefined;
    if (body.resetPassword === true) {
      plainPassword = generateRandomPassword(14);
      const password_hash = await hashPassword(plainPassword);
      updateUserPassword(id, password_hash);
    }

    updateUser(id, updates);
    const updated = getUserById(id)!;
    const { password_hash: _, ...userWithoutHash } = updated;
    const profileName = updated.assigned_profile_id
      ? getProfile(updated.assigned_profile_id)?.name ?? null
      : null;
    const response: Record<string, unknown> = {
      user: {
        ...userWithoutHash,
        assigned_profile_name: profileName,
      },
    };
    if (plainPassword !== undefined) response.plainPassword = plainPassword;
    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireUser(_request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const existing = getUserById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (existing.role === "admin" && countAdminUsers() <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin" },
        { status: 403 }
      );
    }
    deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
