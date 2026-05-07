import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { lookupService, getDeletionGuide, CATEGORY_ICONS_MAP } from "@/lib/services-db";
import { calculateRiskScore } from "@/lib/risk-score";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Shield,
  Globe,
  Calendar,
  Mail,
  Fingerprint,
  Activity,
  TrendingDown,
  Trash2,
  ListOrdered,
  Info,
  Zap,
  Lock,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export const metadata: Metadata = { title: "Account Details" };

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatRelative(dateStr: string | null, locale: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return locale === "de" ? "Heute" : "Today";
  if (days === 1) return locale === "de" ? "Gestern" : "Yesterday";
  if (days < 30) return locale === "de" ? `Vor ${days} Tagen` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return locale === "de" ? `Vor ${months} Monat(en)` : `${months} month(s) ago`;
  const years = Math.floor(months / 12);
  return locale === "de" ? `Vor ${years} Jahr(en)` : `${years} year(s) ago`;
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations("dashboard.account_detail");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: result } = await supabase
    .from("scan_results")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!result) notFound();

  const serviceInfo = lookupService(result.service_domain ?? result.service_name);
  const guide = getDeletionGuide(result.service_domain ?? result.service_name, locale === "de" ? "de" : "en");
  const category = serviceInfo?.category ?? "other";
  const categoryIcon = CATEGORY_ICONS_MAP[category];

  const isBreached = result.breach_status === "breached";
  // eslint-disable-next-line react-hooks/purity
  const isInactive = !result.last_email_date || Date.now() - new Date(result.last_email_date).getTime() > THREE_YEARS_MS;
  const isDeleted = result.deletion_status === "deleted";
  const isIgnored = result.deletion_status === "ignored";

  // Risk score for this single account
  const { score: riskScore } = calculateRiskScore([result]);

  const riskColor =
    riskScore >= 70 ? "text-red-400" : riskScore >= 40 ? "text-amber-400" : "text-green-400";
  const riskBg =
    riskScore >= 70 ? "bg-red-500/10 border-red-500/20" : riskScore >= 40 ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20";

  const VERIFIED_TYPES = new Set(["registration", "security_alert", "invoice", "password_reset", "demo"]);

  const evidenceTypeLabels: Record<string, string> = {
    registration: locale === "de" ? "Registrierung" : "Registration email",
    password_reset: locale === "de" ? "Passwort-Reset" : "Password reset",
    security_alert: locale === "de" ? "Sicherheitswarnung" : "Security alert",
    invoice: locale === "de" ? "Rechnung / Quittung" : "Invoice / Receipt",
    demo: locale === "de" ? "Demo-Konto" : "Demo account",
  };

  const sourceLabels: Record<string, string> = {
    gmail: "Gmail",
    imap: "IMAP",
    demo: locale === "de" ? "Demo" : "Demo",
    mixed: locale === "de" ? "Gemischt" : "Mixed",
  };

  const difficultyMap = {
    easy: { label: locale === "de" ? "Einfach" : "Easy", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    medium: { label: locale === "de" ? "Mittel" : "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    hard: { label: locale === "de" ? "Schwer" : "Hard", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  };

  const difficulty = result.deletion_difficulty ?? serviceInfo?.difficulty ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/dashboard/accounts`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden">
        {/* Colored top strip based on risk */}
        <div className={`h-1.5 w-full ${isBreached ? "bg-red-500" : isInactive ? "bg-amber-500" : "bg-green-500"}`} />
        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Favicon / logo */}
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-border/40">
              {result.service_domain ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://www.google.com/s2/favicons?domain=${result.service_domain}&sz=128`}
                  alt=""
                  width={48}
                  height={48}
                  className="w-10 h-10"
                />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {result.service_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{result.service_name}</h1>
                <span className="text-xl">{categoryIcon}</span>
              </div>
              {result.service_domain && (
                <a
                  href={`https://${result.service_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {result.service_domain}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {isBreached && (
                  <Badge variant="danger">
                    <AlertTriangle className="w-3 h-3" />
                    {t("badge_breached")}
                  </Badge>
                )}
                {isInactive && !isDeleted && !isIgnored && (
                  <Badge variant="warning">
                    <Clock className="w-3 h-3" />
                    {t("badge_inactive")}
                  </Badge>
                )}
                {isDeleted && (
                  <Badge variant="success">
                    <ShieldCheck className="w-3 h-3" />
                    {t("badge_deleted")}
                  </Badge>
                )}
                {isIgnored && (
                  <Badge variant="outline">
                    {t("badge_ignored")}
                  </Badge>
                )}
                {!isBreached && !isInactive && !isDeleted && !isIgnored && (
                  <Badge variant="success">
                    <Shield className="w-3 h-3" />
                    {t("badge_safe")}
                  </Badge>
                )}
                <Badge
                  variant={
                    result.detection_confidence === "high"
                      ? "success"
                      : result.detection_confidence === "medium"
                      ? "warning"
                      : "danger"
                  }
                >
                  {result.detection_confidence === "high"
                    ? t("confidence_high")
                    : result.detection_confidence === "medium"
                    ? t("confidence_medium")
                    : t("confidence_low")}
                </Badge>
              </div>
            </div>

            {/* Risk score circle */}
            <div className={`shrink-0 w-18 h-18 rounded-2xl border flex flex-col items-center justify-center p-3 ${riskBg}`}>
              <span className={`text-2xl font-black ${riskColor}`}>{riskScore}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                {t("risk_score")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("metric_signals")}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{result.evidence_count}</p>
          <p className="text-xs text-muted-foreground">{t("metric_signals_desc")}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("metric_breaches")}</span>
          </div>
          <p className={`text-2xl font-bold ${result.breach_count > 0 ? "text-red-400" : "text-foreground"}`}>
            {result.breach_count}
          </p>
          <p className="text-xs text-muted-foreground">
            {result.breach_last_checked
              ? `${t("metric_checked")} ${formatRelative(result.breach_last_checked, locale)}`
              : t("metric_never_checked")}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("metric_first_seen")}</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{formatDate(result.first_detected_at, locale)}</p>
          <p className="text-xs text-muted-foreground">{formatRelative(result.first_detected_at, locale)}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t("metric_last_activity")}</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{formatDate(result.last_email_date, locale)}</p>
          <p className={`text-xs ${isInactive ? "text-amber-400" : "text-muted-foreground"}`}>
            {result.last_email_date ? formatRelative(result.last_email_date, locale) : t("never")}
          </p>
        </div>
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Detection details */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-foreground">{t("section_detection")}</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_source")}</dt>
              <dd className="text-xs font-medium text-foreground">
                {sourceLabels[result.detection_source ?? ""] ?? result.detection_source ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_confidence")}</dt>
              <dd className="text-xs font-medium">
                <span className={
                  result.detection_confidence === "high" ? "text-green-400"
                  : result.detection_confidence === "medium" ? "text-amber-400"
                  : "text-red-400"
                }>
                  {result.detection_confidence === "high" ? t("confidence_high")
                    : result.detection_confidence === "medium" ? t("confidence_medium")
                    : t("confidence_low")}
                </span>
              </dd>
            </div>
            <div className="flex justify-between items-start gap-4">
              <dt className="text-xs text-muted-foreground shrink-0">{t("label_signal_types")}</dt>
              <dd className="flex flex-wrap gap-1 justify-end">
                {(result.evidence_types ?? [])
                  .filter((t) => VERIFIED_TYPES.has(t))
                  .map((type) => (
                    <span key={type} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[11px] font-medium">
                      {evidenceTypeLabels[type] ?? type}
                    </span>
                  ))}
                {(result.evidence_types ?? []).filter((t) => VERIFIED_TYPES.has(t)).length === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            {(result.sender_domains ?? []).length > 0 && (
              <div className="space-y-1.5">
                <dt className="text-xs text-muted-foreground">{t("label_sender_domains")}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {(result.sender_domains ?? []).slice(0, 8).map((domain) => (
                    <span key={domain} className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[11px]">
                      {domain}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Account status */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-foreground">{t("section_status")}</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_category")}</dt>
              <dd className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <span>{categoryIcon}</span>
                <span className="capitalize">{category}</span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_breach_status")}</dt>
              <dd className="text-xs font-medium">
                {isBreached
                  ? <span className="text-red-400">{t("breach_known")}</span>
                  : result.breach_status === "unknown"
                  ? <span className="text-muted-foreground">{t("breach_unknown")}</span>
                  : <span className="text-green-400">{t("breach_clear")}</span>}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_activity")}</dt>
              <dd className="text-xs font-medium">
                {isInactive
                  ? <span className="flex items-center gap-1 text-amber-400"><TrendingDown className="w-3 h-3" />{t("activity_inactive")}</span>
                  : <span className="flex items-center gap-1 text-green-400"><Activity className="w-3 h-3" />{t("activity_active")}</span>}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_deletion_status")}</dt>
              <dd className="text-xs font-medium text-foreground capitalize">{result.deletion_status}</dd>
            </div>
            {difficulty && (
              <div className="flex justify-between items-center">
                <dt className="text-xs text-muted-foreground">{t("label_deletion_difficulty")}</dt>
                <dd>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${difficultyMap[difficulty].bg} ${difficultyMap[difficulty].color}`}>
                    {difficultyMap[difficulty].label}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Privacy risk breakdown */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-foreground">{t("section_risk")}</h2>
          </div>
          <div className="space-y-3">
            {/* Risk score bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t("risk_score")}</span>
                <span className={`text-sm font-bold ${riskColor}`}>{riskScore} / 100</span>
              </div>
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    riskScore >= 70 ? "bg-red-500" : riskScore >= 40 ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
            </div>
            {/* Risk factors */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("risk_factors")}</p>
              {isBreached && (
                <div className="flex items-start gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t("risk_factor_breached")}</span>
                </div>
              )}
              {isInactive && (
                <div className="flex items-start gap-2 text-xs text-amber-400">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t("risk_factor_inactive")}</span>
                </div>
              )}
              {result.detection_confidence === "low" && (
                <div className="flex items-start gap-2 text-xs text-orange-400">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t("risk_factor_low_confidence")}</span>
                </div>
              )}
              {result.breach_status === "unknown" && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t("risk_factor_not_checked")}</span>
                </div>
              )}
              {!isBreached && !isInactive && result.detection_confidence !== "low" && result.breach_status !== "unknown" && (
                <div className="flex items-start gap-2 text-xs text-green-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t("risk_factor_none")}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Service info */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-foreground">{t("section_service")}</h2>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-xs text-muted-foreground">{t("label_known_service")}</dt>
              <dd className="text-xs font-medium">
                {serviceInfo
                  ? <span className="text-green-400">{t("yes")}</span>
                  : <span className="text-muted-foreground">{t("no")}</span>}
              </dd>
            </div>
            {serviceInfo && (
              <div className="flex justify-between items-center">
                <dt className="text-xs text-muted-foreground">{t("label_in_db")}</dt>
                <dd className="text-xs font-medium text-green-400">{t("curated")}</dd>
              </div>
            )}
            {result.deletion_url || serviceInfo?.deletionUrl ? (
              <div className="pt-1">
                <a
                  href={result.deletion_url ?? serviceInfo?.deletionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-sm text-red-300 font-medium transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("open_deletion_page")}
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
                </a>
              </div>
            ) : null}
          </dl>
        </Card>
      </div>

      {/* Step-by-step deletion guide */}
      {guide && (
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-foreground">{t("section_guide")}</h2>
            <span className="text-xs text-muted-foreground ml-auto">{result.service_name}</span>
          </div>

          {guide.prerequisites && guide.prerequisites.length > 0 && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{t("guide_prerequisites")}</p>
              <ul className="space-y-1">
                {guide.prerequisites.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-300/80">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center mt-0.5">!</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ol className="space-y-2.5">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground/80 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          {guide.backupHint && (
            <div className="rounded-xl bg-indigo-500/8 border border-indigo-500/20 p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-300/80">{guide.backupHint}</p>
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      {!isDeleted && !isIgnored && (
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-sm text-foreground">{t("section_actions")}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{t("actions_desc")}</p>
          <div className="flex flex-wrap gap-2">
            <form action={`/${locale}/dashboard/accounts`}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="deleted" />
              <Link
                href={`/${locale}/dashboard/accounts`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-sm text-red-300 font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {t("action_mark_deleted")}
              </Link>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
