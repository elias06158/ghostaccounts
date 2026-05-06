import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/dashboard/SettingsClient";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.settings");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  if (!profile) {
    // Profile might not exist yet — create it
    await supabase.from("profiles").insert({
      id: user!.id,
      email: user!.email,
      plan: "free",
      language: locale,
    });
  }

  const safeProfile = profile ?? {
    id: user!.id,
    email: user!.email ?? null,
    full_name: null,
    plan: "free" as const,
    language: locale,
    notify_breach: true,
    notify_new_account: false,
    last_scan_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <SettingsClient profile={safeProfile} locale={locale} />
    </div>
  );
}
