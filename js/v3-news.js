/* v3 — экран «Новости рынка» по concept/news.html.
   Всё строится на реальной ленте движка (Engine.newsFeed) и реальной
   истории цен (Engine.candles / Engine.live): реакция, пик и мини-графики
   считаются от закрытий 5-секундных свечей вокруг события.

   Импульс новости в движке начинается с начала её 2-минутного бакета
   (newsImpulse: dist = k − bb·24), а не с метки t внутри бакета, — поэтому
   точка отсчёта реакции t0 = начало бакета: график честно показывает, когда
   цена начала двигаться.

   Прочитанное хранится в localStorage (tu_news_read): водяной знак «всё до
   этого момента прочитано» + ключи прочитанных после него. Непрочитанными
   считаются только события последних UNREAD_WIN минут — лента плотная
   (~12 событий в минуту), и без окна бейдж показывал бы сотни. */
'use strict';

V3.i18n({
  ru: {
    nw_unread1: 'непрочитанная', nw_unread2: 'непрочитанные', nw_unread5: 'непрочитанных',
    nw_readall: 'Отметить всё прочитанным', nw_all_read: 'Всё прочитано',
    nw_pulse_sub: 'за последний час', nw_by_filter: 'по фильтру', nw_up: 'рост', nw_down: 'падение',
    nw_mood_none: 'Нет событий', nw_activity: 'Активность за час', nw_60m: '60 мин', nw_30m: '30 мин', nw_now: 'сейчас',
    nw_events: 'Событий', nw_strong: 'Сильных', nw_booms: 'Взрывов', nw_top_hour: 'Главное за час',
    nw_boom: 'Взрыв цены', nw_market: 'Весь рынок', nw_ev: '{x} событие', nw_ago: '{t} назад',
    nw_reaction: 'Реакция', nw_rx: 'реакция {s}', nw_rx_first: 'в первые секунды', nw_rx_min: 'за {n} мин',
    nw_peak: 'Пик', nw_from_news: 'от новости', nw_power: 'Сила', nw_news_at: 'Новость · {t}',
    nw_hint: 'Как обычно ведёт себя цена',
    nw_bh_ext: 'Взрыв цены: главный рывок в первые минуты, дальше долгий разгон',
    nw_bh_mkt: 'Двигает весь рынок сразу: крупные монеты слабее, мелкие — сильнее',
    nw_bh_flat: 'Нейтральная новость — цену почти не двигает',
    nw_bh_vol: 'Меняет объём торгов, а цена почти не реагирует',
    nw_bh_shock: 'Резкий скачок сразу — и почти без продолжения',
    nw_bh_trend: 'Тихий старт и долгий тренд — есть время войти',
    nw_bh_impulse: 'Быстрый импульс с затухающим хвостом',
    nw_bh_smooth: 'Плавное движение, которое держится несколько минут',
    nw_bh_mild: 'Умеренная реакция, быстро гаснет',
    nw_open_chart: 'Открыть график', nw_open_market: 'Открыть рынок', nw_fav_add: 'В избранное', nw_fav_on: 'В избранном',
    nw_fav_added: 'Добавлено в избранное', nw_fav_removed: 'Убрано из избранного', nw_in_pf: 'В портфеле',
    nw_sec_now: 'Только что', nw_sec_recent: 'Последние 20 минут', nw_sec_earlier: 'Раньше',
    nw_all_topics: 'Все темы', nw_new1: 'новое', nw_new2: 'новых', nw_new5: 'новых', nw_urgent: 'Срочно',
    nw_more: 'Показать ещё', nw_shown: 'Показано {n} из {m}', nw_end: 'Лента за последний час',
    nw_empty_cat: 'В теме «{c}» тихо', nw_empty_cat_sub: 'За последний час таких событий не было. Выберите другую тему или покажите всё',
    nw_col: '{a}–{b} мин назад: {n}', nw_col_none: 'нет событий', nw_filter: 'Фильтр ленты', nw_topics: 'Темы',
    nw_all_read_sub: 'Новые события отметим точкой', nw_fav_sub: '{n} — теперь в фильтре «Мои»',
    nw_ptr_pull: 'Потяните, чтобы обновить', nw_ptr_release: 'Отпустите, чтобы обновить', nw_ptr_busy: 'Проверяем новости…',
    nw_refreshed: 'Лента обновлена', nw_no_fresh: 'Новых событий пока нет',
    nw_fresh1: 'новое событие', nw_fresh2: 'новых события', nw_fresh5: 'новых событий'
  },
  en: {
    nw_unread1: 'unread', nw_unread2: 'unread', nw_unread5: 'unread',
    nw_readall: 'Mark all as read', nw_all_read: 'All caught up',
    nw_pulse_sub: 'over the last hour', nw_by_filter: 'filtered', nw_up: 'up', nw_down: 'down',
    nw_mood_none: 'No events', nw_activity: 'Activity this hour', nw_60m: '60 min', nw_30m: '30 min', nw_now: 'now',
    nw_events: 'Events', nw_strong: 'Strong', nw_booms: 'Surges', nw_top_hour: 'Top this hour',
    nw_boom: 'Price surge', nw_market: 'Whole market', nw_ev: '{x} event', nw_ago: '{t} ago',
    nw_reaction: 'Reaction', nw_rx: 'reaction {s}', nw_rx_first: 'in the first seconds', nw_rx_min: 'over {n} min',
    nw_peak: 'Peak', nw_from_news: 'since news', nw_power: 'Impact', nw_news_at: 'News · {t}',
    nw_hint: 'How the price usually reacts',
    nw_bh_ext: 'Price surge: the main jump in the first minutes, then a long run',
    nw_bh_mkt: 'Moves the whole market at once: big coins less, small coins more',
    nw_bh_flat: 'Neutral news — barely moves the price',
    nw_bh_vol: 'Changes trading volume while the price barely reacts',
    nw_bh_shock: 'A sharp jump right away — with almost no follow-through',
    nw_bh_trend: 'Quiet start and a long trend — there is time to get in',
    nw_bh_impulse: 'A quick impulse with a fading tail',
    nw_bh_smooth: 'A smooth move that holds for several minutes',
    nw_bh_mild: 'A moderate reaction that fades fast',
    nw_open_chart: 'Open chart', nw_open_market: 'Open market', nw_fav_add: 'Add to favorites', nw_fav_on: 'In favorites',
    nw_fav_added: 'Added to favorites', nw_fav_removed: 'Removed from favorites', nw_in_pf: 'In portfolio',
    nw_sec_now: 'Just now', nw_sec_recent: 'Last 20 minutes', nw_sec_earlier: 'Earlier',
    nw_all_topics: 'All topics', nw_new1: 'new', nw_new2: 'new', nw_new5: 'new', nw_urgent: 'Breaking',
    nw_more: 'Show more', nw_shown: 'Showing {n} of {m}', nw_end: 'Feed covers the last hour',
    nw_empty_cat: 'Quiet in «{c}»', nw_empty_cat_sub: 'No such events in the last hour. Pick another topic or show everything',
    nw_col: '{a}–{b} min ago: {n}', nw_col_none: 'no events', nw_filter: 'Feed filter', nw_topics: 'Topics',
    nw_all_read_sub: 'New events will get a dot', nw_fav_sub: '{n} is now in «Mine»',
    nw_ptr_pull: 'Pull to refresh', nw_ptr_release: 'Release to refresh', nw_ptr_busy: 'Checking the news…',
    nw_refreshed: 'Feed updated', nw_no_fresh: 'No new events yet',
    nw_fresh1: 'new event', nw_fresh2: 'new events', nw_fresh5: 'new events'
  }
});

var NV3 = (function () {
  var D = V3.D, esc = V3.esc, reflow = V3.reflow, tween = V3.tween, easeOut = V3.easeOut;
  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function restart(e, c) { if (!e) return; e.classList.remove(c); reflow(e); e.classList.add(c); }
  /* Как D() в концепте: длительность и задержка WAAPI идут через --k. */
  function anim(e, frames, o) {
    if (!e || !e.animate || V3.reduced()) return null;
    o.duration = D(o.duration);
    if (o.delay) o.delay = D(o.delay);
    try { return e.animate(frames, o); } catch (x) { return null; }
  }
  /* Время на чтение (баннер, подсказка) тянется вместе с --k, но от «меньше движения» не зависит. */
  function K() { var k = parseFloat(document.documentElement.style.getPropertyValue('--k')); return k > 0 ? k : 1; }
  function int(x) { return String(Math.round(x)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(ts) { var d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function plural(n, base) {
    if (LANG !== 'ru') return t(base + (n === 1 ? '1' : '2'));
    var m10 = n % 10, m100 = n % 100;
    return t(base + (m10 === 1 && m100 !== 11 ? '1' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? '2' : '5'));
  }
  function fmtPct(v) { var a = Math.abs(v); return (v >= 0 ? '+' : '\u2212') + a.toFixed(a >= 1 ? 1 : 2) + '%'; }
  function sign(v) { return Math.abs(v) < 0.05 ? 'flat' : v > 0 ? 'up' : 'down'; }
  function rxText(v) { return sign(v) === 'flat' ? '0.0%' : fmtPct(v); }
  /* Сглаженный путь через точки (Catmull-Rom → Безье). */
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
    for (var i = 1; i < pts.length; i++) if (pts[i][0] >= x) return lerp(pts[i - 1][1], pts[i][1], (x - pts[i - 1][0]) / ((pts[i][0] - pts[i - 1][0]) || 1));
    return pts[pts.length - 1][1];
  }

  /* ---------------- Справочники ---------------- */

  var CICON = {
    tech: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    fund: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    whale: '<path d="M2 13c1.5 4 5 6 10 6 6 0 10-3.5 10-8 0-1.5-.8-2.5-2-2.5-2 0-2.5 3-6 3H6.5C4 11.5 2.5 12 2 13z"/><path d="M16 4.5c1 .8 1.2 2 .6 3M19.5 4c-.2 1.6-1 2.8-2.3 3.6"/>',
    volume: '<path d="M4 20v-7M9 20V6M14 20v-9M19 20V4"/>',
    listing: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
    partnership: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    regulation: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    security: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    supply: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    adoption: '<path d="M3 9l2-5h14l2 5M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8"/>',
    network: '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M10.8 7.2 6.2 15.8M13.2 7.2l4.6 8.6M7.5 18h9"/>',
    tokenomics: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
    team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5a5 5 0 0 1 4.5 5"/>',
    macro: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    market: '<path d="M7 4v16M17 4v16"/><rect x="4.5" y="8" width="5" height="7" rx="1"/><rect x="14.5" y="6" width="5" height="9" rx="1"/>',
    analyst: '<path d="M3 20h18M4 16l5-5 4 3 7-7"/><path d="M15 7h5v5"/>',
    liquidity: '<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>'
  };
  function catIco(c) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CICON[c] || CICON.market) + '</svg>'; }
  /* Копия CAT_PROFILE из js/engine.js (там он не экспортирован): s — шок сразу, t — хвост. */
  var PROFILE = { tech: { s: 1, t: 0.4 }, fund: { s: 1, t: 0.3 }, whale: { s: 1, t: 0.3 }, volume: { s: 0.2, t: 0.05 }, listing: { s: 1.4, t: 0.15 }, partnership: { s: 0.9, t: 0.5 }, regulation: { s: 0.4, t: 1 }, security: { s: 1.4, t: 0.1 }, supply: { s: 0.6, t: 0.6 }, adoption: { s: 0.5, t: 0.9 }, network: { s: 0.5, t: 0.4 }, tokenomics: { s: 0.5, t: 0.7 }, macro: { s: 0.4, t: 0.9 }, analyst: { s: 0.6, t: 0.4 }, market: { s: 0.3, t: 0.2 }, liquidity: { s: 0.8, t: 0.15 }, team: { s: 0.3, t: 0.2 } };
  function behave(n) {
    if (n.ext) return t('nw_bh_ext');
    if (n.mkt) return t('nw_bh_mkt');
    if (!n.dir) return t('nw_bh_flat');
    if (n.cat === 'volume') return t('nw_bh_vol');
    var p = PROFILE[n.cat] || { s: 1, t: 0.3 };
    if (p.s >= 1.3 && p.t <= 0.2) return t('nw_bh_shock');
    if (p.t >= 0.9) return t('nw_bh_trend');
    if (p.s >= 0.9) return t('nw_bh_impulse');
    if (p.t >= 0.6) return t('nw_bh_smooth');
    return t('nw_bh_mild');
  }
  var ARW_UP = '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 2l4.5 7h-9z"/></svg>';
  var ARW_DN = '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 10L1.5 3h9z"/></svg>';
  var DOT = '<svg viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="3"/></svg>';
  var STAR_S = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg>';
  var STAR_O = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg>';
  var BAG_S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  var CHART_I = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M4 16l5-5 4 3 7-7"/></svg>';
  var BULB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';
  var GRID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>';
  var MAJORS = ['bitcoin', 'ethereum', 'solana'];

  /* ---------------- Данные ---------------- */

  var HOUR = 3600000, BUCKET = 120000, TLN = 30, PRE = 12, MAXK = 180, UNREAD_WIN = 5 * 60000, CAP0 = 40;
  var CM = Engine.CANDLE_MS || 5000;
  var ST = { items: [], by: {}, seg: 'all', cat: 'all', cap: CAP0, open: null, built: false, lang: '' };

  function coinSrc(a) { return a.img || ('img/coins/' + a.id + '.png'); }
  function keyOf(it) { return (it.market ? 'm' : (it.extreme ? 'x' : 'a') + it.id) + '@' + it.t; }
  function mkItem(it) {
    var a = it.market ? null : assetById(it.id);
    if (!it.market && !a) return null;
    return {
      k: keyOf(it), id: it.id || '', a: a, mkt: !!it.market, ext: !!it.extreme,
      dir: it.dir > 0 ? 1 : it.dir < 0 ? -1 : 0, imp: clamp(it.impact || 1, 1, 3), cat: it.cat || 'market',
      t: it.t, t0: Math.floor(it.t / BUCKET) * BUCKET, pts: null, done: false, at: 0,
      /* Тексты шаблонов в движке со строчной буквы. */
      text: (it.text || '').charAt(0).toUpperCase() + (it.text || '').slice(1)
    };
  }
  function feedNow(ts) {
    var raw = [];
    try { raw = Engine.newsFeed(ts, 1200) || []; } catch (e) { raw = []; }
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      if (ts - raw[i].t >= HOUR) break;
      var n = ST.by[keyOf(raw[i])] || mkItem(raw[i]);
      if (n) out.push(n);
    }
    return out;
  }
  function nameOf(n) { return n.mkt ? t('nw_market') : assetName(n.a); }
  function isMine(n) { return !!(n.a && (S.favs[n.a.id] || S.positions[n.a.id])); }
  function segOk(n, seg) { return seg === 'all' || (seg === 'mine' ? isMine(n) : n.imp >= 2); }
  function passes(n) { return segOk(n, ST.seg) && (ST.cat === 'all' || n.cat === ST.cat); }
  function listFor() { return ST.items.filter(passes); }
  function secOf(n, ts) { var age = ts - n.t; return age < BUCKET ? 'now' : age < 20 * 60000 ? 'recent' : 'earlier'; }

  /* Ряд цены в % от закрытия свечи перед бакетом события: PRE свечей до,
     до MAXK после (15 мин), в конце — живая цена, пока окно не закрылось. */
  function assetPts(a, n, ts) {
    var from = n.t0 - CM * (PRE + 1), to = n.t0 - CM + MAXK * CM;
    var cnt = Math.ceil((ts - from) / CM) + 2, cs = Engine.candles(a, cnt, 1, ts), vals = [], base = null;
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.t < from || c.t > to || c.t > ts - CM) continue;
      if (c.t === n.t0 - CM) base = c.c;
      vals.push(c.c);
    }
    if (to > ts - CM) vals.push(Engine.live(a, ts));
    if (base == null) base = vals.length > PRE ? vals[PRE] : vals[0];
    return vals.map(function (v) { return (v / base - 1) * 100; });
  }
  function series(n, ts) {
    if (n.done) return n.pts;
    if (n.pts && ts - n.at < 900) return n.pts;
    var pts;
    try {
      if (n.a) pts = assetPts(n.a, n, ts);
      else {
        var ms = MAJORS.map(assetById).filter(Boolean), rows = ms.map(function (a) { return assetPts(a, n, ts); });
        var len = Math.min.apply(null, rows.map(function (r) { return r.length; }));
        n.coins = ms.map(function (a, j) { return { a: a, v: rows[j][len - 1] || 0 }; });
        pts = [];
        for (var i = 0; i < len; i++) { var s = 0; for (var j = 0; j < rows.length; j++) s += rows[j][i]; pts.push(s / rows.length); }
      }
    } catch (e) { pts = [0, 0]; }
    if (!pts || pts.length < 2) pts = [0, 0];
    n.pts = pts;
    n.at = ts;
    n.done = n.t0 - CM + MAXK * CM <= ts - CM * 2;
    return pts;
  }
  function baseIdx(pts) { return Math.min(PRE, pts.length - 1); }
  function rx(n, ts) { var p = series(n, ts); return p[p.length - 1]; }
  function peak(n, ts) {
    var p = series(n, ts), best = 0;
    for (var i = baseIdx(p); i < p.length; i++) if (Math.abs(p[i]) > Math.abs(best)) best = p[i];
    return best;
  }
  function rxSpan(n, ts) {
    var m = clamp(Math.floor((ts - n.t0) / 60000), 0, 15);
    return m < 1 ? t('nw_rx_first') : t('nw_rx_min', { n: m });
  }

  /* ---------------- Прочитанное ---------------- */

  var LS = 'tu_news_read', RD = null;
  function rdLoad() {
    if (RD) return;
    try { RD = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { RD = null; }
    if (!RD || typeof RD.w !== 'number') RD = { w: now() - BUCKET, r: {}, b: '' };
    if (!RD.r || typeof RD.r !== 'object') RD.r = {};
  }
  function rdSave() {
    clearTimeout(rdSave.t);
    rdSave.t = setTimeout(function () {
      var lim = now() - HOUR, r = {};
      for (var k in RD.r) if (RD.r[k] > lim) r[k] = RD.r[k];
      RD.r = r;
      try { localStorage.setItem(LS, JSON.stringify(RD)); } catch (e) { void e; }
    }, 400);
  }
  function isRead(n, ts) { return n.t <= Math.max(RD.w, ts - UNREAD_WIN) || !!RD.r[n.k]; }
  function markRead(n) {
    if (!n || isRead(n, now())) return;
    RD.r[n.k] = n.t;
    rdSave();
    var c = LV.nodes[n.k];
    if (c) c.classList.add('read');
    updUnread(false);
  }
  function unreadCount(ts) { var c = 0; for (var i = 0; i < ST.items.length; i++) if (!isRead(ST.items[i], ts)) c++; return c; }
  function updUnread(bump) {
    var ts = now(), c = unreadCount(ts), b = el('nw-badge'), sub = el('nw-sub');
    if (!b) return;
    b.textContent = c > 99 ? '99+' : (c || '');
    b.classList.toggle('show', c > 0);
    if (bump && c > (b.__c || 0)) restart(b, 'bump');
    b.__c = c;
    el('nw-readall').disabled = !c;
    el('nw-sub-t').textContent = c ? c + ' ' + plural(c, 'nw_unread') : t('news_live');
    sub.classList.toggle('has', c > 0);
    /* Точки гаснут и без markRead: окно UNREAD_WIN со временем сдвигается. */
    for (var k in LV.nodes) { var e = LV.nodes[k]; if (!e.classList.contains('read') && isRead(e.__n, ts)) e.classList.add('read'); }
  }
  function readAll() {
    var i = 0, ts = now();
    LV.order.forEach(function (k) {
      var e = nodeOf(k), n = e && e.__n;
      if (!n || isRead(n, ts) || i > 14) return;
      setTimeout(function () { markRead(n); }, D(i++ * 55));
    });
    setTimeout(function () {
      var top = now() - UNREAD_WIN;
      for (var j = 0; j < ST.items.length; j++) if (ST.items[j].t > top) top = ST.items[j].t;
      RD.w = Math.max(RD.w, top);
      RD.r = {};
      rdSave();
      updUnread(false);
      toast(t('nw_all_read'), 'ok', { sub: t('nw_all_read_sub') });
    }, D(i * 55 + 80));
    FX.vibrate(8);
  }

  /* ---------------- Карточка ---------------- */

  function logoHtml(n) { return n.mkt ? '<span class="nw-mk">\u25C8</span>' : '<img src="' + esc(coinSrc(n.a)) + '" alt="" draggable="false">'; }
  function flagsHtml(n) {
    if (!n.a) return '';
    return (S.favs[n.a.id] ? '<span class="st" title="' + esc(t('nw_fav_on')) + '">' + STAR_S + '</span>' : '') +
      (S.positions[n.a.id] ? '<span title="' + esc(t('nw_in_pf')) + '">' + BAG_S + '</span>' : '');
  }
  function avsHtml() {
    return '<span class="nw-avs">' + MAJORS.map(assetById).filter(Boolean).map(function (a) { return '<img src="' + esc(coinSrc(a)) + '" alt="">'; }).join('') + '</span>';
  }
  function dirCls(n) { return n.dir > 0 ? 'up' : n.dir < 0 ? 'down' : 'flat'; }
  function cardEl(n, ts) {
    var e = document.createElement('article');
    e.className = 'nw-c ' + dirCls(n) + (n.ext ? ' ext' : '') + (isRead(n, ts) ? ' read' : '');
    e.tabIndex = 0;
    e.setAttribute('role', 'button');
    e.setAttribute('aria-expanded', 'false');
    e.setAttribute('data-k', n.k);
    e.innerHTML = '<div class="nw-c-row"><span class="nw-logo">' + logoHtml(n) +
      '<i class="nw-dir" aria-hidden="true">' + (n.dir > 0 ? ARW_UP : n.dir < 0 ? ARW_DN : DOT) + '</i><i class="nw-dot" aria-hidden="true"></i></span>' +
      '<div class="nw-c-main"><div class="nw-c-top"><b class="nw-name">' + esc(nameOf(n)) + '</b>' + (n.mkt ? '' : '<span class="nw-tk">' + esc(n.a.ticker) + '</span>') +
      '<span class="nw-fl">' + flagsHtml(n) + '</span><span class="nw-time mono"></span></div>' +
      '<p class="nw-title">' + esc(n.text) + '</p>' +
      '<div class="nw-meta">' + (n.ext ? '<span class="nw-xb">\u26A1 ' + esc(t('news_extreme')) + '</span>' : '') +
      '<span class="nw-cat">' + catIco(n.cat) + '<span>' + esc(newsCatName(n.cat)) + '</span></span>' +
      '<span class="nw-imp i' + n.imp + '" title="' + esc(t('nw_power') + ': ' + newsImpactName(n.imp)) + '"><b class="on"></b><b' + (n.imp >= 2 ? ' class="on"' : '') + '></b><b' + (n.imp >= 3 ? ' class="on"' : '') + '></b></span>' +
      (n.mkt ? avsHtml() : '') +
      '<span class="nw-rx mono"><svg viewBox="0 0 30 14" aria-hidden="true"><path pathLength="40"/><circle r="1.8"/></svg><em></em></span></div></div></div>' +
      '<div class="nw-more"></div>';
    e.__n = n;
    e.__time = q('.nw-time', e);
    e.__fl = q('.nw-fl', e);
    e.__rx = q('.nw-rx', e);
    e.__rxE = q('.nw-rx em', e);
    e.__rxP = q('.nw-rx path', e);
    e.__rxC = q('.nw-rx circle', e);
    e.__more = q('.nw-more', e);
    updCard(e, ts, true);
    return e;
  }
  function sparkMini(n, ts, path, dot) {
    var p = series(n, ts), k0 = Math.max(0, baseIdx(p) - 4), len = p.length - k0, m = Math.min(16, len), vals = [], mn = Infinity, mx = -Infinity, i;
    if (m < 2) { path.setAttribute('d', 'M0,7L28,7'); dot.setAttribute('cx', 28); dot.setAttribute('cy', 7); return; }
    for (i = 0; i < m; i++) { var v = p[k0 + Math.round(i / (m - 1) * (len - 1))]; vals.push(v); if (v < mn) mn = v; if (v > mx) mx = v; }
    var sp = (mx - mn) || 0.1, pts = [];
    for (i = 0; i < m; i++) pts.push([i / (m - 1) * 28, 12 - (vals[i] - mn) / sp * 10]);
    path.setAttribute('d', smooth(pts));
    dot.setAttribute('cx', 28);
    dot.setAttribute('cy', pts[m - 1][1].toFixed(1));
  }
  function updCard(e, ts, force) {
    var n = e.__n, tx = fmtNewsAge(n.t);
    if (e.__ts !== tx) { e.__time.textContent = tx; e.__ts = tx; }
    if (!force && n.done && e.__rxT) return;
    var r = rx(n, ts), s = sign(r), txt = rxText(r);
    if (e.__rxS !== s) { e.__rx.className = 'nw-rx mono ' + s; e.__rxS = s; }
    if (e.__rxT !== txt) {
      e.__rxE.textContent = txt;
      if (!force && e.__rxT) restart(e.__rx, 'tick');
      e.__rxT = txt;
    }
    e.__rx.title = t('nw_rx', { s: rxSpan(n, ts) });
    sparkMini(n, ts, e.__rxP, e.__rxC);
  }

  /* ---------------- Раскрытая новость ---------------- */

  function detailHtml(n) {
    var fav = n.a && S.favs[n.a.id];
    return '<div class="nw-x">' +
      '<div class="nw-x-chart"><svg aria-hidden="true"><defs><clipPath id="nwc-' + n.t + '"><rect class="nw-x-clip" x="-6" y="-10" width="0" height="140"/></clipPath></defs>' +
      '<line class="nw-x-zero"/><line class="nw-x-mark"/><g clip-path="url(#nwc-' + n.t + ')"><path class="nw-x-area"/><path class="nw-x-line"/></g><circle class="nw-x-ring" r="4"/><circle class="nw-x-dot" r="4"/></svg>' +
      '<span class="nw-x-tag">' + esc(t('nw_news_at', { t: hm(n.t) })) + '</span><span class="nw-x-y" data-k="y1"></span><span class="nw-x-y" data-k="y2"></span></div>' +
      '<div class="nw-x-stats"><div>' + esc(t('nw_reaction')) + '<b class="mono" data-k="rx"></b><i data-k="rxm"></i></div>' +
      '<div>' + esc(t('nw_peak')) + '<b class="mono" data-k="pk"></b><i>' + esc(t('nw_from_news')) + '</i></div>' +
      '<div>' + esc(t('nw_power')) + '<b>' + esc(newsImpactName(n.imp)) + '</b><i>' + esc(newsCatName(n.cat)) + '</i></div></div>' +
      (n.mkt ? '<div class="nw-x-coins" data-k="coins"></div>' : '') +
      '<div class="nw-x-hint">' + BULB + '<div><b>' + esc(t('nw_hint')) + '</b>' + esc(behave(n)) + '</div></div>' +
      '<div class="nw-x-act' + (n.mkt ? ' one' : '') + '"><button type="button" class="nw-x-btn gold" data-act="chart">' + CHART_I + esc(t(n.mkt ? 'nw_open_market' : 'nw_open_chart')) + '</button>' +
      (n.mkt ? '' : '<button type="button" class="nw-x-btn' + (fav ? ' on' : '') + '" data-act="fav" aria-pressed="' + (fav ? 'true' : 'false') + '">' + STAR_O + '<span>' + esc(t(fav ? 'nw_fav_on' : 'nw_fav_add')) + '</span></button>') +
      '</div></div>';
  }
  function drawDetail(e, reveal) {
    var box = e && q('.nw-x-chart', e);
    if (!box) return;
    var n = e.__n, ts = now(), p = series(n, ts), bi = baseIdx(p);
    var svg = q('svg', box), W = Math.max(200, box.clientWidth), H = 118, T = 18, B = 8, RP = 50;
    var last = p.length - 1, dom = Math.max(last, bi + 36), mn = 0, mx = 0, k;
    for (k = 0; k <= last; k++) { if (p[k] < mn) mn = p[k]; if (p[k] > mx) mx = p[k]; }
    var pv = (mx - mn) * 0.15 || 0.2, lo = mn - pv, hi = mx + pv;
    function X(i) { return i / dom * (W - RP); }
    function Y(v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); }
    var pts = [];
    for (k = 0; k <= last; k++) pts.push([X(k), Y(p[k])]);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var d = smooth(pts), y0 = Y(0), xe = pts[pts.length - 1][0], r = p[last];
    q('.nw-x-line', svg).setAttribute('d', d);
    q('.nw-x-area', svg).setAttribute('d', d + 'L' + xe.toFixed(1) + ',' + y0.toFixed(1) + 'L0,' + y0.toFixed(1) + 'Z');
    var z = q('.nw-x-zero', svg), mk = q('.nw-x-mark', svg), xm = X(bi);
    z.setAttribute('x1', 0); z.setAttribute('x2', W - RP + 6); z.setAttribute('y1', y0); z.setAttribute('y2', y0);
    mk.setAttribute('x1', xm); mk.setAttribute('x2', xm); mk.setAttribute('y1', T - 2); mk.setAttribute('y2', H);
    var tag = q('.nw-x-tag', box), tw = tag.offsetWidth / 2 + 2;
    tag.style.left = clamp(xm, tw, W - tw) + 'px';
    box.className = 'nw-x-chart ' + sign(r);
    var y1 = q('[data-k="y1"]', box), y2 = q('[data-k="y2"]', box);
    y1.style.top = Y(mx) + 'px'; y1.textContent = fmtPct(mx);
    y2.style.top = Y(mn) + 'px'; y2.textContent = fmtPct(mn);
    y2.hidden = Math.abs(Y(mn) - Y(mx)) < 16;
    var clip = q('.nw-x-clip', svg), dot = q('.nw-x-dot', svg), ring = q('.nw-x-ring', svg);
    function place(f) {
      var x = f * xe;
      clip.setAttribute('width', x + 8);
      [dot, ring].forEach(function (c) { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', yAt(pts, x).toFixed(1)); });
    }
    if (reveal) {
      if (e.__rvStop) e.__rvStop();
      place(0);
      e.__rvStop = tween(950, function (f) { place(easeOut(f)); }, function () { e.__rvStop = null; });
    } else if (!e.__rvStop) place(1);
    var qq = function (s) { return q('[data-k="' + s + '"]', e); }, pk = peak(n, ts);
    qq('rx').textContent = rxText(r); qq('rx').className = 'mono ' + sign(r);
    qq('rxm').textContent = rxSpan(n, ts);
    qq('pk').textContent = rxText(pk); qq('pk').className = 'mono ' + sign(pk);
    if (n.mkt && n.coins) qq('coins').innerHTML = n.coins.map(function (c) {
      return '<span><img src="' + esc(coinSrc(c.a)) + '" alt="">' + esc(c.a.ticker) + ' <b class="' + sign(c.v) + '">' + rxText(c.v) + '</b></span>';
    }).join('');
  }
  function toggle(k) {
    var prev = ST.open;
    if (prev) collapse(prev);
    ST.open = prev === k ? null : k;
    if (ST.open) expand(ST.open);
    FX.vibrate(6);
  }
  function expand(k) {
    var e = LV.nodes[k];
    if (!e) return;
    var m = e.__more;
    m.innerHTML = detailHtml(e.__n);
    e.classList.add('open');
    e.setAttribute('aria-expanded', 'true');
    markRead(e.__n);
    drawDetail(e, true);
    if (V3.reduced()) { m.style.height = 'auto'; return; }
    var h = m.scrollHeight;
    m.style.height = '0px';
    reflow(m);
    m.style.height = h + 'px';
    clearTimeout(m.__t);
    m.__t = setTimeout(function () { if (e.classList.contains('open')) { m.style.height = 'auto'; ensureVisible(e); } }, D(470));
  }
  function collapse(k) {
    var e = LV.nodes[k];
    if (!e) return;
    var m = e.__more;
    e.classList.remove('open');
    e.setAttribute('aria-expanded', 'false');
    if (e.__rvStop) { e.__rvStop(); e.__rvStop = null; }
    if (V3.reduced()) { m.style.height = '0px'; m.innerHTML = ''; return; }
    m.style.height = m.scrollHeight + 'px';
    reflow(m);
    m.style.height = '0px';
    clearTimeout(m.__t);
    m.__t = setTimeout(function () { if (!e.classList.contains('open')) m.innerHTML = ''; }, D(470));
  }
  function collapseNow(e) {
    e.classList.remove('open');
    e.setAttribute('aria-expanded', 'false');
    e.__more.style.height = '0px';
    e.__more.innerHTML = '';
  }
  function body() { return el('news-body'); }
  function toolsH() { var tl = el('nw-tools'); return tl ? tl.offsetHeight : 0; }
  function ensureVisible(e) {
    var pg = body(), pr = pg.getBoundingClientRect(), r = e.getBoundingClientRect();
    if (r.bottom <= pr.bottom - 8) return;
    pg.scrollBy({ top: Math.min(r.bottom - pr.bottom + 16, r.top - pr.top - toolsH() - 12), behavior: V3.reduced() ? 'auto' : 'smooth' });
  }

  /* ---------------- Лента: перестройка без пересоздания карточек ---------------- */

  var LV = { nodes: {}, hdrs: {}, order: [], empty: null, emptyKey: '', vis: {} };
  var IO = null;
  function ioInit() {
    if (IO || !('IntersectionObserver' in window)) return;
    IO = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        var e = x.target, n = e.__n;
        if (!n) return;
        if (x.isIntersecting) LV.vis[n.k] = 1; else delete LV.vis[n.k];
        clearTimeout(e.__rt);
        /* Точка гаснет, когда новость реально увидели: 75% карточки в кадре 1,2 с. */
        if (x.intersectionRatio >= 0.75 && !isRead(n, now())) e.__rt = setTimeout(function () { if (LV.vis[n.k] && active()) markRead(n); }, 1200);
      });
    }, { root: body(), threshold: [0, 0.75] });
  }
  function nodeOf(k) { return k.charAt(0) === 'h' ? LV.hdrs[k] : LV.nodes[k.slice(2)]; }
  function cardOf(n, ts) {
    var e = LV.nodes[n.k];
    if (!e) { e = LV.nodes[n.k] = cardEl(n, ts); if (IO) IO.observe(e); }
    return e;
  }
  function hdrOf(it) {
    var e = LV.hdrs[it.key];
    if (!e) {
      e = document.createElement('div');
      e.className = 'nw-sh ' + it.h;
      e.innerHTML = '<span>' + esc(t('nw_sec_' + it.h)) + '</span><em class="mono"></em>';
      LV.hdrs[it.key] = e;
    }
    var em = q('em', e);
    if (e.__c !== it.c) { em.textContent = it.c; if (e.__c != null) restart(em, 'bump'); e.__c = it.c; }
    return e;
  }
  function emptyEl() {
    var tt = t(ST.seg === 'mine' ? 'nv_empty_mine' : ST.seg === 'strong' ? 'nv_empty_strong' : 'nv_empty_all');
    var tx = t(ST.seg === 'mine' ? 'nv_empty_mine_sub' : ST.seg === 'strong' ? 'nv_empty_strong_sub' : 'nv_empty_all_sub');
    if (ST.cat !== 'all') { tt = t('nw_empty_cat', { c: newsCatName(ST.cat) }); tx = t('nw_empty_cat_sub'); }
    var key = tt + tx + (ST.seg !== 'all' || ST.cat !== 'all');
    if (!LV.empty) { LV.empty = document.createElement('div'); LV.empty.className = 'nw-empty'; }
    if (LV.emptyKey !== key) {
      LV.emptyKey = key;
      LV.empty.innerHTML = '<div class="nw-radar" aria-hidden="true"><i style="left:62%;top:28%"></i><i style="left:26%;top:60%;animation-delay:.9s"></i></div><b>' + esc(tt) + '</b><span>' + esc(tx) + '</span>' +
        (ST.seg !== 'all' || ST.cat !== 'all' ? '<button type="button" data-act="reset">' + esc(t('nv_show_all')) + '</button>' : '');
    }
    return LV.empty;
  }
  function buildSeq(ts) {
    var L = listFor(), cnt = { now: 0, recent: 0, earlier: 0 }, seq = [], last = '', i;
    for (i = 0; i < L.length; i++) cnt[secOf(L[i], ts)]++;
    var shown = L.slice(0, ST.cap);
    for (i = 0; i < shown.length; i++) {
      var n = shown[i], s = secOf(n, ts);
      if (s !== last) { seq.push({ key: 'h:' + s, h: s, c: cnt[s] }); last = s; }
      seq.push({ key: 'n:' + n.k, n: n });
    }
    seq.total = L.length;
    seq.shown = shown.length;
    return seq;
  }
  function updEnd(s) {
    var end = el('nw-end');
    if (!end) return;
    var more = s.total > s.shown, key = s.shown + '/' + s.total + LANG;
    if (end.__k === key) return;
    end.__k = key;
    end.innerHTML = more
      ? '<button type="button" class="nw-more-btn" data-act="more">' + esc(t('nw_more')) + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button><span>' + esc(t('nw_shown', { n: s.shown, m: s.total })) + '</span>'
      : (s.total ? '<span>' + esc(t('nw_end')) + '</span>' : '');
  }
  function ghost(e, r, br) {
    var box = el('news-feed'), g = e.cloneNode(true);
    g.classList.add('ghost');
    g.classList.remove('arrive', 'flash', 'shake');
    g.style.top = (r.top - br.top) + 'px';
    g.style.width = r.width + 'px';
    box.insertBefore(g, box.firstChild);
    var an = anim(g, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
    if (an) an.onfinish = function () { g.remove(); }; else g.remove();
  }
  /* how: instant — без анимации; flip — оставшиеся переезжают, новые проявляются;
     anchor — список меняется выше экрана, а то, что читают, остаётся на месте. */
  function render(how, arrived) {
    var box = el('news-feed'), pg = body();
    if (!box || !pg) return;
    var ts = now(), s = buildSeq(ts), pr = pg.getBoundingClientRect(), vis = how === 'flip' && !V3.reduced() && !!box.animate && pr.height > 0;
    var first = {}, br = null, anc = null, ancTop = 0, i;
    if (how === 'anchor') {
      var lim = pr.top + toolsH();
      for (i = 0; i < LV.order.length; i++) {
        var e0 = nodeOf(LV.order[i]);
        if (!e0 || e0.parentNode !== box) continue;
        var r0 = e0.getBoundingClientRect();
        if (r0.bottom > lim) { anc = e0; ancTop = r0.top; break; }
      }
    }
    if (vis) {
      br = box.getBoundingClientRect();
      LV.order.forEach(function (k) { var e = nodeOf(k); if (e && e.parentNode === box) first[k] = e.getBoundingClientRect(); });
    }
    var keep = {};
    s.forEach(function (it) { keep[it.key] = 1; });
    LV.order.forEach(function (k) {
      if (keep[k]) return;
      var e = nodeOf(k);
      if (!e || e.parentNode !== box) return;
      if (k.slice(2) === ST.open) { collapseNow(e); ST.open = null; }
      box.removeChild(e);
      var f = first[k];
      if (vis && f && f.bottom > pr.top && f.top < pr.bottom) ghost(e, f, br);
    });
    Object.keys(LV.nodes).forEach(function (k) {
      if (!keep['n:' + k]) { if (IO) IO.unobserve(LV.nodes[k]); delete LV.vis[k]; delete LV.nodes[k]; }
    });
    s.forEach(function (it) { box.appendChild(it.n ? cardOf(it.n, ts) : hdrOf(it)); });
    if (!s.length) { var em = emptyEl(); if (em.parentNode !== box) box.appendChild(em); }
    else if (LV.empty && LV.empty.parentNode) box.removeChild(LV.empty);
    LV.order = s.map(function (it) { return it.key; });
    updEnd(s);
    if (anc && anc.parentNode === box) pg.scrollTop += anc.getBoundingClientRect().top - ancTop;
    if (!vis) return;
    var ni = 0;
    LV.order.forEach(function (k) {
      var e = nodeOf(k), f = first[k], l = e.getBoundingClientRect(), on = l.bottom > pr.top - 40 && l.top < pr.bottom + 40, cls = arrived && arrived[k.slice(2)];
      if (cls) { restart(e, cls); setTimeout(function () { e.classList.remove(cls); }, D(1700)); return; }
      if (f) {
        var dy = f.top - l.top;
        if (Math.abs(dy) < 1 || !on) return;
        anim(e, [{ transform: 'translateY(' + dy.toFixed(1) + 'px)' }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else if (on) {
        anim(e, [{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: Math.min(ni++, 8) * 40, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      }
    });
  }
  function orderChanged(ts) {
    var s = buildSeq(ts);
    if (s.length !== LV.order.length) return true;
    for (var i = 0; i < s.length; i++) if (s[i].key !== LV.order[i]) return true;
    return false;
  }
  function rowsIn(delay) {
    var i = 0, pg = body(), pr = pg.getBoundingClientRect();
    LV.order.forEach(function (k) {
      var e = nodeOf(k);
      if (!e || e.getBoundingClientRect().top > pr.bottom + 60) return;
      var d = delay + Math.min(i, 10) * 45;
      i++;
      anim(e, [{ opacity: 0, transform: 'translateY(22px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: d, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      if (e.__rxP) anim(e.__rxP, [{ strokeDashoffset: 40 }, { strokeDashoffset: 0 }], { duration: 800, delay: d + 200, easing: 'ease-out', fill: 'backwards' });
    });
  }

  /* ---------------- Пульс рынка ---------------- */

  function buildTl() {
    var tl = el('nw-tl'), h = '';
    if (!tl || tl.children.length) return;
    for (var i = 0; i < TLN; i++) h += '<button type="button" class="nw-tc" data-col="' + i + '" style="--i:' + i + '"><i class="u"></i><i class="d"></i><i class="z"></i></button>';
    tl.innerHTML = h;
  }
  /* Столбики выровнены по 2-минутным бакетам движка: состав столбика
     меняется, только когда в его бакет приходят события. */
  function colOf(n, ts) { return TLN - 1 - (Math.floor(ts / BUCKET) - Math.floor(n.t / BUCKET)); }
  function updPulse(animate, grow) {
    if (!el('nw-tl')) return;
    var ts = now(), L = listFor(), up = 0, dn = 0, strong = 0, ext = 0, cols = [], maxc = 1, i;
    for (i = 0; i < TLN; i++) cols.push({ u: 0, d: 0, z: 0, hu: 0, hd: 0 });
    L.forEach(function (n) {
      if (n.dir > 0) up++; else if (n.dir < 0) dn++;
      if (n.imp >= 2) strong++;
      if (n.ext) ext++;
      var c = cols[colOf(n, ts)];
      if (!c) return;
      /* Свечение — только у взрывов и рыночных событий: сильных в игре
         половина ленты, и подсветка у каждого столбика ничего бы не значила. */
      var hot = n.ext || n.mkt;
      if (n.dir > 0) { c.u++; if (hot) c.hu = 1; } else if (n.dir < 0) { c.d++; if (hot) c.hd = 1; } else c.z++;
    });
    cols.forEach(function (c) { maxc = Math.max(maxc, c.u, c.d); });
    var ms = animate ? (typeof animate === 'number' ? animate : 600) : 0;
    V3.countTo(el('nw-tg-u'), up, int, ms);
    V3.countTo(el('nw-tg-d'), dn, int, ms);
    V3.countTo(el('news-feed-count'), L.length, int, ms);
    V3.countTo(el('nw-ps-s'), strong, int, ms);
    V3.countTo(el('nw-ps-x'), ext, int, ms);
    var tot = up + dn, pct = tot ? up / tot : 0.5, k = el('nw-tg-k');
    el('nw-tg-bar').style.width = (pct * 100).toFixed(1) + '%';
    if (k.__p !== undefined && Math.abs(k.__p - pct) > 0.005 && animate) restart(k, 'nudge');
    k.__p = pct;
    k.style.left = (pct * 100).toFixed(1) + '%';
    var m = el('nw-tg-m');
    m.textContent = t(!tot ? 'nw_mood_none' : pct >= 0.6 ? 'nv_mood_up' : pct <= 0.4 ? 'nv_mood_down' : 'nv_mood_flat');
    m.className = 'nw-tug-m' + (tot && pct >= 0.6 ? ' up' : tot && pct <= 0.4 ? ' down' : '');
    el('nw-pl-sub').textContent = t('nw_pulse_sub') + (ST.seg !== 'all' || ST.cat !== 'all' ? ' \u00B7 ' + t('nw_by_filter') : '');
    qa('.nw-tc', el('nw-tl')).forEach(function (b, j) {
      var c = cols[j], n = c.u + c.d + c.z, u = q('.u', b), d = q('.d', b);
      u.style.height = (c.u / maxc * 28).toFixed(1) + 'px';
      d.style.height = (c.d / maxc * 28).toFixed(1) + 'px';
      u.classList.toggle('hot', !!c.hu);
      d.classList.toggle('hot', !!c.hd);
      q('.z', b).classList.toggle('on', c.z > 0);
      b.disabled = !n;
      b.classList.toggle('now', j === TLN - 1 && n > 0);
      var key = c.u + ':' + c.d + ':' + c.z;
      if (grow && b.__k !== undefined && b.__k !== key && j === TLN - 1) restart(b, 'grow');
      b.__k = key;
      b.setAttribute('aria-label', n ? t('nw_col', { a: (TLN - 1 - j) * 2, b: (TLN - j) * 2, n: n }) : t('nw_col_none'));
    });
  }
  function colTap(i, btn) {
    var ts = now(), hit = listFor().filter(function (n) { return colOf(n, ts) === i; }), tl = el('nw-tl');
    if (!hit.length) return;
    qa('.nw-tl-tip', tl).forEach(function (x) { x.remove(); });
    qa('.nw-tc.sel', tl).forEach(function (c) { c.classList.remove('sel'); });
    btn.classList.add('sel');
    var u = 0, d = 0;
    hit.forEach(function (n) { if (n.dir > 0) u++; else if (n.dir < 0) d++; });
    var tip = document.createElement('span');
    tip.className = 'nw-tl-tip';
    tip.textContent = hm(Math.floor(hit[0].t / BUCKET) * BUCKET) + ' \u00B7 \u25B2' + u + ' \u25BC' + d;
    tip.style.left = clamp(btn.offsetLeft + btn.offsetWidth / 2, 50, tl.clientWidth - 50) + 'px';
    tl.appendChild(tip);
    clearTimeout(tl.__t);
    tl.__t = setTimeout(function () { tip.remove(); btn.classList.remove('sel'); }, 2400 * K());
    openItem(hit[0].k, false);
    FX.vibrate(6);
  }

  /* ---------------- Главное за час ---------------- */

  var HERO = { ids: '', idx: 0, at: 0 };
  function topItems(ts) {
    function pre(n) { return (n.ext ? 1000 : n.mkt ? 40 : 0) + (HOUR - (ts - n.t)) / HOUR * 40; }
    function score(n) { return n.ext ? 2000 - (ts - n.t) / 60000 : n.imp * 10 + (n.mkt ? 8 : 0) + Math.min(20, Math.abs(rx(n, ts)) * 3) + (HOUR - (ts - n.t)) / HOUR * 40; }
    /* Кандидатов заранее режем по силе и свежести: реакцию считаем
       для десятка событий, а не для сотен за час. */
    var c = ST.items.filter(function (n) { return n.ext || n.mkt || n.imp >= 3; });
    c.sort(function (x, y) { return pre(y) - pre(x); });
    return c.slice(0, 12).sort(function (x, y) { return score(y) - score(x); }).slice(0, 3);
  }
  function slideHtml(n) {
    return '<button type="button" class="nw-hs ' + dirCls(n) + (n.ext ? ' ext' : '') + '" data-open="' + esc(n.k) + '">' +
      '<span class="nw-hs-bg" aria-hidden="true">' + catIco(n.cat) + '</span>' +
      '<span class="nw-hs-top"><span class="nw-hs-k">' + (n.ext ? '\u26A1 ' + esc(t('nw_boom')) : n.mkt ? '\u25C8 ' + esc(t('nw_market')) : esc(t('nw_ev', { x: newsImpactName(n.imp) }))) + '</span><span class="nw-hs-time mono" data-k="time"></span></span>' +
      '<span class="nw-hs-coin">' + (n.mkt ? '<span class="nw-mk">\u25C8</span><b>' + esc(t('nw_market')) + '</b><i>' + esc(newsCatName(n.cat)) + '</i>'
        : '<img src="' + esc(coinSrc(n.a)) + '" alt=""><b>' + esc(assetName(n.a)) + '</b><i>' + esc(n.a.ticker) + ' \u00B7 ' + esc(newsCatName(n.cat)) + '</i>') + '</span>' +
      '<span class="nw-hs-title">' + esc(n.text) + '</span>' +
      '<span class="nw-hs-bot"><svg viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true"><path class="a"/><path class="l"/><line class="m"/></svg><span class="nw-hs-r"><b class="mono" data-k="rx"></b><i data-k="rxm"></i></span></span></button>';
  }
  function heroSpark(n, ts, svg) {
    var p = series(n, ts), m = Math.min(40, p.length), vals = [], mn = Infinity, mx = -Infinity, i;
    for (i = 0; i < m; i++) { var v = p[Math.round(i / Math.max(1, m - 1) * (p.length - 1))]; vals.push(v); if (v < mn) mn = v; if (v > mx) mx = v; }
    var sp = (mx - mn) || 0.1, pts = [];
    for (i = 0; i < m; i++) pts.push([i / Math.max(1, m - 1) * 200, 40 - (vals[i] - mn) / sp * 34]);
    var d = smooth(pts), xm = baseIdx(p) / Math.max(1, p.length - 1) * 200;
    q('.l', svg).setAttribute('d', d);
    q('.a', svg).setAttribute('d', d + 'L200,44L0,44Z');
    var l = q('.m', svg);
    l.setAttribute('x1', xm); l.setAttribute('x2', xm); l.setAttribute('y1', 0); l.setAttribute('y2', 44);
  }
  function updHero(force) {
    var tr = el('nw-htrack'), ts = now();
    if (!tr) return;
    if (force || ts - HERO.at > 20000) {
      HERO.at = ts;
      var top = topItems(ts), ids = top.map(function (n) { return n.k; }).join();
      if (force || ids !== HERO.ids) {
        var had = !!HERO.ids;
        HERO.ids = ids;
        tr.innerHTML = top.map(slideHtml).join('');
        el('nw-hdots').innerHTML = top.length > 1 ? top.map(function (n, i) { return '<button type="button" class="nw-hdot' + (i === 0 ? ' on' : '') + '" data-hd="' + i + '" aria-label="' + (i + 1) + '"><i></i></button>'; }).join('') : '';
        el('nw-hero').hidden = !top.length;
        HERO.idx = 0;
        tr.scrollLeft = 0;
        if (had && !force) restart(tr, 'swap');
      }
    }
    qa('.nw-hs', tr).forEach(function (s) {
      var n = ST.by[s.getAttribute('data-open')];
      if (!n) return;
      var age = fmtNewsAge(n.t);
      q('[data-k="time"]', s).textContent = age === t('news_now') ? age : t('nw_ago', { t: age });
      var r = rx(n, ts), b = q('[data-k="rx"]', s);
      b.textContent = rxText(r);
      b.className = 'mono ' + sign(r);
      q('[data-k="rxm"]', s).textContent = t('nw_rx', { s: rxSpan(n, ts) });
      if (force || !n.done || !s.__drawn) { heroSpark(n, ts, q('.nw-hs-bot svg', s)); s.__drawn = true; }
    });
  }
  function heroGo(i) {
    var tr = el('nw-htrack'), sl = qa('.nw-hs', tr);
    if (!sl.length) return;
    i = (i + sl.length) % sl.length;
    tr.scrollTo({ left: sl[i].offsetLeft - 12, behavior: V3.reduced() ? 'auto' : 'smooth' });
    setDot(i);
  }
  function setDot(i) {
    if (HERO.idx === i && q('.nw-hdot.on')) return;
    HERO.idx = i;
    qa('.nw-hdot').forEach(function (d, j) { d.classList.toggle('on', j === i); });
  }

  /* ---------------- Фильтры ---------------- */

  function segLabel(s) { return t(s === 'mine' ? 'nf_mine' : s === 'strong' ? 'nf_strong' : 'nf_all'); }
  function buildSeg() {
    qa('#news-filter button').forEach(function (b) {
      var s = b.getAttribute('data-nf'), on = s === ST.seg;
      if (!q('em', b)) b.innerHTML = '<span></span><em class="mono">0</em>';
      q('span', b).textContent = segLabel(s);
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  function updSeg(bump) {
    ['all', 'mine', 'strong'].forEach(function (s) {
      var n = 0;
      for (var i = 0; i < ST.items.length; i++) if (segOk(ST.items[i], s)) n++;
      var e = q('#news-filter [data-nf="' + s + '"] em');
      if (e && e.textContent !== String(n)) { e.textContent = n; if (bump) restart(e, 'bump'); }
    });
  }
  function chipsData() {
    var L = ST.items.filter(function (n) { return segOk(n, ST.seg); }), c = {};
    L.forEach(function (n) { c[n.cat] = (c[n.cat] || 0) + 1; });
    if (ST.cat !== 'all' && !c[ST.cat]) c[ST.cat] = 0;
    var keys = Object.keys(c).sort(function (x, y) { return c[y] - c[x] || newsCatName(x).localeCompare(newsCatName(y)); });
    return [{ k: 'all', n: L.length }].concat(keys.map(function (k) { return { k: k, n: c[k] }; }));
  }
  function moveCind(instant) {
    var ci = el('nw-cind'), on = q('.nw-chip.on', el('nw-chips'));
    if (!ci || !on || !on.offsetWidth) return;
    if (instant) ci.style.transition = 'none';
    ci.style.width = on.offsetWidth + 'px';
    ci.style.transform = 'translateX(' + on.offsetLeft + 'px)';
    if (instant) { reflow(ci); ci.style.transition = ''; }
  }
  function buildChips(animate) {
    var box = el('nw-chips'), data = chipsData();
    qa('.nw-chip', box).forEach(function (c) { c.remove(); });
    data.forEach(function (c, i) {
      var b = document.createElement('button'), on = c.k === ST.cat;
      b.type = 'button';
      b.className = 'nw-chip' + (on ? ' on' : '') + (animate ? ' in' : '');
      b.setAttribute('data-chip', c.k);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.style.setProperty('--i', i);
      b.innerHTML = (c.k === 'all' ? GRID : catIco(c.k)) + '<span>' + esc(c.k === 'all' ? t('nw_all_topics') : newsCatName(c.k)) + '</span><em class="mono">' + c.n + '</em>';
      box.appendChild(b);
    });
    box.__keys = data.map(function (c) { return c.k; }).join();
    moveCind(true);
    var on = q('.nw-chip.on', box);
    if (on) box.scrollLeft = Math.max(0, on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2);
  }
  function updChips() {
    var box = el('nw-chips'), data = chipsData();
    if (data.map(function (c) { return c.k; }).join() !== box.__keys) {
      var sl = box.scrollLeft;
      buildChips(false);
      box.scrollLeft = sl;
      return;
    }
    data.forEach(function (c) {
      var em = q('[data-chip="' + c.k + '"] em', box);
      if (em && em.textContent !== String(c.n)) { em.textContent = c.n; restart(em, 'bump'); }
    });
  }
  /* Если читали глубоко в ленте, держим её начало прямо под панелью фильтров. */
  function keepTools() {
    var pg = body(), target = el('news-feed').offsetTop - toolsH() - 6;
    if (pg.scrollTop > target) pg.scrollTop = Math.max(0, target);
  }
  function applyFilter() {
    ST.cap = CAP0;
    keepTools();
    render('flip');
    updPulse(true);
    FX.vibrate(6);
  }
  function setSeg(s) {
    if (ST.seg === s) return;
    ST.seg = s;
    buildSeg();
    buildChips(true);
    applyFilter();
  }
  function setChip(k, btn) {
    if (ST.cat === k) return;
    ST.cat = k;
    var box = el('nw-chips');
    qa('.nw-chip', box).forEach(function (c) { var on = c === btn; c.classList.toggle('on', on); c.setAttribute('aria-selected', on ? 'true' : 'false'); });
    moveCind(false);
    box.scrollTo({ left: btn.offsetLeft - (box.clientWidth - btn.offsetWidth) / 2, behavior: V3.reduced() ? 'auto' : 'smooth' });
    applyFilter();
  }
  function resetFilters() {
    ST.seg = 'all';
    ST.cat = 'all';
    buildSeg();
    buildChips(true);
    applyFilter();
  }
  function openItem(k, doExpand) {
    var n = ST.by[k];
    if (!n) return;
    if (!passes(n)) {
      ST.seg = 'all';
      ST.cat = 'all';
      buildSeg();
      buildChips(false);
      updPulse(false);
    }
    var idx = listFor().indexOf(n);
    if (idx >= ST.cap) ST.cap = idx + 10;
    render('instant');
    var e = LV.nodes[k], pg = body();
    if (!e) return;
    var pr = pg.getBoundingClientRect(), r = e.getBoundingClientRect();
    /* Пока идёт плавная прокрутка, тик не трогает ленту: подстройка
       scrollTop в режиме anchor оборвала бы прокрутку на полпути. */
    ST.hold = Date.now() + D(900);
    pg.scrollTo({ top: Math.max(0, pg.scrollTop + r.top - pr.top - toolsH() - 14), behavior: V3.reduced() ? 'auto' : 'smooth' });
    setTimeout(function () {
      restart(e, 'flash');
      setTimeout(function () { e.classList.remove('flash'); }, D(1500));
      markRead(n);
      if (doExpand && ST.open !== k) toggle(k);
    }, D(450));
  }

  /* ---------------- Новые события ---------------- */

  var NEWQ = [];
  function showNewPill() {
    var p = el('nw-newp');
    el('nw-newp-wrap').style.top = (toolsH() - 4) + 'px';
    el('nw-newp-avs').innerHTML = NEWQ.filter(function (n) { return n.a; }).slice(0, 3).map(function (n) { return '<img src="' + esc(coinSrc(n.a)) + '" alt="">'; }).join('');
    el('nw-newp-t').textContent = NEWQ.length + ' ' + plural(NEWQ.length, 'nw_new');
    if (p.classList.contains('show')) restart(p, 'bump'); else p.classList.add('show');
  }
  function hideNewPill() { NEWQ = []; var p = el('nw-newp'); if (p) p.classList.remove('show'); }
  function edge(tone) { var e = el('nw-edge'); e.className = 'nw-edge'; reflow(e); e.className = 'nw-edge ' + tone; }
  function breaking(n) {
    var b = el('nw-brk'), up = n.dir > 0, top = q('#scr-news .topbar');
    b.className = 'nw-brk' + (up ? ' up' : '');
    b.innerHTML = '<span class="nw-brk-k">\u26A1 ' + esc(t('nw_urgent')) + '</span>' + logoHtml(n) + '<span class="nw-brk-t"><b>' + esc(nameOf(n)) + (n.a ? ' \u00B7 ' + esc(n.a.ticker) : '') + '</b>' + esc(n.text) + '</span><i class="nw-brk-life"></i>';
    b.style.top = (top ? top.offsetHeight + 6 : 60) + 'px';
    b.__k = n.k;
    reflow(b);
    b.classList.add('on');
    edge(up ? 'up' : 'down');
    restart(top, 'nw-jolt');
    FX.vibrate([12, 40, 12]);
    RD.b = n.k;
    rdSave();
    clearTimeout(b.__t);
    b.__t = setTimeout(hideBrk, 5500 * K());
  }
  function hideBrk() { var b = el('nw-brk'); if (b) b.classList.remove('on'); }
  function arrive(list) {
    var pg = body(), atTop = pg.scrollTop < 60, vis = list.filter(passes), map = {};
    list.forEach(function (n) { map[n.k] = n.ext ? 'shake' : 'arrive'; });
    if (atTop) render('flip', map);
    else {
      render('anchor');
      if (vis.length) { NEWQ = vis.concat(NEWQ).slice(0, 99); showNewPill(); }
    }
    updSeg(true);
    updChips();
    updPulse(true, true);
    if (list.some(function (n) { return n.ext || n.mkt || n.imp >= 3; })) { HERO.at = 0; Snd.play('news_strong'); }
    updHero(false);
    updUnread(true);
    list.forEach(function (n) { if (n.ext) breaking(n); });
  }

  /* ---------------- Жизненный цикл ---------------- */

  function setItems(list) {
    var by = {};
    list.forEach(function (n) { by[n.k] = n; });
    ST.items = list;
    ST.by = by;
  }
  function active() { return typeof currentScreen !== 'undefined' && currentScreen === 'scr-news' && !document.hidden; }
  var TK = 0;
  function tick() {
    if (!active() || !ST.built || Date.now() < (ST.hold || 0)) return 0;
    TK++;
    var ts = now(), list = feedNow(ts), fresh = [];
    for (var i = 0; i < list.length; i++) if (!ST.by[list[i].k]) fresh.push(list[i]);
    var dropped = list.length - fresh.length !== ST.items.length;
    setItems(list);
    if (fresh.length) arrive(fresh);
    else if (dropped || (TK % 5 === 0 && orderChanged(ts))) {
      render(body().scrollTop > 60 ? 'anchor' : 'flip');
      updSeg(false);
      updChips();
    }
    for (var k in LV.nodes) {
      var e = LV.nodes[k];
      if (LV.vis[k] || e.__ts !== fmtNewsAge(e.__n.t)) updCard(e, ts, false);
    }
    if (ST.open && LV.nodes[ST.open]) drawDetail(LV.nodes[ST.open], false);
    updHero(false);
    if (!fresh.length) updPulse(false);
    if (TK % 10 === 0) updUnread(false);
    return fresh.length;
  }
  function whenVisible(fn, tries) {
    var s = el('scr-news');
    if ((s && s.offsetWidth && !s.classList.contains('hidden')) || (tries || 0) > 40) { fn(); return; }
    setTimeout(function () { whenVisible(fn, (tries || 0) + 1); }, 50);
  }
  function intro() {
    var s = el('nw-page');
    s.classList.remove('go'); reflow(s); s.classList.add('go');
    ['nw-tg-u', 'nw-tg-d', 'news-feed-count', 'nw-ps-s', 'nw-ps-x'].forEach(function (id) { var e = el(id); if (e.__v3stop) e.__v3stop(); e.__v3v = 0; e.textContent = '0'; });
    var bar = el('nw-tg-bar'), k = el('nw-tg-k'), tl = el('nw-tl');
    bar.style.transition = k.style.transition = 'none';
    bar.style.width = '50%';
    k.style.left = '50%';
    qa('.u, .d', tl).forEach(function (x) { x.style.transition = 'none'; x.style.height = '0px'; });
    reflow(tl);
    bar.style.transition = k.style.transition = '';
    qa('.u, .d', tl).forEach(function (x) { x.style.transition = ''; });
    tl.style.setProperty('--st', '18ms');
    setTimeout(function () { updPulse(1000); }, D(260));
    setTimeout(function () { tl.style.setProperty('--st', '0ms'); }, D(1700));
    restart(el('nw-htrack'), 'swap');
    qa('.nw-hdot.on').forEach(function (d) { d.classList.remove('on'); reflow(d); d.classList.add('on'); });
    rowsIn(280);
  }
  /* Полная сборка при открытии экрана: свежие тексты (язык), фильтры сохраняются. */
  function build() {
    rdLoad();
    ioInit();
    buildTl();
    var box = el('news-feed');
    if (ST.lang !== LANG) {
      ST.lang = LANG;
      LV.hdrs = {};
      LV.emptyKey = '';
    }
    for (var k in LV.nodes) { if (IO) IO.unobserve(LV.nodes[k]); }
    LV.nodes = {}; LV.order = []; LV.vis = {}; ST.open = null;
    box.innerHTML = '';
    var endEl = el('nw-end'); if (endEl) endEl.__k = '';
    ST.cap = CAP0;
    hideNewPill();
    hideBrk();
    setItems(feedNow(now()));
    ST.built = true;
    buildSeg();
    body().scrollTop = 0;
    render('instant');
    updSeg(false);
    updUnread(false);
    updHero(true);
    updPulse(false);
    whenVisible(function () {
      buildChips(false);
      render('instant');
      intro();
      /* Взрыв цены, который игрок ещё не видел, — баннером при входе. */
      var ts = now(), ex = ST.items.filter(function (n) { return n.ext && ts - n.t < 3 * 60000 && RD.b !== n.k; })[0];
      if (ex) setTimeout(function () { if (active()) breaking(ex); }, D(900));
    });
    if (!tick.__iv) tick.__iv = setInterval(tick, 1000);
  }

  function toggleFav(n, btn) {
    var id = n.a.id, on = !S.favs[id];
    if (on) S.favs[id] = true; else delete S.favs[id];
    Snd.play(on ? 'fav_add' : 'fav_remove');
    saveState(true);
    if (typeof marketFavDirty !== 'undefined') marketFavDirty = true;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    q('span', btn).textContent = t(on ? 'nw_fav_on' : 'nw_fav_add');
    if (on) restart(btn, 'pop');
    for (var k in LV.nodes) { var e = LV.nodes[k]; if (e.__n.a === n.a) e.__fl.innerHTML = flagsHtml(e.__n); }
    updSeg(true);
    updChips();
    if (ST.seg === 'mine') { render('flip'); updPulse(true); }
    toast(t(on ? 'nw_fav_added' : 'nw_fav_removed'), on ? 'gold' : 'info', { img: coinSrc(n.a), sub: on ? t('nw_fav_sub', { n: assetName(n.a) }) : assetName(n.a) });
    FX.vibrate(10);
  }

  /* ---------------- Потяни, чтобы обновить ---------------- */

  /* Лента движка и так догоняется каждую секунду: на время спиннера тик
     придержан, и всё пришедшее за это время въезжает разом, с тостом-итогом. */
  function ptrBind(pg) {
    var page = el('nw-page'), box = document.createElement('div');
    box.className = 'nw-ptr';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<i class="nw-ptr-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-3.9M4 4v4h4M4 13a8 8 0 0 0 14.9 3.9M20 20v-4h-4"/></svg></i><span></span>';
    pg.insertBefore(box, pg.firstChild);
    var txt = q('span', box), ico = q('.nw-ptr-ico', box), y0 = null, pull = 0, on = false, busy = false, suppress = false, TH = 40;
    function move(y) {
      var dy = y - y0;
      if (!on) { if (dy > 8 && pg.scrollTop <= 0) on = true; else { if (dy < -4) y0 = null; return false; } }
      pull = Math.max(0, dy);
      var d = Math.min(110, pull * 0.5);
      page.classList.add('pulling');
      page.style.transform = 'translateY(' + d + 'px)';
      box.style.opacity = Math.min(1, d / 36);
      ico.style.transform = 'rotate(' + (pull * 2) + 'deg) scale(' + Math.min(1, 0.5 + d / 80) + ')';
      txt.textContent = t(d >= TH ? 'nw_ptr_release' : 'nw_ptr_pull');
      return true;
    }
    function reset() { page.style.transform = ''; box.style.opacity = 0; ico.style.transform = ''; }
    function end() {
      var was = on;
      on = false;
      y0 = null;
      if (!was) return;
      page.classList.remove('pulling');
      suppress = true;
      setTimeout(function () { suppress = false; }, 80);
      if (Math.min(110, pull * 0.5) >= TH) refresh(); else reset();
      pull = 0;
    }
    function refresh() {
      busy = true;
      ST.hold = Date.now() + 5000;
      page.style.transform = 'translateY(58px)';
      box.style.opacity = 1;
      ico.style.transform = '';
      box.classList.add('spin');
      txt.textContent = t('nw_ptr_busy');
      FX.vibrate(8);
      setTimeout(function () {
        box.classList.remove('spin');
        reset();
        busy = false;
        setTimeout(function () {
          ST.hold = 0;
          if (!active()) return;
          var c = tick();
          toast(t('nw_refreshed'), 'ok', { sub: c ? c + ' ' + plural(c, 'nw_fresh') : t('nw_no_fresh') });
        }, D(250));
      }, 1100);
    }
    function blocked(x) { return !x.closest || x.closest('.nw-chips, .nw-htrack, .nw-tl, .nw-x'); }
    pg.addEventListener('touchstart', function (e) { if (busy || pg.scrollTop > 0 || blocked(e.target)) return; y0 = e.touches[0].clientY; }, { passive: true });
    pg.addEventListener('touchmove', function (e) { if (y0 != null && move(e.touches[0].clientY)) e.preventDefault(); }, { passive: false });
    pg.addEventListener('touchend', end);
    pg.addEventListener('touchcancel', end);
    pg.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button || busy || pg.scrollTop > 0 || blocked(e.target)) return;
      y0 = e.clientY;
    });
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' && y0 != null) move(e.clientY); });
    window.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') end(); });
    pg.addEventListener('click', function (e) { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  function onClick(e) {
    var tg = e.target.closest('[data-act], [data-nf], [data-chip], [data-col], [data-open], [data-hd], .nw-c');
    if (!tg || !el('scr-news').contains(tg)) return;
    if (tg.hasAttribute('data-nf')) { setSeg(tg.getAttribute('data-nf')); return; }
    if (tg.hasAttribute('data-chip')) { setChip(tg.getAttribute('data-chip'), tg); return; }
    if (tg.hasAttribute('data-col')) { colTap(+tg.getAttribute('data-col'), tg); return; }
    if (tg.hasAttribute('data-open')) { openItem(tg.getAttribute('data-open'), true); return; }
    if (tg.hasAttribute('data-hd')) { heroGo(+tg.getAttribute('data-hd')); return; }
    if (tg.classList.contains('nw-c')) { if (!e.target.closest('.nw-x')) toggle(tg.getAttribute('data-k')); return; }
    var act = tg.getAttribute('data-act'), card = tg.closest('.nw-c'), n = card && card.__n;
    if (act === 'readall') readAll();
    else if (act === 'newp') { body().scrollTo({ top: 0, behavior: V3.reduced() ? 'auto' : 'smooth' }); hideNewPill(); }
    else if (act === 'brk') { hideBrk(); if (tg.__k) openItem(tg.__k, true); }
    else if (act === 'reset') resetFilters();
    else if (act === 'more') { ST.cap += CAP0; render('flip'); FX.vibrate(6); }
    else if (act === 'chart' && n) {
      FX.vibrate(8);
      if (n.a) openTrade(n.a.id);
      else { showScreen('app-main', 'left'); setTab('market'); }
    }
    else if (act === 'fav' && n && n.a) toggleFav(n, tg);
  }

  function bind() {
    var scr = el('scr-news');
    if (!scr || scr.__nwBound) return;
    scr.__nwBound = true;
    el('news-back').onclick = closeNewsFeed;
    scr.addEventListener('click', onClick);
    var pg = body();
    pg.addEventListener('keydown', function (e) {
      var c = e.target.classList && e.target.classList.contains('nw-c') ? e.target : null;
      if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(c.getAttribute('data-k')); }
    });
    pg.addEventListener('scroll', function () {
      var max = pg.scrollHeight - pg.clientHeight, tl = el('nw-tools');
      el('nv-progress-bar').style.width = (max > 10 ? Math.min(100, pg.scrollTop / max * 100) : 0) + '%';
      var stuck = tl.getBoundingClientRect().top <= pg.getBoundingClientRect().top + 1;
      if (stuck !== tl.__s) { tl.__s = stuck; tl.classList.toggle('stuck', stuck); }
      if (pg.scrollTop < 60 && NEWQ.length) hideNewPill();
    }, { passive: true });
    ptrBind(pg);
    var tr = el('nw-htrack'), dots = el('nw-hdots'), raf = 0, holdT = 0;
    tr.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var s = q('.nw-hs', tr);
        if (s) setDot(Math.round(tr.scrollLeft / (s.offsetWidth + 10)));
      });
    }, { passive: true });
    tr.addEventListener('pointerdown', function () { dots.classList.add('hold'); clearTimeout(holdT); });
    window.addEventListener('pointerup', function () { clearTimeout(holdT); holdT = setTimeout(function () { dots.classList.remove('hold'); }, 3000); });
    dots.addEventListener('animationend', function (e) {
      if (e.animationName !== 'nwFillDot' || !active()) return;
      heroGo(HERO.idx + 1);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && active() && ST.open) { collapse(ST.open); ST.open = null; }
    });
    window.addEventListener('resize', function () {
      if (!active()) return;
      moveCind(true);
      if (ST.open && LV.nodes[ST.open]) drawDetail(LV.nodes[ST.open], false);
    });
  }

  /* force — открытие экрана (полная сборка); без force лента только догоняет. */
  function renderFeed(force) {
    if (force || !ST.built) build();
    else tick();
  }

  return { catIco: catIco, behave: behave, bind: bind, render: renderFeed, unread: function () { rdLoad(); return unreadCount(now()); } };
})();
