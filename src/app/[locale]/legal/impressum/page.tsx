import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("impressum_title") };
}

export default async function ImpressumPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("legal");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8">{t("impressum_title")}</h1>

      <div className="prose prose-sm max-w-none text-foreground space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">WAMOCON GmbH</h2>
          <address className="not-italic text-muted-foreground">
            <p>Mergenthalerallee 79–81</p>
            <p>65760 Eschborn</p>
            <p>Deutschland</p>
          </address>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Kontakt</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Telefon: <a href="tel:+496196583831" className="text-indigo-500 hover:underline">+49 6196 5838311</a></p>
            <p>E-Mail: <a href="mailto:info@wamocon.com" className="text-indigo-500 hover:underline">info@wamocon.com</a></p>
            <p>Projektkontakt: <a href="mailto:ghostaccounts@wamocon.com" className="text-indigo-500 hover:underline">ghostaccounts@wamocon.com</a></p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Vertretungsberechtigter Geschäftsführer
          </h2>
          <p className="text-muted-foreground">Dipl.-Ing. Waleri Moretz</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Registereintrag</h2>
          <div className="text-muted-foreground space-y-1">
            <p>Sitz der Gesellschaft: Eschborn</p>
            <p>Handelsregister: Eschborn HRB 123666</p>
            <p>Umsatzsteuer-Identifikationsnummer: DE344930486</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Angaben zum Angebot</h2>
          <p className="text-muted-foreground">
            GhostAccounts ist eine browserbasierte Software-as-a-Service-Plattform zur Verwaltung
            und Überwachung von Online-Konten sowie zum Schutz der digitalen Privatsphäre.
            Das Angebot richtet sich an Verbraucher und gewerbliche Nutzer im deutschsprachigen Raum.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Stand</h2>
          <p className="text-muted-foreground">Mai 2026</p>
        </section>
      </div>
    </div>
  );
}
