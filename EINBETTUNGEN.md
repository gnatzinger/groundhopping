# Bilder & Einbettungen in Beiträgen

## Bilder (kein Tracking)

Datei nach `static/img/spiele/` (vorher auf ~1600 px verkleinern: `sips -Z 1600 foto.jpg`):

```markdown
![Südtribüne vor Anpfiff](/img/spiele/2026-08-01-suedtribuene.jpg)
```

Mit Bildunterschrift:

```html
<figure>
  <img src="/img/spiele/foto.jpg" alt="Beschreibung" loading="lazy">
  <figcaption>Südtribüne, 20 Minuten vor Anpfiff</figcaption>
</figure>
```

## Einbettungen (Instagram, YouTube, X) — datenschutzfreundlich

Alle Einbettungen laufen über eine **Click-to-load-Fassade**: Es erscheint
zuerst nur ein Kasten. Erst wenn ein Besucher draufklickt, wird der Inhalt
von der Plattform geladen. Ohne Klick verbindet sich der Browser **nicht**
mit Instagram/YouTube/X — kein Tracking ohne Zustimmung (DSGVO-konform).

Jeweils **eine Zeile** in die `.md`-Datei:

```
{{< instagram REEL_CODE >}}        Teil hinter /reel/ in der URL
{{< youtube VIDEO_ID >}}           Teil hinter watch?v= oder youtu.be/
{{< x https://x.com/user/status/123 >}}   komplette Beitrags-URL
```

Beispiele:

```
{{< youtube dQw4w9WgXcQ >}}
{{< instagram C1a2b3c4D5e >}}
{{< x https://x.com/TSV1860/status/1790000000000000000 >}}
```

Der Rahmen sitzt automatisch im Kartenfenster-Stil. YouTube läuft über
`youtube-nocookie.com` (setzt erst beim Abspielen Cookies).

Neue Plattform gewünscht? Sag Bescheid — dann kommt ein weiteres Shortcode
dazu (Logik steckt in `static/js/embed-fassade.js` + `layouts/shortcodes/`).

## Eigenes Video (kein Tracking)

Datei nach `static/video/`, dann:

```html
<video controls preload="none" poster="/img/spiele/vorschau.jpg">
  <source src="/video/tor.mp4" type="video/mp4">
</video>
```

Große Videodateien nicht ins Git-Repo (bläht es dauerhaft auf) — lieber bei
YouTube hochladen und per Shortcode einbetten.

## Voraussetzung

Rohes HTML in Markdown ist aktiviert (`unsafe = true` in `hugo.toml`).
Nach Änderungen an der `hugo.toml` den `hugo server` einmal neu starten.
