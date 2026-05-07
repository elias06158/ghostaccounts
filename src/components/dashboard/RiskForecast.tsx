"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { generateForecast } from "@/lib/risk-forecast";
import type { ScanResult } from "@/types/database";

interface RiskForecastProps {
  results: ScanResult[];
  locale: string;
}

export function RiskForecast({ results, locale }: RiskForecastProps) {
  const t = useTranslations("dashboard.forecast");
  const params = useParams();
  const loc = (params?.locale as string) || locale;

  const forecast = useMemo(
    () => generateForecast(results, locale === "de" ? "de" : "en"),
    [results, locale]
  );

  const { months, headline, actions } = forecast;

  // For the SVG sparkline
  const sparkWidth = 480;
  const sparkHeight = 80;
  const maxScore = 100;

  const points = months.map((m, i) => {
    const x = (i / (months.length - 1)) * sparkWidth;
    const y = sparkHeight - (m.score / maxScore) * sparkHeight;
    return { x, y, ...m };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  const areaD = [
    `M ${points[0].x},${sparkHeight}`,
    ...points.map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${sparkHeight}`,
    "Z",
  ].join(" ");

  const nowScore = months[0].score;
  const endScore = months[months.length - 1].score;
  const delta = endScore - nowScore;
  const isRising = delta > 5;
  const isStable = Math.abs(delta) <= 5;

  const scoreColor = (s: number) => {
    if (s >= 65) return "#ef4444";
    if (s >= 35) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {isRising ? (
          <span className="flex items-center gap-1 text-xs font-medium text-red-400 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-3 h-3" />
            +{delta} pts
          </span>
        ) : isStable ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-400 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-3 h-3" />
            {t("stable")}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-green-400 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-3 h-3" />
            {delta} pts
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Headline */}
        <p className="text-sm text-muted-foreground leading-relaxed">{headline}</p>

        {/* Sparkline chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: 80 }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="forecast-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={scoreColor(endScore)} stopOpacity="0.3" />
                <stop offset="100%" stopColor={scoreColor(endScore)} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path d={areaD} fill="url(#forecast-gradient)" />
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={scoreColor(endScore)}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Score dots */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === 0 || i === points.length - 1 ? 4 : 2.5}
                fill={scoreColor(p.score)}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          {/* Month labels */}
          <div className="flex justify-between mt-1.5 px-0.5">
            {points.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground">{p.label}</span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: scoreColor(p.score) }}
                >
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("actions_title")}
            </p>
            {actions.map((action) => (
              <div
                key={action.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  action.impact === "high"
                    ? "bg-red-500/5 border-red-500/15 hover:border-red-500/30"
                    : action.impact === "medium"
                    ? "bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30"
                    : "bg-green-500/5 border-green-500/15 hover:border-green-500/30"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    action.impact === "high"
                      ? "bg-red-400"
                      : action.impact === "medium"
                      ? "bg-amber-400"
                      : "bg-green-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
                {action.href && (
                  <Link
                    href={`/${loc}/dashboard/${action.href}`}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
