import React from "react";
import { Shield, Server, GitMerge, Lock, CheckCircle2, Cpu } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FederatedExplainerPanel({ summary, privacy = null, security = null }) {
  const fl = summary?.federated_learning;

  const features = [
    {
      title: "Flower Federated Orchestration",
      description: "Cross-silo FedAvg parameter aggregation using Flower (flwr v1.30.0). Zero raw records leave hospital nodes.",
      icon: Server,
    },
    {
      title: "Differential Privacy (Opacus DP-SGD)",
      description: privacy?.privacy_guarantee
        ? `Calibrated Gaussian noise & per-sample clipping: ${privacy.privacy_guarantee}.`
        : "Formal (ε, δ)-Differential Privacy prevents individual record reconstruction.",
      icon: Shield,
    },
    {
      title: "Cryptographic Secure Aggregation",
      description: "Pairwise additive masking (Bonawitz et al.). Central server reconstructs exact sum while individual weights remain blinded.",
      icon: Lock,
    },
    {
      title: "Byzantine-Resilient Robust Aggregation",
      description: "Coordinate-wise Trimmed Mean & Median defend against adversarial client poisoning and malicious gradient corruption.",
      icon: GitMerge,
    },
  ];

  return (
    <Card className="border border-primary/20 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 shadow-md ring-1 ring-primary/10">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base text-slate-900 flex items-center gap-2">
            <Cpu className="size-4 text-primary" />
            {fl?.title || "Flower Federated Learning & Privacy Mesh"}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
              <CheckCircle2 className="size-3 text-blue-600" />
              Flower Framework
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <CheckCircle2 className="size-3 text-emerald-600" />
              SecAgg Verified
            </span>
            {privacy?.epsilon && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                ε = {privacy.epsilon} (DP-SGD)
              </span>
            )}
          </div>
        </div>
        <CardDescription>
          Multi-hospital decentralized AI combining parameter averaging, differential privacy accounting, and Byzantine resilience.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex gap-3 rounded-xl border border-slate-100 bg-white/80 p-3 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
