import { Brain, ListChecks, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HbA1cGauge } from "./HbA1cGauge";
import { RiskBadge, ConfidenceBadge } from "./RiskBadge";

export function PatientClinicalPanel({ aiPrediction, aiNarrative, recommendations = [] }) {
  const pred = aiPrediction || {};
  const explanation = aiNarrative || pred.medical_explanation;
  const recs = recommendations.length ? recommendations : pred.recommendations || [];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="border border-border/80 shadow-md lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">
            HbA1c gauge
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-6">
          <HbA1cGauge value={pred.predicted_hba1c} />
          <RiskBadge category={pred.risk_category || pred.triage_level} color={pred.risk_color} />
          <ConfidenceBadge level={pred.confidence_level} score={pred.confidence_score} />
        </CardContent>
      </Card>

      <Card className="border border-border/80 shadow-md lg:col-span-8">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-500">
              AI clinical explanation
            </CardTitle>
          </div>
          <CardDescription>
            Rule-based interpretation from federated model output and metabolic markers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>{explanation || "No explanation available for this visit."}</p>
          {pred.model_source && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Source: {pred.model_source || pred.modelSource}
            </p>
          )}
        </CardContent>
      </Card>

      {recs.length > 0 && (
        <Card className="border border-amber-200/80 bg-amber-50/40 shadow-sm lg:col-span-12">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-amber-700" />
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-amber-900/80">
                Care recommendations
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-amber-950/90">
              {recs.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

