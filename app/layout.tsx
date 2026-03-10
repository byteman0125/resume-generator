import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ResumeProvider } from "@/lib/resume-context";
import { ConditionalShell } from "@/components/conditional-shell";
import { AppShell } from "@/components/app-shell";
import { ShellErrorBoundary } from "@/components/shell-error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tailor",
  description: "Build and download your resume as PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              style: { fontSize: "12px", padding: "6px 12px", minHeight: "32px" },
              classNames: { toast: "!text-xs" },
            }}
          />
          <ResumeProvider>
            <Suspense fallback={<AppShell>{children}</AppShell>}>
              <ShellErrorBoundary>
                <ConditionalShell>{children}</ConditionalShell>
              </ShellErrorBoundary>
            </Suspense>
          </ResumeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
