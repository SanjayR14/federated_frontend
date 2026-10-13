import { Badge } from "@/components/ui/badge";

export function RiskBadge({ category, color }) {
  if (!category) return null;
  return (
    <Badge
      className="border-0 px-3 py-1 text-sm font-semibold text-white shadow-sm"
      style={{ backgroundColor: color || "#64748b" }}
    >
      {category}
    </Badge>
  );
}

export function ConfidenceBadge({ level, score }) {
  const styles = {
    High: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Moderate: "bg-amber-100 text-amber-900 border-amber-200",
    Low: "bg-rose-100 text-rose-800 border-rose-200",
  };
  const cls = styles[level] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <Badge variant="outline" className={`${cls} font-medium`}>
      {level || "—"} confidence
      {score != null ? ` (${score})` : ""}
    </Badge>
  );
}
