import React from "react";
import type { Skill } from "@/lib/resume-store";

/** Parse "text **bold** more" into React nodes (strings and <strong>). */
export function renderWithBold(text: string): React.ReactNode {
  const trimmed = (text || "").trim().replace(/^[●\-]\s*/, "");
  const parts = trimmed.split(/\*\*/);
  if (parts.length === 1) return parts[0];
  return parts.map((p, i) =>
    i % 2 === 1 ? React.createElement("strong", { key: i }, p) : p
  );
}

/** Split description into bullet lines (by newline), trimmed and non-empty. */
export function splitBullets(description: string | undefined): string[] {
  if (!description || !description.trim()) return [];
  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Format city, state, or fallback to location string. */
export function formatLocation(city?: string, state?: string, location?: string): string {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (parts.length) return parts.join(", ");
  return (location || "").trim() || "";
}

/** Format date range for experience/education. */
export function formatDateRange(startDate: string, endDate: string, current?: boolean): string {
  const start = (startDate || "").trim();
  const end = current ? "Present" : (endDate || "").trim();
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" – ");
}

/** Group skills by category. Returns array of { category, skills }. */
export function groupSkillsByCategory(skills: Skill[]): { category: string; skills: Skill[] }[] {
  const byCategory = new Map<string, Skill[]>();
  for (const skill of skills) {
    const cat = (skill.category || "").trim() || "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(skill);
  }
  return Array.from(byCategory.entries()).map(([category, skills]) => ({ category, skills }));
}
