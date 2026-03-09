import { NextResponse } from "next/server";

type Mode = "bulletsCurrent" | "bulletsLast" | "summary" | "skills";

interface Prompts {
  summary: string;
  bulletsCurrent: string;
  bulletsLast: string;
  skills: string;
}

interface GenerateRequestBody {
  apiKey?: string | null;
  mode: Mode;
  jobDescription: string;
  currentCompany: string;
  lastCompany: string;
  prompts: Prompts;
  // Optional snapshot of the current resume, kept generic to avoid tight coupling.
  currentResume?: unknown;
}

function fill(template: string, replacements: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{{${key}}}`;
    if (!token || !result.includes(token)) continue;
    result = result.split(token).join(value);
  }
  return result;
}

function buildPrompt(body: GenerateRequestBody, generatedBullets?: { current: string; last: string }): { prompt: string; error?: string } {
  const jd = (body.jobDescription ?? "").trim();
  const currentCompany = (body.currentCompany ?? "").trim();
  const lastCompany = (body.lastCompany ?? "").trim();

  if (body.mode === "bulletsCurrent") {
    const base = (body.prompts.bulletsCurrent ?? "").trim();
    if (!base) return { prompt: "", error: "Bullet prompt (current company) is required" };
    const withTokens = fill(base, { company: currentCompany, job_description: jd });
    return { prompt: withTokens };
  }

  if (body.mode === "bulletsLast") {
    const base = (body.prompts.bulletsLast ?? "").trim();
    if (!base) return { prompt: "", error: "Bullet prompt (last company) is required" };
    const withTokens = fill(base, { company: lastCompany });
    return { prompt: withTokens };
  }

  if (body.mode === "summary") {
    const base = (body.prompts.summary ?? "").trim();
    if (!base) return { prompt: "", error: "Summary prompt is required" };
    const injected = fill(base, { company: currentCompany, job_description: jd });
    const bulletsText = `${generatedBullets?.current ?? ""}\n\n${generatedBullets?.last ?? ""}`.trim();
    const prompt = bulletsText ? `${injected}\n\nHere are the experience bullets to base the summary on:\n\n${bulletsText}` : injected;
    return { prompt };
  }

  // skills
  const base = (body.prompts.skills ?? "").trim();
  if (!base) return { prompt: "", error: "Skills prompt is required" };
  const injected = fill(base, { company: currentCompany, job_description: jd });
  const bulletsText = `${generatedBullets?.current ?? ""}\n\n${generatedBullets?.last ?? ""}`.trim();
  const prompt = bulletsText ? `${injected}\n\nHere are the experience bullets to extract skills from:\n\n${bulletsText}` : injected;
  return { prompt };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequestBody & {
      // Optional: when re-running later steps client can send already-generated bullets.
      generatedBullets?: { current: string; last: string };
    };

    const apiKey = (body.apiKey ?? process.env.DEEPSEEK_API_KEY ?? "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing DeepSeek API key" }, { status: 400 });
    }

    const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
    const baseUrl = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com";

    const { prompt, error: promptError } = buildPrompt(body, body.generatedBullets);
    if (promptError || !prompt.trim()) {
      return NextResponse.json({ error: promptError || "Empty prompt" }, { status: 400 });
    }

    const dsRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!dsRes.ok) {
      const text = await dsRes.text().catch(() => "");
      console.error("DeepSeek error:", dsRes.status, text);
      return NextResponse.json(
        { error: "DeepSeek request failed", status: dsRes.status },
        { status: 500 }
      );
    }

    const json = (await dsRes.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const content = json.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      mode: body.mode,
      text: content,
      usage: json.usage ?? null,
    });
  } catch (e) {
    console.error("AI generate error:", e);
    return NextResponse.json({ error: "Failed to generate AI content" }, { status: 500 });
  }
}

