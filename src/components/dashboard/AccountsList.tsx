"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ExternalLink,
  Trash2,
  EyeOff,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Crown,
  Search,
  Shield,
  TrendingDown,
  Activity,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Lightbulb,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDeletionGuide, lookupService, type ServiceCategory, CATEGORY_ICONS_MAP } from "@/lib/services-db";
import type { ScanResult } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Filter = "all" | "active" | "breached" | "ignored" | "deleted";
type CategoryFilter = "all" | ServiceCategory;

function getCategory(result: ScanResult): ServiceCategory {
  const info = lookupService(result.service_domain ?? result.service_name);
  return info?.category ?? "other";
}

// The only signal types that definitively prove an account was created.
// Accounts from old scans that don't carry any of these are hidden until a rescan.
const VERIFIED_SIGNAL_TYPES = new Set(["registration", "security_alert", "invoice", "password_reset", "demo"]);

function hasVerifiedSignal(result: ScanResult): boolean {
  if (!result.evidence_types || result.evidence_types.length === 0) return false;
  return result.evidence_types.some((t) => VERIFIED_SIGNAL_TYPES.has(t));
}

interface AccountsListProps {
  results: ScanResult[];
  isPro: boolean;
  locale: string;
}

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

function isInactive(result: ScanResult): boolean {
  if (!result.last_email_date) return true;
  return Date.now() - new Date(result.last_email_date).getTime() > THREE_YEARS_MS;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function riskSort(a: ScanResult, b: ScanResult): number {
  const priority = (r: ScanResult) => {
    if (r.breach_status === "breached") return 0;
    if (r.breach_status === "unknown") return 1;
    if (r.detection_confidence === "low") return 2;
    if (isInactive(r)) return 2;
    return 3;
  };
  return priority(a) - priority(b);
}

export function AccountsList({ results: initialResults, isPro, locale }: AccountsListProps) {
  const t = useTranslations("dashboard.accounts");

  // Only show accounts with at least one verified signal type.
  // Legacy scan results without verified signals are hidden until the user rescans.
  const verifiedResults = useMemo(
    () => [...initialResults.filter(hasVerifiedSignal)].sort(riskSort),
    [initialResults]
  );
  const hiddenLegacyCount = initialResults.length - verifiedResults.length;

  const [results, setResults] = useState<ScanResult[]>(verifiedResults);
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());
  const [openGuideFor, setOpenGuideFor] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const FREE_LIMIT = 20;
  const displayResults = isPro ? results : results.slice(0, FREE_LIMIT);

  const stats = useMemo(() => ({
    total: results.length,
    breached: results.filter((r) => r.breach_status === "breached").length,
    inactive: results.filter((r) => isInactive(r) && r.deletion_status === "active").length,
    safe: results.filter((r) => r.breach_status === "safe" && !isInactive(r)).length,
  }), [results]);

  // All categories that are actually present in the user's results
  const presentCategories = useMemo(() => {
    const cats = new Set<ServiceCategory>();
    results.forEach((r) => cats.add(getCategory(r)));
    // Sort by count descending
    return [...cats].sort(
      (a, b) =>
        results.filter((r) => getCategory(r) === b).length -
        results.filter((r) => getCategory(r) === a).length
    );
  }, [results]);

  const filtered = displayResults.filter((r) => {
    const matchesSearch =
      r.service_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.service_domain ?? "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter !== "all" && getCategory(r) !== categoryFilter) return false;
    if (filter === "all") return true;
    if (filter === "breached") return r.breach_status === "breached";
    if (filter === "active") return r.deletion_status === "active";
    return r.deletion_status === filter;
  });

  async function updateStatus(id: string, status: "active" | "deleted" | "ignored") {
    const supabase = createClient();
    await supabase
      .from("scan_results")
      .update({ deletion_status: status, updated_at: new Date().toISOString() })
      .eq("id", id);
    startTransition(() => {
      setResults((prev) =>
        [...prev.map((r) => (r.id === id ? { ...r, deletion_status: status } : r))].sort(riskSort)
      );
    });
  }

  function getDeletionUrl(result: ScanResult): string | null {
    if (result.deletion_url) return result.deletion_url;
    const info = lookupService(result.service_domain ?? result.service_name);
    return info?.deletionUrl ?? null;
  }

  function getDifficulty(result: ScanResult) {
    if (result.deletion_difficulty) return result.deletion_difficulty;
    const info = lookupService(result.service_domain ?? result.service_name);
    return info?.difficulty ?? null;
  }

  function toggleEvidence(id: string) {
    setExpandedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getSourceLabel(source: string | null): string {
    if (source === "gmail") return t("evidence_source_gmail");
    if (source === "imap") return t("evidence_source_imap");
    if (source === "demo") return t("evidence_source_demo");
    if (source === "mixed") return t("evidence_source_mixed");
    return t("evidence_source_unknown");
  }

  function getEvidenceTypeLabel(type: string): string | null {
    const map: Record<string, string> = {
      registration: t("evidence_type_registration"),
      password_reset: t("evidence_type_password_reset"),
      security_alert: t("evidence_type_security_alert"),
      invoice: t("evidence_type_invoice"),
    };
    return map[type] ?? null;
  }

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: t("filter_all"), count: results.length },
    { key: "active", label: t("filter_active") },
    { key: "breached", label: t("filter_breached"), count: stats.breached },
    { key: "ignored", label: t("filter_ignored") },
    { key: "deleted", label: t("filter_deleted") },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_total")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-1">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_breached")}</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.breached}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
          <div className="flex items-center gap-2 text-amber-400">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_inactive")}</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats.inactive}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-1">
          <div className="flex items-center gap-2 text-green-400">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium">{t("stat_safe")}</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.safe}</p>
        </div>
      </div>

      {/* Rescan notice for hidden legacy accounts */}
      {hiddenLegacyCount > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-300/90">
            {t("legacy_hidden_notice", { count: hiddenLegacyCount })}
          </p>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col gap-3">
        {/* Status filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 flex-wrap">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === f.key
                    ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    filter === f.key ? "bg-white/20" : "bg-muted"
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto sm:w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background/60 border border-border/80 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Category filters */}
        {presentCategories.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                categoryFilter === "all"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/60"
              }`}
            >
              <span className="text-xs">🗂️</span>
              {t("category_all")}
            </button>
            {presentCategories.map((cat) => {
              const count = results.filter((r) => getCategory(r) === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    categoryFilter === cat
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/60"
                  }`}
                >
                  <span className="text-xs">{CATEGORY_ICONS_MAP[cat]}</span>
                  {t(`category_${cat}`)}
                  <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {t("found_count", { count: filtered.length })}
      </p>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {results.length === 0 ? t("empty_no_scan") : t("empty_filtered")}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((result, index) => {
            const difficulty = getDifficulty(result);
            const deletionUrl = getDeletionUrl(result);
            const inactive = isInactive(result);
            const isBreached = result.breach_status === "breached";
            const isDeleted = result.deletion_status === "deleted";
            const isIgnored = result.deletion_status === "ignored";
            const confidenceVariant =
              result.detection_confidence === "high"
                ? "success"
                : result.detection_confidence === "medium"
                ? "warning"
                : "danger";
            const confidenceLabel =
              result.detection_confidence === "high"
                ? t("confidence_high")
                : result.detection_confidence === "medium"
                ? t("confidence_medium")
                : t("confidence_low");

            const borderColor = isBreached
              ? "border-l-red-500/60"
              : inactive && !isDeleted && !isIgnored
              ? "border-l-amber-500/40"
              : "border-l-transparent";

            const guide = getDeletionGuide(result.service_domain ?? result.service_name, locale === "de" ? "de" : "en");
            const isGuideOpen = openGuideFor === result.id;

            return (
              <div
                key={result.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: "both" }}
              >
                <Card
                  padding="sm"
                  className={`flex flex-col border-l-2 ${borderColor} hover:border-indigo-500/30 transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)] group`}
                >
                  <div className="flex items-center gap-4">
                  {/* Favicon — clickable link to detail page */}
                  <Link
                    href={`/${locale}/dashboard/accounts/${result.id}`}
                    className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border/40 hover:ring-indigo-500/60 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {result.service_domain ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${result.service_domain}&sz=64`}
                        alt=""
                        width={24}
                        height={24}
                        className="w-5 h-5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {result.service_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>

                  {/* Service info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/${locale}/dashboard/accounts/${result.id}`}
                        className="font-semibold text-sm text-foreground truncate hover:text-indigo-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {result.service_name}
                      </Link>
                      {isBreached && (
                        <Badge variant="danger">
                          <AlertTriangle className="w-3 h-3" />
                          {t("breach_badge")}
                        </Badge>
                      )}
                      {inactive && !isDeleted && !isIgnored && (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3" />
                          {t("inactive_badge")}
                        </Badge>
                      )}
                      <Badge variant={confidenceVariant}>
                        {confidenceLabel}
                      </Badge>
                      {isDeleted && (
                        <Badge variant="success">
                          <ShieldCheck className="w-3 h-3" />
                          {t("mark_deleted")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {result.service_domain && (
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {result.service_domain}
                        </p>
                      )}
                      {/* Category pill */}
                      {(() => {
                        const cat = getCategory(result);
                        return cat !== "other" ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); setCategoryFilter(cat); }}
                            className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
                          >
                            <span>{CATEGORY_ICONS_MAP[cat]}</span>
                            <span>{t(`category_${cat}`)}</span>
                          </button>
                        ) : null;
                      })()}
                      <p className="text-xs text-muted-foreground shrink-0">
                        {result.last_email_date && (
                          <>{t("last_email")}: <span className="text-foreground/70">{formatDate(result.last_email_date, locale)}</span>{" "}</>
                        )}
                      </p>
                      <button
                        onClick={() => toggleEvidence(result.id)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                        aria-expanded={expandedEvidence.has(result.id)}
                      >
                        {expandedEvidence.has(result.id)
                          ? <><ChevronUp className="w-3 h-3" />{t("evidence_count", { count: result.evidence_count })}</>  
                          : <><ChevronDown className="w-3 h-3" />{t("evidence_count", { count: result.evidence_count })}</>}
                      </button>
                    </div>
                  </div>

                  {/* Difficulty */}
                  {difficulty && !isDeleted && !isIgnored && (
                    <Badge
                      variant={difficulty === "easy" ? "success" : difficulty === "medium" ? "warning" : "danger"}
                      className="hidden sm:inline-flex shrink-0"
                    >
                      {difficulty === "easy"
                        ? t("difficulty_easy")
                        : difficulty === "medium"
                        ? t("difficulty_medium")
                        : t("difficulty_hard")}
                    </Badge>
                  )}

                  {/* Actions */}
                  {!isDeleted && !isIgnored && (
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {deletionUrl && (
                        <a href={deletionUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" title={t("open_delete_page")}>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenGuideFor((prev) => (prev === result.id ? null : result.id))}
                        title={t("delete_guide")}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(result.id, "deleted")}
                        title={t("mark_deleted")}
                        className="hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(result.id, "ignored")}
                        title={t("mark_ignored")}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {isIgnored && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(result.id, "active")}
                      title="Restore"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  </div>

                  {/* Evidence detail panel */}
                  {expandedEvidence.has(result.id) && (
                    <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{t("evidence_source_label")}</p>
                        <p className="text-foreground/80">{getSourceLabel(result.detection_source)}</p>
                      </div>
                      {result.first_detected_at && (
                        <div className="space-y-1">
                          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{t("first_detected")}</p>
                          <p className="text-foreground/80">{formatDate(result.first_detected_at, locale)}</p>
                        </div>
                      )}
                      {result.last_email_date && (
                        <div className="space-y-1">
                          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{t("last_email")}</p>
                          <p className="text-foreground/80">{formatDate(result.last_email_date, locale)}</p>
                        </div>
                      )}
                      {result.evidence_types && result.evidence_types.length > 0 && (() => {
                          const knownTypes = result.evidence_types
                            .filter((type) => VERIFIED_SIGNAL_TYPES.has(type) && type !== "demo")
                            .map((type) => ({ type, label: getEvidenceTypeLabel(type) }))
                            .filter((entry): entry is { type: string; label: string } => entry.label !== null);
                          if (knownTypes.length === 0) return null;
                          return (
                        <div className="space-y-1">
                          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{t("evidence_types_label")}</p>
                          <div className="flex flex-wrap gap-1">
                              {knownTypes.map(({ type, label }) => (
                              <span key={type} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[11px] font-medium">
                                  {label}
                              </span>
                            ))}
                          </div>
                        </div>
                          );
                        })()}
                      {result.sender_domains && result.sender_domains.length > 0 && (
                        <div className="space-y-1 sm:col-span-2">
                          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{t("evidence_senders_label")}</p>
                          <div className="flex flex-wrap gap-1">
                            {result.sender_domains.map((domain) => (
                              <span key={domain} className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[11px] font-mono">
                                {domain}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isGuideOpen && (
                    <div className="mt-3 pt-3 border-t border-border/40 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                        {t("delete_guide")}
                      </div>

                      {guide.prerequisites && guide.prerequisites.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-foreground">{t("delete_guide_prereq")}</p>
                          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                            {guide.prerequisites.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground">{t("delete_guide_steps")}</p>
                        <ol className="text-xs text-muted-foreground list-decimal pl-5 space-y-1">
                          {guide.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {guide.backupHint && (
                        <p className="text-xs text-amber-400">{guide.backupHint}</p>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Pro upsell */}
      {!isPro && initialResults.length > FREE_LIMIT && (
        <Card className="border-indigo-500/20 bg-indigo-500/5 text-center py-10">
          <Crown className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">{t("pro_locked_title")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t("pro_locked_desc", { total: initialResults.length })}
          </p>
          <a href={`/${locale}/dashboard/settings`}>
            <Button>{t("upgrade_button")}</Button>
          </a>
        </Card>
      )}
    </div>
  );
}
