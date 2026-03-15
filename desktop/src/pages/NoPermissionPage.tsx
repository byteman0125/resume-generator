import React from "react";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { LogOut } from "lucide-react";

export function NoPermissionPage() {
  const { logout } = useAuth();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <p className="text-muted-foreground max-w-md">
        You don&apos;t have any permission to access. Connect to manager.
      </p>
      <Button variant="outline" onClick={logout} className="gap-2">
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );
}
