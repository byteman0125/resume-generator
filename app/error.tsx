"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
