"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Minus, Plus, Mail, Phone, Home } from "lucide-react";
import { ResumeData } from "@/lib/resume-store";
import { cn } from "@/lib/utils";

const RESUME_PREVIEW_ID = "resume-preview-content";

/** Normalize institution/company names: if the string is ALL CAPS, convert to title case, otherwise keep as-is. */
function normalizeName(name: string | undefined | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  const hasLetters = /[A-Za-z]/.test(trimmed);
  const isAllCaps = hasLetters && trimmed === trimmed.toUpperCase();
  if (!isAllCaps) return trimmed;
  const lower = trimmed.toLowerCase();
  const smallWords = new Set(["of", "the", "and", "for", "in", "on", "at", "to", "a", "an"]);
  return lower
    .split(/\s+/)
    .map((word, idx) => {
      const w = word.toLowerCase();
      if (idx > 0 && smallWords.has(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** US Letter size: 8.5" x 11" = 216mm x 279mm - match real resume PDF */
const RESUME_WIDTH_MM = 216;
const RESUME_MIN_HEIGHT_MM = 279;
const RESUME_PAGE_HEIGHT_MM = 279;

type SectionId = "summary" | "experience" | "skills" | "education";

interface StyleSettings {
  bulletCount?: number;
  bulletLines?: number;
  perExperienceBulletCount?: Record<string, number>;
  showFooter?: boolean;
  footerText?: string;
  // Legacy single padding (used as fallback)
  paddingInches?: number;
  // Detailed margins in inches
  paddingTopInches?: number;
  paddingRightInches?: number;
  paddingBottomInches?: number;
  paddingLeftInches?: number;
  showHeaderDivider?: boolean;
  personalVisibility?: {
    email?: boolean;
    phone?: boolean;
    // Legacy combined address toggle
    address?: boolean;
    // Detailed address toggles
    addressStreet?: boolean;
    addressCity?: boolean;
    addressState?: boolean;
    addressPostal?: boolean;
    birthday?: boolean;
    order?: ("address" | "phone" | "email" | "birthday")[];
  };
  typography?: {
    nameSizePt?: number;
    nameColor?: string;
    nameBold?: boolean;
    nameItalic?: boolean;
    titleSizePt?: number;
    titleColor?: string;
    titleBold?: boolean;
    titleItalic?: boolean;
    contactSizePt?: number;
    contactColor?: string;
    contactBold?: boolean;
    contactItalic?: boolean;
    sectionSizePt?: number;
    sectionColor?: string;
    bodySizePt?: number;
    bodyColor?: string;
  };
  /** Section margin top (inches) */
  sectionTopInches?: number;
  /** Section margin bottom (inches) */
  sectionBottomInches?: number;
  /** Bullet indent (inches) */
  bulletIndentInches?: number;
  /** Bullet vertical gap (inches) */
  bulletGapInches?: number;
  /** Body/sentence line-height multiplier */
  bodyLineHeight?: number;
  /** Show summary section */
  showSummary?: boolean;
  /** Summary area line count */
  summaryLineCount?: number;
  /** Text align for name, title, contact */
  nameTextAlign?: "left" | "center" | "right";
  titleTextAlign?: "left" | "center" | "right";
  contactTextAlign?: "left" | "center" | "right";
  /** Font family for the resume */
  fontFamily?: string;
  /** Section IDs / experience ids / education ids that should start on a new page */
  forcePageBreakBeforeSections?: SectionId[];
  forcePageBreakBeforeExperienceIds?: string[];
  forcePageBreakBeforeEducationIds?: string[];
}

interface ResumePreviewProps {
  data: ResumeData;
  className?: string;
  forPdf?: boolean;
  sectionsOrder?: SectionId[];
  draggableSections?: boolean;
  onChangeSectionsOrder?: (next: SectionId[]) => void;
  styleSettings?: StyleSettings;
  /** When set, header items (name, title, contact) are clickable to show alignment selector */
  onStyleChange?: (patch: Partial<StyleSettings>) => void;
  /** When true, experience bullets are editable text areas with Bold (no font size); use with onExperienceBulletChange */
  editableExperienceBullets?: boolean;
  onExperienceBulletChange?: (expId: string, bulletIndex: number, value: string) => void;
  /** When true and forPdf, this instance gets RESUME_PREVIEW_ID for PDF export (only one should be true to avoid duplicate ids) */
  pdfExportSource?: boolean;
  /** Called when the number of pages (by height) changes, so the container can match PDF page flow */
  onPageCountChange?: (pages: number) => void;
  /** When set, show "New page" toggle on sections/experience/education and call this when user toggles */
  onForcePageBreakChange?: (patch: {
    forcePageBreakBeforeSections?: SectionId[];
    forcePageBreakBeforeExperienceIds?: string[];
    forcePageBreakBeforeEducationIds?: string[];
  }) => void;
  /** When true, do not show the bullet character (●) before each bullet line (e.g. template/PDF-like preview). */
  hideBulletChar?: boolean;
}

/** Parse "text **bold** more" into React nodes (strings and <strong>) */
function renderTextWithBold(text: string): React.ReactNode {
  const parts = (text || "").trim().replace(/^[●\-]\s*/, "").split(/\*\*/);
  if (parts.length === 1) return parts[0];
  return parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p));
}

/** Render multiline text with "Category: rest" – category (before first colon) is bold on each line. */
function renderTextWithCategoryBold(text: string): React.ReactNode {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\n/);
  return (
    <>
      {lines.map((line, i) => {
        const idx = line.indexOf(":");
        if (idx > 0) {
          const category = line.slice(0, idx).trim();
          const rest = line.slice(idx + 1).trimStart();
          return (
            <React.Fragment key={i}>
              <strong>{renderTextWithBold(category)}</strong>
              {rest ? <>: {renderTextWithBold(rest)}</> : ":"}
              {i < lines.length - 1 ? <br /> : null}
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={i}>
            {renderTextWithBold(line)}
            {i < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

/** Same as above but each line as a bullet; optionally show bullet char (●). */
function renderTextWithCategoryBoldAsBullets(text: string, forPdf?: boolean, hideBulletChar?: boolean): React.ReactNode {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\n/).filter((l) => l.trim());
  if (lines.length === 0) return null;
  if (lines.length === 1) return renderTextWithCategoryBold(text);
  return (
    <ul className="list-none space-y-0.5 mt-0">
      {lines.map((line, i) => {
        const idx = line.indexOf(":");
        const content =
          idx > 0 ? (
            <>
              <strong>{renderTextWithBold(line.slice(0, idx).trim())}</strong>
              {line.slice(idx + 1).trimStart() ? (
                <>: {renderTextWithBold(line.slice(idx + 1).trimStart())}</>
              ) : (
                ":"
              )}
            </>
          ) : (
            renderTextWithBold(line)
          );
        return (
          <li
            key={i}
            className="flex gap-1.5"
            style={forPdf ? { breakInside: "avoid" } : undefined}
          >
            {!hideBulletChar && <span className="shrink-0 text-gray-500">●</span>}
            <span>{content}</span>
          </li>
        );
      })}
    </ul>
  );
}

function formatContactLine(
  profile: ResumeData["profile"],
  _visibility?: StyleSettings["personalVisibility"]
): React.ReactNode {
  // Hard-coded layout: Home icon + City, State • Mail icon + email • Phone icon + formatted phone
  const segments: React.ReactNode[] = [];

  if (profile.city || profile.state) {
    const loc: string[] = [];
    if (profile.city) loc.push(profile.city);
    if (profile.state) loc.push(profile.state);
    segments.push(
      <span key="loc" className="inline-flex items-center gap-1">
        <Home className="h-[10px] w-[10px]" />
        <span>{loc.join(", ")}</span>
      </span>
    );
  }

  if (profile.email) {
    segments.push(
      <span key="email" className="inline-flex items-center gap-1">
        <Mail className="h-[10px] w-[10px]" />
        <span>{profile.email}</span>
      </span>
    );
  }

  if (profile.phone) {
    const raw = profile.phone.trim();
    const digits = raw.replace(/\D/g, "");
    let formatted = raw;
    if (digits.length === 10) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith("1")) {
      formatted = `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    segments.push(
      <span key="phone" className="inline-flex items-center gap-1">
        <Phone className="h-[10px] w-[10px]" />
        <span>{formatted}</span>
      </span>
    );
  }

  if (segments.length === 0) return null;

  const withSeparators: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    if (i > 0) {
      withSeparators.push(
        <span key={`sep-${i}`} className="mx-1">
          •
        </span>
      );
    }
    withSeparators.push(seg);
  });

  return <>{withSeparators}</>;
}

function ResumePreviewContent({
  data,
  className,
  forPdf,
  sectionsOrder,
  draggableSections,
  onChangeSectionsOrder,
  styleSettings,
  onStyleChange,
  editableExperienceBullets,
  onExperienceBulletChange,
  pdfExportSource = true,
  onForcePageBreakChange,
  hideBulletChar = false,
}: ResumePreviewProps) {
  const { profile, experience, education, skills } = data;
  const contactLine = formatContactLine(profile, styleSettings?.personalVisibility);
  const [alignAnchor, setAlignAnchor] = useState<"name" | "title" | "contact" | null>(null);
  const alignHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alignShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ALIGN_PANEL_HIDE_DELAY_MS = 400;
  const ALIGN_PANEL_SHOW_DELAY_MS = 250;
  const canEditAlign = Boolean(onStyleChange && !forPdf);
  const focusedTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scheduleAlignHide = (anchor: "name" | "title" | "contact") => {
    if (alignHideTimeoutRef.current) clearTimeout(alignHideTimeoutRef.current);
    alignHideTimeoutRef.current = setTimeout(() => {
      setAlignAnchor((prev) => (prev === anchor ? null : prev));
      alignHideTimeoutRef.current = null;
    }, ALIGN_PANEL_HIDE_DELAY_MS);
  };
  const cancelAlignHide = () => {
    if (alignHideTimeoutRef.current) {
      clearTimeout(alignHideTimeoutRef.current);
      alignHideTimeoutRef.current = null;
    }
  };
  const scheduleAlignShow = (anchor: "name" | "title" | "contact") => {
    if (alignShowTimeoutRef.current) clearTimeout(alignShowTimeoutRef.current);
    alignShowTimeoutRef.current = setTimeout(() => {
      cancelAlignHide();
      setAlignAnchor(anchor);
      alignShowTimeoutRef.current = null;
    }, ALIGN_PANEL_SHOW_DELAY_MS);
  };
  const cancelAlignShow = () => {
    if (alignShowTimeoutRef.current) {
      clearTimeout(alignShowTimeoutRef.current);
      alignShowTimeoutRef.current = null;
    }
  };
  // Default to centered header like the reference resume style
  const nameTextAlign = styleSettings?.nameTextAlign ?? "center";
  const titleTextAlign = styleSettings?.titleTextAlign ?? "center";
  const contactTextAlign = styleSettings?.contactTextAlign ?? "center";

  useEffect(() => {
    if (!alignAnchor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAlignAnchor(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [alignAnchor]);

  const baseOrder: SectionId[] =
    sectionsOrder && sectionsOrder.length
      ? sectionsOrder
      : (["summary", "experience", "skills", "education"] as SectionId[]);
  const showSummarySection = styleSettings?.showSummary ?? true;
  const resolvedOrder: SectionId[] =
    showSummarySection && !baseOrder.includes("summary")
      ? (["summary", ...baseOrder] as SectionId[])
      : baseOrder;

  const [dragSection, setDragSection] = useState<SectionId | null>(null);

  const bulletCount = styleSettings?.bulletCount ?? 3;
  const bulletLines = styleSettings?.bulletLines ?? 2;
  const perExperienceBulletCount = styleSettings?.perExperienceBulletCount ?? {};
  // Page margins (inches). When styleSettings are provided (from the Style page or stored profile),
  // use those; otherwise fall back to sensible defaults matching US Letter recommendations.
  const paddingTopInches =
    styleSettings?.paddingTopInches ??
    styleSettings?.paddingInches ??
    0.7;
  const paddingRightInches =
    styleSettings?.paddingRightInches ??
    styleSettings?.paddingInches ??
    0.5;
  const paddingBottomInches =
    styleSettings?.paddingBottomInches ??
    styleSettings?.paddingInches ??
    0.5;
  const paddingLeftInches =
    styleSettings?.paddingLeftInches ??
    styleSettings?.paddingInches ??
    0.5;
  const sectionTopInches = styleSettings?.sectionTopInches ?? 0.2;
  const sectionBottomInches = styleSettings?.sectionBottomInches ?? 0.15;
  const bulletIndentInches = styleSettings?.bulletIndentInches ?? 0.25;
  // Vertical space between bullets (inches); configurable via styleSettings, default 0.06".
  const bulletGapInches = styleSettings?.bulletGapInches ?? 0.05;
  // Body line-height multiplier; clamp to [1, 2] with default 1.25 for a slightly more open look.
  const bodyLineHeight =
    styleSettings?.bodyLineHeight && styleSettings.bodyLineHeight >= 1 && styleSettings.bodyLineHeight <= 2
      ? styleSettings.bodyLineHeight
      : 1.25;
  const showFooter = styleSettings?.showFooter ?? false;
  const footerText = styleSettings?.footerText ?? "";
  const showHeaderDivider = styleSettings?.showHeaderDivider ?? true;
  const typography = styleSettings?.typography ?? {};

  const sectionSpacingStyle = {
    marginTop: `${sectionTopInches}in`,
    marginBottom: `${sectionBottomInches}in`,
    ...(forPdf ? { breakInside: "avoid" as const } : {}),
  };
  const bulletListStyle = {
    paddingLeft: `${bulletIndentInches}in`,
  };
  const bulletItemGapStyle = {
    marginBottom: `${bulletGapInches}in`,
    ...(forPdf ? { breakInside: "avoid" as const } : {}),
  };
  const bodyLineHeightStyle = { lineHeight: bodyLineHeight };

  const forceSections = styleSettings?.forcePageBreakBeforeSections ?? [];
  const forceExpIds = styleSettings?.forcePageBreakBeforeExperienceIds ?? [];
  const forceEduIds = styleSettings?.forcePageBreakBeforeEducationIds ?? [];
  const canTogglePageBreak = Boolean(onForcePageBreakChange && !forPdf);

  const toggleSectionPageBreak = (id: SectionId) => {
    if (!onForcePageBreakChange) return;
    const next = forceSections.includes(id) ? forceSections.filter((s) => s !== id) : [...forceSections, id];
    onForcePageBreakChange({ forcePageBreakBeforeSections: next });
  };
  const toggleExperiencePageBreak = (expId: string) => {
    if (!onForcePageBreakChange) return;
    const next = forceExpIds.includes(expId) ? forceExpIds.filter((i) => i !== expId) : [...forceExpIds, expId];
    onForcePageBreakChange({ forcePageBreakBeforeExperienceIds: next });
  };
  const toggleEducationPageBreak = (eduId: string) => {
    if (!onForcePageBreakChange) return;
    const next = forceEduIds.includes(eduId) ? forceEduIds.filter((i) => i !== eduId) : [...forceEduIds, eduId];
    onForcePageBreakChange({ forcePageBreakBeforeEducationIds: next });
  };

  const handleSectionDragStart = (id: SectionId, e: React.DragEvent) => {
    if (!draggableSections) return;
    setDragSection(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSectionDragOver = (e: React.DragEvent, overId: SectionId) => {
    if (!draggableSections || !dragSection || dragSection === overId) return;
    if (!onChangeSectionsOrder) return;
    e.preventDefault();
    const base = resolvedOrder;
    const from = base.indexOf(dragSection);
    const to = base.indexOf(overId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...base];
    next.splice(from, 1);
    next.splice(to, 0, dragSection);
    onChangeSectionsOrder(next);
  };

  const handleSectionDragEnd = () => {
    if (!draggableSections) return;
    setDragSection(null);
  };

  const typo = styleSettings?.typography;
  const FormatBar = ({
    anchor,
    currentAlign,
    onAlign,
    onTypography,
  }: {
    anchor: "name" | "title" | "contact";
    currentAlign: "left" | "center" | "right";
    onAlign: (v: "left" | "center" | "right") => void;
    onTypography: (patch: Partial<NonNullable<StyleSettings["typography"]>>) => void;
  }) => {
    const sizePt =
      anchor === "name"
        ? (typo?.nameSizePt ?? 20)
        : anchor === "title"
          ? (typo?.titleSizePt ?? 13)
          : (typo?.contactSizePt ?? 11);
    const color = anchor === "name" ? (typo?.nameColor ?? "#111827") : anchor === "title" ? (typo?.titleColor ?? "#111827") : (typo?.contactColor ?? "#374151");
    const isBold =
      anchor === "name"
        ? (typo?.nameBold ?? true)
        : anchor === "title"
          ? (typo?.titleBold ?? false)
          : (typo?.contactBold ?? false);
    const isItalic =
      anchor === "name"
        ? (typo?.nameItalic ?? false)
        : anchor === "title"
          ? (typo?.titleItalic ?? false)
          : (typo?.contactItalic ?? false);
    const setColor = (v: string) => {
      if (anchor === "name") onTypography({ nameColor: v });
      else if (anchor === "title") onTypography({ titleColor: v });
      else onTypography({ contactColor: v });
    };
    const toggleBold = () => {
      if (anchor === "name") onTypography({ nameBold: !isBold });
      else if (anchor === "title") onTypography({ titleBold: !isBold });
      else onTypography({ contactBold: !isBold });
    };
    const toggleItalic = () => {
      if (anchor === "name") onTypography({ nameItalic: !isItalic });
      else if (anchor === "title") onTypography({ titleItalic: !isItalic });
      else onTypography({ contactItalic: !isItalic });
    };

    const placementStyle: React.CSSProperties =
      currentAlign === "left"
        ? { left: 0 }
        : currentAlign === "right"
          ? { right: 0 }
          : { left: "50%", transform: "translateX(-50%)" };

    return (
      <div
        className="absolute w-fit flex flex-wrap items-center gap-1.5 py-1 px-2 bg-muted/95 border border-border rounded-md shadow-sm z-10"
        style={{ bottom: "100%", marginBottom: 4, ...placementStyle }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => onAlign(align)}
              className={cn(
                "p-0.5 rounded",
                currentAlign === align ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/20"
              )}
              title={align}
              aria-label={`Align ${align}`}
            >
              {align === "left" && <AlignLeft className="h-4 w-4" />}
              {align === "center" && <AlignCenter className="h-4 w-4" />}
              {align === "right" && <AlignRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground mx-0.5">|</span>
        <label className="flex items-center gap-1 text-[11px]">
          <span className="text-muted-foreground">Color</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value || "#111827")}
            className="h-6 w-8 rounded border bg-background p-0 cursor-pointer"
          />
        </label>
        <span className="text-[10px] text-muted-foreground mx-0.5">|</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleBold}
            className={cn(
              "p-0.5 rounded",
              isBold ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/20"
            )}
            title="Bold"
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleItalic}
            className={cn(
              "p-0.5 rounded",
              isItalic ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/20"
            )}
            title="Italic"
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      id={forPdf && pdfExportSource ? RESUME_PREVIEW_ID : undefined}
      className={cn(
        "bg-white text-gray-900 mx-auto shadow-sm font-sans",
        "text-[11pt] leading-snug",
        forPdf && "shadow-none",
        className
      )}
      style={{
        width: `${RESUME_WIDTH_MM}mm`,
        maxWidth: `${RESUME_WIDTH_MM}mm`,
        fontFamily: styleSettings?.fontFamily,
        // Internal padding defines the visual margins for BOTH on-screen preview and PDF.
        // This keeps what you see in the app and what you get in the PDF in sync.
        paddingTop: `${paddingTopInches}in`,
        paddingRight: `${paddingRightInches}in`,
        paddingBottom: `${paddingBottomInches}in`,
        paddingLeft: `${paddingLeftInches}in`,
        ...(forPdf
          ? {
              minHeight: `${RESUME_MIN_HEIGHT_MM}mm`,
              orphans: 2,
              widows: 2,
            }
          : {}),
      }}
    >
      {/* Header */}
      <header className="mb-4 relative">
        <div
          className="relative"
          onClick={() => {
            if (!canEditAlign) return;
            setAlignAnchor((prev) => (prev === "name" ? null : "name"));
          }}
        >
          {alignAnchor === "name" && (
            <FormatBar
              anchor="name"
              currentAlign={nameTextAlign}
              onAlign={(v) => onStyleChange?.({ nameTextAlign: v })}
              onTypography={(patch) => onStyleChange?.({ typography: { ...styleSettings?.typography, ...patch } })}
            />
          )}
          <h1
            className="text-[20pt] leading-tight text-indigo-900 font-serif"
            style={{
              fontSize: `${typography.nameSizePt ?? 20}pt`,
              color: typography.nameColor,
              textAlign: nameTextAlign,
              fontWeight: (typography.nameBold ?? true) ? 700 : 400,
              fontStyle: (typography.nameItalic ?? false) ? "italic" : "normal",
            }}
          >
            {profile.name || "Your Name"}
          </h1>
        </div>
        {profile.title && (
          <div
            className="relative mt-0.5"
            onClick={() => {
              if (!canEditAlign) return;
              setAlignAnchor((prev) => (prev === "title" ? null : "title"));
            }}
          >
            {alignAnchor === "title" && (
              <FormatBar
                anchor="title"
                currentAlign={titleTextAlign}
                onAlign={(v) => onStyleChange?.({ titleTextAlign: v })}
                onTypography={(patch) => onStyleChange?.({ typography: { ...styleSettings?.typography, ...patch } })}
              />
            )}
            <p
              className="text-[14pt] text-gray-800 font-serif"
              style={{
                fontSize: `${typography.titleSizePt ?? 14}pt`,
                color: typography.titleColor,
                textAlign: titleTextAlign,
                fontWeight: (typography.titleBold ?? false) ? 700 : 500,
                fontStyle: (typography.titleItalic ?? false) ? "italic" : "normal",
              }}
            >
              {profile.title}
            </p>
          </div>
        )}
        {contactLine && (
          <div
            className="relative mt-1"
            onClick={() => {
              if (!canEditAlign) return;
              setAlignAnchor((prev) => (prev === "contact" ? null : "contact"));
            }}
          >
            {alignAnchor === "contact" && (
              <FormatBar
                anchor="contact"
                currentAlign={contactTextAlign}
                onAlign={(v) => onStyleChange?.({ contactTextAlign: v })}
                onTypography={(patch) => onStyleChange?.({ typography: { ...styleSettings?.typography, ...patch } })}
              />
            )}
            <p
              className="text-[11pt] text-gray-700"
              style={{
                fontSize: `${typography.contactSizePt ?? 11}pt`,
                color: typography.contactColor,
                textAlign: contactTextAlign,
                fontWeight: (typography.contactBold ?? false) ? 700 : 400,
                fontStyle: (typography.contactItalic ?? false) ? "italic" : "normal",
              }}
            >
              {contactLine}
            </p>
          </div>
        )}
      </header>

      {resolvedOrder.map((section) => {
        if (section === "summary") {
          const showSummary = styleSettings?.showSummary ?? true;
          // Fixed, stable summary: always exactly 3 visual lines high
          const summaryLineCount = 3;
          if (!showSummary) return null;
          const summaryLineHeight = styleSettings?.bodyLineHeight ?? 1.25;
          const summaryHeightEm = summaryLineCount * summaryLineHeight;
          return (
            <section
              key="summary"
              className={cn("group/section", !forPdf && "transition-colors hover:bg-slate-50")}
              style={{
                ...sectionSpacingStyle,
                ...(forPdf && forceSections.includes("summary") ? { pageBreakBefore: "always" as const } : {}),
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {canTogglePageBreak && (
                  <button
                    type="button"
                    onClick={() => toggleSectionPageBreak("summary")}
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded border shrink-0",
                      forceSections.includes("summary")
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    )}
                    title="Start this section on a new page"
                  >
                    New page
                  </button>
                )}
                <h2
                  className={cn(
                    "text-[10pt] font-bold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2 flex-1",
                    !forPdf && "group-hover/section:text-sky-800 group-hover/section:border-sky-400"
                  )}
                  style={{
                    fontSize: `${typography.sectionSizePt ?? 10}pt`,
                    color: typography.sectionColor,
                  }}
                >
                  Summary
                </h2>
              </div>
              <div
                className="text-[10pt] text-gray-700"
                style={{
                  fontSize: `${typography.bodySizePt ?? 10}pt`,
                  color: typography.bodyColor,
                  ...bodyLineHeightStyle,
                  minHeight: `${summaryHeightEm}em`,
                  maxHeight: `${summaryHeightEm}em`,
                  overflow: "hidden",
                }}
              >
                {profile.summary?.trim() ? (
                  (() => {
                    const s = profile.summary.trim();
                    const lineCount = s.split(/\n/).filter((l) => l.trim()).length;
                    return lineCount > 1 ? renderTextWithCategoryBoldAsBullets(s, forPdf, hideBulletChar) : renderTextWithCategoryBold(s);
                  })()
                ) : (
                  <span className="text-gray-400 italic">
                    Optional. Add a short summary in Profile.
                  </span>
                )}
              </div>
            </section>
          );
        }

        if (section === "experience") {
          const placeholderBulletCount = Math.max(1, bulletCount);
          if (experience.length === 0) {
            return (
              <section
                key="experience"
                className="group/section"
                style={sectionSpacingStyle}
                draggable={!!draggableSections}
                onDragStart={(e) => handleSectionDragStart("experience", e)}
                onDragOver={(e) => handleSectionDragOver(e, "experience")}
                onDragEnd={handleSectionDragEnd}
              >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[10pt] font-bold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2 flex-1">
                  Professional Experience
                </h2>
              </div>
                <ul
                  className="mt-1 list-none"
                  style={{
                    fontSize: `${typography.bodySizePt ?? 10}pt`,
                    color: typography.bodyColor,
                    ...bulletListStyle,
                    ...bodyLineHeightStyle,
                  }}
                >
                  {Array.from({ length: placeholderBulletCount }).map((_, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 rounded-md border-2 border-dashed border-gray-400 bg-gray-50 px-2 py-1.5"
                      style={{
                        fontSize: `${typography.bodySizePt ?? 10}pt`,
                        ...bulletItemGapStyle,
                      }}
                    >
                      {!hideBulletChar && <span className="shrink-0 mt-0.5 text-gray-500 leading-[1.25]">●</span>}
                      <div className="flex-1 space-y-0 flex flex-col justify-center">
                        {Array.from({ length: bulletLines }).map((__, j) => (
                          <div
                            key={j}
                            className={cn(
                              "min-h-[1.25em] rounded bg-gray-300 leading-[1.25]",
                              j === 0 ? "w-4/5" : "w-3/5"
                            )}
                            style={{ height: "1.25em" }}
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          if (experience.length > 0) {
            return (
              <section
                key="experience"
                className={cn("group/section", !forPdf && "transition-colors hover:bg-slate-50")}
                style={{
                  ...sectionSpacingStyle,
                  ...(forPdf && forceSections.includes("experience") ? { pageBreakBefore: "always" as const } : {}),
                }}
              >
                <div className="flex items-center justify-between gap-2">
                {canTogglePageBreak && (
                  <button
                    type="button"
                    onClick={() => toggleSectionPageBreak("experience")}
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded border shrink-0",
                      forceSections.includes("experience")
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    )}
                    title="Start this section on a new page"
                  >
                    New page
                  </button>
                )}
                <h2 className={cn("text-[10pt] font-bold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2 flex-1", !forPdf && "group-hover/section:text-sky-800 group-hover/section:border-sky-400")}>
                    Professional Experience
                </h2>
                </div>
                <ul
                  className="mt-0"
                  style={{
                    fontSize: `${typography.bodySizePt ?? 10}pt`,
                    color: typography.bodyColor,
                    listStyle: "none",
                    paddingLeft: 0,
                    ...bodyLineHeightStyle,
                  }}
                >
                  {experience.map((exp) => {
                    const maxBullets = Math.max(
                      1,
                      perExperienceBulletCount[exp.id] ?? bulletCount
                    );
                    const rawLines = exp.description
                      ? exp.description
                          .split(/\n+/)
                          .filter((line) => line.trim())
                      : [];
                    // When hideBulletChar (template preview), show all bullets; otherwise respect maxBullets
                    const bulletLinesForExp = hideBulletChar
                      ? rawLines
                      : rawLines.slice(0, maxBullets);
                    const slotCount = forPdf
                      ? bulletLinesForExp.length
                      : hideBulletChar
                        ? bulletLinesForExp.length
                        : Math.max(1, maxBullets);

                    return (
                      <li
                        key={exp.id}
                        className="space-y-1"
                        style={{
                          marginBottom: "0.25in",
                          ...(forPdf && forceExpIds.includes(exp.id) ? { pageBreakBefore: "always" as const } : {}),
                        }}
                      >
                        <div className="flex justify-between items-baseline gap-2 flex-wrap">
                          {canTogglePageBreak && (
                            <button
                              type="button"
                              onClick={() => toggleExperiencePageBreak(exp.id)}
                              className={cn(
                                "text-[9px] px-1 py-0.5 rounded border shrink-0 self-start",
                                forceExpIds.includes(exp.id)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted"
                              )}
                              title="Start this job on a new page"
                            >
                              New page
                            </button>
                          )}
                          <span className="font-semibold text-[11pt]">{normalizeName(exp.company)}</span>
                          {exp.location && (
                            <span className="text-[10pt] text-gray-600">{exp.location}</span>
                          )}
                        </div>
                        <div className="flex justify-between items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-[10pt]">
                            {(exp.role ?? "").trim() || "Senior Software Engineer"}
                          </span>
                          <span className="text-[10pt] text-gray-600">
                            {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                          </span>
                        </div>
                        {(slotCount > 0 || !forPdf) && (
                          <ul
                            className="mt-1 list-none text-[10pt] text-gray-700"
                            style={{ ...bulletListStyle, ...bodyLineHeightStyle }}
                          >
                            {editableExperienceBullets && onExperienceBulletChange
                              ? (() => {
                                  const rawLines = (exp.description || "").split("\n");
                                  const lines = Array.from(
                                    { length: slotCount },
                                    (_, i) => (rawLines[i] ?? "").trim().replace(/^[●\-]\s*/, "")
                                  );
                                  return lines.map((lineVal, i) => (
                                    <li
                                      key={i}
                                      className="flex gap-1.5 items-start"
                                      style={bulletItemGapStyle}
                                    >
                                      <button
                                        type="button"
                                        className="shrink-0 p-0.5 rounded hover:bg-gray-200 mt-0.5"
                                        title="Bold"
                                        aria-label="Bold"
                                        onClick={() => {
                                          const el = focusedTextareaRef.current;
                                          if (!el || el.getAttribute("data-exp-id") !== exp.id || Number(el.getAttribute("data-bullet-index")) !== i) return;
                                          const v = el.value;
                                          const s = el.selectionStart;
                                          const e = el.selectionEnd;
                                          const newVal = v.slice(0, s) + "**" + v.slice(s, e) + "**" + v.slice(e);
                                          onExperienceBulletChange(exp.id, i, newVal);
                                        }}
                                      >
                                        <Bold className="h-3.5 w-3.5" />
                                      </button>
                                      <textarea
                                        data-exp-id={exp.id}
                                        data-bullet-index={i}
                                        onFocus={(e) => {
                                          focusedTextareaRef.current = e.currentTarget;
                                        }}
                                        value={lineVal}
                                        onChange={(e) => onExperienceBulletChange(exp.id, i, e.target.value)}
                                        className="flex-1 min-w-0 rounded border border-gray-300 bg-white px-1.5 py-0.5 leading-snug resize-y"
                                        style={{
                                          fontSize: `${typography.bodySizePt ?? 10}pt`,
                                          color: typography.bodyColor,
                                        }}
                                        rows={2}
                                      />
                                    </li>
                                  ));
                                })()
                              : Array.from({ length: slotCount }).map((_, i) => {
                                  const line = bulletLinesForExp[i];
                                  const isPlaceholder = !line;
                                  const boxClass = !forPdf
                                    ? "rounded-md border-2 border-dashed border-gray-400 bg-gray-50 px-2 py-1"
                                    : "";

                                  return (
                                    <li
                                      key={i}
                                      className={cn("flex gap-1.5", boxClass)}
                                      style={bulletItemGapStyle}
                                    >
                                      {!hideBulletChar && <span className="shrink-0 text-gray-500">●</span>}
                                      {isPlaceholder ? (
                                        <div
                                          className="flex-1 space-y-0 flex flex-col"
                                          style={{
                                            fontSize: `${typography.bodySizePt ?? 10}pt`,
                                          }}
                                        >
                                          {Array.from({ length: bulletLines }).map((__, j) => (
                                            <div
                                              key={j}
                                              className={cn(
                                                "rounded bg-gray-300 min-h-[1.25em]",
                                                j === 0 ? "w-4/5" : "w-3/5"
                                              )}
                                              style={{ height: "1.25em" }}
                                            />
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="leading-snug">
                                          {renderTextWithBold(line)}
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          }
          return null;
        }

        if (section === "skills") {
          return (
            <section
              key="skills"
              className={cn("group/section", !forPdf && "transition-colors hover:bg-slate-50")}
              style={{
                ...sectionSpacingStyle,
                ...(forPdf && forceSections.includes("skills") ? { pageBreakBefore: "always" as const } : {}),
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {canTogglePageBreak && (
                  <button
                    type="button"
                    onClick={() => toggleSectionPageBreak("skills")}
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded border shrink-0",
                      forceSections.includes("skills")
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    )}
                    title="Start this section on a new page"
                  >
                    New page
                  </button>
                )}
                <h2
                  className={cn("text-[10pt] font-bold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2 flex-1", !forPdf && "group-hover/section:text-sky-800 group-hover/section:border-sky-400")}
                  style={{
                    fontSize: `${typography.sectionSizePt ?? 10}pt`,
                    color: typography.sectionColor,
                  }}
                >
                  Skills
                </h2>
              </div>
              <div
                className="text-[10pt] text-gray-700 space-y-0.5"
                style={{
                  fontSize: `${typography.bodySizePt ?? 10}pt`,
                  color: typography.bodyColor,
                  ...bodyLineHeightStyle,
                }}
              >
                {skills.length === 0 ? (
                  <span className="text-gray-400 italic">
                    Add skills in Profile.
                  </span>
                ) : (
                  (() => {
                    const byCategory = skills.reduce<Record<string, string[]>>((acc, s) => {
                      const cat = s.category?.trim() || "Other";
                      if (!acc[cat]) acc[cat] = [];
                      if (s.name.trim())
                        acc[cat].push(
                          s.name.trim() + (s.level ? ` (${s.level})` : "")
                        );
                      return acc;
                    }, {});
                    const entries = Object.entries(byCategory);
                    if (entries.length === 0)
                      return (
                        <span className="text-gray-400 italic">
                          Add skills in Profile.
                        </span>
                      );
                    return (
                      <>
                        {entries.map(([category, items]) => (
                          <div
                            key={category}
                            className="flex gap-1.5"
                            style={forPdf ? { breakInside: "avoid" } : undefined}
                          >
                            <span className="shrink-0">●</span>
                            <span>
                              <span className="font-medium">{category}:</span>{" "}
                              {items.map((item, i) => (
                                <span key={i}>
                                  {i > 0 && ", "}
                                  {renderTextWithBold(item)}
                                </span>
                              ))}
                            </span>
                          </div>
                        ))}
                      </>
                    );
                  })()
                )}
              </div>
            </section>
          );
        }

        if (section === "education" && education.length > 0) {
          return (
            <section
              key="education"
              className={cn("group/section", !forPdf && "transition-colors hover:bg-slate-50")}
              style={{
                ...sectionSpacingStyle,
                ...(forPdf && forceSections.includes("education") ? { pageBreakBefore: "always" as const } : {}),
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {canTogglePageBreak && (
                  <button
                    type="button"
                    onClick={() => toggleSectionPageBreak("education")}
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded border shrink-0",
                      forceSections.includes("education")
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    )}
                    title="Start this section on a new page"
                  >
                    New page
                  </button>
                )}
                <h2
                  className={cn("text-[10pt] font-bold uppercase tracking-wide text-gray-900 border-b border-gray-300 pb-0.5 mb-2 flex-1", !forPdf && "group-hover/section:text-sky-800 group-hover/section:border-sky-400")}
                  style={{
                    fontSize: `${typography.sectionSizePt ?? 10}pt`,
                    color: typography.sectionColor,
                  }}
                >
                  Education
                </h2>
              </div>
              <ul
                className="space-y-2"
                style={{
                  fontSize: `${typography.bodySizePt ?? 10}pt`,
                  color: typography.bodyColor,
                  ...bodyLineHeightStyle,
                }}
              >
                {education.map((edu) => (
                  <li
                    key={edu.id}
                    style={{
                      ...(forPdf ? { breakInside: "avoid" as const } : {}),
                      ...(forPdf && forceEduIds.includes(edu.id) ? { pageBreakBefore: "always" as const } : {}),
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {canTogglePageBreak && (
                        <button
                          type="button"
                          onClick={() => toggleEducationPageBreak(edu.id)}
                          className={cn(
                            "text-[9px] px-1 py-0.5 rounded border shrink-0",
                            forceEduIds.includes(edu.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-muted"
                          )}
                          title="Start this entry on a new page"
                        >
                          New page
                        </button>
                      )}
                      <p className="font-semibold text-[11pt] text-gray-900">
                        {normalizeName(edu.school)}
                      </p>
                    </div>
                    <div className="flex justify-between items-baseline gap-2 flex-wrap">
                      <span className="text-[10pt] text-gray-800">
                        {edu.degree}
                        {edu.field && `, ${edu.field}`}
                      </span>
                      <span className="text-[10pt] text-gray-600">
                        {edu.startDate} - {edu.endDate}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        }

        return null;
      })}

      {showFooter && (
        <footer className="mt-4 pt-2 border-t border-gray-200 text-[9pt] text-gray-500 text-center">
          {footerText || "Footer"}
        </footer>
      )}
    </div>
  );
}

export function ResumePreview(props: ResumePreviewProps) {
  const [pageCount, setPageCount] = useState(1);
  const measureRef = useRef<HTMLDivElement>(null);
  const onPageCountChangeRef = useRef(props.onPageCountChange);
  onPageCountChangeRef.current = props.onPageCountChange;

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const sync = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const heightMm = (rect.height * RESUME_WIDTH_MM) / rect.width;
      const pages = Math.max(1, Math.ceil(heightMm / RESUME_PAGE_HEIGHT_MM));
      setPageCount((n) => (n !== pages ? pages : n));
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.data, props.styleSettings, props.sectionsOrder]);

  useEffect(() => {
    onPageCountChangeRef.current?.(pageCount);
  }, [pageCount]);

  const measureDivStyle =
    pageCount > 1
      ? {
          position: "absolute" as const,
          top: 0,
          left: 0,
          width: `${RESUME_WIDTH_MM}mm`,
          visibility: "hidden" as const,
          pointerEvents: "none" as const,
          zIndex: -1,
        }
      : undefined;

  return (
    <div style={{ position: "relative" }}>
      <div ref={measureRef} style={measureDivStyle}>
        <ResumePreviewContent {...props} pdfExportSource />
      </div>
      {pageCount > 1 &&
        Array.from({ length: pageCount }).map((_, i) => (
          <div
            key={i}
            style={{
              height: `${RESUME_PAGE_HEIGHT_MM}mm`,
              overflow: "hidden",
              width: `${RESUME_WIDTH_MM}mm`,
              boxSizing: "border-box",
              // Add more visual separation between pages in the on-screen preview
              marginTop: i > 0 ? "1.5rem" : undefined,
              borderTop: i > 0 ? "1px solid #e5e7eb" : undefined,
            }}
          >
            <div
              style={{
                transform: `translateY(-${i * RESUME_PAGE_HEIGHT_MM}mm)`,
              }}
            >
              <ResumePreviewContent {...props} pdfExportSource={false} />
            </div>
          </div>
        ))}
    </div>
  );
}

export { RESUME_PREVIEW_ID };
