import { NextResponse } from "next/server";
import { listProfiles, createProfile, reorderProfiles, getProfile, type ProfileRow } from "@/lib/db";
import { requireActiveUser } from "@/lib/auth";
import { defaultResumeData, type ResumeData } from "@/lib/resume-store";

function formatPeriod(start: string, end: string, current: boolean): string {
  if (!start && !end) return "";
  if (current || !end) return start ? `${start} – Present` : "Present";
  return [start, end].filter(Boolean).join(" – ");
}

function profileSummary(row: ProfileRow) {
  let data: ResumeData | null = null;
  try {
    data = JSON.parse(row.data) as ResumeData;
  } catch {
    return { experience: [], education: [] };
  }
  const profile = data?.profile;
  const experience = Array.isArray(data?.experience) ? data.experience : [];
  const education = Array.isArray(data?.education) ? data.education : [];
  const address = (profile?.address ?? "").trim();
  const city = (profile?.city ?? "").trim();
  const state = (profile?.state ?? "").trim();
  const postalCode = (profile?.postalCode ?? "").trim();
  return {
    title: profile?.title?.trim() || undefined,
    email: profile?.email?.trim() || undefined,
    location: profile?.location?.trim() || undefined,
    address: address || undefined,
    city: city || undefined,
    state: state || undefined,
    postalCode: postalCode || undefined,
    phone: profile?.phone?.trim() || undefined,
    birthday: profile?.birthday?.trim() || undefined,
    linkedin: profile?.linkedin?.trim() || undefined,
    experience: experience.map((e: { company?: string; startDate?: string; endDate?: string; current?: boolean }) => ({
      company: (e.company ?? "").trim() || "—",
      period: formatPeriod(e.startDate ?? "", e.endDate ?? "", !!e.current),
    })),
    education: education.map((e: { school?: string; degree?: string; field?: string }) => ({
      school: (e.school ?? "").trim() || "—",
      degree: [e.degree, e.field].filter(Boolean).join(e.degree && e.field ? " in " : "").trim() || "—",
    })),
  };
}

export async function GET(request: Request) {
  try {
    const r = requireActiveUser(request);
    if (r.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (r.status === 403) return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    const user = r.user;
    const profiles =
      user.role === "admin"
        ? listProfiles()
        : user.assigned_profile_id
          ? (() => {
              const p = getProfile(user.assigned_profile_id);
              return p ? [p] : [];
            })()
          : [];
    return NextResponse.json(
      profiles.map((p) => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        updated_at: p.updated_at,
        ...profileSummary(p),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list profiles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const r = requireActiveUser(request);
    if (r.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (r.status === 403) return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    const user = r.user;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() || "Untitled" : "Untitled";
    const profile = createProfile(name, body.data ?? defaultResumeData);
    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const r = requireActiveUser(request);
    if (r.status === 401) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (r.status === 403) return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    const user = r.user;
    const body = await request.json();
    const orderedIds = body?.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.some((id: unknown) => typeof id !== "string")) {
      return NextResponse.json({ error: "orderedIds must be an array of strings" }, { status: 400 });
    }
    reorderProfiles(orderedIds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to reorder profiles" }, { status: 500 });
  }
}
