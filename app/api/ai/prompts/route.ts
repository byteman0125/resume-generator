import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { requireUser } from "@/lib/auth";

type Prompts = {
  summary: string;
  bulletsCurrent: string;
  bulletsLast: string;
  skills: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const PROMPTS_FILE = path.join(DATA_DIR, "ai-prompts.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readPrompts(): Prompts {
  ensureDataDir();
  if (!fs.existsSync(PROMPTS_FILE)) {
    return {
      summary: "",
      bulletsCurrent: "",
      bulletsLast: "",
      skills: "",
    };
  }
  try {
    const raw = fs.readFileSync(PROMPTS_FILE, "utf-8");
    const json = JSON.parse(raw) as Partial<Prompts>;
    return {
      summary: json.summary ?? "",
      bulletsCurrent: json.bulletsCurrent ?? "",
      bulletsLast: json.bulletsLast ?? "",
      skills: json.skills ?? "",
    };
  } catch {
    return {
      summary: "",
      bulletsCurrent: "",
      bulletsLast: "",
      skills: "",
    };
  }
}

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const prompts = readPrompts();
    return NextResponse.json(prompts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to read prompts" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = (await request.json()) as Partial<Prompts>;
    const current = readPrompts();
    const next: Prompts = {
      summary: typeof body.summary === "string" ? body.summary : current.summary,
      bulletsCurrent:
        typeof body.bulletsCurrent === "string" ? body.bulletsCurrent : current.bulletsCurrent,
      bulletsLast:
        typeof body.bulletsLast === "string" ? body.bulletsLast : current.bulletsLast,
      skills: typeof body.skills === "string" ? body.skills : current.skills,
    };
    ensureDataDir();
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(next, null, 2), "utf-8");
    return NextResponse.json(next);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save prompts" }, { status: 500 });
  }
}

