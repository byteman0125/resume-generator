"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ResumeData,
  Experience,
  Education,
  Skill,
  createId,
} from "@/lib/resume-store";
import { US_STATES, type CitiesByState } from "@/lib/usa-locations";
import { cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical } from "lucide-react";

export type FormSection = "profile" | "experience" | "education" | "skills";

interface ProfileFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  /** Only show these sections. If not set, show all. */
  sections?: FormSection[];
}

const emptyExperience: Omit<Experience, "id"> = {
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
};

const emptyEducation: Omit<Education, "id"> = {
  school: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  description: "",
};

export function ProfileForm({ data, onChange, sections }: ProfileFormProps) {
  const show = (s: FormSection) => !sections || sections.includes(s);
  const [citiesByState, setCitiesByState] = useState<CitiesByState>({});
  const [dragExp, setDragExp] = useState<number | null>(null);
  const [dropExp, setDropExp] = useState<number | null>(null);
  const [dragEdu, setDragEdu] = useState<number | null>(null);
  const [dropEdu, setDropEdu] = useState<number | null>(null);
  const [dragSkill, setDragSkill] = useState<number | null>(null);
  const [dropSkill, setDropSkill] = useState<number | null>(null);

  useEffect(() => {
    if (!show("profile")) return;
    fetch("/api/usa-cities")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setCitiesByState)
      .catch(() => setCitiesByState({}));
  }, []);

  const updateProfile = (patch: Partial<ResumeData["profile"]>) => {
    onChange({ ...data, profile: { ...data.profile, ...patch } });
  };

  const addExperience = () => {
    onChange({
      ...data,
      experience: [
        ...data.experience,
        { ...emptyExperience, id: createId() },
      ],
    });
  };

  const updateExperience = (id: string, patch: Partial<Experience>) => {
    onChange({
      ...data,
      experience: data.experience.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    });
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...data.education,
        { ...emptyEducation, id: createId() },
      ],
    });
  };

  const updateEducation = (id: string, patch: Partial<Education>) => {
    onChange({
      ...data,
      education: data.education.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    });
  };

  const addSkill = () => {
    onChange({
      ...data,
      skills: [...data.skills, { id: createId(), name: "" }],
    });
  };

  const updateSkill = (id: string, name: string, category?: string, level?: string) => {
    onChange({
      ...data,
      skills: data.skills.map((s) =>
        s.id === id ? { ...s, name, category, level } : s
      ),
    });
  };

  const removeSkill = (id: string) => {
    onChange({ ...data, skills: data.skills.filter((s) => s.id !== id) });
  };

  const reorderExperience = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...data.experience];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    onChange({ ...data, experience: next });
  };

  const reorderEducation = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...data.education];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    onChange({ ...data, education: next });
  };

  const reorderSkills = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...data.skills];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    onChange({ ...data, skills: next });
  };

  const defaultOpen = sections ?? ["profile", "experience", "education", "skills"];
  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
      {/* Profile */}
      {show("profile") && (
      <AccordionItem value="profile">
        <AccordionTrigger>Profile</AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardHeader>
              <CardTitle>Basic info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Full name</Label>
                <Input
                  value={data.profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label>Title (shown under name on resume)</Label>
                <Input
                  value={data.profile.title ?? ""}
                  onChange={(e) => updateProfile({ title: e.target.value })}
                  placeholder="Senior Software Engineer"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={data.profile.email}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={data.profile.phone}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={data.profile.address ?? ""}
                  onChange={(e) => updateProfile({ address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>State (USA)</Label>
                  <select
                    value={
                      (data.profile.state?.length === 2
                        ? data.profile.state
                        : US_STATES.find((s) => s.name === (data.profile.state ?? ""))?.code) ?? ""
                    }
                    onChange={(e) => updateProfile({ state: e.target.value, city: "" })}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>City (USA)</Label>
                  <select
                    value={data.profile.city ?? ""}
                    onChange={(e) => updateProfile({ city: e.target.value })}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    )}
                    disabled={!data.profile.state}
                  >
                    <option value="">Select city</option>
                    {(citiesByState[data.profile.state ?? ""] ?? []).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                    {data.profile.city &&
                      data.profile.state &&
                      !(citiesByState[data.profile.state] ?? []).includes(data.profile.city) && (
                      <option value={data.profile.city}>{data.profile.city}</option>
                    )}
                  </select>
                  <Input
                    value={
                      data.profile.state && data.profile.city
                        ? (citiesByState[data.profile.state] ?? []).includes(data.profile.city)
                          ? ""
                          : data.profile.city
                        : ""
                    }
                    onChange={(e) => updateProfile({ city: e.target.value.trim() })}
                    placeholder="Or type city name if not listed"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>ZIP / Postal code</Label>
                <Input
                  value={data.profile.postalCode ?? ""}
                  onChange={(e) => updateProfile({ postalCode: e.target.value })}
                  placeholder="e.g. 90210"
                />
              </div>
              <div className="grid gap-2">
                <Label>Birthday</Label>
                <Input
                  type="date"
                  value={data.profile.birthday ?? ""}
                  onChange={(e) => updateProfile({ birthday: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>LinkedIn (optional)</Label>
                  <Input
                    value={data.profile.linkedin || ""}
                    onChange={(e) => updateProfile({ linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Website (optional)</Label>
                  <Input
                    value={data.profile.website || ""}
                    onChange={(e) => updateProfile({ website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Summary (optional)</Label>
                <textarea
                  value={data.profile.summary ?? ""}
                  onChange={(e) => updateProfile({ summary: e.target.value })}
                  placeholder="Short professional summary or objective"
                  rows={3}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
      )}

      {/* Experience */}
      {show("experience") && (
      <AccordionItem value="experience">
        <AccordionTrigger>Experience ({data.experience.length})</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {data.experience.map((exp, idx) => (
              <Card
                key={exp.id}
                draggable
                onDragStart={() => setDragExp(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropExp(idx);
                }}
                onDragLeave={() => setDropExp(null)}
                onDragEnd={() => {
                  if (dragExp !== null && dropExp !== null && dragExp !== dropExp) {
                    reorderExperience(dragExp, dropExp);
                  }
                  setDragExp(null);
                  setDropExp(null);
                }}
                className={cn(
                  "transition-colors",
                  dragExp === idx && "opacity-70 ring-2 ring-primary/30",
                  dropExp === idx && dragExp !== idx && "ring-2 ring-primary/20 ring-dashed"
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
                      title="Drag to reorder"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <CardTitle className="text-base">Experience</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExperience(exp.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    />
                    <Input
                      placeholder="Role / Title at this company"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Start date"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="End date"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        disabled={exp.current}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              current: e.target.checked,
                              endDate: e.target.checked ? "" : exp.endDate,
                            })
                          }
                        />
                        Current
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addExperience} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add experience
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
      )}

      {/* Education */}
      {show("education") && (
      <AccordionItem value="education">
        <AccordionTrigger>Education ({data.education.length})</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {data.education.map((edu, idx) => (
              <Card
                key={edu.id}
                draggable
                onDragStart={() => setDragEdu(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropEdu(idx);
                }}
                onDragLeave={() => setDropEdu(null)}
                onDragEnd={() => {
                  if (dragEdu !== null && dropEdu !== null && dragEdu !== dropEdu) {
                    reorderEducation(dragEdu, dropEdu);
                  }
                  setDragEdu(null);
                  setDropEdu(null);
                }}
                className={cn(
                  "transition-colors",
                  dragEdu === idx && "opacity-70 ring-2 ring-primary/30",
                  dropEdu === idx && dragEdu !== idx && "ring-2 ring-primary/20 ring-dashed"
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
                      title="Drag to reorder"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <CardTitle className="text-base">Degree</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEducation(edu.id)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                  />
                  <Input
                    placeholder="School"
                    value={edu.school}
                    onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                  />
                  <Input
                    placeholder="Field (optional)"
                    value={edu.field || ""}
                    onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Start date"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                    />
                    <Input
                      placeholder="End date"
                      value={edu.endDate}
                      onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addEducation} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add education
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
      )}

      {/* Skill set - same as resume section */}
      {show("skills") && (
      <AccordionItem value="skills">
        <AccordionTrigger>Skill set ({data.skills.length})</AccordionTrigger>
        <AccordionContent>
          <p className="text-xs text-muted-foreground mb-2">
            Category e.g. Languages, Frameworks. One skill per line; same category groups in preview.
          </p>
          <div className="space-y-2">
            {data.skills.map((skill, idx) => (
              <div
                key={skill.id}
                draggable
                onDragStart={() => setDragSkill(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropSkill(idx);
                }}
                onDragLeave={() => setDropSkill(null)}
                onDragEnd={() => {
                  if (dragSkill !== null && dropSkill !== null && dragSkill !== dropSkill) {
                    reorderSkills(dragSkill, dropSkill);
                  }
                  setDragSkill(null);
                  setDropSkill(null);
                }}
                className={cn(
                  "flex flex-wrap gap-2 items-center rounded-md border border-transparent p-1 -m-1 transition-colors",
                  dragSkill === idx && "opacity-70 ring-2 ring-primary/30 bg-muted/30",
                  dropSkill === idx && dragSkill !== idx && "ring-2 ring-primary/20 ring-dashed bg-muted/20"
                )}
              >
                <span
                  className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground shrink-0"
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <Input
                  placeholder="Category (e.g. Languages)"
                  value={skill.category || ""}
                  onChange={(e) => updateSkill(skill.id, skill.name, e.target.value, skill.level)}
                  className="w-32 shrink-0"
                />
                <Input
                  placeholder="Skill or list (e.g. Java, Kotlin, JavaScript)"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, e.target.value, skill.category, skill.level)}
                  className="flex-1 min-w-[140px]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSkill(skill.id)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addSkill} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add skill / category
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
      )}
    </Accordion>
  );
}
