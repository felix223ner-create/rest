/* Достижения TradeUp: реестр, события, очередь показа, награды.
   ОТКАТ: выставь ACH_ON = false (или убери тег script + верни бэкапы
   из .design-backup/pre-achievements/) — игра вернётся к версии без
   достижений: все вызовы Ach.* в main.js закрыты проверкой typeof.
   Файл грузится ДО main.js; чужие глобалы трогаем только внутри функций. */
'use strict';

var Ach = (function () {
  var ACH_ON = true;

  /* Очки за достижение. Раньше это был «тир», который ещё и красил
     карточку и печатался классом (Ритейл/Трейдер/Профи/Кит). Классы
     убраны: достижение говорит только то, что игрок получит, а цвет
     несёт ТИП награды, не «сословие». Таблица осталась как единственное
     место с цифрами очков — баланс не менялся. */
  var TIER_PTS = { 1: 5, 2: 15, 3: 40, 4: 100 };

  /* Очки → комиссия. Одна таблица на всю игру: feeRateFor(points) —
     единственное место с цифрами (TRADE_COMMISSION остался базовым 1%
     для нулевого порога). Ниже 0.50% не опускается. */
  var FEE_TIERS = [[0, 0.01], [100, 0.0095], [300, 0.0085], [600, 0.007], [1000, 0.005]];
  function feeRateFor(points) {
    var p = Number(points) || 0;
    var r = FEE_TIERS[0][1];
    for (var i = 0; i < FEE_TIERS.length; i++) {
      if (p >= FEE_TIERS[i][0]) r = FEE_TIERS[i][1];
    }
    return r;
  }
  function feeTierInfo(points) {
    var p = Number(points) || 0;
    var cur = FEE_TIERS[0][1], base = FEE_TIERS[0][0], next = null;
    for (var i = 0; i < FEE_TIERS.length; i++) {
      if (p >= FEE_TIERS[i][0]) { cur = FEE_TIERS[i][1]; base = FEE_TIERS[i][0]; }
      else if (!next) next = { pts: FEE_TIERS[i][0], rate: FEE_TIERS[i][1] };
    }
    return { cur: cur, base: base, next: next };
  }
  /* Скидка таблицы очков в долях от базы 1%: 0.01 → 0.0095 даёт 0.0005.
     Скидка колеса сюда не входит — это только перк очков для строки. */
  function feeDiscount() {
    var pts = 0;
    try { pts = (typeof S !== 'undefined') ? (Number(S.achPts) || 0) : 0; } catch (e) { dbg('ach:feeDiscount', e); }
    return Math.max(0, FEE_TIERS[0][1] - feeRateFor(pts));
  }

  /* Ранги коллекционера: порог очков → перки. Лимиты слотов и набор
     читаются ТОЛЬКО отсюда (rankPerks), а не из констант по месту.
     Слотов уведомлений больше нет — ставить их можно без ограничений. */
  var RANKS = [
    { pts: 100, id: 'retail', limits: 3 },
    { pts: 250, id: 'trader', limits: 5 },
    { pts: 450, id: 'analyst', limits: 5, stats: true },
    { pts: 700, id: 'pro', limits: 8, stats: true, accent: true },
    { pts: 1000, id: 'manager', limits: 8, stats: true, accent: true, tfs: true },
    { pts: 1280, id: 'whale', limits: 8, stats: true, accent: true, tfs: true }
  ];
  var BASE_LIMITS = 3;
  function rankFor(points) {
    var p = Number(points) || 0;
    var r = null;
    for (var i = 0; i < RANKS.length; i++) {
      if (p >= RANKS[i].pts) r = RANKS[i];
    }
    return r;
  }
  function rankPerks() {
    if (typeof S === 'undefined') {
      return { rank: null, limits: BASE_LIMITS,
        stats: false, accent: false, tfs: false };
    }
    var r = rankFor(Number(S.achPts) || 0);
    return {
      rank: r,
      limits: r ? r.limits : BASE_LIMITS,
      stats: !!(r && r.stats),
      accent: !!(r && r.accent),
      tfs: !!(r && r.tfs)
    };
  }

  /* Каталог предметов. src: {ach:'id'} — за достижение, {rank:'id'} —
     за ранг (доступность считается живьём, в инвентарь не пишется).
     type: title | frame | candles | theme | accent | flag | spins.

     КАЖДОЕ достижение даёт минимум один предмет: 44 записи реестра
     покрыты 57 предметами, «пустых» ачивок нет. Проверка —
     tools/_items_audit.js (падает, если у достижения нет предмета).
     Новые предметы (10 рамок, 12 титулов, 7 свечей, 3 темы) пришли из
     референса v6; accent_neo и flag_lang оставлены — они уже могли
     быть у игроков, удаление сломало бы сейвы. */
  var ITEMS = {
    title_sniper: { type: 'title', src: { ach: 'winrate_60' } },
    title_steel: { type: 'title', src: { ach: 'dd_30' } },
    title_phoenix: { type: 'title', src: { ach: 'comeback_80' } },
    title_resident: { type: 'title', src: { ach: 'streak_30' } },
    title_millionaire: { type: 'title', src: { ach: 'cap_1m' } },
    title_sponsor: { type: 'title', src: { ach: 'fees_100' } },
    title_whale: { type: 'title', src: { rank: 'whale' } },
    title_watcher: { type: 'title', src: { ach: 'first_alert' } },
    title_collector: { type: 'title', src: { ach: 'fav_five' } },
    title_polyglot: { type: 'title', src: { ach: 'second_lang' } },
    title_rookie: { type: 'title', src: { ach: 'wins_10' } },
    title_veteran: { type: 'title', src: { ach: 'wins_50' } },
    title_champion: { type: 'title', src: { ach: 'wins_200' } },
    title_editor: { type: 'title', src: { ach: 'cancels_10' } },
    title_peak: { type: 'title', src: { ach: 'top_sell' } },
    title_hunter: { type: 'title', src: { ach: 'bottom_buy' } },
    title_patient: { type: 'title', src: { ach: 'hold_24h' } },
    title_allin: { type: 'title', src: { ach: 'allin' } },
    title_double: { type: 'title', src: { ach: 'double_up' } },
    frame_steel: { type: 'frame', src: { ach: 'vol_10m' } },
    frame_titan: { type: 'frame', src: { ach: 'cap_x10' } },
    frame_amber: { type: 'frame', src: { ach: 'streak_30' } },
    frame_phoenix: { type: 'frame', src: { ach: 'comeback_80' } },
    frame_coin: { type: 'frame', src: { ach: 'cap_1m' } },
    frame_bronze: { type: 'frame', src: { rank: 'retail' } },
    frame_silver: { type: 'frame', src: { rank: 'trader' } },
    frame_sapphire: { type: 'frame', src: { rank: 'analyst' } },
    frame_amethyst: { type: 'frame', src: { rank: 'pro' } },
    frame_emerald: { type: 'frame', src: { rank: 'manager' } },
    /* У frame_kit было поле anim: true — никем не читалось (анимацию
       кольца задаёт CSS .fr-kit::after). Убрано в AUDIT-2026-09-16. */
    frame_kit: { type: 'frame', src: { rank: 'whale' } },
    frame_paper: { type: 'frame', src: { ach: 'first_trade' } },
    frame_ticket: { type: 'frame', src: { ach: 'first_limit' } },
    frame_wheel: { type: 'frame', src: { ach: 'first_spin' } },
    frame_copper: { type: 'frame', src: { ach: 'vol_10k' } },
    frame_brass: { type: 'frame', src: { ach: 'vol_100k' } },
    frame_mosaic: { type: 'frame', src: { ach: 'assets_5' } },
    frame_ember: { type: 'frame', src: { ach: 'streak_7' } },
    frame_sector: { type: 'frame', src: { ach: 'sectors_4' } },
    frame_console: { type: 'frame', src: { ach: 'limit_alert_combo' } },
    frame_zero: { type: 'frame', src: { ach: 'zero_pnl' } },
    candles_neon: { type: 'candles', src: { ach: 'vol_1m' } },
    candles_gold: { type: 'candles', src: { ach: 'cap_1m' } },
    candles_minimal: { type: 'candles', src: { ach: 'cap_x5' } },
    candles_thin: { type: 'candles', src: { ach: 'quick_flip' } },
    candles_sprout: { type: 'candles', src: { ach: 'first_profit' } },
    candles_scarlet: { type: 'candles', src: { ach: 'first_loss' } },
    candles_glass: { type: 'candles', src: { ach: 'cap_x2' } },
    candles_streak: { type: 'candles', src: { ach: 'win_streak_5' } },
    candles_crash: { type: 'candles', src: { ach: 'flash_crash' } },
    candles_dusk: { type: 'candles', src: { ach: 'dip_buy' } },
    candles_blitz: { type: 'candles', src: { ach: 'flip_3s' } },
    theme_midnight: { type: 'theme', src: { ach: 'nights_5' } },
    theme_dawn: { type: 'theme', src: { ach: 'limit_offline' } },
    theme_carbon: { type: 'theme', src: { ach: 'themes_10' } },
    theme_ash: { type: 'theme', src: { ach: 'broke_zero' } },
    accent_neo: { type: 'accent', src: { ach: 'themes_10' } },
    flag_lang: { type: 'flag', src: { ach: 'second_lang' } },
    /* Награды пропуска трейдера (js/quests.js): src.pass — уровень,
       prem — премиум-дорожка. Владение — по журналу S.items: предмет
       пишется туда, когда игрок забирает награду уровня. */
    frame_bp_pulse: { type: 'frame', src: { pass: 20 } },
    title_bp_regular: { type: 'title', src: { pass: 50 } },
    frame_bp_bronze: { type: 'frame', src: { pass: 100 } },
    candles_bp_ink: { type: 'candles', src: { pass: 150 } },
    title_bp_silver: { type: 'title', src: { pass: 200 } },
    frame_bp_gold: { type: 'frame', src: { pass: 250 } },
    title_bp_marathon: { type: 'title', src: { pass: 300 } },
    candles_bp_mint: { type: 'candles', src: { pass: 350 } },
    frame_bp_platinum: { type: 'frame', src: { pass: 400 } },
    title_bp_500: { type: 'title', src: { pass: 500 } },
    frame_bp_neon: { type: 'frame', src: { pass: 10, prem: true } },
    title_bp_bull: { type: 'title', src: { pass: 25, prem: true } },
    candles_bp_laser: { type: 'candles', src: { pass: 40, prem: true } },
    theme_malachite: { type: 'theme', src: { pass: 50, prem: true } },
    frame_bp_plasma: { type: 'frame', src: { pass: 75, prem: true } },
    title_bp_shark: { type: 'title', src: { pass: 100, prem: true } },
    frame_bp_prism: { type: 'frame', src: { pass: 120, prem: true } },
    candles_bp_candy: { type: 'candles', src: { pass: 140, prem: true } },
    theme_bordeaux: { type: 'theme', src: { pass: 150, prem: true } },
    frame_bp_flame: { type: 'frame', src: { pass: 175, prem: true } },
    title_bp_oracle: { type: 'title', src: { pass: 200, prem: true } },
    frame_bp_frost: { type: 'frame', src: { pass: 220, prem: true } },
    candles_bp_ice: { type: 'candles', src: { pass: 240, prem: true } },
    theme_abyss: { type: 'theme', src: { pass: 250, prem: true } },
    frame_bp_orbit: { type: 'frame', src: { pass: 275, prem: true } },
    title_bp_tycoon: { type: 'title', src: { pass: 300, prem: true } },
    frame_bp_galaxy: { type: 'frame', src: { pass: 320, prem: true } },
    candles_bp_lava: { type: 'candles', src: { pass: 340, prem: true } },
    theme_sakura: { type: 'theme', src: { pass: 350, prem: true } },
    frame_bp_storm: { type: 'frame', src: { pass: 375, prem: true } },
    title_bp_icon: { type: 'title', src: { pass: 400, prem: true } },
    frame_bp_crown: { type: 'frame', src: { pass: 420, prem: true } },
    candles_bp_royal: { type: 'candles', src: { pass: 440, prem: true } },
    frame_bp_diamond: { type: 'frame', src: { pass: 460, prem: true } },
    title_bp_legend: { type: 'title', src: { pass: 480, prem: true } },
    theme_aurum: { type: 'theme', src: { pass: 500, prem: true } }
  };

  /* Тип предмета → иконка и слово для чипа награды («Рамка «Сталь»»).
     Цвет чипа задаёт КЛАСС награды (pts/spin/item), а не тип предмета:
     три цвета на всю систему, чтобы список не превращался в радугу. */
  var ITEM_KIND = {
    frame:   { ico: 'frame',   word: 'ach_kind_frame' },
    title:   { ico: 'title',   word: 'ach_kind_title' },
    candles: { ico: 'candles', word: 'ach_kind_candles' },
    theme:   { ico: 'theme',   word: 'ach_kind_theme' },
    accent:  { ico: 'accent',  word: 'ach_kind_accent' },
    flag:    { ico: 'flag',    word: 'ach_kind_flag' }
  };

  /* Сколько чипов показываем на карточке до «ещё N». Три — предел, при
     котором строка чипов не переносится на вторую строку на узком экране
     (замер: 360px, три чипа + счётчик влезают, четыре уже нет). */
  var CHIP_MAX = 3;

  /* Стили свечей для chart.js (рендер по референсу «Trade sheet — свечи»):
     up/down — цвета, bodyK — ширина тела относительно стандартной, glow —
     свечение в px, radius — скругление тела, wick/wickA — толщина и альфа
     фитиля, grad — сила вертикального градиента тела (0..1), hollow —
     полое тело (контуром), sheen — блик на левом крае тела.
     Параметры сведены с демо-референсом: «Стандарт» — чистая форма с
     мягким градиентом (обработка живёт в chart.js для безскиновых свечей),
     «Неон» — кислотный контур с сильным свечением, «Золото» — литое тело
     с блеском и тёмной бронзой на падении, «Минимал» — полый контур,
     «Тонкие» — почти линии. */
  var CANDLE_SKINS = {
    std: null,
    neon: { up: '#00ffa3', down: '#ff4d6d', bodyK: 0.8, glow: 14, radius: 3, wick: 1.7, wickA: 0.95, grad: 0.3 },
    gold: { up: '#e9b640', down: '#6b6250', bodyK: 0.82, glow: 6, radius: 4, wick: 1.6, wickA: 0.8, grad: 0.5, sheen: true },
    minimal: { up: '#8b93a1', down: '#565d6b', bodyK: 0.5, glow: false, radius: 2, wick: 1.2, wickA: 0.6, hollow: true },
    /* up/down = null — берутся цвета темы, как у стандартных. Золотые
       тонкие путались с «Золотом»: отличать их надо формой (узкое тело),
       а не цветом. */
    thin: { up: null, down: null, bodyK: 0.16, glow: false, radius: 2, wick: 1, wickA: 0.5, grad: 0.1 },
    /* --- Скины из референса v6. ---
       ВАЖНО: этот объект — не только палитра, но и БЕЛЫЙ СПИСОК.
       ensureInv() сбрасывает S.equip.candles на 'std', если скина тут
       нет, поэтому скин, забытый здесь, невозможно надеть: тап в
       витрине выглядит рабочим, а на следующем ensureInv() свечи молча
       возвращаются к стандартным. Ровно это и случилось с семью новыми
       скинами. Добавляешь предмет candles_<id> — добавь и запись здесь. */
    sprout: { up: null, down: null, bodyK: 0.7, glow: false, radius: 3, wick: 1.6, wickA: 0.85, grad: 0.45 },
    scarlet: { up: null, down: null, bodyK: 0.7, glow: false, radius: 3, wick: 1.6, wickA: 0.85, grad: 0.45 },
    glass: { up: '#8fd3ff', down: '#6aa8d8', bodyK: 0.8, glow: false, radius: 3, wick: 1.4, wickA: 0.7, grad: 0.12, hollow: true },
    streak: { up: '#2fbe6e', down: '#1f9d5b', bodyK: 0.85, glow: 10, radius: 3, wick: 1.6, wickA: 0.9, grad: 0.45 },
    crash: { up: '#ff4d4d', down: '#b33030', bodyK: 0.85, glow: 12, radius: 3, wick: 1.6, wickA: 0.9, grad: 0.4 },
    dusk: { up: '#9b7bff', down: '#4a5a8f', bodyK: 0.8, glow: 6, radius: 3, wick: 1.5, wickA: 0.85, grad: 0.3 },
    blitz: { up: '#ffd166', down: '#c9a04e', bodyK: 0.34, glow: 8, radius: 2, wick: 1, wickA: 0.6, grad: 0.5 },
    /* Свечи пропуска трейдера. */
    bp_ink: { up: '#e6e8ec', down: '#5a5f69', bodyK: 0.6, glow: false, radius: 1, wick: 1.2, wickA: 0.7, grad: 0.1 },
    bp_mint: { up: '#5ff0b0', down: '#ff9f7a', bodyK: 0.7, glow: 4, radius: 3, wick: 1.4, wickA: 0.8, grad: 0.35 },
    bp_laser: { up: '#3df2ff', down: '#ff3df2', bodyK: 0.3, glow: 12, radius: 2, wick: 1.2, wickA: 0.9, grad: 0.2 },
    bp_candy: { up: '#7ef2c4', down: '#ff8fb8', bodyK: 0.82, glow: 6, radius: 5, wick: 1.6, wickA: 0.8, grad: 0.55, sheen: true },
    bp_ice: { up: '#bfe9ff', down: '#5f8fb8', bodyK: 0.78, glow: 8, radius: 3, wick: 1.3, wickA: 0.7, grad: 0.3, hollow: true },
    bp_lava: { up: '#ffb13b', down: '#ff3b1f', bodyK: 0.86, glow: 14, radius: 3, wick: 1.7, wickA: 0.95, grad: 0.6 },
    bp_royal: { up: '#f7d879', down: '#9b5de5', bodyK: 0.82, glow: 8, radius: 4, wick: 1.6, wickA: 0.85, grad: 0.5, sheen: true }
  };
  var ACCENTS = {
    gold: '#e9b640', ocean: '#4da3ff', violet: '#b678f0',
    mint: '#2fbe6e', neo: '#ff5fa2'
  };

  /* Иконки 48x48, штрих 2px: currentColor + акцент тира через
     класс .acc (красится из CSS цветом тира карточки). Без эмодзи. */
  function ic(paths) {
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true">' + paths + '</svg>';
  }
  var P = {
    flag: '<path d="M12 42V8"/><path d="M12 10c5-3 9 3 14 0s8-2 10-1v12c-2-1-5-2-10 1s-9-3-14 0"/>',
    down: '<path d="M6 18l7 7 5-5 12 12"/><path d="M24 32h6v-6"/>',
    up: '<path d="M6 30l7-7 5 5 12-12"/><path d="M24 16h6v6"/>',
    tag: '<path d="M10 10h12l14 14-12 12L10 22z"/><circle cx="17" cy="17" r="2"/>',
    moon: '<path d="M32 28A12 12 0 1 1 20 8a9.5 9.5 0 0 0 12 20z"/>',
    bell: '<path d="M14 32h20l-2-7a8 8 0 1 0-16 0z"/><path d="M20 36a4 4 0 0 0 8 0"/>',
    star: '<path d="M24 8l4.5 9.5L39 19l-7.5 7 2 10.5-9.5-5-9.5 5 2-10.5L9 19l10.5-1.5z"/>',
    wheel: '<circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="3"/><path d="M24 9v6M24 33v6M9 24h6M33 24h6"/>',
    coins: '<ellipse cx="24" cy="14" rx="10" ry="4"/><path d="M14 14v10c0 2.2 4.5 4 10 4s10-1.8 10-4V14"/><path d="M14 24c0 2.2 4.5 4 10 4s10-1.8 10-4"/>',
    bank: '<path d="M8 18l16-9 16 9"/><path d="M11 18v14M19 18v14M29 18v14M37 18v14"/><path d="M8 36h32"/>',
    medal: '<circle cx="24" cy="28" r="9"/><path d="M24 24l1.2 2.6 2.8.3-2 2 .5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-2 2.8-.3z"/><path d="M18 20L12 8M30 20l6-12"/>',
    pct: '<path d="M36 12L12 36"/><circle cx="17" cy="17" r="4"/><circle cx="31" cy="31" r="4"/>',
    grid: '<rect x="10" y="10" width="12" height="12" rx="2"/><rect x="26" y="10" width="12" height="12" rx="2"/><rect x="10" y="26" width="12" height="12" rx="2"/><rect x="26" y="26" width="12" height="12" rx="2"/>',
    flame: '<path d="M24 40c-6 0-10-4-10-9 0-4 2-7 4-10 1 2 2 3 4 3-.5-4 1-9 5-12-.5 5 7 8 7 16 0 7-4 12-10 12z"/>',
    swap: '<path d="M10 18h24l-6-6M38 30H14l6 6"/>',
    target: '<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2"/>',
    shield: '<path d="M24 6l12 5v9c0 8-5 13-12 16-7-3-12-8-12-16v-9z"/><path d="M18 24l4 4 8-9"/>',
    bolt: '<path d="M26 6L12 27h9l-1 15 14-21h-9z"/>',
    gem: '<path d="M14 10h20l6 8-16 20L8 18z"/><path d="M8 18h32M24 38L19 18l5-8 5 8z"/>',
    link: '<path d="M20 28a6 6 0 0 0 8 0l6-6a6 6 0 0 0-8-8l-3 3"/><path d="M28 20a6 6 0 0 0-8 0l-6 6a6 6 0 0 0 8 8l3-3"/>',
    vault: '<rect x="8" y="12" width="32" height="24" rx="3"/><circle cx="24" cy="24" r="6"/><path d="M24 18v-3M24 33v-3M18 24h-3M33 24h-3"/>',
    pie: '<path d="M24 24V8a16 16 0 0 1 14 22z"/><circle cx="24" cy="24" r="16"/>',
    combo: '<path d="M10 34l4-12 8 3-2 9z"/><path d="M30 12a7 7 0 1 1 4 12"/><path d="M30 34a3 3 0 0 0 6 0"/>',
    rise: '<path d="M8 34c6 0 6-8 12-8s5 6 10 6 6-10 10-10"/><path d="M32 14h8v8"/>',
    crown: '<path d="M10 34l-2-16 9 6 7-11 7 11 9-6-2 16z"/><path d="M10 39h28"/>',
    dip: '<circle cx="24" cy="24" r="15"/><path d="M24 15v12l-6-4M24 27l6-7"/>',
    x2: '<path d="M15 15l12 18M27 15L15 33"/><circle cx="33" cy="33" r="6"/><path d="M31 33h4M33 31v4"/>',
    timer: '<circle cx="24" cy="26" r="13"/><path d="M24 20v7l5 3M20 6h8"/>',
    receipt: '<path d="M14 6h20v36l-4-3-3 3-3-3-3 3-4-3z"/><path d="M19 16h10M19 22h10"/>',
    xcirc: '<circle cx="24" cy="24" r="14"/><path d="M18 18l12 12M30 18L18 30"/>',
    night: '<path d="M30 26A11 11 0 1 1 19 9a8.5 8.5 0 0 0 11 17z"/><path class="acc" d="M35 10l.8 2.2L38 13l-2.2.8L35 16l-.8-2.2L32 13l2.2-.8z"/>',
    theme: '<circle cx="24" cy="24" r="6"/><path d="M24 24V8a16 16 0 0 1 0 32z"/><path d="M24 8V4M24 44v-4M8 24H4M44 24h-4"/>',
    /* Иконки ТИПОВ наград (чипы на карточке и строки в модалке).
       Раньше их не было — тип читался по цвету тира. */
    frame: '<rect x="9" y="9" width="30" height="30" rx="7"/><rect x="17" y="17" width="14" height="14" rx="4"/>',
    title: '<path d="M9 15h30"/><path d="M15 24h18"/><path d="M12 33h24"/>',
    candles: '<path d="M16 7v34M32 7v34"/><rect x="11" y="16" width="10" height="16" rx="2"/><rect x="27" y="11" width="10" height="14" rx="2"/>',
    accent: '<circle cx="24" cy="24" r="14"/><path d="M24 10a14 14 0 0 0 0 28z" fill="currentColor" stroke="none"/>',
    zero: '<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="4"/>',
    broke: '<path d="M24 9a15 15 0 0 1 13 20H11A15 15 0 0 1 24 9z"/><path d="M20 29l-3 11M28 29l3 11M14 40h20"/>',
    globe: '<circle cx="24" cy="24" r="14"/><path d="M10 24h28M24 10c-5 5-5 23 0 28 5-5 5-23 0-28z"/>',
    lock: '<rect x="13" y="21" width="22" height="15" rx="3"/><path d="M18 21v-5a6 6 0 0 1 12 0v5"/>',
    eye: '<path d="M6 24s6-9 18-9 18 9 18 9-6 9-18 9S6 24 6 24z"/><circle cx="24" cy="24" r="4"/>',
    bag: '<path d="M16 16h16l2 24H14z"/><path d="M20 16a4 4 0 0 1 8 0"/>'
  };
  function icon(name) { return ic(P[name] || P.star); }

  /* PNG-логотипы по темам (img/ach-dark/, img/ach-light/).
     Имена файлов одинаковые в обеих папках (как gift-/play-/spin-).
     Ключ — id достижения. */
  var ACH_IMG_DARK = 'img/ach-dark/';
  var ACH_IMG_LIGHT = 'img/ach-light/';
  var ACH_IMG = {
    first_trade: 'first-trade.png',
    first_loss: 'first-loss.png',
    first_profit: 'first-profit.png',
    first_limit: 'first-limit.png',
    limit_offline: 'limit-offline.png',
    first_alert: 'first-alert.png',
    fav_five: 'fav-five.png',
    first_spin: 'first-spin.png',
    vol_10k: 'vol-10k.png',
    vol_100k: 'vol-100k.png',
    vol_1m: 'vol-1m.png',
    vol_10m: 'vol-10m.png',
    cap_x2: 'cap-x2.png',
    cap_x5: 'cap-x5.png',
    cap_x10: 'cap-x10.png',
    wins_10: 'wins-10.png',
    wins_50: 'wins-50.png',
    wins_200: 'wins-200.png',
    winrate_60: 'winrate-60.png',
    assets_5: 'assets-5.png',
    streak_7: 'streak-7.png',
    streak_30: 'streak-30.png',
    top_sell: 'top-sell.png',
    bottom_buy: 'bottom-buy.png',
    dd_30: 'dd-30.png',
    quick_flip: 'quick-flip.png',
    hold_24h: 'hold-24h.png',
    win_streak_5: 'win-streak-5.png',
    allin: 'allin.png',
    flash_crash: 'flash-crash.png',
    sectors_4: 'sectors-4.png',
    limit_alert_combo: 'limit-alert-combo.png',
    comeback_80: 'comeback-80.png',
    cap_1m: 'cap-1m.png',
    dip_buy: 'dip-buy.png',
    double_up: 'double-up.png',
    flip_3s: 'flip-3s.png',
    fees_100: 'fees-100.png',
    cancels_10: 'cancels-10.png',
    nights_5: 'nights-5.png',
    themes_10: 'themes-10.png',
    zero_pnl: 'zero-pnl.png',
    broke_zero: 'broke-zero.png',
    second_lang: 'second-lang.png'
  };
  function darkIcons() {
    try {
      return document.documentElement.getAttribute('data-theme') !== 'light';
    } catch (e) { return true; }
  }
  /* Путь к логотипам по текущей теме: 'midnight' своих вырезок не имеет —
     берём тёмные (как gift/play/spin в applyTheme). */
  function achImgPath() {
    return darkIcons() ? ACH_IMG_DARK : ACH_IMG_LIGHT;
  }
  /* Скрытые неоткрытые — всегда замок SVG, без спойлера картинкой.
     PNG кладём поверх SVG-фолбэка: если файл не загрузился, img
     удаляет себя и остаётся штатная иконка, а не дырка. Логотипы
     с прозрачным фоном — поэтому у img непрозрачная подложка в цвет
     контейнера, иначе сквозь них светится тировый SVG-призрак.
     Позиции — инлайном, чтобы вёрстка не зависела от свежести CSS. */
  function achIconHtml(a, unlocked) {
    if (a.hidden && !unlocked) return icon('lock');
    if (ACH_IMG[a.id]) {
      var fb = icon(a.icon).replace('<svg ',
        '<svg style="position:absolute;left:0;top:0;right:0;bottom:0;margin:auto;width:68%;height:68%" ');
      return '<span class="ach-imgfb" style="position:relative;display:block;width:100%;height:100%" aria-hidden="true">' +
        fb +
        '<img src="' + achImgPath() + ACH_IMG[a.id] + '" alt="" width="56" height="56" ' +
        'loading="lazy" decoding="async" draggable="false" aria-hidden="true" ' +
        'style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;background:var(--card2)" ' +
        'onerror="this.remove()"></span>';
    }
    return icon(a.icon);
  }

  /* ---------- Реестр: 44 записи. test(s, e) — чистое условие,
     progress(s) — {cur, goal, fmt} для полоски (null = событие с датой).
     fmt: 'money' | 'num' | 'pct'. ---------- */
  var REG = [
    /* Путь: 8 обучающих, тир 1 */
    { id: 'first_trade', tier: 1, cat: 'path', icon: 'flag', on: ['trade:open'],
      test: function (s) { return s.tradesTotal >= 1; } },
    { id: 'first_loss', tier: 1, cat: 'path', icon: 'down', on: ['trade:close'],
      test: function (s, e) { return e.pnl < 0; } },
    { id: 'first_profit', tier: 1, cat: 'path', icon: 'up', on: ['trade:close'],
      test: function (s, e) { return e.pnl > 0; } },
    { id: 'first_limit', tier: 1, cat: 'path', icon: 'tag', on: ['limit:placed'],
      test: function () { return true; } },
    { id: 'limit_offline', tier: 1, cat: 'path', icon: 'moon', on: ['limit:filled'],
      test: function () { return typeof document !== 'undefined' && document.hidden === true; } },
    { id: 'first_alert', tier: 1, cat: 'path', icon: 'bell', on: ['alert:fired'],
      test: function () { return true; } },
    { id: 'fav_five', tier: 1, cat: 'path', icon: 'star', on: ['tick'],
      test: function (s, e, c) { return c.favs >= 5; },
      progress: function (s, e, c) { return { cur: Math.min(5, c.favs), goal: 5, fmt: 'num' }; } },
    { id: 'first_spin', tier: 1, cat: 'path', icon: 'wheel', on: ['spin'],
      test: function () { return true; } },
    /* Мастерство: 14 с прогресс-барами */
    { id: 'vol_10k', tier: 1, cat: 'skill', icon: 'coins', series: 'vol', level: 1, on: ['trade:open', 'trade:close'],
      test: function (s) { return s.volume >= 10000; },
      progress: function (s) { return { cur: s.volume, goal: 10000, fmt: 'money' }; } },
    { id: 'vol_100k', tier: 2, cat: 'skill', icon: 'coins', series: 'vol', level: 2, on: ['trade:open', 'trade:close'],
      test: function (s) { return s.volume >= 100000; },
      progress: function (s) { return { cur: s.volume, goal: 100000, fmt: 'money' }; } },
    { id: 'vol_1m', tier: 3, cat: 'skill', icon: 'coins', series: 'vol', level: 3, reward: { spins: 1 }, on: ['trade:open', 'trade:close'],
      test: function (s) { return s.volume >= 1000000; },
      progress: function (s) { return { cur: s.volume, goal: 1000000, fmt: 'money' }; } },
    { id: 'vol_10m', tier: 4, cat: 'skill', icon: 'coins', series: 'vol', level: 4, reward: { spins: 3 }, on: ['trade:open', 'trade:close'],
      test: function (s) { return s.volume >= 10000000; },
      progress: function (s) { return { cur: s.volume, goal: 10000000, fmt: 'money' }; } },
    { id: 'cap_x2', tier: 2, cat: 'skill', icon: 'bank', series: 'cap', level: 1, on: ['tick'],
      test: function (s, e, c) { return c.cap >= 2 * c.start; },
      progress: function (s, e, c) { return { cur: c.cap, goal: 2 * c.start, fmt: 'money' }; } },
    { id: 'cap_x5', tier: 3, cat: 'skill', icon: 'bank', series: 'cap', level: 2, reward: { spins: 1 }, on: ['tick'],
      test: function (s, e, c) { return c.cap >= 5 * c.start; },
      progress: function (s, e, c) { return { cur: c.cap, goal: 5 * c.start, fmt: 'money' }; } },
    { id: 'cap_x10', tier: 4, cat: 'skill', icon: 'bank', series: 'cap', level: 3, reward: { spins: 3 }, on: ['tick'],
      test: function (s, e, c) { return c.cap >= 10 * c.start; },
      progress: function (s, e, c) { return { cur: c.cap, goal: 10 * c.start, fmt: 'money' }; } },
    { id: 'wins_10', tier: 1, cat: 'skill', icon: 'medal', series: 'wins', level: 1, on: ['trade:close'],
      test: function () { return S.wins >= 10; },
      progress: function () { return { cur: Math.min(10, S.wins), goal: 10, fmt: 'num' }; } },
    { id: 'wins_50', tier: 2, cat: 'skill', icon: 'medal', series: 'wins', level: 2, on: ['trade:close'],
      test: function () { return S.wins >= 50; },
      progress: function () { return { cur: Math.min(50, S.wins), goal: 50, fmt: 'num' }; } },
    { id: 'wins_200', tier: 3, cat: 'skill', icon: 'medal', series: 'wins', level: 3, reward: { spins: 1 }, on: ['trade:close'],
      test: function () { return S.wins >= 200; },
      progress: function () { return { cur: Math.min(200, S.wins), goal: 200, fmt: 'num' }; } },
    { id: 'winrate_60', tier: 3, cat: 'skill', icon: 'pct', reward: { spins: 1 }, on: ['trade:close'],
      /* Порог по ПРОДАЖАМ, а не по всем сделкам: successRate() считает
         процент от закрытий (покупка не бывает выигрышем или проигрышем),
         и с tradesCount порог не совпадал с метрикой — 50 покупок и три
         продажи со 100% открывали достижение на выборке из трёх сделок. */
      test: function () {
        return S.sellsCount >= 50 && successRate() >= 0.6;
      },
      progress: function () {
        /* Пока закрытий меньше порога — показываем набор выборки, а не
           процент: иначе «70%» без достижения выглядит поломкой. */
        if ((Number(S.sellsCount) || 0) < 50) {
          return { cur: Math.min(50, Number(S.sellsCount) || 0), goal: 50, fmt: 'num' };
        }
        return { cur: Math.round(successRate() * 100), goal: 60, fmt: 'pct' };
      } },
    { id: 'assets_5', tier: 2, cat: 'skill', icon: 'grid', pos: true, on: ['tick'],
      test: function (s, e, c) { return c.assets >= 5; },
      progress: function (s, e, c) { return { cur: Math.min(5, c.assets), goal: 5, fmt: 'num' }; } },
    { id: 'streak_7', tier: 2, cat: 'skill', icon: 'flame', series: 'streak', level: 1, on: ['tick', 'app:open'],
      test: function () { return S.streak >= 7; },
      progress: function () { return { cur: Math.min(7, S.streak), goal: 7, fmt: 'num' }; } },
    { id: 'streak_30', tier: 4, cat: 'skill', icon: 'flame', series: 'streak', level: 2,
      reward: { spins: 3 }, on: ['tick', 'app:open'],
      test: function () { return S.streak >= 30; },
      progress: function () { return { cur: Math.min(30, S.streak), goal: 30, fmt: 'num' }; } },
    /* Хроники: 14 */
    { id: 'top_sell', tier: 2, cat: 'chronicle', icon: 'target', on: ['trade:close'],
      test: function (s, e) {
        if (e.side !== 'sell') return false;
        var hi = histHigh(e.assetId);
        return hi > 0 && e.price >= 0.99 * hi;
      } },
    { id: 'bottom_buy', tier: 2, cat: 'chronicle', icon: 'dip', on: ['trade:open'],
      test: function (s, e) {
        if (e.side !== 'buy') return false;
        var lo = histLow(e.assetId);
        return lo > 0 && e.price <= 1.01 * lo;
      } },
    { id: 'dd_30', tier: 3, cat: 'chronicle', icon: 'shield', reward: { spins: 1 }, on: ['trade:close'],
      test: function (s, e) { return e.pnl > 0 && !!s._dd30[e.assetId]; } },
    { id: 'quick_flip', tier: 2, cat: 'chronicle', icon: 'bolt', on: ['trade:close'],
      test: function (s, e) { return e.pnl > 0 && e.holdMs > 0 && e.holdMs < 10000; } },
    { id: 'hold_24h', tier: 3, cat: 'chronicle', icon: 'timer', reward: { spins: 1 }, on: ['trade:close'],
      test: function (s, e) { return e.holdMs > 24 * 3600 * 1000; } },
    { id: 'win_streak_5', tier: 2, cat: 'chronicle', icon: 'link', on: ['trade:close'],
      test: function (s) { return s.winStreak >= 5; },
      progress: function (s) { return { cur: Math.min(5, s.winStreak), goal: 5, fmt: 'num' }; } },
    { id: 'allin', tier: 3, cat: 'chronicle', icon: 'vault', reward: { spins: 1 }, on: ['trade:open'],
      test: function (s, e) {
        if (e.side !== 'buy') return false;
        return e.total >= 0.95 * (e.balanceBefore + e.total);
      } },
    { id: 'flash_crash', tier: 3, cat: 'chronicle', icon: 'bolt', reward: { spins: 1 }, on: ['trade:close'],
      test: function (s, e) { return e.pnl > 0 && !!s._f20[e.assetId] && !s._dd30[e.assetId]; } },
    { id: 'sectors_4', tier: 2, cat: 'chronicle', icon: 'pie', pos: true, on: ['tick'],
      test: function (s, e, c) { return c.sectors >= 4; },
      progress: function (s, e, c) { return { cur: Math.min(4, c.sectors), goal: 4, fmt: 'num' }; } },
    { id: 'limit_alert_combo', tier: 3, cat: 'chronicle', icon: 'combo', reward: { spins: 1 }, on: ['limit:filled', 'alert:fired'],
      test: function (s, e) {
        var now = Date.now();
        /* Комбо = ДВА РАЗНЫХ сигнала в пределах минуты. Сравниваем с
           предыдущим событием ДРУГОГО типа (prevFillAt / prevAlertAt),
           а не с текущим: lastFillAt выставляется перед emit('alert:fired')
           и lastAlertAt — перед emit('limit:filled'), поэтому старая
           проверка «now − lastX < 60000» была истинной всегда и комбо
           открывалось вместе с first_alert. Теперь нужны две
           уведомлённые лимитки подряд (или уведомление после недавней). */
        if (e.ev === 'limit:filled') return (now - (s.prevAlertAt || 0)) < 60000;
        return (now - (s.prevFillAt || 0)) < 60000;
      } },
    { id: 'comeback_80', tier: 4, cat: 'chronicle', icon: 'rise',
      reward: { spins: 3 }, on: ['tick'],
      test: function (s, e, c) { return !!s.broke80 && c.cap >= c.peak; } },
    { id: 'cap_1m', tier: 4, cat: 'chronicle', icon: 'crown',
      reward: { spins: 3 }, on: ['tick'],
      test: function (s, e, c) { return c.cap >= 1000000; },
      progress: function (s, e, c) { return { cur: c.cap, goal: 1000000, fmt: 'money' }; } },
    { id: 'dip_buy', tier: 2, cat: 'chronicle', icon: 'dip', on: ['trade:open'],
      test: function (s, e) {
        if (e.side !== 'buy') return false;
        var hi = histHigh(e.assetId);
        return hi > 0 && e.price <= 0.9 * hi;
      } },
    { id: 'double_up', tier: 3, cat: 'chronicle', icon: 'x2', on: ['trade:close'],
      test: function (s, e) {
        if (!(e.pnl > 0)) return false;
        var cost = (e.total - (e.fee || 0)) - e.pnl;
        return cost > 0 && e.pnl / cost >= 1;
      } },
    /* Скрытые: 8 */
    { id: 'flip_3s', tier: 2, cat: 'chronicle', icon: 'timer', hidden: true, on: ['trade:close'],
      test: function (s, e) { return e.closedOut && e.holdMs > 0 && e.holdMs < 3000; } },
    { id: 'fees_100', tier: 2, cat: 'skill', icon: 'receipt', hidden: true, on: ['trade:open', 'trade:close'],
      test: function (s) { return s.feesPaid >= 100; },
      progress: function (s) { return { cur: s.feesPaid, goal: 100, fmt: 'money' }; } },
    { id: 'cancels_10', tier: 1, cat: 'skill', icon: 'xcirc', hidden: true, on: ['limit:cancelled'],
      test: function (s) { return s.cancels >= 10; },
      progress: function (s) { return { cur: Math.min(10, s.cancels), goal: 10, fmt: 'num' }; } },
    { id: 'nights_5', tier: 3, cat: 'chronicle', icon: 'night', hidden: true, reward: { spins: 1 }, on: ['app:open'],
      test: function (s) { return s.sessionsNight >= 5; },
      progress: function (s) { return { cur: Math.min(5, s.sessionsNight), goal: 5, fmt: 'num' }; } },
    { id: 'themes_10', tier: 1, cat: 'path', icon: 'theme', hidden: true, on: ['theme:change'],
      test: function (s) { return s.themeSwaps >= 10; },
      progress: function (s) { return { cur: Math.min(10, s.themeSwaps), goal: 10, fmt: 'num' }; } },
    { id: 'zero_pnl', tier: 2, cat: 'chronicle', icon: 'zero', hidden: true, on: ['trade:close'],
      test: function (s, e) { return Math.abs(e.pnl || 0) < 0.005; } },
    { id: 'broke_zero', tier: 4, cat: 'chronicle', icon: 'broke', hidden: true, reward: { spins: 3 }, on: ['tick'],
      test: function (s, e, c) { return !!s.brokeZero && c.cap >= c.start; } },
    { id: 'second_lang', tier: 1, cat: 'path', icon: 'globe', hidden: true, on: ['app:open', 'lang:change'],
      test: function (s) { return (s.langs || []).length >= 2; } }
  ];

  /* Награды-предметы: РЕЕСТР ITEMS — единственный источник правды.
     a.items собирается из него по src.ach.

     Раньше список предметов жил в ДВУХ местах: здесь (reward.items) и в
     ITEMS (src.ach). Они разошлись — 32 новых предмета были видны в
     витрине, но никогда не выдавались, потому что applyReward читал
     reward.items, а itemOwned — инвентарь S.items. Теперь связь одна,
     и добавить предмет = добавить одну строку в ITEMS. */
  var ACH_ITEMS = {};
  (function () {
    for (var ik in ITEMS) {
      if (!Object.prototype.hasOwnProperty.call(ITEMS, ik)) continue;
      var sc = ITEMS[ik].src;
      if (sc && sc.ach) {
        if (!ACH_ITEMS[sc.ach]) ACH_ITEMS[sc.ach] = [];
        ACH_ITEMS[sc.ach].push(ik);
      }
    }
    for (var ai = 0; ai < REG.length; ai++) {
      REG[ai].items = ACH_ITEMS[REG[ai].id] || [];
    }
  })();

  var BY_EVENT = {};
  var queue = [];
  var showing = false;
  var timer = 0;
  /* Здесь было mem = { lastBuy: {} } — поле писалось в onTrade, но не
     читалось нигде: время удержания восстанавливает lastBuyTime() по
     S.trades. Убрано в AUDIT-2026-09-16. */
  /* Категории (path/skill/chronicle) больше не фильтруются: ряд
     «Все / Путь / Мастерство / Хроники» убран, остались только чипы
     статуса. Поле cat в реестре осталось как разметка группировки
     (по нему сгруппированы записи и подписаны секции в исходнике). */
  var statusFilter = 'all';
  var vitrineCat = 'frames';
  /* 'all' — сводный список по всем категориям, включается кнопкой
     «Показать все» в шапке витрины. */
  var ROMAN = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

  function on() { return ACH_ON && typeof S !== 'undefined'; }

  function st() {
    if (!S.stats || typeof S.stats !== 'object') S.stats = defStats();
    return S.stats;
  }
  function defStats() {
    if (typeof freshStats === 'function') { try { return freshStats(); } catch (e) { dbg('ach:defStats', e); } }
    return { volume: 0, feesPaid: 0, winStreak: 0, maxWinStreak: 0,
      maxHoldMs: 0, minHoldMs: 0, bestPct: 0, drawdownSurvived: 0,
      cancels: 0, limitsFilled: 0, alertsFired: 0, spins: 0, themeSwaps: 0,
      assetsTraded: [], sessionsNight: 0, nightLast: '', langs: [],
      broke80: false, brokeZero: false, capPeak: 0,
      tradesTotal: 0, winsTotal: 0, lastFillAt: 0, lastAlertAt: 0,
      prevFillAt: 0, prevAlertAt: 0, bestTrade: null, worstTrade: null, achSeen: 0 };
  }

  function reduced() {
    if (typeof FX !== 'undefined' && FX.reducedMotion) { try { if (FX.reducedMotion()) return true; } catch (e) { dbg('ach:reduced', e); } }
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* История свечей движка: экстремумы последних 288 базовых свечей. */
  function histExtremes(assetId) {
    var out = { hi: 0, lo: 0 };
    try {
      if (typeof Engine === 'undefined' || !Engine.candles) return out;
      var a = assetById(assetId);
      if (!a) return out;
      var cs = Engine.candles(a, 288, 1, Date.now()) || [];
      for (var i = 0; i < cs.length; i++) {
        if (cs[i].h > out.hi) out.hi = cs[i].h;
        if (!out.lo || cs[i].l < out.lo) out.lo = cs[i].l;
      }
    } catch (e) { dbg('ach:histExtremes', e); }
    return out;
  }
  function histHigh(id) { return histExtremes(id).hi; }
  function histLow(id) { return histExtremes(id).lo; }

  /* Последний buy актива из истории сделок (позиции времени открытия
     не хранят — восстанавливаем по ленте, для порогов 10с/24ч/3с точности
     хватает; частичные закрытия аппроксимируются последней покупкой). */
  function lastBuyTime(assetId, beforeT) {
    try {
      var trs = S.trades || [];
      for (var i = 0; i < trs.length; i++) {
        if (trs[i].side === 'buy' && trs[i].id === assetId && trs[i].t <= beforeT) return trs[i].t;
      }
    } catch (e) { dbg('ach:lastBuyTime', e); }
    return 0;
  }

  /* Контекст тика: считается раз в секунду, а не на каждое событие. */
  function tickCtx() {
    var c = { cap: 0, peak: 0, start: 1000, assets: 0, sectors: 0, favs: 0 };
    try {
      c.cap = capital();
      c.start = (typeof S.startBalance === 'number' && S.startBalance > 0) ? S.startBalance : 1000;
      c.peak = Math.max(c.cap, st().capPeak || 0);
      var ids = Object.keys(S.positions || {});
      c.assets = ids.length;
      var secs = {};
      for (var i = 0; i < ids.length; i++) {
        var a = assetById(ids[i]);
        if (a && a.sector) secs[a.sector] = 1;
      }
      c.sectors = Object.keys(secs).length;
      c.favs = Object.keys(S.favs || {}).length;
    } catch (e) { dbg('ach:tickCtx', e); }
    return c;
  }

  function checkList(list, ev, payload, ctx) {
    if (!on()) return;
    var s = st();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (S.ach[a.id]) continue;
      var ok = false;
      try { ok = !!a.test(s, payload, ctx); } catch (e) { ok = false; }
      if (ok) unlock(a, false);
    }
  }

  function emit(ev, payload) {
    if (!on()) return;
    payload = payload || {};
    payload.ev = ev;
    /* Счётчики без своей точки учёта: отмены лимиток и смены темы
       прилетают только событием — растим их здесь, иначе
       cancels_10 / themes_10 недостижимы. */
    try {
      if (ev === 'app:open') { onAppOpen(); }
      else if (ev === 'lang:change') {
        var lg = (payload && payload.lang) || ((typeof LANG !== 'undefined' && LANG) ? LANG : 'ru');
        var sl = st();
        if (!sl.langs) sl.langs = [];
        if (sl.langs.indexOf(lg) < 0) { sl.langs.push(lg); try { saveState(true); } catch (e) { dbg('ach:emit', e); } }
      }
      else if (ev === 'theme:change') {
        var ss = st();
        ss.themeSwaps = (Number(ss.themeSwaps) || 0) + 1;
        try { saveState(true); } catch (e) { dbg('ach:emit', e); }
      }
      else if (ev === 'limit:cancelled') {
        var sc = st();
        sc.cancels = (Number(sc.cancels) || 0) + 1;
        try { saveState(true); } catch (e) { dbg('ach:emit', e); }
      }
    } catch (e) { dbg('ach:emit', e); }
    var list = BY_EVENT[ev];
    if (list && list.length) {
      var ctx = (ev === 'tick') ? tickCtx() : null;
      checkList(list, ev, payload, ctx);
    }
    if (ev !== 'tick') pump();
  }

  /* Единая точка исполнений из pushTrade: статистика + события.
     balanceBefore восстанавливаем: во всех путях (doBuy, лимитный buy)
     баланс уже уменьшен на момент записи сделки. */
  function onTrade(side, a, qty, price, total, pnl, fee, kind) {
    if (!on() || !a) return;
    var s = st();
    var now = Date.now();
    total = Number(total) || 0;
    fee = Number(fee) || 0;
    s.volume += total;
    s.feesPaid += fee;
    s.tradesTotal += 1;
    if (s.assetsTraded.indexOf(a.id) < 0) s.assetsTraded.push(a.id);
    var ev = null;
    if (side === 'buy') {
      ev = { side: 'buy', assetId: a.id, qty: qty, price: price, total: total,
        fee: fee, kind: kind || 'market', balanceBefore: S.balance + total };
      emit('trade:open', ev);
    } else if (side === 'sell') {
      pnl = Number(pnl) || 0;
      var holdMs = 0;
      var bt = lastBuyTime(a.id, now);
      if (bt > 0) holdMs = Math.max(0, now - bt);
      if (holdMs > 0) {
        s.maxHoldMs = Math.max(s.maxHoldMs, holdMs);
        s.minHoldMs = s.minHoldMs > 0 ? Math.min(s.minHoldMs, holdMs) : holdMs;
      }
      if (pnl > 0) {
        s.winStreak += 1;
        s.maxWinStreak = Math.max(s.maxWinStreak, s.winStreak);
        s.winsTotal += 1;
        var cost = (total - fee) - pnl;
        if (cost > 0) s.bestPct = Math.max(s.bestPct, pnl / cost);
      } else if (pnl < 0) {
        s.winStreak = 0;
      }
      /* Крайние сделки для плиток профиля. Считаем по ЗАКРЫТЫМ сделкам
         (только sell): покупка не может быть ни лучшей, ни худшей.
         Сравнение с null, а не с нулём, — иначе серия убыточных сделок
         оставила бы «лучшую» на нуле. */
      if (s.bestTrade == null || pnl > Number(s.bestTrade)) s.bestTrade = pnl;
      if (s.worstTrade == null || pnl < Number(s.worstTrade)) s.worstTrade = pnl;
      var closedOut = !S.positions || !S.positions[a.id];
      ev = { side: 'sell', assetId: a.id, qty: qty, price: price, total: total,
        pnl: pnl, fee: fee, kind: kind || 'market', holdMs: holdMs, closedOut: closedOut };
      emit('trade:close', ev);
      /* Флаги просадки — на одну попытку: после продажи гаснут,
         иначе древний флаг выдавал бы ачивку за любую позднюю прибыль. */
      clearAssetFlags(a.id);
    }
    if (kind === 'limit') {
      s.limitsFilled += 1;
      /* Запоминаем ПРЕДЫДУЩИЕ отметки до перезаписи: на них держится
         limit_alert_combo — «два разных сигнала в пределах минуты».
         Раньше тест сравнивал с отметкой, которую выставляли прямо
         перед эмитом, поэтому условие было истинным всегда, и комбо
         открывалось одновременно с first_alert на первой же лимитке. */
      s.prevFillAt = s.lastFillAt || 0;
      s.lastFillAt = now;
      emit('limit:filled', { assetId: a.id, side: side, price: price, kind: 'limit' });
      /* Колокольчик реально уведомляет: подписка + исполнение лимитки.
         Тихий путь (без подписки) остаётся тихим, как раньше. */
      if (S.notifies && S.notifies[a.id]) {
        try {
          if (typeof Alerts !== 'undefined' && Alerts.limitFilled) Alerts.limitFilled(a, side, price, qty);
          else toast(t('alerts_fill', { t: a.ticker }), 'gold');
        } catch (e) { dbg('ach:onTrade', e); }
        s.alertsFired += 1;
        s.prevAlertAt = s.lastAlertAt || 0;
        s.lastAlertAt = now;
        emit('alert:fired', { assetId: a.id, price: price });
      }
    }
    try { saveState(true); } catch (e) { dbg('ach:onTrade', e); }
  }

  function unlock(a, silent) {
    if (!on() || !a || S.ach[a.id]) return false;
    S.ach[a.id] = Date.now();
    S.achPts = (Number(S.achPts) || 0) + (TIER_PTS[a.tier] || 5);
    applyReward(a);
    try { saveState(true); } catch (e) { dbg('ach:unlock', e); }
    try { if (typeof refreshFeePctLabel === 'function') refreshFeePctLabel(); } catch (e) { dbg('ach:unlock', e); }
    renderRow();
    try { renderVitrine(); } catch (e) { dbg('ach:unlock', e); }
    if (typeof currentScreen !== 'undefined' && currentScreen === 'scr-ach') renderList();
    if (!silent) {
      /* В очередь идёт ТОЛЬКО само достижение. Раньше следом копились
         тосты предметов («Примерить») и повышения ранга — это и был тот
         поток верхних уведомлений, который Дима попросил убрать: модалка
         выдачи уже перечисляет всё, что игрок получил, включая предметы
         («в витрину») и новую комиссию от ранга. */
      queue.push({ kind: 'std', id: a.id });
      pump();
    }
    return true;
  }

  /* Инвентарь предметов (S.items) и надетое (S.equip). Рамки/титул рангов
     в инвентарь не пишутся — доступность считается живьём по очкам. */
  function ensureInv() {
    if (!S.items || typeof S.items !== 'object') S.items = {};
    if (!S.equip || typeof S.equip !== 'object') {
      S.equip = { title: null, frame: null, candles: 'std', accent: null, flag: false };
    }
    /* Битое значение из старого сейва — назад к стандартным. */
    if (S.equip.candles !== 'std' && !CANDLE_SKINS[S.equip.candles]) S.equip.candles = 'std';
  }

  function grantItem(id) {
    ensureInv();
    if (S.items[id]) return false;
    S.items[id] = Date.now();
    return true;
  }

  function itemOwned(id) {
    if (id === 'candles_std') return true;
    var it = ITEMS[id];
    if (!it) return false;
    if (it.src.ach) {
      /* Владение выводим из достижения-источника, а не из инвентаря.
         Иначе предмет, добавленный позже, остался бы запертым у тех,
         кто уже открыл достижение: инвентарь наполняется только в
         момент выдачи. S.items остаётся журналом выдачи. */
      return !!S.ach[it.src.ach];
    }
    if (it.src.pass) return !!(S.items && S.items[id]);
    if (it.src.rank) {
      var r = rankFor(Number(S.achPts) || 0);
      if (!r) return false;
      var need = 0;
      for (var i = 0; i < RANKS.length; i++) {
        if (RANKS[i].id === it.src.rank) need = RANKS[i].pts;
      }
      return (Number(S.achPts) || 0) >= need;
    }
    return false;
  }

  /* Надеть предмет: титул/рамка/свечи/тема/акцент/флаг. Возвращает false,
     если предмета нет (показ витрины это проверяет заранее). */
  function equipItem(id) {
    if (!on()) return false;
    ensureInv();
    /* Пресеты акцента — перк ранга Профи, не инвентарь. */
    if (id && id.indexOf('preset:') === 0) {
      if (!rankPerks().accent) return false;
      var c = id.slice(7);
      if (!ACCENTS[c]) return false;
      S.equip.accent = (c === 'gold') ? null : c;
      try { saveState(true); } catch (e) { dbg('ach:equipItem', e); }
      try { applyEquip(); } catch (e) { dbg('ach:equipItem', e); }
      try { renderRow(); } catch (e) { dbg('ach:equipItem', e); }
      return true;
    }
    if (!itemOwned(id)) return false;
    var it = ITEMS[id];
    /* Стандартные свечи — не предмет инвентаря, а возврат к базе. */
    if (id === 'candles_std' || !it) {
      S.equip.candles = 'std';
    }
    else if (it.type === 'title') S.equip.title = (S.equip.title === id) ? null : id;
    else if (it.type === 'frame') S.equip.frame = (S.equip.frame === id) ? null : id;
    /* Повторный тап по надетым свечам снимает их (возврат к стандартным). */
    else if (it.type === 'candles') {
      var want = id.replace('candles_', '');
      S.equip.candles = ((S.equip.candles || 'std') === want) ? 'std' : want;
    }
    else if (it.type === 'theme') {
      /* Повторный тап снимает тему назад на тёмную. Ключ темы — id без
         префикса: theme_dawn → 'dawn' (раньше было жёстко 'midnight'). */
      var tkey = id.replace('theme_', '');
      try { setTheme(S.theme === tkey ? 'dark' : tkey); } catch (e) { dbg('ach:equipItem', e); }
    }
    else if (it.type === 'accent') {
      /* Повторный тап по неону снимает его (как у свечей). */
      if ((S.equip.accent || null) === 'neo') S.equip.accent = null;
      else S.equip.accent = 'neo';
    }
    else if (it.type === 'flag') S.equip.flag = !S.equip.flag;
    try { saveState(true); } catch (e) { dbg('ach:equipItem', e); }
    try { applyEquip(); } catch (e) { dbg('ach:equipItem', e); }
    try { renderRow(); } catch (e) { dbg('ach:equipItem', e); }
    return true;
  }

  /* Применить надетое к интерфейсу. Акцент и тема применяются через
     applyTheme() (единая точка), рамки/титулы/свечи читаются в точках
     рендера живьём. */
  function applyEquip() {
    if (!on()) return;
    ensureInv();
    try { applyTheme(); } catch (e) { dbg('ach:applyEquip', e); }
    /* Рамка и титул в hero профиля — сразу, без полного renderProfile.
       Иначе смена рамки в витрине не доходила до аватара до следующего
       входа на вкладку (кольцо оставалось прежним). */
    if (typeof refreshProfileEquip === 'function') {
      try { refreshProfileEquip(); } catch (e) { dbg('ach:applyEquip', e); }
    }
  }

  /* Активный акцентный цвет (null — штатный вид темы). */
  function accentColor() {
    if (!on()) return null;
    ensureInv();
    if (!rankPerks().accent) return null;
    var id = S.equip.accent;
    if (!id || !ACCENTS[id]) return null;
    return ACCENTS[id];
  }

  function equippedTitle() {
    if (!on()) return null;
    ensureInv();
    if (S.equip.title && itemOwned(S.equip.title) && ITEMS[S.equip.title] &&
        ITEMS[S.equip.title].type === 'title') return S.equip.title;
    return null;
  }

  /* Суффикс флага языка к титулу (надетый «Флаг»). */
  function flagSuffix() {
    if (!on()) return '';
    ensureInv();
    if (!S.equip.flag || !itemOwned('flag_lang')) return '';
    var lg = 'RU';
    try { lg = ((typeof LANG !== 'undefined' && LANG) || 'ru').toUpperCase(); } catch (e) { dbg('ach:flagSuffix', e); }
    return ' · ' + lg;
  }

  function equippedFrame() {
    if (!on()) return null;
    ensureInv();
    if (S.equip.frame && itemOwned(S.equip.frame) && ITEMS[S.equip.frame] &&
        ITEMS[S.equip.frame].type === 'frame') return S.equip.frame;
    return null;
  }

  function candleStyle() {
    if (!on()) return null;
    ensureInv();
    var id = S.equip.candles || 'std';
    if (!itemOwnedCandle(id)) return null;
    return CANDLE_SKINS[id] || null;
  }

  function itemOwnedCandle(id) {
    if (id === 'std') return true;
    return itemOwned('candles_' + id);
  }

  function applyReward(a) {
    /* Предметы — из реестра (a.items). Спин может быть и без предметов,
       поэтому reward проверяем отдельно от items. */
    var ids = a.items || [];
    for (var i = 0; i < ids.length; i++) grantItem(ids[i]);
    /* Бесплатная прокрутка: обнуляем кулдаун — следующая крутка free.
       Счётчика попыток в игре нет, поэтому награда всегда ровно одна. */
    if (a.reward && a.reward.spins) {
      try { S.spinFreeAt = 0; } catch (e) { dbg('ach:applyReward', e); }
    }
  }

  function anyModalOpen() {
    try {
      var ms = document.querySelectorAll('.modal');
      for (var i = 0; i < ms.length; i++) {
        if (!ms[i].classList.contains('hidden')) return true;
      }
    } catch (e) { dbg('ach:anyModalOpen', e); }
    return false;
  }

  function pump() {
    /* v3: пока идёт церемония, новые достижения встают в её очередь. */
    if (showing && queue.length && typeof V3Ach !== 'undefined' && V3Ach.append) {
      while (queue.length && (typeof queue[0] === 'string' || queue[0].kind === 'std') &&
          V3Ach.append(byId(typeof queue[0] === 'string' ? queue[0] : queue[0].id))) queue.shift();
    }
    if (!on() || showing || !queue.length) return;
    /* Ничего поверх торгового экрана и открытых модалок — копим.
       Тик дёргает pump каждую секунду, показ случится при выходе. */
    try {
      if (typeof currentScreen !== 'undefined' && currentScreen === 'scr-trade') return;
      /* Колесо крутится или показывает, куда попало, — окно достижения
         закрыло бы колесо посреди крутки. Покажем после окна приза. */
      if (typeof spinBusy !== 'undefined' && spinBusy) return;
      if (anyModalOpen()) return;
      if (typeof document !== 'undefined' && document.hidden) return;
    } catch (e) { return; }
    var job = queue.shift();
    if (!job) { pump(); return; }
    if (typeof job === 'string') job = { kind: 'std', id: job };
    /* Ветки 'item' и 'rank' сейчас НЕ задействованы: очередь их больше не
       получает (см. unlock). Функции и ветки оставлены целиком, потому что
       репозиторий без git и вернуть уведомление должно стоить одной строки
       в unlock. Пока играем только анимацией выдачи. */
    if (job.kind === 'item') {
      showing = true;
      showItem(job.id);
      return;
    }
    if (job.kind === 'rank') {
      showing = true;
      showRank(job.id);
      return;
    }
    var a = byId(job.id);
    if (!a) { pump(); return; }
    showing = true;
    /* v3 (js/v3-ach.js): подряд идущие достижения — одна церемония с очередью. */
    if (typeof V3Ach !== 'undefined' && V3Ach.ceremony) {
      var batch = [a];
      while (queue.length && (typeof queue[0] === 'string' || queue[0].kind === 'std')) {
        var nx = byId(typeof queue[0] === 'string' ? queue[0] : queue[0].id);
        queue.shift();
        if (nx) batch.push(nx);
      }
      try { V3Ach.ceremony(batch); return; } catch (e) { dbg('ach:v3ceremony', e); }
    }
    /* Любое достижение показываем АНИМАЦИЕЙ выдачи, без порога по весу.
       Раньше лёгкие уходили в тост сверху (showToast) — Дима попросил
       убрать верхние уведомления и оставить только анимацию выдачи
       каждого достижения. showToast оставлен рядом, но не вызывается. */
    showModal(a);
  }

  /* Не вызывается с 2026-09-16: верхние уведомления убраны, всё идёт
     модалкой выдачи. Оставлен целиком — репозиторий без git, а вернуть
     «Примерить» в тосте должно быть дёшево.
     Тост о предмете: название + кнопка «Примерить» (только носимое).
     Кнопка — нативный <button>: toast() умеет только текст. */
  function showItem(itemId) {
    /* done() обязан сработать РОВНО ОДИН раз: он сбрасывает showing и
       запускает следующий тост. Раньше кнопка «Примерить» звала его
       сразу, а таймеры 3400/3800 мс — ещё раз, и второй вызов попадал
       на показ СЛЕДУЮЩЕГО элемента: очередь ускорялась вдвое и тосты
       накладывались. См. AUDIT-2026-09-16. */
    var finished = false;
    var done = function () {
      if (finished) return;
      finished = true;
      showing = false;
      pump();
    };
    try {
      var box = document.getElementById('toasts');
      if (!box) { done(); return; }
      var it = ITEMS[itemId];
      var wearable = it && (it.type === 'title' || it.type === 'frame' ||
        it.type === 'candles' || it.type === 'theme' ||
        it.type === 'accent' || it.type === 'flag');
      var ikey = 'ach_item_open_' + ((it && it.type) || 'frame');
      /* Общий тост из main.js: оформление и жесты те же, что у остальных.
         Очередь освобождается, когда тост закрыт любым способом. */
      toast(t(ikey, { name: t('item_' + itemId + '_t') }), 'toast-ach toast-item', {
        ms: 3400,
        onClose: done,
        action: wearable ? {
          label: t('ach_try'),
          fn: function () {
            try { equipItem(itemId); } catch (e) { dbg('ach:showItem', e); }
            try { renderVitrine(); } catch (e) { dbg('ach:showItem', e); }
          }
        } : null
      });
    } catch (e) { done(); }
  }

  /* Не вызывается с 2026-09-16 — см. showItem выше. */
  function showRank(rankId) {
    var done = function () { showing = false; pump(); };
    try {
      var nm = '';
      try { nm = t('rank_' + rankId); } catch (e) { nm = rankId; }
      toast(t('ach_rankup', { name: nm }), 'toast-ach');
      try { if (typeof FX !== 'undefined' && FX.vibrate) FX.vibrate(12); } catch (e) { dbg('ach:showRank', e); }
    } catch (e) { dbg('ach:showRank', e); }
    setTimeout(done, 2750);
  }

  /* Короткая сводка награды одной строкой — для тоста. Раньше здесь были
     только прокрутки (очки тост не называл вовсе), теперь перечисляем
     всё, что игрок получил: очки, прокрутки, предметы. */
  function rewardText(a) {
    var parts = ['+' + rewardPts(a) + ' ' + t('ach_pts_name')];
    var sp = rewardSpins(a);
    if (sp) parts.push('+' + spinWord(sp));
    var items = rewardItems(a);
    for (var i = 0; i < items.length; i++) {
      var k = ITEM_KIND[items[i].type] || ITEM_KIND.frame;
      parts.push(t(k.word) + ' ' + quoteName(items[i].name));
    }
    return parts.join(' · ');
  }

  /* Не вызывается с 2026-09-16: лёгкие достижения больше не уходят в тост,
     все показываются модалкой выдачи (см. pump). */
  function showToast(a) {
    var name = t('ach_' + a.id + '_t');
    try { toast(t('ach_unlocked', { name: name }) + rewardSuffix(a), 'toast-ach'); } catch (e) { dbg('ach:showToast', e); }
    try { if (typeof FX !== 'undefined' && FX.vibrate) FX.vibrate(12); } catch (e) { dbg('ach:showToast', e); }
    setTimeout(function () { showing = false; pump(); }, 2750);
  }

  function rewardSuffix(a) {
    var r = rewardText(a);
    return r ? ' · ' + r : '';
  }

  /* Последняя показанная модалка (для перерисовки при смене языка)
     и сброс очереди показа, когда модалки закрыли извне (Escape). */
  var lastShown = null;
  function modalClosed() {
    if (!showing) return;
    showing = false;
    pump();
  }
  function refreshLang() {
    if (!lastShown || lastShown.kind !== 'ach') return;
    try {
      var m = document.getElementById('modal-ach');
      if (!m || m.classList.contains('hidden')) return;
      var a = byId(lastShown.id);
      if (!a) return;
      setText('achm-title', t('ach_' + a.id + '_t'));
      setText('achm-desc', t('ach_' + a.id + '_d'));
      fillModalReward(a);
    } catch (e) { dbg('ach:refreshLang', e); }
  }

  /* Строки награды в модалке: очки / прокрутка / предметы. Каждая —
     иконка, название, подсказка «что это даёт» и значение справа.
     Строка очков помечена data-count, чтобы её число докрутилось
     твином (см. countUp). */
  function modalRewardRows(a) {
    var h = '';
    var j = 0;
    h += '<div class="arow arow--pts" style="--j:' + (j++) + '">' +
      '<span class="arow-ico">' + chipIcon('star') + '</span>' +
      '<span class="arow-txt"><b>' + esc(t('ach_pts_name_long')) + '</b>' +
      '<span>' + esc(t('ach_pts_hint')) + '</span></span>' +
      '<b class="arow-val mono" data-count="' + rewardPts(a) + '">+' + rewardPts(a) + '</b></div>';
    var sp = rewardSpins(a);
    if (sp) {
      h += '<div class="arow arow--spin" style="--j:' + (j++) + '">' +
        '<span class="arow-ico">' + chipIcon('wheel') + '</span>' +
        '<span class="arow-txt"><b>' + esc(t('ach_kind_spin')) + '</b>' +
        '<span>' + esc(t('ach_spin_hint')) + '</span></span>' +
        '<b class="arow-val mono">×' + sp + '</b></div>';
    }
    var items = rewardItems(a);
    for (var i = 0; i < items.length; i++) {
      var k = ITEM_KIND[items[i].type] || ITEM_KIND.frame;
      h += '<div class="arow arow--item" style="--j:' + (j++) + '">' +
        '<span class="arow-ico">' + chipIcon(k.ico) + '</span>' +
        '<span class="arow-txt"><b>' + esc(items[i].name) + '</b>' +
        '<span>' + esc(t(k.word)) + '</span></span>' +
        '<b class="arow-val">' + esc(t('ach_to_vitrine')) + '</b></div>';
    }
    return h;
  }

  /* Подпись под наградами: что дают очки на самом деле. Показываем
     конкретный переход ставки, если он есть. */
  function modalFeeLine(a) {
    try {
      var info = feeTierInfo(Number(S.achPts) || 0);
      if (info.next) {
        return t('ach_pts_fee_after', { cur: pctStr(info.cur), next: pctStr(info.next.rate) });
      }
      return t('ach_pts_fee_plain');
    } catch (e) { dbg('ach:modalFeeLine', e); return ''; }
  }

  function fillModalReward(a) {
    var rows = document.getElementById('achm-rows');
    if (rows) rows.innerHTML = modalRewardRows(a);
    var fee = document.getElementById('achm-fee');
    if (fee) fee.textContent = modalFeeLine(a);
  }

  /* Позиции искр вокруг иконки (x/y — проценты контейнера декора,
     dl — задержка старта, с). */
  var SPARKS = [
    { x: '8%', y: '16%', s: 12, dl: 0.30 },
    { x: '92%', y: '22%', s: 9, dl: 0.42 },
    { x: '50%', y: '2%', s: 8, dl: 0.36 },
    { x: '2%', y: '62%', s: 8, dl: 0.50 },
    { x: '96%', y: '70%', s: 11, dl: 0.46 },
    { x: '24%', y: '96%', s: 7, dl: 0.56 },
    { x: '76%', y: '94%', s: 9, dl: 0.62 }
  ];

  /* Декор иконки: рисуемое кольцо + искры-звёздочки (анимации в CSS).
     Вставляется при каждом показе — innerHTML иконки пересоздаётся. */
  function decor(ico) {
    var svg = '<svg class="tu-ach-ring" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="49"></circle></svg>';
    var sp = '<span class="tu-ach-spark" aria-hidden="true">';
    for (var i = 0; i < SPARKS.length; i++) {
      sp += '<i style="--x:' + SPARKS[i].x + ';--y:' + SPARKS[i].y +
        ';--s:' + SPARKS[i].s + 'px;--dl:' + SPARKS[i].dl + 's"></i>';
    }
    ico.insertAdjacentHTML('beforeend', svg + sp + '</span>');
  }

  /* Счётчик награды: «+100 очков» тикает 0→100 с easeOutCubic. Числа
     меньше 5 не тикаем — «+1 спин» выглядел бы миганием нуля. */
  function countUp(node, ms, delay) {
    if (!node || reduced()) return;
    var full = (node.textContent || '').trim();
    var m = full.match(/^([^\d]*)(\d+)([\s\S]*)$/);
    if (!m) return;
    var target = Number(m[2]);
    if (!target || target < 5) return;
    var pre = m[1], post = m[3], t0 = 0;
    node.textContent = pre + '0' + post;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / ms);
      node.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + post;
      if (p < 1) requestAnimationFrame(step); else node.textContent = full;
    }
    setTimeout(function () { requestAnimationFrame(step); }, delay || 0);
  }

  /* Акцент модалки — по «весомейшей» награде, а не по тиру. Предмет
     важнее прокрутки, прокрутка важнее очков: свечение и лучи красят
     то, что игрок реально получил, а не «сословие» достижения. */
  function rewardAccent(a) {
    if (rewardItems(a).length) return '#b678f0';
    if (rewardSpins(a)) return '#4da3ff';
    return '#e9b640';
  }

  /* Вес награды: очки + прокрутки×20 + предметы×25. Заменяет собой тир
     сразу в двух решениях — «модалка или тост» и «сколько конфетти».
     Раньше и то и другое считалось от класса достижения (tier>=3), из-за
     чего скромная ачивка с предметом показывалась тостом, а «100 очков
     без всего» — полной модалкой. Теперь масштаб церемонии = масштаб
     награды. */
  function rewardWeight(a) {
    return rewardPts(a) + rewardSpins(a) * 20 + rewardItems(a).length * 25;
  }
  /* Порог модалки: с 40+ очков или с любым предметом/прокруткой
     церемония полная, иначе хватает тоста. */
  var MODAL_WEIGHT = 60;

  /* Модалка открывается ТОЛЬКО моментом выдачи достижения (см. pump).
     Параметра view больше нет: тап по карточке убран, потому что палил
     скрытые достижения — в модалке видны настоящее название и условие,
     хотя в списке стоит «???». Вместе с ним ушли классы ach-view /
     ach-view--locked и кикер по состоянию: теперь «Достижение открыто»
     верно всегда. */
  function showModal(a) {
    try {
      lastShown = { kind: 'ach', id: a.id };
      var ico = document.getElementById('achm-icon');
      if (ico) {
        ico.innerHTML = achIconHtml(a, true);
        decor(ico);
      }
      /* Свечение, лучи и кольцо — в цвете весомейшей награды. */
      var sheet = document.querySelector('#modal-ach .achm-sheet');
      if (sheet) sheet.style.setProperty('--tu-tier', rewardAccent(a));
      setText('achm-title', t('ach_' + a.id + '_t'));
      setText('achm-desc', t('ach_' + a.id + '_d'));
      fillModalReward(a);
      /* Счётчик очков стартует, когда строка уже поднялась каскадом. */
      countUp(document.querySelector('#achm-rows .arow--pts .arow-val'), 620, 460);
      var cf = document.getElementById('ach-confetti');
      if (cf) {
        cf.innerHTML = '';
        /* Конфетти — по весу награды (см. rewardWeight). Лёгкие
           достижения (только 5 очков) остаются тихими, «Миллионер» с
           полным набором — салют. Не в фоне и не при reduced-motion. */
        var weight = rewardWeight(a);
        if (weight >= MODAL_WEIGHT && !document.hidden && !reduced()) {
          var n = weight >= 140 ? 40 : 20;
          var html = '';
          for (var i = 0; i < n; i++) {
            html += '<i class="cf' + (i % 4) + '" style="--dx:' + (Math.random() * 240 - 120).toFixed(0) +
              'px;--rot:' + (Math.random() * 540 - 270).toFixed(0) +
              'deg;--dl:' + (Math.random() * 0.35).toFixed(2) + 's"></i>';
          }
          cf.innerHTML = html;
          setTimeout(function () { var c2 = document.getElementById('ach-confetti'); if (c2) c2.innerHTML = ''; }, 1700);
        }
      }
      if (typeof FX !== 'undefined' && FX.vibrate) { try { FX.vibrate([20, 40, 20]); } catch (e) { dbg('ach:showModal', e); } }
      openModal('modal-ach');
    } catch (e) { showing = false; }
  }

  function setText(id, s) {
    var el = document.getElementById(id);
    if (el) el.textContent = s;
  }

  function byId(id) {
    for (var i = 0; i < REG.length; i++) if (REG[i].id === id) return REG[i];
    return null;
  }

  /* ---------- Тик: 1/сек, тяжёлое — только при открытых позициях ---------- */
  function tick() {
    if (!on()) return;
    /* В фоне не считаем: вкладка всё равно дёрнет pump и проверки
       при возврате, а батарею и сейвы экономим. */
    try {
      if (typeof document !== 'undefined' && document.hidden) return;
    } catch (e) { dbg('ach:tick', e); }
    try {
      var ids = Object.keys(S.positions || {});
      var hasPos = ids.length > 0;
      if (hasPos) {
        var now = Date.now();
        for (var i = 0; i < ids.length; i++) {
          var p = S.positions[ids[i]];
          if (!p || !(p.qty > 0)) continue;
          var a = assetById(ids[i]);
          if (!a) continue;
          var val = 0;
          try { val = p.qty * Engine.bid(a, now); } catch (e) { continue; }
          var cost = Number(p.cost) || 0;
          if (!(cost > 0)) continue;
          if (!(p.ach_peak > 0)) p.ach_peak = val;
          if (!(p.ach_lo > 0)) p.ach_lo = val;
          if (val > p.ach_peak) p.ach_peak = val;
          if (val < p.ach_lo) p.ach_lo = val;
          /* Флаги просадки (_dd30/_f20 в stats): ставятся здесь,
             гаснут при первой же продаже актива (см. onTrade). */
          if (val <= 0.7 * cost) flagAsset('_dd30', ids[i]);
          else if (val <= 0.8 * cost) flagAsset('_f20', ids[i]);
        }
      }
      var c = tickCtx();
      var s = st();
      s.capPeak = Math.max(Number(s.capPeak) || 0, c.cap);
      if (s.tradesTotal > 0 && c.cap < 1) s.brokeZero = true;
      if (s.capPeak > 0 && c.cap <= 0.2 * s.capPeak) s.broke80 = true;
      /* tick-подписанные достижения: сначала глобальные дешёвые,
         позиционные — только при открытых позициях. */
      var list = BY_EVENT.tick || [];
      var ctx = c;
      for (var j = 0; j < list.length; j++) {
        var a = list[j];
        if (S.ach[a.id]) continue;
        if (a.pos && !hasPos) continue;
        var ok = false;
        try { ok = !!a.test(s, { ev: 'tick' }, ctx); } catch (e) { ok = false; }
        if (ok) unlock(a, false);
      }
      pump();
    } catch (e) { dbg('ach:tick', e); }
  }

  function flagAsset(key, assetId) {
    var s = st();
    if (!s[key] || typeof s[key] !== 'object') s[key] = {};
    s[key][assetId] = 1;
  }

  function clearAssetFlags(assetId) {
    var s = st();
    if (s._dd30) delete s._dd30[assetId];
    if (s._f20) delete s._f20[assetId];
  }

  /* ---------- Миграция: молча, один итоговый тост ----------
     v3: пересчёт очков из реестра (защита от дрейфа), выдача предметов
     за уже открытые достижения, обрезка колоколов до слотов ранга. */
  function migrate() {
    var res = { given: 0, items: 0 };
    if (!on()) return res;
    function give(id) {
      var a = byId(id);
      if (a && unlock(a, true)) res.given++;
    }
    try {
      if ((Number(S.tradesCount) || 0) > 0) give('first_trade');
      if ((Number(S.wins) || 0) > 0) give('first_profit');
      /* Здесь была вторая, мёртвая ветка на first_profit (условие по
         S.best) — она ничего не добавляла, потому что ачивка уже
         выдана строкой выше. Зато не хватало ретро-выдачи first_loss:
         игрок с убытками в старом сейве не получал её до следующей
         продажи в минус. Смотрим историю сделок — она хранит
         последние 40 операций. */
      var _hadLoss = false;
      var _trs = S.trades || [];
      for (var _ti = 0; _ti < _trs.length; _ti++) {
        var _t = _trs[_ti];
        if (_t && _t.side === 'sell' && typeof _t.pnl === 'number' && _t.pnl < 0) { _hadLoss = true; break; }
      }
      if (_hadLoss) give('first_loss');
      if ((Number(S.streak) || 0) >= 7) give('streak_7');
      if ((Number(S.streak) || 0) >= 30) give('streak_30');
    } catch (e) { dbg('ach:give', e); }
    try {
      var sum = 0;
      for (var id in (S.ach || {})) {
        var ba = byId(id);
        if (ba) sum += TIER_PTS[ba.tier] || 5;
      }
      S.achPts = sum;
    } catch (e) { dbg('ach:give', e); }
    try {
      for (var i = 0; i < REG.length; i++) {
        var r = REG[i];
        /* Ретро-выдача предметов: у открытых достижений проверяем весь
           список из реестра — так владельцы старых сейвов получают и
           предметы, добавленные позже. */
        if (!S.ach[r.id]) continue;
        var _ris = r.items || [];
        for (var j = 0; j < _ris.length; j++) {
          if (grantItem(_ris[j])) res.items++;
        }
      }
    } catch (e) { dbg('ach:give', e); }
    return res;
  }

  /* Досыпать предметы за уже открытые достижения и вернуть, сколько
     добавилось. Идемпотентно: grantItem не трогает то, что уже лежит.

     Живёт ОТДЕЛЬНО от migrate(), потому что migrate вызывается только
     при S.v < 3. Предметы же добавляются с обновлениями игры, и сейв
     игрока к тому моменту давно v5 — то есть 32 новых предмета
     выдавались молча, а S.items (журнал выдачи) оставался пустым.
     Владение при этом не страдало: itemOwned выводит его из самого
     достижения. Но игрок не узнавал, что получил подарок. */
  function backfillItems() {
    var n = 0;
    if (!on()) return n;
    try {
      for (var i = 0; i < REG.length; i++) {
        var r = REG[i];
        if (!S.ach[r.id]) continue;
        var ids = r.items || [];
        for (var j = 0; j < ids.length; j++) {
          if (grantItem(ids[j])) n++;
        }
      }
    } catch (e) { dbg('ach:backfillItems', e); }
    return n;
  }

  /* ---------- Экран ---------- */
  function unlockedCount() {
    if (!on()) return 0;
    return Object.keys(S.ach || {}).length;
  }

  function unseenCount() {
    if (!on()) return 0;
    var seen = 0;
    try { seen = Number(st().achSeen) || 0; } catch (e) { dbg('ach:unseenCount', e); }
    return Math.max(0, unlockedCount() - seen);
  }

  function renderRow() {
    if (!on()) {
      var row0 = document.getElementById('ach-row');
      if (row0) row0.classList.add('hidden');
      return;
    }
    var row = document.getElementById('ach-row');
    if (!row) return;
    row.classList.remove('hidden');
    var n = unlockedCount();
    /* Формат «4 / 44» с пробелами — как в референсе; счётчик очков идёт
       третьим элементом той же строки через разделитель. */
    setText('ach-row-count', n + ' / ' + REG.length);
    setText('ach-row-pts', (Number(S.achPts) || 0) + ' ' + t('ach_pts_name'));
    /* Вторая строка — комиссия из той же таблицы (те же ключи, что в шапке).
       Ставки подсвечиваем: текущая — белым, следующая — золотом (как в
       референсе профиля). Под строкой — бар до следующей ступени. */
    try {
      var apts = Number(S.achPts) || 0;
      var info = feeTierInfo(apts);
      var ftxt;
      if (!info.next) {
        ftxt = t('ach_fee_min', { cur: pctStr(info.cur) });
      } else {
        ftxt = t('ach_fee_head', {
          cur: pctStr(info.cur),
          next: pctStr(info.next.rate),
          n: info.next.pts - apts
        });
      }
      var feeEl = document.getElementById('ach-row-fee');
      if (feeEl) {
        /* Иконка кубка перед строкой комиссии — как в референсе. */
        var fhtml = ACH_CUP_SVG + esc(ftxt);
        var rc0 = esc(pctStr(info.cur));
        fhtml = fhtml.split(rc0).join('<b>' + rc0 + '</b>');
        if (info.next) {
          var rn0 = esc(pctStr(info.next.rate));
          fhtml = fhtml.split(rn0).join('<b class="gold">' + rn0 + '</b>');
        }
        feeEl.innerHTML = fhtml;
      }
      /* Полоса до следующей ступени комиссии. */
      var fbWrap = document.getElementById('ach-row-feebar-wrap');
      var fbBar = document.getElementById('ach-row-feebar');
      if (fbWrap && fbBar) {
        if (!info.next) {
          fbWrap.classList.add('hidden');
        } else {
          fbWrap.classList.remove('hidden');
          var span = info.next.pts - info.base;
          var got = apts - info.base;
          var ffrac = span > 0 ? Math.max(0, Math.min(1, got / span)) : 0;
          fbBar.style.width = '0%';
          void fbBar.offsetWidth;
          fbBar.style.transitionDuration = (640 + Math.random() * 180).toFixed(0) + 'ms';
          fbBar.style.width = (ffrac * 100).toFixed(1) + '%';
        }
      }
    } catch (e) { dbg('ach:renderRow', e); }
    var dot = document.getElementById('ach-dot');
    if (dot) dot.classList.toggle('hidden', unseenCount() <= 0);
    /* Кольцо прогресса: заливка через --p, цифры докручиваются твином. */
    var frac = REG.length ? n / REG.length : 0;
    var ring = document.getElementById('ach-row-ring');
    if (ring) ring.style.setProperty('--p', (frac * 100).toFixed(1) + '%');
    var pctEl = document.getElementById('ach-row-pct');
    if (pctEl) {
      var pctTxt = Math.round(frac * 100) + '%';
      try {
        if (typeof FX !== 'undefined' && FX.tweenNumber) {
          FX.tweenNumber(pctEl, Math.round(frac * 100), {
            dur: 450,
            fmt: function (v) { return Math.round(v) + '%'; }
          });
        } else pctEl.textContent = pctTxt;
      } catch (e) { pctEl.textContent = pctTxt; }
    }
  }

  /* Кубок перед строкой комиссии в карточке профиля. */
  var ACH_CUP_SVG = '<svg class="ach-fee-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4"/>' +
    '<path d="M17 6h2.5a2.5 2.5 0 0 1-2.5 4"/><path d="M12 14v3"/><path d="M9 20h6"/>' +
    '<path d="M10 17h4l1 3H9z"/></svg>';

  /* Денежный прогресс «cur / goal» в ОДНОЙ единице (по goal):
     иначе goal «$1000.0 тыс.» и cur «$50 000» в одной строке. */
  function fmtMoneyPair(cur, goal) {
    var g = Math.max(0, Number(goal) || 0);
    var u = null;
    if (g >= 1e9) u = [1e9, 'big_b', 2];
    else if (g >= 1e6) u = [1e6, 'big_m', 2];
    else if (g >= 1e3) u = [1e3, 'big_k', 1];
    function f(v) {
      v = Math.max(0, Number(v) || 0);
      if (!u) return money(v);
      var n = v / u[0];
      var s = u[2] === 2 ? n.toFixed(2) : n.toFixed(1);
      return '$' + s + ' ' + t(u[1]);
    }
    return f(cur) + ' / ' + f(goal);
  }

  function fmtProg(p) {
    if (!p) return '';
    if (p.fmt === 'money') return fmtMoneyPair(p.cur, p.goal);
    var f = function (v) {
      if (p.fmt === 'pct') return Math.round(v) + '%';
      return String(Math.max(0, Math.floor(v)));
    };
    var g = function (v) {
      if (p.fmt === 'pct') return Math.round(v) + '%';
      return String(v);
    };
    return f(p.cur) + ' / ' + g(p.goal);
  }

  function cardSort() {
    var s = st();
    var ctx = tickCtx();
    var rows = [];
    for (var i = 0; i < REG.length; i++) {
      var a = REG[i];
      var un = !!S.ach[a.id];
      var p = null;
      if (!un && a.progress) { try { p = a.progress(s, {}, ctx); } catch (e) { p = null; } }
      var ratio = 0;
      if (un) ratio = 1;
      else if (p && p.goal > 0) ratio = Math.max(0, Math.min(1, p.cur / p.goal));
      rows.push({ a: a, un: un, p: p, ratio: ratio,
        at: un ? (S.ach[a.id] || 0) : 0 });
    }
    /* Сначала почти-добитые (50–99%), потом недавно открытые,
       потом остальной прогресс, в хвосте — закрытые. */
    rows.sort(function (x, y) {
      var xh = !x.un && x.ratio >= 0.5 && x.ratio < 1 ? 0 : 1;
      var yh = !y.un && y.ratio >= 0.5 && y.ratio < 1 ? 0 : 1;
      if (xh !== yh) return xh - yh;
      if (x.un && y.un) return y.at - x.at;
      if (x.un !== y.un) return x.un ? -1 : 1;
      return y.ratio - x.ratio;
    });
    return rows;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Локализованная дата получения без времени: «9 сентября» / «Sep 9». */
  function achDate(ts) {
    try {
      var d = new Date(Number(ts) || Date.now());
      var mn = t('ach_m' + (d.getMonth() + 1));
      if (typeof LANG !== 'undefined' && LANG === 'en') return mn + ' ' + d.getDate();
      return d.getDate() + ' ' + mn;
    } catch (e) { return ''; }
  }

  function renderList() {
    if (!on()) return;
    var box = document.getElementById('ach-list');
    if (!box) return;
    /* v3: список, шапка с дорогой рангов и чипы рисуются в js/v3-ach.js. */
    if (typeof V3Ach !== 'undefined' && V3Ach.list) {
      try { V3Ach.list(box); return; } catch (e) { dbg('ach:v3list', e); }
    }
    var allRows = cardSort();
    var rows = allRows.filter(function (r) { return statusMatch(r, statusFilter); });
    /* Счётчики — по ВСЕМУ реестру, но БЕЗ статусного фильтра: иначе у
       выбранного чипа всегда стояло бы его же число, а у остальных
       нули. Список от этого не страдает, он уже отфильтрован выше. */
    renderFilterCounts(allRows);
    var html = '';
    /* Режим «все»: секции как в референсе — сначала в процессе,
       потом полученные, в хвосте остальное без заголовка.
       Закрытые скрытые в общий список не тянем — они за воронкой. */
    if (statusFilter === 'all') {
      var doing = [], got = [], rest = [], seq = 0;
      for (var k = 0; k < rows.length; k++) {
        var r0 = rows[k];
        if (r0.un) got.push(r0);
        else if (r0.ratio > 0) doing.push(r0);
        else if (!(r0.a.hidden && !r0.un)) rest.push(r0);
      }
      if (doing.length) {
        html += '<div class="ach-sec" role="presentation">' + esc(t('ach_sec_doing')) + '</div>';
        for (var d = 0; d < doing.length; d++) html += cardHtml(doing[d], seq++);
      }
      if (got.length) {
        html += '<div class="ach-sec" role="presentation">' + esc(t('ach_sec_got')) + '</div>';
        for (var g = 0; g < got.length; g++) html += cardHtml(got[g], seq++);
      }
      for (var q = 0; q < rest.length; q++) html += cardHtml(rest[q], seq++);
    } else {
      for (var i = 0; i < rows.length; i++) {
        html += cardHtml(rows[i], i);
      }
    }
    box.innerHTML = html || '';
    var n = document.getElementById('ach-count');
    if (n) n.textContent = unlockedCount() + ' / ' + REG.length;
    /* Счётчик очков в шапке экрана (пустовал с момента появления). */
    setText('ach-pts', (Number(S.achPts) || 0) + ' ' + t('ach_pts_name'));
    renderFeeLine();
    drawRing();
    syncFilters();
  }

  /* Строка комиссии в шапке: текущая ставка и очки до следующей ступени. */
  function renderFeeLine() {
    var el = document.getElementById('ach-fee-line');
    if (!el) return;
    try {
      var info = feeTierInfo(Number(S.achPts) || 0);
      var txt;
      if (!info.next) {
        txt = t('ach_fee_min', { cur: pctStr(info.cur) });
      } else {
        txt = t('ach_fee_head', {
          cur: pctStr(info.cur),
          next: pctStr(info.next.rate),
          n: info.next.pts - (Number(S.achPts) || 0)
        });
      }
      el.textContent = txt;
    } catch (e) { dbg('ach:renderFeeLine', e); }
  }

  function pctStr(r) {
    return (Math.round(r * 10000) / 100) + '%';
  }

  /* ---------- Награды вместо классов ----------
     Раньше на карточке справа висела пилюля класса (Ритейл/Трейдер/Профи/
     Кит) — она говорила «насколько достижение крутое» по сословию, но не
     говорила, что игрок получит. Теперь вместо неё чипы награды, и цвет
     несёт тип: золото — очки, океан — прокрутка, фиолет — предмет.
     Видны и у закрытых достижений (приглушённо): игрок заранее знает,
     за что бьётся. */

  /* Склонение прокруток: 1 прокрутка / 2-4 прокрутки / 5+ прокруток. */
  function spinWord(n) {
    var k = n === 1 ? 'ach_spin_1' : ((n % 10 >= 2 && n % 10 <= 4 && Math.floor(n / 10) !== 1) ? 'ach_spin_2' : 'ach_spin_5');
    return t(k, { n: n });
  }

  /* Список предметов награды: [{id, type, name}] — в порядке объявления
     в реестре, без повторов. */
  /* Кавычки по языку. В проекте уже принято: RU — «ёлочки», EN — “лапки”
     (см. ach_vit_unlock / ach_vit_need в i18n). Здесь кавычки собирались
     строкой, и в английской локали выходило «Candles «Glass»». */
  function quoteName(s) {
    var en = false;
    try { en = (typeof LANG !== 'undefined' && LANG === 'en'); } catch (e) {}
    return en ? ('\u201c' + s + '\u201d') : ('\u00ab' + s + '\u00bb');
  }

  /* Предметы-награды достижения. Источник — a.items, собранный из
     реестра ITEMS (см. ACH_ITEMS выше), а не из литерала в REG. */
  function rewardItems(a) {
    var out = [];
    var ids = a.items || [];
    for (var i = 0; i < ids.length; i++) {
      var it = ITEMS[ids[i]];
      if (!it) continue;
      out.push({
        id: ids[i],
        type: it.type,
        name: t('item_' + ids[i] + '_t')
      });
    }
    return out;
  }

  function rewardSpins(a) {
    return (a.reward && a.reward.spins) || 0;
  }

  function rewardPts(a) {
    return TIER_PTS[a.tier] || 5;
  }

  /* Иконка 48x48 внутри чипа: у типов предметов свои глифы. */
  function chipIcon(name) {
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[name] || P.star) + '</svg>';
  }

  /* Чипы награды для карточки. Скрытые (ещё не открытые) достижения
     показывают награду приглушённо — CSS гасит через .is-locked.
     onlyPts — для СКРЫТЫХ достижений: у них прячется и условие, а
     название предмета его выдаёт («Титул «Феникс»» = «пересиди
     просадку»). Поэтому у «???» оставляем только очки — как было до
     перехода на чипы, когда в углу стояло просто «+15 очков». */
  function rewardChips(a, onlyPts) {
    var chips = [];
    chips.push('<span class="rwc rwc--pts">' + chipIcon('star') +
      '<span>' + esc('+' + rewardPts(a) + ' ' + t('ach_pts_name')) + '</span></span>');
    if (!onlyPts) {
      var sp = rewardSpins(a);
      if (sp) {
        chips.push('<span class="rwc rwc--spin">' + chipIcon('wheel') +
          '<span>' + esc('+' + spinWord(sp)) + '</span></span>');
      }
      var items = rewardItems(a);
      for (var i = 0; i < items.length; i++) {
        var k = ITEM_KIND[items[i].type] || ITEM_KIND.frame;
        chips.push('<span class="rwc rwc--item">' + chipIcon(k.ico) +
          '<span>' + esc(t(k.word) + ' ' + quoteName(items[i].name)) + '</span></span>');
      }
    }
    var shown = chips.slice(0, CHIP_MAX);
    var rest = chips.length - shown.length;
    if (rest > 0) {
      shown.push('<span class="rwc rwc--more"><span>' + esc(t('ach_more', { n: rest })) + '</span></span>');
    }
    return '<span class="ach-rw">' + shown.join('') + '</span>';
  }

  function cardHtml(r, idx) {
    var a = r.a;
    var showHidden = a.hidden && !r.un;
    var title = showHidden ? t('ach_hidden_title') : t('ach_' + a.id + '_t');
    var desc = showHidden ? t('ach_hidden_desc') : t('ach_' + a.id + '_d');
    var cls = 'ach-card' + (r.un ? ' is-open' : ' is-locked') + (a.hidden && !r.un ? ' is-hidden' : '');
    /* Очки больше не дублируются справа внизу: они уже в чипе награды
       под описанием. В нижней строке осталось только состояние —
       дата получения либо полоска прогресса с числами. */
    var prog = '';
    if (r.un) {
      prog = '<span class="ach-subrow"><span class="ach-got">' + esc(achDate(S.ach[a.id])) + '</span>' +
        '<span class="ach-state muted">' + esc(t('ach_done')) + '</span></span>';
    } else if (r.p && r.p.goal > 0) {
      var pct = Math.round(r.ratio * 100);
      prog = '<span class="ach-prow"><span class="ach-bar" aria-hidden="true"><u style="width:' + pct + '%"></u></span>' +
        '<span class="ach-pct mono" aria-hidden="true">' + pct + '%</span></span>' +
        '<span class="ach-subrow"><span class="ach-nums mono">' + esc(fmtProg(r.p)) + '</span></span>';
    }
    var icoHtml = achIconHtml(a, r.un);
    /* Серии делят иконку: уровень несёт римская цифра в углу.
       Это прогресс серии, а не класс — остаётся. */
    var num = (!showHidden && a.series && ROMAN[a.level]) ?
      '<u class="ach-num" aria-hidden="true">' + ROMAN[a.level] + '</u>' : '';
    /* Обычный <div>, а НЕ <button>. Раньше тап по карточке открывал модалку
       с достижением целиком — из-за этого палились скрытые (их название и
       условие должны читаться только после открытия) и, кроме того, это
       ничего не давало игроку. Теперь модалка — только момент ВЫДАЧИ, а
       карточка просто показывает состояние. Кнопка, которая ничего не
       делает, обманывает и мышь (cursor: pointer), и скринридер.
       data-ach остаётся: по нему jumpToAch находит карточку для вспышки.
       --d несёт задержку каскада: считаем в JS по индексу карточки,
       потому что nth-child в #ach-list считает ещё и заголовки секций. */
    return '<div class="' + cls + '" style="--d:' + achStaggerMs(idx || 0) + 'ms"' +
      ' data-ach="' + a.id + '">' +
      '<span class="ach-ico">' + icoHtml + num + '</span>' +
      '<span class="ach-main"><b>' + esc(title) + '</b><i>' + esc(desc) + '</i>' +
      rewardChips(a, showHidden) + prog + '</span>' +
      '</div>';
  }

  function drawRing() {
    try {
      var cv = document.getElementById('ach-ring');
      if (!cv || typeof drawDonut !== 'function') return;
      var frac = REG.length ? unlockedCount() / REG.length : 0;
      var col = '#e9b640';
      try {
        col = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || col;
      } catch (e) { dbg('ach:drawRing', e); }
      drawDonut(cv, [{ share: Math.max(0.0008, frac), color: col }], !reduced());
      setText('ach-ring-txt', Math.round(frac * 100) + '%');
    } catch (e) { dbg('ach:drawRing', e); }
  }

  /* Порядок статусных чипов — как в референсе: Все / С наградой /
     В процессе / Получено / Скрытые. */
  var STATUS_ORDER = ['all', 'reward', 'doing', 'got', 'hidden'];

  /* Подходит ли достижение под статусный фильтр. Вынесено отдельно от
     renderList, потому что тем же предикатом считаются счётчики на
     чипах: две копии условия разошлись бы, и цифра на чипе перестала
     бы совпадать со списком. */
  function statusMatch(r, st) {
    if (st === 'got') return !!r.un;
    if (st === 'doing') return !r.un && r.ratio > 0;
    if (st === 'hidden') return !!r.a.hidden && !r.un;
    /* «С наградой» — даёт прокрутку или предмет. Очки есть у всех,
       поэтому по ним не фильтруем: иначе это был бы «Все».
       Спрашиваем те же хелперы, что рисуют чипы награды, а не поля
       напрямую: предметы живут в a.items (собирается из ITEMS по
       src.ach), и проверка `reward.items` — мёртвая ветка. На ней чип
       показывал 16 при 36 карточках с наградой. См. AUDIT-2026-09-16. */
    if (st === 'reward') {
      return rewardSpins(r.a) > 0 || rewardItems(r.a).length > 0;
    }
    /* «Все» = ровно то, что показывает список по умолчанию. Единственная
       группа, которую он прячет, — скрытые И без прогресса (они за
       чипом «Скрытые»). Скрытые С прогрессом остаются: они видны в
       «В процессе» как «???» с полоской, поэтому обязаны попадать и в
       «Все», иначе счётчик «В процессе» оказывался больше «Все».
       Это уже ловил замером: в категории «Мастерство» было doing=15
       при all=14. */
    return !(r.a.hidden && !r.un && !(r.ratio > 0));
  }

  /* Счётчики на чипах. Считаются ПО ТЕКУЩЕЙ КАТЕГОРИИ — так цифра на
     чипе всегда совпадает с тем, что игрок увидит после тапа. */
  function renderFilterCounts(rows) {
    try {
      var counts = { all: 0, reward: 0, doing: 0, got: 0, hidden: 0 };
      for (var i = 0; i < rows.length; i++) {
        for (var k = 0; k < STATUS_ORDER.length; k++) {
          var st = STATUS_ORDER[k];
          if (statusMatch(rows[i], st)) counts[st]++;
        }
      }
      var els = document.querySelectorAll('#ach-filters2 [data-cnt]');
      for (var j = 0; j < els.length; j++) {
        var key = els[j].getAttribute('data-cnt');
        var v = counts[key] || 0;
        if (els[j].textContent !== String(v)) els[j].textContent = v;
      }
    } catch (e) { dbg('ach:renderFilterCounts', e); }
  }

  function syncFilters() {
    var sb = document.querySelectorAll('#ach-filters2 [data-sf]');
    for (var j = 0; j < sb.length; j++) {
      (function (b) {
        var on3 = b.getAttribute('data-sf') === statusFilter;
        b.classList.toggle('on', on3);
        b.setAttribute('aria-selected', on3 ? 'true' : 'false');
      })(sb[j]);
    }
  }

  /* ---------- Витрина: рамки, свечи, титулы, темы ---------- */
  var VITRINE_CATS = ['frames', 'candles', 'titles', 'themes'];

  /* Элементы витрины: {id, type, name, owned, equipped, lockedText}.
     Темы-категория включает акцент и флаг (всё оформление профиля). */
  /* Прогресс до источника предмета для закрытых карточек (бары как
     в референсе). В витрине показываем и для скрытых достижений:
     название источника и так видно, а бар мотивирует (в списке
     достижений условие по-прежнему ???). */
  function vitrineProg(it) {
    try {
      if (it.src.ach) {
        var ba = byId(it.src.ach);
        if (!ba || !ba.progress) return null;
        var p = ba.progress(st(), {}, tickCtx());
        if (!p || !(p.goal > 0)) return null;
        var ratio = Math.max(0, Math.min(1, p.cur / p.goal));
        return { txt: fmtProg(p), pct: Math.round(ratio * 100), ratio: ratio };
      }
      if (it.src.pass) {
        var lv = (typeof Quests !== 'undefined' && Quests.level) ? Quests.level() : 0;
        var pr = Math.max(0, Math.min(1, lv / it.src.pass));
        return { txt: Math.min(lv, it.src.pass) + ' / ' + it.src.pass, pct: Math.round(pr * 100), ratio: pr };
      }
      if (it.src.rank) {
        var need = 0;
        for (var i = 0; i < RANKS.length; i++) {
          if (RANKS[i].id === it.src.rank) need = RANKS[i].pts;
        }
        if (!(need > 0)) return null;
        var pts = Number(S.achPts) || 0;
        var rr = Math.max(0, Math.min(1, pts / need));
        return { txt: Math.min(pts, need) + ' / ' + need + ' ' + t('ach_pts_name'),
          pct: Math.round(rr * 100), ratio: rr };
      }
    } catch (e) { dbg('ach:vitrineProg', e); }
    return null;
  }

  function vitrineList(cat) {
    var out = [];
    if (!on()) return out;
    ensureInv();
    /* cat === 'all' — сводный список по всем категориям (кнопка
       «Показать все» в шапке витрины). */
    var all = (cat === 'all');
    var ids = Object.keys(ITEMS);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      /* Флаг языка в витрине не показываем (только темы/рамки/свечи/титулы). */
      if (id === 'flag_lang') continue;
      var it = ITEMS[id];
      var c = it.type === 'frame' ? 'frames'
        : it.type === 'candles' ? 'candles'
        : it.type === 'title' ? 'titles' : 'themes';
      if (!all && c !== cat) continue;
      var owned = itemOwned(id);
      var eq = isEquipped(id);
      var src = '';
      var srcName = '';
      var srcHidden = false;
      var rankNeed = 0;
      if (!owned) {
        if (it.src.ach) {
          var ba = byId(it.src.ach);
          /* Скрытое достижение НЕ называем. В списке оно стоит как «???» +
             «Условие скрыто», а витрина выдавала его имя прямым текстом:
             «Достижение «Полиглот»» или подписью полосы прогресса
             («Кормилец биржи»). Прогресс тоже прячем — его подпись и есть
             имя достижения. */
          srcHidden = !!(ba && ba.hidden && !S.ach[ba.id]);
          if (srcHidden) {
            src = t('ach_vit_hidden');
          } else {
            srcName = ba ? t('ach_' + ba.id + '_t') : it.src.ach;
            src = t('ach_vit_need', { name: srcName });
          }
        } else if (it.src.pass) {
          src = t(it.src.prem ? 'qp_vit_prem' : 'qp_vit_free', { n: it.src.pass });
        } else if (it.src.rank) {
          src = t('ach_vit_rank', { name: t('rank_' + it.src.rank) });
          for (var ri = 0; ri < RANKS.length; ri++) {
            if (RANKS[ri].id === it.src.rank) rankNeed = RANKS[ri].pts;
          }
        }
      }
      out.push({ id: id, type: it.type, grp: c, name: t('item_' + id + '_t'),
        owned: owned, equipped: eq, lockedText: src, srcName: srcName,
        srcHidden: srcHidden,
        rankId: it.src.rank || null, rankNeed: rankNeed,
        prog: (owned || srcHidden) ? null : vitrineProg(it),
        srcAch: it.src.ach || null });
    }
    /* Стандартные свечи всегда есть — первой строкой. */
    if (cat === 'candles' || all) {
      out.unshift({ id: 'candles_std', type: 'candles', grp: 'candles', name: t('item_candles_std_t'),
        owned: true, equipped: (S.equip.candles || 'std') === 'std', lockedText: '', prog: null, srcAch: null });
    }
    return out;
  }

  function isEquipped(id) {
    ensureInv();
    var it = ITEMS[id];
    if (!it) return id === 'candles_std' && (S.equip.candles || 'std') === 'std';
    if (it.type === 'title') return S.equip.title === id;
    if (it.type === 'frame') return S.equip.frame === id;
    if (it.type === 'candles') return (S.equip.candles || 'std') === id.replace('candles_', '');
    if (it.type === 'accent') return S.equip.accent === 'neo';
    if (it.type === 'flag') return !!S.equip.flag;
    /* Тема: ключ темы — это id без префикса (theme_dawn → 'dawn').
       Раньше здесь стояло жёсткое 'midnight', и надетые Рассвет/
       Карбон/Пепел не подсвечивались как надетые. */
    if (it.type === 'theme') return S.theme === id.replace('theme_', '');
    return false;
  }


  /* Превью витрины: рамки — кольцо, свечи — мини-график из 5 баров
     с фитилями, темы — телефон с графиком в палитре, титулы — пилюля
     с названием. */
  var VIT_BARS = [34, 22, 40, 26, 46];
  var VIT_BARS_MINI = [30, 20, 36, 24, 42];
  function vitChartBars(cls, mini) {
    var hs = mini ? VIT_BARS_MINI : VIT_BARS;
    var h = '';
    for (var i = 0; i < hs.length; i++) {
      h += '<i style="height:' + hs[i] + 'px"></i>';
    }
    return '<span class="vit-chart ' + cls + (mini ? ' mini' : '') + '" aria-hidden="true">' + h + '</span>';
  }
  /* Палитра мини-графика под каждую тему — чтобы превью в витрине
     различались не только фоном телефона. */
  var THEME_CHART = { midnight: 'cd-blue', dawn: 'cd-dusk', carbon: 'cd-minimal', ash: 'cd-scarlet' };
  /* Макет «телефона» для превью тем и акцентов: статус-бар, мини-график,
     чипы, навигация. Вынесено из vitrineSwatch — ветки темы и акцента
     отличались только двумя классами. */
  function phoneSwatch(cls, chartCls) {
    return '<span class="vit-phone ' + cls + '" aria-hidden="true">' +
      '<span class="vit-ph-top"><i class="dot"></i><i class="ln"></i><i class="ln s"></i><span class="sp"></span><i class="bell"></i></span>' +
      vitChartBars(chartCls, true) +
      '<span class="vit-ph-row"><span class="vit-ph-chip">$</span><span class="vit-ph-chip">%</span></span>' +
      '<span class="vit-ph-nav"><i></i><i></i><i></i></span></span>';
  }
  function vitrineSwatch(id, name) {
    if (id && id.indexOf('preset:') === 0) {
      var pc = ACCENTS[id.slice(7)] || '#e9b640';
      return '<span class="vit-swatch" style="background:' + pc + '" aria-hidden="true"></span>';
    }
    var it = ITEMS[id];
    /* «Стандарт» — не предмет инвентаря: в ITEMS его нет, и без этой
       ветки превью падало в пустой кружок-заглушку. Рисуем те же
       свечи, что и на графике, — в цветах темы. */
    if (id === 'candles_std') return vitChartBars('cd-std');
    if (!it) return '<span class="vit-swatch vit-swatch--std" aria-hidden="true"></span>';
    if (it.type === 'frame') {
      return '<span class="vit-frame fr-' + id.replace('frame_', '') + '" aria-hidden="true"></span>';
    }
    if (it.type === 'candles') {
      return vitChartBars('cd-' + id.replace('candles_', ''));
    }
    if (it.type === 'title') {
      return '<span class="vit-title-pill" aria-hidden="true">' + esc(name || '') + '</span>';
    }
    if (it.type === 'theme') {
      /* Своя палитра мини-графика под каждую тему: «Рассвет» фиолетовый,
         «Карбон» контурный, «Пепел» багровый. Один cd-blue на все темы
         читался как одна и та же тема в четырёх рамках. */
      var tkey = id.replace('theme_', '');
      return phoneSwatch('ph-' + tkey, THEME_CHART[tkey] || 'cd-std');
    }
    if (it.type === 'accent') {
      return phoneSwatch('ph-neo', 'cd-neo');
    }
    var flagTxt = 'RU';
    try { flagTxt = ((typeof LANG !== 'undefined' && LANG) || 'ru').toUpperCase(); } catch (e) { dbg('ach:vitrineSwatch', e); }
    return '<span class="vit-phone ph-flag" aria-hidden="true">' +
      '<span class="vit-ph-flag">' + esc(flagTxt) + '</span>' +
      '<span class="vit-ph-row"><span class="vit-ph-chip">$</span><span class="vit-ph-chip">%</span></span>' +
      '<span class="vit-ph-nav"><i></i><i></i><i></i></span></span>';
  }

  /* Задержка каскада для i-й карточки: НЕРОВНЫЙ шаг 30–62 мс.
   Ровные 45 мс подряд читаются сеткой (концепт §4.1), а nth-child в CSS
   не тянет длинные категории — после десятой карточки все появлялись
   одним куском. Считаем детерминированно (без Math.random): иначе
   список дрожал бы по-разному при каждом рендере.
   Потолок 620 мс — дальше волна уже не читается, только тормозит. */
  function staggerMs(i) {
    var t = 0;
    for (var k = 0; k < i; k++) t += 30 + ((k * 37) % 33);
    return Math.min(t, 620);
  }

  /* Задержка каскада для карточек ДОСТИЖЕНИЙ. Отдельно от staggerMs
     витрины: там шаг 30–62 мс и потолок 620 мс рассчитаны на 20+
     предметов, а карточек 40 и они мельче — такой разгон читался как
     «список грузится». Шаг 22–46 мс, потолок 420 мс.
     Считается в JS, а не nth-child: в #ach-list вперемешку лежат
     заголовки секций .ach-sec, и nth-child их считал как карточки —
     четвёртая карточка получала задержку шестой, а потолок наступал
     на пятой. См. AUDIT-2026-09-16. */
  function achStaggerMs(i) {
    var t = 0;
    for (var k = 0; k < i; k++) t += 22 + ((k * 41) % 25);
    return Math.min(t, 420);
  }

  /* animate — влёт карточек каскадом. Только при входе на вкладку и
     смене категории: при надевании предмета список тоже пересобирается
     (innerHTML), и без флага весь он влетал заново — выглядело как
     «витрина перезагрузилась». */
  function renderVitrine(animate) {
    if (!on()) return;
    var box = document.getElementById('vitrine-list');
    if (!box) return;
    var rows = vitrineList(vitrineCat);
    /* Акцентные пресеты — в конце секции тем (выбор — перк ранга). */
    if (vitrineCat === 'themes' && rankPerks().accent) {
      var presets = ['gold', 'ocean', 'violet', 'mint'];
      for (var pi = 0; pi < presets.length; pi++) {
        rows.push({ id: 'preset:' + presets[pi], type: 'accent', grp: 'themes', preset: presets[pi],
          name: t('accent_' + presets[pi]), owned: true,
          equipped: (S.equip.accent || 'gold') === presets[pi] ||
            (!S.equip.accent && presets[pi] === 'gold'),
          lockedText: '', prog: null, srcAch: null });
      }
    }
    var html = '';
    /* Подсказка категории: что вообще делает эта вещь. Без неё «Рамка»
       и «Тема» в витрине выглядят как одинаковые квадратики. */
    var hintKey = 'vit_hint_' + vitrineCat;
    var hintTxt = (vitrineCat === 'all') ? '' : t(hintKey);
    if (hintTxt && hintTxt !== hintKey) {
      html += '<div class="vit-hint">' + esc(hintTxt) + '</div>';
    }
    for (var i = 0; i < rows.length; i++) {
      html += vitrineCard(rows[i], i);
    }
    /* Титулы — единой панелью с разделителями, как в референсе. */
    if (vitrineCat === 'titles' && html) {
      html = '<div class="vit-tlist">' + html + '</div>';
    }
    box.className = 'vit-grid vit-grid--' + vitrineCat + (animate ? ' vit-anim' : '');
    /* Пустое состояние вместо голого блока (на практике — если модуль
       отвязали от реестра, в норме тут всегда есть предметы). */
    if (!html) {
      box.innerHTML = '<div class="vit-empty muted small">' + esc(t('ach_vit_empty')) + '</div>';
    } else {
      box.innerHTML = html;
    }
    /* Счётчик «N из M» у вкладок и превью-баннер титулов. */
    try {
      var ownedN = 0;
      for (var oi = 0; oi < rows.length; oi++) if (rows[oi].owned) ownedN++;
      var cnt = document.getElementById('vitrine-count');
      if (cnt) cnt.textContent = t('ach_vit_worn_count', { o: ownedN, m: rows.length });
    } catch (e) { dbg('ach:renderVitrine', e); }
    try {
      var pv = document.getElementById('vitrine-preview');
      if (pv) pv.innerHTML = (vitrineCat === 'titles') ? vitrinePreviewBar() : '';
    } catch (e) { dbg('ach:renderVitrine', e); }
    var fb = document.querySelectorAll('#vitrine-filters [data-vf]');
    for (var j = 0; j < fb.length; j++) {
      (function (b) {
        /* В сводном виде ('all') активного чипа нет — это не категория. */
        var on2 = vitrineCat !== 'all' && b.getAttribute('data-vf') === vitrineCat;
        b.classList.toggle('active', on2);
        b.setAttribute('aria-selected', on2 ? 'true' : 'false');
      })(fb[j]);
    }
  }

  /* Баннер «так тебя увидят в рейтинге» над списком титулов. */
  function vitrinePreviewBar() {
    var nick = '—';
    try { nick = S.name || nick; } catch (e) { dbg('ach:vitrinePreviewBar', e); }
    var tt = null;
    try { tt = equippedTitle(); } catch (e) { dbg('ach:vitrinePreviewBar', e); }
    var pill = '';
    if (tt) {
      try { pill = '<span class="vit-pb-title">' + esc(t('item_' + tt + '_t')) + '</span>'; } catch (e) { dbg('ach:vitrinePreviewBar', e); }
    }
    var av = esc(String(nick).charAt(0).toUpperCase() || '—');
    return '<div class="vit-previewbar" aria-hidden="true">' +
      '<span class="vit-pb-ava">' + av + '</span><b>' + esc(nick) + '</b>' + pill + '</div>' +
      '<div class="vit-previewcap muted small">' + esc(t('ach_vit_preview_cap')) + '</div>';
  }

  /* Замок для закрытых карточек витрины (свой, не из P — там его нет). */
  var VIT_LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function vitLockInline() {
    return '<span class="vit-lock-inline" aria-hidden="true">' + VIT_LOCK_SVG + '</span>';
  }

  /* Строка «🔒 текст» для закрытых (замок инлайн слева, как в референсе). */
  /* Здесь была vitNeedLine(txt) — дублировала vitLockedFoot, который и
     вызывается из карточек. Убрана в AUDIT-2026-09-16. */

  function vitrineCard(r, idx) {
    var cls = 'vit-card' + (r.owned ? ' is-open' : ' is-locked') + ' vit-card--' + (r.grp || 'frames');
    if (r.equipped) cls += ' is-worn';
    if (r.type === 'title') return vitrineTitleRow(r, cls, idx);
    if (r.grp === 'candles') return vitrineCandleCard(r, cls, idx);
    var aria = r.name + '. ' + (r.owned ? (r.equipped ? t('ach_vit_worn') : t('ach_vit_wear')) : r.lockedText);
    var badge = '';
    if (r.equipped) {
      badge = '<span class="vit-worn" aria-hidden="true">' + esc(t('ach_vit_worn')) + '</span>';
    } else if (!r.owned) {
      badge = '<span class="vit-lock" aria-hidden="true">' + VIT_LOCK_SVG + '</span>';
    }
    var foot = '';
    if (r.equipped) {
      foot = '<span class="vit-sub worn">' + esc(t('ach_vit_worn')) + '</span>';
    } else if (r.owned) {
      foot = '<button type="button" class="vit-cta" data-wear="' + esc(r.id) + '">' + esc(t('ach_vit_wear')) + '</button>';
    } else {
      foot = vitLockedFoot(r);
    }
    return '<div class="' + cls + '" style="--d:' + staggerMs(idx || 0) + 'ms" role="listitem" tabindex="0" data-vit="' + esc(r.id) + '" aria-label="' + esc(aria) + '">' +
      badge +
      '<b class="vit-name">' + esc(r.name) + '</b>' +
      '<span class="vit-preview">' + vitrineSwatch(r.id, r.name) + '</span>' +
      '<div class="vit-foot">' + foot + '</div>' +
      '</div>';
  }

  /* Свечи как в референсе: шапка «имя — статус», график, низ —
     кнопка / «🔒 источник … cur/goal» + бар / «🔒 Достижение». */
  function vitrineCandleCard(r, cls, idx) {
    var aria = r.name + '. ' + (r.owned ? (r.equipped ? t('ach_vit_worn') : t('ach_vit_wear')) : r.lockedText);
    var badge = '';
    if (r.equipped) {
      badge = '<span class="vit-worn" aria-hidden="true">' + esc(t('ach_vit_worn')) + '</span>';
    } else if (!r.owned) {
      badge = '<span class="vit-lock" aria-hidden="true">' + VIT_LOCK_SVG + '</span>';
    }
    var foot = '';
    if (!r.equipped) {
      if (r.owned) {
        foot = '<button type="button" class="vit-cta" data-wear="' + esc(r.id) + '">' + esc(t('ach_vit_wear')) + '</button>';
      } else {
        foot = vitLockedFoot(r);
      }
    }
    return '<div class="' + cls + '" style="--d:' + staggerMs(idx || 0) + 'ms" role="listitem" tabindex="0" data-vit="' + esc(r.id) + '" aria-label="' + esc(aria) + '">' +
      badge +
      '<b class="vit-name">' + esc(r.name) + '</b>' +
      '<span class="vit-preview">' + vitrineSwatch(r.id, r.name) + '</span>' +
      '<div class="vit-foot">' + foot + '</div>' +
      '</div>';
  }

  /* Подпись закрытой карточки: замок + «Открой “X”». Полосы прогресса
     здесь нет намеренно — в витрине она превращала карточки в разной
     высоты «приборную панель», а полный прогресс и так виден на экране
     достижений. */
  function vitLockedFoot(r) {
    /* Источник — скрытое достижение: имя не показываем (см. vitrineList). */
    if (r.srcHidden) {
      return '<span class="vit-unlock">' + vitLockInline() +
        '<span>' + esc(t('ach_vit_hidden')) + '</span></span>';
    }
    var hint = r.srcName ? t('ach_vit_unlock', { name: r.srcName }) : r.lockedText;
    if (!hint) return '';
    return '<span class="vit-unlock">' + vitLockInline() +
      '<span>' + esc(hint) + '</span></span>';
  }

  /* Здесь была vitrineProgHtml(r, pctRight) — ни одного вызова, и она
     дублировала инлайн-разметку прогресса в vitrineTitleRow. Убрана
     в AUDIT-2026-09-16. */

  /* Титулы — строки как в референсе: пилюля, под ней источник
     («Достижение «Х»» / «Ранг Кит · 1280 очков» / «короткое … cur/goal»
     + бар), справа статус. */
  /* Золотая галочка в кружке — отмечает надетый титул. У карточек роль
     отметки играет подсветка рамки, но строка титула плоская, и без
     галочки «надето» приходилось искать глазами в тексте справа. */
  var VIT_CHECK = '<span class="vit-tmark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M5 13l4 4 10-10"/></svg></span>';

  /* ---- Иконки и оттенки титулов (из референса titles.html) ----
     В референсе у каждого титула своя пиктограмма в квадрате — строка от
     этого читается заметно лучше текстового чипа, а сам чип при 19 титулах
     выглядел однообразно. Пути взяты оттуда как есть. */
  var TICON_P = {
    medal: '<circle cx="24" cy="28" r="9"/><path d="M24 24l1.2 2.6 2.8.3-2 2 .5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-2 2.8-.3z"/><path d="M18 20L12 8M30 20l6-12"/>',
    dip: '<circle cx="24" cy="24" r="15"/><path d="M24 15v12l-6-4M24 27l6-7"/>',
    timer: '<circle cx="24" cy="26" r="13"/><path d="M24 20v7l5 3M20 6h8"/>',
    globe: '<circle cx="24" cy="24" r="14"/><path d="M10 24h28M24 10c-5 5-5 23 0 28 5-5 5-23 0-28z"/>',
    target: '<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2"/>',
    night: '<path d="M30 26A11 11 0 1 1 19 9a8.5 8.5 0 0 0 11 17z"/><path d="M35 10l.8 2.2L38 13l-2.2.8L35 16l-.8-2.2L32 13l2.2-.8z"/>',
    eye: '<path d="M6 24s6-9 18-9 18 9 18 9-6 9-18 9S6 24 6 24z"/><circle cx="24" cy="24" r="4"/>',
    bag: '<path d="M16 16h16l2 24H14z"/><path d="M20 16a4 4 0 0 1 8 0"/>',
    rise: '<path d="M8 34c6 0 6-8 12-8s5 6 10 6 6-10 10-10"/><path d="M32 14h8v8"/>',
    receipt: '<path d="M14 6h20v36l-4-3-3 3-3-3-3 3-4-3z"/><path d="M19 16h10M19 22h10"/>',
    shield: '<path d="M24 6l12 5v9c0 8-5 13-12 16-7-3-12-8-12-16v-9z"/><path d="M18 24l4 4 8-9"/>',
    x2: '<path d="M15 15l12 18M27 15L15 33"/><circle cx="33" cy="33" r="6"/><path d="M31 33h4M33 31v4"/>',
    flame: '<path d="M24 40c-6 0-10-4-10-9 0-4 2-7 4-10 1 2 2 3 4 3-.5-4 1-9 5-12-.5 5 7 8 7 16 0 7-4 12-10 12z"/>',
    vault: '<rect x="8" y="12" width="32" height="24" rx="3"/><circle cx="24" cy="24" r="6"/><path d="M24 18v-3M24 33v-3M18 24h-3M33 24h-3"/>',
    bank: '<path d="M8 18l16-9 16 9"/><path d="M11 18v14M19 18v14M29 18v14M37 18v14"/><path d="M8 36h32"/>',
    crown: '<path d="M10 34l-2-16 9 6 7-11 7 11 9-6-2 16z"/><path d="M10 39h28"/>',
    coins: '<ellipse cx="24" cy="14" rx="10" ry="4"/><path d="M14 14v10c0 2.2 4.5 4 10 4s10-1.8 10-4V14"/><path d="M14 24c0 2.2 4.5 4 10 4s10-1.8 10-4"/>',
    gem: '<path d="M14 10h20l6 8-16 20L8 18z"/><path d="M8 18h32M24 38L19 18l5-8 5 8z"/>',
    bolt: '<path d="M26 6L12 27h9l-1 15 14-21h-9z"/>'
  };
  var TICON = {
    title_rookie: 'medal', title_hunter: 'dip', title_patient: 'timer',
    title_polyglot: 'globe', title_sniper: 'target', title_resident: 'night',
    title_watcher: 'eye', title_collector: 'bag', title_peak: 'rise',
    title_editor: 'receipt', title_veteran: 'shield', title_double: 'x2',
    title_allin: 'flame', title_steel: 'vault', title_sponsor: 'bank',
    title_champion: 'crown', title_phoenix: 'bolt', title_millionaire: 'coins',
    title_whale: 'gem',
    title_bp_regular: 'timer', title_bp_silver: 'medal', title_bp_marathon: 'bolt', title_bp_500: 'flame',
    title_bp_bull: 'rise', title_bp_shark: 'target', title_bp_oracle: 'eye', title_bp_tycoon: 'coins',
    title_bp_icon: 'gem', title_bp_legend: 'crown'
  };
  /* Оттенки ТОЛЬКО из золотой семьи. В референсе у каждого титула свой
     цвет — лаймовый, синий, бирюзовый, фиолетовый, — и на золотой палитре
     проекта это читалось как чужая радуга. Разнообразие оставил, но внутри
     палитры: от светлого шампанского до тёмной бронзы. Номер оттенка
     уходит в разметку как --t, CSS берёт из него цвет. */
  /* Цвет отдаём прямо в разметку, а не номером оттенка: подбирать его
     CSS-селектором по подстроке inline-стиля — хрупко (сломается от любой
     перестановки переменных в style). */
  var TSHADE = {
    title_rookie: '#ffe6a8', title_hunter: '#f0d79a', title_patient: '#e9b640',
    title_polyglot: '#f0d79a', title_sniper: '#d9a94c', title_resident: '#ffe6a8',
    title_watcher: '#e9b640', title_collector: '#c8922c', title_peak: '#f0d79a',
    title_editor: '#b8792f', title_veteran: '#e9b640', title_double: '#d9a94c',
    title_allin: '#c8922c', title_steel: '#b8792f', title_sponsor: '#c8922c',
    title_champion: '#d9a94c', title_phoenix: '#c8922c', title_millionaire: '#ffe6a8',
    title_whale: '#e9b640'
  };

  function titleMedal(id) {
    var key = TICON[id] || 'medal';
    return '<span class="vit-med" aria-hidden="true">' +
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + (TICON_P[key] || TICON_P.medal) + '</svg></span>';
  }

  function vitrineTitleRow(r, cls, idx) {
    var aria = r.name + '. ' + (r.owned ? (r.equipped ? t('ach_vit_worn') : t('ach_vit_wear')) : r.lockedText);
    var right = '';
    if (r.equipped) {
      right = VIT_CHECK + '<span class="vit-worn vit-worn--static" aria-hidden="true">' + esc(t('ach_vit_worn')) + '</span>';
    } else if (r.owned) {
      right = '<button type="button" class="vit-cta" data-wear="' + esc(r.id) + '">' + esc(t('ach_vit_wear')) + '</button>';
    } else {
      right = '<span class="vit-lock vit-lock--static" aria-hidden="true">' + VIT_LOCK_SVG + '</span>';
    }
    var sub = '';
    if (!r.owned) {
      /* Скрытый источник — нейтральная подпись вместо имени достижения. */
      if (r.srcHidden) {
        sub = '<i>' + esc(t('ach_vit_hidden')) + '</i>';
      } else if (r.prog && r.srcAch) {
        sub = '<span class="vit-prog" aria-hidden="true">' +
          '<span class="vit-prog-row"><span>' + esc(r.srcName || r.lockedText) + '</span>' +
          '<span class="vit-cur mono">' + esc(r.prog.txt) + '</span></span>' +
          '<span class="vit-bar"><u style="width:' + r.prog.pct + '%"></u></span></span>';
      } else if (r.srcAch) {
        sub = '<i>' + esc(t('ach_vit_need', { name: r.srcName || r.lockedText })) + '</i>';
      } else if (r.rankId && r.rankNeed > 0) {
        sub = '<i>' + esc(t('ach_vit_rankneed', {
          name: t('ach_vit_rankword') + ' ' + t('rank_' + r.rankId),
          n: r.rankNeed, p: t('ach_pts_name')
        })) + '</i>';
      } else if (r.lockedText) {
        sub = '<i>' + esc(r.lockedText) + '</i>';
      }
    }
    return '<div class="' + cls + ' vit-trow vit-trow--title" style="--d:' + staggerMs(idx || 0) + 'ms;--tcol:' + (TSHADE[r.id] || '#e9b640') + '" role="listitem" tabindex="0" data-vit="' + esc(r.id) + '" aria-label="' + esc(aria) + '">' +
      titleMedal(r.id) +
      '<span class="vit-trow-left">' + vitrineSwatch(r.id, r.name) + sub + '</span>' +
      '<span class="vit-trow-right">' + right + '</span>' +
      '</div>';
  }

  /* Переход из витрины на карточку достижения-источника. */
  function jumpToAch(achId) {
    if (!on() || !achId) return;
    statusFilter = 'all';
    try { renderList(); } catch (e) { dbg('ach:jumpToAch', e); }
    try { showScreen('scr-ach', 'right'); } catch (e) { dbg('ach:jumpToAch', e); }
    if (typeof V3Ach !== 'undefined' && V3Ach.jump) { try { V3Ach.jump(achId); return; } catch (e) { dbg('ach:v3jump', e); } }
    setTimeout(function () {
      try {
        var box = document.getElementById('ach-list');
        if (!box) return;
        var el = box.querySelector('[data-ach="' + achId + '"]');
        if (!el) return;
        el.scrollIntoView({ block: 'center' });
        el.classList.add('ach-flash');
        setTimeout(function () { el.classList.remove('ach-flash'); }, 1400);
      } catch (e) { dbg('ach:jumpToAch', e); }
    }, 350);
  }

  function openScreen() {
    if (!on()) return;
    try {
      st().achSeen = unlockedCount();
      saveState(true);
    } catch (e) { dbg('ach:openScreen', e); }
    renderRow();
    renderList();
    showScreen('scr-ach', 'right');
  }

  function closeScreen() {
    setTab('profile', true);
    showScreen('app-main', 'left');
  }

  /* ---------- app:open: ночь, языки, смена суток ---------- */
  function onAppOpen() {
    if (!on()) return;
    try {
      var s = st();
      var now = new Date();
      var h = now.getHours();
      var day = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
      if (h >= 3 && h < 5 && s.nightLast !== day) {
        s.nightLast = day;
        s.sessionsNight = (Number(s.sessionsNight) || 0) + 1;
      }
      var lg = (typeof LANG !== 'undefined' && LANG) ? LANG : 'ru';
      if (!s.langs) s.langs = [];
      if (s.langs.indexOf(lg) < 0) s.langs.push(lg);
      /* Здесь эмитилось событие day:new, но на него не подписана ни
         одна запись реестра — мёртвый канал. Убран вместе с полем
         mem.lastDay, которое больше нигде не читалось. */
      try { saveState(true); } catch (e) { dbg('ach:onAppOpen', e); }
    } catch (e) { dbg('ach:onAppOpen', e); }
  }

  function init() {
    if (!ACH_ON || typeof S === 'undefined') return;
    /* Индекс реестра по событию — проверяем только подписанных. */
    BY_EVENT = {};
    for (var i = 0; i < REG.length; i++) {
      var evs = REG[i].on || [];
      for (var j = 0; j < evs.length; j++) {
        if (!BY_EVENT[evs[j]]) BY_EVENT[evs[j]] = [];
        BY_EVENT[evs[j]].push(REG[i]);
      }
    }
    /* Позиционные тесты (pos:true) гоняем только при открытых позициях —
       этого требует perf-бюджет тика; остальные дешёвые и идут всегда. */
    var ok = document.getElementById('ach-ok');
    if (ok && !ok.__achBound) {
      ok.__achBound = true;
      ok.onclick = function () {
        if (typeof V3Ach !== 'undefined' && V3Ach.onOk && V3Ach.onOk()) return;
        try { closeModal('modal-ach'); } catch (e) { dbg('ach:init', e); }
        showing = false;
        pump();
      };
    }
    /* Клик по фону модалки — то же, что «Закрыть»: иначе очередь
       показов стоит, пока не нажмут кнопку. */
    try {
      var mBack = document.querySelector('#modal-ach .backdrop');
      if (mBack && !mBack.__achBound) {
        mBack.__achBound = true;
        mBack.onclick = function () {
          try { closeModal('modal-ach'); } catch (e) { dbg('ach:init', e); }
          showing = false;
          pump();
        };
      }
    } catch (e) { dbg('ach:init', e); }
    var back = document.getElementById('ach-back');
    if (back && !back.__achBound) {
      back.__achBound = true;
      back.onclick = function () { closeScreen(); };
    }
    var row = document.getElementById('ach-row');
    if (row && !row.__achBound) {
      row.__achBound = true;
      row.onclick = function () { openScreen(); };
    }
    /* Тапа по карточке больше НЕТ. Он открывал модалку с достижением
       целиком, и это палило скрытые: у них в модалке видны настоящее
       название и условие, хотя в списке стоит «???». Плюс игроку это
       ничего не давало — состояние и награда и так на карточке.
       Модалка теперь открывается ТОЛЬКО моментом выдачи (см. pump). */
    var sb = document.querySelectorAll('#ach-filters2 [data-sf]');
    for (var g = 0; g < sb.length; g++) {
      (function (b) {
        if (b.__achBound) return;
        b.__achBound = true;
        b.onclick = function () {
          statusFilter = b.getAttribute('data-sf') || 'all';
          renderList();
        };
      })(sb[g]);
    }
    /* Воронка статуса заменена рядом чипов (см. разметку #ach-filters2):
       все статусы видны сразу и с счётчиками, а не угадываются тапом
       по кругу. */
    var vb = document.querySelectorAll('#vitrine-filters [data-vf]');
    for (var h = 0; h < vb.length; h++) {
      (function (b) {
        if (b.__achBound) return;
        b.__achBound = true;
        b.onclick = function () {
          vitrineCat = b.getAttribute('data-vf') || 'frames';
          renderVitrine(true);
        };
      })(vb[h]);
    }
    /* Клик/Enter по карточке витрины: своё — надеть/снять, чужое —
       прыжок на достижение-источник. */
    /* «Показать все»: сводный список по всем категориям. Повторный тап
       возвращает к рамкам — кнопка работает как переключатель, иначе
       из сводного вида некуда выйти (чипы снимают активность). */
    var allBtn = document.getElementById('vit-all');
    if (allBtn && !allBtn.__achBound) {
      allBtn.__achBound = true;
      allBtn.onclick = function () {
        vitrineCat = (vitrineCat === 'all') ? 'frames' : 'all';
        renderVitrine(true);
        try { FX.vibrate(6); } catch (e) { dbg('ach:init', e); }
      };
    }
    var vl = document.getElementById('vitrine-list');
    if (vl && !vl.__achBound) {
      vl.__achBound = true;
      var vitAct = function (ev) {
        var card = ev.target && ev.target.closest ? ev.target.closest('[data-vit]') : null;
        if (!card || !vl.contains(card)) return;
        var vid = card.getAttribute('data-vit');
        if (!vid) return;
        /* Кнопка «Надеть» — надеваем один раз, без прыжка к источнику.
           Карточка при этом тоже ловит клик (делегирование), поэтому
           после кнопки выходим сразу. */
        var wear = ev.target && ev.target.closest ? ev.target.closest('[data-wear]') : null;
        if (wear && vl.contains(wear)) {
          if (vid.indexOf('preset:') === 0) {
            if (equipItem(vid)) { renderVitrine(); }
          } else if (itemOwned(vid)) {
            /* Гейт именно itemOwned, а НЕ ITEMS[vid]: «Стандарт» —
               синтетическая строка витрины (см. vitrineList), её в
               ITEMS нет, и проверка по ITEMS делала кнопку мёртвой —
               вернуться к обычным свечам было нельзя. См. AUDIT-2026-09-16. */
            if (equipItem(vid)) { renderVitrine(); try { renderRow(); } catch (e) { dbg('ach:init', e); } }
          }
          return;
        }
        if (vid.indexOf('preset:') === 0) {
          if (equipItem(vid)) { renderVitrine(); }
          return;
        }
        var it = ITEMS[vid];
        if (itemOwned(vid)) {
          /* Ветка идёт ДО проверки it: «Стандарт» надевается, хотя
             записи в ITEMS у него нет (см. блок про data-wear выше). */
          if (equipItem(vid)) { renderVitrine(); try { renderRow(); } catch (e) { dbg('ach:init', e); } }
          return;
        }
        /* Не своё — прыгаем к достижению-источнику (пресеты акцента
           приходят запертыми и сюда не доходят: их гейт — rankPerks). */
        if (it && it.src.ach) jumpToAch(it.src.ach);
      };
      vl.addEventListener('click', vitAct);
      vl.addEventListener('keydown', function (ev) {
        /* Фокус на внутренней кнопке — работает она сама, карточку не дёргаем
           (иначе equip сработал бы дважды, а это тоггл). */
        if (ev.target && ev.target.closest && ev.target.closest('[data-wear]')) return;
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); vitAct(ev); }
      });
    }
    if (timer) { clearInterval(timer); timer = 0; }
    timer = setInterval(function () { tick(); }, 1000);
    renderRow();
  }

  return {
    emit: emit,
    onTrade: onTrade,
    init: init,
    tick: tick,
    migrate: migrate,
    feeRateFor: feeRateFor,
    feeTierInfo: feeTierInfo,
    rankPerks: rankPerks,
    tfAllowed: function () { return rankPerks().tfs; },
    /* Сработало уведомление (js/v3-alerts.js): те же отметки, что у
       уведомлённой лимитки, — на них держатся first_alert и «Двойной сигнал». */
    alertFired: function (assetId, price) {
      if (!on()) return;
      var s = st();
      s.alertsFired = (s.alertsFired || 0) + 1;
      s.prevAlertAt = s.lastAlertAt || 0;
      s.lastAlertAt = Date.now();
      emit('alert:fired', { assetId: assetId, price: price });
      try { saveState(false); } catch (e) { dbg('ach:alertFired', e); }
    },
    maxLimits: function () { return rankPerks().limits; },
    renderRow: renderRow,
    renderList: renderList,
    renderVitrine: renderVitrine,
    applyEquip: applyEquip,
    equippedTitle: equippedTitle,
    equippedFrame: equippedFrame,
    /* Нужен настройкам: кнопка «Полночь» показывается владельцам темы.
       Раньше там проверялся S.items напрямую — с выводом владения из
       достижения эта проверка разошлась бы с витриной. */
    itemOwned: itemOwned,
    backfillItems: backfillItems,
    candleStyle: candleStyle,
    openScreen: openScreen,
    jumpToAch: jumpToAch,
    refreshLang: refreshLang,
    modalClosed: modalClosed,
    accentColor: accentColor,
    flagSuffix: flagSuffix,
    /* Данные для слоя профиля (js/v3-profile.js): карточка достижений,
       «Почти готово» и витрина-примерочная. */
    v3p: {
      rows: cardSort, vitrineList: vitrineList, equipItem: equipItem,
      rankFor: rankFor, ranks: RANKS, items: ITEMS, skins: CANDLE_SKINS, accents: ACCENTS,
      achIcon: achIconHtml, byId: byId, total: function () { return REG.length; },
      unlocked: unlockedCount, unseen: unseenCount, pct: pctStr,
      prog: fmtProg, rankPerks: rankPerks,
      titleIcon: function (id) { return TICON_P[TICON[id]] || TICON_P.medal; }
    },
    isOn: function () { return ACH_ON && typeof S !== 'undefined'; }
    ,
    /* Только для слоя презентации js/v3-ach.js: чтение реестра и хелперы
       наград. Выдача, очки и комиссия остаются здесь. */
    v3: {
      REG: REG, ITEMS: ITEMS, ITEM_KIND: ITEM_KIND, TIER_PTS: TIER_PTS, FEE_TIERS: FEE_TIERS,
      RANKS: RANKS, ROMAN: ROMAN, ACH_IMG: ACH_IMG, byId: byId, icon: icon, chipIcon: chipIcon,
      rewardPts: rewardPts, rewardSpins: rewardSpins, rewardItems: rewardItems, rewardWeight: rewardWeight,
      cardSort: cardSort, statusMatch: statusMatch, fmtProg: fmtProg, achDate: achDate,
      quoteName: quoteName, spinWord: spinWord, feeTierInfo: feeTierInfo, feeRateFor: feeRateFor,
      rankFor: rankFor, pctStr: pctStr, equipItem: equipItem, itemOwned: itemOwned,
      isEquipped: isEquipped, vitrineSwatch: vitrineSwatch, unlockedCount: unlockedCount,
      renderFilterCounts: renderFilterCounts, syncFilters: syncFilters, renderVitrine: renderVitrine,
      filter: function () { return statusFilter; }
    }

    /* Убраны экспорты без единого внешнего вызова (проверено грепом по
       js/, index.html и tools/ — 0 ссылок). Сами функции внутри файла
       живут и вызываются, экспорт был просто шире, чем нужно:
         unlock, feeDiscount, rankFor, vitrineList, equipItem,
         closeScreen, list, count, total.
       tierPts — отдельно: это был ПОСЛЕДНИЙ публичный след удалённой
       тир-системы, и он не использовался вообще нигде. */
  };
})();
