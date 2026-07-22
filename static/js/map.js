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
    bounds.push([g.lat, g.lng]);
    marker[g.id] = L.marker([g.lat, g.lng], { icon: pin })
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
  if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });

  /* Filter-Selects aus der Liste befüllen */
  selects.forEach(function (sel) {
    var attr = sel.id.slice(2);
    var werte = {};
    zeilen.forEach(function (z) { if (z.dataset[attr]) werte[z.dataset[attr]] = 1; });
    Object.keys(werte).sort().forEach(function (w) { sel.add(new Option(w, w)); });
    sel.onchange = function () { f[attr] = sel.value; render(); };
  });
  sortSel.onchange = render;

  reset.onclick = function () {
    f.stadion = f.land = f.regelwerk = f.jahr = "";
    selects.forEach(function (sel) { sel.value = ""; });
    map.closePopup();
    render();
  };

  /* Bei Karten-Events erst das Popup (weg-)zeichnen lassen, dann filtern */
  function filternSpaeter() {
    requestAnimationFrame(function () { setTimeout(render, 0); });
  }

  function render() {
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
    grounds.forEach(function (g) {
      var el = marker[g.id].getElement();
      if (el) el.style.display = offen[g.id] ? "" : "none";
    });

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
