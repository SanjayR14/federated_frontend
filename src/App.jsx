import React, { useState, useEffect, useMemo } from "react";
import {
  searchPatients,
  fetchPatientAnalysis,
  addPatientAndPredict,
} from "@/services/api";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetModal } from "@/components/ui/sheet-modal";
import {
  Activity,
  Hospital,
  Scan,
  Search,
  Stethoscope,
  User,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const HOSPITAL_NODES = ["A", "B", "C", "D", "E"];

const BIOMARKER_FIELDS = [
  { key: "hemoglobin", label: "Hemoglobin" },
  { key: "rbcCount", label: "RBC count" },
  { key: "cholesterol", label: "Cholesterol" },
  { key: "hdl", label: "HDL" },
  { key: "ldl", label: "LDL" },
  { key: "triglycerides", label: "Triglycerides" },
  { key: "creatinine", label: "Creatinine" },
  { key: "urea", label: "Urea" },
];

function DualAxisTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={item.dataKey} className="flex items-center gap-2 tabular-nums">
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}:</span>
            <span className="font-medium text-foreground">
              {item.value}
              {item.dataKey === "hba1c" ? " %" : " mg/dL"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{row.subject}</p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        Lab value: <span className="font-medium text-foreground">{row.value}</span>
      </p>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5">
        <CardHeader className="space-y-2 pb-2">
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-64 animate-pulse rounded bg-muted/80" />
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center rounded-xl bg-gradient-to-b from-muted/80 to-muted/40">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/15 bg-white/10 shadow-lg">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-transparent border-t-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5 lg:col-span-5">
          <CardHeader className="space-y-2">
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-52 animate-pulse rounded bg-muted/70" />
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <div className="h-[350px] w-full max-w-sm animate-pulse rounded-full bg-muted/60" />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className={`border border-border/80 shadow-md ring-1 ring-slate-900/5 ${
                i === 1 ? "sm:col-span-2" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/80" />
                <div className="h-6 w-20 animate-pulse rounded-md bg-muted/60" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

const emptyBiomarkerForm = () =>
  BIOMARKER_FIELDS.reduce((acc, { key }) => {
    acc[key] = "";
    return acc;
  }, {});

function App() {
  const [hospitalId, setHospitalId] = useState("A");
  const [medIdQuery, setMedIdQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedMedId, setSelectedMedId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const hospitalNode = analysis?.patient?.hospitalId
    ? `Hospital ${analysis.patient.hospitalId}`
    : null;
  const modelSource = analysis?.aiPrediction?.modelSource ?? 'Global model';
  const modelOutputLabel = 'Global model output';
  const showGlobalPrediction = false;

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyBiomarkerForm);
  const [addOptional, setAddOptional] = useState({
    medId: "",
    collectedDate: "",
    hba1c: "",
    glucose: "",
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addResult, setAddResult] = useState(null);

  useEffect(() => {
    const q = medIdQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const t = setTimeout(() => {
      searchPatients(hospitalId, q)
        .then((res) => setSearchResults(res.data || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 280);

    return () => clearTimeout(t);
  }, [medIdQuery, hospitalId]);

  const handleViewAnalysis = async (medId) => {
    setSelectedMedId(medId);
    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const res = await fetchPatientAnalysis(medId);
      const data = res.data || {};
      setAnalysis({
        patient: data.patient || null,
        reportCount: data.reportCount ?? 0,
        aiPrediction: data.aiPrediction,
        aiNarrative: data.aiNarrative || null,
        trends: data.trends,
        history: Array.isArray(data.history) ? data.history : [],
        radarData: Array.isArray(data.radarData) ? data.radarData : [],
      });
    } catch (err) {
      console.error("Analysis failed", err);
      setAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const chartData = useMemo(() => {
    const h = analysis?.history;
    if (!Array.isArray(h) || h.length === 0) return [];
    return h.map((row) => {
      const rawHba1c = Number(row.hba1c) || 0;
      const pred =
        row.predicted_hba1c != null && row.predicted_hba1c !== ""
          ? Number(row.predicted_hba1c)
          : NaN;
      const hba1c =
        rawHba1c !== 0 ? rawHba1c : Number.isFinite(pred) ? pred : 0;
      return { ...row, hba1c };
    });
  }, [analysis?.history]);
  const radarRows = analysis?.radarData?.length ? analysis.radarData : [];
  const radarDomainMax = useMemo(() => {
    if (!radarRows.length) return 100;
    const maxV = Math.max(...radarRows.map((r) => Number(r.value) || 0), 1);
    return Math.ceil(maxV * 1.15);
  }, [radarRows]);

  const triageLevel = analysis?.aiPrediction?.triage_level;
  const isUrgentTriage = triageLevel === "Urgent";
  const isPriorityTriage = triageLevel === "Priority";
  const showAlertBadge = isUrgentTriage || isPriorityTriage;

  const resetAddForm = () => {
    setAddForm(emptyBiomarkerForm());
    setAddOptional({
      medId: "",
      collectedDate: "",
      hba1c: "",
      glucose: "",
    });
    setAddError(null);
    setAddResult(null);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddResult(null);
    setAddSubmitting(true);
    try {
      const payload = {
        hospitalId,
        ...Object.fromEntries(
          BIOMARKER_FIELDS.map(({ key }) => [key, Number(addForm[key])])
        ),
      };
      const trimmedMed = addOptional.medId.trim();
      if (trimmedMed !== "") payload.medId = trimmedMed;
      if (addOptional.collectedDate !== "")
        payload.collectedDate = addOptional.collectedDate;
      if (addOptional.hba1c !== "") payload.hba1c = Number(addOptional.hba1c);
      if (addOptional.glucose !== "") payload.glucose = Number(addOptional.glucose);

      const { data } = await addPatientAndPredict(payload);
      setAddResult(data);
      const savedMedId = String(data.medId);
      setMedIdQuery(savedMedId);
      if (selectedMedId === savedMedId) {
        await handleViewAnalysis(savedMedId);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Could not add patient";
      setAddError(msg);
    } finally {
      setAddSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border/80 bg-card py-6 pl-6 pr-4 shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="mb-8 flex items-center gap-2.5 text-primary">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Hospital className="size-5" strokeWidth={2} />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Fed-AI
            </span>
            <span className="text-sm font-semibold text-foreground">
              Clinical mesh
            </span>
          </div>
        </div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Hospital node
        </p>
        <nav className="flex flex-col gap-1 pr-2">
          {HOSPITAL_NODES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setHospitalId(id);
                setSelectedMedId(null);
                setAnalysis(null);
                setMedIdQuery("");
                setSearchResults([]);
              }}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                hospitalId === id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-slate-100"
              }`}
            >
              <span>Hospital {id}</span>
              <ChevronRight
                className="size-4 opacity-0 transition-opacity"
                style={{ opacity: hospitalId === id ? 1 : 0 }}
              />
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-border/80 pt-5 text-[11px] leading-relaxed text-muted-foreground">
          Nodes keep PHI local. Only model-safe aggregates participate in
          federation.
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-64">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 px-6 py-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/75 md:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Clinical operations
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Hospital {hospitalId}
                <span className="font-medium text-slate-500"> · Dashboard</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Search MedID, analyze longitudinal labs, or add a patient for the
                federated model.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/5 px-3 py-1 text-primary shadow-sm"
              >
                {loadingAnalysis ? 'Analyzing...' : 'Node online'}
              </Badge>
              <Button
                type="button"
                variant="secondary"
                className="h-9 gap-1.5"
                onClick={() => {
                  resetAddForm();
                  setAddOpen(true);
                }}
              >
                <UserPlus className="size-4" />
                New patient
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto grid max-w-[1400px] gap-6 p-6 md:gap-8 md:p-8 lg:grid-cols-12">
            <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5 lg:col-span-4 xl:col-span-3">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-4 text-primary" />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Patient roster
                  </CardTitle>
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  Search by MedID; only matching rows are listed.
                </CardDescription>
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search MedID..."
                      className="h-9 pl-9"
                      value={medIdQuery}
                      onChange={(e) => setMedIdQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 gap-1 px-3"
                    onClick={() => {
                      resetAddForm();
                      setAddOpen(true);
                    }}
                  >
                    <UserPlus className="size-4" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!medIdQuery.trim() ? (
                  <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                    Type a MedID to search this hospital&apos;s roster.
                  </p>
                ) : searchLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-11 animate-pulse rounded-lg bg-muted/70"
                      />
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No patients match &quot;{medIdQuery.trim()}&quot;.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/80 hover:bg-transparent">
                        <TableHead className="pl-6 text-slate-600">MedID</TableHead>
                        <TableHead className="pr-6 text-right text-slate-600">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((p) => (
                        <TableRow
                          key={p.medId}
                          data-state={
                            selectedMedId === p.medId ? "selected" : undefined
                          }
                          className={`border-border/60 ${
                            selectedMedId === p.medId
                              ? "bg-slate-100/80"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <TableCell className="pl-6 font-medium text-slate-900">
                            {p.medId}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleViewAnalysis(p.medId)}
                              disabled={loadingAnalysis}
                              className="rounded-full border border-primary/20 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                            >
                              Analyze
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6 lg:col-span-8 xl:col-span-9">
              {!selectedMedId && !loadingAnalysis && (
                <Card className="flex min-h-[360px] flex-col items-center justify-center border-2 border-dashed border-border/80 bg-white/60 shadow-none ring-0">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                    <User className="size-12 text-muted-foreground/50" />
                  </div>
                  <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                    Search a MedID and choose <strong>Analyze</strong> to load the
                    line chart (HbA1c + average glucose) and metabolic radar.
                  </p>
                </Card>
              )}

              {selectedMedId && loadingAnalysis && <AnalysisSkeleton />}

              {selectedMedId && !loadingAnalysis && analysis && (
                <>
                  {analysis.patient && (
                    <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5">
                      <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle className="text-xl font-semibold text-slate-900">
                            {analysis.patient.name}
                          </CardTitle>
                          <CardDescription className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            <span>
                              <span className="text-muted-foreground">MedID</span>{" "}
                              <span className="font-medium text-foreground">
                                {analysis.patient.medId}
                              </span>
                            </span>
                            <span>
                              <span className="text-muted-foreground">Node</span>{" "}
                              <span className="font-medium text-foreground">
                                {hospitalNode ?? `Hospital ${hospitalId}`}
                              </span>
                            </span>
                            {modelSource && (
                              <span>
                                <span className="text-muted-foreground">Model</span>{" "}
                                <span className="font-medium text-foreground">
                                  {modelSource}
                                </span>
                              </span>
                            )}
                            {analysis.patient.age != null && (
                              <span>
                                <span className="text-muted-foreground">Age</span>{" "}
                                <span className="font-medium text-foreground">
                                  {analysis.patient.age}
                                </span>
                              </span>
                            )}
                            {analysis.patient.gender && (
                              <span>
                                <span className="text-muted-foreground">Sex</span>{" "}
                                <span className="font-medium text-foreground">
                                  {analysis.patient.gender}
                                </span>
                              </span>
                            )}
                            {modelSource && (
                              <span>
                                <span className="text-muted-foreground">Model</span>{" "}
                                <span className="font-medium text-foreground">
                                  {modelSource}
                                </span>
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            No. of Visits: {analysis.reportCount ?? 0}
                          </Badge>
                          {analysis.patient.joinedDate && (
                            <span className="text-xs text-muted-foreground">
                              Enrolled{" "}
                              {new Date(analysis.patient.joinedDate).toLocaleDateString(
                                undefined,
                                { year: "numeric", month: "short", day: "numeric" },
                              )}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  )}

                  {analysis.aiNarrative && (
                  
                    <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          AI clinical insight
                        </CardTitle>
                        <CardDescription>
                          Generated from the current lab visit and model triage estimate.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm leading-relaxed text-slate-700">
                        <p className="whitespace-pre-line">{analysis.aiNarrative}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">
                            Glycemic trajectory
                          </CardTitle>
                          <CardDescription>
                            HbA1c (% · left) vs. avg glucose (mg/dL · right) — all reports, oldest → newest —{" "}
                            <span className="font-medium text-foreground">
                              {selectedMedId}
                            </span>
                          </CardDescription>
                        </div>
                        {showAlertBadge && (
                          <Badge
                            variant="risk"
                            className="animate-pulse-risk px-3 py-1 uppercase tracking-wide"
                          >
                            {isUrgentTriage ? 'Urgent' : 'Priority'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {chartData.length === 0 ? (
                        <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                          No longitudinal labs for this patient.
                        </div>
                      ) : (
                        <div className="h-[350px] w-full min-h-[350px] min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={chartData}
                              margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--border))"
                              />
                              <XAxis
                                dataKey="collectedDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                              />
                              <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#2563eb" }}
                                domain={["auto", "auto"]}
                                label={{
                                  value: "HbA1c %",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: { fill: "#2563eb", fontSize: 10 },
                                }}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: "#059669" }}
                                domain={["auto", "auto"]}
                                label={{
                                  value: "Glucose mg/dL",
                                  angle: 90,
                                  position: "insideRight",
                                  style: { fill: "#059669", fontSize: 10 },
                                }}
                              />
                              <Tooltip content={<DualAxisTooltip />} />
                              <Legend
                                wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
                              />
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="hba1c"
                                name="HbA1c"
                                stroke="#2563eb"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#2563eb" }}
                                activeDot={{ r: 6 }}
                                connectNulls
                              />
                              <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="avg_glucose"
                                name="Avg glucose"
                                stroke="#059669"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#059669" }}
                                activeDot={{ r: 6 }}
                                connectNulls
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-12">
                    <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5 lg:col-span-5">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Scan className="size-4 text-primary" />
                          <CardTitle className="text-base text-slate-900">
                            Metabolic profile
                          </CardTitle>
                        </div>
                        <CardDescription>
                          Radar of key labs (raw values). Scale fits the current
                          patient.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-6">
                        {radarRows.length === 0 ? (
                          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                            No profile metrics returned.
                          </div>
                        ) : (
                          <div className="h-[350px] w-full min-h-[350px] max-w-md min-w-0 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={radarRows} cx="50%" cy="50%">
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis
                                  dataKey="subject"
                                  tick={{ fontSize: 10, fill: "#64748b" }}
                                />
                                <PolarRadiusAxis
                                  angle={30}
                                  domain={[0, radarDomainMax]}
                                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                                />
                                <Radar
                                  name="Labs"
                                  dataKey="value"
                                  stroke="hsl(var(--primary))"
                                  fill="hsl(var(--primary))"
                                  fillOpacity={0.35}
                                  strokeWidth={2}
                                />
                                <Tooltip content={<RadarTooltip />} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                      <Card className="overflow-hidden border border-border/80 bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-lg ring-1 ring-slate-900/10 sm:col-span-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-medium text-blue-100/90">
                                {modelOutputLabel}
                              </p>
                              <h2 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight">
                                {analysis.aiPrediction?.triage_level ?? analysis.aiPrediction?.risk_level ?? "—"}
                                {showAlertBadge && (
                                  <Badge
                                    variant="risk"
                                    className="animate-pulse-risk border-white/20 bg-white/20 text-white hover:bg-white/25"
                                  >
                                    {isUrgentTriage ? 'Urgent' : 'Priority'}
                                  </Badge>
                                )}
                              </h2>
                              <p className="mt-3 max-w-md text-xs leading-relaxed text-blue-100/85">
                                Prediction uses {modelSource} on node {hospitalNode ?? `Hospital ${hospitalId}`}.
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
                              <Activity className="size-8 text-white/90" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Predicted HbA1c
                            </p>
                            <Activity className="size-4 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold tabular-nums text-slate-900">
                            {analysis.aiPrediction?.predicted_hba1c ?? "—"}
                            <span className="text-lg font-semibold text-muted-foreground">
                              %
                            </span>
                          </div>
                          {analysis.trends && (
                            <Badge
                              className="mt-3"
                              variant={
                                analysis.trends.status === "Improving"
                                  ? "success"
                                  : "outline"
                              }
                            >
                              {analysis.trends.status}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border border-border/80 shadow-md ring-1 ring-slate-900/5">
                        <CardHeader className="pb-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Glucose delta
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div
                            className={`text-3xl font-bold tabular-nums ${
                              (analysis.trends?.glucoseDiff ?? 0) > 0
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {(analysis.trends?.glucoseDiff ?? 0) > 0 ? "+" : ""}
                            {analysis.trends?.glucoseDiff ?? 0}
                            <span className="ml-1 text-base font-medium text-muted-foreground">
                              mg/dL
                            </span>
                          </div>
                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            vs. prior visit
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <SheetModal
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddForm();
        }}
        title="New patient & predict"
        description={`Saves to Hospital ${hospitalId} and runs the global PyTorch model on the eight biomarkers.`}
      >
          <form onSubmit={handleAddPatient} className="space-y-4">
            <p className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Leave <strong className="text-foreground">MedID</strong> empty for the next auto
              ID, or enter an existing MedID to add another visit for that patient.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-medid" className="text-[11px]">
                  MedID (optional)
                </Label>
                <Input
                  id="add-medid"
                  placeholder="Auto if empty"
                  value={addOptional.medId}
                  onChange={(e) =>
                    setAddOptional((p) => ({ ...p, medId: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-collected" className="text-[11px]">
                  Visit date/time (optional)
                </Label>
                <Input
                  id="add-collected"
                  type="datetime-local"
                  value={addOptional.collectedDate}
                  onChange={(e) =>
                    setAddOptional((p) => ({ ...p, collectedDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid max-h-[42vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
              {BIOMARKER_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-[11px]">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    required
                    step="any"
                    value={addForm[key]}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="opt-hba1c" className="text-[11px] text-muted-foreground">
                  HbA1c % (optional)
                </Label>
                <Input
                  id="opt-hba1c"
                  step="any"
                  placeholder="Uses model if empty"
                  value={addOptional.hba1c}
                  onChange={(e) =>
                    setAddOptional((p) => ({ ...p, hba1c: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opt-glucose" className="text-[11px] text-muted-foreground">
                  Avg glucose (optional)
                </Label>
                <Input
                  id="opt-glucose"
                  step="any"
                  placeholder="0 if empty"
                  value={addOptional.glucose}
                  onChange={(e) =>
                    setAddOptional((p) => ({ ...p, glucose: e.target.value }))
                  }
                />
              </div>
            </div>

            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}

            {addResult?.aiPrediction && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="font-semibold text-foreground">Model output</p>
                <p className="mt-1 text-muted-foreground">
                  Hospital: <span className="font-medium text-foreground">{addResult.hospitalId}</span>
                  {" · "}Triage:{" "}
                  <span className="font-medium text-foreground">
                    {addResult.aiPrediction.predicted_hba1c}%
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Record stored for MedID <strong>{addResult.medId}</strong>
                  {addResult.medIdAutoAssigned ? " (auto-assigned)" : ""}. Search
                  this ID for the full analysis view.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Close
              </Button>
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? "Saving…" : "Save & predict"}
              </Button>
            </div>
          </form>
      </SheetModal>
    </div>
  );
}

export default App;
