import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AccountsList } from "@/components/dashboard/AccountsList";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "My Accounts" };

export default async function AccountsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("dashboard.accounts");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user!.id)
    .single();

  const { data: scanResults } = await supabase
    .from("scan_results")
    .select("*")
    .eq("user_id", user!.id)
    .order("breach_status", { ascending: false })
    .order("first_detected_at", { ascending: false });

  const isPro = profile?.plan === "pro";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>
      <AccountsList
        results={scanResults ?? []}
        isPro={isPro}
        locale={locale}
      />
    </div>
  );
}
