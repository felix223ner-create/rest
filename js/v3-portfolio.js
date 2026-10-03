/* v3 — вкладка «Портфель» по concept/portfolio.html: табло-одометр капитала,
   SVG-график с морфингом периодов и скрабом, панели «Капитал / Позиции»,
   строки активов с кольцом доли, сортировкой (FLIP) и раскрытием деталей,
   лидер/аутсайдер и последние операции. Данные и расчёты остаются в main.js
   (renderPortfolio и серии), здесь — только отрисовка. */
'use strict';

V3.i18n({
  ru: {
    v3pf_k_cap: 'Общий капитал', v3pf_k_pos: 'В позициях',
    v3pf_r_30M: '30м', v3pf_r_1H: '1ч', v3pf_r_3H: '3ч', v3pf_r_10H: '10ч', v3pf_r_ALL: 'Всё',
    v3pf_per_30M: 'за 30 минут', v3pf_per_1H: 'за час', v3pf_per_3H: 'за 3 часа', v3pf_per_10H: 'за 10 часов', v3pf_per_ALL: 'за всё время',
    v3pf_at: 'на {t}',
    v3pf_free: 'Свободно', v3pf_spot: 'Спот', v3pf_fut: 'Фьючерсы',
    v3pf_in_pf: 'в портфеле', v3pf_profit: 'Прибыль', v3pf_record: 'Рекорд', v3pf_of_cap: 'капитала', v3pf_new: 'новый!',
    v3pf_s_value: 'Стоимость', v3pf_s_pnl: 'Прибыль', v3pf_s_chg: 'За 24 часа', v3pf_24h: '24ч',
    v3pf_more: 'Показать все · {n}', v3pf_less: 'Свернуть',
    v3pf_alloc: 'Распределение', v3pf_tap_seg: 'нажмите на сектор',
    v3pf_leader: 'Лидер', v3pf_outsider: 'Аутсайдер',
    v3pf_profit_sub: '{x} прибыли', v3pf_loss_sub: '{x} убытка',
    v3pf_ops: 'Последние операции',
    v3pf_op_buy: 'Покупка {n}', v3pf_op_sell: 'Продажа {n}', v3pf_op_limit: 'лимит',
    v3pf_op_xin: 'Перевод на фьючерсы', v3pf_op_xin_s: 'Спот → Фьючерсы', v3pf_op_xout: 'Перевод на спот', v3pf_op_xout_s: 'Фьючерсы → Спот',
    v3pf_op_reward: 'Выигрыш в колесе', v3pf_op_reward_coin: 'Приз колеса: {n}', v3pf_op_spin: 'Колесо фортуны',
    v3pf_yesterday: 'вчера',
    v3pf_d_avg: 'Средняя цена', v3pf_d_now: 'Текущая цена', v3pf_d_inv: 'Вложено',
    v3pf_d_pnl: 'Прибыль', v3pf_d_roi: 'Доходность', v3pf_d_c24: 'За 24 часа',
    v3pf_sell: 'Продать', v3pf_buy: 'Докупить',
    v3pf_ptr_pull: 'Потяните, чтобы обновить', v3pf_ptr_release: 'Отпустите, чтобы обновить', v3pf_ptr_busy: 'Обновляем…',
    v3pf_ptr_done: 'Портфель обновлён', v3pf_ptr_sub: 'Цены на {t}',
    v3pf_dc_total: 'Итого в спот', v3pf_assets1: 'актив', v3pf_assets2: 'актива', v3pf_assets5: 'активов'
  },
  en: {
    v3pf_k_cap: 'Total capital', v3pf_k_pos: 'In positions',
    v3pf_r_30M: '30m', v3pf_r_1H: '1h', v3pf_r_3H: '3h', v3pf_r_10H: '10h', v3pf_r_ALL: 'All',
    v3pf_per_30M: 'in 30 min', v3pf_per_1H: 'in 1 hour', v3pf_per_3H: 'in 3 hours', v3pf_per_10H: 'in 10 hours', v3pf_per_ALL: 'all time',
    v3pf_at: 'at {t}',
    v3pf_free: 'Free', v3pf_spot: 'Spot', v3pf_fut: 'Futures',
    v3pf_in_pf: 'in portfolio', v3pf_profit: 'Profit', v3pf_record: 'Record', v3pf_of_cap: 'capital', v3pf_new: 'new!',
    v3pf_s_value: 'Value', v3pf_s_pnl: 'Profit', v3pf_s_chg: '24 hours', v3pf_24h: '24h',
    v3pf_more: 'Show all · {n}', v3pf_less: 'Collapse',
    v3pf_alloc: 'Allocation', v3pf_tap_seg: 'tap a segment',
    v3pf_leader: 'Leader', v3pf_outsider: 'Laggard',
    v3pf_profit_sub: '{x} profit', v3pf_loss_sub: '{x} loss',
    v3pf_ops: 'Recent activity',
    v3pf_op_buy: 'Bought {n}', v3pf_op_sell: 'Sold {n}', v3pf_op_limit: 'limit',
    v3pf_op_xin: 'Transfer to futures', v3pf_op_xin_s: 'Spot → Futures', v3pf_op_xout: 'Transfer to spot', v3pf_op_xout_s: 'Futures → Spot',
    v3pf_op_reward: 'Wheel prize', v3pf_op_reward_coin: 'Wheel prize: {n}', v3pf_op_spin: 'Fortune wheel',
    v3pf_yesterday: 'yesterday',
    v3pf_d_avg: 'Avg price', v3pf_d_now: 'Current price', v3pf_d_inv: 'Invested',
    v3pf_d_pnl: 'Profit', v3pf_d_roi: 'Return', v3pf_d_c24: '24h change',
    v3pf_sell: 'Sell', v3pf_buy: 'Buy more',
    v3pf_ptr_pull: 'Pull to refresh', v3pf_ptr_release: 'Release to refresh', v3pf_ptr_busy: 'Refreshing…',
    v3pf_ptr_done: 'Portfolio updated', v3pf_ptr_sub: 'Prices as of {t}',
    v3pf_dc_total: 'Total in spot', v3pf_assets1: 'asset', v3pf_assets2: 'assets', v3pf_assets5: 'assets'
  }
});

var V3PF = (function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function cls(v) { return v >= 0 ? 'up' : 'down'; }
  function pctTxt(p, d) { return (p >= 0 ? '+' : '\u2212') + Math.abs(p).toFixed(d == null ? 2 : d) + '%'; }
  function arrowPct(p) { return (p >= 0 ? '\u25B2 ' : '\u25BC ') + Math.abs(p).toFixed(2) + '%'; }
  function coinSrc(a) { return a.img || ('img/coins/' + a.id + '.png'); }
  function hm(d) { return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function loc() { return LANG === 'ru' ? 'ru-RU' : 'en-US'; }
  function setTxt(el, s) { if (el && el.textContent !== s) el.textContent = s; }
  function setCls(el, c) { if (el && el.className !== c) el.className = c; }
  function buzz(ms) { if (typeof FX !== 'undefined' && FX.vibrate) { try { FX.vibrate(ms); } catch (e) { /* нет вибро */ } } }
  function plural(n, base) {
    var f = 5;
    if (LANG === 'ru') {
      var a = Math.abs(n) % 100, b = a % 10;
      f = a > 10 && a < 20 ? 5 : b === 1 ? 1 : b > 1 && b < 5 ? 2 : 5;
    } else f = Math.abs(n) === 1 ? 1 : 5;
    return t(base + f);
  }

  /* ---------------- Сегменты с «таблеткой» ---------------- */

  function segMove(box, instant) {
    if (!box) return;
    var ind = $('.v3pf-ind', box), on = $('button.on', box);
    if (!ind || !on || !on.offsetWidth) return;
    if (instant) ind.style.transition = 'none';
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    if (instant) { V3.reflow(ind); ind.style.transition = ''; }
  }
  function segOn(box, pred, instant) {
    if (!box) return;
    $$('button', box).forEach(function (b) {
      var on = !!pred(b);
      b.classList.toggle('on', on);
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    segMove(box, instant);
  }
  function segsInstant() { ['#pf-seg', '#pf-periods', '#pf-sort'].forEach(function (s) { segMove($(s), true); }); }

  /* ---------------- Табло и чип ---------------- */

  var hero = { lastV: null, lastCap: null, scrub: false, base: 0 };
  function per() { return t('v3pf_per_' + (PF_RANGES[pfRange] ? pfRange : '1H')); }
  function setPill(d, base) {
    var pill = $('#pf-pnl');
    if (!pill) return;
    var txt = fmtSigned(d);
    if (base > 1e-6) txt += ' \u00B7 ' + pctTxt(d / base * 100);
    setTxt($('#pf-pnl-txt'), txt);
    pill.classList.toggle('down', d < 0);
  }
  /* Номер цифры для каскада big-roll (задержка --j × 34 мс, как в концепте). */
  function odoIndex(el) { $$('.odo-d > span', el).forEach(function (s, j) { s.style.setProperty('--j', j); }); }
  function odoTo(el, v) { V3.odo(el, v); odoIndex(el); }
  /* Вход: барабаны стоят на нулях, через 260 мс докручиваются каскадом. */
  function odoIntro(el, v) {
    var zero = money(v, 2).replace(/\d/g, '0');
    clearTimeout(el.__introT); clearTimeout(el.__brT);
    el.classList.remove('instant');
    el.classList.add('big-roll');
    el.innerHTML = V3.odoHTML(zero);
    el.__odoTxt = zero;
    el.__odoV = 0;
    odoIndex(el);
    el.__introV = v;
    el.__introT = setTimeout(function () { el.__introT = 0; if (!hero.scrub) { odoTo(el, el.__introV); Snd.play('pnl_count'); } }, V3.D(260) + 30);
    el.__brT = setTimeout(function () { el.classList.remove('big-roll'); }, V3.D(1700) + 60);
  }
  /* Вспышка табло — 1 с, как totUp/totDown концепта (V3.flash снимает класс через 0.65 с). */
  function flashTotal(el, dir) {
    el.classList.remove('pf-fl-up', 'pf-fl-down');
    V3.reflow(el);
    el.classList.add(dir > 0 ? 'pf-fl-up' : 'pf-fl-down');
    clearTimeout(el.__flT);
    el.__flT = setTimeout(function () { el.classList.remove('pf-fl-up', 'pf-fl-down'); }, V3.D(1000) + 60);
  }
  /* headVal — крупное число; headPnl и base — изменение за период и база процента. */
  function renderHero(headVal, headPnl, base, isCap) {
    $$('#pf-kicker em').forEach(function (e) { e.classList.toggle('on', (e.getAttribute('data-m') === 'capital') === isCap); });
    hero.base = base;
    if (hero.scrub) return;
    var el = $('#pf-total');
    if (!el) return;
    var modeSwitch = hero.lastCap !== null && hero.lastCap !== isCap;
    /* Табло крутится не чаще раза в секунду (как в концепте): на тике 500 мс
       барабаны иначе почти не успевают встать и цифры не читаются. */
    var nowT = Date.now(), first = hero.lastV == null || !el.__odoTxt;
    hero.lastCap = isCap;
    setPill(headPnl, base);
    setTxt($('#pf-per'), per());
    if (!first && !modeSwitch && nowT - (hero.odoAt || 0) < 950) return;
    hero.odoAt = nowT;
    el.setAttribute('aria-label', money(headVal));
    if (first) { odoIntro(el, headVal); hero.lastV = headVal; return; }
    if (el.__introT) { el.__introV = headVal; hero.lastV = headVal; return; }
    odoTo(el, headVal);
    /* Вспышка — только на заметном движении (сделка, скачок рынка), не на каждом тике. */
    var moved = hero.lastV != null && headVal > 0 && Math.abs(headVal - hero.lastV) / headVal >= 0.0015;
    if (moved && !modeSwitch) flashTotal(el, headVal - hero.lastV);
    hero.lastV = headVal;
  }

  /* ---------------- График ---------------- */

  var CH = { vals: null, pts: null, ts: null, w: 360, h: 170, reveal: 1, hover: -1, stopMorph: null, stopReveal: null, minSpan: 0, isCap: true, sized: false };
  var TOP = 18, BOT = 20, RIGHT = 16;
  function chBox() { return $('#pf-chart'); }
  function chartSize() {
    var box = chBox(), svg = $('#pf-chart-svg');
    if (!box || !svg) return false;
    var w = box.getBoundingClientRect().width;
    if (!w) return false;
    CH.w = Math.max(200, w);
    CH.h = box.clientHeight || 170;
    svg.setAttribute('viewBox', '0 0 ' + CH.w + ' ' + CH.h);
    var html = '';
    for (var i = 0; i < 3; i++) { var y = TOP + (CH.h - TOP - BOT) * i / 2; html += '<line x1="0" x2="' + CH.w + '" y1="' + y + '" y2="' + y + '"/>'; }
    $('#pfc-grid').innerHTML = html;
    CH.sized = true;
    return true;
  }
  function scaleOf(v) {
    var mn = Infinity, mx = -Infinity;
    for (var i = 0; i < v.length; i++) { if (v[i] < mn) mn = v[i]; if (v[i] > mx) mx = v[i]; }
    /* Капитал не растягиваем по min/max: колебание в 2% не должно выглядеть обвалом. */
    if (CH.minSpan) {
      var mid = (mn + mx) / 2, need = Math.max(1, Math.abs(mid) * CH.minSpan);
      if (mx - mn < need) { mn = mid - need / 2; mx = mid + need / 2; }
    }
    var pad = (mx - mn) * 0.14 || Math.abs(mx) * 0.002 || 1;
    return { mn: mn - pad, mx: mx + pad };
  }
  function smooth(p) {
    var d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
        p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }
  function yAt(pts, x) {
    if (x <= pts[0][0]) return pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      if (pts[i][0] >= x) { var f = (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1); return V3.lerp(pts[i - 1][1], pts[i][1], f); }
    }
    return pts[pts.length - 1][1];
  }
  function attr(el, o) { if (el) for (var k in o) el.setAttribute(k, o[k]); }
  function baseFmt(v) { return CH.isCap ? money(v, 0) : fmtSigned(v).replace(/\.\d+$/, ''); }
  function drawChart() {
    var v = CH.vals, box = chBox();
    if (!v || v.length < 2 || !box) return;
    var sc = scaleOf(v), n = v.length, pw = CH.w - RIGHT, ph = CH.h - TOP - BOT;
    var pts = new Array(n);
    for (var i = 0; i < n; i++) pts[i] = [i / (n - 1) * pw, TOP + (1 - (v[i] - sc.mn) / (sc.mx - sc.mn)) * ph];
    CH.pts = pts;
    var line = smooth(pts);
    attr($('#pfc-line'), { d: line });
    attr($('#pfc-area'), { d: line + 'L' + pw + ',' + CH.h + 'L0,' + CH.h + 'Z' });
    var by = pts[0][1];
    attr($('#pfc-base'), { x1: 0, x2: CH.w, y1: by, y2: by });
    var bl = $('#pfc-base-lbl');
    bl.style.top = by + 'px';
    setTxt(bl, baseFmt(v[0]));
    var rw = CH.reveal * pw;
    attr($('#pfc-rect'), { width: rw + 12 });
    var dx, dy;
    if (CH.hover >= 0 && pts[CH.hover]) { dx = pts[CH.hover][0]; dy = pts[CH.hover][1]; } else { dx = rw; dy = yAt(pts, rw); }
    attr($('#pfc-dot'), { cx: dx, cy: dy });
    attr($('#pfc-pulse'), { cx: dx, cy: dy });
    attr($('#pfc-cross'), { x1: dx, x2: dx, y1: 4, y2: CH.h - 4 });
    box.classList.toggle('is-down', v[n - 1] < v[0]);
    if (CH.hover >= 0) {
      var tip = $('#pfc-tip');
      tip.style.left = clamp(dx, 56, CH.w - 56) + 'px';
      tip.style.top = dy + 'px';
      /* У верхнего края подсказка уходит под точку, чтобы не наезжать на чип. */
      tip.classList.toggle('below', dy < 50);
    }
  }
  function resample(arr, n) {
    var out = [];
    if (!arr || !arr.length) { for (var z = 0; z < n; z++) out.push(0); return out; }
    for (var i = 0; i < n; i++) {
      var f = i / (n - 1) * (arr.length - 1), k = Math.floor(f), r = f - k;
      out.push(k + 1 < arr.length ? V3.lerp(arr[k], arr[k + 1], r) : arr[arr.length - 1]);
    }
    return out;
  }
  function morphTo(target) {
    var from = resample(CH.vals, target.length);
    if (CH.stopMorph) CH.stopMorph();
    CH.stopMorph = V3.tween(620, function (p) {
      var e = V3.easeInOut(p);
      CH.vals = target.map(function (x, i) { return V3.lerp(from[i], x, e); });
      drawChart();
    }, function () { CH.stopMorph = null; CH.vals = CH.target || target; drawChart(); });
  }
  function revealChart(delay) {
    if (CH.stopReveal) { CH.stopReveal(); CH.stopReveal = null; }
    CH.reveal = 0;
    drawChart();
    clearTimeout(CH.revT);
    CH.revT = setTimeout(function () {
      CH.stopReveal = V3.tween(1250, function (p) { CH.reveal = V3.easeOut(p); drawChart(); }, function () { CH.stopReveal = null; CH.reveal = 1; drawChart(); });
    }, V3.D(delay || 0));
  }
  /* Время точки: у диапазонов из свечей шаг известен (tf × 5 с), у ALL — из снимков. */
  function tsOf(i) {
    var n = CH.vals.length, r = PF_RANGES[pfRange] || PF_RANGES['1H'];
    if (CH.ts && CH.ts.length === n) return CH.ts[i];
    if (r.all) return null;
    return Date.now() - (n - 1 - i) * (r.tf || 12) * 5000;
  }
  function tlabel(i) {
    var ts = tsOf(i);
    if (ts == null) return '';
    var d = new Date(ts), r = PF_RANGES[pfRange] || {};
    if (!r.all) return hm(d);
    try { return d.toLocaleDateString(loc(), { day: 'numeric', month: 'short' }).replace('.', '') + ', ' + hm(d); } catch (e) { return hm(d); }
  }
  /* opts: morph (смена периода/режима), intro (вход на вкладку), minSpan, isCap. */
  function renderChart(series, opts) {
    opts = opts || {};
    if (!series || series.length < 2 || !chBox()) return;
    var vals = Array.prototype.slice.call(series);
    CH.minSpan = opts.minSpan || 0;
    CH.isCap = !!opts.isCap;
    CH.ts = series.ts || null;
    CH.target = vals;
    if (!CH.sized && !chartSize()) { CH.vals = vals; return; }
    if (opts.intro || !CH.vals) {
      if (CH.stopMorph) { CH.stopMorph(); CH.stopMorph = null; }
      CH.vals = vals;
      if (opts.intro) revealChart(220); else drawChart();
      return;
    }
    if (opts.morph) { morphTo(vals); return; }
    if (CH.stopMorph) return;
    CH.vals = vals;
    if (CH.hover >= CH.vals.length) CH.hover = CH.vals.length - 1;
    if (!CH.stopReveal) drawChart();
  }

  var lastIdx = -1;
  function scrub(clientX) {
    if (!CH.vals || !CH.pts || CH.reveal < 1 || CH.stopMorph) return;
    var svg = $('#pf-chart-svg'), r = svg.getBoundingClientRect();
    var i = Math.round(clamp((clientX - r.left) / (r.width * (CH.w - RIGHT) / CH.w), 0, 1) * (CH.vals.length - 1));
    CH.hover = i;
    hero.scrub = true;
    chBox().classList.add('scrub');
    var v = CH.vals[i], s0 = CH.vals[0], last = i === CH.vals.length - 1;
    var tl = tlabel(i);
    setTxt($('#pfc-tip-v'), CH.isCap ? money(v) : fmtSigned(v));
    setTxt($('#pfc-tip-t'), tl);
    $('#pfc-tip-t').style.display = tl ? '' : 'none';
    if (CH.isCap) {
      var el = $('#pf-total');
      el.classList.add('instant');
      V3.odo(el, v);
    }
    setPill(v - s0, CH.isCap ? s0 : hero.base);
    setTxt($('#pf-per'), last || !tl ? per() : t('v3pf_at', { t: tl }));
    if (i !== lastIdx && i % 4 === 0) buzz(2);
    if (i !== lastIdx) Snd.play('scrub_step', i / Math.max(1, CH.vals.length - 1));
    lastIdx = i;
    drawChart();
  }
  function endScrub() {
    if (CH.hover < 0) return;
    CH.hover = -1;
    lastIdx = -1;
    hero.scrub = false;
    chBox().classList.remove('scrub');
    var el = $('#pf-total');
    if (el) el.classList.remove('instant');
    drawChart();
    if (currentTab === 'portfolio') renderPfHero();
  }

  /* ---------------- Панели «Капитал / Позиции» ---------------- */

  function switchPanels(mode) {
    var stats = $('#pf-stats'), cap = $('#pf-stats-capital'), pos = $('#pf-stats-positions');
    if (!stats || !cap || !pos) return;
    var from = stats.offsetHeight;
    cap.classList.toggle('off', mode !== 'capital');
    pos.classList.toggle('off', mode !== 'positions');
    var to = (mode === 'capital' ? cap : pos).offsetHeight;
    if (V3.reduced() || !from || from === to) return;
    stats.style.height = from + 'px';
    V3.reflow(stats);
    stats.style.height = to + 'px';
    clearTimeout(stats.__t);
    stats.__t = setTimeout(function () { stats.style.height = ''; }, 480);
  }
  function syncPanels() {
    var cap = $('#pf-stats-capital'), pos = $('#pf-stats-positions');
    if (cap) cap.classList.toggle('off', pfMode !== 'capital');
    if (pos) pos.classList.toggle('off', pfMode !== 'positions');
    segOn($('#pf-seg'), function (b) { return b.getAttribute('data-pf') === pfMode; }, true);
  }

  function countOr(el, v, fmt, intro) {
    if (!el) return;
    el.__pfTo = v;
    /* Интро концепта: плитки с нуля, отсчёт стартует через 300 мс и идёт 1.1 с. */
    if (intro) {
      if (el.__v3stop) el.__v3stop();
      el.__v3stop = null;
      el.__v3v = 0;
      setTxt(el, fmt(0));
      clearTimeout(el.__cT);
      el.__cT = setTimeout(function () { el.__cT = 0; el.__v3v = 0; V3.countTo(el, el.__pfTo, fmt, 1100); }, V3.D(300));
      return;
    }
    if (el.__cT) return;
    if (el.__v3stop) el.__v3stop();
    el.__v3stop = null;
    el.__v3v = v;
    setTxt(el, fmt(v));
  }
  function m0(x) { return money(x, 0); }
  /* d: cash, spot, fut, n, pnl, pnlPct, best. */
  function renderStats(d, intro) {
    var cap = d.cash + d.spot + d.fut;
    var comp = $('#pf-comp');
    if (comp) {
      var parts = { cash: d.cash, spot: d.spot, fut: d.fut };
      $$('i', comp).forEach(function (i) {
        var k = i.getAttribute('data-k'), v = Math.max(0, parts[k] || 0);
        i.style.display = v > 0.005 ? '' : 'none';
        if (intro) {
          /* Полоса вырастает из нуля: сначала 0, со следующего кадра — доли. */
          i.style.transition = 'none'; i.style.flexGrow = '0'; V3.reflow(i); i.style.transition = '';
          setTimeout(function () { i.style.flexGrow = String(v); }, V3.D(420) + 30);
        } else if (!comp.__introT) i.style.flexGrow = String(v);
      });
      if (intro) { clearTimeout(comp.__introT); comp.__introT = setTimeout(function () { comp.__introT = 0; }, V3.D(420) + 50); }
    }
    /* На обычном тике не перебиваем идущий отсчёт интро. */
    var busy = !intro && renderStats.__introAt && Date.now() - renderStats.__introAt < V3.D(300) + V3.D(1100) + 50;
    if (intro) renderStats.__introAt = Date.now();
    if (!busy) {
      countOr($('#pf-cash'), d.cash, m0, intro);
      countOr($('#pf-positions'), d.spot, m0, intro);
      countOr($('#pf-futv'), d.fut, m0, intro);
      countOr($('#pf-profit'), d.pnl, fmtSigned, intro);
      countOr($('#pf-best'), d.best, m0, intro);
    }
    function p(v) { return cap > 0 ? (v / cap * 100).toFixed(1) + '%' : '\u2014'; }
    setTxt($('#pf-cash-p'), p(d.cash));
    setTxt($('#pf-positions-p'), p(d.spot));
    setTxt($('#pf-futv-p'), p(d.fut));
    setTxt($('#pf-assets'), String(d.n));
    setCls($('#pf-profit'), 'mono ' + cls(d.pnl));
    var tile = $('#pf-profit-tile');
    if (tile) tile.style.setProperty('--c', d.pnl >= 0 ? 'var(--up)' : 'var(--down)');
    var pp = $('#pf-profit-pct');
    setTxt(pp, pctTxt(d.pnlPct));
    setCls(pp, 'mono ' + cls(d.pnlPct));
    /* Новый рекорд капитала — золотая метка на плитке на несколько секунд. */
    var bt = $('#pf-best-tile');
    if (bt && renderStats.__best != null && d.best > renderStats.__best + 0.005 && !intro) {
      bt.setAttribute('data-new', t('v3pf_new'));
      bt.classList.add('rec');
      clearTimeout(bt.__t);
      bt.__t = setTimeout(function () { bt.classList.remove('rec'); }, 4000);
    }
    renderStats.__best = d.best;
  }

  /* ---------------- Активы ---------------- */

  var sortKey = 'value', showAll = false;
  var RING_C = 2 * Math.PI * 21;
  function chg24(a) { return Engine.change(a, now()) * 100; }
  function metric(s) {
    if (sortKey === 'pnl') return [fmtSigned(s.pnl), cls(s.pnl)];
    if (sortKey === 'chg') { var c = chg24(s.a); return [t('v3pf_24h') + ' ' + arrowPct(c), cls(c)]; }
    return [arrowPct(s.pnlP), cls(s.pnlP)];
  }
  function sortSegs(segs) {
    var out = segs.slice();
    if (sortKey === 'pnl') out.sort(function (x, y) { return y.pnl - x.pnl; });
    else if (sortKey === 'chg') out.sort(function (x, y) { return chg24(y.a) - chg24(x.a); });
    else out.sort(function (x, y) { return y.value - x.value; });
    return out;
  }
  function rowHtml(s) {
    var a = s.a;
    return '<div class="v3pf-asset" data-asset="' + esc(a.id) + '" style="--c:' + s.color + '">' +
      '<button type="button" class="v3pf-amain" aria-expanded="false">' +
        '<span class="v3pf-logo"><svg class="v3pf-ring" viewBox="0 0 48 48" aria-hidden="true"><circle class="rb" cx="24" cy="24" r="21"/><circle class="rf" cx="24" cy="24" r="21"/></svg>' +
          '<img src="' + esc(coinSrc(a)) + '" alt="" draggable="false"></span>' +
        '<span class="v3pf-aname"><b>' + esc(assetName(a)) + '</b><i>' + esc(a.ticker) + ' \u00B7 <span class="mono" data-k="qty"></span></i></span>' +
        '<svg class="v3pf-spark" viewBox="0 0 56 28" preserveAspectRatio="none" aria-hidden="true"><path class="sa"/><path class="sl"/></svg>' +
        '<span class="v3pf-aval"><b class="mono" data-k="value"></b><i class="mono" data-k="m"></i></span>' +
      '</button>' +
      '<div class="v3pf-adetail"><div class="v3pf-adi">' +
        '<div class="v3pf-dgrid">' +
          '<div><span>' + esc(t('v3pf_d_avg')) + '</span><b class="mono" data-k="avg"></b></div>' +
          '<div><span>' + esc(t('v3pf_d_now')) + '</span><b class="mono" data-k="px"></b></div>' +
          '<div><span>' + esc(t('v3pf_d_inv')) + '</span><b class="mono" data-k="inv"></b></div>' +
          '<div><span>' + esc(t('v3pf_d_pnl')) + '</span><b class="mono" data-k="pnl"></b></div>' +
          '<div><span>' + esc(t('v3pf_d_roi')) + '</span><b class="mono" data-k="roi"></b></div>' +
          '<div><span>' + esc(t('v3pf_d_c24')) + '</span><b class="mono" data-k="c24"></b></div>' +
        '</div>' +
        '<div class="v3pf-dacts"><button type="button" class="v3pf-dbtn sell" data-act="sell">' + esc(t('v3pf_sell')) + '</button>' +
        '<button type="button" class="v3pf-dbtn buy" data-act="buy">' + esc(t('v3pf_buy')) + '</button></div>' +
      '</div></div>' +
    '</div>';
  }
  function kk(row, n) { return row.querySelector('[data-k="' + n + '"]'); }
  /* Вспышка стоимости строки как в концепте: вся сумма цветом и свечением,
     класс снимается через 60 мс — цвет стекает по transition 0.6 с. */
  function rowFlash(el, up) {
    el.classList.remove('fl-up', 'fl-down');
    el.classList.add(up ? 'fl-up' : 'fl-down');
    clearTimeout(el.__flT);
    el.__flT = setTimeout(function () { el.classList.remove('fl-up', 'fl-down'); }, 60);
  }
  function sheetOpen() { var m = document.getElementById('modal-trade'); return !!(m && !m.classList.contains('hidden')); }
  /* Логотип «глотает» докупленное и «выплёвывает» проданное — после закрытия шита сделки. */
  function gulpRow(row, buy, dq, a) {
    var tries = 0;
    (function go() {
      if (sheetOpen() && tries++ < 30) { setTimeout(go, 100); return; }
      /* Карточка ещё въезжает каскадом (возврат с экрана монеты) — ждём её. */
      var wait = tries ? V3.D(260) : 0, card = row.closest('.card');
      if (card && card.getAnimations) card.getAnimations().forEach(function (an) {
        var ct = an.effect && an.effect.getComputedTiming ? an.effect.getComputedTiming() : null;
        if (ct && isFinite(ct.endTime) && an.currentTime != null) wait = Math.max(wait, ct.endTime - an.currentTime - 150);
      });
      setTimeout(function () {
        var logo = row.querySelector('.v3pf-logo');
        if (!logo || !row.isConnected || row.classList.contains('is-extra')) return;
        var c = buy ? 'gulp' : 'gulp-out';
        logo.classList.remove('gulp', 'gulp-out');
        V3.reflow(logo);
        logo.classList.add(c);
        clearTimeout(logo.__gT);
        logo.__gT = setTimeout(function () { logo.classList.remove(c); }, V3.D(700));
        if (buy && currentTab === 'portfolio' && typeof FX !== 'undefined' && FX.floatText && !V3.reduced()) {
          var p = FX.center(logo);
          FX.floatText(p.x, p.y, '+' + fmtQty(dq) + ' ' + a.ticker, 'up fx-float--pill');
        }
      }, wait);
    })();
  }
  function updateRow(row, s, total, sparks, quiet) {
    var a = s.a, pos = s.pos;
    setTxt(kk(row, 'qty'), fmtQty(pos.qty));
    if (row.__q != null && !quiet && Math.abs(pos.qty - row.__q) > Math.max(1e-12, row.__q * 1e-9)) gulpRow(row, pos.qty > row.__q, Math.abs(pos.qty - row.__q), a);
    row.__q = pos.qty;
    var vb = kk(row, 'value'), txt = money(s.value);
    setTxt(vb, txt);
    /* Сверка раз в секунду (тик концепта): сдвиг больше 0.04% — вспышка. */
    var nowT = Date.now();
    if (vb.__ref == null || quiet) { vb.__ref = s.value; vb.__at = nowT; }
    else if (nowT - (vb.__at || 0) >= 950) {
      if (Math.abs(s.value - vb.__ref) / Math.max(1e-9, s.value) > 0.0004) rowFlash(vb, s.value > vb.__ref);
      vb.__ref = s.value; vb.__at = nowT;
    }
    var m = metric(s), me = kk(row, 'm');
    setTxt(me, m[0]);
    me.classList.toggle('up', m[1] === 'up');
    me.classList.toggle('down', m[1] === 'down');
    var rf = row.querySelector('.rf');
    if (rf) {
      var dash = (total > 0 ? s.value / total * RING_C : 0).toFixed(1) + ' ' + RING_C.toFixed(1);
      if (rf.__d !== dash) { rf.__d = dash; rf.style.strokeDasharray = dash; }
    }
    if (sparks) {
      var sp = row.querySelector('.v3pf-spark');
      var closes = Engine.candles(a, 36, 1, now()).map(function (c) { return c.c; });
      var P = V3.sparkPaths(closes, 56, 28, 3);
      sp.querySelector('.sl').setAttribute('d', P.line);
      sp.querySelector('.sa').setAttribute('d', P.area);
      sp.classList.toggle('down', Engine.change(a, now()) < 0);
    }
    if (row.classList.contains('open') || quiet || sparks) {
      var cur = Engine.bid(a, now()), avg = pos.qty > 0 ? pos.cost / pos.qty : 0;
      setTxt(kk(row, 'avg'), money(avg, a.dec));
      setTxt(kk(row, 'px'), money(cur, a.dec));
      setTxt(kk(row, 'inv'), money(pos.cost));
      var pe = kk(row, 'pnl'); setTxt(pe, fmtSigned(s.pnl)); setCls(pe, 'mono ' + cls(s.pnl));
      var ro = kk(row, 'roi'); setTxt(ro, pctTxt(s.pnlP)); setCls(ro, 'mono ' + cls(s.pnlP));
      var c = chg24(a), ce = kk(row, 'c24'); setTxt(ce, arrowPct(c)); setCls(ce, 'mono ' + cls(c));
    }
  }
  function bindRow(row) {
    row.querySelector('.v3pf-amain').onclick = function () { toggleRow(row); };
    Array.prototype.forEach.call(row.querySelectorAll('.v3pf-dbtn'), function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = row.getAttribute('data-asset'), mode = b.getAttribute('data-act');
        var pages = document.getElementById('pages');
        tradeFromPf = currentScreen === 'app-main' && currentTab === 'portfolio' ? { scroll: pages ? pages.scrollTop : 0 } : null;
        openTrade(id);
        if (mode === 'sell' && !S.positions[id]) return;
        openSheet(mode);
      };
    });
  }
  /* «Докупить / Продать» из портфеля открывают экран монеты; назад — снова в
     портфель на ту же прокрутку (openTrade иначе возвращал на «Рынок»), где
     логотип строки «глотает» сделку. */
  var tradeFromPf = null;
  V3.after('closeTrade', function () {
    var st = tradeFromPf;
    tradeFromPf = null;
    if (!st || currentScreen !== 'app-main') return;
    setTab('portfolio', true);
    renderPortfolio(true);
    if (typeof Fut !== 'undefined') Fut.renderPortfolio();
    var pages = document.getElementById('pages');
    if (pages) pages.scrollTop = st.scroll;
  });
  function openRow(row) {
    var d = row.querySelector('.v3pf-adetail');
    row.classList.add('open');
    row.querySelector('.v3pf-amain').setAttribute('aria-expanded', 'true');
    d.style.height = d.scrollHeight + 'px';
    clearTimeout(d.__t);
    d.__t = setTimeout(function () { if (row.classList.contains('open')) d.style.height = 'auto'; }, V3.D(460) + 20);
  }
  function closeRow(row) {
    var d = row.querySelector('.v3pf-adetail');
    row.classList.remove('open');
    row.querySelector('.v3pf-amain').setAttribute('aria-expanded', 'false');
    clearTimeout(d.__t);
    d.style.height = d.scrollHeight + 'px';
    V3.reflow(d);
    d.style.height = '0px';
  }
  function toggleRow(row) {
    var list = row.parentNode, id = row.getAttribute('data-asset');
    var was = row.classList.contains('open');
    $$('.v3pf-asset.open', list).forEach(closeRow);
    if (was) return;
    buzz(5);
    var segs = allocSegments(), tot = invested();
    for (var i = 0; i < segs.length; i++) if (segs[i].id === id) updateRow(row, segs[i], tot, false, true);
    openRow(row);
  }

  /* FLIP: строки переезжают на новые места; вновь показанные — проявляются. */
  function applyOrder(listEl, order, limit, anim) {
    var first = {}, rows = listEl.__rows;
    if (anim) order.forEach(function (s) { var r = rows[s.id]; if (r) first[s.id] = r.getBoundingClientRect(); });
    order.forEach(function (s, i) {
      var r = rows[s.id];
      if (!r) return;
      if (listEl.children[i] !== r) listEl.insertBefore(r, listEl.children[i] || null);
      r.style.setProperty('--i', i);
      r.classList.toggle('is-extra', !!limit && i >= limit);
    });
    if (!anim || V3.reduced()) return;
    order.forEach(function (s) {
      var r = rows[s.id], was = first[s.id];
      if (!r || !was || r.classList.contains('is-extra') || !r.animate) return;
      var nowR = r.getBoundingClientRect();
      if (!was.height) { r.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: V3.D(420), easing: 'ease-out' }); return; }
      var dy = was.top - nowR.top;
      if (Math.abs(dy) > 1) r.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: V3.D(560), easing: 'cubic-bezier(.3,.9,.3,1)' });
    });
  }
  /* Список активов: строка создаётся один раз на актив, дальше меняются только числа.
     limit — сколько строк видно до «Показать все» (0 — все). */
  function renderRows(listEl, segs, animate, skipSparks, limit) {
    if (!listEl) return;
    if (!segs.length) {
      listEl.innerHTML = '<div class="empty">' + esc(t('pf_empty')) + '</div>';
      listEl.__rows = null;
      listEl.__sig = '';
      return;
    }
    var rows = listEl.__rows;
    if (!rows || listEl.__lang !== LANG) {
      listEl.innerHTML = '';
      rows = listEl.__rows = {};
      listEl.__lang = LANG;
      listEl.__order = '';
    }
    var total = 0, alive = {};
    segs.forEach(function (s) { total += s.value; alive[s.id] = 1; });
    Object.keys(rows).forEach(function (id) {
      if (alive[id]) return;
      var r = rows[id];
      if (r.parentNode) r.parentNode.removeChild(r);
      delete rows[id];
    });
    var added = [];
    segs.forEach(function (s) {
      if (rows[s.id]) return;
      var tmp = document.createElement('div');
      tmp.innerHTML = rowHtml(s);
      var r = tmp.firstChild;
      rows[s.id] = r;
      bindRow(r);
      added.push(s.id);
    });
    var order = sortSegs(segs), sig = order.map(function (s) { return s.id; }).join('|');
    var intro = !!animate;
    if (intro) {
      listEl.classList.add('ring-zero');
      listEl.classList.remove('intro');
      V3.reflow(listEl);
      listEl.classList.add('intro');
      clearTimeout(listEl.__introT);
      listEl.__introT = setTimeout(function () { listEl.classList.remove('intro'); }, V3.D(300 + 60 * Math.min(order.length, limit || order.length) + 650));
    }
    var fresh = listEl.__order === '';
    var moved = listEl.__order !== sig;
    applyOrder(listEl, order, limit, moved && !intro && !fresh && !listEl.classList.contains('intro'));
    listEl.__order = sig;
    order.forEach(function (s) { updateRow(rows[s.id], s, total, !skipSparks || added.indexOf(s.id) >= 0, intro || added.indexOf(s.id) >= 0); });
    if (!intro && !fresh) added.forEach(function (id, i) {
      var r = rows[id];
      r.style.setProperty('--n', i);
      r.classList.add('pop');
      setTimeout(function () { r.classList.remove('pop'); }, V3.D(900));
    });
    /* Кольца долей дорастают, когда строки уже проявились (700 мс, как в концепте). */
    if (intro) { clearTimeout(listEl.__ringT); listEl.__ringT = setTimeout(function () { listEl.classList.remove('ring-zero'); }, V3.D(700) + 30); }
  }
  function renderMore(n) {
    var btn = $('#pf-all-btn');
    setTxt($('#pf-n'), String(n));
    if (!btn) return;
    btn.classList.toggle('hidden', n <= PF_TOP_N);
    btn.classList.toggle('on', showAll);
    setTxt($('#pf-more-txt'), showAll ? t('v3pf_less') : t('v3pf_more', { n: n }));
  }

  /* ---------------- Лидер и аутсайдер ---------------- */

  /* Центр кольца распределения как в концепте: «Итого в спот», сумма, «N активов»;
     смена итог ⇄ выбранный сектор — с коротким проявлением. */
  V3.after('renderAllocCenter', function (r, args) {
    var center = document.getElementById('donut-center');
    if (!center) return;
    if (center.__pfMode !== center.__mode + center.__id) {
      if (center.__pfMode != null) { center.classList.remove('v3pf-swap'); V3.reflow(center); center.classList.add('v3pf-swap'); }
      center.__pfMode = center.__mode + center.__id;
    }
    var segs = args[0] || [], k = center.querySelector('.v3pf-dck'), s = center.querySelector('.v3pf-dcs');
    if (center.__mode !== 'total' || !segs.length) {
      if (k) k.parentNode.removeChild(k);
      if (s) s.parentNode.removeChild(s);
      return;
    }
    if (!k) { k = document.createElement('span'); k.className = 'v3pf-dck'; center.insertBefore(k, center.firstChild); }
    if (!s) { s = document.createElement('span'); s.className = 'v3pf-dcs mono'; center.appendChild(s); }
    var n = Object.keys(S.positions).length;
    setTxt(k, t('v3pf_dc_total'));
    setTxt(s, n + ' ' + plural(n, 'v3pf_assets'));
  });

  function fillLead(pre, s) {
    var img = $('#pf-' + pre + '-img');
    if (img && img.getAttribute('src') !== coinSrc(s.a)) img.setAttribute('src', coinSrc(s.a));
    setTxt($('#pf-' + pre + '-name'), assetName(s.a));
    setTxt($('#pf-' + pre + '-qty'), s.a.ticker + ' \u00B7 ' + fmtQty(s.pos.qty));
    var pe = $('#pf-' + pre + '-pct');
    setTxt(pe, pctTxt(s.pnlP));
    pe.classList.toggle('up', s.pnlP >= 0);
    pe.classList.toggle('down', s.pnlP < 0);
    setTxt($('#pf-' + pre + '-pnl'), t(s.pnl >= 0 ? 'v3pf_profit_sub' : 'v3pf_loss_sub', { x: (s.pnl >= 0 ? '+' : '\u2212') + money(Math.abs(s.pnl)) }));
  }
  function lead(card, pre, s) {
    if (!card) return;
    if (card.__id && card.__id !== s.id && !V3.reduced()) {
      card.__id = s.id;
      card.classList.add('flip');
      clearTimeout(card.__t);
      card.__t = setTimeout(function () {
        fillLead(pre, s);
        card.classList.remove('flip');
        /* Новый лидер — золотые искры из центра карточки. */
        if (pre === 'top' && currentTab === 'portfolio' && typeof FX !== 'undefined' && FX.burst) {
          var p = FX.center(card);
          FX.burst(p.x, p.y, { kind: 'coin', count: 12, spread: 90 });
        }
      }, V3.D(320));
      return;
    }
    card.__id = s.id;
    if (!card.classList.contains('flip')) fillLead(pre, s);
  }
  function renderLeaders(segs) {
    var box = $('#pf-top-card');
    if (!box) return;
    box.classList.toggle('hidden', !segs.length);
    if (!segs.length) return;
    var best = segs[0], worst = segs[0];
    segs.forEach(function (s) { if (s.pnlP > best.pnlP) best = s; if (s.pnlP < worst.pnlP) worst = s; });
    var solo = segs.length < 2;
    box.classList.toggle('solo', solo);
    lead($('#pf-lead-best'), 'top', best);
    if (!solo) lead($('#pf-lead-worst'), 'low', worst);
  }

  /* ---------------- Последние операции ---------------- */

  var ICO_XFER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/></svg>';
  var ICO_SPIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.5v6.3M12 14.2v6.3M3.5 12h6.3M14.2 12h6.3M6 6l4.4 4.4M13.6 13.6L18 18M18 6l-4.4 4.4M10.4 13.6L6 18"/></svg>';
  var ARW_DN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
  var ARW_UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  function when(ts) {
    var d = new Date(ts), n = new Date();
    var day0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    if (ts >= day0) return hm(d);
    if (ts >= day0 - 86400000) return t('v3pf_yesterday') + ', ' + hm(d);
    try { return d.toLocaleDateString(loc(), { day: 'numeric', month: 'short' }).replace('.', ''); } catch (e) { return hm(d); }
  }
  function opHtml(tr) {
    var a = tr.id ? assetById(tr.id) : null, ico, title, sub, amt, ac = '';
    if (tr.side === 'xfer') {
      /* Переводы между счетами — из журнала меню (S.lbLog: fin/fout). */
      var toFut = tr.k === 'fin';
      ico = '<span class="v3pf-act-ico xfer">' + ICO_XFER + '</span>';
      title = t(toFut ? 'v3pf_op_xin' : 'v3pf_op_xout');
      sub = t(toFut ? 'v3pf_op_xin_s' : 'v3pf_op_xout_s') + ' \u00B7 ' + when(tr.t);
      amt = money(tr.total || 0);
    } else if (tr.side === 'reward') {
      ico = a ? '<span class="v3pf-act-ico"><img src="' + esc(coinSrc(a)) + '" alt=""><i class="bdg spin">' + ICO_SPIN + '</i></span>'
        : '<span class="v3pf-act-ico spin">' + ICO_SPIN + '</span>';
      title = a ? t('v3pf_op_reward_coin', { n: assetName(a) }) : t('v3pf_op_reward');
      sub = (a ? fmtQty(tr.qty || 0) + ' ' + a.ticker : t('v3pf_op_spin')) + ' \u00B7 ' + when(tr.t);
      amt = '+' + money(tr.total || 0); ac = 'gold';
    } else {
      if (!a) return '';
      var buy = tr.side === 'buy';
      ico = '<span class="v3pf-act-ico"><img src="' + esc(coinSrc(a)) + '" alt=""><i class="bdg ' + (buy ? 'buy' : 'sell') + '">' + (buy ? ARW_DN : ARW_UP) + '</i></span>';
      title = t(buy ? 'v3pf_op_buy' : 'v3pf_op_sell', { n: assetName(a) });
      sub = fmtQty(tr.qty || 0) + ' ' + a.ticker;
      if (!buy && typeof tr.pnl === 'number' && isFinite(tr.pnl)) sub += ' \u00B7 P&L ' + fmtSigned(tr.pnl);
      if (tr.kind === 'limit') sub += ' \u00B7 ' + t('v3pf_op_limit');
      sub += ' \u00B7 ' + when(tr.t);
      if (buy) amt = '\u2212' + money(tr.total || 0);
      else { amt = '+' + money(Math.max(0, (tr.total || 0) - (tr.fee || 0))); ac = 'up'; }
    }
    return '<div class="v3pf-act" data-tid="' + esc(tr.tid || String(tr.t)) + '"><div class="v3pf-act-in"><div class="v3pf-act-row">' + ico +
      '<span class="v3pf-act-txt"><b>' + esc(title) + '</b><i class="mono">' + esc(sub) + '</i></span>' +
      '<span class="v3pf-act-amt mono ' + ac + '">' + esc(amt) + '</span></div></div></div>';
  }
  function renderOps(intro) {
    var card = $('#pf-ops-card'), box = $('#pf-ops');
    if (!card || !box) return;
    var list = (S.trades || []).filter(function (tr) {
      if (!tr || typeof tr.t !== 'number') return false;
      if (tr.side === 'reward') return tr.total > 0;
      return (tr.side === 'buy' || tr.side === 'sell') && !!assetById(tr.id);
    });
    (S.lbLog || []).forEach(function (e) {
      if (e && (e.k === 'fin' || e.k === 'fout') && typeof e.t === 'number') list.push({ side: 'xfer', k: e.k, t: e.t, total: Math.abs(e.amt || 0), tid: e.id });
    });
    list.sort(function (x, y) { return y.t - x.t; });
    list = list.slice(0, 5);
    card.classList.toggle('hidden', !list.length);
    var sig = list.map(function (tr) { return tr.tid || tr.t; }).join('|') + '#' + LANG + '#' + new Date().getDate();
    if (box.__sig === sig) return;
    var prev = {};
    $$('.v3pf-act', box).forEach(function (r) { prev[r.getAttribute('data-tid')] = 1; });
    var animNew = box.__sig != null && !intro && !V3.reduced();
    box.__sig = sig;
    box.innerHTML = list.map(opHtml).join('');
    if (!animNew) return;
    $$('.v3pf-act', box).forEach(function (r) {
      if (prev[r.getAttribute('data-tid')]) return;
      r.classList.add('enter', 'fresh');
      V3.reflow(r);
      requestAnimationFrame(function () { r.classList.remove('enter'); });
      setTimeout(function () { r.classList.remove('fresh'); }, V3.D(1500));
    });
  }

  /* ---------------- Привязка ---------------- */

  /* «Потяни, чтобы обновить» (концепт): вкладка съезжает вниз за пальцем или
     мышью, золотая монета крутится, затем график прорисовывается заново. */
  function bindPtr() {
    var pages = document.getElementById('pages'), page = document.getElementById('tab-portfolio');
    if (!pages || !page) return;
    var box = document.createElement('div');
    box.className = 'v3pf-ptr';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<i class="v3pf-ptr-coin">$</i><span></span>';
    page.appendChild(box);
    var coin = box.firstChild, txt = box.lastChild;
    var y0 = null, x0 = 0, pull = 0, active = false, busy = false, suppress = false, TH = 40;
    function place(d) {
      page.style.translate = d ? '0 ' + d + 'px' : '';
      /* Индикатор стоит у верхнего края ленты, а не едет вместе с вкладкой. */
      box.style.transform = 'translateY(' + (2 - d) + 'px)';
    }
    function can() { return currentTab === 'portfolio' && pages.scrollTop <= 0 && !busy && !hero.scrub; }
    function start(x, y, target) {
      if (!can() || (target && target.closest && target.closest('.v3pf-chart, input, textarea'))) return;
      y0 = y; x0 = x; pull = 0; active = false;
    }
    function move(x, y) {
      if (y0 == null) return false;
      var dy = y - y0;
      if (!active) {
        if (Math.abs(x - x0) > Math.abs(dy)) { if (Math.abs(x - x0) > 8) y0 = null; return false; }
        if (dy > 8 && pages.scrollTop <= 0) active = true;
        else { if (dy < -4) y0 = null; return false; }
      }
      pull = Math.max(0, dy);
      var d = Math.min(110, pull * 0.5);
      page.classList.add('v3pf-pulling');
      place(d);
      box.style.opacity = String(Math.min(1, d / 36));
      coin.style.transform = 'rotate(' + (pull * 2) + 'deg) scale(' + Math.min(1, 0.5 + d / 80) + ')';
      setTxt(txt, t(d >= TH ? 'v3pf_ptr_release' : 'v3pf_ptr_pull'));
      return true;
    }
    function reset() { place(0); box.style.opacity = '0'; coin.style.transform = ''; }
    function end() {
      var was = active;
      active = false; y0 = null;
      if (!was) return;
      page.classList.remove('v3pf-pulling');
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
      setTxt(txt, t('v3pf_ptr_busy'));
      buzz(8);
      setTimeout(function () {
        box.classList.remove('spin');
        reset();
        busy = false;
        if (currentTab !== 'portfolio') return;
        renderPortfolio(true);
        revealChart(120);
        toast(t('v3pf_ptr_done'), 'ok', { sub: t('v3pf_ptr_sub', { t: hm(new Date()) }) });
      }, 1100);
    }
    pages.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) start(e.touches[0].clientX, e.touches[0].clientY, e.target); else y0 = null;
    }, { passive: true });
    pages.addEventListener('touchmove', function (e) { if (y0 != null && e.touches && move(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault(); }, { passive: false });
    pages.addEventListener('touchend', end);
    pages.addEventListener('touchcancel', end);
    pages.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && !e.button) start(e.clientX, e.clientY, e.target); });
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && y0 != null) move(e.clientX, e.clientY); });
    window.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') end(); });
    pages.addEventListener('click', function (e) { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  function bind() {
    var seg = $('#pf-seg');
    if (seg) seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-pf]');
      if (!b) return;
      var next = b.getAttribute('data-pf');
      if (!next || next === pfMode) return;
      pfMode = next;
      buzz(6);
      segOn(seg, function (x) { return x === b; });
      switchPanels(next);
      pfTfSwitch = true;
      renderPortfolio(true);
    });
    var per = $('#pf-periods');
    if (per) per.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-r]');
      if (!b) return;
      var next = b.getAttribute('data-r');
      if (next === pfRange || !PF_RANGES[next]) return;
      pfRange = next;
      buzz(4);
      pfTfSwitch = true;
      renderPortfolio(true);
    });
    var sort = $('#pf-sort');
    if (sort) sort.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-sort]');
      if (!b) return;
      var next = b.getAttribute('data-sort');
      if (next === sortKey) return;
      sortKey = next;
      buzz(4);
      segOn(sort, function (x) { return x === b; });
      $$('#pf-list [data-k="m"]').forEach(function (m) {
        m.classList.remove('swap'); V3.reflow(m); m.classList.add('swap');
        setTimeout(function () { m.classList.remove('swap'); }, V3.D(400));
      });
      renderPortfolio(true);
    });
    var more = $('#pf-all-btn');
    if (more) more.onclick = function () {
      showAll = !showAll;
      renderPortfolio(true);
      var list = $('#pf-list');
      /* Свернули — раскрытая строка из скрытой части закрывается. */
      if (!showAll && list) $$('.v3pf-asset.open.is-extra', list).forEach(closeRow);
      if (showAll && list && !V3.reduced()) {
        $$('.v3pf-asset', list).forEach(function (r, i) {
          if (i < PF_TOP_N) return;
          r.style.setProperty('--n', i - PF_TOP_N);
          r.classList.remove('pop'); V3.reflow(r); r.classList.add('pop');
          setTimeout(function () { r.classList.remove('pop'); }, V3.D(900));
        });
      }
    };
    var box = chBox();
    if (box) {
      /* Скраб по графику — не свайп между вкладками (initMainTabSwipes слушает #pages). */
      box.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
      box.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') box.__drag = true; scrub(e.clientX); });
      box.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || box.__drag) scrub(e.clientX); });
      box.addEventListener('pointerup', function (e) { box.__drag = false; if (e.pointerType !== 'mouse') endScrub(); });
      box.addEventListener('pointercancel', function () { box.__drag = false; endScrub(); });
      box.addEventListener('pointerleave', function () { box.__drag = false; endScrub(); });
    }
    /* Резиновая ширина: пересчёт сетки и точек при смене размера. */
    var onResize = function () { if (CH.vals && chartSize()) drawChart(); segsInstant(); };
    if (window.ResizeObserver && box) new ResizeObserver(onResize).observe(box);
    else window.addEventListener('resize', onResize);
    /* Фьючерсная карточка — после распределения, как в концепте. */
    var fut = document.getElementById('pf-fut-card'), alloc = document.getElementById('pf-alloc-card');
    if (fut && alloc && alloc.parentNode) alloc.parentNode.insertBefore(fut, alloc.nextSibling);
    bindPtr();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  /* Вход на вкладку: табло собирается заново и докручивается, таблетки — на место. */
  function enter() {
    syncPanels();
    segOn($('#pf-periods'), function (b) { return b.getAttribute('data-r') === pfRange; }, true);
    segOn($('#pf-sort'), function (b) { return b.getAttribute('data-sort') === sortKey; }, true);
    requestAnimationFrame(segsInstant);
    var el = $('#pf-total');
    if (el && !hero.scrub) { el.__odoTxt = null; el.innerHTML = ''; }
    hero.lastV = null;
  }

  return {
    hero: renderHero, chart: renderChart, stats: renderStats, rows: renderRows, more: renderMore,
    leaders: renderLeaders, ops: renderOps, enter: enter, syncPanels: syncPanels,
    periods: function () { segOn($('#pf-periods'), function (b) { return b.getAttribute('data-r') === pfRange; }); },
    limit: function () { return showAll ? 0 : PF_TOP_N; }
  };
})();
