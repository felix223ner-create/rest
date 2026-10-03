/* v3 — экран достижений и церемония выдачи по concept/profile.html.
   Логика выдачи, очки, комиссия и сейв остаются в js/achievements.js
   (Ach); отсюда только презентация: Ach.v3 отдаёт реестр и хелперы,
   а Ach зовёт V3Ach.list / V3Ach.ceremony / V3Ach.onOk. */
'use strict';

var V3Ach = (function () {
  V3.i18n({
    ru: {
      v3a_rank_kicker: 'Ранг коллекционера', v3a_no_rank: 'Без ранга', v3a_fee: 'Комиссия',
      v3a_pt1: 'очко', v3a_pt2: 'очка', v3a_pt5: 'очков', v3a_of: 'из {n}', v3a_start: 'Старт',
      v3a_next_rank: 'Следующий ранг', v3a_left: 'ещё {n}', v3a_top_rank: 'Высший ранг', v3a_top_got: 'получен',
      v3a_all_perks: 'все перки открыты',
      v3a_perk_retail: 'рамка «Бронза»', v3a_perk_trader: 'рамка «Серебро» · 5 лимиток',
      v3a_perk_analyst: 'рамка «Сапфир» · подробная статистика', v3a_perk_pro: 'рамка «Аметист» · 8 лимиток · акценты',
      v3a_perk_manager: 'рамка «Изумруд» · все таймфреймы', v3a_perk_whale: 'рамка и титул «Кит»',
      v3a_sec_near: 'Почти готово', v3a_sec_ahead: 'Впереди', v3a_empty: 'Здесь пока пусто',
      v3a_end: 'Очки за достижение: 5 · 15 · 40 · 100',
      v3a_hid_hint: 'Условие скрыто — достижение откроется само, когда вы его выполните. Награда: {n} и сюрприз.',
      v3a_pts_sub: 'снижают комиссию и ведут к рангу', v3a_spin_title: '{s} колеса', v3a_spin_sub: 'бесплатные спины',
      v3a_after: 'после получения', v3a_apply: 'Применить',
      v3a_cer_pts_sub: 'комиссия ниже, ранг ближе', v3a_cer_spin1: 'Прокрутка колеса', v3a_cer_spin5: 'Прокрутки колеса',
      v3a_in_vitrine: 'уже в витрине', v3a_new: 'Новое', v3a_new_rank: 'Новый ранг',
      v3a_fee_next: 'Комиссия {cur} · до {next} ещё {n}', v3a_fee_min: 'Комиссия {cur} — минимальная',
      v3a_next_btn: 'Далее · {i}/{n}', v3a_collect: 'Забрать', v3a_skip: 'Коснитесь, чтобы пропустить',
      v3a_wear_frame: 'Надеть рамку', v3a_wear_title: 'Надеть титул', v3a_wear_candles: 'Надеть свечи',
      v3a_wear_theme: 'Применить тему', v3a_wear_accent: 'Включить акцент', v3a_wear_flag: 'Включить флаг',
      v3a_days: '{n} дн.'
    },
    en: {
      v3a_rank_kicker: 'Collector rank', v3a_no_rank: 'No rank', v3a_fee: 'Fee',
      v3a_pt1: 'point', v3a_pt2: 'points', v3a_pt5: 'points', v3a_of: 'of {n}', v3a_start: 'Start',
      v3a_next_rank: 'Next rank', v3a_left: '{n} to go', v3a_top_rank: 'Top rank', v3a_top_got: 'reached',
      v3a_all_perks: 'all perks unlocked',
      v3a_perk_retail: '“Bronze” frame', v3a_perk_trader: '“Silver” frame · 5 limit orders',
      v3a_perk_analyst: '“Sapphire” frame · detailed stats', v3a_perk_pro: '“Amethyst” frame · 8 limit orders · accents',
      v3a_perk_manager: '“Emerald” frame · all timeframes', v3a_perk_whale: '“Whale” frame and title',
      v3a_sec_near: 'Almost there', v3a_sec_ahead: 'Ahead', v3a_empty: 'Nothing here yet',
      v3a_end: 'Points per achievement: 5 · 15 · 40 · 100',
      v3a_hid_hint: 'The condition is hidden — it unlocks by itself once you do it. Reward: {n} and a surprise.',
      v3a_pts_sub: 'lower your fee and lead to a rank', v3a_spin_title: '{s} of the wheel', v3a_spin_sub: 'free spins',
      v3a_after: 'after unlock', v3a_apply: 'Apply',
      v3a_cer_pts_sub: 'lower fee, closer rank', v3a_cer_spin1: 'Wheel spin', v3a_cer_spin5: 'Wheel spins',
      v3a_in_vitrine: 'already in showcase', v3a_new: 'New', v3a_new_rank: 'New rank',
      v3a_fee_next: 'Fee {cur} · {n} more to {next}', v3a_fee_min: 'Fee {cur} — the lowest',
      v3a_next_btn: 'Next · {i}/{n}', v3a_collect: 'Collect', v3a_skip: 'Tap to skip',
      v3a_wear_frame: 'Wear frame', v3a_wear_title: 'Wear title', v3a_wear_candles: 'Use candles',
      v3a_wear_theme: 'Apply theme', v3a_wear_accent: 'Turn on accent', v3a_wear_flag: 'Show flag',
      v3a_days: '{n} d'
    }
  });

  var D = V3.D, esc = V3.esc, lerp = V3.lerp, easeOut = V3.easeOut, easeInOut = V3.easeInOut, reflow = V3.reflow;
  function api() { return (typeof Ach !== 'undefined' && Ach.v3 && Ach.isOn && Ach.isOn()) ? Ach.v3 : null; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function later(ms, fn) { return setTimeout(fn, D(ms)); }
  function restart(el, cls) { if (!el) return; el.classList.remove(cls); reflow(el); el.classList.add(cls); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function vib(p) { try { if (typeof FX !== 'undefined' && FX.vibrate) FX.vibrate(p); } catch (e) { /* без вибро */ } }
  function onAch() { return typeof currentScreen !== 'undefined' && currentScreen === 'scr-ach'; }
  function ptsWord(n) {
    n = Math.abs(n) % 100;
    var k = n % 10 === 1 && n !== 11 ? 'v3a_pt1' : (n % 10 >= 2 && n % 10 <= 4 && (n < 12 || n > 14)) ? 'v3a_pt2' : 'v3a_pt5';
    return t(k);
  }
  function nf(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f'); }

  var SVG = {
    check: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 25l8 8 16-17"/></svg>',
    chev: '<svg class="v3a-chev" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 20l8 8 8-8"/></svg>',
    lock: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="12" y="22" width="24" height="18" rx="4"/><path d="M17 22v-5a7 7 0 0 1 14 0v5"/></svg>',
    star: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round" aria-hidden="true"><path d="M24 8l4.5 9.5L39 19l-7.5 7 2 10.5-9.5-5-9.5 5 2-10.5L9 19l10.5-1.5z"/></svg>',
    wheel: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="3"/><path d="M24 9v6M24 33v6M9 24h6M33 24h6M13.4 13.4l4.2 4.2M30.4 30.4l4.2 4.2M13.4 34.6l4.2-4.2M30.4 17.6l4.2-4.2"/></svg>'
  };

  /* Цвета рангов — те же, что в концепте. */
  var RANK_C = { retail: '#c98f5a', trader: '#aeb8c8', analyst: '#4da3ff', pro: '#b678f0', manager: '#2fbe6e', whale: '#ffb340' };
  function rankName(r) { return r ? t('rank_' + r.id) : t('v3a_no_rank'); }
  function rankAfter(p) {
    var R = api().RANKS;
    for (var i = 0; i < R.length; i++) if (p < R[i].pts) return R[i];
    return null;
  }
  /* Подписи ступеней серии (прогресс-функции требуют контекст тика). */
  var SER_LBL = {
    vol_10k: '$10K', vol_100k: '$100K', vol_1m: '$1M', vol_10m: '$10M',
    cap_x2: '×2', cap_x5: '×5', cap_x10: '×10', wins_10: '10', wins_50: '50', wins_200: '200',
    streak_7: 7, streak_30: 30
  };
  function serLbl(id) { var v = SER_LBL[id]; return typeof v === 'number' ? t('v3a_days', { n: v }) : (v || ''); }

  /* Очки и счётчик, ещё не «забранные» в идущей церемонии: шапка
     экрана показывает старые значения, пока медаль не долетела;
     карточки этих достижений до «Забрать» остаются на старом месте. */
  var PEND = { n: 0, pts: 0, ids: {} };
  function shownPts() { return Math.max(0, (Number(S.achPts) || 0) - PEND.pts); }
  function shownCount() { return Math.max(0, api().unlockedCount() - PEND.n); }
  function isGot(id) { return !!S.ach[id] && !PEND.ids[id]; }
  function maskRow(r) { return r.un && PEND.ids[r.a.id] ? { a: r.a, un: false, p: null, ratio: 1, at: 0, pend: true } : r; }
  function rowsNow() { return api().cardSort().map(maskRow); }

  /* Медаль: тёмный диск с золотым ободком в любой теме — как в концепте,
     поэтому логотипы берём из тёмного набора. */
  function medalHTML(a, size, opts) {
    opts = opts || {};
    var ap = api(), un = opts.open || isGot(a.id), hid = a.hidden && !un, inner;
    if (hid) inner = '<span class="lk">' + SVG.lock + '</span>';
    else {
      inner = '<span class="fb">' + ap.icon(a.icon) + '</span>';
      if (ap.ACH_IMG[a.id]) inner += '<img src="img/ach-dark/' + ap.ACH_IMG[a.id] + '" alt="" draggable="false" decoding="async" onerror="this.remove()">';
    }
    return '<span class="v3a-medal' + (un ? '' : ' off') + (opts.cls ? ' ' + opts.cls : '') + '" style="--ms:' + size + 'px">' + inner +
      (!hid && a.series && ap.ROMAN[a.level] && !opts.plain ? '<i class="roman">' + ap.ROMAN[a.level] + '</i>' : '') +
      (un && !opts.plain ? '<span class="shine" style="--sd:' + ((a.id.length * 7) % 40 / 10) + 's"></span>' : '') + '</span>';
  }

  /* Мини-экран темы/акцента (как .phs в концепте): фон, панель, свечи. */
  var PAL = {
    theme_dark: { pb: '#0a0c10', pbd: '#222a36', pc: '#12161d', pu: '#2fbe6e', pd: '#f0524f' },
    theme_midnight: { pb: '#070b16', pbd: '#2a3d6b', pc: '#0d1322', pu: '#4da3ff', pd: '#24304d' },
    theme_dawn: { pb: '#13172c', pbd: '#4b3a63', pc: '#2a1b33', pu: '#9b7bff', pd: '#4a5a8f' },
    theme_carbon: { pb: '#0d0e11', pbd: '#33363d', pc: '#1b1c20', pu: '#8b93a1', pd: '#565d6b' },
    theme_ash: { pb: '#13100f', pbd: '#4a3a32', pc: '#2a201c', pu: '#ff7a3c', pd: '#b33030' },
    accent_neo: { pb: '#140a1e', pbd: '#6b2a5b', pc: '#2b1030', pu: '#ff5fa2', pd: '#6b2a5b' }
  };
  function phsHTML(id) {
    var p = PAL[id] || PAL.theme_dark;
    return '<span class="v3a-phs" style="--pb:' + p.pb + ';--pbd:' + p.pbd + ';--pc:' + p.pc + ';--pu:' + p.pu + ';--pd:' + p.pd + '">' +
      '<span class="cc"><i style="height:42%"></i><i style="height:64%"></i><i style="height:48%"></i><i style="height:82%"></i></span></span>';
  }
  /* Мини-превью предмета: рамка и свечи — уменьшенная витрина, тема —
     мини-экран, титул — его пиктограмма, флаг — глиф. */
  function itemPv(it, locked) {
    var ap = api(), k = ap.ITEM_KIND[it.type] || ap.ITEM_KIND.frame;
    if (it.type === 'frame' || it.type === 'candles') {
      return '<span class="v3a-sw v3a-sw--' + it.type + (locked ? ' lk' : '') + '">' + ap.vitrineSwatch(it.id, it.name) + '</span>';
    }
    if (it.type === 'theme' || it.type === 'accent') return '<span class="v3a-glyph' + (locked ? ' lk' : '') + '">' + phsHTML(it.id) + '</span>';
    if (it.type === 'title' && Ach.v3p && Ach.v3p.titleIcon) {
      return '<span class="v3a-glyph"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        Ach.v3p.titleIcon(it.id) + '</svg></span>';
    }
    return '<span class="v3a-glyph">' + ap.chipIcon(k.ico) + '</span>';
  }

  /* ---------------- Кольцо коллекции ---------------- */

  function buildRing(el) {
    var n = api().REG.length, h = '<svg viewBox="0 0 120 120" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.035;
      h += '<line class="tk" x1="' + (60 + Math.cos(a) * 45).toFixed(2) + '" y1="' + (60 + Math.sin(a) * 45).toFixed(2) +
        '" x2="' + (60 + Math.cos(a) * 55).toFixed(2) + '" y2="' + (60 + Math.sin(a) * 55).toFixed(2) + '"/>';
    }
    el.innerHTML = h + '</svg><div class="v3a-cring-c"><b class="mono">0</b><i></i></div>';
    el.__built = true;
  }
  function setRing(el, n, mode) {
    var ticks = $$('.tk', el), b = $('.v3a-cring-c b', el), lit = 0;
    $('.v3a-cring-c i', el).textContent = t('v3a_of', { n: ticks.length });
    ticks.forEach(function (tk) { if (tk.classList.contains('on')) lit++; });
    ticks.forEach(function (tk, i) {
      var on = i < n;
      if (mode === 'intro' && D(1)) {
        tk.classList.remove('on', 'ign');
        if (on) later(260 + i * 26, function () { tk.classList.add('on', 'ign'); });
      } else if (mode === 'grow' && on && !tk.classList.contains('on') && D(1)) {
        later(Math.max(0, i - lit) * 140, function () { tk.classList.add('on'); restart(tk, 'ign'); });
      } else tk.classList.toggle('on', on);
    });
    if (mode === 'intro') b.__v3v = 0;
    V3.countTo(b, n, function (v) { return String(Math.round(v)); }, mode ? 900 : 0);
    if (mode === 'grow') restart(el, 'hit');
  }

  /* ---------------- Шапка: ранг, дорога рангов ---------------- */

  var ROAD_AT = [0, 100, 250, 450, 700, 1000, 1280];
  function roadX(p) {
    var step = 560 / (ROAD_AT.length - 1);
    for (var i = 1; i < ROAD_AT.length; i++) {
      if (p <= ROAD_AT[i]) return 20 + step * (i - 1 + (p - ROAD_AT[i - 1]) / (ROAD_AT[i] - ROAD_AT[i - 1]));
    }
    return 580;
  }
  function head(mode) {
    var ap = api(), ring = $('#ach-ring');
    if (!ap || !ring) return;
    var p0 = shownPts(), n = shownCount(), r = ap.rankFor(p0), nr = rankAfter(p0), fi = ap.feeTierInfo(p0);
    if (!ring.__built) buildRing(ring);
    setRing(ring, n, mode);
    var rk = $('#ach-rank'), nm = rankName(r);
    if (mode === 'grow' && rk.getAttribute('data-r') !== nm) restart(rk, 'flip');
    rk.setAttribute('data-r', nm);
    rk.style.setProperty('--rc', r ? RANK_C[r.id] : '#5b6475');
    rk.innerHTML = '<i class="rring"></i><b>' + esc(nm) + '</b>';
    var pl = $('#ach-pts-line');
    if (!pl.__n) { pl.innerHTML = '<b class="mono"></b> <span></span>'; pl.__n = 1; }
    var pb = $('b', pl);
    if (mode === 'intro') pb.__v3v = 0;
    V3.countTo(pb, p0, nf, mode ? 900 : 0);
    $('span', pl).textContent = ptsWord(p0);
    V3.countTo($('#ach-pill-n'), p0, nf, mode === 'grow' ? 900 : 0);
    $('#ach-fee-now').textContent = ap.pctStr(fi.cur);

    var h = '<div class="v3a-road-track"><i class="v3a-road-fill"></i></div>';
    ap.FEE_TIERS.slice(1).forEach(function (f) {
      h += '<span class="rf' + (p0 >= f[0] ? ' done' : '') + '" style="--x:' + roadX(f[0]) + 'px">' + ap.pctStr(f[1]) + '</span>';
    });
    h += '<span class="rn done rn-start" style="--x:20px;--rc:var(--gold)"><i></i><em>' + esc(t('v3a_start')) + '<span>0</span></em></span>';
    ap.RANKS.forEach(function (k) {
      var cls = p0 >= k.pts ? 'done' : (nr && nr.id === k.id ? 'next' : 'off');
      h += '<span class="rn ' + cls + '" data-rank="' + k.id + '" style="--x:' + roadX(k.pts) + 'px;--rc:' + RANK_C[k.id] + '"><i></i><em>' + esc(t('rank_' + k.id)) + '<span>' + k.pts + '</span></em></span>';
    });
    h += '<span class="rme" style="--x:' + roadX(p0) + 'px"><b class="mono">' + p0 + '</b><i></i></span>';
    var road = $('#ach-road'), prevX = road.__x;
    road.innerHTML = h;
    var fill = $('.v3a-road-fill', road), me = $('.rme', road), x = roadX(p0);
    if (mode === 'grow' && prevX != null) {
      fill.style.transition = 'none'; fill.style.width = prevX + 'px'; me.style.transition = 'none'; me.style.left = prevX + 'px';
      reflow(fill); fill.style.transition = ''; me.style.transition = '';
    } else if (mode === 'intro' && D(1)) { fill.style.width = '20px'; me.style.left = '20px'; }
    else { fill.style.width = x + 'px'; me.style.left = x + 'px'; }
    road.__x = x;
    requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = x + 'px'; me.style.left = x + 'px'; }); });
    if (mode === 'grow' && r && prevX != null && roadX(r.pts) > prevX) {
      var hit = $('.rn[data-rank="' + r.id + '"]', road);
      later(700, function () { restart(hit, 'hit'); });
    }
    var nb = $('#ach-next');
    if (nr) {
      nb.style.setProperty('--rc', RANK_C[nr.id]);
      nb.innerHTML = '<i class="rring"></i><span class="t">' + esc(t('v3a_next_rank')) + ' <b>' + esc(ap.quoteName(t('rank_' + nr.id))) + '</b><br>' +
        esc(t('v3a_perk_' + nr.id)) + '</span><span class="n mono">' + esc(t('v3a_left', { n: nr.pts - p0 })) + '</span>';
    } else {
      nb.style.setProperty('--rc', RANK_C.whale);
      nb.innerHTML = '<i class="rring"></i><span class="t">' + esc(t('v3a_top_rank')) + ' <b>' + esc(ap.quoteName(t('rank_whale'))) + '</b> ' +
        esc(t('v3a_top_got')) + '<br>' + esc(t('v3a_all_perks')) + '</span>';
    }
    if (mode === 'intro') { var rw = $('#ach-road-wrap'); rw.scrollLeft = Math.max(0, x - 120); }
  }

  /* ---------------- Список ---------------- */

  var UI = { open: null, filter: null };

  function chipsHTML(a, onlyPts) {
    var ap = api(), np = ap.rewardPts(a), c = ['<span class="rwc pts">' + SVG.star + '+' + np + ' ' + esc(ptsWord(np)) + '</span>'];
    if (!onlyPts) {
      var sp = ap.rewardSpins(a);
      if (sp) c.push('<span class="rwc spin">' + SVG.wheel + '+' + esc(ap.spinWord(sp)) + '</span>');
      ap.rewardItems(a).forEach(function (it) {
        var k = ap.ITEM_KIND[it.type] || ap.ITEM_KIND.frame;
        c.push('<span class="rwc item">' + ap.chipIcon(k.ico) + esc(t(k.word) + ' ' + ap.quoteName(it.name)) + '</span>');
      });
    }
    var shown = c.slice(0, 3);
    if (c.length > 3) shown.push('<span class="rwc more">' + esc(t('ach_more', { n: c.length - 3 })) + '</span>');
    return '<span class="v3a-rw">' + shown.join('') + '</span>';
  }
  function moreHTML(r) {
    var ap = api(), a = r.a, h = '';
    if (a.hidden && !r.un) {
      var np = ap.rewardPts(a);
      return '<p class="v3a-hint">' + esc(t('v3a_hid_hint', { n: np + ' ' + ptsWord(np) })) + '</p>';
    }
    if (a.series) {
      h += '<div class="v3a-series">' + ap.REG.filter(function (b) { return b.series === a.series; }).map(function (b) {
        return '<span class="' + (isGot(b.id) ? 'done' : '') + (b.id === a.id ? ' cur' : '') + '"><b>' + (ap.ROMAN[b.level] || '') + '</b>' + esc(serLbl(b.id)) + '</span>';
      }).join('') + '</div>';
    }
    var np2 = ap.rewardPts(a), sp = ap.rewardSpins(a);
    h += '<div class="v3a-rrows">';
    h += '<div class="v3a-rrow"><span class="pv pv-pts">' + SVG.star + '</span><span class="tx">+' + np2 + ' ' + esc(ptsWord(np2)) + '<span>' + esc(t('v3a_pts_sub')) + '</span></span></div>';
    if (sp) h += '<div class="v3a-rrow"><span class="pv pv-spin">' + SVG.wheel + '</span><span class="tx">' + esc(t('v3a_spin_title', { s: ap.spinWord(sp) })) + '<span>' + esc(t('v3a_spin_sub')) + '</span></span></div>';
    ap.rewardItems(a).forEach(function (it) {
      var k = ap.ITEM_KIND[it.type] || ap.ITEM_KIND.frame, act;
      if (!r.un) act = '<span class="st">' + SVG.lock + esc(t('v3a_after')) + '</span>';
      else if (ap.isEquipped(it.id)) act = '<span class="st ok">' + SVG.check + esc(t('ach_vit_worn')) + '</span>';
      else act = '<button type="button" class="v3a-wear" data-wear="' + it.id + '">' + esc(it.type === 'theme' || it.type === 'accent' ? t('v3a_apply') : t('ach_vit_wear')) + '</button>';
      h += '<div class="v3a-rrow"><span class="pv">' + itemPv(it, !r.un) + '</span><span class="tx">' + esc(ap.quoteName(it.name)) + '<span>' + esc(t(k.word)) + '</span></span>' + act + '</div>';
    });
    return h + '</div>';
  }
  function cardHTML(r) {
    var ap = api(), a = r.a, hid = a.hidden && !r.un, x = UI.open === a.id, foot = '';
    if (r.un) foot = '<span class="v3a-done">' + SVG.check + esc(t('ach_done')) + '<span>· ' + esc(ap.achDate(r.at)) + '</span></span>';
    else if (r.pend) foot = '<span class="v3a-prog"><span class="v3-bar"><u data-w="100"></u></span></span>';
    else if (r.p && r.ratio > 0) foot = '<span class="v3a-prog"><span class="v3-bar"><u data-w="' + (r.ratio * 100).toFixed(1) + '"></u></span><span class="nums mono">' + esc(ap.fmtProg(r.p)) + '</span></span>';
    return '<div class="card v3a-card' + (r.un ? ' done' : ' off') + (hid ? ' hid' : '') + (x ? ' x' : '') + '" data-ach="' + a.id + '">' +
      '<button type="button" class="v3a-card-top" aria-expanded="' + x + '">' + medalHTML(a, 52) +
      '<span class="v3a-card-main"><b class="v3a-card-t">' + esc(hid ? t('ach_hidden_title') : t('ach_' + a.id + '_t')) + '</b>' +
      '<span class="v3a-card-d">' + esc(hid ? t('ach_hidden_desc') : t('ach_' + a.id + '_d')) + '</span>' + chipsHTML(a, hid) + foot + '</span>' +
      SVG.chev + '</button>' +
      '<div class="v3a-more"' + (x ? ' style="height:auto"' : '') + '><div class="v3a-more-in">' + (x ? moreHTML(r) : '') + '</div></div></div>';
  }
  function fillBars(root, instant) {
    var us = $$('u[data-w]', root);
    function go() { us.forEach(function (u) { u.style.width = u.getAttribute('data-w') + '%'; }); }
    if (instant || !D(1)) { us.forEach(function (u) { u.style.transition = 'none'; }); go(); reflow(root); us.forEach(function (u) { u.style.transition = ''; }); return; }
    us.forEach(function (u) { u.style.transition = 'none'; u.style.width = '0%'; });
    reflow(root);
    us.forEach(function (u) { u.style.transition = ''; });
    requestAnimationFrame(function () { requestAnimationFrame(go); });
  }
  function moveInd(instant, center) {
    var box = $('#ach-filters2'), ind = box && $('.v3a-ind', box), btn = box && $('.v3a-chip.on', box);
    if (!ind || !btn || !btn.offsetWidth) return;
    if (instant) ind.style.transition = 'none';
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    if (instant) { reflow(ind); ind.style.transition = ''; return; }
    if (!center) return;
    /* Выбранный чип встаёт по центру ленты, как в концепте. */
    var l = Math.max(0, btn.offsetLeft - (box.clientWidth - btn.offsetWidth) / 2);
    try { box.scrollTo({ left: l, behavior: D(1) ? 'smooth' : 'auto' }); } catch (e) { box.scrollLeft = l; }
  }

  /* mode 'flip' — после «Забрать»: карточки переезжают на новые места.
     Смена фильтра — карточки проявляются лесенкой. */
  function list(box, mode) {
    var ap = api();
    if (!ap) throw new Error('v3ach: no api');
    var filt = ap.filter(), onScr = onAch();
    var switched = onScr && UI.filter != null && UI.filter !== filt;
    var canAnim = onScr && !!box.animate && D(1) > 0;
    var flip = canAnim && mode === 'flip', stagger = canAnim && !flip && switched, before = {};
    if (flip) $$('.v3a-card', box).forEach(function (el) { before[el.getAttribute('data-ach')] = el.getBoundingClientRect().top; });
    if (UI.filter !== filt) UI.open = null;
    var all = rowsNow();
    ap.renderFilterCounts(all);
    var rows = all.filter(function (r) { return ap.statusMatch(r, filt); }), h = '';
    function sec(title, arr, hot) {
      if (!arr.length) return;
      h += '<div class="v3a-sec' + (hot ? ' hot' : '') + '" role="presentation">' + esc(title) + '<i>' + arr.length + '</i></div>';
      arr.forEach(function (r) { h += cardHTML(r); });
    }
    if (filt === 'all' || filt === 'reward') {
      var near = [], doing = [], got = [], rest = [];
      rows.forEach(function (r) {
        if (r.un) got.push(r); else if (r.ratio >= 0.5) near.push(r); else if (r.ratio > 0) doing.push(r); else rest.push(r);
      });
      near.sort(function (x, y) { return y.ratio - x.ratio; });
      doing.sort(function (x, y) { return y.ratio - x.ratio; });
      got.sort(function (x, y) { return y.at - x.at; });
      sec(t('v3a_sec_near'), near, true); sec(t('ach_sec_doing'), doing); sec(t('ach_sec_got'), got); sec(t('v3a_sec_ahead'), rest);
    } else {
      rows.sort(function (x, y) { return filt === 'got' ? y.at - x.at : y.ratio - x.ratio; });
      rows.forEach(function (r) { h += cardHTML(r); });
    }
    box.innerHTML = h || '<div class="v3a-empty">' + esc(t('v3a_empty')) + '</div>';
    fillBars(box, !stagger);
    ap.syncFilters();
    moveInd(UI.filter == null || !onScr, switched);
    /* Во время докрутки шапки после «Забрать» её не перерисовываем. */
    if (mode !== 'flip' && !(UI.growUntil > performance.now())) head();
    UI.filter = filt;
    if (stagger) {
      $$('.v3a-card', box).forEach(function (el, i) {
        el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: D(380), delay: D(Math.min(i * 30, 300)), easing: 'ease-out', fill: 'backwards' });
      });
      return;
    }
    if (!flip) return;
    $$('.v3a-card', box).forEach(function (el) {
      var b = before[el.getAttribute('data-ach')], now = el.getBoundingClientRect().top;
      if (b == null) el.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: D(420), easing: 'ease-out' });
      else if (Math.abs(b - now) > 1) el.animate([{ transform: 'translateY(' + (b - now) + 'px)' }, { transform: 'none' }], { duration: D(620), easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    });
    $$('.v3a-sec, .v3a-empty', box).forEach(function (el) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D(360), easing: 'ease-out' }); });
  }

  function collapse(card) {
    var more = $('.v3a-more', card);
    card.classList.remove('x');
    $('.v3a-card-top', card).setAttribute('aria-expanded', 'false');
    more.style.height = more.scrollHeight + 'px';
    reflow(more);
    more.style.height = '0px';
  }
  function rowOf(id) { return rowsNow().filter(function (x) { return x.a.id === id; })[0]; }
  function toggleCard(card) {
    var id = card.getAttribute('data-ach'), more = $('.v3a-more', card), open = !card.classList.contains('x');
    $$('.v3a-card.x', $('#ach-list')).forEach(function (c) { if (c !== card) collapse(c); });
    if (!open) { UI.open = null; collapse(card); return; }
    var r = rowOf(id);
    if (!r) return;
    UI.open = id;
    $('.v3a-more-in', card).innerHTML = moreHTML(r);
    card.classList.add('x');
    $('.v3a-card-top', card).setAttribute('aria-expanded', 'true');
    more.style.height = more.scrollHeight + 'px';
    var done = function (e) { if (e.propertyName === 'height') { more.style.height = 'auto'; more.removeEventListener('transitionend', done); } };
    more.addEventListener('transitionend', done);
    if (!D(1)) more.style.height = 'auto';
    /* Раскрытая карточка у нижнего края — доводим в поле зрения. */
    later(400, function () {
      var sc = $('#ach-body'), cr = card.getBoundingClientRect(), sr = sc.getBoundingClientRect();
      if (cr.bottom > sr.bottom - 8) sc.scrollBy({ top: Math.min(cr.bottom - sr.bottom + 16, cr.top - sr.top - 70), behavior: D(1) ? 'smooth' : 'auto' });
    });
  }
  /* Надеть предмет; тема и акцент меняются круговым раскрытием от кнопки. */
  function equipFx(id, btn, then) {
    var ap = api(), it = ap.ITEMS[id], br = btn.getBoundingClientRect();
    var run = function () { if (ap.equipItem(id)) { try { ap.renderVitrine(); } catch (e) { /* витрина перерисуется при входе */ } then(); } };
    if (!it || (it.type !== 'theme' && it.type !== 'accent') || !document.startViewTransition || !D(1)) { run(); return; }
    var root = document.documentElement, done = function () { root.classList.remove('v3a-vt'); };
    root.style.setProperty('--v3a-vx', (br.left + br.width / 2) + 'px');
    root.style.setProperty('--v3a-vy', (br.top + br.height / 2) + 'px');
    root.classList.add('v3a-vt');
    try { document.startViewTransition(run).finished.then(done, done); } catch (e) { done(); run(); }
  }
  function wear(btn) {
    /* equipItem — переключатель, а view transition выполняет его асинхронно:
       второй быстрый тап снял бы только что надетое. */
    if (btn.__v3busy) return;
    btn.__v3busy = true;
    setTimeout(function () { btn.__v3busy = false; }, D(700) + 100);
    var id = btn.getAttribute('data-wear'), card = btn.closest('.v3a-card');
    equipFx(id, btn, function () {
      var r = card && rowOf(card.getAttribute('data-ach'));
      if (r) {
        var inn = $('.v3a-more-in', card);
        inn.innerHTML = moreHTML(r);
        $$('.st.ok', inn).forEach(function (s) { restart(s, 'pop'); });
      }
      vib(10);
    });
  }

  /* Экран въезжает поверх профиля и уезжает обратно, как .view-ach в
     концепте. main.js гасит старый экран за 100 мс, поэтому на время
     перехода держим видимыми оба (классы на #app, стили в v3-ach.css). */
  var PUSH = { t: 0, reset: false };
  function pushFx(id) {
    var app = $('#app'), ach = $('#scr-ach'), main = $('#app-main');
    if (!app || !ach || !main) return;
    /* .screen-out ставит showScreen уходящему экрану, если переход анимирован. */
    var enter = id === 'scr-ach' && main.classList.contains('screen-out');
    var leave = id === 'app-main' && ach.classList.contains('screen-out');
    clearTimeout(PUSH.t);
    if (PUSH.end) { ach.removeEventListener('animationend', PUSH.end); PUSH.end = null; }
    app.classList.remove('v3a-push', 'v3a-pop');
    if ((!enter && !leave) || !D(1)) return;
    reflow(app);
    app.classList.add(enter ? 'v3a-push' : 'v3a-pop');
    /* Снимаем по концу анимации экрана достижений; таймер — страховка
       (новый экран main.js показывает через 100 мс, кадры могут опаздывать). */
    var cls = enter ? 'v3a-push' : 'v3a-pop', end = function (e) {
      if (e && (e.target !== ach || !/^v3aSlide/.test(e.animationName))) return;
      ach.removeEventListener('animationend', end);
      clearTimeout(PUSH.t);
      app.classList.remove(cls);
    };
    ach.addEventListener('animationend', end);
    PUSH.end = end;
    PUSH.t = setTimeout(end, D(520) + 4000);
  }
  /* Скролл экрана и дороги рангов. Пока #scr-ach скрыт (display:none),
     scrollTop не присваивается — экран показывался на старом месте, и
     переход к карточке «прыгал». Поэтому сбрасываем и в момент показа. */
  function resetScroll() {
    var bd = $('#ach-body'), rw = $('#ach-road-wrap'), road = $('#ach-road');
    if (!bd || !bd.getClientRects().length) return false;
    bd.scrollTop = 0;
    if (rw && road && road.__x != null) rw.scrollLeft = Math.max(0, road.__x - 120);
    return true;
  }

  /* Вход на экран: кольцо зажигается по делению, очки докручиваются,
     шапка поднимается (в концепте каскад только у неё — список въезжает
     вместе с экраном). */
  function intro() {
    var bd = $('#ach-body'), box = $('#ach-list');
    if (!bd || !api()) return;
    /* Раскрытая в прошлый заход карточка — свернуть: переход к карточке
       должен раскрыть её заново, с анимацией. */
    if (UI.open && box) { UI.open = null; list(box); }
    head('intro');
    var hd = $('#ach-head');
    if (hd) {
      hd.classList.remove('v3-rv');
      hd.style.setProperty('--d', '0');
      reflow(hd);
      hd.classList.add('v3-rv');
    }
    PUSH.reset = !resetScroll();
    fillBars($('#ach-list'), false);
    later(40, function () { moveInd(true); });
    setTimeout(function () { moveInd(true); }, 360);
  }

  /* ---------------- Частицы ---------------- */

  /* Два слоя: передний (искры, след медали) поверх всего и задний
     (конфетти) — внутри церемонии за текстом. Координаты — вьюпорт. */
  var GOLD = ['#fff3c4', '#f7d879', '#f0c04d', '#ffffff', '#e9b640'];
  var CONF = ['#f0c04d', '#f7d879', '#c08cf5', '#5aaeff', '#36d27c', '#ffffff', '#ff7aa2'];
  var FXS = { parts: [], run: false, last: 0, dpr: 1, w: 0, h: 0, front: null, back: null, cf: null, cb: null };
  function fxSize() {
    if (!FXS.front) {
      FXS.front = document.createElement('canvas');
      FXS.front.className = 'v3a-fxc';
      FXS.front.setAttribute('aria-hidden', 'true');
      document.body.appendChild(FXS.front);
      FXS.cf = FXS.front.getContext('2d');
    }
    FXS.back = $('#ach-cer-fx');
    FXS.cb = FXS.back ? FXS.back.getContext('2d') : null;
    FXS.dpr = Math.min(2, window.devicePixelRatio || 1);
    FXS.w = window.innerWidth; FXS.h = window.innerHeight;
    [FXS.front, FXS.back].forEach(function (c) { if (c) { c.width = Math.round(FXS.w * FXS.dpr); c.height = Math.round(FXS.h * FXS.dpr); } });
  }
  function rel(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  }
  function addP(p) {
    if (V3.lite() || !FXS.cf) return;
    p.t = 0;
    FXS.parts.push(p);
    if (!FXS.run) { FXS.run = true; FXS.last = performance.now(); requestAnimationFrame(fxLoop); }
  }
  function star4(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s);
    c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s);
    c.fill();
  }
  function fxLoop(ts) {
    /* Частицы тоже подчиняются --k (D(1) — текущий множитель). */
    var dt = Math.min(40, ts - FXS.last) / 16.67 / (D(1) || 1);
    FXS.last = ts;
    var cs = [FXS.cf, FXS.cb].filter(Boolean), P = FXS.parts;
    cs.forEach(function (c) { c.setTransform(FXS.dpr, 0, 0, FXS.dpr, 0, 0); c.clearRect(0, 0, FXS.w, FXS.h); });
    for (var i = P.length - 1; i >= 0; i--) {
      var p = P[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.t += dt;
      var k = p.t / p.life;
      if (k >= 1) { P.splice(i, 1); continue; }
      var c = p.back && FXS.cb ? FXS.cb : FXS.cf;
      c.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      if (p.k === 'spark') {
        p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        c.globalAlpha = 1 - k * k;
        c.strokeStyle = p.c; c.lineWidth = p.s * (1 - k * 0.6); c.lineCap = 'round';
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2.6, p.y - p.vy * 2.6); c.stroke();
      } else if (p.k === 'conf') {
        p.vx *= Math.pow(0.985, dt); p.vy = p.vy * Math.pow(0.985, dt) + 0.24 * dt;
        if (p.vy > 5.5) p.vy = 5.5;
        p.x += (p.vx + Math.sin(p.t * 0.1 + p.ph) * 0.6) * dt; p.y += p.vy * dt;
        p.r += p.vr * dt;
        c.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.scale(1, Math.cos(p.t * 0.18 + p.ph));
        c.fillStyle = p.c;
        if (p.round) { c.beginPath(); c.arc(0, 0, p.w / 2, 0, 6.283); c.fill(); } else c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      } else if (p.k === 'mote') {
        var e = easeInOut(k), mx = lerp(p.sx, p.x, e), my = lerp(p.sy, p.y, e);
        c.globalAlpha = Math.sin(k * Math.PI);
        c.fillStyle = p.c; c.beginPath(); c.arc(mx, my, p.s * (1 - e * 0.5), 0, 6.283); c.fill();
      } else if (p.k === 'glit') {
        p.y += p.vy * dt; p.x += Math.sin(p.t * 0.05 + p.ph) * 0.3 * dt;
        c.globalAlpha = (0.5 + 0.5 * Math.sin(p.t * 0.3 + p.ph)) * (1 - k);
        c.fillStyle = p.c; star4(c, p.x, p.y, p.s);
      } else if (p.k === 'tw') {
        c.globalAlpha = Math.sin(k * Math.PI);
        c.fillStyle = p.c; star4(c, p.x, p.y, p.s * Math.sin(k * Math.PI));
      } else if (p.k === 'ring') {
        c.globalAlpha = (1 - k) * 0.9;
        c.strokeStyle = p.c; c.lineWidth = 2.2 * (1 - k) + 0.4;
        c.beginPath(); c.arc(p.x, p.y, lerp(p.r0, p.r1, easeOut(k)), 0, 6.283); c.stroke();
      }
    }
    cs.forEach(function (c) { c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; });
    if (P.length) requestAnimationFrame(fxLoop);
    else { FXS.run = false; cs.forEach(function (c) { c.clearRect(0, 0, FXS.w, FXS.h); }); }
  }
  function sparks(x, y, n, spd, cols, g) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = spd * (0.35 + Math.random() * 0.85);
      addP({ k: 'spark', add: true, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.93, g: g == null ? 0.05 : g, life: 34 + Math.random() * 34, s: 1.3 + Math.random() * 1.9, c: pick(cols || GOLD) });
    }
  }
  function twinkles(x, y, n, r, cols) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, d = r * (0.6 + Math.random() * 0.6);
      addP({ k: 'tw', add: true, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, s: 3 + Math.random() * 5, life: 30 + Math.random() * 30, delay: Math.random() * 30, c: pick(cols || GOLD) });
    }
  }
  function charge(x, y, n, frames) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, d = 110 + Math.random() * 90;
      addP({ k: 'mote', add: true, sx: x + Math.cos(a) * d, sy: y + Math.sin(a) * d, x: x, y: y, s: 1.2 + Math.random() * 1.8, life: frames * (0.7 + Math.random() * 0.3), delay: Math.random() * frames * 0.3, c: pick(GOLD) });
    }
  }
  function cannon(side, n) {
    var x = side < 0 ? -6 : FXS.w + 6, y = FXS.h * 0.86;
    for (var i = 0; i < n; i++) {
      var a = (side < 0 ? -62 : -118) * Math.PI / 180 + (Math.random() - 0.5) * 0.55, v = 12 + Math.random() * 10;
      addP({ k: 'conf', back: true, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, round: Math.random() < 0.2, ph: Math.random() * 6, life: 150 + Math.random() * 60, delay: Math.random() * 8, c: pick(CONF) });
    }
  }
  function rain(n) {
    for (var i = 0; i < n; i++) {
      addP({ k: 'conf', back: true, x: Math.random() * FXS.w, y: -20 - Math.random() * 160, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2.5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25, w: 5 + Math.random() * 4, h: 8 + Math.random() * 5, round: Math.random() < 0.25, ph: Math.random() * 6, life: 200 + Math.random() * 60, c: pick(CONF) });
    }
  }
  function glitter(n) {
    for (var i = 0; i < n; i++) {
      addP({ k: 'glit', add: true, back: true, x: Math.random() * FXS.w, y: -10 - Math.random() * FXS.h * 0.5, vy: 0.9 + Math.random() * 1.6, s: 2 + Math.random() * 3.5, ph: Math.random() * 6, life: 220 + Math.random() * 80, delay: Math.random() * 120, c: pick(GOLD) });
    }
  }
  function ringP(x, y, r0, r1, c) { addP({ k: 'ring', add: true, x: x, y: y, r0: r0, r1: r1, life: 40, c: c || '#f7d879' }); }

  /* ---------------- Церемония выдачи ---------------- */

  var CER = { on: false, playing: false, closing: false, selfClose: false, batch: [], idx: 0, total: 0, base: 0, cur: null, got: [], pend: [], fin: [], anims: [], tok: 0, timers: [] };
  var STAGES = ['s-arc', 's-flip', 's-text', 's-rw', 's-prog', 's-btn'];
  function modal() { return $('#modal-ach'); }
  function body() { return $('#ach-cer-body'); }
  function ctimer(ms, fn) { var tok = CER.tok, id = later(ms, function () { if (tok === CER.tok) fn(); }); CER.timers.push(id); return id; }
  /* Шаг таймлайна: fn(instant). Пропуск выполняет все оставшиеся шаги сразу. */
  function cerAt(ms, fn) {
    var job = { fn: fn, done: false };
    CER.pend.push(job);
    job.id = later(ms, function () { if (!job.done) { job.done = true; fn(false); } });
  }
  function clearPend() { CER.pend.forEach(function (j) { clearTimeout(j.id); j.done = true; }); CER.pend = []; CER.fin = []; }
  function skip() {
    if (!CER.playing) return;
    var m = modal();
    m.classList.add('instant');
    CER.anims.forEach(function (a) { try { a.finish(); } catch (e) { /* уже закончилась */ } });
    var jobs = CER.pend;
    CER.pend = [];
    jobs.forEach(function (job) { if (!job.done) { clearTimeout(job.id); job.done = true; job.fn(true); } });
    CER.fin.forEach(function (f) { f(); });
    CER.fin = [];
    reflow(m);
    requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.remove('instant'); }); });
  }

  function ceremony(batch) {
    var ap = api(), m = modal(), bd = body();
    if (!ap || !m || !bd || !batch || !batch.length) throw new Error('v3ach: ceremony unavailable');
    hardReset(true);
    CER.on = true;
    CER.batch = batch.slice(); CER.total = batch.length; CER.idx = 0; CER.got = [];
    var sum = 0;
    batch.forEach(function (a) { sum += ap.rewardPts(a); });
    CER.base = Math.max(0, (Number(S.achPts) || 0) - sum);
    /* Прибавляем: медали прошлой церемонии могут ещё лететь. */
    PEND.n += batch.length; PEND.pts += sum;
    batch.forEach(function (a) { PEND.ids[a.id] = 1; });
    if (onAch()) { var lb = $('#ach-list'); if (lb) list(lb); else head(); }
    openModal('modal-ach');
    reflow(m);
    m.classList.add('vis');
    fxSize();
    renderDots();
    play(true);
  }
  function renderDots() {
    var q = $('#ach-cer-q'), h = '';
    q.classList.toggle('on', CER.total > 1);
    for (var i = 0; i < CER.total; i++) h += '<i class="' + (i < CER.idx ? 'got' : i === CER.idx ? 'cur' : '') + '"></i>';
    q.innerHTML = h;
  }
  /* Достижение пришло во время церемонии — в хвост очереди. */
  function append(a) {
    if (!a) return true;
    if (!CER.on || CER.closing || !api()) return false;
    CER.batch.push(a);
    CER.total++;
    PEND.n++; PEND.pts += api().rewardPts(a); PEND.ids[a.id] = 1;
    renderDots();
    if (onAch()) { var lb = $('#ach-list'); if (lb) list(lb); else head(); }
    var ok = $('#ach-ok');
    if (ok && !ok.disabled) ok.textContent = t('v3a_next_btn', { i: CER.idx + 2, n: CER.total });
    return true;
  }
  function milestones() {
    var ap = api(), m = {};
    ap.FEE_TIERS.slice(1).forEach(function (f) { (m[f[0]] = m[f[0]] || {}).fee = f[1]; });
    ap.RANKS.forEach(function (r) { (m[r.pts] = m[r.pts] || {}).rank = r; });
    return Object.keys(m).map(Number).sort(function (a, b) { return a - b; }).map(function (p) { return { p: p, fee: m[p].fee, rank: m[p].rank }; });
  }
  function play(first) {
    var ap = api(), a = CER.batch[CER.idx], m = modal(), bd = body(), btns = $('#ach-cer-btns'), pct = ap.pctStr;
    var pts = ap.rewardPts(a), p0 = CER.base;
    for (var bi = 0; bi < CER.idx; bi++) p0 += ap.rewardPts(CER.batch[bi]);
    var p1 = p0 + pts;
    var w = ap.rewardWeight(a), tier = w >= 140 ? 'max' : w >= 60 ? 'mid' : 'lite';
    var r0 = ap.rankFor(p0), r1 = ap.rankFor(p1), rankUp = r1 && (!r0 || r1.pts > r0.pts);
    var f0 = ap.feeRateFor(p0), f1 = ap.feeRateFor(p1), feeDown = f1 < f0;
    var items = ap.rewardItems(a), sp = ap.rewardSpins(a), wearIt = items[0] || null;
    CER.cur = { a: a, p0: p0, p1: p1 };

    /* Полоса очков: от ближайшей вехи ниже старта до ближайшей выше финиша. */
    var ms = milestones(), lo = 0, hi = null;
    ms.forEach(function (x) { if (x.p <= p0) lo = x.p; if (hi == null && x.p > p1) hi = x.p; });
    if (hi == null) hi = Math.max(p1, 1280) + 100;
    var span = hi - lo, ticks = ms.filter(function (x) { return x.p > lo && x.p < hi; });
    function mlabel(x) { var rn = x.rank ? t('rank_' + x.rank.id) : ''; return x.rank && x.fee ? rn + ' · ' + pct(x.fee) : x.rank ? rn : pct(x.fee); }
    var hiM = ms.filter(function (x) { return x.p === hi; })[0];

    var words = t('ach_' + a.id + '_t').split(' ').map(function (wd, i) { return '<span class="w" style="--i:' + i + '">' + esc(wd) + '</span>'; }).join(' ');
    var rows = '', ri = 0;
    rows += '<div class="crow pts" style="--i:' + (ri++) + '"><span class="ci">' + SVG.star + '</span><span class="tx">' + esc(t('ach_pts_name_long')) + '<span>' + esc(t('v3a_cer_pts_sub')) + '</span></span><b class="val mono" id="ach-cer-pts">+' + pts + '</b></div>';
    if (sp) rows += '<div class="crow spin" style="--i:' + (ri++) + '"><span class="ci">' + SVG.wheel + '</span><span class="tx">' + esc(t(sp > 1 ? 'v3a_cer_spin5' : 'v3a_cer_spin1')) + '<span>' + esc(t('v3a_spin_sub')) + '</span></span><b class="val mono">×' + sp + '</b></div>';
    if (items.length > 1) {
      rows += '<div class="crow item items" style="--i:' + (ri++) + ';--n:' + Math.min(items.length, 4) + '">' + items.slice(0, 4).map(function (it) {
        var k = ap.ITEM_KIND[it.type] || ap.ITEM_KIND.frame;
        return '<span class="it"><span class="ci">' + itemPv(it) + '</span><b>' + esc(ap.quoteName(it.name)) + '</b><i>' + esc(t(k.word)) + '</i><u></u></span>';
      }).join('') + '</div>';
    } else {
      items.forEach(function (it) {
        var k = ap.ITEM_KIND[it.type] || ap.ITEM_KIND.frame;
        rows += '<div class="crow item" style="--i:' + (ri++) + '"><span class="ci">' + itemPv(it) + '</span><span class="tx">' + esc(t(k.word) + ' ' + ap.quoteName(it.name)) + '<span>' + esc(t('v3a_in_vitrine')) + '</span></span><span class="tag">' + esc(t('v3a_new')) + '</span></div>';
      });
    }
    var fi1 = ap.feeTierInfo(p1);
    var fee = feeDown ? '<div class="cer-fee" id="ach-cer-fee">' + esc(t('v3a_fee')) + ' <s>' + pct(f0) + '</s><span class="arr">→</span><b>' + pct(f1) + '</b></div>'
      : '<div class="cer-fee">' + esc(fi1.next ? t('v3a_fee_next', { cur: pct(f1), next: pct(fi1.next.rate), n: fi1.next.pts - p1 }) : t('v3a_fee_min', { cur: pct(f1) })) + '</div>';
    /* Близкие вехи: подпись второй уходит над полосой, чтобы не слипались. */
    var prevX = -100, anyUp = false;
    var tickHTML = ticks.map(function (x) {
      var px = (x.p - lo) / span * 100, up = px - prevX < 24;
      prevX = up ? -100 : px;
      if (up) anyUp = true;
      return '<span class="cp-tick' + (up ? ' up' : '') + '" data-p="' + x.p + '" style="--x:' + px + '%"><em>' + esc(mlabel(x)) + '</em></span>';
    }).join('');
    var w0 = ((p0 - lo) / span * 100) + '%';
    var prog = '<div class="cer-prog' + (anyUp ? ' has-up' : '') + '"><div class="cp-top"><span>' + esc(t('ach_pts_name_long')) + '</span><b class="mono"><span id="ach-cp-v">' + p0 + '</span> <em>+' + pts + '</em></b></div>' +
      '<div class="cp-bar"><i class="old" style="width:' + w0 + '"></i><i class="new" id="ach-cp-new" style="width:' + w0 + '"></i>' + tickHTML +
      '</div><div class="cp-ends mono"><span>' + lo + '</span><span>' + hi + (hiM ? ' · ' + esc(mlabel(hiM)) : '') + '</span></div>' + fee + '</div>';
    var rank = rankUp ? '<div class="cer-rank" id="ach-cer-rank" style="--rc:' + RANK_C[r1.id] + '"><i class="rring"></i><span class="m"><span>' + esc(t('v3a_new_rank')) + '</span><b>' + esc(t('rank_' + r1.id)) + '</b><i>' + esc(t('v3a_perk_' + r1.id)) + '</i></span></div>' : '';
    var face = function (cls, extra) {
      var img = ap.ACH_IMG[a.id] ? '<img src="img/ach-dark/' + ap.ACH_IMG[a.id] + '" alt="" draggable="false" onerror="this.remove()">' : '';
      return '<div class="cm-face v3a-medal ' + cls + '"><span class="fb">' + ap.icon(a.icon) + '</span>' + img + extra + '</div>';
    };

    if (btns.parentNode === bd) bd.removeChild(btns);
    bd.innerHTML = '<div class="cer-shake"><div class="cm-stage"><div class="cm" id="ach-cm">' +
      '<svg class="cm-arc" viewBox="0 0 156 156" aria-hidden="true"><circle class="trk" cx="78" cy="78" r="74"/><circle class="arc" cx="78" cy="78" r="74" pathLength="100"/></svg>' +
      '<div class="cm-head"></div><div class="cm-flip">' +
      '<svg class="cm-orb" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49"/></svg>' +
      face('off cm-front', '<span class="lk">' + SVG.lock + '</span>') + face('cm-back', '<span class="shine"></span>') +
      '</div><i class="cm-flash"></i><i class="cm-shock"></i><i class="cm-shock"></i></div></div>' +
      '<span class="cer-kicker">' + esc(t('ach_kicker')) + '</span><h2 class="cer-title" id="ach-cer-title">' + words + '</h2><p class="cer-desc">' + esc(t('ach_' + a.id + '_d')) + '</p></div>' +
      '<div class="cer-rw">' + rows + '</div>' + prog + rank;
    bd.appendChild(btns);
    var wb = $('#ach-cer-wear'), ok = $('#ach-ok');
    wb.classList.toggle('hidden', !wearIt);
    wb.classList.remove('ok');
    if (wearIt) {
      wb.setAttribute('data-item', wearIt.id);
      if (ap.isEquipped(wearIt.id)) { wb.classList.add('ok'); wb.innerHTML = SVG.check + esc(t('ach_vit_worn')); }
      else wb.textContent = t('v3a_wear_' + wearIt.type);
    }
    ok.textContent = CER.idx < CER.total - 1 ? t('v3a_next_btn', { i: CER.idx + 2, n: CER.total }) : t('v3a_collect');
    ok.disabled = false;

    STAGES.forEach(function (s) { m.classList.remove(s); });
    m.classList.remove('lite', 'mid', 'max');
    m.classList.add(tier, 'playing');
    bd.classList.toggle('dense', ri >= 4 || (ri >= 3 && rankUp));
    CER.playing = true;
    clearPend();
    CER.anims = [];
    bd.scrollTop = 0;
    var cm = $('#ach-cm'), mc = rel(cm);
    m.style.setProperty('--my', mc.y + 'px');

    /* Вход медали: из центра (первая) или справа (следующая в очереди). */
    if (cm.animate && D(1)) {
      CER.anims.push(first
        ? cm.animate([{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.7 }, { transform: 'none', opacity: 1 }], { duration: D(560), easing: 'ease-out', fill: 'backwards' })
        : cm.animate([{ transform: 'translateX(70px) scale(0.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: D(460), easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)', fill: 'backwards' }));
    }
    var T = first ? 420 : 300, nCharge = tier === 'max' ? 46 : tier === 'mid' ? 32 : 20;
    cerAt(T, function (inst) {
      m.classList.add('s-arc');
      if (!inst) { var c = rel($('#ach-cm')); charge(c.x, c.y, nCharge, 48); }
    });
    cerAt(T + 820, function (inst) {
      m.classList.add('s-flip', 'amb');
      var c = rel($('#ach-cm'));
      if (!inst) {
        sparks(c.x, c.y, tier === 'max' ? 80 : tier === 'mid' ? 54 : 34, tier === 'lite' ? 7 : 9);
        twinkles(c.x, c.y, tier === 'lite' ? 8 : 14, 90);
        ringP(c.x, c.y, 50, tier === 'lite' ? 120 : 170);
        vib(tier === 'max' ? [30, 40, 30, 40, 60] : [20, 40, 20]);
      }
      if (tier === 'mid') { cannon(-1, 42); cannon(1, 42); }
      if (tier === 'max') { cannon(-1, 70); cannon(1, 70); glitter(60); ctimer(700, function () { rain(56); }); }
    });
    cerAt(T + 1060, function () { m.classList.add('s-text'); });
    var tRw = T + 1420;
    cerAt(tRw, function (inst) {
      m.classList.add('s-rw');
      var v = $('#ach-cer-pts');
      if (inst || pts < 5 || !v) return;
      v.textContent = '+0';
      var stop = null;
      var tm = later(260, function () { stop = V3.tween(620, function (p) { v.textContent = '+' + Math.round(pts * easeOut(p)); }); });
      CER.fin.push(function () { clearTimeout(tm); if (stop) stop(); v.textContent = '+' + pts; });
    });
    if (tier === 'max') cerAt(tRw + 200, function (inst) { if (!inst) { cannon(-1, 36); cannon(1, 36); } });
    var tProg = tRw + ri * 120 + 420;
    cerAt(tProg, function () { m.classList.add('s-prog'); });
    var hitTick = function (x, inst) {
      var tk = $('.cp-tick[data-p="' + x.p + '"]', bd);
      if (!tk || tk.classList.contains('hit')) return;
      tk.classList.add('hit');
      var c = rel(tk);
      if (!inst) sparks(c.x, c.y, 16, 4.5);
      if (x.fee) { var fe = $('#ach-cer-fee'); if (fe) fe.classList.add('hit'); }
      if (x.rank) {
        var rk = $('#ach-cer-rank');
        if (rk) {
          rk.classList.add('hit');
          if (!inst) ctimer(160, function () { var rc = rel(rk); sparks(rc.x - rc.w / 2 + 34, rc.y, 30, 6, [RANK_C[x.rank.id], '#ffffff', '#f7d879']); twinkles(rc.x, rc.y, 10, rc.w / 2); vib([15, 30, 15]); });
        }
      }
    };
    cerAt(tProg + 260, function (inst) {
      var bar = $('#ach-cp-new'), cv = $('#ach-cp-v'), crossing = ticks.filter(function (x) { return x.p > p0 && x.p <= p1; });
      var set = function (v) {
        bar.style.width = ((v - lo) / span * 100) + '%';
        cv.textContent = Math.round(v);
        crossing.forEach(function (x) { if (v >= x.p) hitTick(x, inst); });
      };
      if (inst) { set(p1); return; }
      var stop = V3.tween(1000, function (p) { set(lerp(p0, p1, easeInOut(p))); });
      CER.fin.push(function () { stop(); set(p1); });
    });
    cerAt(tProg + 1360 + (rankUp ? 320 : 0), function () {
      m.classList.add('s-btn');
      m.classList.remove('playing');
      CER.playing = false;
      try { ok.focus({ preventScroll: true }); } catch (e) { /* фокус не критичен */ }
    });
  }

  function next() {
    CER.got.push(CER.cur);
    $('#ach-ok').disabled = true;
    var dot = $$('#ach-cer-q i')[CER.idx], back = $('.cm-back', body());
    if (dot && back) flyMedal(CER.cur.a, back, dot, 520, 10, function () { restart(dot, 'catch'); });
    body().classList.add('out');
    ctimer(340, function () {
      body().classList.remove('out');
      CER.idx++;
      renderDots();
      play(false);
    });
  }

  /* Цель полёта: видимое кольцо коллекции, иначе счётчик очков или вкладка «Профиль». */
  function visibleIn(el) {
    if (!el || !el.offsetParent) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
  }
  function flyTarget() {
    if (onAch()) {
      var ring = $('#ach-ring'), rr = ring.getBoundingClientRect(), sr = $('#ach-body').getBoundingClientRect();
      return rr.top >= sr.top - 10 && rr.bottom <= sr.bottom + 10 ? ring : $('#ach-pill');
    }
    var pr = $('#v3p-ring');
    if (visibleIn(pr)) return pr;
    var row = $('#ach-row-ring');
    if (visibleIn(row)) return row;
    var tab = $('.tabbar [data-tab="profile"] img');
    return visibleIn(tab) ? tab : null;
  }
  function flyMedal(a, fromEl, toEl, ms, endSize, done) {
    var f = rel(fromEl), tt = rel(toEl);
    if (!D(1) || !f.w) { if (done) done(); return; }
    var el = document.createElement('div');
    el.className = 'v3a-fly';
    el.innerHTML = medalHTML(a, Math.round(f.w), { open: true, plain: true });
    document.body.appendChild(el);
    var sz = f.w, end = endSize || Math.min(46, tt.w * 0.55);
    var cx = (f.x + tt.x) / 2 + (tt.x < f.x ? -70 : 70), cy = Math.min(f.y, tt.y) - 90;
    var place = function (p) {
      var e = easeInOut(p), u = 1 - e;
      var x = u * u * f.x + 2 * u * e * cx + e * e * tt.x, y = u * u * f.y + 2 * u * e * cy + e * e * tt.y;
      el.style.transform = 'translate(' + (x - sz / 2) + 'px,' + (y - sz / 2) + 'px) scale(' + lerp(1, end / sz, e) + ') rotate(' + (-18 * Math.sin(e * Math.PI)) + 'deg)';
      if (p > 0.05 && p < 0.95 && Math.random() < 0.7) addP({ k: 'spark', add: true, x: x, y: y, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, drag: 0.9, g: 0.02, life: 26, s: 2, c: pick(GOLD) });
    };
    place(0);
    V3.tween(ms, place, function () {
      el.remove();
      ringP(tt.x, tt.y, 8, 44);
      twinkles(tt.x, tt.y, 8, 24);
      if (done) done();
    });
  }
  /* После «Забрать»: счётчики докручиваются, кольцо зажигает новые деления,
     карточки переезжают в «Получено». */
  function syncAfter(target, got) {
    var ap = api(), n = got.length;
    got.forEach(function (g) { PEND.n--; PEND.pts -= ap.rewardPts(g.a); delete PEND.ids[g.a.id]; });
    if (PEND.n <= 0 || PEND.pts <= 0) { PEND.n = 0; PEND.pts = 0; }
    if (onAch()) {
      var lb = $('#ach-list');
      if (lb) list(lb, 'flip');
      UI.growUntil = performance.now() + D(1400);
      head('grow');
      if (target && target.id === 'ach-pill') restart(target, 'bump');
    }
    try { Ach.renderRow(); } catch (e) { /* строка профиля перерисуется сама */ }
    if (!target) return;
    var tab = target.closest('.tabbar button');
    if (tab) restart(tab, 'v3-catch');
    else if (target.id === 'ach-row-ring') restart(target, 'v3a-hit');
    else if (target.id === 'v3p-ring') {
      restart(target, 'hit');
      /* Профиль зажёг деления раньше, под церемонией, — вспыхиваем новыми. */
      $$('.tk.on', target).slice(-(n || 1)).forEach(function (tk, i) { later(i * 140, function () { restart(tk, 'ign'); }); });
    }
  }
  function collect() {
    CER.got.push(CER.cur);
    Snd.play('ach_points');
    $('#ach-ok').disabled = true;
    var m = modal(), back = $('.cm-back', body()), target = flyTarget(), got = CER.got.slice(), landed = false;
    CER.closing = true;
    m.classList.add('closing');
    $('#ach-cer-q').classList.remove('on');
    CER.landing = true;
    var land = function () { if (landed) return; landed = true; CER.landing = false; syncAfter(target, got); };
    if (back && target && D(1)) {
      $('#ach-cm').style.visibility = 'hidden';
      got.forEach(function (g, i) { setTimeout(function () { flyMedal(g.a, back, target, 760, 0, i === got.length - 1 ? land : null); }, D(i * 90)); });
      setTimeout(land, D(760 + got.length * 90) + 200);
    } else land();
    ctimer(460, function () { m.classList.remove('vis'); });
    ctimer(700, function () {
      CER.selfClose = true;
      try { closeModal('modal-ach'); } catch (e) { /* модалка уже закрыта */ }
      setTimeout(function () {
        CER.selfClose = false;
        hardReset(false);
        try { Ach.modalClosed(); } catch (e) { /* очередь подхватит тик */ }
      }, 230);
    });
  }
  function hardReset(keepPend) {
    CER.tok++;
    clearPend();
    CER.timers.forEach(clearTimeout);
    CER.timers = [];
    CER.on = false; CER.playing = false; CER.closing = false;
    var m = modal(), bd = body(), btns = $('#ach-cer-btns');
    if (bd && btns && btns.parentNode === bd) m.insertBefore(btns, bd.nextSibling);
    if (bd) { bd.innerHTML = ''; bd.classList.remove('dense', 'out'); }
    if (m) STAGES.concat(['lite', 'mid', 'max', 'playing', 'amb', 'vis', 'closing', 'instant']).forEach(function (s) { m.classList.remove(s); });
    if (!keepPend && !CER.landing && (PEND.n || PEND.pts)) {
      PEND.n = 0; PEND.pts = 0; PEND.ids = {};
      if (onAch()) { var lb = $('#ach-list'); if (lb) list(lb); else head(); }
    }
  }
  function onOk() {
    if (!CER.on) return false;
    if (CER.closing) return true;
    if (CER.playing) skip();
    if (CER.idx < CER.total - 1) next(); else collect();
    return true;
  }
  function wearCer(wb) {
    var id = wb.getAttribute('data-item');
    if (!id || wb.classList.contains('ok')) return;
    equipFx(id, wb, function () {
      var r = wb.getBoundingClientRect();
      sparks(r.left + r.width / 2, r.top + r.height / 2, 18, 4.5);
      wb.classList.add('ok');
      wb.innerHTML = SVG.check + esc(t('ach_vit_worn'));
      vib(10);
    });
  }

  /* Переход к карточке (витрина, «Почти готово»): плавный скролл,
     вспышка и раскрытие — как jumpTo в концепте. */
  function jump(id) {
    /* 560 — как openAch в концепте: скролл после въезда экрана. */
    later(560, function () {
      var box = $('#ach-list'), sc = $('#ach-body'), card = box && box.querySelector('.v3a-card[data-ach="' + id + '"]');
      if (!card || !sc || !onAch()) return;
      var from = sc.scrollTop, top = Math.max(0, card.getBoundingClientRect().top - sc.getBoundingClientRect().top + from - 90);
      /* Твином: подчиняется --k, а раскрытие ждёт конца скролла. */
      V3.tween(420, function (p) { sc.scrollTop = lerp(from, top, easeInOut(p)); }, function () {
        if (!card.isConnected) return;
        restart(card, 'ach-flash');
        card.addEventListener('animationend', function off(e) {
          if (e.target !== card) return;
          card.classList.remove('ach-flash');
          card.removeEventListener('animationend', off);
        });
        if (!card.classList.contains('x')) toggleCard(card);
      });
    });
  }

  /* ---------------- Привязка ---------------- */

  function bind() {
    var m = modal();
    if (m && !m.__v3a) {
      m.__v3a = true;
      m.addEventListener('click', function (e) {
        if (!CER.on || CER.closing || e.target.closest('#ach-ok')) return;
        if (CER.playing) { skip(); return; }
        var wb = e.target.closest('#ach-cer-wear');
        if (wb) wearCer(wb);
      });
      m.addEventListener('keydown', function (e) {
        if (CER.on && CER.playing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); skip(); }
      });
      /* Escape в церемонии: пропуск анимации, затем «Далее»/«Забрать» —
         раньше глобальный Escape из main.js гасил окно без полёта медали. */
      window.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !CER.on) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (CER.closing) return;
        if (CER.playing) { skip(); return; }
        var ok = $('#ach-ok');
        if (ok && !ok.disabled) ok.click();
      }, true);
      /* Закрыли снаружи (Escape в main.js) — гасим таймлайн. */
      if (window.MutationObserver) {
        new MutationObserver(function () {
          if (CER.on && !CER.selfClose && (m.classList.contains('modal-out') || m.classList.contains('hidden'))) hardReset(false);
        }).observe(m, { attributes: true, attributeFilter: ['class'] });
      }
    }
    var lst = $('#ach-list');
    if (lst && !lst.__v3a) {
      lst.__v3a = true;
      lst.addEventListener('click', function (e) {
        var wb = e.target.closest('[data-wear]');
        if (wb) { wear(wb); return; }
        var top = e.target.closest('.v3a-card-top');
        if (top && lst.contains(top)) toggleCard(top.parentNode);
      });
    }
    window.addEventListener('resize', function () { moveInd(true); });
  }

  V3.after('showScreen', function (r, args) {
    var id = args && args[0];
    pushFx(id);
    if (id === 'scr-ach') intro();
  });
  /* Экран стал видимым — в том же кадре, до отрисовки. */
  V3.after('applyScreenHidden', function (r, args) {
    if (args && args[0] === 'scr-ach' && PUSH.reset && resetScroll()) { PUSH.reset = false; moveInd(true); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  return { list: list, head: head, ceremony: ceremony, append: append, onOk: onOk, skip: skip, jump: jump, medalHTML: medalHTML, RANK_C: RANK_C,
    pending: function () { return { n: PEND.n, pts: PEND.pts }; } };
})();
