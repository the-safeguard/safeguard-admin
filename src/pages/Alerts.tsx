import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RiskAlertsTable } from "../components/dashboard/RiskAlertsTable";
import { getAlerts } from "../lib/api";

export function Alerts() {
  // Poll so the list reflects gateway + extension activity live (same as dashboard).
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: getAlerts, refetchInterval: 8000 });

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Risk Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Every security incident detected across the gateway and browser extensions.
        </p>
      </div>

      {alerts.isLoading ? (
        <div className="rounded-lg border border-border bg-card p-6 h-64 animate-pulse" />
      ) : (
        <RiskAlertsTable
          alerts={alerts.data ?? []}
          title="All Risk Alerts"
          subtitle="Most recent first"
        />
      )}
    </div>
  );
}
