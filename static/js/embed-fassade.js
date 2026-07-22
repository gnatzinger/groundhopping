/* Click-to-load für Einbettungen: fremde Inhalte (Instagram, YouTube, X …)
   werden erst nach bewusstem Klick geladen. Bis dahin verbindet sich der
   Browser NICHT mit der Plattform → kein Tracking ohne Zustimmung. */
(function () {
  "use strict";

  function loadOnce(flag, src, cb) {
    if (window[flag]) { if (cb) cb(); return; }
    window[flag] = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    s.onload = function () { if (cb) cb(); };
    document.body.appendChild(s);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".embed-laden");
    if (!btn) return;
    var art = btn.getAttribute("data-embed");
    var id = btn.getAttribute("data-id");
    var box = btn.parentNode;

    if (art === "youtube") {
      box.innerHTML =
        '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' +
        id + '?autoplay=1" title="YouTube" allow="autoplay; fullscreen" ' +
        'allowfullscreen></iframe></div>';

    } else if (art === "instagram") {
      box.innerHTML =
        '<blockquote class="instagram-media" ' +
        'data-instgrm-permalink="https://www.instagram.com/reel/' + id + '/" ' +
        'data-instgrm-version="14"></blockquote>';
      loadOnce("__ig", "https://www.instagram.com/embed.js", function () {
        if (window.instgrm) window.instgrm.Embeds.process();
      });

    } else if (art === "twitter") {
      box.innerHTML =
        '<blockquote class="twitter-tweet"><a href="' + id + '"></a></blockquote>';
      loadOnce("__tw", "https://platform.twitter.com/widgets.js", function () {
        if (window.twttr) window.twttr.widgets.load(box);
      });
    }
  });
})();
