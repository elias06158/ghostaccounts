"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  List,
  ScanLine,
  Settings,
  Crown,
  Zap,
  Network,
  TrendingUp,
  Scroll,
  LogOut,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { GhostLogo } from "@/components/GhostLogo";

interface DashboardSidebarProps {
  locale: string;
  profile: Profile | null;
}

interface NavContentProps {
  locale: string;
  profile: Profile | null;
  pathname: string;
  nav: { href: string; Icon: React.ElementType; label: string }[];
  otherLocale: string;
  switchLocalePath: string;
  onToggleTheme: () => void;
  onLogout: () => void;
  t: (key: string) => string;
  onNavigate?: () => void;
}

function NavContent({
  locale,
  profile,
  pathname,
  nav,
  otherLocale,
  switchLocalePath,
  onToggleTheme,
  onLogout,
  t,
  onNavigate,
}: NavContentProps) {
  return (
    <>
      {/* Logo */}
      <Link
        href={`/${locale}`}
        onClick={onNavigate}
        className="group flex items-center gap-2.5 px-3 py-3 mb-1"
      >
        <GhostLogo className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
        <span className="text-sm font-bold tracking-tight text-foreground">
          Ghost<span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">Accounts</span>
        </span>
      </Link>

      <div className="h-px bg-border/50 mb-3" />

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {nav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-indigo-400"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-4 space-y-3">
        <div className="h-px bg-border/50" />

        {/* Plan card */}
        {profile?.plan === "pro" ? (
          <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-0.5">
              <Crown className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pro</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">Free</span>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile?.email}</p>
            </div>
            <Link
              href={`/${locale}/dashboard/settings`}
              onClick={onNavigate}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 hover:border-indigo-500/60 hover:from-indigo-600/30 transition-all duration-200"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400">{t("upgrade")}</span>
            </Link>
          </div>
        )}

        <div className="h-px bg-border/50" />

        {/* Controls row: language + theme + logout */}
        <div className="flex items-center gap-1 px-1">
          <Link
            href={switchLocalePath}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            title={t("language")}
          >
            <Globe className="w-3.5 h-3.5" />
            {otherLocale.toUpperCase()}
          </Link>
          <button
            onClick={onToggleTheme}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            aria-label="Toggle theme"
          >
            {/* Use CSS to avoid hydration mismatch: dark class on <html> drives visibility */}
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 dark:hidden" />
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
            title={t("logout")}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function DashboardSidebar({ locale, profile }: DashboardSidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const otherLocale = locale === "en" ? "de" : "en";
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const nav = [
    { href: `/${locale}/dashboard`, Icon: LayoutDashboard, label: t("dashboard") },
    { href: `/${locale}/dashboard/accounts`, Icon: List, label: t("accounts") },
    { href: `/${locale}/dashboard/twin`, Icon: Network, label: t("twin") },
    { href: `/${locale}/dashboard/forecast`, Icon: TrendingUp, label: t("forecast") },
    { href: `/${locale}/dashboard/will`, Icon: Scroll, label: t("will") },
    { href: `/${locale}/dashboard/scan`, Icon: ScanLine, label: t("scan") },
    { href: `/${locale}/dashboard/settings`, Icon: Settings, label: t("settings") },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  const navProps = {
    locale,
    profile,
    pathname,
    nav,
    otherLocale,
    switchLocalePath,
    onToggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    onLogout: handleLogout,
    t: (key: string) => t(key as Parameters<typeof t>[0]),
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 h-full border-r border-border/50 bg-card/80 backdrop-blur-xl p-4 overflow-y-auto">
        <NavContent {...navProps} />
      </aside>

      {/* Mobile: fixed top bar — h-0 wrapper so it doesn't affect flex layout */}
      <div className="md:hidden h-0 overflow-visible">
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-background/90 backdrop-blur-xl border-b border-border/50">
          <Link href={`/${locale}`} className="group flex items-center gap-2 font-bold">
            <GhostLogo className="w-5 h-5 text-indigo-400" />
            <span className="text-sm tracking-tight text-foreground">
              Ghost<span className="text-indigo-400">Accounts</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label={t("sidebar_open")}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border/60 p-4 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label={t("sidebar_close")}
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent {...navProps} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

