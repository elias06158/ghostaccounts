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
  return { title: t("agb_title") };
}

export default async function AgbPage({ params }: PageProps) {
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

      <h1 className="text-3xl font-bold text-foreground mb-2">{t("agb_title")}</h1>
      <p className="text-sm text-muted-foreground mb-8">Stand: Mai 2026</p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        {[
          {
            title: "§ 1 Geltungsbereich",
            content: `Diese Allgemeinen Geschäftsbedingungen der WAMOCON GmbH, Mergenthalerallee 79–81, 65760 Eschborn, gelten für alle Verträge über die Nutzung der Software-as-a-Service-Plattform GhostAccounts. Die Plattform richtet sich an Verbraucher und gewerbliche Nutzer.`,
          },
          {
            title: "§ 2 Vertragsschluss",
            content: `Der Vertrag kommt zustande, wenn der Nutzer den Registrierungsprozess abschließt und diese AGB akzeptiert. Die Freischaltung des Zugangs durch den Anbieter gilt als Annahme.`,
          },
          {
            title: "§ 3 Leistungsbeschreibung",
            content: `GhostAccounts ist eine webbasierte SaaS-Plattform zur Entdeckung, Verwaltung und Löschung von Online-Konten. Die Plattform ermöglicht das Scannen von E-Mail-Postfächern (mit expliziter Nutzereinwilligung), die Darstellung eines Risiko-Scores und die Bereitstellung eines Lösch-Assistenten.`,
          },
          {
            title: "§ 4 Nutzungsrechte",
            content: `Der Anbieter räumt dem Nutzer für die Vertragslaufzeit ein einfaches, nicht übertragbares, nicht unterlizenzierbares Recht zur Nutzung der Plattform ein. Die Nutzung ist auf eigene Zwecke beschränkt.`,
          },
          {
            title: "§ 5 Pflichten des Nutzers",
            content: `Der Nutzer ist verpflichtet, Zugangsdaten geheim zu halten und die Plattform im Einklang mit geltendem Recht zu nutzen. Die missbräuchliche Nutzung der Plattform ist untersagt.`,
          },
          {
            title: "§ 6 Free und Pro Plan",
            content: `Der Free-Plan ist kostenlos und zeigt die Top 20 gefundenen Konten sowie den Risiko-Score. Der Pro-Plan (3,99 €/Monat) bietet vollständigen Zugriff auf alle Konten, den Lösch-Assistenten, monatliche Re-Scans und Breach-Monitoring.`,
          },
          {
            title: "§ 7 Datenschutz",
            content: `Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung des Anbieters und den Bestimmungen der DSGVO. Besonderer Hinweis: Der E-Mail-Scan erfolgt lokal im Browser des Nutzers. Keine E-Mail-Inhalte werden an Server übertragen.`,
          },
          {
            title: "§ 8 Haftung",
            content: `Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit. Im Übrigen ist die Haftung auf vertragstypische, vorhersehbare Schäden begrenzt. Die Richtigkeit und Vollständigkeit der Löschanleitungen wird nicht garantiert.`,
          },
          {
            title: "§ 9 Vertragslaufzeit und Kündigung",
            content: `Der Vertrag wird auf unbestimmte Zeit geschlossen. Der kostenlose Plan kann jederzeit beendet werden. Der Pro-Plan kann mit einer Frist von einem Monat zum Monatsende gekündigt werden.`,
          },
          {
            title: "§ 10 Schlussbestimmungen",
            content: `Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Eschborn. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.`,
          },
        ].map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold text-foreground mb-2">{section.title}</h2>
            <p>{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
