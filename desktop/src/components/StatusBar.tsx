import { useStatus } from "../lib/status-context";
import { cn } from "../lib/utils";

export function StatusBar() {
  const { status } = useStatus();
  return (
    <footer
      className={cn(
        "flex-shrink-0 h-6 px-3 flex items-center",
        "bg-muted/60 border-t border-border",
        "text-xs text-muted-foreground font-mono truncate"
      )}
      role="status"
      aria-live="polite"
    >
      {status}
    </footer>
  );
}
