"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResume } from "@/lib/resume-context";
import { defaultResumeData } from "@/lib/resume-store";
import { Pencil, Star, Mail, MapPin, Phone, Calendar, Briefcase, GraduationCap, GripVertical, Plus, Loader2, Trash2, Move, Linkedin, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileEditModal } from "@/components/profile-edit-modal";
import { motion } from "framer-motion";

function CopyableLine({
  text,
  copyKey,
  copiedKey,
  onCopy,
  className,
}: {
  text: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onCopy(text, copyKey);
      }}
      className={cn(
        "w-full text-left rounded-md px-2 py-1 -mx-2 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground",
        className
      )}
      title="Click to copy"
    >
      {text}
      {copiedKey === copyKey && (
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1.5 shrink-0" aria-hidden />
      )}
    </button>
  );
}

export default function ProfilePage() {
  const {
    data,
    setData,
    currentProfileId,
    activeProfileId,
    setActiveProfile,
    profiles,
    switchProfile,
    reorderProfiles,
    createProfile,
    deleteProfile,
  } = useResume();
  const [settingActive, setSettingActive] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; profileId: string } | null>(null);
  const [sectionOrder, setSectionOrder] = useState<Array<"summary" | "experience" | "skills" | "education">>(() => {
    if (typeof window === "undefined") return ["summary", "experience", "skills", "education"];
    try {
      const raw = window.localStorage.getItem("resumeSectionOrder");
      if (!raw) return ["summary", "experience", "skills", "education"];
      const parsed = JSON.parse(raw) as Array<"summary" | "experience" | "skills" | "education">;
      const valid = parsed.filter((s) => s === "summary" || s === "experience" || s === "skills" || s === "education");
      const base: Array<"summary" | "experience" | "skills" | "education"> = ["summary", "experience", "skills", "education"];
      return base.filter((s) => valid.includes(s)).concat(base.filter((s) => !valid.includes(s)));
    } catch {
      return ["summary", "experience", "skills", "education"];
    }
  });
  const dragGhostRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("resumeSectionOrder", JSON.stringify(sectionOrder));
    } catch {
      // ignore
    }
  }, [sectionOrder]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("resumeSectionOrder", JSON.stringify(sectionOrder));
    } catch {
      // ignore
    }
  }, [sectionOrder]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";

    const card = (e.currentTarget as HTMLElement).closest("[data-profile-card]") as HTMLElement | null;
    if (card) {
      const ghost = card.cloneNode(true) as HTMLElement;
      ghost.setAttribute("data-drag-ghost", "true");
      ghost.style.position = "fixed";
      ghost.style.left = "-9999px";
      ghost.style.top = "0";
      ghost.style.width = `${card.offsetWidth}px`;
      ghost.style.height = `${card.offsetHeight}px`;
      ghost.style.overflow = "hidden";
      ghost.style.pointerEvents = "none";
      ghost.style.opacity = "0.9";
      ghost.style.transform = "rotate(2deg)";
      ghost.style.boxShadow = "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)";
      ghost.style.zIndex = "9999";
      document.body.appendChild(ghost);
      dragGhostRef.current = ghost;

      const rect = card.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
    }
  };

  const handleDragEnd = () => {
    if (dragGhostRef.current?.parentNode) {
      dragGhostRef.current.parentNode.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingId && draggingId !== id) setDropTargetId(id);
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    setDraggingId(null);
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;
    const ids = profiles.map((p) => p.id);
    const fromIdx = ids.indexOf(sourceId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = [...ids];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, sourceId);
    reorderProfiles(next).catch(console.error);
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    const oneLine = text.replace(/\s+/g, " ").trim();
    const doCopy = () => {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(oneLine).then(
          () => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
          },
          () => fallbackCopy(oneLine, key)
        );
      } else {
        fallbackCopy(oneLine, key);
      }
    };
    const fallbackCopy = (str: string, k: string) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = str;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedKey(k);
        setTimeout(() => setCopiedKey(null), 1500);
      } catch {
        setCopiedKey(k);
        setTimeout(() => setCopiedKey(null), 1500);
      }
    };
    doCopy();
  };

  const handleSetActive = async (id: string) => {
    setSettingActive(id);
    try {
      await setActiveProfile(id);
      await switchProfile(id);
    } catch (e) {
      console.error(e);
    } finally {
      setSettingActive(null);
    }
  };

  const openEditForProfile = async (id: string) => {
    await switchProfile(id);
    setEditModalOpen(true);
  };

  const [dragSection, setDragSection] = useState<"summary" | "experience" | "skills" | "education" | null>(null);

  const handleSectionDragStart = (id: "summary" | "experience" | "skills" | "education") => {
    setDragSection(id);
  };

  const handleSectionDragOver = (e: React.DragEvent, overId: "summary" | "experience" | "skills" | "education") => {
    e.preventDefault();
    if (!dragSection || dragSection === overId) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragSection);
      const to = next.indexOf(overId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragSection);
      return next;
    });
  };

  const handleSectionDragEnd = () => {
    setDragSection(null);
  };

  const handleContextMenu = (e: React.MouseEvent, profileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, profileId });
  };

  const handleRemoveProfile = async (profileId: string) => {
    setContextMenu(null);
    const profileName = profiles.find((p) => p.id === profileId)?.name ?? "this profile";
    if (!confirm(`Remove "${profileName}"? This cannot be undone.`)) return;
    try {
      await deleteProfile(profileId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewProfile = async () => {
    setCreating(true);
    try {
      const created = await createProfile("Untitled", defaultResumeData);
      setEditModalOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold">Profiles</h1>
        <Button
          variant="default"
          size="sm"
          onClick={handleNewProfile}
          disabled={creating}
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-2">No profiles yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first profile to get started.
            </p>
            <Button onClick={handleNewProfile} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-4 gap-5 min-h-[380px] grid-rows-[1fr_1fr]"
          layout
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        >
            {profiles.map((p) => (
              <motion.div
                key={p.id}
                layout
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="min-w-0 h-full min-h-0"
              >
                <Card
                  data-profile-card
                  className={cn(
                    "group relative flex flex-col h-full min-h-0 transition-all duration-200",
                    "border shadow-sm hover:shadow-md",
                    p.id === currentProfileId && "ring-2 ring-primary ring-offset-2",
                    p.id === activeProfileId &&
                      "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
                    dropTargetId === p.id && "ring-2 ring-primary ring-offset-2 ring-dashed",
                    draggingId === p.id && "opacity-60",
                    draggingId != null && p.id !== draggingId && "rounded-2xl"
                  )}
                  onDragOver={(e) => handleDragOver(e, p.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, p.id)}
                  onContextMenu={(e) => handleContextMenu(e, p.id)}
                >
                  {/* Header: drag handle + star + name + edit */}
                  <div className="flex items-start gap-2 p-4 pb-2">
                    <span
                      draggable
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      onDragEnd={handleDragEnd}
                      className="shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    {p.id === activeProfileId ? (
                      <Star
                        className="h-5 w-5 shrink-0 text-amber-500 fill-amber-500 mt-0.5"
                        aria-label="Active profile"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetActive(p.id)}
                        disabled={settingActive !== null}
                        className="shrink-0 rounded-md p-1 -m-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                        aria-label="Set as active"
                      >
                        <Star className="h-5 w-5 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(p.name || "Untitled", `${p.id}-name`)}
                      className="flex-1 min-w-0 text-left rounded-md px-2 py-1 -mx-2 -my-1 hover:bg-muted/60 transition-colors"
                      title="Click to copy"
                    >
                      <h3 className="text-base font-semibold text-foreground break-words leading-tight">
                        {p.name || "Untitled"}
                      </h3>
                      {copiedKey === `${p.id}-name` && (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1.5 shrink-0"
                          aria-hidden
                        />
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEditForProfile(p.id)}
                      aria-label="Edit profile"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Content — flex-1 min-h-0; no scroll, fixed card height */}
                  <div className="flex-1 px-4 pb-4 text-xs min-h-0 overflow-hidden">
                    <div className="space-y-2">
                      {p.email && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <CopyableLine
                            text={p.email}
                            copyKey={`${p.id}-email`}
                            copiedKey={copiedKey}
                            onCopy={handleCopy}
                            className="truncate flex-1 min-w-0"
                          />
                        </div>
                      )}
                      {(p.address || p.city || p.state || p.postalCode) && (
                        <div className="flex items-start gap-1.5 min-w-0">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                          <p className="flex flex-wrap gap-x-1 gap-y-0.5 items-baseline flex-1 min-w-0">
                            {p.address && (
                              <>
                                <CopyableLine
                                  text={p.address}
                                  copyKey={`${p.id}-address`}
                                  copiedKey={copiedKey}
                                  onCopy={handleCopy}
                                  className="inline-block w-auto max-w-full truncate"
                                />
                                {(p.city || p.state || p.postalCode) && (
                                  <span className="text-muted-foreground/70">,</span>
                                )}
                              </>
                            )}
                            {p.city && (
                              <>
                                <CopyableLine
                                  text={p.city}
                                  copyKey={`${p.id}-city`}
                                  copiedKey={copiedKey}
                                  onCopy={handleCopy}
                                  className="inline-block w-auto max-w-full truncate"
                                />
                                {(p.state || p.postalCode) && (
                                  <span className="text-muted-foreground/70">,</span>
                                )}
                              </>
                            )}
                            {p.state && (
                              <>
                                <CopyableLine
                                  text={p.state}
                                  copyKey={`${p.id}-state`}
                                  copiedKey={copiedKey}
                                  onCopy={handleCopy}
                                  className="inline-block w-auto max-w-full truncate"
                                />
                                {p.postalCode && (
                                  <span className="text-muted-foreground/70">,</span>
                                )}
                              </>
                            )}
                            {p.postalCode && (
                              <CopyableLine
                                text={p.postalCode}
                                copyKey={`${p.id}-postalCode`}
                                copiedKey={copiedKey}
                                onCopy={handleCopy}
                                className="inline-block w-auto max-w-full truncate"
                              />
                            )}
                          </p>
                        </div>
                      )}
                      {(p.phone || p.birthday) && (
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                          {p.phone && (
                            <>
                              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <CopyableLine
                                text={p.phone}
                                copyKey={`${p.id}-phone`}
                                copiedKey={copiedKey}
                                onCopy={handleCopy}
                                className="inline-block w-auto max-w-full"
                              />
                              {p.birthday && (
                                <span className="text-muted-foreground/70">,</span>
                              )}
                            </>
                          )}
                          {p.birthday && (
                            <>
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <CopyableLine
                                text={p.birthday}
                                copyKey={`${p.id}-birthday`}
                                copiedKey={copiedKey}
                                onCopy={handleCopy}
                                className="inline-block w-auto max-w-full"
                              />
                            </>
                          )}
                        </div>
                      )}
                      {p.linkedin && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Linkedin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <a
                            href={p.linkedin.startsWith("http") ? p.linkedin : `https://${p.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-primary hover:underline flex-1 min-w-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            LinkedIn
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCopy(p.linkedin!, `${p.id}-linkedin`);
                            }}
                            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            title="Copy LinkedIn URL"
                          >
                            {copiedKey === `${p.id}-linkedin` ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/60">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3" />
                        Career
                      </p>
                      {p.experience?.length ? (
                        <ul className="space-y-0.5">
                          {p.experience.slice(0, 3).map((exp, i) => (
                            <li key={i} className="flex flex-wrap items-baseline gap-x-1 min-w-0">
                              <CopyableLine
                                text={exp.company}
                                copyKey={`${p.id}-exp-${i}-company`}
                                copiedKey={copiedKey}
                                onCopy={handleCopy}
                                className="truncate max-w-full"
                              />
                              {exp.period && (
                                <>
                                  <span className="text-muted-foreground/70 shrink-0">·</span>
                                  <CopyableLine
                                    text={exp.period}
                                    copyKey={`${p.id}-exp-${i}-period`}
                                    copiedKey={copiedKey}
                                    onCopy={handleCopy}
                                    className="truncate max-w-full"
                                  />
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground/70 px-2">—</p>
                      )}
                    </div>

                    <div className="mt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3" />
                        Education
                      </p>
                      {p.education?.length ? (
                        <ul className="space-y-0.5">
                          {p.education.slice(0, 2).map((ed, i) => (
                            <li key={i} className="flex flex-wrap items-baseline gap-x-1 min-w-0">
                              <CopyableLine
                                text={ed.school}
                                copyKey={`${p.id}-ed-${i}-school`}
                                copiedKey={copiedKey}
                                onCopy={handleCopy}
                                className="truncate max-w-full"
                              />
                              {ed.degree && (
                                <>
                                  <span className="text-muted-foreground/70 shrink-0">·</span>
                                  <CopyableLine
                                    text={ed.degree}
                                    copyKey={`${p.id}-ed-${i}-degree`}
                                    copiedKey={copiedKey}
                                    onCopy={handleCopy}
                                    className="truncate max-w-full"
                                  />
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground/70 px-2">—</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </motion.div>
      )}

      <ProfileEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        data={data}
        onSave={setData}
      />

      {contextMenu && (
        <div
          className="fixed z-[100] min-w-[140px] rounded-md border bg-popover py-1 shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none"
            onClick={() => handleRemoveProfile(contextMenu.profileId)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
