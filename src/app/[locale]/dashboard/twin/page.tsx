import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DigitalTwinClient } from "@/components/dashboard/DigitalTwinClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "Digital Twin" };

export default async function DigitalTwinPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.twin");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user!.id)
    .single();

  const { data: scanResults } = await supabase
    .from("scan_results")
    .select("*")
    .eq("user_id", user!.id)
    .order("first_detected_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🌐</span>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {t("badge")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <DigitalTwinClient
        results={scanResults ?? []}
        email={profile?.email ?? user?.email ?? ""}
        locale={locale}
      />
    </div>
  );
}
