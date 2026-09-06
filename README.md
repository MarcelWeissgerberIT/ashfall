# ASHFALL — Dead Sector

Isometrisches Zombie-Survival-Spiel mit drei zusammenhängenden Kapiteln. Die Welt wird in Three.js gerendert; die deterministische Simulation ist von der Darstellung getrennt.

## Spielen

- Boden anklicken: automatisch zum Ziel laufen.
- Gegenstände, Kisten, Türen oder Zombies anklicken: hinlaufen und interagieren.
- `2`: Verband. `3`: Flasche wählen und auf ein freies Feld werfen.
- `Shift`: Schleichen. `Leertaste`: Pause.
- Rucksack: Gegenstände untersuchen, benutzen oder wieder ablegen. 14 kg Traglast.
- Jeder Sektor kann mit seiner ursprünglichen Ausrüstung neu gestartet werden.

Die Kampagne führt durch den Kontrollpunkt, Station Null und das Evakuierungsdach. Auftragsschlüssel bleiben beim Levelwechsel erhalten; Generator und Sender verbrauchen ihre passenden Bauteile. Der Spielstand gilt für die laufende Sitzung.

## Entwicklung

Node.js >= 22.13.0. `npm install`, dann `npm run dev`. `npm run build` erzeugt die Sites-Ausgabe.

`node scripts/check-game.mjs` prüft zwei vollständige Kampagnendurchläufe über dieselben Lauf- und Interaktionsfunktionen wie im Spiel sowie Traglast, Ablenkung, Heilung, Türbedingungen, Pause, Neustart und Wellen. `npx tsc --noEmit` prüft die TypeScript-Integration.

## OpenArt-Grafiken

Die Grafikfassung ergänzt OpenArt-Oberflächen für Beton, Asphalt, rostigen Stahl und Steinpflaster, Gegenstandsbilder, Porträts und drei Sektorpanoramen. Die drei ursprünglichen Bildatlanten sowie ihre Prompts und Modellparameter liegen unter `art-source/openart-v3`. `scripts/prepare-art.cjs` extrahiert die Bilder reproduzierbar mit Sharp. Die fertigen WebP-Dateien sind bereits in `public/images/openart` enthalten.

3D-Figuren verwenden nun gerundete Körperformen, Gelenkbewegungen und Ausrüstungsdetails. Die Welt hat Materialstrukturen, Pfützen, Kontaktschatten, sanftes Leuchten und Licht pro Sektor. Rechte oder mittlere Maustaste ziehen verschiebt die Kamera auch bei vergrößerter Ansicht.
