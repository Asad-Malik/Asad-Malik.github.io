(() => {
  const S = window.SCHOLAR || {};
  const PUBS = (window.PUBLICATIONS || []).filter(p => p.title);
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n).toLocaleString('en-US');

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  $('#themeToggle').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  });

  /* ---------- Nav ---------- */
  const nav = $('.nav'), links = $('#navLinks'), menuBtn = $('#menuBtn');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });

  const navAnchors = [...links.querySelectorAll('a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navAnchors.forEach(a => { const t = $(a.getAttribute('href')); if (t) spy.observe(t); });

  /* ---------- Reveal ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  const observeReveal = el => reduce ? el.classList.add('in') : io.observe(el);
  document.querySelectorAll('.reveal').forEach(observeReveal);

  /* ---------- Stats count-up ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = S[el.dataset.count];
    if (target == null) return;
    if (reduce) { el.textContent = fmt(target); return; }
    const cio = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      cio.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(target * e));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    cio.observe(el);
  });

  /* ---------- Citation chart ---------- */
  const chart = $('#citeChart');
  if (chart && S.perYear) {
    const max = Math.max(...S.perYear.map(d => d[1]));
    chart.innerHTML = S.perYear.map(([y, c]) =>
      `<div class="bar" title="${y}: ${fmt(c)} citations"><i data-v="${fmt(c)}" data-h="${(c / max * 88).toFixed(1)}"></i><small>'${String(y).slice(2)}</small></div>`
    ).join('');
    const grow = () => chart.querySelectorAll('i').forEach(i => i.style.height = i.dataset.h + '%');
    if (reduce) grow();
    else new IntersectionObserver(([en], o) => { if (en.isIntersecting) { grow(); o.disconnect(); } }, { threshold: .3 }).observe(chart);
    const last = S.perYear[S.perYear.length - 1];
    $('#chartNote').textContent = `Google Scholar · ${fmt(S.citations)} total citations · ${last[0]} is year-to-date (hatched)`;
  }

  /* ---------- Publications ---------- */
  const TYPES = { all: 'All', journal: 'Journals', conference: 'Conferences', chapter: 'Book chapters', patent: 'Patents', preprint: 'Preprints', other: 'Other' };
  const SINGULAR = { journal: 'Journal', conference: 'Conference', chapter: 'Book chapter', patent: 'Patent', preprint: 'Preprint', other: 'Other' };
  const ME = /\b(A(?:\.\s?)?\s?W(?:\.)?\s?Malik|Asad\s+W(?:aqar|\.)?\s+Malik|A\s+Malik|Asad\s+Malik)\b/gi;
  const markMe = s => esc(s).replace(ME, '<mark>$1</mark>');
  // Scholar venues end with ", <year>"; drop it since the year is shown separately.
  const venueOf = p => (p.venue || '').replace(/,\s*(\d{4}|0)\s*$/, '');

  // Selected (most cited)
  const top = [...PUBS].sort((a, b) => b.citations - a.citations).slice(0, 6);
  $('#selected').innerHTML = top.map(p => `
    <a class="sel reveal" href="${esc(p.url)}" target="_blank" rel="noopener">
      <span class="cites">${fmt(p.citations)}<small>citations</small></span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(venueOf(p).split(/\s\d/)[0] || SINGULAR[p.type])}${p.year ? ' · ' + p.year : ''}</p>
    </a>`).join('');
  document.querySelectorAll('#selected .reveal').forEach(observeReveal);

  const counts = PUBS.reduce((m, p) => (m[p.type] = (m[p.type] || 0) + 1, m), { all: PUBS.length });
  $('#pubSummary').textContent = `${PUBS.length} items on Google Scholar` + (S.updated ? ` · updated ${new Date(S.updated + 'T00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : '');
  if (S.updated) $('#updated').textContent = `Publication data from Google Scholar · ${S.updated}`;

  const state = { type: 'all', q: '', sort: 'year', limit: 40 };
  const chips = $('#typeChips');
  chips.innerHTML = Object.keys(TYPES).filter(t => counts[t]).map(t =>
    `<button class="chip" data-type="${t}" aria-pressed="${t === 'all'}">${TYPES[t]}<b>${counts[t]}</b></button>`).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    state.type = b.dataset.type; state.limit = 40;
    chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    render();
  });
  let tId;
  $('#pubSearch').addEventListener('input', e => { clearTimeout(tId); tId = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); state.limit = 40; render(); }, 120); });
  $('#pubSort').addEventListener('change', e => { state.sort = e.target.value; state.limit = 40; render(); });
  $('#moreBtn').addEventListener('click', () => { state.limit += 60; render(); });

  const pubHTML = (p, showYear) => `
    <article class="pub">
      <a class="pub-title" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>
      ${p.authors ? `<div class="pub-authors">${markMe(p.authors)}</div>` : ''}
      <div class="pub-meta">
        ${showYear && p.year ? `<span class="yr">${p.year}</span>` : ''}
        <span class="tag">${SINGULAR[p.type]}</span>
        ${venueOf(p) ? `<em>${esc(venueOf(p))}</em>` : ''}
        ${p.citations ? `<span class="cite-badge">${fmt(p.citations)} citation${p.citations === 1 ? '' : 's'}</span>` : ''}
      </div>
    </article>`;

  function render() {
    const q = state.q;
    let list = PUBS.filter(p => (state.type === 'all' || p.type === state.type) &&
      (!q || `${p.title} ${p.authors} ${p.venue} ${p.year || ''}`.toLowerCase().includes(q)));
    list.sort(state.sort === 'cites'
      ? (a, b) => b.citations - a.citations || (b.year || 0) - (a.year || 0)
      : (a, b) => (b.year || 0) - (a.year || 0) || b.citations - a.citations);

    const shown = list.slice(0, state.limit);
    const el = $('#pubList');
    if (!list.length) {
      el.className = 'pub-list';
      el.innerHTML = `<div class="empty">No publications match “${esc(state.q)}”.</div>`;
    } else if (state.sort === 'year') {
      el.className = 'pub-list';
      const groups = new Map();
      shown.forEach(p => { const k = p.year || 'Undated'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
      const totals = list.reduce((m, p) => (m[p.year || 'Undated'] = (m[p.year || 'Undated'] || 0) + 1, m), {});
      el.innerHTML = [...groups].map(([y, ps]) => `
        <section class="year-group">
          <div class="year-label">${y}<small>${totals[y]} item${totals[y] === 1 ? '' : 's'}</small></div>
          <div>${ps.map(p => pubHTML(p, false)).join('')}</div>
        </section>`).join('');
    } else {
      el.className = 'pub-list list-flat';
      el.innerHTML = shown.map(p => pubHTML(p, true)).join('');
    }
    const more = $('#moreBtn');
    more.hidden = list.length <= state.limit;
    more.textContent = `Show more (${list.length - shown.length} remaining)`;
  }
  render();

  $('#year').textContent = new Date().getFullYear();
})();
