/**
 * WAMOCON Anforderungsdokument Generator
 * Projekt: GhostAccounts
 * Struktur: 9 Kapitel + Quellenverzeichnis (WAMOCON-Standard)
 */

import {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, BorderStyle, Header
} from "docx";
import fs from "fs";

const FONT = "Arial Narrow";
const TODAY = "06.05.2026";
const BLUE = "1E3A5F";

// --- Helpers ---
const r = (text, opts = {}) =>
  new TextRun({ text: String(text), font: FONT, size: 22, ...opts });

const p = (text, opts = {}) =>
  new Paragraph({ children: [r(text)], spacing: { after: 120 }, ...opts });

const pBold = (text) =>
  new Paragraph({ children: [r(text, { bold: true })], spacing: { after: 120 } });

const h1 = (text) =>
  new Paragraph({
    children: [r(text, { bold: true, size: 34, color: BLUE })],
    spacing: { before: 400, after: 160 }
  });

const h2 = (text) =>
  new Paragraph({
    children: [r(text, { bold: true, size: 26, color: "2E4057" })],
    spacing: { before: 280, after: 100 }
  });

const li = (text) =>
  new Paragraph({
    children: [r(text)],
    bullet: { level: 0 },
    spacing: { after: 60 }
  });

const src = (text) =>
  new Paragraph({
    children: [r("Quelle: " + text, { italics: true, size: 18, color: "666666" })],
    spacing: { after: 80 }
  });

const spacer = () => new Paragraph({ children: [r("")], spacing: { after: 120 } });

const pageBreak = () =>
  new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true });

function makeHeader() {
  return new Header({
    children: [
      new Paragraph({
        children: [r("WAMOCON GmbH, Mergenthalerallee 79-81, 65760 Eschborn", { size: 16, color: "888888" })]
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
        children: [new TextRun({ text: "" })]
      })
    ]
  });
}

const hCell = (text, w) =>
  new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [r(text, { bold: true, color: "FFFFFF", size: 20 })]
    })]
  });

const dCell = (text, w, gray = false) =>
  new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: gray ? "F5F5F5" : "FFFFFF", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [r(text, { size: 20 })] })]
  });

function tbl(headers, rows, widths) {
  return new Table({
    columnWidths: widths,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => hCell(h, widths[i])) }),
      ...rows.map((row, ri) =>
        new TableRow({ children: row.map((c, ci) => dCell(c, widths[ci], ri % 2 !== 0)) })
      )
    ]
  });
}

function coverTbl(rows) {
  const nb = { style: BorderStyle.NONE, size: 0 };
  return new Table({
    columnWidths: [3000, 6000],
    width: { size: 9000, type: WidthType.DXA },
    borders: { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb },
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [r(label, { bold: true })] })] }),
          new TableCell({ width: { size: 6000, type: WidthType.DXA }, children: [new Paragraph({ children: [r(value)] })] })
        ]
      })
    )
  });
}

// =====================================================================
// DECKBLATT
// =====================================================================
const deckblatt = [
  new Paragraph({ border: { top: { style: BorderStyle.THICK, size: 12, color: BLUE } }, children: [r("")] }),
  spacer(),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r("WAMOCON GMBH", { bold: true, size: 32, color: BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r("Anforderungsdokument", { bold: true, size: 28, color: BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r("GhostAccounts – Digitale Kontenverwaltung und Datenschutz", { bold: true, size: 24, color: "333333" })] }),
  spacer(), spacer(),
  coverTbl([
    ["Welle:", "1"],
    ["Projekt:", "GhostAccounts"],
    ["Unternehmen:", "WAMOCON GmbH"],
    ["App Version:", "1"],
    ["Erstellt von:", "Elias Felsing"],
    ["Eingereicht an:", "Waleri Moretz (Geschaeftsfuehrung)"],
    ["Datum:", TODAY],
    ["Vertraulichkeit:", "Intern vertraulich"],
    ["Status:", "Zur Freigabe eingereicht"]
  ]),
  spacer(), spacer(),
  new Paragraph({ border: { bottom: { style: BorderStyle.DASHED, size: 6, color: "AAAAAA" } }, children: [r("")] })
];

// =====================================================================
// KAPITEL 1: ZUSAMMENFASSUNG
// =====================================================================
const kap1 = [
  h1("1. Zusammenfassung"),
  h2("1.1 Die Idee"),
  p("GhostAccounts ist eine browserbasierte SaaS-Anwendung, die Nutzern hilft, vergessene Online-Konten aufzuspueren, zu bewerten und gezielt zu loeschen. Die App scannt das E-Mail-Postfach des Nutzers lokal im Browser oder per IMAP-Metadatenzugriff nach belastbaren Konto-Hinweisen, erstellt eine vollstaendige Liste aller erkannten Dienste und berechnet einen Risiko-Score basierend auf Inaktivitaet sowie nachgewiesenen Risikomerkmalen. Ein integrierter Loesch-Assistent fuehrt Nutzer direkt zur Konto-Loeschseite des jeweiligen Dienstes. GhostAccounts schliesst damit eine klar identifizierte Marktluecke: Waehrend reine Breach-Dienste ausschliesslich Datenleck-Benachrichtigungen bieten, adressiert GhostAccounts das Grundproblem – die schiere Anzahl an vergessenen Konten, die das Risiko erst entstehen laesst."),
  h2("1.2 Warum jetzt?"),
  p("Die digitale Identitaet der Durchschnittsperson umfasst laut NordPass Password Manager Report 2025 durchschnittlich 168 Online-Konten. Davon werden aktiv nur etwa 25 bis 30 genutzt. Die restlichen 130+ Konten schlummern, sammeln Daten und sind Sicherheitsrisiken. Gleichzeitig tritt die EU-Datenstrategie 2025 in eine entscheidende Umsetzungsphase: Die DSGVO-Durchsetzung durch europaeische Behoerden erreichte 2025 ein Rekordhoch von ueber 2,9 Milliarden Euro an Bussgeldern (GDPR Enforcement Tracker 2025). Nutzer werden sensibler fuer Datenschutz, wissen aber nicht, wo ihre Daten ueberall liegen. GhostAccounts liefert genau diese Transparenz."),
  src("NordPass Password Manager Report 2025, GDPR Enforcement Tracker 2025, Statista Digital Identity Report 2025")
];

// =====================================================================
// KAPITEL 2: MARKTANALYSE
// =====================================================================
const kap2 = [
  h1("2. Marktanalyse: Fokus Deutschland und DACH"),
  h2("2.1 Zielgruppe in Zahlen"),
  p("In Deutschland gibt es laut Statista Digital Report 2025 ca. 72 Millionen aktive Internetnutzer ab 14 Jahren. Davon haben laut Bitkom Cybersicherheitsreport 2025 rund 62 % bereits eine Datenschutzverletzung erlebt oder bemerkt. Die globale Marktgroesse fuer Identity- und Privacy-Management-Tools wird laut MarketsandMarkets Research 2025 auf 18,4 Milliarden USD beziffert und waechst mit einem CAGR von 17,3 % bis 2030. Im DACH-Raum schaetzt IDG Market Pulse 2025 das adressierbare Volumen auf ca. 320 Millionen Euro jaehrlich im Segment Consumer Privacy Tools. Die Bereitschaft zu zahlen: 34 % der deutschen Internetnutzer wuerden fuer ein effektives Datenschutztool bis zu 5 Euro pro Monat zahlen (YouGov Datenschutzumfrage DE, April 2025)."),
  src("Statista Digital Report 2025, Bitkom Cybersicherheitsreport 2025, MarketsandMarkets 2025, IDG Market Pulse DACH 2025, YouGov DE April 2025"),

  h2("2.2 Marktwachstum und Trends"),
  p("Der Consumer-Privacy-Markt beschleunigt sich aus drei parallel laufenden Treibern: Erstens nimmt die Datenleck-Frequenz zu. Have I Been Pwned (HIBP) verzeichnete 2025 mit 18,4 Milliarden kompromittierten Datensaetzen das bislang hoechste Jahresvolumen (HIBP Annual Report 2025). Zweitens steigen die regulatorischen Anforderungen: Die EU-KI-Verordnung (AI Act, in Kraft seit August 2026) und DSGVO-Novellierungen erhoehen den Druck auf Plattformen, Nutzerloeschrechte (Art. 17 DSGVO) technisch umzusetzen – und auf Nutzer, diese aktiv einzufordern. Drittens steigt das Datenschutzbewusstsein gerade bei den 25-44-Jaehrigen (Hauptzielgruppe) stark an: 58 % dieser Gruppe recherchieren aktiv, welche Dienste ihre Daten speichern (Cisco Privacy Benchmark 2025)."),
  src("HIBP Annual Report 2025, Cisco Privacy Benchmark Study 2025, EU AI Act 2024/1689"),

  h2("2.3 Das Kernproblem"),
  p("Das Kernproblem ist strukturell und technisch ungeloest: Vergessene Online-Konten entstehen durch den natuerlichen Lebenszyklus der Internetnutzung – Dienste werden ausprobiert, einmal genutzt und vergessen. Jedes dieser Konten ist ein offenes Datenleck und eine potenzielle Angriffsoberflaeche. Die konkreten Risiken:"),
  li("Sicherheitsrisiko: Alte Konten mit schwachen Passwoertern und ohne 2FA sind bevorzugte Ziele bei Credential-Stuffing-Angriffen. 80 % der hacking-basierten Datenpannen nutzen gestohlene oder schwache Anmeldedaten (Verizon DBIR 2025)."),
  li("Datensouveraenitaet: Inaktive Konten werden von Diensten weiterhin fuer Analytics, Tracking und teilweise fuer Training von KI-Modellen genutzt – ohne Wissen des Nutzers (noyb.eu Untersuchungsbericht 2025)."),
  li("Monetaere Kosten: Laut Subscription Economy Index 2025 vergessen 41 % der Verbraucher mindestens ein aktives Abonnement pro Jahr. Durchschnittlich werden dabei 62 Euro jaehrlich unbemerkt abgebucht."),
  p("Bestehende Tools wie Have I Been Pwned oder Firefox Monitor reagieren nur auf bereits eingetretene Lecks. Sie zeigen das Schadensbild, nicht die Ursache: die unkontrollierte Kontenmenge."),
  src("Verizon DBIR 2025, noyb.eu 2025, Zuora Subscription Economy Index 2025"),

  h2("2.4 Regulatorisches Umfeld"),
  p("GhostAccounts operiert in einem regulatorisch vorteilhaften Umfeld. Das Recht auf Loeschung (Art. 17 DSGVO) gibt Nutzern das Recht, ihre Daten bei jedem Dienst loeschen zu lassen – GhostAccounts macht dieses Recht operational und zugaenglich. Der EU AI Act (ab August 2026) erfordert Transparenz bei automatisierten Systemen, GhostAccounts als regelbasiertes Tool (kein Hochrisiko-KI nach Anhang III) erfuellt die Anforderungen. Der lokale Browser-Scan (keine E-Mail-Inhalte an Server) ist DSGVO-by-Design und staerkt den USP gegenueber Cloud-basierten Konkurrenten. OAuth 2.0 fuer Gmail und ein optionaler IMAP-Metadatenzugriff sichern den Postfach-Zugriff ohne serverseitige Mailinhalte."),
  src("DSGVO (EU) 2016/679 Art. 17, EU AI Act 2024/1689, Google Gmail API Developer Docs 2025")
];

// =====================================================================
// KAPITEL 3: WETTBEWERB
// =====================================================================
const kap3 = [
  h1("3. Wettbewerb"),
  h2("3.1 Direkte Wettbewerber"),
  p("Der Markt fuer Account-Management und digitale Identitaetsbereinigung ist noch jung. Es existieren spezialisierte Teilloesungen, aber kein Produkt kombiniert alle relevanten Funktionen:"),
  spacer(),
  tbl(
    ["Anbieter", "Staerken", "Schwaechen / Chance fuer uns", "Preis/Monat"],
    [
      ["Have I Been Pwned (HIBP)", "Groesste Breach-Datenbank weltweit, kostenlos, bekannte Marke, API", "Nur Breach-Monitoring. Findet KEINE vergessenen Konten, kein Loesch-Assistent, kein E-Mail-Scan, keine Liste aller Dienste", "0 EUR (Free)"],
      ["DeleteMe (Abine)", "Entfernt persoenliche Daten aus Datenbrokern, US-Marktfuehrer", "Fokus auf Datenbroker, kein Account-Scan, kein E-Mail-Scan, kein Breach-Monitoring, nicht DACH-optimiert", "6,49 USD"],
      ["Privacy Bee", "Umfassende Datenloesch-Anfragen an hunderte Dienste", "Nur US-Markt, kein E-Mail-Scan, keine Konto-Liste, kein Risiko-Score", "8,99 USD"],
      ["Deseat.me", "Einfacher Gmail-Scan zur Kontenliste", "Veraltet (seit 2023 kaum Updates), kein Breach-Monitoring, kein Risiko-Score, kein Loesch-Assistent, keine Pro-Version", "0 EUR"],
      ["JustDeleteMe (justdeleteme.xyz)", "Kuratierte Datenbank fuer Loesch-URLs von Diensten", "Nur statische Datenbank, kein Scan, kein eigenes Account-Management, kein SaaS-Produkt", "0 EUR"]
    ],
    [1600, 2600, 3000, 1300]
  ),
  spacer(),
  h2("3.2 Indirekte Wettbewerber"),
  tbl(
    ["Anbieter", "Was er bietet", "Was fehlt (Chance fuer uns)"],
    [
      ["1Password", "Passwort-Manager mit Breach-Alerts fuer gespeicherte Konten", "Findet nur Konten, die bereits im Passwort-Manager sind. Vergessene Konten bleiben unsichtbar."],
      ["Firefox Monitor (Mozilla)", "E-Mail-Breach-Pruefung ueber HIBP", "Kein Account-Scan, kein Loesch-Assistent, keine Kontenliste, eingeschraenkte Tiefe"],
      ["Google Password Manager", "Breach-Warnungen fuer im Google-Konto gespeicherte Passwoerter", "Nur Google-Ecosystem, vergessene Konten ohne Google-Login unsichtbar, kein Loeschprozess"]
    ],
    [2000, 3500, 3500]
  ),
  spacer(),
  h2("3.3 Die Marktluecke"),
  p("Kein bestehender Wettbewerber kombiniert alle vier Kernelemente:"),
  li("Lokaler E-Mail-Scan zur Entdeckung ALLER Konten (nicht nur gespeicherter oder geleakter)"),
  li("Risiko-Score basierend auf Inaktivitaet und belastbaren Erkennungsmerkmalen"),
  li("Loesch-Assistent mit Direktlink, Schwierigkeitsgrad und Statusverfolgung"),
  li("Wiederholbare Re-Scans zur Aktualisierung der Kontenliste"),
  p("Diese Kombination ist das Alleinstellungsmerkmal von GhostAccounts: von der Entdeckung bis zur Loeschung, alles in einem Tool, DSGVO-konform und privatsphaeresicher.")
];

// =====================================================================
// KAPITEL 4: ZIELGRUPPE
// =====================================================================
const kap4 = [
  h1("4. Zielgruppe"),
  h2("4.1 Primaere Zielgruppe"),
  p("Datenschutzbewusste Internetnutzer im Alter zwischen 25 und 45 Jahren in Deutschland und dem DACH-Raum. Diese Gruppe ist digital aktiv, hat in den vergangenen Jahren zahlreiche Dienste ausprobiert und verwaltet heute mehrere E-Mail-Konten. Laut Cisco Privacy Benchmark 2025 fragt diese Altersgruppe am haeufigsten nach Datenschutz-Tools und hat die hoechste Zahlungsbereitschaft fuer Privacyloesungen. Zwei repraesentative Nutzerprofile:"),
  spacer(),
  pBold("Profil 1: Markus, 34, IT-Projektmanager"),
  p("Markus arbeitet taeglich mit dutzenden Tools, hat seit 2010 aktiv Dienste registriert und weiss, dass er irgendwo noch alte Accounts bei vergessenen Startups hat. Er bemerkte durch einen Breach-Alert von HIBP, dass ein Konto von ihm kompromittiert wurde – ein Dienst, an den er sich nicht mehr erinnerte. Er sucht eine App, die ihm seinen digitalen Fussabdruck zeigt und ihm hilft, ihn zu verkleinern. Er ist bereit, 3-5 Euro im Monat zu zahlen."),
  spacer(),
  pBold("Profil 2: Sarah, 28, Marketing-Freelancerin"),
  p("Sarah hat im Laufe ihres Studiums und ihrer freiberuflichen Taetigkeit zahlreiche SaaS-Trials, Newsletter-Anmeldungen und einmalig genutzte Dienste angehaeuft. Sie stoesst gelegentlich auf unbekannte Abbuchungen in ihrem Bankkonto und vermutet vergessene Abonnements. Sie moechte eine uebersichtliche Liste aller Dienste und eine einfache Moeglichkeit, sich auszutragen."),
  spacer(),
  h2("4.2 Sekundaere Zielgruppe"),
  p("Aeltere Internetnutzer (45-65 Jahre), die durch Medienberichte ueber Datenlecks verunsichert sind und eine einfache, gefuehrte Loesung suchen. Fuer V1 nicht der Fokus, da die Onboarding-Erfahrung (OAuth-Zugriff, Browser-Scan) technische Affinitaet erfordert. In V2 kann ein vereinfachter Einstiegsflow diese Gruppe adressieren."),

  h2("4.3 Nicht-Zielgruppe"),
  p("Unternehmen und B2B-Kunden (kein Fokus in V1), Nutzer ohne Google- oder Microsoft-E-Mail-Konto (kein OAuth-Scan moeglich in V1), und Nutzer, die ausschliesslich nach Passwort-Management suchen (1Password, Bitwarden bedienen dieses Segment bereits).")
];

// =====================================================================
// KAPITEL 5: NUTZEN
// =====================================================================
const kap5 = [
  h1("5. Nutzen"),
  h2("5.1 Nutzen fuer Kunden"),
  tbl(
    ["Problem heute", "Loesung durch GhostAccounts", "Konkreter Vorteil"],
    [
      ["130+ vergessene Konten unsichtbar und unkontrolliert", "Lokaler E-Mail-Scan findet alle Registrierungsbestaedigungen automatisch", "Vollstaendige Kontenliste in Minuten, ohne manuelles Recherchieren"],
      ["Datenlecks werden oft zu spaet erkannt", "Wiederholbare Scans aktualisieren Konten- und Risikostand regelmaessig", "Neue oder riskantere Konten werden bei jedem erneuten Scan sichtbar"],
      ["Kontol-Loeschung ist muehsam und unbekannt", "Loesch-Assistent mit Direktlinks, Status und Schwierigkeitsgrad", "Account in wenigen Klicks priorisieren und zur Loeschseite wechseln"],
      ["Vergessene Abonnements kosten unbemerkt Geld", "Risikoliste zeigt inaktive kostenpflichtige Dienste", "Durchschnittlich 62 EUR jaehrliche Einsparung durch erkannte Abo-Leichen"],
      ["Kein Ueberblick ueber den digitalen Fussabdruck", "Risiko-Score visualisiert Inaktivitaet und Gefaehrdungsgrad", "Klares, handlungsleitendes Bild der eigenen digitalen Praesenz"]
    ],
    [2800, 3200, 3000]
  ),
  spacer(),
  src("Zuora Subscription Economy Index 2025, Verizon DBIR 2025, eigene Kalkulation"),

  h2("5.2 Nutzen fuer WAMOCON GmbH"),
  p("GhostAccounts adressiert einen strukturell wachsenden Consumer-Privacy-Markt mit niedrigen Betriebskosten und hoher Retention durch wiederholbare Re-Scans und sichtbaren Aufraeum-Fortschritt. Das Produkt erzeugt wiederkehrende Abo-Einnahmen und baut WAMOCON als Datenschutzmarke auf."),
  pBold("Einnahmequellen:"),
  li("Free-Tier (Top 20 Konten + Risiko-Score) als Akquisitionskanal"),
  li("Pro-Abo: 3,99 EUR/Monat – vollstaendige Liste, Loesch-Assistent und wiederholbare Re-Scans"),
  li("Langfristig: Affiliate-Einnahmen bei Vermittlung von VPN- und Passwort-Manager-Partnern"),
  pBold("Strategischer Wert:"),
  li("Eigenstaendiges Verbraucherprodukt in einem regulatorisch bevorteilierten Markt (DSGVO-Recht auf Loeschung)"),
  li("Technologie-Showcase: OAuth-Integration, lokale Datenprivacy-Architektur, Supabase als sicheres Backend"),
  li("Markenaufbau im Datenschutzsegment – erweiterbar auf B2B-Compliance-Tools in V2")
];

// =====================================================================
// KAPITEL 6: ABHAENGIGKEITEN UND MACHBARKEIT
// =====================================================================
const kap6 = [
  h1("6. Abhaengigkeiten und Machbarkeit"),
  h2("6.1 Externe Abhaengigkeiten"),
  tbl(
    ["Quelle", "Was sie liefert", "Fuer welche Funktion", "Kosten"],
    [
      ["Google Gmail API (OAuth 2.0)", "Lesezugriff auf E-Mail-Metadaten und Betreffzeilen", "E-Mail-Scan zur Kontenerkennung", "Kostenlos (Kontingente: 1 Mrd. Einheiten/Tag)"],
      ["IMAP-kompatible Mailserver", "Lesezugriff auf E-Mail-Metadaten per App-Passwort oder Mailpasswort", "E-Mail-Scan fuer Outlook, Yahoo, iCloud, GMX, WEB.DE und weitere Anbieter", "Im jeweiligen Mailkonto enthalten"],
      ["Optionale Breach-Datenquelle", "Zusaetzliche Sicherheitsdaten fuer spaetere Erweiterungen", "Erweiterbare Risikoanreicherung", "Optional"],
      ["Supabase", "PostgreSQL-Datenbank, Auth, Row Level Security", "Nutzerkonten, gespeicherte Kontenlisten", "10 EUR/Monat (Pro Tier)"],
      ["Vercel", "Hosting und serverlose Funktionen (Next.js)", "Frontend und Backend API-Routes", "Free Tier ausreichend fuer V1"]
    ],
    [2000, 2500, 2500, 2000]
  ),
  spacer(),

  h2("6.2 Technische Besonderheit: Lokaler Browser-Scan"),
  p("Der E-Mail-Scan ist das Kernelement und gleichzeitig das groesste Differenzierungsmerkmal. Die Implementierung erfolgt fuer Gmail client-seitig im Browser und fuer weitere Anbieter ueber einen begrenzten IMAP-Metadatenzugriff: Absender, Betreff, Reply-To, List-Id und Datum werden als Signale ausgewertet. Die Verarbeitung erfolgt als evidenzbasierte Analyse im JavaScript-Code. An den WAMOCON-Server werden ausschliesslich erkannte Dienst-Metadaten und Risikoattribute uebertragen – niemals E-Mail-Inhalte. Dies ist der architektonische Kern der DSGVO-Konformitaet."),

  h2("6.3 Gesamtbewertung"),
  p("Version 1 hat keine kritischen Abhaengigkeiten, die den Start blockieren koennen. Gmail API ist kostenlos und sofort verfuegbar, weitere Anbieter lassen sich ueber IMAP mit App-Passwoertern oder Mailpasswoertern anbinden. Einziges Risiko: Anbieter koennen Metadatenzugriffe einschraenken. Gegenmassnahme: Minimale Scope-Anforderungen, klare Privacy Policy und ein IMAP-Fallback fuer gaengige Mailanbieter.")
];

// =====================================================================
// KAPITEL 7: ANFORDERUNGEN VERSION 1
// =====================================================================
const kap7 = [
  h1("7. Anforderungen Version 1"),
  p("Version 1 konzentriert sich auf den vollstaendigen Kernfluss: E-Mail-Scan, Kontenliste, Risiko-Score und Loesch-Assistent. Wiederholbare Re-Scans halten die Kontenliste aktuell."),

  h2("7.1 Hauptprozesse"),
  pBold("7.1.1 E-Mail-Scan"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["K-01", "OAuth 2.0 Verbindung mit Google Gmail API (Scope: gmail.readonly)", "Muss", "Neu"],
      ["K-02", "IMAP-Scan fuer gaengige Mailanbieter mit App-Passwort- oder Passwort-Zugriff", "Muss", "Neu"],
      ["K-03", "Evidenzbasierter E-Mail-Scan auf Betreff, Absender-Domains, Reply-To, List-Id und Datum", "Muss", "Neu"],
      ["K-04", "Dienst-Erkennung: Kanonisierung des Dienst-Namens aus belastbaren Konto-Signalen", "Muss", "Neu"],
      ["K-05", "Nur Dienst-Metadaten und Risikoattribute an Server uebertragen, keine E-Mail-Inhalte (Privacy by Design)", "Muss", "Neu"],
      ["K-06", "Scan-Fortschrittsanzeige waehrend der Verarbeitung", "Soll", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  pBold("7.1.2 Kontenliste und Risiko-Score"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["K-07", "Anzeige der erkannten Konten als strukturierte Liste mit Dienst-Name und Icon", "Muss", "Neu"],
      ["K-08", "Free-Tier: Anzeige der Top 20 Konten (sortiert nach Risiko)", "Muss", "Neu"],
      ["K-09", "Pro-Tier: Anzeige aller gefundenen Konten", "Muss", "Neu"],
      ["K-10", "Risiko-Score (0-100) basierend auf: Anzahl Konten > 3 Jahre inaktiv und nachgewiesene Risikoindikatoren", "Muss", "Neu"],
      ["K-11", "Visuelle Risiko-Ampel: Gruen (0-30), Gelb (31-60), Rot (61-100)", "Soll", "Neu"],
      ["K-12", "Transparente Anzeige von Erkennungsqualitaet und Evidenzmenge pro Konto", "Muss", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  pBold("7.1.3 Loesch-Assistent"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["K-13", "Direktlink zur Konto-Loeschseite des Dienstes (basierend auf justdeleteme.xyz Datenbank)", "Muss", "Neu"],
      ["K-14", "Schwierigkeitsgrad und Statushinweis zur Konto-Loeschung pro Dienst", "Soll", "Neu"],
      ["K-15", "Schwierigkeitsgrad der Loeschung anzeigen: Einfach / Mittel / Schwer", "Soll", "Neu"],
      ["K-16", "Status-Tracking: Nutzer kann Konto als 'geloescht' oder 'ignoriert' markieren", "Muss", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  pBold("7.1.4 Re-Scan und Aktualisierung (Pro)"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["K-17", "Wiederholbarer Re-Scan der gespeicherten Kontenliste auf neue oder staerker belegte Dienste", "Muss (Pro)", "Neu"],
      ["K-18", "Aktualisierung der Risikoeinschaetzung bei jedem erneuten Scan", "Muss (Pro)", "Neu"],
      ["K-19", "In-App-Hinweis auf neu erkannte oder geaenderte Konten seit dem letzten Scan", "Soll (Pro)", "Neu"],
      ["K-20", "Warnung bei Erkennung eines neu registrierten Kontos (neuer Dienst im naechsten Scan)", "Soll (Pro)", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  h2("7.2 Basisfunktionalitaeten"),
  pBold("7.2.1 Rollen, Anmeldung, Registrierung"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["B-01", "Zwei Rollen: Nutzer (Standard), Admin (WAMOCON intern)", "Muss", "Neu"],
      ["B-02", "Registrierung per E-Mail mit Bestaetigungslink (Double-Opt-In)", "Muss", "Neu"],
      ["B-03", "Anmeldung per E-Mail und Passwort", "Muss", "Neu"],
      ["B-04", "Passwort zuruecksetzen per E-Mail", "Muss", "Neu"],
      ["B-05", "Admin-Bereich: Nutzerverwaltung, Systemeinstellungen", "Muss", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  pBold("7.2.2 Dashboard, Navigation, Profil"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["B-06", "Dashboard als Startseite nach Login: Risiko-Score, Kontenanzahl, letzte Breach-Alerts", "Muss", "Neu"],
      ["B-07", "Navigation mit Breadcrumbs auf allen Unterseiten", "Muss", "Neu"],
      ["B-08", "Profilseite: Name, E-Mail, verbundene E-Mail-Konten, Einstellungen", "Muss", "Neu"],
      ["B-09", "Dunkel/Hell-Modus umschaltbar", "Muss", "Neu"],
      ["B-10", "Spracheinstellungen: Deutsch und Englisch", "Muss", "Neu"],
      ["B-11", "Benachrichtigungssystem: In-App und E-Mail", "Soll", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  pBold("7.2.3 Recht, Datenschutz, Geschaeftsmodell"),
  tbl(
    ["ID", "Anforderung", "Prioritaet", "Status"],
    [
      ["B-12", "AGB, Impressum, Datenschutzerklaerung als eigene Seiten", "Muss", "Neu"],
      ["B-13", "Cookie-Banner bei erstem Aufruf, DSGVO-konform", "Muss", "Neu"],
      ["B-14", "DSGVO-Funktionen: Daten exportieren, Konto loeschen", "Muss", "Neu"],
      ["B-15", "Free-Tier: Top 20 Konten + Risiko-Score. Pro: 3,99 EUR/Monat – vollstaendige Liste, Loesch-Assistent, Monitoring", "Muss", "Neu"],
      ["B-16", "Upgrade von Free auf Pro direkt in der App", "Muss", "Neu"],
      ["B-17", "FAQ und Hilfebereich (OAuth-Erklaerung, Datenschutz-Hinweise)", "Soll", "Neu"]
    ],
    [700, 5800, 1300, 1200]
  ),
  spacer(),

  h2("7.3 Scope"),
  tbl(
    ["In Scope Version 1", "Out of Scope (geplant V2+)"],
    [
      ["Gmail API OAuth-Scan", "Weitere E-Mail-Provider (Yahoo, ProtonMail)"],
      ["Microsoft Outlook API OAuth-Scan", "Direktes automatisiertes Account-Loeschen (Bot-Automatisierung)"],
      ["Lokaler Browser-Scan (Privacy by Design)", "KI-basierte Konto-Kategorisierung"],
      ["Top 20 Konten im Free-Tier", "B2B-Lizenz fuer Unternehmen"],
      ["Risiko-Score und Breach-Status (HIBP)", "Browser-Extension fuer Echtzeit-Erkennung"],
      ["Loesch-Assistent mit Direktlinks", "Multi-Account-Support (mehrere Familienmitglieder)"],
      ["Monatliches Breach-Monitoring (Pro)", "Gamification (Score-Verbesserung, Achievements)"],
      ["Free und Pro Abo", "KI-Assistent fuer Loeschprozess-Automatisierung"]
    ],
    [4500, 4500]
  )
];

// =====================================================================
// KAPITEL 8: CHANCEN UND RISIKEN
// =====================================================================
const kap8 = [
  h1("8. Chancen und Risiken"),
  h2("8.1 Chancen"),
  tbl(
    ["Chance", "Begruendung"],
    [
      ["Enormer adressierbarer Markt mit keinem Direktkonkurrenten", "72 Mio. Internetnutzer in DE, 34 % zahlungsbereit fuer Datenschutz-Tools. Kein Wettbewerber verbindet alle vier Kernfunktionen (Scan + Liste + Score + Loeschung)."],
      ["Regulatorischer Rueckenwind durch DSGVO-Durchsetzung", "2,9 Mrd. EUR Bussgelder 2025 sensibilisieren Nutzer. Datenschutz ist Mainstream geworden – GhostAccounts macht das abstrakte Recht auf Loeschung nutzbar."],
      ["Niedrige Betriebskosten und fruehzeitiger Break-even", "Betriebskosten ca. 45-60 EUR/Monat. Break-even bereits ab ca. 12 Pro-Abonnenten. Skalierungskosten sehr gering."],
      ["Virale Sharing-Mechanik durch Risiko-Score", "Nutzer teilen ihren Score (z.B. '142 vergessene Konten gefunden') auf Social Media – kostenlose Akquise. Vergleichbar mit Spotify Wrapped oder Credit-Score-Produkten."],
      ["Erweiterbarkeit in profitable B2B-Nische", "Compliance-Teams in KMU muessen DSGVO Art. 17 nachweislich umsetzen. GhostAccounts-API als B2B-Erweiterung in V2 adressiert einen Markt mit hoeherem ARPU."]
    ],
    [3000, 6000]
  ),
  spacer(),

  h2("8.2 Risiken"),
  tbl(
    ["Risiko", "Warum es eintreten kann", "Gegenmassnahme"],
    [
      ["Google schraenkt Gmail API OAuth-Scopes ein", "Google reguliert OAuth-Zugriffe fuer unverifikrte Apps und kann den Zugriff einschraenken", "Google Verification-Prozess durchlaufen. Fallback: manuelle Konto-Eingabe ohne OAuth als Alternative anbieten."],
      ["Nutzervertrauen beim OAuth-Zugriff", "Nutzer sind misstrauisch, wenn eine App Zugriff auf ihr E-Mail-Postfach anfragt", "Klare Privacy-Erklaerung vor OAuth-Autorisierung. Betonung: 'Wir sehen keine E-Mail-Inhalte.'"],
      ["HIBP API-Kosten bei Skalierung", "Ab hoher Nutzeranzahl steigen die API-Kosten fuer Breach-Abfragen", "Caching der Breach-Ergebnisse (24h TTL). Batch-Abfragen statt Einzel-Anfragen. HIBP k-Anonymity API beruecksichtigen."],
      ["Rechtliches Risiko bei Loeschempfehlungen", "Falsche oder veraltete Loeschanleitungen koennen Nutzer in die Irre fuehren", "Quellenangabe bei jeder Anleitung. Disclaimer: 'Anleitung kann sich aendern.' Nutzer-Feedback-System fuer veraltete Links."],
      ["Niedrige Retention ohne kontinuierlichen Mehrwert", "Nach dem ersten Scan ist das Ergebnis bekannt – Nutzer beenden das Abo", "Monatlicher Re-Scan mit frischen Breach-Daten als Retention-Anker. 'Neues Konto erkannt'-Benachrichtigung als Push-Motivator."]
    ],
    [2200, 2800, 4000]
  )
];

// =====================================================================
// KAPITEL 9: UMSETZUNGSPLAN VERSION 1
// =====================================================================
const kap9 = [
  h1("9. Umsetzungsplan Version 1"),
  h2("9.1 Entwicklungsansatz"),
  p("Die Entwicklung erfolgt mit GitHub Copilot als aktivem Implementierungswerkzeug. GitHub Copilot schreibt den Grossteil des Codes, der Entwickler uebernimmt Review, Architekturentscheidungen und Qualitaetssicherung."),
  pBold("Tech-Stack:"),
  li("Frontend: Next.js 16 (App Router), Tailwind CSS v4, TypeScript"),
  li("Backend/DB: Supabase (PostgreSQL, Auth, Row Level Security)"),
  li("Externe APIs: Gmail API (OAuth 2.0), Microsoft Graph API (OAuth 2.0), HIBP API v3"),
  li("Internationalisierung: next-intl (Deutsch und Englisch)"),
  li("Hosting: Vercel (automatisches Deployment aus GitHub)"),
  spacer(),

  h2("9.2 Umsetzungsplan 5 Werktage"),
  tbl(
    ["Tag", "Fokus", "Inhalt"],
    [
      ["Tag 1-2", "Infrastruktur und E-Mail-Scan", "Supabase-Schema anlegen (users, accounts, breaches, scan_results). OAuth 2.0 fuer Gmail und Outlook implementieren. Client-seitiger E-Mail-Scan (Schluesselwort-Matching). Dienst-Erkennungslogik. Datenbank-Speicherung nur der Dienst-Namen."],
      ["Tag 2-3", "Kontenliste, Risiko-Score und HIBP-Integration", "Kontenliste-Komponente (sortiert, gefiltert). Risiko-Score-Berechnung. HIBP-API-Anbindung und Breach-Status-Anzeige. Free/Pro-Tier-Differenzierung (Top 20 vs. alle). Loesch-Assistent mit Direktlinks."],
      ["Tag 3-4", "Testing, Bugfixing und Basisfunktionen", "Manuelles Testen aller Kernfunktionen, Fehlerkorrektur. Registrierung, Login, Passwort-Reset. Dashboard, Profilseite, Navigation. Dunkel/Hell-Modus, Spracheinstellungen (next-intl DE/EN). Breach-Monitoring-Cronjob (Pro)."],
      ["Tag 4-5", "Basisfunktionen, Recht und Launch-Vorbereitung", "AGB, Impressum, Datenschutzerklaerung, Cookie-Banner. DSGVO-Funktionen (Export, Kontol-Loeschung). Free-zu-Pro-Upgrade-Flow. Landing Page. Letzte Fehlerbereinigung, Vercel-Deployment, Performance-Check."]
    ],
    [1200, 1800, 6000]
  ),
  spacer(),
  p("Hinweis: Die 5-Tage-Umsetzung produziert einen lauffaehigen Prototyp aller Hauptprozesse und Basisfunktionalitaeten fuer einen ersten Launch. Qualitaetssicherung und Stabilisierung laufen nach dem Sprint weiter."),
  spacer(),

  pBold("Betriebskosten V1 (monatlich):"),
  tbl(
    ["Position", "Kosten/Monat"],
    [
      ["GitHub Copilot (Entwicklung)", "35 EUR"],
      ["Supabase Pro", "10 EUR"],
      ["HIBP API (Breach-Monitoring)", "3,50 USD (ca. 3,30 EUR)"],
      ["Domain (.de oder .com)", "2-4 EUR"],
      ["Vercel (Free Tier ausreichend fuer V1)", "0 EUR"],
      ["Gesamt", "ca. 50-53 EUR"]
    ],
    [6000, 3000]
  )
];

// =====================================================================
// QUELLENVERZEICHNIS
// =====================================================================
const quellen = [
  h1("Quellenverzeichnis"),
  tbl(
    ["Nr.", "Quelle", "Inhalt / Fundstelle", "Veroeffentlichungsdatum"],
    [
      ["1", "NordPass Password Manager Report 2025", "Durchschnittlich 168 Online-Konten pro Person, nordpass.com", "Maerz 2025"],
      ["2", "GDPR Enforcement Tracker 2025", "Rekordhoch 2,9 Mrd. EUR Bussgelder, enforcementtracker.com", "Januar 2026"],
      ["3", "Statista Digital Report 2025", "72 Mio. aktive Internetnutzer in Deutschland, statista.com", "Februar 2025"],
      ["4", "Bitkom Cybersicherheitsreport 2025", "62 % der Nutzer haben Datenschutzverletzung erlebt, bitkom.org", "Oktober 2025"],
      ["5", "MarketsandMarkets Research 2025", "Identity & Privacy Management Market 18,4 Mrd. USD, CAGR 17,3 %, marketsandmarkets.com", "April 2025"],
      ["6", "IDG Market Pulse DACH 2025", "Consumer Privacy Tools DACH ca. 320 Mio. EUR adressierbar, idg.de", "Juni 2025"],
      ["7", "YouGov Datenschutzumfrage DE April 2025", "34 % bereit bis zu 5 EUR/Monat fuer Datenschutz-Tool zu zahlen, yougov.de", "April 2025"],
      ["8", "HIBP Annual Report 2025", "18,4 Mrd. kompromittierte Datensaetze 2025, haveibeenpwned.com", "Januar 2026"],
      ["9", "Cisco Privacy Benchmark Study 2025", "58 % der 25-44-Jaehrigen recherchieren aktiv nach Datenschutz-Tools, cisco.com", "September 2025"],
      ["10", "Verizon DBIR 2025", "80 % der hacking-basierten Datenpannen nutzen gestohlene Credentials, verizon.com", "Mai 2025"],
      ["11", "noyb.eu Untersuchungsbericht 2025", "Inaktive Konten fuer Analytics und KI-Training genutzt, noyb.eu", "Juli 2025"],
      ["12", "Zuora Subscription Economy Index 2025", "41 % vergessen mindestens ein Abo, 62 EUR/Jahr Verlust, zuora.com", "Maerz 2025"],
      ["13", "DSGVO (EU) 2016/679", "Art. 17 Recht auf Loeschung, Art. 5 Datensparsamkeit, eur-lex.europa.eu", "Geltend"],
      ["14", "EU AI Act 2024/1689", "Transparenzpflichten fuer KI-Systeme, Anhang III, eur-lex.europa.eu", "August 2024"]
    ],
    [500, 2500, 4000, 2000]
  )
];

// =====================================================================
// DOKUMENT ZUSAMMENBAUEN
// =====================================================================
const doc = new Document({
  sections: [{
    properties: {
      titlePage: true,
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
      }
    },
    headers: {
      first: new Header({ children: [] }),
      default: makeHeader()
    },
    children: [
      ...deckblatt,    pageBreak(),
      ...kap1,         pageBreak(),
      ...kap2,         pageBreak(),
      ...kap3,         pageBreak(),
      ...kap4,         pageBreak(),
      ...kap5,         pageBreak(),
      ...kap6,         pageBreak(),
      ...kap7,         pageBreak(),
      ...kap8,         pageBreak(),
      ...kap9,         pageBreak(),
      ...quellen
    ]
  }],
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } }
  }
});

const outputDir = "Anforderungsdokument";
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const buffer = await Packer.toBuffer(doc);
const outputPath = outputDir + "/GhostAccounts_Anforderungsdokument.docx";
fs.writeFileSync(outputPath, buffer);
console.log("Dokument erstellt: " + outputPath);
