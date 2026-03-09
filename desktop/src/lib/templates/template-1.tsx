import React from "react";
import type { ResumeData, ResumeStyle } from "@/lib/resume-store";
import { groupSkillsByCategory } from "./template-utils";

export const template1Style: ResumeStyle = {};

function renderWithBold(text: string): React.ReactNode {
  const trimmed = (text || "").trim().replace(/^[●\-]\s*/, "");
  const parts = trimmed.split(/\*\*/);
  if (parts.length === 1) return parts[0];
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i}>{p}</strong> : p
  );
}

function formatContact(profile: ResumeData["profile"]): string {
  const parts: string[] = [];
  const loc: string[] = [];
  if (profile.city) loc.push(profile.city);
  if (profile.state) loc.push(profile.state);
  if (loc.length) parts.push(loc.join(", "));
  if (profile.email) parts.push(profile.email);
  if (profile.phone) parts.push(profile.phone);
  return parts.join(" \u2022 ");
}

export function PdfResume({ data, style }: { data: ResumeData; style?: ResumeStyle }) {
  const { profile, experience, education, skills } = data;
  const contact = formatContact(profile);
  const s = style ?? {};
  const namePt = s.nameSize ?? 22;
  const titlePt = s.titleSize ?? 11;
  const contactPt = s.contactSize ?? 9.5;
  const sectionPt = s.sectionSize ?? 10;
  const bodyPt = s.bodySize ?? 10;
  const font = s.fontFamily ?? undefined;
  const lineHeight = s.bodyLineHeight ?? 1.4;
  const bulletChar = s.bulletChar ?? "•";
  const sectionTop = s.sectionTopInches ?? 0.15;
  const sectionBottom = s.sectionBottomInches ?? 0.1;
  const bulletIndentPx = ((s.bulletIndentInches ?? 0.25) * 96);
  const bulletGapPx = ((s.bulletGapInches ?? 0.05) * 96);
  const nameAlign = s.nameTextAlign ?? "center";
  const titleAlign = s.titleTextAlign ?? "center";
  const contactAlign = s.contactTextAlign ?? "center";

  return (
    <div
      className="bg-white text-gray-900 mx-auto font-serif"
      data-pdf-ready="true"
      style={{
        maxWidth: "7.5in",
        fontFamily: font,
        fontSize: `${bodyPt}pt`,
        lineHeight,
        color: s.bodyColor ?? undefined,
      }}
    >
      <header style={{ textAlign: nameAlign, marginBottom: `${sectionTop}in` }}>
        <h1
          className="font-bold tracking-tight"
          style={{ fontSize: `${namePt}pt`, color: s.nameColor ?? undefined }}
        >
          {profile.name || "Your Name"}
        </h1>
        {profile.title && (
          <p
            className="mt-0.5 font-medium"
            style={{ fontSize: `${titlePt}pt`, color: s.titleColor ?? undefined, textAlign: titleAlign }}
          >
            {profile.title}
          </p>
        )}
        {contact && (
          <p
            className="mt-0.5"
            style={{ fontSize: `${contactPt}pt`, color: s.contactColor ?? undefined, textAlign: contactAlign }}
          >
            {contact}
          </p>
        )}
      </header>

      {profile.summary?.trim() && s.showSummary !== false && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2
            className="font-semibold tracking-[0.18em] border-b border-gray-400 pb-1 mb-1 uppercase"
            style={{ fontSize: `${sectionPt}pt`, color: s.sectionColor ?? undefined }}
          >
            Summary
          </h2>
          <p className="whitespace-pre-line" style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
            {profile.summary.trim().split(/\n/).map((line, i, arr) => (
              <React.Fragment key={i}>
                {renderWithBold(line)}
                {i < arr.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        </section>
      )}

      {experience.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2
            className="font-semibold tracking-[0.18em] border-b border-gray-400 pb-1 mb-1 uppercase"
            style={{ fontSize: `${sectionPt}pt`, color: s.sectionColor ?? undefined }}
          >
            Professional Experience
          </h2>
          <div className="space-y-3.5">
            {experience.map((exp) => (
              <article key={exp.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-semibold" style={{ fontSize: `${bodyPt + 1}pt`, color: s.bodyColor ?? undefined }}>
                    {exp.company || "Company"}
                  </p>
                  {exp.location && (
                    <p style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
                      {exp.location}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-semibold" style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
                    {exp.role || "Role"}
                  </p>
                  <p style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
                    {exp.startDate}{" "}
                    {exp.startDate || exp.endDate ? "\u2013 " : ""}
                    {exp.current ? "Present" : exp.endDate}
                  </p>
                </div>
                {exp.description?.trim() && (
                  <ul className="mt-1 list-none" style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined, paddingLeft: `${bulletIndentPx}px` }}>
                    {exp.description
                      .split(/\r?\n/)
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, idx) => (
                        <li key={idx} className="flex gap-1.5" style={{ marginBottom: `${bulletGapPx}px` }}>
                          <span className="flex-shrink-0">{bulletChar}</span>
                          <span>{renderWithBold(line)}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2
            className="font-semibold tracking-[0.18em] border-b border-gray-400 pb-1 mb-1 uppercase"
            style={{ fontSize: `${sectionPt}pt`, color: s.sectionColor ?? undefined }}
          >
            Education
          </h2>
          <div className="space-y-1.5">
            {education.map((edu) => (
              <div key={edu.id} className="space-y-0.5">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="font-semibold uppercase" style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
                    {edu.school}
                  </p>
                  <p style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
                    {edu.startDate}{" "}
                    {edu.startDate || edu.endDate ? "\u2013 " : ""}
                    {edu.endDate}
                  </p>
                </div>
                <p style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
                  {edu.degree}
                  {edu.field && `, ${edu.field}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section style={{ marginTop: `${sectionTop}in`, marginBottom: `${sectionBottom}in` }}>
          <h2
            className="font-semibold tracking-[0.18em] border-b border-gray-400 pb-1 mb-1 uppercase"
            style={{ fontSize: `${sectionPt}pt`, color: s.sectionColor ?? undefined }}
          >
            Skills &amp; Technologies
          </h2>
          {groupSkillsByCategory(skills).map(({ category, skills: groupSkills }) => (
            <p key={category} className="mt-1" style={{ fontSize: `${bodyPt}pt`, color: s.bodyColor ?? undefined }}>
              <span className="font-semibold" style={{ color: s.sectionColor ?? undefined }}>{category}: </span>
              {groupSkills.map((skill, i) => (
                <React.Fragment key={skill.id}>
                  {i > 0 && ", "}
                  {renderWithBold(skill.name)}
                  {skill.level && <span> ({skill.level})</span>}
                </React.Fragment>
              ))}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
