import type { ScanResult } from "@/types/database";
import { calculateRiskScore } from "@/lib/risk-score";

export interface ForecastMonth {
  month: number; // 0 = now, 1–6 = future months
  label: string;
  score: number;
  mainRisk: string;
}

export interface ForecastResult {
  months: ForecastMonth[];
  headline: string;
  actions: ForecastAction[];
}

export interface ForecastAction {
  id: string;
  impact: "high" | "medium" | "low";
  title: string;
  desc: string;
  href?: string;
}

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function isInactive(result: ScanResult): boolean {
  if (!result.last_email_date) return true;
  return Date.now() - new Date(result.last_email_date).getTime() > THREE_YEARS_MS;
}

function ageInYears(result: ScanResult): number {
  if (!result.last_email_date) return 5;
  return (Date.now() - new Date(result.last_email_date).getTime()) / ONE_YEAR_MS;
}

/**
 * Rule-based 6-month risk forecast.
 *
 * Rules applied per month:
 * - Each active inactive account adds +0.8/month (data aging, credential stuffing)
 * - Each breached account adds +1.5/month if unresolved
 * - Large footprints (>50 accounts) add +0.3/month
 * - If user has already cleaned up many accounts (deleted/ignored), reduce growth
 */
export function generateForecast(
  results: ScanResult[],
  locale: "en" | "de"
): ForecastResult {
  const active = results.filter((r) => r.deletion_status === "active");
  const inactive = active.filter(isInactive);
  const breached = active.filter((r) => r.breach_status === "breached");
  const cleaned = results.filter(
    (r) => r.deletion_status === "deleted" || r.deletion_status === "ignored"
  ).length;

  const base = calculateRiskScore(results);
  const baseScore = base.score;

  // Monthly growth rate per risk driver
  const inactiveGrowth = inactive.length * 0.8;
  const breachGrowth = breached.length * 1.5;
  const footprintGrowth = active.length > 50 ? 0.3 : 0;
  const cleanupDiscount = cleaned > 5 ? 0.15 : 0;

  const monthlyGrowth = Math.max(
    0,
    inactiveGrowth + breachGrowth + footprintGrowth - cleanupDiscount * (inactiveGrowth + breachGrowth)
  );

  const isDE = locale === "de";
  const MONTHS_LABELS = isDE
    ? ["Jetzt", "1 Mon.", "2 Mon.", "3 Mon.", "4 Mon.", "5 Mon.", "6 Mon."]
    : ["Now", "1 mo.", "2 mo.", "3 mo.", "4 mo.", "5 mo.", "6 mo."];

  const months: ForecastMonth[] = Array.from({ length: 7 }, (_, i) => {
    const projected = Math.min(100, Math.round(baseScore + monthlyGrowth * i));
    let mainRisk = "";
    if (breached.length > 0) {
      mainRisk = isDE
        ? `${breached.length} offene Datenleck(s)`
        : `${breached.length} unresolved breach(es)`;
    } else if (inactive.length > 0) {
      mainRisk = isDE
        ? `${inactive.length} inaktive Konten als Angriffsfläche`
        : `${inactive.length} inactive accounts as attack surface`;
    } else if (active.length > 30) {
      mainRisk = isDE
        ? `Großer digitaler Fußabdruck (${active.length} Konten)`
        : `Large digital footprint (${active.length} accounts)`;
    } else {
      mainRisk = isDE ? "Kein kritisches Risiko" : "No critical risk";
    }
    return {
      month: i,
      label: MONTHS_LABELS[i],
      score: projected,
      mainRisk,
    };
  });

  // Headline
  const delta = months[6].score - baseScore;
  let headline = "";
  if (delta >= 20) {
    headline = isDE
      ? `Ohne Maßnahmen steigt dein Risiko auf ${months[6].score} Punkte (+${delta}).`
      : `Without action, your risk rises to ${months[6].score} (+${delta} pts) in 6 months.`;
  } else if (delta >= 8) {
    headline = isDE
      ? `Dein Risiko wird leicht steigen — handle jetzt, um es gering zu halten.`
      : `Your risk will grow slightly — act now to keep it manageable.`;
  } else {
    headline = isDE
      ? `Dein Risiko ist stabil. Kleiner Aktionsplan reicht aus.`
      : `Your risk is stable. A small action plan keeps it that way.`;
  }

  // Recommended actions
  const actions: ForecastAction[] = [];

  if (breached.length > 0) {
    actions.push({
      id: "fix_breaches",
      impact: "high",
      title: isDE ? "Datenlecks beheben" : "Fix breached accounts",
      desc: isDE
        ? `${breached.length} Konto(s) sind in bekannten Datenlecks. Ändere Passwörter sofort.`
        : `${breached.length} account(s) appear in known data breaches. Change passwords now.`,
      href: "accounts",
    });
  }

  if (inactive.length > 3) {
    actions.push({
      id: "delete_inactive",
      impact: "high",
      title: isDE ? "Inaktive Konten löschen" : "Delete inactive accounts",
      desc: isDE
        ? `${inactive.length} Konten wurden seit 3+ Jahren nicht genutzt — jedes ist ein offenes Einfallstor.`
        : `${inactive.length} accounts haven't been used in 3+ years — each is a potential attack vector.`,
      href: "accounts",
    });
  }

  // Find oldest active accounts
  const oldAccounts = active
    .filter((r) => ageInYears(r) > 4)
    .sort((a, b) => ageInYears(b) - ageInYears(a))
    .slice(0, 3);

  if (oldAccounts.length > 0) {
    actions.push({
      id: "review_old",
      impact: "medium",
      title: isDE ? "Älteste Konten überprüfen" : "Review oldest accounts",
      desc: isDE
        ? `${oldAccounts[0].service_name} und weitere Konten sind seit über 4 Jahren unberührt.`
        : `${oldAccounts[0].service_name} and others haven't been touched in 4+ years.`,
      href: "accounts",
    });
  }

  if (active.length > 40) {
    actions.push({
      id: "reduce_footprint",
      impact: "medium",
      title: isDE ? "Digitalen Fußabdruck reduzieren" : "Reduce your digital footprint",
      desc: isDE
        ? `Du hast ${active.length} aktive Konten. Jedes nicht genutzte Konto erhöht dein Risiko.`
        : `You have ${active.length} active accounts. Every unused one raises your risk score.`,
      href: "accounts",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "maintain",
      impact: "low",
      title: isDE ? "Weiter so!" : "Keep it up!",
      desc: isDE
        ? "Dein Profil sieht gut aus. Führe regelmäßige Scans durch, um auf dem Laufenden zu bleiben."
        : "Your profile looks good. Run regular scans to stay up to date.",
      href: "scan",
    });
  }

  return { months, headline, actions };
}
