"use client";

/**
 * Template 4: "Ivory"
 * Warm cream-toned background, soft brown headings,
 * decorative thin double-line dividers, refined serif body.
 * Single-column, sophisticated editorial feel.
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

export const template4Style: ResumeStyle = {};

const BROWN = "#3b2820";
const LIGHT_BROWN = "#6b4c3a";
const CREAM = "#faf7f2";

function DoubleLine() {
  return (
    <div style={{ margin: "12px 0" }}>
      <div style={{ borderTop: `1.5px solid ${BROWN}` }} />
      <div style={{ borderTop: `0.5px solid ${LIGHT_BROWN}`, marginTop: "2px" }} />
    </div>
  );
}

const BULLET_CHAR = "•";

export function Template4({ data, style }: { data: ResumeData; style?: ResumeStyle }) {
  const { profile, experience, education, skills } = data;
  const bulletChar = style?.bulletChar ?? BULLET_CHAR;
  const loc = formatLocation(profile.city, profile.state, profile.location);
  const contactParts = [
    profile.email,
    profile.phone,
    loc,
    profile.linkedin,
    profile.website,
  ].filter(Boolean);
  const contact = contactParts.join("  ·  ");
  const grouped = groupSkillsByCategory(skills);

  const CenteredHeading = ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "2.5px",
        color: BROWN,
        textAlign: "center",
        marginBottom: "10px",
      }}
    >
      {children}
    </h2>
  );

  return (
    <div
      data-pdf-ready="true"
      style={{
        maxWidth: "7.5in",
        margin: "0 auto",
        fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
        color: "#3b2820",
        fontSize: "10.5pt",
        lineHeight: 1.6,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <h1
          style={{
            fontSize: "24pt",
            fontWeight: 400,
            margin: 0,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: BROWN,
          }}
        >
          {profile.name}
        </h1>
        <p
          style={{
            fontSize: "11pt",
            color: LIGHT_BROWN,
            margin: "5px 0 8px",
            fontStyle: "italic",
            letterSpacing: "0.8px",
          }}
        >
          {profile.title}
        </p>
        <p
          style={{
            fontSize: "9pt",
            color: "#8b7b6e",
            margin: 0,
            letterSpacing: "0.3px",
          }}
        >
          {contact}
        </p>
      </div>

      <DoubleLine />

      {/* Summary */}
      {profile.summary && (style?.showSummary !== false) && (
        <>
          <section style={{ marginBottom: "4px" }}>
            <CenteredHeading>Summary</CenteredHeading>
            <p
              style={{
                margin: 0,
                textAlign: "justify",
                color: "#4a3728",
                fontSize: "10.5pt",
              }}
            >
              {renderWithBold(profile.summary)}
            </p>
          </section>
          <DoubleLine />
        </>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <>
          <section style={{ marginBottom: "4px" }}>
            <CenteredHeading>Experience</CenteredHeading>
            {experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: "13px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <strong style={{ fontSize: "11pt", color: "#3b2820" }}>
                    {exp.company}
                  </strong>
                  <span
                    style={{
                      fontSize: "9pt",
                      color: LIGHT_BROWN,
                      fontStyle: "italic",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "10pt",
                    color: LIGHT_BROWN,
                    fontStyle: "italic",
                  }}
                >
                  {exp.role}
                </p>
                <ul style={{ margin: "5px 0 0", paddingLeft: "18px", listStyle: "none" }}>
                  {splitBullets(exp.description).map((b, i) => (
                    <li key={i} style={{ marginBottom: "8px", color: "#4a3728", display: "flex", gap: "6px" }}>
                      <span style={{ flexShrink: 0 }}>{bulletChar}</span>
                      <span style={{ lineHeight: 1.4 }}>{renderWithBold(b)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          <DoubleLine />
        </>
      )}

      {/* Education */}
      {education.length > 0 && (
        <>
          <section style={{ marginBottom: "4px" }}>
            <CenteredHeading>Education</CenteredHeading>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <strong style={{ fontSize: "10.5pt" }}>
                    {edu.school}
                  </strong>
                  <span
                    style={{
                      fontSize: "9pt",
                      color: LIGHT_BROWN,
                      fontStyle: "italic",
                    }}
                  >
                    {edu.startDate} – {edu.endDate}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontStyle: "italic",
                    color: LIGHT_BROWN,
                  }}
                >
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                </p>
                {edu.description && (
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "9.5pt",
                      color: "#7a6a5e",
                    }}
                  >
                    {edu.description}
                  </p>
                )}
              </div>
            ))}
          </section>
          <DoubleLine />
        </>
      )}

      {/* Skills: grouped by category (per TEMPLATE_CONVENTIONS) */}
      {skills.length > 0 && (
        <section>
          <CenteredHeading>Skills</CenteredHeading>
          {grouped.map(({ category, skills: groupSkills }) => (
            <p
              key={category}
              style={{
                margin: "3px 0",
                color: "#3b2820",
                textAlign: "left",
              }}
            >
              <strong>{category}:</strong>{" "}
              {groupSkills.map((s) => s.name).join(" · ")}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
