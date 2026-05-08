"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Menu, X, Globe, Moon, Sun, LogOut, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { GhostLogo } from "@/components/GhostLogo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
  locale: string;
}

export function Header({ user, locale }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dashboard has its own sidebar with all nav — hide header there
  const isDashboard = pathname.startsWith(`/${locale}/dashboard`);

  const otherLocale = locale === "en" ? "de" : "en";
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  if (isDashboard) return null;

  // Landing page nav links — only for unauthenticated users
  const landingLinks = [
    { href: `/${locale}#features`, label: "Features" },
    { href: `/${locale}#pricing`, label: "Pricing" },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href={user ? `/${locale}/dashboard` : `/${locale}`} className="group flex items-center gap-2.5 font-bold text-foreground">
          <GhostLogo className="w-7 h-7 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          <span className="text-base tracking-tight">
            Ghost<span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">Accounts</span>
          </span>
        </Link>

        {/* Desktop Nav — only for landing page (unauthenticated) */}
        {!user && (
          <nav className="hidden md:flex items-center gap-1">
            {landingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-1">
          {/* Language switcher */}
          <Link
            href={switchLocalePath}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
          >
            <Globe className="w-3.5 h-3.5" />
            {otherLocale.toUpperCase()}
          </Link>

          {/* Theme */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 dark:hidden" />
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link
                href={`/${locale}/auth/login`}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
              >
                {t("nav.login")}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                {t("nav.register")}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile: show hamburger only for unauthenticated users; authenticated use sidebar */}
        {!user ? (
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        ) : (
          /* Compact controls for authenticated mobile users */
          <div className="md:hidden flex items-center gap-1">
            <Link
              href={switchLocalePath}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              {otherLocale.toUpperCase()}
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 dark:hidden" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu — only for landing page / unauthenticated */}
      {!user && mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-1.5">
          {landingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 pt-3 mt-1 border-t border-border/50">
            <Link href={switchLocalePath} className="flex-1">
              <button className="w-full py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors">
                <Globe className="w-3.5 h-3.5" />
                {otherLocale.toUpperCase()}
              </button>
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 dark:hidden" />
            </button>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <Link href={`/${locale}/auth/login`} onClick={() => setMobileOpen(false)}>
              <button className="w-full py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("nav.login")}
              </button>
            </Link>
            <Link href={`/${locale}/auth/register`} onClick={() => setMobileOpen(false)}>
              <button className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
                {t("nav.register")}
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

