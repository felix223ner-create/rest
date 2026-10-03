/* Движок рынка: детерминированные свечи от времени (случайное блуждание + новости).
   Цена не зависит от сессии — после паузы/рекламы рынок «продолжается» без рассинхрона. */
'use strict';

var Engine = (function () {
  var CANDLE_MS = 5000;               // базовая свеча — 5 секунд
  var WINDOW = 20000;                 // пере-якорение каждые ~28 часов свечей
  var ANCHOR = Date.UTC(2026, 7, 25); // общий якорь индексов свечей
  var HIST = 7400;                    // глубина кольцевого буфера закрытий (хватает на 15м×40)

  /* Быстрый детерминированный хеш двух чисел -> [0,1). */
  function hash(a, b) {
    var t = ((a | 0) * 374761393 + (b | 0) * 668265263) | 0;
    t = Math.imul(t ^ (t >>> 13), 1274126177);
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  }

  /* Какую новость несёт бакет b (24 свечи) — или null, если новости нет.

   ОДНА функция на двоих. retAt() берёт отсюда направление и силу
   ценового импульса, news() — текст для интерфейса. Раньше выбор
   шаблона жил только в news(), и получался разрыв: цену двигал
   абстрактный dir/mag, а текст подбирался отдельным хешем. Из-за
   этого «взлом моста» мог поднять цену на 0.02%, а «фонд увеличил
   долю» — обрушить. Теперь impact шаблона реально влияет на
   величину импульса: сильная новость двигает цену сильнее. */
  /* Какие новости какой монете «идут». Ключ — категория новости.
     Раньше категория выбиралась РАВНОМЕРНО из всего массива, и мемкоин
     получал «взлом моста вывел средства», а монета на $200 млн — «одобрен
     ETF». Одна таблица вместо правки 48 шаблонов: смысл тот же, менять
     в одном месте.

     tier — размер капитализации: 0 мелкий (<$1 млрд), 1 средний, 2 крупный,
     3 мега (>$200 млрд). Берётся из MARKET, он подключается до движка. */
  var CAT_FIT = {
    security: { denySectors: ['meme', 'rwa'] },
    tech: { allowSectors: ['l1', 'l2', 'infra', 'privacy', 'oracle', 'ai'] },
    network: { allowSectors: ['l1', 'l2', 'infra', 'privacy'] },
    listing: { minTier: 1 },
    tokenomics: { minTier: 1 },
    partnership: { allowSectors: ['pay', 'exchange', 'l1', 'rwa', 'infra'] },
    regulation: { denySectors: ['meme'] },
    macro: { denySectors: ['meme'] },
    fund: { minTier: 1 },
    whale: { minTier: 1 }
  };

  /* Кеш тира по id, а НЕ свойством на самом объекте актива. Вешать
     `asset.__tier` было соблазнительно (одна строка), но это перечисляемое
     свойство: любой будущий JSON.stringify(asset) или for...in по активу
     потащил бы служебное поле в данные. Сейчас в сейв оно не попадает —
     проверено, — но лучше не оставлять такой возможности. */
  var _tierCache = {};

  function capTier(asset) {
    var hit = _tierCache[asset.id];
    if (hit !== undefined) return hit;
    var t = 0;
    if (typeof MARKET !== 'undefined' && MARKET && MARKET[asset.id]) {
      var cap = MARKET[asset.id].cap || 0;
      t = cap >= 2e11 ? 3 : (cap >= 2e10 ? 2 : (cap >= 1e9 ? 1 : 0));
    }
    /* Список активов статичный, а newsAt вызывается тысячи раз за
       перерисовку — кеш тут обязателен. */
    _tierCache[asset.id] = t;
    return t;
  }

  function catFits(asset, cat) {
    var f = CAT_FIT[cat];
    if (!f) return true;
    if (f.denySectors && f.denySectors.indexOf(asset.sector) >= 0) return false;
    if (f.allowSectors && f.allowSectors.indexOf(asset.sector) < 0) return false;
    if (f.minTier !== undefined && capTier(asset) < f.minTier) return false;
    return true;
  }

  /* Подмножество пула, допустимое для этой монеты. Если после фильтра не
     осталось НИЧЕГО — отдаём исходный массив: пустой пул означал бы, что у
     монеты вообще не бывает новостей, а это хуже, чем неточная категория. */
  function catPool(asset, arr) {
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      if (catFits(asset, arr[i].cat)) out.push(arr[i]);
    }
    return out.length ? out : arr;
  }

  /* Как часто монета попадает в новости. Мелкие шумят чаще, мажоры реже —
     но их новости сильнее и с более длинным хвостом (см. newsImpulse).
     Раньше порог был ровно 0.08 у всех: микрокап и BTC жили в одном ритме,
     хотя в реальности маленькие монеты новостей получают заметно больше. */
  var FREQ_BY_TIER = [0.15, 0.11, 0.08, 0.05];

  function newsAt(asset, b) {
    var thr = FREQ_BY_TIER[capTier(asset)] || 0.08;
    if (hash(asset.seed + 7, b) >= thr) return null;
    /* Не подряд: если предыдущий бакет тоже «выиграл» новость — этот
       молчит. Иначе у одного актора новости шли бакет за бакетом,
       и в ленте выпадала стена «только что» по всей доске. */
    if (hash(asset.seed + 7, b - 1) < thr) return null;
    /* Три исхода, а не два. Пул NEWS.neutral существовал с самого начала,
       но его не читал НИКТО: direction брался как hash < 0.5 ? -1 : 1, и
       8 шаблонов (17% контента) до игрока не доходили никогда. Теперь
       есть и «тихие» новости: dir = 0 не двигает цену (newsImpulse
       умножает на ноль), но запись попадает в ленту. */
    var h = hash(asset.seed + 13, b);
    var dir = h < 0.44 ? -1 : (h < 0.88 ? 1 : 0);
    var pool = catPool(asset, dir > 0 ? NEWS.up : (dir < 0 ? NEWS.down : NEWS.neutral));
    /* Индекс считается от ДЛИНЫ пула, а не от хардкодной четвёрки:
       пул новостей расширяется, и старая формула `% 4` просто
       игнорировала бы всё, что добавлено сверх первых четырёх. */
    var idx = Math.floor(hash(asset.seed + 57, b) * pool.length) % pool.length;
    return { dir: dir, item: pool[idx] };
  }

  /* Рыночный слой: одно событие на ВЕСЬ рынок за бакет. Отдельный поток
     на глобальном сиде — не зависит ни от одного актива, поэтому у всех
     игроков совпадает. Порог и правило «не подряд» те же, что у обычных
     новостей: иначе рынок жил бы в режиме постоянных событий. */
  var MARKET_SEED = 0x4D4B54;
  function marketNewsAt(b) {
    if (hash(MARKET_SEED, b) >= 0.08) return null;
    if (hash(MARKET_SEED, b - 1) < 0.08) return null;
    var dir = hash(MARKET_SEED + 13, b) < 0.5 ? -1 : 1;
    var arr = dir > 0 ? NEWS.marketUp : NEWS.marketDown;
    var idx = Math.floor(hash(MARKET_SEED + 57, b) * arr.length) % arr.length;
    return { dir: dir, item: arr[idx] };
  }

  /* Множитель силы импульса по важности новости.
     impact 1 -> 0.8, 2 -> 1.0, 3 -> 1.3. Специально не 0.5..2.0:
     сильные новости должны отличаться, но не превращать график в
     пилу — игра всё-таки про спокойный рынок. */
  function impactMult(impact) {
    if (impact >= 3) return 1.3;
    if (impact === 2) return 1.0;
    return 0.8;
  }

  /* Профиль влияния по КАТЕГОРИИ новости. shock — какая часть импульса
     бьёт сразу (первые 6 свечей); tail — сила затухающего тренда после.
     Взлом/листинг — резкий шок почти без хвоста (отскакивать бессмысленно);
     регуляторика/adoption/macro — тихий вход и длинный тренд (можно
     оседлать); объёмные новости цену почти не двигают — только объём. */
  var CAT_PROFILE = {
    tech: { shock: 1.0, tail: 0.4 },
    fund: { shock: 1.0, tail: 0.3 },
    whale: { shock: 1.0, tail: 0.3 },
    volume: { shock: 0.2, tail: 0.05 },
    listing: { shock: 1.4, tail: 0.15 },
    partnership: { shock: 0.9, tail: 0.5 },
    regulation: { shock: 0.4, tail: 1.0 },
    security: { shock: 1.4, tail: 0.1 },
    supply: { shock: 0.6, tail: 0.6 },
    adoption: { shock: 0.5, tail: 0.9 },
    network: { shock: 0.5, tail: 0.4 },
    tokenomics: { shock: 0.5, tail: 0.7 },
    macro: { shock: 0.4, tail: 0.9 },
    analyst: { shock: 0.6, tail: 0.4 },
    market: { shock: 0.3, tail: 0.2 },
    liquidity: { shock: 0.8, tail: 0.15 },
    team: { shock: 0.3, tail: 0.2 }
  };
  function catProfile(cat) {
    return CAT_PROFILE[cat] || { shock: 1.0, tail: 0.3 };
  }

  /* Средняя вола «эталонной» монеты: от неё считается новостной
     масштаб (мемы реагируют сильнее, мажоры спокойнее). */
  var NEWS_VOL_BASE = 0.003;

  /* Крупность монеты. Одна и та же новость двигает микрокап заметно
     сильнее, чем BTC: считаем от капитализации, а не от волатильности —
     это разные вещи, и раньше в новостях учитывалась только вола.
     Диапазон намеренно узкий (0.75…1.35): цена уже масштабируется
     волатильностью, и два широких множителя подряд дали бы пилу. */
  function capScale(asset) {
    var cap = (typeof MARKET !== 'undefined' && MARKET && MARKET[asset.id]) ? (MARKET[asset.id].cap || 0) : 0;
    if (!cap) return 1;
    return 0.75 + 0.6 / (1 + cap / 5e9);
  }

  /* Фактор неожиданности: если та же КАТЕГОРИЯ уже выходила по этой монете
     недавно, рынок её «заложил» и повтор бьёт слабее. Окно — 24 бакета
     (48 минут): дольше держать смысла нет, хвост новости живёт 42 свечи.
     Проверка идёт только когда новость вообще есть (8% случаев), поэтому
     лишние хеши на общую стоимость расчёта почти не влияют. */
  function surpriseFactor(asset, cat, b) {
    for (var k = 1; k <= 24; k++) {
      var prev = newsAtCached(asset, b - k);
      if (prev && prev.item.cat === cat) return 0.55;
    }
    return 1;
  }

  /* Кеши. Обе функции чистые от (asset.id, bucket), поэтому кеш ничего не
     меняет по существу, но убирает повторную работу.
     Зачем: advance() при первом обращении к активу прогоняет до
     HIST + WINDOW − 1 = 27 400 свечей, и на каждой вызывается retAt, а в
     нём newsImpulse. Без кеша newsAt для одной пары (актив, бакет)
     считался до 42 раз (длина хвоста), а surpriseFactor внутри него —
     ещё по 24 вызова newsAt на каждую из этих свечей.
     Ключ — строка, словарь общий на все активы. */
  var _newsCache = {};
  var _surpCache = {};

  function newsAtCached(asset, b) {
    var k = asset.id + '|' + b;
    var hit = _newsCache[k];
    if (hit !== undefined) return hit;
    return (_newsCache[k] = newsAt(asset, b));
  }

  function surpriseCached(asset, cat, b) {
    var k = asset.id + '|' + cat + '|' + b;
    var hit = _surpCache[k];
    if (hit !== undefined) return hit;
    return (_surpCache[k] = surpriseFactor(asset, cat, b));
  }

  /* ЭКСТРЕМАЛЬНОЕ событие: одно на весь рынок, но бьёт по ОДНОЙ монете.
     Отдельный поток на своём сиде, частота намеренно низкая — примерно
     раз в полчаса на всю доску. Это аркадный момент, ради которого игрок
     держит монету, а не фон: обычная новость, по замеру, двигает медианно
     0.0% и в лучшем случае 4%, а тут речь о десятках процентов. */
  var EXTREME_SEED = 0x4D4F4F4E;
  var EXTREME_P = 0.06;

  function extremeNewsAt(b) {
    if (typeof ASSETS === 'undefined' || !ASSETS.length) return null;
    if (hash(EXTREME_SEED, b) >= EXTREME_P) return null;
    /* Не подряд: два экстремума в соседних бакетах обесценили бы оба. */
    if (hash(EXTREME_SEED, b - 1) < EXTREME_P) return null;
    var idx = Math.floor(hash(EXTREME_SEED + 17, b) * ASSETS.length) % ASSETS.length;
    var dir = hash(EXTREME_SEED + 31, b) < 0.5 ? -1 : 1;
    var arr = dir > 0 ? NEWS.extremeUp : NEWS.extremeDown;
    var i2 = Math.floor(hash(EXTREME_SEED + 53, b) * arr.length) % arr.length;
    return { asset: ASSETS[idx], dir: dir, item: arr[i2] };
  }

  /* Импульс новости на свече k. Три слоя: рыночный (общий на всех, вес по
     бете), обычная новость актива (шок 6 свечей + затухающий хвост) и
     редкое экстремальное событие (шок 12 свечей + длинный хвост 72).
     Чистая функция от k — детерминизм и общая история у всех игроков
     полностью сохраняются. */
  function newsImpulse(asset, k) {
    var r = 0;
    var b = Math.floor(k / 24);
    /* Смотрим на три бакета назад: у экстремального события хвост длиной
       84 свечи (3.5 бакета), и в прежнем окне в два бакета он обрывался. */
    for (var bb = b; bb >= b - 3; bb--) {
      var dist = k - bb * 24;

      /* --- Экстремальный слой: шок 12 свечей, затем разгонный хвост --- */
      var ex = extremeNewsAt(bb);
      if (ex && ex.asset === asset && dist >= 0 && dist < 84) {
        /* Масштаб подобран замером: при 0.055 сумма импульсов давала
           ±100% за минуту и ±330% за семь — цена уходила в разнос.
           0.007 даёт ~13% за минуту и ~40% за семь у мелких монет,
           у мажоров примерно вдвое меньше. Это и есть «минимум 10%,
           а на большие проценты — со временем». */
        var emag = 0.007 * capScale(asset) * (0.55 + 0.9 * asset.vol / (asset.vol + 0.004));
        if (dist < 12) {
          r += ex.dir * emag * 1.2 * (0.5 + hash(asset.seed + 71, k) * 0.5);
        } else {
          var et = (dist - 12) / 72;
          r += ex.dir * emag * 0.9 * (1 - et) * (0.6 + hash(asset.seed + 71, k) * 0.4);
        }
      }

      /* --- Рыночный слой --- */
      var mn = marketNewsAt(bb);
      if (mn && dist >= 0 && dist < 42) {
        var mw = asset.beta > 0 ? asset.beta : 1.0;
        var mprof = catProfile(mn.item.cat);
        var mmag = (0.015 + hash(MARKET_SEED + 21, bb) * 0.045) * impactMult(mn.item.impact) * mw;
        if (dist < 6) {
          r += mn.dir * mmag * mprof.shock * (0.25 + hash(asset.seed + 31, k) * 0.35);
        } else if (mprof.tail > 0) {
          var mt = (dist - 6) / 18;
          if (mt < 1) r += mn.dir * mmag * mprof.tail * 0.15 * (1 - mt) * (0.6 + hash(asset.seed + 31, k) * 0.4);
        }
      }

      /* --- Обычная новость актива --- */
      if (dist < 0 || dist >= 42) continue;
      var n = newsAtCached(asset, bb);
      if (!n) continue;
      var prof = catProfile(n.item.cat);
      var mag = (0.015 + hash(asset.seed + 21, bb) * 0.045) * impactMult(n.item.impact);
      /* Сглаженная кривая от волатильности БЕЗ потолка. Прежний
         clamp(0.6 + vol/0.003*0.4, 0.6, 1.6) упирался в 1.6 у 148 активов
         из 200 — 74% списка получали ровно 1.6, и «сильная» новость на
         DOGE (beta 0.26) била так же, как на XRP (beta 1.15). Гипербола
         растёт монотонно и насыщается мягко, различия сохраняются. */
      mag *= 0.55 + 0.9 * asset.vol / (asset.vol + 0.004);
      mag *= capScale(asset);
      mag *= surpriseCached(asset, n.item.cat, bb);
      if (dist < 6) {
        r += n.dir * mag * prof.shock * (0.25 + hash(asset.seed + 31, k) * 0.35);
      } else if (prof.tail > 0) {
        var t = (dist - 6) / 18;
        if (t < 1) {
          r += n.dir * mag * prof.tail * 0.15 * (1 - t) * (0.6 + hash(asset.seed + 31, k) * 0.4);
        }
      }
    }
    return r;
  }

  /* Доходность свечи k: шум + бета к BTC + новостной импульс.

     Шум — треугольное распределение (сумма двух хешей): чаще тихие
     свечи, реже сильные — правдоподобнее равномерного.

     Кластер волатильности: эпохи «спокойно» и «ВСПЛЕСК» (~8 мин),
     детерминированные от k. Перекос в квадрате — всплесков меньше,
     но они резче.

     Бета к BTC:BTC — лидер рынка, остальные следуют через бету.
     retAt(BTC, k) НЕ вызывает btcNoise (нет самокорреляции). */
  var VOL_SCALE = 0.55;
  var _btcAsset = null;

  function getBtc() {
    if (!_btcAsset && typeof ASSETS !== 'undefined') {
      for (var i = 0; i < ASSETS.length; i++) {
        if (ASSETS[i].id === 'bitcoin') { _btcAsset = ASSETS[i]; break; }
      }
    }
    return _btcAsset;
  }

  /* Шум BTC на свече k — «рыночный фактор». Остальные активы слышат
     его через бету: если BTC пошёл вверх, позитивные беты тоже растут. */
  function btcNoise(k) {
    var btc = getBtc();
    if (!btc) return 0;
    return (hash(btc.seed, k) - 0.5) * 2 * btc.vol * VOL_SCALE;
  }

  function retAt(asset, k) {
    /* Треугольный шум вместо равномерного: чаще тихие свечи, реже
       сильные — правдоподобнее реального рынка. */
    var noise = (hash(asset.seed, k) + hash(asset.seed + 3, k) - 1);
    /* Кластер волатильности: эпохи «спокойно» и «ВСПЛЕСК» (~8 мин).
       Квадрат хеша перекашивает распределение в сторону спокойных
       периодов с редкими всплесками. */
    var volRegime = 0.6 + 1.6 * Math.pow(hash(asset.seed + 77, Math.floor(k / 96)), 2);
    var r = noise * asset.vol * VOL_SCALE * volRegime;

    /* Бета к BTC: если это не сам BTC, добавляем долю его движения.
       Мемные монеты с низкой бетой почти игнорируют рынок — могут
       падать, пока BTC растёт. */
    if (asset.id !== 'bitcoin' && asset.beta > 0) {
      r += asset.beta * btcNoise(k);
    }

    /* Секторный шум: монеты одного сектора двигаются стайю —
       общий фактор добавляется к собственному шуму монеты. */
    if (asset.sector) {
      r += sectorNoise(asset, k);
    }

    r += newsImpulse(asset, k);
    return r;
  }

  /* Секторный шум: общий для монет одного сектора фактор.
     Детерминирован от (сектор, k) — история одинакова у всех.
     Мем-сектор: дикая вола, слабо связана с BTC. DeFi/L2: средняя.
     L1 тоже получает секторный шум — самым слабым (0.0008, ветка else
     ниже). Бета к BTC у L1 уже есть, и шум добавляется поверх неё:
     это осознанно, чтобы монеты одного L1-сектора всё же двигались
     стаей. Раньше комментарий утверждал обратное — код и текст
     расходились. */
  function sectorNoise(asset, k) {
    var sector = asset.sector || 'infra';
    var seed = 0;
    for (var i = 0; i < sector.length; i++) {
      seed = (seed * 31 + sector.charCodeAt(i)) >>> 0;
    }
    var vol = asset.sector === 'meme' ? 0.0022
            : asset.sector === 'defi' ? 0.0012
            : asset.sector === 'l2' ? 0.0011
            : asset.sector === 'ai' ? 0.0014
            : 0.0008;
    return (hash(seed + 5, k) - 0.5) * 2 * vol;
  }

  var caches = {};

  function state(asset) {
    var c = caches[asset.id];
    if (!c) {
      c = caches[asset.id] = { idx: -1, close: asset.base, prev: asset.base, hist: [] };
    }
    return c;
  }

  /* Продвинуть блуждание до текущего индекса. Старт — детерминированный якорь. */
  function advance(asset, now) {
    var c = state(asset);
    var curIdx = Math.floor((now - ANCHOR) / CANDLE_MS);
    if (c.idx < 0) {
      /* Глубина истории не меньше HIST. Раньше бралось только
         (curIdx % WINDOW) + 600 — эта величина плавает от 600 до
         WINDOW+600 в течение суток, и на 15м таймфрейме в «узкий»
         момент оставалось 3-20 свечей: графику нечего было показать,
         а листать было некуда вообще. Теперь глубина стабильна.

         Якорь считаем от НОМЕРА ОКНА, а не от curIdx в момент первой
         загрузки. Раньше start = curIdx − HIST, то есть зависел от того,
         когда сессия открылась: два игрока онлайн в одну и ту же минуту
         получали разные якоря и, как следствие, слегка разные цены
         (замер: Δ ≈ 0.0003%). Теперь все сессии внутри одного 28-часового
         окна стартуют с одного индекса, и цена снова чистая функция
         времени. Между окнами якоря разные, но сильное возвращение к
         средней гасит расхождение. */
      var winStart = curIdx - (curIdx % WINDOW);
      var start = Math.max(0, winStart - HIST);
      c.idx = start;
      c.close = asset.base * (0.94 + 0.12 * hash(asset.seed + 99, start));
      c.prev = c.close;
      c.hist = [c.close];
    }
    var guard = 0;
    /* Скачок часов. Если curIdx ушёл вперёд больше чем на предел guard,
       цикл до него НЕ ДОЙДЁТ: c.idx останется позади, и каждый следующий
       вызов будет снова крутить 500 000 итераций — не «медленно один раз»,
       а постоянный фриз до перезапуска. Замер: прыжок на +400 суток давал
       168 мс, и следующий вызов — снова 177 мс.
       Правильное поведение — пересобрать состояние с нуля на новом окне. */
    if (curIdx - c.idx > 500000) {
      c.idx = -1;
      return advance(asset, now);
    }
    while (c.idx < curIdx && guard++ < 500000) {
      c.idx++;
      c.prev = c.close;
      // Мягкий возврат к средней — рынок не улетает от базового уровня.
      var pull = Math.log(asset.base / c.close) * 0.0012;
      if (pull > 0.01) pull = 0.01; else if (pull < -0.01) pull = -0.01;
      c.close = c.prev * (1 + retAt(asset, c.idx) + pull);
      c.hist.push(c.close);
      if (c.hist.length > HIST) c.hist.shift();
    }
    return c;
  }

  function closeIdx(c, e) {
    var base = c.idx - c.hist.length + 1;
    if (e < base || e > c.idx) return c.close;
    return c.hist[e - base];
  }

  /* Живую цену считаем интерполяцией к цели свечи + мелкий шум. */
  function live(asset, now) {
    var c = advance(asset, now);
    var p = ((now - ANCHOR) % CANDLE_MS) / CANDLE_MS;
    var e = p * p * (3 - 2 * p);
    var jitter = (hash(asset.seed + 41, Math.floor(now / 400)) - 0.5) * asset.vol * 0.12;
    return (c.prev + (c.close - c.prev) * e) * (1 + jitter);
  }

  /* Массив свечей {o,h,l,c,t} для графика. tf — множитель базовой свечи.
     n ограничивается доступной историей.
     t — время закрытия свечи (мс), чтобы график мог подписывать ось X:
     индекс свечи линейно переводится в метку времени от общего якоря. */
  function candles(asset, n, tf, now) {
    var c = advance(asset, now);
    n = Math.max(1, Math.min(n, Math.floor((c.hist.length - 1) / tf)));
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var e = c.idx - i * tf;
      var o = closeIdx(c, e - tf);
      var cl = closeIdx(c, e);
      if (o == null || cl == null) continue;
      var hi = Math.max(o, cl) * (1 + asset.vol * 0.33 * hash(asset.seed, e * 2 + 1));
      var lo = Math.min(o, cl) * (1 - asset.vol * 0.33 * hash(asset.seed, e * 2 + 2));
      out.push({ o: o, h: hi, l: lo, c: cl, t: ANCHOR + e * CANDLE_MS });
    }
    return out;
  }

  /* Сколько свечей таймфрейма tf реально доступно. Нужно графику, чтобы
     панорамирование не уезжало за край данных: TF_MAX — это «сколько
     хотим», depth — «сколько есть». Берём минимум. */
  function depth(asset, tf) {
    return Math.max(1, Math.floor((advance(asset, Date.now()).hist.length - 1) / tf));
  }

  /* Изменение за 288 базовых свечей (условные «24 часа»).
     Считаем от ЖИВОЙ цены, а не от закрытия текущей свечи: close
     заморожен до конца свечи, и процент стоял бы на месте, пока
     цена тикает (жалобы «−0.49% не двигается»). */
  function change(asset, now) {
    var c = advance(asset, now);
    var past = closeIdx(c, c.idx - 288);
    if (!past) return 0;
    return (live(asset, now) - past) / past;
  }

  /* Активная новость по активу (для тоста и всплеска на графике).
     Возвращает жизненный цикл: age — свечей с момента выхода,
     fresh — шок ещё идёт (первые 6), fading — хвост тянет цену
     (до ~ суток бакетной жизни), fade — затухание 1→0. */
  function news(asset, now) {
    var c = advance(asset, now);
    var bucket = Math.floor(c.idx / 24);
    for (var b = bucket; b >= bucket - 2; b--) {
      var n = newsAtCached(asset, b);
      if (n) {
        var age = c.idx - b * 24;
        return {
          dir: n.dir,
          active: age < 6,
          fading: age >= 6 && age < 24,
          age: age,
          fade: Math.max(0, 1 - age / 24),
          /* Начало бакета события. Нужно, чтобы огибающая всплеска объёма
             считалась от ВРЕМЕНИ СОБЫТИЯ, а не от момента, когда игрок
             открыл вкладку: иначе два игрока в один момент видели разный
             объём, а зашедший позже всплеска не видел вовсе. */
          t0: ANCHOR + b * 24 * CANDLE_MS,
          /* Объём поднимают только новости с явным флагом vol — те,
             что сами утверждают, что объёмы выросли. Раньше флаг
             выводился из «последний элемент NEWS.up», и любое
             расширение пула молча ломало привязку. */
          volMult: n.item.vol ? 3.2 : 1,
          impact: n.item.impact,
          cat: n.item.cat,
          text: n.item[LANG] || n.item.en
        };
      }
    }
    return null;
  }

  /* Лента новостей: все события за последние LOOKBACK бакетов по всем
     активам, от свежих к старым. Детерминированно — цена и новости
     считаются от времени, поэтому лента одинакова у всех игроков и
     не «переезжает» при перезапуске.

     Перебор: LOOKBACK бакетов × все активы. Бакет = 24 свечи = 2
     минуты, так что 40 бакетов — это 80 минут истории, чего хватает
     ленте. Хеш дешёвый, 100 активов × 40 = 4000 вызовов на
     перерисовку — незаметно. */
  var LOOKBACK = 40;
  function newsFeed(now, limit) {
    limit = limit || 30;
    /* Бакет считаем прямо из времени, а не через advance(ASSETS[0]):
       состояние кеша у разных активов продвигается независимо, и первый
       актив мог ещё ни разу не «продвигаться» — тогда его idx = -1 и
       лента уехала бы в доисторические бакеты. */
    var bucket = Math.floor(Math.floor((now - ANCHOR) / CANDLE_MS) / 24);
    var out = [];
    if (typeof ASSETS === 'undefined' || !ASSETS.length) return out;
    for (var b = bucket; b > bucket - LOOKBACK && b >= 0; b--) {
      /* Экстремальное событие — редкое, бьёт по одной монете. В ленту
         идёт отдельной записью с флагом extreme: UI подсвечивает его
         иначе, игрок должен видеть, что случилось что-то крупное. */
      var exn = extremeNewsAt(b);
      if (exn) {
        var et = ANCHOR + b * 24 * CANDLE_MS + Math.floor(hash(EXTREME_SEED + 101, b) * 24) * CANDLE_MS;
        if (et <= now) {
          out.push({
            id: exn.asset.id,
            ticker: exn.asset.ticker,
            name: exn.asset.name,
            dir: exn.dir,
            impact: exn.item.impact,
            cat: exn.item.cat,
            vol: false,
            extreme: true,
            t: et,
            text: exn.item[LANG] || exn.item.en
          });
        }
      }
      /* Рыночное событие — одно на бакет на весь рынок. Идёт в ленту
         отдельной записью: id пустой, флаг market. Монеты у неё нет,
         поэтому UI рисует её без аватара, а клик по ней ничего не
         открывает (обработчик проверяет id). */
      var mn = marketNewsAt(b);
      if (mn) {
        var mt = ANCHOR + b * 24 * CANDLE_MS + Math.floor(hash(MARKET_SEED + 101, b) * 24) * CANDLE_MS;
        if (mt <= now) {
          out.push({
            id: '', ticker: '', name: '', market: true,
            dir: mn.dir, impact: mn.item.impact, cat: mn.item.cat, vol: false,
            t: mt, text: mn.item[LANG] || mn.item.en
          });
        }
      }
      for (var i = 0; i < ASSETS.length; i++) {
        var a = ASSETS[i];
        var n = newsAtCached(a, b);
        if (!n) continue;
        /* Время внутри бакета — из хеша (актив, бакет), а не начало бакета.
           Бакет — это 24 свечи, то есть ДВЕ МИНУТЫ: с прежним t все события
           окна получали одну метку, и лента показывала «1 мин» у всего
           подряд, хотя события разнесены по времени. Смещение берётся из
           того же детерминированного хеша, поэтому от того, когда игрок
           открыл игру, оно не зависит.
           Ещё не наступившие события не показываем: текущий бакет прожит не
           целиком, и без этой проверки в ленте появлялись новости с
           отрицательным возрастом (метка в будущем). Побочный эффект
           полезный — внутри окна новости приходят постепенно, а не стеной
           на его границе. */
        var t = ANCHOR + b * 24 * CANDLE_MS + Math.floor(hash(a.seed + 101, b) * 24) * CANDLE_MS;
        if (t > now) continue;
        out.push({
          id: a.id,
          ticker: a.ticker,
          name: a.name,
          dir: n.dir,
          impact: n.item.impact,
          cat: n.item.cat,
          vol: !!n.item.vol,
          t: t,
          text: n.item[LANG] || n.item.en
        });
      }
    }
    out.sort(function (x, y) { return y.t - x.t; });
    return out.slice(0, limit);
  }

  return {
    CANDLE_MS: CANDLE_MS,
    live: live,
    candles: candles,
    depth: depth,
    change: change,
    news: news,
    newsFeed: newsFeed,
    /* Отдаём наружу для отладки и тестов: тир капитализации влияет на
       частоту новостей и их силу, и без доступа к нему это не измерить. */
    capTier: capTier,
    extremeNewsAt: extremeNewsAt,
    /* Импульс наружу — для тестов. Через live() прошлое не измерить:
       advance() кеширует путь и идёт только вперёд. */
    newsImpulse: newsImpulse,
    /* Для прода/покупки: ask = p*(1+spread), bid = p*(1-spread). */
    ask: function (asset, now) { return live(asset, now) * (1 + CONFIG.spread); },
    bid: function (asset, now) { return live(asset, now) * (1 - CONFIG.spread); }
  };
})();
