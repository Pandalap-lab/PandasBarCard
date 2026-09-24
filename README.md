# PANDAsBarCard

Digitale Gästekarte für First Floor, Wien. Die aktuelle Karte basiert auf `Karte26 2.pdf`: 130 Einträge in 21 Kategorien. Rezepte aus der früheren PDF bleiben zugeordnet. Preise und Namen wurden durch diesen Umbau nicht verändert.

## Architektur

QR-Code → GitHub Pages → veröffentlichte Kartendaten und Fotos aus Supabase.

`/admin/` → Passwort + TOTP oder gerätebestätigter Passkey → serverseitige Rollenprüfung → geschützter Entwurf → Vorschau → **ÄNDERUNGEN VERÖFFENTLICHEN** → Supabase-Datenbank und Bildspeicher.

GitHub verwaltet nur noch die Website-Versionen und einen gekennzeichneten Ersatzstand. Für das Veröffentlichen von Kartendaten ist kein Repository-Schreibzugriff mehr nötig. Der zuvor eingerichtete GitHub-Token „PandasBarCard Supabase Publishing“ wurde am 23.09.2026 widerrufen und der ungenutzte GITHUB_TOKEN-Eintrag aus Supabase Secrets entfernt.

## Sicherheit und tatsächlicher Status

- Anmeldung, TOTP/AAL2 oder serverseitig bestätigte Passkey-Geräteprüfung, aktive Sitzungsprüfung, Rollen admin/editor/viewer und serverseitige Autorisierung: implementiert.
- Entwürfe, Benutzer und Audit: für Gäste gesperrt. Öffentliche Tabelle `bar_published`: nur lesbar.
- Fotos: private Entwürfe, veröffentlichte Kopien im öffentlichen Bildbereich. Keine Browser-Schreibrechte auf Storage.
- Veröffentlichung: Versionskontrolle und Transaktion mit Audit. Gleichzeitige Änderungen werden nicht still überschrieben.
- Passwortänderung und administrativer Reset: implementiert. Öffentliche Recovery-Mails blockiert. **Gmail-Versand ist eingerichtet; der Zugangstest des zweiten Administrators wird auf Nutzerwunsch später durchgeführt.**
- Benachrichtigungen/Sicherheitsmails: Gmail-Anbindung mit serverseitiger OAuth-Sendefreigabe bereitgestellt. Empfänger für Sicherheitsmeldungen: noname.g8@gmail.com; Testmail versendet und Empfang vom Eigentümer bestätigt; Fehler werden protokolliert.
- Passkeys: am 23.09.2026 in Supabase aktiviert, Domain `pandalap-lab.github.io`, Origin `https://pandalap-lab.github.io`. Registrierung und Anmeldung in der Adminseite eingebunden. Supabase kennzeichnet die Funktion als experimentell. Persönliche Passkey-Registrierung und bisherige Anmeldung wurden vom Nutzer bestätigt. Der Nutzer hat den Direktzugang per Passkey ohne zusätzlichen Code bestätigt. Passwort-Anmeldungen benötigen weiterhin TOTP/AAL2. Die Passkey-Anmeldung prüft zusätzlich die signierte Gerätebestätigung; Rollenprüfung bleibt erhalten.
- Keine Passwörter, Service-Schlüssel oder GitHub-Tokens im Browser. Publishable Key ist absichtlich öffentlich.

## Bedienung und Gestaltung

Vertikales Scrollen durch Kategorien, horizontales Wischen durch Drinks. Kategorienleiste fest oben und horizontal scrollbar. Bilder erhalten einen begrenzten Bereich oberhalb des Namens. Cocktailfotos verwenden eine gemeinsame elliptische CSS-Transparenzmaske direkt auf der proportional skalierten Bildfläche, einschließlich der Detailansicht. Das Zentrum bleibt ungefiltert; alle vier Ränder laufen vollständig transparent aus. Identische Standard- und WebKit-Maskenregeln gelten für alle Bildschirmgrößen. Weichere Übergänge, ein Prozent größere Basisschrift. Aa-Schriftvergrößerung, Kontrast, reduzierte Bewegung und Pinch-Zoom bleiben erhalten. Die Browser-Adresszeile lässt sich durch eine normale Webseite nicht verlässlich ausblenden und ist kein Authentifizierungsmechanismus.

Bei Ausfall der Datenverbindung zeigt die Seite einen deutlich gekennzeichneten gespeicherten oder mitgelieferten Ersatzstand. Preise dann vor Ort bestätigen.

## Entwicklung und Übergabe

`node --test tests/*.test.js` prüft Rollen/MFA, HTTP-Abweisung, Datenvalidierung, Datenbankrechte, Versionskonflikte, Audit und atomare Veröffentlichung. Tests verwenden PGlite und HTTP-Mocks; Liveprüfungen sind separat dokumentiert.

Die SQL-Migrationen liegen unter `supabase/migrations`, der Backend-Code unter `supabase/functions/bar-admin`. Live wurden die ursprünglichen Migrationen über den SQL Editor installiert; ein blindes `db push` kann deshalb doppelte Migrationen verursachen. Vor weiteren Migrationen den Livezustand abgleichen.

[Backend-Entscheidung und kostenlose Limits](docs/backend-decision.md) · [Einrichtung](docs/backend-setup.md) · [Live-Status](docs/live-setup-status.md).

## Gmail-Versand

Der Gmail-API-Adapter ist live eingerichtet. 13 automatisierte Tests bestehen einschließlich UTF-8-Mailaufbau, Schutz vor Header-Manipulation und serverseitigem Tokenaustausch. Testversand und Empfang wurden vom Eigentümer bestätigt. Siehe [Gmail-Einrichtung](docs/gmail-setup.md).


## A5-Druckkarte als PDF

Unter „Druckkarte als PDF“ können Administratoren und Bearbeiter die aktuelle veröffentlichte Karte oder den Arbeitsentwurf herunterladen. Voreinstellung: veröffentlichte Karte; im Onlinemodus wird sie vor dem Export neu vom Backend gelesen. Entwürfe erhalten einen klaren Entwurf-Vermerk. Ungespeicherte Formularänderungen müssen vor einem Entwurfsexport lokal gespeichert werden. Der Export veröffentlicht oder verändert keine Daten.

A5-Hochformat (148 × 210 mm), ruhiger brauner Hintergrund, goldene Überschriften/Preise und helle Schrift. Enthalten sind Kategorien, Getränkenamen, Zutaten, vorhandene Portionsangaben und Preise, keine Bilder. Fehlende Preise bleiben „Preis offen“; pausierte Drinks folgen der Anzeigeeinstellung. Text bleibt im PDF auswählbar; Seitenumbrüche und Fortsetzungsüberschriften werden automatisch erzeugt. Schrift unterstützt westliche europäische Zeichen; nicht unterstützte Zeichen melden einen Fehler, statt Inhalte still zu entfernen. PDF-Erstellung lokal im Browser mit gebündeltem pdf-lib 1.17.1, ohne externen PDF-Dienst. Build: `node scripts/vendor-pdf.mjs`. Druck: A5 und tatsächliche Größe / 100 %. Hintergrund ist bereits Bestandteil der PDF.

Prüfung: 12 automatisierte Tests bestanden, A5-Seitengröße und vollständige Eintragszahl geprüft, alle 19 Beispielseiten visuell kontrolliert. Beispiel basiert auf 130 Einträgen. Online-Administration weiterhin mit Rollenprüfung und MFA; Nur-Lesen-Rolle erhält keine zusätzlichen Rechte durch den Export.


Gmail-Status 23.09.2026: Google-Freigabe erteilt, sechs Mail-Konfigurationswerte in Supabase Secrets gespeichert, neue Edge Function bereitgestellt. Testmail an noname.g8@gmail.com versendet, Empfang vom Eigentümer bestätigt. Empfänger für Test und Sicherheitsmeldungen bestätigt: noname.g8@gmail.com. Unter Benutzerverwaltung steht Administratoren „Test-E-Mail senden“ zur Verfügung. Der Test schreibt einen Audit-Eintrag und versendet nur an den konfigurierten Empfänger. 13 automatisierte Tests bestanden. Versand und Empfang der Testmail vom Eigentümer bestätigt. Siehe [Gmail-Einrichtung](docs/gmail-setup.md).


## Symbole für den Handy-Startbildschirm

Gästekarte und Administration verwenden das Panda-Kopf-Martiniglas-Symbol unter assets/app-icons. Separate Manifeste und Startadressen: „Drinks“ öffnet die Gästekarte, „Bar Admin“ öffnet /admin/. Apple-Touch-Icon 180 px, Android-/Manifest-Icons 192 und 512 px, Browsericon 32 px. Die beiden Manifeste haben unterschiedliche aufgelöste IDs und starten ohne Vorschau- oder Anmeldetoken in der URL. Standalone-Darstellung wird angefragt; die tatsächliche Darstellung bestimmt der Browser. Anmeldung, MFA und Berechtigungen bleiben erforderlich. Kein zusätzlicher Offline-Cache für Admin- oder Zugangsdaten.

iPhone: gewünschte Seite in Safari öffnen → Teilen → Zum Home-Bildschirm → Hinzufügen. Beide Seiten separat hinzufügen. Bereits gespeicherte Verknüpfungen gegebenenfalls vom Home-Bildschirm entfernen und neu hinzufügen, wenn iOS noch das alte Symbol zeigt. Android: gewünschte Seite in Chrome öffnen → Menü → Zum Startbildschirm hinzufügen / App installieren (Bezeichnung je nach Version).

Bild mit der integrierten Bildgenerierung erzeugt, anschließend ausschließlich in die technischen Icon-Größen verkleinert. Finales Briefing: freundlicher, frontal ausgerichteter Panda-Kopf und nach links geneigtes vollständiges Martiniglas mit goldfarbenem Cocktail und Olive, ohne Körper, Kleidung, Hände, Schrift oder weitere Symbole; dunkler espresso-brauner Hintergrund. Das finale Original und alle Größen sind im Projekt gespeichert. Vollständiges Bildbriefing: docs/app-icon-prompt.txt.

## Face ID / Passkeys

Auf dem eigenen iPhone die Adminseite in Safari öffnen, mit Passwort und TOTP anmelden und unter Kontosicherheit „Face ID / Passkey einrichten“ wählen. Die Geräteabfrage selbst bestätigen. Danach „Mit Passkey anmelden“ verwenden. Face ID, Touch ID oder Gerätesperre werden vom Gerät gewählt; biometrische Daten verlassen das Gerät nicht. Bestehende Rollen bleiben erforderlich. Für den normalen Adminzugang genügt der serverseitig geprüfte Passkey mit Gerätebestätigung; Passwort- und Passkey-Verwaltung erfordern weiterhin TOTP/AAL2. Bei einem späteren Domainwechsel müssen Passkeys für die neue Domain erneut registriert werden. Passwort/TOTP bleiben der Rückweg.

Prüfung am 23.09.2026: 13 automatisierte Tests erfolgreich. Mobile Browseransicht 390 × 844: Kategorienwechsel, horizontaler Drinkwechsel (2/5), feststehende Kategorienleiste und keine horizontale Seitenüberbreite geprüft. Physische iPhone-Gesten bleiben am echten Gerät zu prüfen. Der Nutzer hat die bisherige Passkey-Anmeldung bestätigt; der Direktzugang ohne zusätzlichen Code wurde inzwischen ebenfalls vom Nutzer bestätigt.

## Weitere vorgemerkte Arbeiten

Die bisher vorgemerkte Aufteilung der Administration ist mit dem Dashboard vom 24.09.2026 umgesetzt (siehe unten). Persönliche Gerätetests und der Zugangstest des zweiten Administrators bleiben separat.

Ebenfalls für später vorgemerkt: QR-Code für die feste Gästekarten-URL https://pandalap-lab.github.io/PandasBarCard/ erstellen und Scan mit iPhone/Android prüfen. Kein Admin-Link und kein temporärer Vorschau-Link.

## Passkey-Direktzugang ohne zusätzlichen Code

Der Browser fordert WebAuthn mit `userVerification: required` an. Die Edge Function prüft die signierten UP/UV-Flags und den Origin, lässt Supabase die vollständige Assertion einschließlich Signatur, Challenge, Ablauf und Einmaligkeit validieren und speichert erst dann eine Freigabe für exakt die neu ausgegebene Auth-Sitzung. Vom Browser gelieferte Tokens oder Freigabe-Flags werden dafür nicht akzeptiert.

`bar_passkey_sessions` ist durch RLS und Datenbankrechte ausschließlich für den Server zugänglich. Die Freigabe gilt höchstens acht Stunden und endet früher bei beendeter Auth-Sitzung; Rollen und Kontosperren werden weiterhin pro Anfrage geprüft. Der tatsächliche Supabase-AAL-Wert wird nicht verändert. Passwort-Anmeldung ohne TOTP bleibt gesperrt. Für Passwort-/Passkey-Änderungen bleibt die zusätzliche Sicherheitscode-Freigabe erhalten. Keine biometrischen Daten werden gespeichert. Authentifizierungsdaten bleiben nur im Arbeitsspeicher des Browsers.

18 automatisierte Prüfungen bestehen einschließlich gefälschter UV-Antwort, abgelehnter Provider-Signatur, Rollen, Kontosperren, abgelaufener/widerrufener Sitzung und Datenbankzugriffsschutz. Live: neue Tabelle und RPC ohne Anmeldung nicht zugänglich; unbestätigte Passkey-Anfrage 403; Adminanfrage ohne Anmeldung 401. Persönlicher Direktlogin ohne zusätzlichen Code wurde vom Nutzer bestätigt.

Quelle der Provider-Prüfung: https://github.com/supabase/auth/blob/master/internal/api/passkey_authentication.go ; Supabase Passkeys: https://supabase.com/docs/guides/auth/passkeys


## KI-Bilder: dezenter Hinweis

Im bestehenden Footer der öffentlichen Karte steht „Cocktailbilder teilweise KI-generiert.“ Klein (0,75 rem), in der vorhandenen dezenten Textfarbe und ohne Badge, Popup oder Überlagerung. Zweck ist transparente Information. Die Bildmasken, Fotos, Detailansicht, Typografie der Drinks und Animationen bleiben unverändert.

## Besucherstatistik / Seitenaufrufe

Ein einmalig ausgeführtes, unabhängiges Modul `js/pageviews.js` zählt pro vollständigem Laden der produktiven Gästekarte (`/PandasBarCard/` oder `/PandasBarCard/index.html`) einen Seitenaufruf. Ein vollständiges Neuladen zählt erneut. Keine eindeutigen Personen/Besucher: keine Erkennung wiederkehrender Geräte. Drink öffnen/schließen, Kategorien, Scrollen und sonstige Interaktionen lösen keine Zählung aus. Adminseite, lokale Entwicklung und `?preview` zählen nicht. Wiederherstellung aus dem Browser-Zurück-Cache führt das Modul nicht erneut aus und zählt deshalb nicht erneut.

Die bestehende Supabase Edge Function `bar-admin` akzeptiert die öffentliche Aktion `pageview` vom konfigurierten Origin. Sie erhöht atomar per `bar_count_pageview()` einen Tageszähler in `public.bar_pageviews`. Gespeichert werden ausschließlich `day` (Datum) und `views` (Anzahl). Tagesgrenze ist Europe/Vienna einschließlich Sommer-/Winterzeit. Keine Besucher-ID, Cookies, IP-Adresse, Gerätekennung, E-Mail, Referrer, einzelnen Zeitstempel oder Besuchsprofile in der Statistik. Die regulären Betriebslogs des Hosting-/Backend-Anbieters sind davon unabhängig. Kein externer Analysedienst.

Die zusätzliche, globale Missbrauchsbegrenzung nutzt die vorhandene Tabelle `bar_rate`: fester Schlüssel `pageviews-global`, Zeitfenster und Anzahl; keine Besucherkennung. Maximal 600 Zählanfragen pro Minute insgesamt. Ein öffentlicher Zähler ist kein botbereinigtes Analyseverfahren: automatisierte Aufrufe können enthalten sein; gesperrte/fehlgeschlagene Aufrufe können fehlen. Bei Fehlern oder Zeitüberschreitung wird nicht erneut versucht. Der Aufruf läuft unabhängig von der Karteninitialisierung, mit maximal vier Sekunden pro Netzwerkschritt. Fehler werden still abgefangen, ohne die Gästekarte zu blockieren.

**Admin-Dashboard → Besucherstatistik** zeigt über die authentifizierte Aktion `statistics`:

- Heute: aktueller Kalendertag in Wien.
- Letzte 7 Tage: heute und die sechs vorangegangenen Kalendertage.
- Letzte 30 Tage: heute und die 29 vorangegangenen Kalendertage.
- Gesamt: alle gespeicherten Tageswerte seit Aktivierung; keine rückwirkende Schätzung.

Die Statistik benötigt eine aktive, freigeschaltete Sitzung mit TOTP/AAL2 oder verifiziertem Passkey sowie die bestehende Leseberechtigung (admin/editor/viewer). RLS und Datenbankrechte sperren Tabelle und beide RPCs für anon/authenticated. Ausschließlich die Edge Function greift mit der Serverrolle zu. Der öffentliche Zählaufruf liefert keine Zahlen. Bei einem Statistikfehler zeigt die Administration einen Hinweis und „–“ statt falscher Nullwerte. „Statistik aktualisieren“ lädt den aktuellen Stand. Technische Abnahmeaufrufe sind in den Anfangswerten enthalten.

Migration: `supabase/migrations/202609240001_pageviews.sql`. Neue Tabelle: `bar_pageviews`. Neue RPCs: `bar_count_pageview()` und `bar_pageview_stats()`. Zwei zusätzliche Aktionen am bestehenden `/functions/v1/bar-admin`-Endpunkt, keine neuen Dienste, Secrets, Umgebungsvariablen oder Abhängigkeiten. Bestehende `ADMIN_ORIGIN`- und öffentliche Supabase-Konfiguration werden weiterverwendet. Bei einem Hostingwechsel auch die produktive Seitenadresse in `js/pageviews.js` anpassen.

## Admin-Dashboard und responsive Bedienung

Nach vollständiger Anmeldung erscheint „Was möchtest du tun?“ mit sieben gleichmäßig gestalteten Kacheln:

1. Drinks verwalten – vorhandene Drinkformulare einschließlich Preisen, Zutaten, Bildern, Upload, Reihenfolge und Verfügbarkeit.
2. Kategorien verwalten – bestehende Kategorien und Anzeige nicht verfügbarer Drinks.
3. Entwurf & Veröffentlichung – lokaler Status, veröffentlichter Stand, Server laden/speichern, Vorschau und geschütztes Veröffentlichen.
4. Druckkarte als PDF – bestehender A5-Export aus veröffentlichtem Stand oder Arbeitsentwurf.
5. Besucherstatistik – ausschließlich aggregierte Seitenaufrufe.
6. Benutzer & Protokoll – vorhandene Benutzerverwaltung, Resetversand, Testmail und Audit; nur Administratoren.
7. Einstellungen & Sicherheit – vorhandener Datenimport/-export, Kontosicherheit, Sitzungsabmeldung und Passkeys.

Bilder und Preise bleiben bei den Drinks, ohne zusätzliche Kacheln. „← Dashboard“ ist in jedem Bereich vorhanden. Nur ein Bereich ist gleichzeitig geöffnet. Hash-Navigation wird gegen die angemeldete Rolle geprüft; sie ersetzt keine serverseitige Autorisierung. Vor Anmeldung wird kein Dashboard initialisiert. Entwurfsformulare bleiben beim Bereichswechsel erhalten; es findet kein automatisches Speichern oder Veröffentlichen statt. Beim Wechsel des ausgewählten Drinks bleibt die vorhandene Rückfrage bei ungespeicherten Änderungen bestehen.

Der lokale Entwurfsmodus bleibt erhalten, ohne Besucherstatistik/Benutzerzugriff/Online-Veröffentlichung. Lesen-Rolle: Drink-, Kategorie- und Datenänderungen sind gesperrt; Online-Schreibrechte werden zusätzlich unverändert serverseitig geprüft. Authentifizierung, MFA, Passkey-Geräteprüfung, Sitzungsprüfung und bestehende Rollen wurden nicht ersetzt.

Layout: eine Kachelspalte unter 640 px, zwei ab 640 px und drei ab 900 px. Einheitliche Kachelhöhen innerhalb des Grids, maximal 1100 px Inhaltsbreite, mindestens 48 px große Aktionsflächen, 16 px Eingabeschrift, umbrechende Texte. Mobile Formulare stehen untereinander; die Drinkliste ist auf 260 px Höhe begrenzt. Die Auswahl eines Drinks bringt auf kleinen Bildschirmen das Formular in Sicht. Ab 900 px stehen Liste und Editor nebeneinander. Tabletformulare nutzen bei ausreichender Breite zwei Spalten. Zoom bleibt erlaubt. Zurück-Navigation ist am oberen Rand fixiert; längere Formulare bleiben normal scrollbar.

Umsetzung: `js/admin-dashboard.js` gruppiert vorhandene DOM-Komponenten und erhält deren Ereignisse und Geschäftslogik; `css/admin.css` ergänzt die responsive Darstellung. Keine neue Benutzerrolle oder externe UI-Bibliothek. Die Backend-Erweiterung betrifft nur die Statistik.

Abnahme und genaue Dateiliste: [Änderungs- und Prüfprotokoll vom 24.09.2026](docs/dashboard-statistics-checks.md).
