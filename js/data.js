/* Данные игры: классы трейдера, новости, генератор никнеймов.
   Список монет ASSETS — в сгенерированном js/data-coins.js (топ-100 CoinGecko). */
'use strict';

/* Классы трейдера по общему капиталу (прогресс, п. 2.4).
   icon — ключ эмблемы для classIconHTML(); reward — награда за повышение.

   Пороги делятся на две лиги. Первые четыре ступени — «разгон»:
   x5, x5, x4, игрок регулярно что-то получает и не теряет
   интерес. После Профессионала разрыв резко вырастает — x7.5 до
   Элиты и x13.3 до Легенды. Смысл: первые уровни даются просто за
   внимание, а Элита и Легенда — это уже не «ещё шажок», а цель на
   десятки сессий. При ровной геометрии (везде x5) Легенда была
   просто шестой строкой списка; теперь между Профессионалом и
   Легендой лежит порядок величины, и Легенда читается вершиной.

   Награды: reward[0] у Новичка = 0 — это стартовый класс, его
   не «повышают», и показывать за него бонус было бы враньём: в
   checkLevelUp награды начисляются начиная с индекса 1. У
   остальных награда — это доля от СЛЕДУЮЩЕГО порога: 10% у
   Ученика, 7.5% у Опытного, 3.3% у Профессионала, 1% у Элиты.
   То есть бонус приятен, но ни разу не «покупает» следующий
   класс — иначе пропадал бы смысл копить. Легенда вне этой
   арифметики: следующего порога нет, и её миллион — просто
   награда-памятник за вершину.

   img — готовая PNG-эмблема (медаль с подложкой, золотым ободком и
   гравировкой). Нарезана из img/icons/classes-source.jpg скриптом
   tools/split_classes.py. Пока поле задано — оно в приоритете, а
   inline SVG из classIconHTML() остаётся фолбэком: если картинки
   нет или ключ неизвестен, рисуем как раньше. Заполнять img не
   обязательно — достаточно убрать поле, и вернётся SVG. */
var CLASSES = [
  { cap: 0,        reward: 0,       icon: 'novice',     img: 'img/icons/class-novice.png?v=2',     name: { ru: 'Новичок',       en: 'Novice' },       color: '#c9a227' },
  { cap: 5000,     reward: 2500,    icon: 'apprentice', img: 'img/icons/class-apprentice.png?v=2', name: { ru: 'Ученик',        en: 'Apprentice' },  color: '#9bb4d4' },
  { cap: 25000,    reward: 7500,    icon: 'skilled',    img: 'img/icons/class-skilled.png?v=2',    name: { ru: 'Опытный',       en: 'Skilled' },     color: '#3bffa3' },
  { cap: 100000,   reward: 25000,   icon: 'pro',        img: 'img/icons/class-pro.png?v=2',        name: { ru: 'Профессионал',  en: 'Professional' }, color: '#a78bfa' },
  { cap: 750000,   reward: 100000,  icon: 'elite',      img: 'img/icons/class-elite.png?v=2',      name: { ru: 'Элита',         en: 'Elite' },       color: '#e9b640' },
  { cap: 10000000, reward: 1000000, icon: 'legend',     img: 'img/icons/class-legend.png?v=2',     name: { ru: 'Легенда',       en: 'Legend' },      color: '#f7d879' }
];

/* Шаблоны новостей рынка (заранее заданные — интерактивный ИИ запрещен, п. 1.23).

   Поле cat — категория (tech / fund / whale / volume / listing / regulation /
   security / adoption / network / tokenomics / macro / market / ...). Нужна
   для чипа в ленте новостей: игрок видит, ЧТО случилось, не вчитываясь.

   Поле impact — сила события: 1 слабое (слух, метрика), 2 среднее (фонд,
   отчёт), 3 сильное (взлом, делистинг, решение регулятора). Движок умножает
   на него величину ценового импульса.

   Поле vol: true — только у новостей, которые сами утверждают, что объёмы
   торгов изменились. Такие реально двигают объём актива (иначе текст
   новости ни на что бы не влиял, а сортировка по объёму оставалась
   статичной). Флаг ЯВНЫЙ, а не «последний элемент массива»: при расширении
   пула старая привязка к индексу ломалась бы при каждом добавлении строки.

   Пул разросся с 8 до 48 шаблонов: при детерминированном выборе по хешу
   восемь вариантов повторялись в первые же минуты игры. */
var NEWS = {
  up: [
    { ru: 'обновление прошло без сбоев в сети', en: 'upgrade completes without downtime', cat: 'tech', impact: 1 },
    { ru: 'обновление удвоило пропускную способность', en: 'upgrade doubles network throughput', cat: 'tech', impact: 3 },
    { ru: 'фонд увеличил долю в отчётности', en: 'fund raises allocation in filing', cat: 'fund', impact: 2 },
    { ru: 'кит вывел монеты на холодный кошелёк', en: 'whale moves holdings to cold storage', cat: 'whale', impact: 2 },
    { ru: 'крупный адрес копит третью неделю', en: 'large address accumulates third week', cat: 'whale', impact: 1 },
    { ru: 'объёмы торгов выросли втрое', en: 'trading volume triples on the day', cat: 'volume', impact: 2, vol: true },
    { ru: 'спотовые объёмы обновили максимум', en: 'spot volume hits monthly high', cat: 'volume', impact: 2, vol: true },
    { ru: 'крупная биржа добавила спотовую пару', en: 'major exchange lists spot pair', cat: 'listing', impact: 3 },
    { ru: 'платёжная система включила поддержку', en: 'payment network adds support', cat: 'partnership', impact: 2 },
    { ru: 'регулятор одобрил биржевой продукт', en: 'regulator approves exchange-traded product', cat: 'regulation', impact: 3 },
    { ru: 'регулятор продлил срок консультаций', en: 'regulator extends consultation period', cat: 'regulation', impact: 1 },
    { ru: 'аудит не нашёл критических уязвимостей', en: 'audit finds no critical flaws', cat: 'security', impact: 1 },
    { ru: 'уязвимость закрыта до эксплуатации', en: 'vulnerability patched before exploit', cat: 'security', impact: 2 },
    { ru: 'эмиссия сократилась по графику', en: 'issuance halves on schedule', cat: 'supply', impact: 1 },
    { ru: 'мерчанты подключили приём платежей', en: 'merchants enable checkout support', cat: 'adoption', impact: 2 },
    { ru: 'крупный банк запустил кастодиальный сервис', en: 'major bank launches custody service', cat: 'adoption', impact: 3 },
    { ru: 'комиссии в сети упали до минимума', en: 'network fees fall to yearly low', cat: 'network', impact: 1 },
    { ru: 'сжигание монет ускорилось за квартал', en: 'token burn accelerates this quarter', cat: 'tokenomics', impact: 1 },
    { ru: 'инфляция замедлилась сильнее прогноза', en: 'inflation cools more than forecast', cat: 'macro', impact: 2 },
    { ru: 'аналитики подняли целевую оценку', en: 'analysts raise price target', cat: 'analyst', impact: 1 }
  ],
  down: [
    { ru: 'сетевое обновление отложено на неделю', en: 'network upgrade delayed by a week', cat: 'tech', impact: 1 },
    { ru: 'сеть остановилась на два часа', en: 'network halts for two hours', cat: 'tech', impact: 3 },
    { ru: 'фонд сократил долю в портфеле', en: 'fund trims position in filing', cat: 'fund', impact: 2 },
    { ru: 'крупный держатель перевёл монеты на биржу', en: 'large holder sends coins to exchange', cat: 'whale', impact: 2 },
    { ru: 'давний держатель начал продавать', en: 'long-term holder starts selling', cat: 'whale', impact: 1 },
    { ru: 'объёмы торгов за сутки упали вдвое', en: 'trading volume halves on the day', cat: 'volume', impact: 2, vol: true },
    { ru: 'спотовые объёмы просели до минимума', en: 'spot volume sinks to monthly low', cat: 'volume', impact: 2, vol: true },
    { ru: 'биржа сняла спотовую пару с торгов', en: 'exchange delists the spot pair', cat: 'listing', impact: 3 },
    { ru: 'маркет-мейкер убрал заявки из стакана', en: 'market maker pulls orders from book', cat: 'liquidity', impact: 2 },
    { ru: 'регулятор потребовал приостановить операции', en: 'regulator demands a halt to operations', cat: 'regulation', impact: 3 },
    { ru: 'регулятор запросил дополнительные документы', en: 'regulator requests additional documents', cat: 'regulation', impact: 1 },
    { ru: 'взлом моста вывел часть средств', en: 'bridge exploit drains funds', cat: 'security', impact: 3 },
    { ru: 'обнаружена уязвимость в контракте', en: 'vulnerability found in contract', cat: 'security', impact: 2 },
    { ru: 'крупная разблокировка вышла в обращение', en: 'large unlock enters circulation', cat: 'supply', impact: 2 },
    { ru: 'мерчанты отключили приём платежей', en: 'merchants disable checkout support', cat: 'adoption', impact: 1 },
    { ru: 'комиссии в сети выросли вдвое', en: 'network fees double after congestion', cat: 'network', impact: 1 },
    { ru: 'выпуск монет опередил запланированный график', en: 'token issuance runs ahead of schedule', cat: 'tokenomics', impact: 1 },
    { ru: 'ставка поднялась выше прогноза', en: 'rate hike exceeds forecasts', cat: 'macro', impact: 2 },
    { ru: 'аналитики снизили целевую оценку', en: 'analysts cut price target', cat: 'analyst', impact: 1 },
    { ru: 'деривативы сместились в сторону шорта', en: 'derivatives positioning tilts short', cat: 'market', impact: 1 }
  ],
  neutral: [
    { ru: 'консолидируется в узком диапазоне', en: 'consolidates in a narrow range', cat: 'market', impact: 1 },
    { ru: 'волатильность снизилась до минимума', en: 'volatility falls to monthly low', cat: 'market', impact: 1 },
    { ru: 'аналитики разошлись в оценках', en: 'analysts split on outlook', cat: 'analyst', impact: 1 },
    { ru: 'рынок ждёт данных по инфляции', en: 'market awaits inflation data', cat: 'macro', impact: 2 },
    { ru: 'активность в сети без изменений', en: 'on-chain activity unchanged', cat: 'network', impact: 1 },
    { ru: 'команда отчиталась без новых анонсов', en: 'team reports no new announcements', cat: 'team', impact: 1 },
    { ru: 'спрос и предложение сбалансированы', en: 'bids and offers evenly matched', cat: 'liquidity', impact: 1 },
    { ru: 'голосование по параметрам перенесено', en: 'parameter vote postponed', cat: 'tokenomics', impact: 1 }
  ],
  /* Рыночный слой: ОДНО событие на весь рынок, а не на отдельную монету.
     Тексты намеренно без привязки к активу — их получают все сразу, и
     вес у каждого свой (по бете, см. engine.js). Без этого слоя новости
     разных монет были полностью независимы: BTC мог «остановить сеть»,
     а ETH в том же бакете — «удвоить пропускную способность», и корреляции
     между активами в момент события не возникало вовсе. */
  marketUp: [
    { ru: 'регулятор смягчил требования к отрасли', en: 'regulator eases industry rules', cat: 'regulation', impact: 2 },
    { ru: 'крупный фонд перевёл портфель в крипту', en: 'large fund moves portfolio into crypto', cat: 'fund', impact: 3 },
    { ru: 'ставка снижена — риск вернулся на рынок', en: 'rate cut brings risk appetite back', cat: 'macro', impact: 3 },
    { ru: 'приток в фонды обновил максимум', en: 'fund inflows hit a record', cat: 'fund', impact: 2 },
    { ru: 'одобрен спотовый инструмент на индекс', en: 'spot index product approved', cat: 'regulation', impact: 3 },
    { ru: 'крупный банк открыл доступ клиентам', en: 'major bank opens access to clients', cat: 'adoption', impact: 2 },
    { ru: 'рынок отыграл предыдущее падение', en: 'market recovers previous drop', cat: 'market', impact: 1 },
    { ru: 'индекс страха и жадности пошёл вверх', en: 'fear and greed index turns up', cat: 'analyst', impact: 1 }
  ],
  marketDown: [
    { ru: 'регулятор ужесточил надзор за рынком', en: 'regulator tightens market oversight', cat: 'regulation', impact: 3 },
    { ru: 'ставка выросла выше прогноза', en: 'rate rises above forecast', cat: 'macro', impact: 3 },
    { ru: 'крупный фонд сократил позиции', en: 'large fund trims positions', cat: 'fund', impact: 2 },
    { ru: 'отток из фондов ускорился', en: 'fund outflows accelerate', cat: 'fund', impact: 2 },
    { ru: 'биржи ужесточили требования к клиентам', en: 'exchanges tighten client rules', cat: 'regulation', impact: 2 },
    { ru: 'крупный игрок распродал портфель', en: 'large holder liquidates portfolio', cat: 'whale', impact: 3 },
    { ru: 'ликвидность рынка упала до минимума', en: 'market liquidity falls to a low', cat: 'liquidity', impact: 2 },
    { ru: 'рынок не удержал предыдущий рост', en: 'market fails to hold previous rally', cat: 'market', impact: 1 }
  ],
  /* ЭКСТРЕМАЛЬНЫЕ события. Редкие и бьющие на порядок сильнее обычных:
     это аркадный момент, ради которого игрок и держит монету. Двигают
     цену на десятки процентов, а не на десятые доли.
     Держим отдельным пулом, а не строкой в up/down: у них своя частота
     (см. extremeNewsAt), своя механика импульса и своя подача в ленте. */
  extremeUp: [
    { ru: 'крупнейшая биржа объявила о покупке всей эмиссии', en: 'largest exchange to buy the entire supply', cat: 'listing', impact: 3 },
    { ru: 'суверенный фонд объявил актив стратегическим резервом', en: 'sovereign fund names the asset a strategic reserve', cat: 'adoption', impact: 3 },
    { ru: 'одобрен спотовый ETF — приток рекордный', en: 'spot ETF approved with record inflows', cat: 'regulation', impact: 3 },
    { ru: 'сеть обработала объём, сравнимый с крупнейшей платёжной системой', en: 'network volume rivals a major payment system', cat: 'adoption', impact: 3 },
    { ru: 'крупный технологический гигант добавил поддержку в свои продукты', en: 'tech giant adds support across its products', cat: 'partnership', impact: 3 },
    { ru: 'дефицит предложения: биржевые запасы обнулились', en: 'exchange reserves hit zero amid supply crunch', cat: 'supply', impact: 3 }
  ],
  extremeDown: [
    { ru: 'крупнейшая биржа объявила делистинг', en: 'largest exchange announces delisting', cat: 'listing', impact: 3 },
    { ru: 'регулятор запретил оборот на территории союза', en: 'regulator bans circulation across the union', cat: 'regulation', impact: 3 },
    { ru: 'обнаружена критическая уязвимость — сеть остановлена', en: 'critical flaw found, network halted', cat: 'security', impact: 3 },
    { ru: 'основатели вывели всю казну проекта', en: 'founders drain the entire project treasury', cat: 'team', impact: 3 },
    { ru: 'крупнейший держатель начал распродажу на рынок', en: 'largest holder starts selling into the market', cat: 'whale', impact: 3 },
    { ru: 'эмиссия увеличена вдвое без предупреждения', en: 'supply doubled without warning', cat: 'tokenomics', impact: 3 }
  ]
};

/* Части для генерации никнеймов и мок-игроков рейтинга. */
var NICK = {
  adj: {
    ru: ['Быстрый', 'Тихий', 'Дерзкий', 'Хладнокровный', 'Ловкий', 'Вечерний', 'Смелый', 'Дальний', 'Лёгкий', 'Чёткий'],
    en: ['Swift', 'Quiet', 'Bold', 'Cold', 'Keen', 'Evening', 'Brave', 'Distant', 'Light', 'Sharp']
  },
  noun: {
    ru: ['Брокер', 'Бык', 'Медведь', 'Тикер', 'График', 'Свеча', 'Кит', 'Портфель', 'Депозит', 'Тренд'],
    en: ['Broker', 'Bull', 'Bear', 'Ticker', 'Chart', 'Candle', 'Whale', 'Portfolio', 'Deposit', 'Trend']
  }
};

/* Стартовые параметры экономики. */
var CONFIG = {
  startBalance: 1000,   // стартовый капитал, $
  minTrade: 10,         // минимальная сумма сделки, $
  spread: 0.001,        // спред 0.1%: ask = price*(1+s), bid = price*(1-s)
  adReward: 500,        // награда за просмотр рекламы, $
  adCooldown: 180,      // кулдаун бонуса за рекламу, сек
  dailyBase: 500,       // ежедневный бонус, $
  dailyStreakStep: 100, // + за каждый день серии
  dailyMax: 1500,       // потолок ежедневного бонуса
  grant: 500,           // «спасательный грант» новичка
  grantCooldown: 3600,  // раз в час, сек
  // Суммы за повышение живут в CLASSES[i].reward; levelUpReward — фолбэк,
  // если у класса не указан. Значение = награде Ученика, то есть
  // минимальной реальной выплате в игре.
  levelUpReward: 2500,  // награда за новый класс (если в CLASSES не задано)
  leaderboard: 'capital',
  /* Lucky Spin — колесо удачи в лобби.

     Два режима на ОДНОМ колесе:
       free — бесплатный, раз в freeCooldownMs (6 часов);
       ad   — за просмотр rewarded-видео, до adDailyLimit раз в сутки.

     Секторы перечислены ПО ЧАСОВОЙ СТРЕЛКЕ, начиная с того, что стоит
     под стрелкой (12 часов). Порядок менять нельзя без пересчёта
     геометрии: угол сектора считается как i * 360 / n.

     type:
       'usd'    — деньги сразу на баланс;
       'crypto' — актив в портфель по текущей цене (сколько монет
                  влезет в usd);
       'miss'   — пустой сектор, ничего не начисляем.

     weight — вероятность в обычном режиме; в золотом — та же
     per-sector weight (отдельный массив vipWeights убран как дубль,
     расхождение которого ломало бы вероятности). Веса относительные,
     сумма не важна — нормируется в коде. EV: free ≈ $9 за спин,
     золотой ≈ $204 деньгами (+ ценность скидок на комиссию).

     color — не «красивый градиент», а шкала ценности: чем жирнее приз,
     тем светлее и горячее сектор. jackpot светится отдельно и получает
     отдельную анимацию на выигрыше. */
  spin: {
    freeCooldownMs: 6 * 3600 * 1000,
    /* 0 = лимита нет: золотой спин доступен всегда, ограничен только
       просмотром рекламы перед каждой круткой. */
    adDailyLimit: 0,
    spinMs: [3600, 4400],          // случайная длительность крутки, мс
    /* Два набора секторов — по одному на режим. У них разные наборы,
       порядок и палитра: обычный — спокойные тёмные оттенки по
       референсу Димы, золотой — фирменное золото TradeUp. Цвета заданы
       отдельно (colorFree/colorVip), потому что иконки и подложки под
       монеты подчиняются той же схеме и читаются в тон. */
    freeSectors: [
      { type: 'usd',                    usd: 10, weight: 18, label: { ru: '$10',     en: '$10'     } },
      { type: 'usd',                    usd: 25, weight: 10, label: { ru: '$25',     en: '$25'     } },
      { type: 'crypto', id: 'bitcoin',  usd: 50, weight: 4,  jackpot: true, label: { ru: '$50 BTC', en: '$50 BTC' } },
      { type: 'miss',                            weight: 8,  label: { ru: 'Пусто',   en: 'Empty'   } },
      { type: 'crypto', id: 'bitcoin',  usd: 2,  weight: 16, label: { ru: '$2 BTC',  en: '$2 BTC'  } },
      { type: 'crypto', id: 'ethereum', usd: 4,  weight: 12, label: { ru: '$4 ETH',  en: '$4 ETH'  } },
      /* Седьмой сектор: количество секторов выровнено с золотым
         колесом (7 = 7), иначе колеса читаются как разные игры. */
      { type: 'crypto', id: 'bitcoin',  usd: 1,  weight: 12, label: { ru: '$1 BTC',  en: '$1 BTC'  } }
    ],
    freeColors: ['#2b3a5c', '#1f4a52', '#161922', '#10121a', '#372655', '#2a1f44', '#31264d'],
    /* Порядок намеренно начинается с джекпота: при исходном положении
       диска первая ячейка сидит ровно под стрелкой. Это повторяет
       золотой референс ($50 BTC сверху), а не оставляет стрелку на
       стыке случайных секторов. Вероятности перенесены вместе с
       секторами — EV золотого спина не меняется.

       type 'commission' — скидка на торговую комиссию: pct процентов
       на следующие trades сделок. Вучеры и «+1 спин» из референса
       сознательно не переносим: лишние сущности в экономике. */
    /* Награды золотого колеса — х10 от обычного уровня: игрок платит
       вниманием (rewarded-видео), и приз должен ощущаться крупным,
       а не «тем же, но за рекламу». Комиссии не масштабируем: скидка
       сильнее 50% сломала бы экономику торговли. */
    vipSectors: [
      { type: 'crypto', id: 'bitcoin',  usd: 500, weight: 4,  jackpot: true, label: { ru: '$500 BTC', en: '$500 BTC' } },
      { type: 'crypto', id: 'ethereum', usd: 50,  weight: 12, label: { ru: '$50 ETH',  en: '$50 ETH' } },
      { type: 'usd',                    usd: 250, weight: 8,  label: { ru: '$250',     en: '$250' } },
      { type: 'commission', pct: 25, trades: 3, weight: 12, label: { ru: '−25% Комиссия', en: '−25% Fee' } },
      { type: 'crypto', id: 'ethereum', usd: 100, weight: 6,  label: { ru: '$100 ETH', en: '$100 ETH' } },
      { type: 'commission', pct: 50, trades: 3, weight: 6,  label: { ru: '−50% Комиссия', en: '−50% Fee' } },
      { type: 'usd',                    usd: 2500, weight: 2, label: { ru: '$2500',    en: '$2500' } }
    ],
    /* Приглушённое золото / графит. Первая палитра (#f3d272) била по
       глазам на тёмном фоне: слишком светлые и насыщенные сектора
       спорили с текстом и ободом. Здесь все золота темнее и серее,
       а пустых секторов в голде нет — минимальный приз $5 ETH. */
    vipColors: ['#e3c368', '#26262e', '#cfa944', '#20222a', '#c09538', '#1f2128', '#bb9439']
  }
};
