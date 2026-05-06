import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ScanClient } from "@/components/dashboard/ScanClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "New Scan" };

export default async function ScanPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.scan");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, last_scan_at")
    .eq("id", user!.id)
    .single();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>
      <ScanClient
        locale={locale}
        userId={user!.id}
        isPro={profile?.plan === "pro"}
        lastScanAt={profile?.last_scan_at ?? null}
        googleClientId={googleClientId}
      />
    </div>
  );
}
