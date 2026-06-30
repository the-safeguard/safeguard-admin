import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getLogs } from "../lib/api";

const PAGE = 25;
const PROVIDERS = ["", "openai", "anthropic", "ollama", "vllm"];

export function Logs() {
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(0);

  const { data: logs = [], isFetching, refetch } = useQuery({
    queryKey: ["logs", provider, page],
    queryFn: () => getLogs({ provider: provider || undefined, limit: PAGE, offset: page * PAGE }),
    placeholderData: keepPreviousData,
    refetchInterval: 8000,
  });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usage Logs</h1>
          <p className="text-muted-foreground mt-1">Audit trail of all proxied AI requests</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{p === "" ? "All providers" : p}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Time", "Model", "Provider", "Route", "Prompt", "Output", "Latency", "Redactions", "Blocked"].map((h) => (
                <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No requests logged{provider ? ` for ${provider}` : ""} yet. Traffic through the gateway appears here.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{l.timestamp}</td>
                <td className="py-3 px-4 text-foreground">{l.model}</td>
                <td className="py-3 px-4 text-muted-foreground">{l.provider}</td>
                <td className="py-3 px-4 text-muted-foreground">{l.route}</td>
                <td className="py-3 px-4 text-foreground">{l.promptTokens}</td>
                <td className="py-3 px-4 text-foreground">{l.outputTokens}</td>
                <td className="py-3 px-4 text-muted-foreground">{l.latencyMs}ms</td>
                <td className="py-3 px-4">
                  {l.redactions > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-500">{l.redactions}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {l.blocked ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-500">blocked</span>
                  ) : (
                    <span className="text-green-500">ok</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          Page {page + 1}{logs.length === PAGE ? "" : " (end)"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border text-sm disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < PAGE}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-card border border-border text-sm disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
