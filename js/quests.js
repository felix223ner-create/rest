/* Задания и пропуск трейдера.

   Дневные (4), недельные (5) и месячные (5) задания дают доллары и опыт.
   Опыт двигает пропуск на 500 уровней: пять этапов по 100 уровней, и
   следующий этап открывается, когда пройден предыдущий. У каждого уровня
   бесплатная награда и награда премиум-дорожки (постоянная покупка
   trader_pass). Бустеры — расходники из инвентаря.

   Модуль грузится после main.js и слоёв v3-*: пользуется их глобалами и
   подключается через V3.after. Состояние — S.qst (см. fresh()). */
'use strict';

if (typeof SAVE_KEYS !== 'undefined' && SAVE_KEYS.indexOf('qst') < 0) SAVE_KEYS.push('qst');

var Quests = (function () {
  var PRODUCT = 'trader_pass';
  var MAX_LVL = 500, STAGE_LEN = 100, STAGES = 5;
  var STAGE_C = ['#d08a4e', '#c9d3e0', '#e9b640', '#8fd3ff', '#c38bff'];
  /* Множители по классу трейдера (индекс CLASSES): деньги наград и суммы
     в условиях. Без них $150 за задание ничего не значат на миллионе. */
  var CASH_K = [1, 2, 5, 15, 50, 300];
  var AMT_K = [1, 4, 15, 60, 300, 3000];
  var DIFF_XP = [0, 60, 90, 130], DIFF_CASH = [0, 100, 150, 250];
  var TRADE_XP = 4, TRADE_XP_CAP = 80;
  var OVER_XP = 1000;
  var XP2_MS = 30 * 60000;
  var SHIELD_K = 0.5, SHIELD_CAP = 500, PROFIT_K = 0.1, PROFIT_CAP = 300, FEE0_N = 5, PROFIT_N = 3;
  var BOOSTS = ['fee0', 'profit', 'shield', 'xp2', 'spin'];
  var FREE_CYCLE = ['spin', 'fee0', 'xp2', 'shield', 'profit'];
  var PREM_CYCLE = ['xp2', 'profit', 'fee0', 'shield', 'spin'];
  var DAY_CHEST = [{ at: 2, xp: 60, boost: ['spin'] }, { at: 4, xp: 150, boost: ['fee0', 'profit', 'shield', 'xp2'] }];
  var WEEK_CHEST = { xp: 500, n: 2 }, MONTH_CHEST = { xp: 1500, n: 3, cash: 2000 };

  /* Шаблоны заданий. p — период, ev — событие, goal — цель (amt: сумма
     в $, масштабируется классом при выдаче), f — фильтр события. */
  function lev(n) { return function (e) { return (e.lev || 0) >= n; }; }
  var DEFS = {
    d_trades: { p: 'd', diff: 1, goal: 5, ev: 'trade', go: 'market', img: 'first-trade' },
    d_vol: { p: 'd', diff: 1, goal: 2500, amt: 1, ev: 'vol', go: 'market', img: 'vol-10k' },
    d_meme: { p: 'd', diff: 1, goal: 1, ev: 'buy', f: function (e) { return e.sector === 'meme'; }, go: 'meme', img: 'fav-five' },
    d_spin: { p: 'd', diff: 1, goal: 1, ev: 'spin', go: 'spin', img: 'first-spin' },
    d_assets: { p: 'd', diff: 1, goal: 3, ev: 'asset', go: 'market', img: 'assets-5' },
    d_wins: { p: 'd', diff: 2, goal: 3, ev: 'win', go: 'portfolio', img: 'first-profit' },
    d_dip: { p: 'd', diff: 2, goal: 1, ev: 'buy', f: function (e) { return e.chg <= -0.05; }, go: 'losers', img: 'dip-buy' },
    d_limit: { p: 'd', diff: 2, goal: 1, ev: 'limit', go: 'market', img: 'first-limit' },
    d_fut: { p: 'd', diff: 2, goal: 1, ev: 'fopen', f: lev(5), go: 'fut', img: 'quick-flip', minLvl: 3 },
    d_sectors: { p: 'd', diff: 2, goal: 3, ev: 'sector', go: 'market', img: 'sectors-4' },
    d_profit: { p: 'd', diff: 3, goal: 100, amt: 1, ev: 'profit', go: 'portfolio', img: 'cap-x2' },
    d_streak: { p: 'd', diff: 3, goal: 3, ev: 'streak', go: 'portfolio', img: 'win-streak-5' },
    d_futwin: { p: 'd', diff: 3, goal: 1, ev: 'fwin', f: lev(10), go: 'fut', img: 'flash-crash', minLvl: 6 },
    d_bigwin: { p: 'd', diff: 3, goal: 1, ev: 'win', f: function (e) { return e.pct >= 0.05; }, go: 'portfolio', img: 'double-up' },
    w_days: { p: 'w', goal: 5, ev: 'day', xp: 400, cash: 800, go: 'market', img: 'streak-7' },
    w_dailies: { p: 'w', goal: 16, ev: 'dq', xp: 500, cash: 900, go: 'day', img: 'wins-10' },
    w_wins: { p: 'w', goal: 20, ev: 'win', xp: 450, cash: 800, go: 'portfolio', img: 'first-profit' },
    w_vol: { p: 'w', goal: 25000, amt: 1, ev: 'vol', xp: 350, cash: 700, go: 'market', img: 'vol-100k' },
    w_profit: { p: 'w', goal: 750, amt: 1, ev: 'profit', xp: 500, cash: 1000, go: 'portfolio', img: 'cap-x5' },
    w_futwin: { p: 'w', goal: 5, ev: 'fwin', xp: 400, cash: 800, go: 'fut', img: 'top-sell' },
    w_assets: { p: 'w', goal: 10, ev: 'asset', xp: 350, cash: 700, go: 'market', img: 'assets-5' },
    m_days: { p: 'm', goal: 20, ev: 'day', xp: 1500, cash: 3000, go: 'market', img: 'streak-30' },
    m_dailies: { p: 'm', goal: 70, ev: 'dq', xp: 1800, cash: 3500, go: 'day', img: 'wins-50' },
    m_weeklies: { p: 'm', goal: 12, ev: 'wq', xp: 1500, cash: 3000, go: 'week', img: 'wins-200' },
    m_wins: { p: 'm', goal: 80, ev: 'win', xp: 1200, cash: 2500, go: 'portfolio', img: 'winrate-60' },
    m_profit: { p: 'm', goal: 5000, amt: 1, ev: 'profit', xp: 1500, cash: 3500, go: 'portfolio', img: 'cap-x10' },
    m_vol: { p: 'm', goal: 150000, amt: 1, ev: 'vol', xp: 1000, cash: 2500, go: 'market', img: 'vol-1m' },
    m_streak: { p: 'm', goal: 5, ev: 'streak', xp: 1000, cash: 2500, go: 'portfolio', img: 'win-streak-5' },
    m_sectors: { p: 'm', goal: 6, ev: 'sector', xp: 1000, cash: 2000, go: 'market', img: 'sectors-4' }
  };
  var PER_N = { d: 4, w: 5, m: 5 };

  /* Темы пропуска: цвета превью в награде и в премиум-шторке. */
  var THEME_SW = {
    theme_malachite: ['#1f5c43', '#0a1612'], theme_bordeaux: ['#6b2238', '#180b0f'], theme_abyss: ['#1c6f7c', '#07161b'],
    theme_sakura: ['#b5507f', '#180e17'], theme_aurum: ['#c99a2e', '#110d07']
  };

  var STR = {
    ru: {
      qs_title: 'Задания', qs_pass: 'Пропуск трейдера', qs_stage_k: 'Этап {n} · {name}',
      qs_st_1: 'Бронза', qs_st_2: 'Серебро', qs_st_3: 'Золото', qs_st_4: 'Платина', qs_st_5: 'Алмаз',
      qs_lvl_of: 'Уровень {n} из {m}', qs_lvl_max: 'Максимальный уровень', qs_next: 'Уровень {n} — ещё {x} XP', qs_next_max: 'Бонусный сундук — ещё {x} XP',
      qs_free: 'Бесплатно', qs_premium: 'Премиум', qs_prem_on: 'Премиум', qs_claim_all: 'Забрать всё', qs_nothing: 'Наград пока нет',
      qs_stage_lock: 'Откроется на {n} уровне', qs_stage_open: 'Этап {n} открыт', qs_next_stage: 'Этап {n}',
      qs_seg_d: 'Дневные', qs_seg_w: 'Недельные', qs_seg_m: 'Месячные',
      qs_d_head: 'Задания дня', qs_w_head: 'Задания недели', qs_m_head: 'Задания месяца',
      qs_done_of: '{n} из {m} выполнено', qs_all_done: 'Все задания выполнены', qs_refresh: 'Обновление через {x}',
      qs_chest_half: 'Сундук за 2 задания', qs_chest_full: 'Сундук за все задания', qs_chest_w: 'Сундук недели', qs_chest_m: 'Сундук месяца',
      qs_chest_open: 'Открыть', qs_chest_got: 'Получен', qs_chest_need: 'Выполните {n}',
      qs_diff_1: 'Лёгкое', qs_diff_2: 'Среднее', qs_diff_3: 'Сложное',
      qs_claim: 'Забрать', qs_go: 'Перейти', qs_stamp: 'Выполнено', qs_mult: '{name}: награды ×{k}',
      qs_rr_free: 'Замена задания: 1 бесплатная сегодня, дальше — за рекламу', qs_rr_ad: 'Бесплатная замена использована — следующая за рекламу',
      qs_rr_done: 'Задание заменено', qs_rr_ad_fail: 'Реклама не досмотрена — задание осталось прежним',
      qs_toast_done: 'Задание выполнено', qs_toast_lvl: 'Новый уровень пропуска · {n}', qs_open: 'Открыть',
      qs_left_d: '{d} д {h} ч', qs_end: 'Задания обновляются по серверному времени',
      qs_src_d: 'Дневное задание', qs_src_w: 'Недельное задание', qs_src_m: 'Месячное задание', qs_src_lvl: 'Пропуск · ур. {n}',
      qs_src_chest: 'Сундук заданий', qs_src_shield: 'Страховка сделки', qs_src_profit: 'Бустер «Профит +10%»',
      qs_future: 'Откроется на {n} уровне', qs_claimed: 'Награда уже получена', qs_prem_need: 'Награда премиум-дорожки',
      qs_cer_lvl: 'Новый уровень!', qs_cer_lvls1: '+{n} уровень', qs_cer_lvls: '+{n} уровня', qs_cer_lvls5: '+{n} уровней', qs_cer_more: 'и ещё {n}',
      qs_cer_stage: 'Открыт этап {n}', qs_cer_stage_d: 'Уровни {a}–{b} · {x} XP за уровень',
      qs_cer_sum: 'Награды получены', qs_later: 'Позже', qs_great: 'Отлично', qs_tap_chest: 'Нажмите на сундук', qs_take: 'Забрать всё',
      qs_prem_lock: 'С премиумом — обе награды', qs_cer_prem: 'Премиум активирован', qs_cer_prem_d: 'Открыто наград премиум-дорожки: {n} — заберите их на дорожке',
      qs_inv: 'Инвентарь', qs_inv_sub: 'Бустеры из заданий, сундуков и пропуска', qs_inv_active: 'Действуют сейчас', qs_inv_use: 'Использовать',
      qs_inv_empty: 'Нет в наличии', qs_inv_hint: 'Бустеры выдают задания, сундуки и уровни пропуска',
      qs_b_fee0: 'Нулевая комиссия', qs_b_fee0_d: '{n} сделок на споте без комиссии',
      qs_b_profit: 'Профит +10%', qs_b_profit_d: '+10% к прибыли {n} следующих сделок в плюс, до {x} за сделку',
      qs_b_shield: 'Страховка', qs_b_shield_d: 'Вернёт 50% убытка следующей сделки в минус, до {x}',
      qs_b_xp2: 'Двойной опыт', qs_b_xp2_d: '×2 опыта пропуска на 30 минут',
      qs_b_spin: 'Жетон колеса', qs_b_spin_d: 'Сразу открывает бесплатный спин колеса удачи',
      qs_a_fee0: '0% комиссии · {n}', qs_a_profit: 'Профит +10% · {n}', qs_a_shield: 'Страховка · {n}', qs_a_xp2: 'Опыт ×2 · {x}',
      qs_used_fee0: 'Следующие {n} сделок без комиссии', qs_used_profit: 'Профит +10% на {n} сделки', qs_used_shield: 'Страховка на следующую сделку',
      qs_used_xp2: 'Двойной опыт до {x}', qs_used_spin: 'Бесплатный спин готов', qs_spin_ready: 'Бесплатный спин и так доступен',
      qs_spin_go: 'Крутить', qs_shield_hit: 'Страховка вернула {x}', qs_profit_hit: 'Профит +10%: +{x}',
      qs_prem_t: 'Премиум-пропуск', qs_prem_sub: 'Навсегда: все 5 этапов и 500 уровней',
      qs_prem_1: 'Вторая дорожка наград на всех 500 уровнях', qs_prem_1d: 'Деньги в 2,5 раза больше и бустеры каждые 5 уровней',
      qs_prem_2: '{n} эксклюзивных предметов витрины', qs_prem_2d: 'Анимированные рамки, темы, титулы и свечи',
      qs_prem_3: 'Награды за уже пройденные уровни', qs_prem_3d: 'Покупка открывает всё, что вы уже прошли',
      qs_prem_now: 'На вашем уровне уже доступно наград: {n}', qs_prem_buy: 'Открыть за', qs_prem_owned: 'Премиум активен',
      qs_prem_fine: 'Покупка разовая, через Яндекс Игры. Прогресс и премиум сохраняются в облаке и не сгорают.',
      qs_prem_fail: 'Покупка не завершена', qs_prem_na: 'Покупки сейчас недоступны', qs_prem_gallery: 'Что внутри',
      qs_lb_title: 'Задания и пропуск', qs_lb_cta_claim: 'Забрать награды · {n}', qs_lb_cta: 'Открыть задания', qs_lb_inv: 'Инвентарь',
      qs_rw_cash: 'на баланс', qs_rw_boost: 'бустер', qs_item_new: 'Новый предмет витрины', qs_wear: 'Надеть',
      qs_k_frame: 'Рамка', qs_k_title: 'Титул', qs_k_candles: 'Свечи', qs_k_theme: 'Тема',
      qp_vit_free: 'Пропуск трейдера · ур. {n}', qp_vit_prem: 'Премиум-пропуск · ур. {n}',
      qp_vit_free_d: 'Бесплатная награда пропуска: выполняйте задания и копите опыт', qp_vit_prem_d: 'Награда премиум-дорожки пропуска трейдера',
      qp_to_pass: 'К пропуску', lb_op_quest: 'Задания и пропуск', a11y_qs_inv: 'Инвентарь',
      q_d_trades_t: 'Соверши 5 сделок', q_d_trades_d: 'Покупки, продажи и фьючерсы',
      q_d_vol_t: 'Наторгуй на {x}', q_d_vol_d: 'Оборот покупок и продаж за сегодня',
      q_d_meme_t: 'Купи мемкоин', q_d_meme_d: 'Любая монета из раздела «Мемкоины»',
      q_d_spin_t: 'Крутани колесо удачи', q_d_spin_d: 'Бесплатный или золотой спин',
      q_d_assets_t: 'Поторгуй 3 разными монетами', q_d_assets_d: 'Спот и фьючерсы вместе',
      q_d_wins_t: 'Закрой 3 сделки в плюс', q_d_wins_d: 'Продажа или закрытие фьючерса с прибылью',
      q_d_dip_t: 'Купи на просадке', q_d_dip_d: 'Монету, упавшую за 24 часа больше чем на 5%',
      q_d_limit_t: 'Исполни лимитный ордер', q_d_limit_d: 'Поставь лимитку и дождись, пока цена до неё дойдёт',
      q_d_fut_t: 'Фьючерс с плечом от 5×', q_d_fut_d: 'Открой лонг или шорт',
      q_d_sectors_t: 'Монеты из 3 секторов', q_d_sectors_d: 'Купи монеты трёх разных секторов',
      q_d_profit_t: 'Заработай {x}', q_d_profit_d: 'Прибыль закрытых сделок за сегодня',
      q_d_streak_t: '3 прибыльные сделки подряд', q_d_streak_d: 'Убыточная сделка сбрасывает серию',
      q_d_futwin_t: 'Фьючерс 10× в плюс', q_d_futwin_d: 'Закрой с прибылью позицию с плечом от 10×',
      q_d_bigwin_t: 'Сделка на +5%', q_d_bigwin_d: 'Закрой сделку с доходностью от 5%',
      q_w_days_t: 'Торгуй 5 дней из 7', q_w_days_d: 'Хотя бы одна сделка за день',
      q_w_dailies_t: 'Выполни 16 дневных заданий', q_w_dailies_d: 'Засчитываются забранные задания',
      q_w_wins_t: 'Закрой 20 сделок в плюс', q_w_wins_d: 'Спот и фьючерсы вместе',
      q_w_vol_t: 'Наторгуй на {x}', q_w_vol_d: 'Оборот за неделю',
      q_w_profit_t: 'Заработай {x}', q_w_profit_d: 'Прибыль закрытых сделок за неделю',
      q_w_futwin_t: 'Закрой 5 фьючерсов в плюс', q_w_futwin_d: 'С любым плечом',
      q_w_assets_t: 'Поторгуй 10 разными монетами', q_w_assets_d: 'Спот и фьючерсы вместе',
      q_m_days_t: 'Торгуй 20 дней за месяц', q_m_days_d: 'Хотя бы одна сделка за день',
      q_m_dailies_t: 'Выполни 70 дневных заданий', q_m_dailies_d: 'Засчитываются забранные задания',
      q_m_weeklies_t: 'Выполни 12 недельных заданий', q_m_weeklies_d: 'Засчитываются забранные задания',
      q_m_wins_t: 'Закрой 80 сделок в плюс', q_m_wins_d: 'Спот и фьючерсы вместе',
      q_m_profit_t: 'Заработай {x}', q_m_profit_d: 'Прибыль закрытых сделок за месяц',
      q_m_vol_t: 'Наторгуй на {x}', q_m_vol_d: 'Оборот за месяц',
      q_m_streak_t: 'Серия из 5 прибыльных сделок', q_m_streak_d: 'Подряд, без убыточных между ними',
      q_m_sectors_t: 'Монеты из 6 секторов', q_m_sectors_d: 'Купи монеты шести разных секторов',
      item_frame_bp_pulse_t: 'Пульс', item_title_bp_regular_t: 'Завсегдатай', item_frame_bp_bronze_t: 'Бронзовый обод',
      item_candles_bp_ink_t: 'Чернила', item_title_bp_silver_t: 'Серебряный трейдер', item_frame_bp_gold_t: 'Золотой обод',
      item_title_bp_marathon_t: 'Марафонец', item_candles_bp_mint_t: 'Мята', item_frame_bp_platinum_t: 'Платиновый обод',
      item_title_bp_500_t: 'Пятисотый', item_frame_bp_neon_t: 'Неон', item_title_bp_bull_t: 'Бычий дух',
      item_candles_bp_laser_t: 'Лазер', item_theme_malachite_t: 'Малахит', item_frame_bp_plasma_t: 'Плазма',
      item_title_bp_shark_t: 'Акула рынка', item_frame_bp_prism_t: 'Призма', item_candles_bp_candy_t: 'Карамель',
      item_theme_bordeaux_t: 'Бордо', item_frame_bp_flame_t: 'Пламя', item_title_bp_oracle_t: 'Оракул',
      item_frame_bp_frost_t: 'Иней', item_candles_bp_ice_t: 'Лёд', item_theme_abyss_t: 'Бездна',
      item_frame_bp_orbit_t: 'Орбита', item_title_bp_tycoon_t: 'Магнат', item_frame_bp_galaxy_t: 'Галактика',
      item_candles_bp_lava_t: 'Лава', item_theme_sakura_t: 'Сакура', item_frame_bp_storm_t: 'Шторм',
      item_title_bp_icon_t: 'Икона биржи', item_frame_bp_crown_t: 'Корона', item_candles_bp_royal_t: 'Роял',
      item_frame_bp_diamond_t: 'Бриллиант', item_title_bp_legend_t: 'Легенда пропуска', item_theme_aurum_t: 'Аурум'
    },
    en: {
      qs_title: 'Quests', qs_pass: 'Trader Pass', qs_stage_k: 'Stage {n} · {name}',
      qs_st_1: 'Bronze', qs_st_2: 'Silver', qs_st_3: 'Gold', qs_st_4: 'Platinum', qs_st_5: 'Diamond',
      qs_lvl_of: 'Level {n} of {m}', qs_lvl_max: 'Max level', qs_next: 'Level {n} — {x} XP to go', qs_next_max: 'Bonus chest — {x} XP to go',
      qs_free: 'Free', qs_premium: 'Premium', qs_prem_on: 'Premium', qs_claim_all: 'Claim all', qs_nothing: 'No rewards yet',
      qs_stage_lock: 'Unlocks at level {n}', qs_stage_open: 'Stage {n} unlocked', qs_next_stage: 'Stage {n}',
      qs_seg_d: 'Daily', qs_seg_w: 'Weekly', qs_seg_m: 'Monthly',
      qs_d_head: 'Daily quests', qs_w_head: 'Weekly quests', qs_m_head: 'Monthly quests',
      qs_done_of: '{n} of {m} done', qs_all_done: 'All quests done', qs_refresh: 'Refresh in {x}',
      qs_chest_half: 'Chest for 2 quests', qs_chest_full: 'Chest for all quests', qs_chest_w: 'Weekly chest', qs_chest_m: 'Monthly chest',
      qs_chest_open: 'Open', qs_chest_got: 'Opened', qs_chest_need: 'Complete {n}',
      qs_diff_1: 'Easy', qs_diff_2: 'Medium', qs_diff_3: 'Hard',
      qs_claim: 'Claim', qs_go: 'Go', qs_stamp: 'Done', qs_mult: '{name}: rewards ×{k}',
      qs_rr_free: 'Swap a quest: 1 free today, then for an ad', qs_rr_ad: 'Free swap used — the next one is for an ad',
      qs_rr_done: 'Quest swapped', qs_rr_ad_fail: 'The ad was not finished — the quest stays',
      qs_toast_done: 'Quest complete', qs_toast_lvl: 'New pass level · {n}', qs_open: 'Open',
      qs_left_d: '{d}d {h}h', qs_end: 'Quests refresh on server time',
      qs_src_d: 'Daily quest', qs_src_w: 'Weekly quest', qs_src_m: 'Monthly quest', qs_src_lvl: 'Pass · lvl {n}',
      qs_src_chest: 'Quest chest', qs_src_shield: 'Trade insurance', qs_src_profit: '“Profit +10%” booster',
      qs_future: 'Unlocks at level {n}', qs_claimed: 'Already claimed', qs_prem_need: 'Premium track reward',
      qs_cer_lvl: 'Level up!', qs_cer_lvls1: '+{n} levels', qs_cer_lvls: '+{n} levels', qs_cer_lvls5: '+{n} levels', qs_cer_more: 'and {n} more',
      qs_cer_stage: 'Stage {n} unlocked', qs_cer_stage_d: 'Levels {a}–{b} · {x} XP per level',
      qs_cer_sum: 'Rewards claimed', qs_later: 'Later', qs_great: 'Great', qs_tap_chest: 'Tap the chest', qs_take: 'Take all',
      qs_prem_lock: 'Premium gets both rewards', qs_cer_prem: 'Premium activated', qs_cer_prem_d: 'Premium track rewards unlocked: {n} — claim them on the track',
      qs_inv: 'Inventory', qs_inv_sub: 'Boosters from quests, chests and the pass', qs_inv_active: 'Active now', qs_inv_use: 'Use',
      qs_inv_empty: 'None left', qs_inv_hint: 'Boosters come from quests, chests and pass levels',
      qs_b_fee0: 'Zero fee', qs_b_fee0_d: '{n} spot trades with no fee',
      qs_b_profit: 'Profit +10%', qs_b_profit_d: '+10% to the profit of the next {n} winning trades, up to {x} each',
      qs_b_shield: 'Insurance', qs_b_shield_d: 'Refunds 50% of the next losing trade, up to {x}',
      qs_b_xp2: 'Double XP', qs_b_xp2_d: '×2 pass XP for 30 minutes',
      qs_b_spin: 'Wheel token', qs_b_spin_d: 'Unlocks a free Lucky Spin right away',
      qs_a_fee0: '0% fee · {n}', qs_a_profit: 'Profit +10% · {n}', qs_a_shield: 'Insurance · {n}', qs_a_xp2: 'XP ×2 · {x}',
      qs_used_fee0: 'Next {n} trades have no fee', qs_used_profit: 'Profit +10% for {n} trades', qs_used_shield: 'Next trade is insured',
      qs_used_xp2: 'Double XP until {x}', qs_used_spin: 'Free spin is ready', qs_spin_ready: 'A free spin is already available',
      qs_spin_go: 'Spin', qs_shield_hit: 'Insurance refunded {x}', qs_profit_hit: 'Profit +10%: +{x}',
      qs_prem_t: 'Premium pass', qs_prem_sub: 'Forever: all 5 stages and 500 levels',
      qs_prem_1: 'A second reward track on all 500 levels', qs_prem_1d: '2.5× the cash and boosters every 5 levels',
      qs_prem_2: '{n} exclusive showcase items', qs_prem_2d: 'Animated frames, themes, titles and candles',
      qs_prem_3: 'Rewards for levels you have passed', qs_prem_3d: 'The purchase unlocks everything you already reached',
      qs_prem_now: 'Rewards already available at your level: {n}', qs_prem_buy: 'Unlock for', qs_prem_owned: 'Premium active',
      qs_prem_fine: 'One-time purchase via Yandex Games. Progress and premium are saved in the cloud and never expire.',
      qs_prem_fail: 'Purchase not completed', qs_prem_na: 'Purchases are unavailable right now', qs_prem_gallery: 'Inside',
      qs_lb_title: 'Quests & pass', qs_lb_cta_claim: 'Claim rewards · {n}', qs_lb_cta: 'Open quests', qs_lb_inv: 'Inventory',
      qs_rw_cash: 'to balance', qs_rw_boost: 'booster', qs_item_new: 'New showcase item', qs_wear: 'Wear',
      qs_k_frame: 'Frame', qs_k_title: 'Title', qs_k_candles: 'Candles', qs_k_theme: 'Theme',
      qp_vit_free: 'Trader Pass · lvl {n}', qp_vit_prem: 'Premium pass · lvl {n}',
      qp_vit_free_d: 'Free pass reward: complete quests and earn XP', qp_vit_prem_d: 'Trader Pass premium track reward',
      qp_to_pass: 'Go to pass', lb_op_quest: 'Quests & pass', a11y_qs_inv: 'Inventory',
      q_d_trades_t: 'Make 5 trades', q_d_trades_d: 'Buys, sells and futures',
      q_d_vol_t: 'Trade {x} in volume', q_d_vol_d: 'Buy and sell turnover today',
      q_d_meme_t: 'Buy a meme coin', q_d_meme_d: 'Any coin from “Meme coins”',
      q_d_spin_t: 'Spin the Lucky Wheel', q_d_spin_d: 'Free or golden spin',
      q_d_assets_t: 'Trade 3 different coins', q_d_assets_d: 'Spot and futures together',
      q_d_wins_t: 'Close 3 trades in profit', q_d_wins_d: 'A sale or a futures close with profit',
      q_d_dip_t: 'Buy the dip', q_d_dip_d: 'A coin down more than 5% over 24 hours',
      q_d_limit_t: 'Fill a limit order', q_d_limit_d: 'Place a limit order and wait for the price',
      q_d_fut_t: 'Futures at 5× or more', q_d_fut_d: 'Open a long or a short',
      q_d_sectors_t: 'Coins from 3 sectors', q_d_sectors_d: 'Buy coins from three different sectors',
      q_d_profit_t: 'Earn {x}', q_d_profit_d: 'Profit from closed trades today',
      q_d_streak_t: '3 winning trades in a row', q_d_streak_d: 'A losing trade resets the streak',
      q_d_futwin_t: '10× futures in profit', q_d_futwin_d: 'Close a 10×+ position with profit',
      q_d_bigwin_t: 'A +5% trade', q_d_bigwin_d: 'Close a trade with a 5%+ return',
      q_w_days_t: 'Trade on 5 days of 7', q_w_days_d: 'At least one trade per day',
      q_w_dailies_t: 'Complete 16 daily quests', q_w_dailies_d: 'Claimed quests count',
      q_w_wins_t: 'Close 20 trades in profit', q_w_wins_d: 'Spot and futures together',
      q_w_vol_t: 'Trade {x} in volume', q_w_vol_d: 'Turnover this week',
      q_w_profit_t: 'Earn {x}', q_w_profit_d: 'Profit from closed trades this week',
      q_w_futwin_t: 'Close 5 futures in profit', q_w_futwin_d: 'Any leverage',
      q_w_assets_t: 'Trade 10 different coins', q_w_assets_d: 'Spot and futures together',
      q_m_days_t: 'Trade on 20 days this month', q_m_days_d: 'At least one trade per day',
      q_m_dailies_t: 'Complete 70 daily quests', q_m_dailies_d: 'Claimed quests count',
      q_m_weeklies_t: 'Complete 12 weekly quests', q_m_weeklies_d: 'Claimed quests count',
      q_m_wins_t: 'Close 80 trades in profit', q_m_wins_d: 'Spot and futures together',
      q_m_profit_t: 'Earn {x}', q_m_profit_d: 'Profit from closed trades this month',
      q_m_vol_t: 'Trade {x} in volume', q_m_vol_d: 'Turnover this month',
      q_m_streak_t: '5 winning trades in a row', q_m_streak_d: 'No losing trades in between',
      q_m_sectors_t: 'Coins from 6 sectors', q_m_sectors_d: 'Buy coins from six different sectors',
      item_frame_bp_pulse_t: 'Pulse', item_title_bp_regular_t: 'Regular', item_frame_bp_bronze_t: 'Bronze Rim',
      item_candles_bp_ink_t: 'Ink', item_title_bp_silver_t: 'Silver Trader', item_frame_bp_gold_t: 'Gold Rim',
      item_title_bp_marathon_t: 'Marathoner', item_candles_bp_mint_t: 'Mint', item_frame_bp_platinum_t: 'Platinum Rim',
      item_title_bp_500_t: 'Five Hundred', item_frame_bp_neon_t: 'Neon', item_title_bp_bull_t: 'Bull Spirit',
      item_candles_bp_laser_t: 'Laser', item_theme_malachite_t: 'Malachite', item_frame_bp_plasma_t: 'Plasma',
      item_title_bp_shark_t: 'Market Shark', item_frame_bp_prism_t: 'Prism', item_candles_bp_candy_t: 'Candy',
      item_theme_bordeaux_t: 'Bordeaux', item_frame_bp_flame_t: 'Flame', item_title_bp_oracle_t: 'Oracle',
      item_frame_bp_frost_t: 'Frost', item_candles_bp_ice_t: 'Ice', item_theme_abyss_t: 'Abyss',
      item_frame_bp_orbit_t: 'Orbit', item_title_bp_tycoon_t: 'Tycoon', item_frame_bp_galaxy_t: 'Galaxy',
      item_candles_bp_lava_t: 'Lava', item_theme_sakura_t: 'Sakura', item_frame_bp_storm_t: 'Storm',
      item_title_bp_icon_t: 'Exchange Icon', item_frame_bp_crown_t: 'Crown', item_candles_bp_royal_t: 'Royal',
      item_frame_bp_diamond_t: 'Diamond', item_title_bp_legend_t: 'Pass Legend', item_theme_aurum_t: 'Aurum'
    }
  };
  if (typeof V3 !== 'undefined') V3.i18n(STR);

  /* ---------------- Утилиты ---------------- */

  function el(id) { return document.getElementById(id); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function D(ms) { return typeof V3 !== 'undefined' ? V3.D(ms) : ms; }
  function later(ms, fn) { return setTimeout(fn, D(ms)); }
  function reflow(x) { return x && x.offsetWidth; }
  function restart(x, cls) { if (!x) return; x.classList.remove(cls); reflow(x); x.classList.add(cls); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function int(v, lo, hi) { return clamp(Math.floor(num(v, lo)), lo, hi); }
  function h(s) { return esc(String(s == null ? '' : s)); }
  function nowS() { return YaGame.serverTime(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hms(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); }
  function mmss(ms) { var s = Math.max(0, Math.round(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function trim1(v) { return String(Math.round(v * 10) / 10); }
  function cmp(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return '$' + trim1(a / 1e6) + 'M';
    if (a >= 1e4) return '$' + trim1(a / 1e3) + 'K';
    return money(a, 0);
  }
  function darkImg() { return document.documentElement.getAttribute('data-theme') !== 'light'; }
  function achImg(name) { return (darkImg() ? 'img/ach-dark/' : 'img/ach-light/') + name + '.png'; }
  function giftImg() { return darkImg() ? 'img/gift-dark.png' : 'img/gift-light.png'; }
  function cls() {
    var c = 0;
    try { c = Math.max(classFor(capital()), Number(S.classSeen) || 0); } catch (e) { c = 0; }
    return int(c, 0, CASH_K.length - 1);
  }
  function cashK() { return CASH_K[cls()]; }
  function onScreen() { return typeof currentScreen !== 'undefined' && currentScreen === 'scr-quests'; }
  function rng(seed) {
    var x = 2166136261;
    for (var i = 0; i < seed.length; i++) { x ^= seed.charCodeAt(i); x = Math.imul(x, 16777619); }
    return function () {
      x = (x + 0x6D2B79F5) | 0;
      var r = Math.imul(x ^ (x >>> 15), 1 | x);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  var P = {
    back: '<path d="M29 12L17 24l12 12"/>',
    bag: '<path d="M11 17h26l-2.3 21.6A3 3 0 0 1 31.7 41H16.3a3 3 0 0 1-3-2.4z"/><path d="M18 20v-5a6 6 0 0 1 12 0v5"/>',
    check: '<path d="M12 25l8 8 16-18"/>',
    lock: '<rect x="13" y="21" width="22" height="15" rx="3"/><path d="M18 21v-5a6 6 0 0 1 12 0v5"/>',
    clock: '<circle cx="24" cy="24" r="16"/><path d="M24 15v10l6 4"/>',
    reroll: '<path d="M38 19a15 15 0 0 0-27-3M10 29a15 15 0 0 0 27 3"/><path d="M11 8v8h8M37 40v-8h-8"/>',
    go: '<path d="M10 24h26M26 14l10 10-10 10"/>',
    gift: '<rect x="9" y="18" width="30" height="21" rx="3"/><path d="M6 13h36v6H6zM24 13v26"/><path d="M24 13c-3-6-10-6-10-1s10 1 10 1zM24 13c3-6 10-6 10-1s-10 1-10 1z"/>',
    crown: '<path d="M8 36l-2-20 11 9 7-13 7 13 11-9-2 20z"/>',
    play: '<path d="M18 13l18 11-18 11z" fill="currentColor"/>',
    spark: '<path d="M24 5l4 13 13 4-13 4-4 13-4-13-13-4 13-4z" fill="currentColor"/>',
    fee0: '<path d="M34 14L14 34"/><circle cx="16.5" cy="16.5" r="4.5"/><circle cx="31.5" cy="31.5" r="4.5"/>',
    profit: '<path d="M9 33l10-10 6 6 14-14"/><path d="M30 15h9v9"/>',
    shield: '<path d="M24 6l14 5v11c0 9-6 16-14 20-8-4-14-11-14-20V11z"/><path d="M18 24l5 5 8-9"/>',
    xp2: '<text x="24" y="31" text-anchor="middle" font-size="19" font-weight="900" fill="currentColor" stroke="none" font-family="inherit">×2</text>',
    spin: '<circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="3"/><path d="M24 9v12M24 27v12M9 24h12M27 24h12M13.4 13.4l8.5 8.5M26.1 26.1l8.5 8.5M34.6 13.4l-8.5 8.5M21.9 26.1l-8.5 8.5"/>'
  };
  /* Иконки Fluent Emoji (img/qs/, MIT): деньги, опыт, бустеры, корона. */
  var IMG_V = '?v=2';
  function im(name, cls) { return '<img class="qs-ico' + (cls ? ' ' + cls : '') + '" src="img/qs/' + name + '.svg' + IMG_V + '" alt="" draggable="false">'; }
  function ic(name, sw) { return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="' + (sw || 3.6) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>'; }

  /* ---------------- Уровни ---------------- */

  function perLvl(L) { return 100 + 50 * (Math.ceil(L / STAGE_LEN) - 1); }
  var CUM = [0];
  for (var ci = 1; ci <= MAX_LVL; ci++) CUM[ci] = CUM[ci - 1] + perLvl(ci);
  function lvlOf(xp) {
    var lo = 0, hi = MAX_LVL;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (CUM[mid] <= xp) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function level() { return S && S.qst ? lvlOf(num(S.qst.xp, 0)) : 0; }
  function prog() {
    var xp = st().xp, L = lvlOf(xp);
    if (L >= MAX_LVL) return { L: MAX_LVL, into: (xp - CUM[MAX_LVL]) % OVER_XP, need: OVER_XP, max: true };
    return { L: L, into: xp - CUM[L], need: perLvl(L + 1), max: false };
  }
  function stageNow() { return clamp(Math.floor(level() / STAGE_LEN) + 1, 1, STAGES); }
  function stageName(s) { return t('qs_st_' + s); }

  /* ---------------- Награды уровней ---------------- */

  var COSM = null;
  function cosm() {
    if (COSM) return COSM;
    COSM = {};
    try {
      var it = Ach.v3.ITEMS;
      Object.keys(it).forEach(function (id) { var s = it[id].src; if (s && s.pass) COSM[(s.prem ? 'p' : 'f') + s.pass] = id; });
    } catch (e) { dbg('qs:cosm', e); }
    return COSM;
  }
  function itemType(id) { try { return Ach.v3.ITEMS[id].type; } catch (e) { return ''; } }
  function premItemCount() { var n = 0, c = cosm(); for (var k in c) if (k.charAt(0) === 'p') n++; return n; }
  function rw(L, prem) {
    var c = cosm()[(prem ? 'p' : 'f') + L];
    if (c) return { k: 'item', id: c };
    var s = Math.ceil(L / STAGE_LEN);
    if (!prem) {
      if (L % 10 === 0) return { k: 'boost', b: FREE_CYCLE[(L / 10) % 5], n: 1 };
      if (L % 5 === 0) return { k: 'boost', b: 'spin', n: 1 };
      return { k: 'cash', v: 50 + 10 * s };
    }
    if (L % 5 === 0) return { k: 'boost', b: PREM_CYCLE[(L / 5) % 5], n: 2 };
    return { k: 'cash', v: 120 + 30 * s };
  }
  function hasBit(bits, L) { return bits.charAt(L - 1) === '1'; }
  function setBit(bits, L) { while (bits.length < L) bits += '0'; return bits.slice(0, L - 1) + '1' + bits.slice(L); }
  function premShown() { return st().prem || pay.avail; }
  function claimable(L, prem) {
    var q = st();
    if (L < 1 || L > level()) return false;
    if (prem && !q.prem) return false;
    return !hasBit(prem ? q.cp : q.cf, L);
  }
  function claimableList() {
    var out = [], L = level(), q = st();
    for (var i = 1; i <= L; i++) {
      if (!hasBit(q.cf, i)) out.push([i, false]);
      if (q.prem && !hasBit(q.cp, i)) out.push([i, true]);
    }
    return out;
  }

  /* ---------------- Состояние ---------------- */

  function fresh() {
    return { v: 1, xp: 0, seen: 0, cf: '', cp: '', prem: false, ov: 0, d: null, w: null, m: null,
      inv: { fee0: 0, profit: 0, shield: 0, xp2: 0, spin: 0 }, act: { xp2: 0, shield: 0, profit: 0 },
      tx: { k: '', n: 0 }, fw: null, seg: 'd' };
  }
  var premOwned = false;
  function st() { if (!S.qst || typeof S.qst !== 'object' || S.qst.v !== 1) sanitize(); return S.qst; }
  function bits(v) { return typeof v === 'string' ? v.replace(/[^01]/g, '0').slice(0, MAX_LVL) : ''; }
  function cleanQ(x) {
    if (!x || typeof x !== 'object' || !DEFS[x.id]) return null;
    var q = { id: x.id, cur: Math.max(0, num(x.cur, 0)), goal: Math.max(1, num(x.goal, DEFS[x.id].goal)), c: x.c ? 1 : 0, k: int(x.k, 0, CASH_K.length - 1) };
    if (Array.isArray(x.set)) q.set = x.set.filter(function (v) { return typeof v === 'string'; }).slice(0, 16);
    if (x.run != null) q.run = int(x.run, 0, 999);
    if (typeof x.ld === 'string') q.ld = x.ld;
    return q;
  }
  function cleanP(x, per) {
    if (!x || typeof x !== 'object' || typeof x.k !== 'string') return null;
    var list = (Array.isArray(x.q) ? x.q : []).map(cleanQ).filter(function (q) { return q && DEFS[q.id].p === per; });
    if (list.length !== PER_N[per]) return null;
    var p = { k: x.k, q: list };
    if (per === 'd') { p.rr = int(x.rr, 0, 1); p.ch = [x.ch && x.ch[0] ? 1 : 0, x.ch && x.ch[1] ? 1 : 0]; }
    else p.ch = x.ch ? 1 : 0;
    return p;
  }
  function sanitize() {
    var r = S.qst, f = fresh();
    if (r && typeof r === 'object') {
      f.xp = Math.max(0, num(r.xp, 0));
      f.seen = int(r.seen, 0, MAX_LVL);
      f.cf = bits(r.cf); f.cp = bits(r.cp);
      f.prem = !!r.prem;
      f.ov = int(r.ov, 0, 1e6);
      f.d = cleanP(r.d, 'd'); f.w = cleanP(r.w, 'w'); f.m = cleanP(r.m, 'm');
      if (r.inv && typeof r.inv === 'object') BOOSTS.forEach(function (b) { f.inv[b] = int(r.inv[b], 0, 999); });
      if (r.act && typeof r.act === 'object') {
        f.act.xp2 = Math.max(0, num(r.act.xp2, 0));
        f.act.shield = int(r.act.shield, 0, 999);
        f.act.profit = int(r.act.profit, 0, 999);
      }
      if (r.tx && typeof r.tx.k === 'string') f.tx = { k: r.tx.k, n: int(r.tx.n, 0, TRADE_XP_CAP) };
      if (r.fw && typeof r.fw === 'object') f.fw = { seq: int(r.fw.seq, 0, 1e9), t: Math.max(0, num(r.fw.t, 0)) };
      if (r.seg === 'w' || r.seg === 'm') f.seg = r.seg;
    }
    if (premOwned) f.prem = true;
    f.seen = Math.min(f.seen, lvlOf(f.xp));
    S.qst = f;
  }

  /* ---------------- Периоды ---------------- */

  function dayK(ts) { return dayKey(ts); }
  function weekStart(ts) {
    var d = new Date(ts), wd = (d.getUTCDay() + 6) % 7;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd);
  }
  function weekK(ts) { return 'W' + dayKey(weekStart(ts)); }
  function monthK(ts) { var d = new Date(ts); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1); }
  function keyOf(per, ts) { return per === 'd' ? dayK(ts) : per === 'w' ? weekK(ts) : monthK(ts); }
  function msLeft(per) {
    var ts = nowS();
    if (per === 'd') return msUntilTomorrow(ts);
    if (per === 'w') return weekStart(ts) + 7 * 86400000 - ts;
    var d = new Date(ts);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - ts;
  }
  function leftTxt(per) {
    var ms = msLeft(per);
    if (per === 'd') return hms(ms);
    return t('qs_left_d', { d: Math.floor(ms / 86400000), h: pad(Math.floor(ms / 3600000) % 24) });
  }
  function mk(id) {
    var d = DEFS[id];
    /* k — класс на момент выдачи: и цель, и награда задания считаются по нему. */
    var k = cls(), q = { id: id, cur: 0, goal: d.amt ? Math.round(d.goal * AMT_K[k]) : d.goal, c: 0, k: k };
    if (d.ev === 'asset' || d.ev === 'sector') q.set = [];
    if (d.ev === 'streak') q.run = 0;
    return q;
  }
  function poolOf(per, diff) {
    var L = level();
    return Object.keys(DEFS).filter(function (id) {
      var d = DEFS[id];
      return d.p === per && (diff == null || d.diff === diff) && !(d.minLvl && L < d.minLvl);
    });
  }
  function gen(per, key) {
    var r = rng(per + key + ':' + (S.createdAt || 0)), ids;
    if (per === 'd') {
      ids = shuffle(poolOf('d', 1), r).slice(0, 1)
        .concat(shuffle(poolOf('d', 2), r).slice(0, 2), shuffle(poolOf('d', 3), r).slice(0, 1));
    } else ids = shuffle(poolOf(per), r).slice(0, PER_N[per]);
    var p = { k: key, q: ids.map(mk) };
    if (per === 'd') { p.rr = 1; p.ch = [0, 0]; } else p.ch = 0;
    return p;
  }
  /* Смена периода: выполненные, но не забранные задания зачисляем сами,
     чтобы игрок не терял награду из-за полуночи. */
  function roll(silent) {
    var q = st(), ts = nowS(), changed = false, paid = { cash: 0, xp: 0 };
    ['d', 'w', 'm'].forEach(function (per) {
      var key = keyOf(per, ts), P0 = q[per];
      if (P0 && P0.k === key) return;
      if (P0) P0.q.forEach(function (x) { if (!x.c && x.cur >= x.goal) { var r0 = payQuest(per, x, true); paid.cash += r0.cash; paid.xp += r0.xp; } });
      if (P0) autoChests(per, P0, paid);
      q[per] = gen(per, key);
      changed = true;
    });
    if (paid.cash || paid.xp) {
      if (!silent) toast(t('qs_toast_done'), 'gold', { sub: '+' + cmp(paid.cash) + ' · +' + paid.xp + ' XP' });
    }
    if (changed) saveState(false);
    return changed;
  }
  function autoChests(per, P0, paid) {
    var n = P0.q.filter(function (x) { return x.c; }).length, q = st();
    var take = function (i) {
      chestLoot(per, i, P0).forEach(function (r) {
        if (r.k === 'xp') { addXp(r.v); paid.xp += r.v; }
        else if (r.k === 'cash') paid.cash += payCash(r.v * cashK(), t('qs_src_chest'));
        else q.inv[r.b] += r.n;
      });
    };
    if (per === 'd') DAY_CHEST.forEach(function (c, i) { if (!P0.ch[i] && n >= c.at) { P0.ch[i] = 1; take(i); } });
    else if (!P0.ch && n >= P0.q.length) { P0.ch = 1; take(0); }
  }

  /* ---------------- Опыт ---------------- */

  function xp2On() { return st().act.xp2 > nowS(); }
  function addXp(v) {
    var q = st();
    if (!(v > 0)) return 0;
    if (xp2On()) v *= 2;
    var was = level();
    q.xp += v;
    var L = level();
    /* После 500 уровня опыт копится в бонусные сундуки. */
    if (L >= MAX_LVL) {
      var boxes = Math.floor((q.xp - CUM[MAX_LVL]) / OVER_XP);
      while (q.ov < boxes) { q.ov++; var b = BOOSTS[Math.floor(Math.random() * 4)]; q.inv[b]++; toast(t('qs_chest_m'), 'gold', { sub: t('qs_b_' + b) }); }
    }
    if (L > was) later(700, announce);
    return v;
  }
  var annT = 0;
  function announce() {
    var q = st(), L = level();
    if (L <= q.seen) return;
    var from = q.seen;
    q.seen = L;
    saveState(false);
    badges();
    Snd.play('pass_level');
    if (onScreen()) { clearTimeout(annT); annT = setTimeout(function () { ceremonyLevel(from, L); }, 40); return; }
    toast(t('qs_toast_lvl', { n: L }), 'gold', { action: { label: t('qs_open'), fn: function () { open(); } } });
  }

  /* ---------------- Выплаты ---------------- */

  function payCash(v, src) {
    v = Math.round(v * 100) / 100;
    if (!(v > 0)) return 0;
    S.balance += v;
    if (typeof V3L !== 'undefined') { try { V3L.log('quest', v, { src: src }); } catch (e) { dbg('qs:log', e); } }
    return v;
  }
  function questReward(x) {
    var d = DEFS[x.id];
    return { xp: d.xp || DIFF_XP[d.diff], cash: (d.cash || DIFF_CASH[d.diff]) * CASH_K[x.k || 0] };
  }
  function payQuest(per, x, quiet) {
    var r = questReward(x);
    x.c = 1;
    payCash(r.cash, t('qs_src_' + per));
    addXp(r.xp);
    if (per === 'd') bump('dq', {});
    if (per === 'w') bump('wq', {});
    if (!quiet) { pushPfSnapshot(true); saveState(true); }
    return r;
  }
  function grantItem(id) {
    if (!S.items || typeof S.items !== 'object') S.items = {};
    if (!S.items[id]) S.items[id] = Date.now();
  }
  /* Выдать награду уровня. Возвращает, что выдано, для итогового экрана. */
  function grantRw(r, L, sum, k) {
    if (r.k === 'cash') sum.cash += payCash(r.v * k, t('qs_src_lvl', { n: L }));
    else if (r.k === 'boost') { st().inv[r.b] += r.n; sum.boost[r.b] = (sum.boost[r.b] || 0) + r.n; }
    else if (r.k === 'item') { grantItem(r.id); sum.items.push(r.id); }
  }
  function claimLevels(list) {
    /* Множитель фиксируем на всю пачку: иначе выплаты поднимают класс
       прямо в цикле, и следующие уровни платят уже по новому множителю. */
    var q = st(), k = cashK(), sum = { cash: 0, boost: {}, items: [], n: 0 };
    list.forEach(function (x) {
      if (!claimable(x[0], x[1])) return;
      if (x[1]) q.cp = setBit(q.cp, x[0]); else q.cf = setBit(q.cf, x[0]);
      grantRw(rw(x[0], x[1]), x[0], sum, k);
      sum.n++;
    });
    if (sum.n) {
      if (sum.cash) pushPfSnapshot(true);
      saveState(true);
      try { if (sum.items.length && typeof Ach !== 'undefined') Ach.renderVitrine(); } catch (e) { dbg('qs:vit', e); }
    }
    return sum;
  }

  /* ---------------- События игры ---------------- */

  function addSet(x, v) { if (!v) return; x.set = x.set || []; if (x.set.indexOf(v) < 0 && x.set.length < 16) x.set.push(v); x.cur = x.set.length; }
  function applyEv(x, d, type, e) {
    switch (d.ev) {
      case 'trade': if (type === 'trade') x.cur++; break;
      case 'vol': if (type === 'trade') x.cur += e.total || 0; break;
      case 'day': if (type === 'trade') { var dk = dayK(nowS()); if (x.ld !== dk) { x.ld = dk; x.cur++; } } break;
      case 'asset': if (type === 'trade' && e.a) addSet(x, e.a.id); break;
      case 'limit': if (type === 'trade' && e.kind === 'limit') x.cur++; break;
      case 'buy': if (type === 'buy' && (!d.f || d.f(e))) x.cur++; break;
      case 'sector': if (type === 'buy') addSet(x, e.sector); break;
      case 'fopen': if (type === 'fopen' && (!d.f || d.f(e))) x.cur++; break;
      case 'win': if (type === 'close' && e.pnl > 0 && (!d.f || d.f(e))) x.cur++; break;
      case 'fwin': if (type === 'close' && e.fut && e.pnl > 0 && (!d.f || d.f(e))) x.cur++; break;
      case 'profit': if (type === 'close' && e.pnl > 0) x.cur += e.pnl; break;
      case 'streak':
        if (type !== 'close') break;
        if (e.pnl > 0) { x.run = (x.run || 0) + 1; x.cur = Math.max(x.cur, x.run); } else x.run = 0;
        break;
      case 'spin': case 'dq': case 'wq': if (type === d.ev) x.cur++; break;
    }
  }
  var doneQueue = [];
  function bump(type, e) {
    var q = st();
    ['d', 'w', 'm'].forEach(function (per) {
      if (!q[per]) return;
      q[per].q.forEach(function (x) {
        if (x.c || x.cur >= x.goal) return;
        applyEv(x, DEFS[x.id], type, e);
        if (x.cur >= x.goal) { x.cur = x.goal; doneQueue.push({ per: per, id: x.id }); }
      });
    });
    if (doneQueue.length) later(900, flushDone);
  }
  function flushDone() {
    if (!doneQueue.length) return;
    var list = doneQueue.splice(0);
    Snd.play('quest_done');
    badges();
    renderEntry();
    if (onScreen()) { list.forEach(function (x) { if (x.per === ui.seg) flashCard(x.id); }); renderLists(false); return; }
    var x = list[0];
    toast(t('qs_toast_done'), 'gold', { sub: qTitle(x.id, findQ(x.per, x.id)) + (list.length > 1 ? ' · +' + (list.length - 1) : ''),
      action: { label: t('qs_claim'), fn: function () { open(x.per); } } });
  }
  function findQ(per, id) { var P0 = st()[per]; if (!P0) return null; for (var i = 0; i < P0.q.length; i++) if (P0.q[i].id === id) return P0.q[i]; return null; }
  function tradeXp() {
    var q = st(), k = dayK(nowS());
    if (q.tx.k !== k) q.tx = { k: k, n: 0 };
    if (q.tx.n >= TRADE_XP_CAP) return;
    q.tx.n += TRADE_XP;
    addXp(TRADE_XP);
  }
  function onTradeEv(e) {
    roll(true);
    tradeXp();
    bump('trade', e);
  }
  /* Бустеры закрытия: страховка убытка и +10% к прибыли. Деньги — на спот. */
  function closeBoosters(pnl) {
    var q = st(), k = cashK();
    if (pnl < 0 && q.act.shield > 0) {
      var back = Math.min(-pnl * SHIELD_K, SHIELD_CAP * k);
      q.act.shield--;
      back = payCash(back, t('qs_src_shield'));
      if (back) later(1100, function () { toast(t('qs_shield_hit', { x: money(back, 2) }), 'ok'); });
    } else if (pnl > 0 && q.act.profit > 0) {
      var add = Math.min(pnl * PROFIT_K, PROFIT_CAP * k);
      q.act.profit--;
      add = payCash(add, t('qs_src_profit'));
      if (add) later(1100, function () { toast(t('qs_profit_hit', { x: money(add, 2) }), 'ok'); });
    }
  }
  function onSpot(args) {
    if (!ready) return;
    var side = args[0], a = args[1], total = args[4], pnl = args[5], fee = args[6], kind = args[7];
    if (!a || (side !== 'buy' && side !== 'sell')) return;
    onTradeEv({ a: a, total: num(total, 0), kind: kind, side: side });
    if (side === 'buy') {
      var chg = 0;
      try { chg = Engine.change(a, now()); } catch (e) { chg = 0; }
      bump('buy', { a: a, sector: a.sector || 'other', chg: chg });
    } else if (pnl != null && isFinite(pnl)) {
      var cost = num(total, 0) - num(fee, 0) - pnl;
      bump('close', { pnl: pnl, pct: cost > 0 ? pnl / cost : 0, fut: false });
      closeBoosters(pnl);
    }
    badges();
    if (currentTab === 'lobby') renderEntry();
  }
  /* Фьючерсы событий не шлют — сверяем их счётчик и историю каждый тик. */
  function watchFut() {
    var f = S.fut, q = st();
    if (!f || !Array.isArray(f.pos) || !Array.isArray(f.hist)) return;
    var seq = int(f.seq, 1, 1e9), top = f.hist[0] ? num(f.hist[0].t, 0) : 0;
    if (!q.fw) { q.fw = { seq: seq, t: top }; return; }
    var any = false;
    if (seq > q.fw.seq) {
      for (var id = q.fw.seq; id < seq; id++) {
        var p = null;
        for (var i = 0; i < f.pos.length; i++) if (f.pos[i].id === id) p = f.pos[i];
        var a = p ? assetById(p.a) : null;
        onTradeEv({ a: a, total: p ? p.margin * p.lev : 0, kind: 'fut', fut: true });
        if (p) bump('fopen', { lev: p.lev, a: a });
      }
      any = true;
    }
    if (top > q.fw.t) {
      for (var j = f.hist.length - 1; j >= 0; j--) {
        var hh = f.hist[j];
        if (!(num(hh.t, 0) > q.fw.t)) continue;
        onTradeEv({ a: assetById(hh.a), total: 0, kind: 'fut', fut: true });
        bump('close', { pnl: num(hh.pnl, 0), pct: num(hh.roe, 0), fut: true, lev: num(hh.lev, 1) });
        closeBoosters(num(hh.pnl, 0));
      }
      any = true;
    }
    q.fw = { seq: seq, t: Math.max(top, q.fw.t) };
    if (any) { badges(); saveState(false); }
  }

  /* ---------------- Бустеры ---------------- */

  function useBoost(b, btn) {
    var q = st();
    if (!(q.inv[b] > 0)) return;
    var msg;
    if (b === 'spin') {
      if (!(S.spinFreeAt > nowS())) { toast(t('qs_spin_ready'), '', { action: { label: t('qs_spin_go'), fn: goSpin } }); return; }
      S.spinFreeAt = 0;
      msg = t('qs_used_spin');
    } else if (b === 'fee0') {
      var left = (S.feeDiscPct >= 100 && S.feeDiscLeft > 0) ? S.feeDiscLeft : 0;
      S.feeDiscPct = 100;
      S.feeDiscLeft = left + FEE0_N;
      try { refreshFeePctLabel(); renderFeeDisc(); } catch (e) { dbg('qs:fee0', e); }
      msg = t('qs_used_fee0', { n: S.feeDiscLeft });
    } else if (b === 'profit') { q.act.profit += PROFIT_N; msg = t('qs_used_profit', { n: q.act.profit }); }
    else if (b === 'shield') { q.act.shield++; msg = t('qs_used_shield'); }
    else if (b === 'xp2') {
      q.act.xp2 = Math.max(q.act.xp2, nowS()) + XP2_MS;
      var d = new Date(q.act.xp2);
      msg = t('qs_used_xp2', { x: pad(d.getHours()) + ':' + pad(d.getMinutes()) });
    }
    q.inv[b]--;
    saveState(true);
    toast(t('qs_b_' + b), 'gold', { sub: msg, action: b === 'spin' ? { label: t('qs_spin_go'), fn: goSpin } : null });
    if (btn) { var card = btn.closest('.qs-bc'); if (card) restart(card, 'use'); }
    renderInv();
    renderEntry();
    renderBoostLine();
    badges();
    try { if (currentTab === 'lobby' && typeof renderLobby === 'function') renderLobby(); } catch (e) { dbg('qs:lobby', e); }
  }
  function activeList() {
    var q = st(), out = [];
    if (S.feeDiscPct >= 100 && S.feeDiscLeft > 0) out.push({ b: 'fee0', txt: t('qs_a_fee0', { n: S.feeDiscLeft }) });
    if (q.act.profit > 0) out.push({ b: 'profit', txt: t('qs_a_profit', { n: q.act.profit }) });
    if (q.act.shield > 0) out.push({ b: 'shield', txt: t('qs_a_shield', { n: q.act.shield }) });
    if (xp2On()) out.push({ b: 'xp2', txt: t('qs_a_xp2', { x: mmss(q.act.xp2 - nowS()) }) });
    return out;
  }
  function boostDesc(b) {
    var k = cashK();
    if (b === 'fee0') return t('qs_b_fee0_d', { n: FEE0_N });
    if (b === 'profit') return t('qs_b_profit_d', { n: PROFIT_N, x: cmp(PROFIT_CAP * k) });
    if (b === 'shield') return t('qs_b_shield_d', { x: cmp(SHIELD_CAP * k) });
    return t('qs_b_' + b + '_d');
  }
  function bb(b, cls2) { return '<i class="qs-bb b-' + b + (cls2 ? ' ' + cls2 : '') + '">' + im('b-' + b) + '</i>'; }
  function invCount() { var q = st(), n = 0; BOOSTS.forEach(function (b) { n += q.inv[b]; }); return n; }

  /* ---------------- Премиум ---------------- */

  var pay = { avail: false, price: '', icon: '', busy: false };
  function initPay() {
    YaGame.purchases().then(function (ids) {
      if (ids && ids.indexOf(PRODUCT) >= 0) setPrem(true, true);
    }).catch(function (e) { dbg('qs:purchases', e); });
    YaGame.catalog().then(function (list) {
      var p = (list || []).filter(function (x) { return x.id === PRODUCT; })[0];
      pay.avail = !!p;
      if (p) { pay.price = p.priceValue || p.price || ''; pay.icon = p.icon || ''; }
      renderAll();
    }).catch(function (e) { pay.avail = false; dbg('qs:catalog', e); renderAll(); });
  }
  function setPrem(on, silent) {
    premOwned = on;
    var q = st();
    if (q.prem === on) return;
    q.prem = on;
    saveState(true);
    if (!silent) ceremonyPrem();
    renderAll();
  }
  function priceHTML() {
    return '<b class="mono">' + h(pay.price || '—') + '</b>' + (pay.icon ? '<img class="qs-yan" src="' + h(pay.icon) + '" alt="">' : '<i class="qs-yan qs-yan-mock" aria-hidden="true"></i>');
  }
  function buyPrem() {
    if (st().prem || pay.busy) return;
    if (!pay.avail) { toast(t('qs_prem_na'), 'bad'); return; }
    pay.busy = true;
    var b = el('qs-prem-pay');
    if (b) b.classList.add('busy');
    YaGame.purchase(PRODUCT).then(function (ok) {
      pay.busy = false;
      if (b) b.classList.remove('busy');
      if (!ok) { toast(t('qs_prem_fail'), 'bad'); return; }
      closeModal('modal-qs-prem');
      later(260, function () { setPrem(true, false); });
    });
  }

  /* ---------------- Навигация ---------------- */

  var ui = { seg: 'd', stage: 1, ret: 'lobby', built: false };
  var ready = false;
  function open(seg) {
    if (!ready) return;
    build();
    roll(false);
    if (seg === 'd' || seg === 'w' || seg === 'm') ui.seg = seg;
    else ui.seg = st().seg || 'd';
    ui.stage = stageNow();
    ui.ret = (typeof currentScreen !== 'undefined' && currentScreen === 'app-main' && TAB_ORDER.indexOf(currentTab) >= 0) ? currentTab : 'lobby';
    renderAll();
    showScreen('scr-quests', 'right');
    intro();
    if (level() > st().seen) later(700, announce);
  }
  function close() {
    setTab(ui.ret, true);
    showScreen('app-main', 'left');
    renderEntry();
  }
  function goSpin() {
    try { closeModal('modal-qs-inv'); } catch (e) { dbg('qs:spin', e); }
    if (onScreen()) { setTab('lobby', true); showScreen('app-main', 'left'); }
    later(onScreen() ? 360 : 0, function () { try { openSpin(); } catch (e) { dbg('qs:openSpin', e); } });
  }
  function goTo(where) {
    if (where === 'day' || where === 'week') { setSeg(where === 'day' ? 'd' : 'w', true); return; }
    if (where === 'spin') { goSpin(); return; }
    if (where === 'meme') { S.marketCat = 'meme'; }
    if (where === 'losers') { S.marketCat = 'all'; S.sortKey = 'change'; S.sortDir = 'asc'; }
    var tab = where === 'portfolio' ? 'portfolio' : 'market';
    showScreen('app-main', 'left');
    setTab(tab);
    if (tab === 'market' && typeof Fut !== 'undefined') {
      try { Fut.setView(where === 'fut' ? 'fut' : 'spot'); } catch (e) { dbg('qs:fut', e); }
    }
  }

  /* ---------------- DOM ---------------- */

  function build() {
    if (ui.built) return;
    ui.built = true;
    var scr = document.createElement('section');
    scr.id = 'scr-quests';
    scr.className = 'screen hidden';
    scr.innerHTML =
      '<header class="topbar">' +
        '<button type="button" class="icon-btn" id="qs-back" data-qa="back">' + ic('back', 4.2) + '</button>' +
        '<span class="tr-title"><b id="qs-ttl"></b></span>' +
        '<span class="qs-bal mono" id="qs-bal">' + im('coin', 'sm') + '<span id="qs-bal-n">—</span></span>' +
        '<button type="button" class="icon-btn qs-inv-btn" id="qs-inv-btn" data-qa="inv">' + im('backpack') + '<i class="qs-nb mono" id="qs-inv-nb"></i></button>' +
      '</header>' +
      '<main id="qs-body">' +
        '<section class="card qs-pass qs-rv" id="qs-pass" style="--d:0"></section>' +
        '<nav class="qs-seg qs-rv" id="qs-seg" style="--d:90"><i class="qs-seg-ind" id="qs-seg-ind"></i>' +
          ['d', 'w', 'm'].map(function (p) { return '<button type="button" data-seg="' + p + '"><span data-i18n="qs_seg_' + p + '"></span><i class="qs-nb mono" data-nb="' + p + '"></i></button>'; }).join('') +
        '</nav>' +
        '<div class="qs-panel" id="qs-panel"></div>' +
        '<p class="qs-end" data-i18n="qs_end"></p>' +
      '</main>';
    var after = el('scr-ach') || el('scr-spin');
    after.parentNode.insertBefore(scr, after.nextSibling);
    scr.addEventListener('click', onClick);

    var inv = document.createElement('div');
    inv.id = 'modal-qs-inv';
    inv.className = 'modal hidden';
    inv.setAttribute('role', 'dialog');
    inv.setAttribute('aria-modal', 'true');
    inv.innerHTML = '<div class="backdrop" data-qa="close-inv"></div><div class="sheet qs-inv-sheet"><div class="sheet-head qs-sh-head">' +
      '<span class="qs-sh-ico">' + im('backpack') + '</span><span class="qs-sh-tx"><h2 data-i18n="qs_inv"></h2><p class="muted small" data-i18n="qs_inv_sub"></p></span>' +
      '<button type="button" class="icon-btn" data-qa="close-inv" aria-label="✕">✕</button></div><div id="qs-inv-body"></div></div>';
    document.body.appendChild(inv);
    inv.addEventListener('click', onClick);

    var pr = document.createElement('div');
    pr.id = 'modal-qs-prem';
    pr.className = 'modal hidden';
    pr.setAttribute('role', 'dialog');
    pr.setAttribute('aria-modal', 'true');
    pr.innerHTML = '<div class="backdrop" data-qa="close-prem"></div><div class="sheet qs-prem-sheet"><div class="sheet-head qs-ps-head"><span></span>' +
      '<button type="button" class="icon-btn" data-qa="close-prem" aria-label="✕">✕</button></div><div id="qs-prem-body"></div></div>';
    document.body.appendChild(pr);
    pr.addEventListener('click', onClick);

    var cer = document.createElement('div');
    cer.id = 'modal-qs-cer';
    cer.className = 'modal hidden qs-cer';
    cer.setAttribute('role', 'dialog');
    cer.setAttribute('aria-modal', 'true');
    cer.innerHTML = '<div class="backdrop"></div><i class="qs-rays" aria-hidden="true"></i><div class="qs-cer-card" id="qs-cer-card"></div>';
    document.body.appendChild(cer);
    cer.addEventListener('click', onClick);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !onScreen()) return;
      if (qa('.modal:not(.hidden)').length) return;
      close();
    });
    window.addEventListener('resize', function () { moveInd(); });
    try { applyI18n(); } catch (e) { dbg('qs:i18n', e); }
  }

  /* Карточка в «Меню» — сразу под ежедневным бонусом. */
  function buildEntry() {
    if (el('lb-quests')) return el('lb-quests');
    var anchor = el('lb-daily');
    if (!anchor) return null;
    var c = document.createElement('section');
    c.className = 'card qs-entry';
    c.id = 'lb-quests';
    c.setAttribute('role', 'button');
    c.setAttribute('tabindex', '0');
    c.innerHTML =
      '<div class="qs-e-head"><div><span class="v3-kicker" id="qs-e-k"></span><h2 id="qs-e-t"></h2></div>' +
        '<span class="qs-tmr">' + ic('clock', 4) + '<b class="mono" id="qs-e-tm">—</b></span></div>' +
      '<div class="qs-e-mid"><div class="qs-rings" id="qs-e-rings"></div>' +
        '<div class="qs-e-lvl"><div class="qs-hex sm" id="qs-e-hex"><b id="qs-e-lv">0</b></div><span><small id="qs-e-st"></small><b class="mono" id="qs-e-xp"></b></span></div></div>' +
      '<div class="qs-e-bar"><div class="qs-bar blue"><u id="qs-e-xpu"></u></div></div>' +
      '<div class="qs-e-act" id="qs-e-act"></div>' +
      '<div class="qs-e-btns"><button type="button" class="btn primary qs-e-cta" id="qs-e-cta" data-qa="open"></button>' +
        '<button type="button" class="btn qs-e-inv" data-qa="inv" id="qs-e-inv">' + im('backpack') + '<i class="qs-nb mono" id="qs-e-invn"></i></button></div>';
    anchor.parentNode.insertBefore(c, anchor.nextSibling);
    c.addEventListener('click', function (e) {
      if (e.target.closest('[data-qa="inv"]')) { openInv(); return; }
      open();
    });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === c) open(); });
    var tab = document.querySelector('.tabbar button[data-tab="lobby"]');
    if (tab && !tab.querySelector('.qs-tab-dot')) { var dot = document.createElement('i'); dot.className = 'qs-tab-dot'; tab.appendChild(dot); }
    return c;
  }

  /* ---------------- Отрисовка: общий слой ---------------- */

  function qTitle(id, x) {
    var d = DEFS[id];
    return t('q_' + id + '_t', { x: cmp(x ? x.goal : d.goal) });
  }
  function pv(d, v) { return d.amt ? cmp(v) : String(Math.floor(v + 1e-9)); }
  function readyCount(per) { var P0 = st()[per]; return P0 ? P0.q.filter(function (x) { return !x.c && x.cur >= x.goal; }).length : 0; }
  function chestReady(per) {
    var P0 = st()[per];
    if (!P0) return 0;
    var n = P0.q.filter(function (x) { return x.c; }).length;
    if (per === 'd') return DAY_CHEST.filter(function (c, i) { return !P0.ch[i] && n >= c.at; }).length;
    return !P0.ch && n >= P0.q.length ? 1 : 0;
  }
  function totalReady() {
    return readyCount('d') + readyCount('w') + readyCount('m') + chestReady('d') + chestReady('w') + chestReady('m') + claimableList().length;
  }
  function badges() {
    if (!ready) return;
    var n = totalReady();
    var dot = document.querySelector('.tabbar .qs-tab-dot');
    if (dot) dot.classList.toggle('on', n > 0);
    ['d', 'w', 'm'].forEach(function (p) {
      var b = document.querySelector('#qs-seg [data-nb="' + p + '"]');
      if (b) setNb(b, readyCount(p) + chestReady(p));
    });
    var ni = invCount();
    setNb(el('qs-inv-nb'), ni);
    setNb(el('qs-e-invn'), ni);
  }
  function setNb(b, n) { if (!b) return; b.textContent = n > 99 ? '99+' : (n || ''); b.classList.toggle('on', n > 0); }

  /* Иконка награды: деньги, бустер или предмет витрины. */
  function itemIcon(id) {
    var ty = itemType(id), key;
    if (ty === 'frame') {
      key = id.replace('frame_', '');
      return '<span class="qs-mava fr-' + h(key) + '"><img src="' + h(avatarSrc(S.avatar)) + '" alt="" draggable="false"></span>';
    }
    if (ty === 'theme') {
      var c = THEME_SW[id] || ['#e9b640', '#12161d'];
      return '<i class="qs-sw" style="--a:' + c[0] + ';--b:' + c[1] + '"><u></u><u></u><u></u></i>';
    }
    if (ty === 'candles') {
      var sk = null;
      try { sk = Ach.v3p.skins[id.replace('candles_', '')]; } catch (e) { sk = null; }
      var up = (sk && sk.up) || 'var(--up)', dn = (sk && sk.down) || 'var(--down)';
      var hs = [[8, 20, 1], [14, 26, 0], [6, 18, 1], [10, 30, 1]], out = '';
      hs.forEach(function (b, i) {
        var col = b[2] ? up : dn;
        out += '<rect x="' + (5 + i * 10) + '" y="' + b[0] + '" width="6" height="' + b[1] + '" rx="1.6" style="' + (sk && sk.hollow ? 'fill:none;stroke:' + col + ';stroke-width:1.4' : 'fill:' + col) + '"/>';
      });
      var glow = sk && sk.glow ? 'filter:drop-shadow(0 0 3px ' + up + ')' : '';
      return '<svg class="qs-cd" viewBox="0 0 46 44" style="' + glow + '" aria-hidden="true">' + out + '</svg>';
    }
    var ip = '';
    try { ip = Ach.v3p.titleIcon(id); } catch (e) { ip = ''; }
    return '<i class="qs-ttl">' + '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ip + '</svg></i>';
  }
  function rIcon(r) {
    if (r.k === 'cash') return im('cash', 'big');
    if (r.k === 'boost') return bb(r.b);
    return itemIcon(r.id);
  }
  function rLabel(r) {
    if (r.k === 'cash') return cmp(r.v * cashK());
    if (r.k === 'boost') return (r.n > 1 ? r.n + '× ' : '') + t('qs_b_' + r.b);
    return t('item_' + r.id + '_t');
  }
  function rSub(r) {
    if (r.k === 'cash') return t('qs_rw_cash');
    if (r.k === 'boost') return t('qs_rw_boost');
    return t('qs_k_' + itemType(r.id));
  }

  function renderAll() {
    if (!ready) return;
    renderEntry();
    badges();
    if (!ui.built) return;
    el('qs-ttl').textContent = t('qs_title');
    renderBal();
    renderPass();
    renderSeg();
    renderLists(false);
    if (!el('modal-qs-inv').classList.contains('hidden')) renderInv();
  }
  function renderBal() { var b = el('qs-bal-n'); if (b) b.textContent = money(S.balance, 0); }

  /* ---------------- Пропуск ---------------- */

  function renderPass() {
    var q = st(), pg = prog(), s = ui.stage, box = el('qs-pass');
    var nClaim = claimableList().length;
    box.style.setProperty('--sc', STAGE_C[stageNow() - 1]);
    box.innerHTML =
      '<div class="qs-pass-top">' +
        '<div class="qs-hex" id="qs-hex"><b class="mono" id="qs-lvl">' + pg.L + '</b></div>' +
        '<div class="qs-pass-tt"><span class="v3-kicker">' + h(t('qs_stage_k', { n: stageNow(), name: stageName(stageNow()) })) + '</span>' +
          '<h2>' + h(t('qs_pass')) + '</h2><small>' + h(pg.max ? t('qs_lvl_max') : t('qs_lvl_of', { n: pg.L, m: MAX_LVL })) + '</small></div>' +
        (premShown() ? '<button type="button" class="qs-prem-btn' + (q.prem ? ' on' : '') + '" data-qa="prem">' + im('crown', 'sm') + '<span>' + h(t('qs_premium')) + '</span>' + (q.prem ? '' : ic('lock', 4)) + '</button>' : '') +
      '</div>' +
      '<div class="qs-xp"><div class="qs-bar blue" id="qs-xpbar"><u id="qs-xp-u" style="width:' + (pg.into / pg.need * 100).toFixed(1) + '%"></u></div>' +
        '<span class="qs-xp-t mono"><b id="qs-xp-n">' + Math.floor(pg.into) + '</b> / ' + pg.need + ' XP</span></div>' +
      '<div class="qs-xp-next">' + (pg.max ? h(t('qs_next_max', { x: Math.ceil(pg.need - pg.into) })) : h(t('qs_next', { n: pg.L + 1, x: Math.ceil(pg.need - pg.into) })) +
        (xp2On() ? ' <b class="qs-x2">×2</b>' : '')) + '</div>' +
      '<div class="qs-stages" id="qs-stages">' + stagesHTML() + '</div>' +
      '<div class="qs-track' + (premShown() ? '' : ' no-prem') + '" id="qs-track">' + trackHTML(s) + '</div>' +
      '<div class="qs-pass-foot"><button type="button" class="btn primary qs-claim-all' + (nClaim ? '' : ' idle') + '" data-qa="claim-all"' + (nClaim ? '' : ' disabled') + '>' +
        ic('gift', 3.6) + '<span>' + h(nClaim ? t('qs_claim_all') + ' · ' + nClaim : t('qs_nothing')) + '</span></button></div>' +
      '<div class="qs-boostline" id="qs-boostline"></div>';
    renderBoostLine();
  }
  function stagesHTML() {
    var L = level(), out = '';
    for (var s = 1; s <= STAGES; s++) {
      var open0 = L >= (s - 1) * STAGE_LEN, done = L >= s * STAGE_LEN;
      out += '<button type="button" class="qs-stg' + (s === ui.stage ? ' on' : '') + (done ? ' done' : '') + (open0 ? '' : ' lock') + '" data-stage="' + s + '" style="--c:' + STAGE_C[s - 1] + '">' +
        '<i>' + (done ? ic('check', 5) : open0 ? s : ic('lock', 4.4)) + '</i><span>' + h(stageName(s)) + '</span></button>';
    }
    return out;
  }
  function tileHTML(L, prem) {
    var r = rw(L, prem), q = st(), stt;
    if (prem && !q.prem) stt = L <= level() ? 'locked avail' : 'locked';
    else if (hasBit(prem ? q.cp : q.cf, L)) stt = 'claimed';
    else stt = L <= level() ? 'claimable' : 'future';
    var big = r.k === 'item' ? ' item' : '';
    return '<button type="button" class="qs-tt ' + (prem ? 'p ' : '') + stt + big + '" data-l="' + L + '" data-p="' + (prem ? 1 : 0) + '">' +
      rIcon(r) + '<span>' + h(rLabel(r)) + '</span>' +
      (stt.indexOf('locked') === 0 ? '<i class="qs-lk">' + ic('lock', 4.6) + '</i>' : '') +
      (stt === 'claimed' ? '<i class="qs-ok">' + ic('check', 5.4) + '</i>' : '') + '</button>';
  }
  function trackHTML(s) {
    var L = level(), a = (s - 1) * STAGE_LEN + 1, b = s * STAGE_LEN;
    var out = '<div class="qs-tlab"><span>' + h(t('qs_free')) + '</span><span class="g">' + h(t('qs_premium')) + '</span></div>';
    for (var i = a; i <= b; i++) {
      out += '<div class="qs-tc' + (i <= L ? ' reached' : '') + (i === L ? ' cur' : '') + (i % 10 === 0 ? ' ten' : '') + '" data-col="' + i + '">' +
        tileHTML(i, false) + '<i class="qs-tdot mono">' + i + '</i>' + tileHTML(i, true) + '</div>';
    }
    if (s < STAGES) {
      out += '<div class="qs-tend' + (L >= b ? ' open' : '') + '" style="--c:' + STAGE_C[s] + '"><i>' + ic(L >= b ? 'go' : 'lock', 4) + '</i><b>' + h(t('qs_next_stage', { n: s + 1 })) + '</b><span>' +
        h(L >= b ? stageName(s + 1) : t('qs_stage_lock', { n: b })) + '</span></div>';
    }
    return out;
  }
  function centerTrack(smooth) {
    var tr = el('qs-track');
    if (!tr) return;
    var L = level(), a = (ui.stage - 1) * STAGE_LEN + 1;
    var target = clamp(L + 1, a, a + STAGE_LEN - 1);
    var first = claimableList().filter(function (x) { return x[0] >= a && x[0] < a + STAGE_LEN; })[0];
    if (first) target = first[0];
    var col = tr.querySelector('[data-col="' + target + '"]');
    if (!col) return;
    var x = col.offsetLeft - tr.clientWidth / 2 + col.offsetWidth / 2 + 18;
    if (smooth && !V3.reduced()) tr.scrollTo({ left: x, behavior: 'smooth' });
    else tr.scrollLeft = x;
  }
  function setTile(L, prem) {
    var t0 = document.querySelector('#qs-track .qs-tt[data-l="' + L + '"][data-p="' + (prem ? 1 : 0) + '"]');
    if (t0) t0.outerHTML = tileHTML(L, prem);
  }
  function renderBoostLine() {
    var box = el('qs-boostline');
    if (!box) return;
    var list = activeList();
    box.classList.toggle('hidden', !list.length);
    box.innerHTML = list.map(function (a) { return '<span class="qs-chip">' + bb(a.b, 'xs') + '<b data-act="' + a.b + '">' + h(a.txt) + '</b></span>'; }).join('');
  }

  /* ---------------- Сегменты и списки ---------------- */

  function renderSeg() {
    qa('#qs-seg button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-seg') === ui.seg); });
    moveInd();
  }
  function moveInd() {
    var b = document.querySelector('#qs-seg button.on'), ind = el('qs-seg-ind');
    if (!b || !ind || !b.offsetWidth) return;
    ind.style.width = b.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  function setSeg(p, anim) {
    var order = ['d', 'w', 'm'], dir = order.indexOf(p) >= order.indexOf(ui.seg) ? 1 : -1;
    ui.seg = p;
    st().seg = p;
    renderSeg();
    renderLists(anim ? dir : 0);
  }
  function chestHTML(per) {
    var P0 = st()[per], n = P0.q.filter(function (x) { return x.c; }).length, m = P0.q.length;
    var head = '<div class="qs-sum-h"><span class="v3-kicker">' + h(t('qs_' + per + '_head')) + '</span>' +
      '<span class="qs-tmr">' + ic('clock', 4) + '<b class="mono" data-left="' + per + '">' + h(leftTxt(per)) + '</b></span></div>' +
      '<b class="qs-sum-t">' + h(n >= m ? t('qs_all_done') : t('qs_done_of', { n: n, m: m })) + '</b>';
    var bar;
    if (per === 'd') {
      bar = '<div class="qs-act"><u style="width:' + (n / m * 100) + '%"></u>' + DAY_CHEST.map(function (c, i) {
        var rd = !P0.ch[i] && n >= c.at, got = !!P0.ch[i];
        return '<button type="button" class="qs-chest' + (rd ? ' ready' : '') + (got ? ' open' : '') + '" style="--p:' + (c.at / m * 100) + '%" data-qa="chest" data-per="d" data-i="' + i + '">' +
          '<img src="' + giftImg() + '" alt="" draggable="false"><i class="qs-ok">' + ic('check', 5.4) + '</i><b class="mono">' + c.at + '</b></button>';
      }).join('') + '</div>';
    } else {
      var rd2 = !P0.ch && n >= m, cfg = per === 'w' ? WEEK_CHEST : MONTH_CHEST;
      bar = '<div class="qs-wk"><div class="qs-pips">' + P0.q.map(function (x) { return '<i class="' + (x.c ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<button type="button" class="qs-wchest' + (rd2 ? ' ready' : '') + (P0.ch ? ' open' : '') + '" data-qa="chest" data-per="' + per + '" data-i="0">' +
        '<img src="' + giftImg() + '" alt="" draggable="false"><span><b>' + h(t('qs_chest_' + per)) + '</b><small>+' + cfg.xp + ' XP · ' + cfg.n + '× ' + h(t('qs_rw_boost')) +
        (cfg.cash ? ' · ' + cmp(cfg.cash * cashK()) : '') + '</small></span><em>' + h(P0.ch ? t('qs_chest_got') : rd2 ? t('qs_chest_open') : t('qs_chest_need', { n: m - n })) + '</em></button></div>';
    }
    return '<section class="card qs-sum qs-rv" style="--d:160">' + head + bar + '</section>';
  }
  function sortedQ(per) {
    var R = { ready: 0, active: 1, claimed: 2 };
    return st()[per].q.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) {
      return R[qst(a.x)] - R[qst(b.x)] || a.i - b.i;
    });
  }
  function qst(x) { return x.c ? 'claimed' : x.cur >= x.goal ? 'ready' : 'active'; }
  function cardHTML(per, x, i, n) {
    var d = DEFS[x.id], s = qst(x), r = questReward(x), df = d.diff || (per === 'w' ? 2 : 3);
    var acts = '';
    if (s === 'ready') acts = '<button type="button" class="qs-qbtn" data-qa="claim">' + ic('gift', 3.6) + h(t('qs_claim')) + '</button>';
    else if (s === 'active') {
      acts = (per === 'd' ? '<button type="button" class="qs-rr" data-qa="reroll" aria-label="↻">' + ic('reroll', 3.6) + (st().d.rr > 0 ? '' : '<i class="qs-adb">' + ic('play', 3) + '</i>') + '</button>' : '') +
        '<button type="button" class="qs-rr go" data-qa="go" aria-label="' + h(t('qs_go')) + '">' + ic('go', 4) + '</button>';
    }
    return '<article class="qs-q d' + df + ' ' + s + ' qs-rv" style="--d:' + (220 + n * 60) + '" data-per="' + per + '" data-i="' + i + '" data-id="' + x.id + '">' +
      '<div class="qs-q-row"><div class="qs-q-ic"><img src="' + achImg(d.img) + '" alt="" draggable="false"><i class="qs-q-ok">' + ic('check', 5.4) + '</i></div>' +
      '<div class="qs-q-main"><div class="qs-q-t"><b>' + h(qTitle(x.id, x)) + '</b><span class="qs-diff">' + h(t('qs_diff_' + df)) + '</span></div>' +
      '<p class="qs-q-d">' + h(t('q_' + x.id + '_d')) + '</p></div></div>' +
      '<div class="qs-q-prog"><div class="qs-bar"><u style="width:' + (clamp(x.cur / x.goal, 0, 1) * 100).toFixed(1) + '%"></u></div>' +
      '<span class="qs-q-pn mono">' + pv(d, Math.min(x.cur, x.goal)) + ' / ' + pv(d, x.goal) + '</span></div>' +
      '<div class="qs-q-foot"><span class="qs-rw">' + im('cash', 'sm') + '+' + h(cmp(r.cash)) + '</span><span class="qs-rw">' + im('xp', 'sm') + '+' + r.xp + ' XP</span>' +
      '<div class="qs-q-act">' + acts + '</div></div><span class="qs-stamp">' + h(t('qs_stamp')) + '</span></article>';
  }
  function renderLists(dir) {
    if (!ui.built) return;
    roll(true);
    var per = ui.seg, box = el('qs-panel'), k = cls();
    var list = sortedQ(per).map(function (o, n) { return cardHTML(per, o.x, o.i, n); }).join('');
    var mult = k > 0 ? '<span class="qs-mult"><img src="' + h(CLASSES[k].img || '') + '" alt="">' + h(t('qs_mult', { name: CLASSES[k].name[LANG] || CLASSES[k].name.ru, k: CASH_K[k] })) + '</span>' : '';
    box.innerHTML = chestHTML(per) + (mult ? '<div class="qs-lh qs-rv" style="--d:200">' + mult + '</div>' : '') +
      '<div class="qs-list">' + list + '</div>' +
      (per === 'd' ? '<p class="qs-rr-info">' + h(st().d.rr > 0 ? t('qs_rr_free') : t('qs_rr_ad')) + '</p>' : '');
    if (dir) { box.style.setProperty('--dir', dir); restart(box, 'pin'); qa('.qs-rv', box).forEach(function (x) { x.style.opacity = 1; }); }
    badges();
  }
  function flashCard(id) {
    var c = document.querySelector('#qs-panel .qs-q[data-id="' + id + '"]');
    if (c) restart(c, 'glint');
  }
  var introT = 0;
  function intro() {
    var b = el('qs-body');
    if (!b) return;
    b.scrollTop = 0;
    b.classList.remove('intro', 'shown');
    reflow(b);
    b.classList.add('intro');
    clearTimeout(introT);
    introT = later(1300, function () { b.classList.add('shown'); b.classList.remove('intro'); });
    var u = el('qs-xp-u');
    if (u && !V3.reduced()) {
      var w = u.style.width;
      u.style.transition = 'none';
      u.style.width = '0%';
      reflow(u);
      u.style.transition = '';
      later(260, function () { u.style.width = w; });
    }
  }

  /* ---------------- Действия ---------------- */

  function claimQuestAt(per, i, btn) {
    var x = st()[per].q[i];
    if (!x || qst(x) !== 'ready') return;
    var card = btn.closest('.qs-q'), was = prog();
    var r = payQuest(per, x, false);
    renderBal();
    flyTo('coin', btn, el('qs-bal'), 8, function () { Snd.play('coin_hit'); restart(el('qs-bal'), 'bump'); });
    later(110, function () { flyTo('xp', btn, el('qs-xpbar'), 6, function () { animXp(was); }); });
    if (card) {
      card.classList.remove('ready');
      card.classList.add('claimed');
      var ab = card.querySelector('.qs-q-act');
      if (ab) ab.innerHTML = '';
      restart(card, 'stamp-in');
    }
    FX.vibrate([10, 30, 16]);
    later(950, function () { renderLists(0); renderPass(); centerTrack(true); });
    renderEntry();
    badges();
    return r;
  }
  /* Полоса опыта догоняет новое значение; если уровень сменился — до конца и с нуля. */
  function animXp(was) {
    var u = el('qs-xp-u'), n = el('qs-xp-n'), now0 = prog();
    if (!u) return;
    Snd.play('xp');
    restart(el('qs-hex'), 'bump');
    if (now0.L !== was.L) { u.style.width = '100%'; later(420, function () { renderPass(); }); return; }
    u.style.width = (now0.into / now0.need * 100).toFixed(1) + '%';
    if (n) { n.__v3v = was.into; V3.countTo(n, now0.into, function (v) { return String(Math.floor(v)); }, 600); }
  }
  function reroll(i, btn) {
    var P0 = st().d, x = P0.q[i];
    if (!x || qst(x) !== 'active') return;
    var go = function () {
      var used = P0.q.map(function (y) { return y.id; }), d0 = DEFS[x.id].diff;
      var pool = poolOf('d', d0).filter(function (id) { return used.indexOf(id) < 0; });
      if (!pool.length) pool = poolOf('d').filter(function (id) { return used.indexOf(id) < 0; });
      if (!pool.length) return;
      var card = btn.closest('.qs-q');
      if (card) restart(card, 'flip-out');
      later(260, function () {
        P0.q[i] = mk(pool[Math.floor(Math.random() * pool.length)]);
        saveState(true);
        renderLists(0);
        var nc = document.querySelector('#qs-panel .qs-q[data-i="' + i + '"]');
        if (nc) { nc.style.opacity = 1; restart(nc, 'flip-in'); }
        renderEntry();
        toast(t('qs_rr_done'), 'ok');
      });
    };
    if (P0.rr > 0) { P0.rr = 0; go(); return; }
    YaGame.showRewarded().then(function (ok) { if (ok) go(); else toast(t('qs_rr_ad_fail'), 'bad'); });
  }
  function tileTap(btn) {
    var L = +btn.getAttribute('data-l'), prem = btn.getAttribute('data-p') === '1', r = rw(L, prem), q = st();
    if (claimable(L, prem)) {
      var sum = claimLevels([[L, prem]]);
      tileFx(btn, r, sum);
      setTile(L, prem);
      later(700, function () { renderPass(); centerTrack(false); badges(); renderEntry(); });
      return;
    }
    if (prem && !q.prem) { openPrem(); return; }
    if (L > level()) toast(t('qs_future', { n: L }), '', { sub: rLabel(r) + ' · ' + rSub(r) });
    else toast(t('qs_claimed'), '');
  }
  function tileFx(src, r, sum) {
    if (r.k === 'cash') { renderBal(); flyTo('coin', src, el('qs-bal'), 7, function () { restart(el('qs-bal'), 'bump'); }); }
    else if (r.k === 'boost') flyTo('boost', src, el('qs-inv-btn'), 4, function () { restart(el('qs-inv-btn'), 'bump'); badges(); });
    else itemToast(r.id);
    FX.vibrate(10);
  }
  function itemToast(id) {
    toast(t('qs_item_new'), 'gold', { sub: t('item_' + id + '_t') + ' · ' + t('qs_k_' + itemType(id)),
      action: { label: t('qs_wear'), fn: function () { try { Ach.v3p.equipItem(id); } catch (e) { dbg('qs:wear', e); } } } });
  }
  function claimAll(src) {
    var list = claimableList();
    if (!list.length) return;
    var sum = claimLevels(list);
    if (sum.n) Snd.play('bonus');
    if (src) {
      if (sum.cash) { renderBal(); flyTo('coin', src, el('qs-bal'), 9, function () { restart(el('qs-bal'), 'bump'); }); }
      if (Object.keys(sum.boost).length) later(120, function () { flyTo('boost', src, el('qs-inv-btn'), 5, function () { restart(el('qs-inv-btn'), 'bump'); }); });
    }
    later(src ? 650 : 0, function () { renderPass(); centerTrack(true); badges(); renderEntry(); ceremonySum(sum); });
  }

  /* ---------------- Сундуки ---------------- */

  function chestLoot(per, i, P1) {
    var P0 = P1 || st()[per], r = rng('chest' + per + P0.k + i + (S.createdAt || 0)), cfg, out = [];
    if (per === 'd') {
      cfg = DAY_CHEST[i];
      out.push({ k: 'xp', v: cfg.xp });
      out.push({ k: 'boost', b: cfg.boost[Math.floor(r() * cfg.boost.length)], n: 1 });
      if (i === 1) out.push({ k: 'cash', v: 200 });
    } else {
      cfg = per === 'w' ? WEEK_CHEST : MONTH_CHEST;
      out.push({ k: 'xp', v: cfg.xp });
      shuffle(['fee0', 'profit', 'shield', 'xp2'], r).slice(0, cfg.n).forEach(function (b) { out.push({ k: 'boost', b: b, n: 1 }); });
      if (cfg.cash) out.push({ k: 'cash', v: cfg.cash });
    }
    return out;
  }
  var CH = null;
  function openChest(per, i) {
    var P0 = st()[per];
    if (!P0) return;
    var got = per === 'd' ? P0.ch[i] : P0.ch;
    var n = P0.q.filter(function (x) { return x.c; }).length, need = per === 'd' ? DAY_CHEST[i].at : P0.q.length;
    if (got) { toast(t('qs_chest_got'), ''); return; }
    if (n < need) { toast(t('qs_chest_need', { n: need - n }), '', { sub: t('qs_' + per + '_head') }); return; }
    CH = { per: per, i: i, loot: chestLoot(per, i), stage: 0 };
    cerOpen('<span class="qs-cer-k">' + h(per === 'd' ? (i ? t('qs_chest_full') : t('qs_chest_half')) : t('qs_chest_' + per)) + '</span>' +
      '<div class="qs-ch-wrap" id="qs-ch-wrap"><i class="qs-ch-glow"></i><img class="qs-ch-box" id="qs-ch-box" src="' + giftImg() + '" alt="" data-qa="chest-tap" draggable="false"><div class="qs-loot" id="qs-loot"></div></div>' +
      '<span class="qs-ch-hint" id="qs-ch-hint">' + h(t('qs_tap_chest')) + '</span>' +
      '<button type="button" class="btn primary big qs-cer-btn" id="qs-ch-take" data-qa="chest-take" hidden>' + h(t('qs_take')) + '</button>', 'chest');
  }
  function tapChest() {
    if (!CH || CH.stage !== 0) return;
    CH.stage = 1;
    var box = el('qs-ch-box');
    el('qs-ch-hint').hidden = true;
    box.classList.add('shake');
    FX.vibrate([12, 40, 12, 40, 20]);
    Snd.play('chest');
    later(820, function () {
      box.classList.remove('shake');
      box.classList.add('boom');
      var fl = document.createElement('i');
      fl.className = 'qs-flash';
      el('qs-ch-wrap').appendChild(fl);
      el('modal-qs-cer').classList.add('rays-on');
      try { FX.confetti(); } catch (e) { dbg('qs:conf', e); }
      el('qs-loot').innerHTML = CH.loot.map(function (r, j) {
        var icon = r.k === 'xp' ? im('xp', 'big') : r.k === 'cash' ? im('cash', 'big') : bb(r.b);
        var lbl = r.k === 'xp' ? '+' + r.v + ' XP' : r.k === 'cash' ? cmp(r.v * cashK()) : t('qs_b_' + r.b);
        return '<div class="qs-lc" style="--fx:' + ((1 - j) * 100) + 'px;--dl:' + (j * 150) + 'ms"><div class="qs-lc-f">' + icon + '<b>' + h(lbl) + '</b></div><div class="qs-lc-b"></div></div>';
      }).join('');
      later(420, function () { box.hidden = true; });
      later(1150, function () { el('qs-ch-take').hidden = false; CH.stage = 2; });
    });
  }
  function takeChest() {
    if (!CH || CH.stage !== 2) return;
    CH.stage = 3;
    var P0 = st()[CH.per], was = prog(), cards = qa('#qs-loot .qs-lc');
    if (CH.per === 'd') P0.ch[CH.i] = 1; else P0.ch = 1;
    CH.loot.forEach(function (r, j) {
      if (r.k === 'xp') addXp(r.v);
      else if (r.k === 'cash') payCash(r.v * cashK(), t('qs_src_chest'));
      else st().inv[r.b] += r.n;
      if (onScreen() && cards[j]) {
        var target = r.k === 'xp' ? el('qs-xpbar') : r.k === 'cash' ? el('qs-bal') : el('qs-inv-btn');
        flyTo(r.k === 'xp' ? 'xp' : r.k === 'cash' ? 'coin' : 'boost', cards[j], target, 6, function () { restart(target, 'bump'); });
      }
    });
    pushPfSnapshot(true);
    saveState(true);
    CH = null;
    closeModal('modal-qs-cer');
    later(700, function () { renderBal(); renderPass(); renderLists(0); animXp(was); badges(); renderEntry(); });
  }

  /* ---------------- Церемонии ---------------- */

  function cerOpen(html, mode) {
    build();
    var m = el('modal-qs-cer');
    m.setAttribute('data-mode', mode);
    m.classList.remove('rays-on');
    el('qs-cer-card').innerHTML = html;
    openModal('modal-qs-cer');
    if (mode !== 'chest') { reflow(m); m.classList.add('rays-on'); }
  }
  function lvTile(r, prem) {
    var locked = prem && !st().prem;
    return '<div class="qs-lvt' + (prem ? ' g' : '') + (locked ? ' locked' : '') + '">' + rIcon(r) + '<b>' + h(rLabel(r)) + '</b><small>' + h(prem ? t('qs_premium') : t('qs_free')) + '</small>' +
      (locked ? '<i class="qs-lk">' + ic('lock', 4.6) + '</i>' : '') + '</div>';
  }
  function ceremonyLevel(from, to) {
    var n = to - from, stageUp = Math.floor(to / STAGE_LEN) > Math.floor(from / STAGE_LEN) && to < MAX_LVL;
    var tiles = lvTile(rw(to, false), false) + (premShown() ? lvTile(rw(to, true), true) : '');
    var more = claimableList().length - (1 + (st().prem ? 1 : 0));
    var html = '<span class="qs-cer-k">' + h(t('qs_stage_k', { n: stageNow(), name: stageName(stageNow()) })) + '</span>' +
      '<div class="qs-lvhex" style="--sc:' + STAGE_C[stageNow() - 1] + '"><div class="qs-lvnum mono"><div class="qs-lvroll"><span>' + Math.max(0, to - 1) + '</span><span>' + to + '</span></div></div></div>' +
      '<b class="qs-cer-t">' + h(n > 1 ? t(lvlForm(n), { n: n }) : t('qs_cer_lvl')) + '</b>' +
      (stageUp ? '<div class="qs-cer-stage" style="--c:' + STAGE_C[stageNow() - 1] + '"><b>' + h(t('qs_cer_stage', { n: stageNow() }) + ' · ' + stageName(stageNow())) + '</b><span>' +
        h(t('qs_cer_stage_d', { a: (stageNow() - 1) * STAGE_LEN + 1, b: stageNow() * STAGE_LEN, x: perLvl(to + 1) })) + '</span></div>' : '') +
      '<div class="qs-lvrow">' + tiles + '</div>' +
      (more > 0 ? '<p class="qs-cer-s">' + h(t('qs_cer_more', { n: more })) + '</p>' : '') +
      (premShown() && !st().prem ? '<button type="button" class="qs-cer-link" data-qa="prem">' + im('crown', 'sm') + h(t('qs_prem_lock')) + '</button>' : '') +
      '<div class="qs-cer-btns"><button type="button" class="btn qs-cer-sec" data-qa="cer-close">' + h(t('qs_later')) + '</button>' +
      '<button type="button" class="btn primary qs-cer-btn" data-qa="cer-claim">' + ic('gift', 3.6) + h(t('qs_claim_all')) + '</button></div>';
    cerOpen(html, 'level');
    var m = el('modal-qs-cer');
    later(80, function () { m.classList.add('play'); });
    try { FX.confetti(); } catch (e) { dbg('qs:conf', e); }
    FX.vibrate([14, 40, 24]);
    if (stageUp) { ui.stage = stageNow(); renderPass(); later(40, function () { centerTrack(false); }); }
  }
  function lvlForm(n) {
    var a = n % 100, b = n % 10;
    return (a > 10 && a < 20) || b === 0 || b >= 5 ? 'qs_cer_lvls5' : b === 1 ? 'qs_cer_lvls1' : 'qs_cer_lvls';
  }
  function sumTiles(sum) {
    var out = '';
    if (sum.cash) out += '<div class="qs-lvt">' + im('cash', 'big') + '<b>' + h(cmp(sum.cash)) + '</b><small>' + h(t('qs_rw_cash')) + '</small></div>';
    Object.keys(sum.boost).forEach(function (b) { out += '<div class="qs-lvt">' + bb(b) + '<b>' + sum.boost[b] + '× ' + h(t('qs_b_' + b)) + '</b><small>' + h(t('qs_rw_boost')) + '</small></div>'; });
    sum.items.forEach(function (id) { out += '<div class="qs-lvt g">' + itemIcon(id) + '<b>' + h(t('item_' + id + '_t')) + '</b><small>' + h(t('qs_k_' + itemType(id))) + '</small></div>'; });
    return out;
  }
  function ceremonySum(sum) {
    if (!sum || !sum.n) return;
    cerOpen('<span class="qs-cer-k">' + h(t('qs_pass')) + '</span><b class="qs-cer-t">' + h(t('qs_cer_sum')) + '</b>' +
      '<div class="qs-lvrow wrap">' + sumTiles(sum) + '</div>' +
      '<div class="qs-cer-btns"><button type="button" class="btn primary qs-cer-btn" data-qa="cer-close">' + h(t('qs_great')) + '</button></div>', 'sum');
    if (sum.items.length) try { FX.confetti(); } catch (e) { dbg('qs:conf', e); }
  }
  function ceremonyPrem() {
    var n = 0, L = level();
    for (var i = 1; i <= L; i++) if (!hasBit(st().cp, i)) n++;
    cerOpen('<span class="qs-cer-k">' + h(t('qs_pass')) + '</span><div class="qs-prem-emb"><img src="img/best.png" alt="" draggable="false"></div>' +
      '<b class="qs-cer-t">' + h(t('qs_cer_prem')) + '</b><p class="qs-cer-s">' + h(t('qs_cer_prem_d', { n: n })) + '</p>' +
      '<div class="qs-cer-btns">' + (n ? '<button type="button" class="btn primary qs-cer-btn" data-qa="cer-claim">' + ic('gift', 3.6) + h(t('qs_claim_all') + ' · ' + n) + '</button>'
        : '<button type="button" class="btn primary qs-cer-btn" data-qa="cer-close">' + h(t('qs_great')) + '</button>') + '</div>', 'prem');
    try { FX.confetti(); } catch (e) { dbg('qs:conf', e); }
    if (onScreen()) later(300, function () {
      qa('#qs-track .qs-tt.p').forEach(function (x, j) { setTimeout(function () { x.classList.add('unlock'); }, D(Math.min(j, 30) * 30)); });
    });
  }

  /* ---------------- Инвентарь и премиум-шторка ---------------- */

  function openInv() { build(); renderInv(); openModal('modal-qs-inv'); }
  function renderInv() {
    var q = st(), act = activeList(), box = el('qs-inv-body');
    if (!box) return;
    box.innerHTML = (act.length ? '<div class="set-label">' + h(t('qs_inv_active')) + '</div><div class="qs-inv-act">' +
        act.map(function (a) { return '<span class="qs-chip lg">' + bb(a.b, 'xs') + '<b data-act="' + a.b + '">' + h(a.txt) + '</b></span>'; }).join('') + '</div>' : '') +
      '<div class="qs-inv-grid">' + BOOSTS.map(function (b, i) {
        var n = q.inv[b];
        return '<div class="qs-bc' + (n ? '' : ' empty') + '" style="--d:' + i * 50 + 'ms">' + bb(b, 'lg') + '<i class="qs-bc-n mono">×' + n + '</i>' +
          '<b>' + h(t('qs_b_' + b)) + '</b><p>' + h(boostDesc(b)) + '</p>' +
          '<button type="button" class="btn ' + (n ? 'primary' : '') + ' qs-bc-use" data-qa="use" data-b="' + b + '"' + (n ? '' : ' disabled') + '>' + h(n ? t('qs_inv_use') : t('qs_inv_empty')) + '</button></div>';
      }).join('') + '</div><p class="qs-inv-hint">' + h(t('qs_inv_hint')) + '</p>';
  }
  function openPrem() {
    build();
    var q = st(), n = 0, L = level();
    for (var i = 1; i <= L; i++) if (!hasBit(q.cp, i)) n++;
    var gal = ['frame_bp_neon', 'theme_malachite', 'frame_bp_prism', 'candles_bp_laser', 'frame_bp_galaxy', 'title_bp_shark', 'frame_bp_crown', 'theme_aurum'];
    el('qs-prem-body').innerHTML =
      '<div class="qs-ps-hero"><img class="qs-ps-emb" src="img/best.png" alt="" draggable="false"><h3>' + h(t('qs_prem_t')) + '</h3><p>' + h(t('qs_prem_sub')) + '</p></div>' +
      '<ul class="qs-ps-list">' +
        '<li><span>' + im('gift') + '</span><div>' + h(t('qs_prem_1')) + '<small>' + h(t('qs_prem_1d')) + '</small></div></li>' +
        '<li><span>' + im('sparkles') + '</span><div>' + h(t('qs_prem_2', { n: premItemCount() })) + '<small>' + h(t('qs_prem_2d')) + '</small></div></li>' +
        '<li><span>' + im('crown') + '</span><div>' + h(t('qs_prem_3')) + '<small>' + h(t('qs_prem_3d')) + '</small></div></li>' +
      '</ul>' +
      '<div class="set-label">' + h(t('qs_prem_gallery')) + '</div>' +
      '<div class="qs-ps-gal">' + gal.filter(function (id) { return itemType(id); }).map(function (id, j) {
        return '<span class="qs-ps-it" style="--d:' + j * 60 + 'ms">' + itemIcon(id) + '<b>' + h(t('item_' + id + '_t')) + '</b></span>';
      }).join('') + '</div>' +
      (n && !q.prem ? '<div class="qs-ps-now">' + h(t('qs_prem_now', { n: n })) + '</div>' : '') +
      (q.prem ? '<button type="button" class="btn big qs-ps-pay done" disabled>' + ic('check', 4) + h(t('qs_prem_owned')) + '</button>'
        : '<button type="button" class="btn primary big qs-ps-pay" id="qs-prem-pay" data-qa="buy"><span>' + h(t('qs_prem_buy')) + '</span>' + priceHTML() + '</button>') +
      '<p class="qs-ps-fine">' + h(t('qs_prem_fine')) + '</p>';
    openModal('modal-qs-prem');
  }

  /* ---------------- Меню: карточка ---------------- */

  var C_RING = 2 * Math.PI * 19;
  function renderEntry() {
    if (!ready) return;
    var c = buildEntry();
    if (!c) return;
    roll(true);
    var q = st(), P0 = q.d, pg = prog();
    var done = P0.q.filter(function (x) { return x.c; }).length;
    el('qs-e-k').textContent = t('qs_d_head');
    el('qs-e-t').textContent = done >= P0.q.length ? t('qs_all_done') : t('qs_done_of', { n: done, m: P0.q.length });
    el('qs-e-tm').textContent = leftTxt('d');
    var rings = el('qs-e-rings');
    if (rings.children.length !== P0.q.length) {
      rings.innerHTML = P0.q.map(function () {
        return '<span class="qs-rg"><svg viewBox="0 0 44 44"><circle class="b" cx="22" cy="22" r="19"/><circle class="f" cx="22" cy="22" r="19" stroke-dasharray="' + C_RING.toFixed(2) + '" stroke-dashoffset="' + C_RING.toFixed(2) + '"/></svg><img alt="" draggable="false"><i class="qs-rg-ok">' + ic('check', 5.4) + '</i></span>';
      }).join('');
      reflow(rings);
    }
    P0.q.forEach(function (x, i) {
      var rg = rings.children[i], d = DEFS[x.id];
      rg.className = 'qs-rg d' + d.diff + ' ' + qst(x);
      var im = rg.querySelector('img'), src = achImg(d.img);
      if (im.getAttribute('src') !== src) im.setAttribute('src', src);
      rg.querySelector('.f').setAttribute('stroke-dashoffset', (C_RING * (1 - clamp(x.cur / x.goal, 0, 1))).toFixed(2));
    });
    el('qs-e-lv').textContent = pg.L;
    el('qs-e-st').textContent = stageName(stageNow());
    el('qs-e-xp').textContent = Math.floor(pg.into) + '/' + pg.need;
    el('qs-e-xpu').style.width = (pg.into / pg.need * 100).toFixed(1) + '%';
    c.style.setProperty('--sc', STAGE_C[stageNow() - 1]);
    var n = totalReady(), cta = el('qs-e-cta');
    cta.classList.toggle('idle', n === 0);
    cta.innerHTML = n ? ic('gift', 3.6) + '<span>' + h(t('qs_lb_cta_claim', { n: n })) + '</span>' : '<span>' + h(t('qs_lb_cta')) + '</span>' + ic('go', 4);
    var act = activeList();
    el('qs-e-act').innerHTML = act.map(function (a) { return '<span class="qs-chip">' + bb(a.b, 'xs') + '<b data-act="' + a.b + '">' + h(a.txt) + '</b></span>'; }).join('');
    el('qs-e-act').classList.toggle('hidden', !act.length);
    badges();
  }

  /* ---------------- Частицы ---------------- */

  function flyTo(kind, from, to, n, done) {
    var layer = el('fx-layer');
    if (!from || !to || !layer || V3.reduced()) { if (done) done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!b.width && !b.height) { if (done) done(); return; }
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    var left = n, hit = false;
    for (var i = 0; i < n; i++) (function (i) {
      var p = document.createElement('i');
      p.className = 'qs-pc ' + kind;
      p.style.opacity = '0';
      layer.appendChild(p);
      var sx = x0 + (Math.random() - 0.5) * 36, sy = y0 + (Math.random() - 0.5) * 18;
      var cx = (sx + x1) / 2 + (Math.random() - 0.5) * 140, cy = Math.min(sy, y1) - 40 - Math.random() * 90;
      setTimeout(function () {
        V3.tween(620 + Math.random() * 220, function (t0) {
          var e = V3.easeInOut(t0), u = 1 - e;
          var x = u * u * sx + 2 * u * e * cx + e * e * x1, y = u * u * sy + 2 * u * e * cy + e * e * y1;
          p.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (1.15 - 0.45 * e).toFixed(3) + ')';
          p.style.opacity = t0 < 0.08 ? String(t0 / 0.08) : '1';
        }, function () {
          if (p.parentNode) p.parentNode.removeChild(p);
          if (!hit) { hit = true; if (done) done(); }
          left--;
        });
      }, D(i * 45));
    })(i);
  }

  /* ---------------- События DOM ---------------- */

  function onClick(e) {
    var tg = e.target;
    var seg = tg.closest('#qs-seg [data-seg]');
    if (seg) { if (seg.getAttribute('data-seg') !== ui.seg) setSeg(seg.getAttribute('data-seg'), true); return; }
    var stg = tg.closest('.qs-stg');
    if (stg) {
      var s = +stg.getAttribute('data-stage');
      if (level() < (s - 1) * STAGE_LEN) toast(t('qs_stage_lock', { n: (s - 1) * STAGE_LEN }), '', { sub: stageName(s) });
      ui.stage = s;
      renderPass();
      restart(el('qs-track'), 'swap');
      centerTrack(false);
      return;
    }
    var tile = tg.closest('.qs-tt');
    if (tile) { tileTap(tile); return; }
    var b = tg.closest('[data-qa]');
    if (!b) return;
    var qa0 = b.getAttribute('data-qa'), card = b.closest('.qs-q');
    switch (qa0) {
      case 'back': close(); break;
      case 'inv': openInv(); break;
      case 'close-inv': closeModal('modal-qs-inv'); break;
      case 'use': useBoost(b.getAttribute('data-b'), b); break;
      case 'prem': if (el('modal-qs-cer').classList.contains('hidden')) openPrem(); else { closeModal('modal-qs-cer'); later(220, openPrem); } break;
      case 'close-prem': closeModal('modal-qs-prem'); break;
      case 'buy': buyPrem(); break;
      case 'claim-all': claimAll(b); break;
      case 'claim': if (card) claimQuestAt(card.getAttribute('data-per'), +card.getAttribute('data-i'), b); break;
      case 'reroll': if (card) reroll(+card.getAttribute('data-i'), b); break;
      case 'go': if (card) goTo(DEFS[card.getAttribute('data-id')].go); break;
      case 'chest': openChest(b.getAttribute('data-per'), +b.getAttribute('data-i')); break;
      case 'chest-tap': tapChest(); break;
      case 'chest-take': takeChest(); break;
      case 'cer-close': closeModal('modal-qs-cer'); break;
      case 'cer-claim': closeModal('modal-qs-cer'); later(240, function () { claimAll(onScreen() ? el('qs-hex') : null); }); break;
    }
  }

  /* ---------------- Тик и подключение ---------------- */

  var tickN = 0;
  function tick() {
    if (!ready) return;
    tickN++;
    watchFut();
    if (tickN % 4 === 0 && roll(false)) renderAll();
    if (tickN % 2) return;
    if (onScreen()) {
      qa('[data-left]').forEach(function (x) { x.textContent = leftTxt(x.getAttribute('data-left')); });
      renderBal();
    }
    if (currentTab === 'lobby' && currentScreen === 'app-main') {
      var tm = el('qs-e-tm');
      if (tm) tm.textContent = leftTxt('d');
    }
    var act = activeList();
    qa('[data-act="xp2"]').forEach(function (x) { var a = act.filter(function (y) { return y.b === 'xp2'; })[0]; if (a) x.textContent = a.txt; });
    if (st().act.xp2 && !xp2On()) { st().act.xp2 = 0; renderBoostLine(); renderEntry(); }
  }

  function init() {
    sanitize();
    ready = true;
    roll(true);
    buildEntry();
    renderEntry();
    initPay();
  }

  if (typeof V3 !== 'undefined') {
    V3.after('bindEvents', function () { try { init(); } catch (e) { dbg('qs:init', e); } });
    V3.after('tick', function () { try { tick(); } catch (e) { dbg('qs:tick', e); } });
    V3.after('pushTrade', function (r, args) { try { onSpot(args); } catch (e) { dbg('qs:trade', e); } });
    /* Экран стал видимым (showScreen показывает его через 100 мс) — теперь есть размеры. */
    V3.after('applyScreenHidden', function (r, args) {
      if (args && args[0] === 'scr-quests') { try { moveInd(); centerTrack(false); } catch (e) { dbg('qs:show', e); } }
    });
    V3.after('renderLobby', function () { try { renderEntry(); } catch (e) { dbg('qs:lobby', e); } });
    V3.after('applyI18n', function () { try { if (ready) renderAll(); } catch (e) { dbg('qs:i18n', e); } });
    V3.after('applyTheme', function () { try { if (ready) renderAll(); } catch (e) { dbg('qs:theme', e); } });
    V3.after('resetProgress', function () {
      try { if (!S.qst) { sanitize(); roll(true); renderAll(); } } catch (e) { dbg('qs:reset', e); }
    });
  }
  /* Спин колеса приходит только событием достижений. */
  if (typeof Ach !== 'undefined' && Ach.emit) {
    var achEmit = Ach.emit;
    Ach.emit = function (ev) {
      var r = achEmit.apply(this, arguments);
      try { if (ev === 'spin' && ready) { onTradeEvSpin(); } } catch (e) { dbg('qs:spin', e); }
      return r;
    };
  }
  function onTradeEvSpin() { roll(true); bump('spin', {}); badges(); }
  /* Экран создаём сразу: applyScreenHidden в main.js перебирает все экраны,
     и отсутствующий #scr-quests ломал бы любой переход. */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();

  return {
    open: open, close: close, level: level, openInv: openInv, openPrem: openPrem,
    isPrem: function () { return !!(S.qst && S.qst.prem); },
    /* Отладка только на локальном хосте: накрутка опыта и событий. */
    _dev: (typeof isDevHost === 'function' && isDevHost()) ? { addXp: function (v) { addXp(v); renderAll(); }, bump: function (ty, e) { bump(ty, e || {}); renderAll(); }, st: st } : null
  };
})();
