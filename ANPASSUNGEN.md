# Anpassungen

Alle Stellen, an denen du das Blog verändern kannst. Nach jeder Änderung reicht Speichern — `hugo server` lädt automatisch neu.

## Farben & Schrift

`static/css/style.css`, ganz oben:

```css
:root {
  --background: #e9f8e9;   /* Seitenhintergrund */
  --foreground: #000000;   /* Text, Rahmen */
  --accent: #5d510b;       /* Links, Ergebnisse, Kennzahlen */
}
```

Drei Werte ändern = komplett neues Farbschema. Der Pin (`static/img/marker.svg`) hat die Farben fest eingetragen — dort mitändern.

Schrift: in `style.css` unter `body { font-family: ... }`. Aktuell wird die Systemschrift Monospace genutzt (kein Download, am schnellsten). Für eine echte "Fira Code": Font-Datei (z. B. `.woff2`) nach `static/fonts/` legen und oben in `style.css` ergänzen:

```css
@font-face {
  font-family: "Fira Code";
  src: url("../fonts/FiraCode.woff2") format("woff2");
  font-display: swap;
}
```

## Hintergrundkarte (Basemap)

`static/js/map.js`, die `L.tileLayer("...")`-Zeile. Alternativen (alle gratis):

| Stil | URL |
|---|---|
| Hell, minimal (aktuell) | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` |
| Hell, ohne Beschriftung | `https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png` |
| Dunkel | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` |
| OSM-Standard | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |

Bei OSM-Standard die Attribution auf `&copy; OpenStreetMap contributors` ändern. Kartenhöhe: `#map { height: 340px; }` in `style.css`.

## Pin-Marker

Siehe `static/img/EIGENE-PINS.txt`. Kurz: eigenes SVG/PNG als `static/img/marker.svg` ablegen; Größe/Ankerpunkt in `map.js` bei `L.icon` anpassen.

## Titel, Untertitel, Navigation

- Seitentitel: `hugo.toml` → `title`
- Navigation & Fußzeile: `layouts/_default/baseof.html`

## Statistik-Seite

`layouts/_default/statistik.html`. Die Seite wird beim Build aus den Posts berechnet, kein JavaScript. Aufbau:

- **Kennzahlen-Kästen**: der `<div class="kennzahlen">`-Block. Neuen Kasten ergänzen: `<div><strong>ZAHL</strong><span>Beschriftung</span></div>`
- **Tabellen**: je ein `<table>`-Block (pro Jahr, Top-Stadien, pro Land). `first 10` bei den Top-Stadien ändert die Anzahl.
- Eigene Auswertung nach Vorbild "Spiele pro Land" bauen: über `$spiele` iterieren und nach beliebigem Frontmatter-Feld gruppieren (z. B. `wettbewerb`).

## Filterzeile

`layouts/index.html` (die `<select>`-Elemente) + `static/js/map.js` (Funktion `fuellen` und Objekt `f`). Neuer Filter in 3 Schritten:

1. `data-NAME="..."` Attribut am `<li>` in `index.html` ergänzen
2. `<select id="f-NAME">` in die Filterzeile
3. In `map.js`: `fuellen("f-NAME", "NAME")` + Bedingung in `render()`

## Regelwerk

Steht in jedem Post im Frontmatter (`regelwerk: "Association football"`). Abweichung einfach ändern, z. B. `regelwerk: Rugby` für das Spiel im Murrayfield. Das [?] auf den Spielseiten verlinkt auf `content/regelwerk.md` — dort deinen Erklärtext eintragen.

## Karte: Verhalten

`static/js/map.js`, im `L.map(...)`-Block:

- `minZoom: 2` — maximales Rauszoomen (höher = enger begrenzt)
- `maxBounds` — Kartengrenzen (Welt genau einmal)
- Ladeindikator: Text/Stil unter `#map::after` in `style.css`

## Karte: Performance

Was aktuell gesetzt ist und warum:

- **Ganze Zoomstufen** (Standard, kein `zoomSnap`): Tiles werden in nativer Auflösung gezeichnet. Halbe Stufen (`zoomSnap: 0.5`) sehen weicher aus, zwingen den Browser aber, jedes Tile zu skalieren — auf schwächeren Rechnern ruckelt genau das.
- **`updateWhenZooming: false`**: Tiles werden erst NACH der Zoom-Animation geladen, nicht währenddessen. Größter einzelner Performance-Hebel.
- **`updateWhenIdle: true`**: Beim Ziehen wird erst nachgeladen, wenn die Bewegung pausiert.

Ebenfalls aktiv (auf maximale Performance gestellt):

- `zoomAnimation: false, fadeAnimation: false` — Zoomen springt sofort statt zu gleiten. Rückgängig: beide Zeilen in `map.js` löschen.
- Tile-URL ohne `{r}` — normale statt @2x-Retina-Tiles (ein Viertel der Pixel, auf Retina leicht weicher). Rückgängig: `{y}.png` → `{y}{r}.png`.

Weitere Schrauben, falls es irgendwo noch hakt:

- `keepBuffer: 4` im tileLayer — hält mehr Tiles außerhalb des Sichtbereichs im Speicher (weniger Nachladen beim Pannen, mehr RAM).
- **Ab mehreren hundert Stadien**: Marker-Clustering mit [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (eine JS- + eine CSS-Datei, selbst hosten wie Leaflet). Bei ~100 Pins noch unnötig.
- Nichts pro Frame rechnen: Filter-Logik nur bei Klicks laufen lassen (so ist es gebaut — beibehalten).

## Karte: sonstige Leaflet-Tricks

- **Popup-Optionen**: `bindPopup(html, { closeButton: false, maxWidth: 220 })`
- **Karte erst beim Scrollen aktivieren** (verhindert versehentliches Zoomen beim Seiten-Scrollen): `scrollWheelZoom: false` setzen und per Klick aktivieren: `map.once("click", function(){ map.scrollWheelZoom.enable(); })`
- **Startausschnitt fix statt automatisch**: `map.setView([51, 10], 6)` statt `fitBounds(...)`
- **Tastatur-Zoom-Schrittweite**: `keyboardPanDelta`, Zoom-Buttons entfernen: `zoomControl: false`
- Offizielle Doku mit allen Optionen: https://leafletjs.com/reference.html

## Spielliste

Zeilenformat: `layouts/index.html` im `<li>`-Block. Datumsformat: `{{ .Date.Format "02.01.2006" }}` (Hugo-Referenzdatum, z. B. `"2.1.06"` für kurz).

## Einzelseiten der Spiele

`layouts/spiele/single.html` — Reihenfolge/Inhalt der Metazeilen, Überschrift usw.

## Stadion-Daten korrigieren

Koordinaten & Namen stehen im jeweils **ältesten** Post eines Stadions (erkennbar an `stadionname:`/`lat:` im Frontmatter). Bei geschätzten Koordinaten steht `# Koordinaten ungefähr – bitte prüfen` dahinter. Schnell finden:

```
grep -rl "ungefähr" content/spiele/
```

## Neue Seiten

Markdown-Datei in `content/` anlegen (wie `content/ueber.md`), Link in `layouts/_default/baseof.html` in die Navigation setzen.
