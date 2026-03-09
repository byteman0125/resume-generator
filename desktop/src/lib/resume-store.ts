export interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
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
  category?: string;
  level?: string;
}

export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
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
  sectionTopInches?: number;
  sectionBottomInches?: number;
  bulletIndentInches?: number;
  bulletGapInches?: number;
  bodyLineHeight?: number;
  showSummary?: boolean;
  summaryLineCount?: number;
  nameTextAlign?: "left" | "center" | "right";
  titleTextAlign?: "left" | "center" | "right";
  contactTextAlign?: "left" | "center" | "right";
  nameBold?: boolean;
  nameItalic?: boolean;
  titleBold?: boolean;
  titleItalic?: boolean;
  contactBold?: boolean;
  contactItalic?: boolean;
  forcePageBreakBeforeSections?: ("summary" | "experience" | "skills" | "education")[];
  forcePageBreakBeforeExperienceIds?: string[];
  forcePageBreakBeforeEducationIds?: string[];
  fontFamily?: string;
  bulletChar?: string;
}

export const APPLICATION_RESUME_STYLE: ResumeStyle = {};

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

export function getApplicationResumeStyleSettings(style?: ResumeStyle): ResumePreviewStyleSettings {
  return styleSettingsFromStyle(style ?? APPLICATION_RESUME_STYLE);
}

export type StoredProfileData = ResumeData & { style?: ResumeStyle };

export function styleSettingsFromStored(
  data: ResumeData | StoredProfileData | null | undefined
): ResumePreviewStyleSettings | undefined {
  const s = (data as StoredProfileData | undefined)?.style;
  if (!s) return undefined;
  return styleSettingsFromStyle(s);
}

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
    summary: "Senior Software Engineer with 10+ years of hands-on expertise.",
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
      description: "Led development of critical features.",
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
    { id: "sample-skill-2", name: "React", category: "Frameworks" },
  ],
};

export function createId(): string {
  return Math.random().toString(36).slice(2, 11);
}
