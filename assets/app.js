/* ===== Econ 9708 study app ===== */
(function () {
  "use strict";

  const LS_PROGRESS = "econ9708.progress";
  const LS_THEME = "econ9708.theme";

  const els = {
    nav: document.getElementById("nav"),
    content: document.getElementById("content"),
    search: document.getElementById("search"),
    searchResults: document.getElementById("searchResults"),
    progressFill: document.getElementById("progressFill"),
    progressLabel: document.getElementById("progressLabel"),
    themeToggle: document.getElementById("themeToggle"),
    navToggle: document.getElementById("navToggle"),
    sidebar: document.getElementById("sidebar"),
  };

  let manifest = { units: [], chapters: [] };
  const chapterCache = {};   // id -> chapter object (lazy)
  let searchIndex = [];      // [{id, unit, title, text}]

  /* ---------- progress ---------- */
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(LS_PROGRESS)) || {}; }
    catch (e) { return {}; }
  }
  function setDone(id, done) {
    const p = getProgress();
    if (done) p[id] = 1; else delete p[id];
    localStorage.setItem(LS_PROGRESS, JSON.stringify(p));
    renderProgress();
    syncNavDone();
  }
  function renderProgress() {
    const p = getProgress();
    const total = manifest.chapters.length || 0;
    const done = manifest.chapters.filter((c) => p[c.id]).length;
    els.progressFill.style.width = total ? (done / total) * 100 + "%" : "0%";
    els.progressLabel.textContent = `${done} of ${total} chapters done`;
  }
  function syncNavDone() {
    const p = getProgress();
    els.nav.querySelectorAll("a[data-id]").forEach((a) => {
      const done = !!p[a.dataset.id];
      a.classList.toggle("done", done);
      const chk = a.querySelector(".chk");
      if (chk) chk.textContent = done ? "✓" : "○";
    });
  }

  /* ---------- theme ---------- */
  function initTheme() {
    const t = localStorage.getItem(LS_THEME) || "dark";
    document.documentElement.setAttribute("data-theme", t);
    els.themeToggle.textContent = t === "dim" ? "◑ Dark" : "◐ Dim";
  }
  els.themeToggle.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dim" ? "dark" : "dim";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(LS_THEME, next);
    els.themeToggle.textContent = next === "dim" ? "◑ Dark" : "◐ Dim";
  });

  /* ---------- nav ---------- */
  function buildNav() {
    els.nav.innerHTML = "";
    manifest.units.forEach((unit) => {
      const chapters = manifest.chapters
        .filter((c) => c.unit === unit.id)
        .sort((a, b) => a.order - b.order);
      if (!chapters.length) return;
      const group = document.createElement("div");
      group.className = "unit-group";
      const title = document.createElement("div");
      title.className = "unit-title";
      title.textContent = unit.title;
      group.appendChild(title);
      chapters.forEach((c) => {
        const a = document.createElement("a");
        a.href = "#" + c.id;
        a.dataset.id = c.id;
        a.innerHTML = `<span class="chk">○</span><span class="nav-num">${c.navNum || ""}</span><span class="nav-title">${c.title}</span>`;
        group.appendChild(a);
      });
      els.nav.appendChild(group);
    });
    syncNavDone();
  }

  /* ---------- content loading ---------- */
  async function loadChapter(id) {
    if (chapterCache[id]) return chapterCache[id];
    const res = await fetch(`content/${id}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    chapterCache[id] = data;
    return data;
  }

  function renderWelcome() {
    const total = manifest.chapters.length;
    const populated = manifest.chapters.filter((c) => !c.stub).length;
    els.content.innerHTML = `
      <div class="welcome">
        <div class="eyebrow" style="color:var(--orange);letter-spacing:1px;font-weight:600;text-transform:uppercase;font-size:12.5px">Cambridge International · 9708</div>
        <h1>Your <span class="grad">A&nbsp;Level Economics</span> hub</h1>
        <p>Every chapter summarised in full, exam tips &amp; tricks, key terms, and hand-picked YouTube videos — all in one place. Pick a chapter on the left, or hit <kbd>/</kbd> to search.</p>
        <div class="stat-row">
          <div class="stat"><b>${total}</b><small>chapters</small></div>
          <div class="stat"><b>${populated}</b><small>written up</small></div>
          <div class="stat"><b>${manifest.units.length}</b><small>units</small></div>
        </div>
      </div>`;
  }

  function vidBlock(videos) {
    if (!videos) return "";
    const ch = (videos.channels || []).map((v) =>
      `<a class="vid" href="${v.url}" target="_blank" rel="noopener"><span class="play">▶</span><span><span class="v-title">${v.name}</span><br><span class="v-why">${v.why || ""}</span></span></a>`
    ).join("");
    const kc = (videos.keyConcepts || []).map((v) =>
      `<a class="vid" href="${v.url}" target="_blank" rel="noopener"><span class="play">▶</span><span><span class="v-title">${v.title}</span><br><span class="v-why">${v.concept || ""}</span></span></a>`
    ).join("");
    if (!ch && !kc) return "";
    return `
      <div class="card videos">
        <h2 class="card-title"><span class="pill">Watch</span> Videos</h2>
        ${ch ? `<div class="vid-group"><h3>Trusted channels</h3>${ch}</div>` : ""}
        ${kc ? `<div class="vid-group"><h3>Key-concept videos</h3>${kc}</div>` : ""}
      </div>`;
  }

  async function renderChapter(id) {
    els.content.innerHTML = `<div class="loading">Loading…</div>`;
    let data;
    try { data = await loadChapter(id); }
    catch (e) {
      els.content.innerHTML = `<div class="welcome"><h1>Not written yet</h1><p>This chapter hasn’t been populated yet. Ask Claude to “update the econ site” to fill it in.</p></div>`;
      return;
    }
    const isDone = !!getProgress()[id];
    const terms = (data.keyTerms && data.keyTerms.length) ? `
      <div class="card terms">
        <h2 class="card-title"><span class="pill">Define</span> Key terms</h2>
        <dl>${data.keyTerms.map((t) => `<dt>${t.term}</dt><dd>${t.definition}</dd>`).join("")}</dl>
      </div>` : "";
    const tips = (data.tips && data.tips.length) ? `
      <div class="card tips">
        <h2 class="card-title"><span class="pill">Exam</span> Tips &amp; tricks</h2>
        <ul>${data.tips.map((t) => `<li>${marked.parseInline(t)}</li>`).join("")}</ul>
      </div>` : "";
    const diagrams = (data.diagrams && data.diagrams.length) ? `
      <div class="card diagrams">
        <h2 class="card-title"><span class="pill">Draw</span> Diagrams to know</h2>
        <ul>${data.diagrams.map((d) => `<li>${marked.parseInline(d)}</li>`).join("")}</ul>
      </div>` : "";

    els.content.innerHTML = `
      <header class="chapter-head">
        <div class="eyebrow">${data.unitTitle || data.unit || ""}</div>
        <h1>${data.title}</h1>
        <div class="head-actions">
          ${data.revisionNotes ? '<button class="rev-btn" id="revBtn">📝 Revision notes</button>' : ''}
          <button class="mark-btn ${isDone ? "is-done" : ""}" id="markBtn">${isDone ? "✓ Completed" : "Mark as done"}</button>
        </div>
      </header>
      <article class="prose">${data.summary ? marked.parse(data.summary) : "<p><em>Summary coming soon.</em></p>"}</article>
      ${terms}${diagrams}${tips}${vidBlock(data.videos)}
    `;
    document.getElementById("markBtn").addEventListener("click", function () {
      const nowDone = !getProgress()[id];
      setDone(id, nowDone);
      this.classList.toggle("is-done", nowDone);
      this.textContent = nowDone ? "✓ Completed" : "Mark as done";
    });
    if (data.revisionNotes) {
      var rb = document.getElementById("revBtn");
      if (rb) rb.addEventListener("click", function () { openRevModal(data.revisionNotes); });
    }
    els.content.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  /* ---------- revision-notes modal ---------- */
  function openRevModal(md) {
    let ov = document.getElementById("revModal");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "revModal";
      ov.className = "modal-overlay";
      ov.innerHTML = '<div class="modal"><button class="modal-close" aria-label="Close">✕</button><div class="modal-eyebrow">Revision notes</div><div class="modal-body prose"></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener("click", function (e) {
        if (e.target === ov || e.target.classList.contains("modal-close")) closeRevModal();
      });
    }
    ov.querySelector(".modal-body").innerHTML = marked.parse(md);
    ov.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeRevModal() {
    const ov = document.getElementById("revModal");
    if (ov) ov.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- search ---------- */
  async function buildSearchIndex() {
    searchIndex = manifest.chapters.map((c) => ({
      id: c.id, unit: c.unitTitle || "", title: c.title,
      text: ((c.title || "") + " " + (c.keywords || []).join(" ")).toLowerCase(),
    }));
    // lazily enrich with body text as chapters get cached
  }
  function enrichIndex(id, data) {
    const entry = searchIndex.find((s) => s.id === id);
    if (!entry) return;
    const extra = [
      data.summary || "",
      (data.keyTerms || []).map((t) => t.term + " " + t.definition).join(" "),
      (data.tips || []).join(" "),
      (data.searchTerms || []).join(" "),
    ].join(" ").toLowerCase();
    entry.text += " " + extra;
  }
  function runSearch(q) {
    q = q.trim().toLowerCase();
    if (!q) { els.searchResults.hidden = true; return; }
    const terms = q.split(/\s+/);
    const hits = searchIndex
      .map((s) => {
        let score = 0;
        terms.forEach((t) => {
          if (s.title.toLowerCase().includes(t)) score += 5;
          if (s.text.includes(t)) score += 1;
        });
        return { s, score };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    if (!hits.length) {
      els.searchResults.innerHTML = `<div class="sr-empty">No matches for “${q}”.</div>`;
      els.searchResults.hidden = false;
      return;
    }
    els.searchResults.innerHTML = hits.map((h) =>
      `<a href="#${h.s.id}"><span class="sr-unit">${h.s.unit}</span>${h.s.title}</a>`
    ).join("");
    els.searchResults.hidden = false;
  }
  els.search.addEventListener("input", (e) => runSearch(e.target.value));
  els.search.addEventListener("focus", (e) => { if (e.target.value) runSearch(e.target.value); });
  document.addEventListener("click", (e) => {
    if (!els.searchResults.contains(e.target) && e.target !== els.search) els.searchResults.hidden = true;
    if (e.target.closest(".search-results a")) { els.search.value = ""; els.searchResults.hidden = true; closeNav(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== els.search) { e.preventDefault(); els.search.focus(); }
    if (e.key === "Escape") { els.searchResults.hidden = true; els.search.blur(); closeRevModal(); }
  });

  /* ---------- mobile nav ---------- */
  function closeNav() { els.sidebar.classList.remove("open"); }
  els.navToggle.addEventListener("click", () => els.sidebar.classList.toggle("open"));

  /* ---------- routing ---------- */
  function setActiveNav(id) {
    els.nav.querySelectorAll("a[data-id]").forEach((a) => a.classList.toggle("active", a.dataset.id === id));
  }
  async function route() {
    const id = location.hash.replace(/^#/, "");
    closeNav();
    if (!id) { renderWelcome(); setActiveNav(null); return; }
    setActiveNav(id);
    await renderChapter(id);
    // enrich search index with body once loaded
    if (chapterCache[id]) enrichIndex(id, chapterCache[id]);
  }
  window.addEventListener("hashchange", route);

  /* ---------- boot ---------- */
  async function init() {
    initTheme();
    try {
      const res = await fetch("content/manifest.json", { cache: "no-cache" });
      manifest = await res.json();
    } catch (e) {
      els.content.innerHTML = `<div class="welcome"><h1>Could not load content</h1><p>Open this site over http(s) (e.g. the live GitHub Pages URL or a local server), not as a file://.</p></div>`;
      return;
    }
    // give each chapter a display number per unit
    manifest.units.forEach((u, ui) => {
      manifest.chapters.filter((c) => c.unit === u.id).sort((a, b) => a.order - b.order)
        .forEach((c, ci) => { c.navNum = (ui + 1) + "." + (ci + 1); c.unitTitle = u.title; });
    });
    buildNav();
    renderProgress();
    await buildSearchIndex();
    route();
  }
  init();
})();
