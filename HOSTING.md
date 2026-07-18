# Speichern & Hosten

## Teil 1 – Projekt sichern (Git)

Git macht aus dem Ordner ein versioniertes Projekt: jede Änderung ist gespeichert, rückholbar, und lässt sich zu GitHub hochladen.

1. **Git installieren** (falls noch nicht vorhanden). Terminal öffnen und prüfen:
   ```
   git --version
   ```
   Kommt eine Fehlermeldung: auf macOS `xcode-select --install` ausführen oder Git von https://git-scm.com/ laden.

2. **In den Projektordner wechseln** (der Ordner, der `hugo.toml` enthält):
   ```
   cd Pfad/zum/groundhopper
   ```

3. **Repository anlegen und ersten Stand speichern:**
   ```
   git init
   git add .
   git commit -m "Erster Stand"
   ```

Damit ist alles lokal in Git gesichert. Nach jeder späteren Änderung:
```
git add .
git commit -m "Was geändert wurde"
```

## Teil 2 – Auf GitHub hochladen

1. **GitHub-Konto** anlegen (falls nötig): https://github.com/ → Sign up.

2. **Neues Repository erstellen:** oben rechts auf **+** → **New repository**.
   - Name: z. B. `groundhopper`
   - **Public** wählen (für kostenloses Pages nötig)
   - **Kein** README/‌.gitignore ankreuzen (haben wir schon)
   - **Create repository**

3. GitHub zeigt danach Befehle an. Nimm den Block **„…or push an existing repository"** – so ähnlich:
   ```
   git remote add origin https://github.com/DEINNAME/groundhopper.git
   git branch -M main
   git push -u origin main
   ```
   Beim ersten `push` nach Login/Token fragen → im Browser bestätigen.

Ab jetzt lädt jeder `git push` deine Änderungen hoch.

## Teil 3 – GitHub Pages aktivieren

Die nötige Automatik (`.github/workflows/hugo.yaml`) liegt schon im Projekt. Sie baut die Seite bei jedem Push und veröffentlicht sie.

1. Im Repo auf **Settings** → linke Leiste **Pages**.
2. Unter **Build and deployment** → **Source**: **GitHub Actions** auswählen.
3. Fertig. Zum Tab **Actions** wechseln – dort läuft der Build (grüner Haken = fertig, ~1–2 Min).
4. Danach ist die Seite erreichbar unter:
   ```
   https://DEINNAME.github.io/groundhopper/
   ```
   (Die `baseURL` setzt der Workflow automatisch richtig – in `hugo.toml` nichts ändern.)

## Teil 4 – Eigene Domain (optional: groundhopping.gnatzinger.de)

Da der Seitentitel schon auf `groundhopping.gnatzinger.de` steht, hier die Einrichtung:

1. **Bei deinem Domain-Anbieter** (wo gnatzinger.de liegt) einen **DNS-Eintrag** setzen:
   - Typ **CNAME**, Name/Host: `groundhopping`, Ziel/Wert: `DEINNAME.github.io`
2. **Im Repo** eine Datei `static/CNAME` anlegen mit genau einer Zeile:
   ```
   groundhopping.gnatzinger.de
   ```
   (Alles in `static/` landet unverändert im fertigen Site-Root – so erkennt GitHub die Domain.)
3. Committen und pushen:
   ```
   git add static/CNAME
   git commit -m "Eigene Domain"
   git push
   ```
4. In **Settings → Pages → Custom domain** die Domain eintragen und **Enforce HTTPS** aktivieren (kann nach dem ersten Zertifikat ein paar Minuten dauern).

DNS-Änderungen brauchen manchmal bis zu einer Stunde, bis sie greifen.

## Kurz-Referenz für den Alltag

```
# lokal ansehen
hugo server

# Änderung sichern und veröffentlichen
git add .
git commit -m "Neues Spiel ergänzt"
git push
```

Der Push löst den automatischen Build aus – ein, zwei Minuten später ist die Änderung online.
