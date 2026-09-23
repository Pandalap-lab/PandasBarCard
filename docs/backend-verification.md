# Prüfungen zum Supabase-Inhaltsumbau

Automatisierte Tests: acht Tests mit weiteren Einzelprüfungen erfolgreich. Enthalten sind aktive Sitzung, MFA, Rollen, Ablehnung falscher Origin, Datenvalidierung, private Tabellenrechte, Schutz vor veralteter Veröffentlichung, öffentliche Leserechte ohne Schreibrechte, Audit und gemeinsame Transaktion.

Die HTTP-Tests simulieren externe Dienste; die SQL-Tests führen die Migrationen in PGlite/PostgreSQL aus. Sie ersetzen keine Live-Anmeldung oder Prüfung auf echten Mobilgeräten. Live-Ergebnisse stehen in `live-setup-status.md`.

Nicht abgeschlossen bleiben der externe Mailversand und produktive Passkeys. Fehler beim Benachrichtigen dürfen eine bereits abgeschlossene Veröffentlichung nicht rückgängig machen; die Oberfläche und das Audit melden diese getrennt.
