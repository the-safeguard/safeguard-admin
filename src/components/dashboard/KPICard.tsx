import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  trend?: { value: number; direction: "up" | "down" };
}

export function KPICard({ title, value, unit, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-card/80">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend.direction === "up" ? "text-green-500" : "text-orange-500"
                }`}
              >
                {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-accent/10 p-3">
          <Icon className="h-6 w-6 text-accent" />
        </div>
      </div>
    </div>
  );
}
