import { NextResponse } from "next/server";
import { hasAnyUser } from "@/lib/db";

export async function GET() {
  try {
    const hasUsers = hasAnyUser();
    return NextResponse.json({ hasUsers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Setup status failed" }, { status: 500 });
  }
}
