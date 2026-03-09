import { NextResponse } from "next/server";
import { getDuplicateJobApplicationKeys } from "@/lib/db";

export async function GET() {
  try {
    const duplicateKeys = getDuplicateJobApplicationKeys();
    return NextResponse.json({ duplicateKeys });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to get duplicate keys" },
      { status: 500 }
    );
  }
}
