/* Statistik-Seite: Choroplethen-Länderkarte + Diagramme, filterbar nach Saison.
   Alles aus window.STATS, keine externen Aufrufe (Karte ohne Hintergrund-Tiles). */
(function () {
  "use strict";
  var S = window.STATS || { matches: [] };
  var M = S.matches || [];
  if (!M.length) return;

  var WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  function saisonOf(d) { /* Fußball-Saison: ab Juli neues Jahr */
    var y = +d.slice(0, 4), mo = +d.slice(5, 7), s = mo >= 7 ? y : y - 1;
    return s + "/" + String(s + 1).slice(2);
  }
  M.forEach(function (m) {
    var p = String(m.erg || "").split(":");
    m.hg = parseInt(p[0], 10); m.ag = parseInt(p[1], 10);
    if (isNaN(m.hg)) m.hg = 0; if (isNaN(m.ag)) m.ag = 0;
    m.tore = m.hg + m.ag;
    m.jahr = String(m.d).slice(0, 4);
    m.wt = new Date(m.d + "T12:00:00").getDay();
    m.saison = saisonOf(m.d);
  });

  function fmtDate(d) { var p = d.split("-"); return p[2] + "." + p[1] + "." + p[0]; }
  function num(n) { return n.toLocaleString("de-DE"); }
  var el = function (id) { return document.getElementById(id); };
  var saisonSel = el("saison"), rwSel = el("regelwerk");

  // Deutscher Ländername -> GU_A3-Code der Grenzdaten. Neues Land hier ergänzen.
  var ISO = { "Deutschland":"DEU","Österreich":"AUT","England":"ENG","Schottland":"SCT",
    "Irland":"IRL","Frankreich":"FXX","Italien":"ITA","Spanien":"ESP","Niederlande":"NLD",
    "Schweiz":"CHE","Schweden":"SWE","Ungarn":"HUN","Slowakei":"SVK","China":"CHN",
    "Japan":"JPN","Südkorea":"KOR","Argentinien":"ARG",
    "Palästina":"PSX","Syrien":"SYR","Westsahara":"SAH" };

  function featISO(f) {
    var p = f.properties || {};
    return p.GU_A3 || p.SU_A3 || p.ADM0_A3 || p.ISO_A3 || f.id;
  }
  function mix(t) {
    var a = [205, 236, 205], b = [20, 116, 62], o = "#";
    for (var i = 0; i < 3; i++) { var v = Math.round(a[i] + (b[i] - a[i]) * t); o += ("0" + v.toString(16)).slice(-2); }
    return o;
  }

  var map = L.map("statmap", {
    minZoom: 2, maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0, wheelPxPerZoomLevel: 120
  });
  map.setView([30, 5], 2);
  var geo = null, geoLayer = null, aktMax = 1;

  fetch("/geo/countries.geojson").then(function (r) { return r.json(); })
    .then(function (g) {
      geo = g;
      geoLayer = L.geoJSON(geo, { style: unbesucht, weight: 0.6,
        attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a> (eigene Bearbeitung)'
      }).addTo(map);
      /* Auf besuchte Länder (gesamt) einpassen */
      var visited = {}; M.forEach(function (m) { if (ISO[m.land]) visited[ISO[m.land]] = 1; });
      var bnds = L.latLngBounds([]);
      geoLayer.eachLayer(function (l) {
        if (visited[featISO(l.feature)]) bnds.extend(l.getBounds());
      });
      if (bnds.isValid()) map.fitBounds(bnds, { padding: [20, 20], maxZoom: 5 });
      render();
    })
    .catch(function () {
      el("karte-legende").innerHTML =
        '<span class="meta">Ländergrenzen fehlen: <code>static/geo/countries.geojson</code> ablegen (siehe STATISTIK.md).</span>';
    });

  function unbesucht() { return { fillColor: "#d9d9d9", fillOpacity: 0.55, color: "#ffffff", weight: 0.6 }; }

  function faerbe(subset) {
    if (!geoLayer) return;
    var per = perISO(subset);
    aktMax = 1; Object.keys(per).forEach(function (k) { if (per[k].n > aktMax) aktMax = per[k].n; });
    geoLayer.eachLayer(function (l) {
      var iso = featISO(l.feature), a = per[iso];
      if (a) {
        /* Log-Skala: viele Länder mit wenigen Spielen bleiben unterscheidbar */
        var t = aktMax > 1 ? Math.log(a.n) / Math.log(aktMax) : 1;
        l.setStyle({ fillColor: mix(0.18 + 0.82 * t), fillOpacity: 0.9, color: "#ffffff", weight: 0.7 });
        l.bindPopup(popupHTML(a));
      } else {
        l.setStyle(unbesucht());
        if (l.getPopup()) l.unbindPopup();
      }
    });
    legende();
  }

  function perISO(subset) {
    var per = {};
    subset.forEach(function (m) {
      var iso = ISO[m.land]; if (!iso) return;
      var a = per[iso] || (per[iso] = { laender: {}, n: 0, stadien: {}, first: m.d, firstM: m, last: m.d });
      a.n++; a.laender[m.land] = 1; a.stadien[m.sn] = 1;
      if (m.d < a.first) { a.first = m.d; a.firstM = m; }
      if (m.d > a.last) a.last = m.d;
    });
    return per;
  }

  function popupHTML(a) {
    var land = Object.keys(a.laender).join(" / ");
    return "<strong>" + land + "</strong>" + a.n + " Spiele, " + Object.keys(a.stadien).length +
      " Stadien<br>erster Besuch: " + fmtDate(a.first) +
      '<br><a href="' + a.firstM.url + '">Spielbericht →</a>';
  }

  function legende() {
    el("karte-legende").innerHTML =
      '<div class="leg-row"><span class="leg-cap">Spiele pro Land</span></div>' +
      '<div class="leg-row"><span class="leg-lab">1</span><span class="leg-grad"></span>' +
      '<span class="leg-lab">' + aktMax + '</span></div>' +
      '<div class="leg-row"><span class="leg-sw" style="background:#d9d9d9"></span>' +
      '<span class="meta">nicht besucht</span></div>';
  }

  /* ============ DIAGRAMME ============ */
  function kzl(items) {
    return items.map(function (x) {
      return "<div><strong>" + (typeof x[0] === "number" ? num(x[0]) : x[0]) +
        "</strong><span>" + x[1] + "</span></div>";
    }).join("");
  }
  function balken(container, items, opt) {
    opt = opt || {};
    var max = opt.max || Math.max.apply(null, items.map(function (i) { return i.v; })) || 1;
    el(container).innerHTML = items.map(function (i) {
      var w = i.v ? Math.max(2, Math.round(i.v / max * 100)) : 0;
      return '<div class="balken"><span class="lab">' + i.l + '</span>' +
        '<span class="track"><span class="bar" style="width:' + w + '%"></span></span>' +
        '<span class="val">' + (i.t != null ? i.t : num(i.v)) + '</span></div>';
    }).join("");
  }
  function zaehlItems(list, key, sortAlpha) {
    var c = {}; list.forEach(function (m) { var k = m[key]; if (k) c[k] = (c[k] || 0) + 1; });
    var arr = Object.keys(c).map(function (k) { return { l: k, v: c[k] }; });
    arr.sort(sortAlpha ? function (a, b) { return a.l < b.l ? 1 : -1; } : function (a, b) { return b.v - a.v; });
    return arr;
  }

  // Wertungsbegriff je Regelwerk (Fußball: Tore, sonst: Punkte)
  var TERM = { "Association football": "Tore" };
  function term(rw) { return TERM[rw] || "Punkte"; }

  /* Auswahlfelder voneinander abhängig (wie die Filter auf der Startseite) */
  function uniqSort(arr) { var s = {}; arr.forEach(function (x) { if (x) s[x] = 1; }); return Object.keys(s).sort(); }
  function fuelle(sel, label, values, keep) {
    sel.innerHTML = "";
    sel.add(new Option(label, ""));
    values.forEach(function (v) { sel.add(new Option(v, v)); });
    sel.value = (keep && values.indexOf(keep) >= 0) ? keep : "";
  }
  function facetten() {
    var sel = saisonSel.value, rw = rwSel.value;
    fuelle(saisonSel, "Saison",
      uniqSort(M.filter(function (m) { return !rw || m.rw === rw; }).map(function (m) { return m.saison; })).reverse(), sel);
    fuelle(rwSel, "Regelwerk",
      uniqSort(M.filter(function (m) { return !saisonSel.value || m.saison === saisonSel.value; }).map(function (m) { return m.rw; })), rw);
  }

  function render() {
    facetten();
    var sel = saisonSel.value, rw = rwSel.value; /* "" = alle */
    var L2 = M.filter(function (m) {
      return (!sel || m.saison === sel) && (!rw || m.rw === rw);
    });
    /* Regelwerk der Wertungs-Statistiken: gewähltes, sonst Association football */
    var aktRw = rw || "Association football";
    var SC = L2.filter(function (m) { return m.rw === aktRw; });
    var TT = term(aktRw);

    /* Kennzahlen */
    var scoreGesamt = SC.reduce(function (a, m) { return a + m.tore; }, 0);
    var stadien = {}, laender = {}; L2.forEach(function (m) { stadien[m.sn] = 1; laender[m.land] = 1; });
    el("kennzahlen").innerHTML = kzl([
      [L2.length, "Spiele"], [Object.keys(stadien).length, "Stadien"],
      [Object.keys(laender).length, "Länder"], [scoreGesamt, TT]
    ]);

    faerbe(L2);

    /* Spiele pro Jahr (Gesamt) bzw. pro Monat (einzelne Saison) */
    if (!sel) {
      el("ueberschrift-jahre").textContent = "Spiele pro Jahr";
      balken("chart-jahre", zaehlItems(L2, "jahr", true));
    } else {
      el("ueberschrift-jahre").textContent = "Spiele pro Monat";
      var MON = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
      var mc = {};
      L2.forEach(function (m) { mc[m.d.slice(0, 7)] = (mc[m.d.slice(0, 7)] || 0) + 1; });
      var mitems = Object.keys(mc).sort().map(function (ym) {
        return { l: MON[+ym.slice(5, 7) - 1] + " " + ym.slice(2, 4), v: mc[ym] };
      });
      balken("chart-jahre", mitems);
    }

    /* Wettbewerbe (Top 12) */
    balken("chart-wettbewerbe", zaehlItems(L2, "wb").slice(0, 12));

    /* Wertung: Tore (Fußball) bzw. Punkte (Rugby, American Football …) */
    el("ueberschrift-tore").textContent = TT;
    if (SC.length) {
      var maxSc = SC.slice().sort(function (a, b) { return b.tore - a.tore; })[0];
      var ergCount = {}; SC.forEach(function (m) { ergCount[m.erg] = (ergCount[m.erg] || 0) + 1; });
      var topErg = Object.keys(ergCount).sort(function (a, b) { return ergCount[b] - ergCount[a]; })[0];
      el("tore-zahlen").innerHTML = kzl([
        [scoreGesamt, TT + " gesamt"],
        [(scoreGesamt / SC.length).toFixed(2).replace(".", ","), "Ø pro Spiel"],
        [maxSc.tore, "meiste " + TT + " (Spiel)"],
        [topErg + " (" + ergCount[topErg] + "×)", "häufigstes Ergebnis"]
      ]);
      /* Feinverteilung 0–9+ nur bei Fußball sinnvoll */
      if (aktRw === "Association football") {
        var vert = {}; SC.forEach(function (m) { var k = m.tore >= 9 ? 9 : m.tore; vert[k] = (vert[k] || 0) + 1; });
        var vitems = [];
        for (var t = 0; t <= 9; t++) { if (t < 9 || vert[9]) vitems.push({ l: t < 9 ? t + " Tore" : "9+ Tore", v: vert[t] || 0 }); }
        balken("chart-tore", vitems);
      } else { el("chart-tore").innerHTML = ""; }
    } else {
      el("tore-zahlen").innerHTML = '<div><span class="hinweis-klein">keine ' + aktRw + '-Spiele in dieser Auswahl</span></div>';
      el("chart-tore").innerHTML = "";
    }

    /* Vereine (Heim + Gast), Top 12 */
    var teams = {};
    L2.forEach(function (m) { if (m.heim) teams[m.heim] = (teams[m.heim] || 0) + 1; if (m.gast) teams[m.gast] = (teams[m.gast] || 0) + 1; });
    balken("chart-vereine", Object.keys(teams).map(function (k) { return { l: k, v: teams[k] }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 12));

    /* Ergebnisse (aus dem gewählten Regelwerk) */
    if (SC.length) {
      var hs = 0, un = 0, as = 0;
      SC.forEach(function (m) { if (m.hg > m.ag) hs++; else if (m.hg < m.ag) as++; else un++; });
      balken("chart-ergebnisse", [
        { l: "Heimsieg", v: hs, t: hs + " (" + Math.round(hs / SC.length * 100) + "%)" },
        { l: "Unentschieden", v: un, t: un + " (" + Math.round(un / SC.length * 100) + "%)" },
        { l: "Auswärtssieg", v: as, t: as + " (" + Math.round(as / SC.length * 100) + "%)" }
      ]);
    } else {
      el("chart-ergebnisse").innerHTML = '<span class="meta">keine ' + aktRw + '-Spiele in dieser Auswahl</span>';
    }

    /* Zuschauer */
    var mitZu = L2.filter(function (m) { return m.zu > 0; });
    var sumZu = mitZu.reduce(function (a, m) { return a + m.zu; }, 0);
    var rek = mitZu.slice().sort(function (a, b) { return b.zu - a.zu; })[0];
    el("zuschauer-zahlen").innerHTML = kzl([
      [sumZu, "Zuschauer gesamt*"],
      [rek ? rek.zu : 0, "Rekordkulisse"],
      [mitZu.length ? Math.round(sumZu / mitZu.length) : 0, "Ø (wo bekannt)"]
    ]) + '<div><span class="hinweis-klein">*nur Spiele mit erfasster Zahl (' + mitZu.length + '/' + L2.length + ')</span></div>';

    /* Spiele nach Wochentag Mo–So */
    var wtc = [0, 0, 0, 0, 0, 0, 0]; L2.forEach(function (m) { wtc[m.wt]++; });
    balken("chart-wochentag", [1, 2, 3, 4, 5, 6, 0].map(function (i) { return { l: WT[i], v: wtc[i] }; }));
  }

  /* --- Auswahl (Optionen baut facetten() in render()) --- */
  saisonSel.onchange = render;
  rwSel.onchange = render;
  render(); /* Diagramme sofort; Karte färbt nach, sobald GeoJSON da ist */
})();
