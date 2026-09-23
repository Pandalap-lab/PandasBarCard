# Backend-Prüfbericht – 23.09.2026

## Tatsächlich geprüft

`node --test tests/*.test.js`: **5 Testsuiten bestanden**, keine fehlgeschlagenen Tests. Enthaltene Prüfungen:

- Rolle/MFA: Admin ohne AAL2, Viewer mit Schreibversuch, Editor mit Publish-/Benutzer-/Auditversuch und gesperrte Konten abgewiesen.
- HTTP-Funktion mit simulierten Supabase-/GitHub-/Resend-Antworten: fremder Origin, widerrufene Session und unzulässige Rolle scheitern vor GitHub-Schreibzugriff.
- GitHub-Konflikt: fremde Datei-SHA führt zu 409 und Freigabe der Sperre. Erfolgsfall schreibt ausschließlich `data/drinks.json`, prüft SHA und Branch, überträgt alle 130 Einträge und aktualisiert Entwurfsversion.
- Echte PostgreSQL-Engine über PGlite: beide Migrationen ausführbar mit nachgebildetem Auth-Schema; anon/authenticated dürfen weder Tabellen lesen noch Server-RPC aufrufen; veraltete Entwurfsversion wird verworfen; letzter Admin kann nicht entfernt werden; Audit kann nicht geändert/gelöscht werden; Rate-Limit greift; öffentlicher Mail-Hook liefert 403.
- Session-ID/Nutzer-Zuordnung und gelöschte Session; Auth-Audit-Übernahme kopiert keine Tokens aus Payloads.
- Aktuelle Karte mit 130 Einträgen wird akzeptiert; negative/ungültige Preise, fremde Kategorie, Pfad-Traversal, HTML/SVG und falsche Rasterbildsignatur werden abgewiesen.
- Syntaxprüfung von Admin-JavaScript und Backend-TypeScript unter Node 24 bestanden.
- Bibliothek 2.105.0 lokal aus festgelegtem npm-Paket erzeugt, MIT-Lizenz beigelegt. Kein externes Runtime-CDN.
- Browser: ohne Konfiguration verständlicher Einrichtungsstatus, Online-Editor verborgen, keine Konsolenfehler. Lokaler Entwurfsmodus nach Bestätigung geöffnet. Nach erneutem Laden wieder geschlossener Editor, keine Konsolenfehler.

Die fünf Tests sind automatisierte Gruppen mit mehreren Assertions, keine fünf vollständig durchgeführten Live-Nutzerabläufe. HTTP-Anbieter sind simuliert. PGlite ersetzt keinen Test der tatsächlich bereitgestellten Supabase-Auth-Version.

## Nicht durchgeführt / Live-Freigabe offen

Keine Konten vorhanden; auf Wunsch des Eigentümers noch nicht erstellt. Kein Supabase-Deployment, keine GitHub-Schreiboperation und keine E-Mail. Auth-/Recovery-/MFA-/Passkey-Abläufe gegen echte Anbieter einschließlich Auth-Mail-Hook, Session-Widerruf, Zustellung und mobile WebAuthn-Geräte sind deshalb nicht als erfolgreich abgenommen markiert. Die vollständige Live-Checkliste steht in `backend-setup.md`.

Die öffentliche Gästekarte samt PDF-Import und vorhandenen Bildern bleibt unverändert. Vorherige Gästetests siehe `verification.md`. Der jetzige Stand ergänzt Administration und Dokumentation; kein neues Gästedesign.

## Bewusste Grenzen

Passkeys experimentell und standardmäßig aus; AAL2/TOTP für Serveraktionen erforderlich. Keine eigene Recovery-Code-Ausgabe/MFA-Reset-Oberfläche, kein externer Audit-Siegelservice, keine vollständige serverseitige Bild-Neukodierung. Kein separater Asset-Upload; Bilder können als begrenzte Rasterdaten im JSON veröffentlicht oder weiterhin im Repository abgelegt werden. Resend benötigt eine verifizierte Absenderdomain für Mitarbeiter-Mails. Supabase Free kann bei Inaktivität pausieren. Diese Grenzen ändern nichts am implementierten Server-Autorisierungssystem.
