import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { GhostLogo } from "@/components/GhostLogo";

interface FooterProps {
  locale: string;
}

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-xl mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href={`/${locale}`} className="group flex items-center gap-2.5 font-bold text-foreground mb-3">
              <GhostLogo className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span className="text-sm">Ghost<span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">Accounts</span></span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("tagline")}</p>
            <p className="text-xs text-muted-foreground/60 mt-4">{t("made_by")}</p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{t("product")}</h3>
            <ul className="space-y-2.5">
              {[
                { href: `/${locale}#features`, label: t("features") },
                { href: `/${locale}#pricing`, label: t("pricing") },
                { href: `/${locale}/dashboard/scan`, label: t("scan") },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{t("legal")}</h3>
            <ul className="space-y-2.5">
              {[
                { href: `/${locale}/legal/impressum`, label: t("impressum") },
                { href: `/${locale}/legal/datenschutz`, label: t("datenschutz") },
                { href: `/${locale}/legal/agb`, label: t("agb") },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{t("company")}</h3>
            <address className="not-italic text-xs text-muted-foreground leading-relaxed space-y-1">
              <p className="font-semibold text-foreground text-sm">WAMOCON GmbH</p>
              <p>Mergenthalerallee 79–81</p>
              <p>65760 Eschborn, Deutschland</p>
              <p className="pt-2">
                <a href="tel:+496196583831" className="hover:text-indigo-400 transition-colors">+49 6196 5838311</a>
              </p>
              <p>
                <a href="mailto:info@wamocon.com" className="hover:text-indigo-400 transition-colors">info@wamocon.com</a>
              </p>
              <p className="pt-2 text-muted-foreground/50 text-[11px]">HRB 123666 · USt-ID: DE344930486</p>
            </address>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} WAMOCON GmbH. {t("rights")}
          </p>
          <div className="flex items-center gap-5">
            {[
              { href: `/${locale}/legal/impressum`, label: t("impressum") },
              { href: `/${locale}/legal/datenschutz`, label: t("datenschutz") },
              { href: `/${locale}/legal/agb`, label: t("agb") },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="text-xs text-muted-foreground/60 hover:text-indigo-400 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
