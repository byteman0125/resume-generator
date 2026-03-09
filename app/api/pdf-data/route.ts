import { NextResponse } from "next/server";
import { getPdfData } from "@/lib/pdf-cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const data = getPdfData(token);
  if (!data) {
    return NextResponse.json({ error: "Expired or invalid token" }, { status: 404 });
  }
  return NextResponse.json(data);
}
