"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Trash2, EyeOff, AlertTriangle, Clock, ShieldCheck, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { lookupService } from "@/lib/services-db";
import type { ScanResult } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

type Filter = "all" | "active" | "breached" | "ignored" | "deleted";

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

export function AccountsList({ results: initialResults, isPro, locale }: AccountsListProps) {
  const t = useTranslations("dashboard.accounts");
  const [results, setResults] = useState(initialResults);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  const FREE_LIMIT = 20;
  const totalFound = results.length;
  const displayResults = isPro ? results : results.slice(0, FREE_LIMIT);

  const filtered = displayResults.filter((r) => {
    const matchesSearch = r.service_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "breached") return r.breach_status;
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
        prev.map((r) => (r.id === id ? { ...r, deletion_status: status } : r))
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

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filter_all") },
    { key: "active", label: t("filter_active") },
    { key: "breached", label: t("filter_breached") },
    { key: "ignored", label: t("filter_ignored") },
    { key: "deleted", label: t("filter_deleted") },
  ];

  return (
    <div className="space-y-6">
      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.key
                  ? "bg-indigo-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto sm:w-64">
          <Input
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {t("found_count", { count: filtered.length })}
      </p>

      {/* Results list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12 text-muted-foreground">
          {results.length === 0 ? t("empty_no_scan") : t("empty_filtered")}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((result) => {
            const difficulty = getDifficulty(result);
            const deletionUrl = getDeletionUrl(result);
            const inactive = isInactive(result);

            return (
              <Card key={result.id} padding="sm" className="flex items-center gap-4">
                {/* Service favicon */}
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {result.service_domain ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${result.service_domain}&sz=32`}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {result.service_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Service info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground truncate">
                      {result.service_name}
                    </p>
                    {result.breach_status && (
                      <Badge variant="danger">
                        <AlertTriangle className="w-3 h-3" />
                        {t("breach_badge")}
                      </Badge>
                    )}
                    {inactive && result.deletion_status === "active" && (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3" />
                        {t("inactive_badge")}
                      </Badge>
                    )}
                    {result.deletion_status === "deleted" && (
                      <Badge variant="success">
                        <ShieldCheck className="w-3 h-3" />
                        {filter !== "deleted" ? t("mark_deleted") : "Deleted"}
                      </Badge>
                    )}
                  </div>
                  {result.last_email_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("last_email")}: {new Date(result.last_email_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Difficulty */}
                {difficulty && result.deletion_status === "active" && (
                  <Badge
                    variant={difficulty === "easy" ? "success" : difficulty === "medium" ? "warning" : "danger"}
                    className="hidden sm:inline-flex"
                  >
                    {difficulty === "easy" ? t("difficulty_easy") : difficulty === "medium" ? t("difficulty_medium") : t("difficulty_hard")}
                  </Badge>
                )}

                {/* Actions */}
                {result.deletion_status === "active" && (
                  <div className="flex items-center gap-1 shrink-0">
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
                      onClick={() => updateStatus(result.id, "deleted")}
                      title={t("mark_deleted")}
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Pro upsell */}
      {!isPro && totalFound > FREE_LIMIT && (
        <Card className="border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 text-center py-8">
          <Crown className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">{t("pro_locked_title")}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t("pro_locked_desc", { total: totalFound })}
          </p>
          <a href={`/${locale}/dashboard/settings`}>
            <Button>{t("upgrade_button")}</Button>
          </a>
        </Card>
      )}
    </div>
  );
}
