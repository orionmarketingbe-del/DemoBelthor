/* Belthor Automotive – demo. Gedeelde functies voor alle pagina's. */
(function () {
  "use strict";

  var LOCALES = ["fr", "nl", "pt", "en"];
  var HTML_LANG = { fr: "fr-BE", nl: "nl-BE", pt: "pt-BR", en: "en" };
  var NUM_LOCALE = { fr: "fr-BE", nl: "nl-BE", pt: "pt-BR", en: "en-GB" };
  var VAT_RATE = 0.21;
  var KEY_VEHICLES = "belthor_demo_vehicles_v1";
  var KEY_SETTINGS = "belthor_demo_settings_v1";
  var KEY_LANG = "belthor_lang";

  // ---------------------------------------------------------- opslag (localStorage, met veilige fallback)
  var memory = {};
  function readStore(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return memory[key] || null;
    }
  }
  function writeStore(key, value) {
    memory[key] = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
  function removeStore(key) {
    delete memory[key];
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* niets */
    }
  }

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function getVehicles() {
    var v = readStore(KEY_VEHICLES);
    return Array.isArray(v) ? v : clone(window.BELTHOR_DEFAULT_VEHICLES);
  }
  function saveVehicles(list) {
    return writeStore(KEY_VEHICLES, list);
  }
  function getSettings() {
    var s = readStore(KEY_SETTINGS);
    return s && typeof s === "object" ? s : clone(window.BELTHOR_DEFAULT_SETTINGS);
  }
  function saveSettings(s) {
    return writeStore(KEY_SETTINGS, s);
  }
  function resetDemo() {
    removeStore(KEY_VEHICLES);
    removeStore(KEY_SETTINGS);
  }

  // ---------------------------------------------------------- taal
  function detectLang() {
    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl && LOCALES.indexOf(fromUrl) >= 0) {
      try { window.localStorage.setItem(KEY_LANG, fromUrl); } catch (e) { /* niets */ }
      return fromUrl;
    }
    try {
      var saved = window.localStorage.getItem(KEY_LANG);
      if (saved && LOCALES.indexOf(saved) >= 0) return saved;
    } catch (e) { /* niets */ }
    var nav = (navigator.languages || [navigator.language || ""]).map(function (l) {
      return String(l).slice(0, 2).toLowerCase();
    });
    for (var i = 0; i < nav.length; i++) if (LOCALES.indexOf(nav[i]) >= 0) return nav[i];
    return "fr";
  }

  var lang = detectLang();
  var D = window.BELTHOR_I18N[lang];

  function setLang(l) {
    try { window.localStorage.setItem(KEY_LANG, l); } catch (e) { /* niets */ }
    var url = new URL(window.location.href);
    url.searchParams.delete("lang");
    window.location.href = url.toString();
  }

  /** Vertaling ophalen via pad, bv. t("home.title") of t("stock.resultsMany", { n: 3 }). */
  function t(path, vars) {
    var parts = path.split(".");
    var cur = D;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) break;
      cur = cur[parts[i]];
    }
    if (typeof cur !== "string") return path;
    if (!vars) return cur;
    return cur.replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
    });
  }

  function applyI18n(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    (root || document).querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    (root || document).querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
  }

  // ---------------------------------------------------------- opmaak
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function num(n) {
    return new Intl.NumberFormat(NUM_LOCALE[lang], { maximumFractionDigits: 0 }).format(n);
  }
  function euro(n) {
    return new Intl.NumberFormat(NUM_LOCALE[lang], {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n);
  }
  function km(v) {
    return v == null ? "—" : num(v) + " km";
  }
  function firstReg(v) {
    return v.month ? String(v.month).padStart(2, "0") + "/" + v.year : String(v.year);
  }
  function title(v) {
    return (v.make + " " + v.model).trim();
  }
  function fuelLabel(v) {
    return v.fuel ? t("vehicle.fuels." + v.fuel) : "—";
  }
  function transLabel(v) {
    return v.transmission ? t("vehicle.transmissions." + v.transmission) : "—";
  }
  function kwToHp(kw) {
    return Math.round(kw * 1.35962);
  }

  /** Prijsweergave volgens btw-regime. */
  function price(v) {
    var p = v.price_eur;
    if (v.vat_regime === "vat_included")
      return { main: euro(p), label: t("detail.inclVat"), sub: euro(Math.round(p / (1 + VAT_RATE))) + " " + t("detail.exclVat") };
    if (v.vat_regime === "vat_excluded")
      return { main: euro(p), label: t("detail.exclVat"), sub: euro(Math.round(p * (1 + VAT_RATE))) + " " + t("detail.inclVat") };
    if (v.vat_regime === "margin") return { main: euro(p), label: "", sub: t("detail.vatMargin") };
    return { main: euro(p), label: "", sub: "" };
  }

  function description(v) {
    var d = v.description || {};
    if (d[lang] && d[lang].trim()) return d[lang].trim();
    for (var i = 0; i < LOCALES.length; i++) {
      var x = d[LOCALES[i]];
      if (x && x.trim()) return x.trim();
    }
    return "";
  }

  function waNumber(s) {
    var raw = (s && (s.whatsapp || s.phone)) || "";
    var digits = raw.replace(/\D/g, "");
    return digits.length >= 8 ? digits : null;
  }
  function waLink(number, text) {
    return "https://wa.me/" + number + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function telLink(phone) {
    return "tel:" + String(phone).replace(/[^\d+]/g, "");
  }

  var CAR_SVG =
    '<svg width="72" height="40" viewBox="0 0 72 40" fill="none" stroke="#C9A24A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 28h4m56 0h4M8 28c0-4 1-7 5-8l8-8c2-2 4-3 7-3h14c3 0 5 1 7 3l7 8c5 1 8 4 8 8"/>' +
    '<circle cx="18" cy="29" r="5"/><circle cx="54" cy="29" r="5"/><path d="M23 29h26"/></svg>';

  function photoBox(v, cls) {
    var first = v.photos && v.photos[0];
    if (first) return '<img src="' + esc(first) + '" alt="' + esc(title(v)) + '" loading="lazy" class="' + (cls || "") + '">';
    return '<div class="no-photo">' + CAR_SVG + "<span>" + esc(t("detail.noPhotos")) + "</span></div>";
  }

  function carCard(v, layout) {
    var pr = price(v);
    var badge =
      v.status === "sold"
        ? '<span class="badge badge-sold">' + esc(t("vehicle.statuses.sold")) + "</span>"
        : v.status === "reserved"
          ? '<span class="badge badge-reserved">' + esc(t("vehicle.statuses.reserved")) + "</span>"
          : "";
    return (
      '<a class="car-card reveal' + (layout === "row" ? " car-row" : "") + '" href="wagen.html?id=' + encodeURIComponent(v.id) + '">' +
      '<div class="media">' + photoBox(v) + badge + "</div>" +
      '<div class="body"><h3>' + esc(title(v)) + "</h3>" +
      (v.version ? '<p class="sub">' + esc(v.version) + "</p>" : "") +
      '<p class="price">' + esc(pr.main) + (pr.label ? "<small>" + esc(pr.label) + "</small>" : "") + "</p>" +
      (pr.sub && v.vat_regime !== "margin" ? '<p class="price-sub">' + esc(pr.sub) + "</p>" : "") +
      '<div class="chips"><span class="chip">' + esc(km(v.mileage_km)) + '</span><span class="chip">' + esc(firstReg(v)) +
      '</span><span class="chip">' + esc(fuelLabel(v)) + '</span><span class="chip">' + esc(transLabel(v)) + "</span></div>" +
      "</div></a>"
    );
  }

  function visibleVehicles() {
    return getVehicles().filter(function (v) {
      return v.status !== "draft";
    });
  }

  // ---------------------------------------------------------- header / footer
  function renderChrome(active) {
    document.documentElement.lang = HTML_LANG[lang];
    var s = getSettings();
    var wa = waNumber(s);

    var header = document.getElementById("site-header");
    if (header) {
      var nav = [
        ["aanbod.html", "nav.stock", "stock"],
        ["aanbod.html?type=van", "nav.vans", "vans"],
        ["verkopen.html", "nav.sell", "sell"],
        ["contact.html", "nav.contact", "contact"],
      ]
        .map(function (n) {
          return '<a href="' + n[0] + '"' + (active === n[2] ? ' aria-current="page"' : "") + ">" + esc(t(n[1])) + "</a>";
        })
        .join("");
      var langs = LOCALES.map(function (l) {
        return '<a href="#" data-lang="' + l + '" lang="' + l + '"' + (l === lang ? ' aria-current="true"' : "") + ">" + l.toUpperCase() + "</a>";
      }).join("");
      header.className = "site-header";
      header.innerHTML =
        '<div class="demo-banner"><strong>' + esc(t("demo.banner")) + "</strong> · " + esc(t("demo.bannerText")) + "</div>" +
        '<div class="container inner">' +
        '<a href="index.html" class="logo" aria-label="Belthor Automotive – home"><img src="img/logo-wide.png" alt="Belthor Automotive" width="618" height="284"></a>' +
        '<nav class="main-nav" aria-label="' + esc(t("nav.menu")) + '">' + nav + "</nav>" +
        '<nav class="lang-switch" aria-label="' + esc(t("nav.language")) + '">' + langs + "</nav>" +
        (wa ? '<a class="btn btn-gold" href="' + waLink(wa) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' : "") +
        "</div>";
      header.querySelectorAll("[data-lang]").forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          setLang(a.getAttribute("data-lang"));
        });
      });
    }

    var footer = document.getElementById("site-footer");
    if (footer) {
      var contact = [];
      if (wa) contact.push('WhatsApp: <a href="' + waLink(wa) + '" target="_blank" rel="noopener noreferrer">' + esc(s.phone || "+" + wa) + "</a>");
      if (s.phone) contact.push(esc(t("common.call")) + ': <a href="' + telLink(s.phone) + '">' + esc(s.phone) + "</a>");
      if (s.email) contact.push('<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + "</a>");
      if (s.address) contact.push('<span style="white-space:pre-line">' + esc(s.address) + "</span>");
      if (s.opening_hours) contact.push('<span style="white-space:pre-line">' + esc(s.opening_hours) + "</span>");
      var company = [];
      if (s.company_name) company.push(esc(s.company_name));
      if (s.kbo_number) company.push(esc(t("footer.kbo")) + ": " + esc(s.kbo_number));
      if (s.vat_number) company.push(esc(t("footer.vat")) + ": " + esc(s.vat_number));
      footer.className = "site-footer";
      footer.innerHTML =
        '<div class="container cols" style="padding:48px 24px">' +
        '<div class="col"><img src="img/logo-wide.png" alt="Belthor Automotive" style="width:180px;height:auto"></div>' +
        '<div class="col"><h2>' + esc(t("footer.contact")) + "</h2>" + contact.map(function (c) { return "<div>" + c + "</div>"; }).join("") + "</div>" +
        (company.length ? '<div class="col"><h2>' + esc(t("footer.company")) + "</h2>" + company.map(function (c) { return "<div>" + c + "</div>"; }).join("") + "</div>" : "") +
        '<div class="col"><h2>' + esc(t("footer.links")) + "</h2>" +
        '<div><a href="aanbod.html">' + esc(t("nav.stock")) + "</a></div>" +
        '<div><a href="verkopen.html">' + esc(t("nav.sell")) + "</a></div>" +
        '<div><a href="contact.html">' + esc(t("nav.contact")) + "</a></div>" +
        '<div><a href="privacy.html">' + esc(t("footer.privacy")) + "</a></div>" +
        (s.instagram_url ? '<div><a href="' + esc(s.instagram_url) + '" target="_blank" rel="noopener noreferrer">Instagram</a></div>' : "") +
        '<div><a href="admin.html" style="color:var(--muted)">Login</a></div>' +
        "</div></div>" +
        '<div class="container legal">© ' + new Date().getFullYear() + " " + esc(s.company_name || "Belthor Automotive") + ". " + esc(t("footer.rights")) + "</div>" +
        '<div class="flag-strip" aria-hidden="true"><span></span><span></span><span></span></div>';
    }

    if (wa && !document.querySelector(".wa-float")) {
      var f = document.createElement("a");
      f.className = "wa-float";
      f.href = waLink(wa);
      f.target = "_blank";
      f.rel = "noopener noreferrer";
      f.setAttribute("aria-label", t("common.whatsappLong"));
      f.innerHTML =
        '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.65-4.95A8.5 8.5 0 1 1 8 19.4L3 21z"/></svg>';
      document.body.appendChild(f);
    }
    applyI18n();
  }

  window.Belthor = {
    LOCALES: LOCALES,
    lang: lang,
    t: t,
    esc: esc,
    euro: euro,
    num: num,
    km: km,
    firstReg: firstReg,
    title: title,
    fuelLabel: fuelLabel,
    transLabel: transLabel,
    kwToHp: kwToHp,
    price: price,
    description: description,
    waNumber: waNumber,
    waLink: waLink,
    telLink: telLink,
    photoBox: photoBox,
    carCard: carCard,
    getVehicles: getVehicles,
    saveVehicles: saveVehicles,
    visibleVehicles: visibleVehicles,
    getSettings: getSettings,
    saveSettings: saveSettings,
    resetDemo: resetDemo,
    renderChrome: renderChrome,
    applyI18n: applyI18n,
  };
})();
