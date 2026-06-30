import { useQuery } from "@tanstack/react-query";
import { Globe, ShieldAlert, ShieldX } from "lucide-react";
import { getDiscovery, getDiscoveryEvents, getDiscoveryLabels } from "../lib/api";

const SITE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  grok: "Grok",
  gemini: "Gemini",
  claude: "Claude",
  copilot: "Microsoft Copilot",
  perplexity: "Perplexity",
  deepseek: "DeepSeek",
  mistral: "Mistral",
  metaai: "Meta AI",
};
const siteName = (id: string) => SITE_LABELS[id] ?? id;

const live = { refetchInterval: 8000 };

const outcomeBadge: Record<string, string> = {
  block: "bg-red-500/10 text-red-500",
  redact: "bg-yellow-500/10 text-yellow-500",
  flag: "bg-blue-500/10 text-blue-500",
};

export function Discovery() {
  const { data: tools = [] } = useQuery({ queryKey: ["discovery"], queryFn: getDiscovery, ...live });
  const { data: labels = [] } = useQuery({ queryKey: ["discovery-labels"], queryFn: getDiscoveryLabels, ...live });
  const { data: events = [] } = useQuery({ queryKey: ["discovery-events"], queryFn: getDiscoveryEvents, ...live });

  const totalCaught = tools.reduce((a, r) => a + r.itemsCaught, 0);
  const totalBlocked = tools.reduce((a, r) => a + r.blocked, 0);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Shadow AI Discovery</h1>
        <p className="text-muted-foreground mt-1">
          AI tools employees use, what sensitive data was caught, and how it was handled — for policy tuning &amp; training.
        </p>
      </div>

      <div className="grid gap-6 mb-8 grid-cols-1 sm:grid-cols-3">
        <Card icon={<Globe className="h-6 w-6 text-accent" />} label="AI tools seen" value={tools.length} />
        <Card icon={<ShieldAlert className="h-6 w-6 text-accent" />} label="Sensitive items caught" value={totalCaught} />
        <Card icon={<ShieldX className="h-6 w-6 text-accent" />} label="Prompts blocked" value={totalBlocked} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Tools */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-x-auto">
          <h3 className="text-lg font-semibold text-foreground p-4 pb-2">AI tools in use</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["AI Tool", "Events", "Items", "Redacted", "Blocked", "Last Seen"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tools.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No Shadow AI activity yet.</td></tr>
              )}
              {tools.map((r) => (
                <tr key={r.site} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-2.5 px-4 text-foreground font-medium">{siteName(r.site)}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{r.events}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-500">{r.itemsCaught}</span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">{r.redacted}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{r.blocked}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{r.lastSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data types caught */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-lg font-semibold text-foreground mb-3">Data types caught</h3>
          {labels.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
          <div className="space-y-2">
            {labels.map((l) => (
              <div key={l.label} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{l.label}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent events drill-down */}
      <div className="mt-8 rounded-lg border border-border bg-card overflow-x-auto">
        <h3 className="text-lg font-semibold text-foreground p-4 pb-2">Recent events</h3>
        <p className="px-4 pb-2 text-xs text-muted-foreground">
          Metadata only — the actual sensitive values are never stored.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Time", "Tool", "Where", "Trigger", "Outcome", "Data types", "Count"].map((h) => (
                <th key={h} className="text-left py-2.5 px-4 font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No events yet.</td></tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">{e.at}</td>
                <td className="py-2.5 px-4 text-foreground">{siteName(e.site)}</td>
                <td className="py-2.5 px-4 text-muted-foreground">{e.host}</td>
                <td className="py-2.5 px-4 text-muted-foreground">{e.action}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${outcomeBadge[e.outcome] ?? ""}`}>{e.outcome}</span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex flex-wrap gap-1">
                    {e.labels.map((l) => (
                      <span key={l} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{l}</span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-4 text-foreground">{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-3">{value}</p>
      </div>
      <div className="rounded-lg bg-accent/10 p-3">{icon}</div>
    </div>
  );
}
