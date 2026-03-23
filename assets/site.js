(function () {
  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function slugify(str) {
    return String(str || "")
      .trim()
      .toLowerCase()
      .replace(/[\u2019']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function getActiveArticle() {
    return document.querySelector("[data-post]") || document.querySelector("article") || document.body;
  }

  function buildToc() {
    const article = getActiveArticle();
    const toc = document.getElementById("toc");
    const tocMobile = document.getElementById("toc-mobile");
    if (!article || (!toc && !tocMobile)) return;

    // Notion-like hierarchy:
    // - h2: main section
    // - h3: subsection
    // - h4: sub-subsection (optional, future-proof)
    const headings = Array.from(article.querySelectorAll("h2, h3, h4"));
    if (!headings.length) return;

    const links = [];
    for (const h of headings) {
      const text = (h.textContent || "").trim();
      if (!text) continue;
      if (!h.id) h.id = slugify(text);
      links.push({ id: h.id, text, level: h.tagName.toLowerCase() });
    }

    const render = (target) => {
      if (!target) return;
      // Render Notion-like nested TOC:
      // toc-section (h2)
      //  - toc-link-h2
      //  - toc-sub (h3)
      //     - link
      //     - toc-sub-sub (h4)
      let html = "";
      let inSection = false;
      let inSub = false;
      let inSubSub = false;

      const closeSubSub = () => {
        if (inSubSub) {
          html += `</div>`;
          inSubSub = false;
        }
      };
      const closeSub = () => {
        if (inSub) {
          closeSubSub();
          html += `</div>`;
          inSub = false;
        }
      };
      const closeSection = () => {
        if (inSection) {
          closeSub();
          html += `</div>`;
          inSection = false;
        }
      };

      const openImplicitSection = () => {
        if (inSection) return;
        html += `<div class="toc-section toc-section-implicit">`;
        inSection = true;
      };

      for (const l of links) {
        if (l.level === "h2") {
          closeSection();
          html += `<div class="toc-section">`;
          inSection = true;
          html += `<a class="toc-link-h2" href="#${l.id}" data-toc-link="${l.id}">${l.text}</a>`;
          html += `<div class="toc-sub">`;
          inSub = true;
          continue;
        }

        if (l.level === "h3") {
          openImplicitSection();
          if (!inSub) {
            html += `<div class="toc-sub">`;
            inSub = true;
          }
          closeSubSub();
          html += `<a class="toc-link-h3" href="#${l.id}" data-toc-link="${l.id}">${l.text}</a>`;
          continue;
        }

        if (l.level === "h4") {
          openImplicitSection();
          if (!inSub) {
            html += `<div class="toc-sub">`;
            inSub = true;
          }
          if (!inSubSub) {
            html += `<div class="toc-sub-sub">`;
            inSubSub = true;
          }
          html += `<a class="toc-link-h4" href="#${l.id}" data-toc-link="${l.id}">${l.text}</a>`;
        }
      }

      closeSection();
      target.innerHTML = html;
    };

    render(toc);
    render(tocMobile);
  }

  function enableTocHighlight() {
    const tocLinks = Array.from(document.querySelectorAll("[data-toc-link]"));
    if (!tocLinks.length) return;

    const ids = tocLinks.map((a) => a.getAttribute("data-toc-link")).filter(Boolean);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    // IMPORTANT:
    // The site uses a <base href="..."> tag, which makes href="#section" resolve to "/#section" (home).
    // Intercept clicks and scroll within the current document instead.
    tocLinks.forEach((a) => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        const id = a.getAttribute("data-toc-link");
        if (!id) return;
        const node = document.getElementById(id);
        if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${encodeURIComponent(id)}`);
      });
    });

    const clear = () => tocLinks.forEach((a) => a.classList.remove("active"));
    const set = (id) => tocLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("data-toc-link") === id));

    let last = null;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0));
        if (!visible.length) return;
        const id = visible[0].target.id;
        if (id && id !== last) {
          last = id;
          set(id);
        }
      },
      { root: null, rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] }
    );

    nodes.forEach((n) => io.observe(n));

    // initialize
    clear();
    const hash = decodeURIComponent((location.hash || "").replace("#", ""));
    if (hash) set(hash);
  }

  function enableIndexParallax() {
    if (!document.body || document.body.getAttribute("data-page") !== "home") return;
    if (prefersReducedMotion()) return;

    const binds = [
      ...Array.from(document.querySelectorAll(".feature-card")),
      ...Array.from(document.querySelectorAll(".index-row-link")),
    ];
    if (!binds.length) return;

    const max = 2.0; // px (very subtle)

    for (const host of binds) {
      const art = host.querySelector(".auto-art[data-parallax]");
      if (!art) continue;

      let raf = 0;
      let nextX = 0;
      let nextY = 0;

      const apply = () => {
        raf = 0;
        art.style.setProperty("--parallax-x", String(nextX));
        art.style.setProperty("--parallax-y", String(nextY));
      };

      const onMove = (ev) => {
        const r = host.getBoundingClientRect();
        const cx = ev.clientX - (r.left + r.width / 2);
        const cy = ev.clientY - (r.top + r.height / 2);
        const nx = r.width ? cx / (r.width / 2) : 0;
        const ny = r.height ? cy / (r.height / 2) : 0;
        nextX = Math.max(-max, Math.min(max, nx * max));
        nextY = Math.max(-max, Math.min(max, ny * max));
        if (!raf) raf = requestAnimationFrame(apply);
      };

      const onLeave = () => {
        nextX = 0;
        nextY = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      };

      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
    }
  }

  function enableTabFiltering() {
    const tabs = document.querySelectorAll('.tab[data-filter]');
    if (!tabs.length) return;

    const rows = document.querySelectorAll('.list-row[data-category]');
    if (!rows.length) return;

    // Tab click handler
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = tab.dataset.filter;
        
        // Update active state
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        tabs.forEach(t => {
          if (t !== tab) t.setAttribute('aria-selected', 'false');
        });
        
        // Filter posts
        rows.forEach(row => {
          if (filter === 'all' || row.dataset.category === filter) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
        
        // Update URL hash
        if (filter === 'all') {
          history.replaceState(null, '', window.location.pathname);
        } else {
          history.replaceState(null, '', '#' + filter);
        }
      });
    });

    // Handle initial hash on page load
    const hash = window.location.hash.slice(1);
    if (hash) {
      const tab = document.querySelector(`.tab[data-filter="${hash}"]`);
      if (tab) {
        tab.click();
      }
    }

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.slice(1);
      const tab = newHash 
        ? document.querySelector(`.tab[data-filter="${newHash}"]`)
        : document.querySelector('.tab[data-filter="all"]');
      if (tab && !tab.classList.contains('active')) {
        tab.click();
      }
    });
  }

  function enableScrollReveal() {
    // Requirement: only reveal on the post detail page, not on the home/index.
    if (!document.body || document.body.getAttribute("data-page") !== "post") return;
    if (prefersReducedMotion()) return;
    
    // Auto-tag post content blocks as reveal targets.
    const auto = [];
    const title = document.querySelector(".post-title");
    const dek = document.querySelector(".post-dek");
    if (title) auto.push(title);
    if (dek) auto.push(dek);
    
    const article = document.querySelector(".md-article");
    if (article) {
      const blocks = Array.from(article.children).filter((el) => {
        const tag = (el.tagName || "").toLowerCase();
        if (!tag) return false;
        if (tag === "script" || tag === "style") return false;
        // skip thin dividers
        if (tag === "div" && el.classList.contains("divider")) return false;
        return true;
      });
      auto.push(...blocks);
    }
    
    auto.forEach((n) => n.classList.add("reveal"));
    
    const nodes = Array.from(document.querySelectorAll(".reveal"));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      },
      { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );

    nodes.forEach((n) => io.observe(n));
  }

  function enableMegaMenu() {
    const trigger = document.querySelector("[data-mega-trigger]");
    const panel = document.querySelector(".mega-panel");
    const overlay = document.querySelector(".mega-overlay");
    if (!trigger || !panel) return;

    let closeTimer = null;
    const open = () => {
      clearTimeout(closeTimer);
      panel.classList.add("is-open");
      overlay?.classList.add("is-active");
      trigger.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      closeTimer = setTimeout(() => {
        panel.classList.remove("is-open");
        overlay?.classList.remove("is-active");
        trigger.setAttribute("aria-expanded", "false");
      }, 300);
    };

    trigger.addEventListener("mouseenter", open);
    trigger.addEventListener("mouseleave", close);
    panel.addEventListener("mouseenter", () => clearTimeout(closeTimer));
    panel.addEventListener("mouseleave", close);
    overlay?.addEventListener("click", () => {
      clearTimeout(closeTimer);
      panel.classList.remove("is-open");
      overlay.classList.remove("is-active");
      trigger.setAttribute("aria-expanded", "false");
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        panel.classList.contains("is-open") ? close() : open();
      }
      if (e.key === "Escape") close();
    });
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function boot() {
    buildToc();
    enableTocHighlight();
    enableIndexParallax();
    enableTabFiltering();
    enableScrollReveal();
    enableMegaMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();


