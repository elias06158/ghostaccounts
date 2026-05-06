"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Mail, Lock, User, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GhostLogo } from "@/components/GhostLogo";

interface RegisterFormProps {
  locale: string;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const t = useTranslations("auth.register");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError(tErr("weak_password")); return; }
    if (password !== confirm) { setError(tErr("passwords_mismatch")); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message.includes("already") ? tErr("email_taken") : tErr("generic"));
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  const fields = [
    { id: "name",    Icon: User, type: "text",     value: name,     set: setName,     label: t("name"),             placeholder: "Max Mustermann",    autocomplete: "name" },
    { id: "email",   Icon: Mail, type: "email",    value: email,    set: setEmail,    label: t("email"),            placeholder: "you@example.com",   autocomplete: "email" },
    { id: "pass",    Icon: Lock, type: "password", value: password, set: setPassword, label: t("password"),         placeholder: "Min. 8 Zeichen",    autocomplete: "new-password" },
    { id: "confirm", Icon: Lock, type: "password", value: confirm,  set: setConfirm,  label: t("password_confirm"), placeholder: "••••••••",          autocomplete: "new-password" },
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Link href={`/${locale}`} className="inline-flex flex-col items-center gap-3 group">
          <GhostLogo className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          <span className="text-sm font-medium text-muted-foreground">Ghost<span className="text-indigo-400">Accounts</span></span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="relative p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <form onSubmit={handleSubmit} className="relative space-y-4">
          {fields.map((f) => {
            const Icon = f.Icon;
            return (
              <div key={f.id} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    required
                    autoComplete={f.autocomplete}
                    placeholder={f.placeholder}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            );
          })}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>{t("submit")} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
            )}
          </button>
        </form>

        <div className="relative mt-6 text-center space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("terms_prefix")}{" "}
            <Link href={`/${locale}/legal/agb`} className="text-indigo-400 hover:text-indigo-300 transition-colors">{t("agb")}</Link>
            {" "}{t("terms_and")}{" "}
            <Link href={`/${locale}/legal/datenschutz`} className="text-indigo-400 hover:text-indigo-300 transition-colors">{t("datenschutz")}</Link>.
          </p>
          <p className="text-sm text-muted-foreground">
            {t("have_account")}{" "}
            <Link href={`/${locale}/auth/login`} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">{t("login_link")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
