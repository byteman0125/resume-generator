import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "usa-cities.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({});
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({}, { status: 500 });
  }
}
