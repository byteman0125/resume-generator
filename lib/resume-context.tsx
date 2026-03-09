"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { defaultResumeData, type ResumeData, type StoredProfileData } from "@/lib/resume-store";

export interface ProfileMeta {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** From profile data, for card preview */
  title?: string;
  email?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  birthday?: string;
  linkedin?: string;
  experience?: { company: string; period: string }[];
  education?: { school: string; degree: string }[];
}

interface ResumeContextValue {
  /** Current resume data (in memory); may include style for editor/PDF */
  data: StoredProfileData;
  setData: (data: StoredProfileData | ((prev: StoredProfileData) => StoredProfileData)) => void;
  /** List of saved profiles from DB */
  profiles: ProfileMeta[];
  /** Currently selected profile id, or null if editing unsaved/new */
  currentProfileId: string | null;
  /** Active profile id (loads when app starts) */
  activeProfileId: string | null;
  /** Set which profile is active (used on next app start) */
  setActiveProfile: (id: string | null) => Promise<void>;
  /** Switch to a saved profile (loads from API) */
  switchProfile: (id: string | null) => Promise<void>;
  /** Create a new profile. If initialData is provided, use it (e.g. empty); else use current data. */
  createProfile: (name?: string, initialData?: StoredProfileData) => Promise<ProfileMeta>;
  /** Update current profile name */
  renameProfile: (id: string, name: string) => Promise<void>;
  /** Delete a profile */
  deleteProfile: (id: string) => Promise<void>;
  /** Refresh profile list from API */
  refreshProfiles: () => Promise<void>;
  /** Reorder profiles by id list; then refresh. */
  reorderProfiles: (orderedIds: string[]) => Promise<void>;
  loading: boolean;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

async function fetchProfiles(): Promise<ProfileMeta[]> {
  const res = await fetch("/api/profiles");
  if (!res.ok) throw new Error("Failed to fetch profiles");
  return res.json();
}

async function fetchProfileData(id: string): Promise<StoredProfileData> {
  const res = await fetch(`/api/profiles/${id}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  const json = await res.json();
  return json.data as StoredProfileData;
}

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<StoredProfileData>(defaultResumeData);
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    try {
      const list = await fetchProfiles();
      setProfiles(list);
    } catch (e) {
      console.error(e);
      setProfiles([]);
    }
  }, []);

  const reorderProfiles = useCallback(
    async (orderedIds: string[]) => {
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder profiles");
      await refreshProfiles();
    },
    [refreshProfiles]
  );

  const setActiveProfile = useCallback(async (id: string | null) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeProfileId: id }),
    });
    if (!res.ok) throw new Error("Failed to set active profile");
    setActiveProfileIdState(id);
  }, []);

  const switchProfile = useCallback(async (id: string | null) => {
    if (id === null) {
      setCurrentProfileId(null);
      setDataState(defaultResumeData);
      return;
    }
    setLoading(true);
    try {
      const profileData = await fetchProfileData(id);
      setCurrentProfileId(id);
      setDataState(profileData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = useCallback(
    async (name = "Untitled", initialData?: StoredProfileData): Promise<ProfileMeta> => {
      const payload = initialData ?? data;
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data: payload }),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      const created = await res.json();
      await refreshProfiles();
      setCurrentProfileId(created.id);
      setDataState(payload);
      return created;
    },
    [data, refreshProfiles]
  );

  const saveCurrent = useCallback(
    async (newData: StoredProfileData) => {
      if (!currentProfileId) return;
      const res = await fetch(`/api/profiles/${currentProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newData }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      // Don't refresh profile list on data save; list only changes on create/rename/delete
    },
    [currentProfileId]
  );

  const setData = useCallback(
    (arg: StoredProfileData | ((prev: StoredProfileData) => StoredProfileData)) => {
      setDataState((prev) => {
        const next = typeof arg === "function" ? arg(prev) : arg;
        if (currentProfileId) {
          saveCurrent(next).catch(console.error);
        }
        return next;
      });
    },
    [currentProfileId, saveCurrent]
  );

  const renameProfile = useCallback(async (id: string, name: string) => {
    const res = await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) throw new Error("Failed to rename");
    await refreshProfiles();
  }, [refreshProfiles]);

  const deleteProfile = useCallback(
    async (id: string) => {
      await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      await refreshProfiles();
      if (currentProfileId === id) {
        setCurrentProfileId(null);
        setDataState(defaultResumeData);
      }
      if (activeProfileId === id) {
        setActiveProfile(null).catch(console.error);
        setActiveProfileIdState(null);
      }
    },
    [currentProfileId, activeProfileId, refreshProfiles, setActiveProfile]
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [listRes, settingsRes] = await Promise.all([
          fetch("/api/profiles"),
          fetch("/api/settings"),
        ]);
        if (cancelled) return;
        const list = listRes.ok ? await listRes.json() : [];
        setProfiles(list);
        const settings = settingsRes.ok ? await settingsRes.json() : {};
        const activeId = settings.activeProfileId ?? null;
        setActiveProfileIdState(activeId);
        if (activeId && list.some((p: ProfileMeta) => p.id === activeId)) {
          const dataRes = await fetch(`/api/profiles/${activeId}`);
          if (cancelled) return;
          if (dataRes.ok) {
            const json = await dataRes.json();
            setCurrentProfileId(activeId);
            setDataState(json.data as StoredProfileData);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: ResumeContextValue = {
    data,
    setData,
    profiles,
    currentProfileId,
    activeProfileId,
    setActiveProfile,
    switchProfile,
    createProfile,
    renameProfile,
    deleteProfile,
    refreshProfiles,
    reorderProfiles,
    loading,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume must be used within ResumeProvider");
  return ctx;
}
