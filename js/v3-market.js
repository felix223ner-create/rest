/* v3 — поведенческий слой «market» по concept/market.html.
   «Пульс рынка», лента категорий со счётчиками, шапка списка с сортировкой,
   прилипающий поиск с бегущей подсказкой, счётчики в переключателе
   Спот/Фьючерсы. Цены и порядок строк по-прежнему ведёт main.js/futures.js —
   слой только достраивает вид вокруг и обновляет его точечно. */
'use strict';

V3.i18n({
  ru: {
    v3m_pulse: 'Пульс рынка', v3m_cap: 'Капитализация рынка', v3m_24h: 'за 24 часа',
    v3m_upd: 'обновлено {t}', v3m_rising: 'растут', v3m_falling: 'падают',
    v3m_cats: 'Категории', v3m_search: 'Поиск:', v3m_try: 'Попробуйте:', v3m_all: 'Все',
    v3m_show: 'Показать {n}', v3m_fg: 'Индекс страха и жадности: {v} — {l}',
    v3m_s_cap: 'Капитализация', v3m_s_price: 'Цена', v3m_s_change: 'Изменение 24ч',
    v3m_s_volume: 'Объём 24ч', v3m_s_az: 'A → Z', v3m_s_funding: 'Фандинг', v3m_s_pop: 'Популярность',
    v3m_accounts: 'Счета', v3m_free: 'свободно {v}',
    v3m_fg_t: 'Страх и жадность: {v} — {l}', v3m_fg_sub: 'Считается по капитализации и доле растущих монет',
    v3m_ch_hint: 'Зажмите — перекрестие · тяните — история',
    v3m_x_free: 'свободно', v3m_x_nopos: 'позиций нет', v3m_x_pos: 'открыто {n} {w}',
    v3m_pos_1: 'позиция', v3m_pos_2: 'позиции', v3m_pos_5: 'позиций',
    v3m_x_fund: 'Фандинг через', v3m_x_all: 'Всё',
    v3m_x_hint: 'Маржа для фьючерсов берётся только с фьючерсного счёта',
    v3m_x_empty_s: 'Спотовый счёт пуст', v3m_x_empty_f: 'Фьючерсный счёт пуст',
    v3m_x_tf: 'Спот → фьючерсы', v3m_x_ts: 'Фьючерсы → спот', v3m_x_done: 'Переведено {x}',
    v3m_ptr_pull: 'Потяните, чтобы обновить', v3m_ptr_release: 'Отпустите, чтобы обновить',
    v3m_ptr_busy: 'Обновляем цены…', v3m_ptr_done: 'Цены обновлены', v3m_ptr_sub: 'Котировки на {t}',
    v3m_ss_t: 'Сортировка', v3m_ss_s: 'Список перестраивается сразу', v3m_ss_reset: 'Сбросить'
  },
  en: {
    v3m_pulse: 'Market pulse', v3m_cap: 'Market cap', v3m_24h: 'in 24 hours',
    v3m_upd: 'updated {t}', v3m_rising: 'rising', v3m_falling: 'falling',
    v3m_cats: 'Categories', v3m_search: 'Search:', v3m_try: 'Try:', v3m_all: 'All',
    v3m_show: 'Show {n}', v3m_fg: 'Fear & greed index: {v} — {l}',
    v3m_s_cap: 'Market cap', v3m_s_price: 'Price', v3m_s_change: 'Change 24h',
    v3m_s_volume: 'Volume 24h', v3m_s_az: 'A → Z', v3m_s_funding: 'Funding', v3m_s_pop: 'Popularity',
    v3m_accounts: 'Accounts', v3m_free: '{v} available',
    v3m_fg_t: 'Fear & greed: {v} — {l}', v3m_fg_sub: 'Based on market cap and the share of rising coins',
    v3m_ch_hint: 'Hold for crosshair · drag for history',
    v3m_x_free: 'available', v3m_x_nopos: 'no positions', v3m_x_pos: '{n} open {w}',
    v3m_pos_1: 'position', v3m_pos_2: 'positions', v3m_pos_5: 'positions',
    v3m_x_fund: 'Funding in', v3m_x_all: 'All',
    v3m_x_hint: 'Futures margin comes only from the futures account',
    v3m_x_empty_s: 'Spot account is empty', v3m_x_empty_f: 'Futures account is empty',
    v3m_x_tf: 'Spot → futures', v3m_x_ts: 'Futures → spot', v3m_x_done: 'Transferred {x}',
    v3m_ptr_pull: 'Pull to refresh', v3m_ptr_release: 'Release to refresh',
    v3m_ptr_busy: 'Updating prices…', v3m_ptr_done: 'Prices updated', v3m_ptr_sub: 'Quotes as of {t}',
    v3m_ss_t: 'Sort', v3m_ss_s: 'The list re-sorts instantly', v3m_ss_reset: 'Reset'
  }
});

var V3Market = (function () {
  function $id(id) { return document.getElementById(id); }
  function setText(e, v) { if (e && e.textContent !== v) e.textContent = v; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function futOn() { return !!(S && S.fut && S.fut.view === 'fut'); }
  function shown() { return currentTab === 'market' && currentScreen === 'app-main' && !document.hidden; }

  /* ------------------------------ Пульс рынка ------------------------------ */

  var P = { spark: null, sparkAt: 0, top: null, reveal: 1, stop: null, w: 0, h: 62, capBase: null, fg: null, last: null };

  function calc(ts) {
    var cap = 0, prev = 0, up = 0, n = 0;
    for (var i = 0; i < ASSETS.length; i++) {
      var a = ASSETS[i], c = marketCapOf(a), ch = Engine.change(a, ts);
      if (!(c > 0)) continue;
      cap += c; prev += c / (1 + ch); n++;
      if (ch >= 0) up++;
    }
    var chg = prev > 0 ? cap / prev - 1 : 0, br = n ? up / n : 0.5, mood = Math.tanh(chg / 0.06);
    /* Формула индекса — та же, что у обзора в js/futures.js (calcOverview). */
    var fg = Math.round(clamp(50 + mood * 36 + (br - 0.5) * 34, 1, 99));
    /* График за сутки: сумма капитализаций крупнейших монет, 48 точек на
       288 базовых свечей (условные «24 часа» движка). */
    if (!P.spark || ts - P.sparkAt > 15000) {
      P.sparkAt = ts;
      P.top = ASSETS.slice().sort(function (x, y) { return marketCapOf(y) - marketCapOf(x); }).slice(0, 12);
      var sum = null;
      P.top.forEach(function (a) {
        var k = assetSupply(a), cs = Engine.candles(a, 48, 6, ts);
        if (!sum) sum = cs.map(function () { return 0; });
        for (var j = 0; j < sum.length && j < cs.length; j++) sum[j] += cs[j].c * k;
      });
      P.spark = sum && sum.length > 1 ? sum : null;
    }
    if (P.spark) {
      var live = 0;
      P.top.forEach(function (a) { live += marketCapOf(a); });
      P.spark[P.spark.length - 1] = live;
    }
    return { cap: cap, chg: chg, up: up, down: n - up, fg: fg };
  }

  /* Сглаженная линия (Catmull-Rom → кубические Безье). */
  function smooth(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
        p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }
  function yAt(pts, x) {
    for (var i = 1; i < pts.length; i++) {
      if (pts[i][0] >= x) {
        var a = pts[i - 1], b = pts[i], f = (x - a[0]) / ((b[0] - a[0]) || 1);
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    return pts[pts.length - 1][1];
  }
  function drawChart() {
    var v = P.spark, svg = $id('mkp-svg');
    if (!v || !svg) return;
    var w = svg.clientWidth || 0;
    if (w < 50) return;
    if (w !== P.w) { P.w = w; svg.setAttribute('viewBox', '0 0 ' + w + ' ' + P.h); }
    var mn = Infinity, mx = -Infinity;
    for (var i = 0; i < v.length; i++) { if (v[i] < mn) mn = v[i]; if (v[i] > mx) mx = v[i]; }
    var rg = (mx - mn) || mx * 0.001 || 1;
    mn -= rg * 0.12; mx += rg * 0.12;
    var W = w - 12, pts = [];
    for (var j = 0; j < v.length; j++) pts.push([j / (v.length - 1) * W, 6 + (1 - (v[j] - mn) / (mx - mn)) * (P.h - 12)]);
    var d = smooth(pts);
    $id('mkp-line').setAttribute('d', d);
    $id('mkp-area').setAttribute('d', d + 'L' + W + ',' + (P.h + 14) + 'L0,' + (P.h + 14) + 'Z');
    var x = P.reveal * W, y = yAt(pts, x);
    $id('mkp-clip-r').setAttribute('width', (x + 6).toFixed(1));
    ['mkp-dot', 'mkp-ring'].forEach(function (id) {
      var e = $id(id);
      e.setAttribute('cx', x.toFixed(1));
      e.setAttribute('cy', y.toFixed(1));
    });
    $id('mkp-chart').classList.toggle('down', v[v.length - 1] < v[0]);
  }

  function fgLevel(v) { return v < 25 ? 1 : v < 45 ? 2 : v <= 55 ? 3 : v <= 75 ? 4 : 5; }
  var FG_COL = ['', 'var(--down)', 'var(--down)', 'var(--gold)', 'var(--up)', 'var(--up)'];

  function setGauge(v, ms) {
    var box = $id('mkp-fg');
    if (!box) return;
    $id('mkp-fg-needle').style.transform = 'rotate(' + (-90 + v * 1.8).toFixed(1) + 'deg)';
    $id('mkp-fg-arc').style.strokeDasharray = v.toFixed(1) + ' 100';
    var l = fgLevel(v), lbl = t('fut_fg_' + l);
    box.style.setProperty('--fgc', FG_COL[l]);
    setText($id('mkp-fg-l'), lbl);
    box.setAttribute('aria-label', t('v3m_fg', { v: v, l: lbl }));
    V3.countTo($id('mkp-fg-v'), v, function (x) { return String(Math.round(x)); }, ms);
  }
  function setBreadth(up, dn, ms) {
    $id('mkp-bu').style.flexGrow = Math.max(up, 0.001);
    $id('mkp-bd').style.flexGrow = Math.max(dn, 0.001);
    var f = function (x) { return String(Math.round(x)); };
    V3.countTo($id('mkp-up'), up, f, ms);
    V3.countTo($id('mkp-dn'), dn, f, ms);
  }

  function capFmt(v) { return money(v / 1e9, 1); }

  function renderPulse(intro) {
    var capEl = $id('mkp-cap');
    if (!capEl) return;
    var ts = now(), m = calc(ts);
    P.last = m;
    setText($id('mkp-unit'), t('big_b'));
    if (intro && !V3.reduced()) {
      /* Вход на вкладку (как intro() концепта): табло собирается из нулей и
         через 320 мс докручивается барабанами с шагом 34 мс по цифрам;
         стрелка — с 560 мс, счётчики растут/падают — с нуля, полоса
         разворачивается из центра. */
      var zero = capFmt(m.cap).replace(/\d/g, '0');
      capEl.innerHTML = V3.odoHTML(zero);
      capEl.__odoTxt = zero;
      capEl.__odoV = null;
      Array.prototype.forEach.call(capEl.querySelectorAll('.odo-d'), function (d, j) { d.style.setProperty('--j', j); });
      capEl.classList.add('mkp-roll');
      P.hold = true;
      clearTimeout(capEl.__rt);
      clearTimeout(capEl.__rt2);
      capEl.__rt2 = setTimeout(function () {
        var c = P.last ? P.last.cap : m.cap;
        V3.odo(capEl, c, { fmt: capFmt });
        P.capBase = c;
      }, V3.D(320) + 30);
      capEl.__rt = setTimeout(function () { capEl.classList.remove('mkp-roll'); }, V3.D(1900) + 60);
      var nd = $id('mkp-fg-needle'), arc = $id('mkp-fg-arc');
      nd.style.transition = 'none';
      arc.style.transition = 'none';
      nd.style.transform = 'rotate(-90deg)';
      arc.style.strokeDasharray = '0 100';
      V3.reflow($id('mkp-fg'));
      nd.style.transition = '';
      arc.style.transition = '';
      $id('mkp-fg-v').__v3v = 0;
      $id('mkp-fg-v').textContent = '0';
      $id('mkp-up').__v3v = 0;
      $id('mkp-dn').__v3v = 0;
      clearTimeout(P.gT);
      P.gT = setTimeout(function () { P.hold = false; if (P.last) setGauge(P.last.fg, 1100); }, V3.D(560));
      setBreadth(m.up, m.down, 900);
      var bar = $id('mkp-bu') && $id('mkp-bu').parentNode;
      if (bar && bar.animate) {
        bar.animate([{ transform: 'scaleX(0)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: V3.D(850), delay: V3.D(480), easing: 'cubic-bezier(.3,1.1,.4,1)', fill: 'backwards' });
      }
      revealChart(300);
    } else {
      if (!P.hold) {
        V3.odo(capEl, m.cap, { fmt: capFmt });
        /* Концепт: табло вспыхивает, если за тик рынок сдвинулся > 0.3%. */
        if (P.capBase != null && Math.abs(m.cap - P.capBase) / m.cap > 0.003) V3.flash(capEl, m.cap > P.capBase ? 1 : -1);
        P.capBase = m.cap;
      }
      if (P.fg !== m.fg && !P.hold) setGauge(m.fg, P.fg == null ? 0 : 600);
      if (!P.hold) setBreadth(m.up, m.down, P.fg == null ? 0 : 500);
      if (!P.stop) drawChart();
    }
    if (P.capBase == null) P.capBase = m.cap;
    P.fg = m.fg;
    $id('mkp-pill').classList.toggle('down', m.chg < 0);
    setText($id('mkp-pct'), (m.chg >= 0 ? '+' : '\u2212') + (Math.abs(m.chg) * 100).toFixed(2) + '%');
    var d = new Date();
    setText($id('mkp-upd'), t('v3m_upd', { t: pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) }));
  }
  function revealChart(delay) {
    if (P.stop) P.stop();
    P.reveal = 0;
    drawChart();
    P.stop = function () {};
    setTimeout(function () {
      P.stop = V3.tween(1300, function (p) { P.reveal = V3.easeOut(clamp(p, 0, 1)); drawChart(); },
        function () { P.stop = null; P.reveal = 1; drawChart(); });
    }, V3.D(delay || 0));
  }

  /* ------------------------------ Спот / Фьючерсы ------------------------------ */

  function perps() {
    return (typeof Fut !== 'undefined' && Fut.PERP_IDS ? Fut.PERP_IDS : []).map(assetById).filter(Boolean);
  }
  function segCounts() {
    var seg = $id('mkt-seg');
    if (!seg) return;
    var n = { spot: ASSETS.length, fut: perps().length };
    Array.prototype.forEach.call(seg.querySelectorAll('button[data-view]'), function (b) {
      var em = b.querySelector('.mk-seg-n');
      if (!em) {
        em = document.createElement('em');
        em.className = 'mk-seg-n mono';
        var lbl = b.querySelector('[data-i18n]');
        if (lbl && lbl.nextSibling) b.insertBefore(em, lbl.nextSibling); else b.appendChild(em);
      }
      setText(em, String(n[b.getAttribute('data-view')] || 0));
    });
  }

  /* ------------------------------ Категории ------------------------------ */

  function chipData(fut) {
    var keys = ['all'].concat(MARKET_CATS, ['other']);
    if (!fut) return keys.map(function (k) { return { k: k, n: marketCatCount(k) }; });
    /* Фьючерсы, как в концепте, фильтруются по максимальному плечу. */
    var ps = perps(), have = {};
    ps.forEach(function (a) { var l = String(levOf(a)); have[l] = (have[l] || 0) + 1; });
    return ['all', '50', '25', '20', '10'].filter(function (k) { return k === 'all' || have[k]; })
      .map(function (k) { return { k: k, n: k === 'all' ? ps.length : have[k], lev: k !== 'all' }; });
  }
  function levOf(a) { try { return Fut.maxLev(a); } catch (e) { return 0; } }
  var BOLT = '<span class="mk-lvb" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z"/></svg></span>';
  function curCat(fut) { return fut ? ((S.fut && S.fut.levF) || 'all') : (S.marketCat || 'all'); }

  function buildChips(box, fut, animate) {
    if (!box) return;
    var data = chipData(fut), sig = LANG + '|' + data.map(function (c) { return c.k + c.n; }).join(',');
    var cur = curCat(fut);
    if (box.__sig !== sig) {
      box.__sig = sig;
      var html = '<i class="mk-cind" aria-hidden="true"></i>';
      data.forEach(function (c, i) {
        html += '<button type="button" class="mk-chip' + (animate ? ' in' : '') + '" role="tab" data-cat="' + c.k + '" style="--i:' + Math.min(i, 8) + '">' +
          (c.lev ? BOLT : catIcon(c.k)) + '<span>' + esc(c.k === 'all' ? t('v3m_all') : c.lev ? t('fut_lev_upto', { x: c.k }) : t('cat_' + c.k)) + '</span><em class="mono">' + c.n + '</em></button>';
      });
      box.innerHTML = html;
      box.__cur = null;
    }
    if (box.__cur !== cur) {
      var first = box.__cur == null;
      box.__cur = cur;
      Array.prototype.forEach.call(box.querySelectorAll('.mk-chip'), function (c) {
        var on = c.getAttribute('data-cat') === cur;
        c.classList.toggle('on', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      moveCind(box, first);
      if (first) {
        var sel = box.querySelector('.mk-chip.on');
        if (sel && sel.offsetWidth) box.scrollLeft = Math.max(0, sel.offsetLeft - (box.clientWidth - sel.offsetWidth) / 2);
      }
    }
  }
  /* Индикатор-«таблетка» переезжает под выбранный чип. Пока вкладка
     скрыта, размеров нет — пробуем на следующих кадрах. */
  function moveCind(box, instant, tries) {
    var ind = box.querySelector('.mk-cind'), on = box.querySelector('.mk-chip.on');
    if (!ind) return;
    if (!on) { ind.style.opacity = '0'; return; }
    if (!on.offsetWidth) {
      if ((tries || 0) < 40) requestAnimationFrame(function () { moveCind(box, true, (tries || 0) + 1); });
      return;
    }
    if (instant) ind.style.transition = 'none';
    ind.style.opacity = '1';
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    if (instant) { V3.reflow(ind); ind.style.transition = ''; }
  }

  /* Если список уже прокручен, держим его начало прямо под панелью поиска. */
  function keepTools(tools, head) {
    var pages = $id('pages');
    if (!pages || !tools || !head) return;
    var target = head.offsetTop - tools.offsetHeight - 6;
    if (pages.scrollTop > target) pages.scrollTop = Math.max(0, target);
  }
  function centerChip(box, btn) {
    if (box && btn) box.scrollTo({ left: btn.offsetLeft - (box.clientWidth - btn.offsetWidth) / 2, behavior: V3.reduced() ? 'auto' : 'smooth' });
  }

  function setSpotCat(k, btn) {
    if ((S.marketCat || 'all') === k) return;
    S.marketCat = k;
    pendingCat = k;
    saveState(true);
    centerChip($id('mk-chips'), btn);
    keepTools($id('mk-tools'), $id('mk-lhead'));
    renderMarket();
    syncFavHeader();
    FX.vibrate(6);
  }
  function setFutCat(k, btn) {
    if (!S.fut || (S.fut.levF || 'all') === k) return;
    S.fut.levF = k;
    saveState(false);
    centerChip($id('mk-fchips'), btn);
    keepTools($id('mk-ftools'), $id('mk-flhead'));
    Fut.render();
    FX.vibrate(6);
  }

  /* ------------------------------ Шапка списка ------------------------------ */

  var FUND_ICO = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#e9b640"/><path d="M19 29l10-10" stroke="#221703" stroke-width="3" stroke-linecap="round"/><circle cx="19.2" cy="19.2" r="2.6" fill="#221703"/><circle cx="28.8" cy="28.8" r="2.6" fill="#221703"/></svg>';
  function sortIcon(k) {
    if (k === 'funding') return FUND_ICO;
    var o = SORT_OPTIONS.filter(function (x) { return x.k === k; })[0] || SORT_OPTIONS[0];
    return '<img src="' + o.img + '" alt="" draggable="false">';
  }
  function futPlural(n) {
    var a = n % 10, b = n % 100;
    if (LANG !== 'ru') return n === 1 ? t('fut_c_one') : t('fut_c_many');
    if (a === 1 && b !== 11) return t('fut_c_one');
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t('fut_c_few');
    return t('fut_c_many');
  }
  function lhead(fut, animate) {
    var head = $id(fut ? 'mk-flhead' : 'mk-lhead');
    if (!head) return;
    var list = $id(fut ? 'fut-list' : 'market-list');
    var n = list ? list.querySelectorAll(fut ? '[data-perp]' : '.asset-row:not(.mk-ghost)').length : 0;
    var word = fut ? futPlural(n) : coinsPlural(n).replace(String(n), '').trim();
    var nEl = head.querySelector('.mk-lh-n');
    var html = '<b class="mono">' + n + '</b> ' + esc(word);
    if (nEl.__h !== html) {
      var bump = nEl.__h != null && animate;
      nEl.innerHTML = html;
      nEl.__h = html;
      if (bump) nEl.querySelector('b').classList.add('bump');
    }
    var key = fut ? (S.fut && S.fut.sortKey) || 'cap' : S.sortKey || 'cap';
    var dir = fut ? (S.fut && S.fut.sortDir) || 'desc' : S.sortDir || 'desc';
    var sEl = head.querySelector('.mk-lh-s'), lbl = t('v3m_s_' + key);
    if (sEl.textContent !== lbl || sEl.__k !== key) {
      var swap = sEl.__k != null && animate;
      sEl.textContent = lbl;
      sEl.__k = key;
      head.querySelector('.mk-lh-ico').innerHTML = sortIcon(key);
      if (swap) { sEl.classList.remove('swap-in'); V3.reflow(sEl); sEl.classList.add('swap-in'); }
    }
    head.classList.toggle('asc', dir === 'asc');
    head.classList.toggle('az', key === 'az');
  }

  /* ------------------------------ Поиск ------------------------------ */

  var PH = { spot: ['Bitcoin', 'SOL', 'Dogecoin', 'TAO', 'Ethereum', 'PEPE'], fut: ['BTC', 'ETH', 'HYPE', 'LINK', 'XRP'] };
  var phI = 0;
  function phNext(box, words, first) {
    if (!box) return;
    var word = words[phI % words.length];
    Array.prototype.forEach.call(box.querySelectorAll('span'), function (old) {
      if (first) { old.remove(); return; }
      old.className = 'out';
      setTimeout(function () { old.remove(); }, V3.D(360) + 30);
    });
    var s = document.createElement('span');
    s.className = first ? '' : 'in';
    s.innerHTML = esc(t('v3m_search')) + ' <b>' + esc(word) + '</b>';
    box.appendChild(s);
  }
  function phReset(fut) { phNext($id(fut ? 'mk-fph' : 'mk-ph'), PH[fut ? 'fut' : 'spot'], true); }
  function phTick() {
    if (!shown() || V3.reduced()) return;
    var fut = futOn(), inp = $id(fut ? 'fut-search' : 'market-search');
    if (!inp || inp.value || document.activeElement === inp) return;
    phI++;
    phNext($id(fut ? 'mk-fph' : 'mk-ph'), PH[fut ? 'fut' : 'spot'], false);
  }

  /* Панель поиска «прилипла» к верху — появляется нижняя граница и тень. */
  function syncStuck() {
    var pages = $id('pages');
    if (!pages) return;
    var top = pages.getBoundingClientRect().top;
    ['mk-tools', 'mk-ftools'].forEach(function (id) {
      var e = $id(id);
      if (!e || !e.offsetParent) return;
      e.classList.toggle('stuck', pages.scrollTop > 8 && e.getBoundingClientRect().top <= top + 1);
    });
  }

  /* ------------------------------ Фьючерсы: каркас ------------------------------ */

  var MAG = '<svg class="mk-mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  var ARR = '<svg class="mk-lh-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';

  function mountFut() {
    var view = $id('fut-view'), card = view && view.querySelector('.fut-search'), list = $id('fut-list');
    if (!card || !list || $id('mk-ftools')) return;
    var tools = document.createElement('div');
    tools.className = 'mk-tools';
    tools.id = 'mk-ftools';
    card.parentNode.insertBefore(tools, card);
    tools.appendChild(card);
    card.insertAdjacentHTML('afterbegin', MAG);
    var inp = $id('fut-search');
    if (inp) inp.insertAdjacentHTML('afterend', '<span class="mk-ph" id="mk-fph" aria-hidden="true"></span>');
    tools.insertAdjacentHTML('beforeend', '<div class="mk-chips" id="mk-fchips" role="tablist" data-i18n-aria="v3m_cats"></div>');
    list.insertAdjacentHTML('beforebegin', '<div class="mk-lhead" id="mk-flhead"><span class="mk-lh-n"></span>' +
      '<button type="button" class="mk-lh-sort" data-i18n-aria="sort_aria"><span class="mk-lh-ico"></span><span class="mk-lh-s"></span>' + ARR + '</button></div>');
    var xf = view.querySelector('.fut-xfer');
    if (xf && !xf.querySelector('.mk-xf-h')) xf.insertAdjacentHTML('afterbegin', '<div class="mk-xf-h" data-i18n="v3m_accounts">' + esc(t('v3m_accounts')) + '</div>');
    if (xf) mountAccounts(xf);
    $id('mk-fchips').addEventListener('click', function (e) {
      var b = e.target.closest('.mk-chip');
      if (b) setFutCat(b.getAttribute('data-cat'), b);
    });
    $id('mk-flhead').querySelector('.mk-lh-sort').addEventListener('click', function () {
      var s = $id('fut-sort');
      if (s) s.click();
    });
    /* Список фьючерсов перестраивает futures.js сам (поиск, сортировка,
       живая пересортировка) — шапку и чипы подтягиваем по факту изменений. */
    if (window.MutationObserver) {
      new MutationObserver(function () { if (futOn()) syncFut(true); }).observe(list, { childList: true });
    }
  }

  /* ------------------------------ Фьючерсы: «Счета» ------------------------------ */

  /* Карточка как в концепте: отсчёт до фандинга, подписи под кошельками,
     направление перевода переключается стрелкой, сумма — чипами 25/50/Всё,
     перевод — сразу из карточки (полная шторка перевода осталась на экране
     контракта и в шите ордера). */
  var XA = { frac: 0.5, busy: false };
  var ARR_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function xDir() { return S.fut && S.fut.xferDir === 'toSpot' ? 'toSpot' : 'toFut'; }
  function xSrc() { return xDir() === 'toFut' ? Math.max(0, S.balance) : Math.max(0, (S.fut && S.fut.cash) || 0); }
  function xAmt() { var s = xSrc(); return XA.frac >= 1 ? Math.floor(s * 100 + 1e-6) / 100 : Math.floor(s * XA.frac); }
  function cashFmt(v) { return money(v, Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2); }
  function posWord(n) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return t('v3m_pos_1');
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t('v3m_pos_2');
    return t('v3m_pos_5');
  }
  function mountAccounts(xf) {
    if (xf.querySelector('.mk-xf-top')) return;
    var h = xf.querySelector('.mk-xf-h');
    var top = document.createElement('div');
    top.className = 'mk-xf-top';
    xf.insertBefore(top, h);
    top.appendChild(h);
    top.insertAdjacentHTML('beforeend', '<span class="mk-fcd"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="t" cx="18" cy="18" r="15.9" pathLength="100"/>' +
      '<circle class="p" id="mk-fcd-p" cx="18" cy="18" r="15.9" pathLength="100"/></svg><span id="mk-fcd-l"></span> <b class="mono" id="mk-fcd-v">—</b></span>');
    var cells = xf.querySelectorAll('.fx-cell');
    if (cells[0]) { cells[0].classList.add('mk-xs'); cells[0].insertAdjacentHTML('beforeend', '<i class="mk-xf-s" id="mk-xs-s"></i>'); }
    if (cells[1]) { cells[1].classList.add('mk-xfut'); cells[1].insertAdjacentHTML('beforeend', '<i class="mk-xf-s" id="mk-xf-s"></i>'); }
    var sw = xf.querySelector('.fx-swap'), go = xf.querySelector('.fx-btn');
    if (sw) {
      sw.removeAttribute('data-fxopen');
      sw.setAttribute('data-i18n-aria', 'fut_a11y_swap');
      sw.setAttribute('aria-label', t('fut_a11y_swap'));
      sw.innerHTML = ARR_R;
      sw.addEventListener('click', function () {
        if (!S.fut) return;
        S.fut.xferDir = xDir() === 'toFut' ? 'toSpot' : 'toFut';
        saveState(false);
        FX.vibrate(8);
        syncAccounts();
      });
    }
    if (go) {
      go.removeAttribute('data-fxopen');
      go.removeAttribute('data-i18n');
      go.classList.add('mk-xgo');
      var row = document.createElement('div');
      row.className = 'mk-xrow';
      row.innerHTML = '<div class="mk-xchips" role="group">' + [0.25, 0.5, 1].map(function (f) {
        return '<button type="button" data-xf="' + f + '"' + (f === XA.frac ? ' class="on"' : '') + '>' + (f === 1 ? '<span data-i18n="v3m_x_all">' + esc(t('v3m_x_all')) + '</span>' : (f * 100) + '%') + '</button>';
      }).join('') + '</div>';
      go.parentNode.insertBefore(row, go);
      row.appendChild(go);
      row.insertAdjacentHTML('afterend', '<p class="mk-xhint" data-i18n="v3m_x_hint">' + esc(t('v3m_x_hint')) + '</p>');
      row.querySelector('.mk-xchips').addEventListener('click', function (e) {
        var b = e.target.closest('[data-xf]');
        if (!b) return;
        XA.frac = +b.getAttribute('data-xf');
        Array.prototype.forEach.call(this.children, function (c) { c.classList.toggle('on', c === b); });
        syncAccounts();
      });
      go.addEventListener('click', function () { quickXfer(go); });
    }
    syncAccounts();
  }
  function syncAccounts() {
    var go = document.querySelector('#fut-view .mk-xgo');
    if (!go) return;
    var toFut = xDir() === 'toFut';
    setText(go, t('fut_xfer_do', { x: cashFmt(xAmt()) }));
    var sp = document.querySelector('#fut-view .mk-xs'), fu = document.querySelector('#fut-view .mk-xfut');
    if (sp) sp.classList.toggle('mk-dst', !toFut);
    if (fu) fu.classList.toggle('mk-dst', toFut);
    var sw = document.querySelector('#fut-view .fut-xfer .fx-swap');
    if (sw) sw.classList.toggle('rev', !toFut);
    var np = S.fut && S.fut.pos ? S.fut.pos.length : 0;
    setText($id('mk-xs-s'), t('v3m_x_free'));
    setText($id('mk-xf-s'), np ? t('v3m_x_pos', { n: np, w: posWord(np) }) : t('v3m_x_nopos'));
    /* Фандинг раз в час по часам движка, как в js/futures.js. */
    var H = 3600000, ms = H - now() % H, s = Math.floor(ms / 1000);
    setText($id('mk-fcd-l'), t('v3m_x_fund'));
    setText($id('mk-fcd-v'), pad(Math.floor(s / 60)) + ':' + pad(s % 60));
    var p = $id('mk-fcd-p');
    if (p) p.style.strokeDasharray = ((1 - ms / H) * 100).toFixed(2) + ' 100';
  }
  function quickXfer(btn) {
    if (XA.busy || typeof Fut === 'undefined' || !Fut.xferNow) return;
    var toFut = xDir() === 'toFut', amt = xAmt();
    if (!(amt >= 1)) {
      toast(t('fut_xfer_zero'), 'bad', { sub: t(toFut ? 'v3m_x_empty_s' : 'v3m_x_empty_f') });
      if (FX.nudge) FX.nudge(btn);
      return;
    }
    var from = document.querySelector('#fut-view ' + (toFut ? '.mk-xs' : '.mk-xfut'));
    var to = document.querySelector('#fut-view ' + (toFut ? '.mk-xfut' : '.mk-xs'));
    XA.busy = true;
    btn.disabled = true;
    FX.fly(FX.center(from), to, { count: 6, size: 20, onHit: function () {
      XA.busy = false;
      btn.disabled = false;
      var done = Fut.xferNow(toFut ? 'toFut' : 'toSpot', amt);
      syncAccounts();
      if (!done) return;
      if (to && !V3.reduced()) { to.classList.remove('mk-pop'); V3.reflow(to); to.classList.add('mk-pop'); }
      var c = FX.center(to);
      FX.floatText(c.x, c.y - 18, '+' + cashFmt(done), 'up');
      FX.vibrate([10, 30, 16]);
      toast(t('v3m_x_done', { x: cashFmt(done) }), 'ok', { sub: t(toFut ? 'v3m_x_tf' : 'v3m_x_ts') });
    } });
  }

  /* ------------------------------ Связка ------------------------------ */

  function syncSpot(animate) {
    buildChips($id('mk-chips'), false, false);
    lhead(false, animate);
    var sb = $id('market-sort');
    if (sb) sb.classList.toggle('mod', (S.sortKey || 'cap') !== 'cap' || (S.sortDir || 'desc') !== 'desc');
  }
  function syncFut(animate) {
    buildChips($id('mk-fchips'), true, false);
    lhead(true, animate);
  }

  function intro() {
    var fut = futOn();
    segCounts();
    renderPulse(true);
    var chips = $id(fut ? 'mk-fchips' : 'mk-chips');
    if (chips) {
      chips.__sig = null;
      buildChips(chips, fut, !V3.reduced());
    }
    phReset(fut);
    syncStuck();
    /* Строки входят после «Пульса» (концепт: rowsIn(view, 330)). */
    if (!fut) rowsIn($id('market-list'), 330);
  }

  /* ------------------------------ Строки ------------------------------ */

  /* Каскад строк: 45 мс на строку (не больше 10 шагов), спарклайн
     дорисовывается через 160 мс после строки. */
  function rowsIn(listEl, base) {
    if (!listEl || V3.reduced()) return;
    var rows = listEl.children, k = 0;
    for (var i = 0; i < rows.length && k < 14; i++) {
      var r = rows[i];
      if (r.classList.contains('empty') || r.classList.contains('mk-ghost')) continue;
      r.classList.remove('mk-in');
      r.style.setProperty('--d', String((base || 0) + Math.min(k, 10) * 45));
      V3.reflow(r);
      r.classList.add('mk-in');
      k++;
    }
    clearTimeout(listEl.__mkin);
    listEl.__mkin = setTimeout(function () {
      Array.prototype.forEach.call(listEl.querySelectorAll('.mk-in'), function (r) { r.classList.remove('mk-in'); });
    }, V3.D((base || 0) + 10 * 45 + 1200));
  }

  /* Смена фильтра, поиска или сортировки (render(view, 'flip') концепта):
     оставшиеся строки переезжают на новые места, новые проявляются
     лесенкой, а ушедшие тают копией на старом месте. main.js/futures.js
     пересобирают список целиком, поэтому строки сопоставляем по ключу. */
  function rowKey(el) {
    if (!el || el.nodeType !== 1 || el.classList.contains('mk-ghost')) return null;
    var id = el.getAttribute('data-asset') || el.getAttribute('data-perp');
    if (id) return 'r:' + id;
    if (el.classList.contains('fav-h')) return 'h:fav';
    if (el.classList.contains('market-all-h')) return 'h:all';
    if (el.classList.contains('letter-h')) return 'h:L:' + el.textContent;
    return null;
  }
  function killGhosts(box) {
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll(':scope > .mk-ghost'), function (g) { g.remove(); });
  }
  var noFlip = 0;
  function flipSnap(box) {
    killGhosts(box);
    var pages = $id('pages');
    /* Вход на вкладку или смена Спот/Фьючерсы — там свой каскад. */
    if (noFlip || !box || !pages || !box.animate || V3.reduced() || !box.children.length || !box.offsetParent ||
        currentTab !== 'market' || document.hidden) return null;
    var items = [];
    Array.prototype.forEach.call(box.children, function (el) {
      var k = rowKey(el);
      if (k) items.push({ k: k, el: el, r: el.getBoundingClientRect() });
    });
    return { box: box, items: items };
  }
  function ghost(box, el, r, br) {
    var g = el.parentNode ? el.cloneNode(true) : el;
    /* Отцепленная строка сохраняет нарисованный спарклайн; ключи снимаем,
       чтобы копию не нашли селекторы main.js. */
    g.removeAttribute('data-asset');
    g.removeAttribute('data-perp');
    Array.prototype.forEach.call(g.querySelectorAll('[data-spark]'), function (c) { c.removeAttribute('data-spark'); });
    g.classList.remove('mk-in', 'mk-rise', 'mk-fall', 'flip-mute');
    g.classList.add('mk-ghost');
    g.setAttribute('aria-hidden', 'true');
    g.tabIndex = -1;
    g.style.cssText = 'top:' + (r.top - br.top).toFixed(1) + 'px;left:' + (r.left - br.left).toFixed(1) + 'px;width:' +
      r.width.toFixed(1) + 'px;height:' + r.height.toFixed(1) + 'px';
    box.appendChild(g);
    var an = g.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }],
      { duration: V3.D(240), easing: 'ease-in', fill: 'forwards' });
    an.onfinish = function () { g.remove(); };
  }
  function flipPlay(snap) {
    var box = snap.box, pages = $id('pages');
    if (!box.isConnected || !pages) return;
    var pr = pages.getBoundingClientRect(), br = box.getBoundingClientRect(), now = {}, first = {};
    Array.prototype.forEach.call(box.children, function (el) { var k = rowKey(el); if (k) now[k] = el; });
    snap.items.forEach(function (it) {
      first[it.k] = it.r;
      if (now[it.k] || it.el.parentNode === box) return;
      if (it.r.bottom > pr.top && it.r.top < pr.bottom) ghost(box, it.el, it.r, br);
    });
    var ni = 0;
    Array.prototype.forEach.call(box.children, function (el) {
      var k = rowKey(el);
      if (!k) return;
      var f = first[k], l = el.getBoundingClientRect();
      var onScreen = l.bottom > pr.top - 40 && l.top < pr.bottom + 40;
      if (f) {
        /* Строка осталась: спарклайн уже был нарисован — без повторной прорисовки. */
        if (k.charAt(0) === 'r' && typeof drawSparks === 'function') { try { drawSparks(false, el); } catch (e) { /* пусто */ } }
        var dy = f.top - l.top;
        if (Math.abs(dy) < 1 || (!onScreen && (f.bottom < pr.top || f.top > pr.bottom))) return;
        el.animate([{ transform: 'translateY(' + dy.toFixed(1) + 'px)' }, { transform: 'none' }],
          { duration: V3.D(560), easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else if (onScreen) {
        el.animate([{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }],
          { duration: V3.D(460), delay: V3.D(Math.min(ni++, 8) * 40), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      }
    });
  }
  /* Замер «после» — микрозадачей: вызывающий код (syncFavHeader, прокрутка
     к началу) успевает достроить список до первого кадра. */
  function flipLater(snap) {
    if (!snap) return;
    Promise.resolve().then(function () { flipPlay(snap); });
  }

  /* ------------------------------ Потяни, чтобы обновить ------------------------------ */

  /* Как в концепте и во вкладке «Портфель»: вкладка съезжает за пальцем
     или мышью, золотая монета крутится, затем «Пульс» прорисовывается
     заново, а строки входят лесенкой. */
  function bindPtr() {
    var pages = $id('pages'), page = $id('tab-market');
    if (!pages || !page) return;
    var box = document.createElement('div');
    box.className = 'mk-ptr';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<i class="mk-ptr-coin">$</i><span></span>';
    page.appendChild(box);
    var coin = box.firstChild, txt = box.lastChild;
    var y0 = null, x0 = 0, pull = 0, active = false, busy = false, suppress = false, TH = 40;
    function place(d) {
      page.style.translate = d ? '0 ' + d + 'px' : '';
      /* Индикатор стоит у верхнего края ленты, а не едет вместе с вкладкой. */
      box.style.transform = 'translateY(' + (2 - d) + 'px)';
    }
    function can() { return currentTab === 'market' && currentScreen === 'app-main' && pages.scrollTop <= 0 && !busy; }
    function start(x, y, target) {
      if (!can() || (target && target.closest && target.closest('.mk-chips, input, textarea'))) return;
      y0 = y; x0 = x; pull = 0; active = false;
    }
    function move(x, y) {
      if (y0 == null) return false;
      var dy = y - y0;
      if (!active) {
        /* Горизонтальный жест отдаём свайпу вкладок. */
        if (Math.abs(x - x0) > Math.abs(dy)) { if (Math.abs(x - x0) > 8) y0 = null; return false; }
        if (dy > 8 && pages.scrollTop <= 0) active = true;
        else { if (dy < -4) y0 = null; return false; }
      }
      pull = Math.max(0, dy);
      var d = Math.min(110, pull * 0.5);
      page.classList.add('mk-pulling');
      place(d);
      box.style.opacity = String(Math.min(1, d / 36));
      coin.style.transform = 'rotate(' + (pull * 2) + 'deg) scale(' + Math.min(1, 0.5 + d / 80) + ')';
      setText(txt, t(d >= TH ? 'v3m_ptr_release' : 'v3m_ptr_pull'));
      return true;
    }
    function reset() { place(0); box.style.opacity = '0'; coin.style.transform = ''; }
    function end() {
      var was = active;
      active = false; y0 = null;
      if (!was) return;
      page.classList.remove('mk-pulling');
      suppress = true;
      setTimeout(function () { suppress = false; }, 80);
      if (Math.min(110, pull * 0.5) >= TH) refresh(); else reset();
      pull = 0;
    }
    function refresh() {
      busy = true;
      place(58);
      box.style.opacity = '1';
      coin.style.transform = '';
      box.classList.add('spin');
      setText(txt, t('v3m_ptr_busy'));
      FX.vibrate(8);
      setTimeout(function () {
        box.classList.remove('spin');
        reset();
        busy = false;
        if (currentTab !== 'market') return;
        renderPulse(false);
        revealChart(100);
        rowsIn($id(futOn() ? 'fut-list' : 'market-list'), 120);
        var d = new Date();
        toast(t('v3m_ptr_done'), 'ok', { sub: t('v3m_ptr_sub', { t: pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) }) });
      }, 1100);
    }
    pages.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY, e.target); else y0 = null;
    }, { passive: true });
    pages.addEventListener('touchmove', function (e) {
      if (y0 != null && e.touches && move(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault();
    }, { passive: false });
    pages.addEventListener('touchend', end);
    pages.addEventListener('touchcancel', end);
    pages.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && !e.button) start(e.clientX, e.clientY, e.target); });
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && y0 != null) move(e.clientX, e.clientY); });
    window.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') end(); });
    pages.addEventListener('click', function (e) { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  /* Строки рынка собирает main.js: огонёк «В тренде» оборачиваем, чтобы он
     «плясал», а иконку пустого поиска меняем на лупу с монетой из концепта. */
  var EM_ICO = '<span class="mk-em-ico" aria-hidden="true"><svg viewBox="0 0 74 74"><circle cx="30" cy="30" r="19"/><path d="M44 44l16 16"/></svg><i>$</i></span>';
  function decorRows(listEl) {
    if (!listEl) return;
    Array.prototype.forEach.call(listEl.querySelectorAll('.tag-hot'), function (tg) {
      var n = tg.firstChild;
      if (!n || n.nodeType !== 3 || n.nodeValue.indexOf('\uD83D\uDD25') !== 0) return;
      n.nodeValue = n.nodeValue.slice(2);
      var fl = document.createElement('i');
      fl.className = 'mk-fl';
      fl.setAttribute('aria-hidden', 'true');
      fl.textContent = '\uD83D\uDD25';
      tg.insertBefore(fl, n);
    });
    var ico = listEl.querySelector('.empty-search svg.empty-ico');
    if (ico) ico.outerHTML = EM_ICO;
  }

  /* ------------------------------ Шторка сортировки ------------------------------ */

  /* Как ssheet концепта: категории живут в ленте над списком, поэтому в
     шторке только способ и порядок; «Сбросить» — в шапке, за выбранным
     вариантом скользит золотая подложка. Разметку строят main.js
     (#modal-sort) и futures.js (#modal-fsort) — здесь только достраиваем. */
  var SS_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/></svg>';
  function sindMove(box, instant, tries) {
    var si = box.querySelector(':scope > .mk-sind');
    if (!si) {
      si = document.createElement('i');
      si.className = 'mk-sind';
      si.setAttribute('aria-hidden', 'true');
      box.insertBefore(si, box.firstChild);
      instant = true;
    }
    var on = box.querySelector('.sort-opt.sel');
    if (!on) { si.style.opacity = '0'; return; }
    /* Модалка ещё скрыта (futures.js строит варианты до openModal). */
    if (!on.offsetHeight) {
      if ((tries || 0) < 30) requestAnimationFrame(function () { sindMove(box, true, (tries || 0) + 1); });
      return;
    }
    if (instant) si.style.transition = 'none';
    si.style.opacity = '';
    si.style.height = on.offsetHeight + 'px';
    si.style.transform = 'translateY(' + on.offsetTop + 'px)';
    if (instant) { V3.reflow(si); si.style.transition = ''; }
  }
  function sortSheet(id, optsId) {
    var m = $id(id), box = $id(optsId);
    if (!m || !box || m.__mkss) return;
    m.__mkss = true;
    m.classList.add('mk-ss');
    var head = m.querySelector('.sort-head'), ico = head && head.querySelector('.sort-head-ico');
    if (ico) ico.innerHTML = SS_ICO;
    var h2 = head && head.querySelector('h2'), p = head && head.querySelector('p');
    if (h2) { h2.setAttribute('data-i18n', 'v3m_ss_t'); setText(h2, t('v3m_ss_t')); }
    if (p) { p.setAttribute('data-i18n', 'v3m_ss_s'); setText(p, t('v3m_ss_s')); }
    var rs = m.querySelector('.sort-reset');
    if (rs && head) {
      rs.setAttribute('data-i18n', 'v3m_ss_reset');
      setText(rs, t('v3m_ss_reset'));
      rs.classList.add('mk-ss-reset');
      head.appendChild(rs);
    }
    if (!window.MutationObserver) return;
    /* Варианты пересобираются при каждом открытии, выбор — сменой .sel. */
    new MutationObserver(function (recs) {
      var rebuilt = recs.some(function (r) { return r.type === 'childList'; });
      if (rebuilt && box.querySelector(':scope > .mk-sind')) rebuilt = false;
      sindMove(box, rebuilt);
    }).observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  /* ------------------------------ Экран монеты ------------------------------ */

  /* Цена в шапке — табло с барабанами (как #ts-price концепта). Текст
     по-прежнему пишет main.js/futures.js в исходный узел; он остаётся
     для скринридеров, а видимое табло повторяет его. */
  function odoMirror(src) {
    if (!src || src.__mk) return src && src.__mk;
    var o = document.createElement('b');
    o.className = src.className + ' mk-odo';
    o.setAttribute('aria-hidden', 'true');
    src.parentNode.insertBefore(o, src);
    src.classList.add('mk-odo-src');
    src.__mk = o;
    var M = { o: o, src: src, hold: false, base: null, at: 0 };
    o.__m = M;
    /* main.js пишет цену каждый кадр — барабаны крутим не чаще раза в
       полсекунды, иначе цифры не успевают доехать и «дрожат». */
    function sync() {
      var txt = src.textContent;
      if (M.hold || !txt || txt === o.__odoTxt) return;
      var wait = 500 - (Date.now() - (M.last || 0));
      if (wait > 0) {
        if (!M.pend) M.pend = setTimeout(function () { M.pend = 0; sync(); }, wait);
        return;
      }
      M.last = Date.now();
      o.classList.toggle('long', txt.length > 10);
      V3.odo(o, txt, { fmt: String });
      var v = parseFloat(txt.replace(/[^\d.]/g, '')), ts = Date.now();
      if (!(v > 0)) return;
      if (M.base == null) { M.base = v; M.at = ts; return; }
      if (ts - M.at < 1000) return;
      /* Концепт: табло вспыхивает, если цена за секунду сдвинулась > 0.4%. */
      if (Math.abs(v / M.base - 1) > 0.004) V3.flash(o, v > M.base ? 1 : -1);
      M.base = v;
      M.at = ts;
    }
    M.sync = sync;
    if (window.MutationObserver) new MutationObserver(sync).observe(src, { childList: true, characterData: true, subtree: true });
    return o;
  }
  /* Открытие шторки: табло собирается из нулей и докручивается (0.95 с,
     шаг 34 мс по цифрам) через 260 мс. */
  function odoRoll(src) {
    var o = odoMirror(src);
    if (!o) return;
    var M = o.__m, txt = src.textContent;
    M.base = null;
    if (V3.reduced() || !txt || txt === '\u2014') { M.hold = false; M.sync(); return; }
    var zero = txt.replace(/\d/g, '0');
    o.innerHTML = V3.odoHTML(zero);
    o.__odoTxt = zero;
    o.classList.toggle('long', txt.length > 10);
    Array.prototype.forEach.call(o.querySelectorAll('.odo-d'), function (d, j) { d.style.setProperty('--j', j); });
    o.classList.add('mk-roll');
    M.hold = true;
    clearTimeout(M.t1); clearTimeout(M.t2);
    M.t1 = setTimeout(function () { M.hold = false; M.last = 0; M.sync(); }, V3.D(260));
    M.t2 = setTimeout(function () { o.classList.remove('mk-roll'); }, V3.D(1700) + 60);
  }

  /* Свечи вырастают из середины тела слева направо (chGrow концепта):
     прогресс лежит на canvas.__grow, его читает Chart.draw. */
  function chartGrow(cv, redraw, ms, delay) {
    if (!cv) return;
    var tok = (cv.__growTok || 0) + 1;
    cv.__growTok = tok;
    if (V3.reduced()) { cv.__grow = 1; return; }
    cv.__grow = 0;
    if (redraw) redraw();
    setTimeout(function () {
      if (cv.__growTok !== tok) return;
      V3.tween(ms || 950, function (p) {
        if (cv.__growTok !== tok) return;
        cv.__grow = p;
        if (redraw) redraw();
      }, function () { if (cv.__growTok === tok) cv.__grow = 1; });
    }, V3.D(delay || 0));
  }

  var hinted = {};
  /* Подсказка жестов — один раз за сессию на каждом графике (спот и контракт). */
  function chartHint(cvId) {
    cvId = cvId || 'chart';
    if (hinted[cvId]) return;
    var cv = $id(cvId);
    if (!cv) return;
    var hid = cvId === 'chart' ? 'mk-ch-hint' : 'mk-ch-hint-' + cvId;
    var h = $id(hid);
    if (!h) {
      h = document.createElement('div');
      h.id = hid;
      h.className = 'mk-ch-hint';
      h.setAttribute('aria-hidden', 'true');
      cv.parentNode.insertBefore(h, cv.nextSibling);
    }
    setText(h, t('v3m_ch_hint'));
    hinted[cvId] = true;
    h.classList.remove('show');
    V3.reflow(h);
    h.classList.add('show');
  }

  function tradeIntro() {
    var sc = $id('scr-trade');
    odoRoll($id('tr-price'));
    chartGrow($id('chart'), function () { if (currentScreen === 'scr-trade') updateTradePrices(); }, 950, 300);
    chartHint();
    var ic = $id('tr-icon');
    if (ic && sc) { ic.classList.remove('mk-logo-in'); V3.reflow(ic); ic.classList.add('mk-logo-in'); }
  }
  function futChartIntro() {
    odoRoll($id('fc-price'));
    chartGrow($id('fc-chart'), null, 950, 300);
    chartHint('fc-chart');
    var ic = $id('fc-icon');
    if (ic) { ic.classList.remove('mk-logo-in'); V3.reflow(ic); ic.classList.add('mk-logo-in'); }
  }

  /* Смена таймфрейма — свечи вырастают заново (chGrow(560) концепта);
     свечи ⇄ линия — перетекание за 460 мс (у концепта — смешивание кадров,
     здесь — снимок прежнего графика тает поверх нового). */
  function chartOf(b) { return b.closest('#modal-fchart') ? $id('fc-chart') : $id('chart'); }
  function chartRedraw(cv) {
    return cv && cv.id === 'chart' ? function () { if (currentScreen === 'scr-trade') updateTradePrices(); } : null;
  }
  function chartXfade(cv) {
    var host = cv && cv.offsetParent;
    if (!host || !cv.width || !cv.height || V3.reduced() || !cv.animate) return;
    var o = document.createElement('canvas');
    o.className = 'mk-xfade';
    o.setAttribute('aria-hidden', 'true');
    o.width = cv.width; o.height = cv.height;
    try { o.getContext('2d').drawImage(cv, 0, 0); } catch (e) { return; }
    /* Снимок кладём ровно поверх графика. Без position:absolute (CSS для
       .mk-xfade нет) он вставал в поток ПОД графиком и сдвигал карточку —
       при смене свечи ⇄ линия график будто выезжал снизу. */
    o.style.cssText = 'position:absolute;pointer-events:none;z-index:2;margin:0;' +
      'left:' + cv.offsetLeft + 'px;top:' + cv.offsetTop + 'px;width:' + cv.offsetWidth + 'px;height:' + cv.offsetHeight + 'px';
    host.appendChild(o);
    o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: V3.D(460), easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
      .onfinish = function () { o.remove(); };
  }
  function bindChartSwitch() {
    var TF = '#scr-trade .tf-btn, #fc-tfs .ftf', CT = '#chart-type button, #fc-ctype button';
    var pre = null;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest(TF + ', ' + CT);
      pre = null;
      if (!b) return;
      var ct = b.matches(CT);
      pre = { b: b, ct: ct, was: ct ? b.getAttribute('aria-pressed') === 'true' : b.classList.contains('active') };
      if (ct && !pre.was) chartXfade(chartOf(b));
    }, true);
    document.addEventListener('click', function (e) {
      var p = pre;
      pre = null;
      if (!p || p.ct || p.was || !e.target.closest || !p.b.contains(e.target)) return;
      /* Заблокированный таймфрейм остаётся невыбранным — без анимации. */
      setTimeout(function () {
        if (!p.b.classList.contains('active')) return;
        var cv = chartOf(p.b);
        chartGrow(cv, chartRedraw(cv), 560, 0);
      }, 0);
    });
  }

  /* Уведомления (бывший колокольчик на 1%) живут в js/v3-alerts.js. */

  /* Шторка сделки: сумма «подпрыгивает» при выборе процента или «Макс». */
  function bumpAmt() {
    var e = document.querySelector('#modal-trade .tr-io-big:not(.tr-io-big--out)');
    if (!e || V3.reduced()) return;
    e.classList.remove('mk-bump');
    V3.reflow(e);
    e.classList.add('mk-bump');
  }

  /* Открытые ордера: полоска «насколько цена приблизилась к ордеру»
     (oc-bar концепта). Стартовое расстояние — от цены движка в момент
     создания ордера: история детерминирована, в сейв ничего не пишем. */
  var D0 = {};
  function aoBars() {
    var box = $id('ao-list');
    if (!box || !S.limitOrders) return;
    var ts = now();
    Array.prototype.forEach.call(box.querySelectorAll('.ao-item--order'), function (row) {
      var btn = row.querySelector('[data-cancel-lo]'), id = btn && btn.getAttribute('data-cancel-lo');
      var o = null;
      for (var i = 0; i < S.limitOrders.length; i++) if (S.limitOrders[i].id === id) { o = S.limitOrders[i]; break; }
      var a = o && assetById(o.assetId);
      if (!a || !(o.price > 0)) return;
      if (D0[id] == null) {
        var p0 = 0;
        try { p0 = Engine.live(a, o.createdAt || ts); } catch (e) { p0 = 0; }
        D0[id] = p0 > 0 ? Math.abs(o.price / p0 - 1) : 0;
      }
      var p = Engine.live(a, ts), d = p > 0 ? Math.abs(o.price / p - 1) : 0;
      var f = D0[id] > 0 ? clamp(1 - d / D0[id], 0.04, 1) : 0.04;
      var bar = row.querySelector('.mk-ao-bar');
      if (!bar) {
        var main = row.querySelector('.ao-main'), line = main && main.querySelector('.ao-line');
        if (!line) return;
        line.insertAdjacentHTML('afterend', '<div class="mk-ao-bar" aria-hidden="true"><i></i></div>');
        bar = row.querySelector('.mk-ao-bar');
        V3.reflow(bar);
      }
      bar.firstChild.style.width = (f * 100).toFixed(1) + '%';
    });
  }

  /* Экран монеты: под «Купить» — сколько свободно на споте. */
  function tradeBal() {
    var b = $id('buy-btn');
    if (!b) return;
    var s = b.querySelector('.mk-bal');
    if (!s) { s = document.createElement('small'); s.className = 'mk-bal mono'; b.appendChild(s); }
    setText(s, t('v3m_free', { v: money(Math.max(0, S.balance), Math.abs(S.balance - Math.round(S.balance)) < 0.005 ? 0 : 2) }));
  }

  function init() {
    if (!$id('mkp')) return;
    mountFut();
    segCounts();
    decorRows($id('market-list'));

    V3.after('renderMarket', function () { syncSpot(true); });
    V3.after('renderTrade', tradeBal);
    V3.after('setTab', function (r, args) { if (args[0] === 'market' && !args[1]) intro(); });
    var setTab0 = window.setTab;
    window.setTab = function () {
      noFlip++;
      try { return setTab0.apply(this, arguments); } finally { noFlip--; }
    };
    V3.after('setLang', function () {
      segCounts();
      ['mk-chips', 'mk-fchips'].forEach(function (id) { var b = $id(id); if (b) b.__sig = null; });
      syncSpot(false);
      syncFut(false);
      phReset(false);
      phReset(true);
      renderPulse(false);
      tradeBal();
      syncAccounts();
    });
    /* Полная пересборка списка: если он был на экране — FLIP с «тающими»
       копиями ушедших строк; первый показ — каскад строк. */
    var rmFull = window.renderMarketFull;
    if (typeof rmFull === 'function') {
      window.renderMarketFull = function (listEl) {
        var snap = null;
        try { snap = flipSnap(listEl); } catch (e) { snap = null; }
        var r = rmFull.apply(this, arguments);
        try {
          decorRows(listEl);
          if (snap) flipLater(snap);
          else if (listEl && !listEl.classList.contains('no-anim') && !V3.reduced()) rowsIn(listEl, 0);
        } catch (e) { if (window.console) console.error('v3:renderMarketFull', e); }
        return r;
      };
    }
    /* Эти функции ищут строки селекторами — копии к этому моменту убираем. */
    ['syncFavHeader', 'reorderMarketRows'].forEach(function (name) {
      var fn = window[name];
      if (typeof fn !== 'function') return;
      window[name] = function () { killGhosts($id('market-list')); return fn.apply(this, arguments); };
    });
    V3.after('openTrade', tradeIntro);
    V3.after('renderDesk', aoBars);
    var fm = null;
    function watchFutModal() {
      var m = $id('modal-fchart');
      if (!m || fm === m || !window.MutationObserver) return;
      fm = m;
      var was = m.classList.contains('hidden');
      new MutationObserver(function () {
        var hid = m.classList.contains('hidden') || m.classList.contains('modal-out');
        if (was && !hid) futChartIntro();
        was = hid;
      }).observe(m, { attributes: true, attributeFilter: ['class'] });
    }
    watchFutModal();
    setTimeout(watchFutModal, 1500);
    /* «Страх и жадность»: тап объясняет, откуда цифра. */
    var fgBox = $id('mkp-fg');
    if (fgBox) {
      fgBox.setAttribute('role', 'button');
      fgBox.setAttribute('tabindex', '0');
      var fgTap = function () {
        var m = P.last;
        if (!m) return;
        toast(t('v3m_fg_t', { v: m.fg, l: t('fut_fg_' + fgLevel(m.fg)) }), 'gold', { sub: t('v3m_fg_sub') });
      };
      fgBox.addEventListener('click', fgTap);
      fgBox.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fgTap(); } });
    }
    var mt = $id('modal-trade');
    if (mt) mt.addEventListener('click', function (e) {
      if (e.target.closest('#tr-pcts button, #tr-amt-max')) setTimeout(bumpAmt, 0);
    });
    if (typeof Fut !== 'undefined' && Fut.setView) {
      var sv = Fut.setView;
      Fut.setView = function (v) {
        var was = futOn(), r;
        noFlip++;
        try { r = sv.apply(this, arguments); } finally { noFlip--; }
        if (was !== futOn()) {
          if (futOn()) syncFut(true); else syncSpot(true);
          phReset(futOn());
          var box = $id(futOn() ? 'mk-fchips' : 'mk-chips');
          if (box) moveCind(box, true);
        }
        return r;
      };
    }

    $id('mk-chips').addEventListener('click', function (e) {
      var b = e.target.closest('.mk-chip');
      if (b) setSpotCat(b.getAttribute('data-cat'), b);
    });
    $id('mk-lh-sort').addEventListener('click', function () { openSortSheet(); });
    /* Кнопки-тикеры в пустом состоянии поиска: ищем по всему рынку. */
    $id('market-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sug]');
      if (!b) return;
      e.stopPropagation();
      var inp = $id('market-search');
      S.marketCat = 'all';
      pendingCat = 'all';
      inp.value = b.getAttribute('data-sug');
      inp.dispatchEvent(new Event('input'));
    });
    var pages = $id('pages'), raf = 0;
    if (pages) pages.addEventListener('scroll', function () {
      if (raf || currentTab !== 'market') return;
      raf = requestAnimationFrame(function () { raf = 0; syncStuck(); });
    }, { passive: true });
    window.addEventListener('resize', function () {
      ['mk-chips', 'mk-fchips'].forEach(function (id) { var b = $id(id); if (b && b.offsetParent) moveCind(b, true); });
      if (shown()) drawChart();
    });
    /* Лента появилась на экране (вкладка/вид стали видимыми) — ставим
       индикатор под выбранный чип без анимации. */
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function (ents) {
        ents.forEach(function (en) { if (en.contentRect.width > 0) moveCind(en.target, true); });
      });
      ['mk-chips', 'mk-fchips'].forEach(function (id) { var b = $id(id); if (b) ro.observe(b); });
    }

    setInterval(function () {
      if (shown()) { renderPulse(false); if (futOn()) syncAccounts(); }
      else if (currentScreen === 'scr-trade' && !document.hidden) { tradeBal(); aoBars(); }
    }, 1000);
    setInterval(phTick, 3200);
    bindChartSwitch();
    bindPtr();
    sortSheet('modal-sort', 'sort-options');
    sortSheet('modal-fsort', 'fsort-options');
    setTimeout(function () { sortSheet('modal-fsort', 'fsort-options'); }, 1500);
    syncSpot(false);
    syncFut(false);
    phReset(false);
    phReset(true);
    if (currentTab === 'market') intro();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { renderPulse: renderPulse, intro: intro, flipSnap: flipSnap, flipLater: flipLater };
})();
