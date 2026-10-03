/* v3 — уведомления по concept/notifications.html.
   Три вида: «Цена» (уровень на графике, один раз или каждый раз), «Рывок»
   (цена прошла N% за 1/5/15 минут) и «Новости» (заголовок целиком прямо в
   баннере — читать новости в игре негде, поэтому кнопки «перейти» нет).
   Плюс бесплатная подписка на исполнение лимиток (S.notifies[id], как было).
   Слотов нет: ставь сколько нужно.

   Сейв: S.alerts — активные, S.alertFeed — последние сработавшие (до 40),
   S.alertSeen — когда игрок последний раз открывал центр (бейдж на 🔔).
   Места в интерфейсе: колокольчик в шапке (центр уведомлений), 🔔 на экране
   монеты (новое уведомление), уровни на графике (тянуть, тап — правка),
   «+🔔» у перекрестия, вкладка «Уведомления» под графиком, карточка
   «Ближайшие сигналы» и метки в строках рынка. */
'use strict';

var Alerts = (function () {
  V3.i18n({
    ru: {
      al_title: 'Уведомления', al_new: 'Новое уведомление', al_edit: 'Изменить уведомление',
      al_k_price: 'Цена', al_k_move: 'Рывок', al_k_news: 'Новости',
      al_up_to: 'Поднимется до', al_dn_to: 'Опустится до', al_now: 'сейчас {p}',
      al_from_now: '{p} от текущей', al_pick: 'Выбрать на графике',
      al_times: 'Сколько раз', al_once: 'Один раз', al_each: 'Каждый раз',
      al_mv_pct: 'Изменение цены', al_mv_win: 'За время', al_dir: 'Направление',
      al_any: 'Любое', al_rise: 'Рост', al_fall: 'Падение', al_min: '{n} мин',
      al_imp: 'Сила новости', al_imp1: 'Любая', al_imp2: 'Средняя+', al_imp3: 'Сильная',
      al_impn1: 'слабая', al_impn2: 'средняя', al_impn3: 'сильная',
      al_freq: 'За последние 3 часа такое было {n}', al_freq0: 'За последние 3 часа такого не было — сигнал редкий',
      al_times1: 'раз', al_times2: 'раза', al_times5: 'раз',
      al_news_ex: 'Так выглядят новости по {t}', al_news_none: 'По {t} за последний час новостей не было',
      al_lf: 'Исполнение лимиток', al_lf_sub: 'Сообщим, когда ордер по {t} исполнится',
      al_create: 'Создать уведомление', al_save: 'Сохранить', al_del: 'Удалить уведомление',
      al_pick_hint: 'Тяните линию или коснитесь графика', al_cancel: 'Отмена', al_done: 'Готово',
      al_when_up: 'сработает при росте', al_when_dn: 'сработает при падении',
      al_t_up: 'Поднимется до {p}', al_t_dn: 'Опустится до {p}',
      al_t_move: 'Рывок {p} за {n} мин', al_t_move_u: 'Рост {p} за {n} мин', al_t_move_d: 'Падение {p} за {n} мин',
      al_t_news: 'Новости: {w}', al_nw_all: 'все', al_nw_mid: 'средние и сильные', al_nw_hi: 'только сильные',
      al_nw_up: ' · к росту', al_nw_dn: ' · к падению',
      al_left: 'осталось {p}', al_mv_now: 'сейчас {p} за {n} мин', al_nw_wait: 'ждём новость',
      al_nw_last: 'последняя {a}', al_rearm: 'ждёт возврата цены',
      al_empty_coin: 'Уведомлений по {t} пока нет. Поставьте уровень — сообщим, когда цена дойдёт',
      al_add: 'Новое уведомление', al_all: 'Все',
      al_near: 'Ближайшие сигналы', al_to_goal: 'до цели',
      al_c_active: 'Мои', al_c_fired: 'Сработали',
      al_c_sub: '{a} активных · {n} новых', al_c_sub0: '{a} активных',
      al_c_empty: 'Активных уведомлений нет', al_c_empty_sub: 'Откройте монету и нажмите 🔔 — или зажмите график и поставьте уровень с перекрестия',
      al_c_fempty: 'Здесь появятся сработавшие уведомления', al_c_clear: 'Очистить историю',
      al_st_active: 'активных', al_st_today: 'сработало за сутки', al_st_coins: 'монет',
      al_combo: 'Двойной сигнал', al_combo_d: 'Исполните лимитку и получите уведомление в пределах минуты. Награда: +1 прокрутка колеса',
      al_combo_lim: 'Лимитка', al_combo_al: 'Уведомление',
      al_b_price: 'Уведомление · цена', al_b_move: 'Уведомление · рывок', al_b_news: 'Новость · {t}', al_b_lim: 'Лимитка исполнена',
      al_b_cross_up: '{t} поднялся до {p}', al_b_cross_dn: '{t} опустился до {p}',
      al_b_since: '{d} с момента установки', al_b_mv: 'с {a} до {b}',
      al_b_rx: 'с новости', al_b_lim_sub: '{s} {q} {t} по {p}', al_buy: 'Покупка', al_sell: 'Продажа',
      al_made: 'Уведомление создано', al_moved: 'Уровень перенесён', al_removed: 'Уведомление удалено',
      al_saved: 'Уведомление сохранено', al_on: 'Уведомление включено', al_off: 'Уведомление выключено',
      al_lf_on: 'Сообщим об исполнении лимиток', al_lf_off: 'Без уведомлений об исполнении',
      al_undo: 'Вернуть', al_change: 'Изменить', al_x_add: 'Уведомить на этой цене',
      al_ago_now: 'только что', al_ago_m: '{n} мин назад', al_ago_h: '{n} ч назад',
      al_open: 'Уведомления', a11y_al_center: 'Центр уведомлений',
      cz_auto: 'Авто', cz_in: 'Приблизить', cz_out: 'Отдалить'
    },
    en: {
      al_title: 'Alerts', al_new: 'New alert', al_edit: 'Edit alert',
      al_k_price: 'Price', al_k_move: 'Move', al_k_news: 'News',
      al_up_to: 'Rises to', al_dn_to: 'Falls to', al_now: 'now {p}',
      al_from_now: '{p} from current', al_pick: 'Pick on chart',
      al_times: 'How often', al_once: 'Once', al_each: 'Every time',
      al_mv_pct: 'Price change', al_mv_win: 'Within', al_dir: 'Direction',
      al_any: 'Any', al_rise: 'Rise', al_fall: 'Fall', al_min: '{n} min',
      al_imp: 'News strength', al_imp1: 'Any', al_imp2: 'Medium+', al_imp3: 'Strong',
      al_impn1: 'weak', al_impn2: 'medium', al_impn3: 'strong',
      al_freq: 'Happened {n} in the last 3 hours', al_freq0: 'Didn’t happen in the last 3 hours — a rare signal',
      al_times1: 'time', al_times2: 'times', al_times5: 'times',
      al_news_ex: 'News about {t} looks like this', al_news_none: 'No news about {t} in the last hour',
      al_lf: 'Limit order fills', al_lf_sub: 'We’ll tell you when a {t} order fills',
      al_create: 'Create alert', al_save: 'Save', al_del: 'Delete alert',
      al_pick_hint: 'Drag the line or tap the chart', al_cancel: 'Cancel', al_done: 'Done',
      al_when_up: 'fires on the way up', al_when_dn: 'fires on the way down',
      al_t_up: 'Rises to {p}', al_t_dn: 'Falls to {p}',
      al_t_move: 'Move {p} in {n} min', al_t_move_u: 'Rise {p} in {n} min', al_t_move_d: 'Drop {p} in {n} min',
      al_t_news: 'News: {w}', al_nw_all: 'all', al_nw_mid: 'medium and strong', al_nw_hi: 'strong only',
      al_nw_up: ' · bullish', al_nw_dn: ' · bearish',
      al_left: '{p} to go', al_mv_now: 'now {p} in {n} min', al_nw_wait: 'waiting for news',
      al_nw_last: 'last {a}', al_rearm: 'waiting for price to return',
      al_empty_coin: 'No alerts for {t} yet. Set a level and we’ll tell you when price gets there',
      al_add: 'New alert', al_all: 'All',
      al_near: 'Nearest signals', al_to_goal: 'to target',
      al_c_active: 'My alerts', al_c_fired: 'Fired',
      al_c_sub: '{a} active · {n} new', al_c_sub0: '{a} active',
      al_c_empty: 'No active alerts', al_c_empty_sub: 'Open a coin and tap 🔔 — or hold the chart and set a level from the crosshair',
      al_c_fempty: 'Fired alerts will show up here', al_c_clear: 'Clear history',
      al_st_active: 'active', al_st_today: 'fired in 24h', al_st_coins: 'coins',
      al_combo: 'Double signal', al_combo_d: 'Fill a limit order and get an alert within a minute. Reward: +1 wheel spin',
      al_combo_lim: 'Limit', al_combo_al: 'Alert',
      al_b_price: 'Alert · price', al_b_move: 'Alert · move', al_b_news: 'News · {t}', al_b_lim: 'Limit order filled',
      al_b_cross_up: '{t} rose to {p}', al_b_cross_dn: '{t} fell to {p}',
      al_b_since: '{d} since set', al_b_mv: 'from {a} to {b}',
      al_b_rx: 'since news', al_b_lim_sub: '{s} {q} {t} at {p}', al_buy: 'Buy', al_sell: 'Sell',
      al_made: 'Alert created', al_moved: 'Level moved', al_removed: 'Alert deleted',
      al_saved: 'Alert saved', al_on: 'Alert on', al_off: 'Alert off',
      al_lf_on: 'We’ll notify you of limit fills', al_lf_off: 'No limit fill alerts',
      al_undo: 'Undo', al_change: 'Edit', al_x_add: 'Alert at this price',
      al_ago_now: 'just now', al_ago_m: '{n} min ago', al_ago_h: '{n} h ago',
      al_open: 'Alerts', a11y_al_center: 'Alert center',
      cz_auto: 'Auto', cz_in: 'Zoom in', cz_out: 'Zoom out'
    }
  });

  var D = V3.D, esc = V3.esc, reflow = V3.reflow;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function $id(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var ICO = {
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    bellPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 9.5-4.9"/><path d="M18 11c.4 4.5 3 6 3 6H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M19 2v6M16 5h6"/></svg>',
    price: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4M17 12h4M9.5 12h5"/><circle cx="12" cy="12" r="9"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
    move: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.2 2 4.5 13.6h6.1L9.8 22l8.7-11.6h-6.1z"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7.5 9h6M7.5 12.5h6M7.5 16h3.5"/></svg>',
    lim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18M4 16l5-5 4 3 7-7"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>',
    up: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 2l4.5 7h-9z"/></svg>',
    dn: '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 10L1.5 3h9z"/></svg>',
    drag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    combo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>'
  };

  /* ================================================================
     Данные
     ================================================================ */
  function list() { if (!Array.isArray(S.alerts)) S.alerts = []; return S.alerts; }
  function feed() { if (!Array.isArray(S.alertFeed)) S.alertFeed = []; return S.alertFeed; }
  function ofAsset(id) { return list().filter(function (x) { return x.a === id; }); }
  function byId(id) { for (var i = 0; i < list().length; i++) if (list()[i].id === id) return list()[i]; return null; }
  function uid() { return 'al' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function img(a) { return a.img || ('img/coins/' + a.id + '.png'); }
  function live(a) { return Engine.live(a, now()); }
  function px(a, v) { return money(v, a.dec); }
  function pct(v, d) { var x = Math.abs(v * 100); return (v >= 0 ? '+' : '\u2212') + x.toFixed(d != null ? d : (x >= 10 ? 1 : 2)) + '%'; }
  function pctU(v, d) { return Math.abs(v * 100).toFixed(d != null ? d : 2) + '%'; }
  function plural(n, base) {
    if (LANG !== 'ru') return t(base + (n === 1 ? '1' : '2'));
    var m10 = n % 10, m100 = n % 100;
    return t(base + (m10 === 1 && m100 !== 11 ? '1' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? '2' : '5'));
  }
  function ago(ts) {
    var s = Math.max(0, (now() - ts) / 1000);
    if (s < 60) return t('al_ago_now');
    if (s < 3600) return t('al_ago_m', { n: Math.floor(s / 60) });
    return t('al_ago_h', { n: Math.floor(s / 3600) });
  }
  function hm(ts) { var d = new Date(ts); return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes(); }
  function save(now_) { try { saveState(!!now_); } catch (e) { dbg('al:save', e); } }
  function onTrade() { return currentScreen === 'scr-trade' && typeof tradeAssetId !== 'undefined' && !!tradeAssetId; }
  function newsApi() { return typeof NV3 !== 'undefined' ? NV3 : null; }
  function catIco(c) { var n = newsApi(); return n && n.catIco ? n.catIco(c) : ICO.news; }
  function catName(c) { try { return newsCatName(c); } catch (e) { return c; } }
  function behave(n) { var a = newsApi(); return a && a.behave ? a.behave(n) : ''; }

  function titleOf(al, a) {
    if (al.k === 'price') return t(al.dir > 0 ? 'al_t_up' : 'al_t_dn', { p: px(a, al.p) });
    if (al.k === 'move') return t(al.dir > 0 ? 'al_t_move_u' : al.dir < 0 ? 'al_t_move_d' : 'al_t_move', { p: (al.dir ? '' : '\u00B1') + al.pct + '%', n: al.win });
    return t('al_t_news', { w: t(al.imp >= 3 ? 'al_nw_hi' : al.imp >= 2 ? 'al_nw_mid' : 'al_nw_all') }) + (al.ndir > 0 ? t('al_nw_up') : al.ndir < 0 ? t('al_nw_dn') : '');
  }
  /* Прогресс ценового уведомления: сколько пройдено от цены установки. */
  function progOf(al, p) {
    var tot = Math.abs(al.p - al.p0) || al.p * 0.001, done = al.dir > 0 ? p - al.p0 : al.p0 - p;
    return clamp(done / tot, 0, 1);
  }

  /* Перевод старых колокольчиков (S.notifies[id] = «сигнал на 1%») в
     «Рывок ±1% за 15 мин». Подписка на лимитки остаётся в S.notifies. */
  function migrate() {
    if (S.alertsMig) return;
    S.alertsMig = 1;
    try {
      Object.keys(S.notifies || {}).forEach(function (id) {
        if (!S.notifies[id] || !assetById(id) || ofAsset(id).length) return;
        list().push({ id: uid(), a: id, k: 'move', pct: 1, win: 15, dir: 0, on: true, at: now(), last: 0 });
      });
    } catch (e) { dbg('al:migrate', e); }
    save(false);
  }

  /* ================================================================
     Проверка условий (раз в секунду)
     ================================================================ */
  /* Цена win минут назад — открытие свечи на границе окна. */
  var REF = {};
  function refPrice(a, win) {
    var key = a.id + '|' + win, c = REF[key], ts = now();
    if (c && ts - c.at < 4000) return c.p;
    var tf = win <= 1 ? 1 : 12, n = win <= 1 ? 13 : win + 1, p = 0;
    try { var cd = Engine.candles(a, n, tf, ts); if (cd && cd.length) p = cd[0].o; } catch (e) { dbg('al:ref', e); }
    REF[key] = { at: ts, p: p };
    return p;
  }
  function newsFits(n, al) {
    return (n.impact || 1) >= (al.imp || 1) && (!al.ndir || n.dir === al.ndir);
  }
  var newsAt = 0, NEWS = [];
  function tick() {
    if (typeof S === 'undefined' || !S) return;
    var ts = now(), all = list();
    if (all.some(function (x) { return x.k === 'news' && x.on; }) && ts - newsAt > 2000) {
      newsAt = ts;
      try { NEWS = Engine.newsFeed(ts, 60) || []; } catch (e) { NEWS = []; dbg('al:news', e); }
    }
    var dirty = false;
    all.slice().forEach(function (al) {
      if (!al.on) return;
      var a = assetById(al.a);
      if (!a) return;
      var p = live(a);
      if (!(p > 0)) return;
      if (al.k === 'price') {
        if (al.armed === false) {
          /* «Каждый раз»: после сигнала ждём, пока цена отойдёт обратно на 0.2%. */
          if (al.dir > 0 ? p < al.p * 0.998 : p > al.p * 1.002) { al.armed = true; al.p0 = p; dirty = true; }
          return;
        }
        if (al.dir > 0 ? p >= al.p : p <= al.p) { firePrice(al, a, p); dirty = true; }
      } else if (al.k === 'move') {
        if (ts - (al.last || 0) < al.win * 60000) return;
        var r = refPrice(a, al.win);
        if (!(r > 0)) return;
        var m = p / r - 1;
        if (Math.abs(m) * 100 >= al.pct && (!al.dir || (m > 0) === (al.dir > 0))) { fireMove(al, a, p, r, m); dirty = true; }
      } else if (al.k === 'news') {
        var since = Math.max(al.nt || 0, al.at || 0, ts - 150000);
        var hit = null;
        for (var i = NEWS.length - 1; i >= 0; i--) {
          var n = NEWS[i];
          if (n.id !== a.id || !(n.t > since)) continue;
          al.nt = Math.max(al.nt || 0, n.t);
          dirty = true;
          if (newsFits(n, al)) hit = n;
        }
        if (hit) fireNews(al, a, hit, p);
      }
    });
    if (dirty) save(false);
    liveUi();
  }

  function logFeed(f) {
    f.t = now();
    feed().unshift(f);
    if (feed().length > 40) feed().length = 40;
    renderBadges();
    if (isOpen('modal-alc')) renderCenter(false);
  }
  function achFired(a, p) {
    if (typeof Ach !== 'undefined' && Ach.alertFired) { try { Ach.alertFired(a.id, p); } catch (e) { dbg('al:ach', e); } }
  }
  function firePrice(al, a, p) {
    var d = p / (al.p0 || p) - 1;
    var title = t(al.dir > 0 ? 'al_b_cross_up' : 'al_b_cross_dn', { t: a.ticker, p: px(a, al.p) });
    var sub = t('al_b_since', { d: pct(d) });
    logFeed({ k: 'price', a: a.id, dir: al.dir, title: title, sub: sub, px: p });
    if (al.rep === 'each') al.armed = false;
    else list().splice(list().indexOf(al), 1);
    Snd.play('price_alert');
    fx(a, al);
    banner({ k: 'price', a: a, up: al.dir > 0, kick: t('al_b_price'), title: title, sub: sub, lvl: al.p });
    achFired(a, p);
    refreshAll();
  }
  function fireMove(al, a, p, r, m) {
    al.last = now();
    var title = a.ticker + ' ' + pct(m, 1) + ' \u00B7 ' + t('al_min', { n: al.win });
    var sub = t('al_b_mv', { a: px(a, r), b: px(a, p) });
    logFeed({ k: 'move', a: a.id, dir: m > 0 ? 1 : -1, title: title, sub: sub, px: p });
    Snd.play('move_alert');
    fx(a, null);
    banner({ k: 'move', a: a, up: m > 0, kick: t('al_b_move'), title: title, sub: sub, lvl: r });
    achFired(a, p);
    refreshAll();
  }
  function fireNews(al, a, n, p) {
    var title = String(n.text || '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
    var sub = assetName(a) + ' \u00B7 ' + catName(n.cat);
    logFeed({ k: 'news', a: a.id, dir: n.dir || 0, title: title, sub: sub, px: p, imp: n.impact || 1, cat: n.cat });
    Snd.play('news_alert');
    fx(a, null);
    banner({ k: 'news', a: a, up: (n.dir || 0) >= 0, flat: !n.dir, kick: t('al_b_news', { t: a.ticker }), title: title, sub: sub, news: n, px0: p });
    achFired(a, p);
    refreshAll();
  }
  /* Исполнение лимитки при подписке (зовёт js/achievements.js вместо
     прежнего короткого тоста). Возвращает true, если баннер показан. */
  function limitFilled(a, side, price, qty) {
    if (!a) return false;
    var title = t('alerts_fill', { t: a.ticker });
    var sub = t('al_b_lim_sub', { s: t(side === 'sell' ? 'al_sell' : 'al_buy'), q: (typeof fmtQty === 'function' ? fmtQty(qty || 0) : String(qty || '')), t: a.ticker, p: px(a, price) });
    logFeed({ k: 'lim', a: a.id, dir: side === 'sell' ? -1 : 1, title: title, sub: sub, px: price });
    fx(a, null);
    banner({ k: 'lim', a: a, up: side !== 'sell', kick: t('al_b_lim'), title: title, sub: sub, lvl: price });
    return true;
  }

  /* ================================================================
     Баннер — обычный тост игры (стопка, свайп, таймер) с дополнениями:
     мини-график и сделка для цены/рывка, для новости — заголовок целиком,
     направление, сила, живая реакция цены и подсказка поведения.
     ================================================================ */
  function sparkSvg(a, lvl, up) {
    var cd = [];
    try { cd = Engine.candles(a, 36, 1, now()) || []; } catch (e) { dbg('al:spark', e); }
    var vals = cd.map(function (c) { return c.c; });
    vals.push(live(a));
    if (vals.length < 3) return '';
    var all = vals.concat(lvl > 0 ? [lvl] : []), mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), pd = (mx - mn) * 0.14 || mx * 0.001;
    mn -= pd; mx += pd;
    function y(v) { return (3 + (1 - (v - mn) / (mx - mn)) * 34).toFixed(1); }
    var d = '';
    vals.forEach(function (v, i) { d += (i ? 'L' : 'M') + (i / (vals.length - 1) * 70).toFixed(1) + ',' + y(v); });
    return '<svg class="al-spk ' + (up ? 'up' : 'dn') + '" viewBox="0 0 74 40" aria-hidden="true">' +
      (lvl > 0 ? '<line class="lv" x1="0" x2="74" y1="' + y(lvl) + '" y2="' + y(lvl) + '"/>' : '') +
      '<path class="l" pathLength="100" d="' + d + '"/><circle class="dot" r="3" cx="70" cy="' + y(vals[vals.length - 1]) + '"/></svg>';
  }
  function impHtml(i) {
    var h = '<span class="al-imp i' + i + '" aria-hidden="true">';
    for (var k = 1; k <= 3; k++) h += '<i' + (k <= i ? ' class="on"' : '') + '></i>';
    return h + '</span>';
  }
  function banner(o) {
    if (typeof toast !== 'function') return;
    var a = o.a, isNews = o.k === 'news';
    var el = toast(o.title, 'gold al-bn ' + (o.flat ? 'al-flat' : o.up ? 'al-up' : 'al-dn') + (isNews ? ' al-bn-news' : ''),
      { img: img(a), sub: o.sub, ms: isNews ? 9000 : 6500 });
    if (!el || el.__al) return;
    el.__al = 1;
    var ic = $('.tst-ico', el);
    if (ic) ic.insertAdjacentHTML('beforeend', '<i class="al-bk">' + (isNews ? catIco(o.news.cat) : o.k === 'move' ? ICO.move : o.k === 'lim' ? ICO.lim : ICO.bell) + '</i>');
    var tx = $('.tst-txt', el);
    if (tx) tx.insertAdjacentHTML('afterbegin', '<span class="al-kick">' + esc(o.kick) + '<time>' + esc(t('al_ago_now')) + '</time></span>');
    var n = $('.tst-n', el), h = '';
    if (isNews) {
      var nw = o.news, bh = '';
      try { bh = behave({ dir: nw.dir, cat: nw.cat, ext: !!nw.extreme }) || ''; } catch (e) { bh = ''; }
      h = '<div class="al-bx"><div class="al-chips"><span class="al-chip dir">' + (nw.dir > 0 ? ICO.up + ' ' + esc(t('al_rise')) : nw.dir < 0 ? ICO.dn + ' ' + esc(t('al_fall')) : '\u2022 ' + esc(t('al_any'))) + '</span>' +
        '<span class="al-chip">' + impHtml(nw.impact || 1) + esc(t('al_impn' + (nw.impact || 1))) + '</span>' +
        '<span class="al-chip rx">' + esc(t('al_b_rx')) + ' <b class="mono al-rx">+0.00%</b></span></div>' +
        '<svg class="al-rxg" viewBox="0 0 300 30" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="300" y1="15" y2="15"/><path class="a"/><path class="l"/></svg>' +
        (bh ? '<div class="al-hint">' + ICO.bulb + '<span>' + esc(bh) + '</span></div>' : '') + '</div>';
      el.insertBefore(document.createRange().createContextualFragment(h), n);
      var ser = [0];
      el.__iv = setInterval(function () {
        if (!el.isConnected) { clearInterval(el.__iv); return; }
        var r = live(a) / o.px0 - 1;
        ser.push(r);
        if (ser.length > 40) ser.shift();
        var rx = $('.al-rx', el);
        if (rx) { rx.textContent = pct(r); rx.className = 'mono al-rx ' + (r >= 0 ? 'up' : 'down'); }
        var mx = Math.max(0.002, Math.max.apply(null, ser.map(Math.abs)));
        var d = ser.map(function (v, i) { return (i ? 'L' : 'M') + (i / 39 * 300).toFixed(1) + ',' + (15 - v / mx * 13).toFixed(1); }).join('');
        var l = $('.al-rxg .l', el), ar = $('.al-rxg .a', el);
        if (l) { l.setAttribute('d', d); l.setAttribute('class', 'l ' + (r >= 0 ? 'up' : 'dn')); }
        if (ar) { ar.setAttribute('d', d + 'L' + ((ser.length - 1) / 39 * 300).toFixed(1) + ',15L0,15Z'); ar.setAttribute('class', 'a ' + (r >= 0 ? 'up' : 'dn')); }
      }, 400);
    } else {
      h = sparkSvg(a, o.lvl, o.up) +
        '<div class="al-act"><button type="button" class="al-tb sell" data-al-trade="sell">' + esc(t('sell')) + '</button>' +
        '<button type="button" class="al-tb buy" data-al-trade="buy">' + esc(t('buy')) + '</button></div>';
      el.insertBefore(document.createRange().createContextualFragment(h), n);
      $$('[data-al-trade]', el).forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var mode = b.getAttribute('data-al-trade');
          try { toastDismiss(el); } catch (er) { /* */ }
          goTrade(a.id, mode);
        });
      });
    }
    try { toastLayout(); } catch (e) { dbg('al:layout', e); }
    FX.vibrate(isNews ? [8, 30, 8] : 12);
  }
  function goTrade(id, mode) {
    function open() { if (mode && typeof openSheet === 'function') { try { openSheet(mode); } catch (e) { dbg('al:sheet', e); } } }
    ['modal-alc', 'modal-aln'].forEach(function (m) { if (isOpen(m)) closeModal(m); });
    if (onTrade() && tradeAssetId === id) { open(); return; }
    try { if (!$id('modal-trade').classList.contains('hidden')) closeSheet(); } catch (e) { /* */ }
    openTrade(id);
    if (mode) setTimeout(open, 380);
  }
  function isOpen(id) { var m = $id(id); return !!(m && !m.classList.contains('hidden') && !m.classList.contains('modal-out')); }

  /* Эффекты срабатывания: волна от уровня на графике, вспышка строки рынка
     и колокольчика в шапке. */
  function fx(a, al) {
    var bell = $id('btn-alerts');
    if (bell) { bell.classList.remove('al-ring'); reflow(bell); bell.classList.add('al-ring'); }
    var row = document.querySelector('#market-list .asset-row[data-asset="' + a.id + '"]');
    if (row) { row.classList.remove('al-hit'); reflow(row); row.classList.add('al-hit'); }
    if (onTrade() && tradeAssetId === a.id) {
      var lay = chartLayer(), cv = $id('chart');
      if (!lay || !cv) return;
      var g = Chart.geoOf(cv), y = g ? (al && al.p ? Chart.priceToY(cv, al.p) : g.y(live(a))) : 120;
      var w = document.createElement('i');
      w.className = 'al-wave';
      w.style.top = clamp(y, 10, (g ? g.padT + g.plotH : 240) - 4) + 'px';
      lay.appendChild(w);
      setTimeout(function () { w.remove(); }, D(1400) + 50);
    }
  }

  /* ================================================================
     График монеты: уровни, метки, «+🔔» у перекрестия, выбор на графике
     ================================================================ */
  var DRAG = null;   // id уровня, который тянут
  var PK = null;     // режим «Выбрать на графике»: { a, p, form }
  function chartLayer() {
    var cv = $id('chart');
    if (!cv) return null;
    var lay = $id('al-layer');
    if (!lay) {
      lay = document.createElement('div');
      lay.id = 'al-layer';
      lay.className = 'al-layer';
      cv.parentNode.appendChild(lay);
      lay.addEventListener('pointerdown', tagDown);
    }
    if (lay.__w !== cv.offsetWidth || lay.__t !== cv.offsetTop) {
      lay.__w = cv.offsetWidth; lay.__t = cv.offsetTop;
      lay.style.left = cv.offsetLeft + 'px';
      lay.style.top = cv.offsetTop + 'px';
      lay.style.width = cv.offsetWidth + 'px';
      lay.style.height = cv.offsetHeight + 'px';
    }
    return lay;
  }
  function chartLevels(id) {
    if (typeof S === 'undefined' || !S) return null;
    var out = [];
    ofAsset(id).forEach(function (al) {
      if (al.k !== 'price') return;
      out.push({ price: al.p, off: !al.on || (PK && PK.a.id === id), hot: DRAG === al.id });
    });
    if (PK && PK.a.id === id) out.push({ price: PK.p, hot: true });
    return out;
  }
  /* Позиции DOM-меток — после каждой отрисовки графика (до 20 раз в с). */
  function afterDraw(crossY) {
    var lay = chartLayer(), cv = $id('chart');
    if (!lay || !cv || !onTrade()) return;
    var g = Chart.geoOf(cv), a = assetById(tradeAssetId);
    if (!g || !a) return;
    var p = live(a), seen = {};
    lay.style.setProperty('--pr', (g.padR + 4) + 'px');
    function place(key, price, cls, html) {
      var el = lay.querySelector('[data-tag="' + key + '"]');
      if (!el) {
        el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('data-tag', key);
        lay.appendChild(el);
      }
      if (el.__h !== html) { el.innerHTML = html; el.__h = html; }
      var c = 'alt ' + cls;
      if (el.className !== c) el.className = c;
      var y = clamp(Chart.priceToY(cv, price), g.padT + 8, g.padT + g.plotH - 8);
      var tr = 'translateY(' + (y - 11).toFixed(1) + 'px)';
      if (el.style.transform !== tr) el.style.transform = tr;
      seen[key] = 1;
    }
    ofAsset(a.id).forEach(function (al) {
      if (al.k !== 'price') return;
      var d = al.p / p - 1;
      place(al.id, al.p, (al.on ? '' : 'off') + (DRAG === al.id ? ' drag' : '') + (PK ? ' dim' : ''),
        ICO.bell + '<span class="mono">' + esc(pct(d)) + '</span>');
    });
    if (PK && PK.a.id === a.id) {
      place('pick', PK.p, 'pick', ICO.drag + '<span class="mono">' + esc(pct(PK.p / p - 1)) + '</span>');
      pickBar();
    } else if (crossY != null && crossY >= g.padT && crossY <= g.padT + g.plotH) {
      var cp = g.hi - (crossY - g.padT) / g.plotH * (g.hi - g.lo);
      place('xadd', cp, 'xadd', ICO.bellPlus + '<span>' + esc(pct(cp / p - 1)) + '</span>');
      var xb = lay.querySelector('[data-tag="xadd"]');
      if (xb) { xb.__p = cp; xb.setAttribute('aria-label', t('al_x_add')); }
    }
    $$('[data-tag]', lay).forEach(function (el) { if (!seen[el.getAttribute('data-tag')]) el.remove(); });
    lay.classList.toggle('picking', !!PK);
  }
  function redraw() { if (onTrade()) { try { updateTradePrices(); } catch (e) { dbg('al:redraw', e); } } }

  /* Метка уровня: тянуть — перенести, тап — правка. «+🔔» — уведомление
     на цене перекрестия. В режиме выбора слой ловит жест по всему графику. */
  var TG = null;
  function tagDown(e) {
    var lay = chartLayer(), cv = $id('chart'), a = onTrade() ? assetById(tradeAssetId) : null;
    if (!lay || !cv || !a) return;
    var tag = e.target.closest('[data-tag]');
    var pickZone = PK && e.target.closest('.al-pz');
    if (!tag && !pickZone) return;
    var key = tag ? tag.getAttribute('data-tag') : 'pick';
    if (key === 'xadd') return; /* обычный click */
    var al = key === 'pick' ? null : byId(key);
    if (key !== 'pick' && !al) return;
    if (key === 'pick' && !PK) return;
    e.preventDefault();
    TG = { key: key, al: al, y0: e.clientY, y: e.clientY, p0: key === 'pick' ? PK.p : al.p, moved: 0, t: Date.now(), id: e.pointerId, zone: !tag };
    try { (tag || e.target).setPointerCapture(e.pointerId); } catch (er) { /* */ }
    if (al) { DRAG = al.id; redraw(); }
  }
  function tagMove(e) {
    if (!TG || e.pointerId !== TG.id) return;
    var cv = $id('chart'), g = Chart.geoOf(cv);
    if (!g) return;
    var dy = e.clientY - TG.y;
    TG.y = e.clientY;
    TG.moved += Math.abs(dy);
    if (TG.moved < 3) return;
    var cur = TG.key === 'pick' ? PK.p : TG.al.p;
    var np = Math.max(cur * 0.02, cur - dy * (g.hi - g.lo) / g.plotH);
    if (TG.key === 'pick') PK.p = np; else TG.al.p = np;
    /* У края окна шкала раздвигается сама — уровень можно увести куда угодно. */
    if (typeof chartZoom !== 'undefined' && chartZoom) chartZoom.fit(np);
    redraw();
  }
  function tagUp(e) {
    if (!TG || (e && e.pointerId !== TG.id)) return;
    var s = TG, cv = $id('chart');
    TG = null;
    DRAG = null;
    var tap = s.moved < 6 && Date.now() - s.t < 450;
    if (s.key === 'pick') {
      if (tap && s.zone && cv) PK.p = Math.max(0, Chart.yToPrice(cv, e.clientY));
      FX.vibrate(6);
      redraw();
      return;
    }
    var al = s.al, a = assetById(al.a);
    if (tap) { al.p = s.p0; redraw(); openForm(a, al); return; }
    var p = live(a);
    al.p = roundPx(a, al.p);
    al.dir = al.p >= p ? 1 : -1;
    al.p0 = p;
    al.armed = true;
    save(true);
    FX.vibrate(10);
    toast(t('al_moved'), 'gold', { img: img(a), sub: titleOf(al, a), action: { label: t('al_undo'), fn: function () { al.p = s.p0; al.dir = al.p >= live(a) ? 1 : -1; save(true); refreshAll(); } } });
    refreshAll();
  }
  document.addEventListener('pointermove', tagMove, true);
  document.addEventListener('pointerup', tagUp, true);
  document.addEventListener('pointercancel', function (e) { if (TG && e.pointerId === TG.id) { if (TG.al) TG.al.p = TG.p0; TG = null; DRAG = null; redraw(); } }, true);
  document.addEventListener('click', function (e) {
    var xb = e.target.closest && e.target.closest('#al-layer [data-tag="xadd"]');
    if (!xb || !onTrade()) return;
    e.stopPropagation();
    var a = assetById(tradeAssetId), p = live(a), lvl = roundPx(a, xb.__p || p);
    var al = add({ a: a.id, k: 'price', p: lvl, dir: lvl >= p ? 1 : -1, rep: 'once' });
    try { chartHover = -1; chartHoverY = null; } catch (er) { /* */ }
    FX.vibrate([8, 20, 8]);
    toast(t('al_made'), 'gold', { img: img(a), sub: titleOf(al, a), action: { label: t('al_change'), fn: function () { openForm(a, byId(al.id)); } } });
    redraw();
  }, true);

  function roundPx(a, v) {
    var d = a.dec != null ? a.dec : 2, k = Math.pow(10, d);
    return Math.round(v * k) / k;
  }

  /* ---- «Выбрать на графике» ---- */
  function startPick(a, form) {
    if (!onTrade() || tradeAssetId !== a.id) {
      goTrade(a.id);
      setTimeout(function () { startPick(a, form); }, 420);
      return;
    }
    closeModal('modal-aln');
    PK = { a: a, p: form.p, form: form };
    try { chartHover = -1; chartHoverY = null; } catch (e) { /* */ }
    var lay = chartLayer();
    if (lay && !lay.querySelector('.al-pz')) lay.insertAdjacentHTML('afterbegin', '<div class="al-pz" aria-hidden="true"></div>');
    var card = $id('chart').parentNode, bar = $id('al-pickbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'al-pickbar';
      bar.className = 'al-pickbar';
      card.appendChild(bar);
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pk]');
        if (b) endPick(b.getAttribute('data-pk') === 'ok');
      });
    }
    bar.innerHTML = '<div class="al-pk-m"><b class="mono" id="al-pk-p"></b><span id="al-pk-s"></span></div>' +
      '<button type="button" class="al-pk-b" data-pk="no">' + esc(t('al_cancel')) + '</button>' +
      '<button type="button" class="al-pk-b ok" data-pk="ok">' + esc(t('al_done')) + '</button>';
    bar.classList.remove('hidden');
    reflow(bar);
    bar.classList.add('in');
    if (typeof chartZoom !== 'undefined' && chartZoom) chartZoom.fit(PK.p);
    try { $id('chart').scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { /* */ }
    FX.vibrate(8);
    redraw();
  }
  function pickBar() {
    if (!PK) return;
    var p = live(PK.a), up = PK.p >= p;
    var pe = $id('al-pk-p'), se = $id('al-pk-s');
    var tp = (up ? '\u25B2 ' : '\u25BC ') + px(PK.a, PK.p);
    if (pe && pe.textContent !== tp) pe.textContent = tp;
    var ts = pct(PK.p / p - 1) + ' \u00B7 ' + t(up ? 'al_when_up' : 'al_when_dn');
    if (se && se.textContent !== ts) { se.textContent = ts; se.className = up ? 'up' : 'down'; }
  }
  function endPick(ok) {
    if (!PK) return;
    var pk = PK;
    PK = null;
    var bar = $id('al-pickbar');
    if (bar) { bar.classList.remove('in'); setTimeout(function () { if (!PK) bar.classList.add('hidden'); }, 220); }
    var z = $('#al-layer .al-pz');
    if (z) z.remove();
    if (ok) pk.form.p = roundPx(pk.a, pk.p);
    redraw();
    openForm(pk.a, null, pk.form);
  }
  function cancelPick() { if (PK) { PK = null; var bar = $id('al-pickbar'); if (bar) bar.classList.add('hidden'); var z = $('#al-layer .al-pz'); if (z) z.remove(); } }

  /* ================================================================
     Создание, правка, удаление
     ================================================================ */
  function add(o) {
    var a = assetById(o.a), al = { id: uid(), a: o.a, k: o.k, on: true, at: now() };
    fill(al, o, a);
    list().push(al);
    Snd.play('alert_set');
    save(true);
    refreshAll();
    return al;
  }
  function fill(al, o, a) {
    var p = live(a);
    al.k = o.k;
    ['p', 'dir', 'rep', 'pct', 'win', 'imp', 'ndir', 'armed', 'p0', 'last', 'nt'].forEach(function (k) { delete al[k]; });
    if (o.k === 'price') { al.p = o.p; al.dir = o.p >= p ? 1 : -1; al.rep = o.rep === 'each' ? 'each' : 'once'; al.p0 = p; al.armed = true; }
    else if (o.k === 'move') { al.pct = o.pct; al.win = o.win; al.dir = o.dir || 0; al.last = 0; }
    else { al.imp = o.imp || 1; al.ndir = o.ndir || 0; al.nt = now(); }
  }
  function remove(id) {
    var al = byId(id);
    if (!al) return null;
    list().splice(list().indexOf(al), 1);
    save(true);
    refreshAll();
    return al;
  }
  function removeUndo(al) {
    var a = assetById(al.a);
    toast(t('al_removed'), '', { img: img(a), sub: titleOf(al, a), action: { label: t('al_undo'), fn: function () { if (!byId(al.id)) { list().push(al); save(true); refreshAll(); } } } });
  }
  function toggle(id) {
    var al = byId(id);
    if (!al) return;
    al.on = !al.on;
    if (al.on) {
      var a = assetById(al.a), p = live(a);
      if (al.k === 'price') { al.dir = al.p >= p ? 1 : -1; al.p0 = p; al.armed = true; }
      if (al.k === 'news') al.nt = now();
    }
    save(true);
    FX.vibrate(8);
    refreshAll();
  }
  function toggleLf(id) {
    if (!S.notifies || typeof S.notifies !== 'object') S.notifies = {};
    if (S.notifies[id]) delete S.notifies[id]; else S.notifies[id] = true;
    save(true);
    FX.vibrate(8);
    var a = assetById(id);
    toast(t(S.notifies[id] ? 'al_lf_on' : 'al_lf_off'), S.notifies[id] ? 'gold' : '', { img: img(a) });
    refreshAll();
  }

  /* ================================================================
     Шторка «Новое уведомление»
     ================================================================ */
  var F = null;
  function niceStep(v) {
    var raw = v * 0.002, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), n = raw / mag;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
  }
  function fmtIn(a, v) { return money(v, a.dec).replace(/[^\d.]/g, ''); }
  function openForm(a, al, resume) {
    if (!a) return;
    cancelPick();
    var p = live(a);
    if (resume) F = resume;
    else if (al) F = { id: al.id, k: al.k, p: al.k === 'price' ? al.p : roundPx(a, p * 1.01), rep: al.rep || 'once', pct: al.pct || 2, win: al.win || 5,
      mdir: al.k === 'move' ? al.dir || 0 : 0, imp: al.imp || 2, ndir: al.ndir || 0 };
    else F = { id: null, k: 'price', p: roundPx(a, p * 1.01), rep: 'once', pct: 2, win: 5, mdir: 0, imp: 2, ndir: 0 };
    F.a = a;
    var m = shell('modal-aln', 'al-sheet');
    renderForm(true);
    openModal('modal-aln');
    m.querySelector('.sheet').scrollTop = 0;
  }
  function shell(id, cls) {
    var m = $id(id);
    if (m) return m;
    m = document.createElement('div');
    m.id = id;
    m.className = 'modal hidden';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="backdrop"></div><div class="sheet ' + cls + '"></div>';
    document.body.appendChild(m);
    m.querySelector('.backdrop').addEventListener('click', function () { closeModal(id); });
    if (id === 'modal-aln') bindForm(m); else bindCenter(m);
    return m;
  }
  function segHtml(attr, cur, opts) {
    return '<div class="seg al-seg" style="--n:' + opts.length + '">' + opts.map(function (o) {
      return '<button type="button" data-' + attr + '="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' class="active"' : '') + '>' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function chipsHtml(attr, cur, opts) {
    return '<div class="pct-chips al-chipsrow">' + opts.map(function (o) {
      return '<button type="button" data-' + attr + '="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' class="active"' : '') + '>' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function renderForm(full) {
    var m = $id('modal-aln'), sh = m && m.querySelector('.sheet');
    if (!sh || !F) return;
    var a = F.a, p = live(a), edit = !!(F.id && byId(F.id));
    var h = '<div class="sheet-head al-sh-head"><span class="al-sh-coin"><img src="' + esc(img(a)) + '" alt="" draggable="false"><i>' + ICO.bell + '</i></span>' +
      '<span class="al-sh-tt"><h2>' + esc(t(edit ? 'al_edit' : 'al_new')) + '</h2><p>' + esc(assetName(a)) + ' \u00B7 <b class="mono" id="aln-now">' + esc(px(a, p)) + '</b></p></span>' +
      '<button type="button" class="icon-btn" data-aln="close" aria-label="' + esc(t('a11y_close')) + '">\u2715</button></div>';
    h += '<div class="seg al-kseg" data-k="' + F.k + '">' +
      [['price', ICO.target], ['move', ICO.move], ['news', ICO.news]].map(function (k) {
        return '<button type="button" data-aln-k="' + k[0] + '"' + (F.k === k[0] ? ' class="active"' : '') + '>' + k[1] + '<span>' + esc(t('al_k_' + k[0])) + '</span></button>';
      }).join('') + '</div>';
    h += '<div class="al-panel" id="aln-panel">' + panelHtml(a, p) + '</div>';
    var lf = !!(S.notifies && S.notifies[a.id]);
    h += '<div class="al-lfrow"><span class="al-lf-ico">' + ICO.lim + '</span><span class="al-lf-tx"><b>' + esc(t('al_lf')) + '</b><i>' + esc(t('al_lf_sub', { t: a.ticker })) + '</i></span>' +
      '<button type="button" class="al-sw' + (lf ? ' on' : '') + '" role="switch" aria-checked="' + lf + '" data-aln="lf" aria-label="' + esc(t('al_lf')) + '"><i></i></button></div>';
    h += '<button type="button" class="btn primary big al-go" data-aln="go">' + ICO.bell + '<span>' + esc(t(edit ? 'al_save' : 'al_create')) + '</span></button>';
    if (edit) h += '<button type="button" class="al-del" data-aln="del">' + ICO.trash + '<span>' + esc(t('al_del')) + '</span></button>';
    sh.innerHTML = h;
    if (!full) sh.classList.add('al-quiet');
    else sh.classList.remove('al-quiet');
    formLive();
  }
  function panelHtml(a, p) {
    var h = '';
    if (F.k === 'price') {
      var up = F.p >= p;
      h += '<div class="al-pbox ' + (up ? 'up' : 'dn') + '"><div class="al-pb-top"><span class="al-dirchip" id="aln-dir"></span><span class="al-pb-now">' + esc(t('al_now', { p: '' })) + '<b class="mono" id="aln-now2"></b></span></div>' +
        '<div class="al-pb-row"><button type="button" class="al-step" data-aln-step="-1" aria-label="\u2212">' + ICO.minus + '</button>' +
        '<label class="al-pb-v"><span>$</span><input id="aln-p" class="mono" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="' + esc(fmtIn(a, F.p)) + '"></label>' +
        '<button type="button" class="al-step" data-aln-step="1" aria-label="+">' + ICO.plus + '</button></div>' +
        '<div class="al-pb-sub mono" id="aln-psub"></div>' +
        '<svg class="al-prev" id="aln-prev" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true"></svg></div>';
      h += chipsHtml('aln-off', '', [[-5, '\u22125%'], [-2, '\u22122%'], [-1, '\u22121%'], [1, '+1%'], [2, '+2%'], [5, '+5%']]);
      h += '<button type="button" class="al-pickbtn" data-aln="pick">' + ICO.chart + '<span>' + esc(t('al_pick')) + '</span></button>';
      h += '<div class="set-label">' + esc(t('al_times')) + '</div>' + segHtml('aln-rep', F.rep, [['once', esc(t('al_once'))], ['each', esc(t('al_each'))]]);
    } else if (F.k === 'move') {
      h += '<div class="set-label">' + esc(t('al_mv_pct')) + '</div>' + chipsHtml('aln-pct', F.pct, [[1, '1%'], [2, '2%'], [3, '3%'], [5, '5%']]);
      h += '<div class="set-label">' + esc(t('al_mv_win')) + '</div>' + chipsHtml('aln-win', F.win, [[1, esc(t('al_min', { n: 1 }))], [5, esc(t('al_min', { n: 5 }))], [15, esc(t('al_min', { n: 15 }))]]);
      h += '<div class="set-label">' + esc(t('al_dir')) + '</div>' + segHtml('aln-mdir', F.mdir, [[0, '\u2195 ' + esc(t('al_any'))], [1, ICO.up + ' ' + esc(t('al_rise'))], [-1, ICO.dn + ' ' + esc(t('al_fall'))]]);
      h += '<div class="al-note">' + ICO.bulb + '<span id="aln-freq">' + esc(freqText(a)) + '</span></div>';
    } else {
      h += '<div class="set-label">' + esc(t('al_imp')) + '</div>' + segHtml('aln-imp', F.imp, [[1, esc(t('al_imp1'))], [2, impHtml(2) + esc(t('al_imp2'))], [3, impHtml(3) + esc(t('al_imp3'))]]);
      h += '<div class="set-label">' + esc(t('al_dir')) + '</div>' + segHtml('aln-ndir', F.ndir, [[0, '\u2195 ' + esc(t('al_any'))], [1, ICO.up + ' ' + esc(t('al_rise'))], [-1, ICO.dn + ' ' + esc(t('al_fall'))]]);
      h += newsExamples(a);
    }
    return h;
  }
  function newsExamples(a) {
    var items = [];
    try { items = (Engine.newsFeed(now(), 80) || []).filter(function (n) { return n.id === a.id; }).slice(0, 2); } catch (e) { dbg('al:nex', e); }
    if (!items.length) return '<div class="al-note">' + ICO.news + '<span>' + esc(t('al_news_none', { t: a.ticker })) + '</span></div>';
    return '<div class="set-label">' + esc(t('al_news_ex', { t: a.ticker })) + '</div>' + items.map(function (n) {
      var fit = newsFits(n, { imp: F.imp, ndir: F.ndir });
      var tx = String(n.text || '');
      return '<div class="al-nex' + (fit ? '' : ' miss') + '"><span class="al-nex-ico ' + (n.dir > 0 ? 'up' : n.dir < 0 ? 'dn' : '') + '">' + catIco(n.cat) + '</span>' +
        '<span class="al-nex-tx"><b>' + esc(tx.charAt(0).toUpperCase() + tx.slice(1)) + '</b><i>' + impHtml(n.impact || 1) + esc(t('al_impn' + (n.impact || 1))) + ' \u00B7 ' + esc(catName(n.cat)) + ' \u00B7 ' + esc(ago(n.t)) + '</i></span>' +
        '<span class="al-nex-ok">' + (fit ? ICO.lim : '\u2014') + '</span></div>';
    }).join('');
  }
  function freqText(a) {
    var cd = [];
    try { cd = Engine.candles(a, 180, 12, now()) || []; } catch (e) { dbg('al:freq', e); }
    var w = F.win, thr = F.pct / 100, n = 0;
    for (var i = w; i < cd.length; i++) {
      var m = cd[i].c / cd[i - w].c - 1;
      if (Math.abs(m) >= thr && (!F.mdir || (m > 0) === (F.mdir > 0))) { n++; i += w - 1; }
    }
    return n ? t('al_freq', { n: n + ' ' + plural(n, 'al_times') }) : t('al_freq0');
  }
  /* Живые части шторки: текущая цена, «+0.96% от текущей», направление, превью. */
  function formLive() {
    if (!F || !isOpenOrOpening('modal-aln')) return;
    var a = F.a, p = live(a);
    var n1 = $id('aln-now'), n2 = $id('aln-now2');
    if (n1) n1.textContent = px(a, p);
    if (n2) n2.textContent = px(a, p);
    if (F.k !== 'price') return;
    var up = F.p >= p, box = $('#modal-aln .al-pbox');
    if (box) box.className = 'al-pbox ' + (up ? 'up' : 'dn');
    var dr = $id('aln-dir');
    if (dr) dr.innerHTML = (up ? ICO.up : ICO.dn) + '<span>' + esc(t(up ? 'al_up_to' : 'al_dn_to')) + '</span>';
    var sb = $id('aln-psub');
    if (sb) sb.textContent = t('al_from_now', { p: pct(F.p / p - 1) });
    var pv = $id('aln-prev');
    if (pv) pv.innerHTML = previewSvg(a, p, F.p);
  }
  function isOpenOrOpening(id) { var m = $id(id); return !!(m && !m.classList.contains('hidden')); }
  function previewSvg(a, p, lvl) {
    var cd = [];
    try { cd = Engine.candles(a, 60, 3, now()) || []; } catch (e) { dbg('al:prev', e); }
    var v = cd.map(function (c) { return c.c; });
    v.push(p);
    if (v.length < 3) return '';
    var mn = Math.min.apply(null, v.concat([lvl])), mx = Math.max.apply(null, v.concat([lvl])), pd = (mx - mn) * 0.12 || mx * 0.001;
    mn -= pd; mx += pd;
    function y(x) { return (4 + (1 - (x - mn) / (mx - mn)) * 56).toFixed(1); }
    var W = 270, d = '';
    v.forEach(function (x, i) { d += (i ? 'L' : 'M') + (i / (v.length - 1) * W).toFixed(1) + ',' + y(x); });
    var ly = y(lvl), py = y(p), up = lvl >= p;
    return '<rect class="zone ' + (up ? 'up' : 'dn') + '" x="0" width="300" y="' + Math.min(ly, py) + '" height="' + Math.abs(ly - py).toFixed(1) + '"/>' +
      '<path class="ar" d="' + d + 'L' + W + ',64L0,64Z"/><path class="ln" d="' + d + '"/>' +
      '<line class="lv" x1="0" x2="300" y1="' + ly + '" y2="' + ly + '"/><circle class="dt" r="3.5" cx="' + W + '" cy="' + py + '"/>' +
      '<circle class="tg" r="4" cx="286" cy="' + ly + '"/>';
  }
  function parseIn(v) { var n = parseFloat(String(v).replace(/\s|\u202f/g, '').replace(',', '.')); return n > 0 ? n : 0; }
  function bindForm(m) {
    m.addEventListener('input', function (e) {
      if (e.target.id !== 'aln-p' || !F) return;
      var v = parseIn(e.target.value);
      if (v > 0) { F.p = v; formLive(); }
    });
    m.addEventListener('click', function (e) {
      if (!F) return;
      var a = F.a, b;
      if ((b = e.target.closest('[data-aln-k]'))) { F.k = b.getAttribute('data-aln-k'); renderForm(false); return; }
      if ((b = e.target.closest('[data-aln-step]'))) {
        var st = niceStep(F.p) * +b.getAttribute('data-aln-step');
        F.p = roundPx(a, Math.max(st > 0 ? st : niceStep(F.p), F.p + st));
        $id('aln-p').value = fmtIn(a, F.p);
        formLive();
        FX.vibrate(5);
        return;
      }
      if ((b = e.target.closest('[data-aln-off]'))) {
        F.p = roundPx(a, live(a) * (1 + b.getAttribute('data-aln-off') / 100));
        $id('aln-p').value = fmtIn(a, F.p);
        $$('#modal-aln [data-aln-off]').forEach(function (x) { x.classList.toggle('active', x === b); });
        formLive();
        return;
      }
      var map = { 'aln-rep': 'rep', 'aln-pct': 'pct', 'aln-win': 'win', 'aln-mdir': 'mdir', 'aln-imp': 'imp', 'aln-ndir': 'ndir' };
      for (var k in map) {
        if ((b = e.target.closest('[data-' + k + ']'))) {
          var raw = b.getAttribute('data-' + k);
          F[map[k]] = k === 'aln-rep' ? raw : +raw;
          $$('#modal-aln [data-' + k + ']').forEach(function (x) { x.classList.toggle('active', x === b); });
          if (F.k === 'move') { var fq = $id('aln-freq'); if (fq) fq.textContent = freqText(a); }
          if (F.k === 'news') { var pn = $id('aln-panel'); if (pn) pn.innerHTML = panelHtml(a, live(a)); }
          return;
        }
      }
      b = e.target.closest('[data-aln]');
      if (!b) return;
      var act = b.getAttribute('data-aln');
      if (act === 'close') closeModal('modal-aln');
      else if (act === 'pick') startPick(a, F);
      else if (act === 'lf') { toggleLf(a.id); var on = !!S.notifies[a.id]; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); }
      else if (act === 'del') {
        var al = remove(F.id);
        closeModal('modal-aln');
        if (al) removeUndo(al);
      } else if (act === 'go') submit(b);
    });
  }
  function submit(btn) {
    var a = F.a, p = live(a);
    if (F.k === 'price') {
      var inp = $id('aln-p');
      if (inp) F.p = parseIn(inp.value) || F.p;
      if (!(F.p > 0) || Math.abs(F.p / p - 1) < 0.0001) { FX.nudge(inp ? inp.parentNode : btn); return; }
      F.p = roundPx(a, F.p);
    }
    var o = { a: a.id, k: F.k, p: F.p, rep: F.rep, pct: F.pct, win: F.win, dir: F.mdir, imp: F.imp, ndir: F.ndir };
    var al = F.id && byId(F.id), made = !al;
    if (al) { fill(al, o, a); al.on = true; save(true); refreshAll(); }
    else al = add(o);
    closeModal('modal-aln');
    FX.vibrate([8, 20, 8]);
    toast(t(made ? 'al_made' : 'al_saved'), 'gold', { img: img(a), sub: titleOf(al, a) });
    if (onTrade() && tradeAssetId === a.id) {
      try { if (typeof deskTab !== 'undefined' && deskTab !== 'alerts') setDeskTab('alerts'); } catch (e) { dbg('al:desk', e); }
      if (al.k === 'price' && typeof chartZoom !== 'undefined' && chartZoom) chartZoom.fit(al.p);
      setTimeout(function () { fx(a, al.k === 'price' ? al : null); }, 260);
    }
  }

  /* ================================================================
     Карточки уведомлений (вкладка под графиком и центр)
     ================================================================ */
  function sortAl(arr) {
    var ord = { price: 0, move: 1, news: 2 };
    return arr.slice().sort(function (x, y) {
      if (x.on !== y.on) return x.on ? -1 : 1;
      if (x.k !== y.k) return ord[x.k] - ord[y.k];
      if (x.k === 'price') { var a = assetById(x.a), p = a ? live(a) : 1; return Math.abs(x.p / p - 1) - Math.abs(y.p / p - 1); }
      return (x.at || 0) - (y.at || 0);
    });
  }
  function kindIco(k) { return k === 'move' ? ICO.move : k === 'news' ? ICO.news : ICO.target; }
  function cardHtml(al, a, i) {
    return '<div class="al-card k-' + al.k + (al.on ? '' : ' off') + '" data-al="' + esc(al.id) + '" style="--i:' + (i || 0) + '">' +
      '<span class="al-ci">' + kindIco(al.k) + '</span>' +
      '<span class="al-cm"><b>' + esc(titleOf(al, a)) + '</b><i class="mono" data-al-s></i></span>' +
      '<button type="button" class="al-sw' + (al.on ? ' on' : '') + '" role="switch" aria-checked="' + !!al.on + '" data-al-tog aria-label="' + esc(titleOf(al, a)) + '"><i></i></button>' +
      (al.k !== 'news' ? '<span class="al-bar"><i data-al-bar></i></span>' : '') + '</div>';
  }
  function lastNews(id) {
    for (var i = 0; i < feed().length; i++) if (feed()[i].a === id && feed()[i].k === 'news') return feed()[i];
    return null;
  }
  function patchCards(root) {
    if (!root) return;
    $$('[data-al]', root).forEach(function (c) {
      var al = byId(c.getAttribute('data-al'));
      if (!al) return;
      var a = assetById(al.a);
      if (!a) return;
      var p = live(a), s = '', w = 0;
      if (al.k === 'price') {
        s = al.armed === false ? t('al_rearm') : t('al_left', { p: pctU(al.p / p - 1) });
        s += ' \u00B7 ' + (al.rep === 'each' ? '\u21BB ' + t('al_each') : t('al_once'));
        w = al.armed === false ? 1 : progOf(al, p);
      } else if (al.k === 'move') {
        var r = refPrice(a, al.win), m = r > 0 ? p / r - 1 : 0;
        s = t('al_mv_now', { p: pct(m), n: al.win });
        w = clamp(Math.abs(m) * 100 / al.pct, 0, 1);
        if (al.dir && (m > 0) !== (al.dir > 0)) w = 0;
      } else {
        var ln = lastNews(a.id);
        s = ln ? t('al_nw_last', { a: ago(ln.t) }) : t('al_nw_wait');
      }
      var se = $('[data-al-s]', c);
      if (se && se.textContent !== s) se.textContent = s;
      var bar = $('[data-al-bar]', c);
      if (bar) {
        var ws = (w * 100).toFixed(1) + '%';
        if (bar.style.width !== ws) bar.style.width = ws;
        c.classList.toggle('near', al.on && w >= 0.8);
      }
    });
  }
  function lfRow(a) {
    var lf = !!(S.notifies && S.notifies[a.id]);
    return '<div class="al-card al-lfcard"><span class="al-ci">' + ICO.lim + '</span><span class="al-cm"><b>' + esc(t('al_lf')) + '</b><i>' + esc(t('al_lf_sub', { t: a.ticker })) + '</i></span>' +
      '<button type="button" class="al-sw' + (lf ? ' on' : '') + '" role="switch" aria-checked="' + lf + '" data-al-lf="' + esc(a.id) + '" aria-label="' + esc(t('al_lf')) + '"><i></i></button></div>';
  }
  /* Вкладка «Уведомления» под графиком: разметка без живых цифр (их
     подлатывает deskPatch), иначе renderDesk пересобирал бы её каждый тик. */
  function deskHtml() {
    var a = assetById(tradeAssetId);
    if (!a) return '';
    var items = sortAl(ofAsset(a.id)), h = '<div class="al-desk">';
    if (!items.length) h += '<div class="al-dempty"><span class="al-de-ico">' + ICO.bell + '</span><span>' + esc(t('al_empty_coin', { t: a.ticker })) + '</span></div>';
    items.forEach(function (al, i) { h += cardHtml(al, a, i); });
    h += lfRow(a);
    h += '<button type="button" class="al-addbtn" data-al-new>' + ICO.plus + '<span>' + esc(t('al_add')) + '</span></button></div>';
    return h;
  }
  function deskPatch() { patchCards($id('al-list')); }
  function countOn(id) { return ofAsset(id).filter(function (x) { return x.on; }).length; }

  function cardClick(e, root) {
    var b;
    if ((b = e.target.closest('[data-al-tog]'))) {
      var c = b.closest('[data-al]'), id = c && c.getAttribute('data-al');
      toggle(id);
      var al = byId(id);
      if (al) { var a0 = assetById(al.a); toast(t(al.on ? 'al_on' : 'al_off'), al.on ? 'gold' : '', { img: img(a0), sub: titleOf(al, a0) }); }
      return true;
    }
    if ((b = e.target.closest('[data-al-lf]'))) { toggleLf(b.getAttribute('data-al-lf')); return true; }
    if ((b = e.target.closest('[data-al-new]'))) { var an = assetById(b.getAttribute('data-al-new') || tradeAssetId); if (an) openForm(an, null); return true; }
    if ((b = e.target.closest('[data-al]'))) {
      var al2 = byId(b.getAttribute('data-al'));
      if (al2) openForm(assetById(al2.a), al2);
      return true;
    }
    return false;
  }

  /* ================================================================
     Центр уведомлений (🔔 в шапке)
     ================================================================ */
  var CT = 'active';
  function unseen() { var s = S.alertSeen || 0; return feed().filter(function (f) { return f.t > s; }).length; }
  function openCenter(tab) {
    shell('modal-alc', 'alc-sheet');
    CT = tab || (unseen() && !list().length ? 'fired' : CT);
    renderCenter(true);
    openModal('modal-alc');
    $('#modal-alc .sheet').scrollTop = 0;
    setTimeout(function () { S.alertSeen = now(); save(false); renderBadges(); }, 1200);
  }
  function renderCenter(full) {
    var m = $id('modal-alc'), sh = m && m.querySelector('.sheet');
    if (!sh) return;
    var act = list(), fd = feed(), nNew = unseen(), day = now() - 86400000;
    var coins = {};
    act.forEach(function (x) { coins[x.a] = 1; });
    var nOn = act.filter(function (x) { return x.on; }).length;
    var h = '<div class="sheet-head alc-head"><span class="alc-hico">' + ICO.bell + '</span><span class="alc-tt"><h2>' + esc(t('al_title')) + '</h2><p>' +
      esc(nNew ? t('al_c_sub', { a: nOn, n: nNew }) : t('al_c_sub0', { a: nOn })) + '</p></span>' +
      '<button type="button" class="icon-btn" data-alc="close" aria-label="' + esc(t('a11y_close')) + '">\u2715</button></div>';
    h += '<div class="alc-stats"><span><b class="mono">' + nOn + '</b><i>' + esc(t('al_st_active')) + '</i></span><span><b class="mono">' +
      fd.filter(function (f) { return f.t > day; }).length + '</b><i>' + esc(t('al_st_today')) + '</i></span><span><b class="mono">' + Object.keys(coins).length + '</b><i>' + esc(t('al_st_coins')) + '</i></span></div>';
    h += '<div class="seg al-seg alc-tabs">' +
      '<button type="button" data-alc-tab="active"' + (CT === 'active' ? ' class="active"' : '') + '>' + esc(t('al_c_active')) + ' <em class="mono">' + act.length + '</em></button>' +
      '<button type="button" data-alc-tab="fired"' + (CT === 'fired' ? ' class="active"' : '') + '>' + esc(t('al_c_fired')) + ' <em class="mono">' + fd.length + '</em>' + (nNew ? '<i class="alc-new"></i>' : '') + '</button></div>';
    h += '<div class="alc-body">' + (CT === 'active' ? activeHtml() : firedHtml()) + '</div>';
    h += comboHtml();
    sh.innerHTML = h;
    sh.classList.toggle('al-quiet', !full);
    patchCenter();
  }
  function activeHtml() {
    var groups = {}, order = [];
    sortAl(list()).forEach(function (al) {
      if (!assetById(al.a)) return;
      if (!groups[al.a]) { groups[al.a] = []; order.push(al.a); }
      groups[al.a].push(al);
    });
    if (!order.length) return '<div class="alc-empty"><span class="al-de-ico">' + ICO.bell + '</span><b>' + esc(t('al_c_empty')) + '</b><i>' + esc(t('al_c_empty_sub')) + '</i></div>';
    return order.map(function (id, gi) {
      var a = assetById(id);
      return '<div class="alc-grp" style="--i:' + gi + '"><button type="button" class="alc-gh" data-alc-coin="' + esc(id) + '"><img src="' + esc(img(a)) + '" alt="" draggable="false">' +
        '<span class="alc-gn"><b>' + esc(assetName(a)) + '</b><i>' + esc(a.ticker) + '</i></span><span class="alc-gp"><b class="mono" data-alc-px="' + esc(id) + '"></b><i class="mono" data-alc-chg="' + esc(id) + '"></i></span>' + ICO.chev + '</button>' +
        groups[id].map(function (al, i) { return cardHtml(al, a, i); }).join('') + '</div>';
    }).join('');
  }
  function firedHtml() {
    var fd = feed(), s = S.alertSeen || 0;
    if (!fd.length) return '<div class="alc-empty"><span class="al-de-ico">' + ICO.bell + '</span><b>' + esc(t('al_c_fempty')) + '</b></div>';
    return '<div class="alc-line">' + fd.map(function (f, i) {
      var a = assetById(f.a);
      if (!a) return '';
      var ki = f.k === 'news' ? catIco(f.cat) : f.k === 'move' ? ICO.move : f.k === 'lim' ? ICO.lim : ICO.bell;
      var cls = f.dir > 0 ? 'up' : f.dir < 0 ? 'dn' : 'flat';
      return '<div class="alc-it k-' + f.k + ' ' + cls + (f.t > s ? ' new' : '') + '"' + (f.k !== 'news' ? ' data-alc-coin="' + esc(f.a) + '" role="button" tabindex="0"' : '') + ' style="--i:' + Math.min(i, 12) + '">' +
        '<time class="mono">' + esc(hm(f.t)) + '</time><span class="alc-dot"></span>' +
        '<span class="alc-ib"><span class="alc-ik"><img src="' + esc(img(a)) + '" alt="" draggable="false"><i>' + ki + '</i></span>' +
        '<span class="alc-ix"><b>' + esc(f.title) + '</b><i>' + (f.k === 'news' ? impHtml(f.imp || 1) + esc(t('al_impn' + (f.imp || 1))) + ' \u00B7 ' : '') + esc(f.sub) + '</i></span></span></div>';
    }).join('') + '</div><button type="button" class="alc-clear" data-alc="clear">' + ICO.trash + '<span>' + esc(t('al_c_clear')) + '</span></button>';
  }
  function comboHtml() {
    if (typeof S === 'undefined' || (S.ach && S.ach.limit_alert_combo)) return '';
    var st = S.stats || {}, n = Date.now(), lim = n - (st.lastFillAt || 0) < 60000, al = n - (st.lastAlertAt || 0) < 60000;
    return '<div class="alc-combo"><span class="alc-cb-ico">' + ICO.combo + '</span><span class="alc-cb-tx"><b>' + esc(t('al_combo')) + '</b><i>' + esc(t('al_combo_d')) + '</i>' +
      '<span class="alc-cb-p"><em class="' + (lim ? 'ok' : '') + '">' + (lim ? '\u2713 ' : '') + esc(t('al_combo_lim')) + '</em><em class="' + (al ? 'ok' : '') + '">' + (al ? '\u2713 ' : '') + esc(t('al_combo_al')) + '</em></span></span></div>';
  }
  function patchCenter() {
    var m = $id('modal-alc');
    if (!m || m.classList.contains('hidden')) return;
    patchCards(m);
    $$('[data-alc-px]', m).forEach(function (el) {
      var a = assetById(el.getAttribute('data-alc-px'));
      if (!a) return;
      var tx = px(a, live(a));
      if (el.textContent !== tx) el.textContent = tx;
    });
    $$('[data-alc-chg]', m).forEach(function (el) {
      var a = assetById(el.getAttribute('data-alc-chg'));
      if (!a) return;
      var c = Engine.change(a, now());
      el.textContent = pct(c);
      el.className = 'mono ' + (c >= 0 ? 'up' : 'down');
    });
  }
  function bindCenter(m) {
    m.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-alc="close"]'))) { closeModal('modal-alc'); return; }
      if ((b = e.target.closest('[data-alc="clear"]'))) { S.alertFeed = []; S.alertSeen = now(); save(true); renderCenter(false); renderBadges(); return; }
      if ((b = e.target.closest('[data-alc-tab]'))) { CT = b.getAttribute('data-alc-tab'); renderCenter(false); return; }
      if (cardClick(e, m)) return;
      if ((b = e.target.closest('[data-alc-coin]'))) { goTrade(b.getAttribute('data-alc-coin')); return; }
    });
  }

  /* ================================================================
     Шапка, экран монеты, рынок
     ================================================================ */
  function renderBadges() {
    var n = unseen(), hb = $id('btn-alerts');
    if (hb) {
      var bd = hb.querySelector('.al-hb');
      var tx = n > 9 ? '9+' : String(n);
      if (bd && bd.textContent !== tx) { bd.textContent = tx; if (n) { bd.classList.remove('pop'); reflow(bd); bd.classList.add('pop'); } }
      hb.classList.toggle('has-new', n > 0);
      hb.classList.toggle('on', list().some(function (x) { return x.on; }));
    }
    var tb = $id('tr-bell');
    if (tb && onTrade()) {
      var c = countOn(tradeAssetId);
      tb.classList.toggle('on', c > 0);
      var tbd = tb.querySelector('.al-hb');
      if (!tbd) { tb.insertAdjacentHTML('beforeend', '<span class="al-hb" aria-hidden="true"></span>'); tbd = tb.querySelector('.al-hb'); }
      tbd.textContent = c > 9 ? '9+' : String(c);
      tb.classList.toggle('has-new', c > 0);
    }
  }
  function bellTap() {
    var a = onTrade() ? assetById(tradeAssetId) : null;
    if (!a) return;
    FX.pulse($id('tr-bell'), 'burst', 480);
    FX.vibrate(10);
    openForm(a, null);
  }
  /* «Ближайшие сигналы» на рынке — до трёх ценовых уровней, ближайших к цене. */
  var nearSig = '';
  function renderNear(force) {
    var box = $id('al-near');
    if (!box || typeof S === 'undefined') return;
    var items = list().filter(function (x) { return x.on && x.k === 'price' && assetById(x.a); }).map(function (x) {
      var a = assetById(x.a); return { al: x, a: a, d: Math.abs(x.p / live(a) - 1) };
    }).sort(function (x, y) { return x.d - y.d; }).slice(0, 3);
    var sig = items.map(function (x) { return x.al.id + ':' + x.al.p + ':' + x.al.rep; }).join('|') + LANG;
    if (force || sig !== nearSig) {
      nearSig = sig;
      box.classList.toggle('hidden', !items.length);
      box.innerHTML = '<div class="al-nr-h"><span class="v3-kicker">' + ICO.bell + esc(t('al_near')) + '</span><button type="button" class="al-nr-all" data-near-all>' + esc(t('al_all')) + ' <em class="mono">' + list().length + '</em></button></div>' +
        items.map(function (x, i) {
          return '<button type="button" class="al-nr" data-near="' + esc(x.a.id) + '" data-al-id="' + esc(x.al.id) + '" style="--i:' + i + '"><img src="' + esc(img(x.a)) + '" alt="" draggable="false">' +
            '<span class="al-nr-m"><b>' + esc(x.a.ticker) + ' <span class="' + (x.al.dir > 0 ? 'up' : 'down') + '">' + (x.al.dir > 0 ? ICO.up : ICO.dn) + '</span> <span class="mono">' + esc(px(x.a, x.al.p)) + '</span></b>' +
            '<i>' + esc(x.al.rep === 'each' ? t('al_each') : t('al_once')) + '</i></span>' +
            '<span class="al-nr-r"><b class="mono" data-near-d></b><i>' + esc(t('al_to_goal')) + '</i></span><span class="al-nr-bar"><i data-near-bar></i></span></button>';
        }).join('');
    }
    $$('[data-al-id]', box).forEach(function (row) {
      var al = byId(row.getAttribute('data-al-id')), a = al && assetById(al.a);
      if (!a) return;
      var p = live(a), d = $('[data-near-d]', row), bar = $('[data-near-bar]', row);
      if (d) d.textContent = pctU(al.p / p - 1);
      if (bar) bar.style.width = (progOf(al, p) * 100).toFixed(1) + '%';
    });
  }
  function syncRows() {
    var ls = $id('market-list');
    if (!ls) return;
    var on = {};
    list().forEach(function (x) { if (x.on) on[x.a] = 1; });
    $$('.asset-row', ls).forEach(function (r) {
      var h = !!on[r.getAttribute('data-asset')];
      if (r.classList.contains('has-al') !== h) r.classList.toggle('has-al', h);
    });
  }
  function liveUi() {
    renderBadges();
    if (onTrade() && typeof deskTab !== 'undefined' && deskTab === 'alerts') deskPatch();
    patchCenter();
    formLive();
    if (typeof currentTab !== 'undefined' && currentTab === 'market' && currentScreen === 'app-main') { renderNear(false); syncRows(); }
  }
  function refreshAll() {
    renderBadges();
    if (onTrade()) {
      try {
        if (typeof deskTab !== 'undefined' && deskTab === 'alerts') renderDesk(true); else renderDeskBadges();
      } catch (e) { dbg('al:desk', e); }
      redraw();
    }
    renderNear(true);
    syncRows();
    if (isOpen('modal-alc')) renderCenter(false);
  }

  /* ================================================================
     Старт
     ================================================================ */
  var READY = false;
  function afterLoad() {
    if (!Array.isArray(S.alerts)) S.alerts = [];
    if (!Array.isArray(S.alertFeed)) S.alertFeed = [];
    S.alerts = S.alerts.filter(function (x) { return x && x.id && assetById(x.a) && (x.k === 'price' ? x.p > 0 : x.k === 'move' ? x.pct > 0 && x.win > 0 : x.k === 'news'); });
    migrate();
    READY = true;
    refreshAll();
  }
  function init() {
    var hb = $id('btn-alerts');
    if (hb) hb.addEventListener('click', function () { FX.pulse(hb, 'burst', 480); openCenter(); });
    var dl = $id('al-list');
    if (dl) dl.addEventListener('click', function (e) { cardClick(e, dl); });
    var nr = $id('al-near');
    if (nr) nr.addEventListener('click', function (e) {
      if (e.target.closest('[data-near-all]')) { openCenter('active'); return; }
      var r = e.target.closest('[data-near]');
      if (r) openTrade(r.getAttribute('data-near'));
    });
    setInterval(function () { if (READY && !document.hidden) { try { tick(); } catch (e) { dbg('al:tick', e); } } }, 1000);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && PK) endPick(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    afterLoad: afterLoad, chartLevels: chartLevels, afterDraw: afterDraw, deskHtml: deskHtml, deskPatch: deskPatch,
    countOn: countOn, bell: bellTap, openCenter: openCenter, openForm: openForm, limitFilled: limitFilled,
    picking: function () { return !!PK; }, cancelPick: cancelPick, refresh: refreshAll
  };
})();
