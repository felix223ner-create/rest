/* Dev-only: засеять state одним открытым ордером, открыть экран
   торговли, переключить вкладку деска на «orders». НЕ для прод-сборки.
   Включается через ?dev=orders в index.html. */
(function () {
  var FLAG_KEY = '__dev_orders_active';

  function pickAssetSync() {
    /* Синхронно: ASSETS уже должен быть в глобале к моменту, когда
       мы инжектимся (после data-coins.js). */
    if (typeof ASSETS !== 'undefined' && ASSETS.length) return ASSETS[0];
    if (typeof COINS_DEFS !== 'undefined' && COINS_DEFS.length) return COINS_DEFS[0];
    return null;
  }

  function seedNow(a) {
    /* Не перетираем _dev_seed.js — он ставит в localStorage ДО boot,
       и YaGame.load подхватывает именно его. Этот seed — фоллбэк на
       случай, если _dev_seed.js не отработал (например, нет ?dev=). */
    if (!a) return;
    try {
      var existing = localStorage.getItem('yagame_save');
      if (existing) return;
    } catch (e) {}
    var now = Date.now();
    var px2 = (typeof a.base === 'number' && isFinite(a.base)) ? a.base : (a.price || 0);
    var d = {
      v: 1, name: 'Dima', balance: 50000, positions: {}, trades: [],
      realized: 0, tradesCount: 0, wins: 0, sellsCount: 0, best: 0, createdAt: now,
      dailyDay: '', streak: 0, lastAdAt: 0, lastGrantAt: 0, classSeen: 99,
      theme: 'dark', lang: 'ru', favs: {}, notifies: {},
      sortKey: 'cap', sortDir: 'desc', avatar: 'avatar_01',
      limitOrders: [{
        id: 'lo_seed_1', assetId: a.id, side: 'buy',
        price: px2 > 0 ? +(px2 * 0.96).toFixed(a.dec || 2) : 0,
        amount: 3293, createdAt: now, armed: true
      }],
      orderHistory: [],
      limitOffsets: { buy: [-3, -2, -1, 0, 1], sell: [-1, 0, 1, 2, 3] }
    };
    try { localStorage.setItem('yagame_save', JSON.stringify(d)); } catch (e) {}
  }

  function jumpToTrade(a) {
    var tries = 0;
    (function loop() {
      if (typeof openTrade === 'function' && typeof setDeskTab === 'function') {
        try {
          openTrade(a.id);
          setTimeout(function () { try { setDeskTab('orders'); } catch (e) {} }, 250);
        } catch (e) {}
        return;
      }
      if (++tries > 400) {
        /* Раньше выход был молчаливым — 10 секунд ожидания и тишина.
           Теперь честный warn: видно, что dev-хук не дождался игры. */
        if (window.console && console.warn) console.warn('[dev_orders] openTrade/setDeskTab not found after 400 tries, giving up');
        return;
      }
      setTimeout(loop, 25);
    })();
  }

  function boot() {
    if (window[FLAG_KEY]) return;
    window[FLAG_KEY] = 1;
    var a = pickAssetSync();
    if (a) seedNow(a);
    /* Сразу прячем splash — в headless его анимации могут занять
       весь virtual-time-budget. */
    try { var s = document.getElementById('scr-loading'); if (s) s.classList.add('hidden'); } catch (e) {}
    if (a) jumpToTrade(a);
  }

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);})();
