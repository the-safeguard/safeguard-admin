import { useEffect, useState } from "react";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createKey,
  getKeys,
  getSettings,
  revokeKey,
  updateSettings,
  type CreatedKey,
} from "../lib/api";

export function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [orgName, setOrgName] = useState("");
  const [zeroRetention, setZeroRetention] = useState(false);

  useEffect(() => {
    if (data) {
      setOrgName(data.orgName);
      setZeroRetention(data.zeroRetention);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateSettings({ orgName, zeroRetention }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Organization configuration & privacy controls</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Organization name</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Plan</label>
          <p className="text-sm text-muted-foreground capitalize">{data?.plan ?? "—"}</p>
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-border pt-6">
          <div>
            <p className="text-sm font-medium text-foreground">Zero-retention mode</p>
            <p className="text-sm text-muted-foreground mt-1">
              Store request metadata only — prompt and response bodies are never persisted.
            </p>
          </div>
          <label className="flex items-center cursor-pointer mt-1">
            <input type="checkbox" checked={zeroRetention} onChange={(e) => setZeroRetention(e.target.checked)} className="h-5 w-5 accent-accent" />
          </label>
        </div>

        <div className="border-t border-border pt-6">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="px-5 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : save.isSuccess ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </div>

      <KeysSection />
    </div>
  );
}

function KeysSection() {
  const qc = useQueryClient();
  const { data: keys } = useQuery({ queryKey: ["keys"], queryFn: getKeys });
  const [name, setName] = useState("Browser extension");
  const [created, setCreated] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

  const gen = useMutation({
    mutationFn: () => createKey(name),
    onSuccess: (k) => {
      setCreated(k);
      qc.invalidateQueries({ queryKey: ["keys"] });
    },
  });
  const revoke = useMutation({
    mutationFn: revokeKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
  });

  const copy = () => {
    if (created) {
      void navigator.clipboard.writeText(created.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Enrollment keys</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Paste one of these into the SafeGuard browser extension (Settings → Organization key)
        so its Shadow AI events report to this organization. Also authenticates the AI gateway.
      </p>

      {created && (
        <div className="mb-5 rounded-lg border border-accent/40 bg-accent/5 p-4">
          <p className="text-xs text-muted-foreground mb-2">
            Copy this key now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded bg-background border border-border text-sm text-foreground break-all">
              {created.key}
            </code>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
            >
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name"
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          onClick={() => gen.mutate()}
          disabled={gen.isPending}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-60"
        >
          {gen.isPending ? "Generating…" : "Generate key"}
        </button>
      </div>

      <div className="space-y-2">
        {(keys ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        )}
        {(keys ?? []).map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {k.name}{" "}
                {k.revoked && <span className="text-xs text-destructive">(revoked)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                <code>{k.prefix}</code> · created {k.createdAt}
                {k.lastUsed ? ` · last used ${k.lastUsed}` : " · never used"}
              </p>
            </div>
            {!k.revoked && (
              <button
                onClick={() => revoke.mutate(k.id)}
                className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                title="Revoke"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
