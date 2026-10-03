/* v3 — поведенческий слой «rating» по concept/rating.html.
   RatingV3.render(model, mode) строит вкладку из данных renderRating()
   (main.js): герой «Ваше место», подиум, список по лигам, плашку «Вы»,
   шторки игрока и «Как считается». Режимы: intro / filter / move /
   refresh / quiet. Строки переезжают FLIP-ом по data-key. */
'use strict';

V3.i18n({
  ru: {
    rt_me_aria: 'Ваше место — показать в списке',
    rt_guest_h: 'Займите место в рейтинге',
    rt_guest_p: 'В общий рейтинг попадают игроки, вошедшие через Яндекс. Ваш капитал {v} уже можно сравнить с другими.',
    rt_guest_b1: 'Место среди всех трейдеров TradeUp',
    rt_guest_b2: 'Прогресс сохранится в облаке',
    rt_guest_b3: 'Сравнение с соседями и цели по местам',
    rt_refresh: 'Обновить рейтинг',
    rt_how: 'Как считается рейтинг',
    rt_end: 'Все деньги в игре виртуальные · TradeUp',
    rt_dock_aria: 'Показать мою строку',
    rt_foot_me: 'Показаны первые 20 мест и соседи рядом с вами.',
    rt_foot_guest: 'Показаны первые 20 мест.',
    rt_upd_now: 'сейчас',
    rt_upd_min: '{n} мин',
    rt_ptr_pull: 'Потяните, чтобы обновить',
    rt_ptr_release: 'Отпустите, чтобы обновить',
    rt_ptr_busy: 'Обновляем…',
    rt_k_cap: 'Ваше место · капитал',
    rt_k_wr: 'Ваше место · % успешных',
    rt_since: 'с прошлого визита',
    rt_first: 'первый визит в рейтинг',
    rt_same: 'без изменений',
    rt_of: 'из {n} в этом списке · {v}',
    rt_leader: 'Вы лидер рейтинга',
    rt_lead_by: 'Отрыв',
    rt_reserve: 'Запас',
    rt_to: 'До #{r}',
    rt_goal_top: 'Топ-{n}',
    rt_goal_first: 'Первое место',
    rt_goal_more: 'ещё {v}',
    rt_goal_leader: 'Лидер',
    rt_goal_leader_s: 'первое место',
    rt_goal_maxcls: 'высший класс',
    rt_top3: 'Топ-3',
    rt_pod_lead: 'Лидер впереди второго места на {v}',
    rt_pod_wr: 'Лучший результат — {v} прибыльных продаж',
    rt_wr_meta: '{v} успешных',
    rt_cap_meta: 'капитал {v}',
    rt_above: 'выше на {v}',
    rt_below: 'ниже на {v}',
    rt_more: 'ещё {n} {w}',
    rt_place1: 'место', rt_place2: 'места', rt_place5: 'мест',
    rt_league: 'от {v}',
    rt_your_league: 'ваша лига',
    rt_dock_to: 'до #{r}',
    rt_dock_leader: 'вы лидер рейтинга',
    rt_s_place: 'Место', rt_s_cap: 'Капитал', rt_s_wr: 'Успешных',
    rt_behind: 'Вы позади',
    rt_ahead: 'Вы впереди',
    rt_to_name: 'До #{r} · {n}',
    rt_note_cap: 'Чтобы подняться выше, нарастите капитал на {v}.',
    rt_note_wr: 'Чтобы подняться выше, поднимите долю прибыльных продаж на {v}.',
    rt_note_keep: 'Держите отрыв — рейтинг обновляется после каждой сделки.',
    rt_note_first: 'Вы на первом месте. Отрыв от второго — {v}.',
    rt_note_guest: 'Войдите через Яндекс, чтобы сравнить себя с {n} и увидеть своё место.',
    rt_close: 'Закрыть', rt_overtake: 'Обогнать', rt_to_market: 'К рынку', rt_great: 'Отлично', rt_login_short: 'Войти',
    rt_info_h: 'Как считается рейтинг',
    rt_i_cap_h: 'Капитал',
    rt_i_cap: 'Свободные деньги + стоимость открытых позиций + фьючерсный счёт. Обновляется после каждой сделки.',
    rt_i_vis_h: 'Какие места видны',
    rt_i_vis: 'Первые 20 мест и три соседа выше и ниже вас — так отдаёт рейтинг Яндекс Игр.',
    rt_i_lg_h: 'Лиги по классам',
    rt_i_lg: 'Класс трейдера зависит от капитала, поэтому список делится на лиги.',
    rt_i_wr_h: '% успешных',
    rt_i_who_h: 'Кто в рейтинге',
    rt_i_who: 'Игроки, вошедшие через Яндекс. Гость видит топ, но своего места у него нет.',
    rt_start: 'старт',
    rt_got: 'Понятно',
    rt_t_passed: 'Вы обогнали {n}',
    rt_t_by: 'Вас обогнали: {n}',
    rt_t_by1: 'Вас обогнал {n}',
    rt_and: '{a} и {b}',
    rt_and_more: '{a} и ещё {n}',
    rt_t_up: 'Вы поднялись на {n} {w}',
    rt_t_upd: 'Рейтинг обновлён',
    rt_t_top: 'Вы в топ-{n}!',
    rt_t_podium: 'Вы на подиуме!',
    rt_cls_toast: 'Класс «{c}» — от {v} капитала'
  },
  en: {
    rt_me_aria: 'Your place — show in the list',
    rt_guest_h: 'Claim your spot in the ranking',
    rt_guest_p: 'The global ranking includes players signed in with Yandex. Your capital of {v} is ready to compare.',
    rt_guest_b1: 'Your place among all TradeUp traders',
    rt_guest_b2: 'Progress saved to the cloud',
    rt_guest_b3: 'Compare with neighbours and chase goals',
    rt_refresh: 'Refresh ranking',
    rt_how: 'How the ranking works',
    rt_end: 'All money in the game is virtual · TradeUp',
    rt_dock_aria: 'Show my row',
    rt_foot_me: 'Showing the top 20 and your neighbours.',
    rt_foot_guest: 'Showing the top 20.',
    rt_upd_now: 'now',
    rt_upd_min: '{n} min',
    rt_ptr_pull: 'Pull to refresh',
    rt_ptr_release: 'Release to refresh',
    rt_ptr_busy: 'Refreshing…',
    rt_k_cap: 'Your place · capital',
    rt_k_wr: 'Your place · win rate',
    rt_since: 'since last visit',
    rt_first: 'first ranking visit',
    rt_same: 'no change',
    rt_of: 'of {n} in this list · {v}',
    rt_leader: 'You lead the ranking',
    rt_lead_by: 'Lead',
    rt_reserve: 'Cushion',
    rt_to: 'To #{r}',
    rt_goal_top: 'Top {n}',
    rt_goal_first: 'First place',
    rt_goal_more: '{v} to go',
    rt_goal_leader: 'Leader',
    rt_goal_leader_s: 'first place',
    rt_goal_maxcls: 'top class',
    rt_top3: 'Top 3',
    rt_pod_lead: 'The leader is {v} ahead of second place',
    rt_pod_wr: 'Best result — {v} profitable sells',
    rt_wr_meta: '{v} win rate',
    rt_cap_meta: 'capital {v}',
    rt_above: 'ahead by {v}',
    rt_below: 'behind by {v}',
    rt_more: '{n} more {w}',
    rt_place1: 'place', rt_place2: 'places', rt_place5: 'places',
    rt_league: 'from {v}',
    rt_your_league: 'your league',
    rt_dock_to: 'to #{r}',
    rt_dock_leader: 'you lead the ranking',
    rt_s_place: 'Place', rt_s_cap: 'Capital', rt_s_wr: 'Win rate',
    rt_behind: 'You are behind',
    rt_ahead: 'You are ahead',
    rt_to_name: 'To #{r} · {n}',
    rt_note_cap: 'Grow your capital by {v} to move up.',
    rt_note_wr: 'Raise your share of profitable sells by {v} to move up.',
    rt_note_keep: 'Keep the lead — the ranking updates after every trade.',
    rt_note_first: 'You are first. Lead over second place — {v}.',
    rt_note_guest: 'Sign in with Yandex to compare yourself with {n} and see your place.',
    rt_close: 'Close', rt_overtake: 'Overtake', rt_to_market: 'To market', rt_great: 'Great', rt_login_short: 'Sign in',
    rt_info_h: 'How the ranking works',
    rt_i_cap_h: 'Capital',
    rt_i_cap: 'Free cash + value of open positions + futures account. Updates after every trade.',
    rt_i_vis_h: 'Which places are shown',
    rt_i_vis: 'The top 20 and three neighbours above and below you — that is what the Yandex Games leaderboard returns.',
    rt_i_lg_h: 'Leagues by class',
    rt_i_lg: 'A trader’s class depends on capital, so the list is split into leagues.',
    rt_i_wr_h: 'Win rate',
    rt_i_who_h: 'Who is ranked',
    rt_i_who: 'Players signed in with Yandex. Guests see the top but have no place of their own.',
    rt_start: 'start',
    rt_got: 'Got it',
    rt_t_passed: 'You overtook {n}',
    rt_t_by: 'Overtaken by: {n}',
    rt_t_by1: 'Overtaken by {n}',
    rt_and: '{a} and {b}',
    rt_and_more: '{a} and {n} more',
    rt_t_up: 'You climbed {n} {w}',
    rt_t_upd: 'Ranking refreshed',
    rt_t_top: 'You are in the top {n}!',
    rt_t_podium: 'You made the podium!',
    rt_cls_toast: '«{c}» class — from {v} capital'
  }
});

var RatingV3 = (function () {
  var M = null;                 // текущая модель доски
  var lastSeen = null;          // место по капиталу на начало визита
  var LS_KEY = 'tu_rt_last_rank';
  var vis = { hero: true, row: false };
  var io = null;
  var busy = false;
  var sheetOpen = false;
  var introT = 0;
  var renderSeq = 0;
  var userAt = 0;              // последнее касание/прокрутка списка игроком

  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function D(ms) { return V3.D(ms); }
  function later(ms, fn) { return setTimeout(fn, D(ms)); }
  function restart(el, cls) { if (!el) return; el.classList.remove(cls); V3.reflow(el); el.classList.add(cls); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function onTab() { return typeof currentTab !== 'undefined' && currentTab === 'rating'; }
  function isWr() { return M && M.filter === 'winrate'; }
  function m0(v) { return money(Math.round(v), 0); }
  function trim1(v) { return String(Math.round(v * 10) / 10); }
  function compact(v) {
    var a = Math.abs(v || 0);
    return '$' + (a >= 1e6 ? trim1(a / 1e6) + 'M' : a >= 1e4 ? Math.round(a / 1e3) + 'K' : a >= 1e3 ? trim1(a / 1e3) + 'K' : Math.round(a));
  }
  function pct(v) { return Math.round((v || 0) * 100) + '%'; }
  function wPlace(n) {
    if (LANG !== 'ru') return n === 1 ? t('rt_place1') : t('rt_place5');
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return t('rt_place5');
    if (b > 1 && b < 5) return t('rt_place2');
    return b === 1 ? t('rt_place1') : t('rt_place5');
  }
  function cls(e) { return CLASSES[classFor((e && e.score) || 0)]; }
  function clsName(c) { return c.name[LANG] || c.name.en; }
  function me() { if (!M) return null; for (var i = 0; i < M.list.length; i++) if (M.list[i].me) return M.list[i]; return null; }
  function idxOf(e) { return M.list.indexOf(e); }
  function byId(id) { for (var i = 0; i < M.list.length; i++) if (M.list[i].id === id) return M.list[i]; return null; }
  function hasWr(e) { return e && !e.noWr && e.winRate != null; }
  /* Сколько не хватает, чтобы обойти (капитал — на $1 больше; % — на 1 п.п.). */
  function needTxt(above, below) {
    if (!isWr()) return m0((above.score || 0) - (below.score || 0) + 1);
    return Math.max(1, Math.round(((above.winRate || 0) - (hasWr(below) ? below.winRate : 0)) * 100) + 1) + '%';
  }
  function leadTxt(a, b) {
    if (!isWr()) return m0((a.score || 0) - (b.score || 0));
    if (!hasWr(a) || !hasWr(b)) return '—';
    return Math.round((a.winRate - b.winRate) * 100) + '%';
  }
  function countFrom(el, from, to, ms) { if (!el) return; el.__v3v = from; V3.countTo(el, to, m0, D(ms)); }
  function avSrcOf(e) { return avatarSrc(e.me ? S.avatar : avatarForName(e.name)); }
  /* Подстановка разметки в переведённую строку: {v} → html. */
  function tHtml(key, html) { return esc(t(key, { v: '\u0001' })).replace('\u0001', html); }

  var P = {
    up: '<path d="M24 38V10M11 23l13-13 13 13"/>',
    trophy: '<path d="M15 8h18v9a9 9 0 0 1-18 0z"/><path d="M15 12h-5a5 5 0 0 0 5 7M33 12h5a5 5 0 0 1-5 7M24 26v6M17 40h14M19 34h10l1 6H18z"/>',
    check: '<path d="M11 25l9 9 17-19"/>',
    lock: '<rect x="13" y="21" width="22" height="15" rx="3"/><path d="M18 21v-5a6 6 0 0 1 12 0v5"/>',
    coins: '<ellipse cx="24" cy="12" rx="13" ry="5"/><path d="M11 12v12c0 2.8 5.8 5 13 5s13-2.2 13-5V12"/><path d="M11 24v12c0 2.8 5.8 5 13 5s13-2.2 13-5V24"/>',
    users: '<circle cx="18" cy="17" r="7"/><path d="M5 40c1-7 6-11 13-11s12 4 13 11"/><circle cx="34" cy="15" r="5"/><path d="M33 26c6 0 10 4 11 10"/>',
    target: '<circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2"/>',
    trend: '<path d="M6 34l12-12 8 8 16-16"/><path d="M30 14h12v12"/>'
  };
  function ic(name, sw) {
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="' + (sw || 3.6) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.target) + '</svg>';
  }
  var CROWN = '<svg class="rt-crown" viewBox="0 0 38 30" aria-hidden="true"><defs><linearGradient id="rtcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f0c04d"/><stop offset="1" stop-color="#b8841c"/></linearGradient></defs>' +
    '<path d="M4 25L2 8l9 7 8-12 8 12 9-7-2 17z" fill="url(#rtcg)" stroke="#8a5f10" stroke-width="1.2" stroke-linejoin="round"/><rect x="4" y="24" width="30" height="4.5" rx="1.5" fill="url(#rtcg)" stroke="#8a5f10" stroke-width="1.2"/>' +
    '<circle cx="19" cy="17" r="2.6" fill="#ff5f7a"/><circle cx="10.5" cy="19" r="1.8" fill="#5aaeff"/><circle cx="27.5" cy="19" r="1.8" fill="#5aaeff"/></svg>';

  /* ---------------- Фрагменты ---------------- */

  /* Аватар: рамка витрины (fr-*) + эмблема класса в углу. */
  function avaHTML(e, size, ring) {
    var fr = achFrameClass(e), c = cls(e);
    return '<span class="rt-ava ' + (size || '') + (fr ? ' has-fr' + fr : '') + '">' +
      avImg('rt-av-img', e.me ? S.avatar : avatarForName(e.name), e.name) +
      '<img class="rt-cls" src="' + c.img + '" alt="" title="' + esc(clsName(c)) + '" draggable="false">' +
      (ring ? '<i class="rt-medal"></i>' : '') + '</span>';
  }
  function youHTML() { return '<i class="rt-you">' + esc(t('rating_you')) + '</i>'; }

  /* ---------------- Герой «Ваше место» ---------------- */

  function renderGuest() {
    q('#rt-me').classList.add('hidden');
    var g = q('#rt-guest');
    g.classList.remove('hidden');
    var av = q('#rt-guest-av');
    if (av && av.getAttribute('src') !== avatarSrc(S.avatar)) av.setAttribute('src', avatarSrc(S.avatar));
    q('#rt-guest-p').textContent = t('rt_guest_p', { v: m0(M.meScore) });
  }

  function renderHero(mode) {
    var box = q('#rt-me');
    q('#rt-guest').classList.add('hidden');
    box.classList.remove('hidden');
    var e = me();
    if (!e) return;
    var i = idxOf(e), rank = e._rank, above = M.list[i - 1], below = M.list[i + 1];
    var fresh = mode === 'intro' || !q('#rt-me-rk', box);
    if (fresh) {
      box.innerHTML = '<div class="rt-me-top"><div class="rt-me-rank"><span class="v3-kicker"><i class="v3-live" aria-hidden="true"></i><span id="rt-me-k"></span></span>' +
        '<div class="rt-me-num"><b class="big mono"><span class="hash">#</span><span id="rt-me-rk"></span></b><span class="rt-move" id="rt-me-move"></span></div>' +
        '<span class="sub" id="rt-me-sub"></span></div>' +
        '<div class="rt-me-who" id="rt-me-who"></div></div>' +
        '<div class="rt-me-gap" id="rt-me-gap"></div><div class="rt-goals" id="rt-goals"></div>';
    }
    var who = q('#rt-me-who');
    var whoKey = S.avatar + '|' + e.name + '|' + achFrameClass(e) + '|' + ratingTitleText(e) + '|' + cls(e).icon;
    if (who.__k !== whoKey) {
      who.__k = whoKey;
      who.innerHTML = avaHTML(e, 'l') + '<b>' + esc(e.name) + '</b>' + achTitleHtml(e);
      bindAvatarFallbacks(who);
    }
    q('#rt-me-k').textContent = t(isWr() ? 'rt_k_wr' : 'rt_k_cap');

    var rk = q('#rt-me-rk'), fmt = function (v) { return String(Math.round(v)); };
    if (mode === 'intro' && lastSeen != null && !isWr() && lastSeen !== rank) {
      V3.odo(rk, lastSeen, { fmt: fmt, from: lastSeen });
      later(520, function () { V3.odo(rk, rank, { fmt: fmt }); });
    } else V3.odo(rk, rank, { fmt: fmt });

    var mv = q('#rt-me-move'), sub = q('#rt-me-sub');
    if (!isWr() && lastSeen != null && M.capRank != null) {
      var d = lastSeen - M.capRank;
      mv.className = 'rt-move' + (d > 0 ? '' : d < 0 ? ' dn' : ' eq');
      mv.innerHTML = d ? ic('up', 5) + Math.abs(d) : esc(t('rt_same'));
      mv.style.display = '';
      sub.textContent = t('rt_since');
    } else {
      mv.style.display = 'none';
      sub.textContent = isWr() ? t('rt_of', { n: M.list.length, v: hasWr(e) ? pct(e.winRate) : '—' }) : t('rt_first');
    }
    if (mode === 'intro' && mv.style.display !== 'none') {
      mv.style.opacity = '0';
      later(1250, function () { mv.style.opacity = ''; restart(mv, 'pop'); });
    } else if (mode === 'move') restart(mv, 'pop');

    renderGap(e, i, rank, above, below, mode);
    renderGoals(e, rank);
  }

  function renderGap(e, i, rank, above, below, mode) {
    var gap = q('#rt-me-gap'), frac = 1, h, dot = '<i class="rt-dot"><img src="' + avSrcOf(e) + '" alt=""></i>';
    if (!above) {
      h = '<div class="rt-gap-row"><span>' + esc(t('rt_leader')) + '</span><span class="r">' + esc(t('rt_lead_by')) + ' <b class="gold mono">' + (below ? leadTxt(e, below) : '—') + '</b></span></div>' +
        '<div class="rt-gap-bar" id="rt-gap-bar"><u></u>' + dot + '</div>';
    } else {
      var lo = below ? ratingValue(below) : 0, hi = ratingValue(above), v = ratingValue(e);
      frac = hi > lo ? clamp((v - lo) / (hi - lo), 0.04, 0.96) : 0.5;
      h = '<div class="rt-gap-row"><span>' + esc(t('rt_reserve')) + ' ' + (below ? '<b class="mono">' + leadTxt(e, below) + '</b>' : '—') + '</span>' +
        '<span class="r">' + esc(t('rt_to', { r: above._rank })) + ' <b class="gold mono">' + needTxt(above, e) + '</b></span></div>' +
        '<div class="rt-gap-bar" id="rt-gap-bar"><i class="end l"></i><u></u><i class="end r"></i>' + dot + '</div>' +
        '<div class="rt-gap-row">' +
        (below ? '<span class="who" data-id="' + esc(below.id) + '"><img src="' + avSrcOf(below) + '" alt=""><span>#' + below._rank + ' ' + esc(below.name) + '</span></span>' : '<span></span>') +
        '<span class="who r" data-id="' + esc(above.id) + '"><span>' + esc(above.name) + ' #' + above._rank + '</span><img src="' + avSrcOf(above) + '" alt=""></span></div>';
    }
    var oldW = gap.__w;
    gap.innerHTML = h;
    var bar = q('#rt-gap-bar');
    var setW = function (w) { bar.style.setProperty('--w', (w * 100).toFixed(1) + '%'); };
    if (mode === 'intro') { setW(0); later(700, function () { setW(frac); }); }
    else if (oldW != null && Math.abs(oldW - frac) > 0.001 && (mode === 'move' || mode === 'patch' || mode === 'refresh')) {
      setW(oldW); V3.reflow(bar);
      requestAnimationFrame(function () { setW(frac); if (mode !== 'patch') restart(bar, 'hit'); });
    } else setW(frac);
    gap.__w = frac;
  }

  function renderGoals(e, rank) {
    var goals = q('#rt-goals'), g1, g2;
    var ms = [20, 10, 3, 1].filter(function (m) { return rank > m; })[0], target = null;
    if (ms) for (var k = 0; k < M.list.length; k++) if (M.list[k]._rank === ms && !M.list[k].me) { target = M.list[k]; break; }
    if (ms && target) {
      g1 = '<button type="button" class="rt-goal" data-rt-goto="' + ms + '"><span class="ico">' + ic(ms === 1 ? 'trophy' : 'target', 3.6) + '</span><span class="m"><b>' +
        esc(ms === 1 ? t('rt_goal_first') : t('rt_goal_top', { n: ms })) + '</b><span class="mono">' + esc(t('rt_goal_more', { v: needTxt(target, e) })) + '</span></span></button>';
    } else if (!ms) {
      g1 = '<div class="rt-goal done"><span class="ico">' + ic('check', 4.4) + '</span><span class="m"><b>' + esc(t('rt_goal_leader')) + '</b><span>' + esc(t('rt_goal_leader_s')) + '</span></span></div>';
    } else g1 = '';
    var ci = classFor(e.score || 0), nx = CLASSES[ci + 1];
    if (nx) g2 = '<button type="button" class="rt-goal" data-rt-cls="' + (ci + 1) + '"><span class="ico img"><img src="' + nx.img + '" alt=""></span><span class="m"><b>«' + esc(clsName(nx)) + '»</b><span class="mono">' + esc(t('rt_goal_more', { v: m0(nx.cap - (e.score || 0)) })) + '</span></span></button>';
    else g2 = '<div class="rt-goal done"><span class="ico">' + ic('check', 4.4) + '</span><span class="m"><b>«' + esc(clsName(CLASSES[ci])) + '»</b><span>' + esc(t('rt_goal_maxcls')) + '</span></span></div>';
    goals.innerHTML = g1 + g2;
    goals.classList.toggle('one', !g1);
  }

  /* ---------------- Подиум ---------------- */

  function personHTML(e, place) {
    if (!e) return '<div class="rt-person ph"><span class="rt-ava rt-ph"></span><b>—</b><span class="val mono">—</span></div>';
    return '<div class="rt-person" data-key="pp:' + esc(e.id) + '" data-id="' + esc(e.id) + '" role="button" tabindex="0" aria-label="' + esc('#' + place + ' · ' + e.name + ' · ' + ratingValueText(e)) + '">' +
      avaHTML(e, '', true) + '<b>' + esc(e.name).replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, '$1\u200b$2') + '</b><span class="val mono">' + esc(ratingValueText(e)) + '</span>' +
      (e.me ? youHTML() : achTitleHtml(e)) + '</div>';
  }
  function renderPodium(mode, info) {
    var box = q('#rt-podium'), top = M.list.slice(0, 3), old = {};
    if (mode !== 'intro') qa('.rt-person[data-key]', box).forEach(function (el) { old[el.getAttribute('data-key')] = el.getBoundingClientRect(); });
    var lead = '';
    if (top[0] && top[1]) {
      lead = isWr()
        ? ic('target', 3.6) + '<span>' + tHtml('rt_pod_wr', '<b class="mono">' + (hasWr(top[0]) ? pct(top[0].winRate) : '—') + '</b>') + '</span>'
        : ic('trophy', 3.6) + '<span>' + tHtml('rt_pod_lead', '<b class="mono">' + leadTxt(top[0], top[1]) + '</b>') + '</span>';
    }
    var col = function (i, pd) {
      return '<div class="rt-pcol p' + (i + 1) + '" style="--pd:' + pd + '">' + (i === 0 ? CROWN : '') + personHTML(top[i], i + 1) +
        '<div class="rt-pillar"><span>' + (i + 1) + '</span></div></div>';
    };
    box.innerHTML = '<div class="rt-pod-head"><span class="v3-kicker">' + esc(t('rt_top3')) + '</span></div>' +
      '<div class="rt-pod-stage">' + col(1, 130) + col(0, 260) + col(2, 0) + '</div>' +
      (lead ? '<div class="rt-pod-note">' + lead + '</div>' : '<div class="rt-pod-foot"></div>');
    bindAvatarFallbacks(box);
    if (mode === 'intro') {
      restart(box, 'rt-intro');
      clearTimeout(introT);
      introT = later(1900, function () { box.classList.remove('rt-intro'); });
      return;
    }
    if (V3.reduced()) return;
    qa('.rt-person[data-key]', box).forEach(function (el) {
      var o = old[el.getAttribute('data-key')], n = el.getBoundingClientRect();
      if (o) {
        var dx = o.left + o.width / 2 - (n.left + n.width / 2), dy = o.top - n.top;
        if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(' + dx * 0.4 + 'px,' + (dy * 0.4 - 26) + 'px)', offset: 0.5 }, { transform: 'none' }], { duration: D(760), easing: 'cubic-bezier(0.3, 0.9, 0.3, 1)' });
      } else if (!(info && info.flyFrom && el.getAttribute('data-key') === 'pp:me')) {
        /* Свой аватар на подиум прилетает из списка (flyToPodium) — без падения сверху. */
        el.animate([{ opacity: 0, transform: 'translateY(-24px) scale(0.8)' }, { opacity: 1, transform: 'none' }], { duration: D(560), delay: D(120), easing: 'cubic-bezier(0.3, 1.4, 0.5, 1)', fill: 'backwards' });
      }
    });
  }

  /* ---------------- Список ---------------- */

  function distW(e) {
    if (isWr()) return clamp((hasWr(e) ? e.winRate : 0) * 100, 2, 100);
    var lead = M.list[0], lo = Math.log10(3000), hi = Math.log10(Math.max(3001, (lead && lead.score) || 3001));
    return clamp((Math.log10(Math.max(1, e.score || 0)) - lo) / (hi - lo) * 100, 2, 100);
  }
  function subTxt(e, myE) {
    if (e.me || !myE || Math.abs(e._rank - myE._rank) > 3) return '';
    return e._rank < myE._rank ? t('rt_above', { v: leadTxt(e, myE) }) : t('rt_below', { v: leadTxt(myE, e) });
  }
  function rowHTML(e, myE) {
    var info = isWr() ? t('rt_cap_meta', { v: compact(e.score) }) : (hasWr(e) ? t('rt_wr_meta', { v: pct(e.winRate) }) : '');
    var sub = subTxt(e, myE);
    return '<button type="button" class="rt-row' + (e.me ? ' me' : '') + '" data-key="p:' + esc(e.id) + '" data-id="' + esc(e.id) + '" aria-label="' + esc('#' + e._rank + ' · ' + e.name + ' · ' + ratingValueText(e)) + '">' +
      '<span class="rk mono">' + e._rank + '</span>' + avaHTML(e, 's') +
      '<span class="nm"><b><span class="tx">' + esc(e.name) + '</span>' + (e.me ? youHTML() : '') + '</b><span class="meta">' + achTitleHtml(e, !e.me) + '<span>' + esc(info) + '</span></span></span>' +
      '<span class="vl"><b class="mono">' + esc(ratingValueText(e)) + '</b><span class="mono sb">' + esc(sub) + '</span></span>' +
      '<span class="dist"><u style="--w:' + distW(e).toFixed(1) + '%"></u></span></button>';
  }
  function listHTML() {
    var myE = M.guest ? null : me(), myRank = myE ? myE._rank : 0, show = [];
    M.list.forEach(function (e) {
      if (e._rank <= 3) return;
      if (e._rank <= 20 || (myRank && Math.abs(e._rank - myRank) <= 3)) show.push(e);
    });
    var h = '', prevCls = null, prevR = 3, myCls = myE ? classFor(myE.score || 0) : -1;
    show.forEach(function (e) {
      if (e._rank - prevR > 1) {
        var n = e._rank - prevR - 1;
        h += '<div class="rt-gapdiv" data-key="gap"><i><b></b><b></b><b></b></i><span>' + esc(t('rt_more', { n: n, w: wPlace(n) })) + '</span><i><b></b><b></b><b></b></i></div>';
      }
      if (!isWr()) {
        var ci = classFor(e.score || 0);
        if (ci !== prevCls) {
          var c = CLASSES[ci], mine = ci === myCls;
          h += '<div class="rt-cdiv' + (mine ? ' mine' : '') + '" data-key="c:' + ci + '" data-cls="' + ci + '"><img src="' + c.img + '" alt="">' + esc(clsName(c)) +
            ' <em>· ' + esc(t('rt_league', { v: m0(c.cap) })) + (mine ? ' · ' + esc(t('rt_your_league')) : '') + '</em></div>';
          prevCls = ci;
        }
      }
      h += rowHTML(e, myE);
      prevR = e._rank;
    });
    return h;
  }
  /* FLIP по ключам: оставшиеся строки переезжают, новые проявляются,
     ушедшие гаснут на старом месте. */
  function renderRows(mode, info) {
    var box = q('#rating-list'), old = {}, oldRank = {}, oldVal = {};
    qa('#rating-list > [data-key]').forEach(function (el) {
      var k = el.getAttribute('data-key');
      old[k] = { top: el.offsetTop, html: el.outerHTML };
      var rkEl = q('.rk', el), vb = q('.vl b', el);
      if (rkEl) oldRank[k] = rkEl.textContent;
      if (vb) oldVal[k] = vb.textContent;
    });
    box.classList.remove('loading');
    box.innerHTML = listHTML();
    bindAvatarFallbacks(box);
    if (mode === 'intro' || V3.reduced()) {
      if (mode === 'intro' && !V3.reduced()) {
        qa('#rating-list > *').forEach(function (el, k) {
          if (k > 22) return;
          el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: D(460), delay: D(420 + Math.min(k * 26, 560)), easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
        });
      }
      return;
    }
    var k = 0, seen = {};
    qa('#rating-list > [data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key'), o = old[key];
      seen[key] = 1;
      if (o) {
        var dy = o.top - el.offsetTop;
        if (key === 'p:me' && info && info.meMoved && Math.abs(dy) > 1) {
          el.classList.add('lift');
          el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(' + dy + 'px) scale(1.035)', offset: 0.14 }, { transform: 'scale(1.035)', offset: 0.82 }, { transform: 'none' }], { duration: D(1000), easing: 'cubic-bezier(0.5, 0, 0.3, 1)' }).onfinish = function () { el.classList.remove('lift'); };
        } else if (Math.abs(dy) > 1) {
          el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: D(mode === 'filter' ? 620 : 820), delay: D(info && info.meMoved ? 90 : 0), easing: 'cubic-bezier(0.3, 0.8, 0.25, 1)', fill: 'backwards' });
        }
      } else {
        el.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: D(420), delay: D(mode === 'filter' ? 200 + Math.min(k * 14, 300) : 260), easing: 'ease-out', fill: 'backwards' });
        k++;
      }
      var rkEl = q('.rk', el);
      if (rkEl && oldRank[key] != null && oldRank[key] !== rkEl.textContent && mode !== 'filter') restart(rkEl, 'roll');
      var vb = q('.vl b', el);
      if (vb && oldVal[key] != null && oldVal[key] !== vb.textContent && mode !== 'filter' && key !== 'p:me') {
        var was = parseFloat(String(oldVal[key]).replace(/[^\d.]/g, '')), now = parseFloat(String(vb.textContent).replace(/[^\d.]/g, ''));
        vb.classList.add(now >= was ? 'fu' : 'fd');
        (function (b) { setTimeout(function () { b.classList.remove('fu', 'fd'); }, D(700) + 80); })(vb);
      }
      if (info && info.passed && info.passed.indexOf(el.getAttribute('data-id')) >= 0) restart(el, 'passed');
    });
    Object.keys(old).forEach(function (key) {
      if (seen[key]) return;
      var wrap = document.createElement('div');
      wrap.innerHTML = old[key].html;
      var g = wrap.firstChild;
      g.removeAttribute('data-key');
      g.removeAttribute('data-id');
      g.style.cssText += ';position:absolute;left:0;right:0;top:' + old[key].top + 'px;pointer-events:none;';
      box.appendChild(g);
      g.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.96)' }], { duration: D(380), easing: 'ease-out', fill: 'forwards' }).onfinish = function () { if (g.parentNode) g.parentNode.removeChild(g); };
    });
    var meRow = q('#rating-list .rt-row.me[data-key]');
    if (meRow && info && info.fromVal != null && !isWr() && info.fromVal !== M.meScore) {
      countFrom(q('.vl b', meRow), info.fromVal, M.meScore, 900);
    }
  }

  /* Живой сдвиг без смены места: правим суммы на месте, без перерисовки. */
  function patchValues() {
    var e = me();
    if (!e) return;
    var row = q('#rating-list .rt-row.me[data-key]');
    if (row) {
      var b = q('.vl b', row), from = parseFloat(String(b.textContent).replace(/[^\d.]/g, '')) || e.score;
      countFrom(b, from, e.score, 600);
      var du = q('.dist u', row);
      if (du) du.style.setProperty('--w', distW(e).toFixed(1) + '%');
    }
    qa('#rating-list .rt-row:not(.me)').forEach(function (r) {
      var o = byId(r.getAttribute('data-id')), sb = q('.vl .sb', r);
      if (o && sb) sb.textContent = subTxt(o, e);
    });
    var i = idxOf(e);
    renderGap(e, i, e._rank, M.list[i - 1], M.list[i + 1], 'patch');
    renderGoals(e, e._rank);
    renderDock();
  }

  /* ---------------- Плашка «Вы» ---------------- */

  function renderDock() {
    var el = q('#rt-dock'), e = M && !M.guest ? me() : null;
    if (!e) { el.classList.remove('on'); el.innerHTML = ''; el.__k = ''; return; }
    var above = M.list[idxOf(e) - 1];
    var key = [e._rank, ratingValueText(e), above ? needTxt(above, e) : '', S.avatar, achFrameClass(e), cls(e).icon, LANG].join('|');
    if (el.__k !== key) {
      el.__k = key;
      el.innerHTML = '<span class="rk mono">' + e._rank + '</span>' + avaHTML(e, 's') +
        '<span class="nm"><b><span class="tx">' + esc(e.name) + '</span>' + youHTML() + '</b><span>' +
        (above ? esc(t('rt_dock_to', { r: above._rank })) + ' <b class="mono">' + needTxt(above, e) + '</b>' : esc(t('rt_dock_leader'))) + '</span></span>' +
        '<span class="vl mono">' + esc(ratingValueText(e)) + '<span class="chev">›</span></span>';
      bindAvatarFallbacks(el);
    }
    syncDock();
  }
  function syncDock() {
    var el = q('#rt-dock');
    if (!el) return;
    var on = !!(M && !M.guest && onTab() && !vis.row && !vis.hero && !sheetOpen && el.firstChild);
    el.classList.toggle('on', on);
    el.tabIndex = on ? 0 : -1;
  }
  function observe() {
    if (!window.IntersectionObserver) return;
    if (!io) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.target.id === 'rt-me') vis.hero = en.isIntersecting;
          else vis.row = en.isIntersecting;
        });
        syncDock();
      }, { root: q('#pages'), threshold: 0.35 });
    }
    io.disconnect();
    io.observe(q('#rt-me'));
    var r = q('#rating-list .rt-row.me[data-key]') || q('#rt-podium .rt-person[data-key="pp:me"]');
    vis.row = false;
    if (r) io.observe(r);
  }

  /* ---------------- Прокрутка, вспышки ---------------- */

  function scrollToEl(el, then, pad) {
    var sc = q('#pages');
    if (!el || !sc) return;
    if (inView(el)) { if (then) then(); return; }
    var top = layoutY(el, sc) - (pad != null ? pad : sc.clientHeight / 2 - el.offsetHeight / 2);
    sc.scrollTo({ top: Math.max(0, top), behavior: V3.reduced() ? 'auto' : 'smooth' });
    if (then) later(460, then);
  }
  /* Место в прокручиваемой ленте по раскладке, без transform: строка,
     которая ещё едет FLIP-ом, меряется там, где остановится. */
  function layoutY(el, sc) {
    var y = 0, n = el;
    while (n) { y += n.offsetTop; n = n.offsetParent; }
    for (n = sc; n; n = n.offsetParent) y -= n.offsetTop;
    return y - sc.clientTop;
  }
  function inView(el) {
    var sc = q('#pages');
    if (!el || !sc) return false;
    var y = layoutY(el, sc) - sc.scrollTop;
    return y >= 20 && y + el.offsetHeight <= sc.clientHeight - 80;
  }
  /* Обгоны в игре случаются сами (цены тикают), а не по кнопке, как в
     концепте: пока игрок сам листает список, прокрутку у него не отнимаем. */
  function autoScrollOk() { return Date.now() - userAt > 2500; }
  function goMe() {
    var r = q('#rating-list .rt-row.me[data-key]');
    if (r) scrollToEl(r, function () { restart(r, 'flash'); });
    else scrollToEl(q('#rt-podium'), null, 80);
  }
  function burst(el) {
    if (V3.lite() || !el) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 18; i++) (function (i) {
      var s = document.createElement('i'), a = i / 18 * Math.PI * 2, d = 40 + Math.random() * 50;
      s.className = 'rt-spark';
      document.body.appendChild(s);
      s.animate([{ transform: 'translate(' + cx + 'px,' + cy + 'px) scale(1)', opacity: 1 }, { transform: 'translate(' + (cx + Math.cos(a) * d) + 'px,' + (cy + Math.sin(a) * d) + 'px) scale(0.2)', opacity: 0 }], { duration: D(700 + Math.random() * 300), easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }).onfinish = function () { if (s.parentNode) s.parentNode.removeChild(s); };
    })(i);
  }
  /* Свой аватар летит по дуге из строки списка на подиум, в конце — искры. */
  function flyToPodium(from) {
    var tgt = q('#rt-podium .rt-person[data-key="pp:me"] .rt-ava'), e = me();
    if (!tgt || !e) return;
    if (V3.reduced()) { burst(tgt); return; }
    scrollToEl(q('#rt-podium'), null, 80);
    later(480, function () {
      if (!tgt.isConnected) return;
      var tr = tgt.getBoundingClientRect(), to = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2, w: tr.width };
      var f = document.createElement('div');
      f.className = 'rt-fly';
      f.style.setProperty('--s', from.w + 'px');
      f.innerHTML = avaHTML(e, '');
      document.body.appendChild(f);
      bindAvatarFallbacks(f);
      tgt.style.visibility = 'hidden';
      var cx = (from.x + to.x) / 2 + 60, cy = Math.min(from.y, to.y) - 80;
      V3.tween(820, function (p) {
        /* Лента ещё может доезжать к подиуму — цель меряем каждый кадр. */
        if (tgt.isConnected) { var tn = tgt.getBoundingClientRect(); to.x = tn.left + tn.width / 2; to.y = tn.top + tn.height / 2; }
        var k = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, u = 1 - k;
        var x = u * u * from.x + 2 * u * k * cx + k * k * to.x, y = u * u * from.y + 2 * u * k * cy + k * k * to.y, s = V3.lerp(1, to.w / from.w, k);
        f.style.transform = 'translate(' + (x - from.w / 2) + 'px,' + (y - from.w / 2) + 'px) scale(' + s + ')';
      }, function () {
        if (f.parentNode) f.parentNode.removeChild(f);
        tgt.style.visibility = '';
        burst(tgt);
      });
    });
  }
  /* «+2 места» поднимается над своей строкой у колонки суммы. */
  function floatAt(el, txt, dn) {
    if (!el || V3.reduced()) return;
    var r = el.getBoundingClientRect(), f = document.createElement('span');
    f.className = 'rt-float' + (dn ? ' dn' : '');
    f.textContent = txt;
    f.style.top = (r.top - 6) + 'px';
    f.style.right = Math.max(8, window.innerWidth - r.right + 58) + 'px';
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, D(1350) + 60);
  }
  /* Тост с аватарами тех, кого обогнали / кто обогнал. */
  function toastPlayers(key, ids, kind) {
    var el = toast(t(key, { n: names(ids) }), kind);
    var ico = el && el.querySelector('.tst-ico');
    if (!ico || el.querySelector('.rt-tstack')) return;
    var st = document.createElement('span');
    st.className = 'rt-tstack';
    st.setAttribute('aria-hidden', 'true');
    st.innerHTML = ids.slice(0, 3).map(byId).filter(Boolean).map(function (p) { return '<img src="' + avSrcOf(p) + '" alt="" draggable="false">'; }).join('');
    if (st.firstChild) ico.parentNode.replaceChild(st, ico);
  }
  function names(ids) {
    var ps = ids.map(byId).filter(Boolean).map(function (p) { return p.name; });
    if (!ps.length) return '';
    return ps.length === 1 ? ps[0] : ps.length === 2 ? t('rt_and', { a: ps[0], b: ps[1] }) : t('rt_and_more', { a: ps[0], n: ps.length - 1 });
  }

  /* ---------------- Отрисовка ---------------- */

  function segInd(instant) {
    var box = q('#rating-filters'), ind = box && q('i', box), btn = box && q('button.on', box);
    if (!ind || !btn || !btn.offsetWidth) return;
    if (instant) ind.style.transition = 'none';
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + (btn.offsetLeft - (parseFloat(getComputedStyle(ind).left) || 0)) + 'px)';
    if (instant) { V3.reflow(ind); ind.style.transition = ''; }
  }
  function updLabel() {
    var el = q('#rt-upd');
    if (!el || !M) return;
    var mn = Math.floor((Date.now() - M.updatedAt) / 6e4);
    el.textContent = mn < 1 ? t('rt_upd_now') : t('rt_upd_min', { n: mn });
  }
  function readLast() { try { var v = parseInt(localStorage.getItem(LS_KEY), 10); return isFinite(v) && v > 0 ? v : null; } catch (e) { return null; } }
  function writeLast(v) { try { if (v) localStorage.setItem(LS_KEY, String(v)); } catch (e) { void e; } }

  /* model: { list (отсортирован, с _rank), guest, filter, capRank, live, updatedAt, meScore } */
  function render(model, mode, deferred) {
    var seq = ++renderSeq;
    /* Как в концепте: сначала к своей строке, потом обгон — иначе FLIP
       проходит за кадром. */
    if (mode === 'move' && !deferred && M && !M.guest && !V3.reduced() && autoScrollOk()) {
      var r0 = q('#rating-list .rt-row.me[data-key]');
      if (r0 && !inView(r0)) {
        scrollToEl(r0, null);
        later(460, function () { if (seq === renderSeq) render(model, onTab() ? 'move' : 'quiet', true); });
        return;
      }
    }
    var prev = M, prevMe = prev && !prev.guest ? me() : null;
    var prevRanks = {};
    if (prev) prev.list.forEach(function (p) { prevRanks[p.id] = p._rank; });
    /* Откуда полетит аватар, если строка уходит на подиум. */
    var fromAva = null;
    if (mode === 'move' && prevMe && prevMe._rank > 3) {
      var av0 = q('#rating-list .rt-row.me[data-key] .rt-ava');
      if (av0) { var ar = av0.getBoundingClientRect(); fromAva = { x: ar.left + ar.width / 2, y: ar.top + ar.height / 2, w: ar.width }; }
    }
    M = model;
    var quiet = mode === 'quiet';
    if (quiet) mode = 'refresh';
    if (mode === 'intro') {
      lastSeen = readLast();
      var pages = q('#pages');
      if (pages && onTab()) pages.scrollTop = 0;
    }
    if (!M.guest && M.capRank) writeLast(M.capRank);

    var e = M.guest ? null : me();
    var info = null;
    if (mode === 'move' || mode === 'refresh') {
      info = { meMoved: mode === 'move', passed: [], by: [] };
      if (prevMe && e) {
        info.fromVal = prevMe.score;
        M.list.forEach(function (p) {
          if (p.me || prevRanks[p.id] == null) return;
          var wasAbove = prevRanks[p.id] < prevMe._rank, nowAbove = p._rank < e._rank;
          if (wasAbove && !nowAbove) info.passed.push(p.id);
          if (!wasAbove && nowAbove) info.by.push(p.id);
        });
        if (fromAva && e._rank <= 3) info.flyFrom = fromAva;
      }
    }

    if (M.guest) renderGuest(); else renderHero(mode);
    renderPodium(mode, info);
    renderRows(mode, info);
    renderDock();
    observe();
    q('#rt-foot-t').textContent = t(M.guest ? 'rt_foot_guest' : 'rt_foot_me');
    updLabel();
    if (mode !== 'filter') segInd(true);
    if (mode === 'intro') later(40, function () { segInd(true); });

    if (quiet) return;
    if (info && prevMe && e) {
      var d = prevMe._rank - e._rank, nr = q('#rating-list .rt-row.me[data-key]');
      if (d > 0) Snd.play('rank_up'); else if (d < 0) Snd.play('rank_down');
      if (mode === 'move') {
        restart(q('#rt-me'), d < 0 ? 'drop' : 'lift');
        if (info.flyFrom) flyToPodium(info.flyFrom);
        else if (nr) {
          if (autoScrollOk()) later(120, function () { scrollToEl(nr, null); });
          if (d) later(900, function () { floatAt(nr, (d > 0 ? '+' : '−') + Math.abs(d) + ' ' + wPlace(Math.abs(d)), d < 0); });
        }
        if (info.passed.length) toastPlayers('rt_t_passed', info.passed, 'ok');
        else if (info.by.length) toastPlayers(info.by.length > 1 ? 'rt_t_by' : 'rt_t_by1', info.by, 'bad');
      } else if (d > 0) toast(t('rt_t_up', { n: d, w: wPlace(d) }), 'ok');
      else if (d < 0) {
        /* Обновление: соперники тоже торгуют — кто обошёл, того и показываем. */
        restart(q('#rt-me'), 'drop');
        if (info.by.length) toastPlayers(info.by.length > 1 ? 'rt_t_by' : 'rt_t_by1', info.by, 'bad');
        else toast(t('rt_t_upd'));
      } else toast(t('rt_t_upd'));
      [20, 10, 3].forEach(function (m) {
        if (prevMe._rank > m && e._rank <= m) later(1000, function () { if (m === 3) Snd.play('podium'); burst(q('#rt-me')); toast(m === 3 ? t('rt_t_podium') : t('rt_t_top', { n: m }), 'gold'); });
      });
    } else if (mode === 'refresh') toast(t('rt_t_upd'));
  }

  /* Скелетон, пока SDK отвечает на первый запрос. */
  function skeleton() {
    M = null;
    q('#rt-guest').classList.add('hidden');
    var hero = q('#rt-me');
    hero.classList.remove('hidden');
    hero.innerHTML = '<div class="rt-skel" style="height:150px"></div>';
    q('#rt-podium').innerHTML = '<div class="rt-skel" style="height:230px;margin:0 6px 12px"></div>';
    q('#rating-list').innerHTML = new Array(8).join('<div class="rt-skel row"></div>');
    q('#rt-dock').classList.remove('on');
  }

  /* ---------------- Обновление ---------------- */

  function refresh(done) {
    if (busy) return;
    busy = true;
    Snd.play('refresh');
    var btn = q('#rt-refresh'), rows = q('#rating-list');
    btn.classList.add('spin');
    rows.classList.add('loading');
    later(900, function () {
      try { renderRating({ refresh: true }); } catch (err) { dbg('rt:refresh', err); }
      /* Ответ SDK может прийти позже — крутилку снимаем по таймеру. */
      later(M && !M.live ? 900 : 0, function () {
        btn.classList.remove('spin');
        rows.classList.remove('loading');
        busy = false;
        if (done) done();
      });
    });
  }

  /* Капитал изменился, пока вкладка открыта: место сменилось — строка
     обгоняет соседей (move), иначе суммы правятся на месте. */
  var liveMove = null;
  function liveCheck() {
    if (!M || M.guest || !M.live || busy || !onTab() || isWr() || document.hidden) return;
    var e = me();
    if (!e) return;
    var cap = Math.round(capital());
    if (cap === e.score) return;
    var rank = 1;
    M.list.forEach(function (p) { if (!p.me && (p.score || 0) > cap) rank++; });
    if (rank !== e._rank) {
      /* Гистерезис: капитал, дрожащий у границы соседа, не должен гонять
         обгон и тосты туда-обратно каждые 2 с — откат ждёт 10 с. */
      var now = Date.now();
      if (liveMove && rank === liveMove.from && now - liveMove.at < 10000) return;
      liveMove = { from: e._rank, at: now };
      renderRating({ live: true });
      return;
    }
    e.score = cap;
    M.meScore = cap;
    patchValues();
  }

  /* ---------------- Шторки ---------------- */

  function ensureSheet() {
    var m = q('#modal-rt');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'modal-rt';
    m.className = 'modal hidden rt-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="backdrop"></div><div class="sheet rt-sheet"><div class="rt-grab"></div><div id="rt-sheet-body"></div></div>';
    (q('#app') || document.body).appendChild(m);
    q('.backdrop', m).addEventListener('click', closeSheet);
    m.addEventListener('click', onSheetClick);
    dragToClose(q('.rt-sheet', m));
    return m;
  }
  function openSheet(html) {
    var m = ensureSheet(), sh = q('.rt-sheet', m);
    q('#rt-sheet-body').innerHTML = html;
    sh.style.transform = '';
    sh.scrollTop = 0;
    bindAvatarFallbacks(m);
    openModal('modal-rt');
    sheetOpen = true;
    syncDock();
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      qa('#rt-sheet-body u[data-w]').forEach(function (u) { u.style.width = u.getAttribute('data-w') + '%'; });
    }); });
  }
  function closeSheet() {
    closeModal('modal-rt');
    sheetOpen = false;
    syncDock();
  }
  function dragToClose(panel) {
    var y0 = null, dy = 0;
    panel.addEventListener('pointerdown', function (ev) {
      if (panel.scrollTop > 0 || ev.clientY - panel.getBoundingClientRect().top > 60) return;
      y0 = ev.clientY; dy = 0;
      panel.style.transition = 'none';
    });
    panel.addEventListener('pointermove', function (ev) {
      if (y0 == null) return;
      dy = Math.max(0, ev.clientY - y0);
      panel.style.transform = 'translateY(' + dy + 'px)';
    });
    var end = function () {
      if (y0 == null) return;
      y0 = null;
      panel.style.transition = '';
      if (dy > 80) closeSheet();
      else panel.style.transform = '';
    };
    panel.addEventListener('pointerup', end);
    panel.addEventListener('pointercancel', end);
  }
  function onSheetClick(ev) {
    var b = ev.target.closest('[data-rt-act]');
    if (!b) return;
    var act = b.getAttribute('data-rt-act');
    if (act === 'close') closeSheet();
    else if (act === 'trade') { closeSheet(); setTab('market'); }
    else if (act === 'login') { closeSheet(); signIn(); }
  }

  function playerSheet(id) {
    var p = M && byId(id);
    if (!p) return;
    var c = cls(p);
    var h = '<div class="rt-ps">' + avaHTML(p, 'xl') + '<h3>' + esc(p.name) + (p.me ? ' ' + youHTML() : '') + '</h3>' +
      '<div class="row1">' + achTitleHtml(p) + '<span class="rt-clschip"><img src="' + c.img + '" alt="">' + esc(clsName(c)) + '</span></div>' +
      '<div class="rt-ps-stats"><div><span>' + esc(t('rt_s_place')) + '</span><b class="mono">#' + p._rank + '</b></div>' +
      '<div><span>' + esc(t('rt_s_cap')) + '</span><b class="mono">' + compact(p.score) + '</b></div>' +
      '<div><span>' + esc(t('rt_s_wr')) + '</span><b class="mono">' + (hasWr(p) ? pct(p.winRate) : '—') + '</b></div></div>';
    var myE = M.guest ? null : me(), btns;
    if (!myE) {
      h += '<div class="rt-cmp"><div class="note">' + esc(t('rt_note_guest', { n: p.name })) + '</div></div>';
      btns = '<button type="button" class="btn" data-rt-act="close">' + esc(t('rt_close')) + '</button>' +
        '<button type="button" class="btn rt-ya" data-rt-act="login"><span class="ym" aria-hidden="true">Я</span>' + esc(t('rt_login_short')) + '</button>';
    } else {
      var other = p.me ? M.list[idxOf(p) - 1] : p;
      if (other) {
        var vo = ratingValue(other), vm = ratingValue(myE), ahead = vo > vm, mx = Math.max(vo, vm, 0) || 1;
        var head = p.me ? t('rt_to_name', { r: other._rank, n: other.name }) : t(ahead ? 'rt_behind' : 'rt_ahead');
        var diff = ahead ? needTxt(other, myE) : leadTxt(myE, other);
        h += '<div class="rt-cmp"><div class="h"><span>' + esc(head) + '</span><b class="mono ' + (ahead ? 'down' : 'up') + '">' + (diff === '—' ? '' : ahead ? '−' : '+') + esc(diff.replace('-', '')) + '</b></div>' +
          '<div class="br them"><span>' + esc(other.name) + '</span><i><u data-w="' + (Math.max(0, vo) / mx * 100).toFixed(1) + '"></u></i><em class="mono">' + esc(ratingValueText(other)) + '</em></div>' +
          '<div class="br mine"><span>' + esc(t('rating_you')) + '</span><i><u data-w="' + (Math.max(0, vm) / mx * 100).toFixed(1) + '"></u></i><em class="mono">' + esc(ratingValueText(myE)) + '</em></div>' +
          '<div class="note">' + esc(ahead ? t(isWr() ? 'rt_note_wr' : 'rt_note_cap', { v: diff }) : t('rt_note_keep')) + '</div></div>';
        btns = '<button type="button" class="btn" data-rt-act="close">' + esc(t('rt_close')) + '</button>' +
          '<button type="button" class="btn primary" data-rt-act="trade">' + (ahead ? ic('trend', 3.8) + esc(t('rt_overtake')) : esc(t('rt_to_market'))) + '</button>';
      } else {
        var second = M.list[1];
        h += '<div class="rt-cmp"><div class="note">' + esc(t('rt_note_first', { v: second ? leadTxt(myE, second) : '—' })) + '</div></div>';
        btns = '<button type="button" class="btn primary" data-rt-act="close">' + esc(t('rt_great')) + '</button>';
      }
    }
    openSheet(h + '<div class="rt-sh-btns">' + btns + '</div></div>');
  }
  function infoSheet() {
    openSheet('<div class="rt-sh-h">' + esc(t('rt_info_h')) + '</div><div class="rt-info">' +
      '<div><i>' + ic('coins') + '</i><span><b>' + esc(t('rt_i_cap_h')) + '</b><span>' + esc(t('rt_i_cap')) + '</span></span></div>' +
      '<div><i>' + ic('users', 3.4) + '</i><span><b>' + esc(t('rt_i_vis_h')) + '</b><span>' + esc(t('rt_i_vis')) + '</span></span></div>' +
      '<div><i>' + ic('trophy', 3.4) + '</i><span><b>' + esc(t('rt_i_lg_h')) + '</b><span>' + esc(t('rt_i_lg')) + '</span>' +
      '<div class="rt-clsgrid">' + CLASSES.map(function (c) { return '<div><img src="' + c.img + '" alt=""><p><b>' + esc(clsName(c)) + '</b>' + esc(c.cap ? t('rt_league', { v: compact(c.cap) }) : t('rt_start')) + '</p></div>'; }).join('') + '</div></span></div>' +
      '<div><i>' + ic('target', 3.4) + '</i><span><b>' + esc(t('rt_i_wr_h')) + '</b><span>' + esc(t('rating_wr_hint')) + '</span></span></div>' +
      '<div><i>' + ic('lock') + '</i><span><b>' + esc(t('rt_i_who_h')) + '</b><span>' + esc(t('rt_i_who')) + '</span></span></div>' +
      '</div><div class="rt-sh-btns"><button type="button" class="btn primary" data-rt-act="close">' + esc(t('rt_got')) + '</button></div>');
  }

  /* ---------------- События ---------------- */

  function onClick(ev) {
    var b = ev.target.closest('[data-rt-act], [data-rt-goto], [data-rt-cls], [data-id], #rt-me');
    if (!b || !q('#tab-rating').contains(b)) return;
    var act = b.getAttribute('data-rt-act');
    if (act === 'info') { infoSheet(); return; }
    if (act === 'to-me') { goMe(); return; }
    if (b.hasAttribute('data-rt-goto')) {
      var n = Number(b.getAttribute('data-rt-goto')), tr = null;
      if (n <= 3) tr = q('#rt-podium');
      else qa('#rating-list .rt-row[data-key]').forEach(function (r) { if (!tr && Number(q('.rk', r).textContent) === n) tr = r; });
      if (tr) scrollToEl(tr, function () { restart(tr, 'flash'); }, 110);
      return;
    }
    if (b.hasAttribute('data-rt-cls')) {
      var ci = Number(b.getAttribute('data-rt-cls')), cd = q('#rating-list .rt-cdiv[data-cls="' + ci + '"]');
      if (cd && !isWr()) scrollToEl(cd, function () { var nx = cd.nextElementSibling; if (nx) restart(nx, 'flash'); }, 110);
      else toast(t('rt_cls_toast', { c: clsName(CLASSES[ci]), v: m0(CLASSES[ci].cap) }), 'gold');
      return;
    }
    if (b.hasAttribute('data-id')) { playerSheet(b.getAttribute('data-id')); return; }
    if (b.id === 'rt-me' && M && !M.guest) goMe();
  }

  /* Потянуть вниз у верхней кромки — обновить (палец или мышь, как в
     концепте). Сдвиг — через translate (не transform): transform вкладки
     занят свайпом между вкладками. */
  function bindPull() {
    var pages = q('#pages'), page = q('#tab-rating'), ptr = q('#rt-ptr'), txt = q('#rt-ptr-t');
    if (!pages || !page) return;
    var y0 = null, x0 = 0, d = 0, armed = false, TH = 56, ico = q('i', ptr);
    function start(x, y) {
      if (!onTab() || busy || pages.scrollTop > 0) { y0 = null; return; }
      y0 = y; x0 = x; d = 0; armed = false;
    }
    function move(x, y) {
      if (y0 == null) return;
      var dy = y - y0, dx = x - x0;
      if (!armed) {
        if (Math.abs(dx) > Math.abs(dy) || dy < 0 || pages.scrollTop > 0) { if (Math.abs(dx) + Math.abs(dy) > 8) y0 = null; return; }
        if (dy < 6) return;
        armed = true;
        page.classList.add('rt-pulling');
      }
      d = Math.min(90, Math.max(0, dy) * 0.5);
      page.style.setProperty('--rt-pull', d + 'px');
      ptr.style.opacity = String(Math.min(1, d / 50));
      if (ico) ico.style.transform = 'rotate(' + d * 4 + 'deg)';
      txt.textContent = t(d > TH ? 'rt_ptr_release' : 'rt_ptr_pull');
    }
    var end = function () {
      y0 = null;
      if (!armed) return;
      armed = false;
      page.classList.remove('rt-pulling');
      if (d > TH) {
        page.style.setProperty('--rt-pull', TH + 'px');
        ptr.classList.add('spin');
        txt.textContent = t('rt_ptr_busy');
        refresh(function () {
          page.style.setProperty('--rt-pull', '0px');
          ptr.style.opacity = '0';
          ptr.classList.remove('spin');
        });
      } else {
        page.style.setProperty('--rt-pull', '0px');
        ptr.style.opacity = '0';
      }
    };
    pages.addEventListener('touchstart', function (ev) {
      if (ev.touches.length !== 1) { y0 = null; return; }
      start(ev.touches[0].clientX, ev.touches[0].clientY);
    }, { passive: true });
    pages.addEventListener('touchmove', function (ev) { move(ev.touches[0].clientX, ev.touches[0].clientY); }, { passive: true });
    pages.addEventListener('touchend', end);
    pages.addEventListener('touchcancel', end);
    /* Мышь: тянуть можно за пустое место, не за кнопки и строки. */
    pages.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType !== 'mouse' || ev.button !== 0 || ev.target.closest('button, a, input, [data-id], #rt-me')) return;
      start(ev.clientX, ev.clientY);
    });
    pages.addEventListener('pointermove', function (ev) {
      if (ev.pointerType !== 'mouse' || y0 == null) return;
      move(ev.clientX, ev.clientY);
      if (armed) ev.preventDefault();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) {
      pages.addEventListener(n, function (ev) { if (ev.pointerType === 'mouse') end(); });
    });
  }

  function init() {
    var page = q('#tab-rating');
    if (!page) return;
    page.addEventListener('click', onClick);
    page.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.rt-person[data-id], #rt-me')) { ev.preventDefault(); ev.target.click(); }
    });
    q('#rt-refresh').addEventListener('click', function () { refresh(); });
    bindPull();
    var pages = q('#pages'), mark = function () { if (onTab()) userAt = Date.now(); };
    if (pages) ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (n) { pages.addEventListener(n, mark, { passive: true }); });
    setInterval(liveCheck, 2000);
    setInterval(function () { if (onTab()) updLabel(); }, 15000);
    window.addEventListener('resize', function () { if (onTab()) segInd(true); });
  }
  /* Уход с вкладки: плашка «Вы» прячется, шторка закрывается. */
  V3.after('setTab', function () {
    if (!onTab()) { if (sheetOpen) closeSheet(); syncDock(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { render: render, skeleton: skeleton, segInd: segInd, infoSheet: infoSheet, playerSheet: playerSheet, refresh: refresh };
})();
