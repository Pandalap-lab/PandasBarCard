# PANDAsBarCard

Digitale Gästekarte für First Floor, Wien. Die aktuelle Karte basiert auf `Karte26 2.pdf`: 130 Einträge in 21 Kategorien. Rezepte aus der früheren PDF bleiben zugeordnet. Preise und Namen wurden durch diesen Umbau nicht verändert.

## Architektur

QR-Code → GitHub Pages → veröffentlichte Kartendaten und Fotos aus Supabase.

`/admin/` → Anmeldung und TOTP → serverseitige Rollenprüfung → geschützter Entwurf → Vorschau → **ÄNDERUNGEN VERÖFFENTLICHEN** → Supabase-Datenbank und Bildspeicher.

GitHub verwaltet nur noch die Website-Versionen und einen gekennzeichneten Ersatzstand. Für das Veröffentlichen von Kartendaten ist kein Repository-Schreibzugriff mehr nötig. Der zuvor eingerichtete GitHub-Token wird vom neuen Backend nicht verwendet; seine Aufhebung ist separat zu erledigen.

## Sicherheit und tatsächlicher Status

- Anmeldung, TOTP/AAL2, aktive Sitzungsprüfung, Rollen admin/editor/viewer und serverseitige Autorisierung: implementiert.
- Entwürfe, Benutzer und Audit: für Gäste gesperrt. Öffentliche Tabelle `bar_published`: nur lesbar.
- Fotos: private Entwürfe, veröffentlichte Kopien im öffentlichen Bildbereich. Keine Browser-Schreibrechte auf Storage.
- Veröffentlichung: Versionskontrolle und Transaktion mit Audit. Gleichzeitige Änderungen werden nicht still überschrieben.
- Passwortänderung und administrativer Reset: implementiert. Öffentliche Recovery-Mails blockiert. **Gmail-Versand ist eingerichtet; die Ende-zu-Ende-Prüfung des Reset-E-Mail-Versands steht noch aus.**
- Benachrichtigungen/Sicherheitsmails: Gmail-Anbindung mit serverseitiger OAuth-Sendefreigabe bereitgestellt. Empfänger für Sicherheitsmeldungen: noname.g8@gmail.com; Versandtest noch offen; Fehler werden protokolliert.
- Passkeys: vorbereitet, derzeit deaktiviert; keine Behauptung einer produktiven Passkey-Einrichtung.
- Keine Passwörter, Service-Schlüssel oder GitHub-Tokens im Browser. Publishable Key ist absichtlich öffentlich.

## Bedienung und Gestaltung

Vertikales Scrollen durch Kategorien, horizontales Wischen durch Drinks. Kategorienleiste fest oben und horizontal scrollbar. Bilder erhalten einen begrenzten Bereich oberhalb des Namens. Weichere Übergänge, ein Prozent größere Basisschrift. Aa-Schriftvergrößerung, Kontrast, reduzierte Bewegung und Pinch-Zoom bleiben erhalten. Die Browser-Adresszeile lässt sich durch eine normale Webseite nicht verlässlich ausblenden und ist kein Authentifizierungsmechanismus.

Bei Ausfall der Datenverbindung zeigt die Seite einen deutlich gekennzeichneten gespeicherten oder mitgelieferten Ersatzstand. Preise dann vor Ort bestätigen.

## Entwicklung und Übergabe

`node --test tests/*.test.js` prüft Rollen/MFA, HTTP-Abweisung, Datenvalidierung, Datenbankrechte, Versionskonflikte, Audit und atomare Veröffentlichung. Tests verwenden PGlite und HTTP-Mocks; Liveprüfungen sind separat dokumentiert.

Die SQL-Migrationen liegen unter `supabase/migrations`, der Backend-Code unter `supabase/functions/bar-admin`. Live wurden die ursprünglichen Migrationen über den SQL Editor installiert; ein blindes `db push` kann deshalb doppelte Migrationen verursachen. Vor weiteren Migrationen den Livezustand abgleichen.

[Backend-Entscheidung und kostenlose Limits](docs/backend-decision.md) · [Einrichtung](docs/backend-setup.md) · [Live-Status](docs/live-setup-status.md).

## Gmail-Versand in Vorbereitung

Für das separate Absenderkonto wurde ein Gmail-API-Adapter lokal ergänzt. Zehn Tests bestehen einschließlich UTF-8-Mailaufbau, Schutz vor Header-Manipulation und serverseitigem Tokenaustausch. Google-Projekt, Versandfreigabe und Secrets sind noch einzurichten; der Adapter ist noch nicht live aktiviert. Siehe [Gmail-Einrichtung](docs/gmail-setup.md).


## A5-Druckkarte als PDF

Unter „Druckkarte als PDF“ können Administratoren und Bearbeiter die aktuelle veröffentlichte Karte oder den Arbeitsentwurf herunterladen. Voreinstellung: veröffentlichte Karte; im Onlinemodus wird sie vor dem Export neu vom Backend gelesen. Entwürfe erhalten einen klaren Entwurf-Vermerk. Ungespeicherte Formularänderungen müssen vor einem Entwurfsexport lokal gespeichert werden. Der Export veröffentlicht oder verändert keine Daten.

A5-Hochformat (148 × 210 mm), ruhiger brauner Hintergrund, goldene Überschriften/Preise und helle Schrift. Enthalten sind Kategorien, Getränkenamen, Zutaten, vorhandene Portionsangaben und Preise, keine Bilder. Fehlende Preise bleiben „Preis offen“; pausierte Drinks folgen der Anzeigeeinstellung. Text bleibt im PDF auswählbar; Seitenumbrüche und Fortsetzungsüberschriften werden automatisch erzeugt. Schrift unterstützt westliche europäische Zeichen; nicht unterstützte Zeichen melden einen Fehler, statt Inhalte still zu entfernen. PDF-Erstellung lokal im Browser mit gebündeltem pdf-lib 1.17.1, ohne externen PDF-Dienst. Build: `node scripts/vendor-pdf.mjs`. Druck: A5 und tatsächliche Größe / 100 %. Hintergrund ist bereits Bestandteil der PDF.

Prüfung: 12 automatisierte Tests bestanden, A5-Seitengröße und vollständige Eintragszahl geprüft, alle 19 Beispielseiten visuell kontrolliert. Beispiel basiert auf 130 Einträgen. Online-Administration weiterhin mit Rollenprüfung und MFA; Nur-Lesen-Rolle erhält keine zusätzlichen Rechte durch den Export.


Gmail-Status 23.09.2026: Google-Freigabe erteilt, fünf Mail-Konfigurationswerte in Supabase Secrets gespeichert, neue Edge Function bereitgestellt. Noch kein bestätigter Mailversand. Empfänger für Test und Sicherheitsmeldungen bestätigt: noname.g8@gmail.com. Unter Benutzerverwaltung steht Administratoren „Test-E-Mail senden“ zur Verfügung. Der Test schreibt einen Audit-Eintrag und versendet nur an den konfigurierten Empfänger. 13 automatisierte Tests bestanden. Versand-/Empfangsprüfung noch ausstehend. Siehe [Gmail-Einrichtung](docs/gmail-setup.md).
