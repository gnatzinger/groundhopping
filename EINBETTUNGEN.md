# Bilder & Einbettungen in Spielberichten

Alles bekommt automatisch denselben 1px-Rahmen wie das Kartenfenster.
HTML funktioniert direkt in den Markdown-Dateien.

## Bild

```markdown
![Südtribüne vor Anpfiff](/img/spiele/2026-08-01-suedtribuene.jpg)
```

Datei nach `static/img/spiele/` legen, vorher auf ca. 1600 px verkleinern
(`sips -Z 1600 foto.jpg`).

Mit Bildunterschrift:

```html
<figure>
  <img src="/img/spiele/foto.jpg" alt="Beschreibung" loading="lazy">
  <figcaption>Südtribüne, 20 Minuten vor Anpfiff</figcaption>
</figure>
```

## YouTube

Auf dem Video → Teilen → Einbetten, den `<iframe>`-Code kopieren und in
`<div class="video">` wickeln:

```html
<div class="video">
  <iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
          title="YouTube" loading="lazy" allowfullscreen></iframe>
</div>
```

`youtube-nocookie.com` statt `youtube.com` = kein Tracking-Cookie vorab.

## Instagram Reel / TikTok (Hochformat)

```html
<div class="video hoch">
  <iframe src="https://www.instagram.com/reel/REEL_ID/embed"
          title="Instagram" loading="lazy" allowfullscreen></iframe>
</div>
```

TikTok analog mit `https://www.tiktok.com/embed/v2/VIDEO_ID`.

## X / Twitter

Post → „Beitrag einbetten" → HTML kopieren. Das mitgelieferte
`<script>`-Tag **einmal pro Seite** genügt:

```html
<blockquote class="twitter-tweet"><a href="https://twitter.com/…"></a></blockquote>
<script async src="https://platform.twitter.com/widgets.js"></script>
```

Hinweis: X und Instagram rendern ihre Einbettungen in einem eigenen
iframe — der äußere Rahmen sitzt korrekt, die Innengestaltung
(Schrift, Farben) bestimmen die Plattformen selbst und lässt sich
nicht überschreiben.

## Eigenes Video (ohne Plattform)

Datei nach `static/video/`, dann:

```html
<video controls preload="none" poster="/img/spiele/vorschau.jpg">
  <source src="/video/tor.mp4" type="video/mp4">
</video>
```

`preload="none"` lädt das Video erst beim Abspielen.

## Faustregeln

- `loading="lazy"` bei allem, was nicht ganz oben steht
- Einbettungen laden fremde Skripte nach und kosten Ladezeit — sparsam einsetzen
- Videodateien nicht direkt ins Git-Repo (dauerhaft gespeichert, sprengt es schnell);
  lieber bei YouTube hochladen und einbetten
