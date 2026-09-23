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
- Passwortänderung und administrativer Reset: implementiert. Öffentliche Recovery-Mails blockiert. **Reset-E-Mail-Versand ist ohne eingerichteten Maildienst noch nicht produktiv nutzbar.**
- Benachrichtigungen/Sicherheitsmails: Resend-Anbindung vorhanden, Zugang/Absender fehlen; Fehler werden protokolliert.
- Passkeys: vorbereitet, derzeit deaktiviert; keine Behauptung einer produktiven Passkey-Einrichtung.
- Keine Passwörter, Service-Schlüssel oder GitHub-Tokens im Browser. Publishable Key ist absichtlich öffentlich.

## Bedienung und Gestaltung

Vertikales Scrollen durch Kategorien, horizontales Wischen durch Drinks. Kategorienleiste fest oben und horizontal scrollbar. Bilder erhalten einen begrenzten Bereich oberhalb des Namens. Weichere Übergänge, ein Prozent größere Basisschrift. Aa-Schriftvergrößerung, Kontrast, reduzierte Bewegung und Pinch-Zoom bleiben erhalten. Die Browser-Adresszeile lässt sich durch eine normale Webseite nicht verlässlich ausblenden und ist kein Authentifizierungsmechanismus.

Bei Ausfall der Datenverbindung zeigt die Seite einen deutlich gekennzeichneten gespeicherten oder mitgelieferten Ersatzstand. Preise dann vor Ort bestätigen.

## Entwicklung und Übergabe

`node --test tests/*.test.js` prüft Rollen/MFA, HTTP-Abweisung, Datenvalidierung, Datenbankrechte, Versionskonflikte, Audit und atomare Veröffentlichung. Tests verwenden PGlite und HTTP-Mocks; Liveprüfungen sind separat dokumentiert.

Die SQL-Migrationen liegen unter `supabase/migrations`, der Backend-Code unter `supabase/functions/bar-admin`. Live wurden die ursprünglichen Migrationen über den SQL Editor installiert; ein blindes `db push` kann deshalb doppelte Migrationen verursachen. Vor weiteren Migrationen den Livezustand abgleichen.

[Backend-Entscheidung und kostenlose Limits](docs/backend-decision.md) · [Einrichtung](docs/backend-setup.md) · [Live-Status](docs/live-setup-status.md).
