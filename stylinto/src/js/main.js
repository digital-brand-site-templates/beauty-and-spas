/*
Template Name: stylinto-fashion-store-e-commerce-template
File Name: main.js
Author Name: ThemeVault
Author URI: https://www.themevault.net/
Version: 2.0

Dependency-free. Bootstrap's own bundle drives the navbar, tabs, carousel,
accordion and scrollspy; everything below replaces what jQuery and its plugins
used to do.
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* BS3 marked the active tab on the <li>; BS5 marks the <a>. Templates key CSS on li.active (flowerspetal, wrap-d-style) — keep both in step */
    /* BS3's tab plugin worked from any trigger; BS5's needs a .nav / .list-group / [role=tablist] ancestor or it silently does nothing
       (homeapart: eight grid columns switch the portfolio panes). Give such triggers their nearest .row as the tablist. */
    document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]').forEach(function (t) {
        if (t.closest('.nav, .list-group, [role="tablist"]')) return;
        var host = t.closest(".row") || t.parentElement.parentElement; if (host && !host.getAttribute("role")) host.setAttribute("role", "tablist");
    });
    /* BS5's scrollspy marks the <a>.active and colours it at (0,3,0) — above a template's ".navbar-default .navbar-nav > li > a" (0,2,2), so
       the spied item went grey (homeapart's "About" on the tablet). BS3 marked the <li>; do the same and take the class off the <a>. */
    document.addEventListener("activate.bs.scrollspy", function (e) {
        var a = e.relatedTarget; if (!a || !a.closest) return;
        var ul = a.closest(".navbar-nav, .nav, ul"); if (ul) ul.querySelectorAll("li.active").forEach(function (li) { li.classList.remove("active"); });
        var li = a.closest("li"); if (li) li.classList.add("active");
        a.classList.remove("active");
    });
    document.addEventListener("shown.bs.tab", function (e) { var a = e.target, ul = a.closest('.nav, [role="tablist"]'); if (!ul) return; ul.querySelectorAll("li").forEach(function (li) { li.classList.remove("active"); }); ul.querySelectorAll("[data-bs-toggle]").forEach(function (t) { if (t !== a) t.classList.remove("active"); }); var li = a.closest("li"); if (li) li.classList.add("active"); });
    /* BS3 marked an open dropdown's parent with .open; BS5 uses .show. Templates
       key CSS on .open (wrap-d-style slides its cart panel in on it) — mirror it. */
    document.addEventListener("shown.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.add("open"); });
    document.addEventListener("hidden.bs.dropdown", function (e) { var p = e.target.closest(".dropdown, .btn-group, .dropup") || e.target.parentElement; if (p) p.classList.remove("open"); });

    /* Tapping a link in the collapsed menu closes it. The dropdown-toggle
       exclusion matters: without it, adding a submenu later makes the whole
       menu retract the moment it is tapped. */
    var collapse = document.querySelector(".navbar-collapse");
    if (collapse) {
        collapse.addEventListener("click", function (e) {
            /* any destination: a .dropdown-item or a bare submenu <a href> too, never an href-less submenu opener */
            var link = e.target.closest("a[href]");
            if (!link || link.classList.contains("dropdown-toggle") || link.getAttribute("href") === "#") return;
            if (!collapse.classList.contains("show")) return;
            var inst = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (inst) inst.hide();
        });
    }

    /* A static template posts nowhere, so rather than pretend, validate and
       say so plainly. */
    var form = document.querySelector("form.tv-contact-form"); /* form. — a template's own wrapper <div class="tv-contact-form"> (cunsultix contact.html) is not a form */
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); return; }
            var note = form.querySelector(".tv-form-note");
            if (note) { note.hidden = false; note.focus(); }
            form.reset(); form.classList.remove("was-validated");
        });
    }
})();

/* Back to top (the shell's #back-to-top): shown past 100px, smooth scroll up. */
(function () {
    var toTop = document.getElementById("back-to-top");
    if (!toTop) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var toggle = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
    toggle(); window.addEventListener("scroll", toggle, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
})();

/* Footer year */
(function () { var y = document.getElementById("tv-year"); if (y) y.textContent = String(new Date().getFullYear()); })();

/* No transitions on first paint, and no :hover-driven menus until the visitor moves: a browser can paint the new page with the cursor
   already resting on a nav item, so a hover-opened mega menu or cart panel shows for a moment and then animates shut
   (wrap-d-style, owner note 16). tv-preload drops transitions; tv-nohover keeps hover menus closed until the first real input. */
(function () {
    var body = document.body; body.classList.add("tv-nohover");
    var go = function () { requestAnimationFrame(function () { body.classList.remove("tv-preload"); }); };
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    var release = function () { body.classList.remove("tv-nohover"); ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.removeEventListener(t, release); }); };
    ["mousemove", "touchstart", "keydown", "wheel"].forEach(function (t) { window.addEventListener(t, release, { passive: true }); });
})();

/* SX-DESIGN START */
/* Stylinto 2.0 — v1's custom.js behaviours in plain DOM code, plus the redesign's small interactions. */
(function () {
    "use strict";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Accordion toggles (v1: jQuery slideToggle + icon swap). One helper, keyboard-operable. */
    function bindToggle(selector, targetOf, openIcon, closedIcon) {
        document.querySelectorAll(selector).forEach(function (icon) {
            var flip = function (e) {
                if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault(); e.stopPropagation();
                var target = targetOf(icon); if (!target) return;
                var open = target.hidden || getComputedStyle(target).display === "none";
                target.hidden = false;
                target.style.display = open ? "block" : "none";
                icon.classList.toggle(openIcon, open);
                icon.classList.toggle(closedIcon, !open);
                icon.setAttribute("aria-expanded", open ? "true" : "false");
            };
            icon.addEventListener("click", flip); icon.addEventListener("keydown", flip);
        });
    }
    /* .box-category .menu li i — category submenus: + opens, − closes */
    bindToggle(".box-category .menu li i", function (i) { return i.parentElement.querySelector(":scope > ul"); }, "fa-minus", "fa-plus");
    /* .category h3 i — product-page sidebar boxes */
    bindToggle(".category h3 i", function (i) { var c = i.closest(".category"); return c && c.querySelector(".box-content"); }, "fa-angle-up", "fa-angle-down");
    /* .footer-block h4 i — footer columns fold on phones (design.css keeps them open from 768 up) */
    bindToggle(".footer-block h4 i", function (i) { var b = i.closest(".footer-block"); return b && b.querySelector(".list-unstyled"); }, "fa-angle-up", "fa-angle-down");

    /* .dropdown-menu — v1 stopped clicks inside a menu from closing it (the category tree); keep that for non-links */
    document.querySelectorAll(".dropdown-menu").forEach(function (m) {
        m.addEventListener("click", function (e) { if (!e.target.closest("a[href]")) e.stopPropagation(); });
    });

    /* Sticky header: v1 fixed .main-nav-block past 150px (navbar-fixed); the new header is sticky and compacts at the same point */
    var header = document.getElementById("sx-header");
    if (header) {
        var stick = function () { header.classList.toggle("is-stuck", window.scrollY > 150); }; /* not v1's .navbar-fixed: its CSS would position:fixed the header */
        stick(); window.addEventListener("scroll", stick, { passive: true });
    }

    /* #scroll — v1's back-to-top id; the shell's button is #back-to-top (handled above) — support both */
    var legacyTop = document.getElementById("scroll");
    if (legacyTop) legacyTop.addEventListener("click", function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

    /* .galleryimg — product gallery thumbnails swap the main photo (v1 inline script on single-product.html) */
    document.querySelectorAll(".galleryimg").forEach(function (t) {
        var host = t.closest("button") || t; /* the thumb is a button wrapping the .galleryimg — the whole button is the target */
        host.addEventListener("click", function (e) {
            var main = document.querySelector(".sx-gallery__main .changeimg, .changeimg"); if (!main) return;
            e.preventDefault();
            main.src = t.getAttribute("src");
            main.classList.remove("is-swap"); void main.offsetWidth; main.classList.add("is-swap"); /* a short cross-fade, also when the shown photo is picked again */
            document.querySelectorAll(".galleryimg").forEach(function (o) {
                o.classList.toggle("is-active", o === t);
                var b = o.closest("button"); if (b) b.classList.toggle("is-active", o === t);
            });
        });
    });

    /* Quantity steppers */
    document.querySelectorAll("[data-sx-qty]").forEach(function (b) {
        b.addEventListener("click", function () {
            var input = b.parentElement.querySelector("input"); if (!input) return;
            var v = (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute("data-sx-qty"), 10);
            input.value = Math.max(parseInt(input.min, 10) || 1, Math.min(parseInt(input.max, 10) || 99, v));
        });
    });

    /* Checkout: each step's Continue opens the next step */
    document.querySelectorAll("[data-sx-next]").forEach(function (b) {
        b.addEventListener("click", function () {
            var next = document.querySelector(b.getAttribute("data-sx-next"));
            if (!next || !window.bootstrap) return;
            bootstrap.Collapse.getOrCreateInstance(next).show();
            var step = b.closest(".sx-step"); if (step) step.classList.add("is-done");
            setTimeout(function () { var h = next.closest(".sx-step"); if (h) h.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 380);
        });
    });
    document.querySelectorAll(".sx-step .collapse").forEach(function (c) {
        c.addEventListener("show.bs.collapse", function () { c.closest(".sx-step").classList.add("is-open"); });
        c.addEventListener("hide.bs.collapse", function () { c.closest(".sx-step").classList.remove("is-open"); });
    });

    /* "0 reviews" / "Write a review" open the Reviews tab */
    document.querySelectorAll("[data-sx-tab]").forEach(function (a) {
        a.addEventListener("click", function (e) {
            var btn = document.querySelector(a.getAttribute("data-sx-tab")); if (!btn || !window.bootstrap) return;
            e.preventDefault();
            bootstrap.Tab.getOrCreateInstance(btn).show();
            btn.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        });
    });

    /* Remove buttons (cart lines, wishlist cards) — a visual removal; the wishlist shows its empty state when nothing is left */
    document.querySelectorAll("[data-sx-remove]").forEach(function (b) {
        b.addEventListener("click", function () {
            var item = b.closest(".sx-card, .sx-line"); if (!item) return;
            var list = item.parentElement; item.remove();
            if (list && list.hasAttribute("data-sx-wishlist") && !list.children.length) {
                list.hidden = true; var empty = document.querySelector("[data-sx-empty]"); if (empty) empty.hidden = false;
            }
        });
    });

    /* Shop filters: a drawer below 992px */
    var filters = document.querySelector(".sx-filters");
    document.querySelectorAll("[data-sx-filters]").forEach(function (b) {
        b.addEventListener("click", function () {
            if (!filters) return;
            var open = !filters.classList.contains("is-open");
            filters.classList.toggle("is-open", open);
            document.body.classList.toggle("sx-lock", open);
        });
    });

    /* Show / hide password */
    document.querySelectorAll("[data-sx-eye]").forEach(function (b) {
        b.addEventListener("click", function () {
            var input = b.parentElement.querySelector("input"); if (!input) return;
            var show = input.type === "password"; input.type = show ? "text" : "password";
            b.setAttribute("aria-label", show ? "Hide password" : "Show password");
            var i = b.querySelector("i"); if (i) { i.classList.toggle("fa-eye", !show); i.classList.toggle("fa-eye-slash", show); }
        });
    });

    /* Share the wishlist: copy the page link */
    document.querySelectorAll("[data-sx-share]").forEach(function (b) {
        b.addEventListener("click", function () {
            var done = function () { b.lastChild.textContent = " Link copied"; };
            if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
        });
    });

    /* Wishlist hearts: a visual toggle (a static template has no account) */
    document.querySelectorAll(".sx-card__fav").forEach(function (b) {
        b.addEventListener("click", function () {
            var on = b.getAttribute("aria-pressed") !== "true";
            b.setAttribute("aria-pressed", on ? "true" : "false");
            var i = b.querySelector("i"); if (i) { i.classList.toggle("fa-regular", !on); i.classList.toggle("fas", on); }
        });
    });

    /* Every data-sx-form: validate, then say plainly what happened (no backend) */
    document.querySelectorAll("form[data-sx-form]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
            var note = form.querySelector(".sx-form-note, .tv-form-note");
            if (note) { note.hidden = false; note.focus(); }
            form.reset(); form.classList.remove("was-validated");
        });
    });
})();
/* SX-DESIGN END */
