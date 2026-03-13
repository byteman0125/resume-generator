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
  /** Current company's role/title (e.g. from first experience). Available as {{role}} in prompts. */
  currentRole?: string | null;
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

/** Replaces {{job_description}} only on first occurrence with value; further occurrences become a short reference to avoid duplicating role context. */
function fillWithJobDescriptionOnce(
  template: string,
  replacements: Record<string, string>,
  jobDescriptionValue: string,
  subsequentPlaceholder: string = "[See role context above.]"
): string {
  const jobDescToken = "{{job_description}}";
  if (!template.includes(jobDescToken)) return fill(template, replacements);
  const firstIdx = template.indexOf(jobDescToken);
  const head = template.slice(0, firstIdx) + jobDescriptionValue + template.slice(firstIdx + jobDescToken.length);
  const rest = head.split(jobDescToken).join(subsequentPlaceholder);
  const others: Record<string, string> = { ...replacements, job_description: "" };
  let result = rest;
  for (const [key, value] of Object.entries(others)) {
    if (key === "job_description") continue;
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
  const currentRole = (body.currentRole ?? "").trim();
  const prompts = body.prompts;
  const roleContext = (body.roleContext ?? "").trim();
  const prefix = roleContext ? `Job description (use to tailor):\n${roleContext}\n\n` : "";
  const tokens = { company: currentCompany, job_description: roleContext || "", role: currentRole };

  if (body.mode === "bulletsCurrent") {
    const base = (prompts?.bulletsCurrent ?? "").trim();
    if (!base) return { prompt: "", error: "Bullet prompt (current company) is required" };
    const withTokens = fillWithJobDescriptionOnce(
      base,
      tokens,
      roleContext || "",
      "[See role context above.]"
    );
    return { prompt: withTokens };
  }

  if (body.mode === "bulletsLast") {
    const base = (prompts?.bulletsLast ?? "").trim();
    if (!base) return { prompt: "", error: "Bullet prompt (last company) is required" };
    const lastTokens = { ...tokens, company: lastCompany };
    const withTokens = fillWithJobDescriptionOnce(
      base,
      lastTokens,
      roleContext || "",
      "[See role context above.]"
    );
    return { prompt: withTokens };
  }

  if (body.mode === "summary") {
    const base = (prompts?.summary ?? "").trim();
    if (!base) return { prompt: "", error: "Summary prompt is required" };
    const injected = fill(base, { company: currentCompany, job_description: jd, role: currentRole });
    const bulletsText = `${generatedBullets?.current ?? ""}\n\n${generatedBullets?.last ?? ""}`.trim();
    const prompt = bulletsText
      ? `${injected}\n\nHere are the experience bullets to base the summary on:\n\n${bulletsText}`
      : injected;
    return { prompt: prefix + prompt };
  }

  // skills
  const base = (prompts?.skills ?? "").trim();
  if (!base) return { prompt: "", error: "Skills prompt is required" };
  const injected = fill(base, { company: currentCompany, job_description: jd, role: currentRole });
  const bulletsText = `${generatedBullets?.current ?? ""}\n\n${generatedBullets?.last ?? ""}`.trim();
  const prompt = bulletsText
    ? `${injected}\n\nHere are the experience bullets to extract skills from:\n\n${bulletsText}`
    : injected;
  return { prompt: prefix + prompt };
}

function buildExtractionPrompt(jobDescription: string): { prompt: string; error?: string } {
  const jd = (jobDescription ?? "").trim();
  if (!jd) return { prompt: "", error: "Job description is required for extraction" };
  const prompt = [
    "JOB DESCRIPTION EXTRACTOR",
    "",
    "You are a resume assistant. Extract the following from the job description below and output in a clean, consistent format.",
    "Do not summarize, interpret, paraphrase, or add commentary — preserve exact names and terms as written in the JD.",
    "",
    "---",
    "",
    "Input",
    "Job Description:",
    "",
    jd,
    "",
    "---",
    "",
    "Extract exactly these 6 sections:",
    "",
    "(1) JOB TITLE",
    "- Exact job title as written",
    "",
    "(2) SENIORITY LEVEL",
    "- Junior / Mid / Senior / Staff / Principal — infer from title and responsibilities if not explicitly stated",
    "",
    "(3) KEY RESPONSIBILITIES",
    "- 4-6 short bullet points summarizing core responsibilities",
    "- Use the JD's own language — do not rephrase or upgrade wording",
    "",
    "(4) TECH STACK — EXACT NAMES ONLY",
    "- List every technology, tool, framework, language, database, and cloud service mentioned",
    "- Exact names only — never group, summarize, or generalize",
    '- Never write "cloud platforms", "database technologies", or "modern frameworks" — always write the exact name (e.g. AWS Lambda, PostgreSQL, React)',
    "- Separate into subcategories:",
    "  - Cloud provider and native services: (e.g. AWS Lambda, Azure Functions, GCP BigQuery)",
    "  - Programming languages: (e.g. Python, Java, Go)",
    "  - Frameworks and libraries: (e.g. FastAPI, Spring Boot, React)",
    "  - Databases: (e.g. PostgreSQL, MongoDB, Redis)",
    "  - DevOps and infrastructure tools: (e.g. Kafka, Terraform, Docker, Kubernetes)",
    "  - AI and ML tools: (e.g. LangChain, OpenAI API, HuggingFace)",
    "",
    "(5) CLOUD PROVIDER",
    "- Identify the primary cloud platform targeted: AWS / Azure / GCP / Multi-cloud / Not specified",
    "- List all cloud-specific services mentioned (e.g. S3, Cosmos DB, BigQuery)",
    "",
    "(6) CORE SKILLS AND KEYWORDS",
    "- 8-12 non-tech keywords and soft skills (e.g. distributed systems, high availability, cross-functional collaboration, event-driven architecture)",
    "- Exact phrases from the JD only — no invention",
    "",
    "---",
    "",
    "Output the 6 sections only — no commentary, no explanations, no additional text.",
  ].join("\n");
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

