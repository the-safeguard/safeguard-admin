import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { UsagePoint } from "@the-safeguard/types";

export function UsageChart({ data }: { data: UsagePoint[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Usage Analytics</h3>
        <p className="text-sm text-muted-foreground">
          API queries and security incidents over time
        </p>
      </div>
      <div className="flex-1 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
          <XAxis dataKey="date" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
          <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              color: "var(--color-foreground)",
            }}
          />
          <Legend wrapperStyle={{ color: "var(--color-muted-foreground)" }} />
          <Line
            type="monotone"
            dataKey="queries"
            stroke="var(--color-chart-1)"
            strokeWidth={3}
            dot={{ fill: "var(--color-chart-1)", r: 4 }}
            activeDot={{ r: 6 }}
            name="Queries"
          />
          <Line
            type="monotone"
            dataKey="incidents"
            stroke="var(--color-chart-4)"
            strokeWidth={3}
            dot={{ fill: "var(--color-chart-4)", r: 4 }}
            activeDot={{ r: 6 }}
            name="Incidents"
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
