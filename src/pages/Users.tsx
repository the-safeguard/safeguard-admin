import { Check, Copy, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@the-safeguard-ai/types";
import {
  createTeam,
  createUser,
  deleteTeam,
  deleteUser,
  getTeams,
  getUsers,
  inviteLink,
  renameTeam,
  resendInvite,
  updateUser,
} from "../lib/api";

const ROLE_COLOR: Record<string, string> = {
  Admin: "bg-accent/10 text-accent",
  Manager: "bg-blue-500/10 text-blue-500",
  User: "bg-muted text-muted-foreground",
};
const STATUS_COLOR: Record<string, string> = {
  active: "text-green-500",
  invited: "text-amber-500",
  inactive: "text-muted-foreground",
};

/** Small copy-to-clipboard button with a transient check state. */
function CopyButton({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Copied" : (label ?? "Copy")}
    </button>
  );
}

export function Users() {
  const qc = useQueryClient();
  const { data: users } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: getTeams });

  const [form, setForm] = useState({ name: "", email: "", role: "User", team: "" });
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [editing, setEditing] = useState<User | null>(null);

  const refreshUsers = () => qc.invalidateQueries({ queryKey: ["users"] });

  const add = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: (created) => {
      refreshUsers();
      qc.invalidateQueries({ queryKey: ["teams"] });
      setLink({ email: created.email, url: inviteLink(created.inviteToken) });
      setForm({ name: "", email: "", role: "User", team: "" });
      setOpen(false);
    },
  });

  const save = useMutation({
    mutationFn: (u: User) =>
      updateUser(u.id, { name: u.name, role: u.role, status: u.status, team: u.team }),
    onSuccess: () => {
      refreshUsers();
      setEditing(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: refreshUsers,
  });

  const reinvite = useMutation({
    mutationFn: (id: string) => resendInvite(id),
    onSuccess: (res, id) => {
      const u = (users ?? []).find((x) => x.id === id);
      setLink({ email: u?.email ?? "member", url: inviteLink(res.inviteToken) });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users & Teams</h1>
          <p className="text-muted-foreground mt-1">Manage members, roles, and teams</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {/* Invite link surfaced after create / resend (no email service needed). */}
      {link && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Invite ready for {link.email}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Share this link so they can set a password and sign in. It expires in 7 days and
              is shown only once.
            </p>
            <code className="block truncate text-xs text-accent bg-background border border-border rounded px-2 py-1">
              {link.url}
            </code>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <CopyButton value={link.url} label="Copy link" />
            <button onClick={() => setLink(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6 grid gap-3 sm:grid-cols-4">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
          <input placeholder="Team (optional)" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} list="team-options" className="px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
          <datalist id="team-options">
            {(teams ?? []).map((t) => <option key={t.id} value={t.name} />)}
          </datalist>
          <div className="flex gap-2">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 rounded-lg bg-background border border-border text-foreground flex-1">
              <option>User</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
            <button onClick={() => add.mutate()} disabled={!form.name || !form.email || add.isPending} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50">
              {add.isPending ? "…" : "Invite"}
            </button>
          </div>
          {add.isError && <p className="text-sm text-red-500 sm:col-span-4">{(add.error as Error).message}</p>}
        </div>
      )}

      {/* Members table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Team</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-3 px-4 text-foreground font-medium">{u.name}</td>
                <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                <td className="py-3 px-4 text-foreground">{u.team || "—"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLOR[u.role] ?? ""}`}>{u.role}</span>
                </td>
                <td className={`py-3 px-4 font-medium ${STATUS_COLOR[u.status] ?? ""}`}>{u.status}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-3">
                    {u.status === "invited" && (
                      <button onClick={() => reinvite.mutate(u.id)} title="Resend invite" className="text-muted-foreground hover:text-accent">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setEditing(u)} title="Edit" className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { if (confirm(`Remove ${u.name}?`)) remove.mutate(u.id); }} title="Remove" className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No members yet — invite your team.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TeamsPanel teams={teams ?? []} />

      {/* Edit member modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit {editing.name}</h2>
            <div className="grid gap-3">
              <label className="text-sm text-muted-foreground">Name
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
              </label>
              <label className="text-sm text-muted-foreground">Team
                <input value={editing.team} list="team-options" onChange={(e) => setEditing({ ...editing, team: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-muted-foreground">Role
                  <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as User["role"] })} className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground">
                    <option>User</option><option>Manager</option><option>Admin</option>
                  </select>
                </label>
                <label className="text-sm text-muted-foreground">Status
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as User["status"] })} className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    {editing.status === "invited" && <option value="invited">invited</option>}
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-border text-foreground">Cancel</button>
              <button onClick={() => save.mutate(editing)} disabled={save.isPending} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Team management: list with member counts, add, rename, delete. */
function TeamsPanel({ teams }: { teams: { id: string; name: string; memberCount: number }[] }) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["teams"] });
    qc.invalidateQueries({ queryKey: ["users"] });
  };
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const add = useMutation({ mutationFn: () => createTeam(name.trim()), onSuccess: () => { refresh(); setName(""); } });
  const rename = useMutation({ mutationFn: (t: { id: string; name: string }) => renameTeam(t.id, t.name), onSuccess: () => { refresh(); setEditId(null); } });
  const remove = useMutation({ mutationFn: (id: string) => deleteTeam(id), onSuccess: refresh });

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-foreground mb-3">Teams</h2>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2 mb-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New team name" onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) add.mutate(); }} className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground" />
          <button onClick={() => add.mutate()} disabled={!name.trim() || add.isPending} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50">Add team</button>
        </div>
        {add.isError && <p className="text-sm text-red-500 mb-2">{(add.error as Error).message}</p>}
        <ul className="divide-y divide-border">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5">
              {editId === t.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-2 py-1 rounded bg-background border border-border text-foreground" autoFocus />
                  <button onClick={() => rename.mutate({ id: t.id, name: editName.trim() })} disabled={!editName.trim()} className="text-accent"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-foreground font-medium">{t.name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{t.memberCount} member{t.memberCount === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setEditId(t.id); setEditName(t.name); }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm(`Delete team "${t.name}"? Members will be unassigned.`)) remove.mutate(t.id); }} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </>
              )}
            </li>
          ))}
          {teams.length === 0 && <li className="py-4 text-center text-muted-foreground text-sm">No teams yet.</li>}
        </ul>
      </div>
    </div>
  );
}
