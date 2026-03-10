"use client";

import React from "react";
import { AppShell } from "@/components/app-shell";

/**
 * Catches router/layout errors (e.g. Next.js "parallelRouterKey" null during PDF/iframe)
 * and renders the default shell so the app stays usable.
 */
export class ShellErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: true } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("ShellErrorBoundary caught:", error?.message ?? error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <AppShell>{this.props.children}</AppShell>;
    }
    return this.props.children;
  }
}
