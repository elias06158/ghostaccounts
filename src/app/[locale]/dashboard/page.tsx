import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  ScanLine,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ChevronRight,
  ListChecks,
  Sparkles,
  ArrowUpRight,
  BellRing,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { calculateRiskScore, getRiskInsights } from "@/lib/risk-score";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RiskForecast } from "@/components/dashboard/RiskForecast";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.overview");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: scanResults } = await supabase
    .from("scan_results")
    .select("*")
    .eq("user_id", user!.id)
    .order("first_detected_at", { ascending: false });

  const { data: breachAlerts } = await supabase
    .from("breach_alerts")
    .select("*")
    .eq("user_id", user!.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const results = scanResults ?? [];
  const risk = calculateRiskScore(results);
  const riskInsights = getRiskInsights(risk);
  const hasScanned = results.length > 0;

  const riskColor =
    risk.level === "low"
      ? "text-green-500"
      : risk.level === "medium"
      ? "text-amber-500"
      : "text-red-500";

  const riskLabel =
    risk.level === "low"
      ? t("risk_low")
      : risk.level === "medium"
      ? t("risk_medium")
      : t("risk_high");

  const displayName =
    profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const quickActions = [
    {
      id: "scan",
      icon: <ScanLine className="w-4 h-4 text-indigo-500" />,
      title: t("action_scan_title"),
      description: t("action_scan_desc"),
      href: `/${locale}/dashboard/scan`,
      buttonLabel: t("action_scan_button"),
    },
    {
      id: "breaches",
      icon: <BellRing className="w-4 h-4 text-red-500" />,
      title: t("action_breach_title"),
      description: t("action_breach_desc"),
      href: `/${locale}/dashboard/accounts?filter=breached`,
      buttonLabel: t("action_breach_button"),
    },
    {
      id: "cleanup",
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
      title: t("action_cleanup_title"),
      description: t("action_cleanup_desc"),
      href: `/${locale}/dashboard/accounts?filter=active`,
      buttonLabel: t("action_cleanup_button"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("greeting")}, {displayName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("last_scan")}:{" "}
          {profile?.last_scan_at
            ? new Date(profile.last_scan_at).toLocaleDateString()
            : t("never_scanned")}
        </p>
      </div>

      {/* First Scan CTA */}
      {!hasScanned && (
        <Card className="border-dashed border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <ScanLine className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {t("start_scan_title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("start_scan_desc")}</p>
            </div>
            <Link href={`/${locale}/dashboard/scan`}>
              <Button size="lg">
                {t("start_scan_button")}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats grid */}
      {hasScanned && (
        <>
          {/* Risk Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-2 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t("risk_score_label")}</p>
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeDasharray={`${risk.score} 100`}
                    className={riskColor}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${riskColor}`}>{risk.score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <p className={`font-semibold mt-3 ${riskColor}`}>{riskLabel}</p>
              <Link href={`/${locale}/dashboard/accounts`}>
                <Button variant="ghost" size="sm" className="mt-3">
                  {t("view_all")} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </Card>

            {/* Stat cards */}
            {[
              {
                icon: <ListChecks className="w-5 h-5 text-indigo-500" />,
                value: risk.totalAccounts,
                label: t("total_accounts"),
                color: "text-indigo-500",
              },
              {
                icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
                value: risk.breachedAccounts,
                label: t("breached_accounts"),
                color: "text-red-500",
              },
              {
                icon: <Clock className="w-5 h-5 text-amber-500" />,
                value: risk.inactiveAccounts,
                label: t("inactive_accounts"),
                color: "text-amber-500",
              },
            ].map((stat) => (
              <Card key={stat.label} className="flex flex-col items-center justify-center py-6 text-center">
                <div className="p-2 rounded-lg bg-muted mb-2">{stat.icon}</div>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Recent Breach Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">{t("risk_drivers")}</h2>
                <Badge variant="info">{t("risk_explained")}</Badge>
              </div>
              <div className="space-y-3">
                {riskInsights.map((insight) => {
                  const colorClass =
                    insight.id === "breach"
                      ? "bg-red-500"
                      : insight.id === "inactive"
                      ? "bg-amber-500"
                      : "bg-indigo-500";
                  const label =
                    insight.id === "breach"
                      ? t("risk_driver_breach")
                      : insight.id === "inactive"
                      ? t("risk_driver_inactive")
                      : t("risk_driver_footprint");

                  return (
                    <div key={insight.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">+{insight.impact} / {insight.weight}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colorClass}`}
                          style={{ width: `${Math.min((insight.impact / insight.weight) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="lg:col-span-3">
              <h2 className="font-semibold text-foreground mb-4">{t("action_center")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <div key={action.id} className="p-3 rounded-xl border border-border/70 bg-background/70">
                    <div className="inline-flex p-2 rounded-lg bg-muted mb-2">{action.icon}</div>
                    <p className="text-sm font-semibold text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 min-h-10">{action.description}</p>
                    <Link href={action.href} className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 mt-2">
                      {action.buttonLabel}
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">{t("recent_breaches")}</h2>
              <Link href={`/${locale}/dashboard/accounts?filter=breached`}>
                <Button variant="ghost" size="sm">
                  {t("view_all")} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            {breachAlerts && breachAlerts.length > 0 ? (
              <div className="space-y-2">
                {breachAlerts.map((alert) => (
                  <Card key={alert.id} padding="sm" className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {alert.service_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.breach_name}
                      </p>
                    </div>
                    <Badge variant="danger" className="ml-auto">New</Badge>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm" className="flex items-center gap-3 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="text-sm">{t("no_breaches")}</span>
              </Card>
            )}
          </div>

          {/* Ghost Risk Forecast + Digital Twin teaser */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <RiskForecast results={results} locale={locale} />
            </div>
            <div className="lg:col-span-2">
              <Link href={`/${locale}/dashboard/twin`} className="block group">
                <div className="h-full rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/8 to-purple-500/5 p-6 hover:border-indigo-500/60 hover:from-indigo-500/12 transition-all duration-300 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">
                      🌐
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{t("twin_title")}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                        {t("twin_badge")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {t("twin_desc")}
                  </p>
                  <div className="flex items-center gap-1.5 text-indigo-400 text-sm font-medium group-hover:gap-2.5 transition-all">
                    {t("twin_cta")}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Quick scan CTA when already scanned */}
      {hasScanned && (
        <div className="flex gap-4">
          <Link href={`/${locale}/dashboard/scan`}>
            <Button variant="outline" size="sm">
              <ScanLine className="w-3.5 h-3.5" />
              {t("start_scan_button")}
            </Button>
          </Link>
          <Link href={`/${locale}/dashboard/accounts`}>
            <Button variant="ghost" size="sm">
              {t("view_all")} <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
