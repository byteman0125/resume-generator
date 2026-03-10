import { NextResponse } from "next/server";

type Mode = "bulletsCurrent" | "bulletsLast" | "summary" | "skills" | "extractCoreContext";

type ChatRole = "user" | "assistant" | "system";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

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
  // Prompts are required for bullets/summary/skills but not for extractCoreContext.
  prompts?: Prompts;
  // Optional snapshot of the current resume, kept generic to avoid tight coupling.
  currentResume?: unknown;
  // Optional role-level context extracted from the job description, used to tailor all 4 steps.
  roleContext?: string | null;
  // Optional chat history for this job's 4-section flow (client-held session).
  messages?: ChatMessage[];
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

function buildPrompt(
  body: GenerateRequestBody,
  generatedBullets?: { current: string; last: string }
): { prompt: string; error?: string } {
  const jd = (body.jobDescription ?? "").trim();
  const currentCompany = (body.currentCompany ?? "").trim();
  const lastCompany = (body.lastCompany ?? "").trim();
  const prompts = body.prompts;
  const roleContext = (body.roleContext ?? "").trim();
  const prefix = roleContext ? `Role context (use to tailor):\n${roleContext}\n\n` : "";

  if (body.mode === "bulletsCurrent") {
    const base = (prompts?.bulletsCurrent ?? "").trim();
    if (!base) return { prompt: "", error: "Bullet prompt (current company) is required" };
    const withTokens = fill(base, { company: currentCompany, job_description: jd });
    return { prompt: prefix + withTokens };
  }

  if (body.mode === "bulletsLast") {
    const base = (prompts?.bulletsLast ?? "").trim();
    if (!base) return { prompt: "", error: "Bullet prompt (last company) is required" };
    const withTokens = fill(base, { company: lastCompany });
    return { prompt: prefix + withTokens };
  }

  if (body.mode === "summary") {
    const base = (prompts?.summary ?? "").trim();
    if (!base) return { prompt: "", error: "Summary prompt is required" };
    const injected = fill(base, { company: currentCompany, job_description: jd });
    const bulletsText = `${generatedBullets?.current ?? ""}\n\n${generatedBullets?.last ?? ""}`.trim();
    const prompt = bulletsText
      ? `${injected}\n\nHere are the experience bullets to base the summary on:\n\n${bulletsText}`
      : injected;
    return { prompt: prefix + prompt };
  }

  // skills
  const base = (prompts?.skills ?? "").trim();
  if (!base) return { prompt: "", error: "Skills prompt is required" };
  const injected = fill(base, { company: currentCompany, job_description: jd });
  const bulletsText = `${generatedBullets?.current ?? ""}\n\n${generatedBullets?.last ?? ""}`.trim();
  const prompt = bulletsText
    ? `${injected}\n\nHere are the experience bullets to extract skills from:\n\n${bulletsText}`
    : injected;
  return { prompt: prefix + prompt };
}

function buildExtractionPrompt(jobDescription: string): { prompt: string; error?: string } {
  const jd = (jobDescription ?? "").trim();
  if (!jd) return { prompt: "", error: "Job description is required for extraction" };
  const prompt =
    "You are a resume assistant. Extract from the job description below: (1) Job title, (2) 3–5 key responsibilities as short bullet points, (3) 8–12 skills or keywords, (4) Tone/seniority. " +
    "Output in a clear, consistent format. Do not add commentary.\n\n" +
    "Job description:\n\n" +
    jd;
  return { prompt, error: undefined };
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
    const temperature =
      Number.isFinite(Number(process.env.DEEPSEEK_TEMPERATURE))
        ? Number(process.env.DEEPSEEK_TEMPERATURE)
        : 0.4;
    const maxTokensEnv = process.env.DEEPSEEK_MAX_TOKENS;

    const systemMessage: ChatMessage = {
      role: "system",
      content:
        process.env.DEEPSEEK_SYSTEM_MESSAGE?.trim() ||
        "You are a resume assistant. Follow the user's instructions precisely and output only what is requested.",
    };

    // Mode: extract core role context from job description
    if (body.mode === "extractCoreContext") {
      const { prompt, error: promptError } = buildExtractionPrompt(body.jobDescription);
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
          temperature,
          max_tokens: maxTokensEnv ? Number(maxTokensEnv) || undefined : 2048,
          messages: [systemMessage, { role: "user", content: prompt }],
        }),
      });

      if (!dsRes.ok) {
        const text = await dsRes.text().catch(() => "");
        console.error("DeepSeek error (extractCoreContext):", dsRes.status, text);
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
    }

    const { prompt, error: promptError } = buildPrompt(body, body.generatedBullets);
    if (promptError || !prompt.trim()) {
      return NextResponse.json({ error: promptError || "Empty prompt" }, { status: 400 });
    }

    const history = Array.isArray(body.messages)
      ? body.messages
          .filter((m): m is ChatMessage => !!m && typeof m.content === "string" && !!m.content.trim())
      : [];

    const dsRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokensEnv ? Number(maxTokensEnv) || undefined : 2048,
        messages: [systemMessage, ...history, { role: "user", content: prompt }],
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

