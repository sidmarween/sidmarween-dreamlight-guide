/* Dreamlight Guide – Oberfläche. © marween
 * Inhalte: Dreamlight Valley Wiki (dreamlightvalleywiki.com), CC BY-NC-SA 4.0 */
(function () {
  'use strict';

  const D = window.DG_DATA;
  const M = window.DG_MASCOTS;
  const WIKI = 'https://dreamlightvalleywiki.com';
  const API = WIKI + '/api.php';
  const hasAndroid = typeof window.Android !== 'undefined';
  const view = document.getElementById('view');

  /* ------------------------------------------------------------ Hilfen */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').trim();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pageHref = t => '#/page/' + encodeURIComponent(t);
  const catHref = c => '#/cat/' + encodeURIComponent(c);
  const chunks = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };

  function absUrl(u) {
    if (!u) return u;
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('/')) return WIKI + u;
    return u;
  }

  const store = {
    get(k, d) { try { const v = localStorage.getItem('dg:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dg:' + k, JSON.stringify(v)); } catch (e) { /* voll */ } }
  };

  const settings = Object.assign({ autoTr: true, trTitles: true, deSearch: true }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);

  let toastTimer = 0;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ------------------------------------------------------------ Bridge zu Android */
  let seq = 0;
  const pending = new Map();
  let needsRetry = false;
  window.DG = {
    _resolve(id, s) {
      const p = pending.get(id); if (!p) return;
      pending.delete(id);
      let o; try { o = JSON.parse(s); } catch (e) { o = { ok: false, error: 'Antwort unlesbar' }; }
      p(o);
    },
    onResume() { if (needsRetry) { needsRetry = false; route(); } }
  };
  function call(method, ...args) {
    return new Promise(res => {
      const id = 'r' + (++seq);
      pending.set(id, res);
      try { window.Android[method](id, ...args); } catch (e) { pending.delete(id); res({ ok: false, error: String(e) }); }
    });
  }

  /* ------------------------------------------------------------ Wiki-API */
  async function browserFetch(url) {
    try {
      const r = await fetch(url + '&origin=*');
      const body = await r.text();
      return r.ok ? { ok: true, body } : { ok: false, status: r.status };
    } catch (e) { return { ok: false, status: 0, error: String(e) }; }
  }

  async function api(params, maxAge) {
    const p = Object.assign({ format: 'json', formatversion: '2' }, params);
    const url = API + '?' + Object.keys(p).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(p[k])).join('&');
    const r = hasAndroid ? await call('fetch', url, (maxAge || 0) | 0) : await browserFetch(url);
    if (!r.ok) {
      const e = new Error(r.challenge ? 'challenge' : (r.error || ('HTTP ' + (r.status || 0))));
      e.challenge = !!r.challenge; e.status = r.status;
      throw e;
    }
    let data;
    try { data = JSON.parse(r.body); } catch (e) { throw new Error('Ungültige Antwort vom Wiki'); }
    if (data.error) { const e = new Error(data.error.info || data.error.code); e.code = data.error.code; throw e; }
    data.__offline = !!(r.cached && ('status' in r));
    data.__savedAt = r.savedAt;
    return data;
  }

  /* Abfrage mit Fortsetzung – führt Seiten (mit Kategorien) zusammen. */
  async function apiPages(params, maxAge, maxIter) {
    const pages = new Map();
    let cont = {};
    let offline = false;
    for (let i = 0; i < (maxIter || 4); i++) {
      const d = await api(Object.assign({}, params, cont), maxAge);
      offline = offline || d.__offline;
      ((d.query && d.query.pages) || []).forEach(p => {
        const ex = pages.get(p.pageid || p.title);
        if (ex) {
          if (p.categories) ex.categories = (ex.categories || []).concat(p.categories);
          if (p.thumbnail && !ex.thumbnail) ex.thumbnail = p.thumbnail;
        } else pages.set(p.pageid || p.title, p);
      });
      if (!d.continue) break;
      cont = Object.assign({}, d.continue);
    }
    const arr = Array.from(pages.values());
    arr.__offline = offline;
    return arr;
  }

  /* Vorschaubild + Kategorien für Titel (folgt Weiterleitungen). */
  const metaCache = new Map();
  async function getMeta(titles) {
    const out = {};
    const need = titles.filter(t => { if (metaCache.has(t)) { out[t] = metaCache.get(t); return false; } return true; });
    for (const ch of chunks(need, 50)) {
      let d;
      try {
        d = await api({
          action: 'query', titles: ch.join('|'), redirects: '1', prop: 'pageimages|categories',
          piprop: 'thumbnail', pithumbsize: '120', pilimit: '50', clshow: '!hidden', cllimit: 'max'
        }, 86400);
      } catch (e) { continue; }
      const redir = {};
      ((d.query && d.query.normalized) || []).forEach(n => { redir[n.from] = n.to; });
      ((d.query && d.query.redirects) || []).forEach(n => { redir[n.from] = n.to; });
      const pages = {};
      ((d.query && d.query.pages) || []).forEach(p => { pages[p.title] = p; });
      ch.forEach(t => {
        let tt = redir[t] || t; tt = redir[tt] || tt;
        const p = pages[tt];
        const m = {
          title: tt, missing: !p || !!p.missing || !!p.invalid,
          thumb: p && p.thumbnail ? absUrl(p.thumbnail.source) : null,
          cats: ((p && p.categories) || []).map(c => c.title.replace(/^Category:/, ''))
        };
        metaCache.set(t, m); out[t] = m;
      });
    }
    return out;
  }

  /* ------------------------------------------------------------ Übersetzung */
  let modelReady = false;
  let modelBusy = false;
  const trMem = new Map();

  async function checkModel() {
    if (!hasAndroid) { modelReady = !!window.DG_TEST_TR; return modelReady; }
    const r = await call('modelStatus');
    modelReady = !!(r.ok && r.ready);
    return modelReady;
  }

  async function downloadModel() {
    if (!hasAndroid) { modelReady = true; return true; }
    modelBusy = true;
    const r = await call('downloadModel');
    modelBusy = false;
    modelReady = !!r.ok;
    if (!r.ok) toast('Sprachpaket konnte nicht geladen werden');
    return modelReady;
  }

  async function translate(texts, dir) {
    dir = dir || 'en-de';
    const out = new Array(texts.length);
    const need = [], idx = [];
    texts.forEach((t, i) => {
      const k = dir + '|' + t;
      if (trMem.has(k)) out[i] = trMem.get(k); else { need.push(t); idx.push(i); }
    });
    if (need.length) {
      let r;
      if (hasAndroid) r = await call('translate', JSON.stringify(need), dir);
      else r = { ok: true, texts: need.map(t => (window.DG_TEST_TR ? window.DG_TEST_TR(t, dir) : t)) };
      if (!r.ok) throw new Error(r.error || 'Übersetzung fehlgeschlagen');
      r.texts.forEach((d, j) => { trMem.set(dir + '|' + need[j], d); out[idx[j]] = d; });
    }
    return out;
  }

  function glossaryTranslate(q) {
    const g = D.glossary;
    let s = ' ' + q.toLowerCase().trim() + ' ';
    const keys = Object.keys(g).sort((a, b) => b.length - a.length);
    let changed = false;
    for (const k of keys) {
      const re = new RegExp('(^|[\\s,.;:!?()])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[\\s,.;:!?()])', 'g');
      if (re.test(s)) { s = s.replace(re, '$1' + g[k]); changed = true; }
    }
    return changed ? s.trim() : null;
  }

  /* ------------------------------------------------------------ Arten von Einträgen */
  const KINDS = [
    { k: 'quest', label: 'Mission', e: '📜', re: /\bQuests?\b/i },
    { k: 'char', label: 'Figur', e: '🧑', re: /\b(Characters|Villagers)\b/i },
    { k: 'fish', label: 'Fisch', e: '🐟', re: /\bFish\b/i },
    { k: 'meal', label: 'Rezept', e: '🍲', re: /\b(Meals|Appetizers|Entr[ée]es|Desserts|Cooking Recipes)\b/i },
    { k: 'ing', label: 'Zutat', e: '🥕', re: /\b(Ingredients|Vegetables|Fruits?|Spices|Grains|Sweets|Dairy)\b/i },
    { k: 'critter', label: 'Kritter', e: '🦊', re: /\b(Critters|Companions)\b/i },
    { k: 'gem', label: 'Edelstein', e: '💎', re: /\bGems?\b/i },
    { k: 'mat', label: 'Material', e: '🪵', re: /\b(Materials|Resources)\b/i },
    { k: 'cloth', label: 'Kleidung', e: '👗', re: /\b(Clothing|Tops|Bottoms|Shoes|Accessories|Outfits|Dresses|Headwear|Motifs)\b/i },
    { k: 'furn', label: 'Möbel', e: '🛋️', re: /\bFurniture\b/i },
    { k: 'realm', label: 'Reich', e: '🏰', re: /\bRealms?\b/i },
    { k: 'place', label: 'Ort', e: '🗺️', re: /\b(Biomes?|Locations?|Areas)\b/i },
    { k: 'event', label: 'Event', e: '⭐', re: /\b(Events?|Star Paths?)\b/i },
    { k: 'tool', label: 'Werkzeug', e: '🛠️', re: /\bTools?\b/i }
  ];
  const KIND_DEFAULT = { k: 'other', label: 'Eintrag', e: '📄' };
  function kindOf(cats) {
    const s = (cats || []).join(' | ');
    for (const k of KINDS) if (k.re.test(s)) return k;
    return KIND_DEFAULT;
  }
  const FILTERS = [
    { id: 'all', label: 'Alle', ks: null },
    { id: 'char', label: '🧑 Figuren', ks: ['char'] },
    { id: 'quest', label: '📜 Missionen', ks: ['quest'] },
    { id: 'meal', label: '🍲 Rezepte', ks: ['meal'] },
    { id: 'ing', label: '🥕 Zutaten', ks: ['ing'] },
    { id: 'item', label: '🎒 Gegenstände', ks: ['furn', 'cloth', 'mat', 'gem', 'fish', 'tool'] },
    { id: 'critter', label: '🦊 Kritter', ks: ['critter'] },
    { id: 'place', label: '🗺️ Orte', ks: ['place', 'realm'] },
    { id: 'other', label: '📄 Sonstiges', ks: ['event', 'other'] }
  ];

  /* ------------------------------------------------------------ Gespeicherte Daten */
  const favs = () => store.get('favs', []);
  const isFav = t => favs().some(f => f.title === t);
  function toggleFav(t, kind) {
    let f = favs();
    if (f.some(x => x.title === t)) { f = f.filter(x => x.title !== t); toast('Von der Merkliste entfernt'); }
    else { f.unshift({ title: t, kind: kind || 'other', ts: Date.now() }); toast('⭐ Gemerkt'); }
    store.set('favs', f);
  }
  function addHistory(t, kind) {
    const h = store.get('history', []).filter(x => x.title !== t);
    h.unshift({ title: t, kind: kind || 'other', ts: Date.now() });
    store.set('history', h.slice(0, 60));
  }
  const doneQuests = () => store.get('done', {});
  function setDone(t, on) {
    const d = doneQuests();
    if (on) d[t] = Date.now(); else delete d[t];
    store.set('done', d);
  }
  const checks = t => store.get('chk:' + t, []);
  function setChecks(t, arr) {
    store.set('chk:' + t, arr);
    const prog = store.get('qprog', {});
    if (arr.length) prog[t] = Date.now(); else delete prog[t];
    store.set('qprog', prog);
  }
  const kindByKey = k => KINDS.find(x => x.k === k) || KIND_DEFAULT;

  /* ------------------------------------------------------------ Routing */
  const scrollPos = {};
  let renderToken = 0;
  let curHash = '';

  function parseHash() {
    const h = location.hash.replace(/^#/, '') || '/';
    const qi = h.indexOf('?');
    const path = qi >= 0 ? h.slice(0, qi) : h;
    const qs = qi >= 0 ? h.slice(qi + 1) : '';
    const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    return { parts, q: new URLSearchParams(qs) };
  }

  function setTab(name) {
    const map = { '': 'home', page: '', cat: '', topic: 'home', dlc: 'home', search: 'search', saved: 'saved', quests: 'quests', info: 'info' };
    const tab = name in map ? map[name] : '';
    $$('#tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  }

  let scrollTimer = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrollPos[curHash] = window.scrollY; }, 120);
  }, { passive: true });

  function restoreScroll() {
    const y = scrollPos[curHash];
    window.scrollTo(0, y || 0);
  }

  async function route() {
    const tok = ++renderToken;
    curHash = location.hash || '#/';
    const { parts, q } = parseHash();
    setTab(parts[0] || '');
    window.scrollTo(0, 0);
    try {
      switch (parts[0]) {
        case undefined: await viewHome(tok); break;
        case 'search': await viewSearch(tok, q.get('q') || ''); break;
        case 'page': await viewPage(tok, parts.slice(1).join('/')); break;
        case 'cat': await viewCategory(tok, parts.slice(1).join('/')); break;
        case 'topic': await viewTopic(tok, parts[1]); break;
        case 'dlc': await viewDlc(tok, parts[1]); break;
        case 'saved': viewSaved(tok, q.get('t') || 'fav'); break;
        case 'quests': viewQuests(tok); break;
        case 'info': await viewInfo(tok); break;
        default: location.replace('#/');
      }
    } catch (e) {
      if (tok === renderToken) { view.innerHTML = topBar('Fehler') + errorHtml(e); bindCommon(); }
    }
  }
  window.addEventListener('hashchange', route);

  function goBack() {
    if (history.length > 1) history.back(); else location.hash = '#/';
  }

  /* ------------------------------------------------------------ Bausteine */
  function topBar(title, right) {
    return `<header class="top"><button class="iconbtn" data-act="back" aria-label="Zurück">←</button>` +
      `<h1>${esc(title)}</h1>${right || ''}</header>`;
  }

  function spinner(txt) { return `<div class="loader">${M.funkel(64, { noSparks: true })}<span>${esc(txt || 'Funkel sucht …')}</span></div>`; }
  function emptyHtml(mascot, html) { return `<div class="empty"><div class="em">${M[mascot](96, { sleepy: mascot === 'wolki' })}</div>${html}</div>`; }
  function celebrate(msg) {
    const o = document.createElement('div'); o.className = 'celebrate';
    o.innerHTML = `<div class="cb">${M.funkel(120)}<b>${esc(msg)}</b></div>` +
      Array.from({ length: 14 }, (_, i) => `<i style="left:${8 + Math.random() * 84}%;animation-delay:${(Math.random() * .4).toFixed(2)}s;background:${['#FFD27A', '#FF8FB8', '#7BE0A8', '#BDE7FF'][i % 4]}"></i>`).join('');
    document.body.appendChild(o);
    setTimeout(() => o.classList.add('out'), 1500);
    setTimeout(() => o.remove(), 1900);
  }

  function errorHtml(e, extra) {
    if (e && e.challenge) {
      return `<div class="note warn"><span class="nm">${M.mumi(44)}</span><div><b>Das Wiki möchte kurz prüfen, dass du kein Bot bist.</b><br>` +
        `Tippe auf „Prüfung öffnen“, bestätige dort ggf. die Abfrage und tippe dann auf „Fertig“.` +
        `<div class="btns"><button class="btn small" data-act="verify">Prüfung öffnen</button><button class="btn small ghost" data-act="retry">Nochmal versuchen</button></div></div></div>`;
    }
    const offline = e && (e.status === 0 || /Unknown|Timeout|Connect|resolve/i.test(e.message || ''));
    return `<div class="note err"><span class="nm">${M.wolki(44)}</span><div><b>${offline ? 'Keine Verbindung zum Wiki' : 'Das hat nicht geklappt'}</b><br>` +
      `<span class="small">${esc(offline ? 'Diese Seite ist noch nicht offline gespeichert. Prüfe das Internet und versuche es erneut.' : (e && e.message) || '')}</span>` +
      `${extra || ''}<div class="btns"><button class="btn small" data-act="retry">Nochmal versuchen</button></div></div></div>`;
  }

  function offlineNote(savedAt) {
    const d = savedAt ? new Date(savedAt) : null;
    return `<div class="note"><span>💾</span><div>Offline-Fassung${d ? ' vom ' + d.toLocaleDateString('de-DE') + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''} – keine Verbindung zum Wiki.</div></div>`;
  }

  function thumbHtml(thumb, emoji) {
    return `<div class="thumb">${thumb ? `<img loading="lazy" src="${esc(thumb)}" alt="" data-fb="${esc(emoji)}">` : esc(emoji)}</div>`;
  }

  function rowHtml(it) {
    const k = it.kind || KIND_DEFAULT;
    const done = it.done ? '<span class="done">✔</span>' : '<span class="chev">›</span>';
    return `<a class="row" href="${pageHref(it.title)}" data-t="${esc(it.title)}">${thumbHtml(it.thumb, k.e)}` +
      `<div class="txt"><div class="k">${esc(it.label || k.label)}</div><div class="t">${esc(it.title)}</div><div class="de"></div>` +
      `${it.snippet ? `<div class="sn">${esc(it.snippet)}</div>` : ''}</div>${done}</a>`;
  }

  /* Titel in Listen zusätzlich auf Deutsch anzeigen */
  async function translateTitles(container, tok) {
    if (!settings.autoTr || !settings.trTitles || !modelReady) return;
    const rows = $$('.row[data-t]', container).filter(r => !r.dataset.trd);
    if (!rows.length) return;
    for (const batch of chunks(rows, 30)) {
      let tr;
      try { tr = await translate(batch.map(r => r.dataset.t), 'en-de'); } catch (e) { return; }
      if (tok !== renderToken) return;
      batch.forEach((r, i) => {
        r.dataset.trd = '1';
        const de = tr[i];
        if (de && norm(de) !== norm(r.dataset.t)) { const el = $('.de', r); if (el) el.textContent = de; }
      });
    }
  }

  function bindCommon() {
    $$('img[data-fb]', view).forEach(img => {
      img.addEventListener('error', () => { const p = img.parentNode; if (p) p.textContent = img.dataset.fb; }, { once: true });
    });
  }

  /* Ein zentraler Klick-Verteiler für data-act-Knöpfe */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'back') { e.preventDefault(); goBack(); }
    else if (act === 'retry') { e.preventDefault(); route(); }
    else if (act === 'verify') {
      e.preventDefault(); needsRetry = true;
      if (hasAndroid) window.Android.openVerification(); else window.open(WIKI, '_blank');
    }
    else if (act === 'ext') { e.preventDefault(); openExternal(a.dataset.url); }
    else if (act === 'go') { e.preventDefault(); location.hash = a.dataset.href; }
  });

  function openExternal(url) {
    if (hasAndroid) window.Android.openExternal(url); else window.open(url, '_blank');
  }

  /* ------------------------------------------------------------ Startseite */
  async function viewHome(tok) {
    const nFav = favs().length;
    const nDone = Object.keys(doneQuests()).length;
    const hist = store.get('history', []).slice(0, 12);
    view.innerHTML = `
      <div class="hero fade-in">
        <div class="hero-top">
          <div><div class="logo">Dreamlight<br><span>Guide</span></div>
          <p>Dein Nachschlagewerk für Disney Dreamlight Valley – mit allen Add-ons.</p></div>
          <div class="mascot bob" id="funkel">${M.funkel(96)}</div>
        </div>
        <div class="bubble" id="tip">💬 ${esc(M.tips[Math.floor(Math.random() * M.tips.length)])}</div>
        <div class="searchbox" data-act="go" data-href="#/search"><span>🔍</span><input placeholder="Figur, Mission, Gegenstand …" readonly tabindex="-1"></div>
        <div class="stats">
          <a class="stat" href="#/saved"><b>${nFav}</b><span>gemerkt</span></a>
          <a class="stat" href="#/quests"><b>${nDone}</b><span>Missionen erledigt</span></a>
          <a class="stat" href="#/saved?t=hist"><b>${store.get('history', []).length}</b><span>angesehen</span></a>
        </div>
      </div>
      <div class="scene">${M.heroScene()}<span class="s1">${M.mumi(46)}</span><span class="s2">${M.sproessi(44)}</span><span class="s3">${M.wolki(58)}</span></div>
      ${hist.length ? `<div class="section"><div class="section-title">Zuletzt angesehen</div><div class="hscroll">${hist.map(h => `<a class="chip" href="${pageHref(h.title)}">${kindByKey(h.kind).e} ${esc(h.title)}</a>`).join('')}</div></div>` : ''}
      <div class="section">
        <div class="section-title">Themen <small>alles von A bis Z</small></div>
        <div class="tiles">${D.topics.map((t, i) => `<a class="tile c${i % 6}" href="#/topic/${t.id}"><span class="e">${t.emoji}</span><span class="l">${esc(t.label)}</span></a>`).join('')}</div>
      </div>
      <div class="section">
        <div class="section-title">Hauptspiel &amp; Add-ons</div>
        <div class="dlcs">${D.dlcs.map(d => `<a class="dlc" href="#/dlc/${d.id}" style="background:linear-gradient(135deg, ${d.color[0]}, ${d.color[1]})">
            <span class="e">${d.emoji}</span><div><h3>${esc(d.name)}</h3><div class="s">${esc(d.sub)}</div></div><span class="tag">${esc(d.type)}</span></a>`).join('')}</div>
      </div>
      <div class="licence">Inoffizielle Fan-App, nicht mit Disney oder Gameloft verbunden. Inhalte live aus dem
        <a href="" data-act="ext" data-url="${WIKI}">Dreamlight Valley Wiki</a> (CC BY-NC-SA 4.0). Maskottchen Funkel, Mumi, Wolki &amp; Sprössi © marween</div>`;
    let ti = 0;
    const tip = $('#tip');
    const nextTip = () => { ti = (ti + 1 + Math.floor(Math.random() * (M.tips.length - 1))) % M.tips.length; tip.classList.remove('pop'); void tip.offsetWidth; tip.textContent = '💬 ' + M.tips[ti]; tip.classList.add('pop'); };
    tip.addEventListener('click', nextTip);
    $('#funkel').addEventListener('click', () => { $('#funkel').classList.remove('hop'); void $('#funkel').offsetWidth; $('#funkel').classList.add('hop'); nextTip(); });
  }

  /* ------------------------------------------------------------ Suche */
  let searchSeq = 0;
  let searchFilter = 'all';
  const searchMem = new Map();

  function cleanSnippet(s) {
    return String(s || '')
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\{\{[^}]*\}\}?/g, ' ').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
      .replace(/\S+\.(png|jpe?g|gif|webp|svg)\b/gi, ' ').replace(/\|\s*[a-z_ ]+\s*=/gi, ' ').replace(/[{}|=\[\]]+/g, ' ').replace(/'''?/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  async function searchWiki(s) {
    const [pre, full] = await Promise.all([
      api({ action: 'query', list: 'prefixsearch', pssearch: s, pslimit: '12', psnamespace: '0' }, 3600).catch(() => null),
      api({ action: 'query', list: 'search', srsearch: s, srnamespace: '0', srlimit: '40', srprop: 'snippet' }, 3600)
    ]);
    const items = [];
    ((pre && pre.query && pre.query.prefixsearch) || []).forEach(p => items.push({ title: p.title, snippet: '' }));
    ((full.query && full.query.search) || []).forEach(h => {
      const sn = cleanSnippet(h.snippet);
      items.push({ title: h.title, snippet: /^#?redirect/i.test(sn) ? '' : sn });
    });
    items.__offline = full.__offline;
    return items;
  }

  async function runSearch(q, box, tok) {
    const my = ++searchSeq;
    q = q.trim();
    if (!q) {
      box.innerHTML = emptyHtml('funkel', `Wonach suchst du?<br>Figuren, Missionen, Gegenstände, Rezepte, Kritter, Orte …<br><br>
        <span class="small">Deutsch oder Englisch – z. B. „Vaiana“, „Lieblingsgeschenke Goofy“, „Apfelkuchen“, „Night Thorns“</span>`);
      return;
    }
    if (searchMem.has(q)) { renderResults(searchMem.get(q), box, tok); return; }
    box.innerHTML = spinner();

    const queries = [q];
    const g = glossaryTranslate(q);
    if (g && norm(g) !== norm(q)) queries.push(g);
    if (settings.deSearch && modelReady && q.length >= 3) {
      try {
        const [t] = await translate([q], 'de-en');
        if (t && !queries.some(x => norm(x) === norm(t))) queries.push(t);
      } catch (e) { /* egal */ }
    }
    if (my !== searchSeq || tok !== renderToken) return;

    const lists = await Promise.all(queries.map(s => searchWiki(s).catch(err => ({ err }))));
    if (my !== searchSeq || tok !== renderToken) return;
    const errs = lists.filter(l => l.err);
    if (errs.length === lists.length) { box.innerHTML = errorHtml(errs[0].err); return; }

    // zusammenführen: Titeltreffer zuerst
    const seen = new Set(); let merged = [];
    const offline = lists.some(l => l.__offline);
    lists.filter(l => !l.err).forEach(l => l.forEach(it => {
      if (!seen.has(it.title)) { seen.add(it.title); merged.push(it); }
      else if (it.snippet) { const ex = merged.find(m => m.title === it.title); if (ex && !ex.snippet) ex.snippet = it.snippet; }
    }));
    const qs = queries.map(norm);
    merged.forEach((it, i) => {
      const n = norm(it.title);
      it.score = (qs.includes(n) ? 1000 : 0) + (qs.some(x => n.startsWith(x)) ? 200 : 0) + (qs.some(x => n.includes(x)) ? 100 : 0) - i;
    });
    merged.sort((a, b) => b.score - a.score);
    merged = merged.slice(0, 60);

    const meta = await getMeta(merged.map(m => m.title));
    if (my !== searchSeq || tok !== renderToken) return;
    const final = []; const seen2 = new Set();
    merged.forEach(it => {
      const m = meta[it.title];
      const title = m ? m.title : it.title;
      if (m && m.missing) return;
      if (seen2.has(title)) return;
      seen2.add(title);
      final.push({ title, snippet: it.snippet, thumb: m && m.thumb, kind: kindOf(m ? m.cats : []), done: !!doneQuests()[title] });
    });
    final.__offline = offline;
    final.__queries = queries;
    searchMem.set(q, final);
    renderResults(final, box, tok);
  }

  function renderResults(items, box, tok) {
    const counts = {};
    FILTERS.forEach(f => { counts[f.id] = f.ks ? items.filter(it => f.ks.includes(it.kind.k)).length : items.length; });
    if (searchFilter !== 'all' && !counts[searchFilter]) searchFilter = 'all';
    const f = FILTERS.find(x => x.id === searchFilter);
    const shown = f.ks ? items.filter(it => f.ks.includes(it.kind.k)) : items;
    const extraQ = (items.__queries || []).slice(1);
    box.innerHTML =
      (items.__offline ? offlineNote() : '') +
      `<div class="pad" style="padding-bottom:4px"><div class="hscroll">${FILTERS.filter(x => counts[x.id]).map(x =>
        `<button class="chip ${x.id === searchFilter ? 'on' : ''}" data-f="${x.id}">${x.label} <small>${counts[x.id]}</small></button>`).join('')}</div>
        ${extraQ.length ? `<div class="small muted" style="margin-top:8px">Auch gesucht: ${extraQ.map(x => '„' + esc(x) + '“').join(', ')}</div>` : ''}</div>` +
      (shown.length
        ? `<div class="pad list">${shown.map(rowHtml).join('')}</div>`
        : emptyHtml('wolki', `Hier ist nichts …<br><span class="small">Versuch es mit dem englischen Namen aus dem Spiel.</span>`));
    $$('[data-f]', box).forEach(b => b.addEventListener('click', () => { searchFilter = b.dataset.f; renderResults(items, box, tok); }));
    bindCommon();
    translateTitles(box, tok);
  }

  async function viewSearch(tok, q) {
    view.innerHTML = `<header class="top"><button class="iconbtn" data-act="back" aria-label="Zurück">←</button>
      <div class="searchbox"><span>🔍</span><input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="Suchen …" value="${esc(q)}">
      <button class="clear" id="sqc" aria-label="Leeren">✕</button></div></header><div id="res"></div>`;
    const inp = $('#sq'), box = $('#res');
    let t = 0;
    const go = () => {
      const v = inp.value;
      history.replaceState(null, '', '#/search' + (v ? '?q=' + encodeURIComponent(v) : ''));
      curHash = location.hash;
      runSearch(v, box, tok);
    };
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(go, 450); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(t); inp.blur(); go(); } });
    $('#sqc').addEventListener('click', () => { inp.value = ''; inp.focus(); go(); });
    if (!q) setTimeout(() => inp.focus(), 60);
    await runSearch(q, box, tok);
    restoreScroll();
  }

  /* ------------------------------------------------------------ Wiki-HTML aufbereiten */
  function titleFromHref(href) {
    if (!href) return null;
    let h = href;
    if (h.startsWith(WIKI)) h = h.slice(WIKI.length);
    else if (h.startsWith('//dreamlightvalleywiki.com')) h = h.slice('//dreamlightvalleywiki.com'.length);
    else if (h.startsWith('https://www.dreamlightvalleywiki.com')) h = h.slice('https://www.dreamlightvalleywiki.com'.length);
    if (!h.startsWith('/')) return null;
    if (/^\/(images|resources|load\.php|api\.php|skins|extensions)\b/.test(h)) return null;
    let t;
    if (h.startsWith('/index.php')) {
      const qs = new URLSearchParams(h.split('?')[1] || '');
      t = qs.get('title');
      if (!t) return null;
    } else {
      t = h.slice(1).split('#')[0].split('?')[0];
      try { t = decodeURIComponent(t); } catch (e) { /* lassen */ }
    }
    return t.replace(/_/g, ' ');
  }

  function processWiki(html) {
    const doc = new DOMParser().parseFromString('<div id="wr">' + html + '</div>', 'text/html');
    const root = doc.getElementById('wr');
    $$('script,style,link,meta,noscript,.mw-editsection,.toc,#toc,.noprint,.mw-empty-elt,.printfooter,.catlinks', root).forEach(n => n.remove());

    // Bilder: absolute Adressen, verzögert laden
    $$('img', root).forEach(img => {
      const ds = img.getAttribute('data-src');
      const src = ds || img.getAttribute('src');
      if (src) img.setAttribute('src', absUrl(src));
      const ss = img.getAttribute('data-srcset') || img.getAttribute('srcset');
      if (ss) {
        img.setAttribute('srcset', ss.split(',').map(p => {
          const bits = p.trim().split(/\s+/);
          return absUrl(bits[0]) + (bits.length > 1 ? ' ' + bits.slice(1).join(' ') : '');
        }).join(', '));
      }
      img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('alt', '');
    });

    // Links umbiegen
    $$('a', root).forEach(a => {
      const href = a.getAttribute('href') || '';
      const t = titleFromHref(href);
      if (t !== null) {
        if (/^(File|Datei|Image):/i.test(t) || a.classList.contains('image') || a.classList.contains('mw-file-description')) {
          const span = doc.createElement('span');
          while (a.firstChild) span.appendChild(a.firstChild);
          a.replaceWith(span);
          return;
        }
        if (/^(Special|User|Talk|Template|Help|MediaWiki|Dreamlight Valley Wiki):/i.test(t)) {
          a.removeAttribute('href'); a.classList.add('dead'); return;
        }
        if (/^Category:/i.test(t)) a.setAttribute('href', catHref(t.replace(/^Category:/i, '')));
        else if (a.classList.contains('new')) a.setAttribute('href', '#/search?q=' + encodeURIComponent(t));
        else a.setAttribute('href', pageHref(t));
        a.removeAttribute('title');
      } else if (href.startsWith('#')) {
        a.setAttribute('data-anchor', href.slice(1));
        a.setAttribute('href', '');
      } else if (/^(https?:)?\/\//.test(href)) {
        a.classList.add('ext');
        a.setAttribute('data-ext', absUrl(href));
        a.setAttribute('href', '');
      }
    });

    // Navigationsboxen einklappen
    $$('table.navbox, div.navbox', root).forEach(nb => {
      if (nb.parentElement && nb.parentElement.closest('.navbox')) return;
      const det = doc.createElement('details'); det.className = 'navwrap';
      const sum = doc.createElement('summary'); sum.textContent = 'Weitere Einträge dieser Reihe';
      det.appendChild(sum);
      nb.parentNode.insertBefore(det, nb); det.appendChild(nb);
    });

    // Tabellen seitlich scrollbar
    $$('table', root).forEach(tb => {
      if (tb.parentElement && tb.parentElement.classList.contains('tablewrap')) return;
      if (tb.parentElement && tb.parentElement.closest('table')) return;
      const w = doc.createElement('div'); w.className = 'tablewrap';
      tb.parentNode.insertBefore(w, tb); w.appendChild(tb);
    });

    return root;
  }

  function headingOf(el) {
    if (!el || el.nodeType !== 1) return null;
    if (/^H[2-4]$/.test(el.tagName)) return { el, level: +el.tagName[1], h: el };
    if (el.classList.contains('mw-heading')) {
      const h = el.querySelector('h2,h3,h4');
      if (h) return { el, level: +h.tagName[1], h };
    }
    return null;
  }

  /* Missionsziele zum Abhaken vorbereiten */
  function makeChecklist(root) {
    const container = root.querySelector('.mw-parser-output') || root;
    const kids = Array.from(container.children);
    const wanted = [/^(objectives?|steps?|tasks?|requirements?|quest steps?)$/i, /^(walkthrough)$/i];
    for (const re of wanted) {
      for (let i = 0; i < kids.length; i++) {
        const hd = headingOf(kids[i]);
        if (!hd || !re.test(hd.h.textContent.trim())) continue;
        const lis = [];
        for (let j = i + 1; j < kids.length; j++) {
          const h2 = headingOf(kids[j]);
          if (h2 && h2.level <= hd.level) break;
          $$('li', kids[j]).forEach(li => lis.push(li));
          if (kids[j].tagName === 'LI') lis.push(kids[j]);
        }
        if (lis.length) {
          lis.forEach((li, n) => {
            const lbl = li.ownerDocument.createElement('span'); lbl.className = 'lbl';
            while (li.firstChild) lbl.appendChild(li.firstChild);
            const cb = li.ownerDocument.createElement('input'); cb.type = 'checkbox'; cb.setAttribute('data-i', n);
            li.appendChild(cb); li.appendChild(lbl); li.classList.add('chk');
          });
          return lis.length;
        }
      }
    }
    return 0;
  }

  /* Text-Knoten einsammeln (für die Übersetzung) */
  function textNodes(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || p.closest('script,style,code,pre,.notr')) return NodeFilter.FILTER_REJECT;
        const t = n.nodeValue.trim();
        if (t.length < 2 || !/[A-Za-z]{2}/.test(t)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const arr = []; while (w.nextNode()) arr.push(w.currentNode);
    return arr;
  }

  /* ------------------------------------------------------------ Detailseite */
  async function viewPage(tok, title) {
    view.innerHTML = topBar(title) + spinner();
    let d;
    try {
      d = await api({
        action: 'parse', page: title, prop: 'text|categories|displaytitle', redirects: '1',
        disableeditsection: '1', disabletoc: '1'
      }, 6 * 3600);
    } catch (e) {
      if (tok !== renderToken) return;
      if (e.code === 'missingtitle') {
        view.innerHTML = topBar(title) + emptyHtml('mumi', `„${esc(title)}“ gibt es im Wiki (noch) nicht.<br><br>
          <a class="btn" href="#/search?q=${encodeURIComponent(title)}">Danach suchen</a>`);
      } else {
        view.innerHTML = topBar(title) + errorHtml(e);
      }
      bindCommon();
      return;
    }
    if (tok !== renderToken) return;

    const P = d.parse;
    const realTitle = P.title || title;
    const cats = (P.categories || []).filter(c => !c.hidden).map(c => (c.category || c['*'] || '').replace(/_/g, ' ')).filter(Boolean);
    const kind = kindOf(cats);
    const isQuest = kind.k === 'quest';
    addHistory(realTitle, kind.k);

    const root = processWiki(P.text || '');
    const nChecks = isQuest ? makeChecklist(root) : 0;

    view.innerHTML =
      `<header class="top"><button class="iconbtn" data-act="back" aria-label="Zurück">←</button><h1 id="ptitle">${esc(realTitle)}</h1>
        <button class="iconbtn ${isFav(realTitle) ? 'on' : ''}" id="fav" aria-label="Merken">${isFav(realTitle) ? '⭐' : '☆'}</button>
        <button class="iconbtn" data-act="ext" data-url="${esc(WIKI + '/' + encodeURIComponent(realTitle.replace(/ /g, '_')))}" aria-label="Im Wiki öffnen">↗</button></header>` +
      (d.__offline ? offlineNote(d.__savedAt) : '') +
      `<div class="dhead fade-in"><span class="kind">${kind.e} ${esc(kind.label)}</span><h2 id="dtitle">${esc(realTitle)}</h2><div class="orig" id="dorig"></div></div>` +
      (isQuest ? `<div class="questbox" id="qbox"></div>` : '') +
      `<div class="jump" id="jump"></div><div id="trslot"></div>` +
      `<article class="wiki" id="wiki"></article>` +
      `<div class="section rel" id="rel"><div class="section-title">Zusammenhänge</div>
        <div class="card"><div class="muted small">Welche Figuren, Missionen, Rezepte und Orte verweisen auf „${esc(realTitle)}“?</div>
        <div class="btns"><button class="btn small" id="relbtn">🔗 Wo kommt das vor?</button></div><div id="relbox"></div></div></div>` +
      (cats.length ? `<div class="section"><div class="section-title">Kategorien</div><div class="chips">${cats.map(c => `<a class="chip" href="${catHref(c)}">${esc(c)}</a>`).join('')}</div></div>` : '') +
      `<div class="licence">Quelle: <a href="" data-act="ext" data-url="${esc(WIKI + '/' + encodeURIComponent(realTitle.replace(/ /g, '_')))}">Dreamlight Valley Wiki – ${esc(realTitle)}</a>, CC BY-NC-SA 4.0. Spielinhalte © Disney/Gameloft.${settings.autoTr ? ' Deutsche Fassung maschinell übersetzt.' : ''}</div>`;

    const wiki = $('#wiki');
    while (root.firstChild) wiki.appendChild(root.firstChild);

    // Bilder ohne Ladeerfolg ausblenden
    $$('img', wiki).forEach(img => img.addEventListener('error', () => { img.style.display = 'none'; }, { once: true }));

    // Links innerhalb des Inhalts
    wiki.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;
      if (a.dataset.ext) { e.preventDefault(); openExternal(a.dataset.ext); return; }
      if (a.dataset.anchor !== undefined) {
        e.preventDefault();
        const id = a.dataset.anchor;
        const el = document.getElementById(id) || $$('[id]', wiki).find(x => x.id === id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (a.classList.contains('dead')) e.preventDefault();
    });

    $('#fav').addEventListener('click', () => {
      toggleFav(realTitle, kind.k);
      const on = isFav(realTitle);
      $('#fav').textContent = on ? '⭐' : '☆'; $('#fav').classList.toggle('on', on);
    });

    buildJump(wiki);
    if (isQuest) setupQuest(realTitle, nChecks, wiki);
    $('#relbtn').addEventListener('click', () => loadRelations(realTitle, $('#relbox'), tok));

    restoreScroll();
    startPageTranslation(tok, realTitle, wiki);
  }

  function buildJump(wiki) {
    const hs = $$('h2', wiki).filter(h => h.id && h.textContent.trim());
    const box = $('#jump');
    if (!box) return;
    if (hs.length < 2) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="hscroll">${hs.map((h, i) => `<button class="chip" data-j="${i}">${esc(h.textContent.trim())}</button>`).join('')}</div>`;
    $$('[data-j]', box).forEach(b => b.addEventListener('click', () => hs[+b.dataset.j].scrollIntoView({ behavior: 'smooth', block: 'start' })));
  }

  function setupQuest(title, nChecks, wiki) {
    const box = $('#qbox');
    const cbs = $$('li.chk > input', wiki);
    const render = () => {
      const done = !!doneQuests()[title];
      const n = cbs.filter(c => c.checked).length;
      const pct = nChecks ? Math.round(n * 100 / nChecks) : (done ? 100 : 0);
      box.innerHTML = `<div class="qh"><span>${done ? '🏆 Mission erledigt' : '🧭 Dein Fortschritt'}</span>
          <button class="btn small ${done ? 'done' : ''}" id="qdone">${done ? '✔ Erledigt' : 'Als erledigt markieren'}</button></div>
        <div class="progress"><i style="width:${done ? 100 : pct}%"></i></div>
        <div class="small muted" style="margin-top:6px">${nChecks ? `${n} von ${nChecks} Schritten abgehakt – hake die Ziele unten im Text ab.` : 'Diese Seite hat keine Ziel-Liste – du kannst die Mission trotzdem als erledigt markieren.'}</div>`;
      $('#qdone').addEventListener('click', () => {
        const on = !doneQuests()[title];
        setDone(title, on);
        if (on) { cbs.forEach(c => { c.checked = true; c.closest('li').classList.add('ok'); }); setChecks(title, cbs.map((c, i) => i)); celebrate('Mission erledigt!'); }
        render();
      });
    };
    const saved = checks(title);
    cbs.forEach((c, i) => {
      c.checked = saved.includes(i) || !!doneQuests()[title];
      c.closest('li').classList.toggle('ok', c.checked);
      c.addEventListener('change', () => {
        c.closest('li').classList.toggle('ok', c.checked);
        const arr = cbs.map((x, j) => (x.checked ? j : -1)).filter(j => j >= 0);
        setChecks(title, arr);
        if (arr.length === cbs.length && !doneQuests()[title]) { setDone(title, true); celebrate('Alle Schritte geschafft!'); }
        else if (arr.length < cbs.length && doneQuests()[title]) setDone(title, false);
        render();
      });
    });
    render();
  }

  /* Übersetzung der Detailseite */
  async function startPageTranslation(tok, title, wiki) {
    const slot = $('#trslot');
    if (!slot) return;
    if (!settings.autoTr) {
      slot.innerHTML = `<div class="trbar">🇬🇧 Originaltext <span style="flex:1"></span><button id="trgo">Auf Deutsch</button></div>`;
      $('#trgo').addEventListener('click', () => { settings.autoTr = true; saveSettings(); startPageTranslation(tok, title, wiki); });
      return;
    }
    if (!modelReady) {
      if (modelBusy) {
        slot.innerHTML = `<div class="trbar">⏳ Sprachpaket wird geladen …</div>`;
        while (modelBusy) { await sleep(500); if (tok !== renderToken) return; }
        return startPageTranslation(tok, title, wiki);
      }
      slot.innerHTML = `<div class="note warn"><span>🇩🇪</span><div><b>Auf Deutsch lesen?</b><br>Für die Übersetzung wird einmalig ein Sprachpaket (ca. 30 MB) aufs Handy geladen – danach klappt es auch offline.
        <div class="btns"><button class="btn small" id="mdl">Sprachpaket laden</button><button class="btn small ghost" id="mno">Englisch lassen</button></div></div></div>`;
      $('#mdl').addEventListener('click', async () => {
        slot.innerHTML = `<div class="trbar">⏳ Sprachpaket wird geladen … (kann eine Minute dauern)</div>`;
        const ok = await downloadModel();
        if (tok !== renderToken) return;
        if (ok) startPageTranslation(tok, title, wiki);
        else slot.innerHTML = errorHtml(new Error('Sprachpaket konnte nicht geladen werden.'));
      });
      $('#mno').addEventListener('click', () => { settings.autoTr = false; saveSettings(); startPageTranslation(tok, title, wiki); });
      return;
    }

    const units = collectUnits(wiki);
    let showDe = true, done = 0;
    slot.innerHTML = `<div class="trbar"><span id="trl">🇩🇪 Übersetze …</span><div class="progress"><i id="trp"></i></div><button id="trt">Original</button></div>`;
    $('#trt').addEventListener('click', () => {
      showDe = !showDe;
      units.forEach(u => applyUnit(u, showDe));
      $('#dtitle').textContent = showDe && $('#dtitle').dataset.de ? $('#dtitle').dataset.de : title;
      $('#dorig').textContent = showDe && $('#dtitle').dataset.de ? title : '';
      $('#trt').textContent = showDe ? 'Original' : 'Deutsch';
      buildJump(wiki);
    });

    // Titel
    translate([title]).then(([t]) => {
      if (tok !== renderToken || !t || norm(t) === norm(title)) return;
      $('#dtitle').dataset.de = t;
      if (showDe) { $('#dtitle').textContent = t; $('#dorig').textContent = title; }
    }).catch(() => {});

    for (const batch of chunks(units, 18)) {
      // alle Texte eines Pakets: Sätze/Zellen + Link-Texte
      const texts = [];
      batch.forEach(u => {
        if (u.type === 'node') texts.push(u.text);
        else u.segs.forEach(sg => { texts.push(sg.text); sg.links.forEach(l => texts.push(l.en)); });
      });
      let tr;
      try { tr = await translate(texts, 'en-de'); } catch (e) {
        if (tok === renderToken) $('#trl').textContent = '⚠️ Übersetzung unterbrochen';
        return;
      }
      if (tok !== renderToken) return;
      let k = 0;
      batch.forEach(u => {
        if (u.type === 'node') { const v = u.n.nodeValue; u.de = v.match(/^\s*/)[0] + tr[k++] + v.match(/\s*$/)[0]; }
        else {
          u.segs.forEach(sg => { sg.de = tr[k++]; sg.links.forEach(l => { l.de = tr[k++]; }); });
          u.deNodes = buildBlockDe(u);
        }
        if (showDe) applyUnit(u, true);
      });
      done += batch.length;
      const p = $('#trp'); if (p) p.style.width = Math.round(done * 100 / units.length) + '%';
    }
    if (tok !== renderToken) return;
    $('#trl').textContent = '🇩🇪 Maschinell übersetzt';
    buildJump(wiki);
  }

  /* --- Übersetzung ganzer Sätze/Zellen, Links werden wieder eingesetzt --- */
  const BLOCK_SEL = 'p,li,td,th,dd,dt,h2,h3,h4,h5,caption,figcaption,blockquote,summary,span.lbl,.thumbcaption,.gallerytext';
  const CONTAINER_SEL = 'p,li,td,th,dd,dt,h2,h3,h4,h5,caption,figcaption,blockquote,table,ul,ol,dl,div,details,span.lbl';
  const hasLetters = t => /[A-Za-z]{2}/.test(t);

  function collectUnits(wiki) {
    const units = [];
    const blocks = $$(BLOCK_SEL, wiki).filter(el => !el.matches('li.chk') && !el.closest('.notr') && !el.querySelector(CONTAINER_SEL));
    const inBlock = new Set();
    blocks.forEach(el => {
      inBlock.add(el);
      const segs = [];
      let cur = { nodes: [] };
      Array.from(el.childNodes).forEach(n => {
        if (n.nodeName === 'BR') { segs.push(cur); cur = { nodes: [], br: true }; }
        else cur.nodes.push(n);
      });
      segs.push(cur);
      let any = false;
      segs.forEach(sg => {
        sg.text = sg.nodes.map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
        sg.links = [];
        sg.nodes.forEach(n => {
          if (n.nodeType !== 1) return;
          const as = n.matches('a') ? [n] : $$('a', n);
          as.forEach(a => { const t = a.textContent.replace(/\s+/g, ' ').trim(); if (t && hasLetters(t)) sg.links.push({ a, en: t }); });
        });
        sg.media = sg.nodes.filter(n => n.nodeType === 1 && !n.textContent.trim());
        sg.mediaFirst = sg.nodes.findIndex(n => n.nodeType === 1 && !n.textContent.trim()) <
          Math.max(0, sg.nodes.findIndex(n => n.textContent.trim()));
        sg.bold = sg.nodes.length === 1 && sg.nodes[0].nodeType === 1 && /^(B|STRONG)$/.test(sg.nodes[0].nodeName);
        if (sg.text && hasLetters(sg.text)) any = true;
      });
      if (!any) return;
      units.push({ type: 'block', el, segs, enNodes: Array.from(el.childNodes) });
    });
    // übrige lose Texte (außerhalb erkannter Blöcke)
    textNodes(wiki).forEach(n => {
      let p = n.parentElement, skip = false;
      while (p && p !== wiki) { if (inBlock.has(p)) { skip = true; break; } p = p.parentElement; }
      if (!skip) units.push({ type: 'node', n, en: n.nodeValue, text: n.nodeValue.trim() });
    });
    return units;
  }

  function buildBlockDe(u) {
    const out = [];
    u.segs.forEach((sg, si) => {
      if (si > 0 && sg.br) out.push(document.createElement('br'));
      if (!sg.text || !hasLetters(sg.text)) { sg.nodes.forEach(n => out.push(n.cloneNode(true))); return; }
      const media = sg.media.map(m => m.cloneNode(true));
      if (sg.mediaFirst) media.forEach(m => { out.push(m); out.push(document.createTextNode(' ')); });
      // Text in Stücke teilen und Links an passender Stelle einsetzen
      let pieces = [{ t: sg.de || sg.text }];
      const extras = [];
      sg.links.forEach(l => {
        const cands = [l.de, l.en].filter(Boolean);
        let placed = false;
        for (const c of cands) {
          for (let i = 0; i < pieces.length && !placed; i++) {
            const pc = pieces[i]; if (pc.a) continue;
            const at = pc.t.toLowerCase().indexOf(c.toLowerCase());
            if (at < 0) continue;
            pieces.splice(i, 1, { t: pc.t.slice(0, at) }, { a: l.a, t: pc.t.slice(at, at + c.length) }, { t: pc.t.slice(at + c.length) });
            placed = true;
          }
          if (placed) break;
        }
        if (!placed) extras.push(l);
      });
      const wrap = sg.bold ? document.createElement('b') : null;
      const target = [];
      pieces.forEach(pc => {
        if (!pc.t) return;
        if (pc.a) { const a = pc.a.cloneNode(false); a.textContent = pc.t; target.push(a); }
        else target.push(document.createTextNode(pc.t));
      });
      extras.forEach(l => {
        target.push(document.createTextNode(' '));
        const sp = document.createElement('span'); sp.className = 'xlink';
        const a = l.a.cloneNode(false); a.textContent = l.de || l.en;
        sp.appendChild(document.createTextNode('→ ')); sp.appendChild(a);
        target.push(sp);
      });
      if (wrap) { target.forEach(n => wrap.appendChild(n)); out.push(wrap); } else target.forEach(n => out.push(n));
      if (!sg.mediaFirst) media.forEach(m => { out.push(document.createTextNode(' ')); out.push(m); });
    });
    return out;
  }

  function applyUnit(u, de) {
    if (u.type === 'node') { if (de) { if (u.de != null) u.n.nodeValue = u.de; } else u.n.nodeValue = u.en; return; }
    if (de) { if (u.deNodes) u.el.replaceChildren(...u.deNodes); }
    else u.el.replaceChildren(...u.enNodes);
  }

  /* „Wo kommt das vor?“ – Rückverweise gruppiert nach Art */
  const OVERVIEW = new Set([].concat(...D.topics.map(t => t.pages), ['Dreamlight Valley Wiki', 'Main Page']));
  async function loadRelations(title, box, tok) {
    $('#relbtn').disabled = true;
    box.innerHTML = spinner();
    let pages;
    try {
      pages = await apiPages({
        action: 'query', generator: 'backlinks', gbltitle: title, gblnamespace: '0', gbllimit: '250',
        gblfilterredir: 'nonredirects', prop: 'categories|pageimages', clshow: '!hidden', cllimit: 'max',
        piprop: 'thumbnail', pithumbsize: '64', pilimit: 'max'
      }, 86400, 5);
    } catch (e) {
      if (tok === renderToken) { box.innerHTML = errorHtml(e); $('#relbtn').disabled = false; }
      return;
    }
    if (tok !== renderToken) return;
    const groups = {};
    pages.filter(p => !OVERVIEW.has(p.title) && p.title !== title).forEach(p => {
      const k = kindOf((p.categories || []).map(c => c.title.replace(/^Category:/, '')));
      (groups[k.k] = groups[k.k] || { kind: k, items: [] }).items.push(p);
    });
    const order = ['char', 'quest', 'meal', 'ing', 'critter', 'fish', 'gem', 'mat', 'furn', 'cloth', 'tool', 'place', 'realm', 'event', 'other'];
    const names = { char: 'Figuren', quest: 'Missionen', meal: 'Rezepte', ing: 'Zutaten', critter: 'Kritter', fish: 'Fische', gem: 'Edelsteine', mat: 'Materialien', furn: 'Möbel', cloth: 'Kleidung', tool: 'Werkzeuge', place: 'Orte', realm: 'Reiche', event: 'Events', other: 'Sonstiges' };
    const html = order.filter(k => groups[k]).map(k => {
      const g = groups[k];
      g.items.sort((a, b) => a.title.localeCompare(b.title));
      return `<div class="grp"><h4>${g.kind.e} ${names[k]} (${g.items.length})</h4><div class="chips">${g.items.map(p =>
        `<a class="chip" href="${pageHref(p.title)}">${p.thumbnail ? `<img src="${esc(absUrl(p.thumbnail.source))}" alt="" loading="lazy">` : ''}${esc(p.title)}</a>`).join('')}</div></div>`;
    }).join('');
    box.innerHTML = html || '<div class="muted small" style="margin-top:10px">Keine Verweise gefunden.</div>';
    $$('img', box).forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
  }

  /* ------------------------------------------------------------ Kategorien */
  const catMem = new Map();
  async function loadCategory(name) {
    if (catMem.has(name)) return catMem.get(name);
    const pages = [], subs = [];
    let cont = {}, offline = false;
    for (let i = 0; i < 8; i++) {
      const d = await api(Object.assign({
        action: 'query', list: 'categorymembers', cmtitle: 'Category:' + name, cmlimit: '500', cmtype: 'page|subcat', cmprop: 'title|type'
      }, cont), 6 * 3600);
      offline = offline || d.__offline;
      ((d.query && d.query.categorymembers) || []).forEach(m => {
        if (m.ns === 14 || m.type === 'subcat') subs.push(m.title.replace(/^Category:/, ''));
        else if (m.ns === 0) pages.push(m.title);
      });
      if (!d.continue) break;
      cont = Object.assign({}, d.continue);
    }
    pages.sort((a, b) => a.localeCompare(b));
    subs.sort((a, b) => a.localeCompare(b));
    const r = { pages, subs, offline };
    catMem.set(name, r);
    return r;
  }

  function renderCategoryList(box, data, tok, catName) {
    const kind = kindOf([catName]);
    const firstLetter = t => { const c = t[0].toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };
    const letters = Array.from(new Set(data.pages.map(firstLetter)));
    const big = data.pages.length > 80;
    let cur = big ? letters[0] : null;
    const draw = () => {
      const list = cur ? data.pages.filter(t => firstLetter(t) === cur) : data.pages;
      const done = doneQuests();
      $('#clist', box).innerHTML = list.length
        ? list.map(t => rowHtml({ title: t, kind, done: !!done[t] })).join('')
        : '<div class="empty">Keine Einträge.</div>';
      if (big) $$('.letters button', box).forEach(b => b.classList.toggle('on', b.dataset.l === cur));
      enhanceRows($('#clist', box), tok);
    };
    box.innerHTML =
      (data.offline ? offlineNote() : '') +
      (data.subs.length ? `<div class="pad" style="padding-bottom:0"><div class="small muted" style="margin-bottom:6px">Unterkategorien</div><div class="hscroll">${data.subs.map(s => `<a class="chip" href="${catHref(s)}">📂 ${esc(s)}</a>`).join('')}</div></div>` : '') +
      `<div class="pad" style="padding-bottom:0"><div class="small muted">${data.pages.length} Einträge</div>` +
      (big ? `<div class="letters">${letters.map(l => `<button data-l="${l}">${l}</button>`).join('')}<button data-l="">Alle</button></div>` : '') + `</div>` +
      `<div class="pad list" id="clist"></div>`;
    $$('.letters button', box).forEach(b => b.addEventListener('click', () => { cur = b.dataset.l || null; draw(); }));
    draw();
  }

  /* Vorschaubilder + Art nachladen (sichtbare Zeilen) */
  async function enhanceRows(container, tok) {
    const rows = $$('.row[data-t]', container).slice(0, 150);
    const meta = await getMeta(rows.map(r => r.dataset.t));
    if (tok !== renderToken) return;
    rows.forEach(r => {
      const m = meta[r.dataset.t]; if (!m) return;
      const k = kindOf(m.cats);
      if (k !== KIND_DEFAULT) $('.k', r).textContent = k.label;
      if (m.thumb) { const th = $('.thumb', r); th.innerHTML = `<img loading="lazy" src="${esc(m.thumb)}" alt="" data-fb="${esc(k.e)}">`; }
    });
    bindCommon();
    translateTitles(container, tok);
  }

  async function viewCategory(tok, name) {
    view.innerHTML = topBar(name) + spinner();
    let data;
    try { data = await loadCategory(name); } catch (e) {
      if (tok === renderToken) { view.innerHTML = topBar(name) + errorHtml(e); bindCommon(); }
      return;
    }
    if (tok !== renderToken) return;
    view.innerHTML = topBar(name) + '<div id="cbox"></div>';
    renderCategoryList($('#cbox'), data, tok, name);
    restoreScroll();
  }

  /* ------------------------------------------------------------ Themen */
  async function resolveCandidates(cats, pages) {
    const key = 'res:' + cats.join(',') + '|' + pages.join(',');
    const cached = store.get(key, null);
    if (cached && Date.now() - cached.ts < 3 * 86400e3) return cached;
    const titles = cats.map(c => 'Category:' + c).concat(pages);
    if (!titles.length) return { cat: null, page: null };
    const d = await api({ action: 'query', titles: titles.join('|'), redirects: '1', prop: 'categoryinfo' }, 3 * 86400);
    const redir = {};
    ((d.query && d.query.normalized) || []).forEach(n => { redir[n.from] = n.to; });
    ((d.query && d.query.redirects) || []).forEach(n => { redir[n.from] = n.to; });
    const byTitle = {};
    ((d.query && d.query.pages) || []).forEach(p => { byTitle[p.title] = p; });
    const look = t => { let x = redir[t] || t; x = redir[x] || x; return byTitle[x]; };
    let cat = null, page = null;
    for (const c of cats) {
      const p = look('Category:' + c);
      if (p && p.categoryinfo && (p.categoryinfo.pages > 0 || p.categoryinfo.subcats > 0)) { cat = p.title.replace(/^Category:/, ''); break; }
    }
    for (const t of pages) {
      const p = look(t);
      if (p && !p.missing && !p.invalid) { page = p.title; break; }
    }
    const res = { cat, page, ts: Date.now() };
    store.set(key, res);
    return res;
  }

  async function viewTopic(tok, id) {
    const t = D.topics.find(x => x.id === id);
    if (!t) { location.replace('#/'); return; }
    view.innerHTML = topBar(t.emoji + ' ' + t.label) + spinner();
    let res;
    try { res = await resolveCandidates(t.cats, t.pages); } catch (e) {
      if (tok === renderToken) { view.innerHTML = topBar(t.label) + errorHtml(e); bindCommon(); }
      return;
    }
    if (tok !== renderToken) return;
    if (!res.cat && !res.page) { location.replace('#/search?q=' + encodeURIComponent(t.q)); return; }
    view.innerHTML = topBar(t.emoji + ' ' + t.label) +
      `<div class="pad"><div class="card"><div class="muted">${esc(t.hint)}</div>
        <div class="btns">${res.page ? `<a class="btn small" href="${pageHref(res.page)}">📖 Übersicht „${esc(res.page)}“ lesen</a>` : ''}
        <a class="btn small ghost" href="#/search?q=${encodeURIComponent(t.q)}">🔍 Suche</a></div></div></div>` +
      (res.cat ? `<div id="cbox">${spinner()}</div>` : '');
    if (res.cat) {
      try {
        const data = await loadCategory(res.cat);
        if (tok !== renderToken) return;
        renderCategoryList($('#cbox'), data, tok, res.cat);
      } catch (e) { if (tok === renderToken) $('#cbox').innerHTML = errorHtml(e); }
    }
    restoreScroll();
  }

  /* ------------------------------------------------------------ Erweiterungen */
  async function viewDlc(tok, id) {
    const d = D.dlcs.find(x => x.id === id);
    if (!d) { location.replace('#/'); return; }
    const chip = t => `<a class="chip" href="${pageHref(t)}" data-t="${esc(t)}">${esc(t)}</a>`;
    view.innerHTML = topBar(d.name) +
      `<div class="pad fade-in"><div class="dlc" style="background:linear-gradient(135deg, ${d.color[0]}, ${d.color[1]})">
         <span class="e">${d.emoji}</span><div><h3>${esc(d.name)}</h3><div class="s">${esc(d.date)}</div></div><span class="tag">${esc(d.type)}</span></div>
       ${d.note ? `<div class="note warn" style="margin:10px 0 0"><span>🆕</span><div>${esc(d.note)}</div></div>` : ''}
       <div class="card" style="margin-top:12px"><p style="margin:0">${esc(d.text)}</p></div>
       <div class="card"><h3>Das ist drin</h3><ul style="margin:0;padding-left:20px">${d.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
       ${d.chars.length ? `<div class="card"><h3>Neue Figuren</h3><div class="chips" id="dchars">${d.chars.map(chip).join('')}</div></div>` : ''}
       ${d.allChars ? `<div class="card"><h3>Figuren</h3><div class="muted small">Im Hauptspiel leben Dutzende Figuren – und mit jedem kostenlosen Update kommen neue dazu.</div><div class="btns"><a class="btn small" href="#/topic/figuren">Alle Figuren anzeigen</a></div></div>` : ''}
       <div class="card"><h3>Gebiete</h3><div class="chips">${d.biomes.map(chip).join('')}</div></div>
       <div class="btns" id="dbtns"><a class="btn small ghost" href="#/search?q=${encodeURIComponent(d.name)}">🔍 Alles zu „${esc(d.name)}“</a></div>
       <div class="small muted" style="margin-top:12px">Tipp: Tippe auf eine Figur oder ein Gebiet für alle Details aus dem Wiki.</div></div>`;
    // Bilder der Figuren nachladen
    if (d.chars.length) {
      getMeta(d.chars).then(meta => {
        if (tok !== renderToken) return;
        $$('#dchars .chip').forEach(c => {
          const m = meta[c.dataset.t];
          if (m && m.thumb) c.insertAdjacentHTML('afterbegin', `<img src="${esc(m.thumb)}" alt="" loading="lazy">`);
          if (m && m.title !== c.dataset.t) c.setAttribute('href', pageHref(m.title));
        });
        $$('#dchars img').forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
      }).catch(() => {});
    }
    resolveCandidates([], d.pages).then(res => {
      if (tok !== renderToken || !res.page) return;
      $('#dbtns').insertAdjacentHTML('afterbegin', `<a class="btn small" href="${pageHref(res.page)}">📖 Wiki-Artikel lesen</a>`);
    }).catch(() => {});
  }

  /* ------------------------------------------------------------ Merkliste & Verlauf */
  function viewSaved(tok, tab) {
    const list = tab === 'hist' ? store.get('history', []) : favs();
    const done = doneQuests();
    view.innerHTML = `<header class="top"><h1>${tab === 'hist' ? '🕘 Verlauf' : '⭐ Merkliste'}</h1></header>
      <div class="pad" style="padding-bottom:0"><div class="chips">
        <a class="chip ${tab !== 'hist' ? 'on' : ''}" href="#/saved">⭐ Merkliste</a>
        <a class="chip ${tab === 'hist' ? 'on' : ''}" href="#/saved?t=hist">🕘 Verlauf</a></div></div>` +
      (list.length
        ? `<div class="pad list" id="slist">${list.map(x => rowHtml({ title: x.title, kind: kindByKey(x.kind), done: !!done[x.title] })).join('')}</div>` +
          (tab === 'hist' ? `<div class="pad"><button class="btn ghost small" id="hclear">Verlauf löschen</button></div>` : '')
        : emptyHtml(tab === 'hist' ? 'wolki' : 'sproessi', tab === 'hist' ? 'Noch nichts angesehen.' : 'Noch nichts gemerkt.<br><span class="small">Tippe auf einer Seite oben auf ☆.</span>'));
    const hc = $('#hclear');
    if (hc) hc.addEventListener('click', () => { store.set('history', []); viewSaved(tok, tab); });
    if (list.length) enhanceRows($('#slist'), tok);
  }

  /* ------------------------------------------------------------ Missionen-Fortschritt */
  function viewQuests(tok) {
    const done = doneQuests();
    const prog = store.get('qprog', {});
    const doneList = Object.keys(done).sort((a, b) => done[b] - done[a]);
    const open = Object.keys(prog).filter(t => !done[t]).sort((a, b) => prog[b] - prog[a]);
    const qk = kindByKey('quest');
    view.innerHTML = `<header class="top"><h1>✅ Meine Missionen</h1></header>
      <div class="pad"><div class="stats" style="margin:0">
        <div class="stat"><b>${doneList.length}</b><span>erledigt</span></div>
        <div class="stat"><b>${open.length}</b><span>angefangen</span></div></div>
        <div class="btns"><a class="btn small" href="#/topic/story">📜 Story-Missionen</a><a class="btn small ghost" href="#/topic/freundschaft">💛 Freundschaft</a><a class="btn small ghost" href="#/topic/reich">🌀 Reiche</a></div></div>
      ${open.length ? `<div class="section"><div class="section-title">Angefangen</div><div class="list" id="ql1">${open.map(t => rowHtml({ title: t, kind: qk })).join('')}</div></div>` : ''}
      ${doneList.length ? `<div class="section"><div class="section-title">Erledigt</div><div class="list" id="ql2">${doneList.map(t => rowHtml({ title: t, kind: qk, done: true })).join('')}</div></div>` : ''}
      ${!open.length && !doneList.length ? emptyHtml('funkel', 'Noch keine Mission abgehakt.<br><span class="small">Öffne eine Mission und hake die Ziele Schritt für Schritt ab.</span>') : ''}`;
    ['#ql1', '#ql2'].forEach(s => { const el = $(s); if (el) translateTitles(el, tok); });
  }

  /* ------------------------------------------------------------ Info & Einstellungen */
  function fmtBytes(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  async function viewInfo(tok) {
    const ver = hasAndroid ? window.Android.appVersion() : 'Browser-Test';
    const sw = (id, on, title, sub) => `<label class="setting"><div class="txt"><b>${title}</b><span>${sub}</span></div>
      <span class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><i></i></span></label>`;
    view.innerHTML = `<header class="top"><h1>⚙️ Info &amp; Einstellungen</h1></header>
      <div class="pad">
        <div class="card"><h3>Sprache</h3>
          ${sw('s-tr', settings.autoTr, 'Wiki-Texte auf Deutsch', 'Automatische Übersetzung auf dem Handy (ML Kit)')}
          ${sw('s-tt', settings.trTitles, 'Titel in Listen übersetzen', 'Zeigt unter dem englischen Namen den deutschen')}
          ${sw('s-ds', settings.deSearch, 'Deutsche Suche', 'Suchbegriffe zusätzlich ins Englische übersetzen')}
          <div class="setting"><div class="txt"><b>Sprachpaket Deutsch</b><span id="mst">wird geprüft …</span></div><button class="btn small" id="mdl2" style="display:none">Laden</button></div>
        </div>
        <div class="card"><h3>Offline-Speicher</h3>
          <div class="muted small" id="cinfo">wird berechnet …</div>
          <div class="btns"><button class="btn small ghost" id="cclr">Seiten-Speicher leeren</button><button class="btn small ghost" id="tclr">Übersetzungen leeren</button></div>
        </div>
        <div class="card"><h3>Verbindung zum Wiki</h3>
          <div class="muted small">Falls Seiten nicht laden: Das Wiki ist durch eine Sicherheitsprüfung geschützt. Hier kannst du sie einmal selbst bestätigen.</div>
          <div class="btns"><button class="btn small" data-act="verify">Prüfung öffnen</button><button class="btn small ghost" data-act="ext" data-url="${WIKI}">Wiki im Browser</button></div>
        </div>
        <div class="card"><h3>Fortschritt</h3>
          <div class="muted small">Merkliste, Verlauf und abgehakte Missionen werden nur auf diesem Handy gespeichert.</div>
          <div class="btns"><button class="btn small ghost" id="qreset">Missions-Fortschritt zurücksetzen</button></div>
        </div>
        <div class="card about"><div class="about-m">${M.funkel(70)}${M.mumi(54)}${M.sproessi(50)}</div><h3>✨ Dreamlight Guide</h3>
          <div>Version ${esc(ver)}</div>
          <div class="muted small" style="margin-top:6px">Inoffizielle Fan-App für Disney Dreamlight Valley – nicht mit Disney oder Gameloft verbunden.
          Alle Spielinhalte und -bilder © Disney/Gameloft. Texte und Daten stammen live aus dem <a href="" data-act="ext" data-url="${WIKI}">Dreamlight Valley Wiki</a>
          (Lizenz <a href="" data-act="ext" data-url="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de">CC BY-NC-SA 4.0</a>) und werden in der App
          maschinell übersetzt. Danke an alle Wiki-Autorinnen und -Autoren!</div>
          <div style="margin-top:10px;font-weight:700">© marween</div>
        </div>
        <div class="card changelog"><h3>Änderungen</h3>${D.changelog.map(c => `<h4>Version ${esc(c.v)} · ${esc(c.date)}</h4><ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}</div>
      </div>`;

    const bindSw = (id, key) => $('#' + id).addEventListener('change', e => { settings[key] = e.target.checked; saveSettings(); });
    bindSw('s-tr', 'autoTr'); bindSw('s-tt', 'trTitles'); bindSw('s-ds', 'deSearch');

    const showModel = async () => {
      const ready = await checkModel();
      if (tok !== renderToken) return;
      $('#mst').textContent = ready ? '✔ Installiert' : 'Nicht installiert (ca. 30 MB)';
      $('#mdl2').style.display = ready ? 'none' : '';
    };
    $('#mdl2').addEventListener('click', async () => {
      $('#mdl2').disabled = true; $('#mst').textContent = '⏳ Lädt …';
      await downloadModel(); $('#mdl2').disabled = false; showModel();
    });
    showModel();

    const showCache = async () => {
      if (!hasAndroid) { $('#cinfo').textContent = 'Nur in der App verfügbar.'; return; }
      const r = await call('cacheInfo');
      if (tok !== renderToken || !r.ok) return;
      $('#cinfo').textContent = `${r.count} gespeicherte Abfragen (${fmtBytes(r.bytes)}) · ${r.translations} gespeicherte Übersetzungen`;
    };
    showCache();
    $('#cclr').addEventListener('click', async () => {
      if (hasAndroid) await call('clearCache');
      metaCache.clear(); catMem.clear(); searchMem.clear();
      toast('Seiten-Speicher geleert'); showCache();
    });
    $('#tclr').addEventListener('click', async () => {
      if (hasAndroid) await call('clearTranslations');
      trMem.clear(); toast('Übersetzungen geleert'); showCache();
    });
    $('#qreset').addEventListener('click', () => {
      if (!confirm('Alle abgehakten Missionen und Schritte zurücksetzen?')) return;
      Object.keys(store.get('qprog', {})).concat(Object.keys(doneQuests())).forEach(t => { try { localStorage.removeItem('dg:chk:' + t); } catch (e) { /* */ } });
      store.set('done', {}); store.set('qprog', {});
      toast('Fortschritt zurückgesetzt');
    });
  }

  /* ------------------------------------------------------------ Start */
  checkModel().catch(() => {}).then(() => {
    if (!location.hash) location.replace('#/');
    route();
  });
})();
