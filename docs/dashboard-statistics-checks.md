# Änderung und Abnahme – 24.09.2026

## Verbindliche Basis und vorhandene Funktionen

GitHub main: `2924fa8ad5a99316de33826ed67df385a4d26741` (bereinigte Bildmaske). Öffentliche HTML/CSS/JS-Seite; Supabase veröffentlicht Kartensnapshot und Fotos; GitHub Pages liefert die Oberfläche. Kein Framework und kein zusätzlicher Dienst.

Vor Änderung vorhanden und beibehalten: vertikale Kategorien/horizontale Drinks, Details, weiche Bildmaske, Aa/Zoom, animierte Übergänge, Offline-Ersatzstand; Passwort/TOTP, verifizierter Passkey, Rollen admin/editor/viewer, aktive Sitzungsprüfung; Drinkliste und Suche, Reihenfolge, Preise/Zutaten/Beschreibung, Bildreferenz/Upload/Entfernen, Kategorien, Verfügbarkeit, lokaler Entwurf, Import/Export, Server laden/speichern, Versionsschutz, Vorschau, Veröffentlichung, A5-PDF, Benutzer anlegen/ändern/sperren, Admin-Reset, Testmail, Audit, Kontosicherheit/Passkeys/Sitzungsabmeldung.

Die neue Oberfläche verschiebt dieselben DOM-Komponenten in getrennte Ansichten. Es werden keine vorhandenen IDs oder Datenfelder entfernt. Bild- und Preispflege bleiben im Drinkformular. Benutzerverwaltung und Audit sind weiterhin Administratoren vorbehalten. Die Statistik verwendet die vorhandene Leseberechtigung.

## Dateien

Geändert: `index.html`, `css/style.css` (nur Footerhinweis ergänzt), `css/admin.css`, `admin/index.html`, `js/admin-auth.js`, `js/admin.js`, `supabase/functions/bar-admin/index.ts`, `tests/endpoint.test.js`, `README.md`.

Neu: `js/admin-dashboard.js`, `js/pageviews.js`, `supabase/migrations/202609240001_pageviews.sql`, `tests/pageviews.test.js`, dieses Protokoll.

Lokale Testansichten mit simulierten Adminantworten werden nicht hochgeladen. Kartendaten, Bilder, Maskenregeln, Gäste-App-Logik und bestehende Sicherheitsmodule sind unverändert.

## Automatisierte Prüfungen

22 Tests erfolgreich (`node --test tests/*.test.js`). Bestehende Tests für Rollen/MFA, Sessionwiderruf, Passkeys, Publikation, Uploadautorisierung, E-Mail und PDF bestehen weiterhin. Zusätzliche Prüfungen:

- Eine Zählung pro Dokument; eine neue Dokumentinstanz zählt erneut. Keine Zählung bei Admin, Vorschau und lokalem Aufruf.
- Fehlerhafte/fehlende Statistikverbindung wird abgefangen, keine Wiederholungsversuche.
- PostgreSQL/PGlite: leere Tabelle, inklusive 7-/30-Tagesgrenzen, Gesamtwert und atomare Inkremente.
- Direkter Tabellen- und RPC-Zugriff für anon/authenticated gesperrt.
- HTTP-Statistik nur für aktive, freigeschaltete und stark authentifizierte Mitglieder; anonymer Zugriff und falscher Origin abgewiesen.

## Browserprüfung

Chromium-basierte Browseransichten: 390 × 844, 820 × 1180 und 1280 × 900. Gleiche Kachelhöhen, eine/zwei/drei Spalten, keine horizontale Seitenüberbreite. Alle sieben Bereiche einzeln erreichbar, jeweils mit Rückweg; nur ein Bereich sichtbar. Drinkformulare passen in die mobile Breite. Leserolle sieht keine Benutzerverwaltung, direkte Bereichsadresse initialisiert keinen fremden Bereich. Simulierter Statistikausfall zeigt einen verständlichen Fehler mit Gedankenstrichen statt Nullwerten; übrige Navigation funktioniert.

Die Backend-Migration wurde auf vorhandene Tabellen geprüft und anschließend in einer Transaktion installiert. Live unauthentifizierte Statistikabfrage sowie direkter Aufruf beider RPCs wurden abgewiesen.

## Prüfgrenzen

Die Browseransichten ersetzen keine physischen Gerätetests. iOS/Safari, Android/Chrome, iPad, Bildschirmtastatur und persönliche Passkey-Anmeldung nach dieser Layoutänderung sind am jeweiligen Gerät zu bestätigen. Die Bildmaske war zuvor vom Nutzer auf dem Smartphone bestätigt. Der zweite Administrator wird auf ausdrücklichen Nutzerwunsch erst später getestet.

Testkonten/Mockantworten prüfen die Anordnung ohne Änderungen an echten Drinks oder Benutzerrechten. E-Mail-Versand, Passwortänderung, Rollenänderung und Veröffentlichung echter Kartendaten werden nicht allein für einen Layouttest ausgeführt. Diese bestehenden Abläufe sind durch automatisierte Regressionstests abgedeckt.


## Live-Abnahme

GitHub Pages liefert die neue Admin-Startseite sowie den Footerhinweis. Die bestehende Supabase Edge Function wurde mit genau den zwei Statistikaktionen erweitert; Authentifizierung und Rollenpolitik blieben erhalten. Der Livezähler begann bei 0. Öffnen der öffentlichen Karte führte zu 1. Drink öffnen/schließen, Kategorienwechsel, horizontaler Drinkwechsel und Scrollen ließen den Wert bei 1. Vollständiges Neuladen erhöhte ihn auf 2. Der vorherige Aufruf der Adminseite hatte keine Zählung ausgelöst. Alle vier Zeitraumwerte waren am ersten Erfassungstag konsistent. Der KI-Hinweis ist im Footer sichtbar, auf der Gastseite erscheinen keine Statistikzahlen.

Persönliche Live-Anmeldung nach der Änderung wurde zur Abschlussprüfung angefordert; sie benötigt die Gerätebestätigung des Nutzers. Die neue Dashboard-Anordnung und Fehlerzustände wurden zuvor mit isolierten Testantworten im Browser geprüft. Es wurden keine echten Drinks, Preise, Benutzerrechte oder E-Mail-Einstellungen für diesen Auftrag geändert.
