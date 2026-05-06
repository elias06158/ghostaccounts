"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GhostLogo } from "@/components/GhostLogo";
import { Card } from "@/components/ui/Card";
import { CheckCircle } from "lucide-react";

interface ForgotPasswordFormProps {
  locale: string;
}

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations("auth.forgot");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
    });
    setLoading(false);
    setSuccess(true);
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
          <GhostLogo className="w-10 h-10 text-indigo-500" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {success ? (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-foreground">{t("success")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {t("submit")}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href={`/${locale}/auth/login`}
          className="text-sm text-indigo-500 hover:text-indigo-400"
        >
          ← {t("back")}
        </Link>
      </div>
    </Card>
  );
}
