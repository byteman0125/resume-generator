"use client";

import { AppHeader } from "@/components/app-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
