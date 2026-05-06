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
  return { title: t("datenschutz_title") };
}

export default async function DatenschutzPage({ params }: PageProps) {
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

      <h1 className="text-3xl font-bold text-foreground mb-2">{t("datenschutz_title")}</h1>
      <p className="text-sm text-muted-foreground mb-8">Stand: Mai 2026</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">1. Verantwortlicher</h2>
          <address className="not-italic">
            <p className="font-medium text-foreground">WAMOCON GmbH</p>
            <p>Mergenthalerallee 79–81, 65760 Eschborn</p>
            <p>Telefon: +49 6196 5838311</p>
            <p>E-Mail: info@wamocon.com · Projektkontakt: ghostaccounts@wamocon.com</p>
            <p>Geschäftsführer: Dipl.-Ing. Waleri Moretz</p>
            <p>HRB 123666 · USt-ID: DE344930486</p>
          </address>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">2. Grundsätze der Datenverarbeitung</h2>
          <p>
            Diese Datenschutzerklärung gilt für die Website und Webanwendung GhostAccounts
            (ghostaccounts.wamocon.com). Wir verarbeiten personenbezogene Daten nur soweit
            dies zur Bereitstellung unserer Dienste erforderlich ist.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Besonderer Hinweis zum E-Mail-Scan:</strong> Der
            E-Mail-Scan erfolgt vollständig lokal in deinem Browser. Keine E-Mail-Inhalte werden
            an unsere Server übertragen. Nur die erkannten Dienst-Namen (z.B. &ldquo;Spotify&rdquo;,
            &ldquo;LinkedIn&rdquo;) werden gespeichert.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">3. Rechtsgrundlagen</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong className="text-foreground">Einwilligung</strong> – Art. 6 Abs. 1 lit. a DSGVO</li>
            <li><strong className="text-foreground">Vertragserfüllung</strong> – Art. 6 Abs. 1 lit. b DSGVO</li>
            <li><strong className="text-foreground">Rechtliche Verpflichtung</strong> – Art. 6 Abs. 1 lit. c DSGVO</li>
            <li><strong className="text-foreground">Berechtigtes Interesse</strong> – Art. 6 Abs. 1 lit. f DSGVO</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">4. Hosting und Infrastruktur</h2>
          <p><strong className="text-foreground">Vercel Inc.:</strong> Hosting und Deployment. Technisch notwendige Verbindungsdaten. Art. 6 Abs. 1 lit. f DSGVO.</p>
          <p className="mt-2"><strong className="text-foreground">Supabase Inc.:</strong> Datenbank, Authentifizierung. Art. 6 Abs. 1 lit. b DSGVO.</p>
          <p className="mt-2"><strong className="text-foreground">Google/Microsoft:</strong> OAuth 2.0 für den E-Mail-Scan (nur mit expliziter Nutzereinwilligung). Art. 6 Abs. 1 lit. a DSGVO.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">5. Erhobene Daten</h2>
          <p>Bei der Registrierung: Name, E-Mail-Adresse, Passwort (gehasht).</p>
          <p className="mt-2">Bei der Nutzung: Erkannte Dienst-Namen (keine E-Mail-Inhalte), Scan-Zeitpunkte, Abonnementstatus.</p>
          <p className="mt-2">Automatisch: IP-Adresse, Zeitstempel, Browser-Informationen (Server-Logs).</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">6. Deine Rechte</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li><strong className="text-foreground">Löschung (Art. 17 DSGVO)</strong> – jederzeit im Dashboard unter Einstellungen</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO) – Export-Funktion im Dashboard</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
            <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">7. Cookies</h2>
          <p>
            Wir verwenden technisch notwendige Cookies für Session-Management und Authentifizierung.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">8. Datensicherheit</h2>
          <p>
            Alle Daten werden verschlüsselt übertragen (TLS). Passwörter werden gehasht gespeichert.
            Row Level Security (RLS) in der Datenbank stellt sicher, dass Nutzer nur ihre eigenen
            Daten sehen können.
          </p>
        </section>
      </div>
    </div>
  );
}
