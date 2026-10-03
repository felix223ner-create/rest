/* v3 — поведенческий слой вкладки «Меню» по concept/lobby.html.
   Карточка капитала (одометр, изменение за сутки, живой мини-график, полоса
   «свободно / в позициях / фьючерсы»), бонусы с летящими монетами, мини-колесо,
   цель по классу, бегущая строка цен и лента новостей, экран истории баланса.

   Источники истории — только реальные записи сейва:
     S.pfHistory   — снимки капитала (кривая за любой период);
     S.trades      — сделки и призы колеса (side: reward), последние 40;
     S.fut.hist    — закрытые фьючерсы;
     S.lbLog       — журнал этого слоя: ежедневный бонус, реклама, грант,
                     награда за класс, переводы спот ↔ фьючерсы. Раньше эти
                     операции нигде не записывались; журнал ведётся с момента
                     S.lbLogSince, и остаток «после операции» показываем только
                     там, где цепочка операций до текущего баланса полная. */
'use strict';

V3.i18n({
  ru: {
    lb_history: 'История', lb_open_hist: 'Капитал. Открыть историю баланса', lb_hist_title: 'История баланса',
    lb_in_pos: 'В позициях', lb_futures: 'Фьючерсы', lb_cap_now: 'Капитал сейчас', lb_back: 'Назад',
    lb_p_day: 'День', lb_p_week: 'Неделя', lb_p_month: 'Месяц', lb_p_all: 'Всё',
    lb_per_day: 'за 24 часа', lb_per_week: 'за неделю', lb_per_month: 'за 30 дней', lb_per_all: 'за всё время',
    lb_streak: 'Серия', lb_day1: 'день', lb_day2: 'дня', lb_day5: 'дней',
    lb_today_lbl: 'сегодня', lb_got: 'получено', lb_claim: 'Забрать бонус', lb_tomorrow: 'Завтра',
    lb_in: 'через', lb_max: 'макс', lb_week_aria: 'Серия ежедневных бонусов',
    lb_to_max: 'До максимума ещё', lb_max_daily: 'Максимальный бонус каждый день', lb_next_in: 'Следующий бонус через',
    lb_risk: 'Серия {n} сгорит через', lb_lost: 'Серия прервалась — начинаем заново с',
    lb_ad_every: 'каждые {n} мин', lb_ad_every1: 'каждую {n} минуту', lb_ad_every2: 'каждые {n} минуты', lb_ad_every5: 'каждые {n} минут', lb_watch: 'Смотреть',
    lb_fee_word: 'комиссия', lb_fee_toast1: 'Комиссия −{p}% на {n} сделку', lb_fee_toast2: 'Комиссия −{p}% на {n} сделки', lb_fee_toast5: 'Комиссия −{p}% на {n} сделок', lb_spin_free: 'Обычный · бесплатно', lb_spin_cd: 'Обычный · {t}', lb_spin_gold: 'Золотой спин',
    lb_goal_left: 'До «{n}» ещё {x}', lb_goal_max: 'Максимальный класс',
    lb_market_now: 'Рынок сейчас', lb_min: '{n} мин', lb_now: 'сейчас',
    lb_virtual: 'Все деньги в игре виртуальные · TradeUp',
    lb_wf_title: 'Из чего сложилось', lb_wf_start: 'Начало', lb_wf_bonus: 'Бонусы', lb_wf_trades: 'Сделки',
    lb_wf_market: 'Рынок', lb_wf_fees: 'Комиссии', lb_wf_now: 'Сейчас',
    lb_wf_note: 'Больше всего капитал изменили <b>{w}</b>: {x}. Бонусы — ежедневные, реклама, колесо и классы; рынок — изменение цены открытых позиций.',
    lb_wf_w_bonus: 'бонусы', lb_wf_w_trades: 'закрытые сделки', lb_wf_w_market: 'рынок',
    lb_wf_cov: 'Бонусы и переводы учитываются с {d}.',
    lb_f_all: 'Все', lb_f_bonus: 'Бонусы', lb_f_trade: 'Сделки', lb_f_fut: 'Фьючерсы',
    lb_op1: 'операция', lb_op2: 'операции', lb_op5: 'операций',
    lb_today: 'Сегодня', lb_yesterday: 'Вчера', lb_day_cap: 'капитал {x}',
    lb_more: 'Показать ещё', lb_more_n: 'Показать ещё {n} из {m}', lb_empty: 'За этот период операций нет',
    lb_op_start: 'Стартовый капитал', lb_op_daily: 'Ежедневный бонус', lb_op_ad: 'Бонус за рекламу',
    lb_op_grant: 'Грант новичка', lb_op_class: 'Новый класс «{n}»', lb_op_spin: 'Колесо удачи',
    lb_op_buy: 'Покупка {c}', lb_op_sell: 'Продажа {c}', lb_op_fin: 'Перевод на фьючерсы',
    lb_op_fout: 'Перевод с фьючерсов', lb_op_fclose: 'Фьючерс {c} · {s} {l}×', lb_long: 'лонг', lb_short: 'шорт',
    lb_s_start: 'регистрация', lb_s_ad: 'rewarded-видео', lb_s_grant: 'помощь новичку', lb_s_class: 'бонус за класс',
    lb_s_prize: 'приз {x}', lb_s_prize_c: 'приз {x} в {c}', lb_s_fin: 'спот → фьючерсы', lb_s_fout: 'фьючерсы → спот',
    lb_s_closed: 'позиция закрыта', lb_s_limit: 'лимит',
    lb_r_free: 'свободно {x}', lb_r_port: '≈ {x} · в портфель', lb_r_fut: 'на фьючерсах {x}',
    lb_k_qty: 'Количество', lb_k_price: 'Цена', lb_k_fee: 'Комиссия', lb_k_when: 'Когда', lb_k_pnl: 'P&L',
    lb_k_total: 'Сумма', lb_k_type: 'Ордер', lb_k_streak: 'Серия', lb_k_next: 'Следующий', lb_k_source: 'Источник',
    lb_k_prize: 'Приз', lb_k_rate: 'Курс', lb_k_class: 'Класс', lb_k_from: 'Откуда', lb_k_to: 'Куда',
    lb_k_dir: 'Направление', lb_k_lev: 'Плечо', lb_k_result: 'Итог', lb_k_entry: 'Вход', lb_k_exit: 'Выход',
    lb_v_ad: 'Реклама', lb_v_spot: 'Спот', lb_v_fut: 'Фьючерсы', lb_v_market: 'Рыночный', lb_v_limit: 'Лимитный',
    lb_v_long: 'Лонг', lb_v_short: 'Шорт', lb_v_in: 'через {n} мин'
  },
  en: {
    lb_history: 'History', lb_open_hist: 'Capital. Open balance history', lb_hist_title: 'Balance history',
    lb_in_pos: 'In positions', lb_futures: 'Futures', lb_cap_now: 'Capital now', lb_back: 'Back',
    lb_p_day: 'Day', lb_p_week: 'Week', lb_p_month: 'Month', lb_p_all: 'All',
    lb_per_day: 'in 24 hours', lb_per_week: 'this week', lb_per_month: 'in 30 days', lb_per_all: 'all time',
    lb_streak: 'Streak', lb_day1: 'day', lb_day2: 'days', lb_day5: 'days',
    lb_today_lbl: 'today', lb_got: 'claimed', lb_claim: 'Claim bonus', lb_tomorrow: 'Tomorrow',
    lb_in: 'in', lb_max: 'max', lb_week_aria: 'Daily bonus streak',
    lb_to_max: 'To max bonus:', lb_max_daily: 'Max bonus every day', lb_next_in: 'Next bonus in',
    lb_risk: 'Your {n} streak ends in', lb_lost: 'Streak lost — starting again from',
    lb_ad_every: 'every {n} min', lb_ad_every1: 'every {n} minute', lb_ad_every2: 'every {n} minutes', lb_ad_every5: 'every {n} minutes', lb_watch: 'Watch',
    lb_fee_word: 'fee', lb_fee_toast1: 'Fee −{p}% for {n} trade', lb_fee_toast2: 'Fee −{p}% for {n} trades', lb_fee_toast5: 'Fee −{p}% for {n} trades', lb_spin_free: 'Regular · free', lb_spin_cd: 'Regular · {t}', lb_spin_gold: 'Golden spin',
    lb_goal_left: '{x} more to «{n}»', lb_goal_max: 'Top class reached',
    lb_market_now: 'Market now', lb_min: '{n} min', lb_now: 'now',
    lb_virtual: 'All money in the game is virtual · TradeUp',
    lb_wf_title: 'What made it up', lb_wf_start: 'Start', lb_wf_bonus: 'Bonuses', lb_wf_trades: 'Trades',
    lb_wf_market: 'Market', lb_wf_fees: 'Fees', lb_wf_now: 'Now',
    lb_wf_note: 'Your capital moved most because of <b>{w}</b>: {x}. Bonuses are daily, ads, the wheel and classes; market is the price change of open positions.',
    lb_wf_w_bonus: 'bonuses', lb_wf_w_trades: 'closed trades', lb_wf_w_market: 'the market',
    lb_wf_cov: 'Bonuses and transfers are counted since {d}.',
    lb_f_all: 'All', lb_f_bonus: 'Bonuses', lb_f_trade: 'Trades', lb_f_fut: 'Futures',
    lb_op1: 'operation', lb_op2: 'operations', lb_op5: 'operations',
    lb_today: 'Today', lb_yesterday: 'Yesterday', lb_day_cap: 'capital {x}',
    lb_more: 'Show more', lb_more_n: 'Show {n} more of {m}', lb_empty: 'No operations in this period',
    lb_op_start: 'Starting capital', lb_op_daily: 'Daily bonus', lb_op_ad: 'Ad bonus',
    lb_op_grant: 'Rookie grant', lb_op_class: 'New class «{n}»', lb_op_spin: 'Lucky wheel',
    lb_op_buy: 'Buy {c}', lb_op_sell: 'Sell {c}', lb_op_fin: 'Transfer to futures',
    lb_op_fout: 'Transfer from futures', lb_op_fclose: 'Futures {c} · {s} {l}×', lb_long: 'long', lb_short: 'short',
    lb_s_start: 'sign-up', lb_s_ad: 'rewarded video', lb_s_grant: 'rookie help', lb_s_class: 'class bonus',
    lb_s_prize: 'prize {x}', lb_s_prize_c: 'prize {x} in {c}', lb_s_fin: 'spot → futures', lb_s_fout: 'futures → spot',
    lb_s_closed: 'position closed', lb_s_limit: 'limit',
    lb_r_free: 'free {x}', lb_r_port: '≈ {x} · to portfolio', lb_r_fut: 'on futures {x}',
    lb_k_qty: 'Quantity', lb_k_price: 'Price', lb_k_fee: 'Fee', lb_k_when: 'When', lb_k_pnl: 'P&L',
    lb_k_total: 'Amount', lb_k_type: 'Order', lb_k_streak: 'Streak', lb_k_next: 'Next', lb_k_source: 'Source',
    lb_k_prize: 'Prize', lb_k_rate: 'Rate', lb_k_class: 'Class', lb_k_from: 'From', lb_k_to: 'To',
    lb_k_dir: 'Direction', lb_k_lev: 'Leverage', lb_k_result: 'Result', lb_k_entry: 'Entry', lb_k_exit: 'Exit',
    lb_v_ad: 'Ad', lb_v_spot: 'Spot', lb_v_fut: 'Futures', lb_v_market: 'Market', lb_v_limit: 'Limit',
    lb_v_long: 'Long', lb_v_short: 'Short', lb_v_in: 'in {n} min'
  }
});

/* Журнал бонусов и переводов пишется в облачный сейв вместе с остальными ключами. */
if (typeof SAVE_KEYS !== 'undefined' && SAVE_KEYS.indexOf('lbLog') < 0) SAVE_KEYS.push('lbLog', 'lbLogSince');

var V3L = (function () {
  var DAY = 86400000;
  var LOG_MAX = 150;
  var BONUS = { start: 1, daily: 1, ad: 1, grant: 1, class: 1, spin: 1, quest: 1 };
  var TRADE = { buy: 1, sell: 1 };
  var FUT = { fin: 1, fout: 1, fclose: 1 };
  var LOGO = 'img/logo-small.png?v=139';

  function el(id) { return document.getElementById(id); }
  function D(ms) { return V3.D(ms); }
  function later(ms, fn) { return setTimeout(fn, D(ms)); }
  function reflow(x) { return x && x.offsetWidth; }
  function restart(x, cls) { if (!x) return; x.classList.remove(cls); reflow(x); x.classList.add(cls); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return V3.esc(s); }
  function lobbyOn() { return currentTab === 'lobby' && currentScreen === 'app-main' && !document.hidden; }

  /* ---------------- Форматирование ---------------- */

  function m0(v) { return money(v, 0); }
  function sgn(v, dec) { return (v < 0 ? '\u2212' : '+') + money(Math.abs(v), dec == null ? 0 : dec); }
  function pctS(v) { return (v < 0 ? '\u2212' : '+') + Math.abs(v * 100).toFixed(Math.abs(v) < 0.1 ? 2 : 1) + '%'; }
  function trim1(v) { return String(Math.round(v * 10) / 10); }
  function compact(v, signed) {
    var a = Math.abs(v);
    var s = a >= 1e6 ? trim1(a / 1e6) + 'M' : a >= 1e3 ? trim1(a / 1e3) + 'K' : String(Math.round(a));
    return (signed ? (v < 0 ? '\u2212' : '+') : (v < 0 ? '\u2212' : '')) + '$' + s;
  }
  function qtyS(q) { return q >= 100 ? q.toFixed(1) : q >= 1 ? q.toFixed(3) : q.toFixed(6); }
  function pxS(a, p) { return money(p, a && a.dec != null ? a.dec : 2); }
  function loc() { return LANG === 'ru' ? 'ru-RU' : 'en-US'; }
  function hm(ts) { var d = new Date(ts); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function sod(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayTitle(ts) {
    var d0 = sod(Date.now());
    if (ts >= d0) return t('lb_today');
    if (ts >= d0 - DAY) return t('lb_yesterday');
    try { return new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'long' }); } catch (e) { return new Date(ts).toDateString(); }
  }
  function whenS(ts) {
    try { return new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) + ', ' + hm(ts); } catch (e) { return hm(ts); }
  }
  function plural(n, base) {
    var f = 5;
    if (LANG === 'ru') {
      var a = Math.abs(n) % 100, b = a % 10;
      f = a > 10 && a < 20 ? 5 : b === 1 ? 1 : b > 1 && b < 5 ? 2 : 5;
    } else f = Math.abs(n) === 1 ? 1 : 5;
    return t(base + f);
  }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    if (s >= 3600) return fmtDuration(ms);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function clsName(c) { return c ? (c.name[LANG] || c.name.en) : ''; }
  function coinSrc(a) { return a ? (a.img || ('img/coins/' + a.id + '.png')) : ''; }

  var P = {
    check: '<path d="M11 25l9 9 17-19"/>',
    gift: '<rect x="9" y="18" width="30" height="21" rx="3"/><path d="M6 13h36v6H6zM24 13v26"/><path d="M24 13c-3-6-10-6-10-1s10 1 10 1zM24 13c3-6 10-6 10-1s-10 1-10 1z"/>',
    play: '<rect x="6" y="10" width="36" height="28" rx="6"/><path d="M21 18l10 6-10 6z" fill="currentColor"/>',
    wheel: '<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="3.5"/><path d="M24 8v12.5M24 27.5V40M8 24h12.5M27.5 24H40M12.7 12.7l8.8 8.8M26.5 26.5l8.8 8.8M35.3 12.7l-8.8 8.8M21.5 26.5l-8.8 8.8"/>',
    swap: '<path d="M10 17h26l-7-7M38 31H12l7 7"/>',
    clock: '<circle cx="24" cy="24" r="16"/><path d="M24 15v10l6 4"/>',
    lock: '<rect x="11" y="21" width="26" height="19" rx="4" fill="currentColor"/><path d="M16 21v-5a8 8 0 0 1 16 0v5"/>',
    flame: '<path d="M24 42c-7 0-12-5-12-11 0-5 3-8 5-11 1 2 2 4 5 4-1-5 1-11 6-14-1 6 8 9 8 19 0 8-5 13-12 13z"/>',
    plus: '<path d="M24 12v24M12 24h24"/>',
    minus: '<path d="M12 24h24"/>',
    shield: '<path d="M24 6l14 5v11c0 9-6 16-14 20-8-4-14-11-14-20V11z"/><path d="M18 24l5 5 8-9"/>',
    back: '<path d="M30 36L18 24l12-12"/>'
  };
  function ic(name, sw) {
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="' + (sw || 3.4) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.check) + '</svg>';
  }

  /* ---------------- Кривая капитала (S.pfHistory) ---------------- */

  /* Точки истории + стартовый капитал в момент регистрации (если он раньше
     первого снимка): тогда «Всё» начинается честно со стартовой суммы. */
  function points() {
    var h = Array.isArray(S.pfHistory) ? S.pfHistory : [];
    var c0 = Number(S.createdAt) || 0;
    if (c0 && (!h.length || c0 < h[0].t - 1000)) return [{ t: c0, cap: Number(S.startBalance) || CONFIG.startBalance }].concat(h);
    return h;
  }
  function firstT() { var p = points(); return p.length ? p[0].t : Date.now() - 60000; }
  function valAt(t, pts, capNow) {
    pts = pts || points();
    var now = Date.now(), cap = capNow != null ? capNow : capital(), n = pts.length;
    if (t >= now || !n) return cap;
    if (t <= pts[0].t) return pts[0].cap;
    var last = pts[n - 1];
    if (t >= last.t) return last.cap + (cap - last.cap) * (t - last.t) / Math.max(1, now - last.t);
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (pts[mid].t <= t) lo = mid; else hi = mid; }
    var a = pts[lo], b = pts[hi];
    return a.cap + (b.cap - a.cap) * (t - a.t) / Math.max(1, b.t - a.t);
  }
  var PER = { day: DAY, week: 7 * DAY, month: 30 * DAY, all: Infinity };
  function perT0(p) {
    var now = Date.now(), f = Math.min(firstT(), now - 60000);
    return p === 'all' ? f : Math.max(f, now - PER[p]);
  }
  function series(t0, n) {
    var pts = points(), cap = capital(), now = Date.now(), out = [];
    for (var k = 0; k < n; k++) out.push(valAt(t0 + (now - t0) * k / (n - 1), pts, cap));
    return out;
  }

  /* ---------------- Журнал операций ---------------- */

  /* Нетронутый аккаунт — журнал полный с регистрации; иначе — с момента
     первого запуска этой версии (что было раньше, мы не знаем). */
  function ledger() {
    if (!Array.isArray(S.lbLog)) {
      S.lbLog = [];
      var fresh = !S.trades.length && !Object.keys(S.positions).length && Math.abs(S.balance - S.startBalance) < 0.01;
      S.lbLogSince = fresh ? (Number(S.createdAt) || Date.now()) : Date.now();
    }
    if (!S.lbLogSince) S.lbLogSince = Date.now();
    return S.lbLog;
  }
  var seq = 0;
  function log(k, amt, extra) {
    var L = ledger(), ts = Date.now();
    var e = { id: 'lg_' + ts + '_' + (++seq), t: ts, k: k, amt: Math.round(amt * 100) / 100 };
    if (extra) for (var x in extra) e[x] = extra[x];
    L.unshift(e);
    if (L.length > LOG_MAX) L.length = LOG_MAX;
    if (rc && rc.s === S) rc.bal += amt;
    if (!e.hide) noteNew(1);
    return e;
  }

  /* Сверка баланса раз в тик: изменение S.balance, которое не объясняется
     новыми сделками и журналом, при встречном движении фьючерсного
     кошелька — перевод спот ↔ фьючерсы (futures.js его не записывает). */
  var rc = null;
  function futCash() { try { return typeof Fut !== 'undefined' && Fut.cash ? Fut.cash() : 0; } catch (e) { return 0; } }
  function tradeCash(tr) {
    if (tr.side === 'buy') return -(tr.total || 0);
    if (tr.side === 'sell') return (tr.total || 0) - (tr.fee || 0);
    if (tr.side === 'reward') return tr.id ? 0 : (tr.total || 0);
    return 0;
  }
  function reconcile() {
    if (currentScreen === 'scr-loading' || currentScreen === 'scr-nick') return;
    ledger();
    var top = S.trades[0] ? S.trades[0].tid : null, fc = futCash();
    if (!rc || rc.s !== S) { rc = { s: S, bal: S.balance, fc: fc, top: top }; return; }
    var exp = 0, fresh = 0;
    if (top !== rc.top) {
      for (var i = 0; i < S.trades.length && S.trades[i].tid !== rc.top; i++) { exp += tradeCash(S.trades[i]); fresh++; }
    }
    var d = S.balance - rc.bal - exp, df = fc - rc.fc;
    rc.bal = S.balance; rc.fc = fc; rc.top = top;
    if (fresh) noteNew(fresh);
    if (Math.abs(d) > 0.005) {
      if (Math.abs(d + df) < 0.02) log(d < 0 ? 'fin' : 'fout', Math.abs(d), { fut: Math.round(fc * 100) / 100 });
      else log('adj', d, { hide: 1 });
      rc.bal = S.balance;
      saveState(false);
    }
  }

  var opsCache = { sig: '', list: [] };
  function opsSig() {
    var L = S.lbLog || [], fh = S.fut && S.fut.hist ? S.fut.hist : [];
    return [S.trades.length, S.trades[0] && S.trades[0].tid, L.length, L[0] && L[0].id, fh.length, fh[0] && fh[0].t, S.createdAt, LANG].join('|');
  }
  /* Все операции, свежие сверху, с остатком свободных денег после каждой. */
  function ops() {
    var sig = opsSig();
    if (sig === opsCache.sig) return opsCache.list;
    var out = [];
    S.trades.forEach(function (tr) {
      var a = tr.id ? assetById(tr.id) : null;
      if (tr.side === 'buy' || tr.side === 'sell') {
        out.push({ id: tr.tid, t: tr.t, k: tr.side, a: a, qty: tr.qty, price: tr.price, total: tr.total, fee: tr.fee || 0,
          pnl: tr.pnl, kind: tr.kind, cash: tradeCash(tr) });
      } else if (tr.side === 'reward') {
        out.push({ id: tr.tid, t: tr.t, k: 'spin', a: a, qty: tr.qty, usd: tr.total || 0, cash: tradeCash(tr),
          price: a && tr.qty ? (tr.total || 0) / tr.qty : 0 });
      }
    });
    (S.lbLog || []).forEach(function (e) {
      var cash = e.k === 'fin' ? -e.amt : e.amt;
      out.push({ id: e.id, t: e.t, k: e.k, usd: e.amt, cash: cash, streak: e.streak, cls: e.cls, fut: e.fut, hide: e.hide, src: e.src });
    });
    var fh = S.fut && Array.isArray(S.fut.hist) ? S.fut.hist : [];
    fh.forEach(function (h, i) {
      out.push({ id: 'fh_' + h.t + '_' + i, t: h.t, k: 'fclose', a: assetById(h.a), side: h.side, lev: h.lev, pnl: h.pnl || 0,
        roe: h.roe || 0, reason: h.reason, entry: h.entry, exit: h.exit, part: h.part, cash: 0 });
    });
    if (S.createdAt) out.push({ id: 'start', t: Number(S.createdAt), k: 'start', usd: Number(S.startBalance) || CONFIG.startBalance, cash: 0 });
    out.sort(function (x, y) { return y.t - x.t; });

    /* Остаток восстанавливаем назад от текущего баланса. Цепочка честная
       только внутри покрытия: журнал ведётся с lbLogSince, сделок — 40. */
    var cov = Number(S.lbLogSince) || Date.now();
    if (S.trades.length >= 40) cov = Math.max(cov, S.trades[S.trades.length - 1].t);
    if ((S.lbLog || []).length >= LOG_MAX) cov = Math.max(cov, S.lbLog[S.lbLog.length - 1].t);
    var cur = S.balance;
    out.forEach(function (o) {
      if (o.k === 'start') { o.after = o.usd; return; }
      if (o.t >= cov) o.after = cur;
      cur -= o.cash;
    });
    opsCache = { sig: sig, list: out.filter(function (o) { return !o.hide; }), cov: cov };
    return opsCache.list;
  }
  function coverage() { ops(); return opsCache.cov; }

  /* ---------------- Монеты и всплывающие суммы ---------------- */

  var fxLayer = null;
  function layer() {
    if (!fxLayer || !fxLayer.isConnected) { fxLayer = document.createElement('div'); fxLayer.className = 'lb-fx'; document.body.appendChild(fxLayer); }
    return fxLayer;
  }
  function capTarget() { return H.open ? el('v3h-num') : el('lobby-capital'); }
  function flyCoins(from, to, n, done, cls) {
    if (V3.reduced() || !from || !to || !from.getClientRects().length) { done(); return; }
    var f = from.getBoundingClientRect(), g = to.getBoundingClientRect(), host = layer(), landed = 0;
    var fx = f.left + f.width / 2, fy = f.top + f.height / 2, gx = g.left + Math.min(g.width, 160) / 2, gy = g.top + g.height / 2;
    for (var k = 0; k < n; k++) (function (k) {
      var c = document.createElement('i');
      c.className = 'lb-coin' + (cls ? ' ' + cls : '');
      host.appendChild(c);
      var sx = fx + (Math.random() - 0.5) * Math.min(80, f.width * 0.6), sy = fy + (Math.random() - 0.5) * Math.min(30, f.height * 0.4);
      var tx = gx + (Math.random() - 0.5) * 60, ty = gy + (Math.random() - 0.5) * 8;
      var cx = (sx + tx) / 2 + (Math.random() - 0.5) * 160, cy = Math.min(sy, ty) - 40 - Math.random() * 90;
      var ph = Math.random() * 6, dur = 640 + Math.random() * 260;
      c.style.transform = 'translate(' + sx + 'px,' + sy + 'px) scale(0)';
      setTimeout(function () {
        V3.tween(dur, function (p) {
          var e = V3.easeInOut(p), u = 1 - e;
          var x = u * u * sx + 2 * u * e * cx + e * e * tx, y = u * u * sy + 2 * u * e * cy + e * e * ty;
          var s = p < 0.12 ? p / 0.12 * 1.15 : p > 0.85 ? 1 - (p - 0.85) / 0.15 * 0.5 : 1.15 - (p - 0.12) * 0.2;
          c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (s * Math.abs(Math.cos(p * 9 + ph))).toFixed(3) + ',' + s.toFixed(3) + ')';
        }, function () {
          if (c.parentNode) c.parentNode.removeChild(c);
          landed++;
          if (landed % 3 === 1) restart(to, 'land');
          if (landed === n) done();
        });
      }, k * 42);
    })(k);
  }
  function floatAt(anchor, txt) {
    if (!anchor || V3.reduced()) return;
    var r = (anchor.querySelector('.odo') || anchor).getBoundingClientRect();
    var f = document.createElement('span');
    f.className = 'lb-float mono';
    f.textContent = txt;
    f.style.left = clamp(r.right - 40, 12, window.innerWidth - 150) + 'px';
    f.style.top = (r.top - 18) + 'px';
    layer().appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, D(1350) + 50);
  }

  /* ---------------- Капитал: одометр, изменение, мини-график ---------------- */

  var hold = 0, lastBal = null, sparkAt = 0, odoAt = 0;
  function fmtCap(v) { return money(v, 2); }
  /* Кадр из rafLoop (через updateCapitalText): одометр сам докручивает
     цифры, вспышка — только на событиях (сделка, бонус), не на тиках цены.
     Тики цены берём не чаще раза в 1.6 с: иначе копейки крутятся без остановки. */
  function capFrame(force) {
    var e = el('lobby-capital');
    if (!e || hold > Date.now()) return;
    var ev = force === true || (lastBal != null && Math.abs(S.balance - lastBal) > 0.009);
    if (!ev && e.__odoTxt && Date.now() - odoAt < 1600) return;
    odoAt = Date.now();
    var cap = capital();
    lastBal = S.balance;
    V3.odo(e, cap, { fmt: fmtCap, flash: ev });
    if (H.open) V3.odo(el('v3h-num'), cap, { fmt: fmtCap, flash: ev });
  }
  function holdCap(on) {
    hold = on ? Date.now() + 3000 : 0;
    if (!on) { capFrame(true); renderMoney('event'); }
  }
  function renderSpark(draw) {
    var svg = el('lb-spark');
    if (!svg) return;
    var r = svg.getBoundingClientRect(), w = Math.max(60, Math.round(r.width) || 150), h = 40;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var now = Date.now(), t0 = Math.max(now - DAY, perT0('day')), n = 60, vals = series(t0, n);
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = mx - mn || 1;
    var pts = vals.map(function (v, k) { return [k / (n - 1) * (w - 6), 5 + (1 - (v - mn) / rg) * (h - 10)]; });
    if (mx - mn < 0.01) pts.forEach(function (p) { p[1] = h / 2; });
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
    var line = svg.querySelector('path.l'), fill = svg.querySelector('path.f'), dot = svg.querySelector('.dot'), ping = svg.querySelector('.ping');
    line.setAttribute('d', d);
    line.setAttribute('pathLength', '100');
    fill.setAttribute('d', d + 'L' + (w - 6) + ' ' + h + 'L0 ' + h + 'Z');
    var end = pts[n - 1];
    [dot, ping].forEach(function (c) { c.setAttribute('cx', end[0].toFixed(1)); c.setAttribute('cy', end[1].toFixed(1)); });
    if (draw && line.animate && !V3.reduced()) {
      line.style.strokeDasharray = '100';
      line.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: D(1300), delay: D(250), easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)', fill: 'backwards' });
      fill.animate([{ opacity: 0 }, { opacity: 0.9 }], { duration: D(700), delay: D(900), fill: 'backwards' });
      [dot, ping].forEach(function (c) { c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D(300), delay: D(1450), fill: 'backwards' }); });
    }
    sparkAt = now;
  }
  function setChg(pill, txtEl, ch, base) {
    if (!pill) return;
    pill.classList.toggle('neg', ch < -0.004);
    txtEl.textContent = sgn(ch, 0) + ' \u00b7 ' + pctS(base > 0 ? ch / base : 0);
  }
  function renderMoney(mode) {
    if (!el('lb-bal-card')) return;
    var cap = capital(), ago = valAt(Math.max(Date.now() - DAY, perT0('day')));
    setChg(el('lb-chg'), el('lb-chg-t'), cap - ago, ago);
    if (hold > Date.now() && mode !== 'intro') return;
    var cash = Math.max(0, S.balance), spot = invested(), fut = Math.max(0, futEquity()), tot = cash + spot + fut || 1;
    var set = function () {
      el('lb-sb-c').style.flexBasis = (cash / tot * 100).toFixed(2) + '%';
      el('lb-sb-s').style.flexBasis = (spot / tot * 100).toFixed(2) + '%';
      el('lb-sb-f').style.flexBasis = (fut / tot * 100).toFixed(2) + '%';
    };
    if (mode === 'intro') {
      ['lb-sb-c', 'lb-sb-s', 'lb-sb-f'].forEach(function (id) { var i = el(id); i.style.transition = 'none'; i.style.flexBasis = '0%'; reflow(i); i.style.transition = ''; });
      later(380, set);
    } else set();
    var ms = mode === 'intro' ? 1000 : mode === 'event' ? 600 : 0;
    [['lobby-free', cash], ['lobby-invested', spot], ['lobby-fut', fut]].forEach(function (x) {
      var b = el(x[0]);
      if (!b) return;
      var prev = b.__v3v;
      if (mode === 'intro') b.__v3v = 0;
      V3.countTo(b, x[1], m0, ms);
      if (mode === 'event' && prev != null && Math.abs(prev - x[1]) > 0.5) restart(b, 'bump');
    });
    if (mode !== 'tick' || Date.now() - sparkAt > 4000) renderSpark(mode === 'intro');
    renderGoal(mode === 'intro' ? 'intro' : null);
  }

  /* ---------------- Ежедневный бонус ---------------- */

  function rewardFor(s) {
    return Math.min(CONFIG.dailyBase + Math.max(0, Math.min(s - 1, 10) * CONFIG.dailyStreakStep), CONFIG.dailyMax);
  }
  /* День серии, с которого бонус максимальный (формула выше: не дальше 11-го). */
  function maxDay() {
    var st = CONFIG.dailyStreakStep > 0 ? Math.ceil((CONFIG.dailyMax - CONFIG.dailyBase) / CONFIG.dailyStreakStep) + 1 : 1;
    return clamp(st, 1, 11);
  }
  var GIFT_D = 'img/daily-gift-dark.png?v=1', GIFT_L = 'img/daily-gift-light.png?v=1';
  var RISK_MS = 6 * 3600 * 1000;   // за 6 ч до полуночи предупреждаем, что серия сгорит
  /* dailyHold: пока монеты бонуса летят в капитал, карточка остаётся в
     прежнем виде (кнопка неактивна); «печать» и таймер — по приземлении. */
  var stampNext = false, dailyHold = false;
  function renderDaily(mode) {
    var box = el('daily-box');
    if (!box || dailyHold) return;
    if (stampNext) { mode = 'claim'; stampNext = false; }
    var st = YaGame.serverTime(), today = dayKey(st), claimed = S.dailyDay === today;
    var alive = claimed || S.dailyDay === dayKey(st - DAY);
    var prior = claimed ? S.streak - 1 : (alive ? S.streak : 0);
    var payS = claimed ? S.streak - 1 : S.streak;
    var s = claimed ? S.streak : prior;
    var lost = !claimed && !alive && S.streak > 1 && !!S.dailyDay;
    var sEl = el('daily-streak');
    sEl.className = 'lb-dl-streak' + (s > 0 ? '' : ' zero') + (mode === 'claim' ? ' flip' : '');
    sEl.innerHTML = ic('flame', 3) + (s > 0 ? esc(t('lb_streak')) + ' <b>' + s + ' ' + esc(plural(s, 'lb_day')) + '</b>' : esc(t('daily_streak_zero')));
    var gift = el('lb-gift');
    gift.classList.toggle('done', claimed);
    gift.classList.toggle('idle', !claimed);
    var todayAmt = claimed ? rewardFor(payS) : dailyReward();
    var da = el('lb-daily-amt');
    da.classList.toggle('done', claimed);
    da.innerHTML = '<b class="mono">' + m0(todayAmt) + '</b><span>' + esc(t(claimed ? 'lb_got' : 'lb_today_lbl')) + '</span>';
    if (mode === 'claim') restart(da, 'bump');
    var sOf = function (o) { return alive ? payS + o : (o > 0 ? o : 0); };

    /* Полоса серии до максимума. */
    var MD = maxDay(), have = Math.min(MD, claimed ? S.streak : prior), left = MD - have;
    var pg = el('lb-dl-prog');
    if (pg) {
      var bar = '';
      for (var i = 1; i <= MD; i++) bar += '<i class="' + (i <= have ? 'on' : (i === have + 1 ? 'next' : '')) + (mode === 'claim' && i === have ? ' pop' : '') + '"></i>';
      pg.innerHTML = '<div class="lb-dl-prog-h"><span>' + (left > 0 ? esc(t('lb_to_max')) + ' <b>' + left + ' ' + esc(plural(left, 'lb_day')) + '</b>' : esc(t('lb_max_daily'))) +
        '</span><span class="mx mono">' + esc(t('lb_max')) + ' ' + m0(CONFIG.dailyMax) + '</span></div>' +
        '<div class="lb-dl-bar" style="grid-template-columns:repeat(' + MD + ',1fr)">' + bar + '</div>';
    }

    if (claimed) {
      var lt = msUntilTomorrow(st);
      box.innerHTML = '<div class="lb-dl-cd' + (mode === 'claim' ? ' in' : '') + '">' +
        '<svg class="lb-dl-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="tr" cx="18" cy="18" r="15.9"/><circle class="pr" id="daily-ring" cx="18" cy="18" r="15.9" pathLength="100" style="stroke-dashoffset:' + (100 - clamp(lt / DAY, 0, 1) * 100).toFixed(2) + '"/></svg>' +
        '<span class="lb-dl-cd-t">' + esc(t('lb_next_in')) + '<b class="mono" id="daily-timer">' + fmtDuration(lt) + '</b></span>' +
        '<span class="lb-dl-cd-amt mono"><img alt="" src="' + GIFT_L + '" draggable="false">' + m0(rewardFor(sOf(1))) + '</span></div>';
    } else {
      var risk = alive && prior > 0 && msUntilTomorrow(st) < RISK_MS;
      box.innerHTML = '<button type="button" id="daily-btn" class="lb-btn lb-gold lb-dl-btn">' + ic('gift', 3.4) + '<span>' + esc(t('lb_claim')) + '</span><em class="mono">' + m0(todayAmt) + '</em></button>' +
        (risk ? '<div class="lb-dl-warn">' + ic('clock', 3.6) + '<span>' + esc(t('lb_risk', { n: prior + ' ' + plural(prior, 'lb_day') })) + ' <b class="mono" id="daily-risk">' + fmtDuration(msUntilTomorrow(st)) + '</b></span></div>' : '') +
        (lost ? '<div class="lb-dl-lost">' + ic('flame', 3) + '<span>' + esc(t('lb_lost')) + ' <b class="mono">' + m0(CONFIG.dailyBase) + '</b></span></div>' : '');
      el('daily-btn').onclick = claimDaily;
    }
    var h = '', maxShown = rewardFor(sOf(0)) >= CONFIG.dailyMax;
    for (var o = -3; o <= 3; o++) {
      var got = o < 0 ? prior >= -o : (o === 0 && claimed);
      var amt = o === 0 ? todayAmt : rewardFor(sOf(o));
      var fut = o > 0;
      var cls = 'lb-wd' + (got ? ' got' : '') + (o === 0 ? ' today' : '') + (fut ? ' fut' : '') + (o < 0 && !got ? ' miss' : '') +
        (o === 0 && mode === 'claim' ? ' stamp' : '') + (mode === 'intro' ? ' in' : '');
      var mx = '';
      if (fut && amt >= CONFIG.dailyMax && !maxShown) { mx = ' data-max="' + esc(t('lb_max')) + '"'; maxShown = true; }
      var wd = '';
      try { wd = new Date(st + o * DAY).toLocaleDateString(loc(), { weekday: 'short', timeZone: 'UTC' }).replace('.', ''); } catch (e) { wd = ''; }
      var src = fut || (o < 0 && !got) ? GIFT_D : GIFT_L;
      h += '<div class="' + cls + '"' + mx + ' style="--d:' + (420 + (o + 3) * 55) + '"' + (o === 0 ? ' aria-current="date"' : '') + '><span>' + esc(wd) +
        '</span><span class="lb-wd-g"><img alt="" src="' + src + '" draggable="false">' + (got ? '<i>' + ic('check', 6) + '</i>' : '') + '</span>' +
        '<b class="mono">' + m0(amt) + '</b>' + (fut ? '<span class="lb-wd-lock" aria-hidden="true">' + ic('lock', 3.6) + '</span>' : '') + '</div>';
    }
    el('lb-week').innerHTML = h;
    if (mode === 'claim' && S.streak > 1) later(380, function () { Snd.play('streak'); });
  }

  /* ---------------- Реклама ---------------- */

  var adSt = '';
  function renderAd(mode) {
    var btn = el('ad-btn');
    if (!btn) return;
    var cd = CONFIG.adCooldown * 1000, left = cd - (YaGame.serverTime() - S.lastAdAt), ready = left <= 0;
    var adv = el('lb-adv');
    adv.classList.toggle('cool', !ready);
    adv.classList.toggle('idle', ready);
    el('lb-ad-ring').style.strokeDashoffset = ready ? '100' : (100 - clamp(left / cd, 0, 1) * 100).toFixed(2);
    var adMin = Math.round(CONFIG.adCooldown / 60), sub = el('lb-ad-sub');
    var subTxt = plural(adMin, 'lb_ad_every').replace('{n}', adMin);
    if (sub.textContent !== subTxt) sub.textContent = subTxt;
    var want = (ready ? 'r' : 'c') + LANG;
    if (adSt !== want || mode === 'force' || mode === 'claim') {
      var wasCool = adSt.charAt(0) === 'c';
      adSt = want;
      el('lb-ad-amt').textContent = ready ? '+' + m0(CONFIG.adReward) : '';
      el('lb-ad-amt').style.display = ready ? '' : 'none';
      btn.disabled = !ready;
      if (ready) {
        btn.className = 'lb-btn lb-gold';
        btn.innerHTML = ic('play', 3.4) + '<span>' + esc(t('lb_watch')) + '</span>';
        if (wasCool && mode === 'tick') {
          restart(adv, 'pop');
          if (btn.animate && !V3.reduced()) btn.animate([{ transform: 'scale(0.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: D(420), easing: 'cubic-bezier(0.34, 1.5, 0.55, 1)' });
        }
      } else {
        btn.className = 'lb-cd' + (mode === 'claim' ? ' in' : '');
        btn.innerHTML = ic('clock', 3.6) + '<span>' + esc(t('available_in')) + ' <b class="mono" id="lb-ad-cd">' + mmss(left) + '</b></span>';
      }
    } else if (!ready) {
      var c = el('lb-ad-cd');
      if (c) c.textContent = mmss(left);
    }
  }

  /* ---------------- Колесо: мини-версия в карточке ---------------- */

  /* true — колесо крутится прямо в карточке (concept/lobby.html), экран
     колеса открывается только тапом по мини-колесу. Игроки не находили
     экран, поэтому кнопка снова ведёт на него: мини-колесо делает короткий
     раскрут, и открывается большое колесо на режиме, показанном в карточке. */
  var IN_CARD_SPIN = false;
  var W = { mode: '', lang: '', rot: 0, bulbT: 0, n: 7, busy: false, flipAt: 0 };
  function wp(a, r) { var q = a * Math.PI / 180; return (60 + r * Math.sin(q)).toFixed(2) + ' ' + (60 - r * Math.cos(q)).toFixed(2); }
  /* Сектор i центрирован на угле i·a: при повороте 0 под стрелкой — центр сектора 0. */
  function secPath(i, n, r) {
    var a = 360 / n;
    return 'M60 60 L' + wp(i * a - a / 2, r) + ' A' + r + ' ' + r + ' 0 0 1 ' + wp(i * a + a / 2, r) + 'Z';
  }
  function spinSecs(mode) { var c = spinCfg(); return (mode === 'vip' ? c.vipSectors : c.freeSectors) || c.sectors || []; }
  function underPtr(rot, n) { var a = 360 / n; return ((Math.round((((-rot) % 360) + 360) % 360 / a)) % n + n) % n; }
  /* Секторы и палитра — те же, что на экране колеса (CONFIG.spin). */
  function buildWheel(mode) {
    var svg = el('lb-wheel');
    if (!svg) return;
    var cfg = spinCfg(), vip = mode === 'vip';
    var list = spinSecs(mode);
    var cols = (vip ? cfg.vipColors : cfg.freeColors) || [];
    var n = Math.max(1, list.length), a = 360 / n, h = '';
    W.n = n;
    h += '<defs><linearGradient id="lb-wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f0c04d"/><stop offset="1" stop-color="#b8841c"/></linearGradient></defs>';
    h += '<circle class="rim" cx="60" cy="60" r="58"/>';
    for (var b = 0; b < 14; b++) { var bp = wp(b * 360 / 14, 54.5).split(' '); h += '<circle class="bulb" cx="' + bp[0] + '" cy="' + bp[1] + '" r="1.8"/>'; }
    h += '<g class="disc" id="lb-disc" transform="rotate(' + W.rot.toFixed(2) + ' 60 60)">';
    list.forEach(function (s, i) {
      var col = cols[i] || '#2a2e3a', txt = spinTextOn(col), lab = String((s.label && (s.label[LANG] || s.label.en)) || '');
      var sp = lab.indexOf(' '), main = sp > 0 ? lab.slice(0, sp) : lab, sub = sp > 0 ? lab.slice(sp + 1) : '';
      /* Пустой сектор — как в концепте: прочерк и мелкая подпись. */
      if (s.type === 'miss') { sub = lab.toLowerCase(); main = '\u2014'; }
      h += '<path d="' + secPath(i, n, 50) + '" fill="' + col + '" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>';
      if (s.jackpot) h += '<path d="' + secPath(i, n, 50) + '" fill="none" stroke="#f7d879" stroke-width="1.2" opacity=".75"/>';
      h += '<g transform="rotate(' + (i * a).toFixed(2) + ' 60 60)"><text x="60" y="' + (sub ? 21 : 24) + '" font-size="' + (main.length > 4 ? 8 : 9.5) + '" fill="' + txt + '">' + esc(main) + '</text>' +
        (sub ? '<text x="60" y="29.5" font-size="' + (sub.length > 5 ? 4.6 : 5.6) + '" fill="' + txt + '" opacity=".75">' + esc(sub) + '</text>' : '') + '</g>';
    });
    h += '<path class="win" id="lb-win" fill="#fff" fill-opacity=".28"/></g>';
    h += '<circle class="hub" cx="60" cy="60" r="12"/><image href="' + LOGO + '" x="51" y="51" width="18" height="18"/>';
    h += '<g class="ptr" id="lb-ptr"><path d="M60 17 L53.5 4 Q60 1 66.5 4 Z" fill="url(#lb-wg)" stroke="#6b4a07" stroke-width=".8"/></g>';
    svg.innerHTML = h;
    W.mode = mode;
    W.lang = LANG;
    bulbs(false);
  }
  function bulbs(fast) {
    clearInterval(W.bulbT);
    var k = 0, bs = document.querySelectorAll('#lb-wheel .bulb');
    var step = function () {
      if (!fast && !lobbyOn()) return;
      k++;
      for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', fast ? (i + k) % 3 === 0 : (i + k) % 2 === 0);
    };
    step();
    if (!V3.reduced()) W.bulbT = setInterval(step, fast ? 90 : 700);
  }
  function setRot(v) { W.rot = v; var d = el('lb-disc'); if (d) d.setAttribute('transform', 'rotate(' + v.toFixed(2) + ' 60 60)'); }
  /* Короткий «раскрут» перед открытием экрана колеса. */
  function whirl(turns, ms) {
    var wrap = el('lb-wheel-wrap');
    if (!wrap || V3.reduced()) return;
    var r0 = W.rot, a = 360 / W.n, last = Math.floor(r0 / a);
    wrap.classList.add('spinning');
    bulbs(true);
    V3.tween(ms, function (p) {
      setRot(r0 + 360 * turns * (1 - Math.pow(1 - p, 3)));
      var u = Math.floor(W.rot / a);
      if (u !== last) { last = u; restart(el('lb-ptr'), 'tick'); }
    }, function () { setRot(W.rot % 360); wrap.classList.remove('spinning'); bulbs(false); });
  }
  /* Крутка до сектора idx: 5 оборотов с затуханием, щелчки стрелки на каждом
     секторе, затем выигравший сектор мигает. */
  function wheelSpin(idx, done) {
    var n = W.n, a = 360 / n, r0 = W.rot, wrap = el('lb-wheel-wrap');
    var base = (((-idx * a - r0) % 360) + 360) % 360, jitter = (Math.random() - 0.5) * a * 0.6;
    var target = r0 + 360 * 5 + base + jitter, last = underPtr(r0, n);
    wrap.classList.add('spinning');
    bulbs(true);
    V3.tween(3600, function (p) {
      setRot(V3.lerp(r0, target, 1 - Math.pow(1 - p, 4)));
      var u = underPtr(W.rot, n);
      if (u !== last) { last = u; restart(el('lb-ptr'), 'tick'); }
    }, function () {
      setRot(target % 360);
      wrap.classList.remove('spinning');
      bulbs(false);
      var win = el('lb-win');
      if (win) {
        win.setAttribute('d', secPath(idx, n, 50));
        restart(win, 'on');
        later(1600, function () { win.classList.remove('on'); });
      }
      done();
    });
  }
  function cardSpin() {
    if (W.busy || spinBusy) return;
    var mode = spinFreeLeftMs() <= 0 ? 'free' : 'vip';
    if (!spinAvail(mode)) { toast(t('spin_no_spins'), ''); return; }
    if (mode === 'free') { runCardSpin(mode); return; }
    /* Золотой — после rewarded-ролика; не досмотрел — попытка остаётся. */
    YaGame.showRewarded().then(function (ok) {
      if (ok) runCardSpin(mode); else renderSpin('force');
    }).catch(function () { toast(t('spin_ad_failed'), ''); renderSpin('force'); });
  }
  /* Учёт — как в runSpin: попытка списывается при остановке, приз через
     applySpinReward, запись в S.trades, снимок капитала и сейв. */
  function runCardSpin(mode) {
    var secs = spinSecs(mode);
    if (!secs.length || W.busy || spinBusy) return;
    if (W.mode !== mode) buildWheel(mode);
    W.busy = true;
    spinBusy = true;
    if (typeof Ach !== 'undefined') { try { Ach.emit('spin', { mode: mode }); } catch (e) { /* достижения не должны ломать крутку */ } }
    renderSpin('force');
    FX.vibrate(8);
    var idx = spinDrawIndex(mode);
    wheelSpin(idx, function () {
      var cfg = spinCfg(), sec = secs[idx];
      if (mode === 'free') S.spinFreeAt = YaGame.serverTime() + (cfg.freeCooldownMs || 21600000);
      else if ((cfg.adDailyLimit || 0) > 0) {
        var today = dayKey(YaGame.serverTime());
        if (S.spinAdDay !== today) { S.spinAdDay = today; S.spinAdCount = 0; }
        S.spinAdCount++;
      }
      /* Одометр капитала ждёт, пока монеты приза долетят. */
      var fly = !!sec && (sec.type === 'usd' || sec.type === 'crypto') && lobbyOn() && !V3.reduced();
      if (fly) holdCap(true);
      var res = applySpinReward(sec);
      if (fly && (!res || res.kind === 'commission')) { fly = false; holdCap(false); }
      pushSpinRewardRecord(sec, res);
      pushPfSnapshot(true);
      saveState(true);
      W.busy = false;
      /* spinBusy держим, пока приз не долетит: окна достижений (очередь
         Ach ждёт spinBusy) не должны закрыть монеты и мигание сектора. */
      var released = false, release = function () { if (!released) { released = true; spinBusy = false; } };
      later(3200, release);
      /* После обычного спина колесо переворачивается в золотое — с паузой. */
      if (mode === 'free') { W.flipAt = Date.now() + D(900); later(900, function () { renderSpin(); }); }
      cardAward(sec, res, fly, release);
      renderSpin('force');
      renderMoney('event');
    });
  }
  function cardAward(sec, res, fly, release) {
    var wh = el('lb-wheel'), wrap = el('lb-wheel-wrap');
    if (!res || res.kind === 'commission' || !fly) later(1600, release);
    if (!res) {
      restart(wrap, 'miss');
      FX.vibrate([8, 40, 12]);
      toast(t('spin_miss'), '', { sub: t('spin_miss_sub') });
      return;
    }
    FX.vibrate(sec && sec.jackpot ? [16, 46, 16] : [10, 32]);
    if (res.kind === 'commission') {
      floatAt(wh, '\u2212' + res.pct + '% ' + t('lb_fee_word'));
      toast(plural(res.trades, 'lb_fee_toast').replace('{p}', res.pct).replace('{n}', res.trades), 'gold');
      return;
    }
    var crypto = res.kind === 'crypto';
    var tgt = crypto && !H.open ? el('lobby-invested') : capTarget();
    var n = crypto ? (res.usd >= 50 ? 10 : 5) : Math.min(14, 5 + Math.round(res.usd / 60));
    var txt = '+' + m0(res.usd) + (crypto ? ' ' + res.ticker : '');
    var msg = crypto ? t('spin_toast_crypto', { q: qtyS(res.qty), k: res.ticker }) : t('spin_toast_usd', { x: m0(res.usd) });
    if (!fly) { toast(msg, 'gold'); floatAt(tgt, txt); return; }
    flyCoins(wh, tgt, n, function () { holdCap(false); floatAt(tgt, txt); toast(msg, 'gold'); later(700, release); }, crypto ? String(res.ticker).toLowerCase() : '');
  }
  function renderSpin(mode) {
    var btn = el('spin-btn');
    if (!btn) return;
    var left = spinFreeLeftMs(), free = left <= 0, vipOk = spinAvail('vip'), m = free ? 'free' : 'vip';
    if (W.busy || (W.mode && W.flipAt > Date.now())) m = W.mode;
    var wrap = el('lb-wheel-wrap');
    if (W.mode !== m) {
      if (W.mode && wrap.animate && !V3.reduced()) {
        wrap.animate([{ transform: 'rotateY(0)', opacity: 1 }, { transform: 'rotateY(90deg)', opacity: 0.4 }], { duration: D(260), easing: 'ease-in' }).onfinish = function () {
          buildWheel(m);
          wrap.animate([{ transform: 'rotateY(-90deg)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: D(320), easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)' });
        };
        W.mode = m;
      } else buildWheel(m);
    } else if (W.lang !== LANG && !W.busy) buildWheel(m);
    var chip = el('lb-spin-mode');
    chip.classList.toggle('vip', !free);
    var ct = free ? t('lb_spin_free') : t('lb_spin_cd', { t: fmtDuration(left) });
    if (chip.textContent !== ct) chip.textContent = ct;
    wrap.classList.toggle('cool', !free);
    var cd = spinCfg().freeCooldownMs || 21600000;
    el('lb-spin-ring').style.strokeDashoffset = free ? '100' : (100 - clamp(left / cd, 0, 1) * 100).toFixed(2);
    /* spinBusy держится, пока летят монеты приза, — кнопка до этого неактивна. */
    var hold = !W.busy && spinBusy;
    var want = (W.busy ? 's' : free ? 'f' : vipOk ? 'v' : 'w') + (hold ? 'h' : '') + LANG;
    if (btn.__st !== want || mode === 'force') {
      btn.__st = want;
      /* С переходом на экран кнопка активна и на кулдауне: там виден таймер. */
      btn.disabled = W.busy || hold || (IN_CARD_SPIN && !free && !vipOk);
      if (W.busy) { btn.className = 'lb-btn lb-ghost'; btn.innerHTML = '<span>' + esc(t('spin_spinning')) + '</span>'; }
      else if (free) { btn.className = 'lb-btn lb-gold'; btn.innerHTML = '<span>' + esc(t('spin_cta')) + '</span>'; }
      else if (vipOk) { btn.className = 'lb-btn lb-gold'; btn.innerHTML = ic('play', 3.4) + '<span>' + esc(t('lb_spin_gold')) + '</span>'; }
      else { btn.className = 'lb-cd'; btn.innerHTML = ic('clock', 3.6) + '<span class="mono">' + fmtDuration(left) + '</span>'; }
    }
  }

  /* ---------------- Цель: следующий класс ---------------- */

  var goalKey = '';
  function renderGoal(mode) {
    var box = el('lb-goal');
    if (!box) return;
    var cap = capital(), i = classFor(cap), c = CLASSES[i], nx = CLASSES[i + 1];
    var frac = nx ? clamp((cap - c.cap) / (nx.cap - c.cap), 0, 1) : 1;
    var key = i + LANG;
    if (goalKey !== key || mode === 'full') {
      goalKey = key;
      box.innerHTML = '<span class="em" id="lb-goal-em"><img src="' + esc(c.img || '') + '" alt=""></span><span class="m">' +
        '<span class="t"><span>' + esc(t('class_of')) + '</span><b>' + esc(clsName(c)) + '</b>' + (nx ? '<span class="r mono">+' + m0(nx.reward) + '</span>' : '') + '</span>' +
        '<span class="v3-bar"><u id="lb-goal-bar"></u></span><span class="n" id="lb-goal-n"></span></span>' +
        (nx ? '<span class="next"><img src="' + esc(nx.img || '') + '" alt="' + esc(clsName(nx)) + '"></span>' : '');
    }
    var bar = el('lb-goal-bar');
    if (mode === 'intro') {
      bar.style.transition = 'none'; bar.style.setProperty('--w', '0%'); reflow(bar); bar.style.transition = '';
      later(520, function () { bar.style.setProperty('--w', (frac * 100).toFixed(2) + '%'); });
    } else bar.style.setProperty('--w', (frac * 100).toFixed(2) + '%');
    var n = nx ? esc(t('lb_goal_left', { n: clsName(nx), x: '\u0001' })).replace('\u0001', '<b class="mono">' + m0(Math.max(0, nx.cap - cap)) + '</b>') : esc(t('lb_goal_max'));
    var ne = el('lb-goal-n');
    if (ne.__h !== n) { ne.__h = n; ne.innerHTML = n; }
  }
  /* Повышение класса: вспышка карточки, эмблема переворачивается, монеты
     награды летят в капитал. Деньги начисляет checkLevelUp. */
  function levelFx(total) {
    var box = el('lb-goal');
    if (!box) return;
    restart(box, 'lvl');
    restart(el('lb-goal-em'), 'up');
    later(360, function () {
      renderGoal('full');
      var bar = el('lb-goal-bar');
      bar.style.transition = 'none'; bar.style.setProperty('--w', '0%'); reflow(bar); bar.style.transition = '';
      restart(el('lb-goal-em'), 'up');
      later(60, function () { renderGoal(); });
    });
    if (lobbyOn()) {
      holdCap(true);
      later(900, function () {
        flyCoins(el('lb-goal-em'), capTarget(), 16, function () { holdCap(false); floatAt(capTarget(), '+' + m0(total)); });
      });
    }
  }

  /* ---------------- Рынок: бегущая строка и новости ---------------- */

  var tapeSig = '', tapeAt = 0, tapeList = [], TAPE_PX_S = 26.5;
  function tapeAssets() {
    var held = Object.keys(S.positions).map(assetById).filter(Boolean);
    held.sort(function (x, y) { return S.positions[y.id].qty * Engine.bid(y, now()) - S.positions[x.id].qty * Engine.bid(x, now()); });
    var out = held.slice(0, 4);
    for (var i = 0; i < ASSETS.length && out.length < 10; i++) if (out.indexOf(ASSETS[i]) < 0) out.push(ASSETS[i]);
    return out;
  }
  function tkHTML(a, ts) {
    var ch = Engine.change(a, ts);
    return '<button type="button" class="lb-tk" data-a="' + esc(a.id) + '"><img src="' + esc(coinSrc(a)) + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
      '<span><b>' + esc(a.ticker) + '</b><span class="pr mono">' + pxS(a, Engine.live(a, ts)) + '</span></span>' +
      '<em class="mono ' + (ch >= 0 ? 'up' : 'down') + '">' + pctS(ch) + '</em></button>';
  }
  function renderTape() {
    var box = el('lb-tape');
    if (!box) return;
    tapeList = tapeAssets();
    var sig = tapeList.map(function (a) { return a.id; }).join(',');
    if (sig !== tapeSig || !box.firstChild) {
      tapeSig = sig;
      var ts = now(), h = tapeList.map(function (a) { return tkHTML(a, ts); }).join('');
      box.innerHTML = h + h;
      box.__lbw = 0;
    }
    /* Скорость ленты — как в концепте (~26 px/с), а не фиксированное время:
       иначе лента из 10 монет бежит заметно быстрее. Ширину меряем, когда
       вкладка видна. */
    var w = box.scrollWidth / 2;
    /* Смена длительности сдвигает фазу бегущей строки — только при заметной разнице. */
    if (w > 0 && (!box.__lbw || Math.abs(w - box.__lbw) / box.__lbw > 0.15)) {
      box.__lbw = w;
      box.style.animationDuration = 'calc(var(--k) * ' + (w / TAPE_PX_S).toFixed(1) + 's)';
    }
  }
  function updTape() {
    var box = el('lb-tape');
    if (!box) return;
    var ts = now();
    tapeList.forEach(function (a) {
      var p = Engine.live(a, ts), ch = Engine.change(a, ts), up = a.__lbp == null || p >= a.__lbp;
      a.__lbp = p;
      var nodes = box.querySelectorAll('.lb-tk[data-a="' + a.id + '"]');
      for (var i = 0; i < nodes.length; i++) {
        var pr = nodes[i].querySelector('.pr'), em = nodes[i].querySelector('em'), txt = pxS(a, p);
        if (pr.textContent !== txt) { pr.textContent = txt; pr.classList.remove('fu', 'fd'); reflow(pr); pr.classList.add(up ? 'fu' : 'fd'); }
        em.textContent = pctS(ch);
        em.className = 'mono ' + (ch >= 0 ? 'up' : 'down');
      }
    });
    clearTimeout(updTape.__t);
    updTape.__t = setTimeout(function () {
      var fl = box.querySelectorAll('.pr.fu, .pr.fd');
      for (var i = 0; i < fl.length; i++) fl[i].classList.remove('fu', 'fd');
    }, 520);
  }

  var NW = { list: [], i: 0, at: 0, timer: 0, sig: '' };
  function newsList() {
    var ts = now();
    var items = [];
    try { items = Engine.newsFeed(ts, 10) || []; } catch (e) { items = []; }
    return items.filter(function (n) { return ts - n.t < 60 * 60000; }).slice(0, 8);
  }
  function newsLine(n) {
    var arrow = n.dir > 0 ? '\u25B2' : '\u25BC';
    var head = '<em class="' + (n.dir > 0 ? 'up' : 'down') + '">' + (n.ticker ? esc(n.ticker) + ' ' : '') + arrow + '</em> ';
    return '<span class="lb-nl"><b>' + head + esc(n.text || '') + '</b></span>';
  }
  function showNews(first) {
    var w = el('lobby-news'), row = el('news-row');
    if (!w) return;
    if (!NW.list.length) {
      row.setAttribute('data-dir', 'calm');
      w.innerHTML = '<span class="lb-nl"><b>' + esc(t('news_calm')) + '</b></span>';
      el('lobby-news-time').textContent = '';
      el('lb-news-p').classList.remove('run');
      return;
    }
    var n = NW.list[NW.i % NW.list.length], old = w.querySelector('.lb-nl');
    row.setAttribute('data-dir', n.dir > 0 ? 'up' : 'down');
    var mins = Math.floor((now() - n.t) / 60000);
    el('lobby-news-time').textContent = mins < 1 ? t('lb_now') : t('lb_min', { n: mins });
    w.insertAdjacentHTML('beforeend', newsLine(n));
    var nl = w.lastElementChild;
    if (!first && old && !V3.reduced()) {
      nl.classList.add('in'); reflow(nl); nl.classList.remove('in');
      old.classList.add('out');
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, D(560) + 20);
    } else if (old) old.parentNode.removeChild(old);
    var p = el('lb-news-p');
    p.classList.remove('run');
    reflow(p);
    if (!V3.reduced() && NW.list.length > 1) p.classList.add('run');
  }
  function newsTick() {
    if (!lobbyOn()) return;
    var fresh = newsList(), sig = fresh.map(function (n) { return n.t + n.ticker; }).join('|');
    if (sig !== NW.sig) { NW.sig = sig; NW.list = fresh; NW.i = 0; showNews(true); NW.at = Date.now(); return; }
    if (NW.list.length > 1 && Date.now() - NW.at >= 5000) { NW.i = (NW.i + 1) % NW.list.length; NW.at = Date.now(); showNews(false); }
  }

  /* ---------------- Счётчик новых операций на чипе «История» ---------------- */

  var nb = 0;
  function noteNew(n) {
    if (H.open || !n) return;
    nb += n;
    var e = el('lb-hist-nb');
    if (!e) return;
    e.textContent = nb > 9 ? '9+' : String(nb);
    restart(e, 'on');
  }
  function clearNb() { nb = 0; var e = el('lb-hist-nb'); if (e) e.classList.remove('on'); }

  /* ---------------- Экран истории баланса ---------------- */

  /* seenAt — когда историю закрыли в прошлый раз: операции новее получают
     золотую метку «новое» (как счётчик на чипе «История»). */
  var H = { open: false, per: 'week', f: 'all', limit: 40, vals: null, stopMorph: null, marks: [], geo: null, openId: null, sig: '', seen: {}, chartAt: 0, seenAt: Date.now(), freshAt: 0 };
  var NPT = 120;

  function histEl() {
    var h = el('v3h');
    if (h) return h;
    h = document.createElement('section');
    h.className = 'v3h';
    h.id = 'v3h';
    h.setAttribute('role', 'dialog');
    h.setAttribute('aria-modal', 'true');
    h.setAttribute('aria-hidden', 'true');
    h.innerHTML =
      '<header class="v3h-top"><button type="button" class="icon-btn" id="v3h-back">' + ic('back', 4) + '</button>' +
        '<h1 class="hin" style="--d:60" id="v3h-title"></h1><span class="icon-btn ph" aria-hidden="true"></span></header>' +
      '<main class="v3h-scroll" id="v3h-scroll">' +
        '<div class="v3h-hh"><span class="v3-kicker hin" style="--d:80" id="v3h-kick"></span><span class="v3h-num mono" id="v3h-num"></span>' +
          '<div class="v3h-sub hin" style="--d:140"><span class="lb-chg" id="v3h-chg">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' +
          '<span class="mono" id="v3h-chg-t">—</span></span><span class="lb-per" id="v3h-per"></span></div></div>' +
        '<div class="v3h-seg hin" id="v3h-seg" role="tablist" style="--d:180"><i class="v3h-ind" aria-hidden="true"></i>' +
          ['day', 'week', 'month', 'all'].map(function (p) { return '<button type="button" role="tab" data-p="' + p + '"></button>'; }).join('') + '</div>' +
        '<div class="v3h-chart hin" id="v3h-chart" style="--d:220"><svg id="v3h-svg" role="img">' +
          '<defs><linearGradient id="v3h-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cc);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--cc);stop-opacity:0"/></linearGradient>' +
          '<clipPath id="v3h-clip"><rect id="v3h-clip-r" x="-10" y="-20" width="0" height="260"/></clipPath></defs>' +
          '<g class="grid" id="v3h-grid"></g><line class="base" id="v3h-base"/>' +
          '<g clip-path="url(#v3h-clip)"><path id="v3h-area" fill="url(#v3h-fill)"/><path class="ln" id="v3h-line"/></g>' +
          '<g class="mk" id="v3h-mk"></g><line class="cross" id="v3h-cross"/>' +
          '<circle class="endping" id="v3h-endping" r="6"/><circle class="endp" id="v3h-endp" r="4"/><circle class="cdot" id="v3h-cdot" r="5"/>' +
          '</svg><div class="v3h-tip mono" id="v3h-tip"></div></div>' +
        '<section class="card v3h-wf hin" id="v3h-wf" style="--d:280"><div class="v3h-head"><h2 id="v3h-wf-t"></h2><span class="v3-kicker" id="v3h-wf-per"></span></div>' +
          '<div class="v3h-cols" id="v3h-cols"></div><div class="v3h-lbls" id="v3h-lbls"></div><p class="v3h-note" id="v3h-note"></p></section>' +
        '<div class="v3h-chips hin" id="v3h-chips" role="tablist" style="--d:320"><i class="v3h-ind" aria-hidden="true"></i>' +
          ['all', 'bonus', 'trade', 'fut'].map(function (f) { return '<button type="button" class="v3h-chip" role="tab" data-f="' + f + '"><span></span><i data-fc="' + f + '"></i></button>'; }).join('') + '</div>' +
        '<div class="v3h-ops hin" id="v3h-ops" style="--d:360"></div>' +
      '</main>';
    (el('app') || document.body).appendChild(h);
    el('v3h-back').onclick = closeHist;
    el('v3h-seg').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-p]');
      if (!b || b.getAttribute('data-p') === H.per) return;
      H.per = b.getAttribute('data-p');
      H.limit = 40;
      syncSeg();
      renderHist('period');
      FX.vibrate(6);
    });
    el('v3h-chips').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-f]');
      if (!b || b.getAttribute('data-f') === H.f) return;
      H.f = b.getAttribute('data-f');
      H.limit = 40;
      syncChips();
      renderOps('filter');
    });
    el('v3h-ops').addEventListener('click', function (e) {
      if (e.target.closest('.v3h-morebtn')) { H.limit += 40; renderOps('more'); return; }
      var row = e.target.closest('.v3h-row');
      if (row) toggleOp(row.parentNode);
    });
    bindScrub();
    return h;
  }
  function staticTexts() {
    el('v3h-back').setAttribute('aria-label', t('lb_back'));
    el('v3h-title').textContent = t('lb_hist_title');
    el('v3h').setAttribute('aria-label', t('lb_hist_title'));
    el('v3h-kick').textContent = t('lb_cap_now');
    el('v3h-wf-t').textContent = t('lb_wf_title');
    document.querySelectorAll('#v3h-seg button').forEach(function (b) { b.textContent = t('lb_p_' + b.getAttribute('data-p')); });
    document.querySelectorAll('#v3h-chips .v3h-chip').forEach(function (b) { b.firstChild.textContent = t('lb_f_' + b.getAttribute('data-f')); });
    el('v3h-lbls').innerHTML = ['start', 'bonus', 'trades', 'market', 'fees', 'now'].map(function (k) { return '<span>' + esc(t('lb_wf_' + k)) + '</span>'; }).join('');
  }
  function moveInd(box, btn, instant) {
    var ind = box && box.querySelector('.v3h-ind');
    if (!ind || !btn) return;
    if (instant) ind.style.transition = 'none';
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
    if (instant) { reflow(ind); ind.style.transition = ''; }
  }
  function syncSeg(instant) {
    var on = null;
    document.querySelectorAll('#v3h-seg button').forEach(function (b) {
      var x = b.getAttribute('data-p') === H.per;
      b.classList.toggle('on', x); b.setAttribute('aria-selected', x ? 'true' : 'false');
      if (x) on = b;
    });
    moveInd(el('v3h-seg'), on, instant);
  }
  function syncChips(instant) {
    var on = null;
    document.querySelectorAll('#v3h-chips .v3h-chip').forEach(function (b) {
      var x = b.getAttribute('data-f') === H.f;
      b.classList.toggle('on', x); b.setAttribute('aria-selected', x ? 'true' : 'false');
      if (x) on = b;
    });
    moveInd(el('v3h-chips'), on, instant);
  }
  function clipFrom(h) {
    var card = el('lb-bal-card'), hr = h.getBoundingClientRect(), cr = card.getBoundingClientRect();
    return 'inset(' + (cr.top - hr.top).toFixed(1) + 'px ' + (hr.right - cr.right).toFixed(1) + 'px ' + (hr.bottom - cr.bottom).toFixed(1) + 'px ' + (cr.left - hr.left).toFixed(1) + 'px round 26px)';
  }
  function numFly(fromEl, toEl) {
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    return 'translate(' + (a.left - b.left).toFixed(1) + 'px,' + (a.top - b.top).toFixed(1) + 'px) scale(' + (a.height / Math.max(1, b.height)).toFixed(3) + ')';
  }
  /* Карточка капитала раскрывается в экран истории, число перелетает в заголовок. */
  function openHist() {
    if (H.open) return;
    var h = histEl();
    staticTexts();
    H.open = true;
    H.limit = 40;
    H.openId = null;
    H.seen = {};
    H.freshAt = H.seenAt;
    ops().forEach(function (o) { H.seen[o.id] = 1; });
    h.classList.remove('shown', 'closing', 'show');
    h.classList.add('on');
    h.setAttribute('aria-hidden', 'false');
    el('v3h-scroll').scrollTop = 0;
    var num = el('v3h-num');
    num.__odoTxt = null;
    V3.odo(num, capital(), { fmt: fmtCap });
    H.vals = null;
    renderHist('open');
    reflow(h);
    if (h.animate && !V3.reduced()) {
      h.animate([{ clipPath: clipFrom(h) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: D(560), easing: 'cubic-bezier(0.3, 0.9, 0.2, 1)' });
      num.animate([{ transform: numFly(el('lobby-capital'), num) }, { transform: 'none' }], { duration: D(560), easing: 'cubic-bezier(0.3, 0.9, 0.2, 1)' });
    }
    h.classList.add('show');
    clearTimeout(H.showT);
    H.showT = later(1300, function () { if (H.open) { h.classList.add('shown'); h.classList.remove('show'); } });
    clearNb();
    later(40, function () { syncSeg(true); syncChips(true); });
    FX.vibrate(7);
  }
  function closeHist() {
    if (!H.open) return;
    H.open = false;
    H.seenAt = Date.now();
    endScrub();
    var h = el('v3h');
    h.classList.add('closing');
    h.classList.remove('show', 'shown');
    var fin = function () { h.classList.remove('on', 'closing'); h.setAttribute('aria-hidden', 'true'); };
    renderMoney('tick');
    capFrame();
    if (!h.animate || V3.reduced()) { fin(); return; }
    var card = el('lb-bal-card'), hr = h.getBoundingClientRect(), cr = card.getBoundingClientRect();
    var visible = cr.bottom > hr.top + 40 && cr.top < hr.bottom - 40;
    var to = visible ? clipFrom(h) : 'inset(100% 0px 0px 0px round 26px)';
    if (visible) {
      var num = el('v3h-num');
      num.animate([{ transform: 'none' }, { transform: numFly(el('lobby-capital'), num) }], { duration: D(440), easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' })
        .onfinish = function (ev) { if (ev && ev.target && ev.target.cancel) ev.target.cancel(); };
    }
    h.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: to }], { duration: D(440), easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }).onfinish = fin;
  }

  function renderHist(mode) {
    var p = H.per, t0 = perT0(p), start = valAt(t0), end = capital();
    setChg(el('v3h-chg'), el('v3h-chg-t'), end - start, start);
    el('v3h-per').textContent = t('lb_per_' + p);
    el('v3h-wf-per').textContent = t('lb_per_' + p);
    var tgt = series(t0, NPT);
    if (mode === 'period' && H.vals && !V3.reduced()) morphChart(tgt);
    else if (mode !== 'live' || !H.stopMorph) { if (H.stopMorph) H.stopMorph(); H.vals = tgt; drawChart(mode === 'open'); }
    renderWF(mode);
    renderOps(mode);
    H.sig = opsSig();
    H.chartAt = Date.now();
  }
  function chartGeo(vals) {
    var box = el('v3h-chart'), w = box.clientWidth || 360, h = box.clientHeight || 170, top = 22, bot = 16;
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), pad = (mx - mn) * 0.1 || Math.abs(mx) * 0.01 || 1;
    mn -= pad; mx += pad;
    return { w: w, pw: w - 46, h: h, top: top, bot: bot, mn: mn, mx: mx, y: function (v) { return top + (1 - (v - mn) / (mx - mn)) * (h - top - bot); } };
  }
  function drawChart(reveal) {
    var vals = H.vals, g = chartGeo(vals), svg = el('v3h-svg'), n = vals.length, box = el('v3h-chart');
    svg.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
    var pts = vals.map(function (v, k) { return [k / (n - 1) * g.pw, g.y(v)]; });
    var d = 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L');
    el('v3h-line').setAttribute('d', d);
    el('v3h-area').setAttribute('d', d + 'L' + g.pw + ' ' + g.h + 'L0 ' + g.h + 'Z');
    box.style.setProperty('--cc', vals[n - 1] >= vals[0] ? 'var(--up)' : 'var(--down)');
    var by = g.y(vals[0]), base = el('v3h-base');
    base.setAttribute('x1', 0); base.setAttribute('x2', g.pw); base.setAttribute('y1', by); base.setAttribute('y2', by);
    var gh = '', lbl = '';
    [0.2, 0.5, 0.8].forEach(function (f) {
      var y = g.top + f * (g.h - g.top - g.bot), v = g.mx - f * (g.mx - g.mn);
      gh += '<line x1="0" x2="' + g.pw + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>';
      lbl += '<span class="v3h-lbl mono" style="top:' + (y - 7).toFixed(0) + 'px">' + compact(v) + '</span>';
    });
    el('v3h-grid').innerHTML = gh;
    box.querySelectorAll('.v3h-lbl').forEach(function (x) { x.parentNode.removeChild(x); });
    box.insertAdjacentHTML('beforeend', lbl);
    var e = pts[n - 1];
    ['v3h-endp', 'v3h-endping'].forEach(function (s) { el(s).setAttribute('cx', e[0]); el(s).setAttribute('cy', e[1]); });
    H.geo = g;
    drawMarks();
    var cr = el('v3h-clip-r');
    cr.setAttribute('height', g.h + 40);
    if (reveal && !V3.reduced()) {
      cr.setAttribute('width', 0);
      el('v3h-mk').style.opacity = 0;
      ['v3h-endp', 'v3h-endping'].forEach(function (s) { el(s).style.opacity = 0; });
      later(260, function () {
        V3.tween(900, function (q) { cr.setAttribute('width', ((g.w + 20) * V3.easeOut(q)).toFixed(1)); }, function () {
          el('v3h-mk').style.opacity = '';
          ['v3h-endp', 'v3h-endping'].forEach(function (s) { el(s).style.opacity = ''; });
          el('v3h-mk').querySelectorAll('circle').forEach(function (c, k) {
            if (c.animate) c.animate([{ r: 0 }, { r: c.getAttribute('r') }], { duration: D(300), delay: D(Math.min(k * 18, 400)), easing: 'cubic-bezier(0.34, 1.5, 0.55, 1)', fill: 'backwards' });
          });
        });
      });
    } else cr.setAttribute('width', g.w + 20);
  }
  function drawMarks() {
    var p = H.per, g = H.geo, t0 = perT0(p), t1 = Date.now(), h = '';
    var small = p === 'month' || p === 'all', rr = small ? 2.6 : 3.6, pts = points(), cap = capital();
    H.marks = [];
    ops().forEach(function (o) {
      if (o.t <= t0 || o.t > t1 || o.k === 'start' || o.k === 'adj') return;
      var cls = BONUS[o.k] ? 'g' : TRADE[o.k] ? 't' : 'f';
      if (small && cls === 't') return;
      var x = (o.t - t0) / (t1 - t0) * g.pw, y = g.y(valAt(o.t, pts, cap));
      H.marks.push({ o: o, x: x, y: y });
      h += '<circle class="' + cls + '" data-id="' + esc(o.id) + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rr + '"/>';
    });
    el('v3h-mk').innerHTML = h;
  }
  function morphChart(tgt) {
    if (H.stopMorph) H.stopMorph();
    var from = H.vals.slice();
    el('v3h-mk').style.opacity = 0;
    H.stopMorph = V3.tween(620, function (q) {
      var e = V3.easeInOut(q);
      H.vals = tgt.map(function (v, k) { return V3.lerp(from[k], v, e); });
      drawChart(false);
      el('v3h-mk').style.opacity = 0;
    }, function () {
      H.stopMorph = null;
      H.vals = tgt;
      drawChart(false);
      el('v3h-mk').style.opacity = '';
    });
  }
  function tLabel(ts) {
    if (H.per === 'day') return hm(ts);
    try {
      if (H.per === 'week') return new Date(ts).toLocaleDateString(loc(), { weekday: 'short' }) + ', ' + hm(ts);
      return new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) + ', ' + hm(ts);
    } catch (e) { return hm(ts); }
  }
  function scrubAt(clientX) {
    var box = el('v3h-chart'), r = box.getBoundingClientRect(), g = H.geo;
    if (!g) return;
    var x = clamp(clientX - r.left, 0, g.pw), t0 = perT0(H.per), t1 = Date.now();
    var ts = t0 + (t1 - t0) * x / g.pw, v = valAt(ts), y = g.y(v);
    var best = null, bd = 14;
    H.marks.forEach(function (m) { var dd = Math.abs(m.x - x); if (dd < bd) { bd = dd; best = m; } });
    if (best) { x = best.x; ts = best.o.t; v = valAt(ts); y = g.y(v); }
    box.classList.add('scrub');
    var cr = el('v3h-cross');
    cr.setAttribute('x1', x); cr.setAttribute('x2', x); cr.setAttribute('y1', 8); cr.setAttribute('y2', g.h);
    var cd = el('v3h-cdot'); cd.setAttribute('cx', x); cd.setAttribute('cy', y);
    el('v3h-mk').querySelectorAll('circle.hot').forEach(function (c) { c.classList.remove('hot'); });
    H.hot = best ? best.o : null;
    if (best) { var mc = el('v3h-mk').querySelector('circle[data-id="' + best.o.id + '"]'); if (mc) mc.classList.add('hot'); }
    var tip = el('v3h-tip');
    tip.innerHTML = money(v, 2) + '<span>' + esc(tLabel(ts)) + '</span>' + (best ? '<em>' + esc(opTitle(best.o)) + ' \u00b7 ' + esc(opAmt(best.o)) + '</em>' : '');
    tip.style.left = clamp(x, tip.offsetWidth / 2, g.w - tip.offsetWidth / 2) + 'px';
  }
  function endScrub() {
    var box = el('v3h-chart');
    if (!box) return;
    box.classList.remove('scrub');
    el('v3h-mk').querySelectorAll('circle.hot').forEach(function (c) { c.classList.remove('hot'); });
    H.scr = null;
  }
  /* Скраб пальцем по графику; отпустили на отметке — переход к операции. */
  function bindScrub() {
    var box = el('v3h-chart');
    box.addEventListener('pointerdown', function (e) {
      H.scr = { id: e.pointerId, x: e.clientX };
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* без захвата скраб просто короче */ }
      scrubAt(e.clientX);
    });
    box.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' || (H.scr && H.scr.id === e.pointerId)) scrubAt(e.clientX);
    });
    box.addEventListener('pointerup', function (e) {
      var tap = H.scr && Math.abs(e.clientX - H.scr.x) < 6, hot = H.hot;
      H.scr = null;
      if (tap && hot) { endScrub(); jumpToOp(hot.id); return; }
      if (e.pointerType !== 'mouse') endScrub();
    });
    box.addEventListener('pointercancel', endScrub);
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !H.scr) endScrub(); });
  }

  /* «Из чего сложилось»: старт → бонусы → закрытые сделки → рынок → комиссии → сейчас. */
  function breakdown(p) {
    var t0 = perT0(p), start = p === 'all' ? (Number(S.startBalance) || CONFIG.startBalance) : valAt(t0), end = capital(), bon = 0, trd = 0, fee = 0;
    ops().forEach(function (o) {
      if (o.t <= t0 || o.k === 'start') return;
      if (BONUS[o.k]) bon += o.usd || 0;
      if (o.k === 'sell') trd += (o.pnl || 0) + (o.fee || 0);
      if (o.k === 'fclose') trd += o.pnl || 0;
      if (o.fee) fee += o.fee;
    });
    return { start: start, bon: bon, trd: trd, fee: fee, mkt: end - start - bon - trd + fee, end: end, t0: t0 };
  }
  function renderWF(mode) {
    var b = breakdown(H.per), L = [b.start, b.start + b.bon, b.start + b.bon + b.trd, b.start + b.bon + b.trd + b.mkt, b.end];
    var lo = Math.min.apply(null, L), hi = Math.max.apply(null, L), base = Math.max(0, lo - (hi - lo) * 0.35 - hi * 0.001);
    if (hi - base < 1) hi = base + 1;
    var y = function (v) { return (v - base) / (hi - base) * 78; };
    var cols = [
      { a: base, b: L[0], c: 'tot', v: compact(b.start) },
      { a: L[0], b: L[1], c: 'bon', v: compact(b.bon, true) },
      { a: L[1], b: L[2], c: b.trd >= 0 ? 'pos' : 'neg', v: compact(b.trd, true) },
      { a: L[2], b: L[3], c: b.mkt >= 0 ? 'pos' : 'neg', v: compact(b.mkt, true) },
      { a: L[3], b: L[4], c: 'neg', v: compact(-b.fee, true) },
      { a: base, b: L[4], c: 'end', v: compact(b.end) }
    ];
    var html = cols.map(function (c, k) {
      var y0 = y(Math.min(c.a, c.b)), y1 = y(Math.max(c.a, c.b)), hgt = Math.max(y1 - y0, Math.abs(c.a - c.b) < 0.005 ? 0 : 1.2);
      var down = c.b < c.a && k > 0 && k < 5;
      var col = c.c === 'end' || c.c === 'bon' ? 'var(--gold)' : c.c === 'pos' ? 'var(--up)' : c.c === 'neg' ? 'var(--down)' : 'var(--text)';
      return '<div class="v3h-col' + (down ? ' neg' : '') + '" style="--dl:' + (k * 150) + '">' +
        '<i class="' + c.c + '" style="bottom:' + y0.toFixed(2) + '%;height:' + hgt.toFixed(2) + '%"></i>' +
        '<b class="mono" style="bottom:calc(' + (y0 + hgt).toFixed(2) + '% + 5px);color:' + col + '">' + c.v + '</b>' +
        (k < 5 ? '<span class="cn" style="bottom:' + y(L[k]).toFixed(2) + '%"></span>' : '') + '</div>';
    }).join('');
    var big = [['bonus', b.bon], ['trades', b.trd], ['market', b.mkt]].sort(function (x, z) { return Math.abs(z[1]) - Math.abs(x[1]); })[0];
    /* Шаблон из словаря доверенный (в нём <b>), подставляемое — экранируем. */
    var note = t('lb_wf_note', { w: esc(t('lb_wf_w_' + big[0])), x: esc(sgn(big[1], 0)) });
    var since = Number(S.lbLogSince) || 0;
    if (since > b.t0 + 60000) note += ' ' + esc(t('lb_wf_cov', { d: whenS(since) }));
    el('v3h-note').innerHTML = note;
    var box = el('v3h-cols'), wf = el('v3h-wf');
    if (mode === 'live' && box.children.length) { wf.classList.add('on'); box.innerHTML = html; return; }
    wf.classList.remove('on');
    box.innerHTML = html;
    reflow(box);
    later(mode === 'open' ? 420 : 60, function () { wf.classList.add('on'); });
  }

  /* ---------------- Строки операций ---------------- */

  function tick_(o) { return o.a ? o.a.ticker : ''; }
  function opTitle(o) {
    switch (o.k) {
      case 'start': return t('lb_op_start');
      case 'daily': return t('lb_op_daily');
      case 'ad': return t('lb_op_ad');
      case 'grant': return t('lb_op_grant');
      case 'class': return t('lb_op_class', { n: clsName(CLASSES[o.cls]) });
      case 'spin': return t('lb_op_spin');
      case 'quest': return t('lb_op_quest');
      case 'buy': return t('lb_op_buy', { c: tick_(o) });
      case 'sell': return t('lb_op_sell', { c: tick_(o) });
      case 'fin': return t('lb_op_fin');
      case 'fout': return t('lb_op_fout');
      case 'fclose': return t('lb_op_fclose', { c: tick_(o), s: t(o.side === 'short' ? 'lb_short' : 'lb_long'), l: o.lev });
    }
    return '';
  }
  function opAmt(o) {
    if (o.k === 'spin' && o.a && o.qty) return '+' + qtyS(o.qty) + ' ' + tick_(o);
    if (o.k === 'buy' || o.k === 'fin') return '\u2212' + money(o.k === 'buy' ? o.total : o.usd, 2);
    if (o.k === 'sell') return '+' + money(o.total - o.fee, 2);
    if (o.k === 'fout') return '+' + money(o.usd, 2);
    if (o.k === 'fclose') return sgn(o.pnl, 2);
    return '+' + m0(o.usd);
  }
  function opIcon(o) {
    if (o.k === 'start') return '<span class="v3h-oi"><img src="' + LOGO + '" alt="" style="width:26px;height:26px;border-radius:0"></span>';
    if (o.k === 'class' && CLASSES[o.cls]) return '<span class="v3h-oi"><img src="' + esc(CLASSES[o.cls].img || '') + '" alt=""></span>';
    if (TRADE[o.k]) return '<span class="v3h-oi coinbg"><img src="' + esc(coinSrc(o.a)) + '" alt="" onerror="this.style.visibility=\'hidden\'"><i class="side ' + (o.k === 'buy' ? 'b' : 's') + '">' + ic(o.k === 'buy' ? 'plus' : 'minus', 7) + '</i></span>';
    if (o.k === 'fclose') return '<span class="v3h-oi f"><img src="' + esc(coinSrc(o.a)) + '" alt="" style="width:26px;height:26px" onerror="this.style.visibility=\'hidden\'"><i class="lev">' + esc(o.lev) + '×</i></span>';
    var name = { daily: 'gift', ad: 'play', spin: 'wheel', grant: 'shield', fin: 'swap', fout: 'swap', quest: 'gift' }[o.k] || 'gift';
    return '<span class="v3h-oi' + (FUT[o.k] ? ' f' : '') + '">' + ic(name, 3.4) + '</span>';
  }
  function opSub(o) {
    var tm = hm(o.t), dot = ' \u00b7 ';
    switch (o.k) {
      case 'start': return esc(t('lb_s_start')) + dot + tm;
      case 'daily': return o.streak ? esc(t('lb_streak').toLowerCase() + ' ' + o.streak + ' ' + plural(o.streak, 'lb_day')) + dot + tm : tm;
      case 'ad': return esc(t('lb_s_ad')) + dot + tm;
      case 'grant': return esc(t('lb_s_grant')) + dot + tm;
      case 'quest': return esc(o.src || '') + dot + tm;
      case 'class': return esc(t('lb_s_class')) + dot + tm;
      case 'spin': return esc(o.a ? t('lb_s_prize_c', { x: m0(o.usd), c: tick_(o) }) : t('lb_s_prize', { x: m0(o.usd) })) + dot + tm;
      case 'buy': return esc(qtyS(o.qty) + ' ' + tick_(o)) + dot + tm + (o.kind === 'limit' ? dot + esc(t('lb_s_limit')) : '');
      case 'sell': return esc(qtyS(o.qty) + ' ' + tick_(o)) + (o.pnl != null ? ' <i class="v3h-pnl ' + (o.pnl >= 0 ? 'up' : 'down') + '">' + sgn(o.pnl, 2) + '</i>' : dot + tm);
      case 'fin': return esc(t('lb_s_fin')) + dot + tm;
      case 'fout': return esc(t('lb_s_fout')) + dot + tm;
      case 'fclose': {
        var r = o.reason === 'tp' ? t('fut_r_tp') : o.reason === 'sl' ? t('fut_r_sl') : o.reason === 'liq' ? t('fut_r_liq') : t('lb_s_closed');
        return esc(r) + dot + tm;
      }
    }
    return tm;
  }
  function opRight(o) {
    if (o.k === 'fclose') return 'ROE ' + pctS(o.roe || 0);
    if (o.k === 'spin' && o.a) return esc(t('lb_r_port', { x: m0(o.usd) }));
    if (o.k === 'fin' && o.fut != null) return esc(t('lb_r_fut', { x: m0(o.fut) }));
    if (o.after != null) return esc(t('lb_r_free', { x: m0(o.after) }));
    return '';
  }
  function kv(k, v) { return '<div><span>' + esc(t(k)) + '</span><b class="mono">' + v + '</b></div>'; }
  function pnlSpan(v) { return '<span class="' + (v >= 0 ? 'up' : 'down') + '">' + sgn(v, 2) + '</span>'; }
  function opKV(o) {
    var when = esc(whenS(o.t));
    switch (o.k) {
      case 'buy': return kv('lb_k_qty', esc(qtyS(o.qty) + ' ' + tick_(o))) + kv('lb_k_price', pxS(o.a, o.price)) + kv('lb_k_fee', money(o.fee, 2)) +
        kv('lb_k_type', esc(t(o.kind === 'limit' ? 'lb_v_limit' : 'lb_v_market'))) + kv('lb_k_total', money(o.total, 2)) + kv('lb_k_when', when);
      case 'sell': return kv('lb_k_qty', esc(qtyS(o.qty) + ' ' + tick_(o))) + kv('lb_k_price', pxS(o.a, o.price)) + kv('lb_k_fee', money(o.fee, 2)) +
        kv('lb_k_pnl', o.pnl != null ? pnlSpan(o.pnl) : '—') + kv('lb_k_type', esc(t(o.kind === 'limit' ? 'lb_v_limit' : 'lb_v_market'))) + kv('lb_k_when', when);
      case 'daily': return kv('lb_k_streak', o.streak ? esc(o.streak + ' ' + plural(o.streak, 'lb_day')) : '—') + kv('lb_k_next', o.streak ? m0(rewardFor(o.streak)) : '—') + kv('lb_k_when', when);
      case 'ad': return kv('lb_k_source', esc(t('lb_v_ad'))) + kv('lb_k_next', esc(t('lb_v_in', { n: Math.round(CONFIG.adCooldown / 60) }))) + kv('lb_k_when', when);
      case 'grant': return kv('lb_k_total', m0(o.usd)) + kv('lb_k_when', when);
      case 'quest': return kv('lb_k_source', esc(o.src || '—')) + kv('lb_k_total', m0(o.usd)) + kv('lb_k_when', when);
      case 'spin': return kv('lb_k_prize', m0(o.usd) + (o.a ? ' \u00b7 ' + esc(tick_(o)) : '')) + (o.a && o.price ? kv('lb_k_rate', pxS(o.a, o.price)) : '') + kv('lb_k_when', when);
      case 'class': { var nx = CLASSES[o.cls + 1]; return kv('lb_k_class', esc(clsName(CLASSES[o.cls]))) + kv('lb_k_next', nx ? esc(clsName(nx)) + ' \u00b7 ' + compact(nx.cap) : '—') + kv('lb_k_when', when); }
      case 'fin': case 'fout': return kv('lb_k_from', esc(t(o.k === 'fin' ? 'lb_v_spot' : 'lb_v_fut'))) + kv('lb_k_to', esc(t(o.k === 'fin' ? 'lb_v_fut' : 'lb_v_spot'))) + kv('lb_k_total', money(o.usd, 2)) + kv('lb_k_when', when);
      case 'fclose': return kv('lb_k_dir', esc(t(o.side === 'short' ? 'lb_v_short' : 'lb_v_long'))) + kv('lb_k_lev', esc(o.lev) + '×') +
        kv('lb_k_entry', pxS(o.a, o.entry || 0)) + kv('lb_k_exit', pxS(o.a, o.exit || 0)) + kv('lb_k_result', pnlSpan(o.pnl)) + kv('lb_k_when', when);
      case 'start': return kv('lb_op_start', m0(o.usd)) + kv('lb_k_when', when);
    }
    return '';
  }
  function opHTML(o, ins) {
    var amtCls = BONUS[o.k] ? 'g' : o.k === 'fclose' ? (o.pnl >= 0 ? 'up' : 'down') : '';
    var x = H.openId === o.id, fresh = ins || (o.k !== 'start' && o.t > H.freshAt);
    return '<div class="v3h-op' + (fresh ? ' fresh' : '') + (ins ? ' ins' : '') + (x ? ' x' : '') + '" data-id="' + esc(o.id) + '">' +
      '<button type="button" class="v3h-row" aria-expanded="' + x + '">' + opIcon(o) +
      '<span class="v3h-om"><b>' + esc(opTitle(o)) + '</b><span>' + opSub(o) + '</span></span>' +
      '<span class="v3h-oa"><b class="mono ' + amtCls + '">' + opAmt(o) + '</b><span class="mono">' + opRight(o) + '</span></span></button>' +
      '<div class="v3h-more"' + (x ? ' style="height:auto"' : '') + '><div class="v3h-kv">' + opKV(o) + '</div></div></div>';
  }
  function typeOk(o, f) { return f === 'all' || (f === 'bonus' && BONUS[o.k]) || (f === 'trade' && TRADE[o.k]) || (f === 'fut' && FUT[o.k]); }
  function renderOps(mode) {
    var p = H.per, t0 = perT0(p), all = ops(), pts = points(), cap = capital();
    var list = all.filter(function (o) { return o.t > t0 || (p === 'all' && o.k === 'start'); });
    var cnt = { all: 0, bonus: 0, trade: 0, fut: 0 };
    list.forEach(function (o) { ['all', 'bonus', 'trade', 'fut'].forEach(function (f) { if (typeOk(o, f)) cnt[f]++; }); });
    Object.keys(cnt).forEach(function (f) { var c = document.querySelector('[data-fc="' + f + '"]'); if (c) c.textContent = cnt[f]; });
    var rows = list.filter(function (o) { return typeOk(o, H.f); });
    var shown = rows.slice(0, H.limit), h = '', cur = null, buf = '', n = 0;
    var flush = function () {
      if (cur == null) return;
      var ds = cur, de = Math.min(ds + DAY, Date.now()), dch = valAt(de, pts, cap) - valAt(Math.max(ds, firstT()), pts, cap);
      h += '<div class="v3h-dayh"><b>' + esc(dayTitle(ds)) + '</b><span>' + n + ' ' + esc(plural(n, 'lb_op')) + '</span><em class="mono ' + (dch >= 0 ? 'up' : 'down') + '">' +
        esc(t('lb_day_cap', { x: sgn(dch, 0) })) + '</em></div><div class="v3h-dg">' + buf + '</div>';
    };
    shown.forEach(function (o) {
      var d = sod(o.t);
      if (d !== cur) { flush(); cur = d; buf = ''; n = 0; }
      var ins = mode === 'live' && !H.seen[o.id];
      buf += opHTML(o, ins);
      n++;
    });
    flush();
    all.forEach(function (o) { H.seen[o.id] = 1; });
    if (!shown.length) h = '<div class="v3h-empty">' + esc(t('lb_empty')) + '</div>';
    if (rows.length > shown.length) h += '<button type="button" class="v3h-morebtn">' + esc(t('lb_more_n', { n: Math.min(40, rows.length - shown.length), m: rows.length - shown.length })) + '</button>';
    var since = Number(S.lbLogSince) || 0;
    if (since > t0 + 60000) h += '<div class="v3h-cov">' + esc(t('lb_wf_cov', { d: whenS(since) })) + '</div>';
    var box = el('v3h-ops');
    box.innerHTML = h;
    /* Счётчики в чипах меняют их ширину — таблетка подстраивается. */
    if (mode !== 'open') moveInd(el('v3h-chips'), el('v3h-chips').querySelector('.v3h-chip.on'));
    if ((mode === 'period' || mode === 'filter') && box.animate && !V3.reduced()) {
      Array.prototype.slice.call(box.querySelectorAll('.v3h-dayh, .v3h-dg'), 0, 8).forEach(function (x, k) {
        x.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: D(380), delay: D(k * 40), easing: 'ease-out', fill: 'backwards' });
      });
    }
  }
  function toggleOp(op) {
    var id = op.getAttribute('data-id'), more = op.querySelector('.v3h-more'), row = op.querySelector('.v3h-row');
    if (H.openId && H.openId !== id) {
      var prev = el('v3h-ops').querySelector('.v3h-op.x');
      if (prev) collapseOp(prev);
    }
    if (!op.classList.contains('x')) {
      H.openId = id;
      op.classList.add('x');
      row.setAttribute('aria-expanded', 'true');
      more.style.height = more.scrollHeight + 'px';
      var done = function (e) { if (e.propertyName === 'height') { more.style.height = 'auto'; more.removeEventListener('transitionend', done); } };
      more.addEventListener('transitionend', done);
      if (!D(1)) more.style.height = 'auto';
    } else { H.openId = null; collapseOp(op); }
  }
  function collapseOp(op) {
    var more = op.querySelector('.v3h-more');
    op.classList.remove('x');
    op.querySelector('.v3h-row').setAttribute('aria-expanded', 'false');
    more.style.height = more.scrollHeight + 'px';
    reflow(more);
    more.style.height = '0px';
  }
  function jumpToOp(id) {
    var o = ops().filter(function (x) { return x.id === id; })[0];
    if (!o) return;
    if (!typeOk(o, H.f)) { H.f = 'all'; syncChips(); }
    var list = ops().filter(function (x) { return x.t > perT0(H.per) && typeOk(x, H.f); });
    var idx = list.indexOf(o);
    if (idx >= H.limit) H.limit = Math.ceil((idx + 1) / 40) * 40;
    renderOps('jump');
    var op = el('v3h-ops').querySelector('.v3h-op[data-id="' + id + '"]');
    if (!op) return;
    var sc = el('v3h-scroll'), top = op.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 120;
    sc.scrollTo({ top: top, behavior: V3.reduced() ? 'auto' : 'smooth' });
    later(380, function () { restart(op, 'flash'); if (!op.classList.contains('x')) toggleOp(op); });
  }
  /* Живая история: новые сделки (лимитки, ликвидации) появляются сразу. */
  function histTick() {
    if (!H.open) return;
    if (opsSig() !== H.sig) { renderHist('live'); return; }
    var end = capital(), start = valAt(perT0(H.per));
    setChg(el('v3h-chg'), el('v3h-chg-t'), end - start, start);
    if (Date.now() - H.chartAt > 1600 && !H.scr && !H.stopMorph) {
      H.chartAt = Date.now();
      H.vals = series(perT0(H.per), NPT);
      drawChart(false);
    }
  }

  /* ---------------- Сборка вкладки ---------------- */

  function render() {
    if (!el('lb-bal-card')) return;
    renderMoney('tick');
    renderAd();
    renderSpin();
    renderTape();
  }
  /* Вход на вкладку: одометр докручивается, полоса и цели заполняются,
     неделя серии встаёт каскадом, колесо чуть докручивается. */
  function intro() {
    if (!el('lb-bal-card')) return;
    var num = el('lobby-capital'), cap = capital();
    lastBal = S.balance;
    if (!V3.reduced()) V3.odo(num, cap, { fmt: fmtCap, from: cap * 0.9 });
    renderMoney('intro');
    renderDaily('intro');
    /* Во время спина колесо ведёт wheelSpin — доводка тянула бы его назад. */
    if (!V3.reduced() && !W.busy) {
      var r0 = W.rot;
      later(200, function () { if (!W.busy) V3.tween(1100, function (q) { if (!W.busy) setRot(r0 - 140 * (1 - V3.easeOut(q))); }); });
    }
    NW.sig = '';
    newsTick();
  }
  function cooldowns() {
    var claimed = S.dailyDay === dayKey(YaGame.serverTime());
    if (claimed === !!el('daily-btn')) renderDaily();
    var ml = msUntilTomorrow(YaGame.serverTime());
    var dt = el('daily-timer');
    if (dt) dt.textContent = fmtDuration(ml);
    var dr = el('daily-risk');
    if (dr) dr.textContent = fmtDuration(ml);
    var rg = el('daily-ring');
    if (rg) rg.style.strokeDashoffset = (100 - clamp(ml / DAY, 0, 1) * 100).toFixed(2);
    renderAd('tick');
    renderSpin('tick');
  }
  /* Лобби-часть игрового тика (500 мс). */
  var tk = 0;
  function tick() {
    if (currentTab !== 'lobby') return;
    tk++;
    if (tk % 4 === 0) { updTape(); if (tk % 20 === 0) renderTape(); }
    newsTick();
    if (tk % 2 === 0) renderMoney('tick');
    histTick();
  }
  /* Бонус получен: подарок подпрыгивает, монеты летят в капитал, цифры
     докручиваются по приземлении. Деньги уже начислены вызывающим. */
  function claimFx(kind, amt, src) {
    FX.vibrate([10, 30, 16]);
    if (kind === 'daily') {
      /* Подарок «открывается» со вспышкой лучей, фон карточки вспыхивает. */
      restart(el('lb-gift'), 'open');
      restart(el('lb-daily'), 'lb-dl-flash');
      stampNext = true;
    }
    if (kind === 'ad') restart(el('lb-adv'), 'pop');
    var tgt = capTarget();
    if (!src || !tgt || V3.reduced() || !src.getClientRects().length) { floatAt(tgt, '+' + m0(amt)); return; }
    holdCap(true);
    var daily = kind === 'daily', landed = false;
    var land = function () {
      if (landed) return;
      landed = true;
      Snd.play('coin_hit');
      holdCap(false);
      floatAt(capTarget(), '+' + m0(amt));
      if (daily) { dailyHold = false; renderDaily(); Snd.play('daily_stamp'); }
    };
    if (daily) { dailyHold = true; src.disabled = true; later(2500, land); }
    /* Ежедневный: монеты вылетают из открывшегося подарка. */
    var from = daily && el('lb-gift') && el('lb-gift').getClientRects().length ? el('lb-gift') : src;
    flyCoins(from, tgt, daily ? 14 : 9, land);
  }

  /* ---------------- Привязка ---------------- */

  var fromLobby = false, wantVip = false;
  function bind() {
    var bal = el('lb-bal');
    if (!bal || bal.__lb) return;
    bal.__lb = true;
    bal.addEventListener('click', openHist);
    el('lb-hist-btn').addEventListener('click', openHist);
    el('lb-goal').addEventListener('click', function () { fromLobby = true; openClasses(); });
    el('lb-tape').addEventListener('click', function (e) {
      var b = e.target.closest('.lb-tk');
      if (b && typeof openTrade === 'function') openTrade(b.getAttribute('data-a'));
    });
    /* Колесо: нажатие раскручивает мини-колесо, экран открывается на том
       режиме, что показан в карточке (после обычного — золотой). */
    /* Кнопка крутит колесо в карточке (перехват в фазе захвата — до
       onclick из main.js); тап по колесу открывает экран колеса на том
       режиме, что показан в карточке. */
    el('lb-spin-card').addEventListener('click', function (e) {
      var onBtn = e.target.closest('#spin-btn'), onWheel = e.target.closest('#lb-wheel-wrap');
      if (!onBtn && !onWheel) return;
      if (IN_CARD_SPIN && onBtn) { e.stopPropagation(); cardSpin(); return; }
      if (W.busy || spinBusy) { e.stopPropagation(); return; }
      wantVip = spinFreeLeftMs() > 0;
      whirl(1, 900);
      if (onWheel) openSpin();
    }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && H.open) { e.stopPropagation(); closeHist(); } }, true);
    window.addEventListener('resize', function () { if (H.open && H.vals) { drawChart(false); syncSeg(true); syncChips(true); } });
  }

  V3.after('openSpin', function () {
    if (wantVip && typeof spinSelect === 'function' && spinAvail('vip') && !spinAvail('free')) spinSelect('vip');
    wantVip = false;
  });
  V3.after('closeClasses', function () {
    if (!fromLobby) return;
    fromLobby = false;
    setTab('lobby', true);
    renderLobby();
  });
  V3.after('setTab', function (r, a) {
    if (a[0] === 'lobby' && !a[1]) intro();
    if (a[0] !== 'lobby' && H.open) closeHist();
  });
  V3.after('tick', function () { reconcile(); });
  /* Повышение класса: запись в журнал и анимация цели. */
  (function () {
    var orig = window.checkLevelUp;
    if (typeof orig !== 'function') return;
    window.checkLevelUp = function () {
      var before = S.classSeen, bal = S.balance;
      var r = orig.apply(this, arguments);
      try {
        if (S.classSeen > before && S.balance > bal) {
          var total = S.balance - bal;
          log('class', total, { cls: S.classSeen });
          levelFx(total);
        }
      } catch (e) { if (window.console) console.error('v3:checkLevelUp', e); }
      return r;
    };
  })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();

  return {
    render: render, renderMoney: renderMoney, renderDaily: renderDaily, renderAd: renderAd, renderSpin: renderSpin,
    cooldowns: cooldowns, capFrame: capFrame, tick: tick, log: log, claimFx: claimFx, intro: intro,
    openHist: openHist, closeHist: closeHist, ops: ops, valAt: valAt, coverage: coverage
  };
})();
