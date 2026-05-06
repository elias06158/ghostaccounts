"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Mail,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Play,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDemoServices } from "@/lib/email-scan";
import type { FoundService } from "@/lib/email-scan";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type ScanState = "idle" | "scanning" | "saving" | "done";

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
  const [isDemo, setIsDemo] = useState(false);

  const saveResults = useCallback(
    async (services: FoundService[]) => {
      setScanState("saving");
      const supabase = createClient();

      const upsertData = services.map((s) => ({
        user_id: userId,
        service_name: s.name,
        service_domain: s.domain,
        last_email_date: s.lastEmailDate,
        first_detected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from("scan_results")
        .upsert(upsertData, { onConflict: "user_id,service_domain", ignoreDuplicates: false });

      await supabase
        .from("profiles")
        .update({ last_scan_at: new Date().toISOString() })
        .eq("id", userId);

      setScanState("done");
    },
    [userId]
  );

  // Handle OAuth callback on mount
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
        const services = await scanGmail(accessToken, setFoundCount);
        await saveResults(services);
      } catch {
        setScanState("idle");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runDemoScan() {
    setIsDemo(true);
    setScanState("scanning");
    setFoundCount(0);
    const services = getDemoServices();
    for (let i = 0; i <= services.length; i += 5) {
      setFoundCount(Math.min(i, services.length));
      await new Promise((r) => setTimeout(r, 120));
    }
    await saveResults(services);
  }

  async function runGmailScan() {
    if (!googleClientId) {
      alert("Gmail OAuth not configured. Use Demo Scan instead.");
      return;
    }
    setIsDemo(false);

    const { generatePKCE, buildGmailOAuthUrl } = await import("@/lib/email-scan");
    const { verifier, challenge } = await generatePKCE();
    const oauthState = crypto.randomUUID();
    sessionStorage.setItem("pkce_verifier", verifier);
    sessionStorage.setItem("oauth_state", oauthState);

    const redirectUri = `${window.location.origin}/${locale}/dashboard/scan`;
    const url = buildGmailOAuthUrl(googleClientId, redirectUri, challenge, oauthState);
    window.location.href = url;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Privacy note */}
      <Card className="flex gap-4 items-start bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("privacy_title")}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{t("privacy_desc")}</p>
        </div>
      </Card>

      {state === "idle" && (
        <>
          {/* Gmail scan button */}
          <Card className="flex flex-col gap-4 items-center text-center py-8">
            <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/30">
              <Mail className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Gmail</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("privacy_desc")}
              </p>
              <Button
                onClick={runGmailScan}
                className="bg-red-600 hover:bg-red-500"
              >
                <Mail className="w-4 h-4" />
                {t("connect_gmail")}
              </Button>
            </div>
          </Card>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t" />
            <span className="text-sm text-muted-foreground">{t("or")}</span>
            <div className="flex-1 border-t" />
          </div>

          {/* Demo scan */}
          <Card className="flex flex-col gap-4 items-center text-center py-8 border-dashed">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/30">
              <Play className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{t("try_demo")}</h3>
                <Badge variant="info">{t("demo_badge")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t("demo_desc")}</p>
              <Button variant="outline" onClick={runDemoScan}>
                {t("try_demo")}
              </Button>
            </div>
          </Card>

          {/* Last scan info */}
          {lastScanAt && (
            <p className="text-xs text-muted-foreground text-center">
              {t("last_scan")} {new Date(lastScanAt).toLocaleDateString()}
              {!isPro && (
                <span className="ml-2 text-indigo-500">{t("pro_rescan_note")}</span>
              )}
            </p>
          )}
        </>
      )}

      {/* Scanning state */}
      {state === "scanning" && (
        <Card className="flex flex-col items-center text-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <div>
            <p className="font-semibold text-foreground">{t("scanning_title")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("scanning_desc")}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-500">{foundCount}</span>
            <span className="text-sm text-muted-foreground">{t("found_so_far")}</span>
          </div>
        </Card>
      )}

      {/* Saving state */}
      {state === "saving" && (
        <Card className="flex flex-col items-center text-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="font-semibold text-foreground">{t("saving")}</p>
        </Card>
      )}

      {/* Done state */}
      {state === "done" && (
        <Card className="flex flex-col items-center text-center py-12 gap-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <div>
            <p className="text-xl font-bold text-foreground">{t("complete_title")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("complete_desc", { count: foundCount })}
            </p>
            {isDemo && (
              <Badge variant="info" className="mt-2">{t("demo_badge")}</Badge>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <a href={`/${locale}/dashboard/accounts`}>
              <Button>{t("view_accounts")}</Button>
            </a>
            <Button
              variant="outline"
              onClick={() => { setScanState("idle"); setFoundCount(0); }}
            >
              <RefreshCw className="w-4 h-4" />
              {t("scan_again")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
