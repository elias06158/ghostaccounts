"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface CookieBannerProps {
  locale: string;
}

export function CookieBanner({ locale }: CookieBannerProps) {
  const t = useTranslations("cookie");
  const [dismissed, setDismissed] = useState(false);
  const needsConsent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => !window.localStorage.getItem("cookie-consent"),
    () => false
  );

  const visible = needsConsent && !dismissed;

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setDismissed(true);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 rounded-xl border bg-card shadow-lg p-4">
      <p className="text-sm text-muted-foreground mb-3">{t("message")}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={accept}>{t("accept")}</Button>
        <Button size="sm" variant="outline" onClick={decline}>{t("decline")}</Button>
        <Link
          href={`/${locale}/legal/datenschutz`}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
        >
          {t("learn_more")}
        </Link>
      </div>
    </div>
  );
}
