"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";
import { getTemplate, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { defaultResumeData, ResumeData } from "@/lib/resume-store";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ResumeEditor() {
  const [data, setData] = useState<ResumeData>(defaultResumeData);
  const { theme, setTheme } = useTheme();

  const handleChange = useCallback((newData: ResumeData) => {
    setData(newData);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tailor</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className={cn("space-y-4", "lg:max-h-[calc(100vh-8rem)] lg:overflow-auto")}>
            <Card>
              <CardHeader>
                <CardTitle>Edit your resume</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm data={data} onChange={handleChange} />
              </CardContent>
            </Card>
          </div>

          {/* Live preview - same size as your resume (US Letter) */}
          <div className="lg:sticky lg:top-24 lg:self-start flex justify-center lg:justify-start">
            <Card className="overflow-hidden w-full" style={{ maxWidth: "216mm" }}>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Live preview (Letter size)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[70vh] overflow-auto border-t bg-gray-50 dark:bg-gray-900/50">
                  {(() => {
                    const entry = getTemplate(DEFAULT_TEMPLATE_ID);
                    const C = entry?.Component;
                    return C ? <C data={data} style={{}} /> : <p className="p-4 text-sm text-muted-foreground">Template not found.</p>;
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
