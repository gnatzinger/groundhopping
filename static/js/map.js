/* Karte + Filter. Nur Leaflet */
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
/*Karte*/
  var map = L.map(mapEl, {
    minZoom: 2,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  });
  map.setView([48, 11], 4); /* Start-Ansicht für Leaflet vor
                               Kacheln/Marker hinzufügung; fitBounds
                               unten: verfeinerung */
  /* CARTO Voyager mit Retina ({r} → @2x): scharf */
  var tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    noWrap: true,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  /* Ladeindikator */
  tiles.once("load", function () { mapEl.classList.add("bereit"); });
  setTimeout(function () { mapEl.classList.add("bereit"); }, 5000);

  var pin = L.icon({
    iconUrl: "img/marker.svg",
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -26]
  });

  /* Marker in eine Cluster-Gruppe */
  var clusterGroup = (L.markerClusterGroup
    ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 30 })
    : L.layerGroup()).addTo(map);

  var marker = {};
  var bounds = [];
  grounds.forEach(function (g) {
    /* Ungültige Koordinaten überspringen, WICHTIG */
    var lat = parseFloat(g.lat), lng = parseFloat(g.lng);
    if (!isFinite(lat) || !isFinite(lng)) {
      if (window.console) console.warn("Groundhopper: ungültige Koordinaten für", g.id, g.lat, g.lng);
      return;
    }
    bounds.push([lat, lng]);
    marker[g.id] = L.marker([lat, lng], { icon: pin })
      .bindPopup("<strong>" + g.name + "</strong><span>" + g.stadt + "</span>")
      /* Klick toggelt Popup = Filter folgt dem Popup-Zustand */
      .on("click", function () {
        f.stadion = this.isPopupOpen() ? g.id : "";
        filternSpaeter();
      })
      .on("popupclose", function () {
        if (f.stadion === g.id) { f.stadion = ""; filternSpaeter(); }
      });
  });

  /* Marker-Cluster an die aktiven Dropdown-Filter anpassen (NICHT an Pin-Klick).
     Gibt die Koordinaten der sichtbaren Marker zurück (zum Einpassen). */
  function markerSync() {
    var offenM = {};
    zeilen.forEach(function (z) {
      var d = z.dataset;
      if ((!f.land || d.land === f.land) &&
          (!f.regelwerk || d.regelwerk === f.regelwerk) &&
          (!f.jahr || d.jahr === f.jahr)) offenM[d.stadion] = 1;
    });
    var sicht = [], coords = [];
    grounds.forEach(function (g) {
      if (marker[g.id] && offenM[g.id]) { sicht.push(marker[g.id]); coords.push(marker[g.id].getLatLng()); }
    });
    clusterGroup.clearLayers();
    if (clusterGroup.addLayers) clusterGroup.addLayers(sicht);
    else sicht.forEach(function (m) { clusterGroup.addLayer(m); });
    return coords;
  }
  /* Standard-Ansicht: alle Stadien */
  function fitTo(coords) {
    if (coords.length) map.fitBounds(coords, { padding: [45, 45], maxZoom: 11 });
  }
  fitTo(bounds);

  /* Beschriftung (erste Option) je Select merken, dann Handler */
  var labels = {};
  selects.forEach(function (sel) {
    var attr = sel.id.slice(2);
    labels[attr] = sel.options[0].textContent; /* "Land" / "Regelwerk" / "Jahr" */
    sel.onchange = function () { f[attr] = sel.value; aktualisieren(true); };
  });
  sortSel.onchange = function () { render(false); }; /* Sortieren bewegt die Karte nicht */

  reset.onclick = function () {
    f.stadion = f.land = f.regelwerk = f.jahr = "";
    map.closePopup();
    aktualisieren(true);
  };

  /* Verkettete Filter */
  function facetten() {
    selects.forEach(function (sel) {
      var attr = sel.id.slice(2);
      var werte = {};
      zeilen.forEach(function (z) {
        var d = z.dataset, ok = true;
        ["land", "regelwerk", "jahr"].forEach(function (a) {
          if (a !== attr && f[a] && d[a] !== f[a]) ok = false;
        });
        if (ok && d[attr]) werte[d[attr]] = 1;
      });
      var keys = Object.keys(werte).sort();
      if (attr === "jahr") keys.reverse();
      if (f[attr] && !werte[f[attr]]) f[attr] = ""; /* Auswahl ungültig → weg */
      sel.innerHTML = "";
      sel.add(new Option(labels[attr], ""));
      keys.forEach(function (w) { sel.add(new Option(w, w)); });
      sel.value = f[attr] || "";
    });
  }

  function aktualisieren(fit) {
    facetten();
    var coords = markerSync(); /* Cluster an Dropdown-Filter anpassen */
    render();
    if (fit) fitTo(coords); /* Karte auf sichtbare Marker nachführen */
  }

  /* Bei Karten-Events (Pin-Klick) erst das Popup weg, dann
     filtern ohne die Karte zu verschieben (fit=false) */
  function filternSpaeter() {
    /* Pin-Klick filtert nur Liste + Karte, lässt die Dropdowns unangetastet */
    requestAnimationFrame(function () { setTimeout(function () { render(false); }, 0); });
  }

  /* Nur die liste filtern/sortieren (Marker: markerSync */
  function render() {
    var richtung = sortSel.value;
    var n = 0;

    /* 1. Sichtbarkeit */
    zeilen.forEach(function (z) {
      var d = z.dataset;
      var zeigen =
        (!f.stadion || d.stadion === f.stadion) &&
        (!f.land || d.land === f.land) &&
        (!f.regelwerk || d.regelwerk === f.regelwerk) &&
        (!f.jahr || d.jahr === f.jahr);
      z.hidden = !zeigen;
      if (zeigen) { n++; }
    });

    /* 2. Sortieren */
    var sorted = zeilen.slice().sort(function (a, b) {
      return richtung === "asc"
        ? a.dataset.datum.localeCompare(b.dataset.datum)
        : b.dataset.datum.localeCompare(a.dataset.datum);
    });

    /* 4. Neu einhängen mit Jahresüberschrift vor dem ersten sichtbaren
          Spiel jedes Jahres */
    [].slice.call(liste.querySelectorAll(".jahr-kopf")).forEach(function (h) { h.remove(); });
    var jahr = null, erste = true;
    sorted.forEach(function (z) {
      if (!z.hidden && z.dataset.jahr !== jahr) {
        jahr = z.dataset.jahr;
        var kopf = document.createElement("li");
        kopf.className = "jahr-kopf" + (erste ? " erste" : "");
        kopf.textContent = jahr;
        liste.appendChild(kopf);
        erste = false;
      }
      liste.appendChild(z);
    });

    leer.hidden = n !== 0;
    reset.classList.toggle("gedimmt", !!(f.stadion || f.land || f.regelwerk || f.jahr));
  }

  aktualisieren(false); /* Dropdowns befüllen + Liste/Überschriften beim Laden */
})();
