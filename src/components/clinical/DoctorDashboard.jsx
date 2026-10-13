import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge } from "./RiskBadge";
import { ModelComparisonCharts } from "./ModelComparisonCharts";
import { FederatedExplainerPanel } from "./FederatedExplainerPanel";

export function DoctorDashboard({ data, highRiskPatients = [], hospitalId }) {
  const hospitalMetrics = (data?.localModels || []).map((m) => ({
    hospital: m.Hospital,
    rmse: Number(m.Test_RMSE?.toFixed(3)),
    mape: Number(m.Test_MAPE?.toFixed(2)),
    r2: Number(m.Test_R2?.toFixed(3)),
    model: m.Model,
  }));

  const featureImportance = (data?.featureImportance || []).slice().sort(
    (a, b) => b.importance - a.importance,
  );

  const combined = data?.combinedMetrics?.global || data?.federatedMetrics?.combined_global;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Global RMSE" value={combined?.RMSE?.toFixed(3)} />
        <MetricTile label="Global MAPE" value={`${combined?.MAPE?.toFixed(1)}%`} />
        <MetricTile label="Global R²" value={combined?.R2?.toFixed(3)} />
        <MetricTile label="Hospitals" value={data?.hospitals?.length ?? 5} />
      </div>

      <FederatedExplainerPanel
        summary={data?.clinicalSummary}
        privacy={data?.privacy}
        security={data?.security}
      />

      <ModelComparisonCharts
        comparisonChart={data?.comparisonChart}
        modelsEvaluated={data?.modelsEvaluated}
        communication={data?.communication}
        security={data?.security}
        privacy={data?.privacy}
      />

      <Card className="border border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Hospital-wise federated metrics</CardTitle>
          <CardDescription>Per-node test performance (leakage-free feature set)</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {hospitalMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No metrics loaded.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalMetrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hospital" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="rmse" name="RMSE" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Feature importance</CardTitle>
            <CardDescription>Permutation importance (global federated model)</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {featureImportance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No importance data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureImportance}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 10 }}
                    width={75}
                  />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#be185d" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">High-risk patients</CardTitle>
            <CardDescription>
              Latest visits with diabetes-level risk
              {hospitalId ? ` · Hospital ${hospitalId}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto p-0">
            {highRiskPatients.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No high-risk patients in database for this filter.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MedID</TableHead>
                    <TableHead>HbA1c</TableHead>
                    <TableHead>Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highRiskPatients.map((p) => (
                    <TableRow key={`${p.medId}-${p.hospitalId}`}>
                      <TableCell className="font-medium">{p.medId}</TableCell>
                      <TableCell>{p.predicted_hba1c ?? "—"}%</TableCell>
                      <TableCell>
                        <RiskBadge category={p.risk_category} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <Card className="border border-border/80 shadow-sm">
      <CardContent className="pt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value ?? "—"}</p>
      </CardContent>
    </Card>
  );
}
