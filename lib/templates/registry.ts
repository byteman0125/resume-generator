import type { ComponentType } from "react";
import type { ResumeData, ResumeStyle } from "@/lib/resume-store";
import { PdfResume, template1Style } from "./template-1";
import { Template2, template2Style } from "./template-2";
import { Template3, template3Style } from "@/lib/templates/template-3";
import { Template4, template4Style } from "./template-4";

export type TemplateId = "template-1" | "template-2" | "template-3" | "template-4";

export interface TemplateEntry {
  id: TemplateId;
  name: string;
  description: string;
  Component: ComponentType<{ data: ResumeData; style?: ResumeStyle }>;
  style: ResumeStyle;
}

const REGISTRY: Record<TemplateId, TemplateEntry> = {
  "template-1": {
    id: "template-1",
    name: "Template 1",
    description: "Current resume configuration",
    Component: PdfResume,
    style: template1Style,
  },
  "template-2": {
    id: "template-2",
    name: "Template 2",
    description: "Modern Minimal — clean sans-serif, navy accent",
    Component: Template2,
    style: template2Style,
  },
  "template-3": {
    id: "template-3",
    name: "Template 3",
    description: "Split header layout with structured grid skills",
    Component: Template3,
    style: template3Style,
  },
  "template-4": {
    id: "template-4",
    name: "Template 4",
    description: "Warm editorial design with cream tones, brown headings, and double-line dividers",
    Component: Template4,
    style: template4Style,
  },
};

/** All template ids (use as value, e.g. for dropdowns or API). */
export const TEMPLATE_IDS: TemplateId[] = ["template-1", "template-2", "template-3", "template-4"];

/** List of templates for pickers (id, name, description). */
export const TEMPLATE_LIST: Pick<TemplateEntry, "id" | "name" | "description">[] = TEMPLATE_IDS.map(
  (id) => ({
    id,
    name: REGISTRY[id].name,
    description: REGISTRY[id].description,
  })
);

/**
 * Get a template by id. Use this instead of embedding component names in code.
 * Returns undefined if id is invalid.
 */
export function getTemplate(id: string | undefined | null): TemplateEntry | undefined {
  if (id == null || id === "") return undefined;
  return REGISTRY[id as TemplateId];
}

/** Default template id when none is chosen (e.g. for PDF / print). */
export const DEFAULT_TEMPLATE_ID: TemplateId = "template-1";
