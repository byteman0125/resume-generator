"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";

/**
 * For /print/* routes we render only the page content (no nav bar)
 * so PDF capture and "Open PDF" show the resume only.
 * When ?embedded=1 (e.g. Electron desktop), skip the shell so only the desktop header shows.
 */
export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const embedded = searchParams?.get("embedded") === "1";

  if (pathname?.startsWith("/print")) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }
  if (embedded) {
    return (
      <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-background text-foreground">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
