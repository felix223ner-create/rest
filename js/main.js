/* TradeUp — игровой клиент: состояние, экраны, торговля, бонусы, рейтинг. */
'use strict';

/* ------------------------------ Состояние ------------------------------ */

function freshState() {
  return {
    v: 5,
    name: '',
    balance: CONFIG.startBalance,
    /* Точка отсчёта для «изменения капитала» на вкладке Capital
       портфеля: capital() − startBalance = сколько игрок заработал
       с самого начала. Нужно отдельное поле, потому что S.balance
       меняется при каждой сделке и как ориентир не годится. */
    startBalance: CONFIG.startBalance,
    /* capHistory осталось в SAVE_KEYS только ради совместимости со
       старыми сейвами: раньше в него писались снимки {t, v} для
       графика «Капитала». Теперь кривая строится из S.trades (см.
       capitalSeries) — точнее и работает с первой же сделки, без
       накопления истории. Новые записи сюда не пишутся. */
    capHistory: [],
    /* Долговременная история hero портфеля: {t, cap, pnl}. Нужна для
       диапазона «Всё время» и честного изменения за таймфрейм.
       Старые точки постепенно прореживаются, свежие остаются минутными. */
    pfHistory: [],
    positions: {},          // id -> { qty, cost }
    trades: [],             // последние сделки
    realized: 0,
    tradesCount: 0,
    wins: 0,
    /* Знаменатель винрейта: число ПРОДАННЫХ сделок. Покупка
       закрытия не даёт и в успешности участвовать не должна. */
    sellsCount: 0,
    /* Достижения (модуль js/achievements.js, флаг ACH_ON):
       ach — { id: unlockedAtMs }, achPts — очки, stats — счётчики
       прогресса. Форма stats зафиксирована в freshStats() ниже. */
    ach: {},
    achPts: 0,
    stats: freshStats(),
    /* Витрина: items — { itemId: unlockedAtMs }, equip — надетое
       { title, frame, candles, accent, flag }. Создаёт модуль Ach. */
    items: {},
    equip: null,
    best: CONFIG.startBalance,
    createdAt: Date.now(),
    dailyDay: '',           // YYYY-MM-DD последнего ежедневного бонуса
    streak: 0,
    lastAdAt: 0,
    lastGrantAt: 0,
    classSeen: 0,
    theme: 'dark',
    lang: '',                // '' = авто по SDK
    favs: {},                // избранное: id -> true
    notifies: {},            // подписка на исполнение лимиток по активу: id -> true
    /* Уведомления (js/v3-alerts.js): активные, лента сработавших, когда
       игрок последний раз смотрел центр, флаг переноса старых колоколов. */
    alerts: [],
    alertFeed: [],
    alertSeen: 0,
    alertsMig: 0,
    sortKey: 'cap',          // cap | price | change | volume | pop | az
    sortDir: 'desc',
    marketCat: 'all',        // фильтр категории рынка (сектор монеты или 'all')
    /* Тип графика на экране трейда: candle | line (переключатель в
       шапке графика). Сами скины свечей живут в S.equip.candles. */
    chartType: 'candle',
    avatar: 'avatar_01',     // выбранный аватар: avatar_01..avatar_24
    /* Лимитные ордера: исполняются, когда цена дотягивается до
       целевой. Купля — когда ask <= price; продажа — когда bid >= price.
       Для buy хранится сумма в $, для sell — количество в монетах:
       так совпадает с тем, что вводит игрок на шите. Срока действия
       у ордера нет — висит, пока не исполнится или не отменят.
       armed = true, когда цена уже побывала «с другой стороны» лимита:
       пока его нет, ордер ждёт возврата к цене, а не исполняется сразу. */
    limitOrders: [],
    /* История ордеров: сюда попадает каждый ордер — и лимитный, и
       рыночный — и остаётся после исполнения или отмены. Из
       S.limitOrders запись удаляется в момент закрытия, поэтому
       «историю ордеров» без отдельного массива показать нечем.
       Запись: { id, assetId, side, kind, price, amount, qty, status,
       createdAt, closedAt, fillPrice }. kind: limit | market;
       status: open | filled | cancelled. Храним последние 60 — на
       телефоне больше всё равно не пролистают, а сейв растёт. */
    orderHistory: [],
    /* Какие проценты от рынка показывать в чипах лимитной цены.
       Для покупки — отрицательные (и 0 = «Рынок»), для продажи —
       положительные (и 0). Список редактируется через кнопку ✎
       под чипами: можно добавить свой процент или убрать лишний.
       Числа в процентах, 0 = чип «Рынок», порядок по возрастанию. */
    limitOffsets: { buy: [-5, -2, -1, 0], sell: [0, 1, 2, 5] },
    /* Lucky Spin: колесо в лобби. spinFreeAt — когда следующий
       бесплатный спин (0 = сейчас). spinAdDay/spinAdCount — дневной
       счётчик спинов за рекламу; используется только при включённом
       adDailyLimit > 0 (сейчас лимита нет и счётчик не растёт). */
    spinFreeAt: 0,
    spinAdDay: '',
    spinAdCount: 0,
    /* Скидка на торговую комиссию из колеса: pct — размер скидки в
       процентах, left — сколько сделок осталось. Должны сохраняться
       вместе с остальным сейвом (см. SAVE_KEYS). */
    feeDiscPct: 0,
    feeDiscLeft: 0,
    /* Фьючерсы (js/futures.js): позиции, история, настройки шита. null —
       модуль сам создаст структуру (Fut.sanitize при загрузке). */
    fut: null,
    /* Настройки анимаций (js/v3-motion.js): 'adv' — продвинутые,
       'std' — стандартные; rm — «меньше движения». howSeen — сколько
       шагов «Как играть» просмотрено (N+1 — пройдено целиком). */
    fx: 'adv',
    rm: 0,
    howSeen: 0
  };
}

/* Нулевая статистика достижений. Ключи стабильны: модуль достижений
   дописывает только эти поля, сейв старых версий чинится в loadState. */
function freshStats() {
  return {
    volume: 0, feesPaid: 0, winStreak: 0, maxWinStreak: 0,
    maxHoldMs: 0, minHoldMs: 0, bestPct: 0, drawdownSurvived: 0,
    cancels: 0, limitsFilled: 0, alertsFired: 0, spins: 0, themeSwaps: 0,
    assetsTraded: [], sessionsNight: 0, nightLast: '', langs: [],
    broke80: false, brokeZero: false, capPeak: 0,
    /* Крайние закрытые сделки: нужны плиткам «Лучшая»/«Худшая» в
       профиле. null = закрытых сделок ещё не было (показываем прочерк). */
    bestTrade: null, worstTrade: null,
    tradesTotal: 0, winsTotal: 0, lastFillAt: 0, lastAlertAt: 0,
    /* Предыдущие отметки лимитки/колокольчика — на них держится
       достижение limit_alert_combo («два разных сигнала за минуту»). */
    prevFillAt: 0, prevAlertAt: 0,
    achSeen: 0
  };
}

var S = freshState();
var SAVE_KEYS = ['v','name','balance','startBalance','capHistory','pfHistory','positions','trades','realized','tradesCount','wins','sellsCount','best',
  'createdAt','dailyDay','streak','lastAdAt','lastGrantAt','classSeen','theme','lang','favs',
  'notifies','alerts','alertFeed','alertSeen','alertsMig','sortKey','sortDir','marketCat','chartType','avatar','limitOrders','orderHistory','limitOffsets',
  'spinFreeAt','spinAdDay','spinAdCount','feeDiscPct','feeDiscLeft',
  'ach','achPts','stats','items','equip','fut','fx','rm','howSeen','snd'];
/* Пак сгенерированных аватарок: 24 шт., 6×4 сетка в исходном PNG. */
var AVATAR_COUNT = 24;

var currentTab = 'lobby';
/* Одноразовый флаг: следующий setTab вызван жестом, поэтому входящая
   страница получает более длинную swipe-анимацию, а не короткий переход
   обычного тапа по нижнему меню. */
var mainTabFromSwipe = false;
var tradeAssetId = null;
var tradeTf = 1;            // множитель свечей: 1=5с, 3=15с, 12=1м
var tradeAmt = 50;          // сумма сделки, $
var lastSubmitScore = 0;
var lastNewsBucket = {};
var dispCap = 0;            // сглаженное значение для анимации счётчика
var newsAssetId = null;     // монета последней новости — для перехода по клику
var newsCurrent = null;     // последний объект новости для оформления тикера
var newsShownBucket = -1;   // бакет показанной новости: устарела — строка гаснет в «спокойствие»
var newsFeedReturnTo = 'app-main';
var tickN = 0;              // счётчик тиков (для редких перерисовок)
/* Избранное меняли на экране трейда. Возврат идёт «тихо» (setTab с quiet),
   поэтому список рынка надо пересобрать самому: избранные группируются
   наверх и получают отдельный заголовок, точечной правкой класса тут не
   обойтись. */
var marketFavDirty = false;

/* ------------------------------ Утилиты ------------------------------ */

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* Единая точка «проглатывания» необязательных ошибок.
   Раньше по коду было ~95 пустых catch (e) {} — сбой в достижениях,
   наградах, сохранении или эффектах не оставлял следов вообще, и баг
   у игрока невозможно было заметить (в achievements.js не было ни
   одного console.*). Теперь такие места пишут в консоль, но не спамят:
   каждый контекст логируется один раз за сессию.
   Объявлена в main.js (последний скрипт), но вызывается только из
   обработчиков и рендеров, то есть уже после загрузки всех файлов. */
var _swallowed = {};
function dbg(ctx, e) {
  if (_swallowed[ctx]) return;
  _swallowed[ctx] = 1;
  try { console.warn('[TradeUp] ' + ctx, e); } catch (_) {}
}

/* $1 234.56 — узкая неразрывная группа разрядов. Точность всегда
   2 знака: раньше здесь был тернарник с одинаковыми ветками —
   недописанная логика разрядности для мелких сумм. */
function money(x, forceDec) {
  var neg = x < 0;
  x = Math.abs(x);
  var dec = forceDec != null ? forceDec : 2;
  var parts = x.toFixed(dec).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return (neg ? '-$' : '$') + parts.join('.');
}

function fmtSigned(x) {
  return (x >= 0 ? '+' : '') + money(x);
}

/* Дата регистрации для героя профиля. Берём локаль из LANG, а не
   отдельные ключи месяцев: toLocaleDateString уже знает и «мар.»,
   и «Mar», и порядок «12 мар. 2024» против «Mar 12, 2024». */
function fmtSince(ts) {
  var d = new Date(Number(ts) || 0);
  if (!isFinite(d.getTime()) || d.getTime() <= 0) return '';
  try {
    return d.toLocaleDateString(LANG === 'ru' ? 'ru-RU' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }).replace(' г.', '');
  } catch (e) { return ''; }
}

function assetById(id) {
  for (var i = 0; i < ASSETS.length; i++) if (ASSETS[i].id === id) return ASSETS[i];
  return null;
}

/* Имя актива: у монет из CoinGecko оно одно (бренд), у прочих — словарь. */
function assetName(a) {
  return typeof a.name === 'string' ? a.name : (a.name[LANG] || a.name.en);
}

function now() { return Date.now(); }

/* Склонение «сделка» для подписей статистики профиля.
   RU: 1 сделку, 2 сделки, 5 сделок. EN: 1 trade, N trades. */
function dealsWord(n) {
  if (LANG !== 'ru') return t(Math.abs(n) === 1 ? 'st_deal_one' : 'st_deal_many');
  var a = Math.abs(n) % 10, b = Math.abs(n) % 100;
  if (a === 1 && b !== 11) return t('st_deal_one');
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t('st_deal_few');
  return t('st_deal_many');
}

/* Иконка монеты: локальный логотип. */
function coinHtml(a) {
  var src = a.img || ('img/coins/' + a.id + '.png');
  /* esc() для src/alt: данные статические (data-coins.js), но рядом в
     коде тот же src уже экранируется — держим единообразие, чтобы
     первая же внешняя монета не стала дырой. decoding="async" — чтобы
     декод логотипа никогда не блокировал кадр: строки рынка
     переставляются FLIP'ом каждые ~7 секунд, и синхронный декод на
     слабых устройствах давал бы мигание иконки на один кадр. */
  return '<span class="coin"><img class="coin-img" src="' + esc(src) + '" alt="' + esc(a.ticker) + '" draggable="false" decoding="async" onerror="this.style.display=\'none\'"></span>';
}

/* Вспышка цены при изменении. strong — ещё и «дыхание» числа (для крупной цены).

   Реализация намеренно НЕ трогает offsetWidth по одной строке. Замер на
   экране рынка (200 монет): наивный вариант с `void el.offsetWidth` перед
   каждым .add делал 408 принудительных reflow и 408 перезапусков анимации
   за 2 секунды (~200/сек), при 154 одновременно мигающих строках. Каждый
   reflow синхронно сливает layout — это и была основная просадка рынка.

   Две правки:
   1. Перезапуск через Web Animations API там, где он есть: анимация
      переигрывается без чтения layout вообще. Запасной путь (.reflow-tick
      на контейнере + один общий reflow) для старых WebView.
   2. Не перезапускаем вспышку, пока предыдущая ещё играет. Тик идёт раз в
      500 мс, а вспышка длится 700 мс: при непрерывном изменении цены она
      обрывалась на 71% и начиналась заново — вместо «мигнуло и погасло»
      получалось дрожащее мерцание. Теперь вспышка честно досвечивает, а
      следующая начинается со следующего тика.

   Класс вспышки СНИМАЕТСЯ по animationend. Иначе он висит на элементе
   вечно: замер показал 147 строк из 200 с классом flash-* спустя
   секунды после конца анимации. Это держало элемент в слое композитинга,
   врало в любых замерах «что сейчас анимируется» и — главное — глушило
   законную следующую вспышку в ту же сторону, потому что старая класс-
   метка всё ещё стояла. */
var prevPriceText = {};
/* Имена KEEYFRAME'ов, а не классов: класс .flash-up играет pf-flash-up,
   а .tick-up — tickUp (camelCase). Регулярка по именам классов здесь не
   сработала бы вообще: я на этом уже попался — проверка
   /^(flash-up|tick-up)$/ не совпадала НИ с одним реальным именем, и
   слушатель молча не чистил ни один элемент. */
var FLASH_ANIM_RE = /^(pf-flash-(up|down)|tick(Up|Down))$/;
function clearFlashClasses(el) {
  if (!el || !el.classList) return;
  el.classList.remove('flash-up', 'flash-down', 'tick-up', 'tick-down');
}
function flashPrice(key, el, newText, strong, sound) {
  var old = prevPriceText[key];
  if (old !== undefined && old !== newText && el) {
    var up = parseFloat(newText.replace(/[^\d.\-]/g, '')) >= parseFloat(old.replace(/[^\d.\-]/g, ''));
    if (sound) Snd.play(up ? 'tick_up' : 'tick_down');
    var cls = up ? 'flash-up' : 'flash-down';
    /* Уже мигаем этим же направлением — не дёргаем повторно. */
    if (!el.classList.contains(cls)) {
      clearFlashClasses(el);
      el.classList.add(cls);
      if (strong) el.classList.add(up ? 'tick-up' : 'tick-down');
      /* Перезапуск без чтения layout: отменяем уже висящие анимации,
         чтобы CSS-машина начала их заново на свежем классе. */
      if (el.getAnimations) {
        try {
          el.getAnimations().forEach(function (an) {
            if (an.animationName && FLASH_ANIM_RE.test(an.animationName)) an.cancel();
          });
        } catch (e) { dbg('flashPrice', e); }
      }
      /* Снимаем метку после проигрывания. Без этого класс остаётся на
         элементе навсегда: замер показал 147 строк из 200 с классом
         flash-* спустя секунды после конца анимации — элемент висел в
         слое композитинга, а замеры «что анимируется» врали.
         Ждём ПОСЛЕДНЮЮ из двух: у «сильной» вспышки рядом с pf-flash-*
         играет tickUp/tickDown и заканчивается раньше. Если снять классы
         по первому же animationend, вторая анимация оборвётся на
         середине. Поэтому чистим, только когда ничего не осталось. */
      if (el.addEventListener && !el.__flashEnd) {
        el.__flashEnd = true;
        el.addEventListener('animationend', function (ev) {
          if (ev.target !== el || !FLASH_ANIM_RE.test(ev.animationName || '')) return;
          try {
            if (el.getAnimations) {
              var still = el.getAnimations().some(function (an) {
                return FLASH_ANIM_RE.test(an.animationName || '') && an.playState === 'running';
              });
              if (still) return;
            }
          } catch (e) { dbg('flashPrice', e); }
          clearFlashClasses(el);
        });
      }
    }
  }
  prevPriceText[key] = newText;
}

/* Вид графика: дефолт/максимум баров по ТФ.
   Дефолт deliberately меньше максимума — иначе листать некуда. */
var TF_DEFAULT = { 1: 72, 3: 72, 12: 60, 60: 48, 180: 24 };
var TF_MAX = { 1: 240, 3: 240, 12: 180, 60: 90, 180: 40 };
var chartView = { bars: 72, offset: 0, yk: 1, ysh: 0 };
/* Масштаб графика (кнопки −/+, ось цен) — контроллер Chart.zoomUI. */
var chartZoom = null;
var chartHover = -1;
var chartHoverY = null;
/* Test hook для headless-харнессов (tools/tap_crosshair.html и др.):
   читает актуальные значения из замыкания. В проде не используется. */
/* На прод-хосте хук не выставляем: лишняя глобальная функция в архиве
   для Яндекс Игр ни к чему. isDevHost() объявлена в index.html. */
if (typeof window !== 'undefined' && typeof isDevHost === 'function' && isDevHost()) {
  window.__chartState = function () { return { hover: chartHover, hoverY: chartHoverY }; };
}

function resetChartView() {
  chartView.bars = TF_DEFAULT[tradeTf] || 72;
  chartView.offset = 0;
  chartView.yk = 1;
  chartView.ysh = 0;
  chartHover = -1;
  chartHoverY = null;
  clampChartView();
  if (chartZoom) chartZoom.sync();
}

/* Предел баров = минимум из «сколько хотим» (TF_MAX) и «сколько есть»
   (Engine.depth). Раньше брался только TF_MAX, и на 15м таймфрейме
   offset уезжал за край доступных данных: slice() уходил в отрицательную
   зону, график пустел или «съезжал». */
function chartMaxBars() {
  var a = assetById(tradeAssetId);
  var want = TF_MAX[tradeTf] || 120;
  if (!a || !Engine.depth) return want;
  return Math.max(1, Math.min(want, Engine.depth(a, tradeTf)));
}

function clampChartView() {
  var max = chartMaxBars();
  chartView.bars = Math.max(12, Math.min(chartView.bars, max));
  var maxOff = Math.max(0, max - chartView.bars);
  chartView.offset = Math.max(0, Math.min(chartView.offset, maxOff));
}

/* Общий капитал = свободные + позиции по текущим bid + фьючерсы. */
function capital() {
  var c = S.balance;
  for (var id in S.positions) {
    var a = assetById(id);
    if (!a) continue;
    c += S.positions[id].qty * Engine.bid(a, now());
  }
  return c + futEquity();
}

/* Фьючерсы: фьючерсный кошелёк плюс то, что вернётся, если закрыть все позиции. */
function futEquity() {
  return typeof Fut !== 'undefined' ? Fut.equity() : 0;
}

function invested() {
  var c = 0;
  for (var id in S.positions) {
    var a = assetById(id);
    if (a) c += S.positions[id].qty * Engine.bid(a, now());
  }
  return c;
}

/* Долговременная история портфеля для диапазона «Всё время».
   Минутные снимки дают плавную форму, force-снимки после сделок и
   наград фиксируют скачки сразу. Максимум 900 точек; при переполнении
   прореживаем СТАРЫЕ 2:1, оставляя последние 300 без потерь. Так
   начало жизни аккаунта не исчезает, а сейв не растёт бесконечно. */
var PF_HISTORY_MS = 60000;
var PF_HISTORY_MAX = 900;
function compactPfHistory() {
  if (!Array.isArray(S.pfHistory)) S.pfHistory = [];
  if (S.pfHistory.length <= PF_HISTORY_MAX) return;
  var cut = Math.max(2, S.pfHistory.length - 300);
  var packed = [S.pfHistory[0]];
  for (var i = 2; i < cut; i += 2) packed.push(S.pfHistory[i]);
  S.pfHistory = packed.concat(S.pfHistory.slice(cut));
}
function pushPfSnapshot(force) {
  if (!Array.isArray(S.pfHistory)) S.pfHistory = [];
  var ts = Date.now();
  var last = S.pfHistory[S.pfHistory.length - 1];
  if (!force && last && ts - last.t < PF_HISTORY_MS) return false;
  /* pnl — ОБЩИЙ: реализованный (накопленный в S.realized) плюс
     нереализованный по открытым позициям. Раньше писался только
     unrealized, и после закрытия прибыльной сделки точка истории
     падала к нулю — график «за всё время» показывал просадку там,
     где игрок как раз заработал. */
  var rec = { t: ts, cap: capital(), pnl: realizedSafe() + invested() - costBasis() };
  /* Два действия в одном миллисекундном тике: сохраняем только новое
     состояние, иначе в ALL появятся точки с одинаковым временем. */
  if (last && ts <= last.t) S.pfHistory[S.pfHistory.length - 1] = rec;
  else S.pfHistory.push(rec);
  compactPfHistory();
  return true;
}

function classFor(cap) {
  var idx = 0;
  for (var i = 0; i < CLASSES.length; i++) if (cap >= CLASSES[i].cap) idx = i;
  return idx;
}

/* true — облако не ответило (сеть/ошибка). Тогда сейв НЕ пишем вообще:
   дефолтное состояние затрёт прогресс игрока. Сессия играется без
   сохранения, а прошлый сейв в облаке остаётся целым — при следующем
   запуске он загрузится. Молча стартовать «с нуля» и записать это поверх
   облака — худший из возможных исходов. */
var saveLoadFailed = false;

function saveState(immediate) {
  if (saveLoadFailed) return;
  var data = {};
  SAVE_KEYS.forEach(function (k) { data[k] = S[k]; });
  YaGame.save(data, immediate === true);
}

/* Загрузка с повторами: getData может отвалиться на секунду-другую, и
   сдаваться с первого раза — значит рискнуть прогрессом игрока. */
function loadState(attempt) {
  attempt = attempt || 1;
  return YaGame.load().then(function (d) {
    if (d && typeof d === 'object') {
      SAVE_KEYS.forEach(function (k) {
        if (d[k] !== undefined) S[k] = d[k];
      });
      /* Позиции по удаленным активам не должны ломать капитал. Заодно
         чиним числа: облачный сейв может прийти побитым (обрыв записи,
         сторонний клиент), и тогда qty/cost оказываются строкой, null
         или NaN. Через игровой путь такое не приходит — все записи идут
         арифметикой, — но один битый сейв давал НАВСЕГДА сломанный
         портфель: NaN расползается по капиталу, долям и PnL, лечится
         только сбросом прогресса. Дробные значения не трогаем (мелкие
         монеты держат доли), только приводим к числу и отсекаем мусор. */
      Object.keys(S.positions).forEach(function (id) {
        if (!assetById(id)) { delete S.positions[id]; return; }
        var _p = S.positions[id];
        if (!_p || typeof _p !== 'object') { delete S.positions[id]; return; }
        var _q = typeof _p.qty === 'number' ? _p.qty : parseFloat(_p.qty);
        var _c = typeof _p.cost === 'number' ? _p.cost : parseFloat(_p.cost);
        if (!isFinite(_q) || _q <= 0) { delete S.positions[id]; return; }
        if (!isFinite(_c) || _c < 0) _c = 0;
        _p.qty = _q;
        _p.cost = _c;
      });
      /* Опция сортировки по популярности удалена — возвращаем маркет-кап. */
      if (S.sortKey === 'pop') { S.sortKey = 'cap'; S.sortDir = 'desc'; }
      /* Фильтр категории из старого/битого сейва: неизвестный ключ дал бы
         пустой список рынка без объяснения. */
      if (S.marketCat && S.marketCat !== 'all') {
        var _okCat = MARKET_CATS.indexOf(S.marketCat) >= 0 || S.marketCat === 'other';
        if (!_okCat) S.marketCat = 'all';
      }
      /* Тип графика из битого сейва: неизвестное значение — к свечам. */
      if (S.chartType !== 'line') S.chartType = 'candle';
      /* Сейвы старше появления notifies/favs могут прийти без этих полей
         или с null. Без приведения к объекту чтение S.notifies[id] падает
         с TypeError на каждом открытии экрана трейда. */
      if (!S.favs || typeof S.favs !== 'object') S.favs = {};
      if (!S.notifies || typeof S.notifies !== 'object') S.notifies = {};
      /* Достижения (v2): чиним форму, ретро-выдачу делает модуль
         (молча, один итоговый тост — см. Ach.migrate). Без модуля
         (откат) — просто дефолты, игра работает как раньше. */
      if (!S.ach || typeof S.ach !== 'object') S.ach = {};
      if (typeof S.achPts !== 'number' || !isFinite(S.achPts) || S.achPts < 0) S.achPts = 0;
      if (!S.stats || typeof S.stats !== 'object') S.stats = freshStats();
      else {
        var _fs = freshStats();
        for (var _sk in _fs) if (S.stats[_sk] === undefined) S.stats[_sk] = _fs[_sk];
      }
      if ((S.v || 1) < 3) {
        var _mig = { given: 0, items: 0 };
        if (typeof Ach !== 'undefined' && Ach.migrate) { try { _mig = Ach.migrate() || _mig; } catch (e) { dbg('loadState', e); } }
        if (_mig.items > 0) { try { toast(t('ach_migrated_items', { n: _mig.items }), 'gold'); } catch (e) { dbg('loadState', e); } }
        else if (_mig.given > 0) { try { toast(t('ach_migrated', { n: _mig.given }), 'gold'); } catch (e) { dbg('loadState', e); } }
        try { if (typeof refreshFeePctLabel === 'function') refreshFeePctLabel(); } catch (e) { dbg('loadState', e); }
        S.v = 3;
      }
      /* Предметы за уже открытые достижения — БЕЗ привязки к версии сейва.
         Новые предметы приходят с обновлениями игры, а сейв к тому моменту
         давно v5; внутри migrate() (он только для v<3) досыпка не
         срабатывала, и 32 предмета выдавались молча. Идемпотентно:
         на втором запуске добавится 0 и тоста не будет. */
      if (typeof Ach !== 'undefined' && Ach.backfillItems) {
        try {
          var _bf = Ach.backfillItems();
          if (_bf > 0) toast(t('ach_migrated_items', { n: _bf }), 'gold');
        } catch (e) { dbg('loadState', e); }
      }
      /* v5: модель комиссии покупки изменена. Теперь комиссия уменьшает
         КОЛИЧЕСТВО монет (см. doBuy), а себестоимость равна фактически
         списанной сумме — то есть cost старых сейвов уже правильный.
         Миграция v4 умножала cost на 1/(1−rate), исходя из прежней
         ошибочной модели «комиссия сидит в себестоимости»; этот
         множитель убран, иначе он завышал бы базу у всех, кто её прошёл.
         Сейвы, успевшие получить v4, несут cost, завышенный на ~rate
         (≈1% при базовой ставке). Обратно не разворачиваем: по сейву
         нельзя отличить миграцию от свежего старта, а гадать хуже, чем
         оставить. Погрешность самолечится — cost обнуляется, когда
         позиция закрывается. На момент правки игра не опубликована. */
      if ((S.v || 1) < 5) S.v = 5;
      /* startBalance появился позже — это точка отсчёта для «изменения
         капитала» на вкладке Capital портфеля. Старый сейв приходит без
         него, и capital() - S.startBalance давал NaN, из-за чего под
         числом показывалось «nan %». Для старых сейвов берём
         CONFIG.startBalance: игра всегда стартует с одной суммы, так
         что это честная точка отсчёта. */
      if (typeof S.startBalance !== 'number' || !isFinite(S.startBalance) || S.startBalance <= 0) {
        S.startBalance = CONFIG.startBalance;
      }
      /* Миграция истории hero. Старые версии сохраняли только капитал
         в capHistory [{t,v}]. Забираем эти точки в новый pfHistory;
         pnl у них неизвестен — оставляем null, ALL-PnL доберёт форму
         из доступной истории сделок. */
      if (!Array.isArray(S.pfHistory)) S.pfHistory = [];
      if (!S.pfHistory.length && Array.isArray(S.capHistory)) {
        for (var phi = 0; phi < S.capHistory.length; phi++) {
          var oldPh = S.capHistory[phi];
          if (oldPh && typeof oldPh.t === 'number' && typeof oldPh.v === 'number' && isFinite(oldPh.v)) {
            S.pfHistory.push({ t: oldPh.t, cap: oldPh.v, pnl: null });
          }
        }
      }
      for (var phj = 0; phj < S.pfHistory.length; phj++) {
        var ph = S.pfHistory[phj];
        if (!ph || typeof ph.t !== 'number' || !isFinite(ph.t) ||
            typeof ph.cap !== 'number' || !isFinite(ph.cap)) {
          S.pfHistory.splice(phj--, 1); continue;
        }
        if (typeof ph.pnl !== 'number' || !isFinite(ph.pnl)) ph.pnl = null;
      }
      S.pfHistory.sort(function (a, b) { return a.t - b.t; });
      compactPfHistory();
      /* capHistory больше не используется, но поле оставляем пустым в
         SAVE_KEYS, чтобы старые клиенты не получили мусорный тип. */
      S.capHistory = [];
      /* Лестница классов сократилась с 10 до 6 ступеней. Старый сейв
         может прийти с classSeen 6..9 — такого индекса больше нет, и
         checkLevelUp() молча перестанет выдавать награды (idx никогда
         не станет больше 9). Обрезаем до последнего существующего. */
      if (typeof S.classSeen !== 'number' || !isFinite(S.classSeen)) S.classSeen = 0;
      if (S.classSeen < 0) S.classSeen = 0;
      if (S.classSeen > CLASSES.length - 1) S.classSeen = CLASSES.length - 1;
      /* Миграция ордеров: срока действия больше нет (чипсы «24 часа /
         7 дней» убраны), а armed появился позже. Старый сейв без armed
         считаем взведённым — иначе ордер, поставленный по старым
         правилам, завис бы навсегда. */
      if (!Array.isArray(S.limitOrders)) S.limitOrders = [];
      for (var li = 0; li < S.limitOrders.length; li++) {
        var lo = S.limitOrders[li];
        if (!lo || typeof lo !== 'object') { S.limitOrders.splice(li--, 1); continue; }
        if (lo.expires) delete lo.expires;
        if (typeof lo.armed !== 'boolean') lo.armed = true;
      }
      /* История ордеров появилась позже самих ордеров: старый сейв
         приходит без неё, и вкладка «История ордеров» была бы пустой
         даже у отторговавшего игрока. Молча начинаем с чистого листа —
         поднимать задним числом нечего, статусов тех ордеров уже нет. */
      if (!Array.isArray(S.orderHistory)) S.orderHistory = [];
      for (var hi = 0; hi < S.orderHistory.length; hi++) {
        var ho = S.orderHistory[hi];
        if (!ho || typeof ho !== 'object' || !ho.assetId) { S.orderHistory.splice(hi--, 1); continue; }
        if (ho.status !== 'open' && ho.status !== 'filled' && ho.status !== 'cancelled') ho.status = 'filled';
        if (ho.kind !== 'limit' && ho.kind !== 'market') ho.kind = 'limit';
      }
      /* Проценты в чипах лимита: старые сейвы — дефолт. И для buy и
         для sell массивы обязаны содержать 0 («Рынок»). */
      if (!S.limitOffsets || typeof S.limitOffsets !== 'object') S.limitOffsets = { buy: [-5, -2, -1, 0], sell: [0, 1, 2, 5] };
      if (!Array.isArray(S.limitOffsets.buy)) S.limitOffsets.buy = [-5, -2, -1, 0];
      if (!Array.isArray(S.limitOffsets.sell)) S.limitOffsets.sell = [0, 1, 2, 5];
      if (S.limitOffsets.buy.indexOf(0) < 0) S.limitOffsets.buy.push(0);
      if (S.limitOffsets.sell.indexOf(0) < 0) S.limitOffsets.sell.push(0);
      /* Lucky Spin. Поля добавились вместе с фичей, у старых сейвов
         их нет — ставим дефолты и чистим мусор. spinAdCount
         приводим к целому и не больше лимита (при снятом лимите —
         просто гасим, счётчик больше не нужен). */
      if (typeof S.spinFreeAt !== 'number' || !isFinite(S.spinFreeAt) || S.spinFreeAt < 0) S.spinFreeAt = 0;
      if (typeof S.spinAdDay !== 'string') S.spinAdDay = '';
      var adLim = (CONFIG.spin && CONFIG.spin.adDailyLimit) || 0;
      if (typeof S.spinAdCount !== 'number' || !isFinite(S.spinAdCount) || S.spinAdCount < 0) S.spinAdCount = 0;
      if (adLim > 0 && S.spinAdCount > adLim) S.spinAdCount = adLim;
      if (adLim <= 0) S.spinAdCount = 0;
      /* Скидка на комиссию из колеса. У старых сейвов полей нет —
         нули означают «скидки нет». Мусор вроде NaN гасим сразу,
         иначе tradeFeeRate() вернул бы отрицательную комиссию. */
      if (!(S.feeDiscPct > 0 && S.feeDiscPct <= 100)) S.feeDiscPct = 0;
      if (!(S.feeDiscLeft > 0)) { S.feeDiscLeft = 0; S.feeDiscPct = 0; }
      /* История сделок, реализованный PnL и стрик — вторая группа
         «главных чисел», и раньше она не валидировалась вообще.
         Последствия битого сейва были хуже, чем у balance:
         - S.trades не массив → pushTrade падал с TypeError на каждой
           сделке, торговля становилась полностью нерабочей;
         - S.realized строкой → "100" + (−12) давало "100-12" (строка),
           realizedSafe() возвращал 0 и вся реализованная прибыль
           исчезала с графиков;
         - S.streak объектом → dailyReward() возвращал NaN, и
           claimDaily() записывал NaN в S.balance, который при
           следующей загрузке зажимался в 0 — потеря всего прогресса. */
      if (!Array.isArray(S.trades)) S.trades = [];
      for (var ti = 0; ti < S.trades.length; ti++) {
        var tr = S.trades[ti];
        if (!tr || typeof tr !== 'object' || typeof tr.t !== 'number' || !isFinite(tr.t)) {
          S.trades.splice(ti--, 1);
        }
      }
      if (S.trades.length > TRADE_HISTORY_MAX) S.trades.length = TRADE_HISTORY_MAX;
      S.realized = Number(S.realized);
      if (!isFinite(S.realized)) S.realized = 0;
      S.streak = Number(S.streak);
      if (!isFinite(S.streak) || S.streak < 0) S.streak = 0;
      else S.streak = Math.floor(S.streak);
      S.best = Number(S.best);
      if (!isFinite(S.best) || S.best <= 0) S.best = CONFIG.startBalance;
      if (typeof S.createdAt !== 'number' || !isFinite(S.createdAt) || S.createdAt <= 0) S.createdAt = Date.now();
      /* Баланс и позиции — самые главные числа в сейве, но при этом
         единственные, что раньше не валидировались: битый облачный
         сейв (balance: "1000", cost: null) давал «$NaN» во всём
         интерфейсе без внятной точки отказа. Гасим мусор сразу. */
      S.balance = Number(S.balance);
      if (!isFinite(S.balance) || S.balance < 0) S.balance = 0;
      if (!S.positions || typeof S.positions !== 'object') S.positions = {};
      for (var pi in S.positions) {
        if (!Object.prototype.hasOwnProperty.call(S.positions, pi)) continue;
        var po = S.positions[pi];
        po.qty = Number(po.qty);
        po.cost = Number(po.cost);
        if (!isFinite(po.qty) || !isFinite(po.cost) || po.qty < 0 || po.cost < 0 || po.qty < 1e-10) {
          delete S.positions[pi];
        }
      }
      /* Старые облачные сейвы иногда содержат несогласованные счётчики
         (например 17 побед при 13 сделках → 131%). Чиним сразу при загрузке. */
      normalizeTradeStats();
      if (typeof Fut !== 'undefined') { try { Fut.sanitize(); } catch (e2) { dbg('loadState:fut', e2); } }
    }
  }, function (e) {
    /* Ошибка загрузки. Повторяем — короткий обрыв сети не повод терять
       прогресс. Три неудачи подряд = играем без сохранения. */
    if (attempt < 3) {
      dbg('loadState retry ' + attempt, e);
      return new Promise(function (res) {
        setTimeout(function () { res(loadState(attempt + 1)); }, 400 * attempt);
      });
    }
    saveLoadFailed = true;
    console.warn('save load failed — session runs without saving', e);
  });
}

/* ------------------------------ Навигация ------------------------------ */

/* Какой экран показан сейчас — для анимации перехода. */
var currentScreen = 'scr-loading';
var screenSwapTimer = null;
var SCREEN_IN = ['screen-in-right', 'screen-in-left', 'screen-in-up'];

function screenEl(id) {
  if (!id) return null;
  return id === 'app-main' ? $('#app-main') : $('#' + id);
}

/* Экран графика открывается шторкой поверх экрана, с которого пришли
   (как у фьючерсов): тот остаётся видимым под затемнением. */
function sheetUnder(id) {
  return id === 'scr-trade' ? tradeReturnTo : null;
}

function applyScreenHidden(id) {
  var under = sheetUnder(id);
  ['scr-loading', 'scr-nick', 'scr-trade', 'scr-assets', 'scr-news', 'scr-classes', 'scr-spin', 'scr-ach', 'scr-quests'].forEach(function (s) {
    $('#' + s).classList.toggle('hidden', s !== id && s !== under);
  });
  $('#app-main').classList.toggle('hidden', id !== 'app-main' && id !== null && under !== 'app-main');
  $('#app').classList.toggle('sheet-on', !!under);
  $('#scr-trade').classList.toggle('as-sheet', id === 'scr-trade' && !!under);
}

function playSheetIn(el) {
  el.classList.remove('cs-in');
  if (FX.reducedMotion()) return;
  void el.offsetWidth;
  el.classList.add('cs-in');
  clearTimeout(el.__csInT);
  el.__csInT = setTimeout(function () { el.classList.remove('cs-in'); }, 900);
}

/* Шторку смахивают вниз за шапку. onDismiss зовётся, когда она уже
   уехала: закрывающий код не должен играть анимацию выезда второй раз. */
function attachSheetDrag(sheet, handle, onDismiss) {
  if (!sheet || !handle || handle.__sheetDrag) return;
  handle.__sheetDrag = true;
  var st = null;
  handle.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || (e.target.closest && e.target.closest('button, input, a'))) return;
    st = { y: e.clientY, t: Date.now(), dy: 0, id: e.pointerId };
    try { handle.setPointerCapture(e.pointerId); } catch (_) { /* старые WebView */ }
    sheet.style.transition = 'none';
  });
  handle.addEventListener('pointermove', function (e) {
    if (!st || e.pointerId !== st.id) return;
    var dy = e.clientY - st.y;
    st.dy = dy > 0 ? dy : dy * 0.2;
    sheet.style.transform = 'translateY(' + Math.max(-12, st.dy).toFixed(1) + 'px)';
  });
  function end() {
    if (!st) return;
    var dy = st.dy, v = dy / Math.max(1, Date.now() - st.t);
    st = null;
    sheet.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.7, 0.3, 1)';
    if (dy > 110 || (dy > 40 && v > 0.6)) {
      sheet.classList.add('cs-dragged');
      sheet.style.transform = 'translateY(105%)';
      FX.vibrate(8);
      setTimeout(onDismiss, 220);
    } else {
      sheet.style.transform = '';
      setTimeout(function () { sheet.style.transition = ''; }, 260);
    }
  }
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

function playScreenIn(el, dir) {
  if (!el) return;
  SCREEN_IN.forEach(function (c) { el.classList.remove(c); });
  var cls = dir === 'left' ? 'screen-in-left' : dir === 'up' ? 'screen-in-up'
    : dir === 'none' ? null : 'screen-in-right';
  if (!cls) return;
  void el.offsetWidth; /* перезапуск анимации */
  el.classList.add(cls);
  /* Таймер снятия = длительность .screen-in-* (0.3–0.32s) + запас. */
  setTimeout(function () { el.classList.remove(cls); }, 400);
}

/* dir: 'right' — въезд справа (вглубь), 'left' — возврат назад, 'up' — всплытие. */
function showScreen(id, dir) {
  var prev = currentScreen;
  var outEl = screenEl(prev);
  var inEl = screenEl(id);
  currentScreen = id;
  if (screenSwapTimer) { clearTimeout(screenSwapTimer); screenSwapTimer = null; }
  /* Шторка графика выезжает снизу; экран под ней не гасим. */
  if (inEl && sheetUnder(id) && sheetUnder(id) === prev) {
    if (outEl) outEl.classList.remove('screen-out');
    inEl.classList.remove('cs-out', 'cs-dragged');
    inEl.style.transform = '';
    inEl.style.transition = '';
    applyScreenHidden(id);
    playSheetIn(inEl);
    return;
  }
  if (outEl && outEl.classList.contains('as-sheet') && sheetUnder(prev) === id) {
    var quick = outEl.classList.contains('cs-dragged') || FX.reducedMotion();
    $('#app').classList.remove('sheet-on');
    if (!quick) outEl.classList.add('cs-out');
    screenSwapTimer = setTimeout(function () {
      screenSwapTimer = null;
      outEl.classList.remove('cs-out', 'cs-dragged', 'cs-in');
      outEl.style.transform = '';
      outEl.style.transition = '';
      applyScreenHidden(id);
    }, quick ? 0 : 240);
    return;
  }
  var skip = !outEl || outEl === inEl || outEl.classList.contains('hidden') || FX.reducedMotion();
  if (skip) {
    if (outEl) outEl.classList.remove('screen-out');
    applyScreenHidden(id);
    playScreenIn(inEl, dir);
    return;
  }
  outEl.classList.add('screen-out');
  /* 100 мс — ровно под .screen-out 0.1s: без «пустого кадра» фона
     между старым и новым экраном. */
  screenSwapTimer = setTimeout(function () {
    screenSwapTimer = null;
    outEl.classList.remove('screen-out');
    applyScreenHidden(id);
    playScreenIn(inEl, dir);
  }, 100);
}

/* Порядок вкладок — чтобы страница въезжала в сторону перехода. */
var TAB_ORDER = ['lobby', 'market', 'portfolio', 'rating', 'profile'];

/* quiet=true — только подсветить вкладку и переключить видимость страниц,
   БЕЗ анимации въезда и без перерисовки. Нужно, когда переход уже
   делает showScreen(): иначе две анимации подряд выглядят как «двойной
   клик», плюс лишняя перерисовка 100 строк рынка. */
function setTab(tab, quiet) {
  var prevIdx = TAB_ORDER.indexOf(currentTab);
  var nextIdx = TAB_ORDER.indexOf(tab);
  var dir = (prevIdx < 0 || nextIdx < 0 || nextIdx === prevIdx) ? null : (nextIdx > prevIdx ? 'right' : 'left');
  currentTab = tab;
  if (tab === 'lobby') { dispCap = capital(); capTween = null; } // счётчик стартует с актуального значения
  $$('.tab-page').forEach(function (p) {
    p.classList.toggle('hidden', p.id !== 'tab-' + tab);
  });
  $$('.tabbar button').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === tab);
  });
  $('#hdr-title').textContent = t('tab_' + tab);
  if (quiet) return;
  Snd.play('tab');
  /* Страница въезжает с той стороны, куда «пошёл» пользователь.
     После свайпа ход длиннее и мягче, после тапа по меню — короче. */
  var page = $('#tab-' + tab);
  var wasSwipe = mainTabFromSwipe;
  mainTabFromSwipe = false;
  if (page && dir) {
    page.classList.remove('page-in-left', 'page-in-right', 'page-swipe-in-left', 'page-swipe-in-right');
    void page.offsetWidth;
    var inCls = wasSwipe
      ? (dir === 'right' ? 'page-swipe-in-right' : 'page-swipe-in-left')
      : (dir === 'right' ? 'page-in-right' : 'page-in-left');
    page.classList.add(inCls);
    setTimeout(function () {
      page.classList.remove('page-in-left', 'page-in-right', 'page-swipe-in-left', 'page-swipe-in-right');
    }, wasSwipe ? 500 : 340);
  }
  renderTab(tab);
  /* Вход в Market — всегда сверху: иначе общий скролл #pages
     оставляет список открытым с середины прошлого визита. */
  if (tab === 'market') scrollPagesTop();
}

function renderTab(tab) {
  if (tab === 'lobby') renderLobby();
  else if (tab === 'market') {
    if (typeof Fut !== 'undefined' && Fut.active()) Fut.render(); else renderMarket();
  }
  else if (tab === 'portfolio') {
    renderPortfolio();
    if (typeof Fut !== 'undefined') Fut.renderPortfolio();
  }
  else if (tab === 'rating') renderRating();
  /* intro — вход на вкладку: перезапускаем каскад появления и влёт
     карточек витрины. Остальные вызовы renderProfile идут без него. */
  else if (tab === 'profile') renderProfile({ intro: true });
}

/* #pages — один скролл-контейнер на все вкладки: без сброса возврат
   в Market открывает список с середины, а короткий результат поиска
   оставляет пустой вьюпорт. */
function scrollPagesTop() {
  var pages = $('#pages');
  if (pages) pages.scrollTop = 0;
}

/* Свайпы между ГЛАВНЫМИ вкладками нижнего меню:
   Меню → Маркет → Портфолио → Рейтинг → Профиль.
   Жест слушаем на #pages, поэтому экран сделки и отдельная биржевая
   панель сюда не попадают. Вертикальный жест всегда остаётся нативным
   скроллом страницы; переключение принимаем только при явном быстром
   горизонтальном свайпе. */
var mainSwipe = null;
var mainSwipeClickBlockUntil = 0;

/* Страница слегка следует за пальцем — без этого пользователь видит
   реакцию только после отпускания, и жест ощущается как обычная кнопка.
   Смещение ограничено: далеко утащить контент нельзя, а на краях списка
   добавляется «резиновое» сопротивление. */
function paintMainSwipe(dx) {
  if (!mainSwipe || mainSwipe.vertical) return;
  var page = $('#tab-' + currentTab);
  if (!page) return;
  var idx = TAB_ORDER.indexOf(currentTab);
  var atEdge = (dx > 0 && idx === 0) || (dx < 0 && idx === TAB_ORDER.length - 1);
  var shift = dx * (atEdge ? 0.16 : 0.48);
  var maxShift = Math.min(88, Math.max(54, ($('#pages').clientWidth || 360) * 0.2));
  shift = Math.max(-maxShift, Math.min(maxShift, shift));
  var fade = 1 - Math.min(0.13, Math.abs(shift) / maxShift * 0.13);
  page.classList.remove('main-swipe-snapback');
  page.classList.add('main-swipe-dragging');
  page.style.setProperty('--main-swipe-x', shift.toFixed(1) + 'px');
  page.style.setProperty('--main-swipe-opacity', fade.toFixed(3));
  mainSwipe.page = page;
}

function clearMainSwipeVisual(snapBack) {
  if (!mainSwipe || !mainSwipe.page) return;
  var page = mainSwipe.page;
  if (page.__mainSwipeResetTimer) {
    clearTimeout(page.__mainSwipeResetTimer);
    page.__mainSwipeResetTimer = 0;
  }
  page.classList.remove('main-swipe-dragging');
  if (snapBack) {
    page.classList.add('main-swipe-snapback');
    /* Сначала фиксируем текущую точку без transition, затем разрешаем
       браузеру мягко вернуть страницу в ноль. */
    void page.offsetWidth;
    page.style.setProperty('--main-swipe-x', '0px');
    page.style.setProperty('--main-swipe-opacity', '1');
    page.__mainSwipeResetTimer = setTimeout(function () {
      page.__mainSwipeResetTimer = 0;
      page.classList.remove('main-swipe-snapback');
      page.style.removeProperty('--main-swipe-x');
      page.style.removeProperty('--main-swipe-opacity');
    }, 320);
  } else {
    page.classList.remove('main-swipe-snapback');
    page.style.removeProperty('--main-swipe-x');
    page.style.removeProperty('--main-swipe-opacity');
  }
}

function initMainTabSwipes() {
  var pages = $('#pages');
  if (!pages || pages.__mainSwipeBound) return;
  pages.__mainSwipeBound = true;

  pages.addEventListener('touchstart', function (e) {
    if (!e.touches || e.touches.length !== 1) { mainSwipe = null; return; }
    var target = e.target;
    /* Поля ввода, горизонтальные сегменты и интерактивные canvas должны
       получать собственный жест. По обычным карточкам/строкам свайпать
       можно; их click после успешного свайпа гасится ниже. */
    if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"], .seg, .chips, .pf-ranges, canvas, ' +
        '.v3-seg, .mk-chips, .rt-seg, .v3p-seg, .v3pf-seg, .v3pf-chips, .v3pf-chart, .v3a-chips')) {
      mainSwipe = null;
      return;
    }
    var touch = e.touches[0];
    mainSwipe = {
      x: touch.clientX,
      y: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      t: Date.now(),
      vertical: false
    };
  }, { passive: true });

  pages.addEventListener('touchmove', function (e) {
    if (!mainSwipe || !e.touches || e.touches.length !== 1) return;
    var touch = e.touches[0];
    mainSwipe.lastX = touch.clientX;
    mainSwipe.lastY = touch.clientY;
    var dx = touch.clientX - mainSwipe.x;
    var dy = touch.clientY - mainSwipe.y;
    /* Если пользователь начал вертикально листать, уже не меняем решение
       в конце жеста даже при случайном уходе пальца вбок. */
    if (Math.abs(dy) > Math.abs(dx) + 10) {
      if (!mainSwipe.vertical) clearMainSwipeVisual(true);
      mainSwipe.vertical = true;
      return;
    }
    if (Math.abs(dx) > 4) paintMainSwipe(dx);
  }, { passive: true });

  pages.addEventListener('touchend', function (e) {
    if (!mainSwipe) return;
    var touch = e.changedTouches && e.changedTouches[0];
    var x = touch ? touch.clientX : mainSwipe.lastX;
    var y = touch ? touch.clientY : mainSwipe.lastY;
    var dx = x - mainSwipe.x;
    var dy = y - mainSwipe.y;
    var dt = Date.now() - mainSwipe.t;
    var wasVertical = mainSwipe.vertical;
    /* Быстрый короткий flick тоже принимаем: он привычен на телефоне.
       Медленному жесту по-прежнему нужны полные 54px. */
    var farEnough = Math.abs(dx) >= 54 || (dt < 260 && Math.abs(dx) >= 34);
    var horizontal = Math.abs(dx) >= Math.abs(dy) * 1.35;
    var idx = TAB_ORDER.indexOf(currentTab);
    var next = dx < 0 ? idx + 1 : idx - 1;
    var canMove = idx >= 0 && next >= 0 && next < TAB_ORDER.length;

    if (wasVertical || dt > 700 || !farEnough || !horizontal || !canMove) {
      clearMainSwipeVisual(true);
      mainSwipe = null;
      return;
    }

    clearMainSwipeVisual(false);
    mainSwipe = null;
    /* После touchend мобильный браузер может синтезировать click по
       карточке, откуда начался свайп. Блокируем только этот хвост, чтобы
       Маркет не открыл монету сразу после перехода. */
    mainSwipeClickBlockUntil = Date.now() + 450;
    mainTabFromSwipe = true;
    setTab(TAB_ORDER[next]);
    FX.vibrate(8);
  }, { passive: true });

  pages.addEventListener('touchcancel', function () {
    if (mainSwipe) clearMainSwipeVisual(true);
    mainSwipe = null;
  }, { passive: true });
  pages.addEventListener('click', function (e) {
    if (Date.now() < mainSwipeClickBlockUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}

/* ------------------------------ Модалки ------------------------------ */

/* Показ модалки: отменяем отложенное закрытие, иначе она «мигнёт» и пропадёт. */
function openModal(id) {
  var m = $('#' + id);
  if (!m) return;
  if (m.__closeTimer) { clearTimeout(m.__closeTimer); m.__closeTimer = 0; }
  if (m.classList.contains('hidden')) Snd.modal(id, true);
  m.classList.remove('modal-out', 'hidden');
  /* Доступность: переносим фокус ВНУТРЬ модалки, иначе Tab уходил на
     элементы страницы позади неё. Фокусируем сам контейнер, а не
     первую кнопку: в шите сделки это увело бы фокус с поля ввода
     суммы. Запоминаем прежний фокус, чтобы вернуть его при закрытии. */
  try {
    m.__prevFocus = document.activeElement;
    if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1');
    m.focus({ preventScroll: true });
  } catch (e) { dbg('openModal:focus', e); }
}

/* Закрытие с доигрыванием анимации выезда вниз. */
function closeModal(id) {
  var m = $('#' + id);
  if (!m || m.classList.contains('hidden')) return;
  if (!m.classList.contains('modal-out')) Snd.modal(id, false);
  /* Возврат фокуса туда, откуда модалку открыли. */
  try {
    var pf = m.__prevFocus;
    m.__prevFocus = null;
    if (pf && pf.focus && pf.isConnected) pf.focus({ preventScroll: true });
  } catch (e) { dbg('closeModal:focus', e); }
  m.classList.add('modal-out');
  if (m.__closeTimer) clearTimeout(m.__closeTimer);
  m.__closeTimer = setTimeout(function () {
    m.__closeTimer = 0;
    m.classList.add('hidden');
    m.classList.remove('modal-out');
  }, 195);
}

/* Глобальный Escape: закрывает все открытые модалки (шит сделки —
   тоже модалка modal-trade) и отпускает очередь наград достижений,
   которая стоит на паузе, пока открыта любая модалка. */
document.addEventListener('keydown', function (ev) {
  if (!ev || ev.key !== 'Escape') return;
  var closed = false;
  try {
    var ms = document.querySelectorAll('.modal');
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].id && !ms[i].classList.contains('hidden')) {
        closeModal(ms[i].id);
        closed = true;
      }
    }
  } catch (e) { dbg('closeModal', e); }
  if (closed && typeof Ach !== 'undefined' && Ach.modalClosed) {
    try { Ach.modalClosed(); } catch (e) { dbg('closeModal', e); }
  }
});

/* ------------------------------ Тосты ------------------------------ */

/* Уведомления сверху: карточка с иконкой по типу, новые сверху, не больше
   трёх разом. Одинаковое сообщение подряд не плодит копий, а получает
   счётчик ×N. Тап закрывает, смахивание вверх или вбок — тоже.
   cls: '' | 'gold' | 'ok' | 'bad' | 'toast-ach' (можно с доп. классами).
   opts: { img, sub, ms, action: { label, fn }, onClose }.
   Текст «заголовок · значение» делится на две строки: значение
   подсвечивается цветом типа. Возвращает узел тоста. */
var TOAST_MS = 2800;
var TOAST_MAX = 3;
var TOAST_GAP = 8;
var TOAST_ICO = {
  info: '<path d="M12 11v5.5"/><path d="M12 7.6h.01"/><circle cx="12" cy="12" r="9"/>',
  gold: '<path d="M12 3.2l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.1 6.9 18.9 8 13.2 3.7 9.2l5.8-.7z"/>',
  ok: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  bad: '<path d="M12 7.5v6"/><path d="M12 17h.01"/><path d="M10.3 3.9L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  ach: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5M12 14v4M8 21h8M10 18h4"/>'
};

function toastKind(cls) {
  var c = ' ' + (cls || '') + ' ';
  if (c.indexOf(' toast-ach ') >= 0) return 'ach';
  if (c.indexOf(' gold ') >= 0) return 'gold';
  if (c.indexOf(' ok ') >= 0) return 'ok';
  if (c.indexOf(' bad ') >= 0) return 'bad';
  return 'info';
}

function toastLayout() {
  var box = $('#toasts');
  if (!box) return;
  var y = 0, i = 0;
  Array.prototype.forEach.call(box.children, function (el) {
    if (el.classList.contains('out')) return;
    el.style.setProperty('--ty', y + 'px');
    el.style.setProperty('--sc', i === 0 ? '1' : String(1 - i * 0.03));
    el.style.zIndex = String(20 - i);
    el.classList.toggle('is-back', i > 0);
    y += el.offsetHeight * (i === 0 ? 1 : 0.97) + TOAST_GAP;
    i++;
  });
}

function toastDismiss(el, dir) {
  if (!el || el.classList.contains('out')) return;
  clearTimeout(el.__tT);
  if (dir) el.style.setProperty('--dx', (dir * 70) + 'px');
  el.classList.add('out');
  toastLayout();
  var cb = el.__onClose;
  el.__onClose = null;
  setTimeout(function () {
    if (el.parentNode) el.parentNode.removeChild(el);
    if (cb) { try { cb(); } catch (e) { dbg('toast:onClose', e); } }
  }, 300);
}

function toastArm(el, ms) {
  clearTimeout(el.__tT);
  el.__tLeft = ms;
  el.__tAt = Date.now();
  el.__tT = setTimeout(function () { toastDismiss(el); }, ms);
}

function toast(msg, cls, opts) {
  opts = opts || {};
  var box = $('#toasts');
  if (!box) return null;
  msg = String(msg == null ? '' : msg);
  var kind = toastKind(cls);
  var ms = opts.ms || TOAST_MS;
  var key = kind + '|' + msg;
  Snd.play('toast');

  var first = box.firstElementChild;
  if (first && !first.classList.contains('out') && first.__key === key && !opts.action) {
    first.__n = (first.__n || 1) + 1;
    var nEl = first.querySelector('.tst-n');
    if (nEl) {
      nEl.textContent = '\u00D7' + first.__n;
      nEl.classList.remove('hidden');
      FX.pulse(nEl, 'pop', 420);
    }
    var bar = first.querySelector('.tst-life');
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    first.style.setProperty('--life', ms + 'ms');
    toastArm(first, ms);
    return first;
  }

  var title = msg, sub = opts.sub || '';
  if (!sub) {
    var cut = msg.indexOf(' \u00B7 ');
    if (cut > 0) { title = msg.slice(0, cut); sub = msg.slice(cut + 3); }
  }
  var el = document.createElement('div');
  el.className = 'toast t-' + kind + (cls ? ' ' + cls : '');
  el.setAttribute('role', kind === 'bad' ? 'alert' : 'status');
  el.__key = key;
  el.__onClose = opts.onClose || null;
  el.style.setProperty('--life', ms + 'ms');
  var ico = opts.img
    ? '<span class="tst-ico tst-ico--img"><img src="' + esc(opts.img) + '" alt="" draggable="false"></span>'
    : '<span class="tst-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (TOAST_ICO[kind] || TOAST_ICO.info) + '</svg></span>';
  el.innerHTML = ico +
    '<span class="tst-txt"><b></b>' + (sub ? '<i></i>' : '') + '</span>' +
    '<span class="tst-n hidden"></span>' +
    '<i class="tst-life" aria-hidden="true"></i>';
  el.querySelector('.tst-txt b').textContent = title;
  if (sub) el.querySelector('.tst-txt i').textContent = sub;
  if (opts.action && opts.action.label) {
    var ab = document.createElement('button');
    ab.type = 'button';
    ab.className = 'toast-try';
    ab.textContent = opts.action.label;
    ab.addEventListener('click', function (ev) {
      ev.stopPropagation();
      try { if (opts.action.fn) opts.action.fn(); } catch (e) { dbg('toast:action', e); }
      toastDismiss(el);
    });
    el.insertBefore(ab, el.querySelector('.tst-n'));
  }
  box.insertBefore(el, box.firstChild);

  var live = Array.prototype.filter.call(box.children, function (x) { return !x.classList.contains('out'); });
  for (var i = TOAST_MAX; i < live.length; i++) toastDismiss(live[i]);
  toastLayout();
  requestAnimationFrame(function () { el.classList.add('in'); });
  toastArm(el, ms);
  toastDrag(el);
  return el;
}

/* Тап — закрыть. Потянул вверх или вбок дальше порога — улетает туда же,
   иначе пружинит на место. Пока палец на тосте, таймер стоит. */
function toastDrag(el) {
  var st = null;
  el.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    st = { x: e.clientX, y: e.clientY, t: Date.now(), dx: 0, dy: 0 };
    clearTimeout(el.__tT);
    el.__tLeft = Math.max(600, el.__tLeft - (Date.now() - el.__tAt));
    el.classList.add('is-drag');
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* старые WebView */ }
  });
  el.addEventListener('pointermove', function (e) {
    if (!st) return;
    st.dx = e.clientX - st.x;
    st.dy = Math.min(0, e.clientY - st.y) + Math.max(0, e.clientY - st.y) * 0.25;
    el.style.setProperty('--dx', st.dx.toFixed(1) + 'px');
    el.style.setProperty('--dy', st.dy.toFixed(1) + 'px');
  });
  function end() {
    if (!st) return;
    var s = st;
    st = null;
    el.classList.remove('is-drag');
    var far = Math.abs(s.dx) > 70 || s.dy < -28;
    var tap = Math.abs(s.dx) < 6 && Math.abs(s.dy) < 6 && Date.now() - s.t < 350;
    if (far || tap) {
      if (s.dy < -28 && Math.abs(s.dx) < 70) el.style.setProperty('--dy', '-40px');
      toastDismiss(el, far && Math.abs(s.dx) > 70 ? (s.dx > 0 ? 1 : -1) : 0);
      return;
    }
    el.style.setProperty('--dx', '0px');
    el.style.setProperty('--dy', '0px');
    toastArm(el, el.__tLeft);
  }
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

/* ------------------------------ Экран ника ------------------------------ */

/* Пары «прилагательное + существительное», которые ВЛЕЗАЮТ в поле ника.
   Общая для имени игрока (randomNick) и для имён фейкового рейтинга
   (mockLeaders): формула у обоих одна — слово + слово + две цифры, — и оба
   обязаны держаться в NICK_MAX. Иначе имя игрока не проходит проверку и
   кнопка сохранения блокируется, а имя соперника обрезается многоточием
   (RU-пара «Хладнокровный» + «Портфель» + «88» даёт 23 символа).
   Где с номером не влезает, но без номера влезает — отдаём без номера:
   так длинное прилагательное («Хладнокровный», 13) остаётся в игре. */
function nickCandidates(lang) {
  var adj = NICK.adj[lang] || NICK.adj.en;
  var noun = NICK.noun[lang] || NICK.noun.en;
  var out = [];
  for (var i = 0; i < adj.length; i++) {
    for (var j = 0; j < noun.length; j++) {
      var base = adj[i] + noun[j];
      if (base.length + 2 <= NICK_MAX) out.push({ s: base, num: true });
      else if (base.length <= NICK_MAX) out.push({ s: base, num: false });
    }
  }
  return out;
}

/* Случайное имя игрока. Подстраховка на случай, если списки слов когда-нибудь
   перепишут так, что ни одна пара не влезет: имя всё равно должно быть
   валидным. */
function randomNick() {
  var cands = nickCandidates(LANG === 'ru' ? 'ru' : 'en');
  if (!cands.length) return 'Trader' + (Math.floor(Math.random() * 90) + 10);
  var pick = cands[Math.floor(Math.random() * cands.length)];
  return pick.num ? pick.s + (Math.floor(Math.random() * 90) + 10) : pick.s;
}


/* ------------------------------ Имя трейдера ------------------------------
   Правила и живая проверка — из референса avatar.html: 3–16 символов,
   буквы (лат./кир.), цифры, пробел, подчёркивание, дефис. Подсказка под
   полем показывает правило, счётчик — сколько набрано.
   НЕ перенесены «Идеи» (чипы со случайными именами) и превью строки
   лидерборда — по прямой просьбе Димы. */
var NICK_MIN = 3;
var NICK_MAX = 16;
var NICK_RE = /^[0-9A-Za-zА-Яа-яЁё _-]+$/;

/* Текст ошибки или '' — если имя годится. Один источник правды и для
   подсказки, и для кнопки, и для confirmNick. */
function nickError(v) {
  var s = String(v || '').trim();
  if (!s) return t('error_empty');
  if (s.length < NICK_MIN) return t('error_min', { x: NICK_MIN });
  if (s.length > NICK_MAX) return t('error_max', { x: NICK_MAX });
  if (!NICK_RE.test(s)) return t('nick_err_chars');
  return '';
}

/* Живая проверка поля имени. ОДНА на два места: экран первого запуска
   (#scr-nick) и шторку смены имени (#modal-name) — правила одни, поэтому
   элементы ищутся внутри переданного контейнера по классам, а не по id.
   silent=true — не подсвечивать ошибку: при открытии встречать игрока
   красной рамкой на пустом поле незачем. */
function nickValidate(scope, silent) {
  var box = typeof scope === 'string' ? $(scope) : scope;
  if (!box) return true;
  var inp = box.querySelector('input');
  if (!inp) return true;
  var raw = inp.value;
  var err = nickError(raw);
  var hint = box.querySelector('.nick-hint');
  if (hint) hint.textContent = err || t('nick_hint');
  var cnt = box.querySelector('.nick-count');
  if (cnt) {
    cnt.textContent = raw.length + ' / ' + NICK_MAX;
    /* Ближе к пределу — золотой: предупреждение ДО того, как упрётся. */
    cnt.classList.toggle('warn', raw.length > NICK_MAX - 3);
  }
  var row = box.querySelector('.nick-row');
  if (row) row.classList.toggle('err', !!err && !silent);
  /* Неизменённое имя сохранить можно всегда — иначе игрок с ником в две
     буквы не смог бы уйти, не переименовавшись. Но только если имя УЖЕ
     есть: на первом запуске S.name пуст, и «не изменено» ошибочно
     разрешало бы сохранить ПУСТОЕ поле. */
  var cur = String(S.name || '').trim();
  var unchanged = !!cur && raw.trim() === cur;
  var ok = !err || unchanged;
  var btn = box.querySelector('[data-nick-save]');
  if (btn) btn.disabled = !ok;
  return ok;
}

/* Тряска — только на попытке сохранить. В референсе она склеена с .err, и
   строка дёргалась на каждый набранный символ. */
function nickShake(scope) {
  var box = typeof scope === 'string' ? $(scope) : scope;
  var row = box ? box.querySelector('.nick-row') : null;
  if (!row) return;
  row.classList.remove('shake');
  void row.offsetWidth;
  row.classList.add('shake');
  setTimeout(function () { row.classList.remove('shake'); }, 420);
}

/* Общий финал обоих входов: пишем имя и сообщаем, изменилось ли оно. */
/* quiet — без тоста: на первом старте имя не «меняли», а впервые задали,
   и тост «Имя сохранено» висел поверх шапки свежего лобби. */
function applyNick(v, quiet) {
  var changed = S.name !== v;
  S.name = v;
  saveState(true);
  if (changed && !quiet) toast(t('name_saved'));
  return changed;
}

/* Вспышка имени в профиле: видно, что сохранилось именно оно, а не что-то
   ещё перерисовалось. */
function flashProfileName() {
  var nm = $('#pr-name');
  if (!nm) return;
  nm.classList.remove('is-new');
  void nm.offsetWidth;
  nm.classList.add('is-new');
  setTimeout(function () { nm.classList.remove('is-new'); }, 760);
}

/* scr-nick — теперь ТОЛЬКО первый запуск: ника ещё нет, уходить некуда.
   Смену имени из профиля обслуживает шторка #modal-name. */
function renderNick() {
  $('#nick-input').value = '';
  $('#btn-nick-start').textContent = t('nick_start');
  nickValidate('#scr-nick', true);
  showScreen('scr-nick');
}

function confirmNick() {
  var box = $('#scr-nick');
  if (!nickValidate(box, false)) { nickShake(box); FX.vibrate(24); return; }
  applyNick($('#nick-input').value.trim().slice(0, NICK_MAX), true);
  enterMain();
}

/* ---------- Шторка смены имени (референс avatar.html) ---------- */
function openNameModal() {
  var inp = $('#nm-input');
  if (!inp) return;
  inp.value = S.name || '';
  nickValidate('#modal-name', true);
  openModal('modal-name');
}

function closeNameModal() {
  closeModal('modal-name');
}

function saveName() {
  var box = $('#modal-name');
  if (!nickValidate(box, false)) { nickShake(box); FX.vibrate(24); return; }
  var changed = applyNick($('#nm-input').value.trim().slice(0, NICK_MAX));
  closeModal('modal-name');
  if (!changed) return;
  /* Профиль перерисовываем целиком: имя меняет ещё и букву фолбэка
     аватарки (data-fb), а не только текст. Без opts.intro — иначе заново
     играл бы каскад витрины. */
  renderProfile();
  flashProfileName();
}

/* ------------------------------ Лобби ------------------------------ */

function dailyReward() {
  /* Серия прервалась (последний бонус раньше вчера) — платим как первый
     день: claimDaily всё равно сбросит S.streak в 1, а карточка обещала
     бы сумму от старой серии. */
  var ts = YaGame.serverTime(), alive = S.dailyDay === dayKey(ts) || S.dailyDay === dayKey(ts - 86400000);
  var streakBonus = Math.min((alive ? S.streak : 0) - 1, 10) * CONFIG.dailyStreakStep;
  return Math.min(CONFIG.dailyBase + Math.max(0, streakBonus), CONFIG.dailyMax);
}

function dayKey(ts) {
  var d = new Date(ts);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}

function msUntilTomorrow(ts) {
  var d = new Date(ts);
  var next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return next - ts;
}

function fmtDuration(ms) {
  var h = Math.floor(ms / 3600000);
  var m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return h + t('dur_h') + ' ' + m + t('dur_m');
  return m + t('dur_m') + ' ' + Math.floor((ms % 60000) / 1000) + t('dur_s');
}

function renderLobby() {
  /* v3: капитал-одометр пишет rafLoop; полосу «свободно / в позициях /
     фьючерсы», изменение за сутки, мини-график, цель, рекламу, колесо и
     бегущую строку рисует js/v3-lobby.js. */
  if (typeof V3L !== 'undefined') V3L.render();

  renderDailyCard();

  renderLobbyCooldowns();

  renderGrantCard();
}

/* Карточка ежедневного бонуса. Вынесена из renderLobby: состояние
   «таймер → забрать» должно переключаться само, пока игрок сидит в
   лобби через полночь (раньше кнопка появлялась только после
   переключения вкладки). */
function renderDailyCard() {
  /* v3: серия, неделя с «печатью» за сегодня, сумма и кнопка/таймер
     (#daily-btn / #daily-timer) — js/v3-lobby.js. */
  if (typeof V3L !== 'undefined') V3L.renderDaily();
}

/* Карточка гранта новичка. Тоже самостоятельная: тик обновляет
   обратный отсчёт и возвращает кнопку, когда кулдаун истёк. */
function renderGrantCard() {
  var grantLeft = CONFIG.grantCooldown - Math.floor((YaGame.serverTime() - S.lastGrantAt) / 1000);
  var showGrant = capital() < 100 && Object.keys(S.positions).length === 0;
  $('#card-grant').classList.toggle('hidden', !showGrant);
  if (showGrant) {
    var gbtn = $('#grant-btn');
    gbtn.disabled = grantLeft > 0;
    gbtn.textContent = grantLeft > 0
      ? t('ad_in', { t: Math.floor(grantLeft / 60) + ':' + String(grantLeft % 60).padStart(2, '0') })
      : t('grant_btn', { x: money(CONFIG.grant, 0) });
  }
}

function claimDaily() {
  var today = dayKey(YaGame.serverTime());
  if (S.dailyDay === today) return;
  var srcBtn = $('#daily-btn');
  /* Награду считаем ДО инкремента стрика — ровно ту сумму, что
     обещана на кнопке. Раньше стрик рос до расчёта, и выплата была
     на один шаг ($100) больше обещанного. */
  var reward = dailyReward();
  var yesterday = dayKey(YaGame.serverTime() - 86400000);
  S.streak = (S.dailyDay === yesterday) ? S.streak + 1 : 1;
  S.dailyDay = today;
  S.balance += reward;
  /* Журнал истории баланса: раньше бонусы нигде не записывались. */
  if (typeof V3L !== 'undefined') V3L.log('daily', reward, { streak: S.streak });
  /* Бонус — ступенька на кривой «за всё время». Без форса снимка она
     приезжала только через минуту, следующим плановым — как это уже
     сделано в claimAdBonus и claimGrant. */
  pushPfSnapshot(true);
  saveState(true);
  toast(t('toast_daily', { x: money(reward, 0) }), 'gold');
  Snd.play('bonus');
  /* С v3-лобби звук серии играет по «печати» плитки (V3L.renderDaily). */
  if (S.streak > 1 && typeof V3L === 'undefined') setTimeout(function () { Snd.play('streak'); }, 2000);
  /* Подарок подпрыгивает, монеты летят из кнопки в капитал, за сегодня
     ставится «печать» — бонус должен «чувствоваться». */
  if (typeof V3L !== 'undefined') V3L.claimFx('daily', reward, srcBtn);
  else FX.reward(srcBtn);
  renderLobby();
}

function claimAdBonus() {
  if (YaGame.serverTime() - S.lastAdAt < CONFIG.adCooldown * 1000) return;
  YaGame.showRewarded().then(function (ok) {
    if (ok) {
      /* Кулдаун включается ТОЛЬКО после реально просмотренной рекламы:
         раньше lastAdAt ставился до ролика, и обрыв рекламы наказывал
         игрока трёхминутным ожиданием без награды. По серверным часам —
         как daily/spin, перевод часов не должен обманывать таймер. */
      S.lastAdAt = YaGame.serverTime();
      S.balance += CONFIG.adReward;
      if (typeof V3L !== 'undefined') V3L.log('ad', CONFIG.adReward);
      /* Награда — изменение капитала без сделки. Если не снять точку
         сразу, ALL-график покажет её только через минуту. */
      pushPfSnapshot(true);
      saveState(true);
      toast(t('toast_ad', { x: money(CONFIG.adReward, 0) }), 'gold');
      Snd.play('bonus');
      if (typeof V3L !== 'undefined') V3L.claimFx('ad', CONFIG.adReward, $('#lb-adv'));
      else FX.reward($('#ad-btn'));
    }
    renderLobby();
    if (ok && typeof V3L !== 'undefined') V3L.renderAd('claim');
  }).catch(function () {
    /* SDK упал — просто перерисовать карточку, кулдаун не включён. */
    renderLobby();
  });
}

function claimGrant() {
  /* Явная проверка кулдауна (раньше защита была только в disabled —
     один сбой порядка рендеров, и грант ушёл бы повторно). По
     серверному времени, как daily/ad: перевод часов не обманет. */
  if (YaGame.serverTime() - S.lastGrantAt < CONFIG.grantCooldown * 1000) return;
  S.lastGrantAt = YaGame.serverTime();
  S.balance += CONFIG.grant;
  if (typeof V3L !== 'undefined') V3L.log('grant', CONFIG.grant);
  pushPfSnapshot(true);
  saveState(true);
  toast(t('toast_grant', { x: money(CONFIG.grant, 0) }));
  if (typeof V3L !== 'undefined') V3L.claimFx('grant', CONFIG.grant, $('#grant-btn'));
  else FX.reward($('#grant-btn'));
  renderLobby();
}

/* ------------------------------ Lucky Spin ------------------------------

   Колесо удачи — ОТДЕЛЬНЫЙ ЭКРАН (#scr-spin), а не модалка. Две
   причины. Первая: модалка на узком телефоне отдавала под свою
   «шапку» и backdrop пол-экрана, и колесо выходило размером с кулак.
   Вторая и главная: модaлка читается как прерывание — «вам показали,
   закройте». Колесо же мини-игра со своей ставкой, и место ей в
   навигации, а не в стеке попапов.

   Колесо нарисовано SVG, а не canvas. Что это дало:
     - Текст рендерит браузер. Никаких font-строк, склеенных из
       getComputedStyle, никакого strokeText-контура «для
       читаемости», никаких перевёрнутых подписей в нижней половине —
       поворот текста задаётся один раз, при сборке сектора.
     - Крутится ровно один узел <g id="spin-disc"> обычным
       CSS-transform. Раньше на каждом кадре перерисовывался весь
       canvas: шесть заливок, шесть обводок, иконки, тени под текстом
       — 60 полных рендеров в секунду ради одной строчки угла.
     - SVG масштабируется сам. Один viewBox на все экраны, и не надо
       следить за devicePixelRatio.

   Стрелка и центральная кнопка — обычный DOM поверх SVG: стрелку
   нужно подпрыгивать на каждом щелчке сектора, а это CSS-анимация.

   Режимы: free — раз в CONFIG.spin.freeCooldownMs (6 часов),
   vip — за просмотр rewarded-видео, до adDailyLimit в сутки.
   Попытка тратится в момент остановки колеса, приз начисляется там
   же: закрытие экрана ничего не сжигает и ничего не отменяет. */

var spinMode = 'free';     // какой режим выбран: free | vip
var spinAngle = 0;         // текущий поворот диска, градусы (по часовой)
var spinRaf = 0;           // id активной rAF-анимации
var spinTweenRaf = 0;      // id rAF докатки диска (вход/смена режима)
var spinLaunchTimer = 0;   // id таймера замаха перед круткой
var spinBusy = false;      // колесо крутится — входы заблокированы
var spinCoinImgs = {};     // предзагруженные логотипы монет
var spinReturnTo = 'app-main';

function spinCfg() { return CONFIG.spin || {}; }
/* Секторы + палитра для текущего режима (free | vip). На референсе Димы
   обычный спин — тёмная палитра + набор $10 BTC/$25/$50/Пусто/$2 BTC/$4 ETH;
   золотой — фирменные тёплые тона. */
function spinSectors() {
  var c = spinCfg();
  if (spinMode === 'free') return c.freeSectors || c.sectors || [];
  return c.vipSectors || c.sectors || [];
}
/* Палитра для текущего режима. Подсекторы и шапки иконок красятся
   по индексу. Если в data палитра не задана — дефолт по типу сектора. */
function spinColorByIdx(idx) {
  var c = spinCfg();
  var palette = spinMode === 'free' ? c.freeColors : c.vipColors;
  return (palette && palette[idx]) || '#2a2e3a';
}
/* Шапка под монету и обводка: в vip золотые тёплые, в free нейтральные
   тёмные/серебристые. Цвета подобраны так, чтобы на любом секторе
   (тёмно-синий, бирюзовый, фиолетовый) монета читалась. */
function spinChipHalo() {
  if (spinMode === 'vip') {
    /* Приглушённые: прежние 0.22/0.78 на светлом золоте сектора
       собирали лишние яркие пятна — иконка спорила с призом. */
    return { halo: 'rgba(255, 232, 168, 0.13)', ring: 'rgba(255, 220, 100, 0.5)' };
  }
  return { halo: 'rgba(255, 255, 255, 0.08)', ring: 'rgba(200, 210, 230, 0.55)' };
}

/* Сколько осталось ждать бесплатный спин, мс. 0 — можно крутить.
   Считаем по серверному времени: Date.now() на клиенте накручивается
   переводом часов, и кулдаун перестаёт быть кулдауном. */
function spinFreeLeftMs() {
  return Math.max(0, S.spinFreeAt - YaGame.serverTime());
}

/* Сколько рекламных спинов осталось сегодня. Новый день сбрасывает
   счётчик сам: при несовпадении дня просто отдаём полный лимит, а
   записываем день только в момент траты — так просроченный spinAdDay
   никого не блокирует. adDailyLimit = 0 означает «лимита нет» —
   возвращаем Infinity: спин доступен всегда, ограничен только
   рекламой. */
function spinAdLeft() {
  var lim = spinCfg().adDailyLimit || 0;
  if (!(lim > 0)) return Infinity;
  if (S.spinAdDay !== dayKey(YaGame.serverTime())) return lim;
  return Math.max(0, lim - S.spinAdCount);
}

function spinAvail(mode) {
  return mode === 'vip' ? spinAdLeft() > 0 : spinFreeLeftMs() <= 0;
}

/* ------------------------------ Геометрия ------------------------------

   Система «часовых» углов: 0° — 12 часов, рост по часовой стрелке.
   Она же совпадает с направлением вращения диска, поэтому угол
   поворота и угол сектора складываются напрямую.

   Сектор i занимает [i*step, (i+1)*step]. Чтобы он встал под
   стрелку (которая на 0°), диск надо повернуть на
   -(i*step + step/2). Обратная задача — какой сектор под стрелкой:
   idx = floor((-spinAngle mod 360) / step). */

var SPIN_C = 100;        // центр колеса в единицах viewBox
var SPIN_R = 96;         // внешний радиус секторов
var SPIN_HUB_R = 36;     // резерв под центральную кнопку
var SPIN_ICON_R = 44;    // радиус, на котором стоит иконка монеты
var SPIN_TXT_R = 68;     // середина радиального коридора подписи
var SPIN_TXT_OUT = 88;   // внешняя граница подписи (запас до обода)

/* Точка на окружности радиуса r под «часовым» углом deg. */
function spinPt(r, deg) {
  var a = deg * Math.PI / 180;
  return { x: SPIN_C + r * Math.sin(a), y: SPIN_C - r * Math.cos(a) };
}
/* Число в путь SVG: два знака хватает, и путь не распухает. */
function spn(v) { return Math.round(v * 100) / 100; }

/* Цвет подписи по яркости сектора. Золото светлое — на нём белый
   текст почти не читается, поэтому для светлых секторов берём тёмный.
   Считаем воспринимаемую яркость, а не среднее по каналам: по
   среднему голубой и жёлтый одной яркости дают разные числа. */
function spinTextOn(hex) {
  var m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex || ''));
  if (!m) return '#ffffff';
  var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  var L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.58 ? 'rgba(30,20,2,0.94)' : '#ffffff';
}

var SPIN_NS = 'http://www.w3.org/2000/svg';
function spinSvg(tag, attrs) {
  var e = document.createElementNS(SPIN_NS, tag);
  for (var k in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
  }
  return e;
}

/* Сборка колеса. Вызывается при открытии экрана и после догрузки
   логотипов; во время вращения — никогда: пересборка на ходу
   обнулила бы анимацию. */
function spinBuildWheel() {
  var host = $('#spin-sectors');
  if (!host || spinBusy) return;
  var secs = spinSectors();
  var n = secs.length;
  if (n < 2) return;

  while (host.firstChild) host.removeChild(host.firstChild);
  var defs = $('#spin-icon-defs');
  if (defs) while (defs.firstChild) defs.removeChild(defs.firstChild);

  var step = 360 / n;
  var i;

  /* Секторы. Дуга рисуется по часовой стрелке (sweep-flag=1), из
     центра в точку начала, по дуге и обратно в центр. Обводка —
     полупрозрачный шов: без него два соседних золотых сектора
     сливаются в один блин. */
  for (i = 0; i < n; i++) {
    var p0 = spinPt(SPIN_R, i * step);
    var p1 = spinPt(SPIN_R, (i + 1) * step);
    host.appendChild(spinSvg('path', {
      d: 'M' + SPIN_C + ' ' + SPIN_C +
         'L' + spn(p0.x) + ' ' + spn(p0.y) +
         'A' + SPIN_R + ' ' + SPIN_R + ' 0 0 1 ' + spn(p1.x) + ' ' + spn(p1.y) + 'Z',
      fill: spinColorByIdx(i),
      stroke: 'rgba(0,0,0,0.28)',
      'stroke-width': 0.9
    }));
  }

  /* Подписи и иконки вторым проходом — чтобы швы секторов не
     перекрывали текст. */
  for (i = 0; i < n; i++) {
    var s = secs[i];
    var mid = i * step + step / 2;
    /* Правая половина читается от центра к краю, левая — от края к
       центру. Правило одно: «верх» глифов никогда не смотрит вниз,
       иначе подпись переворачивается. */
    var hasCryptoIcon = s.type === 'crypto' && !!s.id;
    var hasUsdIcon = s.type === 'usd';
    var hasPctIcon = s.type === 'commission';
    var hasIcon = hasCryptoIcon || hasUsdIcon || hasPctIcon;
    var rIn = hasIcon ? SPIN_ICON_R + 11 : SPIN_HUB_R + 7;
    /* Шапка+кольцо под иконкой и цвет знака «$». free — нейтрально
       серебристые, чтобы на тёмном секторе не было яркого пятна. */
    var halo = spinChipHalo();
    var usdFill = spinMode === 'vip' ? 'rgba(255, 240, 180, 0.96)' : 'rgba(220, 226, 240, 0.96)';
    /* Иконка сектора — отдельная группа: при выпадении приза монета
       «отрывается» от неё (js/v3-wheel.js прячет группу на время показа). */
    var ig = spinSvg('g', { 'class': 'spin-sic', id: 'spin-sic-' + i });
    host.appendChild(ig);

    if (hasCryptoIcon) {
      var ip = spinPt(SPIN_ICON_R, mid);
      var ir = 8.4;
      /* Золотая шапка под монету — по референсу Димы. Тёмная подложка
         на золотом секторе читалась как грязное пятно; светлое золотое
         сияние с тонкой золотой обводкой делает монету «вставленной» в
         сектор. */
      ig.appendChild(spinSvg('circle', {
        cx: spn(ip.x), cy: spn(ip.y), r: ir + 1.6,
        fill: halo.halo
      }));
      var img = spinCoinImgs[s.id];
      if (img && img.complete && img.naturalWidth) {
        var cid = 'spin-ic-' + i;
        if (defs) {
          var cp = spinSvg('clipPath', { id: cid });
          cp.appendChild(spinSvg('circle', { cx: spn(ip.x), cy: spn(ip.y), r: ir }));
          defs.appendChild(cp);
        }
        var im = spinSvg('image', {
          x: spn(ip.x - ir), y: spn(ip.y - ir),
          width: ir * 2, height: ir * 2,
          'clip-path': 'url(#' + cid + ')',
          preserveAspectRatio: 'xMidYMid meet'
        });
        im.setAttribute('href', img.src);
        im.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', img.src);
        ig.appendChild(im);
      }
      ig.appendChild(spinSvg('circle', {
        cx: spn(ip.x), cy: spn(ip.y), r: ir + 0.5,
        fill: 'none',
        stroke: halo.ring,
        'stroke-width': 1.0
      }));
    } else if (hasUsdIcon || hasPctIcon) {
      /* Круглая иконка в шапке сектора: у долларовых — знак «$», у
         комиссионных — «%» (как тег скидки на референсе). Крипто-
         секторы показывают реальный логотип монеты. */
      var uip = spinPt(SPIN_ICON_R, mid);
      var uir = 8.4;
      ig.appendChild(spinSvg('circle', {
        cx: spn(uip.x), cy: spn(uip.y), r: uir + 1.6,
        fill: halo.halo
      }));
      ig.appendChild(spinSvg('circle', {
        cx: spn(uip.x), cy: spn(uip.y), r: uir + 0.5,
        fill: 'none',
        stroke: halo.ring,
        'stroke-width': 1.0
      }));
      var dt = spinSvg('text', {
        x: spn(uip.x),
        y: spn(uip.y),
        dy: '0.36em',
        'text-anchor': 'middle',
        'font-size': spn(uir * (hasPctIcon ? 1.35 : 1.55)),
        'font-weight': '800',
        fill: usdFill
      });
      dt.textContent = hasUsdIcon ? '$' : '%';
      ig.appendChild(dt);
    }

    var label = (s.label && (s.label[LANG] || s.label.en)) || '';
    if (!label) continue;

    /* Подпись остаётся горизонтальной. У радиальных надписей на нижней
       половине неизбежно появляется перевёрнутый текст, а на телефоне
       это выглядит не как колесо, а как ребус. Ставим название ближе к
       ободу, а монету оставляем на внутреннем кольце: всё читается с
       первого взгляда и элементы не толкаются. */
    var labelR = hasIcon ? 76 : 63;
    var ap = spinPt(labelR, mid);
    var fs = n > 8 ? 7.4 : (n > 6 ? 8.2 : 8.7);
    if (label.length > 6) fs -= 0.7;
    /* На крайних секторах длинная подпись упирается в обод. Сдвигаем
       её на пару SVG-единиц к центру, не меняя остальную геометрию. */
    if (label.length > 6 && (mid < step || mid > 360 - step)) {
      ap = spinPt(labelR - 8, mid);
      fs -= 0.35;
    }

    /* Crypto-секторы с пробелом в подписи (типа «$50 BTC») и секторы
       комиссии («−25% Комиссия») рисуем в две строки по референсу:
       сумма крупно наверху, уточнение мельче под ней. Один размер
       шрифта на строку + общий вертикальный центр через эмшифт. */
    var parts = label.split(/\s+/);
    if (parts.length >= 2 && (hasIcon || hasPctIcon)) {
      var lineGap = fs * 0.92;
      var totalH = lineGap * (parts.length - 1);
      var startY = ap.y - totalH / 2;
      for (var pi = 0; pi < parts.length; pi++) {
        var lineFs = pi === 0 ? fs : Math.max(5.2, fs * 0.74);
        var ltx = spinSvg('text', {
          x: spn(ap.x),
          y: spn(startY + pi * lineGap),
          dy: '0.34em',
          'text-anchor': 'middle',
          'font-size': spn(lineFs),
          'font-weight': pi === 0 ? '800' : '700',
          fill: spinTextOn(spinColorByIdx(i)),
          'letter-spacing': pi === 0 ? '0.02em' : '0.08em'
        });
        ltx.textContent = parts[pi];
        host.appendChild(ltx);
      }
    } else {
      var tx = spinSvg('text', {
        x: spn(ap.x),
        y: spn(ap.y),
        dy: '0.34em',
        'text-anchor': 'middle',
        'font-size': spn(fs),
        'font-weight': '800',
        fill: spinTextOn(spinColorByIdx(i))
      });
      tx.textContent = label;
      host.appendChild(tx);
    }
  }

  spinBuildTicks();
  spinSetAngle(spinAngle);
}

/* Точки по ободу. На референсе Димы по стыкам секторов стоят яркие
   золотые шарики — без них колесо читается как «билетик», а не как
   ювелирное изделие. В золотом режиме это полноценные «лампочки» со
   светящимся ореолом (мерцание — в CSS, чтобы не дёргать SVG из JS),
   в обычном — спокойные серебристые точки. Стоят статично, вне
   диска, и не крутятся вместе с секторами. */
function spinBuildTicks() {
  var g = $('#spin-ticks');
  if (!g) return;
  while (g.firstChild) g.removeChild(g.firstChild);
  var n = spinSectors().length;
  var vip = spinMode === 'vip';
  for (var i = 0; i < n; i++) {
    var p = spinPt(91.5, i * (360 / n));
    if (vip) {
      /* Ореол под лампой: без него точка теряется на ободе, но ярче
         0.15 не делаем — «вырвиглазный» гирляндный эффект не нужен. */
      g.appendChild(spinSvg('circle', {
        cx: spn(p.x), cy: spn(p.y), r: 4.1,
        fill: 'rgba(255, 214, 100, 0.15)'
      }));
    }
    g.appendChild(spinSvg('circle', {
      cx: spn(p.x), cy: spn(p.y), r: vip ? 2.3 : 2.1,
      fill: vip ? 'rgba(255, 236, 170, 0.85)' : 'rgba(205, 214, 231, 0.92)',
      stroke: vip ? 'rgba(140, 90, 10, 0.55)' : 'rgba(60, 70, 88, 0.85)',
      'stroke-width': 0.4
    }));
  }
}

/* Единственная точка, где меняется угол. Всё вращение — это одна
   запись в style.transform; SVG-узел при этом композитится
   видеокартой, а не перерисовывается. */
/* 24 лампочки на ободе; строятся один раз, дальше живут на CSS. */
function spinBuildBulbs() {
  var box = $('#spin-bulbs');
  if (!box || box.children.length) return;
  var html = '';
  for (var i = 0; i < 24; i++) html += '<i style="--i:' + i + '"></i>';
  box.innerHTML = html;
}

/* Подсветка выигравшего сектора: он стоит под стрелкой, то есть
   занимает [-step/2, step/2] в «часовых» градусах. Затемнение — круг
   диска минус клин (evenodd). */
function spinShowWin(n, miss) {
  var g = $('#spin-win');
  if (!g || !n) return;
  spinClearWin();
  var step = 360 / n;
  var p0 = spinPt(SPIN_R, -step / 2), p1 = spinPt(SPIN_R, step / 2);
  var wedge = 'M' + SPIN_C + ' ' + SPIN_C + ' L' + spn(p0.x) + ' ' + spn(p0.y) +
    ' A' + SPIN_R + ' ' + SPIN_R + ' 0 0 1 ' + spn(p1.x) + ' ' + spn(p1.y) + ' Z';
  var disc = 'M' + (SPIN_C - SPIN_R) + ' ' + SPIN_C + ' A' + SPIN_R + ' ' + SPIN_R + ' 0 1 0 ' + (SPIN_C + SPIN_R) + ' ' + SPIN_C +
    ' A' + SPIN_R + ' ' + SPIN_R + ' 0 1 0 ' + (SPIN_C - SPIN_R) + ' ' + SPIN_C + ' Z';
  g.classList.toggle('is-miss', !!miss);
  g.appendChild(spinSvg('path', { d: disc + ' ' + wedge, 'class': 'spin-win-dim' }));
  g.appendChild(spinSvg('path', { d: wedge, 'class': 'spin-win-glow' }));
}
function spinClearWin() {
  var g = $('#spin-win');
  if (g) while (g.firstChild) g.removeChild(g.firstChild);
}

/* Координаты viewBox колеса (0..200) → точка на экране. */
function spinScreenPt(x, y) {
  var svg = $('#spin-svg');
  var r = svg ? svg.getBoundingClientRect() : null;
  if (!r || !r.width) return FX.center($('#spin-stage'));
  return { x: r.left + x / 200 * r.width, y: r.top + y / 200 * r.height };
}

/* Момент остановки: стрелка «ловит» сектор, телефон отдаёт толчок.
   Монеты, вспышка и лучи — позже, когда приз долетит до центра
   (js/v3-wheel.js). У «Мимо» — только короткий толчок. */
function spinLandFx(res, isJack) {
  var ptr = $('.spin-pointer');
  if (ptr) { ptr.classList.remove('tick', 'catch'); void ptr.offsetWidth; ptr.classList.add('catch'); }
  if (!res) { FX.vibrate([8, 40, 12]); return; }
  FX.vibrate(isJack ? [16, 46, 16] : [10, 32]);
}

function spinSetAngle(deg) {
  spinAngle = deg;
  var disc = $('#spin-disc');
  if (disc) disc.style.transform = 'rotate(' + spn(deg) + 'deg)';
}

/* Плавная докатка диска без крутки: вход на экран и смена режима.
   Колесо, которое телепортом встаёт на новый сектор, выглядит как
   перерисовка, а не как механика. Отдельный rAF-твил, а не CSS
   transition: transition на #spin-disc lag бы за покадровым
   transform во время настоящей крутки. Направление — против часовой
   («отмотка»), чтобы не путаться с ходом крутки. */
function spinTweenStop() {
  if (spinTweenRaf) { cancelAnimationFrame(spinTweenRaf); spinTweenRaf = 0; }
}
function spinTweenTo(targetDeg, ms, done) {
  spinTweenStop();
  if (FX.reducedMotion()) { spinSetAngle(targetDeg); if (done) done(); return; }
  var t0 = 0;
  var from = spinAngle;
  function step(ts) {
    if (!t0) t0 = ts;
    var p = Math.min(1, (ts - t0) / ms);
    /* ease-out cubic: быстрый отъезд, мягкая посадка без дрожи. */
    var e = 1 - Math.pow(1 - p, 3);
    spinSetAngle(from + (targetDeg - from) * e);
    if (p < 1) { spinTweenRaf = requestAnimationFrame(step); return; }
    spinTweenRaf = 0;
    spinSetAngle(targetDeg);
    if (done) done();
  }
  spinTweenRaf = requestAnimationFrame(step);
}
/* Угол «сектор №0 по центру под стрелкой» для текущего набора. */
function spinRestAngle() {
  var n = spinSectors().length;
  return n ? -180 / n : 0;
}
/* Докатка к положению покоя с гарантией заметного хода: соседние
   режимы дают одинаковый угол покоя (по 6 секторов), и без форса
   колесо при переключении стояло бы на месте. Считаем ХОД по модулю
   360 и форсируем его в коридоре (-500..-140] — против часовой.
   Иначе после десятков открытий spinAngle уходит в минус на тысячи
   градусов, и «доводка» полными оборотами перестаёт сходиться. */
function spinTweenToRest(ms) {
  var cur = ((spinAngle % 360) + 360) % 360;
  var target = ((spinRestAngle() % 360) + 360) % 360;
  var delta = target - cur;
  while (delta > -140) delta -= 360;
  spinTweenTo(spinAngle + delta, ms || 700);
}

/* Логотипы монет. Грузим оба набора секторов ДО показа экрана и
   складываем в кеш. Раньше preload брал только spinSectors(), то есть
   при открытии в free грузились BTC+ETH, а при первом тапе по Golden
   появлялись пустые кружки: vip-сектор мог содержать монету, которой
   не было в free-наборе. Теперь обе таблицы прогреваются сразу.

   Важно: callback обязан вызываться и для уже закешированных картинок.
   Без этого запуск из второй попытки мог ждать callback вечно, хотя
   всё уже загрузилось. */
function spinPreloadCoins(done) {
  var cfg = spinCfg();
  var all = [];
  var groups = [cfg.freeSectors || cfg.sectors || [], cfg.vipSectors || cfg.sectors || []];
  var seen = {};
  for (var gi = 0; gi < groups.length; gi++) {
    for (var si = 0; si < groups[gi].length; si++) {
      var sec = groups[gi][si];
      if (sec.type === 'crypto' && sec.id && !seen[sec.id]) {
        seen[sec.id] = true;
        all.push(sec.id);
      }
    }
  }

  var pending = 0;
  var settled = false;
  function finish() {
    if (settled || pending > 0) return;
    settled = true;
    /* Не пересобираем во время крутки: в этот момент диску запрещено
       менять дочерние узлы. */
    if (!spinBusy) spinBuildWheel();
    if (done) done();
  }

  for (var i = 0; i < all.length; i++) {
    var id = all[i];
    var cached = spinCoinImgs[id];
    if (cached) {
      /* complete=true + naturalWidth=0 — ранее оборванная загрузка.
         Второй раз не долбим сетью: в UI останется аккуратный чип
         без логотипа, а не бесконечная очередь onerror. */
      continue;
    }
    var a = assetById(id);
    if (!a) continue;
    pending++;
    (function (coinId, asset) {
      var img = new Image();
      var once = function () {
        img.onload = img.onerror = null;
        pending--;
        finish();
      };
      img.onload = once;
      img.onerror = once;
      img.src = asset.img || ('img/coins/' + asset.id + '.png');
      spinCoinImgs[coinId] = img;
    })(id, a);
  }
  finish();
}

/* Взвешенный выбор сектора: берём per-sector weight из конфига —
   один источник правды для обоих режимов (массив-дубль vipWeights
   удалён: расхождение двух копий весов незаметно меняло шансы).
   Если у сектора вес не указан или сумма нулевая — падаем на
   равновероятный выбор, а не на ошибку: колесо обязано крутиться
   при любом состоянии конфига.

   ВАЖНО: функция получает mode, а не молча читает глобальный spinMode.
   Это не академическая придирка: во время rewarded-рекламы пользователь
   не может переключить режим (кнопки disabled), но код обязан считать
   приз именно для режима, который запустил рекламу. */
function spinDrawIndex(mode) {
  var cfg = spinCfg();
  var secs = mode === 'vip'
    ? (cfg.vipSectors || cfg.sectors || [])
    : (cfg.freeSectors || cfg.sectors || []);
  var w = [], total = 0, i;
  for (i = 0; i < secs.length; i++) {
    var v = typeof secs[i].weight === 'number' ? secs[i].weight : 1;
    if (!(v > 0)) v = 0;
    w.push(v);
    total += v;
  }
  if (total <= 0) return Math.floor(Math.random() * secs.length);
  var pick = Math.random() * total;
  for (i = 0; i < w.length; i++) {
    pick -= w[i];
    if (pick <= 0) return i;
  }
  return w.length - 1;
}

/* Крутка до нужного сектора.

   Диск делает целое число оборотов плюс доворот до центра выбранного
   сектора. Точка отсчёта — текущий угол по модулю 360°, иначе после
   десятка спинов spinAngle уедет в минус на тысячи градусов и float
   начнёт терять точность.

   Затухание степенное (3.6): первые пол-оборота колесо летит, потом
   долго гасит. Отскок в хвосте задан ДОЛЕЙ пути (0.006), а не
   градусами — на короткой дистанции фиксированный отскок прыгал бы
   через два сектора. */
function spinRotateTo(targetIdx, done) {
  var secs = spinSectors();
  var n = secs.length;
  if (!n) { if (done) done(); return; }
  if (spinRaf) { cancelAnimationFrame(spinRaf); spinRaf = 0; }
  /* Докатка входа/смены режима не должна дорисовываться поверх
     настоящей крутки: гасим её до первого кадра. */
  spinTweenStop();

  var step = 360 / n;
  var turns = 4 + Math.floor(Math.random() * 3);
  var cur = ((spinAngle % 360) + 360) % 360;
  var want = ((-(targetIdx * step + step / 2)) % 360 + 360) % 360;
  var delta = want - cur;
  if (delta <= 0) delta += 360;
  var total = turns * 360 + delta;

  var cfg = spinCfg();
  var ms = (cfg.spinMs && cfg.spinMs.length === 2)
    ? cfg.spinMs[0] + Math.random() * (cfg.spinMs[1] - cfg.spinMs[0])
    : 4000;
  /* «Меньше движения» — не крутим вообще: сразу ставим колесо на
     приз и отдаём результат. Анимация тут украшение, не сущность. */
  if (FX.reducedMotion()) {
    spinSetAngle(spinAngle + total);
    if (done) done();
    return;
  }

  var t0 = 0;
  var startAngle = spinAngle;
  var lastSector = -1;
  var pointer = $('.spin-pointer');
  var stageEl = $('#spin-stage');
  var slowing = false;

  function frame(ts) {
    if (!t0) t0 = ts;
    var p = Math.min(1, (ts - t0) / ms);
    var e = 1 - Math.pow(1 - p, 3.6);
    if (p > 0.86) e += Math.sin(((p - 0.86) / 0.14) * Math.PI) * 0.006;

    spinSetAngle(startAngle + total * e);
    if (!slowing && p > 0.6 && stageEl) { slowing = true; stageEl.classList.add('is-slowing'); }

    /* Щелчок стрелкой на каждой границе сектора. */
    var idxNow = Math.floor((((-spinAngle) % 360 + 360) % 360) / step) % n;
    if (idxNow !== lastSector) {
      lastSector = idxNow;
      if (pointer) {
        pointer.classList.remove('tick');
        void pointer.offsetWidth;
        pointer.classList.add('tick');
      }
      FX.vibrate(7);
      Snd.play('wheel_tick');
    }

    if (p < 1) { spinRaf = requestAnimationFrame(frame); return; }
    spinRaf = 0;
    spinSetAngle(startAngle + total);
    Snd.play('wheel_stop');
    if (done) done();
  }
  spinRaf = requestAnimationFrame(frame);
}

/* Начисление приза.

   Крипту кладём в портфель по текущему bid, а cost basis ставим
   равным номиналу приза: тогда PnL позиции в момент получения равен
   нулю и дальше идёт по рынку. Списывать спред «как при покупке»
   было бы враньём — игрок не покупал, ему подарили.

   Если актив пропал из списка монет или цена нечитаема, молча даём
   деньгами: приз важнее педантичности. В S.trades и S.orderHistory
   награда НЕ попадает — это не сделка игрока. */
function applySpinReward(sec) {
  if (!sec || sec.type === 'miss') return null;
  var usd = typeof sec.usd === 'number' && isFinite(sec.usd) ? sec.usd : 0;

  /* Скидка на комиссию. Не деньги и не актив — просто модификатор
     будущих сделок. Повторный выигрыш: более сильная скидка заменяет
     слабую, слабая при активной сильной её не отбирает — в обоих
     случаях счётчик сделок освежается. */
  if (sec.type === 'commission') {
    var pct = sec.pct > 0 && sec.pct <= 100 ? Math.round(sec.pct) : 25;
    var trades = sec.trades > 0 ? Math.round(sec.trades) : 3;
    if (pct >= (S.feeDiscPct || 0)) S.feeDiscPct = pct;
    S.feeDiscLeft = Math.max(S.feeDiscLeft || 0, trades);
    refreshFeePctLabel();
    renderFeeDisc();
    return { kind: 'commission', pct: pct, trades: trades };
  }

  if (usd <= 0) return null;

  if (sec.type === 'crypto') {
    var a = assetById(sec.id);
    var bid = a ? Engine.bid(a, now()) : 0;
    if (a && bid > 0) {
      var qty = usd / bid;
      if (!S.positions[a.id]) S.positions[a.id] = { qty: 0, cost: 0 };
      S.positions[a.id].qty += qty;
      S.positions[a.id].cost += usd;
      return { kind: 'crypto', usd: usd, qty: qty, ticker: a.ticker };
    }
  }

  S.balance += usd;
  return { kind: 'usd', usd: usd };
}

/* История последних круток убрана: полоса чипов под колесом читалась
   как шум. Счётчики попыток (spinFreeAt/spinAdCount) живут своей
   жизнью и от этого не зависят. */

/* Показ результата — центрированным окном, а не блоком внизу: приз
   должен останавливать взгляд, а не доплывать где-то под кнопкой.
   Карточку заполняет и анимирует js/v3-wheel.js (V3W.show): монета
   вылетает из сектора, карточка раскрывается из-под неё. Пустой сектор
   оформлен тем же окном, но серым, без золота и празднования. */
function showSpinResult(sec, res) {
  var modal = $('#modal-spin-prize');
  if (!modal) return;
  var isJack = !!(sec && sec.jackpot && res);
  var stage = $('#spin-stage');
  if (stage) stage.classList.toggle('is-jackpot', isJack);

  /* «Ещё раз» честно показывает, что можно дальше: обычный спин на
     кулдауне — предлагаем золотой, если и его нет — кнопку прячем. */
  var again = $('#spin-again');
  if (again) {
    var canHere = spinAvail(spinMode);
    var canVip = spinMode !== 'vip' && spinAvail('vip');
    var againLbl = again.querySelector('span');
    if (againLbl) againLbl.textContent = t(canHere || !canVip ? 'spin_again' : 'spin_cta_vip');
    var againIco = again.querySelector('svg');
    if (againIco) againIco.innerHTML = canHere || !canVip
      ? '<circle cx="16" cy="16" r="12.5"/><path d="M16 9.5v6.5l4.5 3" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<circle cx="16" cy="16" r="12.5"/><path d="M13.5 11l7.5 5-7.5 5z" fill="currentColor" stroke-linejoin="round"/>';
    again.classList.toggle('hidden', !canHere && !canVip);
  }

  if (typeof V3W !== 'undefined') {
    V3W.show(sec, res, isJack);
  } else {
    openModal('modal-spin-prize');
    if (res) toast(t('spin_toast_usd', { x: money(res.usd || 0, 0) }), 'gold');
  }
  renderSpinGoBtn();
}

/* Выбор режима. Режим ставится даже когда он недоступен: если
   одновременно горит кулдаун обычного спина и исчерпан дневной
   лимит рекламы, на экране осталась бы подпись от прошлого режима.
   Крутка в этом случае блокируется в spinGo(), а не здесь. */
function spinSelect(mode) {
  if (spinBusy) return;
  var m = (mode === 'vip') ? 'vip' : 'free';
  spinMode = m;
  /* На случай, когда экран открыли до окончания прогрева, обеспечиваем
     логотипы выбранного набора. spinPreloadCoins() дедуплицирует
     запросы и не мешает уже начатой загрузке. */
  spinPreloadCoins();

  var screen = $('#scr-spin');
  if (screen) {
    screen.classList.toggle('is-vip', m === 'vip');
    screen.classList.remove('is-jackpot');
  }
  var stage = $('#spin-stage');
  if (stage) {
    stage.classList.remove('is-jackpot');
    /* Сквош приземления — разовый эффект прошлой крутки: оставленный
       класс переиграл бы его при каждом открытии экрана. */
    stage.classList.remove('is-landed');
    stage.classList.remove('is-spinning', 'is-slowing');
    spinClearWin();
    /* Stage несёт собственный флаг для CSS-фильтра обода: лучи читают
       .is-vip с #scr-spin, а shadow/grain — с самой сцены. Раньше
       этот класс не ставился: VIP мог получить free-тень, хотя
       сектора уже были золотыми. */
    stage.classList.toggle('is-vip', m === 'vip');
  }
  /* Класс на корневом <svg> переключает золотые vs тёмные градиенты,
     обводки, цвет ступицы и иконки. Смотри .spin-free в style.css. */
  var svg = $('#spin-svg');
  if (svg) {
    svg.classList.toggle('spin-free', m === 'free');
    svg.classList.toggle('spin-vip', m === 'vip');
  }
  /* У режимов разные сектора, не только разные цвета. Пересобираем
     спокойно до старта крутки; во время spinBusy переключение запрещено.
     Без этого после free → vip оставались бы старые $10/$25/$50 BTC
     сектора, хотя weighted draw уже выбирал индексы нового набора.

     Сектор №0 всегда садится центром под стрелку. До этого wheel
     открывался с указателем ровно на шве между последним и первым
     секторами — визуально неприятно и непонятно, какой приз показан
     «лицом» при первом взгляде. */
  var secs = spinSectors();
  if (secs.length) spinTweenToRest(720);
  spinBuildWheel();
  $('#spin-title').textContent = t(m === 'vip' ? 'spin_modal_vip' : 'spin_modal_free');
  $('#spin-sub').textContent = t(m === 'vip' ? 'spin_vip_sub' : 'spin_free_sub');

  /* Результат предыдущей крутки прячем: он относится к прошлой
     ставке, а игрок выбрал другой режим. */
  closeModal('modal-spin-prize');

  renderSpinModes();
  renderSpinGoBtn();
}

function openSpin() {
  if (spinBusy) return;
  spinReturnTo = (currentScreen === 'app-main') ? 'app-main' : 'app-main';
  spinPreloadCoins();
  YaGame.gameplayStop();
  showScreen('scr-spin', 'right');
  setTab('lobby', true);
  spinBuildBulbs();
  spinBuildWheel();
  /* Экран открывается на обычном спине: он бесплатный и всегда
     доступен первым. Золотой переключается пилюлей в шапке. */
  spinSelect('free');
  spinRenderCap();
}

function closeSpin() {
  /* Во время крутки не закрываем: приз уже решён, но ещё не показан,
     и закрытие читалось бы как «украли». */
  if (spinBusy) return;
  if (spinRaf) { cancelAnimationFrame(spinRaf); spinRaf = 0; }
  spinTweenStop();
  closeModal('modal-spin-prize');
  showScreen(spinReturnTo, 'left');
  YaGame.gameplayStart();
  renderLobby();
}

/* Кнопка «Крутить». Для золотого спина сначала реклама: не досмотрел —
   попытка остаётся при игроке, он ничего не теряет из-за отсутствия
   ролика. Обычный спин уходит в крутку сразу. */
function spinGo() {
  if (spinBusy) return;
  /* Фиксируем режим ДО рекламы. Иначе future-код или событие жизненного
     цикла браузера может поменять глобальный spinMode, пока promise
     rewarded-рекламы ждёт завершения, и VIP-попытка покрутит free-колесо. */
  var mode = spinMode;
  if (!spinAvail(mode)) { toast(t('spin_no_spins'), ''); return; }
  /* Сбрасываем результат прошлой крутки до старта: иначе во время
     вращения на экране висит «$25» от предыдущего раза. */
  closeModal('modal-spin-prize');
  var stage = $('#spin-stage');
  if (stage) stage.classList.remove('is-jackpot');
  if (mode !== 'vip') { runSpin(mode); return; }
  YaGame.showRewarded().then(function (ok) {
    if (!ok) return;
    /* За время ролика игрок мог уйти с экрана — тогда крутить
       нечего, приз остался бы в никуда. */
    if (currentScreen !== 'scr-spin') return;
    runSpin(mode);
  }).catch(function () {
    /* SDK в реальной среде не обязан вернуть resolved false: часть
       провайдеров может отклонить Promise. Награду не выдаём, попытку
       не списываем, даём игроку повторить без упавшей консоли. */
    toast(t('spin_ad_failed'), '');
    renderSpinGoBtn();
  });
}

/* Режим передаётся аргументом и фиксируется на всю анимацию. Это
   инвариант: сектор, дневной счётчик и набор призов относятся к одной
   и той же попытке. */
function runSpin(mode) {
  if (spinBusy) return;
  var actualMode = mode === 'vip' ? 'vip' : 'free';
  var cfg = spinCfg();
  var secs = actualMode === 'vip'
    ? (cfg.vipSectors || cfg.sectors || [])
    : (cfg.freeSectors || cfg.sectors || []);
  if (!secs.length) return;
  spinBusy = true;
  /* Достижения: спин реально запущен (попытка уже точно спишется). */
  if (typeof Ach !== 'undefined') { try { Ach.emit('spin', { mode: actualMode }); } catch (e) { dbg('runSpin', e); } }
  Snd.play('spin_start');
  renderSpinModes();
  renderSpinGoBtn();

  var stage = $('#spin-stage');
  var pointer = $('.spin-pointer');

  /* Сам запуск. Вынесен, чтобы перед ним можно было сыграть замах. */
  spinClearWin();
  if (stage) stage.classList.remove('is-landed', 'is-jackpot', 'is-ready');
  var launch = function () {
    if (stage) stage.classList.add('is-spinning');
    var idx = spinDrawIndex(actualMode);
    spinRotateTo(idx, function () {
      /* Кэшированный secs, а не spinSectors(): между началом и концом
         крутки глобальный выбор режима мог меняться программно, но
         приз обязан соответствовать визуально крутящемуся колесу. */
      var sec = secs[idx];

      /* Тратим попытку здесь, а не при открытии: если рекламу показали,
         а игрок ушёл до остановки колеса — спин остаётся при нём,
         иначе можно было бы бесконечно «начинать и не докручивать».
         Счётчик нужен только при включённом дневном лимите: без него
         (adDailyLimit: 0) он вечно рос бы в сейве впустую. */
      if (actualMode === 'free') {
        S.spinFreeAt = YaGame.serverTime() + (spinCfg().freeCooldownMs || 21600000);
      } else if ((spinCfg().adDailyLimit || 0) > 0) {
        var today = dayKey(YaGame.serverTime());
        if (S.spinAdDay !== today) { S.spinAdDay = today; S.spinAdCount = 0; }
        S.spinAdCount++;
      }

      var res = applySpinReward(sec);
      /* Награда попадает в S.trades служебной записью side:'reward':
         реплеи графиков (capitalSeries/portfolioSeries) восстанавливают
         историю только из сделок, и без этой записи выигрыш врал бы —
         либо пропадал с кривой, либо прыгал последней точкой. */
      pushSpinRewardRecord(sec, res);
      /* Награда — изменение капитала без сделки. Без форс-снимка
         ALL-график покажет её только через минуту. */
      pushPfSnapshot(true);
      saveState(true);

      /* Остановка с весом: гасим «дыхание», даём один сквош
         приземления. Класс снимет spinSelect при следующем открытии
         экрана или смене режима. */
      var isJack = !!(sec && sec.jackpot && res);
      if (stage) {
        stage.classList.remove('is-spinning', 'is-slowing');
        stage.classList.add('is-landed');
        stage.classList.toggle('is-jackpot', isJack);
      }
      spinShowWin(secs.length, !res);
      spinLandFx(res, isJack);
      /* Пауза перед окном приза: игрок видит, куда попала стрелка.
         Всё это время spinBusy держится — уйти или крутить снова нельзя,
         иначе окно открылось бы поверх следующей крутки. */
      var reveal = function () {
        spinBusy = false;
        showSpinResult(sec, res);
        spinRenderCap();
        renderSpinModes();
        renderLobby();
      };
      /* Пауза — ровно чтобы увидеть сектор под стрелкой: дальше приз
         сам вылетает из него. У «Мимо» чуть дольше — без спешки. */
      if (FX.reducedMotion()) reveal(); else setTimeout(reveal, res ? 520 : 650);
    });
  };

  /* Замах: стрелка отводится назад, сцена приседает, затем выпуск.
     При «меньше движения» крутка стартует сразу, без театра. */
  if (FX.reducedMotion() || !pointer) { launch(); return; }
  pointer.classList.remove('tick', 'release');
  void pointer.offsetWidth;
  pointer.classList.add('windup');
  if (stage) stage.classList.add('is-winding');
  spinLaunchTimer = setTimeout(function () {
    spinLaunchTimer = 0;
    /* Игрок мог уйти с экрана колеса за эти 380 мс. Тогда замах
       отменяем: без проверки launch() запускался на уже закрытом
       экране и тратил попытку. */
    if (currentScreen !== 'scr-spin') {
      pointer.classList.remove('windup');
      if (stage) stage.classList.remove('is-winding');
      return;
    }
    pointer.classList.remove('windup');
    pointer.classList.add('release');
    if (stage) stage.classList.remove('is-winding');
    /* Класс выпуска снимаем после его анимации, иначе он навсегда
       перебивал бы щелчки .tick во время вращения. */
    setTimeout(function () { pointer.classList.remove('release'); }, 430);
    launch();
  }, 380);
}

/* Капитал в шапке экрана. Игрок крутит ради баланса, и видеть его
   изменение прямо здесь приятнее, чем возвращаться в меню. */
function spinRenderCap() {
  var el = $('#spin-cap');
  if (el) el.textContent = money(capital(), 0);
}

/* Лобби-карточка: мини-колесо с кольцом отсчёта обычного спина, режим
   (после обычного — золотой) и кнопка — js/v3-lobby.js. */
function renderSpinCard() {
  if (typeof V3L !== 'undefined') V3L.renderSpin('force');
  renderSpinCooldowns();
}

/* Переключатель режима в шапке: две иконки-пилюли. Недоступный режим
   нажать нельзя, выбранный подсвечивается; во время крутки оба
   заблокированы — приз уже решён, менять ставку посреди вращения
   нельзя. Подсказка (title) ставится из i18n: иконка сама по себе
   не объясняет, что за режим. */
function renderSpinModes() {
  var f = $('#spin-mode-free');
  if (f) {
    /* Недоступный режим остаётся кликабельным: игрок может перейти
       на него и увидеть честный таймер/причину на CTA. Блокируем
       только во время физической крутки, когда менять таблицу секторов
       действительно опасно. */
    f.disabled = spinBusy;
    f.classList.toggle('is-on', spinMode === 'free');
    f.classList.toggle('is-unavailable', !spinAvail('free'));
    f.setAttribute('aria-selected', spinMode === 'free' ? 'true' : 'false');
    f.title = t('spin_switch_free');
  }
  var v = $('#spin-mode-vip');
  if (v) {
    v.disabled = spinBusy;
    v.classList.toggle('is-on', spinMode === 'vip');
    v.classList.toggle('is-unavailable', !spinAvail('vip'));
    v.setAttribute('aria-selected', spinMode === 'vip' ? 'true' : 'false');
    v.title = t('spin_switch_vip');
  }
  renderSpinCooldowns();
}

/* Главная кнопка под колесом. Режим всегда объясняет механику прямо
   здесь: золотой сначала показывает rewarded-рекламу и только потом
   крутит. Таймер живёт в правой плашке, поэтому заголовок не
   дёргается. */
function renderSpinGoBtn() {
  var go = $('#spin-go');
  if (!go) return;
  var txt = $('#spin-go-txt');
  var sub = $('#spin-go-sub');
  var lim = $('#spin-go-limit');
  var note = $('#spin-action-note');
  if (!txt || !sub || !lim || !note) return;

  var available = spinAvail(spinMode);
  go.disabled = spinBusy || !available;
  var stageR = $('#spin-stage');
  if (stageR) stageR.classList.toggle('is-ready', available && !spinBusy);
  var hub = $('#spin-hub');
  if (hub) hub.disabled = spinBusy;
  lim.classList.remove('mono');

  if (spinBusy) {
    txt.textContent = t('spin_spinning');
    sub.textContent = t('spin_wait');
    lim.textContent = '…';
    note.textContent = '';
  } else if (spinMode === 'vip') {
    /* «Ещё раз» показываем, пока открыто окно награды прошлой крутки. */
    var prize = $('#modal-spin-prize');
    var again = prize && !prize.classList.contains('hidden');
    txt.textContent = t(again ? 'spin_again' : 'spin_cta_vip');
    sub.textContent = t('spin_vip_sub');
    /* Лимит снят (adDailyLimit: 0) — вместо счётчика показываем ∞. */
    var vipLeft = spinAdLeft();
    lim.textContent = vipLeft === Infinity ? '\u221E'
      : (vipLeft > 0 ? t('spin_vip_left', { n: vipLeft }) : t('spin_vip_limit'));
    note.textContent = available ? t('spin_vip_note') : '';
  } else if (available) {
    txt.textContent = t('spin_cta');
    sub.textContent = t('spin_free_sub');
    lim.textContent = t('spin_free_ready');
    note.textContent = t('spin_free_note');
  } else {
    txt.textContent = t('spin_cta');
    sub.textContent = t('spin_free_sub');
    lim.textContent = fmtDuration(spinFreeLeftMs());
    lim.classList.add('mono');
    note.textContent = t('spin_free_note');
  }
}

/* Обратный отсчёт. Вызывается каждую секунду из tick(), поэтому
   здесь только textContent — пересборка innerHTML раз в секунду
   пересоздавала бы узлы и заставляла точку состояния мигать. */
function renderSpinCooldowns() {
  var fCta = $('#spin-free-cta');
  var leftMs = spinFreeLeftMs();
  if (fCta) {
    fCta.textContent = leftMs > 0 ? fmtDuration(leftMs) : t('spin_free_ready');
    fCta.classList.toggle('mono', leftMs > 0);
  }
  var vCta = $('#spin-vip-cta');
  if (vCta) vCta.textContent = spinAdLeft() > 0 ? t('spin_vip_ready') : t('spin_vip_limit');
  renderSpinGoBtn();
}
/* ------------------------------ Рынок ------------------------------ */

var marketQuery = '';

/* Мини-график в строке рынка. */
var sparkColors = null;
/* Цвета читаем лениво и всегда внутри кадра: смена темы обнуляет кеш,
   а уже запущенные rAF-анимации не должны падать на полпути. */
function getSparkColors() {
  if (!sparkColors) {
    var cs = getComputedStyle(document.documentElement);
    sparkColors = { up: cs.getPropertyValue('--up').trim(), down: cs.getPropertyValue('--down').trim() };
  }
  return sparkColors;
}
/* Спарклайн рисуется «от руки» слева направо, с разной скоростью у каждой линии. */
function drawSpark(cv, closes, up, animate) {
  if (cv.__sparkRaf) { cancelAnimationFrame(cv.__sparkRaf); cv.__sparkRaf = 0; }
  var dpr = Math.max(2, window.devicePixelRatio || 1);
  var w = 74, h = 32;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  var mn = Math.min.apply(null, closes), mx = Math.max.apply(null, closes);
  if (mx === mn) mx = mn + 1e-9;

  function paint(n) {
    var c = getSparkColors();
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = up ? c.up : c.down;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    var lx = 0, ly = 0;
    for (var i = 0; i < n; i++) {
      lx = i / (closes.length - 1) * (w - 2) + 1;
      ly = h - 2 - (closes[i] - mn) / (mx - mn) * (h - 4);
      if (i) ctx.lineTo(lx, ly); else ctx.moveTo(lx, ly);
    }
    ctx.stroke();
    /* Точка-«живой» конец: последний(bar) замыкается светящейся точкой —
       хвост линии читается как текущая цена, а не просто обрыв. */
    if (n === closes.length && closes.length) {
      ctx.fillStyle = up ? c.up : c.down;
      ctx.beginPath();
      ctx.arc(lx, ly, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (!animate || FX.reducedMotion()) { paint(closes.length); return; }
  var dur = 520 + Math.random() * 260;
  var t0 = 0;
  function frame(ts) {
    if (!cv.isConnected) { cv.__sparkRaf = 0; return; }
    if (!t0) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    paint(Math.max(2, Math.round(closes.length * (1 - Math.pow(1 - p, 2)))));
    if (p < 1) cv.__sparkRaf = requestAnimationFrame(frame);
    else cv.__sparkRaf = 0;
  }
  cv.__sparkRaf = requestAnimationFrame(frame);
}

/* root — контейнер. Портфель и экран «все активы» рисуют только свои
   спарклайны: иначе каждые 500 мс перерисовывался бы и весь рынок
   (в нём до сотни строк), хотя он обновляется сам. */
/* Спарки рисуются все сразу, и это осознанно оставлено так.
   Пробовал откладывать невидимые (в маркете 200 строк, в поле зрения девять):
   не работает. renderTab выполняется, пока вкладка ещё скрыта, поэтому
   getBoundingClientRect у всех канвасов возвращает нули, проверка «рядом с
   экраном» пропускает все 200, и откладывать оказывается нечего. Чтобы это
   заработало, рисование надо переносить на кадр ПОСЛЕ показа вкладки — то
   есть менять порядок рендера ради выигрыша, которого на тике нет:
   patchDeskLive стоит 0.30 мс и спарков не трогает вовсе, а полный
   renderTab(market) — 23–33 мс и случается только при переключении вкладки
   или смене фильтра. Не стоит того. */
function drawSparks(animate, root) {
  var list = (root || document).querySelectorAll('canvas[data-spark]');
  Array.prototype.forEach.call(list, function (cv) {
    var a = assetById(cv.getAttribute('data-spark'));
    if (!a) return;
    var closes = Engine.candles(a, 36, 1, now()).map(function (d) { return d.c; });
    drawSpark(cv, closes, Engine.change(a, now()) >= 0, !!animate);
  });
}

/* Декоративные теги строк (как в референсе). */
var TREND_IDS = { bitcoin: 1, ethereum: 1, solana: 1, dogecoin: 1, pepe: 1, 'shiba-inu': 1 };
var POPULAR_IDS = { ripple: 1, cardano: 1, tron: 1, 'the-open-network': 1, 'avalanche-2': 1, chainlink: 1, binancecoin: 1 };

/* Данные для сортировки: ранг (маркет-кап), объём 24ч и популярность.
   Объём и капа — настоящие (CoinGecko) с игровой динамикой, а не
   синтетика от индекса: иначе сортировка по объёму расходилась с
   реальностью. */
var RANK = {}, VOL24 = {}, POP = {}, CAPLIVE = {};

function initRankData() {
  /* Ранг считаем по настоящей капитализации из MARKET, а не по
     порядку монет в массиве. Список ASSETS и снимок кап живут
     отдельно и расходятся до 10 позиций (сильнее всех — unibase):
     при ранжировании по индексу сортировка «по капитализации»
     спорила бы с цифрой, которую игрок видит на экране трейда. */
  var byCap = ASSETS.slice().sort(function (x, y) { return marketCapOf(y) - marketCapOf(x); });
  byCap.forEach(function (a, i) { RANK[a.id] = i; });
  ASSETS.forEach(function (a, i) {
    var h = ((a.seed * 7919 + i * 104729) % 1000) / 1000;
    CAPLIVE[a.id] = marketCapOf(a);
    VOL24[a.id] = vol24(a);
    /* Популярность тоже от ранга, а не от индекса: иначе «популярное»
       было бы просто первыми строками файла. */
    POP[a.id] = (TREND_IDS[a.id] ? 500 : 0) + (POPULAR_IDS[a.id] ? 260 : 0)
      + (1000 - RANK[a.id]) + Math.round(h * 80);
  });
}

/* Освежить капы и объёмы. Объём накапливается за сутки и сбрасывается
   в полночь, капа идёт за ценой — поэтому их надо пересчитывать, а не
   замораживать на старте.

   `only` — пересчитать один актив. Капа и объём нужны ровно там, где
   их показывают: список рынка (все 200) и карточка актива на экране
   трейда (один). Раньше функция вызывалась из tick() безусловно, и
   игрок, стоящий в лобби, заставлял пересчитывать 200 цен дважды в
   секунду (замер: live=200 на каждом тике). */
function refreshMarketMeta(only) {
  if (only) {
    CAPLIVE[only.id] = marketCapOf(only);
    VOL24[only.id] = vol24(only);
    return;
  }
  ASSETS.forEach(function (a) {
    CAPLIVE[a.id] = marketCapOf(a);
    VOL24[a.id] = vol24(a);
  });
}

var SORT_OPTIONS = [
  { k: 'cap', img: 'img/sort-cap.png?v=14', t: 'sort_cap', s: 'sort_cap_sub' },
  { k: 'price', img: 'img/sort-price.png?v=14', t: 'sort_price', s: 'sort_price_sub' },
  { k: 'change', img: 'img/sort-change.png?v=14', t: 'sort_change', s: 'sort_change_sub' },
  { k: 'volume', img: 'img/sort-volume.png?v=14', t: 'sort_volume', s: 'sort_volume_sub' },
  { k: 'az', img: 'img/sort-az.png?v=14', t: 'sort_az_opt', s: 'sort_az_sub' }
];
var pendingSortKey = 'cap';
var pendingSortDir = 'desc';

/* ---------- Категории рынка ----------
   Категория = поле sector монеты (js/data-coins.js, 200 монет).
   Крупные секторы идут отдельными пунктами, мелкие
   (pay / privacy / oracle / rwa — 9 монет на четверых) сведены в
   «Другие»: иначе в списке висит хвост категорий с одной монетой.
   Порядок — по числу монет, как в референсе. */
var MARKET_CATS = ['l1', 'infra', 'meme', 'defi', 'exchange', 'ai', 'gaming', 'l2'];
var CAT_OTHER_SECTORS = ['pay', 'privacy', 'oracle', 'rwa'];

/* Логотипы категорий — растровые, img/cats/<категория>.png (128×128,
   уже с альфой). Пришли на смену line-иконкам 24×24: те были одного
   цвета с текстом (currentColor) и в золоте выглядели бледно.
   Рендер берёт их только через catIcon() — менять здесь. */
var CAT_ICON_VER = 1;
function catIcon(k) {
  var key = CAT_ICONS_KEYS.indexOf(k) >= 0 ? k : 'other';
  return '<img src="img/cats/' + key + '.png?v=' + CAT_ICON_VER + '" ' +
    'alt="" draggable="false">';
}
var CAT_ICONS_KEYS = ['all', 'l1', 'infra', 'meme', 'defi', 'exchange',
  'ai', 'gaming', 'l2', 'other'];

/* Сектор монеты, сведённый к категории фильтра. */
function marketCatOf(a) {
  return CAT_OTHER_SECTORS.indexOf(a.sector) >= 0 ? 'other' : a.sector;
}

/* Сколько монет попадёт в категорию ('all' — все). */
function marketCatCount(k) {
  if (k === 'all') return ASSETS.length;
  var n = 0;
  for (var i = 0; i < ASSETS.length; i++) {
    if (marketCatOf(ASSETS[i]) === k) n++;
  }
  return n;
}

/* Выбор в открытой модалке (применяется по «Применить»). */
var pendingCat = 'all';

function renderSortCats() {
  var box = $('#sort-cats');
  if (!box) return;
  var keys = ['all'].concat(MARKET_CATS, ['other']);
  var html = '';
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    /* Каскад появления: задержка растёт по индексу (как в референсе).
       Проигрывается один раз на открытие модалки — клики дальше только
       переключают класс .sel, без пересоздания узлов. */
    html += '<button type="button" class="cat-opt' + (pendingCat === k ? ' sel' : '') +
      '" data-cat="' + k + '" style="animation-delay:' + (40 + i * 24) + 'ms" aria-pressed="' + (pendingCat === k) + '">' +
      '<span class="co-ico">' + catIcon(k) + '</span>' +
      '<span class="co-name">' + esc(t('cat_' + k)) + '</span>' +
      '<span class="co-count">' + marketCatCount(k) + '</span>' +
      '</button>';
  }
  box.innerHTML = html;
  $$('#sort-cats .cat-opt').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-cat') || 'all';
      if (pendingCat === k) return;
      pendingCat = k;
      $$('#sort-cats .cat-opt').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('sel', on);
        x.setAttribute('aria-pressed', on);
      });
      updateSortSummary();
      commitSortLive();
    };
  });
  /* Выбранная категория может оказаться за краем ленты пилюль —
     подруливаем ленту к ней. Именно вручную через scrollLeft:
     scrollIntoView центрирует и ВНЕШНИЙ скролл-контейнер по горизонтали,
     и подпись «Категории» съезжает за край шита. */
  var sel = box.querySelector('.cat-opt.sel');
  if (sel) {
    var bRect = sel.getBoundingClientRect(), rRect = box.getBoundingClientRect();
    var delta = (bRect.left + bRect.width / 2) - (rRect.left + rRect.width / 2);
    if (Math.abs(delta) > 1) box.scrollLeft += delta;
  }
}

var SORT_TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

function renderSortOptions() {
  var box = $('#sort-options');
  if (!box) return;
  var html = SORT_OPTIONS.map(function (o, i) {
    var sel = pendingSortKey === o.k;
    return '<button type="button" class="sort-opt' + (sel ? ' sel' : '') +
      '" data-key="' + o.k + '" style="animation-delay:' + (90 + i * 40) + 'ms" aria-pressed="' + sel + '">' +
      '<span class="so-ico"><img src="' + o.img + '" alt="" draggable="false"></span>' +
      '<span class="so-txt"><b>' + t(o.t) + '</b><i>' + t(o.s) + '</i></span>' +
      '<span class="so-radio" aria-hidden="true">' + SORT_TICK + '</span>' +
      '</button>';
  }).join('');
  box.innerHTML = html;
  $$('#sort-options .sort-opt').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-key');
      if (pendingSortKey === k) return;
      pendingSortKey = k;
      $$('#sort-options .sort-opt').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('sel', on);
        x.setAttribute('aria-pressed', on);
      });
      /* Блик по выбранной карточке; класс снимаем после анимации. */
      b.classList.add('flash');
      setTimeout(function () { b.classList.remove('flash'); }, 750);
      syncSortDirState();
      updateSortSummary();
      commitSortLive();
    };
  });
  renderSortDir();
}

/* Кнопки порядка. Рендерим из JS, а не держим в разметке: у каждой
   кнопки иконка и подпись, а data-i18n умеет только плоский текст.
   Активная сторона подсвечена бегунком (::before у контейнера),
   сторона задаётся классом asc на контейнере. */
function renderSortDir() {
  var box = $('#sort-dir-seg');
  if (!box) return;
  var dirs = [
    /* По убыванию — стрелка вниз, по возрастанию — вверх: так читается
       без чтения подписи. */
    { k: 'desc', t: 'order_desc',
      ico: '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>' },
    { k: 'asc', t: 'order_asc',
      ico: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>' }
  ];
  var html = '';
  for (var i = 0; i < dirs.length; i++) {
    var d = dirs[i];
    html += '<button type="button" class="dir-opt' + (pendingSortDir === d.k ? ' sel' : '') +
      '" data-dir="' + d.k + '" aria-pressed="' + (pendingSortDir === d.k) + '">' +
      '<span class="dir-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      d.ico + '</svg></span>' +
      '<b>' + esc(t(d.t)) + '</b>' +
      '</button>';
  }
  box.innerHTML = html;
  box.classList.toggle('asc', pendingSortDir === 'asc');
  $$('#sort-dir-seg .dir-opt').forEach(function (b) {
    b.onclick = function () {
      var d = b.getAttribute('data-dir');
      if (pendingSortDir === d) return;
      pendingSortDir = d;
      $$('#sort-dir-seg .dir-opt').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('sel', on);
        x.setAttribute('aria-pressed', on);
      });
      box.classList.toggle('asc', d === 'asc');
      commitSortLive();
    };
  });
  syncSortDirState();
}

/* v3: выбор в шторке применяется сразу — строки переезжают за ней (FLIP),
   а кнопка внизу просто закрывает шторку. */
function commitSortLive() {
  if (S.sortKey === pendingSortKey && S.sortDir === pendingSortDir && (S.marketCat || 'all') === pendingCat) return;
  S.sortKey = pendingSortKey;
  S.sortDir = pendingSortDir;
  S.marketCat = pendingCat;
  Snd.play('sort');
  saveState(true);
  renderMarket();
  syncFavHeader();
}

/* Порядок влияет только на числовые сортировки: в az список
   алфавитный в обе стороны, так что сегмент гаснем, чтобы не
   обещать действие, которое ничего не меняет. */
function syncSortDirState() {
  var wrap = $('#sort-dir-wrap');
  if (!wrap) return;
  var off = pendingSortKey === 'az';
  wrap.classList.toggle('off', off);
  if (off) wrap.setAttribute('aria-disabled', 'true');
  else wrap.removeAttribute('aria-disabled');
}

/* Живая сводка в подвале: категория • способ • сколько монет войдёт. */
function updateSortSummary() {
  var el = $('#sort-summary');
  if (!el) return;
  var opt = null;
  for (var i = 0; i < SORT_OPTIONS.length; i++) {
    if (SORT_OPTIONS[i].k === pendingSortKey) opt = SORT_OPTIONS[i];
  }
  var catK = pendingCat || 'all';
  $('#sum-cat').textContent = t('cat_' + catK);
  $('#sum-sort').textContent = t(opt ? opt.t : 'sort_cap');
  $('#sum-count').textContent = coinsPlural(marketCatCount(catK));
  var ap = $('#sort-apply');
  if (ap && I18N[LANG] && I18N[LANG].v3m_show) ap.textContent = t('v3m_show', { n: coinsPlural(marketCatCount(catK)) });
}

/* «N монет» с формой множественного числа. Формула русская, но для EN
   она вырождается корректно: «one» только при n=1, остальные — plural. */
function coinsPlural(n) {
  var m10 = n % 10, m100 = n % 100;
  var key = 'sum_coins_many';
  if (m10 === 1 && m100 !== 11) key = 'sum_coins_one';
  else if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) key = 'sum_coins_few';
  return t(key, { n: n });
}

/* Прогрев кеша: создаём Image() для каждой иконки сортировки и каждого
   логотипа категории, чтобы при первом открытии модалки они появились
   мгновенно, без «мигания» при сетевой загрузке. Растр логотипов
   крупнее прежних line-иконок, так что прогрев важнее. */
var _preloadedImgs = null;
function preloadSortIcons() {
  if (_preloadedImgs) return;
  _preloadedImgs = [];
  SORT_OPTIONS.forEach(function (o) {
    var img = new Image();
    img.src = o.img;
    _preloadedImgs.push(img);
  });
  CAT_ICONS_KEYS.forEach(function (k) {
    var img = new Image();
    img.src = 'img/cats/' + k + '.png?v=' + CAT_ICON_VER;
    _preloadedImgs.push(img);
  });
}

function openSortSheet() {
  pendingSortKey = S.sortKey;
  pendingSortDir = S.sortDir;
  pendingCat = S.marketCat || 'all';
  /* Сначала показываем шит, потом рендерим: при display:none у узлов
     нулевые getBoundingClientRect, и подруливание ленты к выбранной
     категории не сработало бы. */
  openModal('modal-sort');
  renderSortCats();
  renderSortOptions();
  updateSortSummary();
}

function closeSortSheet() {
  closeModal('modal-sort');
}

function sortVal(a, changes) {
  switch (S.sortKey) {
    case 'price': return Engine.live(a, now());
    case 'change': return changes[a.id] || 0;
    case 'volume': return VOL24[a.id] || 0;
    case 'pop': return POP[a.id] || 0;
    /* Маркет-кап — живая, а не замороженный снимок: цена пошла вверх,
       монета должна подниматься в рейтинге. Знак прямой: компаратор
       ниже вычитает (y − x), то есть «больше sortVal — выше в списке».
       У RANK знак обратный: там меньше ранг — больше капа. */
    case 'cap': return CAPLIVE[a.id] || 0;
    default: return -(RANK[a.id] || 0); // фолбэк: по рангу (меньше ранг — больше капа)
  }
}

function tagFor(a, chg) {
  /* Теги идут через i18n: раньше были захардкоженным английским, и в
     русской локали торчали «▲ Top Gainer» среди переведённого UI. */
  if (chg >= 0.05) return '<span class="tag tag-up">▲ ' + esc(t('tag_gainer')) + '</span>';
  if (TREND_IDS[a.id]) return '<span class="tag tag-hot">🔥 ' + esc(t('tag_trending')) + '</span>';
  if (POPULAR_IDS[a.id]) return '<span class="tag tag-pop">' + esc(t('tag_popular')) + '</span>';
  return '';
}

/* Красивая сортировка: по алфавиту с буквенными разделителями (избранное сверху)
   либо по лидерам роста. */
var _rowByAsset = {};

/* Нормализация статистики для старых/повреждённых сейвов. В текущей
   версии wins растёт только вместе с закрытой прибыльной продажей, поэтому
   математически не может быть больше общего tradesCount. Но в облаке у
   игрока мог остаться state от старой версии с другой схемой подсчёта —
   именно так на экране появлялось 131%. Историю целиком восстановить нельзя
   (S.trades хранит только последние 40 операций), поэтому не выдумываем
   прошлые сделки: приводим счётчики к допустимому диапазону и отдельно
   страхуем вывод. */
function normalizeTradeStats() {
  var total = Math.floor(Number(S.tradesCount));
  var wins = Math.floor(Number(S.wins));
  S.tradesCount = isFinite(total) ? Math.max(0, total) : 0;
  /* sellsCount — знаменатель винрейта: успешность считают по ЗАКРЫТЫМ
     сделкам, а покупка закрытия не даёт. У старых сейвов поля нет —
     ставим его равным tradesCount, чтобы винрейт не обнулился, а
     продолжил считаться по прежней (заниженной) базе. */
  var sells = Math.floor(Number(S.sellsCount));
  if (!isFinite(sells) || sells < 0) sells = S.tradesCount;
  S.sellsCount = Math.min(sells, S.tradesCount);
  S.wins = isFinite(wins) ? Math.max(0, Math.min(wins, S.sellsCount)) : 0;
}

function successRate() {
  /* Знаменатель — проданные сделки, а не все операции: 100 прибыльных
     продаж и 100 покупок давали 50% «успешных», хотя закрытия все в
     плюс. Покупка не может быть выигрышем или проигрышем. */
  var total = Math.max(0, Number(S.sellsCount) || 0);
  var wins = Math.max(0, Number(S.wins) || 0);
  /* Даже до сохранения миграции интерфейс никогда не показывает >100%. */
  return total > 0 ? Math.min(1, wins / total) : 0;
}

var _marketInitialized = false;
var _marketLastQuery = '';
var _marketLastAz = false;
var _marketLastSortDir = '';
var _marketLastLang = '';
var _marketLastCat = '';

/* Хелпер: дать текущий отфильтрованный и отсортированный список + изменения.
   Используется и в renderMarket, и в делегировании клика на звезду. */
function getMarketListAndChanges() {
  var q = marketQuery.trim().toLowerCase();
  /* Фильтр по категории — до поиска: счётчики в модалке считаются по
     полному списку монет, а не по уже отфильтрованному. */
  var cat = S.marketCat || 'all';
  var list = ASSETS.filter(function (a) {
    if (cat !== 'all' && marketCatOf(a) !== cat) return false;
    if (!q) return true;
    var n = assetName(a);
    return n.toLowerCase().indexOf(q) >= 0 || a.ticker.toLowerCase().indexOf(q) >= 0;
  });
  var changes = {};
  list.forEach(function (a) { changes[a.id] = Engine.change(a, now()); });
  var az = S.sortKey === 'az';
  var dir = S.sortDir === 'asc' ? -1 : 1;
  if (az) {
    list.sort(function (x, y) {
      function key(a) {
        var fav = S.favs[a.id] ? '0\u2605' : '1';
        var n = assetName(a);
        var letterPart = /^[A-Za-z\u0410-\u044f\u0401\u0451]/.test(n) ? '1' + n.toLowerCase() : '2' + n.toLowerCase();
        return fav + letterPart;
      }
      return key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0;
    });
  } else {
    list.sort(function (x, y) {
      /* Избранное всегда наверху — как в az (группа ★), только без
         буквенной группы (header «★ Избранное» добавляется отдельно
         в renderMarketFull для консистентности). Раньше fav в cap/
         change/price/volume сортировались только по sortVal, и при
         toggle звезды токен оставался на своём месте — рейтинг не
         менялся, только загоралась звезда, что читалось как «не
         сработало». */
      var fx = S.favs[x.id] ? 1 : 0;
      var fy = S.favs[y.id] ? 1 : 0;
      if (fx !== fy) return fy - fx;
      return (sortVal(y, changes) - sortVal(x, changes)) * dir;
    });
  }
  return { list: list, changes: changes, az: az };
}

/* Кнопка сортировки подсвечивается, когда включён фильтр категории:
   иначе по списку не понять, почему монет стало меньше. */
function syncSortBtn() {
  var b = $('#market-sort');
  if (b) b.classList.toggle('on', (S.marketCat || 'all') !== 'all');
}

/* forceFull — принудительная полная пересборка. Нужна когда менялся состав
   групп (добавили/убрали избранное): incremental только переставляет строки,
   а заголовок «★ Избранное» не создаёт, и блок висит без подписи. */
function renderMarket(noAnim, forceFull) {
  var listEl = $('#market-list');
  listEl.classList.toggle('no-anim', !!noAnim);
  var data = getMarketListAndChanges();
  var list = data.list, changes = data.changes, az = data.az;
  var q = marketQuery.trim().toLowerCase();

  /* Incremental reorder (FLIP) возможен, только если состав списка
     и режим сортировки не поменялись — тогда можно переставить
     существующие DOM-узлы через appendChild, не пересоздавая строки
     (и не перезапуская rAF 100 спарклайнов).

     В az-режиме incremental ЗАПРЕЩЁН: reorderMarketRows перемещает
     только .asset-row, буквенные хедеры .letter-h остаются на месте
     и сваливаются в кучу (DOM: [A][B][C]...T потом столбик строк).
     Так что второе подряд применение az с тем же dir давало баг —
     пользователь видел столбик букв. В az — всегда full rebuild. */
  var sameFilter = q === _marketLastQuery;
  var sameAz = az === _marketLastAz;
  /* Смена языка — тоже повод на полный rebuild: в разметке есть
     переведённые строки (заголовок «★ Избранное», плашки, и пустое
     состояние поиска с запросом). Инкрементальный путь только
     переставляет готовые узлы, поэтому после setLang они остались бы
     на старом языке. */
  var sameLang = LANG === _marketLastLang;
  /* Смена категории меняет СОСТАВ списка, а incremental умеет только
     переставлять существующие узлы — иначе в списке остались бы строки
     из прошлой категории. Поэтому это тоже повод на полный rebuild. */
  var sameCat = (S.marketCat || 'all') === _marketLastCat;
  var canIncremental = _marketInitialized && sameFilter && sameAz && sameLang && sameCat
    && listEl.children.length > 0
    && S.sortDir === _marketLastSortDir && !az && !forceFull;

  _marketLastQuery = q;
  _marketLastAz = az;
  _marketLastSortDir = S.sortDir;
  _marketLastLang = LANG;
  _marketLastCat = S.marketCat || 'all';

  if (!canIncremental) {
    /* Full rebuild: первый рендер / сменился фильтр / сменился az-режим. */
    renderMarketFull(listEl, list, changes, az);
  } else {
    /* Incremental: только перестановка строк + обновление цены/изменения.
       Sparkline-canvas НЕ пересоздаются → нет «перезагрузки на 1 сек». */
    reorderMarketRows(listEl, list, changes);
    /* После appendChild шапки «★ Избранное»/«Все активы» остаются на
       старых местах (переставляются только .asset-row) — пересобираем
       их. Раньше syncing был только на клике звезды и sort-apply, и
       после ухода-возврата на вкладку «Все активы» вставал НАД
       избранными строками. */
    syncFavHeader();
  }

  /* Если это incremental reorder, drawSparks не нужен — спарклайны
     рисуются раз в 4 сек глобально из updateMarketTick. А при full
     rebuild мы заново создаём <canvas>, и drawSparks нужен. */
  drawSparks(canIncremental ? false : !noAnim);
  syncSortBtn();
}

/* Шапка избранного — не просто текстовая буква-разделитель. Иконка в
   отдельной плашке и счётчик делают её похожей на собранную пользователем
   коллекцию, а не на случайный результат сортировки. pop — счётчик
   изменился: одноразовый «подпрыг», иначе (живая сортировка ~7с) — нет. */
function favHeaderHtml(count, pop) {
  return '<div class="letter-h fav-h mono">' +
    '<span class="fav-h-title"><span class="fav-h-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg>' +
    '</span>' + esc(t('fav_header')) + '</span>' +
    '<span class="fav-h-count' + (pop ? ' pop' : '') + '">' + count + '</span></div>';
}

function marketAllHeaderHtml() {
  return '<div class="letter-h market-all-h mono"><span>' + esc(t('market_all_header')) + '</span></div>';
}

/* Полная перерисовка списка рынка — используется при первом открытии,
   изменении фильтра поиска, переключении az↔числовой сортировки. */
function renderMarketFull(listEl, list, changes, az) {
  var html = '';
  var lastGroup = null;
  var favHeaderEmitted = false;
  var allHeaderEmitted = false;
  var favTotal = 0;
  list.forEach(function (a) { if (S.favs[a.id]) favTotal++; });
  list.forEach(function (a) {
    var chg = changes[a.id];
    var fav = !!S.favs[a.id];
    if (az) {
      var first = assetName(a).charAt(0).toUpperCase();
      var group = fav ? '\u2605' : (/[A-Z]/.test(first) ? first : '#');
      if (group !== lastGroup) {
        lastGroup = group;
        var favH = group === '\u2605';
        /* fav-h — только группе избранного. Обычные A/B/C остаются
           компактными буквенными разделителями. */
        html += favH ? favHeaderHtml(favTotal) : '<div class="letter-h mono">' + group + '</div>';
      }
    } else if (fav && !favHeaderEmitted) {
      /* Избранное наверху получает собственную шапку со счётчиком. */
      favHeaderEmitted = true;
      html += favHeaderHtml(favTotal);
    } else if (!fav && favHeaderEmitted && !allHeaderEmitted) {
      /* Явно закрываем золотой блок перед обычным рынком. Раньше тонкая
         линия была ::before внутри flex-карточки и выглядела сломанной. */
      allHeaderEmitted = true;
      html += marketAllHeaderHtml();
    }
    var p = Engine.live(a, now());
    html += renderAssetRow(a, p, chg, fav);
  });
  if (!html) {
    /* Пусто. Если блок «ничего не найдено» уже на экране — обновляем
       только подпись с запросом и не трогаем остальной DOM. Иначе на
       каждый символ блок создавался бы заново и лесенка анимаций
       (иконка + заголовок + подпись + подсказка + кнопка) играла сызнова.
       Анимация входа теперь привязана к ВХОДУ в состояние, не к набору. */
    if (!updateEmptySearchQuery(listEl)) listEl.innerHTML = emptyMarketHtml();
  } else {
    listEl.innerHTML = html;
  }
  cacheMarketRows();
  _marketInitialized = true;
}

/* Пустой список рынка. С активным поиском это отдельное состояние, а не
   «данных нет»: игрок набирал запрос, ничего не подошло — и ему нужно
   (а) понять, что рынок не сломался, и (б) одной кнопкой вернуть весь
   список. Пустой запрос (список пуст по какой-то другой причине)
   оставляем нейтральным тире, как было. */
function emptyMarketHtml() {
  var q = (marketQuery || '').trim();
  if (!q) return '<div class="empty">\u2014</div>';
  /* Слишком длинный запрос режем, иначе строка раздвинет карточку. */
  var shown = q.length > 18 ? q.slice(0, 18) + '\u2026' : q;
  /* Длительности иконки — случайные, и задаются прямо в разметке:
     ровные значения у соседних элементов читаются как сгенерированная
     анимация. CSS забирает их как --ico-in / --ico-float. */
  var icoIn = (560 + Math.random() * 190).toFixed(0);
  var icoFloat = (5400 + Math.random() * 1700).toFixed(0);
  return '<div class="empty empty-search">' +
    '<svg class="empty-ico" style="--ico-in:' + icoIn + 'ms;--ico-float:' + icoFloat + 'ms" ' +
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>' +
      /* Перечёркнутая линза: «здесь искали, и здесь пусто». */
      '<path d="M7.6 13.4l5.8-5.8"/></svg>' +
    '<b>' + esc(t('search_none')) + '</b>' +
    '<i>' + esc(t('search_none_sub', { q: shown })) + '</i>' +
    '<span class="empty-hint">' + mkSuggestHtml(q) + '</span>' +
    '<button type="button" class="empty-btn" id="search-reset">' + esc(t('search_reset')) + '</button>' +
    '</div>';
}

/* v3: вместо подсказки «попробуйте тикер» — кнопки-тикеры. Сначала те,
   что начинаются с первой буквы запроса (в том числе из других
   категорий), затем популярные. Клик ловит js/v3-market.js по data-sug. */
function mkSuggestHtml(q) {
  var c = (q || '').trim().charAt(0).toLowerCase(), out = [], seen = {};
  function add(a) { if (a && !seen[a.id] && out.length < 4) { seen[a.id] = 1; out.push(a); } }
  if (c) {
    var byCap = ASSETS.slice().sort(function (x, y) { return (RANK[x.id] || 0) - (RANK[y.id] || 0); });
    for (var i = 0; i < byCap.length && out.length < 3; i++) {
      var a = byCap[i];
      if (a.ticker.toLowerCase().charAt(0) === c || assetName(a).toLowerCase().charAt(0) === c) add(a);
    }
  }
  ['bitcoin', 'ethereum', 'solana', 'dogecoin'].forEach(function (id) { add(assetById(id)); });
  return '<span class="em-sug-l">' + esc(t('v3m_try')) + '</span>' + out.map(function (a) {
    return '<button type="button" class="em-sug" data-sug="' + esc(a.ticker) + '">' + esc(a.ticker) + '</button>';
  }).join('');
}

/* Обновить подпись с запросом, НЕ пересоздавая блок «ничего не найдено».
   renderMarketFull на каждый символ делает полный rebuild списка, так что
   без этого лесенка анимаций (иконка + 4 элемента с разными задержками)
   перезапускалась бы на каждую набранную букву.
   Возвращает false, если блока на экране ещё нет — тогда вызывающий
   строит его заново, и анимация входа играет один раз. */
function updateEmptySearchQuery(listEl) {
  var box = listEl && listEl.querySelector('.empty-search');
  if (!box) return false;
  var q = (marketQuery || '').trim();
  if (!q) return false;
  var shown = q.length > 18 ? q.slice(0, 18) + '\u2026' : q;
  /* Обновляем ВСЕ переводимые строки, не только подпись с запросом:
     при смене языка renderMarket тоже идёт по полному rebuild, и без
     этого заголовок/подсказка/кнопка остались бы на старом языке.
     Меняем только textContent существующих узлов — без пересоздания,
     поэтому анимация входа по-прежнему не перезапускается. */
  var b = box.querySelector('b'), sub = box.querySelector('i');
  var hint = box.querySelector('.empty-hint'), btn = box.querySelector('.empty-btn');
  if (b) b.textContent = t('search_none');
  if (sub) sub.textContent = t('search_none_sub', { q: shown });
  if (hint) hint.innerHTML = mkSuggestHtml(q);
  if (btn) btn.textContent = t('search_reset');
  return true;
}

/* Крестик в поле поиска.
   Вход (clearPop) запускается сам — браузер стартует анимацию при смене
   display:none -> flex. Значит главное: не трогать .hidden без нужды.
   Уход — вручную: сначала clearOut (0.2s), и только потом .hidden, иначе
   крестик исчезает рывком — хотя только что сделал дело.
   Переключаем строго на реальном переходе: повторные вызовы с тем же
   состоянием — пустые, поэтому анимация НЕ перезапускается на каждый
   набранный символ. */
var _searchClearTimer = 0;
function showSearchClear(show) {
  var clr = $('#search-clear');
  if (!clr) return;
  var hidden = clr.classList.contains('hidden');
  var hiding = clr.classList.contains('search-clear--out');
  if (show) { if (!hidden && !hiding) return; }   /* уже показан */
  else { if (hidden || hiding) return; }          /* уже скрыт / уходит */
  clearTimeout(_searchClearTimer);
  if (show) {
    /* .hidden снимаем последним: именно none -> flex и запускает clearPop. */
    clr.classList.remove('search-clear--out');
    clr.classList.remove('hidden');
  } else {
    clr.classList.add('search-clear--out');
    _searchClearTimer = setTimeout(function () {
      clr.classList.add('hidden');
      clr.classList.remove('search-clear--out');
    }, 200);
  }
}

/* Сброс поиска. Вынесено отдельно: вызывается и крестиком в поле,
   и кнопкой в пустом состоянии, и по Escape. */
function clearMarketSearch(refocus) {
  marketQuery = '';
  var inp = $('#market-search');
  if (inp) inp.value = '';
  showSearchClear(false); /* крестик уходит анимацией, а не рывком */
  renderMarket(true);
  scrollPagesTop();
  if (refocus && inp) inp.focus();
}

/* Сгенерировать HTML одной строки ассета — DRY между full и incremental. */
function renderAssetRow(a, p, chg, fav) {
  /* v3: тикер и тег в одной строке под именем, совпадение с поиском
     подсвечено, изменение за сутки — плашкой (стили в css/v3-market.css). */
  var q = (marketQuery || '').trim();
  return '<button class="row asset-row' + (fav ? ' fav' : '') + '" data-asset="' + a.id + '">' +
    coinHtml(a) +
    '<span class="grow"><b>' + mkHl(assetName(a), q) + '</b>' +
    '<span class="mk-tkl"><i>' + mkHl(a.ticker, q) + '</i>' + tagFor(a, chg) + '</span></span>' +
    '<canvas class="spark" data-spark="' + a.id + '"></canvas>' +
    '<span class="right"><b class="mono">' + money(p, a.dec) + '</b>' +
    '<i class="mono ' + (chg >= 0 ? 'up' : 'down') + '">' + (chg >= 0 ? '+' : '') + (chg * 100).toFixed(2) + '%</i></span>' +
    '<span class="star-btn' + (fav ? ' on' : '') + '" data-star="' + a.id + '">' +
    '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8z"/></svg></span>' +
    '</button>';
}

/* Подсветка первого совпадения запроса в тексте (<mark>). */
function mkHl(text, q) {
  if (!q) return esc(text);
  var i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
}

/* Запомнить ссылки на строки по data-asset. Вызывается после full rebuild.
   Заодно синхронизируем ценовой снимок flashPrice: свежесобранная строка
   уже показывает актуальную цену, и первый тик не должен давать ложную
   вспышку «изменения». */
function cacheMarketRows() {
  _rowByAsset = {};
  $$('#market-list .asset-row').forEach(function (el) {
    _rowByAsset[el.getAttribute('data-asset')] = el;
    var a = assetById(el.getAttribute('data-asset'));
    if (a) {
      var bEl = el.querySelector('.right b');
      if (bEl) prevPriceText['mkt-' + a.id] = bEl.textContent;
    }
  });
}

/* В не-az сортировках reorderMarketRows не создаёт/удаляет .letter-h
   (он только переставляет .asset-row). Чтобы header «★ Избранное»
   появлялся при первом fav и убирался, когда избранное кончилось —
   вызываем после reorder или смены sortKey через sort-sheet. В az
   хедер всегда строится внутри renderMarketFull, эта функция для
   az ничего не делает (там свой «★ Избранное» внутри группы). */
function syncFavHeader() {
  if (S.sortKey === 'az') return;
  var listEl = $('#market-list');
  if (!listEl) return;
  /* Считаем только видимые строки: поиск может скрыть все избранные,
     хотя в S.favs они есть. В таком случае пустая шапка не нужна. */
  var favRows = listEl.querySelectorAll('.asset-row.fav');
  var firstFav = favRows.length ? favRows[0] : null;
  var firstRegular = listEl.querySelector('.asset-row:not(.fav)');
  var oldFav = listEl.querySelector('.fav-h');
  var oldAll = listEl.querySelector('.market-all-h');
  /* После appendChild строки оказываются после старых хедеров. Надёжнее
     снять обе шапки и поставить заново в правильные места, чем вычислять,
     какая из них уже успела уехать. */
  if (oldFav) oldFav.remove();
  if (oldAll) oldAll.remove();
  if (!firstFav) return;

  var oldCount = oldFav ? oldFav.querySelector('.fav-h-count') : null;
  var countChanged = !oldCount || oldCount.textContent !== String(favRows.length);
  var wrap = document.createElement('div');
  wrap.innerHTML = favHeaderHtml(favRows.length, countChanged);
  /* Счётчик «подпрыгивает» только при реальном изменении числа: шапка
     пересобирается и на живой сортировке каждые ~7 секунд, вечный pop
     на каждом проходе читался бы как мигалка. */
  if (!countChanged) {
    var cnt = wrap.querySelector('.fav-h-count');
    if (cnt) cnt.classList.remove('pop');
  }
  listEl.insertBefore(wrap.firstChild, firstFav);
  if (firstRegular) {
    wrap.innerHTML = marketAllHeaderHtml();
    listEl.insertBefore(wrap.firstChild, firstRegular);
  }
}

/* Incremental reorder: только переставить строки через appendChild
   и обновить цену/изменение. С FLIP-анимацией через CSS transform —
   строки «протаскиваются» со старых позиций на новые. */
function reorderMarketRows(listEl, list, changes, live) {
  /* FLIP — First: запоминаем позиции ДО перестановки. */
  var firstRects = {};
  list.forEach(function (a) {
    var row = _rowByAsset[a.id];
    if (row) firstRects[a.id] = row.getBoundingClientRect();
  });

  /* Last: переставляем в новом порядке и обновляем текст. */
  var frag = document.createDocumentFragment();
  list.forEach(function (a) {
    var row = _rowByAsset[a.id];
    if (!row) return;
    var chg = changes[a.id];
    var p = Engine.live(a, now());
    var pEl = row.querySelector('.right b');
    var chgEl = row.querySelector('.right i');
    if (pEl) {
      var pText = money(p, a.dec);
      V3.flashText(pEl, pText, 0);
      pEl.__pv = p;
      /* Синхронизируем снимок для flashPrice: игрок уже видел эту цену
         до перестановки, вспышка «изменения» была бы ложной. */
      prevPriceText['mkt-' + a.id] = pText;
    }
    if (chgEl) {
      chgEl.textContent = (chg >= 0 ? '+' : '') + (chg * 100).toFixed(2) + '%';
      chgEl.className = 'mono ' + (chg >= 0 ? 'up' : 'down');
    }
    row.classList.toggle('fav', !!S.favs[a.id]);
    /* Звезду обновляем вместе с классом строки: incremental reorder не
       пересоздаёт DOM, и раньше .star-btn.on оставался от прошлого
       рендера. При обычном клике обработчик звезды ставит 'on' сам, но
       при программной установке fav (загрузка стейта, подмена в
       харнессе) звезда не загоралась. Теперь состояние одно. */
    var st = row.querySelector('.star-btn');
    if (st) st.classList.toggle('on', !!S.favs[a.id]);
    frag.appendChild(row);
  });
  listEl.appendChild(frag);

  /* Invert: на каждой строке ставлю transform со смещением
     (newPos - oldPos → инвертированный, чтобы строки «пришли»
     на новые места из старых). Делаю ДО измерения новых позиций.
     Delay по дальности сдвига: перестановка читается волной,
     а не «стадом» — общее время не растёт (кап 60 мс). */
  list.forEach(function (a) {
    var row = _rowByAsset[a.id];
    if (!row) return;
    var newR = row.getBoundingClientRect();
    var oldR = firstRects[a.id];
    if (!oldR) { row.classList.add('flip-mute'); return; }
    var dx = oldR.left - newR.left;
    var dy = oldR.top - newR.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { row.classList.add('flip-mute'); return; }
    /* Живая пересортировка: полоска слева — поднялась строка или опустилась. */
    if (live && Math.abs(dy) > 30) mkMark(row, dy > 0 ? 'mk-rise' : 'mk-fall');
    row.style.transition = 'none';
    row.style.transitionDelay = Math.min(Math.abs(dy) / 8, 60).toFixed(0) + 'ms';
    row.style.transform = 'translate(' + dx.toFixed(2) + 'px, ' + dy.toFixed(2) + 'px)';
  });

  /* Play: на следующем кадре убираю transform, transition из CSS
     плавно «протаскивает» строку на (0,0) = новое место. */
  requestAnimationFrame(function () {
    list.forEach(function (a) {
      var row = _rowByAsset[a.id];
      if (!row) return;
      row.style.transition = '';
      row.style.transform = '';
      row.style.transitionDelay = '';
      /* снимаю mute-флаг после завершения transition */
      setTimeout(function () { row.classList.remove('flip-mute'); }, 380);
    });
  });
}

function updateMarketPrices() {
  var ts = now();
  for (var i = 0; i < ASSETS.length; i++) {
    var a = ASSETS[i];
    var el = _rowByAsset[a.id];
    /* Строка могла исчезнуть между рендером и тиком (поиск/фильтр):
       фолбэк на селектор только в этом редком случае, чтобы не
       держать 200 querySelector каждые 500мс на горячем пути. */
    if (!el || !el.isConnected) {
      el = document.querySelector('#market-list .asset-row[data-asset="' + a.id + '"]');
      if (!el) continue;
      _rowByAsset[a.id] = el;
    }
    var p = Engine.live(a, ts);
    var chg = Engine.change(a, ts);
    var pEl = el.querySelector('.right b');
    var chgEl = el.querySelector('.right i');
    if (!pEl || !chgEl) continue;
    /* v3: вспыхивают только изменившиеся цифры цены. */
    var pTxt = money(p, a.dec);
    if (pTxt !== prevPriceText['mkt-' + a.id]) {
      V3.flashText(pEl, pTxt, pEl.__pv == null ? 0 : (p >= pEl.__pv ? 1 : -1));
      prevPriceText['mkt-' + a.id] = pTxt;
    }
    pEl.__pv = p;
    var cTxt = (chg >= 0 ? '+' : '') + (chg * 100).toFixed(2) + '%';
    if (chgEl.textContent !== cTxt) chgEl.textContent = cTxt;
    var cCls = 'mono ' + (chg >= 0 ? 'up' : 'down');
    if (chgEl.className !== cCls) chgEl.className = cCls;
  }
  /* Живая сортировка: список, отсортированный по изменению/цене/объёму,
     периодически перестраивается FLIP'ом — иначе порядок устаревает,
     пока игрок не тапнет звезду. В az-режиме перестановка запрещена
     (буквенные хедеры), при активном поиске — не беспокоим. */
  if (!marketQuery && S.sortKey !== 'az' && currentTab === 'market' && tickN % 14 === 0) {
    var fresh = getMarketListAndChanges();
    reorderMarketRows($('#market-list'), fresh.list, fresh.changes, true);
    syncFavHeader();
  }
}

function mkMark(el, c) {
  el.classList.remove('mk-rise', 'mk-fall');
  void el.offsetWidth;
  el.classList.add(c);
  clearTimeout(el.__mkm);
  el.__mkm = setTimeout(function () { el.classList.remove(c); }, 1600);
}

/* ------------------------------ Торговля ------------------------------ */

/* Откуда открыли сделку. «Назад» возвращает туда же: со экрана всех
   активов — обратно в него, из ленты новостей — в ленту. */
var tradeReturnTo = 'app-main';

function openTrade(id) {
  tradeAssetId = id;
  tradeReturnTo = (currentScreen === 'scr-assets') ? 'scr-assets'
    : (currentScreen === 'scr-news') ? 'scr-news'
    : 'app-main';
  showScreen('scr-trade', 'right');
  Snd.play('open_coin');
  /* Тихий режим: только подсветить нужную вкладку для возврата.
     Полный setTab давал вторую анимацию въезда страницы поверх
     перехода экрана — визуально «двойной клик». Страница уже отрендерена. */
  setTab(tradeReturnTo === 'scr-assets' ? 'portfolio' : (tradeReturnTo === 'scr-news' ? 'lobby' : 'market'), true);
  renderTrade();
}

function closeTrade() {
  if (typeof Alerts !== 'undefined') Alerts.cancelPick();
  tradeAssetId = null;
  showScreen(tradeReturnTo, 'left');
  /* Тоже тихо: страницу не перерисовываем (цены обновит tick), а анимация
     въезда конфликтовала бы с возвратом экрана. */
  setTab(tradeReturnTo === 'scr-assets' ? 'portfolio' : (tradeReturnTo === 'scr-news' ? 'lobby' : 'market'), true);
  /* Анимация въезда уже проиграла при возврате экрана, поэтому список
     пересобираем без неё. Перерисовка только если избранное реально
     меняли — иначе это лишние 100 строк на каждом возврате. */
  if (marketFavDirty) {
    marketFavDirty = false;
    renderMarket(true, true);
  }
}

/* Тап по затемнению над шторкой графика закрывает её: #app-main под
   шторкой касания не ловит (pointer-events: none), клик приходит в #app. */
(function () {
  var app = document.getElementById('app');
  if (!app) return;
  app.addEventListener('click', function (e) {
    /* Только прямой тап по #app: клик по строке рынка, который шторку
       открыл, всплывает сюда же и не должен её тут же закрыть. */
    if (e.target !== app || !app.classList.contains('sheet-on') || currentScreen !== 'scr-trade') return;
    closeTrade();
  });
  attachSheetDrag(document.getElementById('scr-trade'), document.querySelector('#scr-trade .topbar'), function () {
    if (currentScreen === 'scr-trade') closeTrade();
  });
})();

/* Нижние шторки (.modal > .sheet) смахиваются вниз за шапку. Слушатель
   один на документ: шторки фьючерсов создаются позже main.js. Закрываем
   кликом по собственной кнопке закрытия шторки — у каждой своя логика
   (closeSheet, closeOrder…). Шторки без такой кнопки (окна достижений,
   нового класса) не трогаем. */
(function () {
  var CLOSERS = '#sheet-close, [data-fclose], [data-pclose], [data-xclose], [data-sclose], .sheet-head .icon-btn';
  var st = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || !e.target.closest) return;
    var sheet = e.target.closest('.modal > .sheet');
    if (!sheet || sheet.classList.contains('achm-sheet') || sheet.classList.contains('lvlup-sheet')) return;
    var modal = sheet.parentNode;
    if (modal.classList.contains('modal-out') || !modal.querySelector(CLOSERS)) return;
    if (e.target.closest('button, input, a, select, textarea, summary, details, .seg, .pct-chips, .fs-chips, .fs-lev')) return;
    var head = sheet.querySelector('.sheet-head, .fs-head');
    var limit = head ? head.getBoundingClientRect().bottom + 8 : sheet.getBoundingClientRect().top + 56;
    if (e.clientY > limit || sheet.scrollTop > 2) return;
    st = { sheet: sheet, modal: modal, y: e.clientY, t: Date.now(), dy: 0, id: e.pointerId };
    sheet.style.transition = 'none';
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (!st || e.pointerId !== st.id) return;
    var dy = e.clientY - st.y;
    st.dy = dy > 0 ? dy : dy * 0.2;
    st.sheet.style.transform = 'translateY(' + Math.max(-10, st.dy).toFixed(1) + 'px)';
  }, true);
  function end(e) {
    if (!st || (e && e.pointerId !== st.id)) return;
    var s = st;
    st = null;
    var v = s.dy / Math.max(1, Date.now() - s.t);
    var sheet = s.sheet;
    sheet.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.7, 0.3, 1)';
    if (s.dy > 100 || (s.dy > 36 && v > 0.55)) {
      sheet.classList.add('cs-dragged');
      sheet.style.transform = 'translateY(110%)';
      FX.vibrate(8);
      setTimeout(function () {
        var closer = s.modal.querySelector(CLOSERS);
        if (closer) closer.click();
        setTimeout(function () {
          sheet.classList.remove('cs-dragged');
          sheet.style.transform = '';
          sheet.style.transition = '';
        }, 260);
      }, 200);
    } else {
      sheet.style.transform = '';
      setTimeout(function () { sheet.style.transition = ''; }, 260);
    }
  }
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
})();

function renderTrade() {
  var a = assetById(tradeAssetId);
  if (!a) return;
  resetChartView();
  $('#tr-ticker').textContent = a.ticker;
  $('#tr-name').textContent = assetName(a);
  $('#tr-icon').innerHTML = '<img class="coin-img" src="' + esc(a.img || ('img/coins/' + a.id + '.png')) + '" alt="' + esc(a.ticker) + '" draggable="false">';
  /* Маркет капа и объём — детерминированные по id актива, чтобы не
     «прыгали» между сессиями. Лог-распределение от $50M до $500B, объём
     2-25% от капы — типичный разброс реальных криптобирж. */
  var meta = assetMeta(a);
  $('#tr-cap').textContent = fmtBigMoney(meta.cap);
  $('#tr-vol').textContent = fmtBigMoney(meta.vol);
  $$('.tf-btn').forEach(function (b) {
    var tf = parseInt(b.getAttribute('data-tf'), 10);
    b.classList.toggle('active', tf === tradeTf);
    /* Старшие таймфреймы (5м/15м) — перк ранга Управляющий: без него
       кнопка погашена, тап объясняет тостом. */
    var locked = (tf === 60 || tf === 180) && typeof Ach !== 'undefined' && Ach.tfAllowed && !Ach.tfAllowed();
    b.classList.toggle('is-off', !!locked);
  });
  syncChartType();
  applyAmt();
  updateTradePrices();
  updateTradeToggles();
  /* Плашка скидки на комиссию: скидка может сгореть/появиться, пока
     игрок на экране — обновляем при каждом рендере экрана. */
  renderFeeDisc();
  /* Панель под графиком пересобираем целиком: сменился актив, и кеш
     предыдущего графика к этой вкладке уже не относится. */
  renderDesk(true);
  FX.pulse($('#chart'), 'chart-in', 700); /* график «проявляется» слева направо */
}

/* Синхронизирует кнопки-переключатели в шапке трейда (избранное и
   уведомления) с состоянием. На экране рынка звёзды управляются через
   делегированный обработчик в market-list. */
function updateTradeToggles() {
  var favBtn = $('#tr-fav');
  if (favBtn) favBtn.classList.toggle('on', !!S.favs[tradeAssetId]);
  var bellBtn = $('#tr-bell');
  if (bellBtn) bellBtn.classList.toggle('on', typeof Alerts !== 'undefined' && Alerts.countOn(tradeAssetId) > 0);
}

/* Переключатель «свечи / линия» в шапке графика: aria-pressed по
   S.chartType (его ставит биндинг, читает рендер экрана). */
function syncChartType() {
  $$('#chart-type button').forEach(function (b) {
    b.setAttribute('aria-pressed', b.getAttribute('data-ctype') === S.chartType ? 'true' : 'false');
  });
}

/* Золотое кольцо, расходящееся от кнопки «избранное». Кладём в #fx-layer,
   а не внутрь кнопки: у .icon-btn стоит overflow:hidden (нужен для ripple),
   и кольцо бы обрезалось по границам кнопки. */
function favRing(x, y, size) {
  if (FX.reducedMotion()) return;
  var layer = document.getElementById('fx-layer');
  if (!layer) return;
  var el = document.createElement('span');
  el.className = 'fx-fav-ring';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.setProperty('--fav-dur', (500 + Math.random() * 140).toFixed(0) + 'ms');
  layer.appendChild(el);
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
}


/* ------------------------------ Шит покупки/продажи ------------------------------ */

var sheetMode = null;
var sellPct = 50;
/* Режим шита: «купить/продать сейчас» (рыночный) или «лимитный ордер».
   В лимитном режиме поле ввода цены и срок заменяют/дополняют обычную
   форму; исполнение переносится в tick(), где проверяется условие
   ask<=price (buy) или bid>=price (sell). При выходе из шита режим
   сбрасывается обратно на рыночный. */
var trMode = 'market';
var limitPrice = 0;
/* Комиссия сделки — одна и для рыночных, и для лимитных ордеров.
   Раньше она была только у лимитника: считалось, что рыночный и так
   «платит» спредом (ask/bid). Но спред — это разница между ценами
   покупки/продажи внутри одной монеты, а комиссия — это плата за
   саму транзакцию. Игрок не чувствует их по отдельности, но в обеих
   строках видит одно и то же «1%».
   1% — заметно, но не обидно: за это лимитник бесплатно ждёт нужной
   цены. Процент в подписи больше не дублируется руками: t() берёт
   его из T_VARS['pct'], которую мы ставим ниже. */
/* Базовая комиссия 1%: нулевой порог таблицы очков (Ach.feeRateFor).
   Единственное место с цифрой — все расчёты идут через tradeFeeRate(). */
var TRADE_COMMISSION = 0.01;
/* Фиксированная комиссия сезона/челленджа (см. tradeFeeRate).
   0 — выключена, таблица очков работает как обычно. */
var FEE_FIXED = 0;
/* Единая точка правды по проценту комиссии для всех подписей.
   Округление до 2 знаков, чтобы 0.015 не превратилось в «1.5%»
   с плавающей точкой (0.015*100 = 1.4999999999999998). */
if (typeof setTVar === 'function') {
  setTVar('pct', (Math.round(tradeFeeRate() * 10000) / 100) + '%');
}
/* Скидка на комиссию из колеса удачи (сектор «−N% Комиссия»).
   Живёт в сейве: feeDiscPct — размер скидки в процентах, feeDiscLeft —
   сколько сделок осталось до сгорания. Базовый процент один, скидка
   уменьшает его: −50% от 1% = 0.5%, а не «полпроцента от оборота». */
function tradeFeeRate() {
  /* Фиксированная комиссия сезона/челленджа: пока >0 — одинакова
     у всех, таблица очков и скидка колеса игнорируются. */
  if (typeof FEE_FIXED !== 'undefined' && FEE_FIXED > 0) return FEE_FIXED;
  /* База — из таблицы очков (Ach.feeRateFor), скидка колеса — поверх. */
  var base = TRADE_COMMISSION;
  if (typeof Ach !== 'undefined' && Ach.feeRateFor) {
    try { base = Ach.feeRateFor(Number(S.achPts) || 0); } catch (e) { dbg('tradeFeeRate', e); }
  }
  if (S.feeDiscPct > 0 && S.feeDiscLeft > 0) {
    return base * (1 - S.feeDiscPct / 100);
  }
  return base;
}
/* Подпись «Комиссия (1%)» в шите должна показывать фактический
   процент: выигрыш/сгорание скидки обновляет T_VARS, следующий рендер
   шита подхватит новое значение. */
function refreshFeePctLabel() {
  if (typeof setTVar !== 'function') return;
  var r = tradeFeeRate();
  setTVar('pct', (Math.round(r * 10000) / 100) + '%');
  /* Подпись «Комиссия (1%)» в шите — статичный [data-i18n]-узел:
     applyI18n() переводит его один раз при загрузке, и без этого
     обновления он продолжал показывать старый процент, хотя списывался
     уже скидочный. Обновляем узел руками. */
  var el = document.querySelector('[data-i18n="commission"]');
  if (el) el.textContent = t('commission');
}
/* Сжечь одну скидку после исполненной сделки. Вызывается из pushTrade —
   через неё проходит каждая фактическая сделка (маркет и исполненный
   лимитник). Превью в шите декремент не вызывает: игрок может смотреть
   детали сколько угодно, сделок это не тратит. */
function burnFeeDiscount() {
  if (S.feeDiscPct > 0 && S.feeDiscLeft > 0) {
    S.feeDiscLeft--;
    if (S.feeDiscLeft <= 0) { S.feeDiscLeft = 0; S.feeDiscPct = 0; }
    refreshFeePctLabel();
    renderFeeDisc();
  }
}
/* Плашки скидки: в шите сделки (оба режима — в рыночном строки
   комиссии нет вовсе, без плашки скидку не видно вообще) и на экране
   торговли под кнопками Buy/Sell. textContent + класс — вызов дешёвый,
   можно дёргать из рендеров каждый тик без пересоздания узлов. */
function renderFeeDisc() {
  var on = S.feeDiscPct > 0 && S.feeDiscLeft > 0;
  var txt = '';
  if (on) {
    var ratePct = (Math.round(tradeFeeRate() * 10000) / 100) + '%';
    txt = t('fee_disc_hint', { p: S.feeDiscPct, r: ratePct, n: S.feeDiscLeft });
  }
  [['#tr-fee-disc', '#tr-fee-disc-txt'], ['#tr-fee-strip', '#tr-fee-strip-txt']]
    .forEach(function (pair) {
      var box = $(pair[0]);
      if (!box) return;
      box.classList.toggle('hidden', !on);
      var label = $(pair[1]);
      if (label) label.textContent = txt;
    });
}
/* Допуск при подсветке чипа: 0.05% от рыночной цены, чтобы клик
   «−1%» подсвечивал чип и в том случае, когда пользователь чуть
   поправил цену руками. Меньше — игрок видит «не подсвечен ни
   один», больше — соседние чипы перебивают друг друга. */
var LIMIT_OFFSET_TOL = 0.0005;

/* Переключение «купить/продать сейчас» ↔ «лимитный ордер».
   Меняет: подсветку сегмента, видимость полей лимита, состав строк
   «детали» (цена/лимитная цена/комиссия), подпись кнопки подтверждения.
   При первом входе в limit подставляет текущую рыночную как стартовую
   цену — пользователю не придётся вбивать её руками, чтобы увидеть
   «что будет по текущей». */
function setTrMode(mode) {
  trMode = (mode === 'limit') ? 'limit' : 'market';
  $$('#tr-mode-seg button').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tr-mode') === trMode);
  });
  $('#limit-fields').classList.toggle('hidden', trMode !== 'limit');
  $('#tr-det-price-row').classList.toggle('hidden', trMode === 'limit');
  $('#tr-det-target-row').classList.toggle('hidden', trMode !== 'limit');
  /* Комиссия списывается и на рыночной сделке тоже (см. doBuy), поэтому
     строка видна всегда. Раньше её прятали вне лимита, а renderTradeSheet
     всё равно принудительно раскрывал — игрок видел комиссию, которой
     не было в расчёте. */
  $('#tr-det-commission-row').classList.remove('hidden');
  var a = assetById(tradeAssetId);
  if (trMode === 'limit' && a) {
    /* Стартовая цена: для покупки — ask, для продажи — bid. Это та
       цена, на которую игрок смотрит в «текущая цена», и одновременно
       условие для чипа «Рынок» (offset = 0). Поставив по умолчанию
       её, подсвечиваем чип «Рынок» при первом открытии — игрок
       сразу видит, от какой цены отсчитываются ±% чипы. */
    if (!(limitPrice > 0)) {
      var ts = now();
      limitPrice = (sheetMode === 'buy') ? Engine.ask(a, ts) : Engine.bid(a, ts);
      var inp = $('#tr-limit-price');
      if (inp) inp.value = (limitPrice > 0) ? money(limitPrice, a.dec).replace(/[^\d.,]/g, '') : '';
    }
  }
  if (a) {
    /* sheetMode задаётся только открытым шитом buy/sell. На экране трейда
       (openTrade → renderTrade) он ещё null, и t(null) ронял t() на
       s.indexOf — в i18n.js. Раньше это давало на каждом входе в монету
       исключение и подпись-заглушку «—». Берём сторону из trMode: у
       рыночного режима подпись «Купить/Продать», у лимитного — «Разместить». */
    var _lblSide = (sheetMode === 'buy' || sheetMode === 'sell') ? sheetMode : 'buy';
    $('#confirm-label').textContent = (trMode === 'limit')
      ? t('limit_place')
      : t(_lblSide) + ' ' + a.ticker;
  }
  /* Скользящая «таблетка» под активной кнопкой. Двигаем её ПОСЛЕ
     смены класса, чтобы взять новые координаты. На первом вызове
     (при инициализации) индикатор уже стоит на месте благодаря
     CSS-фолбэку left:2px width:50% — он совпадает с кнопкой
     «Купить сейчас». */
  moveSegIndicator();
  /* Перезапуск анимации появления лимитной секции: снимаем класс,
     форсим reflow, ставим обратно. Без этого повторный клик на
     «Лимитный ордер» не проигрывал бы анимацию — браузер
     оптимизирует и не запускает её на классе, который уже стоит. */
  if (trMode === 'limit') {
    var lf = $('#limit-fields');
    if (lf) { lf.classList.remove('lim-anim'); void lf.offsetWidth; lf.classList.add('lim-anim'); }
  }
  renderTradeSheet();
}

/* Двигает золотой индикатор под активной кнопкой сегмента. Вызывается
   на смену активной кнопки, на ресайз и один раз при инициализации.
   Координаты — в пикселях относительно сегмента, чтобы CSS-transition
   мог плавно «провести» таблетку между кнопками. */
function moveSegIndicator() {
  var seg = $('#tr-mode-seg');
  var ind = $('#tr-seg-indicator');
  if (!seg || !ind) return;
  var active = seg.querySelector('button.active');
  if (!active) return;
  var sr = seg.getBoundingClientRect();
  var ar = active.getBoundingClientRect();
  ind.style.left = (ar.left - sr.left) + 'px';
  ind.style.width = ar.width + 'px';
}

/* Дельта лимита от рынка в процентах и её «цвет»: для покупки
   «ниже рынка» — выгодно (зелёный), для продажи наоборот. */
function limitDeltaInfo(px, refPx, side) {
  if (!(px > 0) || !(refPx > 0)) return null;
  var pct = (px - refPx) / refPx * 100;
  var good = side === 'buy' ? pct <= 0 : pct >= 0;
  return { pct: pct, color: good ? 'up' : 'down' };
}

/* Подсветка чипа «% от рынка»: возвращает offset из текущего списка
   (зависит от стороны — buy/sell), если лимитная цена совпадает с
   рыночной*коэффициентом в пределах допуска. Иначе null — ни один
   чип не активен, потому что игрок ввёл цену руками. */
function activeLimitOffset(px, refPx) {
  if (!(px > 0) || !(refPx > 0)) return null;
  var list = currentLimitList();
  if (!list) return null;
  var off = (px - refPx) / refPx * 100;
  for (var i = 0; i < list.length; i++) {
    if (Math.abs(off - list[i]) <= LIMIT_OFFSET_TOL * 100) return list[i];
  }
  return null;
}

/* Текущий список процентов в зависимости от стороны. На покупке —
   отрицательные (и 0 = «Рынок»), на продаже — положительные. Если
   по какой-то причине в S.limitOffsets мусор — отдаём дефолт. */
function currentLimitList() {
  if (!S.limitOffsets) return [];
  var side = sheetMode === 'sell' ? 'sell' : 'buy';
  var list = S.limitOffsets[side];
  if (!Array.isArray(list) || list.indexOf(0) < 0) return [-5, -2, -1, 0];
  return list;
}

/* Рендер чипов «% от рынка». Содержимое зависит от стороны: для
   покупки — отрицательные проценты и «Рынок», для продажи —
   положительные. Сортируем по возрастанию, чтобы при добавлении
   своего процента он не вставал «в конец» не по порядку. */
function renderLimitPcts() {
  var box = $('#tr-limit-pcts');
  if (!box) return;
  var list = currentLimitList().slice().sort(function (a, b) { return a - b; });
  var html = '';
  for (var i = 0; i < list.length; i++) {
    var off = list[i];
    if (off === 0) {
      html += '<button data-offset="0">' + t('limit_market_chip') + '</button>';
    } else {
      var sign = off > 0 ? '+' : '−';
      /* Цвет задаём КЛАССОМ стороны, а не CSS-селекторами только
         для дефолтных значений. Иначе пользовательский −1.5%
         не попадал ни под [data-offset="-1"], ни под "-2" и
         оставался серым. */
      var offCls = off < 0 ? ' is-buy-off' : ' is-sell-off';
      html += '<button class="' + offCls + '" data-offset="' + off + '">' + sign + Math.abs(off) + '%</button>';
    }
  }
  box.innerHTML = html;
}

/* Попап «настроить проценты». Открывается по ✎, закрывается по
   фону/✕/клику на «По умолчанию». Внутри — список текущих процентов
   с крестиком «удалить» (кроме «Рынок»), инпут для нового и кнопка
   сброса. Список общий для buy/sell: меняется текущая сторона. */
function openLimitEditPopup() {
  var pop = $('#tr-limit-edit-popup');
  if (!pop) return;
  renderLimitEditList();
  pop.classList.remove('hidden');
}
function closeLimitEditPopup() {
  var pop = $('#tr-limit-edit-popup');
  if (pop) pop.classList.add('hidden');
}
function renderLimitEditList() {
  var box = $('#tr-limit-edit-list');
  if (!box) return;
  var list = currentLimitList().slice().sort(function (a, b) { return a - b; });
  var html = '';
  for (var i = 0; i < list.length; i++) {
    var off = list[i];
    if (off === 0) {
      html += '<span class="limit-edit-chip is-fixed">' + t('limit_market_chip') + '</span>';
    } else {
      var sign = off > 0 ? '+' : '−';
      var offCls = off < 0 ? ' is-buy-off' : ' is-sell-off';
      html += '<span class="limit-edit-chip' + offCls + '">' +
              '<span>' + sign + Math.abs(off) + '%</span>' +
              '<button class="limit-edit-chip-x" data-rm="' + off + '" aria-label="Remove">×</button>' +
              '</span>';
    }
  }
  box.innerHTML = html;
}

/* Добавить offset в текущий список стороны. Валидация:
   - buy принимает только ≤ 0, sell только ≥ 0;
   - дробные значения сохраняем как есть (0.5%, −1.5%);
   - 0 уже есть в виде «Рынок» — молча игнорим, чтобы не было двух
     одинаковых чипов;
   - лимит на размер списка (8), чтобы ряд не уехал за экран. */
function addLimitOffset(value) {
  if (!isFinite(value) || value === 0) return false;
  var side = sheetMode === 'sell' ? 'sell' : 'buy';
  if (side === 'buy' && value > 0) return false;
  if (side === 'sell' && value < 0) return false;
  var list = S.limitOffsets[side];
  if (list.indexOf(value) >= 0) return true;
  if (list.length >= 8) return false;
  list.push(value);
  saveState(true);
  return true;
}
function removeLimitOffset(value) {
  if (value === 0) return;
  var side = sheetMode === 'sell' ? 'sell' : 'buy';
  var list = S.limitOffsets[side];
  var i = list.indexOf(value);
  if (i < 0) return;
  list.splice(i, 1);
  saveState(true);
}

/* Когда открыли шит продажи, а позиции ещё нет — детали и подпись
   зависают на пустых значениях. Тихо убираем всё, что зависит от
   позиции, и оставляем кнопку заблокированной. Проверка 'show' была
   мёртвой: openModal ставит 'hidden', а не 'show' — из-за этого при
   исчезнувшей позиции шит оставался со старыми числами. */
function renderSellEmpty() {
  var hint = $('#tr-hint'); if (hint) hint.classList.add('hidden');
  var info = $('#tr-info'); if (info) info.classList.add('hidden');
  $('#tr-amt-value').textContent = '—';
  $('#tr-out-value').textContent = '—';
  var detCommission = $('#tr-det-commission');
  if (detCommission) detCommission.textContent = '—';
  var btn = $('#sheet-confirm'); if (btn) btn.disabled = true;
  var pcts = $('#tr-pcts'); if (pcts) pcts.classList.add('hidden');
  var sl = $('#tr-slider'); if (sl) sl.disabled = true;
}

/* Единый рендер шита для покупки и продажи. Раньше у сторон были
   два параллельных набора полей (#buy-fields / #sell-fields) со своими
   слайдерами и чипами — они расходились по вёрстке и дублировали
   логику. Теперь разметка одна, а отличается только смысл:
   у покупки «вход» — это $ из баланса, у продажи — доля позиции. */
function renderTradeSheet(animate) {
  var a = assetById(tradeAssetId);
  if (!a) return;
  /* Шит закрыт (sheetMode = null) — рисовать нечего. Функция вызывается
     из applyAmt(), а ту зовёт ещё и renderTrade() при входе на ЭКРАН
     монеты, где шита нет. Без этой проверки весь рендер шита падал на
     t(null), оставляя подпись кнопки заглушкой «—» и не досчитывая
     блокировку кнопки. */
  if (sheetMode !== 'buy' && sheetMode !== 'sell') return;
  renderFeeDisc();
  var ts = now();
  var isLimit = trMode === 'limit';
  /* Ссылочная цена: для покупки — ask (по ней реально купим), для
     продажи — bid. В лимитном режиме — это «текущая цена», на
     которую смотрит чип «Рынок». */
  var refPx = (sheetMode === 'buy') ? Engine.ask(a, ts) : Engine.bid(a, ts);
  var px = isLimit ? (limitPrice > 0 ? limitPrice : refPx) : refPx;
  /* Размер сделки и «выход» считаем один раз, чтобы рыночный и
     лимитный пути сходились в деталях и в подписи кнопки. */
  var qty, gross, commission, net;
  if (sheetMode === 'buy') {
    gross = tradeAmt;
    commission = tradeAmt * tradeFeeRate();
    net = tradeAmt - commission;
    /* Монет придёт на сумму за вычетом комиссии — ровно как в doBuy. */
    qty = px > 0 ? net / px : 0;
  } else {
    var pos = S.positions[tradeAssetId];
    if (!pos) { renderSellEmpty(); return; }
    qty = pos.qty * sellPct / 100;
    gross = qty * px;
    commission = gross * tradeFeeRate();
    net = gross - commission;
  }

  /* --- Верхние колонки «сколько / получите» --- */
  if (sheetMode === 'buy') {
    $('#tr-in-lbl').textContent = t('amount');
    $('#tr-in-cur').textContent = '$';
    setTrValue($('#tr-amt-value'), String(tradeAmt), animate);
    var bal = Math.max(0, Math.floor(S.balance));
    $('#tr-avail').textContent = t('available', { x: money(bal, 0) });
    $('#tr-out-value').textContent = fmtQty(qty) + ' ' + a.ticker;
    $('#tr-out-sub').textContent = isLimit
      ? (t('limit_at') + ' ' + money(px, a.dec))
      : ('1 ' + a.ticker + ' = ' + money(px, a.dec));
  } else {
    $('#tr-in-lbl').textContent = t('your_position');
    $('#tr-in-cur').textContent = '';
    setTrValue($('#tr-amt-value'), fmtQty(qty) + ' ' + a.ticker, animate);
    $('#tr-avail').textContent = t('position_total', { x: fmtQty(pos.qty) + ' ' + a.ticker });
    $('#tr-out-value').textContent = money(net); /* доллары — точность 2 знака, не a.dec */
    $('#tr-out-sub').textContent = isLimit
      ? (t('limit_at') + ' ' + money(px, a.dec))
      : ('1 ' + a.ticker + ' = ' + money(px, a.dec));
  }

  /* Комиссия выводится только в «Деталях сделки» ниже. Отдельную
     крупную строку убрали: одинаковая сумма в двух местах выглядела
     так, будто комиссия списывается дважды. */

  /* --- Поле ввода + чипы суммы + слайдер --- */
  if (sheetMode === 'buy') {
    var inp = $('#tr-amt-input');
    if (inp && document.activeElement !== inp) inp.value = tradeAmt;
  }
  /* Подпись над блоком и кнопка «Max» разные по смыслу: у покупки это
     доля баланса в долларах, у продажи — доля позиции в монете. */
  var sizeLbl = $('#tr-size-label');
  if (sizeLbl) sizeLbl.textContent = sheetMode === 'sell' ? t('sell_share') : t('use_balance');
  var maxBtn = $('#tr-amt-max');
  if (maxBtn) {
    maxBtn.textContent = (sheetMode === 'sell')
      ? t('max') + ': ' + fmtQty(pos.qty) + ' ' + a.ticker
      : t('max') + ': ' + money(Math.max(0, Math.floor(S.balance)), 0);
  }
  var pct = (sheetMode === 'sell')
    ? sellPct
    : (S.balance > 0 ? Math.max(0, Math.min(100, tradeAmt / S.balance * 100)) : 0);
  var sl = $('#tr-slider');
  if (sl) { sl.value = sheetMode === 'sell' ? sellPct : Math.round(pct); sl.disabled = false; }
  var activePct = Math.round(pct);
  $$('#tr-pcts button').forEach(function (b) {
    b.classList.toggle('active', parseInt(b.getAttribute('data-pct'), 10) === activePct);
  });
  $('#tr-pcts').classList.remove('hidden');

  /* --- Поля лимита: цена, дельта, чипы «% от рынка» --- */
  var limitHint = $('#tr-limit-current');
  if (limitHint) limitHint.textContent = money(refPx, a.dec);
  var limitInp = $('#tr-limit-price');
  if (limitInp && document.activeElement !== limitInp && isLimit) {
    /* Разрядов столько же, сколько у актива: с money(px, 2) у SHIB (dec 6)
       в поле оказывалось «0.00» — цену нельзя было ни увидеть, ни задать. */
    limitInp.value = money(px, a.dec).replace(/[^\d.,]/g, '');
  }
  /* Дельта от рынка: цвет зависит от стороны, формат — «±X.XX%». */
  var dEl = $('#tr-limit-delta');
  if (dEl) {
    var di = isLimit ? limitDeltaInfo(px, refPx, sheetMode) : null;
    if (di && Math.abs(di.pct) >= 0.005) {
      dEl.textContent = (di.pct > 0 ? '+' : '−') + Math.abs(di.pct).toFixed(2) + '%';
      dEl.className = 'limit-delta shown ' + di.color;
    } else {
      dEl.textContent = '';
      dEl.className = 'limit-delta';
    }
  }
  /* Активный чип «% от рынка»: подсвечиваем, только если лимитная
     цена в пределах допуска от рынка*коэффициента. Иначе все чипы
     серые — игрок ввёл свою цену. Перед подсветкой — рендерим чипы
     по текущему списку (S.limitOffsets для стороны), чтобы
     переключение buy↔sell давало разный набор без перезагрузки
     шита. */
  renderLimitPcts();
  var activeOff = isLimit ? activeLimitOffset(px, refPx) : null;
  $$('#tr-limit-pcts button').forEach(function (b) {
    var off = parseFloat(b.getAttribute('data-offset'));
    b.classList.toggle('active', Math.abs(off - activeOff) < 0.0001);
  });

  /* --- Детали ордера --- */
  $('#tr-det-price-row').classList.toggle('hidden', isLimit);
  if (isLimit) {
    $('#tr-det-target').textContent = money(px, a.dec);
    $('#tr-det-amt-lbl').textContent = sheetMode === 'buy' ? t('amount') : t('your_position');
    $('#tr-det-amt').textContent = sheetMode === 'buy' ? money(tradeAmt, 0) : (fmtQty(qty) + ' ' + a.ticker);
    $('#tr-det-get-lbl').textContent = t('limit_get_at');
    $('#tr-det-get').textContent = sheetMode === 'buy' ? (fmtQty(qty) + ' ' + a.ticker) : money(net);
  } else {
    $('#tr-det-price').textContent = fmtApprox(px, a.dec);
    $('#tr-det-amt-lbl').textContent = sheetMode === 'buy' ? t('amount') : t('your_position');
    $('#tr-det-amt').textContent = sheetMode === 'buy' ? money(tradeAmt, 0) : (fmtQty(qty) + ' ' + a.ticker);
    $('#tr-det-get-lbl').textContent = t('you_receive');
    $('#tr-det-get').textContent = sheetMode === 'buy' ? (fmtQty(qty) + ' ' + a.ticker) : money(net);
  }
  $('#tr-det-commission').textContent = money(commission, 2);
  $('#tr-det-commission-row').classList.remove('hidden');

  /* --- Хинт и раскрывашка: только в лимитном режиме --- */
  var hint = $('#tr-hint');
  var info = $('#tr-info');
  if (isLimit) {
    if (hint) {
      hint.classList.remove('hidden');
      $('#tr-hint-text').innerHTML = t('limit_exec_hint', { t: a.ticker, p: '<b>' + money(px, a.dec) + '</b>' });
      /* Снимаем анимацию, чтобы она перезапустилась при смене цены. */
      hint.style.animation = 'none'; void hint.offsetWidth; hint.style.animation = '';
    }
    if (info) info.classList.remove('hidden');
  } else {
    if (hint) hint.classList.add('hidden');
    if (info) info.classList.add('hidden');
  }

  /* --- Подпись кнопки: «купить/продать N монет» + «разместить» --- */
  var lbl = $('#confirm-label');
  if (isLimit) {
    lbl.textContent = t('limit_place');
  } else {
    lbl.textContent = t(sheetMode === 'sell' ? 'sell' : 'buy') + ' ' + fmtQty(qty) + ' ' + a.ticker;
  }

  /* --- Кнопка: блокируем, если чего-то не хватает --- */
  var btn = $('#sheet-confirm');
  if (isLimit) {
    if (sheetMode === 'buy') {
      btn.disabled = !(limitPrice > 0) || tradeAmt < CONFIG.minTrade || tradeAmt > S.balance;
    } else {
      btn.disabled = !(limitPrice > 0) || sellPct <= 0;
    }
  } else if (sheetMode === 'buy') {
    btn.disabled = tradeAmt < CONFIG.minTrade || tradeAmt > S.balance;
  } else {
    btn.disabled = sellPct <= 0;
  }
}
/* Приблизительная цена для шита: «~» и четыре значащих разряда вместо
   полной точности. Цена идёт непрерывно, и на точном выводе последняя
   цифра мельтешила бы — игрок не успевает прочитать число. «~» честно
   говорит: в сделке будет цена на момент нажатия, а не показанная тут.
   Разрядность подбираем по величине, чтобы копеечные монеты не
   превращались в «$0.00». */
function fmtApprox(v, dec) {
  if (!isFinite(v)) return '—';
  var r = parseFloat(v.toPrecision(4));
  var digits = r >= 1 ? (r >= 1000 ? 0 : 2) : (r >= 0.01 ? 4 : Math.min(dec, 6));
  return '~' + money(r, digits);
}

/* Освежает только то, что зависит от живой цены: цену в деталях и
   «вы получите». Слайдер, чипы и поле ввода не трогаем — иначе набор
   цифры в поле сбрасывался бы каждые полсекунды. */
function refreshTradeSheetPrices() {
  if (!sheetMode) return;
  var a = assetById(tradeAssetId);
  if (!a) return;
  var ts = now();
  if (trMode === 'limit') {
    /* В лимитном режиме расчёт зависит только от лимитной цены и суммы,
       которые не меняются от тика. Обновляем лишь «текущую цену» под
       полем ввода — чтобы игрок видел, насколько его лимит близок к
       рынку. Сама цифра « получите» остаётся стабильной, пока пользователь
       не поправит лимит или сумму. */
    var refNow = (sheetMode === 'buy') ? Engine.ask(a, ts) : Engine.bid(a, ts);
    var hint = $('#tr-limit-current');
    if (hint) hint.textContent = money(refNow, a.dec);
    return;
  }
  if (sheetMode === 'sell') {
    var pos = S.positions[tradeAssetId];
    if (!pos) return;
    var bid = Engine.bid(a, ts);
    var gross = pos.qty * sellPct / 100 * bid;
    /* Показываем сумму НА РУКИ (за вычетом комиссии), а не оборот:
       именно она придёт на баланс. Раньше tick-обновление каждые
       полсекунды затирало честный net из renderTradeSheet на gross —
       игрок видел одну цифру, а получал меньшую. */
    var proceeds = gross * (1 - tradeFeeRate());
    $('#tr-det-price').textContent = fmtApprox(bid, a.dec);
    $('#tr-out-value').textContent = money(proceeds);
    $('#tr-out-sub').textContent = '1 ' + a.ticker + ' = ' + money(bid, a.dec);
    $('#tr-det-get').textContent = money(proceeds);
    syncConfirmQty(a, pos.qty * sellPct / 100);
  } else {
    var ask = Engine.ask(a, ts);
    /* За вычетом комиссии — цифра «получите» должна совпадать с тем,
       что реально придёт в позицию после doBuy. */
    var qty = ask > 0 ? (tradeAmt * (1 - tradeFeeRate())) / ask : 0;
    $('#tr-det-price').textContent = fmtApprox(ask, a.dec);
    $('#tr-out-value').textContent = fmtQty(qty) + ' ' + a.ticker;
    $('#tr-out-sub').textContent = '1 ' + a.ticker + ' = ' + money(ask, a.dec);
    $('#tr-det-get').textContent = fmtQty(qty) + ' ' + a.ticker;
    syncConfirmQty(a, qty);
  }
}

/* Подпись рыночной кнопки «Купить/Продать N монет» — на том же тике, что и
   «Вы получите». Раньше её писал только renderTradeSheet, и через полсекунды
   цифры расходились: в деталях 0.00058314 BTC, на кнопке 0.00058305 BTC. */
function syncConfirmQty(a, qty) {
  var lbl = $('#confirm-label');
  if (!lbl || trMode === 'limit') return;
  lbl.textContent = t(sheetMode === 'sell' ? 'sell' : 'buy') + ' ' + fmtQty(qty) + ' ' + a.ticker;
}

/* Крупная цифра в шите. Прокручиваем только при дискретных прыжках
   (чип, «макс»), иначе цифра дрожит под каждым движением ползунка. */
function setTrValue(el, txt, animate) {
  if (!el) return;
  if (animate && !FX.reducedMotion() && /^[\d\s.,]+$/.test(txt)) {
    var num = parseFloat(txt.replace(/[\s,]/g, ''));
    if (!isNaN(num)) {
      FX.tweenNumber(el, num, { dur: 320, fmt: function (v) { return String(Math.round(v)); } });
      return;
    }
  }
  if (el.__fxNum) { cancelAnimationFrame(el.__fxNum); el.__fxNum = 0; }
  el.textContent = txt;
}

function openSheet(mode) {
  var a = assetById(tradeAssetId);
  if (!a) return;
  sheetMode = mode;
  var icoSrc = a.img || ('img/coins/' + a.id + '.png');
  $('#sheet-ico').src = icoSrc;
  $('#sheet-title').textContent = t(mode + '_sheet_title', { name: assetName(a) });
  /* Та же эмблема и в кнопке: «Купить BTC» читается как одно действие,
     а не как две unrelated надписи. */
  var cIco = $('#confirm-ico');
  if (cIco) cIco.innerHTML = '<img src="' + icoSrc + '" alt="" draggable="false">';
  /* Скрываем только строку ввода долларов — чипы и ползунок нужны и при
     продаже: ими выбирается доля позиции. Раньше прятался весь блок целиком,
     и продать можно было ровно столько, сколько стояло в sellPct (50%). */
  $('#tr-amt-row').classList.toggle('hidden', mode !== 'buy');

  var btn = $('#sheet-confirm');
  btn.className = 'btn big confirm-btn ' + (mode === 'buy' ? 'up' : 'down');
  /* Подписи сегмента зависят от стороны: покупка → «купить сейчас»,
     продажа → «продать сейчас». Лимитные подписи — те же ключи. */
  $('#tr-mode-market').textContent = t(mode === 'buy' ? 'limit_market' : 'limit_sell_market');
  $('#tr-mode-limit').textContent = t(mode === 'buy' ? 'limit_order' : 'limit_sell_order');
  /* Синхронизируем активный сегмент с текущим trMode. Если пользователь
     только что закрыл лимитный ордер и снова открыл шит — режим
     сохраняется, как и в реальных биржах. */
  $$('#tr-mode-seg button').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tr-mode') === trMode);
  });
  $('#limit-fields').classList.toggle('hidden', trMode !== 'limit');
  $('#tr-det-price-row').classList.toggle('hidden', trMode === 'limit');
  $('#tr-det-target-row').classList.toggle('hidden', trMode !== 'limit');
  /* Комиссия списывается и на рыночной сделке тоже (см. doBuy), поэтому
     строка видна всегда. Раньше её прятали вне лимита, а renderTradeSheet
     всё равно принудительно раскрывал — игрок видел комиссию, которой
     не было в расчёте. */
  $('#tr-det-commission-row').classList.remove('hidden');
  /* Лимитная цена СБРАСЫВАЕТСЯ при каждом открытии шита: она
     принадлежит конкретному активу, и «60 000 от биткоина» не должно
     подставляться в Dogecoin (в т.ч. через переключение режима —
     поэтому сброс безусловный). Дефолт в лимитном режиме —
     референсная цена стороны: buy → ask, sell → bid (как в setTrMode
     и в деталях; раньше openSheet брал наоборот, и чип «Рынок» не
     подсвечивался). Формат — по a.dec: у суб-центовых монет
     money(x, 2) давал «0». */
  limitPrice = 0;
  if (trMode === 'limit') {
    limitPrice = (mode === 'buy') ? Engine.ask(a, now()) : Engine.bid(a, now());
    var inp0 = $('#tr-limit-price');
    if (inp0) inp0.value = (limitPrice > 0) ? money(limitPrice, a.dec).replace(/[^\d.,]/g, '') : '';
  }
  /* Кнопка подтверждения: в лимитном режиме — «Разместить ордер»,
     иначе — «Купить/Продать TICKER». */
  $('#confirm-label').textContent = (trMode === 'limit')
    ? t('limit_place')
    : t(mode) + ' ' + a.ticker;

  if (mode === 'buy') {
    if (tradeAmt < CONFIG.minTrade) tradeAmt = CONFIG.minTrade;
    applyAmt();
  } else {
    renderTradeSheet();
  }
  /* Панель под графиком обновляем на каждом открытии шита: пока шит был
     свёрнут, в S.limitOrders могли исполниться ордера из тика. */
  renderDesk(true);
  /* Скользящая «таблетка» под активной кнопкой — ставим в очередь
     кадров, чтобы layout успел обновиться (кнопки ещё не
     перерисованы до этого момента, getBoundingClientRect дал бы
     координаты скрытого модального). */
  setTimeout(moveSegIndicator, 0);
  YaGame.gameplayStop();
  openModal('modal-trade');
}

function closeSheet() {
  if ($('#modal-trade').classList.contains('hidden')) return;
  sheetMode = null;
  closeModal('modal-trade');
  YaGame.gameplayStart();
}

/* Кеш серии свечей для графика трейда. Engine.candles — самая дорогая
   операция на экране (до 240 свечей), но сама серия меняется только
   когда переступается граница свечи текущего таймфрейма. Пересобираем
   по ключу (актив, таймфрейм, длина, номер свечи), а «дышащую»
   последнюю свечу правим каждый кадр от живой цены — визуально
   результат тот же, а работы в разы меньше. */
var _tradeCandleCache = { key: '', data: null };
function tradeCandleSeries(a, total, ts) {
  /* tradeTf — МНОЖИТЕЛЬ свечи (1 = 5 с, см. Engine.CANDLE_MS), а не её длина
     в миллисекундах. С ключом Math.floor(ts / tradeTf) он менялся каждый
     миллисекунд, то есть каждый кадр: кеш не попадал НИКОГДА, и серия
     пересобиралась заново по 50 раз в секунду. Рядом, в bucket для ленты
     сделок, то же самое написано правильно — через Engine.CANDLE_MS. */
  var key = a.id + '|' + tradeTf + '|' + total + '|' + Math.floor(ts / (tradeTf * Engine.CANDLE_MS));
  if (_tradeCandleCache.key !== key || !_tradeCandleCache.data) {
    _tradeCandleCache.key = key;
    _tradeCandleCache.data = Engine.candles(a, total, tradeTf, ts);
  }
  return _tradeCandleCache.data;
}

/* Минимальный интервал между полными перерисовками графика. Цифры цены
   обновляются каждый кадр, тяжёлая часть (серия свечей + canvas) — с
   этой частотой. 50 мс = 20 Гц: движение остаётся живым, но нагрузка
   падает втрое против прежних 60 пересборок серии в секунду. */
var TRADE_DRAW_MS = 50;
var _tradeDrawAt = 0;

function updateTradePrices(force) {
  var a = assetById(tradeAssetId);
  if (!a) return;
  var ts = now();
  var p = Engine.live(a, ts);
  var chg = Engine.change(a, ts);
  var pEl = $('#tr-price');
  flashPrice('trade-' + a.id, pEl, money(p, a.dec), true, true);
  pEl.textContent = money(p, a.dec);
  var chgEl = $('#tr-chg');
  chgEl.textContent = (chg >= 0 ? '+' : '') + (chg * 100).toFixed(2) + '%';
  chgEl.className = 'mono ' + (chg >= 0 ? 'up' : 'down');

  /* force === false — вызов из кадрового цикла, его и троттлим.
     Любой явный вызов (смена таймфрейма, скролл, смена актива)
     приходит без аргумента и рисует немедленно. */
  if (force === false && ts - _tradeDrawAt < TRADE_DRAW_MS) return;
  _tradeDrawAt = ts;

  var total = Math.min(chartMaxBars(), chartView.bars + chartView.offset);
  var data = tradeCandleSeries(a, total, ts);
  var pos = S.positions[tradeAssetId];
  var end = data.length - chartView.offset;
  var view = data.slice(Math.max(0, end - chartView.bars), Math.max(0, end));
  if (chartView.offset === 0 && view.length) {
    /* Последняя свеча «дышит» вместе с живой ценой — график выглядит плавным. */
    var last = view[view.length - 1];
    last.c = p;
    last.h = Math.max(last.h, p);
    last.l = Math.min(last.l, p);
  }
  /* Активные лимитные ордера по текущему активу — для маркеров на чарте.
     Чужие id не передаём: показываем только то, что ждёт исполнения
     именно на этом графике. Берём последние 6, чтобы чарт не зарос. */
  var los = [];
  for (var li = 0; li < S.limitOrders.length && los.length < 6; li++) {
    var lo = S.limitOrders[li];
    if (lo.assetId === tradeAssetId) los.push({ side: lo.side, price: lo.price, qty: lo.qty, amount: lo.amount });
  }
  Chart.draw($('#chart'), view, {
    dec: a.dec,
    type: S.chartType === 'line' ? 'line' : 'candle',
    livePrice: chartView.offset === 0 ? p : null,
    entryPrice: pos ? pos.cost / pos.qty : null,
    limitOrders: los,
    crosshair: chartView.offset === 0 && chartHover >= 0 ? { index: chartHover, y: chartHoverY } : null,
    candles: (typeof Ach !== 'undefined' && Ach.candleStyle) ? Ach.candleStyle() : null,
    yZoom: chartView,
    alerts: (typeof Alerts !== 'undefined') ? Alerts.chartLevels(tradeAssetId) : null
  });
  if (typeof Alerts !== 'undefined') Alerts.afterDraw(chartView.offset === 0 && chartHover >= 0 ? chartHoverY : null);
  updateChartOhlc(view);
  $('#chart-live').classList.toggle('hidden', chartView.offset === 0);
}

/* Строка OHLC над графиком: свеча под курсором или последняя. */
function updateChartOhlc(view) {
  var el = $('#chart-ohlc');
  if (!el) return;
  var a = assetById(tradeAssetId);
  var i = chartHover >= 0 ? chartHover : view.length - 1;
  var c = (i >= 0 && i < view.length) ? view[i] : null;
  if (!c || !a) { el.textContent = ''; return; }
  function f(v) {
    /* money-стиль с узким пробелом: раньше OHLC был «77,605.1» рядом
       с «77 605.1» везде в UI. */
    var s = v.toFixed(a.dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    return parts.join('.');
  }
  /* v3: подписи приглушены, значения жирные, закрытие — цветом свечи. */
  var h = '<span>O <b>' + f(c.o) + '</b></span><span>H <b>' + f(c.h) + '</b></span>' +
    '<span>L <b>' + f(c.l) + '</b></span><span>C <b class="' + (c.c >= c.o ? 'up' : 'down') + '">' + f(c.c) + '</b></span>';
  if (el.__h !== h) { el.innerHTML = h; el.__h = h; }
}

/* Взаимодействия с графиком: перетаскивание, пинч, колесо, перекрестие. */
function initChartInteractions() {
  var canvas = $('#chart');
  var pointers = new Map();
  var pinchDist = 0;
  var pinchDistY = 0;
  var panStart = null;
  /* Кнопки −/+, растяжка оси цен и «Авто». Щипок и перетаскивание
     ниже тоже двигают шкалу цен, когда она в ручном режиме. */
  chartZoom = Chart.zoomUI(canvas, {
    view: chartView,
    getBars: function () { return chartView.bars; },
    setBars: function (n) { chartView.bars = n; clampChartView(); chartHover = -1; chartHoverY = null; },
    redraw: function () { updateTradePrices(); },
    label: { auto: function () { return t('cz_auto'); }, zin: function () { return t('cz_in'); }, zout: function () { return t('cz_out'); } }
  });
  var fling = null;

  /* ---------- Кроссбар по зажатию (mobile) ----------
     Раньше перекрестие на телефоне появлялось только по тапу: нажал —
     получил линию в одной точке, и всё. Теперь работает long-press:
     держишь палец ~320мс — кроссбар «прилипает» и едет за пальцем
     (как в TradingView). Отпустил — линия остаётся на последней
     позиции. Движение до срабатывания таймера = pan/скролл,
     зажатие отменяется. */
  var LONG_PRESS_MS = 320;
  var LONG_PRESS_SLOP = 10;
  var longPressTimer = null;
  var crossDrag = false;

  function cancelLongPress() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }
  function beginCrossDrag(clientX, clientY, pointerId) {
    crossDrag = true;
    chartHover = Chart.hitTest(canvas, clientX);
    chartHoverY = clientY - canvas.getBoundingClientRect().top;
    updateTradePrices();
    FX.vibrate(8); /* тактильный отклик — жест распознан */
    try { canvas.setPointerCapture(pointerId); } catch (err) {}
  }

  /* Единая точка применения offset: округляем и перерисовываем.
     Раньше offset копился дробным и график не перерисовывался при
     жесте — обновлялся только на следующем тике, из-за чего свайп
     выглядел мёртвым. */
  function setOffset(next) {
    next = Math.round(next);
    if (next === chartView.offset) return;
    chartView.offset = next;
    clampChartView();
    chartHover = -1;
    chartHoverY = null;
    updateTradePrices();
  }

  /* Инерция: после отпускания графика он ещё «едет» и плавно тормозит.
     Без этого свайп обрывается резко и ощущается дёрганым.

     Скорость считаем в СВЕЧАХ В СЕКУНДУ, а не «за событие» — иначе при
     пачке pointermove в один кадр (быстрый палец, либо синтетика)
     скорость улетает в космос и график уезжает до упора. */
  var FLING_MAX_VPS = 90;   // предел скорости, свечей/сек
  var FLING_DECAY = 0.96;   // затухание за кадр 16.67 мс
  var FLING_STOP = 0.5;     // порог остановки, свечей/сек

  function stopFling() {
    if (fling) { cancelAnimationFrame(fling); fling = null; }
  }
  function startFling(vps) {
    if (Math.abs(vps) > FLING_MAX_VPS) vps = vps > 0 ? FLING_MAX_VPS : -FLING_MAX_VPS;
    stopFling();
    var last = performance.now();
    var t0 = last;
    fling = requestAnimationFrame(function step(t) {
      var dtms = Math.min(50, Math.max(0, t - last));
      last = t;
      /* Страховка от зависшего цикла: если rAF по какой-то причине
         приходит рывками (фоновая вкладка, виртуальное время),
         флинг всё равно обязан остановиться. */
      if (t - t0 > 2000) { fling = null; return; }
      vps *= Math.pow(FLING_DECAY, dtms / 16.67);
      if (Math.abs(vps) < FLING_STOP) { fling = null; return; }
      var before = chartView.offset;
      setOffset(chartView.offset + vps * dtms / 1000);
      if (chartView.offset === before) { fling = null; return; }
      fling = requestAnimationFrame(step);
    });
  }

  canvas.addEventListener('pointerdown', function (e) {
    stopFling();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      cancelLongPress();
      var pts = [];
      pointers.forEach(function (pt) { pts.push(pt); });
      pinchDist = Math.abs(pts[0].x - pts[1].x) || 1;
      pinchDistY = Math.abs(pts[0].y - pts[1].y) || 1;
      panStart = null;
    } else if (pointers.size === 1) {
      /* Касание НЕ захватываем сразу: сначала надо понять, куда тянет
         пользователь. Вертикальный жест — это скролл страницы, его
         графику забирать нельзя. */
      panStart = {
        x: e.clientX, y: e.clientY, offset: chartView.offset,
        acc: 0, vps: 0, moved: 0, t: Date.now(), lastT: Date.now(), dir: null
      };
      /* Только палец/перо: у мыши перекрестие и так едет за курсором. */
      if (e.pointerType !== 'mouse') {
        var sx = e.clientX, sy = e.clientY, pid = e.pointerId;
        longPressTimer = setTimeout(function () {
          longPressTimer = null;
          beginCrossDrag(sx, sy, pid);
        }, LONG_PRESS_MS);
      }
    }
  });

  canvas.addEventListener('pointermove', function (e) {
    /* Режим кроссбара по зажатию — перекрестие едет за пальцем. */
    if (crossDrag) {
      chartHover = Chart.hitTest(canvas, e.clientX);
      chartHoverY = e.clientY - canvas.getBoundingClientRect().top;
      updateTradePrices();
      return;
    }
    if (!pointers.has(e.pointerId)) {
      /* Наведение мышью — перекрестие по X и Y. */
      chartHover = Chart.hitTest(canvas, e.clientX);
      chartHoverY = e.clientY - canvas.getBoundingClientRect().top;
      return;
    }
    var pt = pointers.get(e.pointerId);
    var dx = e.clientX - pt.x;
    pt.x = e.clientX;
    pt.y = e.clientY;

    /* Палец поехал до срабатывания таймера — это pan или скролл,
       а не зажатие. Отменяем, чтобы кроссбар не выскочил под свайп. */
    if (longPressTimer && panStart &&
        (Math.abs(e.clientX - panStart.x) > LONG_PRESS_SLOP ||
         Math.abs(e.clientY - panStart.y) > LONG_PRESS_SLOP)) {
      cancelLongPress();
    }

    if (pointers.size === 2) {
      var pts2 = [];
      pointers.forEach(function (q) { pts2.push(q); });
      var d = Math.abs(pts2[0].x - pts2[1].x) || 1;
      var dY = Math.abs(pts2[0].y - pts2[1].y) || 1;
      /* Щипок работает по обеим осям: раздвинул пальцы по горизонтали —
         меньше свечей, по вертикали — крупнее шкала цен. */
      if (pinchDist > 0 && pinchDist > 24 && d > 24) {
        chartView.bars = Math.round(chartView.bars * pinchDist / d);
        clampChartView();
      }
      if (pinchDistY > 24 && dY > 24 && chartZoom) chartZoom.zoomY(pinchDistY / dY);
      pinchDist = d;
      pinchDistY = dY;
      if (chartZoom) chartZoom.sync();
      updateTradePrices();
      return;
    }

    if (!panStart) return;
    var tdx = e.clientX - panStart.x;
    var tdy = e.clientY - panStart.y;

    /* Направление фиксируем один раз, когда жест стал заметным. */
    if (panStart.dir === null) {
      if (Math.abs(tdx) < 6 && Math.abs(tdy) < 6) return;
      panStart.dir = (chartZoom && chartZoom.manual()) ? 'xy' : (Math.abs(tdx) > Math.abs(tdy) ? 'x' : 'y');
      if (panStart.dir !== 'y') {
        /* Горизонтальный жест — забираем его себе у скролла страницы. */
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      }
    }
    if (panStart.dir === 'y') return; /* вертикальный — отдаём скроллу */
    /* Шкала цен в ручном режиме: график тянется свободно, по вертикали
       двигается окно цен (touch-action у canvas тогда none, см. .cz-man). */
    if (panStart.dir === 'xy' && chartZoom) {
      var ddy = e.clientY - (panStart.py == null ? panStart.y : panStart.py);
      panStart.py = e.clientY;
      if (ddy) { chartZoom.panY(ddy); panStart.moved += Math.abs(ddy); updateTradePrices(); }
    }

    panStart.moved += Math.abs(dx);
    var dCandles = dx / Chart.cwPx();
    panStart.acc += dCandles;
    /* Скорость для инерции — в свечах в секунду, сглаженная, чтобы
       резкий рывок в конце не уносил график слишком далеко. */
    var nowMs = Date.now();
    var dtSec = Math.max(0.008, (nowMs - panStart.lastT) / 1000);
    panStart.lastT = nowMs;
    panStart.vps = panStart.vps * 0.7 + (dCandles / dtSec) * 0.3;
    setOffset(panStart.offset + panStart.acc);
  });

  function pointerUp(e) {
    cancelLongPress();
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0 && panStart) {
      /* Зажатие отпущено — кроссбар остаётся там, где был палец.
         toggle НЕ делаем, иначе линия мгновенно исчезнет. */
      if (crossDrag) {
        crossDrag = false;
        panStart = null;
        return;
      }
      /* Тап без значимого движения — показать/убрать перекрестие.
         Порог moved<8 и time<400мс (раньше было 6/350 + проверка dir !== 'x'):
         на мобильном палец при тапе часто дрожит на 7-9px по горизонтали,
         из-за чего dir становился 'x' и тап гасился. */
      if (panStart.moved < 8 && Date.now() - panStart.t < 400) {
        var idx = Chart.hitTest(canvas, e.clientX);
        chartHover = (chartHover === idx) ? -1 : idx;
        chartHoverY = chartHover >= 0 ? e.clientY - canvas.getBoundingClientRect().top : null;
        updateTradePrices();
      } else if (panStart.dir !== 'y' && Math.abs(panStart.vps) > 1.5) {
        startFling(panStart.vps);
      }
      panStart = null;
    }
  }
  /* pointercancel (системное прерывание: звонок, уведомление, потеря
     фокуса) — НЕ делаем toggle crosshair, только чистим state. Иначе
     в headless Chrome он приходит сразу после pointerup с теми же
     координатами → повторный «тап» → toggle off, и закреплённый
     crosshair мгновенно пропадает (а в реальности cancel вообще не
     должен трогать hover — пользователь не просил его убирать). */
  function pointerCancel(e) {
    cancelLongPress();
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    crossDrag = false;
    panStart = null;
  }
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerCancel);
  canvas.addEventListener('pointerleave', function (e) {
    /* На мобильном pointerleave приходит почти сразу после pointerup
       (палец убран с canvas) и раньше сбрасывал закреплённый тапом
       crosshair на 1 кадр — пользователь ничего не видел. Для мыши
       оставляем старое поведение: уход курсора с canvas = hover потерян. */
    if (!pointers.has(e.pointerId) && e.pointerType !== 'touch') {
      chartHover = -1;
      chartHoverY = null;
    }
  });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    stopFling();
    /* Колесо — свечи; с Shift/Ctrl или над осью цен — шкала цен. */
    var wf = e.deltaY > 0 ? 1.18 : 1 / 1.18;
    var wg = Chart.geoOf(canvas);
    if (chartZoom && (e.shiftKey || e.ctrlKey || (wg && e.clientX - canvas.getBoundingClientRect().left > wg.plotW))) {
      chartZoom.zoomY(wf);
      chartZoom.sync();
    } else {
      chartView.bars = Math.round(chartView.bars * wf);
      clampChartView();
    }
    updateTradePrices();
  }, { passive: false });

  /* Раньше здесь был dblclick -> resetChartView. При свайпе двойное
     касание срабатывало случайно (быстрый флинг + добивание вторым
     пальцем) и график молча откатывался в «живой» край — читалось
     как фриз. Сброс вида остался только на кнопке Live. */
  $('#chart-live').onclick = resetChartView;
}

/* Количество токенов: столько знаков, сколько нужно (иначе BTC покажет 0.0000). */
function fmtQty(q) {
  var d = q >= 1000 ? 2 : q >= 1 ? 4 : q >= 0.001 ? 6 : 8;
  var s = q.toFixed(d).replace(/\.?0+$/, '');
  return s === '' || s === '-' ? '0' : s;
}

/* FNV-1a 32-bit: детерминированный хеш строки в uint32. Используем для
   генерации маркет капы и объёма, чтобы они были привязаны к id актива
   и не «прыгали» между сессиями. */
function strHash32(s) {
  var h = 2166136261 >>> 0;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/* ---------------- Реальные капа и объём (CoinGecko) ----------------

   Раньше капа и объём считались по хешу от id («лог-распределение
   от $50M до $500B»). Из-за этого сортировка по объёму ВРАЛА:
   BNB (реально на 2−3 месте по объёму) получал случайное число и
   оказывался ниже монет, которые в жизни торгуются на порядок
   тише. Теперь база — настоящие market_cap / total_volume из
   js/data-market.js (снимок CoinGecko, tools/gen_market_data.py),
   а поверх неё живёт игровой объём (см. vol24 ниже). */

var VOL_DAY_MS = 24 * 60 * 60 * 1000;

/* Базовый суточный объём монеты. Для монет с нулевым объёмом
   (стейблкоины, токенизированные фонды) берём 3% от капы — иначе
   в сортировке они вечно внизу с $0, что тоже неправда. */
function baseVol24(a) {
  var m = (typeof MARKET !== 'undefined') ? MARKET[a.id] : null;
  if (m && m.vol > 0) return m.vol;
  var cap = (m && m.cap) || 1e8;
  return Math.round(cap * 0.03);
}

/* Оборот монеты в сутки, выраженный через supply. Снимок даёт только
   точку отсчёта (капа на момент запроса), а цена в игре живёт своей
   жизнью — значит и капа должна за ней идти. supply = cap / цена
   снимка восстанавливается один раз и дальше не меняется: предложение
   монеты — величина постоянная, меняется только цена. */
function assetSupply(a) {
  var m = (typeof MARKET !== 'undefined') ? MARKET[a.id] : null;
  if (m && m.cap > 0 && a.base > 0) return m.cap / a.base;
  /* Фолбэк для монет без снимка — старая синтетика, чтобы экран не падал. */
  return Math.pow(10, 7.7 + (strHash32(a.id + ':cap') / 0xffffffff) * 4.0) / (a.base || 1);
}

/* Капитализация «прямо сейчас»: supply × живая цена. */
function marketCapOf(a) {
  return assetSupply(a) * Engine.live(a, now());
}

/* Всплески объёма от новостей: id -> { mult, started, until }.
   Живут существенно дольше ценового импульса: цена отыгрывает
   новость за полминуты, а объём — это толпа, которая продолжает
   торговать. Держим минуты, иначе эффект не успеть увидеть. */
var volBoost = {};
var VOL_BOOST_MS = 5 * 60 * 1000;

/* Огибающая всплеска: резкий вход и долгий нелинейный спад. Ровная
   симметричная горка читается как сгенерированная кривая. */
function volBoostMult(id, ts) {
  var b = volBoost[id];
  if (!b || b.until <= ts || b.started >= ts) return 1;
  var p = (ts - b.started) / (b.until - b.started);
  var ramp = 0.14;                       /* доля времени на разгон */
  var env = p < ramp ? p / ramp : Math.pow(1 - (p - ramp) / (1 - ramp), 1.7);
  return 1 + (b.mult - 1) * Math.max(0, env);
}

/* Раз в тик проверяем, не вышла ли новость, поднимающая объём.
   volMult > 1 приходит только от «объёмы торгов выросли втрое»
   (последняя строка NEWS.up). Остальные новости тоже разгоняют
   оборот, но слабее — и хорошая, и плохая заставляют рынок
   торговать, плохая даже сильнее. */
function tickNewsVolumes(ts) {
  for (var i = 0; i < ASSETS.length; i++) {
    var a = ASSETS[i];
    var nw = Engine.news(a, ts);
    /* Раньше здесь требовалось nw.active (первые 30 секунд после новости),
       а started брался от момента ПЕРВОГО ТИКА клиента. Отсюда две дыры:
       зашедший на 40-й секунде всплеска не видел, а из офлайна — не
       получал его вовсе; и два игрока в один момент видели разный vol24.
       Теперь окно считается от ВРЕМЕНИ СОБЫТИЯ (nw.t0), поэтому огибающая
       одинакова у всех, а всплеск виден всем, пока он ещё горит. */
    if (!nw || !nw.t0) continue;
    var until = nw.t0 + VOL_BOOST_MS;
    if (ts >= until) continue;
    var b = volBoost[a.id];
    if (b && b.t0 === nw.t0) continue;     /* это же событие уже посчитано */
    /* Объём растёт от ЛЮБОЙ новости, и тем сильнее, чем выше impact.
       Раньше множитель был фиксированным (1.45 вверх / 1.7 вниз) и не
       зависел от важности: «комиссии упали до минимума» (impact 1) и
       «сеть остановилась на два часа» (impact 3) разгоняли оборот
       одинаково, хотя второе — событие на весь день. */
    var impMult = 1 + ((nw.impact || 1) - 1) * 0.35;
    /* Три направления, а не два: у нейтральной новости (dir = 0, тексты
       NEWS.neutral) объём тоже подрастает — событие есть, — но заметно
       слабее. Раньше условие `dir > 0 ? 1.45 : 1.7` записывало нейтральную
       в «вниз», и «спрос и предложение сбалансированы» разгоняло оборот
       как падение рынка. */
    var dirMult = nw.dir > 0 ? 1.45 : (nw.dir < 0 ? 1.7 : 1.15);
    var mult = (nw.volMult > 1 ? nw.volMult : dirMult) * impMult;
    /* Разброс: «втрое» в жизни никогда не значит ровно 3.00. Слот — от
       времени события, а не от момента захода игрока. */
    var slot = Math.floor(nw.t0 / VOL_BOOST_MS);
    var spread = 0.80 + ((a.seed * 17 + slot * 31) % 1000) / 1000 * 0.55;
    volBoost[a.id] = { mult: mult * spread, t0: nw.t0, started: nw.t0, until: until };
  }
}

/* Объём за сутки «прямо сейчас». Модель игровых суток: счётчик
   накапливается с полуночи и сбрасывается, когда сутки кончаются.
   Поверх накопления: своя удача монеты на эти сутки, внутридневная
   кривая активности, реакция на движение цены и новостной всплеск.

   Всё детерминировано от (id, номер суток) — состояния между
   сессиями не копим, перезагрузка не «докачивает» объём. */
function vol24(a) {
  var base = baseVol24(a);
  var t = now();
  var dayNo = Math.floor(t / VOL_DAY_MS);
  var p = (t % VOL_DAY_MS) / VOL_DAY_MS;   /* 0 в полночь, 1 перед следующими сутками */
  /* Накопление: утром счётчик почти пустой, к концу суток выходит
     на настоящий объём CoinGecko. Не от нуля — у монеты всегда есть
     остаток вчерашнего оборота, иначе первые минуты суток выглядели
     бы мёртвыми. */
  var acc = 0.12 + 0.88 * p;
  /* Своя удача на сутки: одна и та же монета в разные дни торгует
     по-разному, поэтому порядок в сортировке по объёму не застывает.
     Середина диапазона — ровно 1.0, чтобы сутки в среднем давали
     настоящий объём, а не число, от него отъехавшее. */
  var h = ((a.seed * 31 + dayNo * 7919) % 1000) / 1000;
  var noise = 0.78 + h * 0.44;             /* 0.78 .. 1.22 */
  /* Внутридневная кривая: утро тише, вечер активнее. Малая амплитуда
     (±12%) — основную форму даёт накопление. */
  var intraday = 1.0 + 0.12 * Math.sin((p - 0.28) * Math.PI * 2);
  /* Движение цены разгоняет оборот — но важно не абсолютное
     изменение, а насколько оно необычно для ЭТОЙ монеты. Сравнивать
     в лоб нельзя: у спокойного BTC σ за сутки около 2%, у дикого
     мемкоина — под 12%, и при прямой формуле объёмы альтов
     систематически раздувались бы относительно мейджоров (SOL
     уезжал в 1.7× от базы, BTC оставался в 0.86×). Берём z-оценку. */
  var sigma = Math.max(1e-6, (a.vol || 0.003) * 0.55 * 17); /* 0.55 — VOL_SCALE движка, 17 ≈ √288 */
  var z = Math.abs(Engine.change(a, t)) / sigma;
  var move = 0.90 + Math.min(0.55, z * 0.20);
  return Math.max(1, Math.round(base * acc * noise * intraday * move * volBoostMult(a.id, t)));
}

/* Маркет капа и текущий объём за сутки. */
function assetMeta(a) {
  var cap = CAPLIVE[a.id] || marketCapOf(a);
  if (cap > 0) return { cap: cap, vol: vol24(a) };
  /* Фолбэк: если монеты нет в MARKET — старая синтетика,
     чтобы экран не падал. */
  var h1 = strHash32(a.id + ':cap');
  var capExp = 7.7 + (h1 / 0xffffffff) * 4.0;
  var c2 = Math.pow(10, capExp);
  return { cap: c2, vol: Math.round(c2 * 0.08) };
}

/* Короткое форматирование больших сумм: $1.56 трлн, $22.96 млрд.
   Суффиксы — из i18n (в русской локали русские сокращения). */
function fmtBigMoney(v) {
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + ' ' + t('big_t');
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + ' ' + t('big_b');
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + ' ' + t('big_m');
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + ' ' + t('big_k');
  return '$' + Math.round(v);
}

function setAmt(v) {
  var maxAmt = Math.max(0, Math.floor(S.balance));
  if (v === 'max') {
    tradeAmt = Math.max(CONFIG.minTrade, maxAmt);
  } else {
    tradeAmt = Math.min(tradeAmt + v, maxAmt);
  }
  applyAmt(v === 'max');
}

/* Синхронизирует поле ввода, «Max» и весь рендер шита.
   animate — прокрутить цифру (для дискретных прыжков по чипам).
   Вся отрисовка уехала в renderTradeSheet: держать её здесь значило
   бы править расчёты в двух местах при каждом изменении суммы. */
function applyAmt(animate) {
  var bal = Math.max(0, Math.floor(S.balance));
  var inp = $('#tr-amt-input');
  if (document.activeElement !== inp) inp.value = tradeAmt;
  $('#tr-amt-max').textContent = t('max') + ': ' + money(bal, 0);
  renderTradeSheet(animate);
}

function doBuy() {
  var a = assetById(tradeAssetId);
  /* Актив мог исчезнуть из каталога (сейв со старым id) — без этой
     проверки Engine.ask(a) падал бы с TypeError. */
  if (!a) { closeSheet(); return; }
  var amt = tradeAmt;
  var btn = $('#sheet-confirm');
  if (amt < CONFIG.minTrade) { toast(t('insufficient', { x: money(CONFIG.minTrade, 0) })); FX.nudge(btn); return; }
  var ask = Engine.ask(a, now());
  if (amt > S.balance) { toast(t('insufficient_balance', { x: money(S.balance, 0) })); FX.nudge(btn); return; }
  /* Комиссия уменьшает КОЛИЧЕСТВО монет, а не висит отдельной цифрой:
     на amt долларов покупается (amt − комиссия) по цене ask. Цена ask
     уже включает спред, поэтому итоговый баланс, позиция и P&L
     согласованы, а сразу после покупки позиция честно показывает
     небольшой минус (спред + комиссия входа).
     Раньше commission считалась и попадала в историю, но ни списание,
     ни позиция её не использовали: покупка была фактически бесплатной,
     а миграция v4 при этом считала, что комиссия сидит в себестоимости. */
  var commission = amt * tradeFeeRate();
  var net = amt - commission;
  var qty = ask > 0 ? net / ask : 0;
  S.balance -= amt;
  var pos = S.positions[a.id];
  if (!pos) S.positions[a.id] = { qty: 0, cost: 0 };
  S.positions[a.id].qty += qty;
  /* Себестоимость — ВСЯ списанная сумма вместе с комиссией: деньги
     ушли со счёта полностью, и P&L обязан это отражать. Монет при
     этом пришло на (amt − комиссия) — см. расчёт qty выше. */
  S.positions[a.id].cost += amt;
  S.tradesCount++;
  var tsB = Date.now();
  pushTrade('buy', a, qty, ask, amt, null, commission, 'market');
  /* Рыночная покупка — тоже ордер, просто исполненный мгновенно. Без
     записи в истории вкладка «История ордеров» выглядела бы так, будто
     игрок торговал одними лимитниками. */
  pushOrderHistory({
    id: 'mo_' + tsB + '_' + Math.random().toString(36).slice(2, 7),
    assetId: a.id, side: 'buy', kind: 'market', price: ask,
    amount: amt, qty: qty, gross: amt, fee: commission, net: net,
    status: 'filled', createdAt: tsB, closedAt: tsB, fillPrice: ask
  });
  /* Покупка — ступенька на кривой «за всё время»: деньги ушли в актив.
     Снимок форсируем, не дожидаясь минутного интервала, и только потом
     сохраняем — иначе новый pfHistory ещё не попадёт в облачный сейв. */
  pushPfSnapshot(true);
  saveState(true);
  renderDesk(true);
  var coinSrc = a.img || ('img/coins/' + a.id + '.png');
  var from = FX.center(btn);
  var qtyTxt = fmtQty(qty) + ' ' + a.ticker;
  /* Монеты из кнопки летят в иконку монеты в шапке — «попали в портфель». */
  Snd.play('buy');
  tradeFinish(btn, t('toast_buy', { x: fmtQty(qty), t: a.ticker }), '', 'up', function () {
    /* Тост — вместе с закрытием шторки (концепт): пока итог на кнопке, он не дублирует его. */
    toast(t('toast_buy', { x: fmtQty(qty), t: a.ticker }), 'ok', { img: coinSrc });
    var icon = $('#tr-icon');
    FX.fly(from, icon, { img: coinSrc, count: 6, size: 26, onHit: function () {
      tradeIconHit(icon, '+' + qtyTxt, 'up');
      FX.pulse(document.querySelector('#desk-tabs .desk-badge[data-badge="positions"]'), 'bump', 520);
    } });
  });
  /* Эффекты сделки — ПОСЛЕ того, как шит доиграет закрытие (195мс + запас).
     Раньше красная/золотая кромка-вспышка (fx-edge, слой выше модалки)
     накладывалась на полупрозрачный уходящий шит: игрок видел вместо
     кнопки красный «квадрат» на месте сделки. Поэтому всё движение —
     в tradeFinish, после закрытия шита. */
  renderLobby();
}

function doSell(pct) {
  var a = assetById(tradeAssetId);
  if (!a) { closeSheet(); return; }
  /* Кнопка блокируется при sellPct <= 0, но сама функция не проверяла
     процент: продажа на 0 монет всё равно создавала запись сделки,
     увеличивала счётчики и сжигала скидку комиссии через pushTrade. */
  if (!(pct > 0)) return;
  var pos = S.positions[a.id];
  /* Позиция могла исчезнуть, пока шит был открыт (исполнился лимитный
     sell на 100%). Раньше был молчаливый return — кнопка «не работала»
     без объяснений. Теперь честный тост и закрытие мёртвого шита. */
  if (!pos) {
    toast(t('position_gone', { t: a.ticker }));
    closeSheet();
    renderDesk(true);
    return;
  }
  var f = pct / 100;
  var bid = Engine.bid(a, now());
  var qty = pos.qty * f;
  var gross = qty * bid;
  var costPart = pos.cost * f;
  var commission = gross * tradeFeeRate();
  var net = gross - commission;
  var pnl = net - costPart;
  S.balance += net;
  S.realized += pnl;
  if (pnl > 0) S.wins++;
  /* Продажа — тоже сделка для счётчика: без этого market-sell выпадал
     из tradesCount (лимитный считал), винрейт завышался, а после
     перезагрузки clamp в loadState резал wins под заниженный счётчик. */
  S.tradesCount++;
  S.sellsCount++;
  pos.qty -= qty;
  pos.cost -= costPart;
  if (pos.qty < 1e-9) delete S.positions[a.id];
  var tsS = Date.now();
  /* В историю пишем ОБОРОТ (gross), а не то, что пришло на руки:
     комиссию показываем отдельной подписью. Иначе цифра «сколько
     получил» расходится с «qty × цена», и игрок думает, что его
     обсчитали дважды. net уходит на баланс, в историю — gross. */
  pushTrade('sell', a, qty, bid, gross, pnl, commission, 'market');
  pushOrderHistory({
    id: 'mo_' + tsS + '_' + Math.random().toString(36).slice(2, 7),
    assetId: a.id, side: 'sell', kind: 'market', price: bid,
    amount: gross, qty: qty, gross: gross, fee: commission, net: net, pnl: pnl,
    status: 'filled', createdAt: tsS, closedAt: tsS, fillPrice: bid
  });
  /* Продажа — самый важный снимок: здесь реализованный P&L переезжает
     в баланс. Без форса кривая «за всё время» потеряла бы этот скачок. */
  pushPfSnapshot(true);
  saveState(true);
  renderDesk(true);
  var btn = $('#sheet-confirm');
  var sold = t('toast_sell', { x: fmtQty(qty), t: a.ticker, p: fmtSigned(pnl) });
  var cut = sold.indexOf('. ');
  var soldTitle = cut > 0 ? sold.slice(0, cut) : sold;
  var pnlTxt = fmtSigned(pnl);
  var sellFrom = FX.center(btn);
  Snd.play(pnl >= 0 ? 'sell_profit' : 'sell_loss');
  tradeFinish(btn, soldTitle, pnlTxt, pnl >= 0 ? 'up' : 'down', function () {
    toast(soldTitle, pnl >= 0 ? 'ok' : 'bad', { img: a.img || ('img/coins/' + a.id + '.png'), sub: cut > 0 ? sold.slice(cut + 2) : '' });
    var icon = $('#tr-icon');
    tradeIconHit(icon, pnlTxt, pnl >= 0 ? 'up' : 'down', true);
    /* Выручка монетками летит в «Купить», где показан свободный баланс (концепт). */
    var cashBtn = $('#buy-btn');
    if (cashBtn) FX.fly(sellFrom, cashBtn, { count: 6, size: 20, onHit: function () {
      var c = FX.center(cashBtn);
      FX.floatText(c.x, c.y - 10, '+' + money(net), 'up fx-float--pill');
      FX.pulse(cashBtn, 'bump', 520);
    } });
  });
  /* Эффекты — после закрытия шита: кромка-вспышка не должна накладываться
     на полупрозрачный уходящий шит (см. комментарий в doBuy). */
  renderLobby();
}

/* Итог сделки прямо на кнопке: галочка и «Куплено …», через полсекунды
   шит закрывается и зовётся after — полёт монет и реакция шапки. Пока
   кнопка в состоянии is-done, повторные тапы игнорируются. */
var TRADE_DONE_MS = 560;
function tradeFinish(btn, text, sub, tone, after) {
  var ms = FX.reducedMotion() ? 0 : TRADE_DONE_MS;
  if (btn && ms) {
    var o = btn.querySelector('.cf-done');
    if (!o) {
      o = document.createElement('span');
      o.innerHTML = '<span class="cf-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg></span>' +
        '<span class="cf-txt"><b></b><i></i></span>';
      btn.appendChild(o);
    }
    o.className = 'cf-done ' + (tone || 'up');
    o.querySelector('b').textContent = text;
    var subEl = o.querySelector('i');
    subEl.textContent = sub || '';
    subEl.classList.toggle('hidden', !sub);
    btn.classList.remove('is-done');
    void btn.offsetWidth;
    btn.classList.add('is-done');
    FX.vibrate(10);
  }
  setTimeout(function () {
    closeSheet();
    setTimeout(function () {
      if (btn) btn.classList.remove('is-done');
      if (after) { try { after(); } catch (e) { dbg('tradeFinish', e); } }
    }, ms ? 180 : 0);
  }, ms);
}

/* Реакция иконки монеты в шапке: «глоток», вспышка, всплывающая сумма. */
function tradeIconHit(icon, text, kind, out) {
  if (!icon) return;
  var pt = FX.center(icon);
  FX.pulse(icon, out ? 'gulp-out' : 'gulp', 640);
  FX.burst(pt.x, pt.y, out ? { kind: 'paper', count: 14, spread: 90 } : { kind: 'coin', count: 10, spread: 60 });
  FX.floatText(pt.x, pt.y, text, kind + ' fx-float--pill');
  if (out) FX.edgeFlash(kind === 'down' ? 'down' : 'up');
  FX.vibrate(out ? [14, 42, 24] : [10, 30, 16]);
}

/* Максимум записей в истории сделок. 40 — потому что вкладка живёт
   под графиком на телефоне: scrolling на сорок карточек уже утомляет,
   а сейв при этом остаётся килобайтным. */
var TRADE_HISTORY_MAX = 40;
/* То же для истории ордеров: запись тяжелее (там и статус, и две даты),
   поэтому держим сопоставимый запас. */
var ORDER_HISTORY_MAX = 60;

/* side — buy | sell, price — цена сделки, total — оборот ДО комиссии
   (gross), pnl — только у продажи (у покупки null), fee — удержанная
   комиссия, kind — market | limit. fee/kind добавлены позже: у старых
   записей их нет, и рендер это учитывает (строку комиссии просто не
   показывает). Раньше у sell в total лежал net — из-за этого сумма
   в истории не билась с «qty × цена». */
function pushTrade(side, a, qty, price, total, pnl, fee, kind) {
  var ts = Date.now();
  S.trades.unshift({
    /* tid — для клика по строке истории: по нему модалка находит
       запись. Раньше привязывались к индексу, но список перестраивается
       на каждом тике, и индекс уезжал. */
    tid: 'tr_' + ts + '_' + Math.random().toString(36).slice(2, 7),
    t: ts, side: side, id: a.id, qty: qty, price: price, total: total,
    pnl: pnl != null ? pnl : null,
    fee: fee != null ? fee : null,
    kind: kind || 'market'
  });
  if (S.trades.length > TRADE_HISTORY_MAX) S.trades.length = TRADE_HISTORY_MAX;
  /* Сделка реально исполнена — сжигаем одну скидку на комиссию, если
     она была. Именно здесь, а не в doBuy/doSell: лимитники исполняются
     в своём цикле и тоже проходят через pushTrade. */
  burnFeeDiscount();
  /* Достижения: единая точка всех исполнений (маркет + лимитки, обе
     стороны). Статистику, события и тост колокольчика разбирает
     модуль Ach.onTrade — здесь только один вызов. */
  if (typeof Ach !== 'undefined') { try { Ach.onTrade(side, a, qty, price, total, pnl, fee, kind); } catch (e) { dbg('pushTrade', e); } }
}

/* Служебная запись награды колеса в истории сделок. НЕ сделка: в
   списках истории она не рисуется, статистику wins/tradesCount не
   трогает и комиссию не сжигает. Нужна только реплеям графиков —
   balance/qty восстанавливаются из S.trades, и выигрыш обязан быть
   частью этой истории, иначе кривая капитала показывала приз
   скачком на последней точке, а кривая PnL — совсем его теряла.
   id = null у денежного приза (влия только на баланс), у крипты —
   id монеты с qty и номиналом в total. */
function pushSpinRewardRecord(sec, res) {
  if (!res || (res.kind !== 'usd' && res.kind !== 'crypto')) return;
  var ts = Date.now();
  S.trades.unshift({
    tid: 'rw_' + ts + '_' + Math.random().toString(36).slice(2, 7),
    t: ts,
    side: 'reward',
    id: res.kind === 'crypto' ? (sec && sec.id) || null : null,
    qty: res.kind === 'crypto' ? (res.qty || 0) : 0,
    price: 0,
    total: res.usd || 0,
    pnl: null,
    fee: 0,
    kind: 'reward'
  });
  if (S.trades.length > TRADE_HISTORY_MAX) S.trades.length = TRADE_HISTORY_MAX;
}

/* Новая запись в историю ордеров. Свежие сверху — в панели под графиком
   читают сверху вниз, и недавний ордер должен быть первым. */
function pushOrderHistory(rec) {
  S.orderHistory.unshift(rec);
  if (S.orderHistory.length > ORDER_HISTORY_MAX) S.orderHistory.length = ORDER_HISTORY_MAX;
}

/* Закрыть запись истории: исполнен или отменён. Ищем по id ордера —
   он же id записи, поэтому дополнительного соответствия не нужно.
   Отсутствующая запись (например, из сейва старее истории) — не ошибка:
   просто закрывать нечего. */
function closeOrderHistory(id, status, fillPrice, details) {
  for (var i = 0; i < S.orderHistory.length; i++) {
    if (S.orderHistory[i].id !== id) continue;
    S.orderHistory[i].status = status;
    S.orderHistory[i].closedAt = Date.now();
    if (fillPrice != null) S.orderHistory[i].fillPrice = fillPrice;
    /* Детали фактического исполнения: qty, gross, fee, net. Для старых
       записей их нет — модалка аккуратно считает то, что можно, из
       amount/qty/price. */
    if (details && typeof details === 'object') {
      Object.keys(details).forEach(function (k) {
        if (details[k] != null) S.orderHistory[i][k] = details[k];
      });
    }
    return;
  }
}

/* ------------------------------ Лимитные ордера ------------------------------ */

/* Разместить лимитный ордер. Баланс и позиция НЕ резервируются
   на размещении: иначе игрок видит, как «проседает» уровень и
   индикаторы прогресса каждый раз, когда ставит ордер. Валидируем
   только, что средств/монет хватит — этого достаточно, чтобы не
   получить перерасход: реальное списание происходит в момент
   исполнения (tickLimitOrders()), где мы ещё раз проверяем, что
   деньги или qty на месте (игрок мог потратить их маркет-ордером
   между размещением и исполнением лимитки). При отмене отдавать
   нечего: средства и так не были списаны. Исполнение — по своей
   цене (без спреда), комиссия — из суммы сделки. */
function placeLimitOrder() {
  var a = assetById(tradeAssetId);
  if (!a) return;
  /* Шит уже закрыт — второй клик по кнопке (дабл-клик) пришёл бы сюда
     повторно, а side считается как `sheetMode === 'buy' ? 'buy' : 'sell'`,
     то есть при sheetMode = null ордер молча ушёл бы ПРОДАЖЕЙ. */
  if (sheetMode !== 'buy' && sheetMode !== 'sell') return;
  var btn = $('#sheet-confirm');
  var px = limitPrice;
  if (!(px > 0)) { FX.nudge(btn); return; }
  /* Лимит открытых лимиток — из рангов коллекционера (база 3).
     Открытые сверх лимита (со старых версий) не трогаем — режем
     только новые размещения. */
  var limCap = 3;
  if (typeof Ach !== 'undefined' && Ach.maxLimits) {
    try { limCap = Ach.maxLimits(); } catch (e) { dbg('placeLimitOrder', e); }
  }
  if (S.limitOrders.length >= limCap) {
    toast(t('ach_limits_full', { n: limCap }));
    FX.nudge(btn);
    return;
  }

  /* id из времени + случайного хвоста, а не из счётчика с единицы:
     счётчик не сохраняется в сейв, и после перезагрузки новый ордер
     получал номер уже существующего — отмена и исполнение начинали
     править чужие записи. */
  var order = {
    id: 'lo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    assetId: a.id,
    side: sheetMode === 'buy' ? 'buy' : 'sell',
    price: px,
    createdAt: Date.now()
  };

  if (sheetMode === 'buy') {
    var amt = tradeAmt;
    if (amt < CONFIG.minTrade) { toast(t('insufficient', { x: money(CONFIG.minTrade, 0) })); FX.nudge(btn); return; }
    if (amt > S.balance) { toast(t('insufficient_balance', { x: money(S.balance, 0) })); FX.nudge(btn); return; }
    /* Средства НЕ резервируем на размещении: игрок должен видеть
       свой полный баланс, пока лимитка висит, иначе индикаторы
       уровня/прогресса «проседают» каждый раз, когда он ставит
       ордер. Баланс и позиция списываются в момент исполнения — см.
       tickLimitOrders(). qty пишем заранее по цене ордера: иначе
       openOrderDetail() не сможет показать в hero, сколько монет
       заявлено (восстанавливать из amount / px — костыль). */
    order.amount = amt;
    /* qty по той же модели, что и рыночная покупка: комиссия
       уменьшает количество монет, а не списывается отдельно. */
    order.qty = px > 0 ? (amt * (1 - tradeFeeRate())) / px : 0;
  } else {
    var pos = S.positions[a.id];
    if (!pos) return;
    var f = sellPct / 100;
    var qty = pos.qty * f;
    if (qty <= 0 || qty > pos.qty) { FX.nudge(btn); return; }
    var costPart = pos.cost * f;
    order.qty = qty;
    order.costPart = costPart;
    /* qty и costPart остаются в позиции до исполнения. */
  }

  /* Взвод. Если цена уже стоит «по нужную сторону» лимита (для покупки
     — ask уже ниже целевой), ордер НЕ исполняется сразу: он должен
     дождаться, пока рынок уйдёт за уровень и вернётся к нему. Иначе
     лимитник превращался в отложенный маркет-ордер: поставил «купить
     по 82 000», когда цена 81 940, — и получил сделку по 82 000 на
     месте, хотя хотел именно отката. */
  order.armed = !orderHit(order, orderRef(a, order, now()));

  S.limitOrders.push(order);
  Snd.play('limit_place');
  /* В истории тот же id: по нему запись закроется при исполнении или
     отмене. Пока ордер висит, статус open. */
  pushOrderHistory({
    id: order.id,
    assetId: a.id, side: order.side, kind: 'limit', price: px,
    amount: order.amount, qty: order.qty, status: 'open', createdAt: order.createdAt
  });
  if (typeof Ach !== 'undefined') { try { Ach.emit('limit:placed', { id: order.id, assetId: a.id, side: order.side, price: px }); } catch (e) { dbg('placeLimitOrder', e); } }
  saveState(true);
  var from = FX.center(btn);
  toast(t('trade_limit_done') + ' \u00B7 ' + money(px, a.dec), 'gold');
  tradeFinish(btn, t('trade_limit_done'), money(px, a.dec), 'gold', function () {
    var tab = document.querySelector('#desk-tabs .desk-tab[data-desk="orders"]');
    var r = tab && tab.getBoundingClientRect();
    var onScreen = r && r.top > 0 && r.bottom < window.innerHeight;
    FX.fly(from, onScreen ? tab : $('#tr-icon'), { count: 3, size: 16, onHit: function () {
      FX.pulse(document.querySelector('#desk-tabs .desk-badge[data-badge="orders"]'), 'bump', 520);
      FX.vibrate(10);
    } });
  });
  renderDesk();
}

/* По какой цене ордер смотрит на рынок: покупка ориентируется на ask
   (ровно по ней и покупаем), продажа — на bid. */
function orderRef(a, o, ts) {
  return o.side === 'buy' ? Engine.ask(a, ts) : Engine.bid(a, ts);
}

/* Условие исполнения: buy — ask опустился до цены или ниже;
   sell — bid поднялся до цены или выше. */
function orderHit(o, ref) {
  if (!(ref > 0)) return false;
  return o.side === 'buy' ? ref <= o.price : ref >= o.price;
}

/* Отменить активный ордер: убрать запись и закрыть её в истории
   со статусом cancelled. Поскольку при размещении мы НЕ резервируем
   ни баланс, ни позицию (см. placeLimitOrder и комментарий там),
   отмена простая — нечего возвращать. Раньше здесь восстанавливали
   S.balance и S.positions[].qty/cost, потому что они списывались
   сразу на размещении; теперь этого нет. */
function cancelLimitOrder(id) {
  var i = -1;
  for (var k = 0; k < S.limitOrders.length; k++) {
    if (S.limitOrders[k].id === id) { i = k; break; }
  }
  if (i < 0) return;
  S.limitOrders.splice(i, 1);
  closeOrderHistory(id, 'cancelled', null);
  Snd.play('order_cancel');
  if (typeof Ach !== 'undefined') { try { Ach.emit('limit:cancelled', { id: id }); } catch (e) { dbg('cancelLimitOrder', e); } }
  saveState(true);
  /* Тоста намеренно нет: строка ордера исчезает на глазах, и дублировать
     это всплывающим сообщением нечего. */
  renderDesk();
}

/* Исполнить подходящие лимитные ордера. Вызывается из тика раз в
   500 мс. Условия:
   buy: ask <= price  — покупаем по ТЕКУЩЕЙ ask (она не хуже лимита:
        если рынок ушёл ниже, игрок получает лучшие условия, как на
        настоящей бирже), комиссия из суммы, монеты на полную сумму
   sell: bid >= price — продаём по ТЕКУЩЕМУ bid (не хуже лимита),
         комиссия — из выручки, остаток — на баланс
   Плюс взвод (armed): условие должно наступить ПОСЛЕ размещения,
   а не быть выполненным уже в момент размещения. Пока цена не
   сходила за уровень и не вернулась к нему, ордер висит и ждёт —
   в карточке это видно по подписи «ждёт возврата». */
function tickLimitOrders() {
  if (!S.limitOrders.length) return;
  var ts = now();
  var changed = false;
  /* Проход с конца, чтобы splice не сбивал индексы. */
  for (var i = S.limitOrders.length - 1; i >= 0; i--) {
    var o = S.limitOrders[i];
    var a = assetById(o.assetId);
    if (!a) { S.limitOrders.splice(i, 1); changed = true; continue; }

    /* Сейв старой версии мог прийти без armed — считаем такой ордер
       взведённым, иначе он никогда не исполнится. */
    if (typeof o.armed !== 'boolean') o.armed = true;

    var oRef = orderRef(a, o, ts);
    if (!orderHit(o, oRef)) {
      /* Цена ушла на «не ту» сторону лимита — ордер взводится и теперь
         исполнится, как только вернётся к уровню. */
      if (!o.armed) { o.armed = true; changed = true; }
      continue;
    }
    /* Цена на уровне, но ордер ещё не взведён: значит она и так уже
       была тут в момент размещения. Ждём настоящего возврата. */
    if (!o.armed) continue;

    /* Исполняем. Цена исполнения — текущая рыночная (oRef), она при
       сработавшем условии всегда не хуже лимитной. */
    var fillPx = oRef;
    if (o.side === 'buy') {
      /* Списываем баланс ТОЛЬКО сейчас — на размещении ничего не
         резервировали. Проверяем ещё раз: между размещением и
         исполнением игрок мог потратить деньги на маркет-ордер. */
      var amt = o.amount || 0;
      if (S.balance < amt) {
        /* Не хватает денег — отменяем как неисполнимый. Тихий
           cancel без тоста: такие случаи редки и намеренно
           «самоустраняются», чтобы не мусорить уведомлениями. */
        S.limitOrders.splice(i, 1);
        closeOrderHistory(o.id, 'cancelled', null);
        changed = true;
        continue;
      }
      S.balance -= amt;
      var commission = amt * tradeFeeRate();
      var net = amt - commission;
      /* Монеты на сумму ЗА ВЫЧЕТОМ комиссии — та же модель, что у
         рыночной покупки (см. doBuy). Себестоимость — вся списанная
         сумма, поэтому P&L сразу учитывает комиссию входа. */
      var qty = fillPx > 0 ? net / fillPx : 0;
      var posB = S.positions[a.id] || (S.positions[a.id] = { qty: 0, cost: 0 });
      posB.qty += qty;
      /* cost basis — вся списанная сумма вместе с комиссией (как в doBuy). */
      posB.cost += amt;
      S.tradesCount++;
      pushTrade('buy', a, qty, fillPx, amt, null, commission, 'limit');
      Snd.play('limit_fill');
      closeOrderHistory(o.id, 'filled', fillPx, {
        qty: qty, gross: amt, fee: commission, net: net
      });
      S.limitOrders.splice(i, 1);
      changed = true;
    } else {
      /* Аналогично для продажи: списание позиции — здесь, а не на
         размещении. Проверяем, что qty ещё на месте. */
      var posS = S.positions[a.id];
      if (!posS || posS.qty < (o.qty || 0) - 1e-9) {
        S.limitOrders.splice(i, 1);
        closeOrderHistory(o.id, 'cancelled', null);
        changed = true;
        continue;
      }
      var sellQty = o.qty;
      /* costPart считаем от ТЕКУЩЕЙ позиции, а не берём сохранённый при
         размещении. Позиция не резервируется (см. placeLimitOrder),
         поэтому между размещением и исполнением игрок мог докупиться —
         старая база разъезжалась с позицией: PnL завышался, а в
         остатке cost висела чужая средняя. Доля — та же, что у
         продаваемого количества. */
      var costPart = posS.qty > 0 ? posS.cost * (sellQty / posS.qty) : 0;
      posS.qty -= sellQty;
      posS.cost -= costPart;
      if (posS.qty < 1e-9) delete S.positions[a.id];
      var gross2 = sellQty * fillPx;
      var commission2 = gross2 * tradeFeeRate();
      var net2 = gross2 - commission2;
      var pnl = net2 - costPart;
      S.balance += net2;
      S.realized += pnl;
      if (pnl > 0) S.wins++;
      S.tradesCount++;
      S.sellsCount++;
      /* gross2, а не net2 — см. комментарий в doSell(): в истории
         оборот, комиссия отдельной строкой. */
      pushTrade('sell', a, sellQty, fillPx, gross2, pnl, commission2, 'limit');
      Snd.play('limit_fill');
      closeOrderHistory(o.id, 'filled', fillPx, {
        qty: sellQty, gross: gross2, fee: commission2, net: net2, pnl: pnl
      });
      S.limitOrders.splice(i, 1);
      changed = true;
    }
  }
  if (changed) {
    /* Исполнение лимитника меняет и баланс, и состав портфеля —
       фиксируем снимок сразу, иначе на графике «за всё время» скачок
       приедет только через минуту, следующим плановым снимком. */
    pushPfSnapshot(true);
    saveState(true);
    renderDesk();
  }
}

/* ------------------- Биржевая панель под графиком ------------------- */

/* Панель из четырёх вкладок — как на настоящих биржах: открытые ордера,
   позиции, история ордеров, история сделок. Все смотрят на текущий
   актив: это «что происходит на этом графике», а не сводка по портфелю
   (сводка живёт на экране портфеля).

   Активная вкладка не сохраняется в сейв: заходя на график, игрок ждёт
   увидеть ордера, а не то, что он смотрел в прошлый раз. */
var deskTab = 'orders';
/* Пока палец лежит на панели, перерисовку придерживаем: иначе тик мог
   бы подменить кнопку «Закрыть» между touchstart и click, и нажатие
   ушло бы в пустоту. */
var deskHold = false;
/* Нажатие, которое ждёт отпускания. Храним НЕ узел, а снятые с него
   data-атрибуты: список перерисовывается каждые 500 мс, и к моменту
   pointerup исходный узел уже может быть выброшен из DOM. Айдишник
   переживает перерисовку, ссылка на узел — нет. */
var deskPress = null;
/* Кеш отрендеренного html по вкладкам. Тик дергает панель дважды в
   секунду, и без сравнения строк позиции пересоздавали бы DOM без
   нужды — в том числе прямо под пальцем. */
var deskCache = { orders: null, alerts: null, positions: null, history: null, trades: null };

var DESK_BOX = { orders: 'ao-list', alerts: 'al-list', positions: 'pos-list', history: 'oh-list', trades: 'tx-list' };
var DESK_TABS = ['orders', 'alerts', 'positions', 'history', 'trades'];

function setDeskTab(name) {
  if (!name || !DESK_BOX[name]) return;
  deskTab = name;
  $$('.desk-tab').forEach(function (b) {
    var on = b.getAttribute('data-desk') === name;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    /* Активную вкладку доводим до глаза: на узком экране таб-бар
       прокручивается, и выбранная могла остаться за краем. */
    if (on && b.scrollIntoView) {
      try { b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: FX.reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { /* старый WebView без options */ }
    }
  });
  $$('.desk-panel').forEach(function (p) {
    p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
  });
  moveDeskInk();
  /* Пульс полосы-индикатора при переключении вкладки. Снимаем и
     ставим класс, чтобы анимация перезапускалась даже при клике
     по уже активной вкладке (например, чтобы «дочитать» анимацию). */
  var ink = $('#desk-ink');
  if (ink) {
    ink.classList.remove('is-pulsing');
    /* force reflow перед повторным навешиванием — иначе браузер
       сольёт два добавления класса в одну анимацию. */
    void ink.offsetWidth;
    ink.classList.add('is-pulsing');
  }
  renderDesk(true);
}

/* Подвижная полоса под активной вкладкой. Считаем по rect'ам: таб-бар
   прокручивается по горизонтали, а полоса лежит в непрокручиваемой
   обёртке, поэтому разница viewport-координат даёт верный сдвиг без
   возни со scrollLeft и offsetParent. */
function moveDeskInk() {
  var ink = $('#desk-ink');
  var tabs = $('#desk-tabs');
  if (!ink || !tabs) return;
  var btn = tabs.querySelector('.desk-tab.active');
  if (!btn) { ink.style.opacity = '0'; return; }
  var wrap = ink.parentNode;
  var br = btn.getBoundingClientRect();
  var wr = wrap.getBoundingClientRect();
  if (!br.width) { ink.style.opacity = '0'; return; }
  ink.style.opacity = '';
  ink.style.width = br.width + 'px';
  ink.style.transform = 'translateX(' + (br.left - wr.left) + 'px)';
}

/* Счётчики на вкладках. Ноль не показываем: пустой бейдж рядом с
   «Позиции» выглядит как незакрытое уведомление. */
function renderDeskBadges() {
  var openN = 0, posN = 0;
  for (var i = 0; i < S.limitOrders.length; i++) {
    if (S.limitOrders[i].assetId === tradeAssetId) openN++;
  }
  if (S.positions[tradeAssetId] && S.positions[tradeAssetId].qty > 1e-9) posN = 1;
  var map = { orders: openN, positions: posN, alerts: (typeof Alerts !== 'undefined') ? Alerts.countOn(tradeAssetId) : 0 };
  $$('#desk-tabs .desk-badge').forEach(function (b) {
    var n = map[b.getAttribute('data-badge')];
    b.textContent = n > 0 ? String(n) : '';
    b.classList.toggle('hidden', !(n > 0));
  });
}

/* Структурная подпись orders/positions: всё статичное (id, сторона,
   цена, объём, armed, qty, cost, язык). Живые цифры (dist, mark, PnL)
   в подпись НЕ входят — они латчатся в существующие узлы через
   patchDeskLive(), иначе innerHTML пересоздавался бы каждый тик
   и stagger-анимация desk-row-in играла заново 2 раза/сек. */
var deskSigCache = { orders: null, positions: null };
function deskLiveSig() {
  if (deskTab === 'orders') {
    var parts = [tradeAssetId, LANG];
    for (var i = 0; i < S.limitOrders.length; i++) {
      var o = S.limitOrders[i];
      if (o.assetId !== tradeAssetId) continue;
      parts.push(o.id + ':' + o.side + ':' + o.price + ':' +
        (o.side === 'buy' ? o.amount : o.qty) + ':' + (o.armed === false ? '0' : '1'));
    }
    return 'o|' + parts.join(';');
  }
  if (deskTab === 'positions') {
    var pos = S.positions[tradeAssetId];
    if (!pos || !(pos.qty > 1e-9)) return 'p|' + tradeAssetId + '|' + LANG + '|empty';
    return 'p|' + tradeAssetId + '|' + LANG + '|' + pos.qty + '|' + pos.cost;
  }
  return null;
}
/* Точечное обновление живых цифр без пересоздания DOM.
   Возвращает false, если структура изменилась и нужен полный rebuild. */
function patchDeskLive() {
  var box = $('#' + DESK_BOX[deskTab]);
  if (!box) return false;
  var ts = now();
  if (deskTab === 'orders') {
    var a = assetById(tradeAssetId);
    if (!a) return false;
    var cur = [];
    for (var i = 0; i < S.limitOrders.length; i++) {
      if (S.limitOrders[i].assetId === tradeAssetId) cur.push(S.limitOrders[i]);
    }
    if (!cur.length) return !!box.querySelector('.desk-empty');
    for (var k = 0; k < cur.length; k++) {
      var o = cur[k];
      var row = null;
      var btns = box.querySelectorAll('[data-cancel-lo]');
      for (var b = 0; b < btns.length; b++) {
        if (btns[b].getAttribute('data-cancel-lo') === o.id) {
          row = btns[b].closest('.ao-item');
          break;
        }
      }
      if (!row) return false;
      var px = orderRef(a, o, ts);
      var dist = (px > 0) ? ((o.price - px) / px) * 100 : 0;
      var tail = row.querySelector('.ao-dist');
      if (tail && o.armed !== false) {
        tail.textContent = (o.side === 'buy' ? '\u25BC' : '\u25B2') +
          Math.abs(dist).toFixed(2) + '%';
      }
      var sub = row.querySelector('.ao-sub');
      if (sub) {
        var dot = sub.querySelector('.ao-dot');
        var ago = deskAgo(o.createdAt);
        if (dot && dot.nextSibling) dot.nextSibling.textContent = ago;
        else sub.innerHTML = esc(t('order_price_at', { p: money(o.price, a.dec) })) +
          '<i class="ao-dot">•</i>' + esc(ago);
      }
    }
    return true;
  }
  if (deskTab === 'positions') {
    var pa = assetById(tradeAssetId);
    if (!pa) return false;
    var ppos = S.positions[tradeAssetId];
    if (!ppos || !(ppos.qty > 1e-9)) return !!box.querySelector('.desk-empty');
    var prow = box.querySelector('.ao-item--pos');
    if (!prow) return false;
    var mark = Engine.bid(pa, ts);
    var entry = ppos.cost / ppos.qty;
    var value = ppos.qty * mark;
    var pnl = value - ppos.cost;
    var pct = ppos.cost > 0 ? (pnl / ppos.cost) * 100 : 0;
    var sign = pnl >= 0 ? 'up' : 'down';
    var arrow = pnl >= 0 ? '\u25B2' : '\u25BC';
    var pctTxt = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
    prow.setAttribute('data-pnl-sign', sign);
    var coin = prow.querySelector('.pos-coin');
    if (coin) coin.setAttribute('data-pnl-sign', sign);
    var block = prow.querySelector('.pos-pnl-block');
    if (block) block.setAttribute('data-pnl-sign', sign);
    var num = prow.querySelector('.pos-pnl-num');
    if (num) num.textContent = fmtSigned(pnl);
    var pill = prow.querySelector('.pos-pnl-pill');
    if (pill) {
      var parr = pill.querySelector('.pos-pnl-arrow');
      if (parr) parr.textContent = arrow;
      if (parr && parr.nextSibling) parr.nextSibling.textContent = pctTxt;
      else pill.textContent = arrow + pctTxt;
    }
    var fvs = prow.querySelectorAll('.pos-foot-val');
    if (fvs && fvs.length >= 3) {
      fvs[1].textContent = money(mark, pa.dec);
      fvs[2].textContent = money(value);
    }
    return true;
  }
  return false;
}

/* Отправить панель в DOM. Перерисовываем только активную вкладку и
   только если её разметка реально изменилась. */
function renderDesk(force) {
  var wrap = $('#desk-tabs');
  if (!wrap) return;
  /* Бейджи меняют ширину вкладок, а значит и положение полосы. Двигаем
     её до раннего выхода ниже: иначе при «ничего не изменилось» индикатор
     остался бы на старой вкладке после появления счётчика. */
  renderDeskBadges();
  moveDeskInk();
  if (deskHold && !force) return;
  var box = $('#' + DESK_BOX[deskTab]);
  if (!box) return;
  /* Живые вкладки: при той же структуре только подлатываем цифры —
     без innerHTML и без повтора анимации входа строк. */
  if (!force && (deskTab === 'orders' || deskTab === 'positions')) {
    var sig = deskLiveSig();
    if (sig !== null && sig === deskSigCache[deskTab] && patchDeskLive()) return;
  }
  var html;
  if (deskTab === 'orders') html = deskOrdersHtml();
  else if (deskTab === 'positions') html = deskPositionsHtml();
  else if (deskTab === 'history') html = deskHistoryHtml();
  else if (deskTab === 'alerts') html = (typeof Alerts !== 'undefined') ? Alerts.deskHtml() : '';
  else html = deskTradesHtml();
  if (!force && deskCache[deskTab] === html) {
    if (deskTab === 'orders' || deskTab === 'positions') deskSigCache[deskTab] = deskLiveSig();
    return;
  }
  deskCache[deskTab] = html;
  if (deskTab === 'orders' || deskTab === 'positions') deskSigCache[deskTab] = deskLiveSig();
  box.innerHTML = html;
  if (deskTab === 'alerts' && typeof Alerts !== 'undefined') Alerts.deskPatch();
  /* Спарклайны рисуем после того, как HTML попал в DOM и CSS успел
     задать размеры .pos-spark. requestAnimationFrame, чтобы не было
     гонки с layout'ом. */
  if (deskTab === 'positions') {
    try { requestAnimationFrame(drawPosSparklines); } catch (e) { drawPosSparklines(); }
  }
}

/* Пустое состояние вкладки. Одна разметка на все четыре: отличается
   только текст, а «пусто» должно выглядеть одинаково спокойно. */
function deskEmpty(text) {
  return '<div class="desk-empty"><span class="desk-empty-ico">◍</span><span>' + esc(text) + '</span></div>';
}

/* Круглый бейдж покупки/продажи с монетой по центру.
   Теперь используется только в открытых ордерах: в позициях, истории
   ордеров и истории сделок показываем чистый логотип самой монеты.
   Центр и радиус монеты берутся из img/transaction-meta.json: монета
   ложится ровно на серебряную сферу PNG-исходника, заменяя её
   (диаметр монеты = диаметр сферы). */
var TX_META = null;
function loadTxMeta() {
  if (TX_META) return TX_META;
  /* meta.json подгружается асинхронно в setupTxMeta() из boot(). Пока
     ответ не пришёл, берём дефолты — они совпадают с meta.json с
     точностью до второго знака, то есть визуально неотличимы. */
  return TX_META || { side: 887, buy_sphere: { cx: 0.516, cy: 0.515, r: 0.374 }, sell_sphere: { cx: 0.499, cy: 0.478, r: 0.352 } };
}
function setupTxMeta() {
  /* Подгружаем meta.json из img/ один раз. Не критично: если не
     загрузится, txBadge() использует дефолтные координаты. */
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'img/transaction-meta.json', true);
    xhr.onload = function () {
      var got = false;
      try {
        if (xhr.status === 200 && xhr.responseText) {
          TX_META = JSON.parse(xhr.responseText);
          /* Считаем, что мета реально пришла, только если в ней есть
             обе половинки (buy и sell) с радиусом. Битый/пустой ответ
             не должен перетирать дефолты. */
          got = !!(TX_META && TX_META.buy_sphere && TX_META.sell_sphere &&
                   TX_META.buy_sphere.r > 0 && TX_META.sell_sphere.r > 0);
        }
      } catch (e) { got = false; }
      if (!got) { TX_META = null; return; }
      /* Запрос асинхронный: первая отрисовка панели почти наверняка
         успела пройти на дефолтах. Перерисовываем, иначе бейджи
         навсегда останутся на дефолтных координатах до следующего
         обновления по таймеру. */
      try { if (typeof renderDesk === 'function') renderDesk(true); } catch (e) { dbg('setupTxMeta', e); }
    };
    xhr.send();
  } catch (e) { dbg('setupTxMeta', e); }
}

function txBadge(side, a, mod) {
  var meta = loadTxMeta();
  var sphere = side === 'buy' ? meta.buy_sphere : meta.sell_sphere;
  var cls = 'tx-badge tx-badge--' + side + (mod ? ' ' + mod : '');
  var src = a ? (a.img || ('img/coins/' + a.id + '.png')) : '';
  /* Координаты и размер монеты в % пробрасываем через inline-стиль,
     потому что у двух половин исходника (buy/sell) разные центры и
     радиусы — общее CSS-значение тут не подходит. */
  var style = '--tx-cx:' + (sphere.cx * 100).toFixed(2) + '%;' +
              '--tx-cy:' + (sphere.cy * 100).toFixed(2) + '%;' +
              /* Диаметр монеты = диаметр сферы. Монета заменяет сферу,
                 а не «лежит рядом». Корзина обрамляет монету. */
              '--tx-coin-size:' + (sphere.r * 2 * 100).toFixed(2) + '%;';
  /* onerror прячет битый img: без монеты бейдж остаётся «серебряным»,
     но это лучше, чем иконка «сломанного изображения» в рамочке. */
  return '<span class="' + cls + '" style="' + style + '">' +
    (src ? '<img class="tx-badge-coin" src="' + esc(src) + '" alt="" draggable="false" onerror="this.style.display=\'none\'">' : '') +
    '</span>';
}

/* HH:MM — в истории важнее время суток, чем дата: сделки и ордера
   живут минутами, а не месяцами. */
function deskTime(ms) {
  if (!ms) return '';
  var d = new Date(ms);
  return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

/* «Только что / 5 мин / 2 ч / вчера» — для ордеров и сделок точное
   время важнее, но абсолютная давность читается быстрее. */
function deskAgo(ms) {
  if (!ms) return '';
  var s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return t('desk_just_now');
  var m = Math.floor(s / 60);
  if (m < 60) return t('desk_min_ago', { x: m });
  var h = Math.floor(m / 60);
  if (h < 24) return t('desk_h_ago', { x: h });
  return t('desk_d_ago', { x: Math.floor(h / 24) });
}

/* Дата+время для модалки деталей. В строках списка оставляем HH:MM,
   но в деталях пользователь ожидает точное «когда». Порядок полей —
   по локали: RU — ДД.ММ.ГГГГ, EN — ММ/ДД/ГГГГ. */
function detailDate(ms) {
  if (!ms) return '—';
  var d = new Date(ms);
  var dd = ('0' + d.getDate()).slice(-2);
  var mm = ('0' + (d.getMonth() + 1)).slice(-2);
  var yy = d.getFullYear();
  var hh = ('0' + d.getHours()).slice(-2);
  var mi = ('0' + d.getMinutes()).slice(-2);
  var ss = ('0' + d.getSeconds()).slice(-2);
  var date = (typeof LANG !== 'undefined' && LANG === 'en')
    ? mm + '/' + dd + '/' + yy
    : dd + '.' + mm + '.' + yy;
  return date + ' ' + hh + ':' + mi + ':' + ss;
}

/* ---------- Вкладка «Открытые ордера» ---------- */

/* Ордера текущего актива: сортируем покупки наверх, внутри стороны —
   по цене. Закрытые сюда не попадают: они удалены из S.limitOrders. */
function deskOrdersHtml() {
  var a = assetById(tradeAssetId);
  if (!a) return '';
  var cur = [];
  for (var i = 0; i < S.limitOrders.length; i++) {
    if (S.limitOrders[i].assetId === tradeAssetId) cur.push(S.limitOrders[i]);
  }
  if (!cur.length) return deskEmpty(t('limit_no_orders'));
  cur.sort(function (x, y) {
    if (x.side !== y.side) return x.side === 'buy' ? -1 : 1;
    return x.side === 'buy' ? x.price - y.price : y.price - x.price;
  });
  var ref = now();
  var html = '';
  for (var k = 0; k < cur.length; k++) {
    var o = cur[k];
    var px = orderRef(a, o, ref);
    /* Насколько рынку осталось дойти до цели. Для «висящего» ордера
       это и есть ответ на вопрос «почему он ещё не исполнился». */
    var dist = (px > 0) ? ((o.price - px) / px) * 100 : 0;
    var val = o.side === 'buy' ? money(o.amount, 0) : fmtQty(o.qty) + ' ' + a.ticker;
    /* Цветовая семантика: зелёный = buy, красный = sell. Сюда же
       привязан цвет кольца у монеты, чтобы взгляд сразу считывал
       направление, как на референсе. */
    var sign = o.side === 'buy' ? 'up' : 'down';
    var arrow = o.side === 'buy' ? '\u2191' : '\u2193';
    var sideLabel = o.side === 'buy' ? t('limit_buy') : t('limit_sell');
    /* Ордер, поставленный «по нужную сторону» цены, не исполнится сразу —
       он ждёт возврата к уровню. Без этой подписи игрок решает, что
       ордер сломался: цена вроде подходящая, а сделки нет. */
    var distTail;
    if (o.armed === false) {
      distTail = '<span class="ao-wait">' + esc(t('limit_waiting')) + '</span>';
    } else {
      /* Сколько рынку осталось пройти до цели: для покупки цена должна
         упасть (▼), для продажи — вырасти (▲). Красить по знаку нельзя:
         «−3%» у покупки — это не убыток, а ровно то, чего игрок и ждёт,
         и красный цвет читался бы как проигрыш. */
      distTail = '<span class="ao-dist mono">' +
        (o.side === 'buy' ? '\u25BC' : '\u25B2') +
        Math.abs(dist).toFixed(2) + '%</span>';
    }
    var coinSrc = a.img || ('img/coins/' + a.id + '.png');
    /* Чистая монета в зелёном/красном кольце, без бейджа «корзина+стрелка»
       — по референсу. Кольцо — это .pos-coin, оно уже умеет дышать
       (pos-coin-breathe) и краситься по data-pnl-sign. */
    html += '<div class="ao-item ao-item--order" data-pnl-sign="' + sign + '">' +
      '<div class="pos-coin" data-pnl-sign="' + sign + '">' +
        '<img class="pos-coin-img" src="' + esc(coinSrc) + '" alt="' + esc(a.ticker) + '" draggable="false" onerror="this.style.display=\'none\'">' +
      '</div>' +
      '<div class="ao-main">' +
        /* Верх: крупная сумма + цветная стрелка + «Покупка», через
           разделитель «|» — тип ордера «Лимитный ордер». Подпись
           типа серая, чтобы цвет тянул взгляд только на сторону. */
        '<div class="ao-line">' +
          '<b class="mono ao-amount">' + esc(val) + '</b>' +
          '<span class="ao-side-label" data-pnl-sign="' + sign + '">' + esc(arrow) + ' ' + esc(sideLabel) + '</span>' +
          '<i class="ao-pipe" aria-hidden="true">|</i>' +
          '<span class="ao-kind">' + esc(t('desk_limit_label')) + '</span>' +
        '</div>' +
        /* Низ: «Цена $N • создано только что». Локализованно. */
        '<div class="ao-sub">' + esc(t('order_price_at', { p: money(o.price, a.dec) })) +
          '<i class="ao-dot">•</i>' + esc(deskAgo(o.createdAt)) + '</div>' +
      '</div>' +
      /* Хвост: либо «▼ N%», либо «ждёт возврата». Стоит в 4-м столбце
         grid; на узком экране wrapнется под основной строкой. */
      distTail +
      '<button class="ao-cancel" data-cancel-lo="' + esc(o.id) + '" aria-label="' + esc(t('limit_cancel')) + '">×</button>' +
      '</div>';
  }
  return html;
}

/* ---------- Вкладка «Позиции» ---------- */

function deskPositionsHtml() {
  var a = assetById(tradeAssetId);
  if (!a) return '';
  var pos = S.positions[a.id];
  if (!pos || !(pos.qty > 1e-9)) return deskEmpty(t('desk_no_pos', { t: a.ticker }));
  var mark = Engine.bid(a, now());
  var entry = pos.cost / pos.qty;
  var value = pos.qty * mark;
  /* Та же формула, что в портфеле (allocSegments): pnl = стоимость по
     bid минус вложенное. Комиссию на выход из этой цифры НЕ вычитаем —
     иначе одна и та же позиция показывала бы разный PnL на соседних
     экранах, и игрок не знал бы, какой из них верить. Комиссия продажи
     постоянна (TRADE_COMMISSION) и видна в шите до подтверждения. */
  var pnl = value - pos.cost;
  var pct = pos.cost > 0 ? (pnl / pos.cost) * 100 : 0;
  var sign = pnl >= 0 ? 'up' : 'down';
  var arrow = pnl >= 0 ? '\u25B2' : '\u25BC';
  var pctTxt = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  /* Coin-источник: у большинства активов `a.img` (например, solana.png),
     но если его нет — fallback на стандартный id-нейминг. */
  var coinSrc = a.img || ('img/coins/' + a.id + '.png');
  return '<div class="ao-item ao-item--pos" data-pnl-sign="' + sign + '">' +
    /* Вместо «корзинки со стрелкой» — чистая монета в зелёном/красном
       кольце по знаку P&L. Это и визуально чище, и совпадает с
       референсом: бросается в глаза именно актив, а не «тип сделки».
       Тип сделки тут и не важен — это текущая позиция, а не вьюшка
       ордеров. */
    '<div class="pos-coin" data-pnl-sign="' + sign + '">' +
      '<img class="pos-coin-img" src="' + esc(coinSrc) + '" alt="' + esc(a.ticker) + '" draggable="false" onerror="this.style.display=\'none\'">' +
    '</div>' +
    '<div class="pos-main">' +
      '<div class="pos-top">' +
        '<b class="pos-qty mono">' + esc(fmtQty(pos.qty)) + '</b>' +
        '<span class="pos-ticker">' + esc(a.ticker) + '</span>' +
      '</div>' +
      /* PnL — главный визуальный якорь карточки. Отдельный «блок-стат»:
         подпись слева, крупная цифра, справа — пилюля с направлением и
         процентом. Цветной градиент фона и мягкое дыхание задают тон
         сильнее, чем просто цветная цифра в общем списке. */
      '<div class="pos-pnl-block" data-pnl-sign="' + sign + '">' +
        '<div class="pos-pnl-left">' +
          '<div class="pos-pnl-label">' + esc(t('desk_pnl')) + '</div>' +
          '<span class="pos-pnl-num">' + esc(fmtSigned(pnl)) + '</span>' +
        '</div>' +
        '<span class="pos-pnl-pill"><span class="pos-pnl-arrow">' + arrow + '</span>' + esc(pctTxt) + '</span>' +
      '</div>' +
    '</div>' +
    /* Мини-спарклайн последних 30 минут. Рисуется отдельно в
       drawPosSparklines() — там есть canvas/dpr. Тут просто холст. */
    '<canvas class="pos-spark" data-asset="' + esc(a.id) + '" width="120" height="50" aria-hidden="true"></canvas>' +
    /* Футер «Вход / Цена / Стоимость» — три ячейки через разделители,
       как в референсе. Растягивается на всю ширину карточки, чтобы
       крупные суммы не толкали друг друга. */
    '<div class="pos-foot">' +
      '<div class="pos-foot-cell">' +
        '<span class="pos-foot-label">' + esc(t('desk_entry')) + '</span>' +
        '<b class="pos-foot-val mono">' + money(entry, a.dec) + '</b>' +
      '</div>' +
      '<span class="pos-foot-sep" aria-hidden="true"></span>' +
      '<div class="pos-foot-cell">' +
        '<span class="pos-foot-label">' + esc(t('desk_mark')) + '</span>' +
        '<b class="pos-foot-val mono">' + money(mark, a.dec) + '</b>' +
      '</div>' +
      '<span class="pos-foot-sep pos-foot-sep--dot" aria-hidden="true">\u2022</span>' +
      '<div class="pos-foot-cell">' +
        '<span class="pos-foot-label">' + esc(t('desk_value')) + '</span>' +
        '<b class="pos-foot-val mono">' + money(value) + '</b>' +
      '</div>' +
    '</div>' +
    '</div>';
}

/* Рисует спарклайны цены во всех .pos-spark на странице. Берёт
   последние 30 1-минутных свечей через Engine.candles, нормализует
   к размерам канваса, ведёт зелёной/красной линией.

   Цвет берётся из data-pnl-sign родительской строки (.ao-item--pos),
   а НЕ из направления тренда по свечам. Так спарклайн всегда
   совпадает с тоном PnL-блока: «в плюсе → всё зелёное», «в минусе →
   всё красное». Иначе получалось странно: PnL-блок светится
   зелёным, а график справа — красный, и игрок не понимал, что
   вообще происходит. */
function drawPosSparklines() {
  var canvases = document.querySelectorAll('.pos-spark');
  if (!canvases.length) return;
  for (var i = 0; i < canvases.length; i++) {
    var cv = canvases[i];
    var assetId = cv.getAttribute('data-asset');
    var a = assetById(assetId);
    if (!a) continue;
    /* Цвет берём с родительской строки. Если родителя нет (вряд ли,
       но на всякий случай) — падаем в up. */
    var row = cv.closest('.ao-item--pos');
    var sign = row ? (row.getAttribute('data-pnl-sign') || 'up') : 'up';
    var up = sign === 'up';
    var data = Engine.candles(a, 30, 1, now());
    if (!data || data.length < 2) continue;
    var dpr = Math.max(2, window.devicePixelRatio || 1);
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) continue;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var closes = data.map(function (d) { return d.c; });
    var lo = Math.min.apply(null, closes);
    var hi = Math.max.apply(null, closes);
    /* Если цена почти не двигалась — добавим 0.5% паддинг, чтобы
       линия не «прилипала» к краю канваса. */
    if (hi - lo < hi * 0.005) {
      var pad = hi * 0.005 || 1;
      lo -= pad; hi += pad;
    }
    var col = up ? '#3ecf6c' : '#ff5b73';
    /* Лёгкая заливка под линией: тот же цвет, но 22% альфы.
       Создаёт «свечу» под графиком, как у трейдинг-вьюверов. */
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, up ? 'rgba(62, 207, 108, 0.22)' : 'rgba(255, 91, 115, 0.22)');
    grad.addColorStop(1, up ? 'rgba(62, 207, 108, 0.00)' : 'rgba(255, 91, 115, 0.00)');
    var padX = 2, padY = 4;
    var plotW = w - padX * 2;
    var plotH = h - padY * 2;
    var xAt = function (i) { return padX + (i / (closes.length - 1)) * plotW; };
    var yAt = function (p) { return padY + (hi - p) / (hi - lo) * plotH; };
    /* Заливка. */
    ctx.beginPath();
    ctx.moveTo(xAt(0), h);
    for (var k = 0; k < closes.length; k++) ctx.lineTo(xAt(k), yAt(closes[k]));
    ctx.lineTo(xAt(closes.length - 1), h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    /* Линия тренда. */
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = col;
    for (var j = 0; j < closes.length; j++) {
      var xx = xAt(j), yy = yAt(closes[j]);
      if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    /* Маленькая точка на последней цене — как «курсор» на конце. */
    var lx = xAt(closes.length - 1);
    var ly = yAt(closes[closes.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  }
}

/* ---------- Вкладка «История ордеров» ---------- */

function deskHistoryHtml() {
  var a = assetById(tradeAssetId);
  if (!a) return '';
  var rows = [];
  for (var i = 0; i < S.orderHistory.length; i++) {
    if (S.orderHistory[i].assetId === tradeAssetId) rows.push(S.orderHistory[i]);
  }
  if (!rows.length) return deskEmpty(t('desk_no_hist', { t: a.ticker }));
  var coinSrc = a.img || ('img/coins/' + a.id + '.png');
  var html = '';
  for (var k = 0; k < rows.length && k < 30; k++) {
    var o = rows[k];
    var stCls = o.status === 'filled' ? 'is-filled' : (o.status === 'open' ? 'is-open' : 'is-cancelled');
    var stTxt = o.status === 'filled' ? t('desk_st_filled') : (o.status === 'open' ? t('desk_st_open') : t('desk_st_cancelled'));
    /* Тип ордера в истории — коротко. Ключи limit_order/limit_market
       не годятся: там подписи кнопок («Купить сейчас»), а в строке
       истории нужно имя типа, а не призыв к действию. */
    var kindTxt = t(o.kind === 'limit' ? 'desk_kind_limit' : 'desk_kind_market');
    var val = o.side === 'buy'
      ? (o.amount != null ? money(o.amount, 0) : (fmtQty(o.qty || 0) + ' ' + a.ticker))
      : (o.qty != null ? fmtQty(o.qty) + ' ' + a.ticker : money(o.amount || 0, 0));
    /* Цена: у исполненного — фактическая, она же fillPrice; у висящего
       и отменённого — целевая, по которой ордер и был заявлен. */
    var px = (o.status === 'filled' && o.fillPrice != null) ? o.fillPrice : o.price;
    var sideArrow = o.side === 'buy' ? '\u2191' : '\u2193';
    var sideArrowCls = 'hist-arrow ' + (o.side === 'buy' ? 'hist-arrow--up' : 'hist-arrow--down');
    html += '<div class="ao-item ao-item--hist" data-order="' + esc(o.id || '') + '"' +
        ' role="button" tabindex="0">' +
      /* Чистая монета в кольце — как в референсе. Без корзинки:
         в истории важен актив, а не тип сделки (тип виден строкой
         ниже: «Рынок» / «Лимит»). Кольцо всегда зелёное — «нейтральное»
         состояние, цвет не зависит от P&L (его тут и нет). */
      '<div class="hist-coin"><img class="hist-coin-img" src="' + esc(coinSrc) +
        '" alt="' + esc(a.ticker) + '" draggable="false" onerror="this.style.display=\'none\'"></div>' +
      '<div class="hist-main">' +
        '<b class="hist-amount mono">' + esc(val) + '</b>' +
        '<div class="hist-sub">' +
          '<span class="' + sideArrowCls + '">' + sideArrow + '</span>' +
          '<span>' + esc(kindTxt) + '</span>' +
          '<span class="hist-dot">\u2022</span>' +
          '<span>' + esc(t('limit_at')) + ' <b class="mono">' + money(px, a.dec) + '</b></span>' +
          '<span class="hist-dot">\u2022</span>' +
          '<span>' + esc(deskTime(o.createdAt)) + '</span>' +
        '</div>' +
      '</div>' +
      /* Статус (ИСПОЛНЕН / В работе / Отменён) — отдельной плашкой
         справа. Скруглённый фон + цвет от статуса. */
      '<span class="ao-status ao-status--lg ' + stCls + '">' + esc(stTxt) + '</span>' +
      /* Шефрон — признак, что по строке можно тапнуть и увидеть
         детали ордера. */
      '<span class="ao-chev" aria-hidden="true">\u203A</span>' +
      '</div>';
  }
  return html;
}

/* ---------- Вкладка «История сделок» ---------- */

/* Найти строку истории по стабильному id. Для старых сделок без tid
   рендер подставляет fallback на timestamp (legacy_<t>). */
function findOrderHistory(id) {
  for (var i = 0; i < S.orderHistory.length; i++) if (String(S.orderHistory[i].id) === String(id)) return S.orderHistory[i];
  return null;
}
function findTradeHistory(id) {
  for (var i = 0; i < S.trades.length; i++) {
    var tr = S.trades[i];
    if (String(tr.tid || ('legacy_' + tr.t)) === String(id)) return tr;
  }
  return null;
}

/* Иконки строк модалки. 20×20, цвет берётся из родителя (.detail-ico),
   рисуются через `currentColor`. Сделаны inline-строками: во внешний
   файл выносить смысла нет — модалка одна, иконок пять. Каждая — в
   собственном мини-блоке комментария, чтобы потом было легко
   подменить (например, на material icons, если поменяется стиль). */
var DETAIL_ICON = {
  /* База из трёх эллипсов — «Цена»: цена сделки как значение из
     рыночных данных. */
  price: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></svg>',
  /* Куб — «Отдано»: то, что ушло из портфеля. */
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="M3.5 7.5L12 12l8.5-4.5"/><path d="M12 12v9"/></svg>',
  /* Кошелёк с монеткой — «Получено»: gross-сумма до комиссии.
     Иконка та же, что была для «Net received», но смысл сменился:
     net теперь живёт в отдельной строке «На руки». */
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 7.5c0-1 .8-1.8 1.8-1.8H17a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H4.8C3.8 18.2 3 17.4 3 16.4v-9z"/><path d="M16 12.2h2.8a1.2 1.2 0 1 1 0 2.4H16"/><circle cx="17" cy="13.4" r="0.9" fill="currentColor" stroke="none"/></svg>',
  /* Монета со знаком $ — «Комиссия». */
  fee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.7c-.5-.7-1.4-1.1-2.4-1.1-1.3 0-2.3.7-2.3 1.7 0 1 .9 1.4 2.3 1.6 1.4.2 2.3.6 2.3 1.6 0 1-1 1.7-2.3 1.7-1.1 0-2-.4-2.5-1.1"/><path d="M12 7v1.3M12 15.7V17"/></svg>',
  /* Линейный график с восходящим движением — «Результат». Цвет иконки
     подстраивается под знак P&L (см. CSS .detail-row.row-pnl). */
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/></svg>'
};

/* Иконки статус-карточки ордера (44px круг). Те же принципы: inline,
   currentColor, единый размер. Галочка — filled (зелёная), часы —
   open (золотая), крестик — cancelled (красная). */
var STATUS_ICON = {
  /* Галочка в круге — «Исполнен». Чуть смещена вниз, чтобы визуально
     попасть в центр; типографски это читается лучше, чем ровно
     по центру viewBox. */
  filled: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4.2 4.2L18.5 8"/></svg>',
  /* Песочные часы — «В работе». Упрощённый контур, без песка внутри:
     мелкая деталь на 22px не читается, а лишний шум снижает
     узнаваемость. */
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4h11M6.5 20h11"/><path d="M6.5 4c0 3.5 5.5 5 5.5 8s-5.5 4.5-5.5 8"/><path d="M17.5 4c0 3.5-5.5 5-5.5 8s5.5 4.5 5.5 8"/></svg>',
  /* Крестик в круге — «Отменён». Чуть крупнее штрих, чем у filled:
     отменённый ордер должен читаться ясно даже мельком. */
  cancelled: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>'
};

/* Строка «иконка · лейбл · значение» для модалки.
   cls    — классы самой строки (row-fee / row-pnl …), красят иконку;
   valCls — классы ЗНАЧЕНИЯ, задаются явно ('up' / 'down'): раньше они
   выводились из cls авто-заменой row-* → val-*, но таких правил в CSS
   не было, и цифра P&L оставалась белой при красной иконке.
   extra  — необязательный HTML рядом с лейблом (например, чип
   «Чистая сумма» в строке «На руки»). Вставляется в тот же <span>,
   что и лейбл. */
function detailRow(icon, label, value, cls, valCls, extra) {
  var ic = icon ? '<span class="detail-ico">' + icon + '</span>' : '';
  return '<div class="detail-row' + (cls ? ' ' + cls : '') + '">' +
    ic +
    '<span>' + esc(label) + (extra || '') + '</span>' +
    '<b class="mono' + (valCls ? ' ' + valCls : '') + '">' +
      esc(value == null ? '—' : String(value)) + '</b></div>';
}

/* Чип «Чистая сумма» для строки «На руки». Выделен в отдельную
   функцию, чтобы не дублировать разметку и не забыть экранировать. */
function detailNetChip() {
  return '<span class="detail-net-chip">' + esc(t('detail_net_chip')) + '</span>';
}

/* Иконка-подсказка ⓘ у строки «Комиссия». Текст подсказки висит
   на title — браузерный тултип работает и на мобиле, и в web. */
function detailFeeHint() {
  return '<span class="detail-fee-hint" title="' + esc(t('detail_fee_hint')) + '" aria-label="' + esc(t('detail_fee_hint')) + '">i</span>';
}

function openTradeDetail(id) {
  var tr = findTradeHistory(id);
  if (!tr) return;
  var a = assetById(tr.id);
  if (!a) return;
  var isBuy = tr.side === 'buy';
  var gross = tr.total != null ? tr.total : ((tr.qty || 0) * (tr.price || 0));
  var fee = tr.fee != null ? tr.fee : null;
  var net = fee != null ? Math.max(0, gross - fee) : gross;
  /* qty нетто = ровно то, что легло в позицию: и рыночная, и лимитная
     покупка начисляют монеты на ПОЛНУЮ сумму (комиссия удерживается
     из долларов, cost basis = net). Раньше здесь пересчитывали
     (gross − fee) / price и показывали на ~1% меньше монет, чем
     реально лежит в позиции и чем написано в списке истории. */
  var netQty = tr.qty;
  var coinSrc = a.img || ('img/coins/' + a.id + '.png');
  $('#detail-ico').src = coinSrc;
  $('#detail-title').textContent = t('detail_title_trade') + ' · ' +
    (isBuy ? t('detail_buy') : t('detail_sell')) + ' ' + a.ticker;

  /* ---------- Hero ---------- */
  var hero = $('#detail-hero');
  hero.setAttribute('data-side', isBuy ? 'buy' : 'sell');
  $('#detail-hero-label').textContent = isBuy ? t('detail_spent') : t('detail_received');
  /* Монеты: знак + qty + тикер. Знак — по движению МОНЕТ, а не
     денег: покупка пополняет портфель (+0.0063 BTC), продажа
     забирает (−0.0063 BTC). Стрелки ↑/↓ Дима попросил убрать —
     они читались как «направление цены», а не как приход/расход.
     Стоит РЯДОМ с суммой внизу (не над ней) и крупно: тикер
     уходит в отдельный span, чтобы число с знаком несло смысл,
     а «BTC» не спорило с ним по весу. */
  $('#detail-hero-sub').innerHTML =
    (isBuy ? '+' : '\u2212') + esc(fmtQty(tr.qty)) + ' ' +
    '<span class="hero-sub-ticker">' + esc(a.ticker) + '</span>';
  /* Низ hero: ФАКТИЧЕСКОЕ движение баланса. У покупки списано ровно
     gross (комиссия внутри суммы). У продажи на баланс упало
     net = gross − fee: крупная цифра обязана сходиться с деньгами.
     Gross-оборот для справки живёт строкой ниже («Получено»). */
  $('#detail-hero-val').textContent = (isBuy ? '\u2212' : '+') + money(isBuy ? gross : net);

  /* Статус-карточка у СДЕЛКИ не нужна: сделка всегда исполнена.
     Прячем — иначе между сделкой и ордером прыгает layout. */
  $('#detail-status').classList.add('hidden');

  /* ---------- Главный список ---------- */
  /* Строки 1–5 (sell) или 1–4 (buy), gross и net разделены, как в
     референсе Димы. У покупки qty gross = qty net (fee удерживается
     из $, не из монет), поэтому две строки «Получено» и «На руки»
     сольются в одну — пропускаем «Получено». */
  var rows = '';
  rows += detailRow(DETAIL_ICON.price, t('detail_price'), money(tr.price, a.dec));

  if (isBuy) {
    rows += detailRow(DETAIL_ICON.box, t('detail_gave'), money(gross));
    /* Для buy комиссия удерживается из $, qty монет не меняется.
       «Получено» и «На руки» совпали бы — оставляем одну строку,
       но с чипом «Чистая сумма», чтобы подчеркнуть, что значение
       уже после удержания комиссии из суммы. */
    rows += detailRow(DETAIL_ICON.wallet, t('detail_net'), fmtQty(netQty) + ' ' + a.ticker,
      null, null, detailNetChip());
  } else {
    rows += detailRow(DETAIL_ICON.box, t('detail_gave'), fmtQty(tr.qty) + ' ' + a.ticker);
    rows += detailRow(DETAIL_ICON.wallet, t('detail_got'), money(gross));
    rows += detailRow(DETAIL_ICON.wallet, t('detail_net'), money(net),
      null, null, detailNetChip());
  }
  if (fee != null) {
    rows += detailRow(DETAIL_ICON.fee, t('detail_fee'), '\u2212' + money(fee),
      'row-fee', 'down', detailFeeHint());
  }
  /* P&L — только у продажи (у покупки позиция открыта, результата
     ещё нет). Класс row-pnl красит иконку, valCls — саму цифру,
     оба по знаку. */
  if (!isBuy && tr.pnl != null) {
    rows += detailRow(DETAIL_ICON.chart, t('detail_pnl'), fmtSigned(tr.pnl),
      'row-pnl ' + (tr.pnl >= 0 ? 'row-pnl--up' : 'row-pnl--down'),
      tr.pnl >= 0 ? 'up' : 'down');
  }
  $('#detail-rows').innerHTML = rows;

  /* ---------- Мета-карточка: тип-пилюля и дата ---------- */
  var kindKey = tr.kind === 'limit' ? 'detail_kind_limit' : 'detail_kind_market';
  var meta = '';
  meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_kind')) + '</span>' +
    '<span class="detail-pill">' + esc(t(kindKey)) + '</span></div>';
  meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_date')) + '</span>' +
    '<b class="mono">' + esc(detailDate(tr.t)) + '</b></div>';
  $('#detail-meta').innerHTML = meta;

  openModal('modal-detail');
}

function openOrderDetail(id) {
  var o = findOrderHistory(id);
  if (!o) return;
  var a = assetById(o.assetId);
  if (!a) return;
  var isBuy = o.side === 'buy';
  var coinSrc = a.img || ('img/coins/' + a.id + '.png');
  var isFilled = o.status === 'filled';
  var isOpen = o.status === 'open';
  var stTxt = isFilled ? t('desk_st_filled') : (isOpen ? t('desk_st_open') : t('desk_st_cancelled'));
  /* Для filled берём цену исполнения; для open/cancelled — целевую.
     gross для filled = total сделки; для open/cancelled = amount
     (то, что заявлено, ещё не двинулось). */
  var px = isFilled && o.fillPrice != null ? o.fillPrice : o.price;
  var gross = o.gross != null ? o.gross : (o.amount != null ? o.amount : ((o.qty || 0) * (px || 0)));
  var fee = o.fee != null ? o.fee : (isFilled ? gross * tradeFeeRate() : null);
  var net = o.net != null ? o.net : (fee != null ? Math.max(0, gross - fee) : null);
  /* qty: для filled-buy восстанавливаем из net/px (комиссия из $);
     для остальных — берём прямо из ордера. Для open-buy в
     placeLimitOrder() qty не пишется в orderHistory (только amount),
     поэтому восстанавливаем из amount / px — иначе hero и строки
     деталей будут без qty, и игрок не увидит, сколько монет
     заявлено. */
  var qty = o.qty;
  if (!(qty > 0) && isBuy && isFilled && px > 0 && net != null) {
    /* Фолбэк для древних записей без qty: монеты начислялись на ПОЛНУЮ
       сумму (комиссия — из долларов), поэтому делим gross, а не net. */
    qty = gross / px;
  } else if (!(qty > 0) && isBuy && px > 0 && o.amount != null) {
    qty = o.amount / px;
  }
  /* netQty — то, что реально легло в позицию после комиссии.
     У buy fee удерживается из $ → qty не меняется (qty == netQty).
     У sell fee удерживается из $ → qty не меняется тоже. */
  var netQty = qty;

  $('#detail-ico').src = coinSrc;
  $('#detail-title').textContent = t('detail_title_order') + ' · ' + (isBuy ? t('detail_buy') : t('detail_sell')) + ' ' + a.ticker;

  /* ---------- Hero ---------- */
  /* У исполненного ордера hero — как у сделки: фактическое движение
     баланса (sell → net после комиссии). У открытого/отменённого
     деньги не двинулись — hero показывает сумму заявки (gross). */
  var hero = $('#detail-hero');
  hero.setAttribute('data-side', isBuy ? 'buy' : 'sell');
  if (isOpen) {
    /* Для открытого ордера деньги/монеты ещё не двинулись —
     пишем «Заявка», чтобы не врать, что они уже «потрачены». */
    $('#detail-hero-label').textContent = isBuy ? t('detail_spent') : t('detail_received');
  } else {
    $('#detail-hero-label').textContent = isBuy ? t('detail_spent') : t('detail_received');
  }
  var heroVal = gross;
  if (isFilled && !isBuy) heroVal = (net != null ? net : gross);
  $('#detail-hero-val').textContent = (isBuy ? '\u2212' : '+') + money(heroVal);
  if (qty != null) {
    $('#detail-hero-sub').innerHTML = (isBuy ? '+' : '\u2212') + esc(fmtQty(qty)) + ' ' +
      '<span class="hero-sub-ticker">' + esc(a.ticker) + '</span>';
  } else {
    $('#detail-hero-sub').innerHTML = '';
  }

  /* ---------- Статус-карточка (только у ордеров) ---------- */
  var status = $('#detail-status');
  status.classList.remove('hidden');
  status.setAttribute('data-status', o.status);
  $('#detail-status-ico').innerHTML = STATUS_ICON[o.status] || STATUS_ICON.filled;
  $('#detail-status-val').textContent = stTxt;
  var kindKey = o.kind === 'limit' ? 'detail_kind_limit' : 'detail_kind_market';
  $('#detail-status-kind').textContent = t(kindKey);

  /* ---------- Главный список ---------- */
  /* Структура отличается по статусу:
     - open: только цена + отдано. Получено/комиссия/net/pnl ещё
       не существуют, дублировать заявку строками нет смысла.
     - filled: полный набор (target+fill+gave+got+fee+net+pnl).
     - cancelled: как open — деньги/монеты не двинулись. */
  var rows = '';
  rows += detailRow(DETAIL_ICON.price, t('detail_target_price'), money(o.price, a.dec));
  if (isFilled && o.fillPrice != null && o.fillPrice !== o.price) {
    /* fill-цена только если она РЕАЛЬНО отличается от target — для
       маркет-ордеров они совпадают, и вторая строка читалась бы
       как «одно и то же дважды». */
    rows += detailRow(DETAIL_ICON.price, t('detail_fill_price'), money(o.fillPrice, a.dec));
  }

  if (isOpen || o.status === 'cancelled') {
    /* Для незавершённого ордера показываем только заявку одной
       строкой — она же дублируется в hero, но отдельной строкой
       нагляднее: видно, что именно «застряло» в воздухе. */
    if (isBuy) {
      rows += detailRow(DETAIL_ICON.box, t('detail_gave'), money(gross));
    } else if (qty != null) {
      rows += detailRow(DETAIL_ICON.box, t('detail_gave'), fmtQty(qty) + ' ' + a.ticker);
    }
  } else {
    /* filled — полная разбивка. */
    if (isBuy) {
      rows += detailRow(DETAIL_ICON.box, t('detail_gave'), money(gross));
      /* Для buy комиссия удерживается из $, qty монет не меняется.
         «Получено» и «На руки» совпали бы — оставляем одну строку,
         с чипом «Чистая сумма», чтобы подчеркнуть, что значение уже
         после удержания комиссии из суммы. */
      rows += detailRow(DETAIL_ICON.wallet, t('detail_net'), fmtQty(netQty) + ' ' + a.ticker,
        null, null, detailNetChip());
    } else {
      rows += detailRow(DETAIL_ICON.box, t('detail_gave'), fmtQty(qty) + ' ' + a.ticker);
      rows += detailRow(DETAIL_ICON.wallet, t('detail_got'), money(gross));
      rows += detailRow(DETAIL_ICON.wallet, t('detail_net'), money(net),
        null, null, detailNetChip());
    }
    if (fee != null) {
      rows += detailRow(DETAIL_ICON.fee, t('detail_fee'), '\u2212' + money(fee),
        'row-fee', 'down', detailFeeHint());
    }
    if (o.pnl != null) {
      rows += detailRow(DETAIL_ICON.chart, t('detail_pnl'), fmtSigned(o.pnl),
        'row-pnl ' + (o.pnl >= 0 ? 'row-pnl--up' : 'row-pnl--down'),
        o.pnl >= 0 ? 'up' : 'down');
    }
  }
  $('#detail-rows').innerHTML = rows;

  /* ---------- Мета-карточка: тип + даты + время жизни ---------- */
  var meta = '';
  meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_kind')) + '</span>' +
    '<span class="detail-pill">' + esc(t(kindKey)) + '</span></div>';
  meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_created')) + '</span>' +
    '<b class="mono">' + esc(detailDate(o.createdAt)) + '</b></div>';
  if (o.closedAt) {
    meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_closed')) + '</span>' +
      '<b class="mono">' + esc(detailDate(o.closedAt)) + '</b></div>';
  }
  if (isOpen) {
    var ref = orderRef(a, o, now());
    var dist = ref > 0 ? Math.abs((o.price - ref) / ref * 100) : 0;
    meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_lifetime')) + '</span>' +
      '<b class="mono">' + esc(deskAgo(o.createdAt)) + '</b></div>';
    meta += '<div class="detail-row meta-row"><span>' + esc(t('detail_distance')) + '</span>' +
      '<b class="mono">' + esc((o.side === 'buy' ? '\u25BC ' : '\u25B2 ') + dist.toFixed(2) + '%') + '</b></div>';
  }
  /* Без ID ордера — Дима явно сказал, что поле лишнее. */
  $('#detail-meta').innerHTML = meta;
  openModal('modal-detail');
}

function deskTradesHtml() {
  var a = assetById(tradeAssetId);
  if (!a) return '';
  var rows = [];
  for (var i = 0; i < S.trades.length; i++) {
    /* Служебные записи наград колеса в списках истории не рисуются:
       это не сделка игрока, а реплей-данные для графиков. */
    if (S.trades[i].side === 'reward') continue;
    if (S.trades[i].id === tradeAssetId) rows.push(S.trades[i]);
  }
  if (!rows.length) return deskEmpty(t('desk_no_trades', { t: a.ticker }));
  var coinSrc = a.img || ('img/coins/' + a.id + '.png');
  var html = '';
  for (var k = 0; k < rows.length && k < 30; k++) {
    var tr = rows[k];
    var isBuy = tr.side === 'buy';
    /* Цвет карточки — по СТОРОНЕ сделки, а не по знаку PnL: покупка
       зелёная, продажа красная. Раньше продажа в плюсе была зелёной и
       сливалась с покупкой — список не читался как «что я покупал,
       а что продавал». Знак PnL по-прежнему виден по цвету цифры
       справа (класс up/down у .trade-pnl). */
    var sideCls = isBuy ? 'buy' : 'sell';
    var sideWord = esc(t(isBuy ? 'desk_side_buy' : 'desk_side_sell'));
    /* Строка цены. tr.price — цена исполнения этой конкретной
       сделки: для покупки это «цена покупки», для продажи — «цена
       продажи». Подпись одна и та же («Цена»), потому что в обоих
       случаях это просто цена транзакции; к позиции и её «входу»
       это отношения не имеет, хоть и совпадает с ценой входа
       именно для покупки. Подробности — в i18n.js, рядом с
       desk_price. P&L показываем только у продажи: у покупки
       позиция открыта, результат ещё не известен. */
    var priceLine = '<span class="trade-lbl">' +
        esc(t('detail_price')) + '</span>' +
      '<b class="mono">' + money(tr.price, a.dec) + '</b>';
    if (!isBuy && tr.pnl != null) {
      priceLine += '<i class="ao-dot">•</i>' +
        '<span class="trade-pnl mono ' + (tr.pnl >= 0 ? 'up' : 'down') + '">' +
        esc(t('desk_pnl')) + ' ' + esc(fmtSigned(tr.pnl)) + '</span>';
    }
    /* Нижняя строка за разделителем: комиссия + время + тип. Комиссию
       показываем со знаком «минус» и без скобок: это удержание из
       оборота, а не отдельная сумма к оплате. */
    var meta = '';
    if (tr.fee != null) {
      meta += '<span class="trade-fee">' + esc(t('desk_fee')) +
        ' <b class="mono">\u2212' + money(tr.fee) + '</b></span>' +
        '<i class="ao-dot">•</i>';
    }
    meta += esc(deskTime(tr.t)) + '<i class="ao-dot">•</i>' +
      esc(t(tr.kind === 'limit' ? 'desk_kind_limit' : 'desk_kind_market'));
    /* Прямоугольничек справа — СУММА сделки (оборот ДО комиссии), а не
       P&L. Знак и цвет по направлению денег: продажа — приток на счёт
       (плюс, зелёный), покупка — отток (минус, красный). Подпись под
       числом раньше дублировала чип «Покупка/Продажа» сверху —
       оставил только цифру, иначе одна и та же строка звучит дважды
       (например «Покупка» в чипе и «Покупка» под суммой). */
    var totalCls = isBuy ? 'down' : 'up';
    var totalVal = (isBuy ? '\u2212' : '+') + money(tr.total);
    html += '<div class="ao-item ao-item--trade" data-side="' + sideCls + '"' +
        ' data-trade="' + esc(tr.tid || ('legacy_' + tr.t)) + '" role="button" tabindex="0">' +
      /* Чистый логотип актива вместо транзакционного бейджа с тележкой.
         Сторону несут чип и обводка карточки, кольцо — нейтральное. */
      '<div class="trade-coin"><img class="trade-coin-img" src="' + esc(coinSrc) +
        '" alt="' + esc(a.ticker) + '" draggable="false" onerror="this.style.display=\'none\'"></div>' +
      '<div class="trade-main">' +
        '<span class="trade-tag">' + sideWord + '</span>' +
        /* Количество и тикер — отдельными узлами: число крупное и
           белое, тикер мельче и приглушён. В одной строке подряд
           «0.0523 BTC» сливалось в пятно, и количество терялось. */
        '<div class="trade-amount">' +
          '<b class="trade-qty mono">' + esc(fmtQty(tr.qty)) + '</b>' +
          '<span class="trade-ticker">' + esc(a.ticker) + '</span>' +
        '</div>' +
        '<div class="trade-price">' + priceLine + '</div>' +
        '<div class="trade-meta">' + meta + '</div>' +
      '</div>' +
      '<div class="trade-total">' +
        '<b class="trade-total-val mono ' + totalCls + '">' + esc(totalVal) + '</b>' +
      '</div>' +
      /* Шефрон — признак, что по строке можно тапнуть и увидеть
         детали. Без него карточка выглядит некликабельной. */
      '<span class="ao-chev ao-chev--box" aria-hidden="true">\u203A</span>' +
      '</div>';
  }
  return html;
}

/* Открыть шит продажи на указанную долю позиции — быстрый выход из
   позиции прямо из панели под графиком, без лишнего переключателя
   процентов. */
function closePositionAt(pct) {
  var a = assetById(tradeAssetId);
  if (!a || !S.positions[a.id]) return;
  sellPct = pct;
  openSheet('sell');
}

/* Монтаж панели — один раз при старте. Слушатели вешаем на контейнеры
   (#desk-tabs и #tr-desk), а не на строки: содержимое панели
   пересоздаётся на каждом тике, и обработчики на строках уходили бы в
   мусор вместе со своим DOM. */
function initDesk() {
  var tabs = $('#desk-tabs');
  var desk = $('#tr-desk');
  var body = desk ? desk.querySelector('.desk-body') : null;
  if (!tabs || !desk || !body) return;

  tabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.desk-tab');
    if (!btn) return;
    var name = btn.getAttribute('data-desk');
    if (!name || name === deskTab) return;
    setDeskTab(name);
    FX.vibrate(8);
  });

  /* Полоса под активной вкладкой: доводим при горизонтальном скролле
     таб-бара и при повороте/ресайзе. */
  tabs.addEventListener('scroll', moveDeskInk, { passive: true });
  window.addEventListener('resize', moveDeskInk);

  /* Канвасы читают clientWidth в момент отрисовки, но на поворот экрана
     никто их не перерисовывал: пончик портфеля и кольцо достижений рисуются
     ОДИН раз, поэтому после поворота оставались растянутыми до следующего
     рендера вкладки. График сделки спасал свой таймер в 50 мс, но и ему
     нужен немедленный кадр.
     Дебаунс обязателен: resize сыплется десятками событий подряд, а
     redrawCanvases пересобирает портфель целиком. */
  var viewportRedrawTimer = 0;
  var onViewportChange = function () {
    if (viewportRedrawTimer) clearTimeout(viewportRedrawTimer);
    viewportRedrawTimer = setTimeout(function () {
      viewportRedrawTimer = 0;
      redrawCanvases();
      if (currentScreen === 'scr-trade') updateTradePrices(true);
    }, 150);
  };
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);

  /* Свайпы по телу панели переключают соседние вкладки. Вертикальный
     жест остаётся обычным скроллом истории: смотрим на финальное
     движение пальца и принимаем свайп только если горизонталь явно
     доминирует, а палец прошёл минимум 46px. Раньше здесь был
     промежуточный «swipe.moved=true» уже при первом наклоне
     (|dy| > |dx| + 10 на любом кадре touchmove) — реальные пальцы
     рисуют криво, и любой наклон навсегда убивал горизонталь.
     Теперь фиксируем «вертикаль» только в одном флаге и сравниваем
     финальные dx/dy на touchend: тот же алгоритм, что в
     initMainTabSwipes(), только без визуального сдвига страницы и
     без flick-режима (вкладки плотные, 46px хватает). */
  var swipe = null;
  body.addEventListener('touchstart', function (e) {
    if (!e.touches || e.touches.length !== 1) { swipe = null; return; }
    var touch = e.touches[0];
    swipe = { x: touch.clientX, y: touch.clientY, t: Date.now(), vertical: false };
  }, { passive: true });
  body.addEventListener('touchmove', function (e) {
    if (!swipe || !e.touches || e.touches.length !== 1) return;
    var touch = e.touches[0];
    var dx = touch.clientX - swipe.x;
    var dy = touch.clientY - swipe.y;
    /* Как только палец явно пошёл по вертикали, отдаём жест скроллу —
       и в touchend уже не пытаемся переключать вкладку, даже если
       к концу палец качнётся вбок. Множитель тот же 1.35, что в
       initMainTabSwipes(): «|dy| заметно больше |dx|». */
    if (!swipe.vertical && Math.abs(dy) > Math.abs(dx) * 1.35) swipe.vertical = true;
  }, { passive: true });
  body.addEventListener('touchend', function (e) {
    if (!swipe) return;
    var touch = e.changedTouches && e.changedTouches[0];
    if (!touch) { swipe = null; return; }
    var dx = touch.clientX - swipe.x;
    var dy = touch.clientY - swipe.y;
    var dt = Date.now() - swipe.t;
    var wasVertical = swipe.vertical;
    swipe = null;
    /* Вертикаль — навсегда скролл; 46px — обычный свайп; 900мс — и
       медленный жест успеет. 1.25 (мягче, чем было 1.35) — горизонталь
       не обязана быть в полтора раза длиннее вертикали, достаточно
       просто доминировать. */
    if (wasVertical || dt > 900 || Math.abs(dx) < 46 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    var idx = DESK_TABS.indexOf(deskTab);
    var next = dx < 0 ? idx + 1 : idx - 1;
    if (idx < 0 || next < 0 || next >= DESK_TABS.length) return;
    setDeskTab(DESK_TABS[next]);
    FX.vibrate(8);
  }, { passive: true });
  body.addEventListener('touchcancel', function () { swipe = null; }, { passive: true });

  /* Нажатия по строкам панели: отмена ордера, закрытие позиции, детали
     истории ордеров и сделок.

     Действие выполняется на pointerup, а НЕ на click, и цель на
     pointerdown запоминается по её data-атрибуту, а не ссылкой на узел.
     Причина в том, что список перерисовывается дважды в секунду, а
     отпускание пальца раньше вдобавок дёргало renderDesk(true): с
     force=true innerHTML перезаписывается ВСЕГДА, даже когда разметка
     не изменилась. Узел под пальцем умирал до того, как браузер дошлёт
     click, событие не всплывало до #tr-desk, и обработчик молча не
     вызывался. Снаружи это выглядело как «лимитный ордер невозможно
     отменить» и «по строке истории ничего не открывается». Теперь
     перерисовка не может увести нажатие: к моменту действия нужен
     только id, а не живой узел. */
  desk.addEventListener('pointerdown', function (e) {
    deskHold = true;
    deskPress = null;
    var t = e.target;
    if (!t || !t.closest) return;
    var el = t.closest('[data-cancel-lo]') || t.closest('[data-close-pos]') ||
             t.closest('[data-order]') || t.closest('[data-trade]');
    if (!el) return;
    deskPress = {
      cancel: el.getAttribute('data-cancel-lo'),
      closePos: el.getAttribute('data-close-pos'),
      order: el.getAttribute('data-order'),
      trade: el.getAttribute('data-trade'),
      x: e.clientX, y: e.clientY
    };
  });
  /* Клавиатурная доступность: Enter/Space на карточке открывает те же
     детали. На телефоне не мешает, в браузере полезно. */
  desk.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var hist = e.target.closest('[data-order]');
    var trade = e.target.closest('[data-trade]');
    if (!hist && !trade) return;
    e.preventDefault();
    if (hist) openOrderDetail(hist.getAttribute('data-order'));
    else openTradeDetail(trade.getAttribute('data-trade'));
  });

  window.addEventListener('pointerup', deskRelease);
  window.addEventListener('pointercancel', deskRelease);
}

/* Допустимый сдвиг пальца между нажатием и отпусканием. Больше — это
   уже скролл или свайп на соседнюю вкладку, нажатием не считаем. */
var DESK_TAP_SLOP = 12;

/* Отпустили палец. Сначала разбираем нажатие, потом догоняем
   перерисовку, которую придержали, пока палец лежал. */
function deskRelease(e) {
  var press = deskPress;
  deskPress = null;
  if (press && e && e.type === 'pointerup') {
    var dx = Math.abs((e.clientX == null ? press.x : e.clientX) - press.x);
    var dy = Math.abs((e.clientY == null ? press.y : e.clientY) - press.y);
    if (dx <= DESK_TAP_SLOP && dy <= DESK_TAP_SLOP) {
      if (press.cancel) cancelLimitOrder(press.cancel);
      else if (press.closePos) closePositionAt(parseInt(press.closePos, 10));
      else if (press.order) openOrderDetail(press.order);
      else if (press.trade) openTradeDetail(press.trade);
    }
  }
  if (!deskHold) return;
  deskHold = false;
  /* БЕЗ force. С force=true renderDesk перезаписывает innerHTML всегда,
     даже когда разметка совпала с кешем, и убивает узел под пальцем
     ровно в тот момент, когда браузер собирается доставить click.
     Обычный вызов сравнивает строку с кешем и молча выходит. */
  renderDesk();
}

/* ------------------- /Биржевая панель под графиком ------------------- */

/* ------------------------------ Портфель ------------------------------ */

var PF_RANGES = {
  '30M': { p: 180, tf: 2 },
  '1H': { p: 180, tf: 4 },
  '3H': { p: 180, tf: 12 },
  '10H': { p: 154, tf: 48 },
  /* «Всё время»: не пытаемся просить бесконечные свечи. Движок хранит
     7400 базовых свечей (≈10 ч 17 мин). Берём всю доступную глубину
     текущей сессии/движка с tf=1; начало серии дополнительно якорится
     в startBalance внутри full-series функций. */
  'ALL': { p: 7400, tf: 1, all: true }
};
var pfRange = '1H';
/* Переключатель диапазона попросил морф кривой. Ставится в обработчике
   меню, снимается в renderPortfolio — живёт один кадр, но именно он
   отличает «пользователь сменил таймфрейм» от очередного тика цен. */
var pfTfSwitch = false;
/* Режим hero портфолио: 'positions' (текущий набор — активы, прибыль,
   лучший) или 'capital' (баланс, стоимость позиций, рекорд капитала).
   Не сохраняется в сейв: заходя на график, игрок ожидает увидеть
   «свои позиции», а не то, что он смотрел в прошлый раз. */
/* v3: по умолчанию «Капитал» — как в концепте, с полосой «свободно / спот / фьючерсы». */
var pfMode = 'capital';

var ALLOC_COLORS = ['#e9b640', '#38bdf8', '#a78bfa', '#2fbe6e', '#fb7185', '#f97316', '#22d3ee', '#e879f9'];

/* Цвет закрепляется за активом раз и навсегда. Если раздавать цвета по
   порядку в отсортированном списке, то при каждой смене ранга круг
   перекрашивается прямо на глазах. Занятые цвета не повторяются, пока
   есть свободные. */
var allocColorOf = {};
function allocColor(id) {
  if (allocColorOf[id]) return allocColorOf[id];
  var used = {}, i;
  for (var k in allocColorOf) used[allocColorOf[k]] = 1;
  for (i = 0; i < ALLOC_COLORS.length; i++) {
    if (!used[ALLOC_COLORS[i]]) { allocColorOf[id] = ALLOC_COLORS[i]; return ALLOC_COLORS[i]; }
  }
  allocColorOf[id] = ALLOC_COLORS[Object.keys(allocColorOf).length % ALLOC_COLORS.length];
  return allocColorOf[id];
}

/* Сколько активов показываем отдельными долями. Остальное сворачивается
   в «Другое»: двадцать тонких секторов в круге не читаются, а легенда
   уезжала бы за экран. */
var ALLOC_TOP_N = 10;
/* id свёрнутого остатка. Не может совпасть с id актива — начинается с
   подчёркивания, а те приходят из каталога монет. */
var ALLOC_OTHER_ID = '__other__';

/* Цвет «Другого» берём из темы, а не из палитры: серая доля не должна
   выглядеть как ещё один актив. Кеш сбрасывается вместе с темой. */
var allocOtherCol = null;
function allocOtherColor() {
  if (!allocOtherCol) {
    allocOtherCol = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#8b90a0';
  }
  return allocOtherCol;
}

/* Какой сегмент распределения выбран — id актива или null.
   Раньше хранили индекс: после продажи актива или смены порядка
   выделение переезжало на чужой сегмент. */
var selectedAllocId = null;
/* Наведённый сегмент (donut или строка легенды) — только подсветка. */
var hoverAllocId = null;

/* Сегменты распределения. Одна функция на всё: легенда, donut и
   hit-test обязаны видеть один и тот же порядок, иначе клик выделяет
   не тот актив. Крупный сегмент первый — так круг читается легче. */
function allocSegments() {
  var total = invested();
  var segs = [];
  Object.keys(S.positions).forEach(function (id) {
    var a = assetById(id);
    if (!a) return;
    var pos = S.positions[id];
    var value = pos.qty * Engine.bid(a, now());
    if (!(value > 0)) return;
    var pnl = value - pos.cost;
    segs.push({
      id: id, a: a, pos: pos, value: value,
      share: total > 0 ? value / total : 0,
      pnl: pnl,
      pnlP: pos.cost > 0 ? pnl / pos.cost * 100 : 0,
      color: allocColor(id)
    });
  });
  segs.sort(function (x, y) { return y.value - x.value; });
  return segs;
}

function allocIdxById(segs, id) {
  if (id == null) return -1;
  for (var i = 0; i < segs.length; i++) if (segs[i].id === id) return i;
  return -1;
}

/* Группировка для круга и легенды: первые ALLOC_TOP_N по стоимости
   (allocSegments уже отсортирован по убыванию) плюс свёрнутый остаток.
   Если активов не больше порога — возвращаем сегменты как есть, без
   лишней обёртки.

   У остатка те же поля, что у обычного сегмента (value/pnl/share),
   поэтому круг, центр и легенда работают с ним без ветвлений. */
function allocGroups(segs) {
  if (segs.length <= ALLOC_TOP_N) return segs;
  var rest = segs.slice(ALLOC_TOP_N);
  var value = 0, pnl = 0, share = 0, cost = 0;
  rest.forEach(function (s) {
    value += s.value; pnl += s.pnl; share += s.share; cost += s.pos.cost;
  });
  return segs.slice(0, ALLOC_TOP_N).concat([{
    id: ALLOC_OTHER_ID,
    other: true,
    items: rest,
    value: value,
    pnl: pnl,
    share: share,
    cost: cost,
    pnlP: cost > 0 ? pnl / cost * 100 : 0,
    color: allocOtherColor()
  }]);
}

/* Короткие деньги для центра donut: $842.15 / $12 340 / $1.24 млн.
   Полная сумма с копейками туда просто не влезает. */
function moneyShort(x) {
  var neg = x < 0;
  x = Math.abs(x);
  var s;
  if (x >= 1e12) s = (x / 1e12).toFixed(2) + ' ' + t('big_t');
  else if (x >= 1e9) s = (x / 1e9).toFixed(2) + ' ' + t('big_b');
  else if (x >= 1e6) s = (x / 1e6).toFixed(2) + ' ' + t('big_m');
  else if (x >= 1e5) s = (x / 1e3).toFixed(1) + ' ' + t('big_k');
  else if (x >= 1e3) s = x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  else s = x.toFixed(2);
  return (neg ? '-$' : '$') + s;
}

/* Размер под длину строки, чтобы сумма не вылезала за внутренний круг. */
function centFontSize(txt) {
  return txt.length <= 7 ? '' : (txt.length <= 9 ? '17px' : '14px');
}

/* Центр donut: стоимость всего портфеля, либо тикер + стоимость выбранного
   актива. Процент доли отсюда убран — под подписью «Итого» он читался как
   «итого 45%» и только сбивал. Долю и так видно по кругу и по полоскам. */
function renderAllocCenter(segs, selIdx) {
  var center = $('#donut-center');
  if (!center) return;
  var s = selIdx >= 0 ? segs[selIdx] : null;

  /* renderPortfolio вызывается каждые 500 мс. Пересобирать innerHTML
     каждый раз нельзя — сбрасываются анимации и выделение текста,
     поэтому разметку меняем только при смене режима, числа — точечно. */
  if (center.__mode !== (s ? 'sel' : 'total') || center.__id !== (s ? s.id : '')) {
    center.innerHTML = s
      ? '<span class="dc-ticker"></span><b class="dc-val mono"></b><span class="dc-pnl mono"></span>'
      : '<b class="dc-val mono"></b><span class="muted small" data-i18n="pf_total_short">' + esc(t('pf_total_short')) + '</span>';
    center.__mode = s ? 'sel' : 'total';
    center.__id = s ? s.id : '';
  }

  var el = center.querySelector('.dc-val');
  if (!el) return;

  if (!s) {
    var total = 0;
    for (var i = 0; i < segs.length; i++) total += segs[i].value;
    var txt = segs.length ? moneyShort(total) : '\u2014';
    if (el.textContent !== txt) el.textContent = txt;
    el.style.fontSize = centFontSize(txt);
    return;
  }

  var tk = center.querySelector('.dc-ticker');
  var pnlEl = center.querySelector('.dc-pnl');
  var vtxt = moneyShort(s.value);
  var ptxt = (s.pnl >= 0 ? '+' : '') + moneyShort(s.pnl);

  /* У «Другого» нет тикера — подписываем группу. */
  tk.textContent = s.other ? t('alloc_other') : s.a.ticker;
  tk.style.color = s.color;
  if (el.textContent !== vtxt) el.textContent = vtxt;
  el.style.fontSize = centFontSize(vtxt);
  if (pnlEl.textContent !== ptxt) pnlEl.textContent = ptxt;
  pnlEl.className = 'dc-pnl mono ' + (s.pnl >= 0 ? 'up' : 'down');
}

/* Обновить одно поле в карточке деталей, не пересобирая всю разметку. */
function setAdField(root, k, text, cls) {
  var el = root.querySelector('[data-k="' + k + '"]');
  if (!el) return;
  if (el.textContent !== text) el.textContent = text;
  var want = 'mono' + (cls ? ' ' + cls : '');
  if (el.className !== want) el.className = want;
}

/* Полная карточка деталей под диаграммой. Если ничего не выбрано — скрыта. */
function renderAllocDetail(segs, selIdx) {
  var detail = $('#alloc-detail');
  if (!detail) return;

  if (selIdx < 0 || !segs[selIdx]) {
    detail.classList.add('hidden');
    detail.innerHTML = '';
    detail.__id = '';
    detail.__sig = '';
    return;
  }

  var s = segs[selIdx];
  /* Свёрнутый остаток показываем списком — это и есть ответ на
     «а что там внутри». */
  if (s.other) { renderAllocOtherDetail(detail, s); return; }
  var a = s.a, pos = s.pos;
  var pnl = s.pnl;
  var pct = pos.cost > 0 ? pnl / pos.cost * 100 : 0;
  var curPrice = Engine.bid(a, now());
  var avgPrice = pos.qty > 0 ? pos.cost / pos.qty : 0;

  if (detail.__id !== s.id) {
    detail.innerHTML =
      '<div class="ad-head">' +
        '<span class="dot" style="background:' + s.color + '"></span>' +
        '<b>' + esc(assetName(a)) + '</b>' +
        '<span class="muted">' + esc(a.ticker) + '/USD</span>' +
        '<button class="ad-close" id="ad-close" aria-label="Close">\u2715</button>' +
      '</div>' +
      '<div class="ad-grid">' +
        '<div class="ad-item"><span>' + t('ad_qty') + '</span><b class="mono" data-k="qty"></b></div>' +
        '<div class="ad-item"><span>' + t('ad_avg') + '</span><b class="mono" data-k="avg"></b></div>' +
        '<div class="ad-item"><span>' + t('ad_now') + '</span><b class="mono" data-k="now"></b></div>' +
        '<div class="ad-item"><span>' + t('ad_value') + '</span><b class="mono" data-k="value"></b></div>' +
        '<div class="ad-item"><span>' + t('ad_pnl') + '</span><b class="mono" data-k="pnl"></b></div>' +
        '<div class="ad-item"><span>' + t('ad_share') + '</span><b class="mono" data-k="share"></b></div>' +
      '</div>';
    detail.__id = s.id;
    detail.__sig = '';
    var closeBtn = $('#ad-close');
    if (closeBtn) closeBtn.onclick = function () { selectAllocSeg(null); };
  }

  setAdField(detail, 'qty', fmtQty(pos.qty) + ' ' + a.ticker);
  setAdField(detail, 'avg', money(avgPrice, a.dec));
  setAdField(detail, 'now', money(curPrice, a.dec));
  setAdField(detail, 'value', money(s.value));
  setAdField(detail, 'pnl', fmtSigned(pnl) + ' (' + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%)',
    pnl >= 0 ? 'up' : 'down');
  setAdField(detail, 'share', (s.share * 100).toFixed(1) + '%');
  detail.classList.remove('hidden');
}

/* Разбор «Другого»: список активов, попавших в остаток.

   Разметку пересобираем только при смене состава (сигнатура из id),
   иначе каждые 500 мс список мигал бы; числа обновляем точечно через
   data-k, как в обычной карточке деталей. */
function renderAllocOtherDetail(detail, g) {
  var sig = g.items.map(function (s) { return s.id; }).join(',');
  if (detail.__id !== ALLOC_OTHER_ID || detail.__sig !== sig) {
    detail.innerHTML =
      '<div class="ad-head">' +
        '<span class="dot" style="background:' + g.color + '"></span>' +
        '<b>' + esc(t('alloc_other')) + '</b>' +
        '<span class="muted">' + esc(t('alloc_other_count', { n: g.items.length })) + '</span>' +
        '<button class="ad-close" id="ad-close" aria-label="Close">\u2715</button>' +
      '</div>' +
      '<div class="ad-other">' +
        g.items.map(function (s) {
          return '<div class="ad-other-row" data-id="' + esc(s.id) + '">' +
            '<span class="dot" style="background:' + s.color + '"></span>' +
            '<b>' + esc(assetName(s.a)) + '</b>' +
            '<i class="mono">' + esc(s.a.ticker) + '</i>' +
            '<b class="mono" data-k="v-' + esc(s.id) + '"></b>' +
            '<i class="mono" data-k="p-' + esc(s.id) + '"></i>' +
            '</div>';
        }).join('') +
      '</div>';
    detail.__id = ALLOC_OTHER_ID;
    detail.__sig = sig;
    var closeBtn = $('#ad-close');
    if (closeBtn) closeBtn.onclick = function () { selectAllocSeg(null); };
    Array.prototype.forEach.call(detail.querySelectorAll('.ad-other-row'), function (row) {
      row.onclick = function () { openTrade(row.getAttribute('data-id')); };
    });
  }
  g.items.forEach(function (s) {
    setAdField(detail, 'v-' + s.id, money(s.value));
    setAdField(detail, 'p-' + s.id, (s.share * 100).toFixed(1) + '%');
  });
  detail.classList.remove('hidden');
}

/* Выбрать сегмент распределения (или сбросить, если id пустой). */
function selectAllocSeg(id) {
  if (id) Snd.play('pie');
  selectedAllocId = id || null;
  if (currentTab === 'portfolio') renderPortfolio(true);
}

/* Сколько активов видно в карточке «Ваши активы» до «Показать все»:
   с десятью позициями карточка занимала бы весь экран. */
var PF_TOP_N = 4;

/* Строки активов (v3): кольцо доли вокруг логотипа, спарклайн, раскрытие
   деталей с «Докупить / Продать» и FLIP-перестановка при сортировке. Строка
   создаётся один раз на актив, на тиках меняются только числа (V3PF.rows). */
function renderPfRows(listEl, segs, animate, skipSparks, limit) {
  V3PF.rows(listEl, segs, !!animate, !!skipSparks, limit || 0);
}

/* Отдельный экран со всеми активами — открывается стрелкой в заголовке
   карточки. Порядок тот же, что в коротком списке: по стоимости, самый
   крупный сверху (allocSegments() уже отсортирован). */
function renderAllAssets(noAnim) {
  var listEl = $('#all-list');
  if (!listEl) return;
  var segs = allocSegments();
  renderPfRows(listEl, segs, !noAnim);
  var sub = $('#all-sub');
  if (sub) sub.textContent = segs.length ? money(invested()) : '\u2014';
}

function openAllAssets() {
  showScreen('scr-assets', 'right');
  renderAllAssets();
}

function closeAllAssets() {
  showScreen('app-main', 'left');
}

/* Hero портфеля (v3): табло-одометр (V3PF.hero) и чип изменения ЗА
   ВЫБРАННЫЙ диапазон — разница последней и первой точек той же серии, что
   на графике. Процент — прибыль за диапазон / капитал на начало диапазона
   (pfPnlBase), одинаковый на обеих вкладках. Режим переключается мгновенно:
   число не ждёт анимации панелей. */
function renderPfHero(pnl, pnlPct, series) {
  var isCap = pfMode === 'capital';
  var headVal = isCap ? capital() : invested();
  if (!series) series = pfSeriesCached(isCap, PF_RANGES[pfRange] || PF_RANGES['1H']);
  var first = series && series.length ? series[0] : headVal;
  var last = series && series.length ? series[series.length - 1] : headVal;
  var headPnl = last - first;
  V3PF.hero(headVal, headPnl, pfPnlBase(series, isCap, headPnl), isCap);
  /* У новичка без сделок и позиций чип прячем: «+$0 · +0.00%» выглядит багом. */
  var noData = !S.trades.length && invested() === 0;
  var pill = $('#pf-pnl'), perEl = $('#pf-per');
  if (pill) pill.classList.toggle('hidden', noData);
  if (perEl) perEl.style.visibility = noData ? 'hidden' : '';
}

/* Знаменатель для процента под крупным числом. Возвращает 0, если
   считать нечего (тогда процент скрываем).

   Capital: первая точка — капитал на начало диапазона.
   Positions: currentCapital = startCapital + profitForRange, значит
   startCapital = capital() − headPnl. Это важнее series.base0: base0
   отражает только стоимость ОТКРЫТЫХ позиций, игнорирует свободный
   кеш и на длинных диапазонах мог дать «+0.05%» рядом с честными
   «+0.12%» на Capital для одной и той же прибыли. */
function pfPnlBase(series, isCap, headPnl) {
  function ok(v) { return typeof v === 'number' && isFinite(v) && v > 1e-6; }
  if (isCap && series && ok(series.base0)) return series.base0;
  if (!isCap) {
    var startCap = capital() - headPnl;
    if (ok(startCap)) return startCap;
  }
  if (ok(startBalanceSafe())) return startBalanceSafe();
  return 0;
}

/* График героя портфеля. Отдельная функция, чтобы переключение
   вкладки «Positions / Capital» и смена таймфрейма перерисовывали
   кривую мгновенно, не дожидаясь полного renderPortfolio.

   В режиме «Капитал» рисуем историю КАПИТАЛА (balance(t) + стоимость
   позиций на момент t, восстановленную по сделкам) — абсолютную сумму,
   а не P&L. В «Positions» — по-старому,
   история P&L позиций.

   Цвет кривой капитала — по движению за диапазон (последняя точка против
   первой), а не всегда зелёный: если капитал просел, линия должна быть
   красной. Шкала капитала не растягивается по min/max (minSpan в
   V3PF.chart), иначе колебания в 2% от суммы выглядят как обвал. */
/* Кеш серии графика: полный реплей + candles() — дорогие, а тик
   приходит каждые 500 мс. Ключ = режим, диапазон, сигнатура сделок
   (сколько и когда последняя) и тик-бакет раз в 5 секунд. Одна и та
   же серия для hero и графика — они обязаны совпадать. */
var pfSeriesCache = { key: '', val: null };
function pfSeriesCached(isCap, r) {
  var sig = S.trades.length + ':' + (S.trades.length ? S.trades[0].t : 0);
  var key = (isCap ? 'cap' : 'pnl') + '|' + pfRange + '|' + sig + '|' + Math.floor(tickN / 10);
  if (pfSeriesCache.key === key) return pfSeriesCache.val;
  var val = isCap ? capitalSeries(r.p, r.tf, !!r.all) : portfolioSeries(r.p, r.tf, !!r.all);
  pfSeriesCache.key = key;
  pfSeriesCache.val = val;
  return val;
}

function renderPfChart(animate, pnl, series) {
  var isCap = pfMode === 'capital';
  if (!series) series = pfSeriesCached(isCap, PF_RANGES[pfRange] || PF_RANGES['1H']);
  /* Вход — прорисовка слева направо, смена периода/режима — морф кривой. */
  V3PF.chart(series, { intro: !!animate && !pfTfSwitch, morph: pfTfSwitch, isCap: isCap, minSpan: isCap ? 0.08 : 0 });
}

function renderPortfolio(noAnim) {
  var listEl = $('#pf-list');
  var ids = Object.keys(S.positions);
  var total = invested();
  var cost = costBasis();
  var pnl = total - cost;
  var pnlPct = cost > 0 ? pnl / cost * 100 : 0;
  var intro = !noAnim;
  if (intro) V3PF.enter();

  /* Hero и график читают ОДНУ серию (кеш: пересчёт при сделке, смене
     диапазона/режима или раз в 5 секунд) — иначе чип изменения не совпал
     бы с началом/концом кривой. */
  var r = PF_RANGES[pfRange] || PF_RANGES['1H'];
  var heroSeries = pfSeriesCached(pfMode === 'capital', r);
  renderPfHero(pnl, pnlPct, heroSeries);

  /* Панели под графиком: «Капитал» — три корзины денег, «Позиции» —
     число активов, прибыль и рекорд капитала. */
  V3PF.stats({
    cash: S.balance, spot: total, fut: futEquity(), n: ids.length,
    pnl: pnl, pnlPct: pnlPct, best: Math.max(S.best || 0, capital())
  }, intro);
  if (!noAnim) V3PF.syncPanels();

  renderPfRanges();
  renderPfChart(intro, pnl, heroSeries);
  pfTfSwitch = false;
  V3PF.ops(intro);

  var legend = $('#alloc-legend');
  if (!ids.length) {
    /* Пустой портфель — отдельное состояние в обеих карточках. */
    legend.innerHTML = '<div class="empty">' + esc(t('pf_empty')) + '</div>';
    legend.__sig = '';
    renderAllocCenter([], -1);
    renderAllocDetail([], -1);
    selectedAllocId = null;
    hoverAllocId = null;
    drawDonut($('#alloc-donut'), [], intro);
    V3PF.leaders([]);
    renderPfRows(listEl, [], intro);
    V3PF.more(0);
    /* Экран всех активов мог остаться открытым: если последнюю позицию
       закрыли прямо из него, список надо опустошить. */
    if (currentScreen === 'scr-assets') renderAllAssets(true);
    return;
  }

  var segs = allocSegments();
  /* Круг и легенда работают по сгруппированному списку: топ-10 плюс
     «Другое». Выбор и подсветка ищутся в нём же — иначе индекс
     указывал бы на другую долю. */
  var groups = allocGroups(segs);
  /* Актив мог быть продан — привязки по id больше нет, сбрасываем выбор. */
  var selIdx = allocIdxById(groups, selectedAllocId);
  if (selectedAllocId && selIdx < 0) selectedAllocId = null;
  var hovIdx = allocIdxById(groups, hoverAllocId);
  if (hoverAllocId && hovIdx < 0) hoverAllocId = null;

  drawDonut($('#alloc-donut'),
    groups.map(function (s) { return { share: s.share, color: s.color }; }),
    intro,
    selIdx,
    hovIdx);

  /* Легенда кликабельна: выбирает сегмент, показывает детали. При прежнем
     составе патчатся только числа, ширины полос и подсветка; пересборка —
     при смене набора активов (иначе каждые 500 мс сбивались бы переходы). */
  var legendSig = groups.map(function (s) { return s.id; }).join('|') +
    '#' + selIdx + '#' + hovIdx;
  var lRows = legend.querySelectorAll('.alloc-row');
  var lBars = legend.querySelectorAll('.alloc-bar');
  if (legend.__sig === legendSig && lRows.length === groups.length) {
    groups.forEach(function (s, i) {
      var row = lRows[i];
      if (!row) return;
      var valEl = row.querySelector('.mono');
      if (valEl) valEl.textContent = money(s.value, 0);
      var pctEl = row.querySelector('.alloc-pct');
      if (pctEl) pctEl.textContent = (s.share * 100).toFixed(1) + '%';
      var bar = lBars[i] && lBars[i].firstElementChild;
      if (bar) {
        bar.style.width = Math.round(s.share * 100) + '%';
        bar.style.background = s.color;
      }
      row.classList.toggle('sel', s.id === selectedAllocId);
      row.classList.toggle('hov', s.id === hoverAllocId);
    });
  } else {
    legend.__sig = legendSig;
    legend.innerHTML = groups.map(function (s) {
      return '<div class="alloc-row' + (s.id === selectedAllocId ? ' sel' : '') +
          (s.id === hoverAllocId ? ' hov' : '') + '" data-id="' + esc(s.id) + '">' +
        '<span class="dot" style="background:' + s.color + '"></span>' +
        '<span class="grow"><b>' + (s.other ? esc(t('alloc_other')) : esc(assetName(s.a))) +
          '</b><i class="mono">' + money(s.value, 0) + '</i></span>' +
        /* Стрелка намекает, что «Другое» разворачивается в список. */
        (s.other ? '<span class="alloc-more" aria-hidden="true">\u203a</span>' : '') +
        '<span class="alloc-pct mono" style="color:' + s.color + '">' + (s.share * 100).toFixed(1) + '%</span>' +
        '</div>' +
        '<div class="alloc-bar" data-id="' + esc(s.id) + '"><div style="width:' + Math.round(s.share * 100) + '%;background:' + s.color + '"></div></div>';
    }).join('');
  }

  renderAllocCenter(groups, selIdx);
  renderAllocDetail(groups, selIdx);

  /* Лидер и аутсайдер по доходности позиции. */
  V3PF.leaders(segs);

  /* Спарклайны на плановом тике пересобираются не чаще раза в секунду
     (PF_SPARK_MS): Engine.candles на каждую строку — самая дорогая часть
     рендера. Любое действие пользователя (!noAnim) рисует их сразу. */
  var sparkNow = now();
  var drawSparkNow = !noAnim || (sparkNow - _pfSparkAt >= PF_SPARK_MS);
  if (drawSparkNow) _pfSparkAt = sparkNow;
  renderPfRows(listEl, segs, intro, !drawSparkNow, V3PF.limit());
  V3PF.more(segs.length);

  /* Экран всех активов может стоять открытым прямо сейчас — его строки
     должны ехать вместе с ценами портфеля. */
  if (currentScreen === 'scr-assets') renderAllAssets(noAnim);
}

/* Периоды — сегмент-кнопками (V3PF), выпадающего меню больше нет.
   closePfRangeMenu оставлен пустым для внешних вызовов. */
function closePfRangeMenu() {}

function renderPfRanges() {
  V3PF.periods();
}

/* Отсортированная копия истории сделок. Одна точка входа для обоих
   графиков — иначе фильтрация старых/битых записей легко расходится. */
function pfTradesAsc() {
  var out = [], raw = S.trades || [];
  for (var i = 0; i < raw.length; i++) {
    var tr = raw[i];
    if (!tr || typeof tr.t !== 'number' || !isFinite(tr.t)) continue;
    /* Награды колеса идут в реплей вместе со сделками: у денежного
       приза id нет (влияет только на баланс капитала), монетный —
       обычный актив. */
    if (tr.side === 'reward' || (tr.id && (tr.side === 'buy' || tr.side === 'sell'))) out.push(tr);
  }
  out.sort(function (a, b) { return a.t - b.t; });
  return out;
}

/* Серия из долговременных снимков. Для ALL добавляем честный старт
   аккаунта и живой хвост, не мутируя S.pfHistory на каждом рендере.

   Для PnL первая точка — НОЛЬ, а не startBalance: в начале жизни
   аккаунта позиций не было, значит и прибыли не было. А вот base0 для
   процента — это как раз startBalance: «сколько я заработал на деньги,
   с которыми начинал». Иначе делили бы на ноль и вечно видели 0.00%. */
function allPfSeries(kind) {
  var out = [], hist = S.pfHistory || [];
  var isCap = kind === 'cap';
  var fallback = isCap ? startBalanceSafe() : 0;
  /* ts — время каждой точки: подпись при скрабе графика (V3PF). */
  var ts = [];
  out.push(fallback);
  ts.push(Number(S.createdAt) || (hist[0] && hist[0].t) || Date.now());
  var last = fallback;
  for (var i = 0; i < hist.length; i++) {
    var v = hist[i] && hist[i][kind];
    if (typeof v !== 'number' || !isFinite(v)) continue;
    /* Не плодим одинаковые соседние точки — прямую достаточно задать
       двумя концами, а морф на сотнях дублей выглядит тяжёлым. */
    if (!out.length || Math.abs(v - last) > 1e-9) { out.push(v); ts.push(hist[i].t); }
    last = v;
  }
  /* Живой хвост учитывает и РЕАЛИЗОВАННОЕ: снимки в pfHistory пишут
     тот же общий P&L (realized + unrealized), поэтому хвост обязан
     считаться по той же формуле, иначе последняя точка серии
     отрывалась бы от всех остальных. */
  var live = isCap ? capital() : realizedSafe() + invested() - costBasis();
  if (Math.abs(live - last) > 1e-9 || out.length < 2) { out.push(live); ts.push(Date.now()); }
  if (out.length < 2) { out = [live, live]; ts = [Date.now(), Date.now()]; }
  out.ts = ts;
  out.base0 = isCap ? (out[0] || 0) : startBalanceSafe();
  return out;
}

/* Аккуратные чтения счётчиков: старый сейв мог прийти без поля или с
   мусором, и «nan %» под числом никому не нужен. */
function realizedSafe() {
  return (typeof S.realized === 'number' && isFinite(S.realized)) ? S.realized : 0;
}
function startBalanceSafe() {
  return (typeof S.startBalance === 'number' && isFinite(S.startBalance) && S.startBalance > 0)
    ? S.startBalance : 0;
}

/* История PnL позиций. ВАЖНО: qty и cost basis восстанавливаются по
   сделкам. Старая версия брала ТЕКУЩУЮ qty на весь диапазон — поэтому
   актив, купленный минуту назад, будто бы жил на графике 12 часов.

   При sell costPart достаём из `net - pnl`: именно так он считался в
   doSell/tickLimitOrders. Для legacy-записей без pnl используем
   пропорциональную оценку по текущему cost; такие записи старые и
   влияют только на дальний участок.

   РЕАЛИЗОВАННЫЙ P&L ТОЖЕ ВХОДИТ В СЕРИЮ. Раньше считался один
   unrealized, и закрытая в плюс сделка выглядела как ПРОСАДКА: позиция
   исчезала из графика вместе со своим нереализованным плюсом, а деньги,
   упавшие на баланс, в серии не появлялись. Игрок продал с +$500, а
   строка «прибыль за 30 минут» показывала −$400. Теперь точка серии
   это общий P&L на момент t: unrealized(t) + realized(t), где realized
   накапливается по pnl сделок sell. Дельта по окну тогда равна
   «Δunrealized + реализовано внутри окна» — ровно то, что игрок
   заработал за этот период, и ровно то же, что показывает вкладка
   «Капитал» (там реализованное приходит через баланс).

   base0 — стоимость позиций (invested) на начало окна. Нужен строке
   под числом, чтобы считать процент не от «PnL в начале окна» (что
   давало вечные 0.00%), а от того, чем портфель реально стоил. */
function portfolioSeries(points, tf, all) {
  if (all) return allPfSeries('pnl');
  var ts = now();
  var spanMs = points * (tf || 12) * 5000;
  var from = ts - spanMs;
  var trades = pfTradesAsc();

  var ids = {};
  for (var ti = 0; ti < trades.length; ti++) ids[trades[ti].id] = 1;
  for (var pid in S.positions) ids[pid] = 1;

  var closes = {}, times = null, n = points;
  for (var id in ids) {
    var a = assetById(id);
    if (!a) continue;
    var cs = Engine.candles(a, points, tf || 12, ts);
    if (!cs.length) continue;
    var arr = [];
    for (var ci = 0; ci < cs.length; ci++) arr.push(cs[ci].c);
    if (!times) {
      times = [];
      for (var ct = 0; ct < cs.length; ct++) times.push(cs[ct].t);
    }
    closes[id] = arr;
    n = Math.min(n, arr.length);
  }
  if (n < 2 || !times) return flatPnlSeries();

  /* Состояние сейчас → откат на начало диапазона. */
  var qty = {}, cost = {};
  for (var p0 in S.positions) {
    qty[p0] = S.positions[p0].qty;
    cost[p0] = S.positions[p0].cost;
  }
  /* Реализованный P&L отматывается от НАСТОЯЩЕГО счётчика: на начало
     окна зачислены только те sell, что случились раньше него. */
  var realized = realizedSafe();
  function tradeCostPart(tr, qNow, cNow) {
    /* Для ПРОДАЖИ total — брутто (см. doSell: pushTrade получает gross),
       поэтому себестоимость проданной части = total − комиссия − pnl.
       У покупки total, наоборот, уже включает комиссию — там вычитать
       её нельзя (см. ветки buy ниже и комментарий в doBuy). */
    var net = Math.max(0, (tr.total || 0) - (tr.fee || 0));
    if (typeof tr.pnl === 'number' && isFinite(tr.pnl)) return Math.max(0, net - tr.pnl);
    return qNow > 0 ? Math.max(0, cNow * Math.min(1, (tr.qty || 0) / qNow)) : 0;
  }
  var i2;
  for (i2 = trades.length - 1; i2 >= 0; i2--) {
    var tr = trades[i2];
    if (tr.t < from) break;
    if (tr.side === 'buy') {
      qty[tr.id] = (qty[tr.id] || 0) - (tr.qty || 0);
      /* total покупки — вся списанная сумма, ВКЛЮЧАЯ комиссию: ровно её
         живой путь кладёт в pos.cost (см. doBuy). Раньше реплей вычитал
         комиссию, себестоимость на начало окна выходила заниженной, и PnL
         был завышен на сумму всех комиссий окна. */
      cost[tr.id] = (cost[tr.id] || 0) - Math.max(0, tr.total || 0);
    } else if (tr.side === 'reward') {
      /* Награда колеса: на начало окна монеты ещё не было — снимаем её
         вместе с номиналом-базой. Денежный приз на PnL не влияет. */
      if (tr.id) {
        qty[tr.id] = (qty[tr.id] || 0) - (tr.qty || 0);
        cost[tr.id] = (cost[tr.id] || 0) - Math.max(0, tr.total || 0);
      }
    } else {
      var cp = tradeCostPart(tr, (qty[tr.id] || 0) + (tr.qty || 0), cost[tr.id] || 0);
      qty[tr.id] = (qty[tr.id] || 0) + (tr.qty || 0);
      cost[tr.id] = (cost[tr.id] || 0) + cp;
      /* Эта продажа ещё не случилась на начало окна — откатываем и её
         прибыль. Legacy-запись без pnl просто ничего не меняет. */
      if (typeof tr.pnl === 'number' && isFinite(tr.pnl)) realized -= tr.pnl;
    }
    if (Math.abs(qty[tr.id] || 0) < 1e-10) qty[tr.id] = 0;
    if (Math.abs(cost[tr.id] || 0) < 1e-7) cost[tr.id] = 0;
  }

  var k = i2 + 1, out = [], base0 = 0;
  for (var j = 0; j < n; j++) {
    var tAt = times[times.length - n + j];
    while (k < trades.length && (j === n - 1 || trades[k].t <= tAt)) {
      var t2 = trades[k];
      if (t2.side === 'buy') {
        qty[t2.id] = (qty[t2.id] || 0) + (t2.qty || 0);
        cost[t2.id] = (cost[t2.id] || 0) + Math.max(0, t2.total || 0);
      } else if (t2.side === 'reward') {
        /* Монета с колеса приходит с базой = номиналу: PnL в момент
           выигрыша нулевой и дальше живёт по рынку. */
        if (t2.id) {
          qty[t2.id] = (qty[t2.id] || 0) + (t2.qty || 0);
          cost[t2.id] = (cost[t2.id] || 0) + Math.max(0, t2.total || 0);
        }
      } else {
        var cp2 = tradeCostPart(t2, qty[t2.id] || 0, cost[t2.id] || 0);
        qty[t2.id] = (qty[t2.id] || 0) - (t2.qty || 0);
        cost[t2.id] = Math.max(0, (cost[t2.id] || 0) - cp2);
        if (typeof t2.pnl === 'number' && isFinite(t2.pnl)) realized += t2.pnl;
      }
      k++;
    }
    var value = 0, basis = 0;
    for (var qid in qty) {
      if (qty[qid] > 1e-10 && closes[qid]) {
        value += qty[qid] * closes[qid][closes[qid].length - n + j];
        basis += Math.max(0, cost[qid] || 0);
      }
    }
    /* Стоимость портфеля на первой точке — знаменатель для процента
       под числом. Берём именно invested(t0), а не PnL(t0): процент
       должен отвечать на вопрос «сколько я заработал на том, чем
       владел», а не «на сколько вырос мой уже накопленный плюс». */
    if (j === 0) base0 = value;
    out.push(value - basis + realized);
  }
  /* Хвост — ЖИВОЙ общий P&L: unrealized по текущим bid плюс весь
     реализованный. Без realized здесь кривая упиралась бы в другую
     цифру, чем та, что стоит крупным числом над графиком. */
  out[out.length - 1] = realized + invested() - costBasis();
  out.base0 = base0;
  return out;
}

/* Заглушка для «нечего рисовать»: нет ни свечей, ни активов (свежий
   аккаунт либо единственный актив выпилен из каталога). Раньше здесь
   возвращались два нуля, и у игрока с реализованным плюсом, но без
   ценовой истории строка прибыли честно показывала «+$0».

   Начало серии — P&L «на рассвете» известной истории: из текущего
   общего P&L вычитаем прибыль всех sell, которые мы ещё помним. Тогда
   дельта по окну равна реализованному за эту историю плюсу, а не нулю. */
function flatPnlSeries() {
  var v = realizedSafe() + invested() - costBasis();
  var known = 0, raw = S.trades || [];
  for (var i = 0; i < raw.length; i++) {
    var t3 = raw[i];
    if (t3 && t3.side === 'sell' && typeof t3.pnl === 'number' && isFinite(t3.pnl)) known += t3.pnl;
  }
  var out = [v - known, v];
  out.base0 = 0;
  return out;
}

/* История КАПИТАЛА: balance(t) + стоимость позиций на момент t.

   ПОЧЕМУ НЕ «S.balance + invested(t)», как раньше. PnL считается как
   «invested(t) − costBasis», а капитал как «invested(t) + balance».
   Это одна и та же кривая invested(t), сдвинутая по вертикали; график
   масштабируется по min/max своей серии, поэтому сдвиг съедался, и
   обе вкладки рисовали ДОСЛОВНО ОДИН рисунок. Дима это и заметил.

   Чтобы кривые стали разными, капитал должен учитывать то, что
   invested(t) не знает:
     1) баланс меняется сделками — это ступеньки (покупка уводит деньги
        и сразу просаживает капитал на комиссию, продажа возвращает);
     2) позиций раньше могло не быть — до покупки стоимость портфеля
        нулевая, и капитал идёт ровной прямой.
   Оба эффекта восстанавливаются из S.trades: там есть время, сторона,
   сумма и комиссия каждой сделки.

   ЯКОРЬ — текущий S.balance, а не startBalance. История сделок
   обрезается до TRADE_HISTORY_MAX (40), поэтому прямой пересчёт от
   старта разошёлся бы с реальным балансом на старых аккаунтах. Мы
   отматываем сделки НАЗАД от известного настоящего — значит последняя
   точка кривой всегда равна capital() один-в-один. */
function capitalSeries(points, tf, all) {
  if (all) return allPfSeries('cap');
  var ts = now();
  var spanMs = points * (tf || 12) * 5000;
  var from = ts - spanMs;
  var trades = pfTradesAsc();

  /* ---------- 1. Исторические цены по всем активам, которые
              когда-либо были в портфеле ---------- */
  var ids = {};
  for (var ti = 0; ti < trades.length; ti++) ids[trades[ti].id] = 1;
  for (var pid in S.positions) ids[pid] = 1;

  var closes = {}, times = null, n = points;
  for (var id in ids) {
    var a = assetById(id);
    if (!a) continue;
    var cs = Engine.candles(a, points, tf || 12, ts);
    if (!cs.length) continue;
    var arr = [];
    for (var q = 0; q < cs.length; q++) arr.push(cs[q].c);
    /* Время берём из свечей один раз: сетка у всех активов общая
       (один ANCHOR и один tf), поэтому хватит первого актива. */
    if (!times) {
      times = [];
      for (var q2 = 0; q2 < cs.length; q2++) times.push(cs[q2].t);
    }
    closes[id] = arr;
    n = Math.min(n, arr.length);
  }

  /* Активов не было вообще — капитал равен кешу, рисуем прямую.
     Текущее значение, чтобы кривая не врала на последней точке. */
  if (n < 2 || !times) {
    var flat = [], cap = capital();
    for (var f0 = 0; f0 < Math.max(2, points); f0++) flat.push(cap);
    flat.base0 = cap;
    return flat;
  }

  /* ---------- 2. Состояние на начало диапазона ----------
     Отматываем сделки назад от настоящего. Для buy откат = вернуть
     потраченное total и забрать купленные монеты; для sell — забрать
     то, что пришло на руки (total − fee), и вернуть проданные. */
  /* Фьючерсы в истории сделок не отражены: держим их долю постоянной,
     иначе кривая проваливается на сумму маржи и прыгает в последней точке. */
  var bal = S.balance + futEquity();
  var qty = {};
  for (var pid2 in S.positions) qty[pid2] = S.positions[pid2].qty;

  var i2;
  for (i2 = trades.length - 1; i2 >= 0; i2--) {
    var tr = trades[i2];
    if (tr.t < from) break;
    if (tr.side === 'buy') {
      bal += (tr.total || 0);
      qty[tr.id] = (qty[tr.id] || 0) - (tr.qty || 0);
    } else if (tr.side === 'reward') {
      /* Награда колеса: денежная снимается с баланса, монета — из
         позиций. Без этого выигрыш «существовал» уже на начале окна,
         и кривая не показывала ступеньку в момент приза. */
      if (tr.id) {
        qty[tr.id] = (qty[tr.id] || 0) - (tr.qty || 0);
      } else {
        bal -= Math.max(0, tr.total || 0);
      }
    } else {
      bal -= Math.max(0, tr.total || 0);
      qty[tr.id] = (qty[tr.id] || 0) + (tr.qty || 0);
    }
  }

  /* ---------- 3. Прогон по сетке ---------- */
  var k = i2 + 1;
  var out = [];
  for (var j = 0; j < n; j++) {
    var tAt = times[times.length - n + j];
    if (tAt == null) tAt = from + (n > 1 ? j / (n - 1) * spanMs : 0);
    /* Сделки, попавшие в этот отсчёт. На ПОСЛЕДНЕЙ точке досылаем всё
       оставшееся: время закрытия свечи может быть чуть раньше сейчас,
       и свежая сделка иначе не попала бы на график вовсе. */
    while (k < trades.length && (j === n - 1 || trades[k].t <= tAt)) {
      var t2 = trades[k];
      if (t2.side === 'buy') {
        bal -= (t2.total || 0);
        qty[t2.id] = (qty[t2.id] || 0) + (t2.qty || 0);
      } else if (t2.side === 'reward') {
        /* Ступенька приза на кривой капитала: монета добавляет свою
           рыночную стоимость, деньги — приходят на баланс. */
        if (t2.id) {
          qty[t2.id] = (qty[t2.id] || 0) + (t2.qty || 0);
        } else {
          bal += Math.max(0, t2.total || 0);
        }
      } else {
        bal += Math.max(0, t2.total || 0);
        qty[t2.id] = (qty[t2.id] || 0) - (t2.qty || 0);
      }
      k++;
    }
    var v = bal;
    for (var qid in qty) {
      if (!qty[qid] || !closes[qid]) continue;
      v += qty[qid] * closes[qid][closes[qid].length - n + j];
    }
    out.push(v);
  }
  /* Последняя точка — ЖИВОЙ капитал. Кривая идёт по ценам закрытия
     свечей, а в hero игрок видит capital() по bid(now()); разница на
     спреде и на времени до закрытия текущей свечи. Чтобы график
     упирался ровно в ту цифру, что стоит над ним, подменяем хвост. */
  out[out.length - 1] = capital();
  /* Знаменатель для процента — капитал на начало окна. Это та же
     первая точка, но берём её до подмены хвоста: если серия выродилась
     в одну точку, out[0] и есть и начало, и конец. */
  out.base0 = out[0];
  return out;
}

/* График портфеля рисует V3PF (js/v3-portfolio.js) в SVG. */

/* Пончик «разворачивается» по часовой стрелке при первом показе. */
function drawDonut(cv, segments, animate, selectedIdx, hoverIdx) {
  if (cv.__donutRaf) { cancelAnimationFrame(cv.__donutRaf); cv.__donutRaf = 0; }
  if (selectedIdx == null) selectedIdx = -1;
  if (hoverIdx == null) hoverIdx = -1;
  var dpr = Math.max(2, window.devicePixelRatio || 1);
  /* Буфер — под реальный CSS-размер канваса (портфель и кольцо достижений
     разного размера): фиксированные 132 давали лишний буфер 264×264. */
  var size = 132;
  try {
    var _cw = cv.clientWidth || 0;
    if (_cw >= 40 && _cw <= 512) size = Math.round(_cw);
  } catch (e) { dbg('drawDonut', e); }
  if (cv.width !== Math.round(size * dpr)) { cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); }
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  var bgCol = getComputedStyle(document.documentElement).getPropertyValue('--donut-bg').trim() || 'rgba(128,128,128,0.18)';
  var lw = 15;
  var r = (size - lw) / 2 - 2;
  var cx = size / 2, cy = size / 2;

  /* Дуги в долях круга — масштабируются прогрессом анимации. */
  var TAU = Math.PI * 2;
  var arcs = [], acc = 0;
  segments.forEach(function (s) {
    var sweep = Math.max(0.0008, s.share);
    arcs.push({ a0: acc, a1: acc + sweep, color: s.color });
    acc += sweep;
  });

  /* Плавное утолщение выбранного сегмента: 15→20px доезжает за ~180 мс
     вместо мгновенного щелчка. Прогресс живёт на canvas и доезжает
     сам в rAF-петле первичной анимации. */
  if (cv.__selT == null) cv.__selT = 0;
  var targetSel = selectedIdx >= 0 ? 1 : 0;
  cv.__selPrev = cv.__selIdx; cv.__selIdx = selectedIdx;

  function paint(p) {
    /* Догоняем цель утолщения: +1/18 кадра ≈ 180 мс на 60fps. */
    cv.__selT += (targetSel - cv.__selT) * 0.18;
    if (Math.abs(targetSel - cv.__selT) < 0.02) cv.__selT = targetSel;
    var selGrow = 5 * cv.__selT;
    var dimK = 1 - 0.68 * cv.__selT;
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = lw;
    ctx.strokeStyle = bgCol;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    arcs.forEach(function (s, i) {
      var from = -Math.PI / 2 + s.a0 * TAU * p;
      var to = -Math.PI / 2 + s.a1 * TAU * p;
      if (to - from < 0.004) return;
      var isSel = (i === selectedIdx);
      var isHov = (i === hoverIdx) && !isSel;
      /* Выбранный сегмент — толще и ярче, наведённый — чуть толще,
         остальные приглушены (степень зависит от того, есть ли выбор). */
      ctx.lineWidth = lw + (isSel ? selGrow : (isHov ? 3 : 0));
      ctx.globalAlpha = (selectedIdx < 0 || isSel || isHov) ? 1 : (1 - 0.68 * cv.__selT);
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, from, Math.max(from + 0.004, to - 0.02 * p));
      ctx.stroke();
      ctx.lineWidth = lw;
      ctx.globalAlpha = 1;
    });
  }

  /* Мини-петля доезда утолщения — работает и когда первичная анимация
     не играет (перерисовка по тику / reduced motion). */
  function ensureSelLoop() {
    if (cv.__selLoop) return;
    function selStep() {
      if (!cv.isConnected) { cv.__selLoop = 0; return; }
      if (Math.abs(targetSel - cv.__selT) < 0.02) {
        cv.__selT = targetSel;
        cv.__selLoop = 0;
        paint(1);
        return;
      }
      cv.__selT += (targetSel - cv.__selT) * 0.25;
      paint(1);
      cv.__selLoop = requestAnimationFrame(selStep);
    }
    cv.__selLoop = requestAnimationFrame(selStep);
  }
  ensureSelLoop();

  if (!animate || FX.reducedMotion()) { paint(1); return; }
  var t0 = 0, dur = 640;
  function frame(ts) {
    if (!cv.isConnected) { cv.__donutRaf = 0; return; }
    if (!t0) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    paint(1 - Math.pow(1 - p, 3));
    if (p < 1) cv.__donutRaf = requestAnimationFrame(frame);
    else cv.__donutRaf = 0;
  }
  cv.__donutRaf = requestAnimationFrame(frame);
}

/* Попал ли клик в сегмент donut? Возвращает индекс или -1.
   Логика зеркалит drawDonut: дуги идут от -PI/2 (сверху) по часовой,
   каждая занимает долю s.share от полного круга. */
function donutHitTest(cv, clientX, clientY, segments) {
  if (!cv || !segments || !segments.length) return -1;
  var rect = cv.getBoundingClientRect();
  if (!rect.width || !rect.height) return -1;
  var size = 132;
  var scale = rect.width / size;
  var lw = 15, r = (size - lw) / 2 - 2;

  var x = clientX - rect.left, y = clientY - rect.top;
  var cx = rect.width / 2, cy = rect.height / 2;
  var dx = x - cx, dy = y - cy;
  var dist = Math.sqrt(dx * dx + dy * dy);

  /* Клик должен быть в пределах кольца (не в дырке и не снаружи).
     Наружный запас 9px: при 132px канваса кольцо тонкое для пальца. */
  var inner = (r - lw / 2) * scale;
  var outer = (r + lw / 2 + 9) * scale;
  if (dist < inner || dist > outer) return -1;

  /* Угол: 0 = сверху (где начинается первый сегмент), растёт по часовой. */
  var ang = Math.atan2(dy, dx) + Math.PI / 2;
  if (ang < 0) ang += Math.PI * 2;
  var frac = ang / (Math.PI * 2);

  var acc = 0;
  for (var i = 0; i < segments.length; i++) {
    var sweep = Math.max(0.0008, segments[i].share);
    if (frac >= acc && frac < acc + sweep) return i;
    acc += sweep;
  }
  return -1;
}

function costBasis() {
  var c = 0;
  for (var id in S.positions) c += S.positions[id].cost;
  return c;
}

/* Точечное обновление строк портфеля — без перерисовки (иначе анимации перезапускаются). */
function updatePortfolioPrices() {
  renderPortfolio(true);
}

/* Минимальный интервал между пересборками спарклайнов строк портфеля
   на плановом тике. Числа (qty, value, PnL, доля) обновляются каждые
   500 мс как раньше — троттлится только дорогая геометрия. */
var PF_SPARK_MS = 1000;
var _pfSparkAt = 0;

/* ------------------------------ Рейтинг ------------------------------ */

/* Активный фильтр. Реальный SDK отдаёт только капитал, поэтому «% успешных»
   полноценно работает в мок-режиме, а на платформе гаснет. */
var ratingFilter = 'capital';
var ratingFiltersBound = false;
var ratingAllFilters = false;

/* Кеш последней загрузки лидерборда. Переключение фильтра меняет только
   порядок строк и правую колонку — данные те же, дёргать SDK незачем. */
var ratingCache = null;
/* Поколение запроса к SDK: ответ, пришедший после смены фильтра или
   повторного рендера, устарел и доску не перерисовывает (раньше два
   промиса гоняли renderAll наперегонки — побеждал не свежий). */
var ratingReqSeq = 0;

/* Короткая неровность: идеально ровные задержки читаются как сгенерированные. */
function jitter(base, spread) { return Math.round(base + Math.random() * spread); }

/* Перезапуск CSS-анимации: без принудительного reflow браузер не считает
   повторное навешивание класса за новую анимацию. */
function restartAnim(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function reducedMotion() {
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (_) { return false; }
}

/* Мок-список. seed фиксированный: иначе боты «прыгали» бы при каждом
   переключении фильтра или возврате на вкладку.

   Шестьдесят ботов по степенному закону (как распределён капитал в живом
   рейтинге): между топ-20 и новичком остаётся «пропуск», а лиги по классам
   заполнены. Титул и рамка у части ботов — то, что в живом рейтинге придёт
   из extraData записи. P&L и чужие сдвиги места не выдумываем: SDK про них
   не знает. */
var RT_BOT_TITLES = ['title_sniper', 'title_veteran', 'title_champion', 'title_resident', 'title_hunter',
  'title_peak', 'title_patient', 'title_double', 'title_steel', 'title_allin'];
var RT_BOT_FRAMES = ['sapphire', 'amethyst', 'emerald', 'amber', 'silver', 'bronze', 'copper', 'brass',
  'titan', 'steel', 'mosaic', 'wheel'];
function mockLeaders() {
  var list = [];
  var used = {};
  var seed = 1234;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  /* Имена берём из тех же влезающих пар, что и randomNick: иначе у соперника
     оказывалось имя в 20 символов, которое строка рейтинга обрезала
     многоточием, а игрок такого имени себе позволить не мог. */
  var cands = nickCandidates(LANG === 'ru' ? 'ru' : 'en');
  var prev = Infinity;
  for (var guard = 0; list.length < 60 && guard < 900; guard++) {
    var pick = cands.length ? cands[Math.floor(rnd() * cands.length)] : { s: 'Trader', num: true };
    var name = pick.num ? pick.s + Math.floor(rnd() * 90 + 10) : pick.s;
    if (used[name]) continue;
    used[name] = 1;
    var k = list.length;
    var s = 1450000 / Math.pow(k + 1, 1.275) * (1 + (rnd() - 0.5) * 0.09);
    s = Math.min(s, prev * 0.975);
    prev = s;
    var e = { id: 'bot' + k, name: name, score: Math.round(s), winRate: 0.38 + rnd() * 0.48, me: false };
    if (k === 0) { e.title = 'title_whale'; e.frame = 'kit'; e.winRate = 0.81; }
    else if (k === 1) { e.title = 'title_millionaire'; e.frame = 'coin'; }
    else if (k === 2) { e.title = 'title_phoenix'; e.frame = 'phoenix'; }
    else {
      if (rnd() < 0.3) e.title = RT_BOT_TITLES[Math.floor(rnd() * RT_BOT_TITLES.length)];
      if (rnd() < 0.25) e.frame = RT_BOT_FRAMES[Math.floor(rnd() * RT_BOT_FRAMES.length)];
    }
    list.push(e);
  }
  return list;
}

/* По чему сортируем и что пишем в правой колонке — зависит от фильтра. */
function ratingValue(e) {
  if (!e) return 0;
  if (ratingFilter === 'winrate') return e.noWr ? -1 : (e.winRate || 0);
  return e.score || 0;
}
function ratingValueText(e) {
  if (ratingFilter === 'winrate') {
    /* Игрок без сделок: «0%» читается как «ты всё сливал», хотя сделок
       просто не было. Честнее прочерк. */
    if (!e || e.noWr || e.winRate == null) return '—';
    return Math.round((e.winRate || 0) * 100) + '%';
  }
  return money(Math.round((e && e.score) || 0), 0);
}
function sortEntries(list) {
  return list.slice().sort(function (x, y) { return ratingValue(y) - ratingValue(x); });
}

/* Рамка витрины у аватары в рейтинге: своя — надетая в витрине, у соперника —
   из записи лидерборда (extraData / мок). */
function achFrameClass(e) {
  if (!e) return '';
  if (!e.me) return e.frame ? ' fr-' + e.frame : '';
  if (typeof Ach === 'undefined' || !Ach.isOn || !Ach.isOn()) return '';
  try {
    var f = Ach.equippedFrame();
    return f ? ' fr-' + String(f).replace('frame_', '') : '';
  } catch (err) { return ''; }
}
/* Титул записи: свой — надетый (с флагом языка), у соперника — из записи. */
function ratingTitleText(e) {
  if (!e) return '';
  if (!e.me) return e.title ? t('item_' + e.title + '_t') : '';
  if (typeof Ach === 'undefined' || !Ach.isOn || !Ach.isOn()) return '';
  try {
    var tid = Ach.equippedTitle();
    return tid ? t('item_' + tid + '_t') + Ach.flagSuffix() : '';
  } catch (err) { return ''; }
}
/* Пилюля титула (soft — приглушённая, для чужих строк списка). */
function achTitleHtml(e, soft) {
  var tx = ratingTitleText(e || { me: true });
  if (!tx) return '';
  return '<span class="rt-title' + (soft ? ' soft' : '') + '"><svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<path d="M24 7l5 10.4 11.4 1.6-8.2 8 2 11.3L24 33l-10.2 5.3 2-11.3-8.2-8 11.4-1.6z"/></svg>' + esc(tx) + '</span>';
}

/* Разметку доски (герой «Ваше место», подиум, лиги, плашка «Вы», шторки)
   строит RatingV3 из js/v3-rating.js; здесь — данные и выбор режима. */

function setRatingFilterUI(flash) {
  $$('#rating-filters [data-filter]').forEach(function (b) {
    var on = b.getAttribute('data-filter') === ratingFilter;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  if (typeof RatingV3 !== 'undefined') RatingV3.segInd(!flash);
  var label = $('#hh-cap-label');
  if (label) {
    var want = ratingFilter === 'winrate' ? t('rating_filter_winrate') : t('rating_capital');
    if (label.textContent !== want) {
      label.textContent = want;
      if (flash) restartAnim(label, 'mv');
    }
  }
  /* Подсказка у ⓘ обязана объяснять ту колонку, что сейчас на экране. */
  var info = $('#hh-cap-info');
  if (info) {
    var hint = ratingFilter === 'winrate' ? t('rating_wr_hint') : t('rating_capital_hint');
    info.title = hint;
    info.setAttribute('aria-label', hint);
  }
}

/* На реальном SDK доступен только капитал — остальные табы гасим.
   Не блокируем атрибутом disabled: заблокированная кнопка не ловит
   клик, и причина недоступности (title) на таче нечитаема. Вместо
   этого клик по погашенной пилюле показывает честный тост. */
function setRatingFiltersEnabled(all) {
  ratingAllFilters = !!all;
  $$('#rating-filters [data-filter]').forEach(function (b) {
    var f = b.getAttribute('data-filter');
    var off = f !== 'capital' && !all;
    b.classList.toggle('is-off', off);
    b.title = off ? t('rating_filter_na') : '';
  });
  if (!all && ratingFilter !== 'capital') ratingFilter = 'capital';
}

function bindRatingFilters() {
  if (ratingFiltersBound) return;
  var btns = $$('#rating-filters [data-filter]');
  if (!btns.length) return;
  ratingFiltersBound = true;
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      if (f === ratingFilter) return;
      if (!ratingAllFilters && f !== 'capital') {
        /* Погашенный фильтр: объясняем, почему не переключает. */
        toast(t('rating_filter_na'));
        FX.pulse(b, 'ico-pop', 420);
        return;
      }
      switchRatingFilter(f);
    });
  });
  /* ⓘ у колонки — шторка «Как считается рейтинг». */
  var info = $('#hh-cap-info');
  if (info) {
    info.addEventListener('click', function () {
      if (typeof RatingV3 !== 'undefined') RatingV3.infoSheet();
      else toast(info.getAttribute('aria-label') || t('rating_capital_hint'));
      FX.vibrate(6);
    });
  }
  setRatingFilterUI(false);
}

/* Смена фильтра: строки не перерисовываются заново, а переезжают на новые
   места (FLIP в RatingV3). Данные — из кеша, SDK не дёргаем. */
function switchRatingFilter(f) {
  ratingFilter = f;
  setRatingFilterUI(true);
  renderRating({ swap: true });
}

/* Режимы:
   (без opts) — вход на вкладку: каскад, подиум поднимается, место «докручивается»;
   swap — смена фильтра (данные из кеша, строки переезжают);
   live — капитал изменился, пока вкладка открыта (строка обгоняет соседей);
   refresh — кнопка «Обновить» / потянуть вниз. */
function renderRating(opts) {
  opts = opts || {};
  var mode = opts.swap ? 'filter' : opts.live ? 'move' : opts.refresh ? 'refresh' : 'intro';
  bindRatingFilters();

  var me = {
    id: 'me',
    name: S.name || '—',
    /* Капитал, а не рекорд: колонка называется «Капитал», и в профиле
       «Рекорд капитала» — отдельная строка. С S.best игрок, сливший счёт,
       продолжал висеть в рейтинге со старой суммой. */
    score: Math.round(capital()),
    winRate: successRate(),
    noWr: !S.sellsCount,
    me: true
  };
  /* Гость (платформа, но без входа): топ виден, своего места нет. */
  var guest = !YaGame.mock && !YaGame.isAuthorized();

  function renderAll(entries, myRank, allFilters, src, rmode, keepTime) {
    var t0 = keepTime && ratingCache ? ratingCache.t : Date.now();
    ratingCache = { entries: entries, myRank: myRank, allFilters: !!allFilters, src: src, t: t0 };
    setRatingFiltersEnabled(!!allFilters);
    setRatingFilterUI(false);

    var pool = guest ? entries.filter(function (e) { return !e.me; }) : entries;
    var sorted = sortEntries(pool).map(function (e) { var c = {}; for (var k in e) c[k] = e[k]; return c; });
    /* Ранги: у SDK — свои (страница может быть «топ + соседи» с разрывом),
       иначе — позиция в списке. Свою запись без ранга ставим сразу под
       соседом выше. */
    var sdkRanks = src === 'sdk' && ratingFilter === 'capital';
    for (var i = 0; i < sorted.length; i++) {
      var e = sorted[i];
      if (sdkRanks && e.me && myRank) e._rank = myRank;
      else if (sdkRanks && e.rank) e._rank = e.rank;
      else e._rank = sdkRanks && i > 0 ? sorted[i - 1]._rank + 1 : i + 1;
    }
    /* Место по капиталу — для сдвига «с прошлого визита», даже если на
       экране сейчас «% успешных». */
    var capRank = null;
    if (!guest) {
      if (src === 'sdk' && myRank) capRank = myRank;
      else {
        var by = pool.slice().sort(function (x, y) { return (y.score || 0) - (x.score || 0); });
        for (var j = 0; j < by.length; j++) if (by[j].me) { capRank = j + 1; break; }
      }
    }
    if (typeof RatingV3 !== 'undefined') {
      RatingV3.render({
        list: sorted, guest: guest, filter: ratingFilter, capRank: capRank,
        live: src !== 'sdk', updatedAt: t0, meScore: me.score
      }, rmode || mode);
    }
  }
  /* Свежая своя запись вместо закешированной: капитал мог измениться. */
  function withFreshMe(entries) {
    return entries.filter(function (e) { return !e.me; }).concat([me]);
  }

  /* Смена фильтра / живой сдвиг: данные уже в кеше, повторно SDK не дёргаем. */
  if ((opts.swap || opts.live) && ratingCache) {
    var ents = ratingCache.src === 'sdk' ? ratingCache.entries : withFreshMe(ratingCache.entries);
    renderAll(ents, ratingCache.myRank, ratingCache.allFilters, ratingCache.src, null, true);
    return;
  }

  /* Реальный лидерборд — на платформе для всех. Гостю раньше рисовалась
     доска ботов (mockLeaders), неотличимая от настоящей: «топ трейдеров»
     из выдуманных имён — риск модерации. Топ SDK отдаёт и без входа;
     includeUser/quantityAround — только у авторизованных. */
  if (!YaGame.mock && YaGame.ysdk && YaGame.ysdk.leaderboards) {
    /* Кнопка «Обновить» чаще раза в 20 с — из кеша: у лидербордов SDK
       лимит запросов. */
    if (opts.refresh && ratingCache && ratingCache.src === 'sdk' && Date.now() - ratingCache.t < 20000) {
      renderAll(ratingCache.entries, ratingCache.myRank, ratingCache.allFilters, 'sdk', 'refresh', true);
      return;
    }
    if (opts.refresh) maybeSubmitScore();
    var reqId = ++ratingReqSeq;
    /* Вход с кешем: сразу показываем прошлую доску, свежий ответ доедет
       перестановкой строк. Без кеша — скелетон. */
    var fetchMode = mode;
    if (mode === 'intro') {
      if (ratingCache && ratingCache.src === 'sdk') {
        renderAll(ratingCache.entries, ratingCache.myRank, ratingCache.allFilters, 'sdk', 'intro', true);
        fetchMode = 'quiet';
      } else if (typeof RatingV3 !== 'undefined') RatingV3.skeleton();
    }
    var authed = YaGame.isAuthorized();
    YaGame.ysdk.leaderboards.getEntries(CONFIG.leaderboard, authed
      ? { quantityTop: 20, includeUser: true, quantityAround: 3 }
      : { quantityTop: 20, includeUser: false }).then(function (res) {
      /* Устаревший ответ: пока ждали, сменили фильтр или перерисовали доску. */
      if (reqId !== ratingReqSeq) return;
      var entries = (res.entries || []).map(function (e) {
        /* extraData (если игра его пишет): { t: титул, f: рамка, wr: % успешных }. */
        var x = null;
        try { x = e.extraData ? JSON.parse(e.extraData) : null; } catch (_x) { x = null; }
        var okId = function (v) { return typeof v === 'string' && /^[a-z_]{2,24}$/.test(v) ? v : null; };
        var pl = e.player || {};
        return {
          id: 'y:' + (pl.uniqueID || e.rank),
          name: pl.publicName || 'Player',
          score: e.score,
          rank: e.rank,
          winRate: x && typeof x.wr === 'number' ? x.wr : null,
          title: x ? okId(x.t) : null,
          frame: x ? okId(x.f) : null,
          /* Свою запись SDK возвращает (includeUser: true): помечаем по
             рангу, иначе игрок видел бы себя дважды. */
          me: res.userRank != null && e.rank === res.userRank
        };
      });
      var hasMe = false;
      for (var i = 0; i < entries.length; i++) if (entries[i].me) { entries[i].id = 'me'; hasMe = true; break; }
      if (!hasMe) entries.push(me);
      renderAll(entries, res.userRank || null, false, 'sdk', fetchMode);
    }).catch(function () {
      if (reqId !== ratingReqSeq) return;
      /* Ошибка сети/SDK — мок-доска остаётся фолбэком, фильтры не включаются. */
      renderAll(mockLeaders().concat([me]), null, false, 'mock', fetchMode === 'quiet' ? 'refresh' : fetchMode);
    });
    return;
  }

  /* Мок или гость: локальный список, боты + мы. */
  renderAll(mockLeaders().concat([me]), null, true, 'mock');
}

function signIn() {
  YaGame.openAuthDialog().then(function (ok) {
    if (ok) location.reload(); // перечитываем облачный прогресс
  });
}

/* ------------------------------ Профиль ------------------------------ */

/* Разметку и живое поведение вкладки строит js/v3-profile.js (V3P) по
   concept/profile.html: герой с надетым, лестница классов, статистика,
   карточка достижений и витрина-примерочная. Здесь — точки входа, которые
   зовут остальные модули игры. */

/* Надетое в герое (рамка, титул, ранг) и витрина. Дёргает и Ach.applyEquip()
   при смене предмета — поэтому отдельной функцией. */
function refreshProfileEquip() {
  if (typeof V3P !== 'undefined') V3P.equip();
}

function renderProfile(opts) {
  var intro = !!(opts && opts.intro);
  /* Каскад появления перезапускаем только при входе на вкладку: любая
     перерисовка (смена рамки, сделка) не должна гонять его заново. */
  var _page = $('#tab-profile');
  if (_page) {
    if (intro) {
      _page.classList.remove('pr-intro');
      void _page.offsetWidth;
      _page.classList.add('pr-intro');
    } else if (!_page.classList.contains('pr-intro')) {
      _page.classList.add('pr-intro');
    }
  }
  if (typeof V3P !== 'undefined') V3P.render(intro);
}

/* Живое обновление из тика (500 мс): капитал, лестница класса, рекорд,
   новые очки достижений — лёгким патчем, без полного renderProfile. */
function updateProfileLive() {
  if (typeof V3P !== 'undefined') V3P.live();
}

/* ------------------------------ Эмблемы классов ------------------------------ */

/* Каждая эмблема — inline SVG на золотом круге, который в CSS.
   Стиль «нарисовано рукой»: линии не идеально ровные, иногда сдвинуты
   на 1-2px, у некоторых эмблем есть маленький «блик» для жизни.
   Размер контейнера задаётся CSS, viewBox фиксированный. */
/* Эмблемы рисуются СВЕТЛЫМИ линиями, а не тёмными.
   Это принципиально: медаль-подложка в CSS тёмная (графит), а раньше
   фигуры были тёмно-коричневыми (#221703) и предназначались для
   золотого фона. Стоило эмблеме оказаться без золотой подложки
   (модалка повышения) — получался чёрный рисунок на чёрном фоне.
   Теперь рисунок всегда светлый: на графите он читается как золотая
   гравировка, на золоте — как тёмный контур (светлая линия + тёмная
   обводка под ней). Менять местами больше нельзя нигде. */
function classIconHTML(key) {
  var ink = '#f7d879';        /* основной штрих — золото */
  var hi = '#fff6dd';         /* блик/акцент — почти белый */
  var dim = '#c98f1b';        /* второстепенная деталь — тёмное золото */
  var acc = '#3bffa3';        /* цветной акцент — биржевой зелёный */
  var body;
  switch (key) {
    case 'novice': {
      /* Росток: первый капитал, который только пророс.
         Стебель намеренно чуть кривой и левый лист крупнее правого —
         симметрия читалась бы как «нарисовано программой». */
      body = '<path d="M32 50 C31 40 32 32 33 24" stroke="' + ink + '" stroke-width="3" fill="none" stroke-linecap="round" />' +
        '<path d="M32 34 C26 34 21 30 20 24 C27 24 31 28 32 34 Z" fill="' + ink + '" />' +
        '<path d="M33 28 C38 27 42 23 43 18 C37 18 34 22 33 28 Z" fill="' + hi + '" opacity="0.92" />' +
        '<path d="M23 50 L41 50" stroke="' + dim + '" stroke-width="2.4" stroke-linecap="round" />';
      break;
    }
    case 'apprentice': {
      /* Раскрытая книга: учимся читать графики.
         Правая страница чуть толще левой (корешок смещён на 1px). */
      body = '<path d="M32 22 C26 17 18 16 11 17 L11 45 C18 44 26 45 32 50 Z" fill="' + ink + '" />' +
        '<path d="M32 22 C38 17 46 16 53 17 L53 45 C46 44 38 45 32 50 Z" fill="' + hi + '" opacity="0.92" />' +
        '<path d="M32 22 L32 50" stroke="' + dim + '" stroke-width="1.8" stroke-linecap="round" />' +
        '<path d="M17 26 L27 27 M17 32 L27 33 M37 27 L47 26 M37 33 L47 32" stroke="' + dim + '" stroke-width="1.4" stroke-linecap="round" opacity="0.75" />';
      break;
    }
    case 'skilled': {
      /* Восходящий график с точками и стрелкой-наконечником. */
      body = '<path d="M12 46 L24 37 L32 41 L44 26 L52 18" stroke="' + ink + '" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />' +
        '<path d="M43 18 L52 18 L52 27" stroke="' + acc + '" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />' +
        '<circle cx="24" cy="37" r="2.6" fill="' + dim + '" />' +
        '<circle cx="32" cy="41" r="2.6" fill="' + dim + '" />' +
        '<path d="M12 51 L52 51" stroke="' + dim + '" stroke-width="2" stroke-linecap="round" opacity="0.6" />';
      break;
    }
    case 'pro': {
      /* Щит со звездой — «свой в деле». */
      body = '<path d="M32 11 L48 18 L48 34 Q48 47 32 53 Q16 47 16 34 L16 18 Z" fill="' + ink + '" />' +
        '<path d="M32 11 L48 18 L48 34 Q48 47 32 53 Z" fill="' + dim + '" opacity="0.45" />' +
        '<path d="M32 23 L34.6 30 L42 30.8 L36.2 35.5 L37.9 42.4 L32 38.7 L26.1 42.4 L27.8 35.5 L22 30.8 L29.4 30 Z" fill="' + hi + '" />';
      break;
    }
    case 'elite': {
      /* Корона в лавровом обрамлении. Зубцы разной высоты:
         ровная «пила» выглядит штампованной. */
      body = '<path d="M13 40 L17 21 L25 31 L32 13 L39 31 L47 21 L51 40 Z" fill="' + ink + '" />' +
        '<rect x="13" y="39" width="38" height="6.5" rx="1.6" fill="' + hi + '" />' +
        '<circle cx="32" cy="27" r="3.4" fill="' + dim + '" />' +
        '<circle cx="17" cy="20" r="2" fill="' + hi + '" />' +
        '<circle cx="47" cy="20" r="2" fill="' + hi + '" />' +
        '<path d="M12 47 C8 43 8 37 11 33" stroke="' + acc + '" stroke-width="2.2" fill="none" stroke-linecap="round" />' +
        '<path d="M52 47 C56 43 56 37 53 33" stroke="' + acc + '" stroke-width="2.2" fill="none" stroke-linecap="round" />';
      break;
    }
    case 'legend': {
      /* Кубок с лавровым венком — высшая ступень.
         Ручки кубка разные по изгибу, венок несимметричный. */
      body = '<path d="M20 12 L44 12 L42 29 Q42 35 32 35 Q22 35 22 29 Z" fill="' + ink + '" />' +
        '<path d="M20 14 Q11 15 12 23 Q13 29 20 29" stroke="' + hi + '" stroke-width="2.6" fill="none" stroke-linecap="round" />' +
        '<path d="M44 14 Q53 15 52 23 Q51 29 44 29" stroke="' + hi + '" stroke-width="2.6" fill="none" stroke-linecap="round" />' +
        '<path d="M30 35 L34 35 L34 43 L40 47 L24 47 L30 43 Z" fill="' + hi + '" />' +
        '<path d="M32 16 L34.6 22 L41 22.6 L36.2 27 L37.8 33.4 L32 30 L26.2 33.4 L27.8 27 L23 22.6 L29.4 22 Z" fill="' + dim + '" opacity="0.85" />' +
        '<path d="M9 50 C6 45 7 39 11 35" stroke="' + acc + '" stroke-width="2.2" fill="none" stroke-linecap="round" />' +
        '<path d="M55 50 C58 45 57 39 53 35" stroke="' + acc + '" stroke-width="2.2" fill="none" stroke-linecap="round" />';
      break;
    }
    default: {
      /* Фолбэк для неизвестного ключа: простой ромб-камень.
         На случай, если в CLASSES попадёт icon, которого здесь нет. */
      body = '<path d="M32 14 L50 32 L32 50 L14 32 Z" fill="' + ink + '" />' +
        '<path d="M32 14 L50 32 L32 50 Z" fill="' + dim + '" opacity="0.5" />';
    }
  }
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
}

/* Вставляет эмблему класса в контейнер. Два режима:
   1. У класса задано поле img (готовая PNG-медаль) — вставляем <img>
      и помечаем контейнер классом class-ico--png. PNG уже содержит
      и графитовую подложку, и золотое кольцо, и гравировку, поэтому
      CSS-обвязку .class-ico (подложка, рамка, насечка) нужно
      отключить — иначе выйдет двойной ободок. Этим занимается
      class-ico--png в style.css.
   2. PNG нет или ключ неизвестен — рисуем inline SVG из classIconHTML().
   Режим выбирается по НАЛИЧИЮ ФАЙЛА, поэтому чтобы вернуться на SVG,
   достаточно убрать поле img из CLASSES в data.js. */
function setClassIcon(el, key) {
  if (!el) return;
  var cls = null;
  for (var i = 0; i < CLASSES.length; i++) {
    if (CLASSES[i].icon === key) { cls = CLASSES[i]; break; }
  }
  if (cls && cls.img) {
    el.innerHTML = '<img class="class-ico-img" src="' + cls.img +
      '" alt="" draggable="false">';
    el.classList.add('class-ico--png');
  } else {
    el.innerHTML = classIconHTML(key);
    el.classList.remove('class-ico--png');
  }
}

/* Мини-график в строке класса — не реальная цена, а детерминированная
   линия по индексу: разные классы получают разные «траектории», и
   визуально получается набор разных узоров. Это и есть «один из тех
   живых штрихов», которые отличают наш список от шаблонного.

   ВНИМАНИЕ: сейчас функция НИКЕМ НЕ ВЫЗЫВАЕТСЯ (проверено грепом по
   js/, index.html и tools/). Экран классов рисует строки без графика.
   Не удаляю: это готовая отрисовка живого штриха, а не мусор — если
   Дима захочет вернуть мини-графики в список классов, тут всё есть.
   Помечено в docs/AUDIT-2026-09-16.md. */
/* curIdx — индекс ТЕКУЩЕГО класса игрока. Раньше цвет брался из
   S.classSeen, но это «последний показанный», а не «нынешний»: если
   капитал просел, индексы расходятся и подсветка врёт. */
function drawClassSpark(canvas, classIdx, curIdx) {
  if (!canvas || canvas.__clsparkRaf) return;
  /* Ширина и высота фиксированы через CSS — 58x26, но
     уважаем devicePixelRatio (на iOS это 3, иначе линия пиксельная). */
  var dpr = Math.max(2, window.devicePixelRatio || 1);
  var W = 58, H = 26;
  if (canvas.width !== Math.round(W * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  /* Детерминированная фаза от индекса класса, чтобы линия не повторялась
     между соседями. Стартовый «уровень» растёт с индексом (ранг выше —
     кривая выше), и форма получается разной. */
  var seed = (classIdx * 7919 + 31) % 1000 / 1000;
  var pts = 18;
  var data = [];
  for (var i = 0; i < pts; i++) {
    /* Кривая в форме sin(i/freq + phase) + шум от seed — каждый класс
       со своей частотой и фазой. */
    var phase = seed * Math.PI * 2;
    var freq = 1.4 + (classIdx / CLASSES.length) * 1.6;
    var v = Math.sin(i * freq * 0.3 + phase) * 0.5 + 0.5;
    /* Лёгкий тренд вверх для верхних классов — как будто у «легенды»
       линия ушла в небо. */
    var trend = (i / (pts - 1)) * (classIdx / CLASSES.length) * 0.7;
    data.push(Math.max(0, Math.min(1, v * 0.7 + trend * 0.5 + 0.1)));
  }
  /* Цвет: один для всех строк, простое золото-приглушённое.
     Пройденные — серые (opacity), текущий — ярче + чуть толще.
     Дима попросил убрать разноцветные графики и «лишнее» — нет
     glow, нет точки в конце. */
  var isDone = classIdx < curIdx;
  var isNow = classIdx === curIdx;
  ctx.strokeStyle = isDone ? '#98a2b3' : '#e9b640';
  ctx.globalAlpha = isNow ? 1 : isDone ? 0.55 : 0.85;
  ctx.lineWidth = isNow ? 1.8 : 1.4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (var j = 0; j < data.length; j++) {
    var x = j / (data.length - 1) * (W - 2) + 1;
    var y = H - 2 - data[j] * (H - 6);
    if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------------------ Открытие экрана классов ------------------------------ */

/* Откуда открыли экран — возвращаемся туда же. Сейчас открывается только
   из профиля, но пусть будет тот же паттерн, что у openTrade(): легче
   расширять, если потом захотим открывать ещё откуда-то. */
var classesReturnTo = 'app-main';

function openClasses() {
  classesReturnTo = 'app-main';
  showScreen('scr-classes', 'right');
  /* setTab в quiet — показать вкладку «Профиль», без анимации,
     как уже сделано у openTrade(). */
  setTab('profile', true);
  renderClasses();
}

function closeClasses() {
  var prev = classesReturnTo;
  classesReturnTo = 'app-main';
  /* Докрутка капитала в hero живёт на rAF и держит ссылку на узел —
     гасим её до переключения экрана, иначе она доезжает своё уже
     на скрытом экране. См. stopHeroCapTween(). */
  stopHeroCapTween();
  showScreen(prev, 'left');
  setTab('profile', true);
  /* Без intro: renderTab жёстко шлёт renderProfile({intro:true}), а это
     перезапускает каскад витрины (renderVitrine(true)) — 21 карточка
     заново влетала до 620 мс, хотя витрину игрок не покидал. Нужен
     просто свежий рендер после докрутки капитала. См. AUDIT-2026-09-16. */
  renderProfile();
}

/* Карточка класса в профиле — единая точка клика. */
/* Плитки статистики профиля ведут каждая в свой раздел: шеврон в углу
   должен что-то открывать, иначе это мёртвый элемент. «Сделок» и
   «Успешных» — на экран достижений (там живут их серии), P&L — в
   портфель, «Рекорд капитала» — в рейтинг. */
function bindProfileStatCards() {
  var cards = document.querySelectorAll('#tab-profile [data-pr-go]');
  for (var i = 0; i < cards.length; i++) {
    (function (card) {
      if (card.__prGoBound) return;
      card.__prGoBound = true;
      card.onclick = function (e) {
        var go = card.getAttribute('data-pr-go');
        var r = card.getBoundingClientRect();
        FX.ripple(card, e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2));
        FX.vibrate(6);
        if (go === 'ach') { try { Ach.openScreen(); } catch (err) { dbg('profile:statGo', err); } }
        else if (go === 'portfolio') setTab('portfolio');
        else if (go === 'rating') setTab('rating');
      };
    })(cards[i]);
  }
}

function bindProfileClassCard() {
  var btn = $('#pr-class-card');
  if (!btn || btn.__clBound) return;
  btn.__clBound = true;
  btn.onclick = function (e) {
    /* Эмблемы лестницы показывают подсказку (js/v3-profile.js), а не
       открывают экран классов. */
    if (e.target && e.target.closest && e.target.closest('.v3p-lad-node')) return;
    var r = btn.getBoundingClientRect();
    /* Рябь под пальцем — стандартный приём проекта, иначе нажатие
       читается как «мертвое». */
    FX.ripple(btn, e.clientX || (r.left + r.width / 2), e.clientY || (r.top + r.height / 2));
    FX.vibrate(8);
    openClasses();
  };
}

/* Индекс вершины — последний класс в CLASSES. Считаем от длины, а не
   хардкодим «5»: если Дима добавит седьмой класс, всё особое
   оформление переедет на него само. */
function pinnacleIdx() { return CLASSES.length - 1; }

function renderClasses() {
  bindProfileClassCard();
  var clBack = $('#cl-back');
  if (clBack && !clBack.__clBound) {
    clBack.__clBound = true;
    clBack.onclick = closeClasses;
  }
  var cap = capital();
  var idx = classFor(cap);
  var cls = CLASSES[idx];
  var topIdx = pinnacleIdx();
  var isTop = idx >= topIdx;

  /* Hero-карточка в стиле биржевого трекера ранга:
     [большая медаль текущего] [имя + описание + bar + $X/$Y + CTA]
     [блок «Следующая цель»: эмблема + имя + бейдж].
     Слева — где игрок сейчас, справа — куда идёт. На максимальном
     классе правый блок превращается в статичную плашку MAX.
     Раньше над hero стояла ещё горизонтальная шкала-трекер из 6 узлов,
     но она дублировала то, что и так видно в `.cl-list` ниже, и
     съедала высоту экрана без смысла. */
  var heroEl = $('#cl-hero');
  if (heroEl) heroEl.classList.toggle('cl-hero--pinnacle', isTop);

  setClassIcon($('#cl-hero-ico'), cls.icon);
  /* Мини-иконка рядом с именем — маленькая копия эмблемы, «якорь»
     визуального ряда: большая медаль слева та же самая, что и эта. */
  setClassIcon($('#cl-hero-mini'), cls.icon);
  var nm = $('#cl-hero-name');
  nm.textContent = cls.name[LANG] || cls.name.en;
  var barFill = $('#cl-hero-fill');
  var capNow = $('#cl-hero-cap-now');
  var capGoal = $('#cl-hero-cap-goal');
  var ctaEl = $('#cl-hero-cta');
  var nextIco = $('#cl-hero-next-ico');
  var nextName = $('#cl-hero-next-name');
  var nextLabel = $('#cl-hero-label-next');
  var nextGoal = $('#cl-hero-goal');
  var nextPin = $('#cl-hero-pinnacle');

  if (isTop) {
    /* Максимальный класс — вся полоса заполнена, цифры «$X» и
       «максимальный класс», вместо правой эмблемы статичная плашка
       «MAX». Никаких motion-эффектов на плашке — она не цель,
       она потолок. */
    barFill.style.width = '100%';
    if (capNow) tweenHeroCap(capNow, cap);
    if (capGoal) capGoal.textContent = ' / ' + t('max_class');
    if (ctaEl) ctaEl.style.display = 'none';
    nextIco.classList.add('cl-hero-next--max');
    /* Плашка MAX рисуется CSS-градиентом, а class-ico--png гасит
       фон и рамку — без этой очистки плашка стала бы прозрачной. */
    nextIco.classList.remove('class-ico--png');
    nextIco.innerHTML = '<span class="cl-hero-next-max-label">MAX</span>';
    if (nextName) nextName.textContent = t('max_class');
    if (nextLabel) nextLabel.textContent = t('class_pinnacle');
    if (nextGoal) nextGoal.classList.add('cl-hero-goal--max');
    if (nextPin) nextPin.classList.add('hidden');
  } else {
    var lo = CLASSES[idx].cap;
    var hi = CLASSES[idx + 1].cap;
    var pct = Math.min(100, Math.max(4, (cap - lo) / (hi - lo) * 100));
    /* Анимация «дорос до сюда»: бар стартует с 0 и за 0.9 с доезжает
       до реального процента. Только при смене значения — иначе при
       каждом тике (цены обновляются раз в 500 мс) bar дёргался бы. */
    if (barFill.__clLastPct !== pct) {
      barFill.style.transition = 'none';
      barFill.style.width = '0%';
      void barFill.offsetWidth;   /* перезапуск анимации */
      /* Длительность каждый раз своя: ровные 0.9 с на каждом открытии
         читаются как зацикленный гиф. Разброс 0.78-1.06 с незаметен
         по отдельности, но снимает ощущение конвейера. */
      barFill.style.transition = 'width ' + (0.78 + Math.random() * 0.28).toFixed(2) +
        's cubic-bezier(0.2, 0.7, 0.3, 1)';
      barFill.style.width = pct + '%';
      barFill.__clLastPct = pct;
    }
    /* Текущий капитал — золотом, потолок следующего — мутед. Это
       «банковский» приём из референса: взгляд сразу видит «тебе ещё
       столько-то», без чтения двух чисел подряд. */
    if (capNow) tweenHeroCap(capNow, cap);
    if (capGoal) capGoal.textContent = ' / ' + money(hi, 0);
    /* Gold-плашка «До следующего класса: $X» — главный призыв к
       действию на экране. Раньше эта сумма терялась в подписи под
       bar'ом, теперь это отдельный акцент. */
    if (ctaEl) {
      ctaEl.style.display = '';
      ctaEl.textContent = t('class_to_next', { x: money(hi - cap, 0) });
    }
    /* На правом блоке — эмблема и имя СЛЕДУЮЩЕГО класса. Если это
       вершина (Легенда), подпись меняется на «финальная цель» и
       добавляется бейдж: разрыв до неё на порядок больше всех
       предыдущих, и это надо обозначить словами, а не только цифрой. */
    /* На правом блоке — эмблема и имя СЛЕДУЮЩЕГО класса. Имя идёт
       вместе с подписью через разделитель "·": "Skilled · Next goal".
       Если вершина (Легенда) — "Legend · Final goal" и бейдж PINNACLE. */
    nextIco.classList.remove('cl-hero-next--max');
    setClassIcon(nextIco, CLASSES[idx + 1].icon);
    if (nextName) nextName.textContent = CLASSES[idx + 1].name[LANG] || CLASSES[idx + 1].name.en;
    var goingForTop = (idx + 1 === topIdx);
    if (nextLabel) nextLabel.textContent = t(goingForTop ? 'class_final_goal' : 'class_next_goal');
    if (nextGoal) {
      nextGoal.classList.remove('cl-hero-goal--max');
      nextGoal.classList.toggle('cl-hero-goal--top', goingForTop);
    }
    if (nextPin) nextPin.classList.toggle('hidden', !goingForTop);
  }

  /* Список классов. Чтобы при множественных rerender (открыл-закрыл)
     не было накопления обработчиков — innerHTML зачищает их, и
     bindClassRows ниже навешивает заново. */
  var list = $('#cl-list');
  if (!list) return;
  var rows = '';
  for (var i = 0; i < CLASSES.length; i++) {
    var c = CLASSES[i];
    var cname = c.name[LANG] || c.name.en;
    var status, statusCls;
    if (i === idx)      { status = t('class_status_now');    statusCls = 'cl-row-status--now'; }
    else if (i < idx)   { status = t('class_status_done');   statusCls = 'cl-row-status--done'; }
    else if (i === idx + 1) { status = t('class_status_next'); statusCls = 'cl-row-status--next'; }
    else                { status = t('class_status_locked'); statusCls = 'cl-row-status--lock'; }

    var mod = '';
    if (i === idx) mod += ' cl-row--current';
    if (i < idx)  mod += ' cl-row--done';
    if (i === idx + 1) mod += ' cl-row--next';
    /* Вершина (последний класс) получает своё оформление всегда —
       и когда она цель, и когда уже достигнута. */
    if (i === topIdx) mod += ' cl-row--pinnacle';

    var from = c.cap;
    var to = (i + 1 < CLASSES.length) ? CLASSES[i + 1].cap - 1 : null;
    var rangeTxt = to != null ? (money(from, 0) + ' \u2014 ' + money(to, 0)) : (money(from, 0) + '+');

    /* Под именем: у текущего класса — «осталось $X» и мини-прогресс,
       у остальных — диапазон капитала. Прогресс уместен только там,
       где он что-то говорит игроку прямо сейчас; на пяти остальных
       строках он был бы шумом. */
    var subHtml, progHtml = '';
    if (i === idx) {
      if (idx >= topIdx) {
        subHtml = esc(money(from, 0) + '+');
      } else {
        var rLo = CLASSES[idx].cap;
        var rHi = CLASSES[idx + 1].cap;
        var rPct = Math.min(100, Math.max(4, (cap - rLo) / (rHi - rLo) * 100));
        subHtml = t('class_left', { x: money(rHi - cap, 0) });
        progHtml = '<span class="cl-row-prog"><i style="width:' + rPct.toFixed(1) + '%"></i></span>';
      }
    } else {
      subHtml = '<span class="mono">' + esc(rangeTxt) + '</span>';
    }

    /* Награда. У Новичка её нет (стартовый класс, за него не повышают),
       и писать «+$0» бессмысленно — показывали «старт». Но надпись
       оставалась и ПОСЛЕ прохождения уровня, хотя класс уже пройден и
       справа висит статус «Пройден». Теперь «старт» — только пока
       Новичок не пройден; у пройденного не показываем ничего.
       Проверка строго на число > 0, а не через ||: при reward=0
       фолбэк бы подставил CONFIG.levelUpReward и соврал. */
    var hasReward = (typeof c.reward === 'number' && c.reward > 0);
    var isPassed = i < idx;
    var rewardHtml = '';
    if (hasReward) {
      rewardHtml = '<span class="cl-row-reward"><span class="rw-plus">+</span><span class="mono">' +
        esc(money(c.reward, 0)) + '</span></span>';
    } else if (!isPassed) {
      rewardHtml = '<span class="cl-row-reward cl-row-reward--none">' + esc(t('class_reward_start')) + '</span>';
    }

    /* Эмблема строки: PNG если есть, иначе inline SVG. Здесь нельзя
       вызвать setClassIcon — rows собирается строкой, элемента ещё
       нет в DOM. Поэтому модификатор class-ico--png и сам <img>
       вписываем прямо в разметку. */
    var rowIcoHtml = c.img
      ? '<img class="class-ico-img" src="' + c.img + '" alt="" draggable="false">'
      : classIconHTML(c.icon);

    /* Задержка въезда — случайная, а не ровная лестница. Прогрессия
       0.04/0.09/0.14… читается как сгенерированная: глаз видит
       правильность и перестаёт верить, что это ручная работа. */
    var delay = Math.round(30 + i * 38 + Math.random() * 60);

    /* На строке со статусом «next» — рядом с именем класса добавляем
       короткое слово «· цель» / «· goal», чтобы по списку глазами
       видеть «следующая цель — Skilled». На последнем (Legend)
       слова «goal/final goal» не нужны — там и так статус Pinnacle. */
    var goalTag = '';
    if (i === idx + 1 && i < topIdx) {
      goalTag = ' <span class="muted cl-row-goal">· ' + esc(t('class_next_goal')) + '</span>';
    }

    rows += '<div class="cl-row' + mod + '" data-cl="' + i + '"' +
        ' style="--cl-row-delay:' + delay + 'ms">' +
      '<span class="cl-row-ico class-ico' + (c.img ? ' class-ico--png' : '') + '">' + rowIcoHtml + '</span>' +
      '<div class="cl-row-info">' +
        '<b class="cl-row-name">' + esc(cname) + goalTag + '</b>' +
        '<span class="cl-row-sub">' + subHtml + '</span>' +
        progHtml +
      '</div>' +
      '<div class="cl-row-meta">' +
        '<span class="cl-row-status ' + statusCls + '">' + esc(status) + '</span>' +
        rewardHtml +
      '</div>' +
    '</div>';
  }
  list.innerHTML = rows;
  bindClassRows();
}

/* ------------------------------ Новости рынка ------------------------------ */

/* Человеческое относительное время для ленты. События бакетируются по
   2 минуты, поэтому секунды показывать бессмысленно: либо «только что»,
   либо целое число минут/часов/дней. */
function fmtNewsAge(ts) {
  var sec = Math.max(0, Math.floor((now() - ts) / 1000));
  if (sec < 60) return t('news_now');
  var min = Math.floor(sec / 60);
  if (min < 60) return t('news_min', { n: min });
  var h = Math.floor(min / 60);
  if (h < 24) return t('news_h', { n: h });
  return t('news_d', { n: Math.floor(h / 24) });
}

/* Категория новости -> локализованный короткий чип. Если в данных
   появится новая категория, t() вернёт сам ключ, поэтому заменяем её
   на исходное слово, а не показываем игроку `news_cat_xyz`. */
function newsCatName(cat) {
  var key = 'news_cat_' + cat;
  var val = t(key);
  return val === key ? cat : val;
}

function newsImpactName(impact) {
  return t('news_impact_' + Math.max(1, Math.min(3, impact || 1)));
}

/* Экран ленты — слой js/v3-news.js (NV3): карточки, пульс рынка, «Главное
   за час», фильтры и непрочитанное. Здесь — только вход, выход и делегирование. */
function renderNewsFeed(force) {
  if (typeof NV3 !== 'undefined') NV3.render(force);
}

function openNewsFeed() {
  newsFeedReturnTo = 'app-main';
  showScreen('scr-news', 'right');
  setTab('lobby', true);
  bindNewsFeed();
  renderNewsFeed(true);
  FX.vibrate(7);
}

function closeNewsFeed() {
  showScreen(newsFeedReturnTo, 'left');
  setTab('lobby', true);
  renderTab('lobby');
}

/* Навешивается один раз: флаг внутри NV3.bind. */
function bindNewsFeed() {
  if (typeof NV3 !== 'undefined') NV3.bind();
}

/* Навешиваем отклик по клику (НЕ по pointerdown — иначе при свайпе
   по списку каждая строка моргала бы под пальцем, как ошибка). */
function bindClassRows() {
  Array.prototype.forEach.call($$('.cl-row'), function (row) {
    if (row.__clRowBound) return;
    row.__clRowBound = true;
    row.addEventListener('click', function () {
      FX.pulse(row, 'ico-pop', 320);
      FX.vibrate(6);
    });
  });
}

/* Докрутка капитала в hero. rAF, а не setInterval — так анимация не
   спорит с остальными кадровыми анимациями и не тикает впустую,
   когда вкладка скрыта. */
var clCapRaf = 0;

function tweenHeroCap(el, to) {
  if (!el) return;
  var from = (typeof el.__clCapVal === 'number') ? el.__clCapVal : 0;
  /* Меньше доллара — нечего крутить, и при каждом тике цен мы бы
     дёргали текст без видимой пользы. */
  if (Math.abs(to - from) < 1) {
    el.textContent = money(to, 0);
    el.__clCapVal = to;
    return;
  }
  stopHeroCapTween();
  var t0 = performance.now();
  var dur = 520 + Math.random() * 200;   /* неровная длительность */
  function step(ts) {
    var p = Math.min(1, (ts - t0) / dur);
    /* Асимметричная кривая: резкий разгон и долгий выкат. Симметричный
       ease-in-out на ровных 500 мс выглядит «слайдером». */
    var e = 1 - Math.pow(1 - p, 2.7);
    el.textContent = money(from + (to - from) * e, 0);
    if (p < 1) {
      clCapRaf = requestAnimationFrame(step);
    } else {
      el.textContent = money(to, 0);
      el.__clCapVal = to;
      clCapRaf = 0;
    }
  }
  clCapRaf = requestAnimationFrame(step);
}

/* Обязательно гасим докрутку при закрытии экрана: rAF держит ссылку
   на узел, и без отмены она бы доезжала своё уже на скрытом экране. */
function stopHeroCapTween() {
  if (clCapRaf) {
    cancelAnimationFrame(clCapRaf);
    clCapRaf = 0;
  }
}

/* ------------------------------ Модалка повышения класса ------------------------------ */

/* Открыта ли сейчас модалка повышения — чтобы tick() не открывал её
   второй раз, пока игрок не закрыл первую. */
var levelUpOpen = false;
/* Изменения, которые ждут показа — на случай, если между двумя тиками
   класс поднялся на 2 уровня (например, после крупной сделки). Тогда
   показываем первый, после закрытия — второй. */
var levelUpQueue = [];

function showLevelUpModal(cname, reward, idx) {
  if (levelUpOpen) {
    levelUpQueue.push({ cname: cname, reward: reward, idx: idx });
    return;
  }
  levelUpOpen = true;
  var cls = CLASSES[idx];
  var prevCls = idx > 0 ? CLASSES[idx - 1] : null;
  /* Центральный щит с новым классом. Неизвестный ключ icon даст в
     classIconHTML ромб-заглушку — падать нечему, но явно берём иконку
     нужного класса. */
  setClassIcon($('#lvlup-ico'), cls && cls.icon);
  /* Большое имя класса — крупно, золотым градиентом. */
  $('#lvlup-name').textContent = cname;
  /* Переход «был → стал»: левая нога — предыдущий класс (если есть),
     правая — новый. При idx===0 (Новичок) предыдущего нет — прячем
     левую ногу и стрелку, чтобы не было «Ученик → Ученик». */
  if (prevCls) {
    setClassIcon($('#lvlup-from-ico'), prevCls.icon);
    $('#lvlup-from-name').textContent = prevCls.name[LANG] || prevCls.name.en;
    $('.lvlup-from').style.display = '';
    $('.lvlup-arrow').style.display = '';
  } else {
    $('.lvlup-from').style.display = 'none';
    $('.lvlup-arrow').style.display = 'none';
  }
  setClassIcon($('#lvlup-to-ico'), cls && cls.icon);
  $('#lvlup-to-name').textContent = cname;
  /* Бейдж награды — крупная золотая сумма, «докручивается» с нуля
     (при скачках 2500 → 1M это читается лучше, чем мгновенный текст). */
  var rwEl = $('#lvlup-reward');
  if (rwEl) FX.tweenNumber(rwEl, reward, { dur: 800, fmt: function (v) { return '+' + money(v, 0); } });
  /* Сложная модалка → gameplayStop, чтобы таймеры рынка не считали
     касания пользователя «неактивностью». Конфетти/баннер здесь НЕ
     дублируем: FX.levelUp в checkLevelUp уже отыграл празднование —
     раньше наложались два баннера и двойной залп конфетти. */
  if (YaGame && YaGame.gameplayStop) YaGame.gameplayStop();
  openModal('modal-levelup');
}

function dismissLevelUpModal() {
  closeModal('modal-levelup');
  if (YaGame && YaGame.gameplayStart) YaGame.gameplayStart();
  levelUpOpen = false;
  /* Если за время показа накопились ещё повышения — вытаскиваем
     следующее (одно за раз: чтоб игрок успел осознать каждое). */
  if (levelUpQueue.length) {
    var nxt = levelUpQueue.shift();
    setTimeout(function () { showLevelUpModal(nxt.cname, nxt.reward, nxt.idx); }, 280);
  } else {
    /* После закрытия модалки обновим затронутые экраны: на лобби —
       баланс и лидерборд, в профиле — эмблема. */
    if (currentTab === 'lobby') {
      renderLobby();
      dispCap = capital();
    }
    if (currentTab === 'profile') renderProfile();
  }
}

function bindLevelupModal() {
  var closeBtn = $('#btn-levelup-claim');
  if (closeBtn && !closeBtn.__clBound) {
    closeBtn.__clBound = true;
    closeBtn.onclick = function () {
      FX.pulse(closeBtn, 'reward-pop', 580);
      FX.vibrate(12);
      dismissLevelUpModal();
    };
  }
  /* Кнопки «Позже» больше нет: бонус начисляется до показа модалки,
     поэтому отдельного «закрыть без получения» не существует.
     Закрытие — по «Забрать» или по backdrop'у. */
  var modal = $('#modal-levelup');
  if (modal && !modal.__clBackdropBound) {
    modal.__clBackdropBound = true;
    var back = modal.querySelector('.backdrop');
    if (back) back.onclick = function () { dismissLevelUpModal(); };
  }
}

/* Аватарка: рисуем <img> из пака, фолбэк — буква имени.
   Пак уже обрезан по кругу и прижат к краю канвы (tools/strip_avatar_gold.py),
   поэтому <img> идёт практически без полей: округление делает border-radius,
   а не отступы картинки. Так круг в квадрате получается крупнее. */
function avatarSrc(id) {
  if (!id || id < 'avatar_01' || id > 'avatar_' + AVATAR_COUNT) return 'img/avatars/avatar_01.png?v=1';
  var n = parseInt(id.slice(7), 10);
  if (!n || n < 1 || n > AVATAR_COUNT) return 'img/avatars/avatar_01.png?v=1';
  return 'img/avatars/avatar_' + (n < 10 ? '0' + n : n) + '.png?v=1';
}
function avatarHTML(id, extraClass) {
  var cls = 'avatar-img' + (extraClass ? ' ' + extraClass : '');
  return '<img class="' + cls + '" src="' + avatarSrc(id) + '" alt="" draggable="false" data-fb="' + esc((S.name || '?').charAt(0).toUpperCase()) + '">';
}
function setAvatarEl(el, id) {
  if (!el) return;
  el.innerHTML = avatarHTML(id);
  bindAvatarFallbacks(el);
}

/* Аватарка лидерборда. Букву для фолбэка кладём в data-fb, а НЕ в
   inline-onerror: кавычки внутри атрибута onerror (class="...") закрывают
   сам атрибут, и в DOM падает мусорный текст рядом с ником. */
function avImg(cls, id, name) {
  var initial = (name || '?').charAt(0).toUpperCase();
  return '<img class="' + cls + '" src="' + avatarSrc(id) + '" alt="" draggable="false" data-fb="' + esc(initial) + '">';
}

/* Подмена битой аватарки на букву. Вызывать после вставки разметки:
   ловим и «уже сломанные» картинки (кешированная ошибка не даст onerror),
   и те, что сломаются позже. */
function bindAvatarFallbacks(root) {
  if (!root) return;
  var imgs = root.querySelectorAll('img[data-fb]');
  for (var i = 0; i < imgs.length; i++) {
    (function (img) {
      var swap = function () {
        var fb = img.getAttribute('data-fb') || '?';
        var cls = img.className;
        var b = document.createElement('b');
        b.className =
          cls.indexOf('pod-avatar') >= 0 ? 'pod-initial' :
          cls.indexOf('rm-avatar')  >= 0 ? 'rm-initial'  :
          cls.indexOf('avatar-img') >= 0 ? 'avatar-initial' : 'lead-initial';
        b.textContent = fb;
        if (img.parentNode) img.parentNode.replaceChild(b, img);
      };
      /* Картинка могла не загрузиться до нашего обработчика. */
      if (img.complete && img.naturalWidth === 0) swap();
      else img.onerror = swap;
    })(imgs[i]);
  }
}
/* По никнейму — детерминированный аватар из того же пака.
   Один и тот же ник всегда даёт одну и ту же картинку. */
function avatarForName(name) {
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  var n = (h % AVATAR_COUNT) + 1;
  return 'avatar_' + (n < 10 ? '0' + n : n);
}

/* ------------------------------ Выбор аватарки ------------------------------ */

/* ---------------------------- Выбор аватарки ----------------------------
   ЧЕРНОВИК, а не мгновенное применение: тап по ячейке только показывает
   вариант, в сейв он уходит по «Готово». Иначе превью («Текущая» /
   «Новая · не сохранена») теряет смысл, а тост «Аватар обновлён» сыпался
   бы на каждый тап по сетке. «Отмена» и фон закрывают без применения. */
var avaDraft = null;
var avaRolling = false;

var AVA_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

function avaId(n) { return 'avatar_' + (n < 10 ? '0' + n : n); }
function avaNum(id) {
  var m = /(\d+)\s*$/.exec(String(id || ''));
  return m ? parseInt(m[1], 10) : 0;
}
function avaValid(id) {
  var n = avaNum(id);
  return (n >= 1 && n <= AVATAR_COUNT) ? avaId(n) : '';
}

/* Задержка каскада: шаг НЕРОВНЫЙ (14–34 мс). Ровный шаг читается как
   машинный — то же правило, что у achStaggerMs и staggerMs витрины.
   Псевдослучайный шаг от индекса, а не Math.random: иначе список
   «дрожал» бы между перерисовками. Потолок 560 мс на 24 ячейки. */
function avaStaggerMs(i) {
  var t = 0;
  for (var k = 0; k < i; k++) t += 14 + ((k * 31) % 21);
  return Math.min(t, 560);
}

/* Превью: большая аватарка, имя и честная подпись о том, применён ли
   выбор. Рамку берём с живой аватарки профиля — иначе превью расходилось
   бы с тем, как игрока видно в рейтинге. */
function renderAvaPreview(anim) {
  var big = $('#ava-big');
  if (!big) return;
  var host = $('#pr-avatar');
  var fr = '';
  if (host) {
    var cls = host.className.split(' ');
    for (var i = 0; i < cls.length; i++) {
      if (cls[i].indexOf('fr-') === 0) { fr = cls[i]; break; }
    }
  }
  big.className = 'avatar profile-ava' + (fr ? ' ' + fr : '');
  big.innerHTML = avatarHTML(avaDraft);
  bindAvatarFallbacks(big);
  /* Перезапуск только на смене варианта: при открытии превью должно
     стоять на месте, а не дёргаться. */
  if (anim) {
    big.classList.remove('is-new');
    void big.offsetWidth;
    big.classList.add('is-new');
  }
  var nm = $('#ava-pv-name');
  if (nm) nm.textContent = S.name || '—';
  var sub = $('#ava-pv-sub');
  if (sub) sub.textContent = t(avaDraft === S.avatar ? 'ava_current' : 'ava_new');
  var cnt = $('#ava-count');
  if (cnt) cnt.textContent = avaNum(avaDraft) + ' / ' + AVATAR_COUNT;
}

/* animate — влёт сетки каскадом. Только при открытии: перерисовка на
   каждый тап перезапускала бы каскад всех 24 ячеек, и это выглядело бы
   как «модалка перезагрузилась» (та же ловушка, что у витрины). */
function renderAvaGrid(animate) {
  var grid = $('#avatar-grid');
  if (!grid) return;
  var html = '';
  for (var i = 1; i <= AVATAR_COUNT; i++) {
    var id = avaId(i);
    var sel = id === avaDraft;
    html += '<button type="button" class="avatar-opt' + (sel ? ' selected' : '') +
      '" data-avatar="' + id + '" style="--d:' + avaStaggerMs(i - 1) + 'ms"' +
      (sel ? ' aria-current="true"' : '') + '>' +
      avatarHTML(id, 'avatar-opt-img') +
      (sel ? '<span class="ava-mark">' + AVA_CHECK + '</span>' : '') +
      '</button>';
  }
  grid.classList.toggle('ava-anim', !!animate);
  grid.innerHTML = html;
  bindAvatarFallbacks(grid);
  $$('#avatar-grid .avatar-opt').forEach(function (b) {
    b.onclick = function () { setAvaDraft(b.getAttribute('data-avatar')); };
  });
}

function setAvaDraft(id) {
  if (!id || id === avaDraft) return;
  avaDraft = id;
  Snd.play('avatar');
  renderAvaGrid(false);
  renderAvaPreview(true);
}

/* Прокрутка «Случайной»: 10 шагов с нарастающей задержкой — сначала быстро,
   к концу всё медленнее, как останавливающееся колесо.
   Класс на кнопке — ava-spin, а НЕ общий .spin: общий вешает diceWobble на сам
   элемент, и вращалась вся плашка вместе с подписью. */
function rollAva() {
  if (avaRolling) return;
  avaRolling = true;
  var btn = $('#ava-rand');
  if (btn) btn.classList.add('ava-spin');
  var steps = 10, n = 0, prevCell = null, lastId = avaDraft;
  (function step() {
    var i = Math.floor(Math.random() * AVATAR_COUNT) + 1;
    var id = avaId(i);
    if (id === avaDraft) id = avaId(i % AVATAR_COUNT + 1);
    setAvaDraft(id);
    lastId = id;
    /* Снимаем «тиканье» с ПРОШЛОЙ ячейки: иначе за прокрутку класс .roll
       накапливался на всех десяти, и на следующей прокрутке они дёргались
       все разом. */
    if (prevCell) prevCell.classList.remove('roll');
    var cell = $('#avatar-grid [data-avatar="' + id + '"]');
    if (cell) cell.classList.add('roll');
    prevCell = cell;
    if (++n < steps) {
      setTimeout(step, 80 + n * 9);
    } else {
      avaRolling = false;
      if (btn) btn.classList.remove('ava-spin');
      /* Приземление: снимаем .roll, чтобы выбранная ячейка «села» своим
         движением, а не осталась с тиком прокрутки. */
      if (prevCell) prevCell.classList.remove('roll');
      var win = $('#avatar-grid [data-avatar="' + lastId + '"]');
      if (win) win.classList.add('land');
      renderAvaPreview(true);
      toast(t('ava_random_done'));
    }
  })();
}

function openAvatarPicker() {
  /* Чтобы рейтинг/сделки «дышали» пока открыт модальный пикер. */
  if (YaGame && YaGame.gameplayStop) YaGame.gameplayStop();
  /* В сейве мог остаться мусор: avatarSrc() на негодный id рисует
     avatar_01, поэтому приводим состояние к тому, что реально показано.
     Иначе счётчик читался бы «0 / 24» и ни одна ячейка не была бы
     выбрана — пикер выглядел бы сломанным. */
  if (!avaValid(S.avatar)) S.avatar = avaId(1);
  avaDraft = S.avatar;
  renderAvaGrid(true);
  renderAvaPreview(false);
  openModal('modal-avatar');
}

function closeAvatarPicker() {
  closeModal('modal-avatar');
  if (YaGame && YaGame.gameplayStart) YaGame.gameplayStart();
}

/* «Готово»: применяем черновик. Тост и вибро — только если аватарка
   реально сменилась, иначе они срабатывали бы даже на простом закрытии. */
function saveAvatarPicker() {
  var same = avaDraft === S.avatar;
  if (!same) {
    S.avatar = avaDraft;
    saveState(true);
    setAvatarEl($('#pr-avatar'), S.avatar);
  }
  closeAvatarPicker();
  if (same) return;
  /* is-eq, а не FX.pulse: на нём же висит «выстрел» кольца рамки
     (#pr-avatar.is-eq::after → frPopRing) — новый аватар должен
     «щёлкнуть» вместе с рамкой. */
  var av = $('#pr-avatar');
  if (av) {
    av.classList.remove('is-eq');
    void av.offsetWidth;
    av.classList.add('is-eq');
    setTimeout(function () { av.classList.remove('is-eq'); }, 620);
  }
  FX.vibrate(8);
  toast(t('avatar_updated'));
}

/* ------------------------------ Классы (прогресс) ------------------------------ */

function checkLevelUp() {
  var idx = classFor(capital());
  if (idx > S.classSeen) {
    /* Может перескочить через несколько уровней крупной сделкой:
       проигрываем все по очереди (очередь берётся в
       dismissLevelUpModal). Сохраняем «последний виденный» = текущий,
       иначе те же уровни будут переповышаться снова. */
    var startIdx = S.classSeen + 1;
    S.classSeen = idx;
    saveState(true);
    var total = 0;
    /* Суммируем награды за все пропущенные уровни разом (награда —
       немедленная, в момент первого повышения, чтобы деньги не
       терялись даже при пропуске модалок). */
    for (var i = startIdx; i <= idx; i++) {
      /* typeof-проверка вместо «||»: у будущего класса с reward: 0
         фолбэк $2500 ошибочно начислил бы «большую награду». */
      var rw = (CLASSES[i] && typeof CLASSES[i].reward === 'number') ? CLASSES[i].reward : CONFIG.levelUpReward;
      total += rw;
    }
    S.balance += total;
    pushPfSnapshot(true);
    saveState(true);
    var cname = CLASSES[idx].name[LANG] || CLASSES[idx].name.en;
    /* Тост — быстрый «ага, ачивка пришла», модалка — большая
       детальная версия. Празднование (конфетти/баннер) играет ровно
       один раз: FX.levelUp уже делает конфетти, вспышку и баннер —
       раньше showLevelUpModal повторял всё это вторым залпом. */
    toast(t('toast_levelup', { name: cname, x: money(total, 0) }), 'gold');
    FX.levelUp(cname, '+' + money(total, 0));
    showLevelUpModal(cname, total, idx);
  }
}

/* ------------------------------ Отправка очков ------------------------------ */

function maybeSubmitScore() {
  /* Отправляем капитал — доска называется capital. Раньше уходил S.best
     (рекорд), и просадка на доску не попадала вовсе: игрок со $100
     продолжал висеть там с $5000.
     Порог по модулю: снижение — тоже изменение, и его надо отправить.
     Дойдёт ли оно до доски — зависит от её настройки в консоли Яндекс Игр
     (доска «лучший результат» оставит максимум). */
  var score = Math.round(capital());
  if (Math.abs(score - lastSubmitScore) < Math.max(100, score * 0.02)) return;
  lastSubmitScore = score;
  YaGame.submitScore(CONFIG.leaderboard, score);
}

/* ------------------------------ Тик ------------------------------ */

/* Быстрый твн капитала (0.6с, ease-out) — вместо медленного ползания. */
var capTween = null;

function updateCapitalText(ts) {
  /* v3: капитал — одометр (цифры докручиваются CSS-переходом, вспышка на
     событиях) из js/v3-lobby.js; твин ниже — запасной путь. */
  if (typeof V3L !== 'undefined') { V3L.capFrame(); return; }
  var cap = capital();
  if (!capTween || capTween.to !== cap) {
    capTween = { from: dispCap, to: cap, t0: ts };
  }
  var p = Math.min(1, (ts - capTween.t0) / 600);
  var e = 1 - Math.pow(1 - p, 3);
  dispCap = capTween.from + (capTween.to - capTween.from) * e;
  if (p >= 1) { dispCap = cap; capTween = null; }
  var capEl = $('#lobby-capital');
  if (capEl) capEl.textContent = money(dispCap);
  /* Free пишет только renderLobby() твином: раньше rafLoop каждый кадр
     перезаписывал #lobby-free напрямую и убивал 380мс твин после бонуса. */
}

/* Кадровый цикл: плавный график на экране торговли + анимация капитала. */
function rafLoop() {
  if (!rafRunning) return;
  var ts = now();
  if (tradeAssetId) {
    updateTradePrices(false);
  } else if (currentTab === 'lobby') {
    updateCapitalText(ts);
  }
  requestAnimationFrame(rafLoop);
}

/* --------------------- Пауза игрового цикла --------------------- */
/* Треб. 1.19.4 (пп. 1.3, 4.7): на время рекламы, сворачивания вкладки и
   событий платформы геймплей обязан останавливаться. Раньше onPause был
   пустой заглушкой, а setInterval(tick, 500) вообще не отменялся: во
   время рекламы цены продолжали идти, лимитные ордера исполняться, а
   снимки портфеля писаться. */
var tickTimer = 0;
var rafRunning = false;

function startGameLoop() {
  if (!tickTimer) tickTimer = setInterval(tick, 500);
  if (!rafRunning) {
    rafRunning = true;
    requestAnimationFrame(rafLoop);
  }
}

function stopGameLoop() {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = 0; }
  /* Кадр, который уже в очереди, увидит rafRunning === false и не
     запланирует следующий — цикл останавливается сам. */
  rafRunning = false;
}

/* Спотовый список рынка на экране, а не вкладка «Фьючерсы». */
function spotMarketOn() {
  return currentTab === 'market' && currentScreen === 'app-main' && !(typeof Fut !== 'undefined' && Fut.active());
}

function tick() {
  var ts = now();
  /* Капа и объём идут за ценой и за игровыми сутками, но нужны только
     там, где их видно: весь список — на вкладке рынка, одна монета —
     на экране трейда. В лобби это была холостая работа (замер: 200
     пересчётов цены на каждом тике, то есть 400 в секунду). */
  if (spotMarketOn()) {
    refreshMarketMeta();
  } else if (currentScreen === 'scr-trade' && tradeAssetId) {
    var _metaA = assetById(tradeAssetId);
    if (_metaA) refreshMarketMeta(_metaA);
  }
  tickNewsVolumes(ts);
  /* Рекорд капитала. Сохраняем сразу, а не ждём планового минутного
     снимка: иначе рекорд, поставленный в последнюю минуту сессии,
     терялся при закрытии. saveState(false) — дебаунс, лишних запросов
     к облаку не создаёт. */
  var cap = capital();
  if (cap > S.best) { S.best = cap; saveState(false); }

  checkLevelUp();
  maybeSubmitScore();
  /* Лимитные ордера — глобальные, проверяются в каждом тике вне
     зависимости от вкладки: пользователь мог разместить ордер на рынке,
     а перешёл в портфель. */
  tickLimitOrders();
  if (typeof Fut !== 'undefined') { try { Fut.tick(ts); } catch (e) { dbg('tick:fut', e); } }
  /* Долговременная история hero-портфеля для диапазона «ЗА ВСЕ ВРЕМЯ».
     Пишем ВНЕ зависимости от вкладки: игрок мог весь час сидеть на
     рынке, а капитал всё это время двигался. Внутри pushPfSnapshot
     стоит свой минутный интервал, так что раз в 500 мс мы только
     сверяем время и почти ничего не делаем. */
  /* Плановый снимок тоже надо ДОПИСАТЬ В СЕЙВ. Иначе он жил только в
     памяти текущей вкладки и исчезал после перезагрузки. Принудительные
     снимки сделки/награды сохраняются в месте действия. */
  if (pushPfSnapshot(false)) saveState(false);
  /* Панель под графиком живёт своими цифрами: по позиции бежит
     нереализованный PnL, у ордеров — расстояние до цели. Обновляем
     только когда экран трейда открыт — иначе это холостая работа на
     каждом тике. */
  if (currentScreen === 'scr-trade') {
    renderDesk();
    /* Спарклайн цены в карточке позиции рисуем отдельно и каждый
       тик: HTML карточки (qty, PnL-число, entry/mark) может не
       меняться между тиками, но последняя свеча «бежит» за live-ценой
       и без перерисовки точка на конце висит на старом месте. */
    if (deskTab === 'positions') {
      try { drawPosSparklines(); } catch (e) { dbg('tick', e); }
    }
  }
  /* Экран колеса: тикает только обратный отсчёт кулдауна и капитал
     в шапке. Само колесо не перерисовывается — оно статичный SVG. */
  else if (currentScreen === 'scr-spin') {
    spinRenderCap();
    renderSpinCooldowns();
  }

  if (spotMarketOn()) {
    tickN++;
    updateMarketPrices();
    if (tickN % 8 === 0) drawSparks(); /* спарклайны обновляются раз в 4 сек */
  }
  else if (currentTab === 'portfolio') {
    updatePortfolioPrices();
    if (typeof Fut !== 'undefined') Fut.renderPortfolio();
    /* НЕ писать pf-total вручную здесь. updatePortfolioPrices() уже
       вызывает renderPortfolio(true), а тот через renderPfHero()
       выбирает правильную сумму по pfMode:
       - Positions → invested()
       - Capital → capital()
       Старый дубль всегда записывал invested() и через ~500мс после
       переключения Capital затирал правильный капитал стоимостью
       позиций — ровно симптом Димы: «на секунду правильно, потом число
       меняется». */
  }
  else if (currentTab === 'lobby') {
    renderLobbyCooldowns();
    renderSpinCooldowns();
  }

  /* Цена и «вы получите» в открытом шите идут за рынком. Обновляем из
     тика (500 мс), а не из rafLoop: на 60 fps цифры бы дрожали, а
     игроку нужно видеть направление, а не мельтешение разрядов. */
  if (sheetMode) refreshTradeSheetPrices();

  /* Лобби: бегущая строка цен, лента новостей с автопрокруткой, полоса
     капитала и живая история баланса — js/v3-lobby.js. */
  if (currentTab === 'lobby' && typeof V3L !== 'undefined') V3L.tick(ts);

  /* Профиль не замерзает: капитал идёт, прогресс класса и рекорд
     догоняют лёгким патчем (без полного renderProfile). */
  if (currentTab === 'profile') updateProfileLive();
}

/* Обновление только таймеров (чтобы не перерисовывать карточки каждый тик). */
function renderLobbyCooldowns() {
  /* Полночь наступила, пока игрок сидел в лобби: карточка daily сама
     переключается из таймера в «забрать». Там же — кольца отсчёта рекламы
     и обычного спина (js/v3-lobby.js). */
  if (typeof V3L !== 'undefined') V3L.cooldowns();
  /* Грант: видимость тоже пересчитываем в тике, а не только текст.
     Иначе слив капитала < $100 сидя в лобби не покажет карточку
     до переключения вкладки. */
  var card = $('#card-grant');
  if (card) {
    var showGrant = capital() < 100 && Object.keys(S.positions).length === 0;
    if (card.classList.contains('hidden') === showGrant) {
      renderGrantCard();
      return;
    }
    if (!showGrant) return;
    var grantLeft = CONFIG.grantCooldown - Math.floor((YaGame.serverTime() - S.lastGrantAt) / 1000);
    var gbtn = $('#grant-btn');
    if (gbtn) {
      gbtn.disabled = grantLeft > 0;
      gbtn.textContent = grantLeft > 0
        ? t('ad_in', { t: Math.floor(grantLeft / 60) + ':' + String(grantLeft % 60).padStart(2, '0') })
        : t('grant_btn', { x: money(CONFIG.grant, 0) });
    }
  }
}

/* ------------------------------ Настройки ------------------------------ */

/* Активные кнопки настроек — без переоткрытия модалки (иначе сбивается анимация). */
function syncSettingsUI() {
  /* Наградные темы (рассвет/карбон/пепел) надеваются ТОЛЬКО из витрины,
     но панель обязана это показать: иначе при S.theme='dawn' ни одна из
     трёх кнопок не подсвечена и сегмент выглядит как «тема не выбрана».
     Поэтому: своя тема → активна своя кнопка; чужая (наградная) → гасим
     все и помечаем ряд классом, чтобы игрок видел, что тема не из этого
     ряда. См. AUDIT-2026-09-16. */
  var known = false;
  $$('#modal-settings [data-theme-set]').forEach(function (b) {
    var on = b.getAttribute('data-theme-set') === S.theme;
    if (on) known = true;
    b.classList.toggle('active', on);
  });
  var row = document.getElementById('settings-theme-row');
  if (row) row.classList.toggle('theme-external', !known);
  /* «Полночь» видна только владельцам предмета (ночная сова).
     Владение спрашиваем у Ach: с 2026-09-16 оно выводится из
     достижения-источника, и прямая проверка S.items разошлась бы
     с витриной (у открывших nights_5 до появления предмета). */
  var mid = document.querySelector('#modal-settings [data-theme-set="midnight"]');
  if (mid) {
    var has = false;
    if (typeof Ach !== 'undefined' && Ach.isOn && Ach.itemOwned) {
      try { has = Ach.isOn() && Ach.itemOwned('theme_midnight'); } catch (e) { dbg('syncSettingsUI', e); }
    }
    mid.classList.toggle('hidden', !has);
  }
  $$('#modal-settings [data-lang-set]').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-lang-set') === LANG);
  });
  if (typeof V3Set !== 'undefined') { try { V3Set.sync(); } catch (e) { dbg('syncSettingsUI', e); } }
}

function openSettings() {
  YaGame.gameplayStop();
  /* Содержимое шторки строит js/v3-settings.js (концепт settings.html). */
  if (typeof V3Set !== 'undefined') { try { V3Set.open(); } catch (e) { dbg('openSettings', e); openModal('modal-settings'); } }
  else openModal('modal-settings');
  syncSettingsUI();
}

function closeSettings() {
  closeModal('modal-settings');
  if (typeof V3Set !== 'undefined') { try { V3Set.closed(); } catch (e) { dbg('closeSettings', e); } }
  YaGame.gameplayStart();
}

/* srcEl — кнопка, с которой сменили тему: в режиме продвинутых анимаций
   новая тема расходится от неё «волной» (View Transitions). Без кнопки,
   без поддержки браузера или в стандартном режиме — прежняя «шторка». */
function setTheme(theme, srcEl) {
  S.theme = theme;
  if (typeof Ach !== 'undefined') { try { Ach.emit('theme:change', { theme: theme }); } catch (e) { dbg('setTheme', e); } }
  var swap = function () { applyTheme(); redrawCanvases(); };
  var wave = srcEl && srcEl.getBoundingClientRect && document.startViewTransition &&
    typeof Motion !== 'undefined' && Motion.adv();
  if (wave) {
    var r = srcEl.getBoundingClientRect(), root = document.documentElement;
    root.style.setProperty('--sg-vx', Math.round(r.left + r.width / 2) + 'px');
    root.style.setProperty('--sg-vy', Math.round(r.top + r.height / 2) + 'px');
    root.classList.add('sg-vt');
    var done = function () { root.classList.remove('sg-vt'); };
    try { document.startViewTransition(swap).finished.then(done, done); } catch (e) { done(); swap(); }
  } else {
    /* Смена темы — через «шторку», чтобы не было резкого скачка цвета. */
    FX.curtain(swap);
  }
  saveState(true);
  syncSettingsUI();
}

function setLang(lang) {
  S.lang = lang;
  LANG = lang;
  if (typeof Ach !== 'undefined') { try { Ach.emit('lang:change', { lang: lang }); } catch (e) { dbg('setLang', e); } }
  document.documentElement.setAttribute('lang', lang);
  applyI18n();
  saveState(true);
  setTab(currentTab);
  if (typeof Fut !== 'undefined') { try { Fut.render(); } catch (e) { dbg('setLang:fut', e); } }
  /* Подписи вкладок меняют длину — полосу и содержимое панели надо
     пересчитать, иначе индикатор останется на старой ширине. */
  moveDeskInk();
  renderDesk(true);
  /* Шторка настроек строит тексты сама (без data-i18n) — перерисовать. */
  if (typeof V3Set !== 'undefined') { try { V3Set.relang(); } catch (e) { dbg('setLang:settings', e); } }
  syncSettingsUI();
  /* Подпись hero портфеля («Портфель» / «Капитал») ставится из JS и
     не имеет data-i18n, поэтому applyI18n() её не обновит — иначе при
     смене языка в режиме «Capital» она осталась бы на старом языке. */
  renderPfHero();
  /* Динамические тексты достижений: строка комиссии в профиле, открытый
     экран и открытая модалка — иначе после смены языка висят старые. */
  if (typeof Ach !== 'undefined' && Ach.isOn && Ach.isOn()) {
    try { Ach.renderRow(); } catch (e) { dbg('setLang', e); }
    try {
      if (typeof currentScreen !== 'undefined' && currentScreen === 'scr-ach') Ach.renderList();
    } catch (e) { dbg('setLang', e); }
    try { if (Ach.refreshLang) Ach.refreshLang(); } catch (e) { dbg('setLang', e); }
  }
}

/* Сброс прогресса — двухтапное подтверждение на самой кнопке вместо
   системного confirm(): нативный диалог выбивается из стилизованных
   модалок игры и не рекомендуется модерацией Яндекс Игр. Первый тап
   «взводит» кнопку на 3 секунды, второй — сбрасывает.
   force — подтверждение уже получено снаружи (удержание кнопки сброса
   в настройках, js/v3-settings.js), «взвод» не нужен. */
var resetArmed = false;
var resetDisarmT = 0;
function resetProgress(force) {
  var btn = $('#btn-reset');
  if (force === true) resetArmed = true;
  if (!resetArmed) {
    resetArmed = true;
    if (btn) {
      btn.textContent = t('reset_armed');
      btn.classList.add('danger-armed');
    }
    resetDisarmT = setTimeout(function () {
      resetArmed = false;
      var b2 = $('#btn-reset');
      if (b2) {
        b2.textContent = t('reset');
        b2.classList.remove('danger-armed');
      }
    }, 3000);
    return;
  }
  resetArmed = false;
  if (resetDisarmT) { clearTimeout(resetDisarmT); resetDisarmT = 0; }
  if (btn) {
    btn.textContent = t('reset');
    btn.classList.remove('danger-armed');
  }
  var fresh = freshState();
  /* Идентичность игрока переживает сброс: ник, аватар, тема, язык.
     Аватар раньше стирался, хотя это такая же часть профиля, как ник. */
  fresh.name = S.name;
  fresh.avatar = S.avatar;
  fresh.theme = S.theme;
  fresh.lang = S.lang;
  /* Режим анимаций — настройка игрока, а не прогресс. */
  fresh.fx = S.fx;
  fresh.rm = S.rm;
  fresh.snd = S.snd;
  SAVE_KEYS.forEach(function (k) { S[k] = fresh[k]; });
  /* Служебные счётчики вне сейва — тоже в ноль, иначе после сброса
     сабмит очков/новостная строка вели себя по «старой» памяти. */
  lastSubmitScore = 0;
  lastNewsBucket = {};
  newsAssetId = null;
  newsShownBucket = -1;
  saveState(true);
  toast(t('toast_reset'));
  setTab('lobby');
}

/* ------------------------------ Запуск ------------------------------ */

function enterMain() {
  showScreen('app-main', 'up');
  setTab('lobby');
  YaGame.gameplayStart();
}

/* Элементы, по которым пускаем рябь от касания. */
var RIPPLE_SEL = '.btn, .icon-btn, .nick-dice, .tf-btn, .pct-chips button, .chips button, .sort-opt, ' +
  '.cat-opt, .dir-opt, ' +
  '.pf-btn, .row:not(.lead-row), .seg button, .tabbar button, .pf-dd-menu button, .pf-ranges button, ' +
  '.news-card';

function initRipples() {
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.star-btn')) return; /* у звезды свой эффект */
    var host = t.closest(RIPPLE_SEL);
    if (host) FX.ripple(host, e.clientX, e.clientY);
  }, { passive: true });
}

function bindEvents() {
  initRipples();
  initMainTabSwipes();
  /* Кнопки модалки «Новый класс» навешиваем один раз: модалка спрятана
     на старте, и обработчики нужны до первого повышения. */
  bindLevelupModal();
  /* Клик по карточке класса в профиле (навешиваем из renderProfile,
     но на всякий случай — если страница откроется без рендера). */
  bindProfileClassCard();
  bindProfileStatCards();
  $('#btn-nick-dice').onclick = function () {
    $('#nick-input').value = randomNick();
    /* Крутится сам кубик, а не кнопка: diceWobble на кнопке проворачивал всю
       плашку вместе с рамкой — та же ловушка, что была у «Случайной». */
    FX.pulse(this.querySelector('.dice-ico'), 'spin', 600);
    /* Сгенерированное имя тоже проверяем — иначе счётчик и кнопка
       остались бы в состоянии прошлого, неудачного ввода. */
    nickValidate('#scr-nick', false);
  };
  $('#btn-nick-start').onclick = confirmNick;
  $('#nick-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') confirmNick(); });
  /* Живая проверка: подсказка, счётчик и доступность кнопки обновляются
     по мере набора, а не только по нажатию «Сохранить». */
  $('#nick-input').addEventListener('input', function () { nickValidate('#scr-nick', false); });
  /* Шторка смены имени: «Сохранить имя» применяет, крестик, «Отмена» и
     фон закрывают без сохранения. */
  $('#nm-save').onclick = saveName;
  $('#nm-x').onclick = closeNameModal;
  $('#nm-cancel').onclick = closeNameModal;
  $('#modal-name .backdrop').onclick = closeNameModal;
  $('#nm-dice').onclick = function () {
    $('#nm-input').value = randomNick();
    FX.pulse(this.querySelector('.dice-ico'), 'spin', 600);
    nickValidate('#modal-name', false);
  };
  $('#nm-input').addEventListener('input', function () { nickValidate('#modal-name', false); });
  $('#nm-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveName(); });
  $$('.tabbar button').forEach(function (b) {
    b.onclick = function () { setTab(b.getAttribute('data-tab')); };
  });

  /* Поиск с debounce: полный rebuild списка на каждый символ давал
     дёрганье на слабых устройствах (до ~100 canvas пересоздаются).
     180 мс тишины — и один rebuild; крестик реагирует сразу. */
  var searchDebounce = 0;
  $('#market-search').addEventListener('input', function () {
    marketQuery = this.value;
    /* Показываем/прячем крестик через showSearchClear: он среагирует
       только на реальный переход, а не на каждый символ. */
    showSearchClear(!!this.value);
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      searchDebounce = 0;
      renderMarket(true); /* без анимаций строк во время набора */
      scrollPagesTop();
    }, 180);
  });
  /* Escape в поле — тот же сброс, что крестиком. Ожидаемо на десктопе и
     ничего не стоит на мобильном. */
  $('#market-search').addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && this.value) { e.preventDefault(); clearMarketSearch(true); }
  });
  $('#search-clear').onclick = function () { clearMarketSearch(false); };

  /* Делегирование на #market-list: единый обработчик для строк и звёзд.
     bind'им один раз — строки не пересоздаются при смене сортировки, и
     их обработчики не нужно перепривязывать. */
  $('#market-list').addEventListener('click', function (e) {
    /* Кнопка сброса живёт внутри списка (в пустом состоянии поиска),
       поэтому ловим её здесь же — до разбора строк. */
    /* Сброс из пустого состояния — без возврата фокуса в поле: игрок
       только что тапал по списку, клавиатура выезжать не должна. */
    if (e.target.closest('#search-reset')) { clearMarketSearch(false); return; }
    var star = e.target.closest('.star-btn');
    if (star) {
      e.stopPropagation();
      var id = star.getAttribute('data-star');
      var on = !S.favs[id];
      if (on) S.favs[id] = true; else delete S.favs[id];
      Snd.play(on ? 'fav_add' : 'fav_remove');
      saveState(true);
      star.classList.toggle('on', on);
      if (star.parentNode) star.parentNode.classList.toggle('fav', on);
      FX.pulse(star, 'burst', 560);
      FX.vibrate(12);
      if (typeof Fut !== 'undefined' && Fut.refreshFavs) { try { Fut.refreshFavs(); } catch (er) { dbg('fav', er); } }
      /* В az-режиме избранное уезжает в группу ★ наверх — но при этом
         меняются и буквенные разделители (монета уходит из своей буквы
         в «звёздную» группу или наоборот). reorderMarketRows только
         переставляет строки, хедеры не трогает — поэтому нужен полный
         rebuild с пересборкой групп. Иначе хедеры остаются на старых
         местах и «вклиниваются» между строк как мусор.
         В cap/change/price/volume буквенных групп нет, и fav теперь
         всегда первые (см. getMarketListAndChanges) — достаточно
         incremental reorder с FLIP. Строка плавно «улетает» наверх
         через CSS-transition, без пересоздания canvas. Header
         «★ Избранное» добавляется/убирается отдельной DOM-манипуляцией
         (reorderMarketRows его не создаёт, а full rebuild ради одного
         хедера пересоздал бы все canvas — мигание спарклайнов). */
      if (currentTab === 'market') {
        if (S.sortKey === 'az') {
          var d = getMarketListAndChanges();
          renderMarketFull($('#market-list'), d.list, d.changes, true);
          drawSparks(true);
        } else {
          renderMarket();
          syncFavHeader();
        }
      }
      return;
    }
    var row = e.target.closest('.asset-row');
    if (row) openTrade(row.getAttribute('data-asset'));
  });
  /* Сегменты портфеля (режим, периоды, сортировка) и скраб графика
     привязывает js/v3-portfolio.js. */

  /* Интерактивное распределение: клик по сегменту donut или по строке
     легенды выбирает актив (показываются детали). Клик по уже
     выбранному — снимает выбор. Наведение подсвечивает сегмент
     и строку легенды одновременно. */
  (function bindAllocInteraction() {
    var cv = document.getElementById('alloc-donut');
    var legend = document.getElementById('alloc-legend');

    /* Подсветка живёт в hoverAllocId, а не в разметке: renderPortfolio
       перерисовывается каждые 500 мс и обязан её сохранять, иначе
       подсветка мигала бы в такт тикам. */
    function setHover(id) {
      if (hoverAllocId === id) return;
      hoverAllocId = id || null;
      /* Группировка та же, что при отрисовке: hit-test и круг должны
         считать одни и те же доли, иначе подсветка уезжает. */
      var segs = allocGroups(allocSegments());
      if (cv) {
        drawDonut(cv,
          segs.map(function (s) { return { share: s.share, color: s.color }; }),
          false,
          allocIdxById(segs, selectedAllocId),
          allocIdxById(segs, hoverAllocId));
      }
      $$('#alloc-legend .alloc-row').forEach(function (r) {
        r.classList.toggle('hov', r.getAttribute('data-id') === hoverAllocId);
      });
    }

    function rowFrom(e) {
      return e.target.closest ? (e.target.closest('.alloc-row') || e.target.closest('.alloc-bar')) : null;
    }

    if (cv) {
      cv.addEventListener('mousemove', function (e) {
        var segs = allocGroups(allocSegments());
        var hit = donutHitTest(cv, e.clientX, e.clientY, segs);
        setHover(hit < 0 ? null : segs[hit].id);
      });
      cv.addEventListener('mouseleave', function () { setHover(null); });
      cv.addEventListener('click', function (e) {
        var segs = allocGroups(allocSegments());
        var hit = donutHitTest(cv, e.clientX, e.clientY, segs);
        /* Клик в дырку или мимо круга — снимает выбор. */
        selectAllocSeg(hit < 0 ? null : segs[hit].id);
      });
    }
    if (legend) {
      legend.addEventListener('click', function (e) {
        var row = rowFrom(e);
        if (!row) return;
        var id = row.getAttribute('data-id');
        if (!id) return;
        /* Повторный клик по выбранному — снимаем выбор. */
        selectAllocSeg(id === selectedAllocId ? null : id);
      });
      legend.addEventListener('mouseover', function (e) {
        var row = rowFrom(e);
        setHover(row ? row.getAttribute('data-id') : null);
      });
    legend.addEventListener('mouseleave', function () { setHover(null); });
  }
  })();
  $('#market-sort').onclick = function () {
    openSortSheet();
  };
  $('#sort-apply').onclick = function () {
    S.sortKey = pendingSortKey;
    S.sortDir = pendingSortDir;
    S.marketCat = pendingCat;
    saveState(true);
    closeSortSheet();
    renderMarket();
    syncFavHeader();
    scrollPagesTop();
  };
  $('#sort-reset').onclick = function () {
    S.sortKey = 'cap';
    S.sortDir = 'desc';
    S.marketCat = 'all';
    pendingSortKey = 'cap';
    pendingSortDir = 'desc';
    pendingCat = 'all';
    saveState(true);
    closeSortSheet();
    /* Сброс поиска последним: он сам вызывает renderMarket. */
    clearMarketSearch(false);
    toast(t('filters_reset'));
  };
  $('#sort-close').onclick = closeSortSheet;
  $('#sort-backdrop').onclick = closeSortSheet;
  /* Новостная строка ведёт В ЛЕНТУ НОВОСТЕЙ: раньше открывала сделку
     по монете, а сама лента (openNewsFeed) не вызывалась ниоткуда и
     была недостижима из игры. Внутри ленты монета открывается кликом. */
  $('#news-row').onclick = openNewsFeed;

  $('#btn-settings').onclick = openSettings;
  /* Крестик (#btn-settings-close, data-sg="close"), темы, язык, «Как
     играть» и сброс обрабатывает js/v3-settings.js делегированием. */
  $('#modal-settings .backdrop').onclick = closeSettings;

  /* Выбор аватарки — тап по аватарке в профиле. «Готово» применяет
     черновик, «Отмена» и фон просто закрывают — выбор не сохраняется. */
  $('#pr-avatar').onclick = openAvatarPicker;
  $('#btn-avatar-close').onclick = saveAvatarPicker;
  $('#btn-avatar-cancel').onclick = closeAvatarPicker;
  $('#modal-avatar .backdrop').onclick = closeAvatarPicker;
  $('#ava-rand').onclick = rollAva;
  /* Детали ордера/сделки закрываются одинаково с других модалок. */
  $('#detail-close').onclick = function () { closeModal('modal-detail'); };
  $('#detail-ok').onclick = function () { closeModal('modal-detail'); };
  $('#detail-backdrop').onclick = function () { closeModal('modal-detail'); };

  $('#ad-btn').onclick = claimAdBonus;
  $('#grant-btn').onclick = claimGrant;

  /* Lucky Spin. Кнопка в лобби открывает отдельный экран, режим
     выбирается уже на нём (.spin-switch). */
  $('#spin-btn').onclick = openSpin;
  $('#spin-back').onclick = closeSpin;
  /* «В лобби» в окне награды закрывает и попап, и экран колеса. */
  $('#spin-claim').onclick = function () { closeSpin(); };
  /* «Крутить ещё»: окно закрывается и запускается следующая крутка.
     Попыток нет — spinGo() сам покажет честный тост, кнопкой не машем. */
  $('#spin-again').onclick = function () {
    closeModal('modal-spin-prize');
    if (!spinAvail(spinMode) && spinMode !== 'vip' && spinAvail('vip')) spinSelect('vip');
    spinGo();
  };
  $('#spin-hub').onclick = function () { if (!spinBusy) spinGo(); };
  /* Тап мимо карточки закрывает только окно: игрок остаётся у колеса
     и может крутить дальше. */
  $('#spin-prize-backdrop').onclick = function () { closeModal('modal-spin-prize'); };
  $('#spin-prize-close').onclick = function () { closeModal('modal-spin-prize'); };
  $('#spin-go').onclick = spinGo;
  /* Режим переключается пилюлей в шапке экрана колеса. */
  $('#spin-mode-free').onclick = function () { spinSelect('free'); };
  $('#spin-mode-vip').onclick = function () { spinSelect('vip'); };
  $('#btn-trade').onclick = function () { setTab('market'); };
  $('#btn-auth').onclick = signIn;
  $('#btn-editname').onclick = openNameModal;

  $('#tr-back').onclick = closeTrade;
  $('#all-back').onclick = closeAllAssets;
  /* Звезда в шапке трейда — toggle в S.favs, как и в экране рынка.
     Список рынка не перерисовываем (на экране трейда его не видно).
     Реакция — анимация самой кнопки (pop + кольцо + искорки),
     а не тост: уведомление тут только мешало. */
  $('#tr-fav').onclick = function () {
    var btn = this;
    var on = !S.favs[tradeAssetId];
    if (on) S.favs[tradeAssetId] = true;
    else delete S.favs[tradeAssetId];
    Snd.play(on ? 'fav_add' : 'fav_remove');
    saveState(true);
    marketFavDirty = true;
    updateTradeToggles();

    /* Случайная длительность — «неровность» вместо идеальной плавности. */
    btn.style.setProperty('--fav-dur', (430 + Math.random() * 170).toFixed(0) + 'ms');

    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;

    /* Реакция — pop самой кнопки + расходящееся золотое кольцо.
       Искорки (FX.burst) убраны: вместе с кольцом они давали
       «салют» и перегружали маленькую кнопку. */
    if (on) {
      FX.pulse(btn, 'fav-pop', 620);
      favRing(cx, cy, Math.max(r.width, r.height));
      FX.vibrate([10, 26, 14]);
    } else {
      FX.pulse(btn, 'fav-deflate', 460);
      FX.vibrate(9);
    }
  };
  /* Колокольчик монеты — новое уведомление (js/v3-alerts.js): цена,
     рывок или новости. Слотов нет. */
  $('#tr-bell').onclick = function () { if (typeof Alerts !== 'undefined') Alerts.bell(); };

  initDesk();
  initChartInteractions();
  $$('.tf-btn').forEach(function (b) {
    b.onclick = function () {
      var tf = parseInt(b.getAttribute('data-tf'), 10);
      if ((tf === 60 || tf === 180) && typeof Ach !== 'undefined' && Ach.tfAllowed && !Ach.tfAllowed()) {
        toast(t('ach_tf_locked'));
        FX.nudge(b);
        return;
      }
      tradeTf = tf;
      resetChartView();
      renderTrade();
    };
  });
  /* Тип графика: свечи или линия. Выбор сохраняется в сейве и
     переживает перезагрузку. */
  $$('#chart-type button').forEach(function (b) {
    b.onclick = function () {
      var t2 = b.getAttribute('data-ctype') === 'line' ? 'line' : 'candle';
      if (S.chartType === t2) return;
      S.chartType = t2;
      syncChartType();
      saveState(false);
      updateTradePrices(true);
      FX.vibrate(8);
    };
  });
  $('#tr-amt-input').addEventListener('input', function () {
    var v = parseFloat(String(this.value).replace(',', '.'));
    /* Кладём ползунок туда же, куда и сумму: иначе при возврате фокуса
       шит показывал бы старый процент. */
    if (!isNaN(v)) tradeAmt = Math.max(0, Math.min(v, Math.floor(S.balance)));
    applyAmt();
  });
  $('#tr-amt-input').addEventListener('blur', applyAmt);
  /* Одна кнопка на два смысла: у покупки — весь баланс, у продажи —
     вся позиция. До этой правки кнопка вообще не работала на продаже:
     setAmt() крутит tradeAmt, а продажа считается от sellPct. */
  $('#tr-amt-max').onclick = function () {
    if (sheetMode === 'sell') { sellPct = 100; renderTradeSheet(true); }
    else setAmt('max');
  };
  $('#buy-btn').onclick = function () { openSheet('buy'); };
  $('#sell-btn').onclick = function () {
    if (!S.positions[tradeAssetId]) { toast(t('no_position')); return; }
    openSheet('sell');
  };
  $('#sheet-close').onclick = closeSheet;
  $('#sheet-backdrop').onclick = closeSheet;
  $('#sheet-confirm').onclick = function () {
    if (this.classList.contains('is-done')) return;
    /* В лимитном режиме кнопка не исполняет сделку, а размещает ордер;
       сам тик следит за условием. На рыночном — старая логика. */
    if (trMode === 'limit') { placeLimitOrder(); return; }
    if (sheetMode === 'buy') doBuy();
    else if (sheetMode === 'sell') doSell(sellPct);
  };

  /* Переключатель режима: «купить/продать сейчас» ↔ «лимитный ордер».
     Подписи кнопок зависят от стороны сделки — buy/sell, поэтому
     выставляются в renderTradeSheet, а здесь только переключение. */
  $$('#tr-mode-seg button').forEach(function (b) {
    b.onclick = function () { setTrMode(this.getAttribute('data-tr-mode')); };
  });
  /* Лимитная цена: тот же парсер, что у суммы покупки, с защитой от
     мусора и привязкой к текущей цене. На пустом/невалидном вводе
     оставляем старое значение, чтобы не сбрасывать шит в ноль. */
  $('#tr-limit-price').addEventListener('input', function () {
    var v = parseFloat(String(this.value).replace(',', '.'));
    if (!isNaN(v) && v > 0) { limitPrice = v; renderTradeSheet(); }
  });
  /* Один слайдер и один набор чипов на оба режима. У покупки ползунок
     крутит сумму в $ от баланса, у продажи — долю позиции: разница
     только в том, что записываем. */
  $('#tr-slider').addEventListener('input', function () {
    var p = parseInt(this.value, 10);
    if (sheetMode === 'sell') {
      sellPct = p;
    } else {
      var bal = Math.max(0, Math.floor(S.balance));
      tradeAmt = Math.round(bal * p / 100);
    }
    renderTradeSheet();
  });
  $$('#tr-pcts button').forEach(function (b) {
    b.onclick = function () {
      var p = parseInt(b.getAttribute('data-pct'), 10);
      if (sheetMode === 'sell') {
        sellPct = p;
      } else {
        tradeAmt = Math.max(0, Math.floor(S.balance * p / 100));
      }
      renderTradeSheet(true);
    };
  });
  /* Чипы «% от рынка» в лимитном режиме. Клик пересчитывает цену
     от текущей ask (для покупки) или bid (для продажи), кладёт её
     в limitPrice и перерисовывает шит. Короткая «вспышка» на чипе —
     чтобы было видно, что нажатие поймано, без отскока. */
  /* Делегированный обработчик на контейнере чипов: кнопки пересоздаются
     в renderLimitPcts() на каждом ререндере, так что обычный forEach
     однажды повешенных onclick'ов пропустил бы новые чипы. */
  var limitBox = $('#tr-limit-pcts');
  if (limitBox && !limitBox.__limitBound) {
    limitBox.__limitBound = true;
    limitBox.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-offset]');
      if (!btn) return;
      var off = parseFloat(btn.getAttribute('data-offset'));
      if (isNaN(off)) return;
      var a = assetById(tradeAssetId);
      if (!a) return;
      var ts = now();
      var ref = (sheetMode === 'buy') ? Engine.ask(a, ts) : Engine.bid(a, ts);
      if (!(ref > 0)) return;
      var px = ref * (1 + off / 100);
      if (!(px > 0)) return;
      limitPrice = px;
      btn.classList.remove('flash'); void btn.offsetWidth; btn.classList.add('flash');
      renderTradeSheet();
    });
  }

  /* Кнопка «настроить проценты» — открывает попап с редактором
     S.limitOffsets. По умолчанию подписи и плейсхолдер уже в HTML,
     но содержимое списка рисуется динамически. */
  var editBtn = $('#tr-limit-edit');
  if (editBtn && !editBtn.__editBound) {
    editBtn.__editBound = true;
    editBtn.onclick = openLimitEditPopup;
  }

  /* Обработчики попапа редактирования: делегирование на список
     (чипы рисуются динамически), отдельные клики на «Добавить»,
     «По умолчанию», «✕» и фон. */
  var editList = $('#tr-limit-edit-list');
  if (editList && !editList.__rmBound) {
    editList.__rmBound = true;
    editList.addEventListener('click', function (e) {
      var x = e.target.closest('button[data-rm]');
      if (!x) return;
      var v = parseFloat(x.getAttribute('data-rm'));
      removeLimitOffset(v);
      renderLimitEditList();
      renderTradeSheet();
    });
  }
  var editAdd = $('#tr-limit-edit-add');
  if (editAdd && !editAdd.__addBound) {
    editAdd.__addBound = true;
    editAdd.onclick = function () {
      var inp = $('#tr-limit-edit-input');
      if (!inp) return;
      var raw = String(inp.value).replace(',', '.').trim();
      var v = parseFloat(raw);
      if (!isFinite(v) || v === 0) { toast(t('limit_edit_err')); return; }
      /* Нормируем к шагу 0.1: чтобы «1,5» и «1.5» дали один и тот
         же чип. Без этого в списке могли бы жить «1,5» и «1.50»
         как разные значения. */
      v = Math.round(v * 10) / 10;
      if (!addLimitOffset(v)) { toast(t('limit_edit_err')); return; }
      inp.value = '';
      renderLimitEditList();
      renderTradeSheet();
    };
  }
  var editReset = $('#tr-limit-edit-reset');
  if (editReset && !editReset.__resetBound) {
    editReset.__resetBound = true;
    editReset.onclick = function () {
      S.limitOffsets = { buy: [-5, -2, -1, 0], sell: [0, 1, 2, 5] };
      saveState(true);
      renderLimitEditList();
      renderTradeSheet();
    };
  }
  var editClose = $('#tr-limit-edit-close');
  if (editClose && !editClose.__closeBound) {
    editClose.__closeBound = true;
    editClose.onclick = closeLimitEditPopup;
  }
  var editBackdrop = $('#tr-limit-edit-backdrop');
  if (editBackdrop && !editBackdrop.__bdBound) {
    editBackdrop.__bdBound = true;
    editBackdrop.onclick = closeLimitEditPopup;
  }

  /* Пауза при уходе со страницы. Сворачивание — это тоже пауза
     геймплея, поэтому цикл глушим, а сейв пишем НЕМЕДЛЕННО: раньше
     здесь стоял saveState(false), то есть debounce 1,5 с, и убитый
     процесс уносил последние изменения. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      stopGameLoop();
      try { saveState(true); } catch (e) { dbg('rowFrom', e); }
    } else {
      startGameLoop();
    }
  });
}

/* Смена темы делает невалидными цвета всех запущенных canvas-анимаций:
   сбрасываем кеш и гасим кадры, чтобы они перезапустились уже в новой палитре. */
function resetCanvasFx() {
  sparkColors = null;
  allocOtherCol = null;
  var list = document.querySelectorAll('canvas');
  for (var i = 0; i < list.length; i++) {
    var cv = list[i];
    if (cv.__sparkRaf) { cancelAnimationFrame(cv.__sparkRaf); cv.__sparkRaf = 0; }
    if (cv.__pfRaf) { cancelAnimationFrame(cv.__pfRaf); cv.__pfRaf = 0; }
    if (cv.__donutRaf) { cancelAnimationFrame(cv.__donutRaf); cv.__donutRaf = 0; }
    /* Петля «доезда» утолщения сегмента тоже держит цвета палитры. */
    if (cv.__selLoop) { cancelAnimationFrame(cv.__selLoop); cv.__selLoop = 0; }
  }
}

/* Перерисовать всё, что зависит от палитры, после смены темы. */
function redrawCanvases() {
  drawSparks(false);
  if (currentTab === 'portfolio') renderPortfolio(true);
}

/* Темы приложения. Список — единственное место, где перечислены
   допустимые значения S.theme: и валидация при загрузке сейва, и
   applyTheme читают его отсюда. Раньше проверка была инлайном
   («light || midnight»), и добавление темы за достижение требовало
   правки в трёх местах — ровно на этом и спотыкались: новая тема
   молча откатывалась на тёмную.

   Все темы, кроме light, — тёмные: палитра наследует базовый :root и
   переопределяет только поверхности, поэтому цвета текста и золота
   остаются проверенными на контраст. */
var THEMES = ['dark', 'light', 'midnight', 'dawn', 'carbon', 'ash', 'malachite', 'bordeaux', 'abyss', 'sakura', 'aurum'];

function applyTheme() {
  var theme = THEMES.indexOf(S.theme) >= 0 ? S.theme : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  /* Кастомный акцент поверх темы (перк ранга / предмет «Неон»).
     Перекрываем золото и градиент кнопок; текстовый --gold не трогаем,
     чтобы не уронить контраст в светлой теме. */
  try {
    var acc = (typeof Ach !== 'undefined' && Ach.isOn && Ach.isOn()) ? Ach.accentColor() : null;
    if (acc) {
      document.documentElement.style.setProperty('--accent', acc);
      document.documentElement.style.setProperty('--gold-grad',
        'linear-gradient(135deg, ' + acc + ' 0%, ' + acc + ' 55%, ' + acc + ' 100%)');
    } else {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--gold-grad');
    }
  } catch (e) { dbg('applyTheme', e); }
  resetCanvasFx();
  /* theme-color следует за темой: в index.html он зашит как тёмный
     (#0b0f14), и в светлой теме браузерная панель на мобильном
     оставалась чёрной полосой над светлым интерфейсом. */
  try {
    var bgCol = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    var tcMeta = document.querySelector('meta[name="theme-color"]');
    if (tcMeta && bgCol) tcMeta.setAttribute('content', bgCol);
  } catch (e) { dbg('applyTheme:themeColor', e); }
  /* Иллюстрации бонусов — вырезки из макета, своя версия на тему.
     Папки есть только под light и dark; все остальные темы (Полночь,
     Рассвет, Карбон, Пепел) берут тёмные — иначе src указывал бы на
     несуществующий img/gift-dawn.png и картинка пропадала. */
  var it = (theme === 'light') ? 'light' : 'dark';
  var g = $('#ac-gift-img');
  var p = $('#ac-play-img');
  var w = $('#ac-spin-img');
  if (g) { g.src = 'img/gift-' + it + '.png?v=139'; if (!g.__fb) { g.__fb = true; g.onerror = function () { this.style.visibility = 'hidden'; }; } else { g.style.visibility = ''; } }
  if (p) { p.src = 'img/play-' + it + '.png?v=139'; if (!p.__fb) { p.__fb = true; p.onerror = function () { this.style.visibility = 'hidden'; }; } else { p.style.visibility = ''; } }
  if (w) { w.src = 'img/spin-' + it + '.png?v=139'; if (!w.__fb) { w.__fb = true; w.onerror = function () { this.style.visibility = 'hidden'; }; } else { w.style.visibility = ''; } }
  /* Логотипы достижений зависят от темы (img/ach-dark/ vs img/ach-light/) —
     перерисовать строку и открытый экран достижений. */
  try {
    if (typeof Ach !== 'undefined' && Ach.isOn && Ach.isOn()) {
      Ach.renderRow();
      if (typeof currentScreen !== 'undefined' && currentScreen === 'scr-ach') Ach.renderList();
    }
  } catch (e) { dbg('applyTheme', e); }
}

function detectLang() {
  if (S.lang === 'ru' || S.lang === 'en') { LANG = S.lang; return; }
  var l = YaGame.lang();
  LANG = (['ru', 'be', 'kk', 'uk', 'uz'].indexOf(l) >= 0) ? 'ru' : 'en';
}

function boot() {
  setupTxMeta();
  YaGame.init({
    onPause: function () {
      /* Платформа уходит в фон / показывает свою рекламу — глушим цикл
         и фиксируем прогресс, который мог накопиться между плановыми
         сохранениями. */
      stopGameLoop();
      Snd.pause('ya');
      try { saveState(true); } catch (e) { dbg('boot', e); }
    },
    onResume: function () { Snd.resume('ya'); startGameLoop(); }
  }).then(function () {
    detectLang();
    document.documentElement.setAttribute('lang', LANG);
    initRankData();
    return loadState();
  }).then(function () {
    /* Режим анимаций из сейва — до первой отрисовки. */
    if (typeof Motion !== 'undefined') { try { Motion.fromSave(S); } catch (e) { dbg('boot:motion', e); } }
    applyTheme();
    applyI18n();
    $('#ver').textContent = t('version') + ' 1.0.0';
    bindEvents();
    /* Прогрев кеша иконок сортировки — открытие модалки не тормозит. */
    preloadSortIcons();
    /* Экран загрузки: докачивает картинки (логотипы, иконки, ачивки, фон)
       до входа в лобби, чтобы при первом запуске они не появлялись по
       одной. Повторные запуски берут всё из кеша за доли секунды. */
    var ready = typeof Loader !== 'undefined' ? Loader.run() : Promise.resolve();
    return ready.then(function () {
      if (S.name) {
        enterMain();
      } else {
        renderNick();
      }
      /* Dev-хосты: ?tab=profile|rating|market… открывает вкладку сразу после
         старта. Вручную это не сделать — boot ещё не завершён, цикл не
         запущен, и любой внешний setTab затрётся этим же boot'ом. */
      if (typeof isDevHost === 'function' && isDevHost()) {
        var _m = /[?&]tab=([a-z]+)/.exec(location.search);
        if (_m) { try { setTab(_m[1], true); renderTab(_m[1]); } catch (e) { dbg('boot', e); } }
      }
      if (typeof Fut !== 'undefined') { try { Fut.afterLoad(); } catch (e) { dbg('boot:fut', e); } }
      if (typeof Alerts !== 'undefined') { try { Alerts.afterLoad(); } catch (e) { dbg('boot:alerts', e); } }
      /* Первый снимок сразу после загрузки. Иначе новый аккаунт ждал бы
         минуту до первой точки ALL, а старый — терял бы изменение между
         последним сохранённым снимком и входом в игру. */
      pushPfSnapshot(true);
      /* При провале загрузки saveState ничего не пишет (см. saveLoadFailed) —
         дефолт затёр бы облако. */
      saveState(true);
      YaGame.ready();
      /* Скажем честно, что сессия без сохранения: иначе игрок решит, что
         прогресс пропал, и будет прав. */
      if (saveLoadFailed) toast(t('save_offline'), 'gold');
      /* Цикл запускаем через startGameLoop, чтобы его можно было
         остановить на паузе платформы (см. stopGameLoop). */
      startGameLoop();
      setTimeout(maybeSubmitScore, 4000);
      /* Достижения: свой секундный тик, ночные сессии, очередь показа. */
      if (typeof Ach !== 'undefined') { try { Ach.init(); Ach.emit('app:open'); } catch (e) { dbg('boot', e); } }
      if (typeof Loader !== 'undefined') setTimeout(Loader.prefetchOther, 6000);
    });
  }).catch(function (e) {
    console.error('boot failed', e);
    $('#scr-loading').innerHTML = '<div class="center">' + (I18N[LANG] ? t('loading') : 'Loading') + ': error</div>';
  });
}

document.addEventListener('DOMContentLoaded', boot);
