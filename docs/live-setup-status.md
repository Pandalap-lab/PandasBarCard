# Live-Status – 23. September 2026

## Eingerichtet

- Supabase-Projekt `owsbknyknzaihxtnutyk`, Free-Tarif; keine kostenpflichtige Option gebucht.
- Administrator vom Eigentümer angelegt; Rolle freigegeben, TOTP vom Eigentümer eingerichtet. AAL2-Anmeldung wurde vor dem Inhaltsumbau live geprüft.
- Öffentliche Registrierung aus, anonyme Anmeldung aus, sichere Passwortänderung an, Mindestlänge 12, E-Mail-OTP 15 Minuten. Auth-Mail-Hook gegen öffentlichen Recovery-Versand aktiv.
- SQL-Migrationen 001/002 und Inhaltsmigration 003 über Dashboard installiert. Die SQL-Migrationshistorie wurde nicht nachträglich als CLI-Historie registriert.
- `bar_published`: 130 Einträge und 21 Kategorien übernommen. Alle Namen und Preise stimmen mit der bisherigen Gästekarte überein; UTF-8-Abgleich erfolgreich.
- 16 bestehende Bilder (15 Drinkillustrationen, ein Hintergrund) in privaten und öffentlichen Storage-Bereich übernommen. Alle öffentlichen Dateien per SHA-256 byteidentisch zum Bestand geprüft.
- Gemeinsamer Entwurf bei der Übernahme mit erwarteter Version 1 geschützt aktualisiert; Version danach 2. Vorhandene Originaldateien bleiben erhalten.
- `bar-admin` auf Supabase-Veröffentlichung umgestellt. Kein GitHub-API-Aufruf oder GitHub-Token mehr im Funktionscode. Der frühere Token bleibt bis zum ausdrücklichen Widerruf ungenutzt hinterlegt (Ablauf 23.10.2026).
- Website-Anbindung, Adminoberfläche und Gestaltung in GitHub aktualisiert; live ausgelieferte Dateien auf die neue Anbindung geprüft.

## Tatsächlich geprüft

- Öffentlicher Snapshot: HTTP 200 mit korrektem Bestand.
- Aktuelle Admin-API: Preflight 204, ohne Anmeldung 401, fremder Origin 403.
- Private Tabellen `bar_draft`, `bar_members`, `bar_audit`: ohne Anmeldung HTTP 401.
- Zugriff auf private Bilder über öffentliche Bild-URL: verweigert (HTTP 400).
- Acht automatisierte Tests bestanden: Rollen/MFA/Sitzung, Origin, Validierung, SQL-Rechte, Versionskonflikte, Audit, atomare Veröffentlichung und Bildreferenzvergleich.
- Live-Gästekarte: 130 Einträge, 21 Kategorien; geladenes Drinkbild aus Supabase (1024 Pixel); kein Ersatzstand aktiv.
- Mobile Vorschau 390 × 844 bei „Sehr groß“: keine Überschneidung zwischen Drinkbild und Name, keine horizontale Seitenüberbreite, Kategorienleiste fest bei top=0 und horizontal scrollbar. Kategorienwechsel bis „Signatures“ erfolgreich.

## Noch zu bestätigen / Einschränkungen

- Positiver Live-Test nach erneuter Anmeldung des Eigentümers erfolgreich: 130 Einträge und private Bildvorschau geladen, unveränderten Entwurf gespeichert (Version 3), Veröffentlichung ausgeführt. Öffentlicher Stand 3 wurde per API geprüft: alle Namen, Preise und Zutaten unverändert. UI meldet keine offenen Änderungen. Benachrichtigungsfehler betrifft ausschließlich den fehlenden Maildienst.
- Maildienst/Absender noch nicht eingerichtet: Sicherheits- und Reset-E-Mails können nicht produktiv zugestellt werden. Das Audit protokolliert Versandfehler.
- Passkeys vorbereitet, weiterhin deaktiviert. TOTP bleibt aktiv.
- JWT-Laufzeit 900 Sekunden aus der Vorlage noch nicht im Live-Dashboard verifiziert.
- Physische iPhone-/Android-Gesten und vollständiger Screenreadertest nicht durchgeführt. Aa und Browser-Pinch-Zoom bleiben technisch freigegeben.
