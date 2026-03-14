import { NextResponse } from "next/server";
import { getDuplicateJobApplicationKeys } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let duplicateKeys = getDuplicateJobApplicationKeys();
    if (user.role === "user" && user.assigned_profile_id) {
      const prefix = `${user.assigned_profile_id}::`;
      duplicateKeys = duplicateKeys.filter((k) => k.startsWith(prefix));
    }
    return NextResponse.json({ duplicateKeys });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to get duplicate keys" },
      { status: 500 }
    );
  }
}
