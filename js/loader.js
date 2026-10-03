/* loader.js — экран первой загрузки (концепт concept/loading.html).

   При первом входе скачивает картинки игры из js/assets-manifest.js и
   держит экран, пока всё не загрузится: лобби открывается уже целиком,
   без логотипов и иконок, которые появляются по одной.

   Где хранится:
   - sw.js кладёт img/ в Cache Storage (tradeup-img-v1) и отдаёт оттуда.
     Лоадер ждёт, пока воркер возьмёт страницу под контроль, и грузит
     картинки через него — так они сразу оседают в кеше.
   - Если воркер недоступен (iframe, старый браузер), остаётся HTTP-кеш.
   - localStorage tu_assets_v1: { v, h: { путь: хеш } } — что и какой
     версии уже лежит на устройстве. Новый хеш в манифесте → файл
     докачивается («Обновление»), остальное берётся из кеша.

   Картинки грузим через Image() по тем же адресам (с ?v), что и в игре,
   и держим ссылки — браузер отдаёт их <img> из памяти мгновенно.

   Режимы: first (первая загрузка), resume (докачка), update (новые хеши),
   cache (всё на устройстве — короткий пробег графика). Обрыв сети →
   пауза с кнопкой «Повторить», скачанное не теряется.

   API: Loader.run() → Promise (резолвится, когда экран погас).
        Loader.prefetchOther() — фоном докачать картинки второй темы. */
'use strict';

var Loader = (function () {
  var M = window.ASSET_MANIFEST || null;
  var LS_KEY = 'tu_assets_v1';
  var CACHE = 'tradeup-img-v1';
  var BASE = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
  var hasCaches = typeof caches !== 'undefined' && location.protocol !== 'file:';
  var swOk = false;
  var keep = [];

  /* Воркер регистрируем сразу, пока грузятся остальные скрипты. */
  var swReg = null;
  try {
    if ('serviceWorker' in navigator && hasCaches && window.isSecureContext !== false) {
      swReg = navigator.serviceWorker.register('sw.js').then(function (r) { swOk = true; return r; }, function () { return null; });
    }
  } catch (e) { swReg = null; }

  var STR = {
    ru: {
      g_core: 'Интерфейс', g_core_s: 'стили, скрипты, словари RU/EN',
      g_coins: 'Логотипы монет', g_coins_s: 'топ-200 монет',
      g_icons: 'Иконки и эмблемы', g_icons_s: 'вкладки, классы, аватары, пропуск',
      g_ach: 'Достижения', g_ach_s: 'эмблемы под вашу тему',
      g_fx: 'Колесо и сделки', g_fx_s: 'бонусы, анимации покупки и продажи',
      p_first: 'Первая загрузка · {mb}', p_resume: 'Докачиваем · {mb}', p_update: 'Обновление · {mb}',
      p_cache: 'Мгновенный запуск · всё на устройстве', p_saved: 'Сохранено на устройстве · {mb}',
      p_off: 'Нет соединения', p_back: 'Снова в сети · докачиваем',
      s_prep: 'Готовим загрузку…', s_check: 'Проверяем, что изменилось…', s_verify: 'Проверяем ресурсы…',
      s_dl: 'Скачиваем: {g}', s_up: 'Обновляем: {g}', s_of: '{a} из {b}', s_wait: 'Ждём сеть', s_wait2: 'продолжим с того же места',
      s_done: 'Готово', r_cache: 'из кеша', r_dev: 'на устройстве', r_pause: 'пауза',
      m_of: '{a} из {b}', m_dev: '{mb} на устройстве', m_spd: '{s}/с · ~{t} с', m_fromc: 'из кеша',
      retry_t: 'Загрузка на паузе', retry_s: 'Скачанные {mb} сохранены', retry_b: 'Повторить',
      t_first: 'Ресурсы сохранены', t_first_s: 'В следующий раз игра откроется мгновенно',
      t_upd: 'Игра обновлена', t_upd_s: 'Скачали только изменения, остальное взяли из кеша',
      kb: 'КБ', mb: 'МБ', sec: 'с',
      tips: [
        'Плечо 50× увеличивает в 50 раз и прибыль, и убыток. Ставьте стоп-лосс.',
        'Колесо удачи можно крутить раз в 6 часов. В нём бывает джекпот.',
        'Цель — капитал $1 000 000. В рейтинге видно, кто уже близко.',
        'Фандинг списывается раз в час. Когда рынок растёт, лонги платят шортам.',
        'Позицию на фьючерсах можно закрывать частями, от 25% до 100%.',
        'Задания и пропуск трейдера дают бустеры: нулевую комиссию, страховку, двойной опыт.'
      ]
    },
    en: {
      g_core: 'Interface', g_core_s: 'styles, scripts, RU/EN dictionaries',
      g_coins: 'Coin logos', g_coins_s: 'top 200 coins',
      g_icons: 'Icons & badges', g_icons_s: 'tabs, classes, avatars, pass',
      g_ach: 'Achievements', g_ach_s: 'badges for your theme',
      g_fx: 'Wheel & trades', g_fx_s: 'bonuses, buy and sell animations',
      p_first: 'First launch · {mb}', p_resume: 'Resuming · {mb}', p_update: 'Update · {mb}',
      p_cache: 'Instant start · everything on device', p_saved: 'Saved on device · {mb}',
      p_off: 'No connection', p_back: 'Back online · resuming',
      s_prep: 'Preparing download…', s_check: 'Checking what changed…', s_verify: 'Checking resources…',
      s_dl: 'Downloading: {g}', s_up: 'Updating: {g}', s_of: '{a} of {b}', s_wait: 'Waiting for network', s_wait2: 'we’ll resume where we left off',
      s_done: 'Done', r_cache: 'cached', r_dev: 'on device', r_pause: 'paused',
      m_of: '{a} of {b}', m_dev: '{mb} on device', m_spd: '{s}/s · ~{t} s', m_fromc: 'from cache',
      retry_t: 'Download paused', retry_s: 'Downloaded {mb} are saved', retry_b: 'Retry',
      t_first: 'Resources saved', t_first_s: 'Next time the game opens instantly',
      t_upd: 'Game updated', t_upd_s: 'Downloaded only the changes, the rest came from cache',
      kb: 'KB', mb: 'MB', sec: 's',
      tips: [
        '50× leverage multiplies both profit and loss by 50. Use a stop-loss.',
        'The lucky wheel spins once every 6 hours. There is a jackpot in it.',
        'The goal is $1,000,000 in capital. The leaderboard shows who is close.',
        'Funding is charged every hour. When the market rises, longs pay shorts.',
        'Futures positions can be closed in parts, from 25% to 100%.',
        'Quests and the trader pass give boosters: zero fees, insurance, double XP.'
      ]
    }
  };
  function lang() { return (typeof LANG !== 'undefined' && LANG === 'en') ? 'en' : 'ru'; }
  function L(k, v) {
    var s = STR[lang()][k];
    if (v) for (var n in v) s = s.split('{' + n + '}').join(v[n]);
    return s;
  }

  var ICO = {
    core: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 14l2 2-2 2M13 18h3"/></svg>',
    coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/></svg>',
    icons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></svg>',
    ach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
    fx: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.2 2L4 13.5h6.4L9.6 22 20 9.8h-6.6z"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.4-2.6M19 12.9a10 10 0 0 0-2.3-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 5"/><circle cx="12" cy="20" r="1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>'
  };

  function $(s, r) { return (r || document).querySelector(s); }
  function fam() { try { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
  function other(f) { return f === 'light' ? 'dark' : 'light'; }
  function reduced() { try { return typeof FX !== 'undefined' && FX.reducedMotion && FX.reducedMotion(); } catch (e) { return false; } }
  function pathOf(u) { return u.split('#')[0].split('?')[0]; }
  function fmtMb(b) {
    var v = b / 1048576;
    var s = v < 1 ? Math.max(1, Math.round(b / 1024)) + ' ' + L('kb') : v.toFixed(1) + ' ' + L('mb');
    return lang() === 'ru' ? s.replace('.', ',') : s;
  }
  function loadSaved() {
    try { var o = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); if (o && o.h) return o; } catch (e) { /* нет доступа */ }
    return { v: '', h: {} };
  }
  function store(st) { try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch (e) { /* нет доступа */ } }

  function groupsFor(f) {
    var G = M.groups;
    return [
      { id: 'core', files: G.core || [], core: true },
      { id: 'coins', files: G.coins || [] },
      { id: 'icons', files: G.icons || [] },
      { id: 'ach', files: G['ach_' + f] || [] },
      { id: 'fx', files: (G.fx || []).concat(G['fx_' + f] || []) }
    ];
  }

  /* Дождаться, пока воркер возьмёт страницу под контроль (первый
     запуск: clients.claim). Не дольше 1.5 с — иначе грузим мимо него. */
  function swControl() {
    if (!swReg) return Promise.resolve(false);
    return new Promise(function (res) {
      var done = false;
      function fin(v) { if (!done) { done = true; res(v); } }
      if (navigator.serviceWorker.controller) return fin(true);
      try { navigator.serviceWorker.addEventListener('controllerchange', function () { fin(!!navigator.serviceWorker.controller); }); } catch (e) { fin(false); }
      swReg.then(function (r) { if (!r) fin(false); });
      setTimeout(function () { fin(!!navigator.serviceWorker.controller); }, 1500);
    });
  }
  function cacheKeys() {
    if (!hasCaches) return Promise.resolve(null);
    return caches.open(CACHE).then(function (c) {
      return c.keys().then(function (ks) {
        var set = {};
        ks.forEach(function (r) { if (r.url.indexOf(BASE) === 0) set[r.url.slice(BASE.length)] = 1; });
        return { c: c, set: set };
      });
    }).catch(function () { return null; });
  }

  /* Одна загрузка: картинка — через Image (тот же src, что в игре),
     json — fetch. timeout — чтобы зависший запрос не держал экран. */
  function loadOne(f, fresh) {
    return new Promise(function (res) {
      var url = f.u, done = false, tm = 0;
      function fin(ok) { if (done) return; done = true; clearTimeout(tm); res(ok); }
      tm = setTimeout(function () { fin(false); }, 20000);
      if (/\.json(\?|$)/.test(url)) {
        fetch(url, fresh ? { cache: 'reload' } : {}).then(function (r) { return r.ok ? r.text().then(function () { fin(true); }) : fin(false); }, function () { fin(false); });
        return;
      }
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        keep.push(im);
        if (f.dec && im.decode) im.decode().then(function () { fin(true); }, function () { fin(true); });
        else fin(true);
      };
      im.onerror = function () { fin(false); };
      im.src = url;
    });
  }

  /* ---------- Экран ---------- */
  var scr, ld, run = null, tipTimer = 0, lastPct = -1;

  var PTS = (function () {
    var n = 44, out = [], seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var i = 0; i <= n; i++) {
      var t = i / n, trend = Math.pow(t, 1.15);
      var wob = (rnd() - 0.5) * 0.07 + Math.sin(t * 11) * 0.03;
      out.push(Math.max(0, Math.min(1, trend * 0.92 + (i === 0 || i === n ? 0 : wob) + (i === n ? 0.08 : 0))));
    }
    return out;
  })();
  function yAt(p) { var f = p * (PTS.length - 1), i = Math.floor(f), r = f - i; return i >= PTS.length - 1 ? PTS[PTS.length - 1] : PTS[i] * (1 - r) + PTS[i + 1] * r; }

  function build(groups) {
    scr = document.getElementById('scr-loading');
    ld = scr && scr.querySelector('.ld');
    if (!ld) return false;
    var list = ld.querySelector('.ld-list');
    list.innerHTML = groups.map(function (g) {
      return '<div class="ld-row" data-g="' + g.id + '" data-s="queue"><span class="ic">' + ICO[g.id] + '</span>' +
        '<span class="nm"><b>' + L('g_' + g.id) + '</b><i>' + L('g_' + g.id + '_s') + '</i></span>' +
        '<span class="st"><em></em><span class="sp"></span><span class="ok">' + ICO.ok + '</span></span>' +
        '<span class="mb"><u></u></span></div>';
    }).join('');
    list.classList.add('rv'); list.style.setProperty('--d', '120');
    ld.querySelector('.ld-foot').classList.add('rv');
    ld.querySelector('.ld-meta').classList.add('rv');
    return true;
  }
  function setPill(cls, ico, text) {
    var p = $('.ld-pill', ld); if (!p) return;
    p.className = 'ld-pill ' + cls;
    p.innerHTML = ico + '<span>' + text + '</span>';
    void p.offsetWidth; p.classList.add('swap');
  }
  function setStage(html, key) {
    var st = $('.ld-stage', ld); if (!st) return;
    key = key || html;
    var cur = st.querySelector('span:not(.gone)');
    if (cur && cur.getAttribute('data-k') === key) { if (cur.innerHTML !== html) cur.innerHTML = html; return; }
    if (cur) { cur.classList.remove('in'); cur.classList.add('gone'); setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); }, 420); }
    var s = document.createElement('span'); s.className = 'in'; s.setAttribute('data-k', key); s.innerHTML = html; st.appendChild(s);
  }
  function row(id) { return $('.ld-row[data-g="' + id + '"]', ld); }
  function setRow(id, s, text, frac) {
    var r = row(id); if (!r) return;
    if (r.getAttribute('data-s') !== s) r.setAttribute('data-s', s);
    var em = r.querySelector('.st em'); if (em.textContent !== text) em.textContent = text;
    if (frac != null) r.querySelector('.mb u').style.width = (frac * 100).toFixed(1) + '%';
  }
  function flashRow(id, gold) {
    var r = row(id); if (!r) return;
    r.classList.remove('flash', 'g'); void r.offsetWidth; r.classList.add('flash'); if (gold) r.classList.add('g');
  }
  function bumpCoin() {
    var c = $('.ld-coin', ld); if (!c) return;
    var p = c.querySelector('.ping');
    c.classList.remove('bump'); p.classList.remove('go');
    void c.offsetWidth; c.classList.add('bump'); p.classList.add('go');
  }
  function fly(id) {
    var r = row(id), c = $('.ld-coin', ld);
    if (!r || !c || reduced() || !document.body.animate) { bumpCoin(); return; }
    var a = r.querySelector('.ic').getBoundingClientRect(), b = c.getBoundingClientRect();
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    var mx = (x0 + x1) / 2 - 70, my = Math.min(y0, y1) + (y0 - y1) * 0.35;
    var d = document.createElement('i'); d.className = 'ld-fly up';
    document.body.appendChild(d);
    var an = d.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(0.6)', opacity: 0 },
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1.1)', opacity: 1, offset: 0.12 },
      { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1)', opacity: 1, offset: 0.55 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(0.5)', opacity: 0.9 }
    ], { duration: 720, easing: 'cubic-bezier(0.4, 0, 0.3, 1)' });
    an.onfinish = function () { if (d.parentNode) d.parentNode.removeChild(d); bumpCoin(); };
  }
  function drawChart(p) {
    var ln = $('.ld-chart .ln', ld), ar = $('.ld-chart .ar', ld), head = $('.ld-head', ld), tag = $('.ld-head .tag', ld);
    if (!ln) return;
    p = Math.max(0, Math.min(1, p || 0));
    var n = PTS.length - 1, upto = p * n, d = '', i;
    function Y(v) { return (94 - v * 88).toFixed(2); }
    for (i = 0; i <= Math.floor(upto); i++) d += (i ? 'L' : 'M') + (i / n * 100).toFixed(2) + ' ' + Y(PTS[i]);
    var hy = yAt(p);
    if (upto % 1 > 0 || i === 0) d += (d ? 'L' : 'M') + (p * 100).toFixed(2) + ' ' + Y(hy);
    ln.setAttribute('d', d);
    ar.setAttribute('d', d + 'L' + (p * 100).toFixed(2) + ' 100L0 100Z');
    head.style.left = (p * 100) + '%';
    head.style.top = Y(hy) + '%';
    head.classList.toggle('edge', p > 0.8);
    head.classList.toggle('low', p < 0.12);
    var pct = Math.floor(p * 100 + 1e-6);
    if (pct !== lastPct) {
      var paused = ld.classList.contains('paused');
      tag.textContent = (p >= 1 ? '✓ ' : paused ? '⏸ ' : '▲ ') + pct + '%';
      if (pct % 10 === 0 && pct > 0) { tag.classList.remove('tick'); void tag.offsetWidth; tag.classList.add('tick'); }
      lastPct = pct;
    }
  }
  function startTips() {
    clearInterval(tipTimer);
    var foot = $('.ld-foot', ld); if (!foot) return;
    var tips = STR[lang()].tips, i = Math.floor(Math.random() * tips.length);
    foot.innerHTML = '<div class="ld-tip"><span class="ti">i</span><span class="in">' + tips[i] + '</span></div>';
    tipTimer = setInterval(function () {
      var t = foot.querySelector('.ld-tip span:last-child'); if (!t) return;
      i = (i + 1) % tips.length;
      t.classList.remove('in'); void t.offsetWidth; t.textContent = tips[i]; t.classList.add('in');
    }, 4200);
  }
  function meta(l, r) {
    var a = $('.ld-meta', ld); if (!a) return;
    var s = a.children;
    if (s[0].innerHTML !== l) s[0].innerHTML = l;
    if (s[1].innerHTML !== r) s[1].innerHTML = r;
  }

  /* ---------- Загрузка ---------- */
  function start(resolve) {
    var f = fam(), groups = groupsFor(f), saved = loadSaved();
    if (!build(groups)) { resolve(); return; }
    run = { resolve: resolve, groups: groups, saved: saved, t0: performance.now(), paused: false, dead: false };
    drawChart(0);
    setStage(L('s_verify'));
    Promise.all([swControl(), cacheKeys()]).then(function (r) {
      run.sw = r[0];
      plan(r[1]);
    });
  }

  function plan(ck) {
    var r = run, saved = r.saved;
    var set = ck ? ck.set : null;
    var dels = [];
    r.files = []; r.need = []; r.cached = [];
    r.needBytes = 0; r.allBytes = 0; r.anyCached = false; r.allChanged = true;
    r.groups.forEach(function (g) {
      g.need = 0; g.needBytes = 0; g.got = 0; g.gotBytes = 0; g.cached = 0; g.cachedDone = 0; g.total = g.files.length;
      g.files.forEach(function (e) {
        var p = pathOf(e[0]);
        var it = { u: e[0], p: p, s: e[1], h: e[2], g: g, dec: g.id === 'coins' || g.id === 'icons' };
        var st = saved.h[p];
        var changed = st != null && st !== it.h;
        var present = g.core ? true : (set && r.sw ? !!set[p] && st != null : (saved.v !== '' && st != null));
        if (g.core && st == null) present = saved.v !== '';
        r.allBytes += it.s;
        if (present && !changed) { it.cache = true; g.cached++; r.cached.push(it); r.anyCached = true; }
        else {
          it.fresh = changed;
          if (!changed) r.allChanged = false;
          if (changed && set && set[p]) dels.push(BASE + p);
          g.need++; g.needBytes += it.s; r.needBytes += it.s; r.need.push(it);
        }
        r.files.push(it);
      });
    });
    r.mode = !r.need.length ? 'cache' : !r.anyCached ? 'first' : r.allChanged ? 'update' : 'resume';
    var pre = dels.length && ck ? Promise.all(dels.map(function (k) { return ck.c.delete(k).catch(function () {}); })) : Promise.resolve();
    pre.then(go);
  }

  function go() {
    var r = run;
    r.gotBytes = 0; r.netBytes = 0; r.cacheDone = 0; r.shown = 0; r.last = performance.now();
    r.queue = r.need.slice(); r.cq = r.cached.slice(); r.active = 0; r.cactive = 0; r.failed = [];
    r.groups.forEach(function (g) { if (!g.need) setRow(g.id, 'queue', ''); else setRow(g.id, 'queue', fmtMb(g.needBytes)); });
    if (r.mode === 'cache') {
      setPill('up', ICO.bolt, L('p_cache'));
      meta('<b>' + fmtMb(r.allBytes) + '</b> ' + (lang() === 'ru' ? 'на устройстве' : 'on device'), L('m_fromc'));
      r.minDur = 420;
    } else {
      var mb = fmtMb(r.needBytes);
      if (r.mode === 'first') setPill('gold', ICO.dl, L('p_first', { mb: mb }));
      else if (r.mode === 'update') setPill('gold', ICO.up, L('p_update', { mb: mb }));
      else setPill('gold', ICO.dl, L('p_resume', { mb: mb }));
      setStage(r.mode === 'update' ? L('s_check') : L('s_prep'));
      ld.classList.add('busy');
      r.minDur = 1500;
    }
    startTips();
    /* Группы, которые уже на месте, помечаем лесенкой. */
    var k = 0;
    r.groups.forEach(function (g) {
      if (g.need) return;
      var delay = 260 + (k++) * 90;
      setTimeout(function () {
        if (r.dead) return;
        if (r.mode === 'cache' && !g.core) return; /* в режиме кеша — по факту прогрева */
        setRow(g.id, 'cache', r.mode === 'cache' ? L('r_dev') : L('r_cache'));
        flashRow(g.id, true);
      }, delay);
    });
    pump();
    r.raf = requestAnimationFrame(tick);
  }

  /* Очередь: сеть — по 6 файлов, кеш — по 24. Порядок групп сохраняется,
     поэтому группы скачиваются одна за другой, как в списке. */
  function pump() {
    var r = run; if (r.dead || r.paused) return;
    while (r.active < 6 && r.queue.length) netOne(r.queue.shift());
    while (r.cactive < 24 && r.cq.length) cacheOne(r.cq.shift());
  }
  function netOne(it) {
    var r = run; r.active++;
    if (it.g.core) {
      /* Стили и скрипты страница уже загрузила — отмечаем их сразу. */
      setTimeout(function () { r.active--; gotNet(it, true); pump(); }, 40 + Math.random() * 60);
      return;
    }
    loadOne(it, it.fresh).then(function (ok) {
      r.active--;
      if (r.dead) return;
      if (!ok && navigator.onLine === false) { r.queue.unshift(it); pause(); return; }
      if (!ok && !it.retried) { it.retried = true; r.queue.push(it); pump(); return; }
      gotNet(it, ok);
      pump();
    });
  }
  function gotNet(it, ok) {
    var r = run, g = it.g;
    if (ok) r.saved.h[it.p] = it.h; else r.failed.push(it);
    g.got++; g.gotBytes += it.s; r.gotBytes += it.s;
    if (!g.core) r.netBytes += it.s;
    if (g.got >= g.need) {
      setRow(g.id, 'done', fmtMb(g.needBytes), 1);
      flashRow(g.id); fly(g.id);
    }
  }
  function cacheOne(it) {
    var r = run; r.cactive++;
    if (it.g.core) { r.cactive--; it.g.cachedDone++; r.cacheDone++; pump(); return; }
    loadOne(it, false).then(function (ok) {
      r.cactive--;
      if (r.dead) return;
      var g = it.g;
      if (!ok) {
        /* В кеше не оказалось и сети нет — докачаем, когда появится. */
        delete r.saved.h[it.p];
        if (navigator.onLine === false) { it.cache = false; g.need++; g.needBytes += it.s; r.needBytes += it.s; r.queue.push(it); }
      } else r.saved.h[it.p] = it.h;
      g.cachedDone++; r.cacheDone++;
      if (r.mode === 'cache' && g.cachedDone >= g.cached && !g.need) {
        setRow(g.id, 'cache', L('r_dev'));
        flashRow(g.id, true);
      }
      pump();
    });
  }

  function realP() {
    var r = run;
    if (r.mode === 'cache') return r.cached.length ? r.cacheDone / r.cached.length : 1;
    var p = r.needBytes ? r.gotBytes / r.needBytes : 1;
    /* Пока не прогрет кеш остальных групп, 100% не показываем. */
    if (r.cacheDone < r.cached.length) p = Math.min(p, 0.99);
    return p;
  }
  function tick(now) {
    var r = run; if (r.dead) return;
    /* Метка rAF бывает раньше performance.now() из go() — dt не даём уйти в минус. */
    var dt = Math.max(0, Math.min(0.1, (now - r.last) / 1000)); r.last = now;
    if (!r.paused) {
      var real = realP();
      /* Линия догоняет реальный прогресс плавно, но не быстрее minDur на всю шкалу. */
      var cap = dt * 1000 / r.minDur;
      r.shown = Math.min(real, r.shown + Math.min(cap, Math.max((real - r.shown) * dt * 7, cap * 0.35)));
      drawChart(r.shown);
      if (r.mode !== 'cache') {
        var el = (now - r.t0) / 1000;
        var cur = null;
        for (var i = 0; i < r.groups.length; i++) { var g = r.groups[i]; if (g.need && g.got < g.need) { cur = g; break; } }
        if (cur) {
          setRow(cur.id, 'load', cur.got + '/' + cur.need, cur.needBytes ? cur.gotBytes / cur.needBytes : 0);
          setStage(L(r.mode === 'update' ? 's_up' : 's_dl', { g: L('g_' + cur.id).toLowerCase() }) + ' <i>· ' + L('s_of', { a: cur.got, b: cur.need }) + '</i>', 'g:' + cur.id);
        }
        var spd = el > 0.3 ? r.netBytes / el : 0;
        var left = Math.max(0, r.needBytes - r.gotBytes);
        meta('<b>' + fmtMb(r.gotBytes) + '</b> ' + (lang() === 'ru' ? 'из' : 'of') + ' ' + fmtMb(r.needBytes),
          spd > 0 ? L('m_spd', { s: fmtMb(spd), t: Math.max(0, Math.ceil(left / spd)) }) : '');
      }
      if (real >= 1 && r.shown >= 0.999 && !r.queue.length && !r.active && !r.cactive) return finish();
    }
    r.raf = requestAnimationFrame(tick);
  }

  function pause() {
    var r = run; if (r.paused) return;
    r.paused = true;
    ld.classList.add('paused'); ld.classList.remove('busy');
    lastPct = -1; drawChart(r.shown);
    var cur = r.groups.filter(function (g) { return g.need && g.got < g.need; })[0];
    if (cur) setRow(cur.id, 'pause', L('r_pause'));
    setPill('down', ICO.off, L('p_off'));
    setStage(L('s_wait') + ' <i>· ' + L('s_wait2') + '</i>', 'wait');
    meta('<b>' + fmtMb(r.gotBytes) + '</b> ' + (lang() === 'ru' ? 'из' : 'of') + ' ' + fmtMb(r.needBytes), '0 ' + L('kb') + '/' + L('sec'));
    clearInterval(tipTimer);
    var foot = $('.ld-foot', ld);
    foot.innerHTML = '<div class="ld-retry"><div><b>' + L('retry_t') + '</b>' + L('retry_s', { mb: fmtMb(r.gotBytes) }) + '</div><button type="button">' + L('retry_b') + '</button></div>';
    foot.querySelector('button').addEventListener('click', resume);
    store({ v: '', h: r.saved.h });
  }
  function resume() {
    var r = run; if (!r || !r.paused || r.dead) return;
    r.paused = false;
    ld.classList.remove('paused'); ld.classList.add('busy');
    lastPct = -1;
    setPill('gold', ICO.dl, L('p_back'));
    startTips();
    r.last = performance.now();
    pump();
  }
  window.addEventListener('online', function () { if (run && run.paused) resume(); });

  function finish() {
    var r = run; r.dead = true;
    cancelAnimationFrame(r.raf);
    clearInterval(tipTimer);
    ld.classList.remove('busy'); ld.classList.add('done');
    lastPct = -1; drawChart(1);
    var secs = ((performance.now() - r.t0) / 1000).toFixed(1);
    if (lang() === 'ru') secs = secs.replace('.', ',');
    setStage(L('s_done') + (r.mode === 'cache' ? ' <i>· ' + secs + ' ' + L('sec') + '</i>' : ''), 'done');
    r.groups.forEach(function (g) { if (g.need) setRow(g.id, 'done', fmtMb(g.needBytes), 1); });
    if (r.mode !== 'cache') {
      setPill('up', ICO.check, L('p_saved', { mb: fmtMb(r.allBytes) }));
      meta('<b>' + fmtMb(r.needBytes) + '</b> ' + (lang() === 'ru' ? 'из' : 'of') + ' ' + fmtMb(r.needBytes), '');
    }
    /* Версию манифеста пишем, только если всё скачалось: иначе в
       следующий раз докачаем недостающее. */
    store({ v: r.failed.length ? '' : M.v, h: r.saved.h });
    bumpCoin();
    var mode = r.mode;
    setTimeout(function () {
      ld.classList.add('out');
      if (mode === 'cache') ld.classList.add('fast');
      scr.classList.add('ld-leaving');
      setTimeout(function () {
        r.resolve();
        if (mode === 'first' || mode === 'update' || mode === 'resume') toast(mode);
      }, mode === 'cache' ? 300 : 460);
    }, mode === 'cache' ? 120 : 850);
  }

  function toast(mode) {
    var msg = mode === 'update' ? [L('t_upd'), L('t_upd_s'), ICO.up] : [L('t_first'), L('t_first_s'), ICO.check];
    setTimeout(function () {
      var t = document.createElement('div'); t.className = 'ld-toast';
      t.innerHTML = '<span class="ti2">' + msg[2] + '</span><div><b>' + msg[0] + '</b>' + msg[1] + '</div>';
      document.body.appendChild(t);
      setTimeout(function () { t.classList.add('bye'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400); }, 3600);
    }, 380);
  }

  /* Картинки второй темы (светлая ↔ тёмная) — фоном после входа, по
     одной-две, чтобы смена темы тоже обходилась без постепенной
     прорисовки. Только при живом воркере: без него это пустой трафик. */
  function prefetchOther() {
    if (!M || !swOk || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
    var o = other(fam()), saved = loadSaved();
    var list = (M.groups['ach_' + o] || []).concat(M.groups['fx_' + o] || []).filter(function (e) { return saved.h[pathOf(e[0])] !== e[2]; });
    if (!list.length) return;
    var i = 0, act = 0;
    function next() {
      while (act < 2 && i < list.length) {
        var e = list[i++]; act++;
        (function (e) {
          var p = pathOf(e[0]);
          var pre = saved.h[p] != null && hasCaches ? caches.open(CACHE).then(function (c) { return c.delete(BASE + p); }).catch(function () {}) : Promise.resolve();
          pre.then(function () { return loadOne({ u: e[0] }, saved.h[p] != null); }).then(function (ok) {
            act--;
            if (ok) { var s = loadSaved(); s.h[p] = e[2]; store(s); }
            next();
          });
        })(e);
      }
    }
    next();
  }

  function runLoader() {
    return new Promise(function (resolve) {
      if (!M || !M.groups) { resolve(); return; }
      try { start(resolve); } catch (e) {
        try { console.error('loader', e); } catch (e2) { /* */ }
        resolve();
      }
    });
  }

  return { run: runLoader, prefetchOther: prefetchOther };
})();
