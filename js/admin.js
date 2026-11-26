/*
 * Beheerpaneel – DEMO.
 * Alles wordt in de browser bewaard (localStorage). In de echte versie komt hier een database
 * en een beveiligde login. Wijzigingen hier zijn meteen zichtbaar op de publieke pagina's in dezelfde browser.
 */
(function () {
  "use strict";
  var B = window.Belthor;
  var esc = B.esc;
  var app = document.getElementById("app");
  var SESSION_KEY = "belthor_demo_admin";

  var STATUS = { draft: "Concept", published: "Online", reserved: "Gereserveerd", sold: "Verkocht" };
  var TYPES = { car: "Personenwagen", van: "Bestelwagen", pickup: "Pick-up / 4x4" };
  var FUELS = { petrol: "Benzine", diesel: "Diesel", hybrid: "Hybride", plugin_hybrid: "Plug-in hybride", electric: "Elektrisch", lpg: "LPG", cng: "CNG", other: "Andere" };
  var TRANS = { manual: "Manueel", automatic: "Automaat" };
  var VAT = {
    none: "Geen btw-vermelding (alleen prijs tonen)",
    margin: "Margeregeling – btw niet verrekenbaar",
    vat_included: "Btw verrekenbaar – prijs is incl. 21% btw",
    vat_excluded: "Prijs is excl. 21% btw",
  };
  var FEATURES = {
    air_conditioning: "Airconditioning", climate_control: "Klimaatregeling", navigation: "Navigatie",
    carplay_android_auto: "Apple CarPlay / Android Auto", bluetooth: "Bluetooth", parking_sensors: "Parkeersensoren",
    rear_camera: "Achteruitrijcamera", cruise_control: "Cruise control", heated_seats: "Verwarmde zetels",
    leather: "Lederen bekleding", panoramic_roof: "Panoramisch dak", alloy_wheels: "Lichtmetalen velgen",
    led_lights: "LED-verlichting", tow_bar: "Trekhaak", four_wheel_drive: "Vierwielaandrijving", isofix: "Isofix",
  };
  var EURO = ["euro1", "euro2", "euro3", "euro4", "euro5", "euro6", "euro6d", "euro7"];
  var LANGS = { fr: "Frans", nl: "Nederlands", pt: "Portugees", en: "Engels" };

  function eur(n) {
    return new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  }
  function kmNl(n) {
    return n == null ? "—" : new Intl.NumberFormat("nl-BE").format(n) + " km";
  }
  function loggedIn() {
    try { return window.sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return window.__belthorAdmin === true; }
  }
  function setLoggedIn(v) {
    window.__belthorAdmin = v;
    try {
      if (v) window.sessionStorage.setItem(SESSION_KEY, "1");
      else window.sessionStorage.removeItem(SESSION_KEY);
    } catch (e) { /* niets */ }
  }
  function opts(map, current, empty) {
    var html = empty ? '<option value="">' + esc(empty) + "</option>" : "";
    Object.keys(map).forEach(function (k) {
      html += '<option value="' + k + '"' + (String(current) === k ? " selected" : "") + ">" + esc(map[k]) + "</option>";
    });
    return html;
  }


  /** Eigen bevestigingsvenster (window.confirm werkt niet overal). */
  function confirmDialog(message, onYes) {
    var wrap = document.createElement("div");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.style.cssText = "position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px";
    wrap.innerHTML = '<div class="card-section" style="max-width:420px;width:100%"><p style="margin:0 0 18px">' + esc(message) + '</p>' +
      '<div class="actions"><button type="button" class="btn" data-no>Annuleren</button><button type="button" class="btn btn-danger" data-yes>Bevestigen</button></div></div>';
    document.body.appendChild(wrap);
    var close = function () { wrap.remove(); document.removeEventListener("keydown", onKey); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    wrap.querySelector("[data-no]").onclick = close;
    wrap.querySelector("[data-yes]").onclick = function () { close(); onYes(); };
    wrap.onclick = function (e) { if (e.target === wrap) close(); };
    wrap.querySelector("[data-no]").focus();
  }

  // ------------------------------------------------------------------ login
  function renderLogin(error) {
    app.innerHTML =
      '<div class="login-wrap"><form class="login-card" id="login" novalidate>' +
      '<img src="img/logo-wide.png" alt="Belthor Automotive" style="width:200px;height:auto;margin:0 auto">' +
      '<h1 style="margin:0;font-size:22px;text-align:center">Beheer – inloggen</h1>' +
      '<p class="demo-banner" style="border-radius:8px;margin:0"><strong>Demo</strong> · vul eender welk e-mailadres en wachtwoord in. In de echte versie krijgt de eigenaar een eigen, beveiligd account.</p>' +
      '<div class="field"><label for="email">E-mail</label><input id="email" type="email" class="input" autocomplete="username"></div>' +
      '<div class="field"><label for="pw">Wachtwoord</label><input id="pw" type="password" class="input" autocomplete="current-password"></div>' +
      (error ? '<p class="form-error" role="alert">' + esc(error) + "</p>" : "") +
      '<button type="submit" class="btn btn-gold">Inloggen</button>' +
      '<a href="index.html" style="text-align:center;font-size:14px">← Terug naar de website</a>' +
      "</form></div>";
    document.getElementById("login").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim();
      var pw = document.getElementById("pw").value;
      if (!email || !pw) return renderLogin("Vul e-mail en wachtwoord in.");
      setLoggedIn(true);
      if (!location.hash) location.hash = "#list";
      route();
    });
  }

  // ------------------------------------------------------------------ shell
  function shell(active, content) {
    var link = function (hash, label, key) {
      return '<a href="' + hash + '"' + (active === key ? ' aria-current="page"' : "") + ">" + label + "</a>";
    };
    app.innerHTML =
      '<div class="demo-banner"><strong>Demo-beheer</strong> · wijzigingen worden alleen in deze browser bewaard</div>' +
      '<div class="admin-shell"><aside class="admin-side">' +
      '<img src="img/logo-wide.png" alt="Belthor Automotive">' +
      '<nav aria-label="Beheer">' +
      link("#list", "Advertenties", "list") +
      link("#new", "+ Nieuwe advertentie", "new") +
      link("#settings", "Bedrijfsgegevens", "settings") +
      '<a href="index.html" target="_blank" rel="noopener">Bekijk website ↗</a>' +
      '<button type="button" id="reset-demo">Demo herstellen</button>' +
      '<button type="button" id="logout">Uitloggen</button>' +
      "</nav></aside>" +
      '<main class="admin-main">' + content + "</main></div>";
    document.getElementById("logout").onclick = function () {
      setLoggedIn(false);
      location.hash = "";
      renderLogin();
    };
    document.getElementById("reset-demo").onclick = function () {
      confirmDialog("Alle demo-wijzigingen wissen en de originele voorbeeldwagens terugzetten?", function () {
        B.resetDemo();
        location.hash = "#list";
        route();
      });
    };
  }

  // ------------------------------------------------------------------ lijst
  function renderList() {
    var all = B.getVehicles().sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
    var counts = { draft: 0, published: 0, reserved: 0, sold: 0 };
    all.forEach(function (v) { counts[v.status] = (counts[v.status] || 0) + 1; });

    var stats = Object.keys(STATUS).map(function (s) {
      return '<div class="stat"><p>' + STATUS[s] + "</p><strong>" + counts[s] + "</strong></div>";
    }).join("");

    var rows = all.map(function (v) {
      var photo = v.photos && v.photos[0];
      return (
        '<tr data-id="' + esc(v.id) + '" data-search="' + esc((v.make + " " + v.model + " " + (v.version || "") + " " + v.id).toLowerCase()) + '" data-status="' + v.status + '">' +
        '<td><div style="display:flex;align-items:center;gap:12px">' +
        (photo ? '<img class="thumb" src="' + esc(photo) + '" alt="">' : '<div class="thumb"></div>') +
        "<div><strong>" + esc(v.make + " " + v.model) + '</strong><br><span class="muted" style="font-size:13px">' +
        (v.photos || []).length + " foto('s)</span></div></div></td>" +
        '<td><strong style="color:var(--gold-text)">' + eur(v.price_eur) + '</strong><br><span class="muted" style="font-size:12px">' +
        ({ none: "", margin: "marge", vat_included: "incl. btw", vat_excluded: "excl. btw" }[v.vat_regime] || "") + "</span></td>" +
        '<td class="muted">' + kmNl(v.mileage_km) + " · " + v.year + "</td>" +
        '<td><span class="status-pill st-' + v.status + '">' + STATUS[v.status] + "</span></td>" +
        '<td><div class="actions">' +
        '<a class="btn btn-small" href="#edit/' + encodeURIComponent(v.id) + '">Bewerken</a>' +
        '<label class="sr-only" for="st-' + esc(v.id) + '">Status wijzigen</label>' +
        '<select class="select" style="width:auto;min-height:36px" id="st-' + esc(v.id) + '" data-status-for="' + esc(v.id) + '">' + opts(STATUS, v.status) + "</select>" +
        '<button type="button" class="btn btn-danger btn-small" data-delete="' + esc(v.id) + '">Verwijderen</button>' +
        "</div></td></tr>"
      );
    }).join("");

    shell("list",
      '<div class="admin-head"><h1>Mijn advertenties</h1><a class="btn btn-gold" href="#new">+ Nieuwe advertentie</a></div>' +
      '<div class="stats">' + stats + "</div>" +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">' +
      '<label for="q" class="sr-only">Zoeken</label><input id="q" class="input" placeholder="Zoek op merk of model" style="flex:1 1 260px;width:auto">' +
      '<label for="sf" class="sr-only">Status</label><select id="sf" class="select" style="width:auto">' + opts(STATUS, "", "Alle statussen") + "</select></div>" +
      (all.length
        ? '<div class="table-wrap"><table class="table"><thead><tr><th>Wagen</th><th>Prijs</th><th>Km / jaar</th><th>Status</th><th style="text-align:right">Acties</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
        : '<div class="card-section"><p style="margin:0">Nog geen advertenties.</p></div>')
    );

    function filter() {
      var q = document.getElementById("q").value.trim().toLowerCase();
      var sf = document.getElementById("sf").value;
      app.querySelectorAll("tbody tr").forEach(function (tr) {
        var ok = (!q || tr.getAttribute("data-search").indexOf(q) >= 0) && (!sf || tr.getAttribute("data-status") === sf);
        tr.hidden = !ok;
      });
    }
    var qEl = document.getElementById("q");
    if (qEl) qEl.oninput = filter;
    var sfEl = document.getElementById("sf");
    if (sfEl) sfEl.onchange = filter;

    app.querySelectorAll("[data-status-for]").forEach(function (sel) {
      sel.onchange = function () {
        var id = sel.getAttribute("data-status-for");
        var list = B.getVehicles();
        list.forEach(function (v) { if (v.id === id) v.status = sel.value; });
        B.saveVehicles(list);
        renderList();
      };
    });
    app.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-delete");
        var v = B.getVehicles().filter(function (x) { return x.id === id; })[0];
        if (!v) return;
        confirmDialog('"' + v.make + " " + v.model + '" definitief verwijderen, inclusief foto\'s?', function () {
          B.saveVehicles(B.getVehicles().filter(function (x) { return x.id !== id; }));
          renderList();
        });
      };
    });
  }

  // ------------------------------------------------------------------ formulier
  function resizeToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("lezen mislukt")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("geen geldige afbeelding")); };
        img.onload = function () {
          // Klein houden: de browseropslag van de demo is beperkt (± 5 MB).
          var max = 1280;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.75));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderForm(id) {
    var existing = id ? B.getVehicles().filter(function (v) { return v.id === id; })[0] : null;
    if (id && !existing) {
      shell("list", '<div class="card-section"><p style="margin:0">Advertentie niet gevonden. <a href="#list">Terug</a></p></div>');
      return;
    }
    var v = existing || {
      status: "draft", vehicle_type: "car", make: "", model: "", version: null, year: "", month: null, mileage_km: "",
      fuel: "", transmission: "", power_kw: null, engine_cc: null, euro_norm: null, co2_gkm: null, color: null, doors: null,
      seats: null, previous_owners: null, price_eur: "", vat_regime: "none", has_inspection: false, has_pink_card: false,
      has_carpass: false, has_service_book: false, warranty: null, features: [], description: {}, photos: [],
    };
    var photos = (v.photos || []).slice();
    var val = function (x) { return x == null ? "" : esc(x); };
    var field = function (name, label, inner) {
      return '<div class="field"><label for="' + name + '">' + label + "</label>" + inner + '<p class="field-error" data-err="' + name + '" hidden></p></div>';
    };
    var input = function (name, value, extra) {
      return '<input id="' + name + '" name="' + name + '" class="input" value="' + val(value) + '" ' + (extra || "") + ">";
    };
    var months = '<option value="">Onbekend</option>' + ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"].map(function (m, i) {
      return '<option value="' + (i + 1) + '"' + (v.month === i + 1 ? " selected" : "") + ">" + String(i + 1).padStart(2, "0") + " – " + m + "</option>";
    }).join("");
    var euroOpts = '<option value="">Onbekend</option>' + EURO.map(function (e) {
      return '<option value="' + e + '"' + (v.euro_norm === e ? " selected" : "") + ">" + e.replace("euro", "Euro ") + "</option>";
    }).join("");
    var check = function (name, label, checked) {
      return '<label class="check"><input type="checkbox" name="' + name + '"' + (checked ? " checked" : "") + "> " + esc(label) + "</label>";
    };

    shell(existing ? "list" : "new",
      '<p style="margin:0 0 12px"><a href="#list">← Terug naar advertenties</a></p>' +
      '<div class="admin-head"><h1>' + (existing ? esc(v.make + " " + v.model) : "Nieuwe advertentie") + "</h1>" +
      (existing && v.status !== "draft" ? '<a class="btn" href="wagen.html?id=' + encodeURIComponent(v.id) + '" target="_blank" rel="noopener">Bekijk op de site ↗</a>' : "") +
      "</div>" +
      '<form id="vf" novalidate style="display:flex;flex-direction:column;gap:20px">' +

      '<section class="card-section"><h2>Foto\'s</h2>' +
      '<p class="muted" style="margin:-8px 0 16px;font-size:14px">De eerste foto is de hoofdfoto. Foto\'s worden automatisch verkleind.</p>' +
      '<div class="dropzone" id="drop"><p style="margin:0 0 12px">Sleep foto\'s hierheen of</p>' +
      '<label class="btn btn-gold" style="cursor:pointer">Foto\'s kiezen<input type="file" id="files" accept="image/jpeg,image/png,image/webp" multiple hidden></label>' +
      '<p id="upl" role="status" style="margin:12px 0 0" hidden></p></div>' +
      '<div class="photo-grid" id="photos" style="margin-top:16px"></div></section>' +

      '<section class="card-section"><h2>Basisgegevens</h2><div class="grid-fields">' +
      field("vehicle_type", "Type *", '<select id="vehicle_type" name="vehicle_type" class="select">' + opts(TYPES, v.vehicle_type) + "</select>") +
      field("make", "Merk *", input("make", v.make, 'maxlength="60" placeholder="bv. Peugeot"')) +
      field("model", "Model *", input("model", v.model, 'maxlength="80" placeholder="bv. Partner"')) +
      field("version", "Versie", input("version", v.version, 'maxlength="120" placeholder="bv. 1.6 HDi"')) +
      field("year", "Bouwjaar (1e inschrijving) *", input("year", v.year, 'inputmode="numeric" maxlength="4"')) +
      field("month", "Maand 1e inschrijving", '<select id="month" name="month" class="select">' + months + "</select>") +
      field("mileage_km", "Kilometerstand", input("mileage_km", v.mileage_km, 'inputmode="numeric" placeholder="leeg = onbekend"')) +
      field("fuel", "Brandstof *", '<select id="fuel" name="fuel" class="select">' + opts(FUELS, v.fuel, "Kies…") + "</select>") +
      field("transmission", "Versnellingsbak", '<select id="transmission" name="transmission" class="select">' + opts(TRANS, v.transmission || "", "Onbekend") + "</select>") +
      field("power_kw", "Vermogen (kW)", input("power_kw", v.power_kw, 'inputmode="numeric"') + '<span class="muted" style="font-size:12px" id="hp"></span>') +
      field("engine_cc", "Cilinderinhoud (cm³)", input("engine_cc", v.engine_cc, 'inputmode="numeric"')) +
      field("euro_norm", "Euronorm", '<select id="euro_norm" name="euro_norm" class="select">' + euroOpts + "</select>") +
      field("co2_gkm", "CO₂ (g/km)", input("co2_gkm", v.co2_gkm, 'inputmode="numeric"')) +
      field("color", "Kleur", input("color", v.color, 'maxlength="40"')) +
      field("doors", "Deuren", input("doors", v.doors, 'inputmode="numeric"')) +
      field("seats", "Zitplaatsen", input("seats", v.seats, 'inputmode="numeric"')) +
      field("previous_owners", "Vorige eigenaars", input("previous_owners", v.previous_owners, 'inputmode="numeric"')) +
      "</div></section>" +

      '<section class="card-section"><h2>Prijs</h2><div class="grid-fields">' +
      field("price_eur", "Prijs (€) *", input("price_eur", v.price_eur, 'inputmode="numeric" placeholder="bv. 3900"')) +
      '<div class="field" style="grid-column:1 / -1"><label for="vat_regime">Btw-regime *</label><select id="vat_regime" name="vat_regime" class="select">' + opts(VAT, v.vat_regime) + "</select></div>" +
      '</div><p id="price-preview" style="margin:12px 0 0;color:var(--gold-text);font-weight:600"></p></section>' +

      '<section class="card-section"><h2>Documenten &amp; uitrusting</h2><div class="grid-fields" style="gap:0 16px">' +
      check("has_inspection", "Technische keuring", v.has_inspection) + check("has_pink_card", "Roze kaart", v.has_pink_card) +
      check("has_carpass", "Car-Pass", v.has_carpass) + check("has_service_book", "Onderhoudsboekje", v.has_service_book) +
      '</div><div class="field" style="max-width:480px;margin:12px 0 20px"><label for="warranty">Garantie (leeg laten als er geen is)</label>' + input("warranty", v.warranty, 'maxlength="200" placeholder="bv. 12 maanden"') + "</div>" +
      '<p class="field-label" style="margin:0 0 6px">Uitrusting</p><div class="grid-fields" style="gap:0 16px">' +
      Object.keys(FEATURES).map(function (f) {
        return '<label class="check"><input type="checkbox" name="features" value="' + f + '"' + ((v.features || []).indexOf(f) >= 0 ? " checked" : "") + "> " + esc(FEATURES[f]) + "</label>";
      }).join("") + "</div></section>" +

      '<section class="card-section"><h2>Omschrijving</h2><p class="muted" style="margin:0 0 12px;font-size:14px">Vul minstens één taal in. Bezoekers zien hun eigen taal; ontbreekt die, dan tonen we een andere ingevulde taal.</p>' +
      '<div class="lang-tabs" role="tablist">' + Object.keys(LANGS).map(function (l, i) {
        return '<button type="button" role="tab" class="btn btn-small" data-lang-tab="' + l + '" aria-selected="' + (i === 0) + '">' + LANGS[l] + "</button>";
      }).join("") + "</div>" +
      Object.keys(LANGS).map(function (l, i) {
        return '<div class="field" data-lang-pane="' + l + '"' + (i === 0 ? "" : " hidden") + '><label for="description_' + l + '">Omschrijving – ' + LANGS[l] + '</label><textarea id="description_' + l + '" name="description_' + l + '" class="textarea" style="min-height:160px" maxlength="5000">' + val((v.description || {})[l]) + "</textarea></div>";
      }).join("") + "</section>" +

      '<section class="card-section"><h2>Status</h2><div style="display:flex;flex-wrap:wrap;gap:4px 24px">' +
      Object.keys(STATUS).map(function (s) {
        return '<label class="check"><input type="radio" name="status" value="' + s + '"' + (v.status === s ? " checked" : "") + "> " + (s === "draft" ? "Concept (niet zichtbaar op de site)" : STATUS[s]) + "</label>";
      }).join("") + "</div></section>" +

      '<div class="sticky-bar"><p id="save-msg" role="status" style="margin:0"></p>' +
      (existing ? '<button type="button" class="btn btn-danger" id="del">Verwijderen</button>' : "") +
      '<button type="submit" class="btn btn-gold">' + (existing ? "Wijzigingen opslaan" : "Advertentie aanmaken") + "</button></div>" +
      "</form>"
    );

    var form = document.getElementById("vf");

    // Taal-tabs
    app.querySelectorAll("[data-lang-tab]").forEach(function (b) {
      b.onclick = function () {
        var l = b.getAttribute("data-lang-tab");
        app.querySelectorAll("[data-lang-tab]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
        app.querySelectorAll("[data-lang-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-lang-pane") !== l; });
      };
    });

    // pk en prijsvoorbeeld live
    function updateHints() {
      var kw = parseInt(document.getElementById("power_kw").value, 10);
      document.getElementById("hp").textContent = kw > 0 ? "= " + B.kwToHp(kw) + " pk" : "pk wordt automatisch berekend";
      var p = parseInt(String(document.getElementById("price_eur").value).replace(/[\s.]/g, ""), 10);
      var reg = document.getElementById("vat_regime").value;
      var txt = "";
      if (isFinite(p)) {
        if (reg === "none") txt = eur(p);
        if (reg === "margin") txt = eur(p) + " — btw niet verrekenbaar (margeregeling)";
        if (reg === "vat_included") txt = eur(p) + " incl. btw = " + eur(Math.round(p / 1.21)) + " excl. btw";
        if (reg === "vat_excluded") txt = eur(p) + " excl. btw = " + eur(Math.round(p * 1.21)) + " incl. btw";
      }
      document.getElementById("price-preview").textContent = txt ? "Op de site: " + txt : "";
    }
    ["power_kw", "price_eur"].forEach(function (n) { document.getElementById(n).addEventListener("input", updateHints); });
    document.getElementById("vat_regime").addEventListener("change", updateHints);
    updateHints();

    // Foto's
    function drawPhotos() {
      var box = document.getElementById("photos");
      box.innerHTML = photos.map(function (src, i) {
        return '<div class="photo-item' + (i === 0 ? " main" : "") + '"><img src="' + esc(src) + '" alt="Foto ' + (i + 1) + '"><div class="tools">' +
          (i === 0 ? '<span class="muted" style="font-size:12px;padding:8px 4px;flex:1 1 100%">Hoofdfoto</span>' : '<button type="button" class="btn btn-small" data-main="' + i + '">Hoofdfoto</button>') +
          '<button type="button" class="btn btn-small" data-left="' + i + '"' + (i === 0 ? " disabled" : "") + ' aria-label="Foto ' + (i + 1) + ' naar links">←</button>' +
          '<button type="button" class="btn btn-small" data-right="' + i + '"' + (i === photos.length - 1 ? " disabled" : "") + ' aria-label="Foto ' + (i + 1) + ' naar rechts">→</button>' +
          '<button type="button" class="btn btn-danger btn-small" data-rm="' + i + '" aria-label="Foto ' + (i + 1) + ' verwijderen">✕</button>' +
          "</div></div>";
      }).join("");
      box.querySelectorAll("[data-main]").forEach(function (b) { b.onclick = function () { var i = +b.getAttribute("data-main"); photos.unshift(photos.splice(i, 1)[0]); drawPhotos(); }; });
      box.querySelectorAll("[data-left]").forEach(function (b) { b.onclick = function () { var i = +b.getAttribute("data-left"); var x = photos[i]; photos[i] = photos[i - 1]; photos[i - 1] = x; drawPhotos(); }; });
      box.querySelectorAll("[data-right]").forEach(function (b) { b.onclick = function () { var i = +b.getAttribute("data-right"); var x = photos[i]; photos[i] = photos[i + 1]; photos[i + 1] = x; drawPhotos(); }; });
      box.querySelectorAll("[data-rm]").forEach(function (b) { b.onclick = function () { confirmDialog("Deze foto verwijderen?", function () { photos.splice(+b.getAttribute("data-rm"), 1); drawPhotos(); }); }; });
    }
    function addFiles(fileList) {
      var files = Array.prototype.filter.call(fileList, function (f) { return /^image\//.test(f.type); });
      if (!files.length) return;
      var status = document.getElementById("upl");
      status.hidden = false;
      var failed = [];
      var chain = Promise.resolve();
      files.forEach(function (f, i) {
        chain = chain.then(function () {
          status.textContent = "Foto " + (i + 1) + " van " + files.length + " verwerken…";
          return resizeToDataUrl(f).then(function (url) { photos.push(url); }, function () { failed.push(f.name); });
        });
      });
      chain.then(function () {
        drawPhotos();
        status.textContent = failed.length ? "Niet gelukt voor: " + failed.join(", ") : "Klaar. Vergeet niet op te slaan.";
      });
    }
    document.getElementById("files").onchange = function (e) { addFiles(e.target.files); e.target.value = ""; };
    var drop = document.getElementById("drop");
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add("drag"); };
    drop.ondragleave = function () { drop.classList.remove("drag"); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove("drag"); addFiles(e.dataTransfer.files); };
    drawPhotos();

    if (existing) {
      document.getElementById("del").onclick = function () {
        confirmDialog('"' + v.make + " " + v.model + '" definitief verwijderen?', function () {
          B.saveVehicles(B.getVehicles().filter(function (x) { return x.id !== v.id; }));
          location.hash = "#list";
        });
      };
    }

    // Opslaan
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var str = function (k) { return String(fd.get(k) || "").trim(); };
      var errors = {};
      var intOrNull = function (k, label, min, max, required) {
        var raw = str(k).replace(/[\s.]/g, "");
        if (!raw) { if (required) errors[k] = label + " is verplicht."; return null; }
        if (!/^\d+$/.test(raw)) { errors[k] = label + ": alleen cijfers."; return null; }
        var n = parseInt(raw, 10);
        if (n < min || n > max) { errors[k] = label + " moet tussen " + min + " en " + max + " liggen."; return null; }
        return n;
      };
      var thisYear = new Date().getFullYear();
      var data = {
        vehicle_type: str("vehicle_type"),
        make: str("make"),
        model: str("model"),
        version: str("version") || null,
        year: intOrNull("year", "Bouwjaar", 1950, thisYear + 1, true),
        month: str("month") ? parseInt(str("month"), 10) : null,
        mileage_km: intOrNull("mileage_km", "Kilometerstand", 0, 2000000, false),
        fuel: str("fuel"),
        transmission: str("transmission") || null,
        power_kw: intOrNull("power_kw", "Vermogen", 1, 2000, false),
        engine_cc: intOrNull("engine_cc", "Cilinderinhoud", 1, 20000, false),
        euro_norm: str("euro_norm") || null,
        co2_gkm: intOrNull("co2_gkm", "CO₂", 0, 1000, false),
        color: str("color") || null,
        doors: intOrNull("doors", "Deuren", 1, 9, false),
        seats: intOrNull("seats", "Zitplaatsen", 1, 99, false),
        previous_owners: intOrNull("previous_owners", "Vorige eigenaars", 0, 99, false),
        price_eur: intOrNull("price_eur", "Prijs", 0, 10000000, true),
        vat_regime: str("vat_regime"),
        has_inspection: fd.get("has_inspection") === "on",
        has_pink_card: fd.get("has_pink_card") === "on",
        has_carpass: fd.get("has_carpass") === "on",
        has_service_book: fd.get("has_service_book") === "on",
        warranty: str("warranty") || null,
        features: fd.getAll("features").map(String),
        description: {},
        status: str("status") || "draft",
        photos: photos,
      };
      Object.keys(LANGS).forEach(function (l) { var d = str("description_" + l); if (d) data.description[l] = d; });
      if (!data.make) errors.make = "Merk is verplicht.";
      if (!data.model) errors.model = "Model is verplicht.";
      if (!FUELS[data.fuel]) errors.fuel = "Kies een brandstof.";
      if (!TYPES[data.vehicle_type]) errors.vehicle_type = "Kies een type.";

      app.querySelectorAll("[data-err]").forEach(function (p) {
        var k = p.getAttribute("data-err");
        p.textContent = errors[k] || "";
        p.hidden = !errors[k];
        var el = document.getElementById(k);
        if (el) el.classList.toggle("has-error", !!errors[k]);
      });
      var msg = document.getElementById("save-msg");
      if (Object.keys(errors).length) {
        msg.className = "form-error";
        msg.textContent = "Controleer de rood gemarkeerde velden.";
        var firstErr = app.querySelector(".has-error");
        if (firstErr) firstErr.focus();
        return;
      }

      var list = B.getVehicles();
      if (existing) {
        list = list.map(function (x) { return x.id === existing.id ? Object.assign({}, x, data) : x; });
      } else {
        var slug = (data.make + "-" + data.model + "-" + data.year).toLowerCase()
          .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        data.id = slug + "-" + Math.random().toString(36).slice(2, 6);
        data.created_at = new Date().toISOString();
        list.push(data);
      }
      if (!B.saveVehicles(list)) {
        msg.className = "form-error";
        msg.textContent = "Browseropslag vol (demo-beperking): verwijder enkele foto's en probeer opnieuw.";
        return;
      }
      if (existing) {
        msg.className = "";
        msg.style.color = "var(--ok)";
        msg.textContent = "Opgeslagen.";
      } else {
        location.hash = "#edit/" + encodeURIComponent(data.id);
      }
    });
  }

  // ------------------------------------------------------------------ bedrijfsgegevens
  function renderSettings() {
    var s = B.getSettings();
    var f = function (name, label, ph, multiline, hint) {
      var v = s[name] == null ? "" : s[name];
      return '<div class="field"' + (multiline ? ' style="grid-column:1 / -1"' : "") + '><label for="' + name + '">' + label + "</label>" +
        (multiline
          ? '<textarea id="' + name + '" name="' + name + '" class="textarea" style="min-height:90px" placeholder="' + esc(ph || "") + '">' + esc(v) + "</textarea>"
          : '<input id="' + name + '" name="' + name + '" class="input" value="' + esc(v) + '" placeholder="' + esc(ph || "") + '">') +
        (hint ? '<span class="muted" style="font-size:12px">' + esc(hint) + "</span>" : "") + "</div>";
    };
    shell("settings",
      '<div class="admin-head"><h1>Bedrijfsgegevens</h1></div>' +
      '<p class="muted" style="margin:-12px 0 20px;max-width:720px">Deze gegevens verschijnen onderaan elke pagina en op de contactpagina. Lege velden worden niet getoond. Een Belgische bedrijfswebsite moet minstens de bedrijfsnaam, het ondernemingsnummer en een contactadres vermelden.</p>' +
      '<form id="sf" class="card-section" style="display:flex;flex-direction:column;gap:16px" novalidate><div class="grid-fields">' +
      f("company_name", "Officiële bedrijfsnaam", "zoals in de KBO") +
      f("kbo_number", "Ondernemingsnummer (KBO)", "0123.456.789") +
      f("vat_number", "Btw-nummer", "BE 0123.456.789") +
      f("email", "E-mail", "") +
      f("phone", "Telefoon (getoond op de site)", "+32 …") +
      f("whatsapp", "WhatsApp-nummer", "+32 …", false, "Met landcode. Wordt gebruikt voor alle WhatsApp-knoppen.") +
      f("instagram_url", "Instagram-link", "https://www.instagram.com/…") +
      f("address", "Adres", "Straat nr\n1000 Brussel — of: Enkel op afspraak, Brussel", true) +
      f("opening_hours", "Openingsuren", "ma–vr 9u–18u\nza 10u–16u", true) +
      '</div><p id="smsg" role="status" style="margin:0"></p><div><button type="submit" class="btn btn-gold">Opslaan</button></div></form>'
    );
    document.getElementById("sf").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var out = {};
      ["company_name", "kbo_number", "vat_number", "email", "phone", "whatsapp", "instagram_url", "address", "opening_hours"].forEach(function (k) {
        out[k] = String(fd.get(k) || "").trim();
      });
      var msg = document.getElementById("smsg");
      if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) { msg.className = "form-error"; msg.textContent = "Ongeldig e-mailadres."; return; }
      if (out.instagram_url && !/^https:\/\//.test(out.instagram_url)) { msg.className = "form-error"; msg.textContent = "De Instagram-link moet met https:// beginnen."; return; }
      B.saveSettings(out);
      msg.className = "";
      msg.style.color = "var(--ok)";
      msg.textContent = "Opgeslagen.";
    });
  }

  // ------------------------------------------------------------------ router
  function route() {
    if (!loggedIn()) return renderLogin();
    var h = location.hash.replace(/^#/, "");
    window.scrollTo(0, 0);
    if (h === "new") return renderForm(null);
    if (h.indexOf("edit/") === 0) return renderForm(decodeURIComponent(h.slice(5)));
    if (h === "settings") return renderSettings();
    return renderList();
  }
  window.addEventListener("hashchange", route);
  route();
})();
