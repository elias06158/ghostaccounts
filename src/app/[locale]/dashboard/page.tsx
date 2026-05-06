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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { calculateRiskScore } from "@/lib/risk-score";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
