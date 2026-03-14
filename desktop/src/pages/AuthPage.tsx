import React, { useState, useCallback } from "react";
import { getBaseUrl, setBackendIp, BACKEND_PORT } from "../api";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

type Step = "server" | "login" | "setup" | "created";

export function AuthPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("server");
  const [serverIp, setServerIp] = useState("");
  const [port, setPort] = useState(String(BACKEND_PORT));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buildBaseUrl = useCallback(() => {
    const host = serverIp.trim() || "127.0.0.1";
    return host.includes("://")
      ? host.replace(/\/+$/, "")
      : `http://${host}:${Number(port) || BACKEND_PORT}`;
  }, [serverIp, port]);

  const checkSetupStatus = useCallback(async () => {
    const base = buildBaseUrl();
    setBackendIp(base);
    const res = await fetch(`${base}/api/auth/setup-status`);
    if (!res.ok) throw new Error("Could not reach server");
    const data = (await res.json()) as { hasUsers: boolean };
    return data.hasUsers;
  }, [buildBaseUrl]);

  const handleContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      const hasUsers = await checkSetupStatus();
      setStep(hasUsers ? "login" : "setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(serverIp, Number(port) || BACKEND_PORT, username.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setError(null);
    setLoading(true);
    try {
      const base = getBaseUrl();
      const res = await fetch(`${base}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: setupUsername.trim(), role: "admin" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Create failed");
      }
      const data = (await res.json()) as { user: { username: string }; plainPassword: string };
      setCreatedPassword(data.plainPassword);
      setUsername(data.user.username);
      setStep("created");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithCreatedPassword = async () => {
    if (!createdPassword) return;
    setError(null);
    setLoading(true);
    try {
      await login(serverIp, Number(port) || BACKEND_PORT, username, createdPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "server") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Connect to server</h1>
          <div className="space-y-2">
            <Label htmlFor="server-ip">Server IP or URL</Label>
            <Input
              id="server-ip"
              value={serverIp}
              onChange={(e) => setServerIp(e.target.value)}
              placeholder="127.0.0.1 or https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-port">Port</Label>
            <Input
              id="server-port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder={String(BACKEND_PORT)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleContinue} disabled={loading}>
            {loading ? "Checking…" : "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Log in</h1>
          <div className="space-y-2">
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => setStep("server")}
          >
            Change server
          </button>
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Create first admin</h1>
          <p className="text-sm text-muted-foreground">No users exist yet. Create an admin account.</p>
          <div className="space-y-2">
            <Label htmlFor="setup-username">Admin username</Label>
            <Input
              id="setup-username"
              value={setupUsername}
              onChange={(e) => setSetupUsername(e.target.value)}
              placeholder="Username"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={handleCreateAdmin} disabled={loading || !setupUsername.trim()}>
            {loading ? "Creating…" : "Create admin"}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => setStep("server")}
          >
            Change server
          </button>
        </div>
      </div>
    );
  }

  // step === "created"
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Admin created</h1>
        <p className="text-sm text-muted-foreground">
          Your one-time password (copy it now; it won’t be shown again):
        </p>
        <div className="rounded-md border bg-muted/50 p-3 font-mono text-sm break-all">
          {createdPassword}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleLoginWithCreatedPassword} disabled={loading}>
          {loading ? "Logging in…" : "Log in with this password"}
        </Button>
      </div>
    </div>
  );
}
