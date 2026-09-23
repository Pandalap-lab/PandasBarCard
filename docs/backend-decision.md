# Backend-Entscheidung – vor Integration, 23.09.2026

Gewählt: Supabase Free (Auth, PostgreSQL, Edge Functions), dazu Resend Free für Transaktionsmails. GitHub Pages bleibt unverändert die öffentliche Auslieferung. Kein kostenpflichtiges Abonnement wird aktiviert.

1. **Eignung:** verwaltete Passwortprüfung, TOTP und serverseitige Benutzerverwaltung; PostgreSQL für Rollen, Entwürfe und Audit. Edge Functions veröffentlichen nach Rollenprüfung ausschließlich die Kartendatei im fest konfigurierten Repository. Keine eigene Passwort-Kryptografie.
2. **Funktionen:** Login, MFA, Passkeys, Benutzer/Rollen/Sperren, Administrator-initiiertes Zurücksetzen, versionierte gemeinsame Entwürfe, Veröffentlichung, Audit und Benachrichtigungen.
3. **Daten:** Auth speichert Konten, Passwort-Hashes, MFA-/Passkey-Daten; PostgreSQL speichert Rollen, Sperrstatus, Entwurfsstände und Ereignisse. Resend erhält Empfänger und Nachrichteninhalt. GitHub erhält veröffentlichte Kartendaten einschließlich Bilder. Keine biometrischen Rohdaten werden übertragen. Schlüssel nur in Backend-Secrets.
4. **Kostenlose Grenzen:** Supabase: 50.000 monatlich aktive Nutzer, 500 MB Datenbank, 5 GB Egress, 1 GB Storage und 500.000 Funktionsaufrufe/Monat. Resend: 3.000 Transaktionsmails/Monat, maximal 100/Tag; verifizierte Absenderdomain erforderlich. Eine neu zu kaufende Domain wäre nicht kostenlos und wird nicht bestellt.
5. **Erwartete Kosten:** bei wenigen Mitarbeitern und gelegentlichen Änderungen voraussichtlich 0 €. Dies ist eine Nutzungsannahme, keine Garantie dauerhaft unveränderter Anbietertarife. Gästebesuche verbrauchen keine Backend-Aufrufe.
6. **Limitüberschreitung:** Free bleibt Free; Einschränkung/Sperre der betreffenden Dienste statt automatischem Tarifwechsel. Fehlgeschlagene E-Mails werden sichtbar protokolliert. Die zuletzt veröffentlichte Gästekarte bleibt online. Supabase kann Free-Projekte nach einer Woche Inaktivität pausieren; dann im Dashboard wiederherstellen. Keine künstlichen Keep-alive-Aufrufe.
7. **Wechsel:** Kartendaten bleiben portables JSON, Datenbank per PostgreSQL-Dump exportierbar, Edge-Code mit Supabase-Adapter austauschbar. Auth kann selbst gehostet werden; bei einem anderen Auth-Anbieter können Passwort-Reset und erneute MFA-/Passkey-Registrierung erforderlich sein. RP-Domain stabil halten.
8. **Vergleich:** Cloudflare Workers/D1 ist gut für kleine APIs, verlangt aber einen zusätzlichen Auth-Baustein; die 10-ms-CPU-Grenze im Free-Tarif eignet sich nicht für selbst implementierte langsame Passwort-Hashes. Firebase serverseitige Functions erfordern den Blaze-Abrechnungstarif. Supabase bündelt die benötigten Serverbausteine ohne diesen Tarifwechsel.

**Einzelne Einschränkung:** Supabase-Passkeys sind laut Anbieter experimentell. Integration erfolgt mit festgelegter SDK-Version, getrennt vom stabilen Passwort/TOTP-Weg. Serveraktionen verlangen weiterhin AAL2/TOTP; Passkey allein hebt diese Prüfung nicht auf. Aktivierung und echte Geräteprüfung stehen vor Live-Freigabe an.

Quellen (geprüft am 23.09.2026):
- https://supabase.com/pricing
- https://supabase.com/docs/guides/functions/pricing
- https://supabase.com/docs/guides/auth/passkeys
- https://supabase.com/docs/guides/auth/auth-hooks
- https://resend.com/pricing
- https://developers.cloudflare.com/workers/platform/limits/
- https://firebase.google.com/docs/functions/get-started

Status bei Entscheidung: noch kein Anbieterprojekt provisioniert, keine Secrets vorhanden, keine Live-Sicherheitsprüfung. Implementierung und Live-Aktivierung werden getrennt dokumentiert.
