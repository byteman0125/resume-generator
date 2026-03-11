export interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  /** When true, use staticBulletContent for this role in application modal / PDF. */
  useStaticBullets?: boolean;
  /** Static bullet text for this role (supports **bold**). Used when useStaticBullets is true. */
  staticBulletContent?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  /** e.g. "Languages", "Frameworks" - for grouped Skills. Will be mandatory; templates must show skills grouped by category with category headers. */
  category?: string;
  level?: string;
}

export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  /** Street address */
  address: string;
  city: string;
  state: string;
  /** ZIP / Postal code */
  postalCode: string;
  /** Legacy single-line location; kept for backward compatibility */
  location: string;
  birthday: string;
  summary: string;
  image?: string;
  linkedin?: string;
  website?: string;
}

export interface ResumeData {
  profile: Profile;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
}

/** Resume style settings stored per profile (DB + localStorage). */
export interface ResumeStyle {
  sectionOrder?: ("summary" | "experience" | "skills" | "education")[];
  bulletCount?: number;
  bulletLines?: number;
  perExperienceBulletCount?: Record<string, number>;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  showHeaderDivider?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showStreet?: boolean;
  showCity?: boolean;
  showState?: boolean;
  showPostal?: boolean;
  showBirthday?: boolean;
  scale?: number;
  personalOrder?: ("address" | "phone" | "email" | "birthday")[];
  nameSize?: number;
  titleSize?: number;
  contactSize?: number;
  sectionSize?: number;
  bodySize?: number;
  nameColor?: string;
  titleColor?: string;
  contactColor?: string;
  sectionColor?: string;
  bodyColor?: string;
  /** Section spacing (inches): margin above each section */
  sectionTopInches?: number;
  /** Section spacing (inches): margin below each section */
  sectionBottomInches?: number;
  /** Bullet list: left indent in inches */
  bulletIndentInches?: number;
  /** Bullet list: vertical gap between items in inches */
  bulletGapInches?: number;
  /** Body/bullet text: line-height multiplier (e.g. 1.25) */
  bodyLineHeight?: number;
  /** Show summary section on resume */
  showSummary?: boolean;
  /** Summary area line count (height in lines) */
  summaryLineCount?: number;
  /** Text align for name */
  nameTextAlign?: "left" | "center" | "right";
  /** Text align for title */
  titleTextAlign?: "left" | "center" | "right";
  /** Text align for contact line */
  contactTextAlign?: "left" | "center" | "right";
  /** Name: bold toggle */
  nameBold?: boolean;
  /** Name: italic toggle */
  nameItalic?: boolean;
  /** Title: bold toggle */
  titleBold?: boolean;
  /** Title: italic toggle */
  titleItalic?: boolean;
  /** Contact: bold toggle */
  contactBold?: boolean;
  /** Contact: italic toggle */
  contactItalic?: boolean;
  /** Section IDs that should start on a new page (e.g. ["skills"] = Skills section starts on next page) */
  forcePageBreakBeforeSections?: ("summary" | "experience" | "skills" | "education")[];
  /** Experience entry IDs that should start on a new page */
  forcePageBreakBeforeExperienceIds?: string[];
  /** Education entry IDs that should start on a new page */
  forcePageBreakBeforeEducationIds?: string[];
  /** Font family for the resume (e.g. "Georgia, serif" or "'Helvetica Neue', sans-serif") */
  fontFamily?: string;
  /** Bullet character for lists (e.g. "●", "•", "-") */
  bulletChar?: string;
}

/**
 * Default resume style when none is chosen.
 * The template (and style) for applications can be chosen by the user (e.g. in the Apply modal);
 * callers should pass the selected template's style when generating the application PDF.
 */
export const APPLICATION_RESUME_STYLE: ResumeStyle = {};

/** Style settings for resume display and print when using the default style. */
export function getApplicationResumeStyleSettings(style?: ResumeStyle): ResumePreviewStyleSettings {
  return styleSettingsFromStyle(style ?? APPLICATION_RESUME_STYLE);
}

/** Profile document as stored in DB (resume content + optional style). */
export type StoredProfileData = ResumeData & { style?: ResumeStyle };

/**
 * Style settings shape for ResumePreview (margins, typography, section order, etc.).
 * Built from StoredProfileData.style so templates and modals use the same look.
 */
export interface ResumePreviewStyleSettings {
  sectionOrder?: ("summary" | "experience" | "skills" | "education")[];
  bulletCount?: number;
  bulletLines?: number;
  perExperienceBulletCount?: Record<string, number>;
  showSummary?: boolean;
  summaryLineCount?: number;
  paddingTopInches?: number;
  paddingRightInches?: number;
  paddingBottomInches?: number;
  paddingLeftInches?: number;
  sectionTopInches?: number;
  sectionBottomInches?: number;
  bulletIndentInches?: number;
  bulletGapInches?: number;
  bodyLineHeight?: number;
  showHeaderDivider?: boolean;
  personalVisibility?: {
    order?: ("address" | "phone" | "email" | "birthday")[];
    email?: boolean;
    phone?: boolean;
    addressStreet?: boolean;
    addressCity?: boolean;
    addressState?: boolean;
    addressPostal?: boolean;
    birthday?: boolean;
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
  nameTextAlign?: "left" | "center" | "right";
  titleTextAlign?: "left" | "center" | "right";
  contactTextAlign?: "left" | "center" | "right";
  fontFamily?: string;
}

/** Build styleSettings for ResumePreview from a ResumeStyle (used by template files). */
export function styleSettingsFromStyle(style: ResumeStyle): ResumePreviewStyleSettings {
  const s = style;
  return {
    sectionOrder: s.sectionOrder,
    bulletCount: s.bulletCount,
    bulletLines: s.bulletLines,
    perExperienceBulletCount: s.perExperienceBulletCount,
    showSummary: s.showSummary,
    summaryLineCount: s.summaryLineCount,
    paddingTopInches: s.paddingTop,
    paddingRightInches: s.paddingRight,
    paddingBottomInches: s.paddingBottom,
    paddingLeftInches: s.paddingLeft,
    sectionTopInches: s.sectionTopInches,
    sectionBottomInches: s.sectionBottomInches,
    bulletIndentInches: s.bulletIndentInches,
    bulletGapInches: s.bulletGapInches,
    bodyLineHeight: s.bodyLineHeight,
    showHeaderDivider: s.showHeaderDivider,
    personalVisibility: s.personalOrder
      ? {
          order: s.personalOrder,
          email: s.showEmail,
          phone: s.showPhone,
          addressStreet: s.showStreet,
          addressCity: s.showCity,
          addressState: s.showState,
          addressPostal: s.showPostal,
          birthday: s.showBirthday,
        }
      : undefined,
    typography: {
      nameSizePt: s.nameSize,
      nameColor: s.nameColor,
      nameBold: s.nameBold,
      nameItalic: s.nameItalic,
      titleSizePt: s.titleSize,
      titleColor: s.titleColor,
      titleBold: s.titleBold,
      titleItalic: s.titleItalic,
      contactSizePt: s.contactSize,
      contactColor: s.contactColor,
      contactBold: s.contactBold,
      contactItalic: s.contactItalic,
      sectionSizePt: s.sectionSize,
      sectionColor: s.sectionColor,
      bodySizePt: s.bodySize,
      bodyColor: s.bodyColor,
    },
    nameTextAlign: s.nameTextAlign,
    titleTextAlign: s.titleTextAlign,
    contactTextAlign: s.contactTextAlign,
    fontFamily: s.fontFamily,
  };
}

/** Convert a partial ResumePreviewStyleSettings patch (e.g. from UI) to Partial<ResumeStyle> for saving. */
export function resumeStyleFromSettingsPatch(
  patch: Partial<ResumePreviewStyleSettings>
): Partial<ResumeStyle> {
  const t = patch.typography;
  const out: Partial<ResumeStyle> = {};
  if (patch.sectionOrder != null) out.sectionOrder = patch.sectionOrder;
  if (patch.bulletCount != null) out.bulletCount = patch.bulletCount;
  if (patch.bulletLines != null) out.bulletLines = patch.bulletLines;
  if (patch.perExperienceBulletCount != null) out.perExperienceBulletCount = patch.perExperienceBulletCount;
  if (patch.showSummary != null) out.showSummary = patch.showSummary;
  if (patch.summaryLineCount != null) out.summaryLineCount = patch.summaryLineCount;
  if (patch.paddingTopInches != null) out.paddingTop = patch.paddingTopInches;
  if (patch.paddingRightInches != null) out.paddingRight = patch.paddingRightInches;
  if (patch.paddingBottomInches != null) out.paddingBottom = patch.paddingBottomInches;
  if (patch.paddingLeftInches != null) out.paddingLeft = patch.paddingLeftInches;
  if (patch.sectionTopInches != null) out.sectionTopInches = patch.sectionTopInches;
  if (patch.sectionBottomInches != null) out.sectionBottomInches = patch.sectionBottomInches;
  if (patch.bulletIndentInches != null) out.bulletIndentInches = patch.bulletIndentInches;
  if (patch.bulletGapInches != null) out.bulletGapInches = patch.bulletGapInches;
  if (patch.bodyLineHeight != null) out.bodyLineHeight = patch.bodyLineHeight;
  if (patch.showHeaderDivider != null) out.showHeaderDivider = patch.showHeaderDivider;
  if (patch.personalVisibility != null) {
    out.personalOrder = patch.personalVisibility.order;
    if (patch.personalVisibility.email != null) out.showEmail = patch.personalVisibility.email;
    if (patch.personalVisibility.phone != null) out.showPhone = patch.personalVisibility.phone;
    if (patch.personalVisibility.addressStreet != null) out.showStreet = patch.personalVisibility.addressStreet;
    if (patch.personalVisibility.addressCity != null) out.showCity = patch.personalVisibility.addressCity;
    if (patch.personalVisibility.addressState != null) out.showState = patch.personalVisibility.addressState;
    if (patch.personalVisibility.addressPostal != null) out.showPostal = patch.personalVisibility.addressPostal;
    if (patch.personalVisibility.birthday != null) out.showBirthday = patch.personalVisibility.birthday;
  }
  if (t) {
    if (t.nameSizePt != null) out.nameSize = t.nameSizePt;
    if (t.nameColor != null) out.nameColor = t.nameColor;
    if (t.nameBold != null) out.nameBold = t.nameBold;
    if (t.nameItalic != null) out.nameItalic = t.nameItalic;
    if (t.titleSizePt != null) out.titleSize = t.titleSizePt;
    if (t.titleColor != null) out.titleColor = t.titleColor;
    if (t.titleBold != null) out.titleBold = t.titleBold;
    if (t.titleItalic != null) out.titleItalic = t.titleItalic;
    if (t.contactSizePt != null) out.contactSize = t.contactSizePt;
    if (t.contactColor != null) out.contactColor = t.contactColor;
    if (t.contactBold != null) out.contactBold = t.contactBold;
    if (t.contactItalic != null) out.contactItalic = t.contactItalic;
    if (t.sectionSizePt != null) out.sectionSize = t.sectionSizePt;
    if (t.sectionColor != null) out.sectionColor = t.sectionColor;
    if (t.bodySizePt != null) out.bodySize = t.bodySizePt;
    if (t.bodyColor != null) out.bodyColor = t.bodyColor;
  }
  if (patch.nameTextAlign != null) out.nameTextAlign = patch.nameTextAlign;
  if (patch.titleTextAlign != null) out.titleTextAlign = patch.titleTextAlign;
  if (patch.contactTextAlign != null) out.contactTextAlign = patch.contactTextAlign;
  if (patch.fontFamily != null) out.fontFamily = patch.fontFamily;
  return out;
}

/** Build styleSettings for ResumePreview from stored profile style (modal, templates, print). */
export function styleSettingsFromStored(
  data: ResumeData | StoredProfileData | null | undefined
): ResumePreviewStyleSettings | undefined {
  const s = (data as StoredProfileData | undefined)?.style;
  if (!s) return undefined;
  return styleSettingsFromStyle(s);
}

const defaultProfile: Profile = {
  name: "",
  title: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  location: "",
  birthday: "",
  summary: "",
  image: "",
  linkedin: "",
  website: "",
};

export const defaultResumeData: ResumeData = {
  profile: defaultProfile,
  experience: [],
  education: [],
  skills: [],
};

/**
 * Sample resume data for template preview (Templates page).
 *
 * To update bullet content for the sample resume:
 * - Experience bullets: edit each experience's `description` in the array below.
 * - One line = one bullet. Use newline (\n) to separate bullets.
 * - Optional: start a line with **Category**: to show the category in bold (e.g. "**Backend**: Text here").
 * - Summary: edit `profile.summary`; multiple lines become bullets when there is more than one line.
 */
export const sampleResumeData: ResumeData = {
  profile: {
    ...defaultProfile,
    name: "Alex Chen",
    title: "Senior Software Engineer",
    email: "alex.chen@email.com",
    phone: "(555) 123-4567",
    city: "San Francisco",
    state: "CA",
    postalCode: "94102",
    location: "San Francisco, CA",
    summary:
      "Senior Software Engineer with 10+ years of hands-on expertise architecting scalable full-stack systems, AI integrations, and high-availability platforms at Amazon Prime and Intel, delivering multimillion-dollar impact through performance optimization, retention growth, and operational excellence across distributed global teams.",
  },
  experience: [
    {
      id: "sample-exp-1",
      company: "Stripe",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2020/01",
      endDate: "Present",
      current: true,
      description:
        "Led the development of critical features for Stripe's Payments API, processing billions in transaction volume annually.\nArchitected resilient Ruby and Kafka microservices that reduced payment processing latency by 40% across distributed regions.\nIntegrated Amazon Bedrock to automate accounts payable workflows, saving finance teams over 20,000 manual review hours annually.\nEngineered an internal AI chatbot using GraphQL and React that resolved 75% of common support queries instantly for global teams.\nRevamped the TypeScript and React based dashboard for Stripe Radar, slashing fraud rule configuration time by 30% for users.\nOptimized cloud infrastructure on AWS and Kubernetes, achieving 99.99% availability for critical payment orchestration services.\nSpearheaded a new GraphQL API layer that unified fragmented data sources, cutting response times by 50% for mobile clients.\nBuilt real-time Kafka and Flink data pipelines to deliver actionable revenue analytics to over 5,000 enterprise businesses.\nOrchestrated asynchronous collaboration across timezones to deliver a seamless Stripe Connect onboarding flow for global platforms.\nChampioned technical excellence through rigorous code reviews and mentorship, boosting team velocity by 15% within six months.",
    },
    {
      id: "sample-exp-2",
      company: "Amazon",
      role: "Software Engineer",
      location: "Seattle, WA",
      startDate: "2017/06",
      endDate: "2019/12",
      current: false,
      description:
        "Spearheaded a microservices migration using Java and AWS Lambda, processing over 1 million daily inventory updates with 99.99% availability.\nIntegrated an AI automation layer via Amazon Bedrock to triage and resolve 40% of common backend service alerts autonomously.\nEngineered a generative AI chatbot for internal teams using LangChain, reducing incident response time by 30% across distributed teams.\nModernized legacy vendor portal frontend with React and TypeScript, improving buyer task completion rates by 25% through streamlined UX.\nArchitected a highly scalable event-driven data pipeline with Kafka and Spark, enabling real-time analytics on 500TB of streaming data.\nDesigned and optimized high-throughput RESTful APIs for Prime Video recommendations, consistently handling 10,000 requests per second under peak load.\nBuilt a cloud-native service on AWS leveraging DynamoDB and Lambda, cutting infrastructure costs by 35% while maintaining sub-100ms latency.",
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      school: "State University",
      degree: "Bachelors Degree",
      field: "Computer Science",
      startDate: "2013",
      endDate: "2017",
    },
  ],
  skills: [
    { id: "sample-skill-1", name: "TypeScript", category: "Languages" },
    { id: "sample-skill-2", name: "JavaScript", category: "Languages" },
    { id: "sample-skill-3", name: "Python", category: "Languages" },
    { id: "sample-skill-4", name: "Java", category: "Languages" },
    { id: "sample-skill-5", name: "React", category: "Frameworks" },
    { id: "sample-skill-6", name: "Next.js", category: "Frameworks" },
    { id: "sample-skill-7", name: "Node.js", category: "Backend" },
    { id: "sample-skill-8", name: "GraphQL", category: "Backend" },
    { id: "sample-skill-9", name: "REST APIs", category: "Backend" },
    { id: "sample-skill-10", name: "PostgreSQL", category: "Databases" },
    { id: "sample-skill-11", name: "Redis", category: "Databases" },
    { id: "sample-skill-12", name: "DynamoDB", category: "Databases" },
    { id: "sample-skill-13", name: "AWS", category: "Cloud" },
    { id: "sample-skill-14", name: "Kubernetes", category: "Cloud" },
    { id: "sample-skill-15", name: "Docker", category: "Cloud" },
    { id: "sample-skill-16", name: "Kafka", category: "Tools" },
    { id: "sample-skill-17", name: "Git", category: "Tools" },
    { id: "sample-skill-18", name: "CI/CD", category: "Tools" },
  ],
};

export function createId(): string {
  return Math.random().toString(36).slice(2, 11);
}
