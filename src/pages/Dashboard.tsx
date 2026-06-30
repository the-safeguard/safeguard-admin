import { Users, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../components/dashboard/KPICard";
import { UsageChart } from "../components/dashboard/UsageChart";
import { RiskAlertsTable } from "../components/dashboard/RiskAlertsTable";
import { getActivity, getAlerts, getKpis, getQuota, getUsage, type QuotaStatus } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export function Dashboard() {
  const { user } = useAuth();
  // Poll every 8s so the dashboard reflects gateway + extension activity live.
  const live = { refetchInterval: 8000 };
  const kpis = useQuery({ queryKey: ["kpis"], queryFn: getKpis, ...live });
  const usage = useQuery({ queryKey: ["usage"], queryFn: getUsage, ...live });
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: getAlerts, ...live });
  const activity = useQuery({ queryKey: ["activity"], queryFn: getActivity, ...live });
  const quota = useQuery({ queryKey: ["quota"], queryFn: getQuota, ...live });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back{user ? `, ${user.name}` : ""}. Here's your AI governance overview.
        </p>
      </div>

      <div className="grid gap-6 mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Active Users" value={kpis.data?.activeUsers ?? "—"} icon={Users} />
        <KPICard title="Queries Today" value={kpis.data?.queriesToday ?? "—"} unit="requests" icon={Activity} />
        <KPICard title="Risk Incidents" value={kpis.data?.riskIncidents ?? "—"} icon={AlertCircle} />
        <KPICard
          title="Compliance Score"
          value={kpis.data ? `${kpis.data.complianceScore}%` : "—"}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-8 mb-8 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2 h-full">
          {usage.data ? (
            <UsageChart data={usage.data} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 h-full min-h-[430px] animate-pulse" />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 h-full">
          <h3 className="text-lg font-semibold text-foreground mb-6">Quick Stats</h3>
          <div className="space-y-4">
            {quota.data && <QuotaMeter q={quota.data} />}
            <Stat label="Total Queries (10d)" value={(usage.data ?? []).reduce((a, p) => a + p.queries, 0)} border={!!quota.data} />
            <Stat label="Open Incidents" value={kpis.data?.riskIncidents ?? 0} border />
            <Stat label="Compliance" value={kpis.data ? `${kpis.data.complianceScore}%` : "—"} border />
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">Standards</p>
              <p className="text-xs text-green-500 font-medium mt-2">✓ GDPR, CCPA ready</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RiskAlertsTable alerts={alerts.data ?? []} limit={5} viewAllHref="/alerts" />
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {(activity.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
            {(activity.data ?? []).map((a) => (
              <div key={a.id} className="border-b border-border pb-4 last:border-0">
                <p className="text-xs text-muted-foreground">{a.timestamp}</p>
                <p className="text-sm text-foreground mt-1">
                  <span className="font-medium">{a.user}</span> {a.action}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{a.target}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, border }: { label: string; value: number | string; border?: boolean }) {
  return (
    <div className={border ? "border-t border-border pt-4" : ""}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

/** Daily request-quota meter — plan tier, used/limit, and reset time. */
function QuotaMeter({ q }: { q: QuotaStatus }) {
  const unlimited = q.limit == null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((q.used / Math.max(q.limit!, 1)) * 100));
  const bar = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-accent";
  const resetsIn = (() => {
    const mins = Math.max(0, Math.round((q.resetsAt * 1000 - Date.now()) / 60000));
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  })();
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Daily quota</p>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{q.plan}</span>
      </div>
      <p className="text-xl font-bold text-foreground mt-1">
        {q.used.toLocaleString()}
        <span className="text-sm font-normal text-muted-foreground">
          {unlimited ? " requests · unlimited" : ` / ${q.limit!.toLocaleString()} requests`}
        </span>
      </p>
      {!unlimited && (
        <>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {q.remaining!.toLocaleString()} left · resets in {resetsIn}
          </p>
        </>
      )}
    </div>
  );
}
