import type { ScanResult } from "@/types/database";

export interface RiskScoreResult {
  score: number;
  level: "low" | "medium" | "high";
  totalAccounts: number;
  inactiveAccounts: number;
  breachedAccounts: number;
  accountComponent: number;
  inactivityComponent: number;
  breachComponent: number;
}

export interface RiskInsight {
  id: "breach" | "inactive" | "footprint";
  weight: number;
  impact: number;
}

const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

/**
 * Calculate a 0–100 risk score from the user's scan results.
 *
 * Formula:
 *  account_component  = min(total / 3, 25)      → max 25 pts
 *  inactivity_component = (inactive / total) * 40 → max 40 pts
 *  breach_component   = min(breached * 7, 35)    → max 35 pts
 */
export function calculateRiskScore(results: ScanResult[]): RiskScoreResult {
  const active = results.filter((r) => r.deletion_status === "active");
  const total = active.length;

  if (total === 0) {
    return {
      score: 0,
      level: "low",
      totalAccounts: 0,
      inactiveAccounts: 0,
      breachedAccounts: 0,
      accountComponent: 0,
      inactivityComponent: 0,
      breachComponent: 0,
    };
  }

  const now = Date.now();
  const inactiveAccounts = active.filter((r) => {
    if (!r.last_email_date) return true; // no known last activity → treat as inactive
    return now - new Date(r.last_email_date).getTime() > THREE_YEARS_MS;
  }).length;

  const breachedAccounts = active.filter((r) => r.breach_status === "breached").length;

  const accountComponent = Math.min(total / 3, 25);
  const inactivityComponent = total > 0 ? (inactiveAccounts / total) * 40 : 0;
  const breachComponent = Math.min(breachedAccounts * 7, 35);

  const score = Math.min(
    Math.round(accountComponent + inactivityComponent + breachComponent),
    100
  );

  const level: "low" | "medium" | "high" =
    score < 30 ? "low" : score < 65 ? "medium" : "high";

  return {
    score,
    level,
    totalAccounts: total,
    inactiveAccounts,
    breachedAccounts,
    accountComponent: Math.round(accountComponent),
    inactivityComponent: Math.round(inactivityComponent),
    breachComponent: Math.round(breachComponent),
  };
}

export function getRiskInsights(risk: RiskScoreResult): RiskInsight[] {
  const insights: RiskInsight[] = [
    {
      id: "breach",
      weight: 35,
      impact: risk.breachComponent,
    },
    {
      id: "inactive",
      weight: 40,
      impact: risk.inactivityComponent,
    },
    {
      id: "footprint",
      weight: 25,
      impact: risk.accountComponent,
    },
  ];

  return insights.sort((a, b) => b.impact - a.impact);
}
