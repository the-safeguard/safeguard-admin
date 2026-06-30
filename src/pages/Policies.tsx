import { Globe, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPolicy, deletePolicy, getPolicies, getRulePacks, updatePolicy } from "../lib/api";
import type { Policy } from "@the-safeguard-ai/types";

const ALL_PATTERNS = [
  "email", "api_key", "credit_card", "ssn", "phone",
  "iban", "ip_address", "passport", "intl_phone",
];

type Draft = Pick<Policy, "name" | "description" | "patterns" | "action" | "route" | "deepScan" | "ragEnabled">;

const emptyDraft: Draft = {
  name: "",
  description: "",
  patterns: ["email"],
  action: "redact",
  route: "cloud",
  deepScan: false,
  ragEnabled: false,
};

export function Policies() {
  const qc = useQueryClient();
  const { data: policies } = useQuery({ queryKey: ["policies"], queryFn: getPolicies });
  const [editing, setEditing] = useState<Policy | "new" | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["policies"] });
  const toggle = useMutation({
    mutationFn: (p: Policy) => updatePolicy(p.id, { enabled: !p.enabled }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deletePolicy, onSuccess: invalidate });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Policies</h1>
          <p className="text-muted-foreground mt-1">DLP rules applied to all AI traffic through the gateway</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Policy
        </button>
      </div>

      {editing && (
        <PolicyForm
          initial={editing === "new" ? emptyDraft : editing}
          policyId={editing === "new" ? undefined : editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(policies ?? []).map((p) => (
          <div key={p.id} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove.mutate(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.patterns.map((pat) => (
                <span key={pat} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{pat}</span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Tag>action: {p.action}</Tag>
                <Tag>route: {p.route}</Tag>
                {p.deepScan && <Tag>deep-scan</Tag>}
                {p.ragEnabled && <Tag>RAG</Tag>}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-muted-foreground">{p.enabled ? "Enabled" : "Disabled"}</span>
                <input type="checkbox" checked={p.enabled} onChange={() => toggle.mutate(p)} />
              </label>
            </div>
          </div>
        ))}
        {policies?.length === 0 && (
          <p className="text-muted-foreground">No policies yet. Create one to start protecting traffic.</p>
        )}
      </div>
    </div>
  );
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded bg-muted">{children}</span>
);

function PolicyForm({
  initial,
  policyId,
  onClose,
  onSaved,
}: {
  initial: Draft;
  policyId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const { data: rulePacks } = useQuery({ queryKey: ["rule-packs"], queryFn: getRulePacks });

  // Toggle every detector in a regional pack on/off as a unit.
  const togglePack = (patterns: string[]) => {
    const allOn = patterns.every((p) => d.patterns.includes(p));
    set(
      "patterns",
      allOn
        ? d.patterns.filter((x) => !patterns.includes(x))
        : [...d.patterns, ...patterns.filter((p) => !d.patterns.includes(p))],
    );
  };

  const save = useMutation({
    mutationFn: () => (policyId ? updatePolicy(policyId, d) : createPolicy(d)),
    onSuccess: onSaved,
  });

  const field = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-6 space-y-4">
      <h3 className="font-semibold text-foreground">{policyId ? "Edit policy" : "New policy"}</h3>
      <input placeholder="Policy name" value={d.name} onChange={(e) => set("name", e.target.value)} className={field} />
      <input placeholder="Description" value={d.description} onChange={(e) => set("description", e.target.value)} className={field} />

      <div>
        <p className="text-sm text-muted-foreground mb-2">Detectors</p>
        <div className="flex flex-wrap gap-2">
          {ALL_PATTERNS.map((pat) => {
            const on = d.patterns.includes(pat);
            return (
              <button
                key={pat}
                onClick={() => set("patterns", on ? d.patterns.filter((x) => x !== pat) : [...d.patterns, pat])}
                className={`px-2.5 py-1 rounded-full text-xs ${on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {pat}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Regional rule packs</p>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Optional country-specific identifiers. All off by default — enable only the regions you operate in.
        </p>
        <div className="flex flex-wrap gap-2">
          {(rulePacks ?? []).map((pack) => {
            const patterns = pack.rules.map((r) => r.pattern);
            const on = patterns.length > 0 && patterns.every((p) => d.patterns.includes(p));
            return (
              <button
                key={pack.id}
                type="button"
                title={`${pack.region} · ${pack.description}`}
                onClick={() => togglePack(patterns)}
                className={`px-2.5 py-1 rounded-full text-xs ${on ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {pack.name}
              </button>
            );
          })}
          {rulePacks?.length === 0 && (
            <span className="text-xs text-muted-foreground">No regional packs available.</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          Action
          <select value={d.action} onChange={(e) => set("action", e.target.value as Draft["action"])} className={field}>
            <option value="redact">redact</option>
            <option value="block">block</option>
            <option value="flag">flag</option>
          </select>
        </label>
        <label className="text-sm text-muted-foreground">
          Route
          <select value={d.route} onChange={(e) => set("route", e.target.value as Draft["route"])} className={field}>
            <option value="cloud">cloud (OpenAI/Anthropic)</option>
            <option value="selfhosted">self-hosted (Ollama/vLLM)</option>
          </select>
        </label>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={d.deepScan} onChange={(e) => set("deepScan", e.target.checked)} />
          Deep scan (Presidio NER)
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={d.ragEnabled} onChange={(e) => set("ragEnabled", e.target.checked)} />
          RAG context
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => save.mutate()} disabled={!d.name || save.isPending} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium disabled:opacity-50">
          {save.isPending ? "Saving…" : policyId ? "Save changes" : "Create"}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}
