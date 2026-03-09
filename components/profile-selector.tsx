"use client";

import { usePathname, useRouter } from "next/navigation";
import { useResume } from "@/lib/resume-context";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfileSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    profiles,
    currentProfileId,
    switchProfile,
    setActiveProfile,
    loading,
  } = useResume();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const id = value === "" ? null : value;
    switchProfile(id);
    setActiveProfile(id).catch(console.error);
    if (pathname.startsWith("/style")) {
      router.replace(id ? `/style/${id}` : "/style/new");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={currentProfileId ?? ""}
          onChange={handleSelect}
          disabled={loading}
          className={cn(
            "h-7 appearance-none rounded-md border border-input bg-background pl-2 pr-7 py-1 text-xs font-medium",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-w-[130px]"
          )}
        >
          <option value="">Select profile</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {loading ? (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
        ) : (
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
      </div>
    </div>
  );
}
