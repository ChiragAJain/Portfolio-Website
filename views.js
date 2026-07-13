/**
 * Live page-view counter for static hosting (GitHub Pages).
 *
 * counterapi.dev works server-side but browsers sometimes cannot read the
 * response; proxies are flaky. Strategy:
 *  1) Try JSON increment + paint a styled number
 *  2) If that fails, show an SVG badge that always increments (img = no CORS)
 *
 * Counts every full page load so the number visibly moves when you visit.
 */
(function () {
  var NS = "chiragajain-portfolio";
  var KEY = "site-views";
  var SITE = "https://chiragajain.github.io/Portfolio-Website";
  var UP = "https://api.counterapi.dev/v1/" + NS + "/" + KEY + "/up";
  var GET = "https://api.counterapi.dev/v1/" + NS + "/" + KEY;

  function nodes() {
    return document.querySelectorAll("[data-view-count]");
  }

  function formatCount(n) {
    try {
      return Number(n).toLocaleString("en-IN");
    } catch (e) {
      return String(n);
    }
  }

  function paint(n, ok) {
    nodes().forEach(function (el) {
      if (n == null || !ok) {
        el.textContent = "—";
        el.setAttribute("data-loaded", "error");
        return;
      }
      el.textContent = formatCount(n);
      el.setAttribute("data-loaded", "true");
    });
  }

  function parseCount(data) {
    if (data == null) return null;
    if (typeof data === "number") return data;
    if (typeof data.count === "number") return data.count;
    if (typeof data.value === "number") return data.value;
    if (data.data) {
      if (typeof data.data.count === "number") return data.data.count;
      if (typeof data.data.up_count === "number") return data.data.up_count;
    }
    if (typeof data.contents === "string") {
      try {
        return parseCount(JSON.parse(data.contents));
      } catch (e) {}
    }
    return null;
  }

  function fetchJson(url) {
    return fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "omit"
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function badgeUrl() {
    return (
      "https://hitscounter.dev/api/hit?url=" +
      encodeURIComponent(SITE) +
      "&label=Views&icon=eye&color=%237c2d12&t=" +
      Date.now()
    );
  }

  function showBadgeFallback() {
    paint(null, false);
    nodes().forEach(function (el) {
      var wrap = el.closest(".view-counter");
      if (!wrap || wrap.getAttribute("data-badge") === "1") return;
      wrap.setAttribute("data-badge", "1");
      el.style.display = "none";
      var label = wrap.querySelector(".view-counter-label");
      if (label) label.style.display = "none";
      var img = document.createElement("img");
      img.alt = "Views";
      img.className = "view-counter-badge";
      img.width = 110;
      img.height = 20;
      img.decoding = "async";
      img.src = badgeUrl();
      wrap.appendChild(img);
    });
  }

  function run() {
    if (!nodes().length) return;

    nodes().forEach(function (el) {
      el.textContent = "…";
      el.removeAttribute("data-loaded");
    });

    // Prefer styled number from counterapi
    fetchJson(UP)
      .then(function (data) {
        var n = parseCount(data);
        if (n == null) throw new Error("no count");
        paint(n, true);
      })
      .catch(function () {
        // Retry a plain GET (sometimes /up is rate-limited)
        return fetchJson(GET)
          .then(function (data) {
            var n = parseCount(data);
            if (n == null) throw new Error("no count");
            paint(n, true);
            // Still record a hit via image (side-effect only)
            var img = new Image();
            img.referrerPolicy = "no-referrer-when-downgrade";
            img.src = badgeUrl();
          })
          .catch(function () {
            // Guaranteed path: SVG badge increments + displays
            showBadgeFallback();
          });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
