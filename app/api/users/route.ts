import { NextResponse } from "next/server";
import {
  hasAnyUser,
  listUsers,
  createUser,
  getProfile,
} from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword, generateRandomPassword } from "@/lib/auth";

/** User list item (no password). */
type UserListItem = {
  id: string;
  username: string;
  role: string;
  assigned_profile_id: string | null;
  assigned_profile_name: string | null;
  start_date: string | null;
  created_at: string;
  application_count: number;
};

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const rows = listUsers();
    const profiles = new Map(rows.map((r) => [r.assigned_profile_id, null]).filter(([id]) => id).map(([id]) => [id, getProfile(id!)?.name ?? null]));
    const list: UserListItem[] = rows.map((r) => ({
      id: r.id,
      username: r.username,
      role: r.role,
      assigned_profile_id: r.assigned_profile_id,
      assigned_profile_name: r.assigned_profile_id ? (profiles.get(r.assigned_profile_id) ?? null) : null,
      start_date: r.start_date,
      created_at: r.created_at,
      application_count: r.application_count,
    }));
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const hasUsers = hasAnyUser();
    if (hasUsers) {
      const user = requireUser(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    const role = body.role === "user" ? "user" : "admin";
    const assigned_profile_id =
      typeof body.assigned_profile_id === "string" ? body.assigned_profile_id.trim() || null : null;
    const start_date =
      typeof body.start_date === "string" ? body.start_date.trim() || null : null;
    const plainPassword = generateRandomPassword(14);
    const password_hash = await hashPassword(plainPassword);
    const created = createUser({
      username,
      password_hash,
      role,
      assigned_profile_id,
      start_date,
    });
    const { password_hash: _, ...userWithoutHash } = created;
    return NextResponse.json({
      user: userWithoutHash,
      plainPassword,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
