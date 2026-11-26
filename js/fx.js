/* Effecten: scroll-reveal, tilt op kaarten, tellers, header-schaduw. Doet niets bij reduced motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Header wordt donkerder bij scrollen
  function onScroll() {
    var h = document.querySelector(".site-header");
    if (h) h.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Scroll-reveal
  function reveal(root) {
    var els = (root || document).querySelectorAll(".reveal:not(.in), .section-head:not(.in), .display.underline:not(.in)");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el, i) {
      if (el.classList.contains("reveal") && !el.style.transitionDelay) el.style.transitionDelay = Math.min(i % 4, 3) * 80 + "ms";
      io.observe(el);
    });
  }

  // 3D-tilt + lichtvlek op kaarten (alleen met muis)
  function tilt(root) {
    if (reduce || !finePointer) return;
    (root || document).querySelectorAll(".car-card:not([data-tilt])").forEach(function (card) {
      card.setAttribute("data-tilt", "1");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var strength = card.classList.contains("car-row") ? 2 : 6;
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * strength) + "deg) rotateY(" + ((x - 0.5) * strength) + "deg) translateY(-4px)";
        card.style.setProperty("--mx", x * 100 + "%");
        card.style.setProperty("--my", y * 100 + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  // Tellers die oplopen tot hun echte waarde
  function counters(root) {
    (root || document).querySelectorAll("[data-count]:not([data-counted])").forEach(function (el) {
      el.setAttribute("data-counted", "1");
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (reduce || target === 0) { el.textContent = String(target); return; }
      var start = null;
      var dur = 1400;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      }
      var io = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); window.requestAnimationFrame(step); }
      }) : null;
      if (io) io.observe(el); else el.textContent = String(target);
    });
  }

  window.BelthorFx = {
    refresh: function (root) { reveal(root); tilt(root); counters(root); },
  };
  document.addEventListener("DOMContentLoaded", function () { window.BelthorFx.refresh(); });
  if (document.readyState !== "loading") window.BelthorFx.refresh();
})();
