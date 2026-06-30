import { Check, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Integration } from "@the-safeguard-ai/types";
import {
  configureIntegration,
  getIntegrations,
  installIntegration,
  testIntegration,
  uninstallIntegration,
} from "../lib/api";

export function Extensions() {
  const qc = useQueryClient();
  const { data: items } = useQuery({ queryKey: ["integrations"], queryFn: getIntegrations });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["integrations"] });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Extensions</h1>
        <p className="text-muted-foreground mt-1">
          Send SafeGuard risk alerts to Slack, Teams, or your own webhook endpoint.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(items ?? []).map((ext) => (
          <IntegrationCard key={ext.id} ext={ext} onChange={invalidate} />
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({ ext, onChange }: { ext: Integration; onChange: () => void }) {
  const [url, setUrl] = useState(ext.webhookUrl ?? "");
  const [tested, setTested] = useState<"ok" | string | null>(null);
  useEffect(() => setUrl(ext.webhookUrl ?? ""), [ext.webhookUrl]);

  const install = useMutation({ mutationFn: () => installIntegration(ext.id), onSuccess: onChange });
  const uninstall = useMutation({ mutationFn: () => uninstallIntegration(ext.id), onSuccess: onChange });
  const saveUrl = useMutation({ mutationFn: () => configureIntegration(ext.id, url), onSuccess: onChange });
  const test = useMutation({
    mutationFn: () => testIntegration(ext.id),
    onSuccess: () => { setTested("ok"); setTimeout(() => setTested(null), 3000); },
    onError: (e) => setTested((e as Error).message),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col hover:border-accent/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{ext.icon}</div>
        {ext.installed && (
          <span className="px-2.5 py-1 rounded-full text-xs bg-green-500/10 text-green-500 font-medium">Installed</span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{ext.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{ext.description}</p>

      {ext.configurable ? (
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={ext.id === "webhooks" ? "https://your-endpoint.example/hook" : "https://hooks.slack.com/services/…"}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveUrl.mutate()}
              disabled={!url.trim() || saveUrl.isPending}
              className="flex-1 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
            >
              {saveUrl.isPending ? "Saving…" : ext.webhookUrl ? "Update URL" : "Save & install"}
            </button>
            <button
              onClick={() => test.mutate()}
              disabled={!ext.webhookUrl || test.isPending}
              title={ext.webhookUrl ? "Send a test event" : "Save a URL first"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-muted/50 disabled:opacity-50"
            >
              {tested === "ok" ? <Check className="h-4 w-4 text-green-500" /> : <Send className="h-4 w-4" />}
              Test
            </button>
          </div>
          {tested && tested !== "ok" && <p className="text-xs text-red-500">{tested}</p>}
          {tested === "ok" && <p className="text-xs text-green-500">Test event delivered.</p>}
          {ext.installed && (
            <button onClick={() => uninstall.mutate()} className="w-full text-xs text-muted-foreground hover:text-red-500 pt-1">
              Uninstall
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => (ext.installed ? uninstall.mutate() : install.mutate())}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            ext.installed ? "bg-muted text-foreground hover:bg-border" : "bg-accent text-accent-foreground hover:bg-accent/90"
          }`}
        >
          {ext.installed ? "Uninstall" : "Install"}
        </button>
      )}
    </div>
  );
}
