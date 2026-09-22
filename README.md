# PANDAs BarCard / First Floor

Weiterentwicklung des bestehenden Projekts. `Barkarte_Demo/` und die originale PDF bleiben unverändert. Die öffentliche Karte startet jetzt unter `index.html` im Projektstamm.

## Inhalt und Quellen

46 Drinks, 10 Kategorien aus **Receipes New Menu_Bar.pdf**, 7 Seiten. `data/drinks.json` enthält für jeden Drink einen Seitenverweis, Zutaten mit Mengen, Zubereitung, Glas und Garnitur. PDF-Schreibweisen bleiben weitgehend erhalten. Durch die PDF-Schriftkodierung verlorene Zeichen wurden nach visueller Prüfung ergänzt (u.a. Rosé, Patrón, Nüssle und ½). Beschreibungen, Fotos und Preise fehlen in der PDF. Deshalb keine erfundenen Preise, Fotos oder Werbetexte: Preis auf Anfrage; klar beschriftete neutrale Glaszeichnung bis ein Originalfoto vorliegt. Batch-Zutaten sind als unvollständig markiert. Optionales Eiweiß bleibt optional in der Zutatenliste. Es werden keine Allergen- oder Alkoholangaben abgeleitet.

Quellen: https://www.firstfloorbar.at/ und https://www.firstfloor.wien/ (gleicher Barauftritt), https://www.instagram.com/firstfloorbar/ (einzelne Beiträge erfordern Anmeldung). Onlinekarte und PDF unterscheiden sich. Webpreise sind deshalb nicht übernommen. Es wurden keine Fotos eindeutig den 46 Rezepten zugeordnet. Die Wortmarke ist typografisch gesetzt und kein nachgebautes offizielles Logo. Warme Farben und Serifenschrift greifen den gewünschten Bar-Charakter auf.

## Lokal öffnen

Mit einem statischen Webserver aus diesem Ordner starten, z.B. `python -m http.server 8080`, dann `http://localhost:8080/`. Doppelklick über file:// unterstützt das Laden der JSON-Daten nicht zuverlässig.

## GitHub Pages

Den Inhalt dieses bestehenden Projektordners in das gewünschte Repository hochladen. In Settings > Pages die Veröffentlichung aus dem Stammordner der gewünschten Branch aktivieren. Alle lokalen Pfade sind relativ und funktionieren unter `/PandasBarCard/`. `.nojekyll` ist enthalten. Die originale Rezept-PDF und die alte Demo müssen nicht veröffentlicht werden, damit die Seite funktioniert. Vor einem Upload bewusst auswählen, welche dieser internen Quellen öffentlich werden sollen.

Noch nicht veröffentlicht: Repository und endgültige öffentliche URL fehlen. Erst mit der bestätigten Pages-Adresse den Gast-QR-Code erstellen; Ziel ist ausschließlich die Stammseite, niemals `/admin/` oder `?preview=1`.

## Wartung /admin/

Unverlinkte, ausdrücklich ungeschützte lokale Demo. Kein Passwort im Code. Namen, Preise, Beschreibungen, Zutaten, Fotos, Kategorie, Verfügbarkeit und Reihenfolge sind bearbeitbar. Kategorien können erstellt, umbenannt und nach Umzuordnung ihrer Drinks gelöscht werden. Fotos werden zu WebP (max. 1200 px) optimiert; die durchschnittliche Bildfarbe steuert den weichen Hintergrundübergang. Ohne Foto bleibt die neutrale warme Farbwelt. Statusanzeige oder Ausblenden lässt sich wählen.

Speichern schreibt ausschließlich in localStorage dieses Browsers. `?preview=1` zeigt diesen Entwurf; die normale Gastseite lädt immer die veröffentlichte JSON. Lokale Vorschau nach Änderungen neu laden. Export/Import dient zur Sicherung und zum Übertragen der Prototypdaten. Browser-Speicher ist begrenzt: Bildsammlungen müssen später in einen echten Bildspeicher. Speicherfehler werden angezeigt. Der GitHub-Stand wird durch die Demo nicht automatisch verändert.

## Spätere echte Online-Pflege

`js/store.js` trennt Darstellung und Datenzugriff. Für Produktivbetrieb durch einen Dienst mit öffentlichem Lesezugriff auf freigegebene Drinks und serverseitig geprüftem Schreibzugriff für authentifizierte Mitarbeiter ersetzen. Authentifizierung, Rollen, Validierung, Bildspeicherung und Veröffentlichung gehören auf diesen Dienst. Keine Geheimnisse in GitHub Pages. Der Admin-Prototyp muss dann dessen Anmeldung und Schreib-API verwenden. Änderungen können danach automatisch in der Gastseite geladen werden; derzeit kein Live-Sync.

## Gestaltung und Bedienung

Native horizontale Scroll-Snap-Ansicht, Kategorien, Nachbar-Drinks, Detaildialog mit Fokusführung und Escape, runder Glas-Schließknopf, Safe Areas, reduzierte Bewegung, asynchrones/lazy Bildladen. Keine Frameworks, externen Schriften oder Analysedienste. Öffentliche Ansicht ohne Wartungslink.

## Aktualisierung: echtes Seitenscrollen
Alle Kategorien sind als vertikale Abschnitte vorhanden. Native Touchgesten scrollen die Seite vertikal und die Drinkreihen horizontal. Die klebende Kategorienleiste springt zum Abschnitt und verfolgt die Scrollposition. Das vom Nutzer bereitgestellte Foto assets/FirstP.jpg ist der gemeinsame Hintergrund, kein zugeordnetes Drinkfoto.
