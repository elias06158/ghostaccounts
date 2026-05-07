import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DigitalWillClient } from "@/components/dashboard/DigitalWillClient";
import type { DigitalWill, DigitalWillItem } from "@/types/database";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = { title: "Digital Will" };

export default async function DigitalWillPage({ params }: PageProps) {
  await params;
  await getTranslations("will");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: scanResults }, { data: willData }, { data: willItems }] = await Promise.all([
    supabase
      .from("scan_results")
      .select("*")
      .eq("user_id", user!.id)
      .eq("deletion_status", "active")
      .order("first_detected_at", { ascending: false }),
    supabase
      .from("digital_will")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle(),
    supabase
      .from("digital_will_items")
      .select("*")
      .eq("user_id", user!.id),
  ]);

  return (
    <DigitalWillClient
      results={scanResults ?? []}
      will={willData as DigitalWill | null}
      items={(willItems ?? []) as DigitalWillItem[]}
    />
  );
}
