"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, List, ScanLine, Settings, Crown, Zap, Network, TrendingUp, Scroll } from "lucide-react";
import type { Profile } from "@/types/database";
import { GhostLogo } from "@/components/GhostLogo";

interface DashboardSidebarProps {
  locale: string;
  profile: Profile | null;
}

export function DashboardSidebar({ locale, profile }: DashboardSidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const nav = [
    { href: `/${locale}/dashboard`, Icon: LayoutDashboard, label: t("dashboard") },
    { href: `/${locale}/dashboard/accounts`, Icon: List, label: t("accounts") },
    { href: `/${locale}/dashboard/twin`, Icon: Network, label: t("twin") },
    { href: `/${locale}/dashboard/forecast`, Icon: TrendingUp, label: t("forecast") },
    { href: `/${locale}/dashboard/will`, Icon: Scroll, label: t("will") },
    { href: `/${locale}/dashboard/scan`, Icon: ScanLine, label: t("scan") },
    { href: `/${locale}/dashboard/settings`, Icon: Settings, label: t("settings") },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border/50 bg-card/80 backdrop-blur-xl p-4 gap-1">
      {/* Logo in sidebar */}
      <Link href={`/${locale}`} className="group flex items-center gap-2.5 px-3 py-3 mb-2">
        <GhostLogo className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
        <span className="text-sm font-bold tracking-tight text-foreground">
          Ghost<span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">Accounts</span>
        </span>
      </Link>

      <div className="h-px bg-border/50 mb-2" />

      {nav.map((item) => {
        const isActive = pathname === item.href || (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
            }`}
          >
            <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"}`} />
            {item.label}
          </Link>
        );
      })}

      {/* Plan section */}
      <div className="mt-auto pt-4">
        <div className="h-px bg-border/50 mb-4" />
        {profile?.plan === "pro" ? (
          <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-0.5">
              <Crown className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pro</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        ) : (
          <>
            <div className="px-3 py-2 mb-2">
              <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Free</span>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile?.email}</p>
            </div>
            <Link
              href={`/${locale}/dashboard/settings`}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 hover:border-indigo-500/60 hover:from-indigo-600/30 transition-all duration-200"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400">Upgrade to Pro</span>
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
