/* Фьючерсы: бессрочные контракты с плечом поверх движка рынка.

   Модель — изолированная маржа и отдельный фьючерсный кошелёк (S.fut.cash):
   деньги переводятся со спота и обратно, маржа и комиссия входа списываются
   с кошелька, выплата при закрытии возвращается в него. При ликвидации
   позиция теряет только свою маржу. Mark-цена — живая цена движка
   (Engine.live), вход и выход — по ask/bid, как на споте. Ликвидация
   наступает, когда equity = margin + PnL − funding опускается до
   поддерживающей маржи qty × mark × mmr.

   Экран контракта повторяет спотовый: шторка с графиком, кнопки
   Лонг/Шорт и позиции внизу. Модуль грузится после main.js и пользуется его
   глобалами (S, $, t, money, toast, openModal …). В main.js только точечные
   вызовы Fut.* под проверкой typeof Fut. */
'use strict';

var Fut = (function () {
  var FEE = 0.0005;                 // taker-комиссия от номинала, на входе и на выходе
  var FUND_MS = 60 * 60 * 1000;     // фандинг раз в час
  var FUND_CAP_SLOTS = 24;          // за долгое отсутствие — не больше суток фандинга
  var OFFLINE_MAX_MS = 12 * 3600 * 1000;
  var MIN_MARGIN = 5;
  var MAX_POS = 8;
  var HIST_MAX = 30;
  var HIST_SHOW = 10;
  var PERP_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'ripple', 'solana', 'dogecoin', 'tron',
    'hyperliquid', 'cardano', 'chainlink', 'monero', 'litecoin', 'bitcoin-cash', 'avalanche-2',
    'sui', 'shiba-inu', 'the-open-network', 'near', 'uniswap', 'bittensor', 'polkadot',
    'stellar', 'hedera-hashgraph', 'zcash', 'pepe'];
  var TFS = [1, 3, 12, 60, 180];
  var TF_KEY = { 1: 'tf_5s', 3: 'tf_15s', 12: 'tf_1m', 60: 'tf_5m', 180: 'tf_15m' };
  var TF_BARS = { 1: 72, 3: 72, 12: 60, 60: 48, 180: 24 };
  /* Масштаб графика контракта (Chart.zoomUI): bars — своё число свечей
     (0 = по таймфрейму), yk/ysh — шкала цен. Сбрасывается при открытии. */
  /* off — сдвиг в историю (свечей от текущей), как chartView.offset на споте. */
  var FZ = { bars: 0, yk: 1, ysh: 0, off: 0 }, fzUI = null;
  function fzBars() {
    var a = cv && cv.a, want = FZ.bars || TF_BARS[cv ? cv.tf : 1] || 60;
    var max = 240;
    try { if (a && Engine.depth) max = Math.min(240, Engine.depth(a, cv.tf)); } catch (e) { dbg('fut:depth', e); }
    return Math.max(12, Math.min(max, want));
  }
  var TP_ROE = [0, 25, 50, 100, 200];
  var SL_ROE = [0, -25, -50, -75];
  var PCTS = [10, 25, 50, 75, 100];
  var XF_PCTS = [25, 50, 75, 100];
  var CLOSE_PCTS = [25, 50, 75, 100];
  /* Добавить маржу: доля свободных средств фьючерсного счёта (как в концепте). */
  var ADD_PCTS = [25, 50, 75, 100];
  var RING_C = 100.53;              // 2π × r(16) — длина окружности кольца фандинга
  var CHART_MS = 66;                // перерисовка графика контракта ~15 кадров/с
  var OV_MS = 2500;                 // пересчёт обзора рынка
  var RESORT_TICKS = 8;             // живая сортировка списка — раз в 4 с

  var STR = {
    ru: {
      fut_seg_spot: 'Спот', fut_seg_fut: 'Фьючерсы',
      fut_all_header: 'Все контракты', fut_fav_aria: 'В избранное', fut_lev_upto: 'до {x}×',

      fut_intro_title: 'Фьючерсы — зарабатывай и на росте, и на падении',
      fut_intro_1: 'Лонг приносит прибыль, когда цена растёт, шорт — когда падает',
      fut_intro_2: 'Плечо умножает и прибыль, и убыток',
      fut_intro_3: 'Убыток съел маржу — позицию ликвидируют, маржа сгорает',
      fut_intro_4: 'Сначала переведи деньги со спота на фьючерсный счёт',
      fut_intro_ok: 'Понятно',
      fut_mk_cap: 'Капитализация', fut_mk_sent: 'Настроение', fut_mk_fg: 'Страх и жадность',
      fut_sent_1: 'Медвежье', fut_sent_2: 'Осторожное', fut_sent_3: 'Нейтральное', fut_sent_4: 'Бычье', fut_sent_5: 'Эйфория',
      fut_fg_1: 'Крайний страх', fut_fg_2: 'Страх', fut_fg_3: 'Нейтрально', fut_fg_4: 'Жадность', fut_fg_5: 'Крайняя жадность',
      fut_w_spot: 'Спот', fut_w_fut: 'Фьючерсы', fut_xfer_btn: 'Перевод',
      fut_search_ph: 'Поиск: BTC, Solana…', fut_search_empty: 'По запросу «{q}» контрактов нет', fut_search_reset: 'Сбросить поиск',
      fut_sort_funding: 'Фандингу', fut_sort_funding_sub: 'Кто платит больше за удержание',
      fut_c_one: 'контракт', fut_c_few: 'контракта', fut_c_many: 'контрактов',
      fut_xfer_title: 'Перевод средств', fut_xfer_sub: 'Между спотом и фьючерсами',
      fut_from: 'Откуда', fut_to: 'Куда', fut_amount: 'Сумма перевода', fut_after: 'После перевода',
      fut_xfer_do: 'Перевести {x}', fut_xfer_done: '{x} → {w}', fut_xfer_zero: 'Нечего переводить',
      fut_xfer_hint: 'Маржа для фьючерсов берётся только с фьючерсного счёта',
      fut_a11y_xfer: 'Перевод между счетами', fut_a11y_swap: 'Поменять направление',
      fut_perp_sub: 'Бессрочный · {name}', fut_up_to: 'до {x}×',
      fut_long: 'Лонг', fut_short: 'Шорт', fut_pill_long: 'ЛОНГ', fut_pill_short: 'ШОРТ',
      fut_longs: 'Лонги', fut_shorts: 'Шорты', fut_funding_1h: 'Фандинг · 1ч',
      fut_d_pos: 'Позиции', fut_d_hist: 'История',
      fut_no_pos: 'Позиций по {t} нет — выбери Лонг или Шорт', fut_no_hist: 'Сделок по {t} ещё не было',
      fut_margin: 'Маржа', fut_size: 'Размер позиции', fut_leverage: 'Кредитное плечо',
      fut_margin_from: 'Маржа с фьючерсного счёта', fut_avail: 'Доступно: {x}',
      fut_risk_1: 'Спокойно', fut_risk_2: 'Умеренно', fut_risk_3: 'Высокий риск', fut_risk_4: 'Экстрим',
      fut_funding_rate: 'Фандинг / 1ч',
      fut_tpsl: 'Тейк-профит и стоп-лосс', fut_tp_long: 'Тейк-профит', fut_sl_long: 'Стоп-лосс',
      fut_off: 'Выкл', fut_tpsl_off: 'не заданы',
      fut_entry: 'Цена входа', fut_liq: 'Цена ликвидации', fut_mmr: 'Поддерж. маржа', fut_fee: 'Комиссия (0.05%)',
      fut_entry_short: 'Вход', fut_mark_short: 'Mark', fut_liq_short: 'Ликвидация',
      fut_ln_entry: 'Вход', fut_ln_liq: 'Ликв.',
      fut_open_long: 'Открыть лонг {x}×', fut_open_short: 'Открыть шорт {x}×',
      fut_err_min: 'Минимальная маржа — {x}', fut_err_funds: 'Недостаточно средств на фьючерсном счёте',
      fut_err_cash: 'На фьючерсном счёте нет средств', fut_topup: 'Перевести со спота',
      fut_err_max: 'Не больше {n} позиций одновременно',
      fut_warn_hi: 'Высокое плечо: позицию ликвидируют, если цена пройдёт {p} против вас',
      fut_toast_open: '{side} {t} {x}× открыт по {p}',
      fut_toast_closed: '{t} закрыт · {x}', fut_toast_part: '{t}: закрыто {p}% · {x}',
      fut_toast_liq: 'Ликвидация {t} · −{x}', fut_toast_tp: 'Тейк-профит {t} · {x}', fut_toast_sl: 'Стоп-лосс {t} · {x}',
      fut_toast_fund: 'Фандинг по фьючерсам: {x}', fut_toast_margin: 'Маржа +{x} · ликвидация {p}',
      fut_away: 'Пока вас не было: {x}', fut_stamp: 'ЛИКВИДАЦИЯ',
      fut_close: 'Закрыть', fut_confirm_close: 'Точно? {x}', fut_manage: 'Управлять',
      fut_ratio: 'Маржин. коэфф.', fut_margin_lbl: 'маржа {x}',
      fut_pos_pnl: 'PnL позиции', fut_pos_size: 'Размер', fut_pos_fund: 'Фандинг',
      fut_sec_tpsl: 'TP / SL', fut_sec_add: 'Добавить маржу', fut_sec_close: 'Закрыть позицию',
      fut_add_btn: 'Добавить {x} · ликвидация {p}', fut_close_btn: 'Закрыть {p}% · {x}', fut_new_liq: 'новая ликвидация {p}',
      fut_history: 'История сделок', fut_r_close: 'Закрыта', fut_r_tp: 'TP', fut_r_sl: 'SL', fut_r_liq: 'Ликвидация', fut_r_part: 'Часть {p}%',
      fut_pf_title: 'Фьючерсы', fut_pf_eq: 'Эквити фьючерсов', fut_pf_cash: 'Свободно', fut_in_margin: 'В марже',
      fut_upnl: 'Нереализ. PnL', fut_funding_in: 'до фандинга', fut_positions: 'Открытые позиции',
      fut_pf_empty: 'Открытых позиций нет', fut_pf_go: 'К фьючерсам',
      fut_rail_mark: 'Сейчас', fut_rail_liq: 'LIQ',
      fut_sure: 'Точно?', fut_pct_all: 'Всё', fut_add_none: 'На фьючерсном счёте нет средств', fut_closed_all: 'Позиция закрыта', fut_closed_part: 'Закрыто {p}%',
      fut_tpsl_sub: '{r} ROE · {p}', fut_tpsl_gone: 'выключен'
    },
    en: {
      fut_seg_spot: 'Spot', fut_seg_fut: 'Futures',
      fut_all_header: 'All contracts', fut_fav_aria: 'Add to favorites', fut_lev_upto: 'up to {x}×',

      fut_intro_title: 'Futures — profit when prices rise or fall',
      fut_intro_1: 'A long profits when the price rises, a short when it falls',
      fut_intro_2: 'Leverage multiplies both profit and loss',
      fut_intro_3: 'If losses eat the margin, the position is liquidated and the margin is gone',
      fut_intro_4: 'First transfer money from spot to the futures account',
      fut_intro_ok: 'Got it',
      fut_mk_cap: 'Market cap', fut_mk_sent: 'Sentiment', fut_mk_fg: 'Fear & Greed',
      fut_sent_1: 'Bearish', fut_sent_2: 'Cautious', fut_sent_3: 'Neutral', fut_sent_4: 'Bullish', fut_sent_5: 'Euphoria',
      fut_fg_1: 'Extreme fear', fut_fg_2: 'Fear', fut_fg_3: 'Neutral', fut_fg_4: 'Greed', fut_fg_5: 'Extreme greed',
      fut_w_spot: 'Spot', fut_w_fut: 'Futures', fut_xfer_btn: 'Transfer',
      fut_search_ph: 'Search: BTC, Solana…', fut_search_empty: 'No contracts match “{q}”', fut_search_reset: 'Clear search',
      fut_sort_funding: 'Funding', fut_sort_funding_sub: 'Who pays more to hold',
      fut_c_one: 'contract', fut_c_few: 'contracts', fut_c_many: 'contracts',
      fut_xfer_title: 'Transfer funds', fut_xfer_sub: 'Between spot and futures',
      fut_from: 'From', fut_to: 'To', fut_amount: 'Amount', fut_after: 'After transfer',
      fut_xfer_do: 'Transfer {x}', fut_xfer_done: '{x} → {w}', fut_xfer_zero: 'Nothing to transfer',
      fut_xfer_hint: 'Futures margin comes only from the futures account',
      fut_a11y_xfer: 'Transfer between accounts', fut_a11y_swap: 'Swap direction',
      fut_perp_sub: 'Perpetual · {name}', fut_up_to: 'up to {x}×',
      fut_long: 'Long', fut_short: 'Short', fut_pill_long: 'LONG', fut_pill_short: 'SHORT',
      fut_longs: 'Longs', fut_shorts: 'Shorts', fut_funding_1h: 'Funding · 1h',
      fut_d_pos: 'Positions', fut_d_hist: 'History',
      fut_no_pos: 'No {t} positions — pick Long or Short', fut_no_hist: 'No {t} trades yet',
      fut_margin: 'Margin', fut_size: 'Position size', fut_leverage: 'Leverage',
      fut_margin_from: 'Margin from futures account', fut_avail: 'Available: {x}',
      fut_risk_1: 'Calm', fut_risk_2: 'Moderate', fut_risk_3: 'High risk', fut_risk_4: 'Extreme',
      fut_funding_rate: 'Funding / 1h',
      fut_tpsl: 'Take profit & stop loss', fut_tp_long: 'Take profit', fut_sl_long: 'Stop loss',
      fut_off: 'Off', fut_tpsl_off: 'not set',
      fut_entry: 'Entry price', fut_liq: 'Liquidation price', fut_mmr: 'Maintenance margin', fut_fee: 'Fee (0.05%)',
      fut_entry_short: 'Entry', fut_mark_short: 'Mark', fut_liq_short: 'Liquidation',
      fut_ln_entry: 'Entry', fut_ln_liq: 'Liq.',
      fut_open_long: 'Open long {x}×', fut_open_short: 'Open short {x}×',
      fut_err_min: 'Minimum margin is {x}', fut_err_funds: 'Not enough funds in the futures account',
      fut_err_cash: 'The futures account is empty', fut_topup: 'Transfer from spot',
      fut_err_max: 'Up to {n} positions at once',
      fut_warn_hi: 'High leverage: the position is liquidated if the price moves {p} against you',
      fut_toast_open: '{side} {t} {x}× opened at {p}',
      fut_toast_closed: '{t} closed · {x}', fut_toast_part: '{t}: closed {p}% · {x}',
      fut_toast_liq: '{t} liquidated · −{x}', fut_toast_tp: 'Take profit {t} · {x}', fut_toast_sl: 'Stop loss {t} · {x}',
      fut_toast_fund: 'Futures funding: {x}', fut_toast_margin: 'Margin +{x} · liquidation {p}',
      fut_away: 'While you were away: {x}', fut_stamp: 'LIQUIDATED',
      fut_close: 'Close', fut_confirm_close: 'Sure? {x}', fut_manage: 'Manage',
      fut_ratio: 'Margin ratio', fut_margin_lbl: 'margin {x}',
      fut_pos_pnl: 'Position PnL', fut_pos_size: 'Size', fut_pos_fund: 'Funding',
      fut_sec_tpsl: 'TP / SL', fut_sec_add: 'Add margin', fut_sec_close: 'Close position',
      fut_add_btn: 'Add {x} · liquidation {p}', fut_close_btn: 'Close {p}% · {x}', fut_new_liq: 'new liquidation {p}',
      fut_history: 'Trade history', fut_r_close: 'Closed', fut_r_tp: 'TP', fut_r_sl: 'SL', fut_r_liq: 'Liquidated', fut_r_part: 'Part {p}%',
      fut_pf_title: 'Futures', fut_pf_eq: 'Futures equity', fut_pf_cash: 'Free', fut_in_margin: 'In margin',
      fut_upnl: 'Unrealized PnL', fut_funding_in: 'to funding', fut_positions: 'Open positions',
      fut_pf_empty: 'No open positions', fut_pf_go: 'Go to futures',
      fut_rail_mark: 'Now', fut_rail_liq: 'LIQ',
      fut_sure: 'Sure?', fut_pct_all: 'All', fut_add_none: 'No funds on the futures account', fut_closed_all: 'Position closed', fut_closed_part: 'Closed {p}%',
      fut_tpsl_sub: '{r} ROE · {p}', fut_tpsl_gone: 'off'
    }
  };
  (function mergeStrings() {
    if (typeof I18N === 'undefined') return;
    Object.keys(STR).forEach(function (lang) {
      if (!I18N[lang]) return;
      Object.keys(STR[lang]).forEach(function (k) {
        if (I18N[lang][k] === undefined) I18N[lang][k] = STR[lang][k];
      });
    });
  })();

  function svg(inner, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2.2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  var ICON = {
    up: svg('<path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/>', 2.6),
    down: svg('<path d="M4 7l6 6 4-4 6 7"/><path d="M15 16h5v-5"/>', 2.6),
    warn: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>', 2),
    chev: svg('<path d="M9 5l7 7-7 7"/>', 2.6),
    close: svg('<path d="M15 18l-6-6 6-6"/>', 2),
    xfer: svg('<path d="M4 8h14l-4-4M20 16H6l4 4"/>', 2.1),
    swapV: svg('<path d="M8 4v16l-4-4M16 20V4l4 4"/>', 2.2),
    wallet: svg('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>', 1.9),
    bolt: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', 1.9),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', 2),
    sort: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h13M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="19" cy="17" r="2"/></svg>',
    candle: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="8" width="4" height="9" rx="1.2"/><path d="M6 5v3M6 17v2"/><rect x="14" y="6" width="4" height="8" rx="1.2"/><path d="M16 3v3M16 14v4"/></svg>',
    line: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l4.5-5 3.5 3 8-8"/></svg>',
    funding: '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="fsoG" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f7d879"/><stop offset=".55" stop-color="#e9b640"/><stop offset="1" stop-color="#b9820f"/></linearGradient></defs>' +
      '<circle cx="24" cy="24" r="19" fill="url(#fsoG)"/><circle cx="24" cy="24" r="14.5" fill="none" stroke="#7a5308" stroke-opacity=".45" stroke-width="1.5"/>' +
      '<path d="M17 30l14-12M18.5 19.5h.01M29.5 28.5h.01" stroke="#4a3104" stroke-width="3.2" stroke-linecap="round"/></svg>',
    bull: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 6c0 4.5 2.4 6.8 6 7.5M27 6c0 4.5-2.4 6.8-6 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M10 12.5h12l1.4 6.2c.4 4.3-3.1 8.3-7.4 8.3s-7.8-4-7.4-8.3z" fill="currentColor"/>' +
      '<ellipse cx="16" cy="23.2" rx="4.4" ry="2.9" fill="#0b0f14" fill-opacity=".28"/><circle cx="12.6" cy="17.2" r="1.2" fill="#0b0f14"/><circle cx="19.4" cy="17.2" r="1.2" fill="#0b0f14"/></svg>',
    bear: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="9" cy="9" r="3.6" fill="currentColor"/><circle cx="23" cy="9" r="3.6" fill="currentColor"/>' +
      '<circle cx="16" cy="17.5" r="9.5" fill="currentColor"/><ellipse cx="16" cy="21" rx="4.2" ry="3.1" fill="#0b0f14" fill-opacity=".28"/>' +
      '<circle cx="12.4" cy="15.6" r="1.2" fill="#0b0f14"/><circle cx="19.6" cy="15.6" r="1.2" fill="#0b0f14"/><circle cx="16" cy="19.8" r="1.3" fill="#0b0f14"/></svg>'
  };

  var perps = [];
  var PERP_SET = {};
  var q = '';                // поиск по контрактам (не сохраняется)
  var sh = null;             // шит ордера: { a, side, lev, margin, tp, sl, pct }
  var pm = null;             // шит позиции: { id, close, add }
  var cv = null;             // экран контракта: { a, tf, tab, hover, hoverY }
  var xf = null;             // шит перевода: { dir, amt, pct }
  var sp = null;             // черновик сортировки
  var sigs = {};             // подписи уже отрисованных списков
  var newPosId = 0;
  var holdUntil = 0;         // пока играет анимация закрытия, списки позиций не пересобираем
  var armed = { id: 0, until: 0 };
  var tickN = 0;
  var chartRaf = 0, chartDrawAt = 0;
  var candleCache = { key: '', data: null };
  var lastBadge = -1;
  var ov = { at: 0, sparkAt: 0, spark: null, cap: 0, chg: 0, score: 3, fg: 50 };

  /* ------------------------------ Утилиты ------------------------------ */

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function floor2(v) { return Math.floor(v * 100 + 1e-6) / 100; }
  function perpName(a) { return a.ticker + '-PERP'; }
  function signed(v, dec) { return (v >= 0 ? '+' : '\u2212') + money(Math.abs(v), dec); }
  /* FX.trade красит всплывающий текст по ASCII-дефису в начале строки. */
  function fxPnl(v) { return (v >= 0 ? '+' : '-') + money(Math.abs(v)); }
  function pctStr(v, d) { return (v >= 0 ? '+' : '\u2212') + (Math.abs(v) * 100).toFixed(d == null ? 2 : d) + '%'; }
  function pxs(a, p) { return money(p, a.dec); }
  function cls(v) { return v >= 0 ? 'up' : 'down'; }
  function levTxt(v) { return (Math.round(v * 10) / 10) + '\u00D7'; }
  function amtTxt(v) { return String(floor2(v)).replace(/\.0+$/, ''); }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function hash01(a, b) {
    var h = ((a | 0) * 374761393 + (b | 0) * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function el(id) { return document.getElementById(id); }
  function modalOpen(id) {
    var m = el(id);
    return !!m && !m.classList.contains('hidden') && !m.classList.contains('modal-out');
  }
  function setText(e, v) { if (e && e.textContent !== v) e.textContent = v; }
  function setHtml(e, h) { if (e && e.__h !== h) { e.innerHTML = h; e.__h = h; } }
  function pinTo(e, v) {
    if (!e) return;
    e.classList.toggle('up', v >= 0);
    e.classList.toggle('down', v < 0);
  }
  function plural(n) {
    var a = Math.abs(n) % 10, b = Math.abs(n) % 100;
    if (LANG !== 'ru') return n === 1 ? t('fut_c_one') : t('fut_c_many');
    if (a === 1 && b !== 11) return t('fut_c_one');
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t('fut_c_few');
    return t('fut_c_many');
  }
  function isVisible(e) { return !!e && e.offsetParent !== null; }
  function tfAllowed(tf) {
    return !((tf === 60 || tf === 180) && typeof Ach !== 'undefined' && Ach.tfAllowed && !Ach.tfAllowed());
  }
  function notifyAch() {
    if (typeof Ach !== 'undefined' && Ach.modalClosed) { try { Ach.modalClosed(); } catch (e) { dbg('fut:ach', e); } }
  }

  /* ------------------------------ Модель ------------------------------ */

  function dirOf(p) { return p.side === 'long' ? 1 : -1; }
  function mmrFor(lev) { return lev >= 25 ? 0.01 : lev >= 10 ? 0.005 : 0.004; }
  function maxLev(a) {
    var tier = 1;
    try { tier = Engine.capTier(a); } catch (e) { dbg('fut:capTier', e); }
    if (tier >= 3) return 50;
    if (tier === 2) return 25;
    return a.sector === 'meme' ? 10 : 20;
  }
  function levTicks(max) {
    return max >= 50 ? [1, 10, 25, 50] : max >= 25 ? [1, 5, 10, 25]
      : max >= 20 ? [1, 5, 10, 20] : [1, 3, 5, 10];
  }
  function riskLevel(lev) { return lev <= 5 ? 1 : lev <= 15 ? 2 : lev <= 30 ? 3 : 4; }
  var RISK_C = { 1: 'var(--up)', 2: 'var(--gold)', 3: 'var(--hot)', 4: 'var(--down)' };

  function markOf(a, ts) { return Engine.live(a, ts); }
  function entryPx(a, side, ts) { return side === 'long' ? Engine.ask(a, ts) : Engine.bid(a, ts); }
  function exitPx(a, p, ts) { return p.side === 'long' ? Engine.bid(a, ts) : Engine.ask(a, ts); }
  function slotOf(ts) { return Math.floor(ts / FUND_MS); }
  function chg24(a, ts) {
    try { return Engine.change(a, ts); } catch (e) { dbg('fut:change', e); return 0; }
  }

  /* Ставка фандинга за час: долгосрочная база +0.01% и перекос толпы за
     растущим рынком. Положительная — лонги платят шортам. */
  function fundRate(a, ts) {
    var r = 0.0001 + clamp(chg24(a, ts), -0.15, 0.15) * 0.002 + (hash01(a.seed + 77, slotOf(ts)) - 0.5) * 0.0002;
    return clamp(r, -0.0006, 0.0006);
  }
  function longShare(a, ts) {
    return clamp(0.5 + clamp(chg24(a, ts) * 1.6, -0.18, 0.18) + (hash01(a.seed + 91, Math.floor(ts / 30000)) - 0.5) * 0.06, 0.22, 0.78);
  }
  function volOf(a) {
    try { return typeof vol24 === 'function' ? vol24(a) : 0; } catch (e) { dbg('fut:vol', e); return 0; }
  }
  function capOf(a) {
    try { return typeof marketCapOf === 'function' ? marketCapOf(a) : 0; } catch (e) { dbg('fut:cap', e); return 0; }
  }

  function pricePnl(p, x) { return (x - p.entry) * p.qty * dirOf(p); }
  /* Цена, при которой equity сравняется с поддерживающей маржой. */
  function liqPrice(p) {
    var qn = p.qty, E = p.entry, M = p.margin - p.fund, m = p.mmr;
    if (!(qn > 0)) return 0;
    return p.side === 'long' ? Math.max(0, (qn * E - M) / (qn * (1 - m))) : (M + qn * E) / (qn * (1 + m));
  }
  function previewLiq(side, e, lev) {
    return liqPrice({ side: side, entry: e, qty: 1, margin: e / lev, fund: 0, mmr: mmrFor(lev) });
  }
  function effLev(p) { return p.margin > 0 ? p.qty * p.entry / p.margin : p.lev; }
  function marginRatio(p, mk) {
    var eq = p.margin + pricePnl(p, mk) - p.fund;
    return eq <= 0 ? 1 : clamp(p.qty * mk * p.mmr / eq, 0, 1);
  }
  function roeToPx(e, lev, side, roe) {
    if (!roe) return 0;
    var mv = roe / 100 / lev;
    return side === 'long' ? e * (1 + mv) : e * (1 - mv);
  }
  function beyondLiq(side, px, liq) { return side === 'long' ? px <= liq : px >= liq; }
  /* Что игрок получит, закрыв позицию прямо сейчас, и чистый результат
     с учётом обеих комиссий и фандинга. */
  function snap(p, ts) {
    var a = assetById(p.a);
    var mk = markOf(a, ts), x = exitPx(a, p, ts);
    var payout = Math.max(0, p.margin + pricePnl(p, x) - p.fund - p.qty * x * FEE);
    var net = payout - p.margin - p.fee;
    return { a: a, mk: mk, x: x, payout: payout, net: net, roe: p.margin > 0 ? net / p.margin : 0,
      liq: liqPrice(p), ratio: marginRatio(p, mk) };
  }

  /* ------------------------------ Состояние ------------------------------ */

  function freshStats() { return { opened: 0, closed: 0, liq: 0, wins: 0, pnl: 0, fees: 0, funding: 0, vol: 0, best: 0, worst: 0 }; }
  function freshFut() {
    return { v: 2, cash: 0, pos: [], hist: [], seq: 1, lev: 10, side: 'long', tf: 1, amt: 0, view: 'spot',
      intro: false, fundSlot: slotOf(now()), sortKey: 'cap', sortDir: 'desc', cat: 'all', levF: 'all', st: freshStats() };
  }
  function st() {
    if (!S.fut || typeof S.fut !== 'object' || !Array.isArray(S.fut.pos) || !Array.isArray(S.fut.hist) || !S.fut.st) S.fut = freshFut();
    return S.fut;
  }
  function cash() { var f = st(); return f.cash > 0 ? f.cash : 0; }
  function maxMargin(lev) { return Math.max(0, floor2(cash() / (1 + lev * FEE))); }
  function findPos(id) {
    var f = st();
    for (var i = 0; i < f.pos.length; i++) if (f.pos[i].id === id) return f.pos[i];
    return null;
  }
  function posOf(aid) { return st().pos.filter(function (p) { return p.a === aid; }); }
  function hasPos(aid) { return posOf(aid).length > 0; }

  var SORT_KEYS = ['cap', 'price', 'change', 'volume', 'funding', 'az'];
  /* Чипы над списком фьючерсов фильтруют по максимальному плечу (как в концепте). */
  var LEV_FILTERS = ['all', '50', '25', '20', '10'];
  /* Облачный сейв может прийти побитым: чиним типы, отбрасываем мусор.
     Позиции с живыми деньгами не обрезаем по MAX_POS — лимит только на открытие. */
  function sanitize() {
    var raw = S.fut, f = freshFut();
    if (raw && typeof raw === 'object') {
      f.cash = Math.max(0, num(raw.cash, 0));
      f.seq = Math.max(1, Math.floor(num(raw.seq, 1)));
      f.lev = clamp(Math.round(num(raw.lev, 10)), 1, 50);
      f.side = raw.side === 'short' ? 'short' : 'long';
      f.tf = TFS.indexOf(raw.tf) >= 0 ? raw.tf : 1;
      f.amt = Math.max(0, num(raw.amt, 0));
      f.view = raw.view === 'fut' ? 'fut' : 'spot';
      f.intro = !!raw.intro;
      f.fundSlot = num(raw.fundSlot, f.fundSlot);
      f.sortKey = SORT_KEYS.indexOf(raw.sortKey) >= 0 ? raw.sortKey : 'cap';
      f.sortDir = raw.sortDir === 'asc' ? 'asc' : 'desc';
      f.cat = typeof raw.cat === 'string' ? raw.cat : 'all';
      f.levF = LEV_FILTERS.indexOf(String(raw.levF)) >= 0 ? String(raw.levF) : 'all';
      f.xferDir = raw.xferDir === 'toSpot' ? 'toSpot' : 'toFut';
      if (raw.st && typeof raw.st === 'object') for (var k in f.st) f.st[k] = num(raw.st[k], 0);
      var ids = {};
      (Array.isArray(raw.pos) ? raw.pos : []).forEach(function (p) {
        if (!p || typeof p !== 'object' || !assetById(p.a)) return;
        var ts = now();
        var n = { id: Math.floor(num(p.id, 0)), a: p.a, side: p.side === 'short' ? 'short' : 'long',
          lev: clamp(num(p.lev, 1), 1, 125), margin: num(p.margin, 0), entry: num(p.entry, 0), qty: num(p.qty, 0),
          mmr: clamp(num(p.mmr, 0.005), 0.001, 0.05), fund: num(p.fund, 0), fee: Math.max(0, num(p.fee, 0)),
          t: num(p.t, ts), chk: num(p.chk, num(p.t, ts)), tp: Math.max(0, num(p.tp, 0)), sl: Math.max(0, num(p.sl, 0)) };
        if (!(n.margin > 0 && n.entry > 0 && n.qty > 0)) return;
        if (!(n.id > 0) || ids[n.id]) n.id = 0;
        ids[n.id] = 1;
        f.pos.push(n);
      });
      f.pos.forEach(function (n) { f.seq = Math.max(f.seq, n.id + 1); });
      f.pos.forEach(function (n) { if (!n.id) n.id = f.seq++; });
      (Array.isArray(raw.hist) ? raw.hist : []).forEach(function (h) {
        if (!h || typeof h !== 'object' || !assetById(h.a) || !isFinite(Number(h.pnl))) return;
        f.hist.push({ a: h.a, side: h.side === 'short' ? 'short' : 'long', lev: num(h.lev, 1), entry: num(h.entry, 0),
          exit: num(h.exit, 0), pnl: num(h.pnl, 0), roe: num(h.roe, 0),
          reason: ['close', 'tp', 'sl', 'liq'].indexOf(h.reason) >= 0 ? h.reason : 'close',
          t: num(h.t, 0), part: Math.max(0, Math.floor(num(h.part, 0))) });
      });
      if (f.hist.length > HIST_MAX) f.hist.length = HIST_MAX;
    }
    S.fut = f;
  }

  /* Весь фьючерсный счёт «если закрыть всё сейчас» — входит в капитал игрока. */
  function equity() {
    var f = st(), ts = now(), s = cash();
    for (var i = 0; i < f.pos.length; i++) {
      var p = f.pos[i], a = assetById(p.a);
      if (!a) continue;
      var x = exitPx(a, p, ts);
      s += Math.max(0, p.margin + pricePnl(p, x) - p.fund - p.qty * x * FEE);
    }
    return s;
  }

  /* ------------------------------ Сделки ------------------------------ */

  function checkOpen() {
    var f = st();
    if (!sh) return 'x';
    if (f.pos.length >= MAX_POS) return t('fut_err_max', { n: MAX_POS });
    if (cash() < 0.01) return t('fut_err_cash');
    if (maxMargin(sh.lev) < MIN_MARGIN) return t('fut_err_funds');
    if (sh.margin < MIN_MARGIN) return t('fut_err_min', { x: money(MIN_MARGIN, 0) });
    if (sh.margin * (1 + sh.lev * FEE) > cash() + 1e-9) return t('fut_err_funds');
    return '';
  }

  function openPosition(btn) {
    var err = checkOpen();
    if (err) { FX.nudge(btn); if (err !== 'x') toast(err, 'bad'); return; }
    var f = st(), a = sh.a, ts = now();
    var e = entryPx(a, sh.side, ts);
    if (!(e > 0)) return;
    var notional = sh.margin * sh.lev, fee = notional * FEE;
    var p = { id: f.seq++, a: a.id, side: sh.side, lev: sh.lev, margin: sh.margin, entry: e,
      qty: notional / e, mmr: mmrFor(sh.lev), fund: 0, fee: fee, t: ts, chk: ts, tp: 0, sl: 0 };
    var liq = liqPrice(p);
    if (sh.tp) p.tp = Math.max(0, roeToPx(e, sh.lev, sh.side, sh.tp));
    if (sh.sl) {
      var slp = roeToPx(e, sh.lev, sh.side, sh.sl);
      if (slp > 0 && !beyondLiq(sh.side, slp, liq)) p.sl = slp;
    }
    f.cash = Math.max(0, cash() - sh.margin - fee);
    f.pos.unshift(p);
    f.lev = sh.lev; f.side = sh.side; f.amt = sh.margin;
    f.st.opened++; f.st.fees += fee; f.st.vol += notional;
    newPosId = p.id;
    saveState(true);
    try { pushPfSnapshot(true); } catch (ex) { dbg('fut:snapshot', ex); }

    var pt = FX.center(btn);
    Snd.play(sh.side === 'long' ? 'long' : 'short');
    FX.edgeFlash(sh.side === 'long' ? 'up' : 'down');
    FX.burst(pt.x, pt.y, { kind: 'coin', count: 18, spread: 120 });
    FX.vibrate([12, 38, 20]);
    toast(t('fut_toast_open', { side: t(sh.side === 'long' ? 'fut_long' : 'fut_short'), t: perpName(a),
      x: sh.lev, p: pxs(a, e) }), 'gold');
    closeOrder();
    if (cv && cv.a.id === a.id) {
      setDeskTab('pos');
      renderDesk(true);
      var card = document.querySelector('#fc-pos .fut-pos[data-pid="' + p.id + '"]');
      if (card && card.scrollIntoView) {
        try { card.scrollIntoView({ block: 'nearest', behavior: FX.reducedMotion() ? 'auto' : 'smooth' }); } catch (ex) { dbg('fut:scroll', ex); }
      }
    }
    refreshAll(now());
    newPosId = 0;
  }

  /* Ядро закрытия: деньги, история, статистика. Без UI — его вызывает и
     офлайн-проверка при загрузке, когда интерфейса ещё нет. */
  function closeCore(p, frac, reason, x, ts) {
    var f = st();
    var whole = frac >= 0.999;
    frac = whole ? 1 : clamp(frac, 0.01, 1);
    var qn = p.qty * frac, m = p.margin * frac, fd = p.fund * frac, fe = p.fee * frac;
    var closeFee = reason === 'liq' ? 0 : qn * x * FEE;
    var payout = reason === 'liq' ? 0 : Math.max(0, m + (x - p.entry) * qn * dirOf(p) - fd - closeFee);
    var net = payout - m - fe;
    var lev = effLev(p);
    f.cash = cash() + payout;
    if (whole) {
      var i = f.pos.indexOf(p);
      if (i >= 0) f.pos.splice(i, 1);
    } else {
      p.qty -= qn; p.margin -= m; p.fund -= fd; p.fee -= fe;
    }
    f.hist.unshift({ a: p.a, side: p.side, lev: Math.round(lev * 10) / 10, entry: p.entry, exit: x, pnl: net,
      roe: m > 0 ? net / m : 0, reason: reason, t: ts, part: whole ? 0 : Math.round(frac * 100) });
    if (f.hist.length > HIST_MAX) f.hist.length = HIST_MAX;
    var s = f.st;
    s.closed++;
    if (reason === 'liq') s.liq++;
    if (net > 0) s.wins++;
    s.pnl += net; s.fees += closeFee; s.vol += qn * x;
    s.best = Math.max(s.best, net); s.worst = Math.min(s.worst, net);
    return { net: net, payout: payout, whole: whole, margin: m };
  }

  function visibleCards(id) {
    return Array.prototype.filter.call(document.querySelectorAll('.fut-pos[data-pid="' + id + '"]'), isVisible);
  }

  function finishClose(p, frac, reason, x, srcEl) {
    var a = assetById(p.a), ts = now();
    var cards = visibleCards(p.id);
    var from = srcEl || cards[0];
    var r = closeCore(p, frac, reason, x, ts);
    saveState(true);
    try { pushPfSnapshot(true); } catch (e) { dbg('fut:snapshot', e); }
    var name = perpName(a), pnlTxt = signed(r.net), fxTxt = fxPnl(r.net);
    Snd.play(reason === 'liq' ? 'liquidation' : reason === 'tp' ? 'tp' : reason === 'sl' ? 'sl' : r.net >= 0 ? 'sell_profit' : 'sell_loss');
    if (reason === 'liq') {
      toast(t('fut_toast_liq', { t: name, x: money(r.margin) }), 'bad');
      FX.edgeFlash('down');
      FX.vibrate([60, 40, 140]);
      liqStamp(p.a);
      if (cards[0]) {
        var pt = FX.center(cards[0]);
        FX.burst(pt.x, pt.y, { kind: 'paper', count: 16, spread: 120, colors: ['#ff5f57', '#f0524f', '#d64545'] });
      }
    } else if (reason === 'tp') {
      toast(t('fut_toast_tp', { t: name, x: pnlTxt }), 'ok');
      FX.trade('sell', from, fxTxt);
      if (from) { var pt2 = FX.center(from); FX.burst(pt2.x, pt2.y, { kind: 'coin', count: 22, spread: 140 }); }
    } else if (reason === 'sl') {
      toast(t('fut_toast_sl', { t: name, x: pnlTxt }), 'bad');
      FX.trade('sell', from, fxTxt);
    } else {
      toast(r.whole ? t('fut_toast_closed', { t: name, x: pnlTxt })
        : t('fut_toast_part', { t: name, p: Math.round(frac * 100), x: pnlTxt }), r.net >= 0 ? 'ok' : 'bad');
      FX.trade('sell', from, fxTxt);
    }
    if (r.whole && cards.length) {
      cards.forEach(function (card) {
        card.classList.remove('fp-new', 'fp-danger');
        if (reason === 'liq') {
          card.insertAdjacentHTML('beforeend', '<span class="fp-stamp">' + esc(t('fut_stamp')) + '</span>');
          card.classList.add('fp-liq');
        } else {
          card.classList.add('fp-closing');
        }
      });
      holdUntil = ts + (reason === 'liq' ? 1650 : 600);
      setTimeout(function () { refreshAll(now(), true); }, holdUntil - ts + 20);
    }
    if (r.whole && pm && pm.id === p.id) closePosSheet();
    else if (pm && pm.id === p.id) buildPosSheet();
    refreshAll(now(), !r.whole || !cards.length);
  }

  /* Концепт: при ликвидации на открытом графике контракта — штамп «ЛИКВИДАЦИЯ». */
  function liqStamp(aid) {
    var cvs = el('fc-chart'), card = cvs && cvs.parentNode;
    if (!card || !cv || !cv.a || cv.a.id !== aid || !modalOpen('modal-fchart')) return;
    var s = document.createElement('div');
    s.className = 'fc-stamp';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = t('fut_stamp');
    card.appendChild(s);
    setTimeout(function () { s.remove(); }, (typeof V3 !== 'undefined' ? V3.D(1900) : 1900) + 150);
  }

  function triggerAt(p, x) {
    var liq = liqPrice(p);
    if (p.side === 'long') {
      if (x <= liq) return { reason: 'liq', px: liq };
      if (p.sl > 0 && x <= p.sl) return { reason: 'sl', px: p.sl };
      if (p.tp > 0 && x >= p.tp) return { reason: 'tp', px: p.tp };
    } else {
      if (x >= liq) return { reason: 'liq', px: liq };
      if (p.sl > 0 && x >= p.sl) return { reason: 'sl', px: p.sl };
      if (p.tp > 0 && x <= p.tp) return { reason: 'tp', px: p.tp };
    }
    return null;
  }

  function checkPositions(ts) {
    var f = st();
    for (var i = f.pos.length - 1; i >= 0; i--) {
      var p = f.pos[i], a = assetById(p.a);
      if (!a) continue;
      var hit = triggerAt(p, markOf(a, ts));
      if (!hit) { p.chk = ts; continue; }
      finishClose(p, 1, hit.reason, hit.reason === 'liq' ? hit.px : exitPx(a, p, ts));
    }
  }

  function applyFunding(ts, offline) {
    var f = st(), slot = slotOf(ts);
    if (slot <= f.fundSlot) return 0;
    var n = Math.min(slot - f.fundSlot, FUND_CAP_SLOTS);
    f.fundSlot = slot;
    if (!f.pos.length) return 0;
    var total = 0;
    f.pos.forEach(function (p) {
      var a = assetById(p.a);
      if (!a) return;
      var pay = fundRate(a, ts) * p.qty * markOf(a, ts) * dirOf(p) * n;
      p.fund += pay;
      total += pay;
    });
    f.st.funding += total;
    saveState(false);
    if (!offline) {
      Snd.play('funding');
      toast(t('fut_toast_fund', { x: signed(-total) }), total <= 0 ? 'ok' : '');
      Array.prototype.forEach.call(document.querySelectorAll('.fut-fund'), function (e) { FX.pulse(e, 'ping', 900); });
    }
    return total;
  }

  /* Пока игры не было, цена шла дальше. Проходим закрытия 5-секундных
     свечей с последней проверки: ликвидация, SL и TP срабатывают там, где
     сработали бы онлайн (история движка — около 10 часов). */
  function afterLoad() {
    var f = st(), ts = now(), events = [];
    for (var i = f.pos.length - 1; i >= 0; i--) {
      var p = f.pos[i], a = assetById(p.a);
      if (!a) continue;
      var from = Math.max(p.chk || p.t, ts - OFFLINE_MAX_MS);
      if (ts - from < 2000) continue;
      var cs = [];
      try { cs = Engine.candles(a, Math.ceil((ts - from) / Engine.CANDLE_MS) + 1, 1, ts) || []; } catch (e) { dbg('fut:offline', e); }
      var hit = null;
      for (var k = 0; k < cs.length && !hit; k++) {
        if (cs[k].t >= from) hit = triggerAt(p, cs[k].c);
      }
      if (!hit) { p.chk = ts; continue; }
      var r = closeCore(p, 1, hit.reason, hit.px, ts);
      events.push({ a: a, reason: hit.reason, net: r.net, margin: r.margin });
    }
    applyFunding(ts, true);
    active();
    if (events.length) {
      saveState(true);
      events.slice(0, 3).forEach(function (ev, j) {
        var name = perpName(ev.a);
        var msg = ev.reason === 'liq' ? t('fut_toast_liq', { t: name, x: money(ev.margin) })
          : ev.reason === 'tp' ? t('fut_toast_tp', { t: name, x: signed(ev.net) })
            : t('fut_toast_sl', { t: name, x: signed(ev.net) });
        setTimeout(function () { toast(t('fut_away', { x: msg }), ev.net >= 0 ? 'ok' : 'bad'); }, 1400 + j * 900);
      });
    }
  }

  /* ------------------------------ Перевод ------------------------------ */

  function xfMax() { return floor2(xf.dir === 'toFut' ? Math.max(0, S.balance) : cash()); }

  function openXfer(dir) {
    var d = dir || (cash() < MIN_MARGIN && S.balance > 0 ? 'toFut' : (st().xferDir || 'toFut'));
    xf = { dir: d === 'toSpot' ? 'toSpot' : 'toFut', amt: 0, pct: 0 };
    var mx = xfMax();
    xf.amt = floor2(mx >= 100 ? Math.min(mx, Math.max(100, mx * 0.25)) : mx);
    el('xf-amt').value = amtTxt(xf.amt);
    el('xf-route').setAttribute('data-dir', xf.dir);
    renderXfer(true);
    openModal('modal-xfer');
  }
  function closeXfer() { closeModal('modal-xfer'); xf = null; notifyAch(); }

  function renderXfer(snapNums) {
    if (!xf) return;
    var toFut = xf.dir === 'toFut', mx = xfMax();
    var sb = Math.max(0, S.balance), fb = cash();
    function setBal(id, v) {
      var e = el(id);
      if (!e) return;
      if (snapNums || e.__v == null) { e.textContent = money(v); e.__v = v; return; }
      if (Math.abs(e.__v - v) >= 0.005) FX.tweenNumber(e, v, { from: e.__v, dur: 520, fmt: function (x) { return money(x); } });
      e.__v = v;
    }
    setBal('xf-spot', sb);
    setBal('xf-fut', fb);
    setText(el('xf-tag-spot'), t(toFut ? 'fut_from' : 'fut_to'));
    setText(el('xf-tag-fut'), t(toFut ? 'fut_to' : 'fut_from'));
    setText(el('xf-max'), t('max') + ': ' + money(mx));
    Array.prototype.forEach.call(document.querySelectorAll('#xf-pcts button'), function (b) {
      b.classList.toggle('active', +b.getAttribute('data-pct') === xf.pct);
    });
    var amt = Math.min(xf.amt, mx);
    var ns = toFut ? sb - amt : sb + amt, nf = toFut ? fb + amt : fb - amt;
    setHtml(el('xf-after'), esc(t('fut_after')) + ': <b class="mono">' + esc(t('fut_w_spot')) + ' ' + money(Math.max(0, ns)) +
      '</b> \u00B7 <b class="mono">' + esc(t('fut_w_fut')) + ' ' + money(Math.max(0, nf)) + '</b>');
    var btn = el('xf-confirm');
    var ok = amt >= 0.01 && xf.amt <= mx + 1e-9;
    btn.disabled = !ok;
    setText(el('xf-confirm-txt'), mx < 0.01 ? t('fut_xfer_zero') : t('fut_xfer_do', { x: money(amt) }));
  }

  function swapXfer() {
    if (!xf) return;
    var route = el('xf-route'), wals = route.querySelectorAll('.xf-wal');
    var first = Array.prototype.map.call(wals, function (w) { return w.getBoundingClientRect().top; });
    xf.dir = xf.dir === 'toFut' ? 'toSpot' : 'toFut';
    st().xferDir = xf.dir;
    route.setAttribute('data-dir', xf.dir);
    /* FLIP: кошельки меняются местами плавно, а не прыжком. */
    if (!FX.reducedMotion() && wals[0].animate) {
      Array.prototype.forEach.call(wals, function (w, i) {
        var dy = first[i] - w.getBoundingClientRect().top;
        if (dy) w.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }],
          { duration: 420, easing: 'cubic-bezier(0.3, 1.3, 0.5, 1)' });
      });
    }
    var mx = xfMax();
    if (xf.pct) xf.amt = floor2(mx * xf.pct / 100);
    else if (xf.amt > mx) xf.amt = mx;
    el('xf-amt').value = amtTxt(xf.amt);
    FX.vibrate(8);
    renderXfer(false);
  }

  function doXfer(btn) {
    if (!xf) return;
    var mx = xfMax(), amt = floor2(Math.min(xf.amt, mx));
    if (!(amt >= 0.01)) { FX.nudge(btn); return; }
    var f = st(), toFut = xf.dir === 'toFut';
    if (toFut) { S.balance = Math.max(0, S.balance - amt); f.cash = cash() + amt; }
    else { f.cash = Math.max(0, cash() - amt); S.balance += amt; }
    f.xferDir = xf.dir;
    saveState(true);
    var fromEl = document.querySelector('#xf-route .xf-wal[data-w="' + (toFut ? 'spot' : 'fut') + '"]');
    var toEl = document.querySelector('#xf-route .xf-wal[data-w="' + (toFut ? 'fut' : 'spot') + '"]');
    var a0 = FX.center(fromEl), a1 = FX.center(toEl);
    FX.burst(a0.x, a0.y, { kind: 'coin', count: 14, spread: 70 });
    setTimeout(function () {
      FX.burst(a1.x, a1.y, { kind: 'coin', count: 16, spread: 90 });
      FX.floatText(a1.x, a1.y - 18, '+' + money(amt), 'up');
    }, 180);
    FX.vibrate([10, 30, 16]);
    Snd.play('margin');
    toast(t('fut_xfer_done', { x: money(amt), w: t(toFut ? 'fut_w_fut' : 'fut_w_spot') }), 'gold');
    xf.amt = Math.min(xf.amt, xfMax());
    renderXfer(false);
    setTimeout(function () { if (xf) closeXfer(); }, 760);
    refreshAll(now());
    if (sh && modalOpen('modal-fut')) { clampOrderMargin(); updateOrder(now()); }
    if (currentTab === 'lobby' && typeof renderLobby === 'function') renderLobby();
  }

  /* Перевод без шторки — из карточки «Счета» (эффекты рисует js/v3-market.js).
     Возвращает переведённую сумму, 0 — переводить нечего. */
  function xferNow(dir, amt) {
    var toFut = dir !== 'toSpot', f = st();
    var mx = floor2(toFut ? Math.max(0, S.balance) : cash());
    amt = floor2(Math.min(amt, mx));
    if (!(amt >= 0.01)) return 0;
    if (toFut) { S.balance = Math.max(0, S.balance - amt); f.cash = cash() + amt; }
    else { f.cash = Math.max(0, cash() - amt); S.balance += amt; }
    f.xferDir = toFut ? 'toFut' : 'toSpot';
    saveState(true);
    refreshAll(now());
    if (sh && modalOpen('modal-fut')) { clampOrderMargin(); updateOrder(now()); }
    notifyAch();
    return amt;
  }

  /* ------------------------------ Обзор рынка ------------------------------ */

  function calcOverview(ts) {
    var cap = 0, prev = 0, up = 0, n = 0;
    for (var i = 0; i < ASSETS.length; i++) {
      var a = ASSETS[i], c = capOf(a), ch = chg24(a, ts);
      if (!(c > 0)) continue;
      cap += c; prev += c / (1 + ch); n++;
      if (ch >= 0) up++;
    }
    var chg = prev > 0 ? cap / prev - 1 : 0, breadth = n ? up / n : 0.5;
    var mood = Math.tanh(chg / 0.06);
    ov.cap = cap;
    ov.chg = chg;
    ov.score = clamp(3 + mood * 1.5 + (breadth - 0.5) * 1.1, 1, 5);
    ov.fg = Math.round(clamp(50 + mood * 36 + (breadth - 0.5) * 34, 1, 99));
    ov.at = ts;
    /* Спарклайн капитализации: сумма крупнейших монет по минутным свечам. */
    if (!ov.spark || ts - ov.sparkAt > 15000) {
      ov.sparkAt = ts;
      var top = ASSETS.slice().sort(function (x, y) { return capOf(y) - capOf(x); }).slice(0, 12);
      var sum = null;
      top.forEach(function (a) {
        var k = typeof assetSupply === 'function' ? assetSupply(a) : 1;
        var cs = [];
        try { cs = Engine.candles(a, 40, 12, ts); } catch (e) { dbg('fut:ovSpark', e); }
        if (!sum) sum = cs.map(function () { return 0; });
        for (var j = 0; j < sum.length && j < cs.length; j++) sum[j] += cs[j].c * k;
      });
      ov.spark = sum && sum.length > 1 ? sum : null;
    }
  }

  function sparkPath(vals, w, h) {
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = (mx - mn) || 1;
    return vals.map(function (v, i) {
      return (i ? 'L' : 'M') + (i / (vals.length - 1) * w).toFixed(1) + ' ' + (h - 2 - (v - mn) / rg * (h - 4)).toFixed(1);
    }).join(' ');
  }

  function gaugeArcs() {
    var cols = ['#f0524f', '#ff9f43', '#e9b640', '#9bd46a', '#2fbe6e'], out = '';
    for (var i = 0; i < 5; i++) {
      var a0 = Math.PI * (1 - (i * 36 + 3) / 180), a1 = Math.PI * (1 - ((i + 1) * 36 - 3) / 180);
      out += '<path d="M' + (50 + 38 * Math.cos(a0)).toFixed(2) + ' ' + (50 - 38 * Math.sin(a0)).toFixed(2) +
        ' A38 38 0 0 1 ' + (50 + 38 * Math.cos(a1)).toFixed(2) + ' ' + (50 - 38 * Math.sin(a1)).toFixed(2) +
        '" stroke="' + cols[i] + '"/>';
    }
    return out;
  }

  function overviewHtml() {
    var bars = '';
    for (var i = 1; i <= 5; i++) bars += '<i data-b="' + i + '"></i>';
    return '<div class="mk-cards" id="mk-cards">' +
      '<div class="card mk-card mk-card--cap"><div class="mk-title" data-i18n="fut_mk_cap"></div>' +
        '<svg class="mk-spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"><path id="mk-spark-a" class="a" d=""/><path id="mk-spark-l" class="l" d=""/></svg>' +
        '<b class="mk-val mono" id="mk-cap">\u2014</b><span class="mk-chg mono" id="mk-cap-chg">\u2014</span></div>' +
      '<div class="card mk-card mk-card--sent"><div class="mk-title" data-i18n="fut_mk_sent"></div>' +
        '<div class="mk-sent"><span class="mk-sent-ico" id="mk-sent-ico"></span><b class="mk-val mono" id="mk-sent">\u2014</b></div>' +
        '<div class="mk-bars" id="mk-bars">' + bars + '</div><span class="mk-sub" id="mk-sent-lbl">\u2014</span></div>' +
      '<div class="card mk-card mk-card--fg"><div class="mk-title" data-i18n="fut_mk_fg"></div>' +
        '<div class="mk-gauge"><svg viewBox="0 0 100 58" aria-hidden="true"><g class="mk-arcs">' + gaugeArcs() + '</g>' +
          '<g class="mk-knob" id="mk-knob"><circle cx="12" cy="50" r="6.2"/><circle cx="12" cy="50" r="2.6" class="in"/></g></svg>' +
          '<b class="mk-fg-num mono" id="mk-fg">\u2014</b></div>' +
        '<span class="mk-sub" id="mk-fg-lbl">\u2014</span></div>' +
    '</div>';
  }

  function renderOverview(ts, force) {
    if (force || !ov.at || ts - ov.at >= OV_MS) calcOverview(ts);
    var capEl = el('mk-cap');
    if (!capEl) return;
    /* «$2.24 трлн»: число крупно, единица мелко — иначе не влезает в треть ширины. */
    var capTxt = fmtBigMoney(ov.cap), cut = capTxt.lastIndexOf(' ');
    flashPrice('fut-ov-cap', capEl, capTxt, false);
    setHtml(capEl, cut > 0 ? esc(capTxt.slice(0, cut)) + '<small>' + esc(capTxt.slice(cut + 1)) + '</small>' : esc(capTxt));
    var ce = el('mk-cap-chg');
    setText(ce, (ov.chg >= 0 ? '\u25B2 ' : '\u25BC ') + (Math.abs(ov.chg) * 100).toFixed(2) + '%');
    pinTo(ce, ov.chg);
    var card = capEl.parentNode;
    card.classList.toggle('is-down', ov.chg < 0);
    if (ov.spark) {
      var ln = sparkPath(ov.spark, 100, 34);
      var la = el('mk-spark-l'), aa = el('mk-spark-a');
      if (la && la.getAttribute('d') !== ln) {
        la.setAttribute('d', ln);
        aa.setAttribute('d', ln + ' L100 34 L0 34 Z');
      }
    }
    var bull = ov.score >= 3;
    var ico = el('mk-sent-ico');
    if (ico && ico.__bull !== bull) {
      ico.innerHTML = bull ? ICON.bull : ICON.bear;
      ico.__bull = bull;
      ico.className = 'mk-sent-ico ' + (bull ? 'up' : 'down');
      FX.pulse(ico, 'pop', 520);
    }
    var se = el('mk-sent');
    setText(se, ov.score.toFixed(2));
    pinTo(se, ov.score - 3);
    var lvl = clamp(Math.round(ov.score), 1, 5);
    Array.prototype.forEach.call(document.querySelectorAll('#mk-bars i'), function (b) {
      b.classList.toggle('on', +b.getAttribute('data-b') === lvl);
    });
    setText(el('mk-sent-lbl'), t('fut_sent_' + lvl));
    var knob = el('mk-knob');
    if (knob) knob.style.transform = 'rotate(' + (ov.fg * 1.8).toFixed(1) + 'deg)';
    var fe = el('mk-fg');
    if (fe) {
      if (fe.__v == null) fe.textContent = String(ov.fg);
      else if (fe.__v !== ov.fg) FX.tweenNumber(fe, ov.fg, { from: fe.__v, dur: 700 });
      fe.__v = ov.fg;
    }
    var fl = ov.fg < 25 ? 1 : ov.fg < 45 ? 2 : ov.fg <= 55 ? 3 : ov.fg <= 75 ? 4 : 5;
    var fll = el('mk-fg-lbl');
    setText(fll, t('fut_fg_' + fl));
    if (fll) fll.setAttribute('data-l', fl);
  }

  /* ------------------------------ Вид «Фьючерсы» ------------------------------ */

  function visible() {
    return currentTab === 'market' && st().view === 'fut' && currentScreen === 'app-main';
  }
  function active() {
    var on = st().view === 'fut';
    var tab = el('tab-market');
    if (tab && tab.classList.contains('is-fut') !== on) {
      tab.classList.toggle('is-fut', on);
      syncSeg(on);
    }
    return on;
  }
  function syncSeg(on) {
    var seg = el('mkt-seg');
    if (!seg) return;
    seg.setAttribute('data-v', on ? 'fut' : 'spot');
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      var sel = (b.getAttribute('data-view') === 'fut') === on;
      b.classList.toggle('active', sel);
      b.setAttribute('aria-selected', sel ? 'true' : 'false');
    });
  }
  function setView(v, fromTap) {
    var f = st();
    v = v === 'fut' ? 'fut' : 'spot';
    var changed = f.view !== v;
    f.view = v;
    active();
    if (v === 'fut') {
      /* Та же история с фьючерсами: вид въезжает целиком (fut-in), а
         пересобранные строки не запускают свой futRowIn поверх. */
      renderView();
      if (changed && fromTap) {
        Array.prototype.forEach.call(document.querySelectorAll('#fut-list .fut-row'), function (r) { r.style.animation = 'none'; });
      }
      if (changed && fromTap) FX.pulse(el('fut-view'), 'fut-in', 400);
    } else if (changed) {
      /* По тапу весь список въезжает одним движением (spot-in), поэтому
         каскад строк выключаем — иначе анимация проходила дважды. */
      renderMarket(!!fromTap);
      if (fromTap) FX.pulse(el('market-list'), 'spot-in', 400);
    }
    if (changed) {
      saveState(false);
      if (fromTap) { scrollPagesTop(); FX.vibrate(6); }
    }
  }

  function renderView() {
    var f = st(), ts = now();
    active();
    var intro = el('fut-intro');
    if (intro) intro.classList.toggle('hidden', !!f.intro);
    renderOverview(ts, true);
    updateWallets(true);
    renderList(true);
    updateBadge();
  }

  function sortVal(a, key, ts) {
    switch (key) {
      case 'price': return markOf(a, ts);
      case 'change': return chg24(a, ts);
      case 'volume': return volOf(a);
      case 'funding': return fundRate(a, ts);
      default: return capOf(a);
    }
  }
  function listIds() {
    var f = st(), ts = now(), qq = q.trim().toLowerCase();
    var list = perps.filter(function (a) {
      if (f.cat !== 'all' && marketCatOf(a) !== f.cat) return false;
      if (f.levF && f.levF !== 'all' && String(maxLev(a)) !== f.levF) return false;
      if (!qq) return true;
      return a.ticker.toLowerCase().indexOf(qq) >= 0 || assetName(a).toLowerCase().indexOf(qq) >= 0 ||
        perpName(a).toLowerCase().indexOf(qq) >= 0;
    });
    if (f.sortKey === 'az') {
      list.sort(function (x, y) { return x.ticker.localeCompare(y.ticker); });
    } else {
      var dir = f.sortDir === 'asc' ? 1 : -1, vals = {};
      list.forEach(function (a) { vals[a.id] = sortVal(a, f.sortKey, ts); });
      list.sort(function (x, y) { return (vals[x.id] - vals[y.id]) * dir; });
    }
    /* Избранное (общее со спотом, S.favs) — всегда сверху своей группой. */
    var fav = [], rest = [];
    list.forEach(function (a) { (isFav(a.id) ? fav : rest).push(a); });
    return fav.concat(rest);
  }
  function isFav(id) { return !!(S.favs && S.favs[id]); }
  /* Последовательность списка: шапки групп + строки. В A→Z обычные
     контракты делятся буквами, в остальных сортировках после избранного
     идёт шапка «Все контракты». */
  function listSeq(list) {
    var out = [], favN = 0, az = st().sortKey === 'az', last = null, allDone = false;
    list.forEach(function (a) { if (isFav(a.id)) favN++; });
    list.forEach(function (a) {
      var fv = isFav(a.id);
      if (fv && !out.length) out.push({ h: 'fav', n: favN });
      if (!fv) {
        if (az) {
          var c = a.ticker.charAt(0).toUpperCase();
          if (!/[A-Z]/.test(c)) c = '#';
          if (c !== last) { last = c; out.push({ h: 'L', c: c }); }
        } else if (favN && !allDone) { allDone = true; out.push({ h: 'all', n: list.length - favN }); }
      }
      out.push({ a: a });
    });
    return out;
  }
  /* «Попробуйте:» — только контракты: сначала на ту же букву, потом популярные. */
  function sugHtml(qs) {
    var c = (qs || '').trim().charAt(0).toLowerCase(), out = [], seen = {};
    function add(a) { if (a && !seen[a.id] && out.length < 4) { seen[a.id] = 1; out.push(a); } }
    if (c) perps.forEach(function (a) { if (out.length < 3 && (a.ticker.toLowerCase().charAt(0) === c || assetName(a).toLowerCase().charAt(0) === c)) add(a); });
    ['bitcoin', 'ethereum', 'solana', 'dogecoin'].forEach(function (id) { add(assetById(id)); });
    return '<span class="em-sug-l">' + esc(t('v3m_try')) + '</span>' + out.map(function (a) {
      return '<button type="button" class="em-sug" data-sug="' + esc(a.ticker) + '">' + esc(a.ticker) + '</button>';
    }).join('');
  }
  function hdrKey(it) { return it.h === 'L' ? 'L:' + it.c : it.h; }
  function hdrHtml(it) {
    if (it.h === 'fav') return '<div class="letter-h fav-h mono" data-fh="fav"><span class="fav-h-title"><span class="fav-h-icon" aria-hidden="true">' + STAR_SVG + '</span>' +
      esc(t('fav_header')) + '</span><span class="fav-h-count">' + it.n + '</span></div>';
    if (it.h === 'all') return '<div class="letter-h market-all-h mono" data-fh="all"><span>' + esc(t('fut_all_header')) + '</span><span class="fav-h-count">' + it.n + '</span></div>';
    return '<div class="letter-h mono" data-fh="' + esc(hdrKey(it)) + '">' + esc(it.c) + '</div>';
  }
  var STAR_SVG = '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg>';

  function renderList(force) {
    var box = el('fut-list');
    if (!box) return;
    var f = st(), list = listIds();
    var seq = listSeq(list);
    var hsig = seq.filter(function (it) { return it.h; }).map(function (it) { return hdrKey(it) + (it.n || ''); }).join(',');
    var sig = list.map(function (a) { return a.id + (isFav(a.id) ? '*' : ''); }).join(',') + '|' + LANG + '|' + hsig;
    var sortBtn = el('fut-sort');
    if (sortBtn) sortBtn.classList.toggle('on', f.cat !== 'all');
    if (!force && sig === sigs.list) return;
    var order = sig.split('|')[0];
    var ids = function (str) { return str.split(',').map(function (x) { return x.replace('*', ''); }).sort().join(); };
    if (!force && sigs.list && sigs.list.split('|')[1] === LANG && box.querySelectorAll('[data-perp]').length === list.length &&
        ids(sigs.list.split('|')[0]) === ids(order)) {
      reorderRows(box, list, seq);
      sigs.list = sig;
      return;
    }
    sigs.list = sig;
    /* v3: смена фильтра/поиска/сортировки — FLIP с «тающими» ушедшими строками (js/v3-market.js). */
    var snap = typeof V3Market !== 'undefined' && V3Market.flipSnap ? V3Market.flipSnap(box) : null;
    if (!list.length) {
      box.innerHTML = '<div class="fut-empty fut-empty--search">' + ICON.search + '<span>' +
        esc(t('fut_search_empty', { q: q.trim() })) + '</span>' +
        '<span class="empty-hint fut-sugs">' + sugHtml(q) + '</span>' +
        '<button type="button" class="btn accent-btn" data-freset>' +
        esc(t('fut_search_reset')) + '</button></div>';
      if (snap) V3Market.flipLater(snap);
      return;
    }
    var ri = 0;
    box.innerHTML = seq.map(function (it) { return it.h ? hdrHtml(it) : perpRowHtml(it.a, ri++); }).join('');
    updateRows(now());
    try { drawSparks(!snap, box); } catch (e) { dbg('fut:sparks', e); }
    if (snap) V3Market.flipLater(snap);
  }

  /* FLIP: строки переезжают на новые места, узлы и спарклайны живут.
     Тайминг и полоска «поднялась/опустилась» — как у живой сортировки концепта. */
  function reorderRows(box, list, seq) {
    var rows = {}, first = {}, hdrs = {};
    Array.prototype.forEach.call(box.children, function (r) {
      var hk = r.getAttribute('data-fh');
      if (hk) { hdrs[hk] = r; return; }
      var id = r.getAttribute('data-perp');
      if (!id) return;
      rows[id] = r;
      first[id] = r.getBoundingClientRect().top;
    });
    (seq || list.map(function (a) { return { a: a }; })).forEach(function (it) {
      if (it.h) {
        var k = hdrKey(it), hEl = hdrs[k];
        if (!hEl) { var tmp = document.createElement('div'); tmp.innerHTML = hdrHtml(it); hEl = tmp.firstChild; }
        else { var cnt = hEl.querySelector('.fav-h-count'); if (cnt && it.n != null) cnt.textContent = String(it.n); }
        delete hdrs[k];
        box.appendChild(hEl);
      } else if (rows[it.a.id]) box.appendChild(rows[it.a.id]);
    });
    for (var hk2 in hdrs) if (hdrs[hk2].parentNode) hdrs[hk2].parentNode.removeChild(hdrs[hk2]);
    if (FX.reducedMotion()) return;
    list.forEach(function (a) {
      var r = rows[a.id];
      if (!r) return;
      var dy = first[a.id] - r.getBoundingClientRect().top;
      if (Math.abs(dy) < 1 || !r.animate) return;
      r.animate([{ transform: 'translateY(' + dy.toFixed(1) + 'px)' }, { transform: 'none' }],
        { duration: V3.D(560), easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      if (Math.abs(dy) > 30) {
        r.classList.remove('mk-rise', 'mk-fall');
        void r.offsetWidth;
        r.classList.add(dy > 0 ? 'mk-rise' : 'mk-fall');
        clearTimeout(r.__mkT);
        r.__mkT = setTimeout(function () { r.classList.remove('mk-rise', 'mk-fall'); }, V3.D(1500) + 60);
      }
    });
  }

  function perpRowHtml(a, i) {
    var has = hasPos(a.id);
    return '<button type="button" class="row fut-row' + (has ? ' has-pos' : '') + (isFav(a.id) ? ' fav' : '') + '" data-perp="' + esc(a.id) + '" style="--i:' + Math.min(i, 14) + '">' +
      coinHtml(a) +
      '<span class="grow"><b>' + esc(a.ticker) + '<span class="fut-perp">-PERP</span></b>' +
        '<span class="fut-row-meta"><span class="fut-lev-badge">' + maxLev(a) + '\u00D7</span>' +
        '<span class="fut-fr" data-k="fr">\u2014</span>' + (has ? '<span class="fut-row-dot" aria-hidden="true"></span>' : '') + '</span></span>' +
      '<canvas class="spark" data-spark="' + esc(a.id) + '"></canvas>' +
      '<span class="right"><b class="mono" data-k="px">\u2014</b><i class="mono" data-k="chg">\u2014</i></span>' +
      '<span class="star-btn' + (isFav(a.id) ? ' on' : '') + '" data-fstar="' + esc(a.id) + '" role="button" aria-label="' + esc(t('fut_fav_aria')) + '">' + STAR_SVG + '</span>' +
    '</button>';
  }

  function updateRows(ts) {
    var list = el('fut-list');
    if (!list) return;
    Array.prototype.forEach.call(list.querySelectorAll('[data-perp]'), function (row) {
      var a = assetById(row.getAttribute('data-perp'));
      if (!a) return;
      var pxEl = row.querySelector('[data-k="px"]'), chEl = row.querySelector('[data-k="chg"]'), frEl = row.querySelector('[data-k="fr"]');
      var mk = markOf(a, ts), txt = pxs(a, mk);
      /* v3: вспыхивают только изменившиеся цифры (css/v3-market.css). */
      if (pxEl && pxEl.__v3txt !== txt) V3.flashText(pxEl, txt, pxEl.__pv == null ? 0 : (mk >= pxEl.__pv ? 1 : -1));
      if (pxEl) pxEl.__pv = mk;
      var chg = chg24(a, ts);
      setText(chEl, pctStr(chg));
      pinTo(chEl, chg);
      var fr = fundRate(a, ts);
      setText(frEl, 'F ' + pctStr(fr, 3));
      pinTo(frEl, fr);
      var has = hasPos(a.id);
      if (row.classList.contains('has-pos') !== has) {
        row.classList.toggle('has-pos', has);
        var meta = row.querySelector('.fut-row-meta'), dot = meta && meta.querySelector('.fut-row-dot');
        if (has && meta && !dot) meta.insertAdjacentHTML('beforeend', '<span class="fut-row-dot" aria-hidden="true"></span>');
        if (!has && dot) dot.parentNode.removeChild(dot);
      }
    });
  }

  function updateWallets(snapNums) {
    [['fx-spot', Math.max(0, S.balance)], ['fx-fut', cash()]].forEach(function (pair) {
      var e = el(pair[0]);
      if (!e) return;
      if (snapNums || e.__v == null) e.textContent = money(pair[1]);
      else if (Math.abs(e.__v - pair[1]) >= 0.005) FX.tweenNumber(e, pair[1], { from: e.__v, dur: 520, fmt: function (x) { return money(x); } });
      e.__v = pair[1];
    });
  }

  function updateView(ts) {
    if (!visible()) return;
    renderOverview(ts);
    updateWallets(false);
    updateRows(ts);
    if (++tickN % RESORT_TICKS === 0 && st().sortKey !== 'az') renderList(false);
    if (tickN % 8 === 0) {
      try { drawSparks(false, el('fut-list')); } catch (e) { dbg('fut:sparks', e); }
    }
  }

  function updateBadge() {
    var n = st().pos.length, b = el('fut-seg-badge');
    if (!b || n === lastBadge) return;
    b.textContent = String(n);
    b.classList.toggle('hidden', !n);
    if (lastBadge >= 0 && n > lastBadge) FX.pulse(b, 'bump', 500);
    lastBadge = n;
  }

  /* Звезда в строке фьючерса — то же избранное, что и на споте. */
  function toggleFav(id, star) {
    if (!S.favs || typeof S.favs !== 'object') S.favs = {};
    var on = !S.favs[id];
    if (on) S.favs[id] = true; else delete S.favs[id];
    Snd.play(on ? 'fav_add' : 'fav_remove');
    saveState(true);
    star.classList.toggle('on', on);
    var row = star.closest('.fut-row');
    if (row) row.classList.toggle('fav', on);
    FX.pulse(star, 'burst', 560);
    FX.vibrate(12);
    renderList(false);
    /* Спот перестроится сам, когда к нему вернутся (тот же флаг, что у звезды в шапке трейда). */
    try { marketFavDirty = true; } catch (e) { dbg('fut:fav', e); }
  }

  function dismissIntro() {
    st().intro = true;
    saveState(false);
    var e = el('fut-intro');
    if (!e) return;
    if (FX.reducedMotion()) { e.classList.add('hidden'); return; }
    e.classList.add('fut-out');
    setTimeout(function () { e.classList.add('hidden'); e.classList.remove('fut-out'); }, 360);
  }

  /* ------------------------------ Сортировка ------------------------------ */

  var SORT_OPTS = [
    { k: 'cap', img: 'img/sort-cap.png?v=14', t: 'sort_cap', s: 'sort_cap_sub' },
    { k: 'price', img: 'img/sort-price.png?v=14', t: 'sort_price', s: 'sort_price_sub' },
    { k: 'change', img: 'img/sort-change.png?v=14', t: 'sort_change', s: 'sort_change_sub' },
    { k: 'volume', img: 'img/sort-volume.png?v=14', t: 'sort_volume', s: 'sort_volume_sub' },
    { k: 'funding', svg: ICON.funding, t: 'fut_sort_funding', s: 'fut_sort_funding_sub' },
    { k: 'az', img: 'img/sort-az.png?v=14', t: 'sort_az_opt', s: 'sort_az_sub' }
  ];
  var TICK = svg('<path d="M5 13l4 4L19 7"/>', 3.2);

  function catKeys() {
    var have = {};
    perps.forEach(function (a) { have[marketCatOf(a)] = (have[marketCatOf(a)] || 0) + 1; });
    var order = (typeof MARKET_CATS !== 'undefined' ? MARKET_CATS : []).concat(['other']);
    return ['all'].concat(order.filter(function (k) { return have[k]; }));
  }
  function catCount(k) {
    if (k === 'all') return perps.length;
    return perps.filter(function (a) { return marketCatOf(a) === k; }).length;
  }
  function catImg(k) { return typeof catIcon === 'function' ? catIcon(k) : ''; }

  function openSort() {
    var f = st();
    sp = { key: f.sortKey, dir: f.sortDir, cat: catKeys().indexOf(f.cat) >= 0 ? f.cat : 'all' };
    el('fsort-cats').innerHTML = catKeys().map(function (k, i) {
      return '<button type="button" class="cat-opt' + (sp.cat === k ? ' sel' : '') + '" data-cat="' + k +
        '" style="animation-delay:' + (40 + i * 24) + 'ms" aria-pressed="' + (sp.cat === k) + '">' +
        '<span class="co-ico">' + catImg(k) + '</span><span class="co-name">' + esc(t('cat_' + k)) + '</span>' +
        '<span class="co-count">' + catCount(k) + '</span></button>';
    }).join('');
    el('fsort-options').innerHTML = SORT_OPTS.map(function (o, i) {
      var sel = sp.key === o.k;
      return '<button type="button" class="sort-opt' + (sel ? ' sel' : '') + '" data-key="' + o.k +
        '" style="animation-delay:' + (90 + i * 40) + 'ms" aria-pressed="' + sel + '">' +
        '<span class="so-ico">' + (o.svg || '<img src="' + o.img + '" alt="" draggable="false">') + '</span>' +
        '<span class="so-txt"><b>' + esc(t(o.t)) + '</b><i>' + esc(t(o.s)) + '</i></span>' +
        '<span class="so-radio" aria-hidden="true">' + TICK + '</span></button>';
    }).join('');
    el('fsort-dir').innerHTML = [['desc', 'order_desc', '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>'],
      ['asc', 'order_asc', '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>']].map(function (d) {
      return '<button type="button" class="dir-opt' + (sp.dir === d[0] ? ' sel' : '') + '" data-dir="' + d[0] + '">' +
        '<span class="dir-ico">' + svg(d[2], 2) + '</span><b>' + esc(t(d[1])) + '</b></button>';
    }).join('');
    syncSort();
    openModal('modal-fsort');
  }
  function syncSort() {
    Array.prototype.forEach.call(document.querySelectorAll('#fsort-cats .cat-opt'), function (b) {
      var on = b.getAttribute('data-cat') === sp.cat;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#fsort-options .sort-opt'), function (b) {
      var on = b.getAttribute('data-key') === sp.key;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#fsort-dir .dir-opt'), function (b) {
      b.classList.toggle('sel', b.getAttribute('data-dir') === sp.dir);
    });
    el('fsort-dir').classList.toggle('asc', sp.dir === 'asc');
    el('fsort-dir-wrap').classList.toggle('off', sp.key === 'az');
    var opt = SORT_OPTS.filter(function (o) { return o.k === sp.key; })[0] || SORT_OPTS[0];
    var n = catCount(sp.cat);
    setText(el('fsum-cat'), t('cat_' + sp.cat));
    setText(el('fsum-sort'), t(opt.t));
    setText(el('fsum-count'), n + ' ' + plural(n));
    /* Как у спота и в концепте: «Показать N контрактов» вместо «Применить». */
    if (I18N[LANG] && I18N[LANG].v3m_show) setText(el('fsort-apply'), t('v3m_show', { n: n + ' ' + plural(n) }));
  }
  function applySort(reset) {
    var f = st();
    if (reset) { f.sortKey = 'cap'; f.sortDir = 'desc'; f.cat = 'all'; }
    else { f.sortKey = sp.key; f.sortDir = sp.dir; f.cat = sp.cat; }
    saveState(false);
    closeModal('modal-fsort');
    notifyAch();
    renderList(true);
    scrollPagesTop();
  }
  /* v3: выбор применяется сразу — строки переезжают за шторкой, «Готово» её закрывает. */
  function commitSortLive() {
    var f = st();
    if (!sp || (f.sortKey === sp.key && f.sortDir === sp.dir && f.cat === sp.cat)) return;
    f.sortKey = sp.key; f.sortDir = sp.dir; f.cat = sp.cat;
    saveState(false);
    renderList(true);
  }

  /* ------------------------------ Экран контракта ------------------------------ */

  function openChart(id) {
    var a = assetById(id);
    if (!a || !PERP_SET[id]) return;
    var f = st();
    cv = { a: a, tf: f.tf, tab: hasPos(id) ? 'pos' : (cv && cv.tab) || 'pos', hover: -1, hoverY: 0 };
    FZ.bars = 0; FZ.yk = 1; FZ.ysh = 0; FZ.off = 0;
    if (fzUI) setTimeout(fzUI.sync, 0);
    syncLive();
    if (!tfAllowed(cv.tf)) cv.tf = 1;
    setHtml(el('fc-icon'), '<img class="coin-img" src="' + esc(a.img || ('img/coins/' + a.id + '.png')) + '" alt="' + esc(a.ticker) + '" draggable="false">');
    setText(el('fc-title'), perpName(a));
    setText(el('fc-sub'), t('fut_perp_sub', { name: assetName(a) }));
    var ml = maxLev(a);
    setText(el('fc-long-sub'), t('fut_up_to', { x: ml }));
    setText(el('fc-short-sub'), t('fut_up_to', { x: ml }));
    syncTfs();
    syncCtype();
    candleCache.key = '';
    sigs.desk = '';
    var body = el('fc-body');
    if (body) body.scrollTop = 0;
    var sheet = el('fchart');
    sheet.classList.remove('cs-dragged');
    sheet.style.transform = ''; sheet.style.transition = '';
    openModal('modal-fchart');
    setDeskTab(cv.tab, true);
    updateChartHead(now());
    renderDesk(true);
    startChartLoop();
  }
  function closeChart() {
    closeModal('modal-fchart');
    if (chartRaf) { cancelAnimationFrame(chartRaf); chartRaf = 0; }
    cv = null;
    notifyAch();
  }

  function syncTfs() {
    Array.prototype.forEach.call(document.querySelectorAll('#fc-tfs .ftf'), function (b) {
      var tf = +b.getAttribute('data-tf');
      b.classList.toggle('active', cv && tf === cv.tf);
      b.classList.toggle('is-off', !tfAllowed(tf));
    });
  }
  function syncCtype() {
    Array.prototype.forEach.call(document.querySelectorAll('#fc-ctype button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-ctype') === (S.chartType === 'line' ? 'line' : 'candle') ? 'true' : 'false');
    });
  }

  function updateChartHead(ts) {
    if (!cv) return;
    var a = cv.a, mk = markOf(a, ts);
    var pe = el('fc-price'), txt = pxs(a, mk);
    flashPrice('fc-price', pe, txt, true);
    setText(pe, txt);
    var chg = chg24(a, ts), ce = el('fc-chg-wrap');
    setText(el('fc-chg'), pctStr(chg));
    pinTo(ce, chg);
    var fr = fundRate(a, ts), fe = el('fc-fund');
    /* v3: ставка цветом знака, отсчёт до выплаты — обычным. */
    setHtml(fe, '<span class="' + (fr >= 0 ? 'up' : 'down') + '">' + esc(pctStr(fr, 3)) + '</span> \u00B7 ' + mmss(FUND_MS - (ts % FUND_MS)));
    pinTo(fe, fr);
    setText(el('fc-vol'), fmtBigMoney(volOf(a)));
    var ls = longShare(a, ts), lp = Math.round(ls * 100);
    setText(el('fc-ls-l'), t('fut_longs') + ' ' + lp + '%');
    setText(el('fc-ls-s'), (100 - lp) + '% ' + t('fut_shorts'));
    var bar = el('fc-ls-bar');
    if (bar) bar.style.width = (ls * 100).toFixed(1) + '%';
  }

  function maxOff() {
    var d = 240;
    try { if (cv && Engine.depth) d = Engine.depth(cv.a, cv.tf); } catch (e) { dbg('fut:depth', e); }
    return Math.max(0, Math.min(480, d) - fzBars());
  }
  function setOff(v) {
    var o = clamp(Math.round(v), 0, maxOff());
    if (o === FZ.off) return;
    FZ.off = o;
    cv.hover = -1;
    chartDrawAt = 0;
    syncLive();
  }
  function syncLive() { var b = el('fc-live'); if (b) b.classList.toggle('hidden', !FZ.off); }
  function chartCandles(a, ts) {
    var n = fzBars(), off = FZ.off || 0, total = n + off;
    var key = a.id + '|' + cv.tf + '|' + total + '|' + Math.floor(ts / (cv.tf * Engine.CANDLE_MS));
    if (candleCache.key !== key || !candleCache.data) {
      candleCache.key = key;
      candleCache.data = Engine.candles(a, total, cv.tf, ts);
    }
    var d = candleCache.data;
    return off ? d.slice(Math.max(0, d.length - off - n), Math.max(0, d.length - off)) : d;
  }

  function chartLines(a, ts) {
    var lines = [];
    posOf(a.id).forEach(function (p) {
      if (lines.length > 7) return;
      lines.push({ price: p.entry, color: 'gold', label: (p.side === 'long' ? '\u25B2 ' : '\u25BC ') + levTxt(effLev(p)) });
      lines.push({ price: liqPrice(p), color: 'down', label: t('fut_ln_liq') });
      if (p.tp > 0) lines.push({ price: p.tp, color: 'up', label: 'TP' });
      if (p.sl > 0) lines.push({ price: p.sl, color: 'down', label: 'SL', dim: true });
    });
    if (sh && sh.a.id === a.id && modalOpen('modal-fut')) {
      var e = entryPx(a, sh.side, ts);
      lines.push({ price: previewLiq(sh.side, e, sh.lev), color: 'down', label: t('fut_ln_liq'), dim: true });
      var tp = roeToPx(e, sh.lev, sh.side, sh.tp), sl = roeToPx(e, sh.lev, sh.side, sh.sl);
      if (tp > 0) lines.push({ price: tp, color: 'up', label: 'TP', dim: true });
      if (sl > 0) lines.push({ price: sl, color: 'down', label: 'SL', dim: true });
    }
    return lines;
  }

  function drawChart(ts) {
    var a = cv.a, mk = markOf(a, ts);
    var data = chartCandles(a, ts), live = !FZ.off;
    if (live && data.length) {
      var last = data[data.length - 1];
      last.c = mk; last.h = Math.max(last.h, mk); last.l = Math.min(last.l, mk);
    }
    Chart.draw(el('fc-chart'), data, {
      dec: a.dec,
      type: S.chartType === 'line' ? 'line' : 'candle',
      livePrice: live ? mk : null,
      lines: chartLines(a, ts),
      yZoom: FZ,
      crosshair: cv.hover >= 0 ? { index: cv.hover, y: cv.hoverY } : null,
      candles: (typeof Ach !== 'undefined' && Ach.candleStyle) ? Ach.candleStyle() : null
    });
    var i = cv.hover >= 0 ? cv.hover : data.length - 1, c = data[i];
    var oh = el('fc-ohlc');
    if (oh) {
      /* v3: как на экране спота — подписи приглушены, закрытие цветом свечи. */
      var nb = function (v) { return esc(pxs(a, v).replace('$', '')); };
      setHtml(oh, c ? '<span>O <b>' + nb(c.o) + '</b></span><span>H <b>' + nb(c.h) + '</b></span><span>L <b>' + nb(c.l) +
        '</b></span><span>C <b class="' + (c.c >= c.o ? 'up' : 'down') + '">' + nb(c.c) + '</b></span>' : '');
    }
  }

  function startChartLoop() {
    if (chartRaf) cancelAnimationFrame(chartRaf);
    chartDrawAt = 0;
    chartRaf = requestAnimationFrame(function loop() {
      chartRaf = 0;
      if (!cv || !modalOpen('modal-fchart')) return;
      var ts = now();
      if (!document.hidden && ts - chartDrawAt >= CHART_MS) {
        chartDrawAt = ts;
        try { drawChart(ts); updateChartHead(ts); } catch (e) { dbg('fut:drawChart', e); }
      }
      chartRaf = requestAnimationFrame(loop);
    });
  }

  function setDeskTab(tab, instant) {
    if (!cv) return;
    cv.tab = tab === 'hist' ? 'hist' : 'pos';
    Array.prototype.forEach.call(document.querySelectorAll('#fc-tabs .fdtab'), function (b) {
      var on = b.getAttribute('data-ftab') === cv.tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('#fchart [data-fpanel]'), function (p) {
      p.classList.toggle('hidden', p.getAttribute('data-fpanel') !== cv.tab);
    });
    moveInk(instant);
    renderDesk(true);
  }
  function moveInk(instant) {
    var ink = el('fc-ink'), act = document.querySelector('#fc-tabs .fdtab.active'), wrap = el('fc-tabs');
    if (!ink || !act || !wrap) return;
    var r = act.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    if (!r.width) return;
    if (instant) ink.style.transition = 'none';
    ink.style.width = (r.width - 16) + 'px';
    ink.style.transform = 'translateX(' + (r.left - w.left + 8) + 'px)';
    if (instant) { void ink.offsetWidth; ink.style.transition = ''; }
  }

  function renderDesk(force) {
    if (!cv) return;
    var a = cv.a, list = posOf(a.id), hist = st().hist.filter(function (h) { return h.a === a.id; });
    var pb = document.querySelector('#fc-tabs [data-badge="pos"]');
    if (pb) { pb.textContent = String(list.length); pb.classList.toggle('hidden', !list.length); }
    if (cv.tab === 'pos') {
      renderPosList(el('fc-pos'), list, 'desk', force, t('fut_no_pos', { t: perpName(a) }));
    } else {
      var hs = hist.length + '|' + (hist[0] ? hist[0].t : 0) + '|' + LANG;
      if (!force && sigs.deskHist === hs) return;
      sigs.deskHist = hs;
      el('fc-hist').innerHTML = hist.length ? histRowsHtml(hist.slice(0, HIST_SHOW)) : deskEmptyHtml(t('fut_no_hist', { t: perpName(a) }));
    }
  }

  function deskEmptyHtml(text) {
    return '<div class="desk-empty"><span class="desk-empty-ico">\u25CD</span><span>' + esc(text) + '</span></div>';
  }

  /* ------------------------------ Карточки позиций ------------------------------ */

  function cell(lbl, k, extra) {
    return '<div><span>' + esc(t(lbl)) + '</span><b class="mono' + (extra ? ' ' + extra : '') + '" data-k="' + k + '">\u2014</b></div>';
  }

  function posCardHtml(p, isNew) {
    var a = assetById(p.a);
    return '<div class="fut-pos' + (isNew ? ' fp-new' : '') + '" data-pid="' + p.id + '" data-fs="' + p.side + '" role="button" tabindex="0">' +
      '<div class="fp-top">' + coinHtml(a) +
        '<span class="fp-name"><b>' + esc(perpName(a)) + '</b><i><span class="fp-side">' +
          esc(t(p.side === 'long' ? 'fut_pill_long' : 'fut_pill_short')) + '</span><span class="fp-lev" data-k="lev"></span></i></span>' +
        '<span class="fp-pnl"><b class="mono" data-k="pnl">\u2014</b><i class="mono" data-k="roe">\u2014</i></span>' +
      '</div>' +
      '<div class="fp-grid">' + cell('fut_entry_short', 'entry') + cell('fut_mark_short', 'mark') + cell('fut_liq_short', 'liq', 'liq') + '</div>' +
      '<div class="fp-risk" data-k="riskbox"><i data-k="risk"></i></div>' +
      '<div class="fp-risk-row"><span>' + esc(t('fut_ratio')) + ' <b class="mono" data-k="ratio">\u2014</b></span><span data-k="margin"></span></div>' +
      '<div class="fp-foot"><span class="fp-tags" data-k="tags"></span><span class="fp-acts">' +
        '<button type="button" data-act="manage">' + esc(t('fut_manage')) + '</button>' +
        '<button type="button" class="fp-close" data-act="close" data-k="closebtn">' + esc(t('fut_close')) + '</button>' +
      '</span></div>' +
    '</div>';
  }

  function renderPosList(box, list, key, force, emptyText) {
    if (!box) return;
    var sig = list.map(function (p) { return p.id; }).join(',') + '|' + LANG;
    if (!force && sigs[key] === sig) return;
    if (now() < holdUntil) return;
    sigs[key] = sig;
    box.innerHTML = list.length ? list.map(function (p) { return posCardHtml(p, p.id === newPosId); }).join('')
      : (emptyText ? deskEmptyHtml(emptyText) : '');
    updatePosCards(now());
  }

  function tagsHtml(a, p) {
    var out = '';
    if (p.tp > 0) out += '<span class="fp-tag tp">TP ' + esc(pxs(a, p.tp)) + '</span>';
    if (p.sl > 0) out += '<span class="fp-tag sl">SL ' + esc(pxs(a, p.sl)) + '</span>';
    return out || '<span class="fp-tag">TP/SL \u2014</span>';
  }

  function updatePosCards(ts) {
    if (armed.id && ts > armed.until) armed.id = 0;
    var cards = document.querySelectorAll('.fut-pos[data-pid]');
    if (!cards.length) return;
    var snaps = {};
    Array.prototype.forEach.call(cards, function (card) {
      if (card.classList.contains('fp-closing') || card.classList.contains('fp-liq') || !isVisible(card)) return;
      var id = +card.getAttribute('data-pid'), p = findPos(id);
      if (!p) return;
      var s = snaps[id] || (snaps[id] = snap(p, ts)), a = s.a;
      function k(n) { return card.querySelector('[data-k="' + n + '"]'); }
      var pnlTxt = signed(s.net), pe = k('pnl');
      flashPrice('fut-pnl-' + id + '-' + (card.closest('#fc-pos') ? 'd' : 'p'), pe, pnlTxt, false);
      setText(pe, pnlTxt); pinTo(pe, s.net);
      var re = k('roe');
      setText(re, pctStr(s.roe, 1) + ' ROE'); pinTo(re, s.net);
      setText(k('lev'), levTxt(effLev(p)));
      setText(k('entry'), pxs(a, p.entry));
      setText(k('mark'), pxs(a, s.mk));
      setText(k('liq'), s.liq > 0 ? pxs(a, s.liq) : '\u2014');
      setText(k('ratio'), (s.ratio * 100).toFixed(1) + '%');
      setText(k('margin'), t('fut_margin_lbl', { x: money(p.margin) }));
      var bar = k('risk');
      if (bar) bar.style.width = Math.max(2, s.ratio * 100).toFixed(1) + '%';
      var box = k('riskbox');
      if (box) {
        var lvl = s.ratio < 0.35 ? 'r-lo' : s.ratio < 0.7 ? 'r-mid' : 'r-hi';
        if (!box.classList.contains(lvl)) { box.classList.remove('r-lo', 'r-mid', 'r-hi'); box.classList.add(lvl); }
      }
      card.classList.toggle('fp-danger', s.ratio >= 0.75);
      setHtml(k('tags'), tagsHtml(a, p));
      setText(k('closebtn'), armed.id === id ? t('fut_confirm_close', { x: pnlTxt }) : t('fut_close') + ' ' + pnlTxt);
    });
  }

  function quickClose(p, btn) {
    var ts = now();
    if (armed.id !== p.id || ts > armed.until) {
      armed = { id: p.id, until: ts + 3000 };
      updatePosCards(ts);
      FX.vibrate(8);
      return;
    }
    armed.id = 0;
    finishClose(p, 1, 'close', exitPx(assetById(p.a), p, ts), btn);
  }

  function histRowsHtml(list) {
    var loc = LANG === 'ru' ? 'ru-RU' : 'en-US';
    return list.map(function (h) {
      var a = assetById(h.a), tm = '';
      try { tm = new Date(h.t).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }); } catch (e) { dbg('fut:time', e); }
      var rs = h.part ? t('fut_r_part', { p: h.part }) : t('fut_r_' + h.reason);
      return '<div class="fh-row">' + coinHtml(a) +
        '<span class="grow"><b>' + esc(perpName(a)) + ' <span class="fh-reason ' + h.reason + '">' + esc(rs) + '</span></b>' +
        '<i>' + esc(t(h.side === 'long' ? 'fut_long' : 'fut_short')) + ' ' + levTxt(h.lev) + ' \u00B7 ' +
          esc(pxs(a, h.entry)) + ' \u2192 ' + esc(pxs(a, h.exit)) + '</i></span>' +
        '<span class="right"><b class="mono ' + cls(h.pnl) + '">' + signed(h.pnl) + '</b><i class="muted small">' + esc(tm) + '</i></span></div>';
    }).join('');
  }

  /* ------------------------------ Шит ордера ------------------------------ */

  function openOrder(side) {
    if (!cv) return;
    var a = cv.a, f = st(), ml = maxLev(a);
    sh = { a: a, side: side === 'short' ? 'short' : 'long', lev: clamp(f.lev, 1, ml), margin: 0, tp: 0, sl: 0, pct: 0 };
    var mx = maxMargin(sh.lev);
    var def = f.amt > 0 ? f.amt : Math.max(MIN_MARGIN, Math.round(cash() * 0.25));
    sh.margin = floor2(Math.min(mx, def));
    setHtml(el('fs-coin'), coinHtml(a));
    setText(el('fs-name'), perpName(a));
    setText(el('fs-maxlev'), ml + '\u00D7');
    setText(el('fs-sub'), t('fut_perp_sub', { name: assetName(a) }));
    var range = el('fs-lev-range');
    range.max = String(ml);
    el('fs-lev-ticks').innerHTML = levTicks(ml).map(function (v) {
      return '<button type="button" data-lev="' + v + '" style="left:' + ((v - 1) / (ml - 1) * 100).toFixed(2) + '%">' + v + '\u00D7</button>';
    }).join('');
    el('fs-amt').value = amtTxt(sh.margin);
    el('fs-tpsl').open = false;
    applySide(false);
    applyLev(false);
    refreshPcts();
    openModal('modal-fut');
    updateOrder(now());
  }
  function closeOrder() { closeModal('modal-fut'); }

  function clampOrderMargin() {
    if (!sh) return;
    var mx = maxMargin(sh.lev);
    if (sh.pct) sh.margin = floor2(mx * sh.pct / 100);
    else if (sh.margin > mx || !(sh.margin > 0)) sh.margin = floor2(Math.min(mx, Math.max(MIN_MARGIN, sh.margin || cash() * 0.25)));
    el('fs-amt').value = amtTxt(sh.margin);
  }

  function applySide(anim) {
    var s = el('fs-sheet');
    s.setAttribute('data-fs', sh.side);
    var seg = el('fs-side');
    seg.setAttribute('data-v', sh.side);
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      var on = b.getAttribute('data-side') === sh.side;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (anim) FX.vibrate(6);
  }

  function applyLev(anim) {
    var ml = maxLev(sh.a), lev = sh.lev, s = el('fs-sheet'), lvl = riskLevel(lev);
    s.style.setProperty('--lev-c', RISK_C[lvl]);
    s.classList.toggle('fs-hot', lev >= 25);
    var range = el('fs-lev-range');
    if (+range.value !== lev) range.value = String(lev);
    range.style.setProperty('--p', ((lev - 1) / (ml - 1) * 100).toFixed(2) + '%');
    var val = el('fs-lev-val');
    setText(val, lev + '\u00D7');
    if (anim) FX.pulse(val, 'bump', typeof V3 !== 'undefined' ? V3.D(360) : 360);
    setText(el('fs-risk'), t('fut_risk_' + lvl));
    Array.prototype.forEach.call(document.querySelectorAll('#fs-lev-ticks button'), function (b) {
      var v = +b.getAttribute('data-lev');
      b.classList.toggle('on', v < lev);
      b.classList.toggle('cur', v === lev);
    });
  }

  function setLev(v, fromTick) {
    var ml = maxLev(sh.a);
    v = clamp(Math.round(v) || 1, 1, ml);
    if (v === sh.lev) return;
    var wasHot = sh.lev >= 25;
    sh.lev = v;
    Snd.play('lev_step', (v - 1) / Math.max(1, ml - 1));
    if (levTicks(ml).indexOf(v) >= 0 || fromTick) FX.vibrate(5);
    var mx = maxMargin(v);
    if (sh.pct) sh.margin = floor2(mx * sh.pct / 100);
    else if (sh.margin > mx) sh.margin = mx;
    el('fs-amt').value = amtTxt(sh.margin);
    applyLev(true);
    updateOrder(now());
    if (!wasHot && v >= 25) FX.pulse(el('fs-warn'), 'show', 450);
  }

  function refreshPcts() {
    Array.prototype.forEach.call(document.querySelectorAll('#fs-pcts button'), function (b) {
      b.classList.toggle('active', +b.getAttribute('data-pct') === sh.pct);
    });
  }

  function chipsHtml(vals, cur, fmt, disabledFn) {
    return vals.map(function (v) {
      var dis = disabledFn ? disabledFn(v) : false;
      return '<button type="button" data-v="' + v + '"' + (v === cur ? ' class="active"' : '') + (dis ? ' disabled' : '') + '>' + fmt(v) + '</button>';
    }).join('');
  }
  function roeLabel(v) { return v ? (v > 0 ? '+' : '\u2212') + Math.abs(v) + '%' : t('fut_off'); }

  function updateOrder(ts) {
    if (!sh) return;
    var a = sh.a, mk = markOf(a, ts);
    var pe = el('fs-mark'), mtxt = pxs(a, mk);
    flashPrice('fs-mark', pe, mtxt, false);
    setText(pe, mtxt);
    var chg = chg24(a, ts);
    setText(el('fs-chg'), pctStr(chg));
    pinTo(el('fs-chg'), chg);
    var e = entryPx(a, sh.side, ts), lev = sh.lev, mmr = mmrFor(lev);
    var mx = maxMargin(lev), m = sh.margin;
    var notional = m * lev, qty = e > 0 ? notional / e : 0, fee = notional * FEE;
    var liq = previewLiq(sh.side, e, lev);
    var dist = e > 0 ? Math.abs(e - liq) / e : 0;

    setText(el('fs-io-m'), money(m).slice(1));
    setText(el('fs-io-avail'), t('fut_avail', { x: money(mx) }));
    setText(el('fs-io-size'), money(notional));
    setText(el('fs-io-qty'), fmtQty(qty) + ' ' + a.ticker + ' \u00B7 ' + lev + '\u00D7');
    setText(el('fs-max'), t('max') + ': ' + money(mx));
    setText(el('fs-d-entry'), '~' + pxs(a, e));
    setText(el('fs-d-size'), money(notional));
    setText(el('fs-d-liq'), pxs(a, liq));
    setText(el('fs-d-dist'), pctStr(sh.side === 'long' ? -dist : dist, 1));
    setText(el('fs-d-mmr'), (mmr * 100).toFixed(2) + '%');
    setText(el('fs-d-fee'), money(fee));
    setText(el('fs-d-fund'), pctStr(fundRate(a, ts), 4));

    /* TP/SL: цена от целевого ROE. Стоп за ликвидацией не сработает никогда —
       такие чипы выключены, а выбранный сбрасывается. */
    var slBad = function (v) { var p = roeToPx(e, lev, sh.side, v); return !!v && (!(p > 0) || beyondLiq(sh.side, p, liq)); };
    var tpBad = function (v) { return !!v && !(roeToPx(e, lev, sh.side, v) > 0); };
    if (slBad(sh.sl)) sh.sl = 0;
    if (tpBad(sh.tp)) sh.tp = 0;
    setHtml(el('fs-tp'), chipsHtml(TP_ROE, sh.tp, roeLabel, tpBad));
    setHtml(el('fs-sl'), chipsHtml(SL_ROE, sh.sl, roeLabel, slBad));
    var tpPx = roeToPx(e, lev, sh.side, sh.tp), slPx = roeToPx(e, lev, sh.side, sh.sl);
    setText(el('fs-tp-px'), tpPx > 0 ? pxs(a, tpPx) : '\u2014');
    setText(el('fs-sl-px'), slPx > 0 ? pxs(a, slPx) : '\u2014');
    var sum = [];
    if (sh.tp) sum.push('TP ' + roeLabel(sh.tp));
    if (sh.sl) sum.push('SL ' + roeLabel(sh.sl));
    setText(el('fs-tpsl-sum'), sum.length ? sum.join(' \u00B7 ') : t('fut_tpsl_off'));

    var err = checkOpen();
    var warn = el('fs-warn'), wt = el('fs-warn-txt'), topup = el('fs-topup');
    var needFunds = err && (err === t('fut_err_cash') || err === t('fut_err_funds'));
    topup.classList.toggle('hidden', !needFunds || S.balance < 0.01);
    if (err && err !== 'x') {
      warn.classList.remove('hidden');
      warn.classList.add('muted-warn');
      setText(wt, err);
    } else if (lev >= 25 || dist < 0.03) {
      warn.classList.remove('hidden', 'muted-warn');
      setText(wt, t('fut_warn_hi', { p: (dist * 100).toFixed(1) + '%' }));
    } else {
      warn.classList.add('hidden');
    }
    el('fs-confirm').disabled = !!err;
    setText(el('fs-confirm-txt'), t(sh.side === 'long' ? 'fut_open_long' : 'fut_open_short', { x: lev }));
  }

  /* ------------------------------ Шит позиции ------------------------------ */

  function openPosSheet(id) {
    var p = findPos(id);
    if (!p) return;
    pm = { id: id, close: 100, add: 50, confirm: 0 };
    buildPosSheet();
    openModal('modal-fpos');
  }
  function closePosSheet() { closeModal('modal-fpos'); pm = null; notifyAch(); }

  function buildPosSheet() {
    var p = pm && findPos(pm.id), box = el('fpos-sheet');
    if (!p || !box) return;
    var a = assetById(p.a);
    box.setAttribute('data-fs', p.side);
    function gcell(lbl, k, extra) {
      return '<div><span>' + esc(t(lbl)) + '</span><b class="mono' + (extra ? ' ' + extra : '') + '" data-k="' + k + '">\u2014</b></div>';
    }
    box.innerHTML = '<div class="fs-cascade">' +
      '<div class="fs-head">' + coinHtml(a) +
        '<span class="fs-title"><b>' + esc(perpName(a)) + ' <span class="fp-side">' +
          esc(t(p.side === 'long' ? 'fut_pill_long' : 'fut_pill_short')) + '</span></b><i data-k="sub">\u2014</i></span>' +
        '<span class="fs-px"><b class="mono" data-k="mk">\u2014</b><i class="mono" data-k="chg">\u2014</i></span>' +
        '<button type="button" class="icon-btn" data-pclose aria-label="' + esc(t('a11y_close')) + '">\u2715</button></div>' +
      '<div class="fpos-hero"><span class="tr-lbl">' + esc(t('fut_pos_pnl')) + '</span>' +
        '<div class="fpos-pnl mono" data-k="pnl">\u2014</div><span class="fpos-roe mono" data-k="roe">\u2014</span></div>' +
      '<div class="fpos-rail"><div class="fpos-rail-line"><span class="fpos-rail-fill" data-k="fill"></span></div>' +
        '<span class="fr-mk liq" data-m="liq"><span>' + esc(t('fut_rail_liq')) + '</span></span>' +
        '<span class="fr-mk entry" data-m="entry"><span>' + esc(t('fut_ln_entry')) + '</span></span>' +
        '<span class="fr-mk tp" data-m="tp"><span>TP</span></span>' +
        '<span class="fr-mk sl bot" data-m="sl"><span>SL</span></span>' +
        '<span class="fr-mk mark bot" data-m="mark"><span>' + esc(t('fut_rail_mark')) + '</span></span>' +
      '</div>' +
      '<div class="fpos-grid">' + gcell('fut_entry_short', 'entry') + gcell('fut_mark_short', 'mark') + gcell('fut_liq_short', 'liq', 'liq') +
        gcell('fut_margin', 'margin') + gcell('fut_pos_size', 'size') + gcell('fut_pos_fund', 'fund') + '</div>' +
      '<div class="fpos-sec"><div class="fpos-sec-title"><span>' + esc(t('fut_sec_tpsl')) + '</span></div>' +
        '<div class="fs-chiprow"><div class="fs-chiprow-head"><span>' + esc(t('fut_tp_long')) + '</span><b class="mono" data-k="tppx">\u2014</b></div>' +
          '<div class="fs-chips tp" data-k="tp"></div></div>' +
        '<div class="fs-chiprow"><div class="fs-chiprow-head"><span>' + esc(t('fut_sl_long')) + '</span><b class="mono" data-k="slpx">\u2014</b></div>' +
          '<div class="fs-chips sl" data-k="sl"></div></div></div>' +
      '<div class="fpos-sec"><div class="fpos-sec-title"><span>' + esc(t('fut_sec_add')) + '</span><b class="mono" data-k="addinfo"></b></div>' +
        '<div class="fs-chips gold" data-k="add"></div>' +
        '<button type="button" class="btn fpos-small-btn" data-k="addbtn" data-pact="add">\u2014</button></div>' +
      '<div class="fpos-sec"><div class="fpos-sec-title"><span>' + esc(t('fut_sec_close')) + '</span></div>' +
        '<div class="fs-chips gold" data-k="close"></div>' +
        '<button type="button" class="btn big fpos-close-btn" data-k="closebtn" data-pact="close">\u2014</button></div>' +
    '</div>';
    updatePosSheet(now());
  }

  /* ROE стопа/тейка считаем от текущей маржи позиции: после доливки плечо
     меньше, и те же +50% означают более далёкую цену. */
  function posRoePx(p, roe) { return roeToPx(p.entry, effLev(p), p.side, roe); }
  function posRoeOf(p, px) {
    if (!(px > 0)) return 0;
    var r = (px / p.entry - 1) * dirOf(p) * effLev(p) * 100;
    var best = 0, bd = 1e9;
    TP_ROE.concat(SL_ROE).forEach(function (v) { if (v && Math.abs(v - r) < bd) { bd = Math.abs(v - r); best = v; } });
    return bd < 3 ? best : 0;
  }

  function updatePosSheet(ts) {
    var p = pm && findPos(pm.id), box = el('fpos-sheet');
    if (!p || !box || !box.firstChild) return;
    var s = snap(p, ts), a = s.a;
    function k(n) { return box.querySelector('[data-k="' + n + '"]'); }
    setText(k('sub'), levTxt(effLev(p)) + ' \u00B7 ' + t('fut_margin_lbl', { x: money(p.margin) }));
    var mkTxt = pxs(a, s.mk), mke = k('mk');
    flashPrice('fpos-mk', mke, mkTxt, false);
    setText(mke, mkTxt);
    var chg = chg24(a, ts);
    setText(k('chg'), pctStr(chg)); pinTo(k('chg'), chg);
    var pe = k('pnl'), pnlTxt = signed(s.net);
    flashPrice('fpos-pnl', pe, pnlTxt, true);
    setText(pe, pnlTxt); pinTo(pe, s.net);
    var re = k('roe');
    setText(re, pctStr(s.roe, 2) + ' ROE'); pinTo(re, s.net);
    box.style.setProperty('--pn-rgb', s.net >= 0 ? '47, 190, 110' : '240, 82, 79');
    setText(k('entry'), pxs(a, p.entry));
    setText(k('mark'), mkTxt);
    setText(k('liq'), s.liq > 0 ? pxs(a, s.liq) : '\u2014');
    setText(k('margin'), money(p.margin));
    setText(k('size'), money(p.qty * s.mk));
    setText(k('fund'), signed(-p.fund));

    var vals = [s.liq, p.entry, s.mk];
    if (p.tp > 0) vals.push(p.tp);
    if (p.sl > 0) vals.push(p.sl);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = (hi - lo) * 0.08 || hi * 0.01;
    lo -= pad; hi += pad;
    function pos(v) { return clamp((v - lo) / (hi - lo) * 100, 0, 100); }
    function place(m, v) {
      var e = box.querySelector('[data-m="' + m + '"]');
      if (!e) return;
      e.style.display = v > 0 ? '' : 'none';
      if (v > 0) e.style.left = pos(v).toFixed(2) + '%';
    }
    place('liq', s.liq); place('entry', p.entry); place('tp', p.tp); place('sl', p.sl); place('mark', s.mk);
    var fill = k('fill');
    if (fill) {
      /* Как в концепте: заливка между входом и текущей ценой — видно, сколько прошла цена. */
      var l = pos(Math.min(p.entry, s.mk)), r = pos(Math.max(p.entry, s.mk));
      fill.style.left = l.toFixed(2) + '%';
      fill.style.width = Math.max(0.5, r - l).toFixed(2) + '%';
      fill.classList.toggle('down', s.net < 0);
    }

    var curTp = posRoeOf(p, p.tp), curSl = posRoeOf(p, p.sl);
    var slBad = function (v) { var x = posRoePx(p, v); return !!v && (!(x > 0) || beyondLiq(p.side, x, s.liq)); };
    var tpBad = function (v) { return !!v && !(posRoePx(p, v) > 0); };
    setHtml(k('tp'), chipsHtml(TP_ROE, curTp, roeLabel, tpBad));
    setHtml(k('sl'), chipsHtml(SL_ROE, curSl, roeLabel, slBad));
    setText(k('tppx'), p.tp > 0 ? pxs(a, p.tp) : '\u2014');
    setText(k('slpx'), p.sl > 0 ? pxs(a, p.sl) : '\u2014');

    var free = cash();
    setHtml(k('add'), chipsHtml(ADD_PCTS, pm.add, function (v) { return v === 100 ? t('fut_pct_all') : v + '%'; }, function () { return free < 1; }));
    var addAmt = pm.add ? floor2(free * pm.add / 100) : 0;
    if (addAmt < 1) addAmt = 0;
    var nl = addAmt ? liqPrice({ side: p.side, entry: p.entry, qty: p.qty, margin: p.margin + addAmt, fund: p.fund, mmr: p.mmr }) : 0;
    setText(k('addinfo'), t('fut_avail', { x: money(free) }));
    var ab = k('addbtn');
    ab.disabled = !addAmt;
    setText(ab, addAmt ? t('fut_add_btn', { x: money(addAmt), p: pxs(a, nl) }) : t('fut_add_none'));

    setHtml(k('close'), chipsHtml(CLOSE_PCTS, pm.close, function (v) { return v + '%'; }));
    var frac = pm.close / 100;
    var partNet = frac >= 0.999 ? s.net
      : Math.max(0, p.margin * frac + pricePnl(p, s.x) * frac - p.fund * frac - p.qty * frac * s.x * FEE) - p.margin * frac - p.fee * frac;
    var cb = k('closebtn');
    var conf = pm.confirm && Date.now() - pm.confirm < 3000;
    if (!conf) pm.confirm = 0;
    setText(cb, (conf ? t('fut_sure') + ' ' : '') + t('fut_close_btn', { p: pm.close, x: signed(partNet) }));
    cb.classList.toggle('confirm', !!conf);
    cb.classList.toggle('win', partNet >= 0);
    cb.classList.toggle('lose', partNet < 0);
  }

  function setPosTpSl(p, kind, roe) {
    var px = roe ? posRoePx(p, roe) : 0;
    if (kind === 'tp') p.tp = px > 0 ? px : 0;
    else {
      if (px > 0 && beyondLiq(p.side, px, liqPrice(p))) return;
      p.sl = px > 0 ? px : 0;
    }
    saveState(false);
    FX.vibrate(6);
    updatePosSheet(now());
    updatePosCards(now());
  }

  function addMargin(p, amt, btn) {
    amt = floor2(Math.min(amt, cash()));
    if (!(amt >= 1)) { FX.nudge(btn); return; }
    st().cash = Math.max(0, cash() - amt);
    p.margin += amt;
    saveState(true);
    Snd.play('margin');
    toast(t('fut_toast_margin', { x: money(amt), p: pxs(assetById(p.a), liqPrice(p)) }), 'gold');
    FX.reward(btn);
    updatePosSheet(now());
    refreshAll(now());
  }

  /* ------------------------------ Портфель ------------------------------ */

  function renderPortfolio(force) {
    var card = el('pf-fut-card');
    if (!card) return;
    var f = st(), ts = now();
    var show = f.pos.length > 0 || cash() >= 0.01 || f.hist.length > 0;
    card.classList.toggle('hidden', !show);
    if (!show || currentTab !== 'portfolio') return;
    var marg = 0, net = 0, eq = cash();
    f.pos.forEach(function (p) {
      if (!assetById(p.a)) return;
      var s = snap(p, ts);
      marg += p.margin; net += s.net; eq += s.payout;
    });
    var ee = el('pf-fut-eq');
    if (ee) {
      if (ee.__v == null || force) ee.textContent = money(eq);
      else if (Math.abs(ee.__v - eq) >= 0.005) FX.tweenNumber(ee, eq, { from: ee.__v, dur: 380, fmt: function (x) { return money(x); } });
      ee.__v = eq;
    }
    var sub = el('pf-fut-sub');
    if (f.pos.length) {
      setText(sub, 'PnL ' + signed(net) + ' (' + pctStr(marg > 0 ? net / marg : 0, 1) + ')');
      pinTo(sub, net);
    } else {
      setText(sub, t('fut_pf_empty'));
      if (sub) sub.classList.remove('up', 'down');
    }
    setText(el('pf-fut-cash'), money(cash()));
    setText(el('pf-fut-margin'), money(marg));
    var up = el('pf-fut-upnl');
    setText(up, f.pos.length ? signed(net) : '\u2014');
    if (f.pos.length) pinTo(up, net); else if (up) up.classList.remove('up', 'down');
    var rem = FUND_MS - (ts % FUND_MS);
    setText(el('pf-fut-cd'), mmss(rem));
    var ring = el('pf-fut-ring');
    if (ring) ring.style.strokeDashoffset = (RING_C * (1 - rem / FUND_MS)).toFixed(2);
    setText(el('pf-fut-n'), String(f.pos.length));
    var go = el('pf-fut-go');
    if (go) go.classList.toggle('hidden', f.pos.length > 0);
    renderPosList(el('pf-fut-list'), f.pos, 'pf', force, '');
    var hs = f.hist.length + '|' + (f.hist[0] ? f.hist[0].t : 0) + '|' + LANG;
    var hb = el('pf-fut-hist');
    if (!hb) return;
    hb.classList.toggle('hidden', !f.hist.length);
    if (force || sigs.pfHist !== hs) {
      sigs.pfHist = hs;
      setText(el('pf-fut-hist-n'), String(f.hist.length));
      el('pf-fut-hist-list').innerHTML = histRowsHtml(f.hist.slice(0, HIST_SHOW));
    }
  }

  function goFutures() {
    st().view = 'fut';
    setTab('market');
  }

  /* Одна точка обновления всего видимого после изменения денег или позиций. */
  function refreshAll(ts, forceLists) {
    if (visible()) { updateWallets(false); updateRows(ts); renderOverview(ts); }
    if (cv && modalOpen('modal-fchart')) renderDesk(!!forceLists);
    renderPortfolio(!!forceLists);
    updatePosCards(ts);
    updateBadge();
  }

  /* ------------------------------ Разметка ------------------------------ */

  function mount() {
    perps = [];
    PERP_IDS.forEach(function (id) { var a = assetById(id); if (a) { perps.push(a); PERP_SET[id] = 1; } });
    var tab = el('tab-market');
    if (!tab || el('mkt-seg')) return;

    tab.insertAdjacentHTML('afterbegin',
      '<div class="seg fut-seg" id="mkt-seg" role="tablist" data-v="spot">' +
        '<span class="seg-indicator" aria-hidden="true"></span>' +
        '<button type="button" class="active" data-view="spot" role="tab" aria-selected="true"><span data-i18n="fut_seg_spot"></span></button>' +
        '<button type="button" data-view="fut" role="tab" aria-selected="false"><span data-i18n="fut_seg_fut"></span>' +
        '<span class="fut-seg-badge hidden" id="fut-seg-badge">0</span></button>' +
      '</div>');
    tab.insertAdjacentHTML('beforeend',
      '<div id="fut-view" class="fut-view">' +
        '<div class="card fut-intro hidden" id="fut-intro">' +
          '<button type="button" class="icon-btn fut-intro-x" id="fut-intro-x" data-i18n-aria="a11y_close" aria-label="Close">\u2715</button>' +
          '<h3 data-i18n="fut_intro_title"></h3>' +
          '<ul><li><i class="l">\u25B2</i><span data-i18n="fut_intro_1"></span></li>' +
          '<li><i class="g">\u00D7</i><span data-i18n="fut_intro_2"></span></li>' +
          '<li><i class="s">!</i><span data-i18n="fut_intro_3"></span></li>' +
          '<li><i class="g">\u21C4</i><span data-i18n="fut_intro_4"></span></li></ul>' +
          '<button type="button" class="btn primary big" id="fut-intro-ok" data-i18n="fut_intro_ok"></button>' +
        '</div>' +
        overviewHtml() +
        '<div class="card fut-xfer">' +
          '<div class="fx-cell"><span data-i18n="fut_w_spot"></span><b class="mono" id="fx-spot">\u2014</b></div>' +
          '<button type="button" class="fx-swap" data-fxopen data-i18n-aria="fut_a11y_xfer" aria-label="Transfer">' + ICON.xfer + '</button>' +
          '<div class="fx-cell"><span data-i18n="fut_w_fut"></span><b class="mono" id="fx-fut">\u2014</b></div>' +
          '<button type="button" class="btn gold-btn fx-btn" data-fxopen data-i18n="fut_xfer_btn"></button>' +
        '</div>' +
        '<div class="search-card card fut-search">' +
          '<input spellcheck="false" autocorrect="off" autocapitalize="off" id="fut-search" type="search" enterkeyhint="search" autocomplete="off" data-i18n-ph="fut_search_ph" data-i18n-aria="fut_search_ph">' +
          '<button type="button" id="fut-search-clear" class="search-clear hidden" data-i18n-aria="a11y_clear" aria-label="Clear">\u2715</button>' +
          '<button type="button" id="fut-sort" class="sort-btn" data-i18n-aria="sort_aria">' + ICON.sort + '</button>' +
        '</div>' +
        '<div id="fut-list" class="list"></div>' +
      '</div>');

    var pfAssets = el('pf-assets-card');
    if (pfAssets) {
      pfAssets.insertAdjacentHTML('afterend',
        '<div class="card fut-pf hidden" id="pf-fut-card">' +
          '<div class="ac-head"><div class="ac-title" data-i18n="fut_pf_title"></div>' +
            '<button type="button" class="ac-more" data-fxopen><span data-i18n="fut_xfer_btn"></span>' + ICON.xfer.replace('<svg ', '<svg class="ac-xf" ') + '</button></div>' +
          '<div class="fpf-top">' +
            '<div class="fpf-main"><span class="fut-kicker" data-i18n="fut_pf_eq"></span>' +
              '<b class="fpf-eq mono" id="pf-fut-eq">\u2014</b><span class="fpf-sub mono" id="pf-fut-sub">\u2014</span></div>' +
            '<div class="fut-fund">' +
              '<svg class="fut-ring" viewBox="0 0 40 40" aria-hidden="true"><circle class="bg" cx="20" cy="20" r="16"/>' +
              '<circle class="fg" id="pf-fut-ring" cx="20" cy="20" r="16"/></svg>' +
              '<div class="fut-fund-txt"><b class="mono" id="pf-fut-cd">\u2014</b><i data-i18n="fut_funding_in"></i></div>' +
            '</div>' +
          '</div>' +
          '<div class="fut-acct-grid">' +
            '<div><span data-i18n="fut_pf_cash"></span><b class="mono" id="pf-fut-cash">\u2014</b></div>' +
            '<div><span data-i18n="fut_in_margin"></span><b class="mono" id="pf-fut-margin">\u2014</b></div>' +
            '<div><span data-i18n="fut_upnl"></span><b class="mono" id="pf-fut-upnl">\u2014</b></div>' +
          '</div>' +
          '<div class="fut-sec-head"><span data-i18n="fut_positions"></span><b class="mono" id="pf-fut-n">0</b></div>' +
          '<div class="list" id="pf-fut-list"></div>' +
          '<button type="button" class="btn accent-btn wide fpf-go hidden" id="pf-fut-go" data-i18n="fut_pf_go"></button>' +
          '<details class="fut-hist hidden" id="pf-fut-hist"><summary><span><span data-i18n="fut_history"></span> \u00B7 ' +
            '<b class="mono" id="pf-fut-hist-n">0</b></span><span class="chev">' + ICON.chev + '</span></summary>' +
            '<div class="fut-hist-list" id="pf-fut-hist-list"></div></details>' +
        '</div>');
    }

    var tfBtns = TFS.map(function (tf) {
      return '<button type="button" class="ftf" data-tf="' + tf + '" data-i18n="' + TF_KEY[tf] + '"></button>';
    }).join('');
    var pctBtns = PCTS.map(function (p) { return '<button type="button" data-pct="' + p + '">' + p + '%</button>'; }).join('');
    var xfPct = XF_PCTS.map(function (p) { return '<button type="button" data-pct="' + p + '">' + p + '%</button>'; }).join('');
    function detRow(lbl, id) {
      return '<div class="tr-det-row"><span data-i18n="' + lbl + '"></span><b class="mono" id="' + id + '">\u2014</b></div>';
    }
    document.body.insertAdjacentHTML('beforeend',
      /* Экран контракта: как спотовый — шторка, график, Лонг/Шорт, позиции внизу. */
      '<div id="modal-fchart" class="modal chart-modal hidden" role="dialog" aria-modal="true">' +
        '<div class="backdrop" data-cclose></div>' +
        '<div class="chart-sheet" id="fchart">' +
          '<header class="topbar cs-top">' +
            '<button type="button" class="icon-btn cs-close" data-cclose data-i18n-aria="a11y_back" aria-label="Back">' + ICON.close + '</button>' +
            '<span class="tr-title"><b id="fc-title">\u2014</b><i id="fc-sub" class="muted small"></i></span>' +
            '<button type="button" class="icon-btn" data-fxopen data-i18n-aria="fut_a11y_xfer" aria-label="Transfer">' + ICON.xfer + '</button>' +
          '</header>' +
          '<main class="cs-body" id="fc-body">' +
            '<div class="trade-head">' +
              '<span class="coin big" id="fc-icon"></span>' +
              '<div class="th-main">' +
                '<div class="th-center"><b class="th-price mono" id="fc-price">\u2014</b>' +
                  '<div class="th-change" id="fc-chg-wrap"><span class="mono" id="fc-chg">\u2014</span><span class="th-dot">\u2022</span>' +
                  '<span class="th-period" data-i18n="chg"></span></div></div>' +
                '<div class="th-stats">' +
                  '<div class="th-stat"><div class="th-stat-label" data-i18n="fut_funding_1h"></div><div class="th-stat-value mono" id="fc-fund">\u2014</div></div>' +
                  '<div class="th-stat"><div class="th-stat-label" data-i18n="volume_24h"></div><div class="th-stat-value mono" id="fc-vol">\u2014</div></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="card chart-card">' +
              '<div class="chart-top"><div id="fc-ohlc" class="mono muted small fc-ohlc"></div>' +
                '<div class="seg chart-type-seg" id="fc-ctype" role="group">' +
                  '<button type="button" data-ctype="candle" aria-pressed="true" data-i18n-aria="a11y_candles" aria-label="Candles">' + ICON.candle + '</button>' +
                  '<button type="button" data-ctype="line" aria-pressed="false" data-i18n-aria="a11y_line" aria-label="Line">' + ICON.line + '</button>' +
                '</div>' +
                '<button type="button" id="fc-live" class="live-btn hidden" data-i18n="chart_live">\u27F3 Live</button></div>' +
              '<canvas id="fc-chart" role="img" data-i18n-aria="a11y_price_chart"></canvas>' +
              '<div class="tf-row" id="fc-tfs">' + tfBtns + '</div>' +
            '</div>' +
            '<div class="fc-ls"><span class="up" id="fc-ls-l">\u2014</span><span class="fc-ls-bar"><i id="fc-ls-bar"></i></span><span class="down" id="fc-ls-s">\u2014</span></div>' +
            '<div class="trade-actions">' +
              '<button type="button" class="btn down-btn" id="fc-short"><span class="fc-act">' + ICON.down + '<span data-i18n="fut_short"></span></span><span class="sub" id="fc-short-sub"></span></button>' +
              '<button type="button" class="btn up-btn" id="fc-long"><span class="fc-act">' + ICON.up + '<span data-i18n="fut_long"></span></span><span class="sub" id="fc-long-sub"></span></button>' +
            '</div>' +
            '<section class="card desk fdesk">' +
              '<div class="desk-tabs-wrap"><div class="desk-tabs" id="fc-tabs" role="tablist">' +
                '<button type="button" class="fdtab active" data-ftab="pos" role="tab"><span data-i18n="fut_d_pos"></span><span class="desk-badge hidden" data-badge="pos"></span></button>' +
                '<button type="button" class="fdtab" data-ftab="hist" role="tab"><span data-i18n="fut_d_hist"></span></button>' +
              '</div><span class="desk-ink" id="fc-ink"></span></div>' +
              '<div class="desk-body">' +
                '<div class="desk-panel" data-fpanel="pos"><div class="list" id="fc-pos"></div></div>' +
                '<div class="desk-panel hidden" data-fpanel="hist"><div class="fut-hist-list fc-hist" id="fc-hist"></div></div>' +
              '</div>' +
            '</section>' +
          '</main>' +
        '</div>' +
      '</div>' +
      /* Шит ордера: открывается кнопками Лонг/Шорт, как спотовый шит покупки. */
      '<div id="modal-fut" class="modal hidden" role="dialog" aria-modal="true">' +
        '<div class="backdrop" data-fclose></div>' +
        '<div class="sheet fut-sheet" id="fs-sheet" data-fs="long"><div class="fs-cascade">' +
          '<div class="fs-head"><span id="fs-coin"></span>' +
            '<span class="fs-title"><b><span id="fs-name">\u2014</span><span class="fut-lev-badge" id="fs-maxlev"></span></b><i id="fs-sub">\u2014</i></span>' +
            '<span class="fs-px"><b class="mono" id="fs-mark">\u2014</b><i class="mono" id="fs-chg">\u2014</i></span>' +
            '<button type="button" class="icon-btn" data-fclose data-i18n-aria="a11y_close" aria-label="Close">\u2715</button></div>' +
          '<div class="seg sheet-seg fs-side" id="fs-side" role="tablist" data-v="long">' +
            '<span class="seg-indicator" aria-hidden="true"></span>' +
            '<button type="button" data-side="long" role="tab">' + ICON.up + '<span data-i18n="fut_long"></span></button>' +
            '<button type="button" data-side="short" role="tab">' + ICON.down + '<span data-i18n="fut_short"></span></button>' +
          '</div>' +
          '<div class="tr-io">' +
            '<div class="tr-io-col"><span class="tr-lbl" data-i18n="fut_margin"></span>' +
              '<div class="tr-io-big mono"><span class="tr-io-cur">$</span><span id="fs-io-m">0</span></div>' +
              '<span class="tr-avail" id="fs-io-avail">\u2014</span></div>' +
            '<span class="tr-io-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>' +
            '<div class="tr-io-col tr-io-col--out"><span class="tr-lbl" data-i18n="fut_size"></span>' +
              '<div class="tr-io-big mono tr-io-big--out" id="fs-io-size">\u2014</div>' +
              '<span class="tr-avail" id="fs-io-qty">\u2014</span></div>' +
          '</div>' +
          '<div class="fs-lev" id="fs-lev">' +
            '<div class="fs-lev-head"><span class="tr-lbl" data-i18n="fut_leverage"></span><span class="fs-risk" id="fs-risk"></span>' +
              '<b class="fs-lev-val mono" id="fs-lev-val">10\u00D7</b></div>' +
            '<div class="fs-lev-track"><input type="range" class="fs-lev-range" id="fs-lev-range" min="1" max="50" step="1" value="10" data-i18n-aria="fut_leverage"></div>' +
            '<div class="fs-lev-ticks" id="fs-lev-ticks"></div>' +
          '</div>' +
          '<div class="set-label" data-i18n="fut_margin_from"></div>' +
          '<div class="amt-row"><span class="amt-ico">$</span>' +
            '<input spellcheck="false" autocorrect="off" autocapitalize="off" id="fs-amt" type="text" inputmode="decimal" autocomplete="off" data-i18n-aria="fut_margin">' +
            '<button type="button" id="fs-max" class="amt-max mono">Max</button></div>' +
          '<div class="pct-chips" id="fs-pcts">' + pctBtns + '</div>' +
          '<details class="fs-tpsl" id="fs-tpsl"><summary>' + ICON.target +
            '<span class="grow" data-i18n="fut_tpsl"></span><em id="fs-tpsl-sum">\u2014</em><span class="chev">' + ICON.chev + '</span></summary>' +
            '<div class="fs-tpsl-body">' +
              '<div class="fs-chiprow"><div class="fs-chiprow-head"><span data-i18n="fut_tp_long"></span><b class="mono" id="fs-tp-px">\u2014</b></div>' +
                '<div class="fs-chips tp" id="fs-tp"></div></div>' +
              '<div class="fs-chiprow"><div class="fs-chiprow-head"><span data-i18n="fut_sl_long"></span><b class="mono" id="fs-sl-px">\u2014</b></div>' +
                '<div class="fs-chips sl" id="fs-sl"></div></div>' +
            '</div></details>' +
          '<div class="tr-details"><div class="tr-det-head" data-i18n="trade_details"></div>' +
            detRow('fut_entry', 'fs-d-entry') + detRow('fut_size', 'fs-d-size') +
            '<div class="tr-det-row"><span data-i18n="fut_liq"></span><b class="mono liq"><span id="fs-d-liq">\u2014</span>' +
              '<span class="fs-liq-dist" id="fs-d-dist"></span></b></div>' +
            detRow('fut_mmr', 'fs-d-mmr') + detRow('fut_fee', 'fs-d-fee') + detRow('fut_funding_rate', 'fs-d-fund') +
          '</div>' +
          '<div class="fs-warn hidden" id="fs-warn">' + ICON.warn + '<span id="fs-warn-txt"></span>' +
            '<button type="button" class="fs-topup hidden" id="fs-topup" data-fxopen data-i18n="fut_topup"></button></div>' +
          '<button type="button" class="btn big fs-confirm" id="fs-confirm"><span id="fs-confirm-txt">\u2014</span></button>' +
          '<div class="fs-note" data-i18n="disclaimer"></div>' +
        '</div></div>' +
      '</div>' +
      '<div id="modal-fpos" class="modal hidden" role="dialog" aria-modal="true">' +
        '<div class="backdrop" data-pclose></div>' +
        '<div class="sheet fpos-sheet" id="fpos-sheet"></div>' +
      '</div>' +
      /* Перевод между спотом и фьючерсами. */
      '<div id="modal-xfer" class="modal hidden" role="dialog" aria-modal="true">' +
        '<div class="backdrop" data-xclose></div>' +
        '<div class="sheet xfer-sheet"><div class="fs-cascade">' +
          '<div class="sheet-head sort-head"><span class="sort-head-ico" aria-hidden="true">' + ICON.xfer + '</span>' +
            '<span class="sort-head-txt"><h2 data-i18n="fut_xfer_title"></h2><p class="muted small" data-i18n="fut_xfer_sub"></p></span>' +
            '<button type="button" class="icon-btn" data-xclose data-i18n-aria="a11y_close" aria-label="Close">\u2715</button></div>' +
          '<div class="xf-route" id="xf-route" data-dir="toFut">' +
            '<div class="xf-wal" data-w="spot"><span class="xf-ico">' + ICON.wallet + '</span>' +
              '<span class="xf-txt"><i data-i18n="fut_w_spot"></i><b class="mono" id="xf-spot">\u2014</b></span>' +
              '<span class="xf-tag" id="xf-tag-spot"></span></div>' +
            '<button type="button" class="xf-swap" id="xf-swap" data-i18n-aria="fut_a11y_swap" aria-label="Swap">' + ICON.swapV + '</button>' +
            '<div class="xf-wal" data-w="fut"><span class="xf-ico">' + ICON.bolt + '</span>' +
              '<span class="xf-txt"><i data-i18n="fut_w_fut"></i><b class="mono" id="xf-fut">\u2014</b></span>' +
              '<span class="xf-tag" id="xf-tag-fut"></span></div>' +
          '</div>' +
          '<div class="set-label" data-i18n="fut_amount"></div>' +
          '<div class="amt-row"><span class="amt-ico">$</span>' +
            '<input spellcheck="false" autocorrect="off" autocapitalize="off" id="xf-amt" type="text" inputmode="decimal" autocomplete="off" data-i18n-aria="fut_amount">' +
            '<button type="button" id="xf-max" class="amt-max mono">Max</button></div>' +
          '<div class="pct-chips" id="xf-pcts">' + xfPct + '</div>' +
          '<div class="xf-after" id="xf-after"></div>' +
          '<button type="button" class="btn primary big xf-confirm" id="xf-confirm"><span id="xf-confirm-txt">\u2014</span></button>' +
          '<div class="fs-note" data-i18n="fut_xfer_hint"></div>' +
        '</div></div>' +
      '</div>' +
      /* Сортировка контрактов — та же модалка, что у спота. */
      '<div id="modal-fsort" class="modal hidden" role="dialog" aria-modal="true">' +
        '<div class="backdrop" data-sclose></div>' +
        '<div class="sheet sort-sheet">' +
          '<div class="sheet-head sort-head"><span class="sort-head-ico" aria-hidden="true">' +
            svg('<path d="M4 7h9M4 12h13M4 17h7"/><circle cx="18.5" cy="7" r="2.1"/><circle cx="15" cy="17" r="2.1"/>', 1.8) + '</span>' +
            '<span class="sort-head-txt"><h2 data-i18n="sort_title"></h2><p class="muted small" data-i18n="sort_sub"></p></span>' +
            '<button type="button" class="icon-btn" data-sclose data-i18n-aria="a11y_close" aria-label="Close">\u2715</button></div>' +
          '<div class="sort-cols">' +
            '<div class="sort-col sort-col--cats"><div class="set-label" data-i18n="sort_cats"></div><div id="fsort-cats" class="sort-cats"></div></div>' +
            '<div class="sort-col sort-col--by"><div class="set-label" data-i18n="sort_by"></div><div id="fsort-options"></div>' +
              '<div id="fsort-dir-wrap" class="fsort-dir-wrap"><div class="set-label" data-i18n="order"></div><div id="fsort-dir" class="fsort-dir"></div></div></div>' +
          '</div>' +
          '<div class="sort-foot">' +
            '<div class="sort-summary" aria-live="polite"><span id="fsum-cat"></span><span class="dot" aria-hidden="true"></span>' +
              '<span id="fsum-sort"></span><span class="dot" aria-hidden="true"></span><b id="fsum-count" class="mono"></b></div>' +
            '<button type="button" class="btn primary big" id="fsort-apply" data-i18n="apply"></button>' +
            '<button type="button" class="sort-reset" id="fsort-reset" data-i18n="reset_filters"></button>' +
          '</div>' +
        '</div>' +
      '</div>');

    bind();
  }

  /* ------------------------------ События ------------------------------ */

  function parseAmt(v) {
    var n = parseFloat(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
    return isFinite(n) && n > 0 ? floor2(n) : 0;
  }

  function bind() {
    /* Кнопки перевода есть в нескольких местах: на рынке, в портфеле, на
       экране контракта и в шите ордера. */
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-fxopen]');
      if (b) openXfer(b.id === 'fs-topup' ? 'toFut' : null);
    });

    el('mkt-seg').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-view]');
      if (b) setView(b.getAttribute('data-view'), true);
    });
    el('fut-intro-ok').addEventListener('click', dismissIntro);
    el('fut-intro-x').addEventListener('click', dismissIntro);
    el('fut-list').addEventListener('click', function (e) {
      if (e.target.closest('[data-freset]')) { el('fut-search').value = ''; setQuery(''); return; }
      var sug = e.target.closest('[data-sug]');
      if (sug) { e.stopPropagation(); el('fut-search').value = sug.getAttribute('data-sug'); setQuery(sug.getAttribute('data-sug')); return; }
      var star = e.target.closest('[data-fstar]');
      if (star) { e.stopPropagation(); toggleFav(star.getAttribute('data-fstar'), star); return; }
      var r = e.target.closest('[data-perp]');
      if (r) openChart(r.getAttribute('data-perp'));
    });
    var qTimer = 0;
    function setQuery(v) {
      q = v;
      var clr = el('fut-search-clear');
      clr.classList.toggle('hidden', !q);
      renderList(false);
    }
    el('fut-search').addEventListener('input', function () {
      var v = this.value;
      el('fut-search-clear').classList.toggle('hidden', !v);
      clearTimeout(qTimer);
      qTimer = setTimeout(function () { setQuery(v); }, 140);
    });
    el('fut-search').addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && this.value) { e.preventDefault(); this.value = ''; setQuery(''); }
    });
    el('fut-search-clear').addEventListener('click', function () {
      el('fut-search').value = ''; setQuery(''); el('fut-search').focus();
    });
    el('fut-sort').addEventListener('click', openSort);

    /* Сортировка */
    el('modal-fsort').addEventListener('click', function (e) {
      if (e.target.closest('[data-sclose]')) { closeModal('modal-fsort'); notifyAch(); return; }
      if (!sp) return;
      var c = e.target.closest('.cat-opt');
      if (c) { sp.cat = c.getAttribute('data-cat'); syncSort(); commitSortLive(); return; }
      var o = e.target.closest('.sort-opt');
      if (o) {
        sp.key = o.getAttribute('data-key');
        o.classList.add('flash');
        setTimeout(function () { o.classList.remove('flash'); }, 750);
        syncSort(); commitSortLive(); return;
      }
      var d = e.target.closest('.dir-opt');
      if (d) { sp.dir = d.getAttribute('data-dir'); syncSort(); commitSortLive(); return; }
      if (e.target.closest('#fsort-apply')) { applySort(false); return; }
      if (e.target.closest('#fsort-reset')) applySort(true);
    });

    /* Перевод */
    el('modal-xfer').addEventListener('click', function (e) {
      if (e.target.closest('[data-xclose]')) { closeXfer(); return; }
      if (!xf) return;
      if (e.target.closest('#xf-swap')) { swapXfer(); return; }
      var p = e.target.closest('#xf-pcts button');
      if (p) {
        xf.pct = +p.getAttribute('data-pct');
        xf.amt = floor2(xfMax() * xf.pct / 100);
        el('xf-amt').value = amtTxt(xf.amt);
        renderXfer(false); return;
      }
      if (e.target.closest('#xf-max')) {
        xf.pct = 100; xf.amt = xfMax();
        el('xf-amt').value = amtTxt(xf.amt);
        renderXfer(false); return;
      }
      var cf = e.target.closest('#xf-confirm');
      if (cf && !cf.disabled) doXfer(cf);
    });
    el('xf-amt').addEventListener('input', function () {
      if (!xf) return;
      xf.amt = parseAmt(this.value);
      xf.pct = 0;
      renderXfer(false);
    });

    /* Экран контракта */
    var mc = el('modal-fchart');
    mc.addEventListener('click', function (e) {
      if (e.target.closest('[data-cclose]')) { closeChart(); return; }
      if (!cv) return;
      if (e.target.closest('#fc-long')) { openOrder('long'); return; }
      if (e.target.closest('#fc-short')) { openOrder('short'); return; }
      var tf = e.target.closest('#fc-tfs .ftf');
      if (tf) {
        var v = +tf.getAttribute('data-tf');
        if (!tfAllowed(v)) { toast(t('ach_tf_locked')); FX.nudge(tf); return; }
        cv.tf = v; st().tf = v; cv.hover = -1; FZ.bars = 0; FZ.off = 0;
        candleCache.key = ''; chartDrawAt = 0;
        syncTfs(); saveState(false);
        return;
      }
      var ct = e.target.closest('#fc-ctype button');
      if (ct) {
        S.chartType = ct.getAttribute('data-ctype') === 'line' ? 'line' : 'candle';
        syncCtype();
        if (typeof syncChartType === 'function') syncChartType();
        saveState(false); chartDrawAt = 0;
        return;
      }
      var dt = e.target.closest('#fc-tabs .fdtab');
      if (dt) { setDeskTab(dt.getAttribute('data-ftab')); return; }
      onPosClick(e);
    });
    attachSheetDrag(el('fchart'), document.querySelector('#fchart .cs-top'), function () { if (cv) closeChart(); });
    var canvas = el('fc-chart');
    fzUI = Chart.zoomUI(canvas, {
      view: FZ, gestures: true,
      getBars: function () { return cv ? fzBars() : 60; },
      setBars: function (n) { if (!cv) return; FZ.bars = n; FZ.bars = fzBars(); candleCache.key = ''; cv.hover = -1; },
      redraw: function () { chartDrawAt = 0; },
      label: { auto: function () { return t('cz_auto'); }, zin: function () { return t('cz_in'); }, zout: function () { return t('cz_out'); } }
    });
    function hover(e) {
      if (!cv) return;
      cv.hover = Chart.hitTest(canvas, e.clientX);
      var r = canvas.getBoundingClientRect();
      cv.hoverY = e.clientY - r.top;
      chartDrawAt = 0;
    }
    /* Жесты как в концепте и на споте: горизонтальный свайп листает
       историю, зажатие (~320 мс) включает перекрестие, мышь — наведение. */
    var drag = null, lpT = 0, nPtr = 0;
    function barPx() {
      var w = canvas.getBoundingClientRect().width || 300;
      return Math.max(2, (w - 60) / Math.max(1, fzBars()));
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (!cv) return;
      nPtr++;
      if (nPtr > 1) { clearTimeout(lpT); drag = null; return; }
      drag = { x: e.clientX, y: e.clientY, off: FZ.off, moved: false, cross: false, mouse: e.pointerType === 'mouse' };
      if (drag.mouse) { hover(e); return; }
      clearTimeout(lpT);
      lpT = setTimeout(function () {
        if (!drag || drag.moved) return;
        drag.cross = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* старые браузеры */ }
        hover({ clientX: drag.x, clientY: drag.y });
        FX.vibrate(8);
      }, 320);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!cv) return;
      if (!drag) { if (e.pointerType === 'mouse') hover(e); return; }
      if (drag.cross) { hover(e); return; }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true; clearTimeout(lpT); cv.hover = -1;
        try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* старые браузеры */ }
      }
      if (drag.moved) setOff(drag.off + dx / barPx());
      else if (drag.mouse && e.buttons) hover(e);
    });
    function ptrUp(e) {
      nPtr = Math.max(0, nPtr - 1);
      clearTimeout(lpT);
      var d = drag; drag = null;
      if (!d || e.pointerType === 'mouse') return;
      if (d.cross) setTimeout(function () { if (cv && !drag) { cv.hover = -1; chartDrawAt = 0; } }, 1400);
    }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', function (e) { ptrUp(e); if (cv) { cv.hover = -1; chartDrawAt = 0; } });
    canvas.addEventListener('pointerleave', function (e) { if (cv && e.pointerType === 'mouse' && !drag) { cv.hover = -1; chartDrawAt = 0; } });
    el('fc-live').addEventListener('click', function () {
      if (!cv) return;
      var o0 = FZ.off, t0 = performance.now();
      (function step(tn) {
        var k = Math.min(1, ((tn || performance.now()) - t0) / 420);
        if (cv) setOff(o0 * (1 - (1 - Math.pow(1 - k, 3))));
        if (k < 1 && cv) requestAnimationFrame(step);
      })();
    });
    window.addEventListener('resize', function () { if (cv) { moveInk(true); chartDrawAt = 0; } });

    /* Портфель */
    var pfCard = el('pf-fut-card');
    if (pfCard) pfCard.addEventListener('click', function (e) {
      if (e.target.closest('#pf-fut-go')) { goFutures(); return; }
      onPosClick(e);
    });
    function onPosClick(e) {
      var card = e.target.closest('.fut-pos');
      if (!card) return;
      var p = findPos(+card.getAttribute('data-pid'));
      if (!p) return;
      var act = e.target.closest('[data-act]');
      if (act && act.getAttribute('data-act') === 'close') { quickClose(p, act); return; }
      openPosSheet(p.id);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.classList && e.target.classList.contains('fut-pos') ? e.target : null;
      if (card) { e.preventDefault(); openPosSheet(+card.getAttribute('data-pid')); }
    });

    /* Шит ордера */
    el('modal-fut').addEventListener('click', function (e) {
      if (e.target.closest('[data-fclose]')) { closeOrder(); return; }
      if (!sh) return;
      var sb = e.target.closest('#fs-side button');
      if (sb) {
        var side = sb.getAttribute('data-side');
        if (side !== sh.side) { sh.side = side; applySide(true); updateOrder(now()); chartDrawAt = 0; }
        return;
      }
      var tk = e.target.closest('#fs-lev-ticks button');
      if (tk) { setLev(+tk.getAttribute('data-lev'), true); return; }
      var pc = e.target.closest('#fs-pcts button');
      if (pc) {
        sh.pct = +pc.getAttribute('data-pct');
        sh.margin = floor2(maxMargin(sh.lev) * sh.pct / 100);
        el('fs-amt').value = amtTxt(sh.margin);
        refreshPcts(); updateOrder(now());
        return;
      }
      if (e.target.closest('#fs-max')) {
        sh.pct = 100; sh.margin = maxMargin(sh.lev);
        el('fs-amt').value = amtTxt(sh.margin);
        refreshPcts(); updateOrder(now());
        return;
      }
      var tpc = e.target.closest('#fs-tp button, #fs-sl button');
      if (tpc && !tpc.disabled) {
        var v = +tpc.getAttribute('data-v');
        if (tpc.parentNode.id === 'fs-tp') sh.tp = v; else sh.sl = v;
        FX.vibrate(5);
        updateOrder(now()); chartDrawAt = 0;
        return;
      }
      var cf = e.target.closest('#fs-confirm');
      if (cf) {
        if (e.clientX) FX.ripple(cf, e.clientX, e.clientY);
        openPosition(cf);
      }
    });
    el('fs-lev-range').addEventListener('input', function () { if (sh) setLev(+this.value); });
    el('fs-amt').addEventListener('input', function () {
      if (!sh) return;
      sh.margin = parseAmt(this.value);
      sh.pct = 0;
      refreshPcts();
      updateOrder(now());
    });

    /* Шит позиции */
    el('modal-fpos').addEventListener('click', function (e) {
      if (e.target.closest('[data-pclose]')) { closePosSheet(); return; }
      var p = pm && findPos(pm.id);
      if (!p) return;
      var chip = e.target.closest('.fs-chips button');
      if (chip && !chip.disabled) {
        var v = +chip.getAttribute('data-v'), kind = chip.parentNode.getAttribute('data-k');
        if (kind === 'tp' || kind === 'sl') { setPosTpSl(p, kind, v); return; }
        if (kind === 'add') { pm.add = v; FX.vibrate(5); updatePosSheet(now()); return; }
        if (kind === 'close') { pm.close = v; pm.confirm = 0; FX.vibrate(5); updatePosSheet(now()); return; }
      }
      var act = e.target.closest('[data-pact]');
      if (!act || act.disabled) return;
      if (act.getAttribute('data-pact') === 'add') addMargin(p, floor2(cash() * pm.add / 100), act);
      else {
        /* Закрытие — вторым нажатием в течение 3 с, как на карточке позиции. */
        if (!pm.confirm || Date.now() - pm.confirm > 3000) { pm.confirm = Date.now(); FX.vibrate(8); updatePosSheet(now()); return; }
        pm.confirm = 0;
        if (e.clientX) FX.ripple(act, e.clientX, e.clientY);
        finishClose(p, pm.close / 100, 'close', exitPx(assetById(p.a), p, now()), act);
      }
    });
  }

  /* ------------------------------ Цикл ------------------------------ */

  function tick(ts) {
    var f = st();
    if (f.pos.length) {
      applyFunding(ts, false);
      checkPositions(ts);
    } else if (slotOf(ts) > f.fundSlot) {
      f.fundSlot = slotOf(ts);
    }
    updateBadge();
    if (visible()) updateView(ts);
    if (cv) {
      if (!modalOpen('modal-fchart')) cv = null;
      else {
        try { if (typeof refreshMarketMeta === 'function') refreshMarketMeta(cv.a); } catch (e) { dbg('fut:meta', e); }
        renderDesk(false);
      }
    }
    if (sh && modalOpen('modal-fut')) updateOrder(ts);
    if (pm) {
      if (!modalOpen('modal-fpos')) pm = null;
      else updatePosSheet(ts);
    }
    if (xf && !modalOpen('modal-xfer')) xf = null;
    else if (xf) renderXfer(false);
    if (currentTab === 'portfolio') renderPortfolio(false);
    updatePosCards(ts);
  }

  /* renderTab / setLang: пересобрать видимое на текущем языке. */
  function render() {
    sigs = {};
    if (active()) renderView();
    renderPortfolio(true);
    if (cv && modalOpen('modal-fchart')) {
      setText(el('fc-sub'), t('fut_perp_sub', { name: assetName(cv.a) }));
      var ml = maxLev(cv.a);
      setText(el('fc-long-sub'), t('fut_up_to', { x: ml }));
      setText(el('fc-short-sub'), t('fut_up_to', { x: ml }));
      updateChartHead(now());
      renderDesk(true);
      moveInk(true);
    }
    if (sh && modalOpen('modal-fut')) {
      setText(el('fs-sub'), t('fut_perp_sub', { name: assetName(sh.a) }));
      applyLev(false);
      updateOrder(now());
    }
    if (pm && modalOpen('modal-fpos')) buildPosSheet();
    if (sp && modalOpen('modal-fsort')) openSort();
    if (xf && modalOpen('modal-xfer')) renderXfer(true);
  }

  try { mount(); } catch (e) { dbg('fut:mount', e); }

  return {
    active: active,
    render: render,
    tick: tick,
    equity: equity,
    cash: cash,
    sanitize: sanitize,
    afterLoad: afterLoad,
    renderPortfolio: function () { renderPortfolio(false); },
    setView: setView,
    openChart: openChart,
    openOrder: openOrder,
    openPosSheet: openPosSheet,
    openXfer: openXfer,
    maxLev: maxLev,
    refreshFavs: function () { renderList(false); },
    xferNow: xferNow,
    liqPrice: liqPrice,
    PERP_IDS: PERP_IDS
  };
})();
