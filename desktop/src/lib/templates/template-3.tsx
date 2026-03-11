import React from "react";
import type { ResumeData, ResumeStyle } from "@/lib/resume-store";
import {
  renderWithBold,
  splitBullets,
  formatLocation,
  formatDateRange,
  groupSkillsByCategory,
} from "./template-utils";

export const template3Style: ResumeStyle = {};

const DEFAULT_ACCENT = "#111827";
const DEFAULT_DARK = "#111827";

export function Template3({ data, style }: { data: ResumeData; style?: ResumeStyle }) {
  const { profile, experience, education, skills } = data;
  const loc = formatLocation(profile.city, profile.state, profile.location);
  const s = style ?? {};
  const namePt = s.nameSize ?? 24;
  const titlePt = s.titleSize ?? 11;
  const contactPt = s.contactSize ?? 9;
  const sectionPt = s.sectionSize ?? 10.5;
  const bodyPt = s.bodySize ?? 10;
  const lineHeight = s.bodyLineHeight ?? 1.5;
  const font = s.fontFamily ?? "Arial, Helvetica, sans-serif";
  const accent = s.nameColor ?? s.sectionColor ?? DEFAULT_ACCENT;
  const dark = s.bodyColor ?? DEFAULT_DARK;
  const bulletChar = s.bulletChar ?? "•";
  const sectionTop = s.sectionTopInches ?? 0.14;
  const sectionBottom = s.sectionBottomInches ?? 0.1;
  const bulletIndentPx = (s.bulletIndentInches ?? 0.25) * 96;
  const bulletGapPx = (s.bulletGapInches ?? 0.04) * 96;

  return (
    <div
      data-pdf-ready="true"
      style={{
        maxWidth: "7.5in",
        margin: "0 auto",
        fontFamily: font,
        color: dark,
        fontSize: `${bodyPt}pt`,
        lineHeight,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
        <div>
          <h1 style={{ fontSize: `${namePt}pt`, fontWeight: 700, margin: 0, color: s.nameColor ?? dark }}>
            {profile.name}
          </h1>
          <p style={{ fontSize: `${titlePt}pt`, margin: "2px 0 0", color: accent, fontWeight: 600 }}>
            {profile.title}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: `${contactPt}pt`, color: s.contactColor ?? "#555", lineHeight: 1.7 }}>
          {profile.email && <p style={{ margin: 0 }}>{profile.email}</p>}
          {profile.phone && <p style={{ margin: 0 }}>{profile.phone}</p>}
          {loc && <p style={{ margin: 0 }}>{loc}</p>}
          {profile.linkedin && <p style={{ margin: 0 }}>{profile.linkedin}</p>}
          {profile.website && <p style={{ margin: 0 }}>{profile.website}</p>}
        </div>
      </div>

      <div style={{ height: "3px", background: accent, marginBottom: "14px" }} />

      {profile.summary && s.showSummary !== false && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: s.sectionColor ?? dark, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", paddingBottom: "3px", borderBottom: "1px solidrgb(127, 127, 129)" }}>
            Professional Summary
          </h2>
          <p style={{ margin: 0, color: s.bodyColor ?? "#444" }}>{renderWithBold(profile.summary)}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: s.sectionColor ?? dark, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingBottom: "3px", borderBottom: "1px solid #9ca3af" }}>
            Work Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "2px 0" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: `${bodyPt + 1}pt` }}>{exp.company}</div>
                  <div style={{ fontWeight: 600, color: accent, fontSize: `${bodyPt}pt` }}>{exp.role}</div>
                </div>
                <span style={{ fontSize: `${contactPt - 0.5}pt`, color: "#888", flexShrink: 0, marginLeft: "8px" }}>
                  {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                </span>
              </div>
              <ul style={{ margin: "4px 0 0", paddingLeft: `${bulletIndentPx}px`, listStyle: "none" }}>
                {splitBullets(exp.description).map((bullet, i) => (
                  <li key={i} style={{ marginBottom: `${bulletGapPx}px`, color: s.bodyColor ?? "#444", display: "flex", gap: "6px" }}>
                    <span style={{ flexShrink: 0 }}>{bulletChar}</span>
                    <span>{renderWithBold(bullet)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: s.sectionColor ?? dark, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", paddingBottom: "3px", borderBottom: "1px solid #9ca3af" }}>
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "2px 0" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{edu.school}</div>
                  <div style={{ fontWeight: 600, color: accent, fontSize: `${bodyPt}pt` }}>
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </div>
                </div>
                <span style={{ fontSize: `${contactPt - 0.5}pt`, color: "#888", flexShrink: 0, marginLeft: "8px" }}>
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
              {edu.description && (
                <p style={{ margin: "2px 0 0", fontSize: `${contactPt}pt`, color: s.bodyColor ?? "#666" }}>{edu.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2 style={{ fontSize: `${sectionPt}pt`, fontWeight: 700, color: s.sectionColor ?? dark, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", paddingBottom: "3px", borderBottom: "1px solid #9ca3af" }}>
            Technical Skills
          </h2>
          {groupSkillsByCategory(skills).map(({ category, skills: groupSkills }) => (
            <div key={category} style={{ marginBottom: "4px", fontSize: `${bodyPt}pt`, color: s.bodyColor ?? dark }}>
              <span style={{ fontWeight: 600, color: s.sectionColor ?? DEFAULT_DARK }}>{category}: </span>
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
