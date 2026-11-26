/* Formulieren in de demo: geen server, het bericht wordt in WhatsApp geopend. */
(function () {
  "use strict";
  var B = window.Belthor;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * @param {HTMLFormElement} form
   * @param {(fd: FormData) => string[]} extraLines  extra regels bovenaan het bericht
   * @param {string[]} requiredExtra  extra verplichte velden (namen)
   */
  window.bindWhatsAppForm = function (form, extraLines, requiredExtra) {
    var errorEl = form.querySelector("[data-form-error]");
    var okEl = form.querySelector("[data-form-ok]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var val = function (k) {
        return String(fd.get(k) || "").trim();
      };
      var err = null;
      (requiredExtra || []).forEach(function (k) {
        if (!err && !val(k)) err = "form.required";
      });
      if (!err && !val("name")) err = "form.required";
      else if (!err && !val("phone") && !val("email")) err = "form.phoneOrEmail";
      else if (!err && val("email") && !EMAIL_RE.test(val("email"))) err = "form.invalidEmail";
      else if (!err && fd.get("consent") !== "on") err = "form.consentRequired";

      if (err) {
        errorEl.textContent = B.t(err);
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;

      var wa = B.waNumber(B.getSettings());
      if (!wa) {
        errorEl.textContent = B.t("form.error");
        errorEl.hidden = false;
        return;
      }
      var lines = (extraLines ? extraLines(fd) : []).filter(Boolean);
      lines.push(B.t("form.name") + ": " + val("name"));
      if (val("phone")) lines.push(B.t("form.phone") + ": " + val("phone"));
      if (val("email")) lines.push(B.t("form.email") + ": " + val("email"));
      if (val("message")) lines.push("", val("message"));

      var href = B.waLink(wa, lines.join("\n"));
      var opened = null;
      try { opened = window.open(href, "_blank", "noopener"); } catch (err) { opened = null; }
      // Werkt het automatisch openen niet (popup-blokker), dan staat er een knop klaar.
      okEl.innerHTML = B.esc(B.t("form.success")) +
        ' <a class="btn btn-whatsapp btn-small" style="margin-top:10px" target="_blank" rel="noopener noreferrer" href="' + B.esc(href) + '">WhatsApp</a>';
      okEl.hidden = false;
      void opened;
    });
  };
})();
