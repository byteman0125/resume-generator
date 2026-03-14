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

type UserListItem = {
  id: string;
  username: string;
  role: string;
  assigned_profile_id: string | null;
  assigned_profile_name: string | null;
  start_date: string | null;
  created_at: string;
  application_count: number;
};

export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copyPassword, setCopyPassword] = useState<{ id: string; value: string } | null>(null);

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
        <h1 className="text-xl font-semibold">Users</h1>
        <Button onClick={() => setAddOpen(true)}>Add user</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <UsersTable
        users={users}
        onEdit={(id) => setEditId(id)}
        onDelete={(id) => setDeleteId(id)}
        copyPassword={copyPassword}
        onCopyPassword={setCopyPassword}
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
      {deleteId && (
        <DeleteUserModal
          userId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={() => {
            setUsers((prev) => prev.filter((x) => x.id !== deleteId));
            setDeleteId(null);
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
  copyPassword,
  onCopyPassword,
}: {
  users: UserListItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  copyPassword: { id: string; value: string } | null;
  onCopyPassword: (v: { id: string; value: string } | null) => void;
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
            <th className="text-left p-2 font-medium">Password</th>
            <th className="w-24 p-2" />
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
                {copyPassword?.id === u.id ? (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      void navigator.clipboard.writeText(copyPassword.value);
                    }}
                  >
                    Copy
                  </button>
                ) : (
                  <span className="text-muted-foreground">••••••••</span>
                )}
              </td>
              <td className="p-2 flex gap-1">
                <Button variant="outline" size="sm" onClick={() => onEdit(u.id)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(u.id)}>
                  Delete
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!username.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), role: "user" }),
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
          <span className="text-sm">Reset password (one-time password will be shown)</span>
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
