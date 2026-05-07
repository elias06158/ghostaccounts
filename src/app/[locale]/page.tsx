import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Mail,
  List,
  Shield,
  Trash2,
  Bell,
  Lock,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Eye,
  CreditCard,
  Zap,
  ArrowRight,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { GhostLogo } from "@/components/GhostLogo";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  const features = [
    { icon: Mail, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", title: t("landing.features.scan_title"), desc: t("landing.features.scan_desc") },
    { icon: List, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", title: t("landing.features.list_title"), desc: t("landing.features.list_desc") },
    { icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", title: t("landing.features.score_title"), desc: t("landing.features.score_desc") },
    { icon: Trash2, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", title: t("landing.features.delete_title"), desc: t("landing.features.delete_desc") },
    { icon: Bell, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", title: t("landing.features.monitor_title"), desc: t("landing.features.monitor_desc") },
    { icon: Lock, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", title: t("landing.features.privacy_title"), desc: t("landing.features.privacy_desc") },
  ];

  const freeFeatures = [
    { text: t("landing.pricing.feature_accounts_free"), included: true },
    { text: t("landing.pricing.feature_score"), included: true },
    { text: t("landing.pricing.feature_delete_free"), included: true },
    { text: t("landing.pricing.feature_rescan"), included: false },
    { text: t("landing.pricing.feature_monitoring"), included: false },
    { text: t("landing.pricing.feature_alerts"), included: false },
  ];

  const proFeatures = [
    { text: t("landing.pricing.feature_accounts_pro"), included: true },
    { text: t("landing.pricing.feature_score"), included: true },
    { text: t("landing.pricing.feature_delete_pro"), included: true },
    { text: t("landing.pricing.feature_rescan"), included: true },
    { text: t("landing.pricing.feature_monitoring"), included: true },
    { text: t("landing.pricing.feature_alerts"), included: true },
  ];

  const stats = [
    { value: t("landing.hero.stat1_value"), label: t("landing.hero.stat1_label"), color: "text-indigo-400" },
    { value: t("landing.hero.stat2_value"), label: t("landing.hero.stat2_label"), color: "text-red-400" },
    { value: t("landing.hero.stat3_value"), label: t("landing.hero.stat3_label"), color: "text-green-400" },
  ];

  const problems = [
    { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", title: t("landing.problem.risk1_title"), desc: t("landing.problem.risk1_desc") },
    { icon: Eye, color: "text-orange-400", bg: "bg-orange-500/10", title: t("landing.problem.risk2_title"), desc: t("landing.problem.risk2_desc") },
    { icon: CreditCard, color: "text-amber-400", bg: "bg-amber-500/10", title: t("landing.problem.risk3_title"), desc: t("landing.problem.risk3_desc") },
    { icon: Fingerprint, color: "text-rose-400", bg: "bg-rose-500/10", title: t("landing.problem.risk4_title"), desc: t("landing.problem.risk4_desc") },
  ];

  const steps = [
    {
      step: "01", icon: Mail, color: "text-indigo-400", gradient: "from-indigo-600 to-indigo-400",
      title: locale === "de" ? "Verbinden" : "Connect",
      desc: locale === "de"
        ? "Verknüpfe dein Gmail-Konto via sicherem OAuth 2.0 + PKCE — keine Passwörter, keine Speicherung von E-Mails."
        : "Link your Gmail account via secure OAuth 2.0 + PKCE — no passwords, no email storage.",
    },
    {
      step: "02", icon: Zap, color: "text-cyan-400", gradient: "from-cyan-600 to-cyan-400",
      title: locale === "de" ? "Entdecken" : "Discover",
      desc: locale === "de"
        ? "Die Analyse wertet Betreff, Absender und weitere Mail-Metadaten lokal oder per IMAP-Metadatenzugriff aus. Nur Dienst-Metadaten werden gespeichert."
        : "The scan evaluates subjects, senders, and related email metadata locally or through IMAP metadata access. Only derived service metadata is stored.",
    },
    {
      step: "03", icon: ShieldAlert, color: "text-purple-400", gradient: "from-purple-600 to-purple-400",
      title: locale === "de" ? "Aufräumen" : "Clean Up",
      desc: locale === "de"
        ? "Sieh deinen Risiko-Score, prüfe die Erkennungsqualität und öffne vergessene Konten direkt auf ihrer Löschseite."
        : "Review your risk score, inspect detection quality, and open forgotten accounts directly on their deletion page.",
    },
  ];

  return (
    <div className="overflow-hidden">

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-24">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10 bg-hero-gradient" />
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 dark:bg-cyan-500/6 rounded-full blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 mb-8 animate-fade-in-up">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-400 tracking-wide uppercase">
              GDPR-compliant · Privacy First · Open Source
            </span>
          </div>

          {/* Logo + Title */}
          <div className="flex items-center justify-center mb-6 animate-fade-in-up animation-delay-100">
            <div className="relative">
              <GhostLogo className="w-20 h-20 text-indigo-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]" />
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl -z-10" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2 animate-fade-in-up animation-delay-200">
            <span className="text-foreground">{locale === "de" ? "Ghost" : "Ghost"}</span>
            <span className="gradient-text">Accounts</span>
          </h1>

          <p className="text-base md:text-lg font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6 animate-fade-in-up animation-delay-200">
            {locale === "de"
              ? "Finde und lösche vergessene Online-Konten"
              : "Find and delete forgotten online accounts"}
          </p>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-300">
            {t("landing.hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Link href={`/${locale}/auth/register`}>
              <button className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] active:scale-100">
                {t("landing.hero.cta_primary")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href={`#features`}>
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-border hover:border-indigo-500/50 text-muted-foreground hover:text-foreground font-semibold text-base transition-all duration-300 hover:bg-muted/50 backdrop-blur-sm">
                {t("landing.hero.cta_secondary")}
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto animate-fade-in-up animation-delay-500">
            {stats.map((s) => (
              <div key={s.value} className="relative group px-6 py-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm hover:border-indigo-500/40 transition-all duration-300">
                <p className={`text-3xl font-black ${s.color} glow-text`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ─── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-muted/20 dark:bg-muted/30" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">
              {locale === "de" ? "Das Problem" : "The Problem"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("landing.problem.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {problems.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="group flex gap-4 items-start p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:border-indigo-500/40 hover:bg-card transition-all duration-300">
                  <div className={`shrink-0 p-3 rounded-xl ${p.bg} border border-transparent`}>
                    <Icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
              {locale === "de" ? "So funktioniert es" : "How it works"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {locale === "de" ? "Drei Schritte zur digitalen Sicherheit" : "Three steps to digital safety"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative text-center group">
                  <div className="relative inline-flex mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${s.gradient} p-[1px] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-shadow duration-500`}>
                      <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                        <Icon className={`w-8 h-8 ${s.color}`} />
                      </div>
                    </div>
                    <span className="absolute -top-2 -right-2 text-[10px] font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/40 rounded-full px-2 py-0.5">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-muted/20 dark:bg-muted/30" />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("landing.features.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group relative p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300">
                  <div className={`inline-flex p-3 rounded-xl border ${f.bg} mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("landing.pricing.title")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("landing.pricing.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="relative p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground mb-1">{t("landing.pricing.free_title")}</h3>
              <div className="flex items-baseline gap-1 mt-3 mb-6">
                <span className="text-4xl font-black text-foreground">{t("landing.pricing.free_price")}</span>
                <span className="text-sm text-muted-foreground">/ {t("landing.pricing.free_period")}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    {f.included
                      ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                      : <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
                    <span className={`text-sm ${f.included ? "text-foreground" : "text-muted-foreground/60"}`}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/auth/register`} className="block">
                <button className="w-full py-3 rounded-xl border border-border hover:border-indigo-500/50 text-muted-foreground hover:text-foreground font-semibold text-sm transition-all duration-200 hover:bg-muted/50">
                  {t("landing.pricing.cta_free")}
                </button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative p-8 rounded-2xl border border-indigo-500/50 bg-gradient-to-b from-indigo-600/10 to-transparent backdrop-blur-sm shadow-[0_0_60px_rgba(99,102,241,0.15)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                  ✦ {t("landing.pricing.popular")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("landing.pricing.pro_title")}</h3>
              <div className="flex items-baseline gap-1 mt-3 mb-6">
                <span className="text-4xl font-black gradient-text">{t("landing.pricing.pro_price")}</span>
                <span className="text-sm text-muted-foreground">/ {t("landing.pricing.pro_period")}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {proFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-sm text-foreground">{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/auth/register`} className="block">
                <button className="group w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                  {t("landing.pricing.cta_pro")} →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 via-indigo-600/10 to-transparent dark:from-indigo-900/40 dark:via-indigo-900/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 dark:bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-2xl text-center">
          <GhostLogo className="w-16 h-16 text-indigo-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-10">{t("landing.cta.subtitle")}</p>
          <Link href={`/${locale}/auth/register`}>
            <button className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]">
              {t("landing.cta.button")}
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
