"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GhostLogo } from "@/components/GhostLogo";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(tErr("invalid_credentials"));
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
      },
    });
    if (authError) {
      setError(tErr("generic"));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href={`/${locale}`} className="inline-flex flex-col items-center gap-3 group">
          <GhostLogo className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          <span className="text-sm font-medium text-muted-foreground">
            Ghost<span className="text-indigo-400">Accounts</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-6 mb-1">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Card */}
      <div className="relative p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-xl">
        {/* Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        <form onSubmit={handleSubmit} className="relative space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          {/* Error */}
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
              <>
                {t("submit")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t("or_continue_with")}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="group w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-muted/50 hover:bg-muted border border-border text-foreground font-medium text-sm transition-all duration-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("google_sign_in")}
            </>
          )}
        </button>

        <div className="relative mt-6 text-center space-y-3">
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {t("forgot")}
          </Link>
          <p className="text-sm text-muted-foreground">
            {t("no_account")}{" "}
            <Link href={`/${locale}/auth/register`} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              {t("register_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
