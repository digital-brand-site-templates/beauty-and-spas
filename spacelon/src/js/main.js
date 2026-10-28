/*
Template Name: Spacelon
File Name: main.js
Author Name: ThemeVault
Author URI: https://www.themevault.net/
Version: 2.0

Dependency-free. Bootstrap's own bundle drives the navbar collapse, the
carousel and the gallery tabs; everything below replaces what jQuery,
custom.js, counterup, waypoints and lightbox.js used to do.
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* Back to top — fades in past 100px, returns to the top (custom.js) */
    var toTop = document.getElementById("back-to-top");
    if (toTop) {
        var toggleToTop = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
        toggleToTop();
        window.addEventListener("scroll", toggleToTop, { passive: true });
        toTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }


    /* Tapping a link in the collapsed menu closes it. Dropdown toggles are
       excluded: tapping Shop or Pages opens a submenu, it does not navigate. */
    var collapse = document.querySelector(".navbar-collapse");
    if (collapse) {
        collapse.addEventListener("click", function (e) {
            var link = e.target.closest("a");
            if (!link || link.classList.contains("dropdown-toggle") || link.classList.contains("dropbtn")) return;
            if (!collapse.classList.contains("show")) return;
            var inst = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (inst) inst.hide();
        });
    }


    /* Forms: validate, then say so — a static template posts nowhere. Every
       form that submits carries a .tv-form-note the porter added. */
    document.querySelectorAll("form").forEach(function (form) {
        var note = form.querySelector(".tv-form-note");
        if (!note) return;
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var ok = true;
            form.querySelectorAll("[required]").forEach(function (f) {
                var bad = !f.checkValidity();
                f.classList.toggle("is-invalid", bad);
                if (bad && ok) { f.focus(); ok = false; }
            });
            if (!ok) return;
            note.hidden = false; note.focus();
            form.reset();
        });
        form.querySelectorAll("[required]").forEach(function (f) {
            f.addEventListener("input", function () { if (f.checkValidity()) f.classList.remove("is-invalid"); });
        });
    });


    /* Counters on every page — counterup + waypoints in v1: each <h3
       class="counter"> counts from data-min to data-max once it scrolls into
       view. v1's data-increment / data-delay are kept as the step and the
       tick interval; the text in the markup is the final value. */
    var counters = document.querySelectorAll(".counter[data-max]");
    if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                io.unobserve(el);
                var min = parseInt(el.getAttribute("data-min") || "0", 10);
                var max = parseInt(el.getAttribute("data-max") || el.textContent, 10);
                var step = Math.max(1, parseInt(el.getAttribute("data-increment") || "1", 10));
                var ticks = Math.ceil((max - min) / step);
                var duration = 1500;
                var start = null;
                var frame = function (t) {
                    if (start === null) start = t;
                    var p = Math.min(1, (t - start) / duration);
                    var v = min + Math.round((max - min) * p / step) * step;
                    el.textContent = Math.min(max, v);
                    if (p < 1) requestAnimationFrame(frame); else el.textContent = max;
                };
                if (ticks > 0) requestAnimationFrame(frame);
            });
        }, { threshold: 0.4 });
        counters.forEach(function (el) { io.observe(el); });
    }


    /* Lightbox — replaces magnific-popup on `[data-image-popup]` (lightbox.js's `data-lightbox` set): arrows and the keyboard step through
       the photos. Focus is trapped and restored. */
    var popupLinks = Array.prototype.slice.call(document.querySelectorAll("[data-image-popup]"));
    var videoBtn = document.getElementById("popup-youtube");
    if (popupLinks.length || videoBtn) {
        var box = document.createElement("div");
        box.className = "tv-lightbox";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        box.setAttribute("aria-label", "Media viewer");
        box.innerHTML =
            '<button type="button" class="tv-lb-close" aria-label="Close">&times;</button>' +
            '<button type="button" class="tv-lb-prev" aria-label="Previous image">&#10094;</button>' +
            '<div class="tv-lb-stage"><img alt=""></div>' +
            '<button type="button" class="tv-lb-next" aria-label="Next image">&#10095;</button>';
        document.body.appendChild(box);
        var stage = box.querySelector(".tv-lb-stage"), lbImg = stage.querySelector("img"), current = 0, lastFocus = null;
        var arrows = [box.querySelector(".tv-lb-prev"), box.querySelector(".tv-lb-next")];
        var show = function (i) {
            current = (i + popupLinks.length) % popupLinks.length;
            var link = popupLinks[current];
            stage.innerHTML = ""; stage.appendChild(lbImg);
            lbImg.src = link.getAttribute("href");
            var inner = link.querySelector("img");
            lbImg.alt = (inner && inner.getAttribute("alt")) || "Gallery image";
            arrows.forEach(function (b) { b.hidden = popupLinks.length < 2; });
        };
        var showVideo = function (src) {
            stage.innerHTML = '<div class="tv-lb-video"><iframe src="' + src + '" title="Video" allow="autoplay; fullscreen" allowfullscreen></iframe></div>';
            arrows.forEach(function (b) { b.hidden = true; });
        };
        var open = function () {
            lastFocus = document.activeElement;
            box.classList.add("is-open"); document.body.style.overflow = "hidden";
            box.querySelector(".tv-lb-close").focus();
        };
        var close = function () {
            box.classList.remove("is-open"); document.body.style.overflow = "";
            stage.innerHTML = ""; stage.appendChild(lbImg); lbImg.removeAttribute("src");
            if (lastFocus) lastFocus.focus();
        };
        popupLinks.forEach(function (link, i) { link.addEventListener("click", function (e) { e.preventDefault(); show(i); open(); }); });
        if (videoBtn) videoBtn.addEventListener("click", function (e) { e.preventDefault(); showVideo(videoBtn.getAttribute("data-video")); open(); });
        box.querySelector(".tv-lb-close").addEventListener("click", close);
        arrows[0].addEventListener("click", function () { show(current - 1); });
        arrows[1].addEventListener("click", function () { show(current + 1); });
        box.addEventListener("click", function (e) { if (e.target === box) close(); });
        document.addEventListener("keydown", function (e) {
            if (!box.classList.contains("is-open")) return;
            if (e.key === "Escape") close();
            if (!arrows[0].hidden && e.key === "ArrowLeft") show(current - 1);
            if (!arrows[0].hidden && e.key === "ArrowRight") show(current + 1);
        });
    }


})();
