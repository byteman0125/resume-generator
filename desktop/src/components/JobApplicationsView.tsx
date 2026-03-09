import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch, apiJson } from "../api";
import type { JobApplication, ProfileMeta } from "../types";
import { Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";

export function JobApplicationsView() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    company_name: "",
    title: "",
    job_url: "",
    profile_id: "",
    resume_file_name: "",
  });

  const fetchApplications = useCallback(async () => {
    try {
      setError(null);
      const rows = await apiJson<JobApplication[]>("/api/job-applications");
      setApplications(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const list = await apiJson<ProfileMeta[]>("/api/profiles");
      setProfiles(list);
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchApplications();
    fetchProfiles();
  }, [fetchApplications, fetchProfiles]);

  const dataRows = useMemo(() => {
    let rows = applications;
    if (profileFilter) {
      rows = rows.filter((r) => (r.profile_id || "") === profileFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.date || "").toLowerCase().includes(q) ||
          (r.company_name || "").toLowerCase().includes(q) ||
          (r.title || "").toLowerCase().includes(q) ||
          (r.job_url || "").toLowerCase().includes(q) ||
          (r.resume_file_name || "").toLowerCase().includes(q) ||
          (profiles.find((p) => p.id === r.profile_id)?.name || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [applications, profileFilter, search, profiles]);

  const handleAdd = async () => {
    try {
      const res = await apiFetch("/api/job-applications", {
        method: "POST",
        body: JSON.stringify({
          date: form.date || new Date().toISOString().slice(0, 10),
          company_name: form.company_name.trim(),
          title: form.title.trim(),
          job_url: form.job_url.trim() || null,
          profile_id: form.profile_id.trim() || null,
          resume_file_name: form.resume_file_name.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = (await res.json()) as JobApplication;
      setApplications((prev) => [...prev, row]);
      setAddOpen(false);
      setForm({
        date: new Date().toISOString().slice(0, 10),
        company_name: "",
        title: "",
        job_url: "",
        profile_id: "",
        resume_file_name: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    try {
      const res = await apiFetch(`/api/job-applications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const profileName = (id: string | null) =>
    id ? profiles.find((p) => p.id === id)?.name ?? id : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="px-4 py-2 bg-red-900/30 text-red-200 text-sm border-b border-red-800">
          {error}
        </div>
      )}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-600 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter rows..."
            className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-sm w-48"
          />
          <span className="text-slate-500 text-sm">{dataRows.length} rows</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Profile</label>
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-sm"
          >
            <option value="">All profiles</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
        <button
          type="button"
          onClick={() => { setError(null); setLoading(true); fetchApplications(); fetchProfiles(); }}
          className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-800 z-10">
            <tr>
              <th className="text-left px-2 py-2 border-b border-slate-600 w-12">#</th>
              <th className="text-left px-2 py-2 border-b border-slate-600">Date</th>
              <th className="text-left px-2 py-2 border-b border-slate-600">Company</th>
              <th className="text-left px-2 py-2 border-b border-slate-600">Title</th>
              <th className="text-left px-2 py-2 border-b border-slate-600">Job URL</th>
              <th className="text-left px-2 py-2 border-b border-slate-600">Profile</th>
              <th className="text-left px-2 py-2 border-b border-slate-600">Resume</th>
              <th className="w-20 border-b border-slate-600" />
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, idx) => (
              <tr key={row.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="px-2 py-1.5 text-slate-500">{idx + 1}</td>
                <td className="px-2 py-1.5">{row.date || "—"}</td>
                <td className="px-2 py-1.5">{row.company_name || "—"}</td>
                <td className="px-2 py-1.5">{row.title || "—"}</td>
                <td className="px-2 py-1.5">
                  {row.job_url ? (
                    <a
                      href={row.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Link
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1.5">{profileName(row.profile_id)}</td>
                <td className="px-2 py-1.5">{row.resume_file_name || "—"}</td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    className="p-1 rounded text-red-400 hover:bg-red-900/30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dataRows.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            {applications.length === 0
              ? "No applications. Add one or check backend IP."
              : "No rows match search or profile filter."}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="bg-slate-800 rounded-lg border border-slate-600 p-4 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-medium mb-3">Add application</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-slate-400">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Company</label>
                <input
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Job URL</label>
                <input
                  value={form.job_url}
                  onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Profile</label>
                <select
                  value={form.profile_id}
                  onChange={(e) => setForm((f) => ({ ...f, profile_id: e.target.value }))}
                  className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600"
                >
                  <option value="">—</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400">Resume file name</label>
                <input
                  value={form.resume_file_name}
                  onChange={(e) => setForm((f) => ({ ...f, resume_file_name: e.target.value }))}
                  className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
