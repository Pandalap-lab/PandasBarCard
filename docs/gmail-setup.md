# Gmail-Versand – Vorbereitung

Absender: pandasbarcard.mail@gmail.com. Die Gmail-Anbindung ist lokal implementiert und getestet, noch nicht live aktiviert. Der bestehende Auth-Mail-Hook bleibt bestehen: nur Administratoren können Einrichtungs-/Reset-Links über das Backend versenden.

## Google-Einrichtung

Im neuen Absenderkonto ein eigenes Google-Cloud-Projekt ohne Abrechnungskonto oder Testabo anlegen, Gmail API aktivieren, OAuth-Anwendung konfigurieren. Ausschließlich `https://www.googleapis.com/auth/gmail.send` anfordern. Der Eigentümer bestätigt die Freigabe bei Google. Der Empfänger der Einladungen benötigt kein Google-Konto.

Für dauerhaften Betrieb nicht im OAuth-Testmodus belassen: Refresh-Tokens laufen dort nach sieben Tagen ab. Googles Anforderungen an Veröffentlichung/Verifizierung prüfen; weder eine Warnung umgehen noch eine dauerhafte Token-Gültigkeit garantieren. Bei Widerruf, Passwortänderungen oder anderen Google-Sicherheitsereignissen kann eine erneute Autorisierung nötig werden.

## Nur serverseitige Konfiguration

In Supabase Secrets: `MAIL_PROVIDER=gmail`, `MAIL_FROM=pandasbarcard.mail@gmail.com`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`. `SECURITY_EMAIL` ist die vom Eigentümer bestimmte Empfängeradresse für Sicherheitsmeldungen. Kein Gmail-Passwort erforderlich. Client-Secret, Token und Einrichtungslinks weder in Chat-Ausgaben noch in GitHub/Pages speichern.

Der Server tauscht den Refresh-Token gegen einen kurzlebigen Zugriffstoken und sendet eine UTF-8-MIME-Nachricht über HTTPS. Keine Posteingangs-Leserechte. Keine automatischen Wiederholungen bei unklarem Versandergebnis, um doppelte Nachrichten zu vermeiden. Gmail bestätigt API-Annahme, nicht die Zustellung im Posteingang.

## Prüfung vor Freigabe

Versand ausschließlich an einen ausdrücklich bestätigten Empfänger testen. Danach Einrichtungslink für den neu angelegten Admin senden und Empfang/Festlegen des Passworts/2FA durch den Empfänger prüfen. Bisher wurde mit der neuen Gmail-Anbindung keine E-Mail verschickt.

Quellen: https://developers.google.com/workspace/gmail/api/guides/sending und https://developers.google.com/identity/protocols/oauth2/web-server

## Google-Status (23.09.2026)

Google-Projekt `lucid-diode-509518-k7`, App `PANDAsBarCard Mail`, Client `PANDAsBarCard Mail Server`. Eigentümer hat Cloud-Bedingungen, API-Nutzerdatenrichtlinie sowie Erstellung der Sendefreigabe und geschützte Speicherung in Supabase bestätigt. Gmail API aktiviert, ausschließlich gmail.send konfiguriert, OAuth-Status „In Produktion“. Keine Abrechnung und kein Testabo aktiviert.

App-Informationen und Datenschutzhinweise: /admin/mail-info.html. Einmalige Autorisierung über Googles OAuth Playground mit eigenen Clientdaten und Offline-Zugriff. Client-ID und Clientsecret als GMAIL_CLIENT_ID und GMAIL_CLIENT_SECRET in Supabase Secrets gespeichert (im Dashboard bestätigt). Google zeigt beim Absender eine Warnung zur nicht überprüften App; Eigentümer muss diesen Schritt persönlich übernehmen. Noch kein Refresh-Token übernommen, keine Gmail-Mail versendet. Live-Backend noch nicht auf Gmail umgestellt.
