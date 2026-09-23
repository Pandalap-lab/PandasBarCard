# PANDAsBarCard – First Floor

Digitale Barkarte für Smartphones und den Aufruf per QR-Code. Weiterentwicklung des bestehenden Repositories `Pandalap-lab/PandasBarCard`; Ausgangsstand für diese Änderung: `c48ffe7eb1006fedba67573e2a97d193323f74a4` (23.09.2026 abgerufen). HTML, CSS und Vanilla JavaScript ohne Build-Framework. Die öffentliche Karte bleibt statisch auf GitHub Pages.

## Status

| Bereich | Stand |
|---|---|
| Gästekarte, echtes vertikales Scrollen, horizontale Drinkreihen, Kategorienleiste, Details | **Implementiert** |
| Karte26 2.pdf: 130 Einträge, 21 Kategorien, 130 Preise, Mengen/Alkohol soweit angegeben | **Implementiert** |
| 15 vorhandene WebP-Drinkillustrationen und FirstP-Hintergrund | **Implementiert** |
| Aa: Standard/Groß/Sehr groß, Kontrast, Bewegung, Gerätespeicherung, Zurücksetzen | **Implementiert** |
| Lokale Wartung, Entwurf, Vorschau, Änderungszähler, Import/Export | **Implementiert** |
| Login, Rollen, serverseitige Autorisierung, TOTP, Admin-Passwort-Reset | **Code implementiert, Live-Einrichtung/Abnahme offen** |
| WebAuthn/Passkeys | **SDK-Anbindung implementiert, experimentell, standardmäßig aus** |
| Serverseitige Veröffentlichung, Audit Log, E-Mail | **Code implementiert und lokal getestet; nicht deployed** |
| Recovery-Codes, MFA-Reset-Oberfläche, Wiederherstellungsoberfläche | **Nicht implementiert; dokumentierte Eigentümer-Verfahren** |
| Austauschbarer Datenzugriff in js/store.js | **Vorbereitet** |

**Die produktive Architektur ist jetzt GitHub Pages + Supabase Free + Resend Free.** Der Eigentümer richtet die kostenlosen Konten erst beim Live-Start ein. Der ausgelieferte Admin-Einstieg bleibt deshalb ohne Backend-Konfiguration gesperrt; ein ausdrücklich gewählter lokaler Entwurfsmodus bleibt verfügbar. Keine Konten erstellt, keine Secrets hinterlegt, keine kostenpflichtigen Optionen aktiviert, keine Veröffentlichung oder E-Mail vorgenommen.

Die Auswahl einschließlich Kostenlimits und Datenhaltung wurde **vor Integration** in [Backend-Entscheidung](docs/backend-decision.md) dokumentiert. [Einrichtung und Betrieb](docs/backend-setup.md) beschreibt die Live-Aktivierung; [Prüfbericht](docs/backend-verification.md) trennt geprüften Code von offenen Live-Tests.

## Öffentliche Barkarte

[Gästekarte und QR-Ziel](https://pandalap-lab.github.io/PandasBarCard/). Keine Anmeldung oder Installation; keine Admin-, Login- oder Wartungslinks. Kategorien stehen untereinander. Vertikal scrollt der Browser normal; horizontal werden Drinks innerhalb einer Kategorie gewechselt. Kategorienbuttons und Pfeile sind Alternativen zu Gesten. Details schließen mit rundem Glasbutton oder Escape; Fokus kehrt zum ausgewählten Drink zurück.

## Daten und neue PDF

`data/drinks.json` ist die veröffentlichte Datenquelle. Die aktuelle Gästekarte `Karte26 2.pdf` hat Vorrang vor `Receipes New Menu_Bar.pdf` für Bezeichnungen, Preise, Reihenfolge und öffentlich angezeigte Zutaten.

46 bisherige Cocktails/Shots wurden aktualisiert, IDs und 15 Bildzuordnungen erhalten. Dazu kommen 84 Einträge: Scotch 17, Bourbon 5, Irish Whiskey 5, Gin 13, Rum 8, Tequila 5, Vodka 5, Sparkling Wine/Champagne/Others 11, Beer 2, Softdrinks 12, Snacks 1. Signatures stehen entsprechend der PDF am Ende. Mehrere Varianten in einer PDF-Zeile bleiben ein gemeinsamer Eintrag. Preise werden als Euro angezeigt; das entspricht dem bisherigen Projektformat.

Felder: `id`, `name`, `categoryId`, `price` (Zahl oder null), `description`, `ingredients` (Liste), `photo` (relativer Pfad), `photoAlt`, `active`, `order`; zusätzlich `serving`, `alcoholContent`, `kind`, `allergens`, `tags`, `palette`, `source` (PDF und Seite). `revision` kennzeichnet die importierte Kartenversion. Historische Rezeptdaten bleiben bei den 46 bisherigen Einträgen unter `legacyRecipe`, werden aber nicht mit neuen Zutaten vermischt oder öffentlich als aktuelles Rezept ausgegeben. Die neue PDF nennt keine vollständige Allergenliste; es werden keine Allergene oder Cocktail-Alkoholwerte erfunden.

`docs/menu-import.json` dokumentiert die Übernahme. Quellschreibweisen wie „Barcardi Cola“, „Junge Bird“ und „Another Attempted Autmn“ sind bewusst erhalten. Die aktuelle Karte nennt „Tropical Dry Martini“ statt „Tropical Dry Daiquiri“; die bestehende ID und Illustration wurden übernommen. Diese Abweichungen sollten bei einer redaktionellen Freigabe berücksichtigt werden.

## Administration und Entwurf

`/admin/` zeigt Anmeldung oder den noch nicht eingerichteten Zustand. Die bisherige Pflegeoberfläche bleibt erhalten: Namen, Preise, Kategorien, Zutaten, Beschreibung, Bild, Reihenfolge, Mengen, Verfügbarkeit; Import/Export und Vorschau. Kein unnötiger Umbau der Gästekarte.

Nach Live-Aktivierung: **Passwort/Passkey → TOTP → aktuelle Rollenprüfung → Arbeitsentwurf → Server speichern → Vorschau → ÄNDERUNGEN VERÖFFENTLICHEN → GitHub-Commit → Pages-Build.** Administratoren veröffentlichen und verwalten Nutzer; Bearbeiter speichern Entwürfe; Nur-Lesen lädt den Serverstand. Keine Rolle oder Berechtigung wird aus frei änderbaren Profilmetadaten übernommen. Alle Serveraktionen prüfen die Datenbankrolle erneut.

Lokale Arbeitsentwürfe bleiben in `pandas-barcard-draft-v1`. Auth-Tokens werden dagegen ausschließlich im Arbeitsspeicher gehalten; Neuladen erfordert erneute Anmeldung. Die Gastansicht lädt ausschließlich die veröffentlichte JSON. `?preview=1` zeigt die gespeicherte lokale Arbeitskopie. Vor einem Server-Laden wird eine abweichende lokale Kopie unter `pandas-barcard-before-server` gesichert. Für langfristige Sicherung weiterhin exportieren.

Serverentwurf mit Versionsnummer und GitHub-Ausgangs-SHA: konkurrierende Bearbeitung oder externe GitHub-Änderung wird abgewiesen. Veröffentlicht wird nur der ausdrücklich gespeicherte Serverstand. Der Server darf ausschließlich `data/drinks.json` im konfigurierten Repository/Branch ändern. Ein Commit-Erfolg bedeutet noch nicht, dass der Pages-Build beendet ist. Unklare Netzwerkfehler behalten die Publish-Sperre zur manuellen Prüfung; keine blinden Wiederholungen.

## Sicherheit

Supabase Auth übernimmt Passwörter und TOTP. WebAuthn-Registrierung, Anmeldung, Liste und Widerruf sind angebunden, wegen des experimentellen Anbieterstatus standardmäßig deaktiviert. TOTP/AAL2 bleibt auch bei Passkey-Login für Datenaktionen erforderlich. Keine Speicherung von Fingerabdrücken oder Gesichtsdaten. Passwortänderung für angemeldete Nutzer; Recovery-Link nur vom Administrator per Serverfunktion angefordert. Der erforderliche Auth-Mail-Hook sperrt den öffentlichen Recovery-Versand serverseitig – nicht nur dessen Oberfläche.

Die Edge Function verifiziert den Token über Auth, prüft Session, Sperrstatus und Rolle. Datenbanktabellen sind per RLS/Grants vor direkten Browserzugriffen geschützt. Bearbeiter können keine Accounts, Resets oder Veröffentlichungen erzwingen. Letzter Administrator kann nicht deaktiviert/herabgestuft werden. CORS erlaubt nur den konfigurierten Origin; Bearer-Token statt Cookies vermeidet ambient Cookie-Autorisierung. Die Adminseite verwendet CSP, keinen externen JavaScript-CDN und keine Tokens in localStorage.

Serverseitige Prüfung: JSON-Größe, Kategorien/IDs, Preise, Rasterbild-MIME/Signatur und Pfade. Daten-URLs nur PNG/JPEG/WebP, keine SVG/HTML-Uploads oder externen Bildquellen für Veröffentlichung. Eine vollständige serverseitige Bilddekodierung/Rekodierung und ein Virenscanner sind **nicht implementiert**. Bilder werden in der vorhandenen Browser-Pipeline nach WebP umgerechnet; optimierte Assets können weiterhin über GitHub gepflegt werden.

Audit ist für Anwendungskonten append-only, mit Auth-/Entwurfs-/Publish-/Rollen-/Reset-/Verweigerungs-/Mailfehler-Ereignissen. E-Mails bei Veröffentlichung, Rollenänderung, Reset und verweigertem Zugriff; begrenzt gegen Wiederholungen. Keine automatische Mail-Eskalation für anonyme Login-Angriffsserien. Keine externe manipulationssichere Audit-Versiegelung. Verlorenes TOTP wird vom verifizierenden Projekteigentümer im Auth-Dashboard behandelt; eigene Recovery-Codes und MFA-Reset-Oberfläche bleiben offen. Live-Sicherheitsabnahme ist Voraussetzung, bevor dieser Stand produktiv verwendet wird.

## Barrierefreiheit

Orientierung an WCAG 2.2 AA, keine Zertifizierung. Semantische Überschriften, echte Buttons, Bildalternativen, dekorativer Hintergrund, Skip-Link, Dialogfokus und Tastaturbedienung. Feste Aa-Taste öffnet ein Dialogfeld: Standard/Groß/Sehr groß, Kontrast erhöhen, Animationen reduzieren, auf Standard zurücksetzen. Einstellungen sind gerätelokal, ohne personenbezogene Daten oder Übertragung. Betriebssystem-`prefers-reduced-motion` wird auch bei zurückgesetzter Aa-Auswahl respektiert.

`touch-action: manipulation` reduziert unbeabsichtigten Doppeltipp-Zoom; bewusstes Pinch-Zoom bleibt erlaubt. Keine `user-scalable=no`-Sperre. Touchziele überwiegend mindestens 44 px. Schriftgrößen sind skalierbar, Texte umbrechen. Der Admin hat beschriftete Formulare, Statusmeldungen, sichtbare Fokusränder und mobile Anordnung. Physische Safari-/Android- und Screenreadertests stehen noch aus; Details in `docs/verification.md`.

## Bilder

Aktive Pfade: `images/drinks/*.webp`; vorhandene redundante Kopien unter `images/` wurden nicht gelöscht. 15 bereitgestellte **generierte Illustrationen**, keine als Originalfotos ausgegebenen Aufnahmen. Die übrigen Cocktails haben explizite Platzhalter; zusätzliche Sortimente sind kompakter dargestellt. `assets/FirstP.jpg` ist der vom Nutzer gelieferte Hintergrund.

Uploads im lokalen Admin: JPG/PNG/WebP bis 25 MB, auf maximal 1200 px verkleinert und als WebP im Entwurf gespeichert. Aktuelle bereitgestellte Bilder sind 1024 × 1024. Große Bildsammlungen überschreiten möglicherweise den Browserspeicher; Fehler werden angezeigt. Export enthält dann eingebettete Bilder. Für schlanke Veröffentlichung WebP-Dateien unter `images/drinks/` ablegen und relative Pfade setzen. Serverentwürfe prüfen Bildformat/Signatur/Pfad und begrenzen die Gesamtgröße auf 4,5 MB sowie einzelne Daten-URLs auf 750.000 Zeichen. Eingebettete Bilder werden mit JSON veröffentlicht. Separate Bilddatei-Uploads über die API sind nicht implementiert. Masken lassen Ränder weich auslaufen; das Bild selbst wird nicht weichgezeichnet. Bildfarbauswertung ist für lokal lesbare Bilder möglich; externe Bilder können aus Browser-Sicherheitsgründen auf die gespeicherte Farbpalette zurückfallen.

## Projektstruktur

```text
index.html                 Gästekarte
admin/index.html           Login, Sicherheit, Benutzerverwaltung und Entwurf
admin/config.json          Nur öffentliche Backend-Konfiguration
supabase/                  Migrationen und serverseitige API
tests/                     Rollen-, SQL- und API-Sicherheitstests
css/style.css              Gastoberfläche, Dialoge, Aa
css/admin.css              Wartungsoberfläche
js/app.js                  Kategorien, Scrollen, Details
js/accessibility.js        Aa-Einstellungen und Bewegung
js/admin.js                Bestehende Pflege + Serverentwurf/Veröffentlichung
js/admin-auth.js           Auth, TOTP, Passkeys, Nutzerverwaltung
js/vendor/                 Festgelegte Supabase-Bibliothek
js/changes.js              Entwurfsvergleich
js/store.js                Datenzugriff und Validierung
js/gestures.js             Historisches Modul, nicht mehr eingebunden
data/drinks.json           Aktuelle Karte
images/drinks/             Verwendete Drinkbilder
images/                    Vorhandene Bildkopien
assets/FirstP.jpg          Hintergrund
docs/menu-import.json      Quellenabgleich
docs/verification.md       Prüfungen und Grenzen
Karte26 2.pdf              Aktuelle Menüquelle
Receipes New Menu_Bar.pdf  Historische Rezeptquelle
bildprompts.json            Vorhandene Bildvorgaben
.nojekyll                  Statische Pages-Veröffentlichung
README.md                 Diese Dokumentation
```

## Betrieb, Backup und Wiederherstellung

Lokal über einen statischen Webserver öffnen, z.B. `python -m http.server 8090`, nicht per Dateidoppelklick. Alle Pfade unterstützen die GitHub-Pages-Unteradresse `/PandasBarCard/`. Produktive Versionen sind durch GitHub-Commits nachvollziehbar. Eine frühere funktionierende Version per überprüftem Revert wiederherstellen; danach Pages-Build und Gästekarte prüfen. Eine Wiederherstellung über die eigene Adminoberfläche ist geplant. Lokale Entwürfe sind kein Backup des Repositorys; zusätzlich exportieren.

**Ausfallsicherheit:** Die Gästekarte verwendet ausschließlich veröffentlichte Dateien und funktioniert unabhängig von dem separaten Login-/Admin-/E-Mail-Dienst. Ein Ausfall von GitHub Pages selbst ist hiervon nicht abgedeckt.

## Externe Dienste und Kosten

Eingesetzt: GitHub Repository und GitHub Pages für Dateien, Versionshistorie und Hosting. Öffentliches Pages-Hosting ist im GitHub-Free-Angebot verfügbar; es bestehen Nutzungsgrenzen, siehe [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) und [Limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Relevante Pages-Grenzen (23.09.2026): veröffentlichte Site maximal 1 GB, weiches Bandbreitenlimit 100 GB/Monat und normalerweise 10 Builds/Stunde. Bei Überschreitung sind Rate Limits bzw. Einschränkungen möglich; daraus entsteht keine automatische von dieser Anwendung gebuchte Tarifumstellung. Zusätzlich ausgewählt, aber noch nicht provisioniert: Supabase Free für Auth/Server/Datenbank und Resend Free für E-Mail. Die Entscheidung dokumentiert die Gratislimits, mögliche Einschränkungen/Projektpause und Migration. Bei der angenommenen Nutzung durch wenige Mitarbeiter sind 0 € laufende Dienstkosten zu erwarten; eine vorhandene Absenderdomain wird vorausgesetzt. Keine kostenpflichtige Buchung durch diese Änderung. Preisgarantien für zukünftige Anbieter werden nicht gegeben.

## Wartung

Vor jeder Änderung aktuellen GitHub-Stand laden; lokale Entwürfe gegen aktuelle Kartenversion prüfen. Neue PDF-Informationen mit Seitenbezug übernehmen, vorhandene IDs/Bilder behalten und Abweichungen dokumentieren. Im Admin speichern, Vorschau prüfen, exportieren; Bilder und JSON anschließend bewusst in GitHub veröffentlichen. Nach erfolgreichem Pages-Build Preise, mindestens ein Bild, Kategorie-Scrollen, Details und Aa auf der Gastseite prüfen. Bis zur Live-Aktivierung erfolgt Veröffentlichung manuell über GitHub; danach zusätzlich über die geschützte Admin-API. Keine lokalen Formularänderungen als veröffentlichte Änderungen ausgeben.

Bei Änderungen an Datenmodell, Pfaden, Oberfläche, Administration, Sicherheit oder externen Diensten README und Prüfprotokoll im selben Arbeitsschritt aktualisieren. Geplantes niemals als implementiert beschreiben.
