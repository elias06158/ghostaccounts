import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { RiskForecast } from "@/components/dashboard/RiskForecast";
import { generateForecast } from "@/lib/risk-forecast";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "Risk Forecast" };

export default async function ForecastPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.forecast");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scanResults } = await supabase
    .from("scan_results")
    .select("*")
    .eq("user_id", user!.id)
    .order("first_detected_at", { ascending: false });

  const results = scanResults ?? [];
  const forecast = generateForecast(results, locale === "de" ? "de" : "en");
  const delta = forecast.months[6].score - forecast.months[0].score;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📈</span>
          <h1 className="text-2xl font-bold text-foreground">{t("page_title")}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {t("page_badge")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t("page_subtitle")}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border/60 bg-card/80 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("metric_now")}</p>
          <p className="text-3xl font-bold" style={{ color: forecast.months[0].score >= 65 ? "#ef4444" : forecast.months[0].score >= 35 ? "#f59e0b" : "#22c55e" }}>
            {forecast.months[0].score}
          </p>
          <p className="text-xs text-muted-foreground">{t("metric_current_score")}</p>
        </div>
        <div className="p-5 rounded-2xl border border-border/60 bg-card/80 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t("metric_in_6_months")}</p>
          <p className="text-3xl font-bold" style={{ color: forecast.months[6].score >= 65 ? "#ef4444" : forecast.months[6].score >= 35 ? "#f59e0b" : "#22c55e" }}>
            {forecast.months[6].score}
          </p>
          <p className="text-xs text-muted-foreground">{t("metric_projected_score")}</p>
        </div>
        <div className={`p-5 rounded-2xl border space-y-1 ${delta > 5 ? "border-red-500/20 bg-red-500/5" : delta < -5 ? "border-green-500/20 bg-green-500/5" : "border-border/60 bg-card/80"}`}>
          <p className="text-xs font-medium text-muted-foreground">{t("metric_trend")}</p>
          <p className={`text-3xl font-bold ${delta > 5 ? "text-red-400" : delta < -5 ? "text-green-400" : "text-amber-400"}`}>
            {delta > 0 ? "+" : ""}{delta}
          </p>
          <p className="text-xs text-muted-foreground">{t("metric_pts_in_6_months")}</p>
        </div>
      </div>

      {/* Full forecast widget */}
      <RiskForecast results={results} locale={locale} />

      {/* How it works */}
      <div className="rounded-2xl border border-border/50 bg-muted/20 p-6 space-y-4">
        <h2 className="font-semibold text-foreground">{t("how_title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1.5">
            <div className="text-base">🔓</div>
            <p className="font-medium text-foreground">{t("how_breach_title")}</p>
            <p className="text-muted-foreground text-xs">{t("how_breach_desc")}</p>
          </div>
          <div className="space-y-1.5">
            <div className="text-base">💤</div>
            <p className="font-medium text-foreground">{t("how_inactive_title")}</p>
            <p className="text-muted-foreground text-xs">{t("how_inactive_desc")}</p>
          </div>
          <div className="space-y-1.5">
            <div className="text-base">🌐</div>
            <p className="font-medium text-foreground">{t("how_footprint_title")}</p>
            <p className="text-muted-foreground text-xs">{t("how_footprint_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
