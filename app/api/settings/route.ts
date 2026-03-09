import { NextResponse } from "next/server";
import { getActiveProfileId, setActiveProfileId } from "@/lib/db";

export async function GET() {
  try {
    const activeProfileId = getActiveProfileId();
    return NextResponse.json({ activeProfileId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const activeProfileId =
      body.activeProfileId === null || body.activeProfileId === undefined
        ? null
        : String(body.activeProfileId);
    setActiveProfileId(activeProfileId);
    return NextResponse.json({ activeProfileId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
