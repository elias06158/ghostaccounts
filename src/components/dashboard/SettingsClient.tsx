"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Crown, Sun, Moon, Monitor, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface SettingsClientProps {
  profile: Profile;
  locale: string;
}

export function SettingsClient({ profile, locale }: SettingsClientProps) {
  const t = useTranslations("dashboard.settings");
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState(profile.full_name ?? "");
  const [notifyBreach, setNotifyBreach] = useState(profile.notify_breach);
  const [notifyNew, setNotifyNew] = useState(profile.notify_new_account);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        full_name: name,
        notify_breach: notifyBreach,
        notify_new_account: notifyNew,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE" && deleteConfirm !== "LÖSCHEN") return;
    setDeleting(true);
    const supabase = createClient();
    // Delete all user data
    await supabase.from("scan_results").delete().eq("user_id", profile.id);
    await supabase.from("breach_alerts").delete().eq("user_id", profile.id);
    await supabase.from("profiles").delete().eq("id", profile.id);
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  }

  async function exportData() {
    const supabase = createClient();
    const { data: scanData } = await supabase
      .from("scan_results")
      .select("*")
      .eq("user_id", profile.id);
    const exportObj = { profile, scanResults: scanData };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ghostaccounts-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile */}
      <Card>
        <h2 className="font-semibold text-foreground mb-4">{t("profile_section")}</h2>
        <div className="space-y-4">
          <Input
            label={t("full_name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label={t("email")}
            value={profile.email ?? ""}
            disabled
            hint={t("email_hint")}
          />
          <div className="flex gap-3 items-center">
            <Button onClick={saveProfile} loading={saving}>
              {t("save_profile")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-500">
                <Check className="w-4 h-4" />
                {t("saved")}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <h2 className="font-semibold text-foreground mb-4">{t("theme_section")}</h2>
        <div className="flex gap-2">
          {[
            { value: "light", label: t("theme_light"), icon: <Sun className="w-4 h-4" /> },
            { value: "dark", label: t("theme_dark"), icon: <Moon className="w-4 h-4" /> },
            { value: "system", label: t("theme_system"), icon: <Monitor className="w-4 h-4" /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                theme === opt.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Plan */}
      <Card>
        <h2 className="font-semibold text-foreground mb-4">{t("plan_section")}</h2>
        <div className="flex items-center gap-3">
          {profile.plan === "pro" ? (
            <>
              <Badge variant="info" className="gap-1 text-sm px-3 py-1.5">
                <Crown className="w-4 h-4" />
                {t("plan_pro")}
              </Badge>
              <p className="text-sm text-muted-foreground">{t("plan_pro_desc")}</p>
            </>
          ) : (
            <>
              <Badge variant="default" className="text-sm px-3 py-1.5">
                {t("plan_free")}
              </Badge>
              <p className="text-sm text-muted-foreground">{t("plan_free_desc")}</p>
              <Button size="sm" className="ml-auto">
                <Crown className="w-3.5 h-3.5" />
                {t("upgrade_button")}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <h2 className="font-semibold text-foreground mb-4">{t("notifications_section")}</h2>
        <div className="space-y-3">
          {[
            { key: "breach", label: t("notify_breach"), value: notifyBreach, onChange: setNotifyBreach },
            { key: "new", label: t("notify_new_account"), value: notifyNew, onChange: setNotifyNew },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => item.onChange(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-sm text-foreground">{item.label}</span>
            </label>
          ))}
          <Button onClick={saveProfile} loading={saving} size="sm" variant="outline">
            {t("save_profile")}
          </Button>
        </div>
      </Card>

      {/* Privacy / Data */}
      <Card>
        <h2 className="font-semibold text-foreground mb-4">{t("privacy_section")}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("export_data")}</p>
              <p className="text-xs text-muted-foreground">{t("export_desc")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportData}>
              {t("export_data")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-4">{t("delete_account")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("delete_desc")}</p>
        <div className="flex gap-3 items-end">
          <Input
            label={t("delete_confirm_label")}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
          <Button
            variant="destructive"
            onClick={deleteAccount}
            loading={deleting}
            disabled={(deleteConfirm !== "DELETE" && deleteConfirm !== "LÖSCHEN") || deleting}
          >
            {t("delete_button")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
