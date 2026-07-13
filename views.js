/**
 * Site view counter for static hosting (GitHub Pages).
 * Uses a free public counter API — no backend on this repo.
 * Counts once per browser session (refresh won't double-count).
 */
(function () {
  var NS = "chiragajain-portfolio";
  var KEY = "site-views";
  var SESSION_FLAG = "cj-site-viewed-v1";
  // Primary: counterapi.dev  |  Fallback: countapi.xyz
  var UP_URLS = [
    "https://api.counterapi.dev/v1/" + NS + "/" + KEY + "/up",
    "https://api.countapi.xyz/hit/" + NS + "/" + KEY
  ];
  var GET_URLS = [
    "https://api.counterapi.dev/v1/" + NS + "/" + KEY + "/",
    "https://api.countapi.xyz/get/" + NS + "/" + KEY
  ];

  function parseCount(data) {
    if (data == null) return null;
    if (typeof data.count === "number") return data.count;
    if (typeof data.value === "number") return data.value;
    if (data.data && typeof data.data.up_count === "number") return data.data.up_count;
    if (data.data && typeof data.data.count === "number") return data.data.count;
    return null;
  }

  function fetchJson(url) {
    return fetch(url, { method: "GET", mode: "cors", cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  function tryUrls(urls) {
    var i = 0;
    function next() {
      if (i >= urls.length) return Promise.reject(new Error("all endpoints failed"));
      var url = urls[i++];
      return fetchJson(url).catch(next);
    }
    return next();
  }

  function formatCount(n) {
    try {
      return Number(n).toLocaleString("en-IN");
    } catch (e) {
      return String(n);
    }
  }

  function paint(n) {
    document.querySelectorAll("[data-view-count]").forEach(function (el) {
      el.textContent = n == null ? "—" : formatCount(n);
      el.setAttribute("data-loaded", n == null ? "error" : "true");
    });
  }

  function run() {
    var nodes = document.querySelectorAll("[data-view-count]");
    if (!nodes.length) return;

    paint(null);
    nodes.forEach(function (el) {
      el.textContent = "…";
    });

    var already = false;
    try {
      already = sessionStorage.getItem(SESSION_FLAG) === "1";
    } catch (e) {
      already = false;
    }

    var req = already ? tryUrls(GET_URLS) : tryUrls(UP_URLS);

    req
      .then(function (data) {
        var n = parseCount(data);
        if (n == null) throw new Error("bad payload");
        try {
          sessionStorage.setItem(SESSION_FLAG, "1");
        } catch (e) {}
        paint(n);
      })
      .catch(function () {
        paint(null);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
