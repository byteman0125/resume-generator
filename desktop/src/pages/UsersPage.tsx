import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Copy, Check, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

type UserListItem = {
  id: string;
  username: string;
  role: string;
  assigned_profile_id: string | null;
  assigned_profile_name: string | null;
  start_date: string | null;
  created_at: string;
  application_count: number;
  last_seen_at: string | null;
  online: boolean;
  active: boolean;
};

export function UsersPage() {
  const { user: me, logout } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copyPassword, setCopyPassword] = useState<{ id: string; value: string } | null>(null);
  const [copiedPasswordUserId, setCopiedPasswordUserId] = useState<string | null>(null);
  const [resetPasswordConfirmUser, setResetPasswordConfirmUser] = useState<{ id: string; username: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      const list = (await res.json()) as UserListItem[];
      setUsers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (me?.role === "admin") loadUsers();
    else setLoading(false);
  }, [me?.role, loadUsers]);

  // Refresh user list periodically so online status updates in near real time
  const USERS_POLL_INTERVAL_MS = 10_000; // 10 seconds
  useEffect(() => {
    if (me?.role !== "admin") return;
    const interval = setInterval(loadUsers, USERS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [me?.role, loadUsers]);

  useEffect(() => {
    if (copiedPasswordUserId == null) return;
    const t = setTimeout(() => setCopiedPasswordUserId(null), 2000);
    return () => clearTimeout(t);
  }, [copiedPasswordUserId]);

  if (me?.role !== "admin") {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">You don’t have access to this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <span className="text-muted-foreground">Loading users…</span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users ({users.length} total)</h1>
        <Button onClick={() => setAddOpen(true)}>Add user</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <UsersTable
        users={users}
        onEdit={(id) => setEditId(id)}
        onDelete={(id) => setDeleteId(id)}
        onToggleActive={async (id, active) => {
          try {
            const res = await fetch(`/api/users/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active }),
            });
            if (!res.ok) throw new Error("Failed");
            setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, active } : x)));
          } catch {
            toast.error("Failed to update status");
          }
        }}
        copyPassword={copyPassword}
        onCopyPassword={setCopyPassword}
        copiedPasswordUserId={copiedPasswordUserId}
        onCopiedPassword={setCopiedPasswordUserId}
        onConfirmResetPassword={(user) => setResetPasswordConfirmUser({ id: user.id, username: user.username })}
      />
      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={async (u, plain) => {
          setAddOpen(false);
          await loadUsers();
          setCopyPassword({ id: u.id, value: plain });
        }}
      />
      {editId && (
        <EditUserModal
          userId={editId}
          onClose={() => setEditId(null)}
          onSaved={(u, plain) => {
            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
            if (plain) setCopyPassword({ id: u.id, value: plain });
            setEditId(null);
          }}
        />
      )}
      {resetPasswordConfirmUser && (
        <ConfirmResetPasswordModal
          username={resetPasswordConfirmUser.username}
          onClose={() => setResetPasswordConfirmUser(null)}
          onConfirm={async () => {
            const { id } = resetPasswordConfirmUser;
            setResetPasswordConfirmUser(null);
            try {
              const res = await fetch(`/api/users/${id}/reset-password`, { method: "POST" });
              if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(err.error || "Failed to get password");
              }
              const data = (await res.json()) as { plainPassword: string };
              setCopyPassword({ id, value: data.plainPassword });
              setCopiedPasswordUserId(id);
              const electron = (window as unknown as { electron?: { writeClipboardText?: (t: string) => Promise<unknown> } }).electron;
              if (electron?.writeClipboardText) {
                await electron.writeClipboardText(data.plainPassword);
              } else if (typeof navigator?.clipboard?.writeText === "function") {
                await navigator.clipboard.writeText(data.plainPassword);
              }
              toast.success("Password reset and copied to clipboard");
            } catch (err) {
              console.error("Reset/copy password failed:", err);
              toast.error(err instanceof Error ? err.message : "Failed to get password");
            }
          }}
        />
      )}
      {deleteId && (
        <DeleteUserModal
          userId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={() => {
            const deletedId = deleteId;
            setUsers((prev) => prev.filter((x) => x.id !== deletedId));
            setDeleteId(null);
            if (me?.id === deletedId) {
              logout();
            }
          }}
        />
      )}
    </div>
  );
}

function UsersTable({
  users,
  onEdit,
  onDelete,
  onToggleActive,
  copyPassword,
  onCopyPassword,
  copiedPasswordUserId,
  onCopiedPassword,
  onConfirmResetPassword,
}: {
  users: UserListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void | Promise<void>;
  copyPassword: { id: string; value: string } | null;
  onCopyPassword: (v: { id: string; value: string } | null) => void;
  copiedPasswordUserId: string | null;
  onCopiedPassword: (userId: string) => void;
  onConfirmResetPassword: (user: { id: string; username: string }) => void;
}) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-medium">Username</th>
            <th className="text-left p-2 font-medium">Role</th>
            <th className="text-left p-2 font-medium">Assigned profile</th>
            <th className="text-left p-2 font-medium">Applications</th>
            <th className="text-left p-2 font-medium">Status</th>
            <th className="text-left p-2 font-medium">Password</th>
            <th className="text-left p-2 font-medium">Active</th>
            <th className="w-28 p-2" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="p-2">{u.username}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.assigned_profile_name ?? "—"}</td>
              <td className="p-2">{u.application_count}</td>
              <td className="p-2">
                <span className="inline-flex items-center gap-1.5" title={u.online ? "Online" : "Offline"}>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${u.online ? "bg-green-500" : "bg-muted-foreground/50"}`}
                    aria-hidden
                  />
                  <span className="text-muted-foreground text-xs">{u.online ? "Online" : "Offline"}</span>
                </span>
              </td>
              <td className="p-2">
                <span className="inline-flex items-center gap-1">
                  <span className="text-muted-foreground">••••••••</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    title="Copy password (resets and copies if not in memory)"
                    aria-label="Copy password"
                    onClick={async () => {
                      if (copyPassword?.id === u.id) {
                        const electron = (window as unknown as { electron?: { writeClipboardText?: (t: string) => Promise<unknown> } }).electron;
                        try {
                          if (electron?.writeClipboardText) {
                            await electron.writeClipboardText(copyPassword.value);
                          } else if (typeof navigator?.clipboard?.writeText === "function") {
                            await navigator.clipboard.writeText(copyPassword.value);
                          } else {
                            toast.error("Clipboard not available");
                            return;
                          }
                          onCopiedPassword(u.id);
                          toast.success("Password copied to clipboard");
                        } catch (err) {
                          console.error("Copy failed:", err);
                          toast.error("Failed to copy to clipboard");
                        }
                      } else {
                        onConfirmResetPassword({ id: u.id, username: u.username });
                      }
                    }}
                  >
                    {copiedPasswordUserId === u.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </span>
              </td>
              <td className="p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title={u.active ? "Deactivate user" : "Activate user"}
                  aria-label={u.active ? "Deactivate" : "Activate"}
                  onClick={() => void onToggleActive(u.id, !u.active)}
                >
                  {u.active ? (
                    <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 text-green-600" />
                  )}
                </Button>
              </td>
              <td className="p-2 flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(u.id)} title="Edit" aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(u.id)} title="Delete" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: UserListItem, plainPassword: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [assignedProfileId, setAssignedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      fetch("/api/profiles")
        .then((res) => (res.ok ? res.json() : []))
        .then((list: { id: string; name: string }[]) => setProfiles(Array.isArray(list) ? list : []))
        .catch(() => setProfiles([]));
    }
  }, [open]);

  const submit = async () => {
    if (!username.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          role,
          assigned_profile_id: assignedProfileId || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed");
      }
      const data = (await res.json()) as { user: UserListItem; plainPassword: string };
      onCreated(data.user, data.plainPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
          >
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Assigned profile</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={assignedProfileId ?? ""}
            onChange={(e) => setAssignedProfileId(e.target.value || null)}
          >
            <option value="">—</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !username.trim()}>
            {loading ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: (user: UserListItem, plainPassword?: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [assignedProfileId, setAssignedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [resetPassword, setResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profiles");
      if (res.ok) {
        const list = (await res.json()) as { id: string; name: string }[];
        setProfiles(list);
      }
    })();
  }, []);

  useEffect(() => {
    const u = userId;
    if (!u) return;
    (async () => {
      const listRes = await fetch("/api/users");
      if (!listRes.ok) return;
      const list = (await listRes.json()) as UserListItem[];
      const found = list.find((x) => x.id === u);
      if (found) {
        setUsername(found.username);
        setRole(found.role as "admin" | "user");
        setAssignedProfileId(found.assigned_profile_id);
      }
    })();
  }, [userId]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          role,
          assigned_profile_id: assignedProfileId,
          resetPassword: resetPassword || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed");
      }
      const data = (await res.json()) as { user: UserListItem; plainPassword?: string };
      onSaved(data.user, data.plainPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
          >
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Assigned profile</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={assignedProfileId ?? ""}
            onChange={(e) => setAssignedProfileId(e.target.value || null)}
          >
            <option value="">—</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={resetPassword} onChange={(e) => setResetPassword(e.target.checked)} />
          <span className="text-sm">Reset password (one-time password will be shown; works for admin users too)</span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmResetPasswordModal({
  username,
  onClose,
  onConfirm,
}: {
  username: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A new password will be generated for <strong>{username}</strong> and copied to the clipboard. The user will need to use this new password to log in. Their current password will stop working.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Resetting…" : "Reset and copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserModal({
  userId,
  onClose,
  onDeleted,
}: {
  userId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Failed");
      }
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this user?</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
