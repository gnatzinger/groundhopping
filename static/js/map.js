/* Karte + Filter. Nur Leaflet, sonst kein JS. */
(function () {
  "use strict";

  var grounds = window.GROUNDS || [];
  var mapEl = document.getElementById("map");
  var liste = document.getElementById("spiele");
  var zeilen = [].slice.call(liste.querySelectorAll("li[data-datum]"));
  var leer = document.getElementById("leer");
  var reset = document.getElementById("f-reset");
  var sortSel = document.getElementById("f-sort");
  var selects = ["f-land", "f-regelwerk", "f-jahr"].map(function (id) {
    return document.getElementById(id);
  });
  var f = { stadion: "", land: "", regelwerk: "", jahr: "" };

  /* --- Karte: Standard-OSM, normale Auflösung (wie leafletjs.com) --- */
  var map = L.map(mapEl, {
    minZoom: 2,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  });
  map.setView([48, 11], 4); /* Start-Ansicht — Leaflet braucht sie, bevor
                               Kacheln/Marker hinzugefügt werden; fitBounds
                               unten verfeinert sie dann */
  var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  /* Ladeindikator */
  tiles.once("load", function () { mapEl.classList.add("bereit"); });
  setTimeout(function () { mapEl.classList.add("bereit"); }, 5000);

  /* Eigener Pin: img/marker.svg */
  var pin = L.icon({
    iconUrl: "img/marker.svg",
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -26]
  });

  var marker = {};
  var bounds = [];
  grounds.forEach(function (g) {
    /* Ungültige Koordinaten überspringen, damit ein Tippfehler in einem
       Post nie die ganze Karte + Filter lahmlegt */
    var lat = parseFloat(g.lat), lng = parseFloat(g.lng);
    if (!isFinite(lat) || !isFinite(lng)) {
      if (window.console) console.warn("Groundhopper: ungültige Koordinaten für", g.id, g.lat, g.lng);
      return;
    }
    bounds.push([lat, lng]);
    marker[g.id] = L.marker([lat, lng], { icon: pin })
      .addTo(map)
      .bindPopup("<strong>" + g.name + "</strong><span>" + g.stadt + "</span>")
      /* Klick toggelt Popup → Filter folgt dem Popup-Zustand (wie das ×) */
      .on("click", function () {
        f.stadion = this.isPopupOpen() ? g.id : "";
        filternSpaeter();
      })
      .on("popupclose", function () {
        if (f.stadion === g.id) { f.stadion = ""; filternSpaeter(); }
      });
  });
  /* Standard-Ansicht: alle Stadien, großzügig gerahmt (weiter rausgezoomt) */
  function fitTo(coords) {
    if (coords.length) map.fitBounds(coords, { padding: [45, 45], maxZoom: 11 });
  }
  fitTo(bounds);

  /* Filter-Selects aus der Liste befüllen */
  selects.forEach(function (sel) {
    var attr = sel.id.slice(2);
    var werte = {};
    zeilen.forEach(function (z) { if (z.dataset[attr]) werte[z.dataset[attr]] = 1; });
    Object.keys(werte).sort().forEach(function (w) { sel.add(new Option(w, w)); });
    sel.onchange = function () { f[attr] = sel.value; render(true); };
  });
  sortSel.onchange = function () { render(false); }; /* Sortieren bewegt die Karte nicht */

  reset.onclick = function () {
    f.stadion = f.land = f.regelwerk = f.jahr = "";
    selects.forEach(function (sel) { sel.value = ""; });
    map.closePopup();
    render(true);
  };

  /* Bei Karten-Events (Pin-Klick) erst das Popup (weg-)zeichnen lassen, dann
     filtern — ohne die Karte zu verschieben (fit=false) */
  function filternSpaeter() {
    requestAnimationFrame(function () { setTimeout(function () { render(false); }, 0); });
  }

  function render(fit) {
    var richtung = sortSel.value;
    var n = 0, offen = {};

    /* 1. Sichtbarkeit */
    zeilen.forEach(function (z) {
      var d = z.dataset;
      var zeigen =
        (!f.stadion || d.stadion === f.stadion) &&
        (!f.land || d.land === f.land) &&
        (!f.regelwerk || d.regelwerk === f.regelwerk) &&
        (!f.jahr || d.jahr === f.jahr);
      z.hidden = !zeigen;
      if (zeigen) { n++; offen[d.stadion] = 1; }
    });

    /* 2. Marker passend ein-/ausblenden (nur display, daher schnell) */
    var sichtbar = [];
    grounds.forEach(function (g) {
      if (!marker[g.id]) return;
      var el = marker[g.id].getElement();
      if (el) el.style.display = offen[g.id] ? "" : "none";
      if (offen[g.id]) sichtbar.push(marker[g.id].getLatLng());
    });

    /* Karte auf die sichtbaren Marker nachführen (nur bei Filterwechsel) */
    if (fit) fitTo(sichtbar);

    /* 3. Sortieren */
    var sorted = zeilen.slice().sort(function (a, b) {
      return richtung === "asc"
        ? a.dataset.datum.localeCompare(b.dataset.datum)
        : b.dataset.datum.localeCompare(a.dataset.datum);
    });

    /* 4. Neu einhängen mit Jahres-Überschrift vor dem ersten sichtbaren
          Spiel jedes Jahres */
    [].slice.call(liste.querySelectorAll(".jahr-kopf")).forEach(function (h) { h.remove(); });
    var jahr = null;
    sorted.forEach(function (z) {
      if (!z.hidden && z.dataset.jahr !== jahr) {
        jahr = z.dataset.jahr;
        var kopf = document.createElement("li");
        kopf.className = "jahr-kopf";
        kopf.textContent = jahr;
        liste.appendChild(kopf);
      }
      liste.appendChild(z);
    });

    leer.hidden = n !== 0;
    reset.classList.toggle("gedimmt", !!(f.stadion || f.land || f.regelwerk || f.jahr));
  }

  render(); /* baut die Jahres-Überschriften schon beim Laden */
})();
