"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, User, Briefcase, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          {/* Brand -> goes to / (Profile home) */}
          <Link
            href="/"
            className={cn(
              "mr-6 flex items-center gap-2 font-semibold transition-colors hover:text-primary",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Briefcase className="h-5 w-5" />
            <span className="hidden sm:inline">Tailor</span>
          </Link>

          {/* Nav links */}
          <div className="flex flex-1 items-center gap-1">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/profile"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/template/format1"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname?.startsWith("/template/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <FileText className="h-4 w-4" />
              Templates
            </Link>
            <Link
              href="/ai"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/ai"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Link>
          </div>

          {/* Right: theme + Preview & PDF */}
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
      </nav>
  );
}
