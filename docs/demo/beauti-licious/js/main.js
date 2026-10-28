/*
Template Name: Beautilicious
File Name: main.js
Author Name: ThemeVault
Author URI: https://www.themevault.net/
Version: 2.0

Dependency-free. Bootstrap's own bundle drives the menu collapse and the two
carousels; everything below replaces what jQuery, counterUp, waypoints,
scrolling-nav.js, custom.js and the inline script used to do.
*/
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Back to top — custom.js faded it in past 100px and animated the scroll. */
    var toTop = document.getElementById("back-to-top");
    if (toTop) {
        var toggleToTop = function () { toTop.classList.toggle("is-visible", window.scrollY > 100); };
        toggleToTop();
        window.addEventListener("scroll", toggleToTop, { passive: true });
        toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
    }

    /* The fixed header — scrolling-nav.js added .top-nav-collapse past 50px
       (padding 8px -> 5px above 767px). */
    var navbar = document.querySelector(".tv-navbar-fixed-top");
    if (navbar) {
        var collapseNav = function () { navbar.classList.toggle("top-nav-collapse", window.scrollY > 50); };
        collapseNav();
        window.addEventListener("scroll", collapseNav, { passive: true });
    }

    /* Counters — the inline script ran counterUp on every .counter once it
       scrolled into view (delay 10, time 1000). Same thing, counting from
       data-min to data-max over a second; the "$0" counter stays 0. */
    var counters = document.querySelectorAll(".counter[data-max]");
    if (counters.length) {
        var run = function (el) {
            var to = parseInt(el.getAttribute("data-max"), 10) || 0;
            var from = parseInt(el.getAttribute("data-min"), 10) || 0;
            var start = null;
            var step = function (ts) {
                if (start === null) start = ts;
                var p = Math.min(1, (ts - start) / 1000);
                el.textContent = String(Math.round(from + (to - from) * p));
                if (p < 1) requestAnimationFrame(step);
            };
            if (reduceMotion || !("requestAnimationFrame" in window)) { el.textContent = String(to); return; }
            requestAnimationFrame(step);
        };
        if ("IntersectionObserver" in window) {
            var seen = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    run(en.target); seen.unobserve(en.target);
                });
            }, { threshold: 0.5 });
            counters.forEach(function (el) { seen.observe(el); });
        } else {
            counters.forEach(run);
        }
    }

    /* Tapping a link in the collapsed menu closes it. */
    var collapse = document.querySelector(".navbar-collapse");
    if (collapse) {
        collapse.addEventListener("click", function (e) {
            var link = e.target.closest("a");
            if (!link || !collapse.classList.contains("show")) return;
            var inst = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (inst) inst.hide();
        });
    }

    /* Forms: validate, then say so — a static template posts nowhere. */
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
    /* ------------------------------------------------------------------
       Carousels — replaces Owl Carousel 2.2.1 (and jQuery with it).

       v1 configured seven Owl instances from inline <script> blocks on
       index.html. The plugin's STYLESHEET is ported verbatim because it is the
       slider's design, and the markup only ever carried the wrapper — Owl built
       `.owl-stage-outer > .owl-stage > .owl-item` at runtime. So this builds
       the same DOM, and those ported rules apply exactly as they did.

       Config travels on `data-owl`, lifted from v1's scripts by the porter:
         items / responsive   how many show at each MIN width
         nav, dots            the prev / next buttons (Owl's default text) / pager
         loop                 wrap around — with CLONES, as Owl does, so the
                              last slide slides forward into the first rather
                              than rewinding across every slide in between
         speed                transition in ms. Owl set this inline from
                              navSpeed (2000 on most of these) or its 250 default
         autoplay             interval in ms; Owl's default autoplayTimeout, 5000

       NOT fade. v1's scripts say `transitionStyle: "fade"`, which is an Owl
       1.x option Owl 2 ignores; measured, v1's hero and testimonials SLIDE
       (the stage carries a translate, every item is opaque). A fade would have
       looked smoother and been wrong.
       ------------------------------------------------------------------ */
    document.querySelectorAll("[data-owl]").forEach(function (root) {
        var cfg;
        try { cfg = JSON.parse(root.getAttribute("data-owl")); } catch (e) { return; }
        var slides = Array.prototype.filter.call(root.children, function (c) { return c.nodeType === 1; });
        if (!slides.length) return;
        var speed = reduceMotion ? 0 : (cfg.speed || 250);
        var loop = !!cfg.loop && slides.length > 1;

        var stage = document.createElement("div");
        stage.className = "owl-stage";
        var outer = document.createElement("div");
        outer.className = "owl-stage-outer";
        outer.appendChild(stage);

        var wrap = function (el, cloned) {
            var item = document.createElement("div");
            item.className = "owl-item" + (cloned ? " cloned" : "");
            if (cloned) item.setAttribute("aria-hidden", "true");
            item.appendChild(el);
            return item;
        };
        /* Owl clones the whole set on both sides for a loop; so does this, and
           the DOM ends up the shape v1's was (2 slides -> 6 items). */
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });
        slides.forEach(function (el) { stage.appendChild(wrap(el, false)); });
        if (loop) slides.forEach(function (el) { stage.appendChild(wrap(el.cloneNode(true), true)); });

        root.textContent = "";
        root.appendChild(outer);
        root.classList.add("owl-loaded", "owl-drag");

        var items = Array.prototype.slice.call(stage.children);
        var count = slides.length;
        var index = loop ? count : 0;   // position in `items`
        var timer = null, animating = false;

        /* owl renders the nav container even when nav:false — it just marks it
           disabled — and the template styles `.owl-nav.disabled` and
           `.owl-nav.disabled + .owl-dots`, so the element has to exist. */
        var nav = document.createElement("div");
        nav.className = "owl-nav" + (cfg.nav ? "" : " disabled");
        ["prev", "next"].forEach(function (dir) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "owl-" + dir;
            b.setAttribute("aria-label", dir === "prev" ? "Previous" : "Next");
            /* v1 left Owl's default navText: the words "prev" / "next" (the
               theme styles them as gold pills); cfg.navText overrides */
            b.textContent = (cfg.navText && cfg.navText[dir === "prev" ? 0 : 1]) || dir;
            b.addEventListener("click", function () { go(dir === "next" ? 1 : -1); restartAutoplay(); });
            nav.appendChild(b);
        });
        root.appendChild(nav);

        var dots = document.createElement("div");
        dots.className = "owl-dots" + (cfg.dots ? "" : " disabled");
        root.appendChild(dots);

        var perView = function () {
            var w = window.innerWidth, n = cfg.items || 1;
            Object.keys(cfg.responsive || {})
                .map(Number).sort(function (a, b) { return a - b; })
                .forEach(function (bp) { if (w >= bp) n = cfg.responsive[bp]; });
            return Math.max(1, Math.min(n, count));
        };
        var itemWidth = function () {
            var n = perView(), gap = cfg.margin || 0;
            return (root.clientWidth - gap * (n - 1)) / n;
        };
        /* Non-loop sliders step a page at a time (Owl's default); a loop
           slider steps one item so the clones line up. */
        var step = function () { return loop ? 1 : perView(); };
        var lastIndex = function () { return loop ? items.length - 1 : Math.max(0, count - perView()); };

        var setTransform = function (withTransition) {
            var gap = cfg.margin || 0;
            stage.style.transition = withTransition && speed ? "transform " + speed + "ms ease" : "none";
            stage.style.transform = "translateX(" + (-index * (itemWidth() + gap)) + "px)";
            var real = loop ? ((index - count) % count + count) % count : index;
            Array.prototype.forEach.call(dots.children, function (d, i) {
                d.classList.toggle("active", i === Math.floor(real / step()));
            });
            items.forEach(function (it, i) { it.classList.toggle("active", i >= index && i < index + perView()); });
            /* a non-loop slider greys the arrow that has nowhere to go, as
               Owl did (.owl-prev.disabled at the start, .owl-next at the end) */
            if (!loop) {
                nav.querySelector(".owl-prev").classList.toggle("disabled", index <= 0);
                nav.querySelector(".owl-next").classList.toggle("disabled", index >= lastIndex());
            }
        };

        var guard = null;
        var go = function (d) {
            if (animating) return;
            var target = index + d * step();
            if (!loop) target = Math.max(0, Math.min(lastIndex(), target));
            /* A no-op move — prev on the first slide of a non-loop slider —
               produces no transition and therefore no transitionend. The
               first version set the guard anyway and waited for an event
               that never came: one prev click on the services strip and it
               was dead to every click after. */
            if (target === index) return;
            index = target;
            animating = speed > 0;
            setTransform(true);
            if (!animating) { settleLoop(); return; }
            /* and a belt for the braces: if transitionend is lost (a tab
               hidden mid-slide, say) the guard still clears */
            clearTimeout(guard);
            guard = setTimeout(settleLoop, speed + 100);
        };
        /* After sliding onto a clone, jump silently to the real slide it
           copies — that is the whole trick of a cloned loop. */
        var settleLoop = function () {
            clearTimeout(guard);
            animating = false;
            if (!loop) return;
            if (index >= 2 * count) { index -= count; setTransform(false); }
            else if (index < count) { index += count; setTransform(false); }
        };
        stage.addEventListener("transitionend", function (e) { if (e.target === stage) settleLoop(); });

        var layout = function () {
            /* Laid out while hidden — inside an inactive tab pane, say — the
               width is 0 and every item would be 0 wide. Wait for a real
               size; the ResizeObserver below calls again when it arrives. */
            if (!root.clientWidth) return;
            var width = itemWidth(), gap = cfg.margin || 0;
            items.forEach(function (it) {
                it.style.width = width + "px";
                it.style.marginRight = gap + "px";
            });
            stage.style.width = (width + gap) * items.length + "px";
            if (!loop && index > lastIndex()) index = lastIndex();
            /* Owl marks the nav `.disabled` when every slide is already in
               view (Lawetique's four case results at four per view from
               900px up) — the template hides `.owl-nav.disabled`, so the
               arrows only show where there is somewhere to go. */
            nav.classList.toggle("disabled", !cfg.nav || count <= perView());
            /* Dots are rebuilt on resize because the page count changes with
               how many items fit. The dot is a BUTTON WRAPPING A SPAN, because
               that is Owl's shape and the template styles `.owl-dot span`. */
            dots.textContent = "";
            var pages = Math.max(1, Math.ceil(count / step()));
            for (var i = 0; i < pages; i++) {
                (function (i) {
                    var d = document.createElement("button");
                    d.type = "button";
                    d.className = "owl-dot";
                    d.setAttribute("aria-label", "Go to slide " + (i + 1));
                    d.appendChild(document.createElement("span"));
                    d.addEventListener("click", function () { index = (loop ? count : 0) + i * step(); setTransform(true); restartAutoplay(); });
                    dots.appendChild(d);
                })(i);
            }
            setTransform(false);
        };

        /* Autoplay: paused while the pointer is over the slider, off entirely
           when the visitor asked for reduced motion. */
        var restartAutoplay = function () {
            if (!cfg.autoplay || reduceMotion) return;
            clearInterval(timer);
            timer = setInterval(function () { go(1); }, cfg.autoplay);
        };
        root.addEventListener("mouseenter", function () { clearInterval(timer); });
        root.addEventListener("mouseleave", restartAutoplay);
        restartAutoplay();

        /* Drag and swipe: owl-drag was in the class list, so the slider was
           expected to follow a finger. */
        var startX = null;
        var onDown = function (x) { startX = x; };
        var onUp = function (x) {
            if (startX === null) return;
            var dx = x - startX;
            startX = null;
            if (Math.abs(dx) < 40) return;
            go(dx < 0 ? 1 : -1);
            restartAutoplay();
        };
        root.addEventListener("touchstart", function (e) { onDown(e.touches[0].clientX); }, { passive: true });
        root.addEventListener("touchend", function (e) { onUp(e.changedTouches[0].clientX); }, { passive: true });
        root.addEventListener("mousedown", function (e) { onDown(e.clientX); });
        root.addEventListener("mouseup", function (e) { onUp(e.clientX); });

        layout();
        /* Re-lay out whenever the slider's own box changes size: the window
           resizing, and — the case that bit here — a tab pane being shown,
           which takes the slider from 0px wide to its real width. Owl handled
           the first with a resize handler and left the second to whoever
           called refresh; a ResizeObserver covers both without being told. */
        if ("ResizeObserver" in window) {
            var lastW = root.clientWidth;
            new ResizeObserver(function () {
                if (root.clientWidth === lastW) return;
                lastW = root.clientWidth;
                layout();
            }).observe(root);
        } else {
            var t;
            window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 150); }, { passive: true });
        }
    });


    /* ------------------------------------------------------------------
       Blog search — the search boxes (top bar, off-canvas menu, sidebar)
       and the tag / category links submit ?q= to blog.html; the page keeps
       the posts whose title or text mention it and says what was searched. */
    var q = new URLSearchParams(location.search).get("q");
    var posts = document.getElementById("posts");
    if (q && posts) {
        var needle = q.trim().toLowerCase();
        var cards = Array.prototype.slice.call(posts.querySelectorAll(".tv-post"));
        var kept = 0;
        cards.forEach(function (card) {
            var hit = card.textContent.toLowerCase().indexOf(needle) > -1;
            card.hidden = !hit;
            if (hit) kept++;
        });
        var line = document.createElement("p");
        line.className = "tv-search-summary";
        line.setAttribute("role", "status");
        line.innerHTML = (kept ? kept + " post" + (kept === 1 ? "" : "s") + " matching " : "No posts match ")
            + "<strong></strong> — <a href=\"blog.html\">show all</a>";
        line.querySelector("strong").textContent = "“" + q.trim() + "”";
        posts.parentNode.insertBefore(line, posts);
        var box = document.getElementById("site-search");
        if (box) box.value = q;
    }

    /* ------------------------------------------------------------------
       Off-canvas menu — the hamburger (#showLeft) slides #cbp-spmenu-s1 in
       and pushes the page, as classie.js did; Escape or a tap on the page
       closes it. */
    var burger = document.getElementById("showLeft");
    var side = document.getElementById("cbp-spmenu-s1");
    if (burger && side) {
        var setMenu = function (open) {
            side.classList.toggle("cbp-spmenu-open", open);
            document.body.classList.toggle("cbp-spmenu-push-toright", open);
            burger.classList.toggle("is-active", open);
            burger.classList.toggle("active", open);
            burger.setAttribute("aria-expanded", String(open));
            burger.setAttribute("aria-label", open ? "Close the menu" : "Open the menu");
        };
        burger.addEventListener("click", function (e) { e.preventDefault(); setMenu(!side.classList.contains("cbp-spmenu-open")); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && side.classList.contains("cbp-spmenu-open")) { setMenu(false); burger.focus(); } });
        document.addEventListener("click", function (e) {
            if (!side.classList.contains("cbp-spmenu-open")) return;
            if (side.contains(e.target) || burger.contains(e.target)) return;
            setMenu(false);
        });
    }

    /* Lightbox — the gallery's photographs ([data-image-popup]) open in a
       viewer: arrows and the keyboard step through the set, Escape or a
       click outside closes, focus is restored. (Owner's pick, 2026-09-15.) */
    var popupLinks = Array.prototype.slice.call(document.querySelectorAll("[data-image-popup]"));
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
            lbImg.alt = link.getAttribute("aria-label") || "Gallery image";
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
        popupLinks.forEach(function (link, i) { link.addEventListener("click", function (e) { e.preventDefault(); open(i); }); });
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


    /* Tablet header — the search is an icon until tapped: the first tap
       opens the field, a search with something typed submits, Escape or a
       tap outside closes it again. (Owner's rewrite, 2026-09-15.) */
    var searchForm = document.querySelector(".tv-navbar-fixed-top .search form");
    if (searchForm) {
        var field = searchForm.querySelector("input[type=search]");
        var collapsed = function () { return window.matchMedia("(min-width: 768px) and (max-width: 991.98px)").matches; };
        searchForm.addEventListener("submit", function (e) {
            if (!collapsed()) return;
            if (!searchForm.classList.contains("is-open")) { e.preventDefault(); searchForm.classList.add("is-open"); field.focus(); return; }
            if (!field.value.trim()) { e.preventDefault(); field.focus(); }
        });
        document.addEventListener("click", function (e) {
            if (searchForm.classList.contains("is-open") && !searchForm.contains(e.target)) searchForm.classList.remove("is-open");
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && searchForm.classList.contains("is-open")) { searchForm.classList.remove("is-open"); field.blur(); }
        });
    }

})();
