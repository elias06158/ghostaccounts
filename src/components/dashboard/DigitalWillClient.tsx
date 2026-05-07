"use client";

import { useState, useTransition, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Trash2,
  Users,
  Archive,
  ChevronDown,
  ChevronUp,
  Save,
  Power,
  AlertTriangle,
  Info,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DigitalWill, DigitalWillItem, ScanResult } from "@/types/database";
import { lookupService } from "@/lib/services-db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type GlobalAction = "delete" | "transfer" | "archive";
type ItemAction = "inherit" | "delete" | "transfer" | "archive" | "keep";

interface DigitalWillClientProps {
  results: ScanResult[];
  will: DigitalWill | null;
  items: DigitalWillItem[];
}

const ACTION_META: Record<
  GlobalAction | "keep" | "inherit",
  { icon: React.ReactNode; colorClass: string; borderClass: string }
> = {
  delete: {
    icon: <Trash2 className="w-4 h-4" />,
    colorClass: "text-red-400",
    borderClass: "border-red-500/30 bg-red-500/5",
  },
  transfer: {
    icon: <Users className="w-4 h-4" />,
    colorClass: "text-indigo-400",
    borderClass: "border-indigo-500/30 bg-indigo-500/5",
  },
  archive: {
    icon: <Archive className="w-4 h-4" />,
    colorClass: "text-amber-400",
    borderClass: "border-amber-500/30 bg-amber-500/5",
  },
  keep: {
    icon: <Check className="w-4 h-4" />,
    colorClass: "text-green-400",
    borderClass: "border-green-500/30 bg-green-500/5",
  },
  inherit: {
    icon: <Info className="w-4 h-4" />,
    colorClass: "text-muted-foreground",
    borderClass: "border-border/40 bg-muted/20",
  },
};

export function DigitalWillClient({ results, will: initialWill, items: initialItems }: DigitalWillClientProps) {
  const t = useTranslations("will");
  const [, startTransition] = useTransition();

  // Global will state
  const [isActive, setIsActive] = useState(initialWill?.is_active ?? false);
  const [inactivityMonths, setInactivityMonths] = useState(initialWill?.inactivity_months ?? 6);
  const [globalAction, setGlobalAction] = useState<GlobalAction>(initialWill?.global_action ?? "archive");
  const [transferEmail, setTransferEmail] = useState(initialWill?.transfer_email ?? "");
  const [transferName, setTransferName] = useState(initialWill?.transfer_name ?? "");
  const [personalMessage, setPersonalMessage] = useState(initialWill?.personal_message ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Per-account items
  const [items, setItems] = useState<Map<string, DigitalWillItem>>(
    () => new Map(initialItems.map((item) => [item.scan_result_id, item]))
  );
  const [expandedAccounts, setExpandedAccounts] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    let del = 0, transfer = 0, archive = 0, keep = 0, inherit = 0;
    results.forEach((r) => {
      const item = items.get(r.id);
      const action = item?.action ?? "inherit";
      if (action === "delete") del++;
      else if (action === "transfer") transfer++;
      else if (action === "archive") archive++;
      else if (action === "keep") keep++;
      else inherit++;
    });
    return { delete: del, transfer, archive, keep, inherit };
  }, [results, items]);

  async function saveGlobalWill() {
    setSaving(true);
    setSaved(false);

    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      is_active: isActive,
      inactivity_months: inactivityMonths,
      global_action: globalAction,
      transfer_email: globalAction === "transfer" ? transferEmail : null,
      transfer_name: globalAction === "transfer" ? transferName : null,
      personal_message: personalMessage || null,
      updated_at: new Date().toISOString(),
    };

    await supabaseClient
      .from("digital_will")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function updateItemAction(scanResultId: string, action: ItemAction, extraTransferEmail?: string) {
    setSavingItem(scanResultId);
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      scan_result_id: scanResultId,
      action,
      transfer_email: action === "transfer" ? (extraTransferEmail ?? null) : null,
      updated_at: new Date().toISOString(),
    };

    await supabaseClient
      .from("digital_will_items")
      .upsert(payload, { onConflict: "user_id,scan_result_id" });

    startTransition(() => {
      setItems((prev) => {
        const next = new Map(prev);
        const existing = next.get(scanResultId);
        next.set(scanResultId, {
          id: existing?.id ?? "",
          user_id: user.id,
          scan_result_id: scanResultId,
          action,
          transfer_email: action === "transfer" ? (extraTransferEmail ?? null) : null,
          note: existing?.note ?? null,
          created_at: existing?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return next;
      });
    });

    setSavingItem(null);
  }

  const MONTH_OPTIONS = [1, 3, 6, 12, 24];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📜</span>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <Badge variant="info">{t("badge")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">{t("subtitle")}</p>
      </div>

      {/* Activation toggle */}
      <div className={`rounded-2xl border p-5 transition-all duration-300 ${isActive ? "border-indigo-500/30 bg-indigo-500/5" : "border-border/60 bg-card/80"}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isActive ? "bg-indigo-500/20" : "bg-muted/60"}`}>
              <Power className={`w-4 h-4 transition-colors ${isActive ? "text-indigo-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("activate_title")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("activate_desc")}</p>
            </div>
          </div>
          <button
            onClick={() => setIsActive((v) => !v)}
            aria-label={isActive ? t("deactivate") : t("activate")}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive ? "bg-indigo-600" : "bg-muted"}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* Global settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inactivity trigger */}
        <Card>
          <h2 className="font-semibold text-foreground mb-1">{t("trigger_title")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("trigger_desc")}</p>
          <div className="flex gap-2 flex-wrap">
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setInactivityMonths(m)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  inactivityMonths === m
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {m} {m === 1 ? t("month") : t("months")}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ⏱ {t("trigger_note", { months: inactivityMonths })}
          </p>
        </Card>

        {/* Default action */}
        <Card>
          <h2 className="font-semibold text-foreground mb-1">{t("action_title")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("action_desc")}</p>
          <div className="space-y-2">
            {(["delete", "transfer", "archive"] as const).map((action) => {
              const meta = ACTION_META[action];
              return (
                <button
                  key={action}
                  onClick={() => setGlobalAction(action)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                    globalAction === action
                      ? `${meta.borderClass} ${meta.colorClass} border-opacity-100`
                      : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <span className={meta.colorClass}>{meta.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${globalAction === action ? meta.colorClass : ""}`}>
                      {t(`action_${action}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t(`action_${action}_desc`)}</p>
                  </div>
                  {globalAction === action && (
                    <Check className={`w-4 h-4 shrink-0 ${meta.colorClass}`} />
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Transfer settings (conditional) */}
      {globalAction === "transfer" && (
        <Card>
          <h2 className="font-semibold text-foreground mb-1">{t("transfer_title")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("transfer_desc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("transfer_name_label")}</label>
              <input
                type="text"
                value={transferName}
                onChange={(e) => setTransferName(e.target.value)}
                placeholder={t("transfer_name_placeholder")}
                className="w-full px-3 py-2 text-sm bg-background/60 border border-border/80 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("transfer_email_label")}</label>
              <input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder={t("transfer_email_placeholder")}
                className="w-full px-3 py-2 text-sm bg-background/60 border border-border/80 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Personal message */}
      <Card>
        <h2 className="font-semibold text-foreground mb-1">{t("message_title")}</h2>
        <p className="text-xs text-muted-foreground mb-3">{t("message_desc")}</p>
        <textarea
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          placeholder={t("message_placeholder")}
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2.5 text-sm bg-background/60 border border-border/80 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
        />
        <p className="text-xs text-muted-foreground/50 mt-1 text-right">
          {personalMessage.length}/1000
        </p>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button onClick={saveGlobalWill} disabled={saving} size="lg">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("saving")}
            </span>
          ) : saved ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {t("saved")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {t("save_button")}
            </span>
          )}
        </Button>
        {isActive && (
          <p className="text-xs text-indigo-400 flex items-center gap-1.5">
            <Power className="w-3 h-3" />
            {t("will_active_note")}
          </p>
        )}
      </div>

      {/* Per-account overrides */}
      <div className="rounded-2xl border border-border/60 overflow-hidden">
        {/* Summary bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-card/80 border-b border-border/50">
          <div>
            <h2 className="font-semibold text-foreground">{t("accounts_title")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("accounts_subtitle")}</p>
          </div>
          {/* Mini stats */}
          <div className="flex items-center gap-3 text-xs">
            {stats.delete > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <Trash2 className="w-3 h-3" />{stats.delete}
              </span>
            )}
            {stats.transfer > 0 && (
              <span className="flex items-center gap-1 text-indigo-400">
                <Users className="w-3 h-3" />{stats.transfer}
              </span>
            )}
            {stats.archive > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Archive className="w-3 h-3" />{stats.archive}
              </span>
            )}
            <button
              onClick={() => setExpandedAccounts((v) => !v)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ml-2"
            >
              {expandedAccounts ? (
                <><ChevronUp className="w-4 h-4" />{t("hide_accounts")}</>
              ) : (
                <><ChevronDown className="w-4 h-4" />{t("show_accounts", { count: results.length })}</>
              )}
            </button>
          </div>
        </div>

        {expandedAccounts && (
          <div className="divide-y divide-border/30">
            {results.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t("no_accounts")}
              </div>
            ) : (
              results.map((result) => {
                const item = items.get(result.id);
                const currentAction: ItemAction = item?.action ?? "inherit";
                const info = lookupService(result.service_domain ?? result.service_name);
                const isSaving = savingItem === result.id;

                return (
                  <div key={result.id} className="px-5 py-3.5 flex items-center gap-4">
                    {/* Favicon */}
                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 overflow-hidden">
                      {result.service_domain ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${result.service_domain}&sz=32`}
                          alt=""
                          width={20}
                          height={20}
                          className="w-4 h-4"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">
                          {result.service_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{result.service_name}</p>
                      {info?.category && (
                        <p className="text-xs text-muted-foreground/60 capitalize">{info.category}</p>
                      )}
                    </div>

                    {/* Action selector */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(["inherit", "archive", "transfer", "delete", "keep"] as ItemAction[]).map((action) => {
                        const isSelected = currentAction === action;
                        const meta = ACTION_META[action];
                        return (
                          <button
                            key={action}
                            onClick={() => updateItemAction(result.id, action)}
                            disabled={isSaving}
                            title={t(`item_${action}`)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                              isSelected
                                ? `${meta.borderClass} ${meta.colorClass}`
                                : "border-border/30 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                            }`}
                          >
                            <span className="w-3 h-3">
                              {action === "inherit" ? (
                                <Info className="w-3 h-3" />
                              ) : action === "delete" ? (
                                <Trash2 className="w-3 h-3" />
                              ) : action === "transfer" ? (
                                <Users className="w-3 h-3" />
                              ) : action === "archive" ? (
                                <Archive className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                      {isSaving && (
                        <span className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin ml-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Legal notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500/60" />
        <p>{t("legal_note")}</p>
      </div>
    </div>
  );
}
