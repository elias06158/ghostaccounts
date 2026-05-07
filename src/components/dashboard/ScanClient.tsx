"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Mail,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Play,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDemoServices } from "@/lib/email-scan";
import type { FoundService } from "@/lib/email-scan";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type ScanState = "idle" | "scanning" | "saving" | "done";

interface ImapProvider {
  id: string;
  label: string;
  hint: string;
  domains: string[];
}

const IMAP_PROVIDERS: ImapProvider[] = [
  { id: "gmail",   label: "Gmail (App-Passwort / App Password)",  hint: "myaccount.google.com → Security → 2-Step → App passwords", domains: ["gmail.com", "googlemail.com"] },
  { id: "outlook", label: "Outlook / Hotmail / Live",             hint: "settings.live.com → Security → App passwords",              domains: ["outlook.com", "hotmail.com", "live.com", "live.de"] },
  { id: "yahoo",   label: "Yahoo Mail",                           hint: "security.yahoo.com → Manage app passwords",                  domains: ["yahoo.com", "yahoo.de", "ymail.com"] },
  { id: "icloud",  label: "iCloud Mail",                          hint: "appleid.apple.com → Sign-In & Security → App passwords",     domains: ["icloud.com", "me.com", "mac.com"] },
  { id: "gmx",     label: "GMX",                                  hint: "Dein GMX-Passwort / Your GMX password",                      domains: ["gmx.de", "gmx.net", "gmx.at", "gmx.ch"] },
  { id: "webde",   label: "WEB.DE",                               hint: "Dein WEB.DE-Passwort / Your WEB.DE password",                domains: ["web.de"] },
  { id: "tonline", label: "T-Online",                             hint: "Dein T-Online-Passwort / Your T-Online password",             domains: ["t-online.de"] },
  { id: "other",   label: "Andere / Other (IMAP)",                hint: "Dein E-Mail-Passwort / Your email password",                  domains: [] },
];

function detectProvider(email: string): ImapProvider {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return IMAP_PROVIDERS.find((p) => p.domains.includes(domain)) ?? IMAP_PROVIDERS[IMAP_PROVIDERS.length - 1];
}

interface ScanClientProps {
  locale: string;
  userId: string;
  isPro: boolean;
  lastScanAt: string | null;
  googleClientId: string;
}

export function ScanClient({
  locale,
  userId,
  isPro,
  lastScanAt,
  googleClientId,
}: ScanClientProps) {
  const t = useTranslations("dashboard.scan");
  const [state, setScanState] = useState<ScanState>("idle");
  const [foundCount, setFoundCount] = useState(0);
  const [resultCount, setResultCount] = useState(0);

  const [imapEmail, setImapEmail] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imapError, setImapError] = useState("");
  const [imapLoading, setImapLoading] = useState(false);
  const [detectedProvider, setDetectedProvider] = useState<ImapProvider | null>(null);
  const [gmailError, setGmailError] = useState("");

  const saveResults = useCallback(
    async (services: FoundService[]) => {
      setScanState("saving");
      const supabase = createClient();
      const upsertData = services.map((s) => ({
        user_id: userId,
        service_name: s.name,
        service_domain: s.domain,
        last_email_date: s.lastEmailDate,
        evidence_count: s.evidenceCount,
        evidence_types: s.evidenceTypes,
        sender_domains: s.senderDomains,
        detection_confidence: s.detectionConfidence,
        detection_source: s.detectionSource,
        // Use the actual earliest email date found, not today's date
        first_detected_at: s.firstSeenDate ?? s.lastEmailDate ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await supabase
        .from("scan_results")
        .upsert(upsertData, { onConflict: "user_id,service_domain", ignoreDuplicates: false });
      await supabase
        .from("profiles")
        .update({ last_scan_at: new Date().toISOString() })
        .eq("id", userId);
      setResultCount(services.length);
      setScanState("done");
    },
    [userId]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    const returnedState = params.get("state");
    const storedState = sessionStorage.getItem("oauth_state");
    const verifier = sessionStorage.getItem("pkce_verifier");
    if (!verifier || returnedState !== storedState) return;
    window.history.replaceState({}, "", window.location.pathname);
    sessionStorage.removeItem("pkce_verifier");
    sessionStorage.removeItem("oauth_state");
    setScanState("scanning");
    import("@/lib/email-scan").then(async ({ exchangeGmailCode, scanGmail }) => {
      try {
        const redirectUri = `${window.location.origin}/${locale}/dashboard/scan`;
        const accessToken = await exchangeGmailCode(code, verifier, googleClientId, redirectUri);
        // Run both scans in parallel: email-based + connected apps
        const [emailServices, connectedApps] = await Promise.all([
          scanGmail(accessToken, setFoundCount),
          import("@/lib/google-connected-apps").then((mod) =>
            mod.scanGoogleConnectedApps(accessToken, () => {})
          ),
        ]);
        // Merge results (email scan takes priority for duplicates)
        const mergedMap = new Map<string, typeof emailServices[number]>();
        for (const svc of connectedApps) {
          mergedMap.set(svc.domain, svc);
        }
        for (const svc of emailServices) {
          mergedMap.set(svc.domain, svc);
        }
        const allServices = Array.from(mergedMap.values());
        setFoundCount(allServices.length);
        await saveResults(allServices);
      } catch {
        setScanState("idle");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runDemoScan() {
    setScanState("scanning");
    setFoundCount(0);
    const services = getDemoServices();
    for (let i = 0; i <= services.length; i += 5) {
      setFoundCount(Math.min(i, services.length));
      await new Promise((r) => setTimeout(r, 100));
    }
    await saveResults(services);
  }

  async function runGmailOAuth() {
    if (!googleClientId) {
      setGmailError(t("gmail_not_configured"));
      return;
    }
    setGmailError("");
    const { generatePKCE, buildGmailOAuthUrl } = await import("@/lib/email-scan");
    const { verifier, challenge } = await generatePKCE();
    const oauthState = crypto.randomUUID();
    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("oauth_state", oauthState);
    const redirectUri = `${window.location.origin}/${locale}/dashboard/scan`;
    const url = buildGmailOAuthUrl(googleClientId, redirectUri, challenge, oauthState);
    window.location.href = url;
  }

  async function runImapScan(e: React.FormEvent) {
    e.preventDefault();
    setImapError("");
    setImapLoading(true);
    setScanState("scanning");
    try {
      const res = await fetch("/api/imap-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: imapEmail, password: imapPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanState("idle");
        if (data.error === "wrong_credentials") {
          setImapError(t("imap_wrong_credentials"));
        } else if (data.error === "connection_failed") {
          setImapError(t("imap_connection_failed"));
        } else {
          setImapError(t("imap_generic_error"));
        }
        setImapLoading(false);
        return;
      }
      const services: FoundService[] = data.services ?? [];
      setFoundCount(services.length);
      await saveResults(services);
    } catch {
      setScanState("idle");
      setImapError(t("imap_generic_error"));
    } finally {
      setImapLoading(false);
      setImapPassword("");
    }
  }

  function handleEmailChange(email: string) {
    setImapEmail(email);
    setDetectedProvider(email.includes("@") ? detectProvider(email) : null);
  }

  if (state === "scanning") {
    return (
      <div className="max-w-2xl">
        <Card className="flex flex-col items-center text-center py-16 gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full bg-indigo-500/5 animate-ping" />
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">{t("scanning_title")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("scanning_desc")}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold gradient-text">{foundCount}</span>
            <span className="text-sm text-muted-foreground">{t("found_so_far")}</span>
          </div>
        </Card>
      </div>
    );
  }

  if (state === "saving") {
    return (
      <div className="max-w-2xl">
        <Card className="flex flex-col items-center text-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
          <p className="font-semibold text-foreground">{t("saving")}</p>
        </Card>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="max-w-2xl">
        <Card className="flex flex-col items-center text-center py-16 gap-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">{t("complete_title")}</p>
            <p className="text-muted-foreground mt-1">{t("complete_desc", { count: resultCount })}</p>
          </div>
          <div className="flex gap-3">
            <a href={`/${locale}/dashboard/accounts`}>
              <Button>{t("view_accounts")}</Button>
            </a>
            <Button variant="outline" onClick={() => { setScanState("idle"); setFoundCount(0); }}>
              {t("scan_again")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex gap-3 items-start p-4 rounded-xl bg-green-500/5 border border-green-500/20">
        <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("privacy_title")}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{t("privacy_desc")}</p>
        </div>
      </div>

      {/* IMAP Scan */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("imap_title")}</h3>
            <p className="text-sm text-muted-foreground">{t("imap_subtitle")}</p>
          </div>
          <Badge variant="info" className="ml-auto">{t("recommended")}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Gmail", "Outlook", "Yahoo", "iCloud", "GMX", "WEB.DE", "T-Online"].map((p) => (
            <span key={p} className="px-2.5 py-1 text-xs rounded-full bg-muted/60 text-muted-foreground border border-border/60">
              {p}
            </span>
          ))}
        </div>

        <form onSubmit={runImapScan} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={imapEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={t("imap_email_placeholder")}
              className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-border/80 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              autoComplete="email"
              required
            />
          </div>

          {detectedProvider && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <ChevronDown className="w-3 h-3 text-indigo-400" />
              <span className="text-indigo-400 font-medium">{detectedProvider.label}</span>
              <span>— {detectedProvider.hint}</span>
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={imapPassword}
              onChange={(e) => setImapPassword(e.target.value)}
              placeholder={t("imap_password_placeholder")}
              className="w-full pl-10 pr-10 py-2.5 bg-background/60 border border-border/80 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {imapError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {imapError}
            </div>
          )}

          <Button type="submit" loading={imapLoading} className="w-full">
            <Mail className="w-4 h-4" />
            {t("imap_scan_btn")}
          </Button>

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            {t("imap_security_note")}
          </p>
        </form>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground">{t("or")}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Gmail OAuth */}
      <Card className="flex flex-col gap-4 items-center text-center py-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Mail className="w-6 h-6 text-red-400" />
        </div>
        <div className="w-full">
          <h3 className="font-semibold text-foreground mb-1">{t("gmail_oauth_title")}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t("gmail_oauth_desc")}</p>
          {gmailError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 mb-3 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{gmailError}</span>
            </div>
          )}
          {!googleClientId ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/60 text-sm text-muted-foreground text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t("gmail_not_configured")}</span>
            </div>
          ) : (
            <Button onClick={runGmailOAuth} className="bg-red-600 hover:bg-red-500 w-full">
              <Mail className="w-4 h-4" />
              {t("connect_gmail")}
            </Button>
          )}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs text-muted-foreground">{t("or")}</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Demo scan */}
      <Card className="flex flex-col gap-4 items-center text-center py-6 border-dashed">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Play className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{t("try_demo")}</h3>
            <Badge variant="info">{t("demo_badge")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("demo_desc")}</p>
          <Button variant="outline" onClick={runDemoScan}>
            <Play className="w-4 h-4" />
            {t("try_demo")}
          </Button>
        </div>
      </Card>

      {lastScanAt && (
        <p className="text-xs text-muted-foreground text-center">
          {t("last_scan")} {new Date(lastScanAt).toLocaleDateString()}
          {!isPro && <span className="ml-2 text-indigo-400">{t("pro_rescan_note")}</span>}
        </p>
      )}
    </div>
  );
}
