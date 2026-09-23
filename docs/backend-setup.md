# Backend einrichten und aktualisieren

Das bestehende Supabase-Projekt `owsbknyknzaihxtnutyk` ist eingerichtet. Kein neues Konto und kein kostenpflichtiger Tarif erforderlich. Authentifizierung/2FA und der Administrator bleiben unverändert.

1. Vor Änderungen den öffentlichen Kartenstand und den Serverentwurf sichern; Entwurfsversion vergleichen.
2. Migrationen 001/002 bestehen bereits live. Migration 003 ergänzt `bar_published`, die atomare Veröffentlichungsfunktion und zwei Bildbereiche. SQL-Migrationshistorie vor CLI-Nutzung abgleichen.
3. Bestandsfotos unverändert übernehmen, anhand SHA-256 benennen. Private Entwurfsreferenzen und öffentliche Snapshot-URLs getrennt halten. Originaldateien nicht löschen.
4. Den bestehenden öffentlich sichtbaren Datenstand einmalig in `bar_published` übernehmen; gemeinsame Entwürfe nie ungeprüft überschreiben. Bootstrap muss erwartete Version prüfen.
5. Edge Function `bar-admin` aus dem aktuellen Code bereitstellen. Sie verifiziert Auth-Token selbst; Legacy-JWT-Prüfung im Dashboard bleibt wie bisher aus. Service-Schlüssel bleiben nur serverseitig.
6. Aktualisierte Website-Dateien in GitHub veröffentlichen. `admin/config.json` enthält ausschließlich Supabase-URL, Publishable Key und den Passkey-Schalter.
7. Lesen als Gast, verweigerte Gast-Schreibzugriffe, privater Bildschutz und Anmeldung/Entwurf/Vorschau/Veröffentlichen als Administrator prüfen.

## Geheimnisse

`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` kommen aus der Plattform. Der frühere `GITHUB_TOKEN` ist für dieses Backend nicht mehr erforderlich. Gmail-Versand ist eingerichtet: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `MAIL_PROVIDER`, `MAIL_FROM` und `SECURITY_EMAIL`. Resend ist nicht erforderlich. Siehe gmail-setup.md. Keine Secrets in GitHub Pages oder Chat kopieren.

## Sicherung und Rückweg

Vor jedem Umbau Karte als JSON und Bilder exportieren. PostgreSQL/Audit zusätzlich separat sichern. Der alte GitHub-Kartenstand bleibt als Fallback vorhanden. Ein Frontend-Rollback allein stellt keine neuen Supabase-Inhalte nach GitHub zurück; vorher den gewünschten öffentlichen Snapshot exportieren. Nicht benötigte Bilder werden nicht automatisch gelöscht, damit ältere Stände rekonstruierbar bleiben.
