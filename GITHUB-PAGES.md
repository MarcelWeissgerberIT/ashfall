# ASHFALL auf GitHub Pages

Ziel: https://marcelweissgerberit.github.io/ashfall/

Das Spiel läuft vollständig im Browser. `npm run build:pages` erzeugt `dist-pages/` mit HTML, JavaScript, Bildern und Audio. Node 22 verwenden. Die bestehende Sites-Version nutzt weiterhin `npm run build`.

## Einmalige Einrichtung

1. Bei GitHub für `MarcelWeissgerberIT/ashfall` anmelden.
2. Unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** wählen.
3. Die Projektdateien auf den Branch `main` dieses Repositorys pushen. Bei GitHub mit der GitHub CLI, GitHub Desktop oder einem Git-Credential-Manager anmelden; keine Zugangsdaten in Dateien oder URLs speichern.
4. Unter **Actions → Publish ASHFALL to GitHub Pages** den erfolgreichen Lauf abwarten. Der Workflow kann auch manuell gestartet werden.

Der Workflow `.github/workflows/pages.yml` baut und veröffentlicht bei jedem Push auf `main`. Die Seitenadresse ist öffentlich, sofern das GitHub-Konto keine gesonderte private Pages-Funktion verwendet.

## Spielstände

Spielstände und Spracheinstellungen liegen im lokalen Browser-Speicher. Sie gehören zur jeweiligen Website-Adresse und werden beim Wechsel von Sites zu GitHub Pages nicht automatisch übernommen. Das Hosting stellt keine Cloud-Synchronisierung bereit.

## Sprache

Eine gespeicherte manuelle Auswahl hat Vorrang. Sonst wird die erste unterstützte Sprache aus den Browserpräferenzen gewählt: Deutsch oder Englisch; ohne Treffer Englisch.

## Abweichender Repositoryname / eigene Domain

Der Build verwendet standardmäßig `/ashfall/`. Bei anderer Adresse `PAGES_BASE_PATH` im Build setzen, beispielsweise `/` für eine eigene Domain. Bilder und Audiodateien werden beim Build entsprechend angepasst.
