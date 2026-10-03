/* v3 — поведенческий слой «profile» по concept/profile.html.
   Герой с надетым (рамка, титул, ранг; подсветка в цвет рамки), лестница
   классов с живым капиталом, статистика, карточка достижений (очки → ранг
   и комиссия, «Почти готово») и витрина-примерочная. Точки входа из
   main.js: renderProfile → V3P.render, updateProfileLive → V3P.live,
   refreshProfileEquip → V3P.equip. Данные достижений — Ach.v3p. */
'use strict';

V3.i18n({
  ru: {
    v3p_class_kicker: 'Класс трейдера', v3p_all_classes: 'Все классы', v3p_capital: 'Капитал',
    v3p_from: 'от {x}', v3p_start: 'старт', v3p_bonus: 'бонус +{x}',
    v3p_title_none: 'Без титула', v3p_rank: 'Ранг {name}', v3p_rank_none: 'Без ранга',
    v3p_day_one: 'день', v3p_day_few: 'дня', v3p_day_many: 'дней', v3p_days_a: 'Дней в игре',
    v3p_pt_one: 'очко', v3p_pt_few: 'очка', v3p_pt_many: 'очков',
    v3p_n_of: '{n} из {m}', v3p_collected: 'собрано',
    v3p_goal_rank: 'Ранг «{name}»', v3p_goal_top: 'Высший ранг «{name}»',
    v3p_goal_fee: 'Комиссия {x}', v3p_goal_fee_min: 'Комиссия {x} · минимум', v3p_left: 'ещё {n}',
    v3p_near: 'Почти готово', v3p_all: 'Все',
    v3p_more_stats: 'Подробная статистика', v3p_more_lock: 'Ранг «{name}» · ещё {n} {w}',
    v3p_vit_all: 'Показать все {n}', v3p_vit_less: 'Свернуть',
    v3p_prev_chart: 'График рынка', v3p_worn_now: 'надето сейчас',
    v3p_theme_base: 'Графит',
    v3p_th_hint: 'Тема меняет палитру всего приложения. Нажмите на открытую, чтобы [b]применить сразу[/b]; закрытые подскажут, как их получить.',
    v3p_kind_frame: 'Рамка', v3p_kind_title: 'Титул', v3p_kind_candles: 'Свечи', v3p_kind_theme: 'Тема', v3p_kind_accent: 'Акцент',
    v3p_on_frame: 'Рамка «{name}» надета', v3p_off_frame: 'Рамка снята',
    v3p_on_title: 'Титул «{name}» надет', v3p_off_title: 'Титул снят',
    v3p_on_candles: 'Свечи «{name}»', v3p_off_candles: 'Стандартные свечи',
    v3p_on_theme: 'Тема «{name}»', v3p_off_theme: 'Тема снята',
    v3p_on_accent: 'Акцент «{name}»', v3p_off_accent: 'Акцент снят',
    v3p_a_worn: 'надето', v3p_a_wear: 'нажмите, чтобы надеть', v3p_a_locked: 'закрыто — как получить',
    v3p_src_hidden_d: 'Условие откроется само, когда вы его выполните',
    v3p_src_rank: 'Ранг «{name}»', v3p_src_rank_d: 'Копите очки достижений: {n} {w}',
    v3p_ok: 'Понятно', v3p_to_ach: 'К достижению', v3p_to_ranks: 'К рангам',
    v3p_cls_yours: 'ваш класс', v3p_cls_done: 'пройден',
    v3p_more_toast: 'Нужно ещё {n} {w} до ранга «{name}»'
  },
  en: {
    v3p_class_kicker: 'Trader class', v3p_all_classes: 'All classes', v3p_capital: 'Capital',
    v3p_from: 'from {x}', v3p_start: 'start', v3p_bonus: 'bonus +{x}',
    v3p_title_none: 'No title', v3p_rank: 'Rank {name}', v3p_rank_none: 'No rank',
    v3p_day_one: 'day', v3p_day_few: 'days', v3p_day_many: 'days', v3p_days_a: 'Days in game',
    v3p_pt_one: 'point', v3p_pt_few: 'points', v3p_pt_many: 'points',
    v3p_n_of: '{n} of {m}', v3p_collected: 'collected',
    v3p_goal_rank: 'Rank “{name}”', v3p_goal_top: 'Top rank “{name}”',
    v3p_goal_fee: 'Fee {x}', v3p_goal_fee_min: 'Fee {x} · minimum', v3p_left: '{n} to go',
    v3p_near: 'Almost there', v3p_all: 'All',
    v3p_more_stats: 'Detailed stats', v3p_more_lock: 'Rank “{name}” · {n} {w} to go',
    v3p_vit_all: 'Show all {n}', v3p_vit_less: 'Collapse',
    v3p_prev_chart: 'Market chart', v3p_worn_now: 'equipped now',
    v3p_theme_base: 'Graphite',
    v3p_th_hint: 'A theme repaints the whole app. Tap an unlocked one to [b]apply it instantly[/b]; locked ones tell you how to get them.',
    v3p_kind_frame: 'Frame', v3p_kind_title: 'Title', v3p_kind_candles: 'Candles', v3p_kind_theme: 'Theme', v3p_kind_accent: 'Accent',
    v3p_on_frame: 'Frame “{name}” equipped', v3p_off_frame: 'Frame removed',
    v3p_on_title: 'Title “{name}” equipped', v3p_off_title: 'Title removed',
    v3p_on_candles: 'Candles “{name}”', v3p_off_candles: 'Standard candles',
    v3p_on_theme: 'Theme “{name}”', v3p_off_theme: 'Theme removed',
    v3p_on_accent: 'Accent “{name}”', v3p_off_accent: 'Accent removed',
    v3p_a_worn: 'equipped', v3p_a_wear: 'tap to equip', v3p_a_locked: 'locked — how to get it',
    v3p_src_hidden_d: 'The condition reveals itself once you meet it',
    v3p_src_rank: 'Rank “{name}”', v3p_src_rank_d: 'Collect achievement points: {n} {w}',
    v3p_ok: 'Got it', v3p_to_ach: 'To achievement', v3p_to_ranks: 'To ranks',
    v3p_cls_yours: 'your class', v3p_cls_done: 'passed',
    v3p_more_toast: '{n} more {w} to rank “{name}”'
  }
});

var V3P = (function () {
  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var esc = V3.esc;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function later(ms, fn) { return setTimeout(fn, V3.D(ms)); }
  function restart(el, cls) { if (!el) return; el.classList.remove(cls); V3.reflow(el); el.classList.add(cls); }
  function A() { return (typeof Ach !== 'undefined' && Ach.isOn && Ach.isOn() && Ach.v3p) ? Ach.v3p : null; }
  function nf(v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F'); }
  function plural(n, base) {
    n = Math.abs(Math.round(n));
    if (LANG !== 'ru') return t(base + (n === 1 ? '_one' : '_many'));
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return t(base + '_one');
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t(base + '_few');
    return t(base + '_many');
  }
  /* t() с HTML-вставками: текст экранируется, значения vars — готовая разметка. */
  function tx(key, vars) {
    var ks = Object.keys(vars || {}), ph = {};
    ks.forEach(function (k, i) { ph[k] = '\u0001' + i + '\u0002'; });
    var s = esc(t(key, ph));
    ks.forEach(function (k, i) { s = s.split('\u0001' + i + '\u0002').join(vars[k]); });
    return s.replace(/\[b\]/g, '<b>').replace(/\[\/b\]/g, '</b>');
  }

  /* ---------------- Иконки (48×48, как в концепте) ---------------- */

  var P = {
    lock: '<rect x="13" y="21" width="22" height="15" rx="3"/><path d="M18 21v-5a6 6 0 0 1 12 0v5"/>',
    check: '<path d="M11 25l9 9 17-19"/>',
    gift: '<rect x="9" y="18" width="30" height="21" rx="3"/><path d="M6 13h36v6H6zM24 13v26"/><path d="M24 13c-3-6-10-6-10-1s10 1 10 1zM24 13c3-6 10-6 10-1s-10 1-10 1z"/>',
    pct: '<path d="M36 12L12 36"/><circle cx="17" cy="17" r="4"/><circle cx="31" cy="31" r="4"/>',
    chart: '<path d="M8 40h32"/><rect x="12" y="24" width="5" height="12" rx="1.5"/><rect x="21.5" y="16" width="5" height="20" rx="1.5"/><rect x="31" y="9" width="5" height="27" rx="1.5"/>'
  };
  function ic(name, sw, raw) {
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="' + (sw || 3.4) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (raw || P[name] || '') + '</svg>';
  }

  /* ---------------- Палитры ---------------- */

  var GOLD = '#e9b640';
  var FRAME_C = {
    paper: '#b9c2d1', ticket: '#58c3b0', wheel: '#f0a44a', copper: '#c9743a', brass: '#d9a94c', mosaic: '#6fb0ff',
    ember: '#ff7a3c', sector: '#9bd45a', console: '#58b6ff', zero: '#8b96b3', steel: '#c8d0dc', titan: '#5b8dd9',
    amber: '#ffb340', phoenix: '#ff6b4a', coin: '#e9b640', bronze: '#c98f5a', silver: '#dfe5ee', sapphire: '#4da3ff',
    amethyst: '#b678f0', emerald: '#2fbe6e', kit: '#ffb340'
  };
  var RANK_C = { retail: '#c98f5a', trader: '#aeb8c8', analyst: '#4da3ff', pro: '#b678f0', manager: '#2fbe6e', whale: '#ffb340' };
  var PAL = {
    base: { pb: '#0a0c10', pbd: '#222a36', pc: '#12161d', pt: '#f2f4f8', pu: '#2fbe6e', pd: '#f0524f', pg: '#e9b640' },
    theme_midnight: { pb: '#070b16', pbd: '#2a3d6b', pc: '#0d1322', pt: '#e8edf7', pu: '#4da3ff', pd: '#24304d', pg: '#e9b640' },
    theme_dawn: { pb: '#13172c', pbd: '#4b3a63', pc: '#2a1b33', pt: '#f2e8f0', pu: '#9b7bff', pd: '#4a5a8f', pg: '#ff8c78' },
    theme_carbon: { pb: '#0d0e11', pbd: '#33363d', pc: '#1b1c20', pt: '#e6e8ec', pu: '#8b93a1', pd: '#565d6b', pg: '#c8ccd4' },
    theme_ash: { pb: '#13100f', pbd: '#4a3a32', pc: '#2a201c', pt: '#f2e9e4', pu: '#ff7a3c', pd: '#b33030', pg: '#e9b640' },
    theme_malachite: { pb: '#0a1612', pbd: '#2b5a45', pc: '#12271e', pt: '#e8f5ee', pu: '#2fbe6e', pd: '#f0524f', pg: '#e9b640' },
    theme_bordeaux: { pb: '#180b0f', pbd: '#5a2a38', pc: '#2a131a', pt: '#f5e8ec', pu: '#e9b640', pd: '#ff5a6e', pg: '#ff8a9a' },
    theme_abyss: { pb: '#07161b', pbd: '#1f5560', pc: '#0d252c', pt: '#e4f6f8', pu: '#3fd8e8', pd: '#f0524f', pg: '#e9b640' },
    theme_sakura: { pb: '#180e17', pbd: '#5a3358', pc: '#2a1828', pt: '#f8eaf3', pu: '#ff8fc4', pd: '#9b7bff', pg: '#ffb3d4' },
    theme_aurum: { pb: '#110d07', pbd: '#6b5320', pc: '#1e170c', pt: '#fbf3de', pu: '#e9b640', pd: '#8a6a3a', pg: '#f7d879' }
  };

  var last = {};

  /* ---------------- Герой ---------------- */

  function daysInGame() {
    var c = Number(S.createdAt) || 0;
    if (!c) return 1;
    return Math.max(1, Math.floor((Date.now() - c) / 86400000) + 1);
  }

  function hero() {
    var nm = q('#pr-name');
    if (nm) nm.textContent = S.name || '—';
    var av = q('#pr-avatar');
    if (av && av.__v3pAv !== S.avatar + '|' + S.name) {
      av.__v3pAv = S.avatar + '|' + S.name;
      setAvatarEl(av, S.avatar);
    }
    var dc = q('#v3p-days');
    if (dc) {
      var d = daysInGame();
      dc.title = t('v3p_days_a');
      dc.lastElementChild.innerHTML = '<b class="mono">' + d + '</b> ' + esc(plural(d, 'v3p_day'));
    }
    heroEquip();
  }

  /* Надетое: рамка, титул, ранг. Анимации — только при смене. */
  function heroEquip() {
    var a = A(), fr = null, tt = null, rk = null;
    if (a) {
      try { fr = Ach.equippedFrame(); tt = Ach.equippedTitle(); rk = a.rankFor(Number(S.achPts) || 0); } catch (e) { dbg('v3p:hero', e); }
    }
    var key = fr ? fr.replace('frame_', '') : null, fc = (key && FRAME_C[key]) || GOLD;
    var av = q('#pr-avatar'), wrap = q('#v3p-ava-wrap'), heroEl = q('#v3p-hero');
    if (av) {
      var keep = av.className.split(' ').filter(function (c) { return c && c.indexOf('fr-') !== 0; });
      if (key) keep.push('fr-' + key);
      av.className = keep.join(' ');
    }
    if (heroEl) heroEl.style.setProperty('--fc', fc);
    if (wrap) wrap.classList.toggle('has-fr', !!key);
    if (last.frame !== undefined && fr !== last.frame && wrap) restart(wrap, 'swap');
    last.frame = fr;

    var pill = q('#pr-title');
    if (pill) {
      var txt = tt ? t('item_' + tt + '_t') + (Ach.flagSuffix ? Ach.flagSuffix() : '') : t('v3p_title_none');
      pill.className = 'v3p-title-pill' + (tt ? '' : ' empty') + (a ? '' : ' hidden');
      pill.innerHTML = (tt ? ic(null, 3.6, a.titleIcon(tt)) : '') + '<span>' + esc(txt) + '</span>';
      if (last.title !== undefined && tt !== last.title) restart(pill, 'flip');
      last.title = tt;
    }
    var chip = q('#v3p-rank');
    if (chip) {
      chip.classList.toggle('hidden', !a);
      chip.style.setProperty('--rc', rk ? (RANK_C[rk.id] || GOLD) : '#8b96b3');
      chip.innerHTML = '<i class="rdot" aria-hidden="true"></i><span>' +
        (rk ? tx('v3p_rank', { name: '<b>' + esc(t('rank_' + rk.id)) + '</b>' }) : esc(t('v3p_rank_none'))) + '</span>';
      var rid = rk ? rk.id : null;
      if (last.rank !== undefined && rid !== last.rank) restart(chip, 'flip');
      last.rank = rid;
    }
  }

  /* ---------------- Класс: лестница ---------------- */

  function clsName(c) { return c.name[LANG] || c.name.en; }

  function klassBuild(root, screen) {
    root.innerHTML =
      '<div class="v3p-head"><span class="v3-kicker">' + esc(t(screen ? 'class_yours' : 'v3p_class_kicker')) + '</span>' +
      (screen ? '' : '<button type="button" class="v3-link v3p-cl-all">' + esc(t('v3p_all_classes')) + ' <span class="chev" aria-hidden="true">›</span></button>') + '</div>' +
      '<div class="v3p-klass-main"><span class="v3p-emblem"><span class="class-ico v3p-k-ico"' + (screen ? '' : ' id="pr-class-ico"') + ' aria-hidden="true"></span></span>' +
      '<div class="v3p-klass-id"><b class="v3p-klass-name"' + (screen ? '' : ' id="pr-class-name"') + '>—</b>' +
      '<span class="v3p-klass-cap">' + esc(t('v3p_capital')) + ' <b class="mono v3p-k-cap">—</b></span></div></div>' +
      '<div class="v3p-ladder"></div>' +
      '<div class="v3p-klass-foot"><span class="v3p-k-need"' + (screen ? '' : ' id="pr-class-next"') + '></span><span class="v3p-bonus"></span></div>';
    root.__v3pLang = LANG;
    root.__v3pIdx = -1;
  }

  function ladderFrac(cap, idx) {
    var c = CLASSES[idx], nx = CLASSES[idx + 1];
    var f = nx ? clamp((cap - c.cap) / (nx.cap - c.cap), 0, 1) : 0;
    return ((idx + f) / (CLASSES.length - 1)) * 100;
  }

  function klassNeed(root, cap, idx) {
    var nx = CLASSES[idx + 1], need = q('.v3p-k-need', root);
    if (!need) return;
    if (!nx) { need.textContent = t('max_class'); need.__v3pNx = -1; return; }
    var left = money(nx.cap - cap, 0), lEl = q('.v3p-k-left', need);
    if (lEl && need.__v3pNx === idx + 1) { if (lEl.textContent !== left) lEl.textContent = left; return; }
    need.__v3pNx = idx + 1;
    need.innerHTML = tx('next', { name: esc(clsName(nx)), x: '<b class="mono v3p-k-left">' + left + '</b>' });
  }

  function klass(root, intro, screen) {
    if (!root) return;
    if (!q('.v3p-ladder', root) || root.__v3pLang !== LANG) klassBuild(root, screen);
    var cap = capital(), idx = classFor(cap), c = CLASSES[idx], nx = CLASSES[idx + 1];
    q('.v3p-klass-name', root).textContent = clsName(c);
    setClassIcon(q('.v3p-k-ico', root), c.icon);
    var kc = q('.v3p-k-cap', root);
    if (intro) kc.__v3v = Math.round(cap * 0.9);
    V3.countTo(kc, cap, function (v) { return money(v, 0); }, intro ? 900 : 0);
    root.__v3pCap = cap;
    var lad = q('.v3p-ladder', root);
    if (root.__v3pIdx !== idx || intro) {
      var h = '<div class="v3p-lad-track"><i class="v3p-lad-fill"></i></div>';
      for (var j = 0; j < CLASSES.length; j++) {
        var k = CLASSES[j], x = j / (CLASSES.length - 1);
        h += '<button type="button" class="v3p-lad-node' + (j < idx ? ' done' : j === idx ? ' cur' : '') + '" style="--x:' + x + ';--i:' + j + '" data-cls="' + j + '" aria-label="' + esc(clsName(k)) + '">' +
          (k.img ? '<img src="' + k.img + '" alt="" draggable="false">' : '') + '</button>';
        if (j === idx || j === idx + 1) {
          h += '<span class="v3p-lad-lbl' + (j === idx ? ' cur' : '') + (j === 0 ? ' first' : '') + (j === CLASSES.length - 1 ? ' last' : '') + '" style="--x:' + x + '">' + esc(clsName(k)) + '</span>';
        }
      }
      h += '<span class="v3p-lad-tip" aria-hidden="true"></span>';
      var up = root.__v3pIdx >= 0 && idx > root.__v3pIdx;
      lad.innerHTML = h;
      root.__v3pIdx = idx;
      var fill = q('.v3p-lad-fill', lad), target = ladderFrac(cap, idx);
      if (intro) { fill.style.width = '0%'; V3.reflow(fill); later(420, function () { fill.style.width = target + '%'; }); }
      else fill.style.width = target + '%';
      if (up) restart(q('.v3p-lad-node.cur', lad), 'lvl');
    }
    klassNeed(root, cap, idx);
    var bonus = q('.v3p-bonus', root);
    bonus.innerHTML = nx ? ic('gift', 3.6) + '+' + esc(money(nx.reward, 0)) : '';
    bonus.style.display = nx && nx.reward ? '' : 'none';
    if (!root.__v3pBound) {
      root.__v3pBound = true;
      root.addEventListener('click', function (e) {
        var node = e.target.closest && e.target.closest('.v3p-lad-node');
        if (node) ladTip(root, node);
        else { var tp = q('.v3p-lad-tip', root); if (tp) tp.classList.remove('on'); }
      });
    }
  }

  function ladTip(root, node) {
    var j = Number(node.getAttribute('data-cls')), c = CLASSES[j], tip = q('.v3p-lad-tip', root), ci = classFor(capital());
    if (!tip || !c) return;
    /* Как в концепте: пройденные и текущий — статусом, впереди — порог и бонус. */
    var sub = j < ci ? t('v3p_cls_done') : j === ci ? t('v3p_cls_yours')
      : t('v3p_from', { x: money(c.cap, 0) }) + (c.reward ? ' · +' + money(c.reward, 0) : '');
    tip.innerHTML = esc(clsName(c)) + '<span>' + esc(sub) + '</span>';
    tip.style.setProperty('--x', j / (CLASSES.length - 1));
    tip.classList.toggle('first', j === 0);
    tip.classList.toggle('last', j === CLASSES.length - 1);
    restart(tip, 'on');
    restart(node, 'tap');
    clearTimeout(root.__v3pTip);
    root.__v3pTip = setTimeout(function () { tip.classList.remove('on'); }, 2200);
    try { FX.vibrate(5); } catch (e) { /* без вибро */ }
  }

  function klassLive(root) {
    if (!root || !q('.v3p-ladder', root)) return;
    var cap = capital(), idx = classFor(cap);
    if (idx !== root.__v3pIdx) { klass(root, false, root.id !== 'pr-class-card'); return; }
    var prev = root.__v3pCap;
    if (prev != null && Math.abs(cap - prev) < 0.5) return;
    root.__v3pCap = cap;
    var kc = q('.v3p-k-cap', root);
    V3.countTo(kc, cap, function (v) { return money(v, 0); }, 500);
    if (prev != null) V3.flash(kc, cap > prev ? 1 : -1);
    var fill = q('.v3p-lad-fill', root);
    if (fill) fill.style.width = ladderFrac(cap, idx) + '%';
    klassNeed(root, cap, idx);
  }

  /* ---------------- Статистика ---------------- */

  /* Спарклайн P&L — по истории портфеля; без неё — декоративная кривая. */
  function pnlSeries() {
    var h = S.pfHistory || [], out = [];
    for (var i = Math.max(0, h.length - 32); i < h.length; i++) if (h[i] && isFinite(h[i].pnl)) out.push(h[i].pnl);
    return out.length >= 3 ? out : [-22, -19, -23, -12, -16, -6, -9];
  }

  function stats(intro) {
    var ms = intro ? 1000 : 0, box = q('#v3p-stats');
    if (!box) return;
    var tr = q('#st-trades');
    if (intro) tr.__v3v = 0;
    V3.countTo(tr, S.tradesCount || 0, nf, ms);
    q('#st-trades-sub').textContent = t('st_trades_sub');

    var hasWin = S.sellsCount > 0, wr = hasWin ? Math.round(successRate() * 100) : 0;
    var wn = q('#st-win');
    if (hasWin) {
      if (intro || wn.__v3v == null) wn.__v3v = 0;
      V3.countTo(wn, wr, function (v) { return Math.round(v) + '%'; }, ms);
    } else { wn.__v3v = null; wn.textContent = '—'; }
    q('#st-win-sub').textContent = hasWin ? t('st_win_sub', { w: S.wins, n: S.sellsCount }) : '—';

    var rz = Number(S.realized) || 0, dec = Math.abs(rz) >= 1000 ? 0 : 2;
    var pl = q('#st-pnl');
    if (intro) pl.__v3v = 0;
    V3.countTo(pl, rz, function (v) { return (v >= 0 ? '+' : '') + money(v, dec); }, ms);
    pl.className = 'mono v3p-stat-val ' + (rz >= 0 ? 'up' : 'down');
    var pc = q('#pr-stat-pnl');
    pc.classList.toggle('green', rz >= 0);
    pc.classList.toggle('red', rz < 0);
    q('#st-pnl-sub').textContent = S.tradesCount > 0 ? t('st_pnl_sub', { n: S.tradesCount, w: dealsWord(S.tradesCount) }) : '—';
    var sp = V3.sparkPaths(pnlSeries(), 64, 28, 3);
    var sl = q('#v3p-spark-l'), sf = q('#v3p-spark-f');
    sl.setAttribute('d', sp.line);
    sf.setAttribute('d', sp.area);

    var bs = q('#st-best');
    if (intro) bs.__v3v = 0;
    V3.countTo(bs, S.best || 0, function (v) { return money(v, 0); }, ms);
    q('#st-best-sub').textContent = t('st_best_sub', { x: money(capital(), 0) });

    var bars = qa('.v3p-deco i', box), g = q('#v3p-gauge'), rec = q('#v3p-rec');
    if (intro) {
      bars.forEach(function (b) { b.style.height = '0%'; });
      g.style.strokeDashoffset = 100;
      sl.style.strokeDashoffset = 120; sf.style.opacity = 0;
      rec.style.width = '0%';
      V3.reflow(box);
    }
    var apply = function () {
      bars.forEach(function (b, k) { setTimeout(function () { b.style.height = b.getAttribute('data-h') + '%'; }, intro ? V3.D(k * 60) : 0); });
      g.style.strokeDashoffset = 100 - (hasWin ? wr : 0);
      sl.style.strokeDashoffset = 0; sf.style.opacity = 1;
      rec.style.width = clamp(capital() / Math.max(1, S.best || 1), 0, 1) * 100 + '%';
    };
    if (intro) later(380, apply); else apply();
    moreStats(intro);
    last.trades = S.tradesCount;
  }

  function barHTML(frac, cls) {
    return '<span class="v3-bar v3p-bar' + (cls ? ' ' + cls : '') + '"><u data-w="' + (clamp(frac, 0, 1) * 100).toFixed(1) + '"></u></span>';
  }
  /* Полосы въезжают от нуля: ширина ставится кадром позже вставки. */
  function fillBars(root, instant) {
    var us = qa('u[data-w]', root);
    var go = function () { us.forEach(function (u) { u.style.setProperty('--w', u.getAttribute('data-w') + '%'); }); };
    if (instant) go(); else requestAnimationFrame(function () { requestAnimationFrame(go); });
  }

  function moreStats(intro) {
    var box = q('#pf-ext'), a = A();
    if (!box) return;
    box.classList.toggle('hidden', !a);
    if (!a) return;
    var perks = a.rankPerks(), p0 = Number(S.achPts) || 0;
    if (perks.stats) {
      var ss = S.stats || {}, bp = Number(ss.bestPct) || 0;
      box.className = 'v3p-more open';
      box.innerHTML = '<span class="lk">' + ic('chart', 3.4) + '</span><span class="m"><b>' + esc(t('v3p_more_stats')) + '</b><span>' +
        esc(t('pf_x_vol')) + ' <i class="mono">' + esc(moneyShort(Number(ss.volume) || 0)) + '</i> · ' +
        esc(t('pf_x_fees')) + ' <i class="mono">' + esc(money(Number(ss.feesPaid) || 0, 0)) + '</i> · ' +
        esc(t('pf_x_streak')) + ' <i class="mono">' + (Number(ss.maxWinStreak) || 0) + '</i> · ' +
        esc(t('pf_x_best')) + ' <i class="mono">' + (bp >= 0 ? '+' : '') + Math.round(bp * 100) + '%</i></span></span>';
      box.removeAttribute('role'); box.removeAttribute('tabindex');
    } else {
      var an = null;
      a.ranks.forEach(function (r) { if (!an && r.stats) an = r; });
      if (!an) { box.classList.add('hidden'); return; }
      var left = Math.max(0, an.pts - p0);
      box.className = 'v3p-more';
      box.setAttribute('role', 'button'); box.setAttribute('tabindex', '0');
      box.innerHTML = '<span class="lk">' + ic('lock', 3.6) + '</span><span class="m"><b>' + esc(t('v3p_more_stats')) + '</b><span>' +
        esc(t('v3p_more_lock', { name: t('rank_' + an.id), n: left, w: plural(left, 'v3p_pt') })) + '</span></span>' + barHTML(p0 / an.pts);
      fillBars(box, !intro);
    }
  }

  /* ---------------- Достижения ---------------- */

  function medalHTML(a, un, size) {
    var hid = a.hidden && !un, lv = a.series && a.level ? ['', 'I', 'II', 'III', 'IV'][a.level] || '' : '';
    return '<span class="v3p-medal' + (un ? '' : ' off') + '" style="--ms:' + size + 'px">' +
      '<span class="v3p-medal-in">' + A().achIcon(a, un) + '</span>' +
      (!hid && lv ? '<i class="roman">' + lv + '</i>' : '') +
      (un ? '<span class="shine" style="--sd:' + (Math.random() * 4).toFixed(1) + 's"></span>' : '') + '</span>';
  }

  function ringBuild(el, n) {
    var h = '<svg viewBox="0 0 120 120" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.035, r1 = 45, r2 = 55;
      h += '<line class="tk" x1="' + (60 + Math.cos(ang) * r1).toFixed(2) + '" y1="' + (60 + Math.sin(ang) * r1).toFixed(2) +
        '" x2="' + (60 + Math.cos(ang) * r2).toFixed(2) + '" y2="' + (60 + Math.sin(ang) * r2).toFixed(2) + '"/>';
    }
    el.innerHTML = h + '</svg><div class="v3p-cring-c"><b class="mono">0%</b><i>' + esc(t('v3p_collected')) + '</i></div>';
    el.__v3pN = n;
    el.__v3pLang = LANG;
  }

  function ringSet(el, n, tot, mode) {
    if (el.__v3pN !== tot || el.__v3pLang !== LANG) ringBuild(el, tot);
    var ticks = qa('.tk', el), b = q('.v3p-cring-c b', el), lit = 0;
    ticks.forEach(function (tk) { if (tk.classList.contains('on')) lit++; });
    ticks.forEach(function (tk, i) {
      var on = i < n;
      clearTimeout(tk.__v3pT);
      if (mode === 'intro') {
        tk.classList.remove('on', 'ign');
        if (on) tk.__v3pT = later(260 + i * 26, function () { tk.classList.add('on', 'ign'); });
      } else if (mode === 'grow' && on && !tk.classList.contains('on')) {
        tk.__v3pT = later((i - lit) * 140, function () { tk.classList.add('on'); restart(tk, 'ign'); });
      } else tk.classList.toggle('on', on);
    });
    var pct = Math.round(n / Math.max(1, tot) * 100);
    if (mode === 'intro') b.__v3v = 0;
    V3.countTo(b, pct, function (v) { return Math.round(v) + '%'; }, mode ? 900 : 0);
    el.setAttribute('aria-label', t('v3p_collected') + ': ' + pct + '%');
    if (mode === 'grow') restart(el, 'hit');
  }

  function goalHTML(label, left, frac, dot) {
    return '<div class="v3p-goal-t">' + (dot ? '<i class="rdot" style="--rc:' + dot + '"></i>' : ic('pct', 4)) +
      '<span class="l">' + label + '</span><span class="n mono">' + left + '</span></div>' + barHTML(frac, dot ? 'rank' : '');
  }

  function achCard(mode) {
    var card = q('#v3p-achc'), a = A();
    if (!card) return;
    card.classList.toggle('hidden', !a);
    if (!a) return;
    var n = a.unlocked(), tot = a.total(), p0 = Number(S.achPts) || 0;
    var cnt = q('#v3p-a-cnt');
    cnt.innerHTML = tx('v3p_n_of', { n: '<b class="mono">' + n + '</b>', m: tot });
    if (mode) { var cb = q('b', cnt); cb.__v3v = mode === 'intro' ? 0 : last.achN; V3.countTo(cb, n, function (v) { return Math.round(v); }, 800); }
    var dot = q('#ach-dot');
    if (dot) dot.classList.toggle('hidden', a.unseen() <= 0);
    ringSet(q('#v3p-ring'), n, tot, mode);
    var pp = q('#v3p-pts');
    if (mode === 'intro') pp.__v3v = 0;
    V3.countTo(pp, p0, nf, mode ? 1000 : 0);
    q('#v3p-pts-w').textContent = plural(p0, 'v3p_pt');

    var r = a.rankFor(p0), nr = null;
    a.ranks.forEach(function (x) { if (!nr && p0 < x.pts) nr = x; });
    var gr = q('#v3p-goal-rank');
    if (nr) {
      var base = r ? r.pts : 0;
      gr.innerHTML = goalHTML(tx('v3p_goal_rank', { name: '<b>' + esc(t('rank_' + nr.id)) + '</b>' }), esc(t('v3p_left', { n: nr.pts - p0 })),
        (p0 - base) / (nr.pts - base), RANK_C[nr.id] || GOLD);
    } else {
      var top = a.ranks[a.ranks.length - 1];
      gr.innerHTML = goalHTML(tx('v3p_goal_top', { name: '<b>' + esc(t('rank_' + top.id)) + '</b>' }), '✓', 1, RANK_C[top.id] || GOLD);
    }
    var fi = Ach.feeTierInfo(p0), gf = q('#v3p-goal-fee');
    gf.innerHTML = fi.next
      ? goalHTML(tx('v3p_goal_fee', { x: '<b>' + esc(a.pct(fi.next.rate)) + '</b>' }), esc(t('v3p_left', { n: fi.next.pts - p0 })), (p0 - fi.base) / (fi.next.pts - fi.base))
      : goalHTML(tx('v3p_goal_fee_min', { x: '<b>' + esc(a.pct(fi.cur)) + '</b>' }), '✓', 1);
    fillBars(gr, !mode); fillBars(gf, !mode);
    near(a, mode === 'intro');
    last.achN = n; last.achPts = p0;
  }

  /* «Почти готово»: ближайшие к выполнению (без скрытых), по нажатию — к карточке. */
  function near(a, intro) {
    var rows = [];
    try { rows = a.rows(); } catch (e) { dbg('v3p:near', e); }
    rows = rows.filter(function (r) { return !r.un && r.ratio > 0 && !r.a.hidden; })
      .sort(function (x, y) { return y.ratio - x.ratio; }).slice(0, 5);
    var wrap = q('#v3p-near'), box = q('#v3p-near-row');
    wrap.style.display = rows.length ? '' : 'none';
    box.innerHTML = rows.map(function (r) {
      var pct = Math.floor(r.ratio * 100);
      return '<button type="button" class="v3p-ncard" data-ach="' + esc(r.a.id) + '">' + medalHTML(r.a, false, 42) +
        '<span class="nc-m"><span class="nc-t"><b>' + esc(t('ach_' + r.a.id + '_t')) + '</b><em class="mono">' + pct + '%</em></span>' +
        barHTML(r.ratio) + '<span class="nums mono">' + esc(a.prog(r.p)) + '</span></span></button>';
    }).join('');
    fillBars(box, false);
    if (intro) box.scrollLeft = 0;
  }

  /* ---------------- Витрина ---------------- */

  var CATS = ['frames', 'candles', 'titles', 'themes'];
  var LIMIT = { frames: 8, candles: 6, titles: 11, themes: 6 };
  var vit = { cat: 'frames', all: false, order: null, orderCat: null, rows: {}, justWorn: null, liveT: 0, ser: null };

  function kindOf(r) { return r.type === 'frame' ? 'frame' : r.type === 'title' ? 'title' : r.type === 'candles' ? 'candles' : r.type === 'theme' ? 'theme' : 'accent'; }

  function avaHTML(key, locked, cls) {
    return '<span class="v3p-ava' + (cls ? ' ' + cls : '') + (key ? ' fr-' + key : '') + (locked ? ' locked' : '') + '">' +
      '<img src="' + avatarSrc(S.avatar) + '" alt="" draggable="false"></span>';
  }

  /* Детерминированный ряд свечей (одинаковый при каждом рендере). */
  function series(n, seed) {
    var s = seed, out = [], p = 50;
    var r = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (var i = 0; i < n; i++) {
      var o = p, c = o + (r() - 0.42) * 9;
      out.push([o, Math.max(o, c) + r() * 3.5, Math.min(o, c) - r() * 3.5, c]);
      p = c;
    }
    return out;
  }
  var SER_CELL = series(7, 7), SER_BIG = series(12, 5);

  /* Свечи в SVG по CANDLE_SKINS: цвет null — берётся из темы. */
  function candlesSVG(skinId, data, w, h) {
    var a = A(), sk = (a && a.skins[skinId]) || null;
    var bk = sk ? 0.62 * (sk.bodyK || 1) : 0.62;
    var lo = Infinity, hi = -Infinity, out = '';
    data.forEach(function (d) { lo = Math.min(lo, d[2]); hi = Math.max(hi, d[1]); });
    var pad = 3, slot = w / data.length, bw = Math.max(1.4, slot * bk);
    var y = function (v) { return pad + (1 - (v - lo) / (hi - lo || 1)) * (h - pad * 2); };
    data.forEach(function (d, i) {
      var up = d[3] >= d[0], c = (sk && (up ? sk.up : sk.down)) || (up ? 'var(--up)' : 'var(--down)'), x = slot * i + slot / 2;
      var top = y(Math.max(d[0], d[3])), bot = y(Math.min(d[0], d[3]));
      out += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + y(d[1]).toFixed(1) + '" y2="' + y(d[2]).toFixed(1) + '" style="stroke:' + c + '" stroke-width="1.1" stroke-linecap="round"/>';
      out += '<rect x="' + (x - bw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1.4, bot - top).toFixed(1) + '" rx="' + Math.min(2, bw / 3).toFixed(1) + '"' +
        (sk && sk.hollow ? ' style="fill:none;stroke:' + c + '" stroke-width="1.1"' : ' style="fill:' + c + '"') + '/>';
    });
    var glow = sk && sk.glow && sk.up ? 'filter:drop-shadow(0 0 ' + Math.min(4, sk.glow / 3).toFixed(1) + 'px ' + sk.up + ')' : '';
    return '<svg class="v3p-cd" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="' + glow + '" aria-hidden="true">' + out + '</svg>';
  }

  function palOf(id) {
    var a = A();
    if (id.indexOf('preset:') === 0) {
      var c = (a && a.accents[id.slice(7)]) || GOLD;
      return Object.assign({}, PAL.base, { pg: c, pu: c });
    }
    if (id === 'accent_neo') return Object.assign({}, PAL.base, { pg: '#ff5fa2', pu: '#ff5fa2' });
    return PAL[id] || PAL.base;
  }
  function phsHTML(id) {
    var p = palOf(id);
    return '<span class="v3p-phs" style="--pb:' + p.pb + ';--pbd:' + p.pbd + ';--pc:' + p.pc + ';--pt:' + p.pt + ';--pu:' + p.pu + ';--pd:' + p.pd + ';--pg:' + p.pg + '">' +
      '<i class="l1"></i><span class="cc"><i style="height:42%"></i><i style="height:64%"></i><i style="height:48%"></i><i style="height:82%"></i></span><i class="l2"></i></span>';
  }
  function titlePill(id, name) {
    return '<span class="v3p-title-pill">' + (id ? ic(null, 3.6, A().titleIcon(id)) : '') + '<span>' + esc(name) + '</span></span>';
  }

  function vitRows(cat) {
    var a = A(), rows = a.vitrineList(cat);
    if (cat === 'themes') {
      /* Базовая тема — всегда открыта: к ней можно вернуться из примерочной. */
      rows.unshift({ id: 'theme_base', type: 'theme', grp: 'themes', name: t('v3p_theme_base'), owned: true, free: true,
        equipped: S.theme === 'dark' || S.theme === 'light' });
    }
    if (cat === 'themes' && a.rankPerks().accent) {
      ['gold', 'ocean', 'violet', 'mint'].forEach(function (p) {
        rows.push({ id: 'preset:' + p, type: 'accent', grp: 'themes', preset: p, name: t('accent_' + p), owned: true, free: true,
          equipped: (S.equip.accent || 'gold') === p });
      });
    }
    return rows;
  }
  function ratioOf(r) { return r.prog ? r.prog.ratio : 0; }

  function vitCell(r, i) {
    var on = r.equipped, own = r.owned, d = i >= 0 ? ' style="--d:' + Math.min(i * 34, 420) + '"' : '';
    var cls = 'v3p-vi' + (i >= 0 ? ' in' : '') + (on ? ' worn' : own ? '' : ' lock') + (vit.justWorn === r.id && on ? ' pop' : '');
    var aria = r.name + ', ' + t(on ? 'v3p_a_worn' : own ? 'v3p_a_wear' : 'v3p_a_locked');
    var head = '<button type="button" role="listitem" data-item="' + esc(r.id) + '" aria-label="' + esc(aria) + '"' + d;
    if (r.type === 'title') {
      return head + ' class="' + cls + ' v3p-tpill">' + ic(null, 3.6, own ? A().titleIcon(r.id) : P.lock) + '<span>' + esc(r.name) + '</span></button>';
    }
    var pv;
    if (r.type === 'frame') pv = avaHTML(r.id.replace('frame_', ''), !own);
    else if (r.type === 'candles') pv = candlesSVG(r.id.replace('candles_', ''), SER_CELL, 100, 46);
    else pv = phsHTML(r.id);
    var mini = !own && ratioOf(r) > 0 ? '<span class="mini"><u style="width:' + Math.round(ratioOf(r) * 100) + '%"></u></span>' : '';
    var badge = on ? '<span class="badge">' + ic('check', 5) + '</span>' : own ? '' : '<span class="badge">' + ic('lock', 4) + '</span>';
    return head + ' class="' + cls + ' v3p-vcell">' + pv + '<span class="nm">' + esc(r.name) + '</span>' + mini + badge + '</button>';
  }

  function vitrine(animate, keepOrder) {
    var card = q('#v3p-vit'), a = A();
    if (!card) return;
    card.classList.toggle('hidden', !a);
    if (!a) return;
    var own = 0, tot = 0;
    CATS.forEach(function (c) {
      var o = 0, m = 0;
      a.vitrineList(c).forEach(function (r) { if (r.id === 'candles_std') return; m++; if (r.owned) o++; });
      own += o; tot += m;
      var cc = q('[data-cc="' + c + '"]', card);
      if (cc) cc.textContent = o + '/' + m;
    });
    var vc = q('#v3p-v-cnt');
    vc.innerHTML = tx('ach_vit_worn_count', { o: '<b class="mono">' + own + '</b>', m: tot });
    var vb = q('b', vc);
    if (last.vitOwn != null && own !== last.vitOwn) { vb.__v3v = last.vitOwn; V3.countTo(vb, own, function (v) { return Math.round(v); }, 700); }
    last.vitOwn = own;
    qa('#v3p-vseg [data-cat]').forEach(function (b) {
      var on = b.getAttribute('data-cat') === vit.cat;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var rows = vitRows(vit.cat), map = {};
    rows.forEach(function (r) { map[r.id] = r; });
    vit.rows = map;
    if (!keepOrder || vit.orderCat !== vit.cat || !vit.order || vit.order.length !== rows.length) {
      var rank = function (r) { return r.equipped ? 0 : r.owned ? (r.id === 'candles_std' || r.free ? 1 : 2) : 3; };
      rows.sort(function (x, y) {
        var dd = rank(x) - rank(y);
        if (dd) return dd;
        if (rank(x) === 3) return ratioOf(y) - ratioOf(x);
        return 0;
      });
      vit.order = rows.map(function (r) { return r.id; });
      vit.orderCat = vit.cat;
    }
    var ids = vit.order.filter(function (id) { return map[id]; }), lim = LIMIT[vit.cat];
    var showAll = vit.all || ids.length <= lim + 1, list = showAll ? ids : ids.slice(0, lim);
    var g = q('#v3p-vgrid');
    g.className = 'v3p-vgrid ' + vit.cat;
    g.innerHTML = list.map(function (id, i) { return vitCell(map[id], animate ? i : -1); }).join('');
    vit.justWorn = null;
    var more = q('#v3p-vmore');
    more.classList.toggle('hidden', ids.length <= lim + 1);
    more.textContent = vit.all ? t('v3p_vit_less') : t('v3p_vit_all', { n: ids.length });
    vitPreview();
  }

  function vitPreview() {
    var box = q('#v3p-vprev'), a = A();
    if (!box || !a) return;
    clearInterval(vit.liveT);
    var cat = vit.cat;
    box.setAttribute('data-cat', cat);
    if (cat === 'frames' || cat === 'titles') {
      var fr = Ach.equippedFrame(), tt = Ach.equippedTitle();
      var pos = typeof ratingCache !== 'undefined' && ratingCache && ratingCache.myRank ? '#' + ratingCache.myRank : '';
      box.innerHTML = '<span class="cap">' + esc(t('ach_vit_preview_cap')) + '</span><div class="v3p-lrow">' + (pos ? '<span class="pos mono">' + esc(pos) + '</span>' : '') +
        avaHTML(fr ? fr.replace('frame_', '') : null, false, 's') + '<span class="who"><b>' + esc(S.name || '—') + '</b>' +
        (tt ? titlePill(tt, t('item_' + tt + '_t') + (Ach.flagSuffix ? Ach.flagSuffix() : '')) : '<span class="v3p-title-pill empty"><span>' + esc(t('v3p_title_none')) + '</span></span>') +
        '</span><b class="cap2 mono">' + esc(money(capital(), 0)) + '</b></div>';
      if (last.prevFrame !== undefined && fr !== last.prevFrame) restart(q('.v3p-ava', box), 'swap');
      if (last.prevTitle !== undefined && tt !== last.prevTitle) restart(q('.v3p-title-pill', box), 'flip');
      last.prevFrame = fr; last.prevTitle = tt;
    } else if (cat === 'candles') {
      var sk = (S.equip && S.equip.candles) || 'std';
      box.innerHTML = '<span class="cap">' + esc(t('v3p_prev_chart')) + '</span><div class="v3p-cprev"><div class="nm"><b>' + esc(t('item_candles_' + sk + '_t')) + '</b><span>' + esc(t('v3p_worn_now')) + '</span></div><span class="v3p-live-cd"></span></div>';
      if (!vit.ser) vit.ser = series(26, 3);
      var draw = function () { var el = q('.v3p-live-cd', box); if (el) el.innerHTML = candlesSVG(sk, vit.ser, 220, 64); };
      draw();
      if (!V3.reduced()) {
        vit.liveT = setInterval(function () {
          if (!box.offsetParent) { clearInterval(vit.liveT); return; }
          var l = vit.ser[vit.ser.length - 1], c = l[3] + (Math.random() - 0.45) * 5;
          if (Math.random() < 0.35) { vit.ser.shift(); vit.ser.push([l[3], Math.max(l[3], c) + Math.random() * 3, Math.min(l[3], c) - Math.random() * 3, c]); }
          else { l[3] = c; l[1] = Math.max(l[1], c); l[2] = Math.min(l[2], c); }
          draw();
        }, V3.D(700));
      }
    } else {
      box.innerHTML = '<div class="v3p-vit-hint">' + tx('v3p_th_hint', {}) + '</div>';
    }
  }

  /* Смена темы — круговым раскрытием от точки нажатия (View Transitions). */
  function withReveal(x, y, fn) {
    var root = document.documentElement;
    if (!document.startViewTransition || V3.reduced() || x == null) { fn(); return; }
    root.style.setProperty('--v3p-vx', x + 'px');
    root.style.setProperty('--v3p-vy', y + 'px');
    root.classList.add('v3p-vt');
    var done = function () { root.classList.remove('v3p-vt'); };
    try { document.startViewTransition(fn).finished.then(done, done); } catch (e) { done(); fn(); }
  }

  function wear(r, x, y) {
    var a = A(), k = kindOf(r);
    if (r.id === 'theme_base') {
      if (r.equipped) return;
      withReveal(x, y, function () {
        try { setTheme('dark'); } catch (e) { dbg('v3p:wear', e); }
        vit.justWorn = r.id;
        vitrine(false, true);
        try { toast(t('v3p_on_theme', { name: r.name })); } catch (e) { dbg('v3p:wear', e); }
      });
      return;
    }
    var go = function () {
      vit.justWorn = r.id;
      /* equipItem → applyEquip → refreshProfileEquip сам перерисует витрину. */
      if (!a.equipItem(r.id)) { vit.justWorn = null; return; }
      var nowOn = k === 'frame' ? Ach.equippedFrame() === r.id : k === 'title' ? Ach.equippedTitle() === r.id
        : k === 'candles' ? ('candles_' + ((S.equip && S.equip.candles) || 'std')) === r.id
        : k === 'theme' ? S.theme === r.id.replace('theme_', '')
        : r.preset ? true : S.equip.accent === 'neo';
      try { toast(t('v3p_' + (nowOn ? 'on_' : 'off_') + k, { name: r.name })); } catch (e) { dbg('v3p:wear', e); }
      try { FX.vibrate(8); } catch (e) { /* без вибро */ }
    };
    if (k === 'theme' || k === 'accent') withReveal(x, y, go); else go();
  }

  /* ---------------- Шторка закрытого предмета ---------------- */

  function sheetEl() {
    var m = q('#modal-v3p-item');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'modal-v3p-item';
    m.className = 'modal hidden';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="backdrop"></div><div class="sheet v3p-isheet"><div class="v3p-grab" aria-hidden="true"></div><div class="v3p-isrc"></div></div>';
    document.body.appendChild(m);
    q('.backdrop', m).onclick = function () { closeModal('modal-v3p-item'); };
    m.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-v3p-act]');
      if (!b) return;
      var act = b.getAttribute('data-v3p-act'), arg = b.getAttribute('data-arg');
      closeModal('modal-v3p-item');
      if (act === 'ach') setTimeout(function () { try { Ach.jumpToAch(arg); } catch (er) { dbg('v3p:jump', er); } }, V3.D(180));
      else if (act === 'ranks') setTimeout(function () { try { Ach.openScreen(); } catch (er) { dbg('v3p:ranks', er); } }, V3.D(180));
      else if (act === 'pass') setTimeout(function () { try { Quests.open(); } catch (er) { dbg('v3p:pass', er); } }, V3.D(180));
    });
    return m;
  }

  /* Закрытый предмет объясняет, как его получить, и ведёт к источнику. */
  function itemSheet(r) {
    var a = A(), it = a.items[r.id], k = kindOf(r);
    if (!it) return;
    var big;
    if (k === 'frame') big = avaHTML(r.id.replace('frame_', ''), true, 'xl');
    else if (k === 'candles') big = candlesSVG(r.id.replace('candles_', ''), SER_BIG, 200, 90);
    else if (k === 'title') big = titlePill(r.id, r.name);
    else big = phsHTML(r.id);
    var h = '<div class="big k-' + k + '">' + big + '</div><span class="kind">' + esc(t('v3p_kind_' + k)) + '</span>' +
      '<div class="v3p-sh-h">' + esc(LANG === 'ru' ? '«' + r.name + '»' : '“' + r.name + '”') + '</div>';
    var btn = '';
    if (it.src.rank) {
      var need = 0, p0 = Number(S.achPts) || 0, rc = RANK_C[it.src.rank] || GOLD;
      a.ranks.forEach(function (x) { if (x.id === it.src.rank) need = x.pts; });
      h += '<div class="v3p-srcbox"><i class="rring" style="--rc:' + rc + '"></i><span class="m"><b>' + esc(t('v3p_src_rank', { name: t('rank_' + it.src.rank) })) + '</b>' +
        '<span>' + esc(t('v3p_src_rank_d', { n: need, w: plural(need, 'v3p_pt') })) + '</span>' + barHTML(p0 / Math.max(1, need)) +
        '<span class="nums mono">' + Math.min(p0, need) + ' / ' + need + '</span></span></div>';
      btn = '<button type="button" class="btn primary" data-v3p-act="ranks">' + esc(t('v3p_to_ranks')) + '</button>';
    } else if (it.src.pass) {
      var lvP = typeof Quests !== 'undefined' ? Quests.level() : 0;
      h += '<div class="v3p-srcbox"><i class="rring" style="--rc:' + (it.src.prem ? GOLD : '#4da3ff') + '"></i><span class="m"><b>' + esc(t(it.src.prem ? 'qp_vit_prem' : 'qp_vit_free', { n: it.src.pass })) + '</b>' +
        '<span>' + esc(t(it.src.prem ? 'qp_vit_prem_d' : 'qp_vit_free_d')) + '</span>' + barHTML(lvP / it.src.pass) +
        '<span class="nums mono">' + Math.min(lvP, it.src.pass) + ' / ' + it.src.pass + '</span></span></div>';
      if (typeof Quests !== 'undefined') btn = '<button type="button" class="btn primary" data-v3p-act="pass">' + esc(t('qp_to_pass')) + '</button>';
    } else if (it.src.ach) {
      var ach = a.byId(it.src.ach), hid = !ach || r.srcHidden, row = null;
      try { a.rows().forEach(function (x) { if (x.a.id === it.src.ach) row = x; }); } catch (e) { dbg('v3p:sheet', e); }
      h += '<div class="v3p-srcbox">' + (ach ? medalHTML(ach, false, 48) : '') + '<span class="m"><b>' + esc(hid ? t('ach_vit_hidden') : t('ach_vit_need', { name: t('ach_' + ach.id + '_t') })) + '</b>' +
        '<span>' + esc(hid ? t('v3p_src_hidden_d') : t('ach_' + ach.id + '_d')) + '</span>' +
        (!hid && row && row.p && row.p.goal > 0 ? barHTML(row.ratio) + '<span class="nums mono">' + esc(a.prog(row.p)) + '</span>' : '') + '</span></div>';
      if (!hid) btn = '<button type="button" class="btn primary" data-v3p-act="ach" data-arg="' + esc(ach.id) + '">' + esc(t('v3p_to_ach')) + '</button>';
    }
    var m = sheetEl();
    q('.v3p-isrc', m).innerHTML = h + '<div class="v3p-sh-btns"><button type="button" class="btn v3p-ghost" data-v3p-act="close">' + esc(t('v3p_ok')) + '</button>' + btn + '</div>';
    openModal('modal-v3p-item');
    fillBars(m, false);
  }

  /* ---------------- Привязки ---------------- */

  function bind() {
    var seg = q('#v3p-vseg');
    if (!seg || seg.__v3pB) return;
    seg.__v3pB = true;
    seg.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-cat]');
      if (!b || b.getAttribute('data-cat') === vit.cat) return;
      vit.cat = b.getAttribute('data-cat');
      vit.all = false;
      vitrine(true);
      try { FX.vibrate(5); } catch (er) { /* без вибро */ }
    });
    q('#v3p-vgrid').addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-item]');
      if (!c) return;
      var r = vit.rows[c.getAttribute('data-item')];
      if (!r) return;
      if (r.owned) wear(r, e.clientX, e.clientY);
      else { restart(c, 'nope'); itemSheet(r); }
    });
    q('#v3p-vmore').onclick = function () { vit.all = !vit.all; vitrine(true, true); };
    q('#v3p-near-row').addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-ach]');
      if (c) { try { Ach.jumpToAch(c.getAttribute('data-ach')); } catch (er) { dbg('v3p:near', er); } }
    });
    q('#v3p-near-all').onclick = function () { try { Ach.openScreen(); } catch (er) { dbg('v3p:near', er); } };
    var more = q('#pf-ext');
    more.addEventListener('click', function () {
      if (more.classList.contains('open')) return;
      restart(more, 'nope');
      try { FX.vibrate(12); } catch (er) { /* без вибро */ }
      var a = A(), an = null, p0 = Number(S.achPts) || 0;
      if (!a) return;
      a.ranks.forEach(function (r) { if (!an && r.stats) an = r; });
      if (!an) return;
      var left = Math.max(0, an.pts - p0);
      try { toast(t('v3p_more_toast', { n: left, w: plural(left, 'v3p_pt'), name: t('rank_' + an.id) })); } catch (er) { dbg('v3p:more', er); }
    });
    more.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !more.classList.contains('open')) { e.preventDefault(); more.click(); }
    });
    /* Значок камеры сидит на краю аватара и клики не ловит — ловит обёртка. */
    var wrap = q('#v3p-ava-wrap');
    wrap.addEventListener('click', function (e) { if (e.target === wrap) q('#pr-avatar').click(); });
  }

  /* ---------------- Точки входа ---------------- */

  function render(intro) {
    bind();
    hero();
    klass(q('#pr-class-card'), intro, false);
    stats(intro);
    achCard(intro ? 'intro' : null);
    vitrine(intro, !intro);
  }

  function equip() {
    heroEquip();
    var g = q('#v3p-vgrid');
    if (g && g.children.length) vitrine(false, true);
  }

  function live() {
    klassLive(q('#pr-class-card'));
    var scr = q('#scr-classes');
    if (scr && !scr.classList.contains('hidden')) klassLive(q('#v3p-cl-hero'));
    var bs = q('#st-best');
    if (bs && bs.__v3v !== (S.best || 0)) V3.countTo(bs, S.best || 0, function (v) { return money(v, 0); }, 450);
    var sub = q('#st-best-sub');
    if (sub) {
      var s2 = t('st_best_sub', { x: money(capital(), 0) });
      if (sub.textContent !== s2) sub.textContent = s2;
    }
    var rec = q('#v3p-rec');
    if (rec) rec.style.width = clamp(capital() / Math.max(1, S.best || 1), 0, 1) * 100 + '%';
    var a = A();
    if (a && (a.unlocked() !== last.achN || (Number(S.achPts) || 0) !== last.achPts)) {
      achCard('grow');
      heroEquip();
      moreStats(false);
      vitrine(false, true);
    }
    if (S.tradesCount !== last.trades) stats(false);
  }

  /* Экран классов: сверху та же карточка-лестница, что и в профиле. */
  V3.after('renderClasses', function () {
    var body = q('#cl-body'), heroOld = q('#cl-hero');
    if (!body || !heroOld) return;
    var card = q('#v3p-cl-hero');
    if (!card) {
      card = document.createElement('section');
      card.id = 'v3p-cl-hero';
      card.className = 'card v3p-klass v3p-klass--screen';
      body.insertBefore(card, heroOld);
    }
    klass(card, true, true);
  });

  /* Новая аватарка — сразу и в примерочной: рамки меряются на ней. */
  V3.after('saveAvatarPicker', function () {
    var av = q('#pr-avatar'), key = S.avatar + '|' + S.name;
    if (!av) return;
    /* Как в концепте: новая аватарка — прыжок и прорисовка кольца рамки. */
    if (av.__v3pAv !== key) restart(q('#v3p-ava-wrap'), 'swap');
    av.__v3pAv = key;
    var g = q('#v3p-vgrid');
    if (g && g.children.length) vitrine(false, true);
  });

  return { render: render, live: live, equip: equip, achCard: achCard, vitrine: vitrine, hero: heroEquip };
})();
