"use client";

/**
 * Template 2: "Modern Minimal"
 * Clean sans-serif design with a subtle left accent bar.
 * Minimal color usage — navy accent only on headings.
 */
import React from "react";
import type { ResumeData, ResumeStyle } from "@/lib/resume-store";
import {
  renderWithBold,
  splitBullets,
  formatLocation,
  formatDateRange,
  groupSkillsByCategory,
} from "./template-utils";

export const template2Style: ResumeStyle = {};

const DEFAULT_ACCENT = "#1e3a5f";
const DEFAULT_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export function Template2({ data, style }: { data: ResumeData; style?: ResumeStyle }) {
  const { profile, experience, education, skills } = data;
  const loc = formatLocation(profile.city, profile.state, profile.location);
  const s = style ?? {};
  const namePt = s.nameSize ?? 26;
  const titlePt = s.titleSize ?? 12;
  const contactPt = s.contactSize ?? 9;
  const sectionPt = s.sectionSize ?? 10.5;
  const bodyPt = s.bodySize ?? 10;
  const accent = s.nameColor ?? s.sectionColor ?? DEFAULT_ACCENT;
  const font = s.fontFamily ?? DEFAULT_FONT;
  const lineHeight = s.bodyLineHeight ?? 1.55;
  const bulletChar = s.bulletChar ?? "•";
  const sectionTop = s.sectionTopInches ?? 0.16;
  const sectionBottom = s.sectionBottomInches ?? 0.1;
  const bulletIndent = (s.bulletIndentInches ?? 0.25) * 96;
  const bulletGap = (s.bulletGapInches ?? 0.04) * 96;

  return (
    <div
      data-pdf-ready="true"
      style={{
        maxWidth: "7.5in",
        margin: "0 auto",
        fontFamily: font,
        color: s.bodyColor ?? "#2d2d2d",
        fontSize: `${bodyPt}pt`,
        lineHeight,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "8px" }}>
        <h1 style={{ fontSize: `${namePt}pt`, fontWeight: 300, margin: 0, color: accent, letterSpacing: "-0.5px" }}>
          {profile.name}
        </h1>
        <p style={{ fontSize: `${titlePt}pt`, fontWeight: 500, color: s.titleColor ?? "#555", margin: "1px 0 3px" }}>
          {profile.title}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: `${contactPt}pt`, color: s.contactColor ?? "#666" }}>
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{profile.phone}</span>}
          {loc && <span>{loc}</span>}
          {profile.linkedin && <span>{profile.linkedin}</span>}
          {profile.website && <span>{profile.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {profile.summary && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px", borderBottom: `2px solid ${accent}`, paddingBottom: "4px" }}>
            Summary
          </h2>
          <p style={{ margin: 0, color: s.bodyColor ?? "#444" }}>{renderWithBold(profile.summary)}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", borderBottom: `2px solid ${accent}`, paddingBottom: "4px" }}>
            Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: `${bodyPt + 1}pt` }}>{exp.company}</span>
                <span style={{ fontSize: `${contactPt}pt`, color: "#777" }}>
                  {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: `${bodyPt}pt`, color: s.bodyColor ?? "#666", marginBottom: "4px" }}>
                <span>{exp.role}</span>
                {exp.location && <span>{exp.location}</span>}
              </div>
              <ul style={{ margin: 0, paddingLeft: `${bulletIndent}px`, listStyle: "none" }}>
                {splitBullets(exp.description).map((bullet: string, i: number) => (
                  <li key={i} style={{ marginBottom: `${bulletGap}px`, color: s.bodyColor ?? "#444", display: "flex", gap: "6px" }}>
                    <span style={{ flexShrink: 0 }}>{bulletChar}</span>
                    <span>{renderWithBold(bullet)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", borderBottom: `2px solid ${accent}`, paddingBottom: "4px" }}>
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700 }}>
                  {edu.school}
                </span>
                <span style={{ fontSize: `${contactPt}pt`, color: "#777" }}>
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
              <p style={{ margin: 0, color: s.bodyColor ?? "#666", fontSize: `${bodyPt}pt` }}>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ""}
              </p>
              {edu.description && (
                <p style={{ margin: "2px 0 0", fontSize: `${bodyPt}pt`, color: "#777" }}>{edu.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills — grouped by category with headers (per TEMPLATE_CONVENTIONS) */}
      {skills.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", borderBottom: `2px solid ${accent}`, paddingBottom: "4px" }}>
            Skills
          </h2>
          {groupSkillsByCategory(skills).map(({ category, skills: groupSkills }) => (
            <div key={category} style={{ marginBottom: "4px", fontSize: `${bodyPt}pt`, color: s.bodyColor ?? "#111827" }}>
              <span style={{ fontWeight: 600, color: s.sectionColor ?? "#1a1a1a" }}>{category}: </span>
              {groupSkills.map((skill, i) => (
                <React.Fragment key={skill.id}>
                  {i > 0 && ", "}
                  {renderWithBold(skill.name)}
                </React.Fragment>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
