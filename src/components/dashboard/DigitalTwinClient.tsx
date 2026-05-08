"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { AlertTriangle, Clock, Shield, Activity } from "lucide-react";
import { lookupService } from "@/lib/services-db";
import { CATEGORY_ICONS_MAP, type ServiceCategory } from "@/lib/services-db";
import type { ScanResult } from "@/types/database";
import { Card } from "@/components/ui/Card";

// Load D3 network only on client (SSR would fail without window)
const AccountNetwork = dynamic(
  () => import("@/components/dashboard/AccountNetwork").then((m) => m.AccountNetwork),
  { ssr: false, loading: () => <div className="h-72 sm:h-80 md:h-[580px] rounded-2xl bg-muted/30 animate-pulse" /> }
);

interface DigitalTwinClientProps {
  results: ScanResult[];
  email: string;
  locale: string;
}

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

function isInactive(r: ScanResult) {
  if (!r.last_email_date) return true;
  return Date.now() - new Date(r.last_email_date).getTime() > THREE_YEARS_MS;
}

export function DigitalTwinClient({ results, email, locale }: DigitalTwinClientProps) {
  const t = useTranslations("dashboard.twin");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "all">("all");

  const active = useMemo(
    () => results.filter((r) => r.deletion_status === "active"),
    [results]
  );

  const stats = useMemo(() => {
    const breached = active.filter((r) => r.breach_status === "breached").length;
    const inactive = active.filter(isInactive).length;
    const safe = active.filter((r) => r.breach_status === "safe" && !isInactive(r)).length;

    // Category breakdown
    const catMap: Partial<Record<ServiceCategory, number>> = {};
    active.forEach((r) => {
      const info = lookupService(r.service_domain ?? r.service_name);
      const cat: ServiceCategory = info?.category ?? "other";
      catMap[cat] = (catMap[cat] ?? 0) + 1;
    });
    const topCategories = (Object.entries(catMap) as [ServiceCategory, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { breached, inactive, safe, topCategories };
  }, [active]);

  return (
    <div className="space-y-6">
      {/* Summary stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border/60">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_total")}</span>
          </div>
          <p className="text-2xl font-bold">{active.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_breached")}</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.breached}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_inactive")}</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats.inactive}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_safe")}</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.safe}</p>
        </div>
      </div>

      {/* Category filter chips */}
      {stats.topCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
              categoryFilter === "all"
                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <span>🌐</span>
            <span>{t("filter_all")}</span>
          </button>
          {stats.topCategories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                categoryFilter === cat
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                  : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>{CATEGORY_ICONS_MAP[cat]}</span>
              <span className="capitalize">{t(`cat_${cat}`)}</span>
              <span className="opacity-60 text-xs">({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Network graph */}
      {active.length === 0 ? (
        <Card className="py-20 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </Card>
      ) : (
        <AccountNetwork results={active} email={email} locale={locale} categoryFilter={categoryFilter} />
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground/60 text-center">
        {t("hint")}
      </p>
    </div>
  );
}
