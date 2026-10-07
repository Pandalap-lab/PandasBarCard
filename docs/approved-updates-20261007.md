# Sammelfreigabe: Umsetzung und Prüfung vom 07.10.2026

## Ausgangsbasis und Sicherung

Sauberer aktueller GitHub-Stand: `bf1a5aa` (main). Dashboard, reine Seitenzählung, KI-Footer und zugehörige Backendmigration waren bereits vorhanden. Diese Funktionen wurden geprüft und erhalten. Öffentliche Gestaltung, Kartendaten, Bilder, Authentifizierung, Rollen und SQL-Schema wurden nicht geändert.

Vollständiges Git-Backup: `../PandasBarCard-baseline-20261007.bundle` im lokalen Projektordner. Die tatsächlich bereitgestellte Supabase-Funktion wurde über den vorhandenen Dashboardeditor gelesen und als `../verification/live-bar-admin-before.ts` gesichert. Abgleich mit den ursprünglichen Repositorymodulen: identisch, abgesehen von Leerraum. Der Dashboardcode besteht aus einem zusammengeführten Modul; der neue Code wurde reproduzierbar aus den Repositorymodulen erzeugt.

## Geänderte Dateien

| Datei | Änderung |
| --- | --- |
| `admin/index.html` | Speicherbutton mit stabiler ID, Live-Status und aktualisierten Cacheversionen |
| `css/admin.css` | Gedrückter/pending Zustand, gleich große Onlineaktionsflächen |
| `js/admin.js` | Onlineformular direkt serverseitig speichern, gemeinsame Aktionssperre, bestätigte Veröffentlichung trotz Ladefehler |
| `js/admin-auth.js` | Aktuelles Editormodul, begrenzte Wartezeit und verständliche Meldung bei fehlender Serverbestätigung |
| `js/action-feedback.js` | Wiederverwendbarer Schutz vor parallelen Aktionen, bestehende Rollensperren erhalten, optionale Haptik |
| `supabase/functions/bar-admin/index.ts` | Verständliche Änderungsmails nach bestätigtem Vorgang; E-Mail-Fehler getrennt von Datenänderung |
| `supabase/functions/bar-admin/change-mail.js` | E-Mail-Aufbau mit authentifiziertem Akteur und Vorher→Nachher für Inhalt und Berechtigungen |
| `scripts/healthcheck.mjs` | Ein öffentlicher, rein lesender Datenbankrequest; kein Seitenaufruf |
| `.github/workflows/supabase-health.yml` | Täglicher unabhängiger Lauf, manuell und bei Konfigurationsänderung auslösbar |
| `scripts/bundle-backend.mjs` | Reproduzierbare Einzeldatei für den bestehenden Dashboardeditor |
| `tests/endpoint.test.js` | Speichern, Versionskonflikt, Inhalt der E-Mail und Mailausfall prüfen; ebenfalls gegen Dashboardbundle ausführbar |
| `tests/action-feedback.test.js` | Langsame Antwort, Mehrfachklickschutz, Fehlerzustand und Wiederherstellung von Rollensperren |
| `tests/change-mail.test.js` | Vorher/Nachher, Hinzufügen/Entfernen, Metadaten/Bildreferenzen, Rollen und Wiener Uhrzeit |
| `tests/healthcheck.test.js` | Nur GET, richtige Zeile, Fehler und Timeoutpfad ohne Schreiboperationen |
| `.gitignore` | Lokale Abhängigkeiten, erzeugter Backendcode und Screenshots ausschließen |
| `README.md`, dieses Protokoll | Bedienung, Architektur, Healthcheck und Prüfergebnisse |

`index.html`, `js/app.js`, `js/pageviews.js`, `js/admin-dashboard.js`, vorhandene Sicherheitsmodule, Bilder und `data/drinks.json` bleiben unverändert. Keine neuen Benutzer, Secrets, Rollen, Tabellen oder kostenpflichtigen Dienste.

## Automatisierte Prüfungen

31 Tests erfolgreich: `node --test tests/*.test.js`. Zusätzlich die sieben HTTP-/Autorisierungstests gegen die **tatsächlich bereitgestellte Einzeldatei**: `node scripts/bundle-backend.mjs`, dann Umgebungsvariable `TEST_BACKEND_BUNDLE=1` und `node --test tests/endpoint.test.js`.

Abgedeckt: Auth/MFA/Passkey, Sitzungswiderruf, Rollen, Origin, fehlende Berechtigung, PostgreSQL-Rechte, Versionskonflikte, atomare Veröffentlichung, PDF-Regression, genau eine Seitenzählung pro Dokument, kalendarische Zeiträume, Ausfallisolation, Mailkodierung und Versandadapter. Neue Prüfungen zeigen, dass ein bestätigter Save bei Mailausfall erfolgreich bleibt und dieselbe Aktion nicht parallel gestartet werden kann. Das Bundle und die normalen Module zeigen dieselben HTTP-Ergebnisse.

## Browserprüfung

Chromiumansichten: **390 × 844 (iPhone), 412 × 915 (Android), 820 × 1180 (iPad), 1440 × 900 (Desktop)**. Alle sieben Bereiche pro Größe durchlaufen: 28 Kombinationen, genau ein sichtbarer Bereich, Rückweg zum Dashboard, keine horizontale Inhaltsüberbreite. Einheitliche Kachelhöhe 148 px; eine/zwei/drei Spalten entsprechend den vorhandenen Breakpoints. Mobile Veröffentlichungsbuttons: identische 64 px Höhe und gleiche Breite.

Die Dashboardansichten wurden zunächst direkt im Browser geprüft; für sämtliche Bereichskombinationen wurde anschließend eine isolierte Browserfixture mit exakt breiten iFrames verwendet. Die tatsächliche `innerWidth` wurde pro Ergebnis bestätigt, statt nur eine angeforderte Browsergröße anzunehmen. Fixture und Ergebnisse liegen lokal unter `../verification/` und werden nicht veröffentlicht.

Isolierte Tests mit dem echten Admin-/Dashboardcode und simulierten Backendantworten:

- Formularpreis geändert → „Drink speichern“ → während der verzögerten Anfrage „Wird gespeichert …“, gesperrter Button → erst nach Antwort Serverversion bestätigt und „Noch nicht veröffentlicht“.
- Speicherfehler → verständliche Fehlermeldung, Button wieder freigegeben, genau eine Anfrage.
- Mailfehler → Servererfolg plus separat ausgewiesene fehlende Mailbestätigung.
- Veröffentlichung → Backendbestätigung und nachgeladenen Stand anzeigen.
- Bestätigte Veröffentlichung, danach Ladefehler → Veröffentlichung bleibt erfolgreich gemeldet; erneuter Veröffentlichungsversuch wird bis zum Laden des neuen Stands abgefangen.
- viewer: kein Speichern/Veröffentlichen, keine Benutzerverwaltung; editor: Speichern möglich, Veröffentlichen gesperrt. Backendrollen wurden zusätzlich mit HTTP-Tests geprüft.

## Liveprüfungen

Die neue Supabase-Funktion wurde am 07.10.2026 über den bestehenden Editor bereitgestellt. Eingesetzter Code wurde vor Deployment vollständig per Rücklesen abgeglichen. Das Dashboard bestätigt einen neuen Deploymentzeitpunkt. Keine Sicherheits-/Mailkonfiguration wurde geändert.

Nach Deployment: Statistik und Save ohne Anmeldung HTTP 401; fremder Origin HTTP 403; direkter Zugriff auf Statistik-Tabelle und RPC ohne Anmeldung HTTP 401. Öffentlicher Snapshot HTTP 200 mit **130 Drinks, 21 Kategorien, Revision 6**.

Healthcheck live erfolgreich. Rein lesende SQL-Abfrage davor/danach: Heute **0**, Gesamt **21**, identischer Hash der veröffentlichten Karte (`2e2356fce2859488f5bd06d917d084b2`). Der Healthcheck und unauthentifizierte API-Abweisung haben keine Pageviews erzeugt.

Öffentliche Karte einmal vollständig geladen: Heute **1**, Gesamt **22**. Drinkdetails öffnen/schließen, Kategorie wechseln, horizontale Drinknavigation und Scrollen: weiterhin **1 / 22**, identischer Kartenhash. KI-Hinweis im Footer sichtbar; keine Statistik auf der öffentlichen Karte.

Vollständiges Neuladen erhöhte anschließend auf Heute **2**, Gesamt **23**. Der zusätzliche Adminaufruf erhöhte die Werte nicht. Kartenhash weiterhin identisch. Die zwei technischen Barkartenaufrufe bleiben als echte Seitenladungen in der Statistik enthalten.

GitHub Pages wurde erfolgreich bereitgestellt ([Deployment](https://github.com/Pandalap-lab/PandasBarCard/actions/runs/37666032916)). Der unabhängig eingerichtete tägliche Healthcheck ist aktiviert; sein erster GitHub-Lauf war erfolgreich ([Prüflauf](https://github.com/Pandalap-lab/PandasBarCard/actions/runs/37666035505)). Ein zusätzlicher Test prüft die Beschriftung des tatsächlich ausgelösten Buttons ohne Tastaturfokus, wie bei Touch-Browsern.

## Verbleibende persönliche Abnahme

Browseransichten ersetzen keine Tests auf physischen iPhones/Androidgeräten/iPads. Safari/iOS, Bildschirmtastatur, persönliche Passkey-/MFA-Bestätigung und unterstützte Haptik sind am jeweiligen Gerät zu prüfen. Ein angemeldeter Live-Speicher-/Veröffentlichungstest und Empfang einer neuen Änderungs-E-Mail wurden in diesem Lauf nicht mit dem persönlichen Barkartenkonto durchgeführt. Backend-/UI-Abläufe und Fehlerzustände sind mit den beschriebenen Tests abgedeckt; echte Kartendaten wurden dafür nicht verändert. Der bisher vorgemerkte zweite Administratorzugang bleibt separat.

Der kostenlose Healthcheck ist ein unabhängiger Verfügbarkeits-/Keep-alive-Versuch, keine Garantie gegen Supabase-Pausierung. GitHub kann Zeitpläne verzögern und deaktiviert sie nach 60 Tagen ohne Repositoryaktivität. Einrichtung und Wiederaktivierung sind im README dokumentiert.
