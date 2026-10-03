/* Dev-only: засеять localStorage одним открытым ордером ДО boot.
   Подключается в <head> после yandex-sdk.js, но до data-coins.js и
   main.js. Синхронно читает ASSETS (к моменту загрузки этого скрипта
   data-coins.js ещё не подгружен — ASSETS может быть undefined, тогда
   ставим BTC-фоллбэк). */
(function () {
  function pickAsset() {
    if (typeof ASSETS !== 'undefined' && ASSETS.length) return ASSETS[0];
    /* Фоллбэк: первый ассет, идентичный bitcoin. */
    return { id: 'bitcoin', ticker: 'BTC', dec: 1, base: 77605 };
  }
  var a = pickAsset();
  var now = Date.now();
  var px = (typeof a.base === 'number' && isFinite(a.base)) ? a.base : (a.price || 77605);
  var d = {
    v: 1, name: 'Dima', balance: 50000, positions: {}, trades: [],
    realized: 0, tradesCount: 0, wins: 0, sellsCount: 0, best: 0, createdAt: now,
    dailyDay: '', streak: 0, lastAdAt: 0, lastGrantAt: 0, classSeen: 99,
    theme: 'dark', lang: 'ru', favs: {}, notifies: {},
    sortKey: 'cap', sortDir: 'desc', avatar: 'avatar_01',
    limitOrders: [{
      id: 'lo_seed_1', assetId: a.id, side: 'buy',
      /* Далеко ниже рынка, чтобы buy-ордер точно НЕ исполнился
         на первом тике (а в headless он случится за миллисекунды
         после рендера). 0.5x от base = −50%, и в скрине
         distance '▼ 50%' смотрится естественно. */
      price: +(px * 0.5).toFixed(a.dec || 2),
      amount: 3293, createdAt: now, armed: true
    }],
    orderHistory: [],
    limitOffsets: { buy: [-3, -2, -1, 0, 1], sell: [-1, 0, 1, 2, 3] }
  };
  try { localStorage.setItem('yagame_save', JSON.stringify(d)); } catch (e) {}
})();
