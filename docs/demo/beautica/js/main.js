/*
Template Name: beautica-free-fashion-design-website-template
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

    /* Back to top — fades in past 100px, returns to the top */
    var toTop = document.getElementById("back-to-top");
    if (toTop) {
        var toggleToTop = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
        toggleToTop();
        window.addEventListener("scroll", toggleToTop, { passive: true });
        toTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

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
            var link = e.target.closest("a.nav-link");
            if (!link || link.classList.contains("dropdown-toggle")) return;
            if (!collapse.classList.contains("show")) return;
            var inst = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (inst) inst.hide();
        });
    }

    /* Counters — replaces counterUp + waypoints. The real number stays in the
       markup until the moment it animates, so anyone without JS still sees it. */
    var counters = document.querySelectorAll(".counter");
    if (counters.length) {
        var runCounter = function (el) {
            var target = parseInt(String(el.dataset.target || el.textContent).replace(/\D/g, ""), 10);
            if (!isFinite(target)) return;
            if (reduceMotion) { el.textContent = String(target); return; }
            el.textContent = "0";
            var started = null;
            var step = function (now) {
                if (started === null) started = now;
                var progress = Math.min((now - started) / 1000, 1);
                el.textContent = String(Math.floor(progress * target));
                if (progress < 1) requestAnimationFrame(step); else el.textContent = String(target);
            };
            requestAnimationFrame(step);
        };
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); } });
            }, { threshold: 0.4 });
            counters.forEach(function (c) { c.dataset.target = c.textContent.trim(); io.observe(c); });
        } else counters.forEach(runCounter);
    }

    /* Lightbox — replaces magnific-popup. Arrows and the keyboard step through
       the set; focus is trapped and restored. */
    var popupLinks = Array.prototype.slice.call(document.querySelectorAll("[data-image-popup], [data-lightbox], [data-fancybox]")); /* the port keeps v1's own lightbox attribute (lightbox.js data-lightbox, fancybox) — sojournion */
    if (popupLinks.length) {
        var box = document.createElement("div");
        box.className = "tv-lightbox";
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-modal", "true");
        box.setAttribute("aria-label", "Image viewer");
        box.innerHTML =
            '<button type="button" class="tv-lb-close" aria-label="Close">&times;</button>' +
            '<button type="button" class="tv-lb-prev" aria-label="Previous image">&#10094;</button>' +
            '<img alt="">' +
            '<button type="button" class="tv-lb-next" aria-label="Next image">&#10095;</button>';
        document.body.appendChild(box);
        var lbImg = box.querySelector("img"), current = 0, lastFocus = null;
        var show = function (i) {
            current = (i + popupLinks.length) % popupLinks.length;
            var link = popupLinks[current];
            lbImg.src = link.getAttribute("href");
            var inner = link.querySelector("img");
            lbImg.alt = (inner && inner.getAttribute("alt")) || "Gallery image";
        };
        var open = function (i) {
            lastFocus = document.activeElement; show(i);
            box.classList.add("is-open"); document.body.style.overflow = "hidden";
            box.querySelector(".tv-lb-close").focus();
        };
        var close = function () {
            box.classList.remove("is-open"); document.body.style.overflow = "";
            lbImg.removeAttribute("src"); if (lastFocus) lastFocus.focus();
        };
        /* ONE delegated listener: the carousel runs after this and clones its slides with cloneNode, which drops per-link
           listeners — a tap on a looped (cloned) gallery slide opened nothing (barbeard's works carousel). A clone maps back
           to its original by href, so the arrows still step through the real set only. */
        document.addEventListener("click", function (e) {
            var link = e.target.closest && e.target.closest("[data-image-popup], [data-lightbox], [data-fancybox]");
            if (!link) return;
            var i = popupLinks.indexOf(link), href = link.getAttribute("href");
            if (i < 0) for (var k = 0; k < popupLinks.length; k++) if (popupLinks[k].getAttribute("href") === href) { i = k; break; }
            if (i < 0) return;
            e.preventDefault(); open(i);
        });
        box.querySelector(".tv-lb-close").addEventListener("click", close);
        box.querySelector(".tv-lb-prev").addEventListener("click", function () { show(current - 1); });
        box.querySelector(".tv-lb-next").addEventListener("click", function () { show(current + 1); });
        box.addEventListener("click", function (e) { if (e.target === box) close(); });
        document.addEventListener("keydown", function (e) {
            if (!box.classList.contains("is-open")) return;
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") show(current - 1);
            if (e.key === "ArrowRight") show(current + 1);
        });
    }

    /* A static template posts nowhere, so rather than pretend, validate and
       say so plainly. */
    var form = document.querySelector(".tv-contact-form");
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

/* == beautica == */
/* v1 scrolling-nav.js: past 50px the fixed header gains .top-nav-collapse (navy, tighter) */
(function () {
    var nav = document.querySelector(".navbar-fixed-top"); if (!nav) return;
    var set = function () { nav.classList.toggle("top-nav-collapse", window.scrollY > 50); };
    window.addEventListener("scroll", set, { passive: true }); set();
})();
/* v1's icon hover swaps (inline onmouseover/onmouseout on the testimonial arrows) — same images, from data-hover-src */
(function () {
    document.querySelectorAll("img[data-hover-src]").forEach(function (img) {
        var rest = img.getAttribute("src"), hover = img.getAttribute("data-hover-src");
        new Image().src = hover;
        img.addEventListener("mouseenter", function () { img.src = hover; });
        img.addEventListener("mouseleave", function () { img.src = rest; });
    });
})();
/* header search (owner round 1): v1's ring icon opens a full-screen search; Esc, the close button or a click outside shut it,
   and focus returns to the icon. Without <dialog> support the icon stays a link to the price list. */
(function () {
    var dlg = document.getElementById("tv-searchbox"); if (!dlg || typeof dlg.showModal !== "function") return;
    var input = dlg.querySelector("input"), from = null;
    document.querySelectorAll(".tv-search-open").forEach(function (a) {
        a.addEventListener("click", function (e) {
            e.preventDefault(); from = a;
            dlg.showModal(); document.body.classList.add("tv-search-lock");
            setTimeout(function () { input.focus(); }, 30);
        });
    });
    var shut = function () { if (dlg.open) dlg.close(); };
    dlg.querySelector(".tv-searchbox-close").addEventListener("click", shut);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) shut(); });
    /* a search field spends the first Esc on clearing its text; here Esc always closes */
    dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); shut(); } });
    dlg.addEventListener("close", function () { document.body.classList.remove("tv-search-lock"); if (from) from.focus(); });
    dlg.querySelector("form").addEventListener("submit", function (e) { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });
})();
/* every form (booking, contact, newsletter, comments, enquiries): a static template posts nowhere, so validate and say so plainly */
(function () {
    document.querySelectorAll("form.tv-form").forEach(function (form) {
        var note = form.querySelector(".tv-form-note");
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) { form.classList.add("was-validated"); var bad = form.querySelector(":invalid"); if (bad) bad.focus(); return; }
            if (note) { note.hidden = false; note.focus(); }
            form.reset(); form.classList.remove("was-validated");
        });
        form.addEventListener("reset", function () { form.classList.remove("was-validated"); });
        form.addEventListener("input", function () { if (note) note.hidden = true; });
    });
})();
/* no dates in the past on any booking date field */
(function () {
    var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    document.querySelectorAll('input[type="date"][data-tv-future]').forEach(function (d) { d.min = t.toISOString().slice(0, 10); });
})();
/* == /beautica == */

/* == beautica: pages == */
/* topic chips (gallery, blog): filter the items named by data-target by their data-cat, in place */
(function () {
    document.querySelectorAll(".tv-chips[data-target]").forEach(function (group) {
        var items = Array.prototype.slice.call(document.querySelectorAll(group.dataset.target));
        group.addEventListener("click", function (e) {
            var b = e.target.closest("button[data-filter]"); if (!b) return;
            var f = b.dataset.filter;
            group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
            items.forEach(function (it) {
                var el = it.dataset.cat ? it : it.querySelector("[data-cat]"), c = el ? el.dataset.cat : "";
                it.hidden = !!f && c !== f;
            });
        });
    });
})();
/* price list: keyword (also ?q= from the header search) and category, in place; the address bar follows */
(function () {
    var form = document.querySelector(".tv-price-filter"); if (!form) return;
    var q = form.querySelector("input"), chips = form.querySelectorAll(".tv-chips button"), cats = document.querySelectorAll(".tv-price-cat");
    var count = document.querySelector(".tv-price-count"), empty = document.querySelector(".tv-price-empty"), cat = "";
    var p = new URLSearchParams(location.search); if (p.get("q")) q.value = p.get("q"); if (p.get("cat")) cat = p.get("cat");
    var run = function () {
        var term = q.value.trim().toLowerCase(), n = 0;
        cats.forEach(function (c) {
            var shown = 0;
            c.querySelectorAll(".tv-price-row").forEach(function (r) { var ok = (!cat || c.dataset.cat === cat) && (!term || r.dataset.search.indexOf(term) > -1); r.hidden = !ok; if (ok) shown++; });
            c.hidden = shown === 0; n += shown;
        });
        chips.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === cat)); });
        count.textContent = n + (n === 1 ? " treatment" : " treatments") + (term ? " matching “" + q.value.trim() + "”" : "");
        empty.hidden = n > 0;
        var u = new URLSearchParams(); if (term) u.set("q", q.value.trim()); if (cat) u.set("cat", cat);
        history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
    };
    q.addEventListener("input", run);
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    chips.forEach(function (b) { b.addEventListener("click", function () { cat = b.dataset.filter; run(); }); });
    run();
})();
/* booking: the summary follows the choices; ?service= and ?stylist= (from Book buttons) preselect */
(function () {
    var f = document.getElementById("tv-booking"); if (!f) return;
    var sum = function (k, v) { var d = f.querySelector('[data-sum="' + k + '"]'); if (d) d.textContent = v; };
    var p = new URLSearchParams(location.search);
    if (p.get("service")) { var s = f.querySelector('input[name="service"][data-slug="' + p.get("service") + '"]'); if (s) s.checked = true; }
    if (p.get("stylist")) { var t = f.querySelector('input[name="stylist"][data-slug="' + p.get("stylist") + '"]'); if (t) t.checked = true; }
    var update = function () {
        var s = f.querySelector('input[name="service"]:checked'), st = f.querySelector('input[name="stylist"]:checked'), tm = f.querySelector('input[name="time"]:checked'), d = f.elements.date.value;
        sum("service", s ? s.value + " · " + s.dataset.time : "Not chosen yet"); sum("price", s ? s.dataset.price : "—");
        sum("stylist", st ? st.value : "No preference"); sum("time", tm ? tm.value : "—");
        sum("date", d ? new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—");
    };
    f.addEventListener("change", update); f.addEventListener("reset", function () { setTimeout(update, 0); });
    update();
})();
/* products: "Ask about this" / "Order this card" fills the enquiry form and scrolls to it */
(function () {
    var sel = document.getElementById("tv-e-item"); if (!sel) return;
    document.querySelectorAll("[data-tv-ask]").forEach(function (b) {
        b.addEventListener("click", function () {
            sel.value = b.dataset.tvAsk;
            document.getElementById("tv-enquiry").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            setTimeout(function () { document.getElementById("tv-e-name").focus({ preventScroll: true }); }, 400);
        });
    });
})();
/* contact map: the Google embed is only created when the visitor asks for it (privacy.html says so) */
(function () {
    document.querySelectorAll(".tv-map-load").forEach(function (b) {
        b.addEventListener("click", function () {
            var fr = document.createElement("iframe");
            fr.src = b.dataset.src; fr.title = b.dataset.title; fr.loading = "lazy"; fr.referrerPolicy = "no-referrer-when-downgrade";
            b.replaceWith(fr); fr.focus();
        });
    });
})();
/* == /beautica: pages == */
