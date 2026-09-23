# Live-Einrichtung – Supabase Free und Resend Free

Stand: Code vorhanden und lokal geprüft. **Noch keine Anbieter-Konten, kein Deployment und keine produktive Sicherheitsfreigabe.** Der Eigentümer möchte Konten erst beim echten Start einrichten. Eine Tarifänderung in Codex/ChatGPT ändert daran nichts.

## 1. Konten und kostenlose Tarife

Supabase-Projekt in einer passenden EU-Region erstellen, Organisation ausdrücklich **Free**. Kein Pro, keine bezahlten Add-ons, kein Firebase-Blaze. Resend **Transactional Free**. Eine vorhandene eigene Domain als Absender verifizieren (DNS). Ohne eigene Domain erlaubt Resends Testabsender nur eingeschränkte Tests an die Kontoinhaber-Adresse; dies ersetzt keinen produktiven Versand an Mitarbeiter. Keine Domain bestellen. Die private Startadresse steht ausschließlich in den lokalen Übergabenotizen, nicht im öffentlichen Repository.

## 2. Datenbank und Auth

Migrationen `supabase/migrations/202609230001_admin.sql` und `202609230002_sessions.sql` in dieser Reihenfolge anwenden. Mit Supabase CLI nach Projekt-Verknüpfung: `supabase db push`. Alternativ SQL Editor. SQL-Ausgaben auf Fehler prüfen. Alle Anwendungstabellen haben RLS und keine öffentlichen Policies. Service-Rolle nur im Backend.

Auth-Dashboard **explizit** konfigurieren; die lokale `supabase/config.toml` ist die Vorlage und allein noch kein Beleg für Remote-Einstellungen:

- öffentliche Registrierung aus, anonyme Registrierung aus, Social/Telefon/Magic-Link-Anmeldung nicht aktivieren;
- E-Mail/Passwort an, mindestens 12 Zeichen; JWT 900 Sekunden, OTP/Recovery 900 Sekunden;
- Site URL und einzig erlaubte Redirect-URL `https://pandalap-lab.github.io/PandasBarCard/admin/`;
- TOTP Enrollment und Verification an;
- **Send Email Hook** auf `public.block_public_auth_email` aktivieren. Ohne diesen Hook keine Live-Freigabe: Er sperrt öffentlich angeforderte Recovery-/OTP-E-Mails serverseitig. Administratoren erzeugen Links über `generateLink`, das nicht den öffentlichen Mailversand benutzt;
- Rate-Limits des Auth-Dienstes eingeschaltet lassen; bei Bedarf CAPTCHA ergänzen;
- initialen Eigentümer über das Auth-Dashboard anlegen, E-Mail bestätigen. Starkes Passwort ausschließlich vom Eigentümer eingeben. Seine UUID und E-Mail im SQL Editor als `bar_members` mit `role='admin', enabled=true` hinzufügen. Keine offene Bootstrap-HTTP-Route.

Die SQL-Funktion für Sessionprüfung und der Auth-Audit-Trigger greifen auf dokumentierte Auth-Schemas zu. Vor dem Live-Start auf dem tatsächlichen Projekt testen; die lokale SQL-Prüfung ersetzt diese Anbieterprüfung nicht.

## 3. Backend-Secrets

Im Supabase-Secret-Manager setzen, **niemals** in GitHub/Frontend/Chat:

| Name | Wert/Zweck |
|---|---|
| `ADMIN_ORIGIN` | `https://pandalap-lab.github.io` (kein Pfad) |
| `ADMIN_URL` | `https://pandalap-lab.github.io/PandasBarCard/admin/` |
| `GITHUB_REPOSITORY` | `Pandalap-lab/PandasBarCard` |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_TOKEN` | Fine-grained PAT, nur dieses Repository, Contents read/write, kurze Laufzeit |
| `RESEND_API_KEY` | auf Versand beschränkter Schlüssel |
| `MAIL_FROM` | verifizierter Absender der eigenen Domain |
| `SECURITY_EMAIL` | Eigentümer-Adresse für Benachrichtigungen |

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` werden von Supabase bereitgestellt. API-Secret und PAT bleiben serverseitig. Ein Repository-PAT ist auf Dateiebene nicht einschränkbar; die Funktion erzwingt den festen Pfad `data/drinks.json`. Token regelmäßig rotieren; GitHub-Konto ebenfalls mit 2FA schützen. Die API verarbeitet keine vom Client vorgegebenen Repository-, Branch- oder Dateipfade.

Deploy: `supabase functions deploy bar-admin`. Die Konfiguration `verify_jwt=false` ist beabsichtigt: die Funktion verifiziert mit `auth.getUser(token)`, prüft aktive Session, aktuelle Datenbankrolle und AAL2 selbst. Keine anonyme Schreibroute.

## 4. Öffentliche Konfiguration und Dateien

`admin/config.json`: nur `supabaseUrl`, **öffentlichen Publishable Key**, `passkeysEnabled`. Der öffentliche Key ist kein Secret und gewährt aufgrund RLS allein keinen Zugriff auf Entwürfe oder Rollen. Keine Service-Rolle einsetzen.

`js/vendor/supabase.js` ist die lokal bereitgestellte Bibliothek in Version 2.105.0. Kein Runtime-CDN. Reproduzierbar mit `pnpm install --frozen-lockfile --ignore-scripts` und `pnpm run build:auth`. Die Gästekarte benötigt weiterhin keinen Build.

Webdateien samt `admin`, `js`, `css`, `data`, `images`, `assets` und `.nojekyll` zu GitHub übernehmen. `node_modules`, `.env`, Tokens und private Übergabenotizen niemals hochladen. Das Backend wird gesondert zu Supabase deployt. Vor Upload den aktuellen GitHub-Stand auf zwischenzeitliche Änderungen prüfen.

## 5. Anmeldung und Arbeiten

Passwort → TOTP-Code; bei erstem Login Authenticator einrichten. Sitzungen werden nur im Arbeitsspeicher gehalten; nach Neuladen neu anmelden. Jeder Backendzugriff prüft aktuellen Sperrstatus und Rolle. Nur-Lesen kann Daten laden; Bearbeiter kann Entwürfe speichern; Administrator kann zusätzlich veröffentlichen, Konten/Rollen verwalten, Reset auslösen und Audit lesen.

Arbeitsentwurf lokal speichern → Vorschau → Entwurf auf Server speichern → **ÄNDERUNGEN VERÖFFENTLICHEN**. Unveröffentlichte Arbeitsänderungen werden nicht automatisch gesendet. Der Veröffentlichungsserver benutzt den gespeicherten Serverstand, keine ungespeicherten Browserdaten. Versionsnummer schützt vor Überschreiben paralleler Entwürfe; GitHub-Datei-SHA schützt vor externen Änderungen. Veröffentlichung erstellt einen GitHub-Commit; Pages-Build kann danach noch laufen oder fehlschlagen. Erfolg der API ist deshalb kein Nachweis einer bereits aktualisierten Gästeseite.

Beim Wechsel vom lokalen Entwurf zum Serverstand werden beide Stände getrennt gesichert. Vor Rücksetzen/Server-Neuladen bei Bedarf exportieren. Vorschau ist gerätelokal und nicht als öffentlicher Freigabelink gedacht.

## 6. Passkeys und Wiederherstellung

Supabase-Passkeys sind experimentell. Optional erst nach separatem Abnahmetest aktivieren: RP-ID `pandalap-lab.github.io`, Origin `https://pandalap-lab.github.io`, Name PANDAsBarCard. Danach `passkeysEnabled=true`. RP-ID nicht ändern, sonst müssen Passkeys neu registriert werden. Code verwendet SDK-Registrierung, Login, Liste und Widerruf. Private Schlüssel und biometrische Daten verbleiben beim Authenticator. AAL2 bleibt für alle Daten-/Schreibaktionen erforderlich; Passkey ersetzt hier nicht stillschweigend TOTP. Test auf iPhone/Safari und Android/Chrome vor Freigabe.

Passwort-Reset: Administrator meldet sich mit TOTP an → Benutzerverwaltung → Reset senden. Zeitbegrenzter Einmallink; Empfänger setzt selbst ein neues Passwort. Kein öffentliches „Passwort vergessen“-Formular. Ein fehlgeschlagener Mailversand wird als Fehler angezeigt und protokolliert. Neue Benutzer erhalten ebenfalls einen vom Administrator ausgelösten Einrichtungslink.

Verlorener TOTP-Faktor: Identität außerhalb der Anwendung prüfen; berechtigter Supabase-Projekteigentümer widerruft den verlorenen Faktor im Auth-Dashboard und beendet Sitzungen. Danach Passwort-Reset durch Administrator und erneute TOTP-Einrichtung. Eigene Recovery-Codes und delegierte MFA-Reset-Oberfläche sind **nicht implementiert**. Dies ist keine ungeschützte Umgehungsroute. Mindestens zwei vertrauenswürdige Administratoren einrichten.

## 7. Audit, E-Mail, Störungen

Anwendungsereignisse werden append-only gespeichert, einschließlich Entwurf, Veröffentlichung, Rollen, Resets, verweigerten Zugriffen und Mailfehlern. Auth-Ereignisse werden mit Aktionsname und Actor-ID übernommen; keine vollständigen Provider-Payloads, OTPs oder Tokens. DB-Projekteigentümer können die Datenbank technisch administrieren; das Log ist nicht extern manipulationssicher versiegelt.

E-Mail bei Veröffentlichung, Rollenänderung, Passwort-Reset und verweigertem Zugriff (letzteres max. einmal/Minute je Nutzer). Fehlgeschlagene anonyme Passwortanmeldungen bleiben im Auth/Audit-Protokoll; eine eigene automatische E-Mail-Eskalation für solche Angriffsserien ist noch nicht implementiert. Resend-Limits und Zustellung überwachen. Serverstatus zeigt Mailfehler bei Veröffentlichungen an; Rollenänderungen und zusätzliche Sicherheitsmails im Audit prüfen.

Unklarer Publish-Abbruch: Sperre bleibt bewusst erhalten, damit ein unsicher wiederholter Schreibvorgang verhindert wird. Eigentümer prüft zuerst GitHub-Commit und `bar_draft`, gleicht `base_sha`/`document` an und setzt erst danach `publish_lock`/`lock_at` auf null. Kein automatisches Überschreiben. Bei bestätigtem SHA-Konflikt löst der Server die Sperre selbst. Lokaler Export bleibt als Sicherung nutzbar.

Supabase-Ausfall/Pause: Admin nicht verfügbar, GitHub-Pages-Gästekarte unverändert. Datenbank und Auth regelmäßig exportieren, Audit-Wachstum überwachen; Aufbewahrung und manuelle Archivierung mit Eigentümer festlegen. Kein automatisches Löschen personenbezogener Audit-Daten eingerichtet. Anbieterwechsel siehe Entscheidungspapier.

## 8. Verbindliche Live-Abnahme (noch offen)

1. Anonym/gefälschter Token/abgelaufene oder abgemeldete Sitzung: kein Datenzugriff.
2. Direkte REST-Zugriffe auf Tabellen/RPC als anon/authenticated scheitern.
3. Viewer/Editor können keine Veröffentlichung, Rollenänderung oder Resets durch direkten HTTP-Aufruf erzwingen.
4. Öffentlicher Auth-Recovery-Aufruf versendet **keinen** Link; adminseitiger Link funktioniert einmal und läuft nach 15 Minuten ab.
5. TOTP-Einrichtung/Login/Fehlcode/Logout und verlorener Faktor; Passkeys separat auf echten Geräten.
6. Zwei Browser bearbeiten parallel: stale Version wird abgewiesen. Externer GitHub-Commit führt zu Konflikt. Genau die geprüfte Kartendatei erscheint nach erfolgreichem Pages-Build.
7. GitHub-/Mail-Ausfall, Sperren, Audit-Eintrag und tatsächlicher E-Mail-Empfang prüfen; keine Zugangsdaten in Quellcode, Netzwerkantworten oder Logs.

Erst nach dieser Abnahme „produktiv“ nennen. Lokale Tests sind in `docs/backend-verification.md` dokumentiert.
