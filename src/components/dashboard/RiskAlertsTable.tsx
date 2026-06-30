import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { RiskAlert } from "@the-safeguard/types";

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

const statusColors: Record<string, string> = {
  open: "text-yellow-500",
  investigating: "text-blue-500",
  resolved: "text-green-500",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function RiskAlertsTable({
  alerts,
  limit,
  viewAllHref,
  title = "Recent Risk Alerts",
  subtitle = "Latest security incidents",
}: {
  alerts: RiskAlert[];
  /** Cap the rows shown (e.g. 5 on the dashboard). Omit to show all. */
  limit?: number;
  /** When set with more rows than `limit`, render a "View all" link. */
  viewAllHref?: string;
  title?: string;
  subtitle?: string;
}) {
  const shown = limit != null ? alerts.slice(0, limit) : alerts;
  const hasMore = limit != null && alerts.length > limit;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>{alerts.length} incidents</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Team</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Alert</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Severity</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No alerts yet
                </td>
              </tr>
            )}
            {shown.map((alert) => (
              <tr key={alert.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 text-muted-foreground">{alert.timestamp}</td>
                <td className="py-3 px-4 text-foreground">{alert.team}</td>
                <td className="py-3 px-4 text-foreground">{alert.message}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${severityColors[alert.severity]}`}
                  >
                    {cap(alert.severity)}
                  </span>
                </td>
                <td className={`py-3 px-4 font-medium ${statusColors[alert.status]}`}>
                  {cap(alert.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && viewAllHref && (
        <div className="mt-4 border-t border-border pt-4 text-center">
          <Link
            to={viewAllHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            View all {alerts.length} alerts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
