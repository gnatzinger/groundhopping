# Groundhopper

Minimales Hugo-Groundhopping-Blog. Startseite: Leaflet-Karte aller besuchten Stadien, kompakte Filterzeile, einzeilige Spielliste. Pin-Klick zeigt alle Spiele in diesem Stadion (Popup schließen = Filter weg). Dazu: Statistik-Seite (automatisch aus den Posts berechnet) und Über-Seite.

Design: [Terminal](https://github.com/panr/hugo-theme-terminal) (panr, MIT) × Struktur: [Etch](https://github.com/LukasJoswiak/etch) (Lukas Joswiak, MIT).

## Struktur

```
content/spiele/*.md         → ein Post pro Spiel (Stadien werden hier mitdefiniert)
content/ueber.md            → Über-Seite
content/statistik.md        → Statistik (Layout rechnet zur Build-Zeit)
layouts/                    → Templates
static/css/style.css        → Theme
static/js/map.js            → Karte + Filter
static/img/marker.svg       → Pin (eigene: siehe static/img/EIGENE-PINS.txt)
tools/futbology-import.py   → einmaliger CSV-Import (schon gelaufen)
```

## Leaflet (selbst gehostet)

Liegt bereits unter `static/js/leaflet.js` und `static/css/leaflet.css` (v1.9.4). Der `images/`-Ordner aus dem Leaflet-Zip wird nicht gebraucht, da ein eigener SVG-Pin verwendet wird.

## Neues Spiel anlegen

`hugo new spiele/2026-08-01-heim-gast.md` — oder Datei von Hand anlegen:

```yaml
---
title: "TSV 1860 München 2:1 SSV Ulm 1846"
date: 2026-08-01
stadion: gruenwalder        # Kürzel, bei jedem Besuch gleich
wettbewerb: "3. Liga"
heim: "TSV 1860 München"
gast: "SSV Ulm 1846"
ergebnis: "2:1"
zuschauer: 15000
---

Optionaler Spielbericht.
```

**Neues Stadion?** Nur beim ersten Besuch zusätzlich in den Frontmatter:

```yaml
stadionname: "Neues Stadion"
stadt: "Stadt"
land: Deutschland
lat: 48.0
lng: 11.0
```

Regelwerk ist automatisch „Fußball“; abweichend pro Post `regelwerk: Rugby` o. ä. setzen. Weitere Anpassungen: siehe `ANPASSUNGEN.md`.

Alle weiteren Besuche brauchen nur noch `stadion:` mit demselben Kürzel.

Hinweis: Bei Stadien mit `# Koordinaten ungefähr` im Frontmatter die Koordinaten bei Gelegenheit prüfen (kleine Sportanlagen wurden geschätzt).

## Lokal starten

Hugo installieren (`brew install hugo`), dann im Projektordner:

```
hugo server
```

→ http://localhost:1313

## Deploy (GitHub Pages, kostenlos)

1. Repo anlegen, diesen Ordner auf `main` pushen.
2. Settings → Pages → Source: **GitHub Actions**.
3. Fertig — jeder Push baut und veröffentlicht automatisch (baseURL wird vom Workflow gesetzt).
