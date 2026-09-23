# Backend-Entscheidung – 23. September 2026

Supabase bleibt der gewählte Dienst. Das vorhandene Projekt enthält Authentifizierung, Rollen, serverseitige Funktionen, PostgreSQL und jetzt auch Bildspeicher. GitHub Pages liefert weiterhin die statische Oberfläche aus. Änderungen an Preisen und Bildern werden in Supabase veröffentlicht; ein GitHub-Token wird dafür nicht mehr verwendet.

## Daten und Veröffentlichung

`bar_draft` enthält den geschützten gemeinsamen Entwurf. `bar_published` enthält ausschließlich den ausdrücklich veröffentlichten Kartenstand und erlaubt Gästen nur Lesen. `bar_members`, `bar_audit`, `bar_rate` und Auth-Daten bleiben geschützt. Die Edge Function kontrolliert aktive Sitzung, Benutzerrolle und AAL2 vor jedem Verwaltungszugriff. Veröffentlichungen prüfen die Entwurfsversion und aktualisieren Karte, Entwurfsversion und Audit-Eintrag gemeinsam in einer Datenbanktransaktion.

Neue Fotos liegen zunächst im privaten Bucket `bar-drafts`. Die Adminvorschau erhält zeitlich begrenzte Bildlinks (eine Stunde); diese Links berechtigen nur zum Lesen des jeweiligen Bilds, nicht zum Adminzugriff. Beim ausdrücklichen Veröffentlichen werden Fotos in den öffentlichen Bucket `bar-published` kopiert. Sie sind ab dem Kopierschritt öffentlich; bei einem anschließenden Versionskonflikt können unreferenzierte Bildkopien verbleiben. Dateinamen basieren auf SHA-256, vorhandene Bilder werden nicht überschrieben. Auch ältere veröffentlichte Bilder bleiben öffentlich; das Ausblenden eines Drinks löscht keine Bilddateien.

## Kostenloser Tarif und Grenzen

Free: 500 MB Datenbank, 1 GB Dateispeicher, 50.000 monatlich aktive Auth-Benutzer, 500.000 Edge-Aufrufe, 5 GB ungecachter sowie 5 GB gecachter ausgehender Datentransfer monatlich. Bilder werden optimiert und langfristig zwischengespeichert. Der aktuelle kleine Bestand passt in die Speicherlimits. Laufende Kosten sind im Free-Tarif nicht zu erwarten; das mögliche Besucheraufkommen ist aber noch unbekannt. Grenzüberschreitungen können Dienste einschränken; kein kostenpflichtiges Upgrade wird automatisch durch diese Anwendung gebucht. Inaktive kostenlose Projekte können pausiert werden.

## Verfügbarkeit und Wechsel

Gäste laden den veröffentlichten Stand direkt aus Supabase. Bei Verbindungsfehlern wird der letzte gespeicherte Stand beziehungsweise die mitgelieferte Ersatzkarte angezeigt, deutlich mit Aktualisierungs- und Preishinweis. Das ist keine Garantie für stets aktuelle Offlinepreise.

Ein Wechsel bleibt möglich: PostgreSQL exportieren, JSON-Kartendaten und die zwei Bildbereiche sichern, Auth-Benutzer migrieren beziehungsweise Zugang neu einrichten, URL-Anbindung ersetzen. Die Oberfläche verwendet einfache JSON-Daten ohne Frameworkbindung. GitHub enthält weiterhin Code und den klar gekennzeichneten Ersatzstand; daher liegen nicht ausschließlich in Supabase Kopien der Inhalte.

Quellen: [Tarife](https://supabase.com/pricing), [Bildbereiche](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Datentransfer](https://supabase.com/docs/guides/storage/serving/bandwidth).
