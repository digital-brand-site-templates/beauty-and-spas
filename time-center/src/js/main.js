/*
Template Name: timecenter-watch-ecommerce-web-template
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
            /* any destination: a .dropdown-item or a bare submenu <a href> too, never an href-less submenu opener */
            var link = e.target.closest("a[href]");
            if (!link || link.classList.contains("dropdown-toggle") || link.getAttribute("href") === "#") return;
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

/* TC-DESIGN START */
/* Timecenter 2.0 — v1's custom.js handlers as plain DOM code, plus the Atelier behaviours. */
(function () {
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    /* v1: past 150px the nav bar pins to the top (.main-nav-block.navbar-fixed); a spacer keeps the page from jumping */
    var bar = document.querySelector(".main-nav-block");
    if (bar) {
        var spacer = document.createElement("div");
        spacer.className = "tc-nav-spacer";
        bar.parentNode.insertBefore(spacer, bar.nextSibling);
        var pin = function () {
            var on = window.scrollY > 150;
            if (on === bar.classList.contains("navbar-fixed")) return;
            spacer.style.height = on ? bar.offsetHeight + "px" : "0";
            bar.classList.toggle("navbar-fixed", on);
        };
        window.addEventListener("scroll", pin, { passive: true });
        pin();
    }

    /* back-to-top: once pressed it steps out of the way while the page glides up (it used to linger on screen for the whole scroll) */
    var btt = document.getElementById("back-to-top");
    if (btt) {
        btt.addEventListener("click", function () {
            btt.classList.add("is-returning");
            var done = function () { if (window.scrollY < 4) { btt.classList.remove("is-returning"); window.removeEventListener("scroll", done); } };
            window.addEventListener("scroll", done, { passive: true });
            setTimeout(function () { btt.classList.remove("is-returning"); window.removeEventListener("scroll", done); }, 2500);
        });
    }

    /* v1: clicks inside a .dropdown-menu do not close it (forms and pickers inside stay usable) — only on non-links */
    document.addEventListener("click", function (e) {
        var menu = e.target.closest(".dropdown-menu");
        if (menu && !e.target.closest("a[href], [data-tc-pick]")) e.stopPropagation();
    }, true);

    /* utility pickers (language, currency): the chosen item becomes the button label */
    $$("[data-tc-pick]").forEach(function (b) {
        b.addEventListener("click", function () {
            var dd = b.closest(".dropdown"), btn = dd && dd.querySelector("[data-bs-toggle]");
            if (btn) btn.textContent = b.getAttribute("data-tc-pick");
            if (dd) $$("[data-tc-pick]", dd).forEach(function (x) { x.classList.toggle("active", x === b); });
        });
    });

    /* v1: .footer-block h4 i toggles its list on phones — the whole heading is the target here */
    $$(".footer-block h4").forEach(function (h) {
        var block = h.closest(".footer-block"), mq = window.matchMedia("(max-width: 767.98px)");
        var sync = function () { if (mq.matches) { block.classList.add("is-shut"); h.setAttribute("aria-expanded", "false"); } else { block.classList.remove("is-shut"); h.removeAttribute("aria-expanded"); } };
        h.setAttribute("role", "button"); h.tabIndex = 0;
        var flip = function () { if (!mq.matches) return; var shut = block.classList.toggle("is-shut"); h.setAttribute("aria-expanded", String(!shut)); };
        h.addEventListener("click", flip);
        h.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
        (mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync)); sync();
    });

    /* v1: .category h3 i opens/closes the sidebar box; .box-category .menu li i opens a sub-list (fa-minus while open) */
    /* the account box folds on phones only (fa-angle-down while shut, as v1); on wider screens it is always open */
    var phone = window.matchMedia("(max-width: 991.98px)");
    $$(".category h3 i").forEach(function (i) {
        var box = i.closest(".category").querySelector(".box-content");
        if (!box) return;
        i.setAttribute("role", "button"); i.tabIndex = 0; i.setAttribute("aria-label", "Show or hide the account menu");
        var set = function (open) { box.hidden = !open; i.classList.toggle("is-open", open); i.setAttribute("aria-expanded", String(open)); };
        var sync = function () { set(!phone.matches); };
        var go = function () { if (phone.matches) set(box.hidden); };
        i.addEventListener("click", go);
        i.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        (phone.addEventListener ? phone.addEventListener("change", sync) : phone.addListener(sync)); sync();
    });
    $$(".box-category .menu li i").forEach(function (i) {
        var sub = i.parentElement.querySelector(":scope > ul");
        if (!sub) return;
        i.setAttribute("role", "button"); i.tabIndex = 0; i.setAttribute("aria-expanded", "false");
        var go = function () { sub.hidden = !sub.hidden; i.classList.toggle("is-open", !sub.hidden); i.closest("li").classList.toggle("is-open", !sub.hidden); i.setAttribute("aria-expanded", String(!sub.hidden)); };
        i.addEventListener("click", go);
        i.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });

    /* product gallery (v1: a hover-zoom plugin + thumbnail swap): hover zooms into the large photo, thumbs swap it, click opens the lightbox */
    var zoom = document.querySelector(".tc-zoom");
    if (zoom) {
        var zimg = zoom.querySelector("img");
        var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
        var setBg = function () { zoom.style.backgroundImage = "url('" + zimg.getAttribute("data-zoom-image") + "')"; };
        setBg();
        zoom.addEventListener("mousemove", function (e) {
            if (!fine.matches) return;
            var r = zoom.getBoundingClientRect();
            zoom.style.backgroundPosition = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
            zoom.classList.add("is-zooming");
        });
        zoom.addEventListener("mouseleave", function () { zoom.classList.remove("is-zooming"); });
        /* click opens the lightbox on the photo being shown; the group holds every gallery photo so the arrows step through them */
        zoom.addEventListener("click", function (e) {
            var link = document.querySelector('.tc-gallery__all [data-tc-full="' + zimg.getAttribute("data-zoom-image") + '"]');
            if (!link) return;
            e.preventDefault(); link.click();
        });
        $$(".tc-thumb").forEach(function (t) {
            t.addEventListener("click", function () {
                zimg.src = t.getAttribute("data-image"); zimg.alt = t.getAttribute("data-alt") || zimg.alt;
                zimg.setAttribute("data-zoom-image", t.getAttribute("data-zoom-image"));
                zoom.href = t.getAttribute("data-zoom-image"); setBg();
                $$(".tc-thumb").forEach(function (x) { x.classList.toggle("is-active", x === t); if (x === t) x.setAttribute("aria-current", "true"); else x.removeAttribute("aria-current"); });
            });
        });
    }

    /* qty steppers */
    $$("[data-tc-step]").forEach(function (b) {
        b.addEventListener("click", function () {
            var input = b.parentElement.querySelector("input[type=number]"); if (!input) return;
            var v = Math.min(parseInt(input.max || "99", 10), Math.max(parseInt(input.min || "1", 10), (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute("data-tc-step"), 10)));
            input.value = v;
        });
    });

    /* open a collapse from a button (checkout "Continue", "Write a review") */
    var openPanel = function (sel) {
        var el = document.querySelector(sel); if (!el) return;
        if (el.classList.contains("tab-pane")) { var tab = document.querySelector('[data-bs-toggle="tab"][href="' + sel + '"]'); if (tab && window.bootstrap) window.bootstrap.Tab.getOrCreateInstance(tab).show(); }
        else if (window.bootstrap) window.bootstrap.Collapse.getOrCreateInstance(el, { toggle: false }).show();
        setTimeout(function () { (el.closest(".tc-step") || el).scrollIntoView({ behavior: "smooth", block: "start" }); }, 380);
    };
    $$("[data-tc-open]").forEach(function (b) { b.addEventListener("click", function () { openPanel(b.getAttribute("data-tc-open")); }); });
    $$("[data-tc-tab]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); openPanel(a.getAttribute("data-tc-tab")); }); });
    document.addEventListener("shown.bs.collapse", function (e) { var s = e.target.closest(".tc-step"); if (s) s.classList.add("is-open"); });
    document.addEventListener("hidden.bs.collapse", function (e) { var s = e.target.closest(".tc-step"); if (s) s.classList.remove("is-open"); });

    /* remove a line (cart, wishlist) */
    $$("[data-tc-remove]").forEach(function (b) {
        b.addEventListener("click", function () {
            var line = b.closest("[data-tc-line]"); if (!line) return;
            var list = line.parentElement; line.remove();
            var wish = document.querySelector("[data-tc-wish]"), empty = document.querySelector(".tc-wish__empty");
            if (wish && empty && !wish.children.length) { wish.hidden = true; empty.hidden = false; }
            if (list && !list.children.length && list.tagName === "TBODY") list.innerHTML = '<tr><td colspan="6" class="tc-empty">Your bag is empty. <a class="tc-link" href="product.html">Browse the collection</a></td></tr>';
        });
    });

    /* cart: a line's total follows its quantity */
    $$("tr[data-tc-unit]").forEach(function (tr) {
        var input = tr.querySelector('input[type="number"]'), out = tr.querySelector("[data-tc-total]"), unit = parseFloat(tr.getAttribute("data-tc-unit"));
        if (!input || !out) return;
        var sync = function () { var q = Math.max(1, parseInt(input.value, 10) || 1); out.textContent = "$" + (unit * q).toFixed(2); };
        input.addEventListener("input", sync);
        tr.addEventListener("click", function (e) { if (e.target.closest("[data-tc-step]")) setTimeout(sync, 0); });
    });

    /* checkout: a step whose Continue was pressed is marked done; the order summary starts folded below xl */
    $$(".tc-step [data-tc-open]").forEach(function (b) { b.addEventListener("click", function () { var s = b.closest(".tc-step"); if (s) s.classList.add("is-done"); }); });
    var sumbox = document.querySelector("[data-tc-sumbox]");
    if (sumbox && window.matchMedia("(max-width: 1199.98px)").matches) sumbox.removeAttribute("open");

    /* quick view: a product popup built from the card's data (owner round 1: "quick view link should open popup view") */
    var qv = null;
    var buildQv = function () {
        var m = document.createElement("div");
        m.className = "modal fade tc-qv"; m.id = "tc-quickview"; m.tabIndex = -1; m.setAttribute("aria-labelledby", "tc-qv-title"); m.setAttribute("aria-hidden", "true");
        m.innerHTML = '<div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content tc-qv__box">' +
            '<button type="button" class="tc-qv__close" data-bs-dismiss="modal" aria-label="Close"><i class="fas fa-xmark" aria-hidden="true"></i></button>' +
            '<div class="tc-qv__grid"><div class="tc-qv__img"><img alt="" width="800" height="800"></div>' +
            '<div class="tc-qv__body"><p class="tc-buy__house">Timecenter &middot; quick view</p><h2 class="tc-qv__name" id="tc-qv-title"></h2>' +
            '<p class="tc-stars" aria-label="Rated 5 out of 5"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></p>' +
            '<p class="tc-qv__price"></p><dl class="tc-buy__specs tc-qv__specs"></dl>' +
            '<p class="tc-qv__text">Inspected, regulated and boxed by hand in our workshop. Free insured delivery and a two-year warranty.</p>' +
            '<form class="tc-buy__form" action="cart.html"><div class="tc-qty"><label for="tc-qv-qty">Qty</label><button type="button" class="tc-qty__btn" data-tc-step="-1" aria-label="One fewer">&minus;</button><input type="number" id="tc-qv-qty" name="quantity" value="1" min="1" max="9" inputmode="numeric"><button type="button" class="tc-qty__btn" data-tc-step="1" aria-label="One more">+</button></div>' +
            '<button type="submit" class="tc-btn tc-btn--ink tc-buy__cart">Add to bag</button></form>' +
            '<a class="tc-link tc-qv__more" href="single-product.html">View full details</a></div></div></div></div>';
        document.body.appendChild(m);
        $$("[data-tc-step]", m).forEach(function (b) {
            b.addEventListener("click", function () { var input = b.parentElement.querySelector("input"); input.value = Math.min(9, Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute("data-tc-step"), 10))); });
        });
        return m;
    };
    document.addEventListener("click", function (e) {
        var a = e.target.closest("[data-tc-quick]"); if (!a || !window.bootstrap) return;
        var card = a.closest("[data-tc-name]"); if (!card) return;
        e.preventDefault();
        qv = qv || buildQv();
        var d = card.dataset, img = qv.querySelector(".tc-qv__img img"), spec = (d.tcSpec || "").split("|");
        img.src = d.tcImg; img.alt = d.tcName + " watch";
        qv.querySelector(".tc-qv__name").textContent = d.tcName;
        qv.querySelector(".tc-qv__price").innerHTML = d.tcWas ? '<span class="price-new">' + d.tcPrice + '</span> <s class="price-old">' + d.tcWas + "</s>" : d.tcPrice;
        qv.querySelector(".tc-qv__specs").innerHTML = ["Case", "Movement", "Water"].map(function (k, i) { return "<div><dt>" + k + "</dt><dd>" + (spec[i] || "") + "</dd></div>"; }).join("") + "<div><dt>Warranty</dt><dd>2 years</dd></div>";
        qv.querySelector("#tc-qv-qty").value = 1;
        window.bootstrap.Modal.getOrCreateInstance(qv).show();
    });

    /* compare count in the shop toolbar */
    var countEl = document.querySelector("[data-tc-compare-count]");
    if (countEl) document.addEventListener("click", function (e) {
        if (!e.target.closest("[data-tc-compare]")) return;
        setTimeout(function () { countEl.textContent = String($$('[data-tc-compare][aria-pressed="true"]').length); }, 0);
    });

    /* search drawer under the bar */
    $$("[data-tc-search]").forEach(function (t) {
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        t.addEventListener("click", function () {
            var open = panel.hidden;
            panel.hidden = !open; t.setAttribute("aria-expanded", String(open));
            if (open) { var q = panel.querySelector("input"); if (q) q.focus(); }
        });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; t.setAttribute("aria-expanded", "false"); t.focus(); } });
    });

    /* compare toggles */
    $$("[data-tc-compare]").forEach(function (b) {
        b.addEventListener("click", function () { b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); });
    });

    /* world clocks in the footer: hands + digital time per city, once a minute */
    var zones = $$(".tc-zone[data-tz]");
    if (zones.length) {
        var tick = function () {
            var now = new Date();
            zones.forEach(function (z) {
                var parts = {};
                try {
                    new Intl.DateTimeFormat("en-GB", { timeZone: z.getAttribute("data-tz"), hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now)
                        .forEach(function (p) { parts[p.type] = p.value; });
                } catch (err) { return; }
                var h = parseInt(parts.hour, 10) % 24, m = parseInt(parts.minute, 10);
                z.querySelector(".tc-zone__time").textContent = (h < 10 ? "0" : "") + h + ":" + parts.minute;
                z.querySelector(".tc-zone__h").style.setProperty("--a", ((h % 12) * 30 + m / 2) + "deg");
                z.querySelector(".tc-zone__m").style.setProperty("--a", (m * 6) + "deg");
            });
        };
        tick(); setInterval(tick, 20000);
    }

    /* forms: a static template posts nowhere, so validate and confirm in place */
    var MSG = {
        newsletter: "Thank you. Your first letter from the workbench is on its way.",
        contact: "Thank you. A watch specialist will reply within one working day.",
        login: "Welcome back. You are signed in.",
        register: "Your Timecenter account is ready. We have sent a welcome email.",
        reset: "If that address has an account, a reset link is on its way.",
        checkout: "Order placed. Taking you to your confirmation…",
        review: "Thank you. Your review will appear once a watchmaker has read it.",
        coupon: "Coupon applied. The discount shows at checkout.",
        voucher: "Gift certificate applied to your order."
    };
    $$("form[data-tc-form]").forEach(function (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var note = form.querySelector(".tc-note"), bad = null;
            var pw = form.querySelector('input[name="password"]'), cf = form.querySelector('input[name="confirm"]');
            if (pw && cf) cf.setCustomValidity(cf.value && cf.value !== pw.value ? "The passwords do not match." : "");
            $$("input, select, textarea", form).forEach(function (f) {
                if (f.type === "hidden") return;
                var wrap = f.closest(".tc-field, .tc-choice, .tc-rate"), ok = f.checkValidity();
                if (wrap) wrap.classList.toggle("is-bad", !ok);
                f.setAttribute("aria-invalid", String(!ok));
                if (!ok && !bad) bad = f;
            });
            if (bad) {
                var shut = bad.closest(".collapse:not(.show)");
                if (shut && window.bootstrap) { window.bootstrap.Collapse.getOrCreateInstance(shut, { toggle: false }).show(); setTimeout(function () { bad.focus(); }, 380); } else bad.focus();
                var where = bad.closest(".collapse") ? bad.closest(".collapse").previousElementSibling : null;
                if (note) { note.textContent = (bad.validationMessage && bad.type === "password" ? bad.validationMessage + " " : "") + "Please check the highlighted field" + (where && where.textContent ? " in " + where.textContent.trim().replace(/\s+/g, " ") : "") + "."; note.classList.add("is-error"); }
                return;
            }
            if (note) { note.textContent = MSG[form.getAttribute("data-tc-form")] || "Thank you."; note.classList.remove("is-error"); }
            if (form.getAttribute("data-tc-next")) { setTimeout(function () { window.location.href = form.getAttribute("data-tc-next"); }, 900); return; }
            form.reset();
        });
    });

    /* entrance: sections wipe in from the left once, as they scroll into view */
    var wipes = $$(".tc-head, .tc-edit, .tc-arrivals__photo, .tc-house, .tc-letter__row");
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-shown"); io.unobserve(en.target); } });
        }, { rootMargin: "0px 0px -8% 0px" });
        wipes.forEach(function (w) { w.classList.add("tc-wipe"); io.observe(w); });
    }
})();
/* TC-DESIGN END */
