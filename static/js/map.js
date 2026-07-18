/* Karte + Filter. Nur Leaflet, sonst kein JS. */
(function () {
  "use strict";

  var grounds = window.GROUNDS || [];
  var mapEl = document.getElementById("map");
  var liste = document.getElementById("spiele");
  var zeilen = [].slice.call(liste.querySelectorAll("li"));
  var leer = document.getElementById("leer");
  var reset = document.getElementById("f-reset");
  var selects = ["f-land", "f-regelwerk", "f-jahr"].map(function (id) {
    return document.getElementById(id);
  });
  var f = { stadion: "", land: "", regelwerk: "", jahr: "" };

  /* --- Karte: Welt nur einmal sichtbar, auf Performance getrimmt ---
     Ganze Zoomstufen (Tiles in nativer Auflösung, kein Skalieren) und
     Tile-Nachladen erst NACH der Zoom-Animation — das hält das Zoomen
     flüssig. Details: ANPASSUNGEN.md → "Karte: Performance". */
  var map = L.map(mapEl, {
    minZoom: 2,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0,
    zoomAnimation: false,   /* Zoom springt sofort statt zu gleiten */
    fadeAnimation: false
  });
  /* ohne {r}: normale statt @2x-Retina-Tiles — ein Viertel der Pixel */
  var tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
    updateWhenZooming: false,
    updateWhenIdle: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  /* Ladeindikator (CSS zeigt "Karte lädt …" bis Klasse gesetzt ist) */
  tiles.once("load", function () { mapEl.classList.add("bereit"); });
  setTimeout(function () { mapEl.classList.add("bereit"); }, 5000);

  /* Eigener Pin: img/marker.svg (siehe static/img/EIGENE-PINS.txt) */
  var pin = L.icon({
    iconUrl: "img/marker.svg",
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -26]
  });

  var marker = {};
  var bounds = [];
  grounds.forEach(function (g) {
    bounds.push([g.lat, g.lng]);
    marker[g.id] = L.marker([g.lat, g.lng], { icon: pin })
      .addTo(map)
      .bindPopup("<strong>" + g.name + "</strong><span>" + g.stadt + "</span>")
      /* Klick toggelt das Popup — Filter folgt dem Popup-Zustand:
         offen = Stadion gefiltert, zu (2. Klick, wie ×) = zurückgesetzt */
      .on("click", function () {
        f.stadion = this.isPopupOpen() ? g.id : "";
        filternSpaeter();
      })
      .on("popupclose", function () {
        if (f.stadion === g.id) { f.stadion = ""; filternSpaeter(); }
      });
  });
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });

  /* --- Filter --- */
  selects.forEach(function (sel) {
    var attr = sel.id.slice(2); // f-land -> land
    var werte = {};
    zeilen.forEach(function (z) { if (z.dataset[attr]) werte[z.dataset[attr]] = 1; });
    Object.keys(werte).sort().forEach(function (w) { sel.add(new Option(w, w)); });
    sel.onchange = function () { f[attr] = sel.value; filtern(); };
  });

  document.getElementById("f-sort").onchange = function (e) { sortieren(e.target.value); };

  reset.onclick = function () {
    f.stadion = f.land = f.regelwerk = f.jahr = "";
    selects.forEach(function (sel) { sel.value = ""; });
    map.closePopup();
    filtern();
  };

  /* Bei Karten-Events erst das Popup (weg-)zeichnen lassen, dann filtern.
     requestAnimationFrame + setTimeout garantiert einen Paint dazwischen. */
  function filternSpaeter() {
    requestAnimationFrame(function () { setTimeout(filtern, 0); });
  }

  /* Nur ein-/ausblenden — kein DOM-Umbau, daher schnell */
  function filtern() {
    var n = 0;
    var offen = {};
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
    /* Marker nur per display umschalten — deutlich billiger,
       als Layer aus der Karte zu entfernen und wieder einzufügen */
    grounds.forEach(function (g) {
      var el = marker[g.id].getElement();
      if (el) el.style.display = offen[g.id] ? "" : "none";
    });
    leer.hidden = n !== 0;
    reset.classList.toggle("gedimmt", !!(f.stadion || f.land || f.regelwerk || f.jahr));
  }

  /* DOM-Umbau nur, wenn wirklich umsortiert wird */
  function sortieren(richtung) {
    zeilen.sort(function (a, b) {
      return richtung === "asc"
        ? a.dataset.datum.localeCompare(b.dataset.datum)
        : b.dataset.datum.localeCompare(a.dataset.datum);
    }).forEach(function (z) { liste.appendChild(z); });
  }
})();
