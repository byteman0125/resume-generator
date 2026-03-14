"use client";

import { Briefcase, FileText, Target, Sparkles, CheckCircle2, Brain, Bot, Home } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "One resume, many versions",
    description: "Tailor your resume for each role in minutes. Keep everything in one place.",
  },
  {
    icon: Target,
    title: "Track every application",
    description: "Never lose a lead. See status, notes, and follow-ups at a glance.",
  },
  {
    icon: Sparkles,
    title: "AI-powered bullets",
    description: "Generate strong bullet points from job descriptions. Stand out to recruiters.",
  },
];

const benefits = [
  "Beautiful PDFs, every time",
  "Drag & drop to apply",
  "Works offline",
  "Your data, your machine",
];

export function LandingPage() {
  return (
    <div
      className="landing-page min-h-screen w-full flex flex-col overflow-hidden relative"
      style={{
        background: "linear-gradient(180deg, hsl(var(--lp-bg)) 0%, hsl(var(--lp-bg-end)) 100%)",
      }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--lp-grid) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--lp-grid) / 0.5) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-8 sm:pt-24 sm:pb-10 text-center max-w-3xl mx-auto">
        <div
          className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl text-white shadow-2xl mb-8 ring-4 ring-black/5 dark:ring-white/10"
          style={{ background: "linear-gradient(135deg, hsl(var(--lp-accent)) 0%, hsl(var(--lp-accent-deep)) 100%)" }}
        >
          <Briefcase className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4" style={{ color: "hsl(var(--lp-fg))" }}>
          Tailor
        </h1>
        <p className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: "hsl(var(--lp-fg) / 0.9)" }}>
          Resumes that get you hired
        </p>
        <p className="text-base sm:text-lg max-w-lg mb-4 leading-relaxed" style={{ color: "hsl(var(--lp-muted))" }}>
          Human focus, AI precision, and a calm workspace—all in one place, designed for modern job search.
        </p>
      </section>

      {/* Human + AI + workspace visuals */}
      <section className="relative z-10 px-6 pb-10 sm:pb-14 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div
            className="rounded-3xl p-6 sm:p-8 shadow-md md:col-span-1"
            style={{
              background: "radial-gradient(circle at top left, hsl(var(--lp-accent-soft)) 0%, transparent 55%), hsl(var(--lp-card))",
              border: "1px solid hsl(var(--lp-card-border))",
            }}
          >
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
              style={{ backgroundColor: "hsl(var(--lp-accent-soft))", color: "hsl(var(--lp-accent))" }}
            >
              <Brain className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--lp-fg))" }}>
              Human clarity
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--lp-muted))" }}>
              Keep your story clear and consistent. Tailor keeps every version of your resume aligned with the roles you care about.
            </p>
          </div>
          <div
            className="rounded-3xl p-6 sm:p-8 shadow-md"
            style={{
              background: "radial-gradient(circle at top, hsl(var(--lp-accent)) 0%, hsl(var(--lp-accent-deep)) 45%, transparent 70%)",
              border: "1px solid hsl(var(--lp-card-border))",
              color: "white",
            }}
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10 mb-4">
              <Bot className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI that works like a teammate</h3>
            <p className="text-sm leading-relaxed text-white/90">
              Let Tailor suggest language, bullet points, and framing—while you stay in control of every word you send.
            </p>
          </div>
          <div
            className="rounded-3xl p-6 sm:p-8 shadow-md md:col-span-1"
            style={{
              background: "radial-gradient(circle at bottom right, hsl(var(--lp-accent-soft)) 0%, transparent 55%), hsl(var(--lp-card))",
              border: "1px solid hsl(var(--lp-card-border))",
            }}
          >
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4"
              style={{ backgroundColor: "hsl(var(--lp-accent-soft))", color: "hsl(var(--lp-accent))" }}
            >
              <Home className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--lp-fg))" }}>
              Calm home for your search
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--lp-muted))" }}>
              A focused workspace where roles, resumes, and notes live together—so your job hunt feels organized, not overwhelming.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-12 sm:py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-center text-2xl sm:text-3xl font-bold mb-10" style={{ color: "hsl(var(--lp-fg))" }}>
          Everything you need to apply smarter
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl p-6 sm:p-8 text-center shadow-sm transition-all hover:shadow-lg border"
              style={{
                backgroundColor: "hsl(var(--lp-card))",
                borderColor: "hsl(var(--lp-card-border))",
              }}
            >
              <div
                className="inline-flex h-14 w-14 items-center justify-center rounded-xl mb-4"
                style={{ backgroundColor: "hsl(var(--lp-accent-soft))", color: "hsl(var(--lp-accent))" }}
              >
                <Icon className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--lp-fg))" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--lp-muted))" }}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits strip */}
      <section
        className="relative z-10 px-6 py-10 sm:py-14 border-y"
        style={{ borderColor: "hsl(var(--lp-card-border))", backgroundColor: "hsl(var(--lp-accent-soft) / 0.4)" }}
      >
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3 sm:gap-x-12">
          {benefits.map((item) => (
            <div key={item} className="flex items-center gap-2 font-medium" style={{ color: "hsl(var(--lp-fg) / 0.9)" }}>
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "hsl(var(--lp-accent))" }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 py-8 text-center border-t" style={{ borderColor: "hsl(var(--lp-card-border))" }}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "hsl(var(--lp-muted))" }}>
          Job application tracker & resume builder
        </p>
      </footer>
    </div>
  );
}
