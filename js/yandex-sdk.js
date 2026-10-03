/*!
 * yandex-sdk.js — обертка над SDK Яндекс Игр для vanilla JS игр.
 * Подключать после <script src="/sdk.js"></script>, вызвать YaGame.init({...}) на старте.
 *
 * Закрывает обязательные требования модерации:
 *  - 1.19.1  инициализация по документации;
 *  - 1.19.2  LoadingAPI.ready() — вызвать YaGame.ready(), когда UI готов к вводу;
 *  - 1.19.3  GameplayAPI.start()/stop() — автоматическая разметка;
 *  - 1.19.4  game_api_pause/resume — колбэки onPause/onResume (пп. 1.3, 4.7);
 *  - 1.9     облачные сохранения с очередью и лимитами (100 запросов / 5 мин);
 *  - 1.2.2   гостевой режим: сейвы работают без авторизации;
 *  - 2.14    язык из environment.i18n.lang на старте.
 *
 * Вне Яндекса (локальная разработка) автоматически включаются моки:
 * сейвы в localStorage, реклама-заглушки, язык из navigator.
 * API см. references/sdk-api.md, оригиналы — references/official-docs/sdk/.
 */
(function (global) {
  'use strict';

  var YaGame = {
    ysdk: null,
    player: null,
    mock: false,
    _lang: null,
    _gameplayActive: false,
    _saveTimer: null,
    _dirty: false,
    _pendingData: null,
    _callbacks: {},
  };

  /* ------------------------------------------------------------------ */
  /* Инициализация                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * opts: {
   *   onPause?:  Function, // остановить звук и игровой цикл (треб. 1.3, 4.7)
   *   onResume?: Function, // возобновить
   *   mockAdDelay?: number // мс до "закрытия" рекламы в моках, по умолчанию 500
   * }
   */
  YaGame.init = function (opts) {
    opts = opts || {};
    YaGame._callbacks = opts;
    if (typeof global.YaGames === 'undefined') {
      YaGame.mock = true;
      return Promise.resolve(YaGame._initAfter());
    }
    return global.YaGames.init()
      .then(function (ysdk) {
        YaGame.ysdk = ysdk;
        return YaGame._initAfter();
      })
      .catch(function (e) {
        // SDK есть, но не инициализировался — не роняем игру, работаем на моках.
        console.error('YaGames.init failed, fallback to mock', e);
        YaGame.mock = true;
        return YaGame._initAfter();
      });
  };

  YaGame._initAfter = function () {
    if (YaGame.mock) {
      YaGame._lang = (navigator.language || 'ru').slice(0, 2);
    } else {
      // Треб. 2.14: язык платформы на старте, до первого текста.
      YaGame._lang = (YaGame.ysdk.environment.i18n && YaGame.ysdk.environment.i18n.lang) || 'ru';
      // Треб. 1.19.4: пауза/резюм от платформы (стартовая реклама, вкладка, покупки).
      // Колбэки берём из YaGame._callbacks: `opts` — параметр YaGame.init,
      // в область видимости _initAfter он не попадает (был ReferenceError
      // на каждом событии платформы). Читаем в момент вызова, а не при
      // регистрации: onPause/onResume могли заменить позже.
      YaGame.ysdk.on('game_api_pause', function () {
        var f = YaGame._callbacks.onPause; if (f) f();
      });
      YaGame.ysdk.on('game_api_resume', function () {
        var f = YaGame._callbacks.onResume; if (f) f();
      });
      return YaGame.ysdk.getPlayer().then(function (player) {
        YaGame.player = player;
        return YaGame;
      }, function (e) {
        /* getPlayer отвалился (сеть, отказ авторизации). Раньше .catch тут
           не было, и отклонение роняло ВСЮ цепочку boot: игрок вместо игры
           видел «loading: error». Откатываемся в mock — игра работает на
           localStorage, как на локальном хосте. */
        console.warn('getPlayer failed, falling back to mock', e);
        YaGame.player = null;
        return YaGame;
      });
    }
    return Promise.resolve(YaGame);
  };

  /* ------------------------------------------------------------------ */
  /* Game Ready / геймплей                                               */
  /* ------------------------------------------------------------------ */

  /** Вызвать, когда все ресурсы загружены и игрок может взаимодействовать (треб. 1.19.2). */
  YaGame.ready = function () {
    if (!YaGame.mock && YaGame.ysdk.features && YaGame.ysdk.features.LoadingAPI) {
      try { YaGame.ysdk.features.LoadingAPI.ready(); } catch (e) { console.error(e); }
    }
  };

  /** Старт/возобновление геймплея (уровень, закрытие меню, снятие с паузы). */
  YaGame.gameplayStart = function () {
    if (YaGame._gameplayActive) return;
    YaGame._gameplayActive = true;
    if (!YaGame.mock && YaGame.ysdk.features && YaGame.ysdk.features.GameplayAPI) {
      try { YaGame.ysdk.features.GameplayAPI.start(); } catch (e) { console.error(e); }
    }
  };

  /** Остановка геймплея (меню, пауза, перед рекламой, уход из вкладки, конец уровня). */
  YaGame.gameplayStop = function () {
    if (!YaGame._gameplayActive) return;
    YaGame._gameplayActive = false;
    if (!YaGame.mock && YaGame.ysdk.features && YaGame.ysdk.features.GameplayAPI) {
      try { YaGame.ysdk.features.GameplayAPI.stop(); } catch (e) { console.error(e); }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Сохранения (треб. 1.9: сразу после действия; лимит 100 запросов/5 мин) */
  /* ------------------------------------------------------------------ */

  var LS_PREFIX = 'yagame_';

  /* Лимит платформы — 100 запросов setData за 5 минут. Держим свой
     счётчик с запасом: 90 за окно (~одно сохранение раз в 3.3 с).
     Немедленные сохранения (сделка, награда) упирались в лимит за
     пару минут активной торговли, а ошибка setData только логировалась —
     прогресс терялся молча. Теперь при исчерпанном бюджете запрос не
     выбрасывается, а откладывается до ближайшего свободного окна. */
  var SAVE_WINDOW_MS = 5 * 60 * 1000;
  var SAVE_MAX_PER_WINDOW = 90;
  /* Одно действие игрока порождает НЕСКОЛЬКО немедленных сохранений
     подряд: сама сделка (doBuy/doSell) + onTrade в достижениях +
     разблокировка ачивки. Все они происходят в одном кадре и пишут
     один и тот же объект S, то есть дублируют друг друга. Если с
     прошлого flush прошло меньше MIN_IMMEDIATE_GAP, превращаем запрос
     в короткий debounce — серия схлопывается в один setData, а прогресс
     всё равно уходит через доли секунды. */
  var MIN_IMMEDIATE_GAP = 400;
  var _saveStamps = [];
  var _retryTimer = null;
  var _lastFlushAt = 0;
  var _saveDueAt = 0;
  var _adBusy = false;      // ролик уже показывается — второй запуск запрещён

  function _budgetLeft() {
    var cut = Date.now() - SAVE_WINDOW_MS;
    while (_saveStamps.length && _saveStamps[0] < cut) _saveStamps.shift();
    return SAVE_MAX_PER_WINDOW - _saveStamps.length;
  }

  /* Повтор отложенного сохранения. Один таймер на всех: несколько
     параллельных вызовов не должны плодить очередь. */
  function _scheduleRetry(delay) {
    if (_retryTimer) return;
    _retryTimer = setTimeout(function () {
      _retryTimer = null;
      YaGame._flushSave();
    }, delay);
  }

  /** Отметить прогресс измененным. Сохранит пачкой через debounce; flush сразу. */
  /* Планировщик отложенного flush. Держим САМЫЙ РАННИЙ срок: немедленное
     сохранение сделки не должно отодвигаться обычным debounce-ом, который
     придёт следом из тика (рекорд капитала, плановый снимок). Поведение
     получается «throttle»: не чаще одного запроса в 1.5 с и не позже
     1.5 с после первого изменения — для сейва это правильнее чистого
     debounce, потому что окно потери данных ограничено сверху. */
  function _scheduleFlush(delay) {
    var due = Date.now() + delay;
    if (YaGame._saveTimer && _saveDueAt && _saveDueAt <= due) return;
    if (YaGame._saveTimer) clearTimeout(YaGame._saveTimer);
    _saveDueAt = due;
    YaGame._saveTimer = setTimeout(function () {
      _saveDueAt = 0;
      YaGame._flushSave();
    }, delay);
  }

  YaGame.save = function (data, immediate) {
    YaGame._dirty = true;
    YaGame._pendingData = data;
    if (immediate) {
      var since = Date.now() - _lastFlushAt;
      if (since < MIN_IMMEDIATE_GAP) {
        _scheduleFlush(MIN_IMMEDIATE_GAP - since);
        return Promise.resolve();
      }
      /* Бюджет исчерпан — не бьёмся в лимит платформы. Данные остаются
         в _pendingData с _dirty, их допишет отложенный повтор. */
      if (_budgetLeft() <= 0) { _scheduleRetry(5000); return Promise.resolve(false); }
      return YaGame._flushSave();
    }
    _scheduleFlush(1500);
    return Promise.resolve();
  };

  /* Счётчик попыток сохранения: по нему catch понимает, не устарел ли его
     снимок. Живёт на уровне модуля, а не в YaGame, — это внутренняя кухня. */
  var _saveVer = 0;

  YaGame._flushSave = function () {
    if (!YaGame._dirty) return Promise.resolve();
    if (YaGame.mock || !YaGame.player) {
      YaGame._dirty = false;
      YaGame._saveTimer = null;
      _lastFlushAt = Date.now();
      try { localStorage.setItem(LS_PREFIX + 'save', JSON.stringify(YaGame._pendingData || {})); } catch (e) {}
      return Promise.resolve();
    }
    if (_budgetLeft() <= 0) { _scheduleRetry(5000); return Promise.resolve(false); }
    var data = YaGame._pendingData;
    /* Номер попытки. Нужен, чтобы падение СТАРОГО запроса не затёрло
       более свежие данные: пока setData(dataA) летел, игрок мог совершить
       сделку, и save(dataB) положил в _pendingData уже dataB. Прежний
       catch безусловно возвращал dataA — и сделка пропадала. */
    var myVer = ++_saveVer;
    /* _dirty снимаем сразу и возвращаем в catch при ошибке: если оставить
       его взведённым, параллельный flush уйдёт вторым запросом. */
    YaGame._dirty = false;
    YaGame._saveTimer = null;
    _lastFlushAt = Date.now();
    _saveStamps.push(_lastFlushAt);
    return YaGame.player.setData({ save: data }).then(function () {
      return true;
    }).catch(function (e) {
      console.error('setData', e);
      if (myVer === _saveVer) YaGame._pendingData = data;
      YaGame._dirty = true;
      _scheduleRetry(4000);
      return false;
    });
  };

  /** Загрузить прогресс: объект, null (сейва нет) или ОТКЛОНЕНИЕ при ошибке.
      Различие принципиальное: раньше здесь стоял .catch(() => null), и обрыв
      сети выглядел как «сейва нет» — boot сохранял свежий дефолт поверх
      облака, и прогресс игрока пропадал навсегда. Теперь вызывающий сам
      решает, можно ли писать. */
  YaGame.load = function () {
    if (YaGame.mock || !YaGame.player) {
      try {
        var raw = localStorage.getItem(LS_PREFIX + 'save');
        return Promise.resolve(raw ? JSON.parse(raw) : null);
      } catch (e) { return Promise.resolve(null); }
    }
    return YaGame.player.getData(['save']).then(function (d) {
      return (d && d.save) ? d.save : null;
    });
  };

  // Не потерять несохраненное при закрытии/сворачивании.
  window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && YaGame._dirty) YaGame._flushSave();
  });
  window.addEventListener('pagehide', function () {
    if (YaGame._dirty) YaGame._flushSave();
  });

  /* ------------------------------------------------------------------ */
  /* Реклама (только в логических паузах! Никогда не по setInterval)      */
  /* ------------------------------------------------------------------ */

  /**
   * Полноэкранная реклама. Сам ставит геймплей на паузу и возвращает.
   * Возвращает Promise<boolean> — была ли показана.
   */
  YaGame.showInterstitial = function () {
    YaGame.gameplayStop();
    var onPause = YaGame._callbacks.onPause; if (onPause) onPause();
    if (YaGame.mock) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          YaGame._afterAd(); resolve(true);
        }, YaGame._callbacks.mockAdDelay || 500);
      });
    }
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (wasShown) { if (!done) { done = true; YaGame._afterAd(); resolve(!!wasShown); } };
      try {
        YaGame.ysdk.adv.showFullscreenAdv({
          onOpen: function () {},
          onClose: function (wasShown) { finish(wasShown); },
          onError: function (e) { console.error('interstitial', e); finish(false); },
        });
      } catch (e) { finish(false); }
    });
  };

  /**
   * Rewarded video. onReward вызывается, когда просмотр засчитан.
   * Кнопка вызова обязана говорить, что будет реклама и какая награда (треб. 4.5.1).
   */
  YaGame.showRewarded = function (onReward) {
    /* Один ролик за раз. Раньше защита была только от двойного ЗАВЕРШЕНИЯ
       (done), а от двойного ЗАПУСКА — нет: два быстрых клика по «за
       рекламу» уходили в showRewardedVideo дважды, и награда выдавалась за
       каждый. Возвращаем false — вызывающий видит обычный «не посмотрел». */
    if (_adBusy) return Promise.resolve(false);
    _adBusy = true;
    YaGame.gameplayStop();
    var onPause = YaGame._callbacks.onPause; if (onPause) onPause();
    if (YaGame.mock) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (onReward) onReward();
          YaGame._afterAd(); _adBusy = false; resolve(true);
        }, YaGame._callbacks.mockAdDelay || 500);
      });
    }
    return new Promise(function (resolve) {
      var rewarded = false;
      /* guard от двойного завершения: onClose и onError могут прийти
         оба, и тогда _afterAd() отыграет дважды (двойной onResume). */
      var done = false;
      var finish = function (ok) {
        if (done) return;
        done = true;
        _adBusy = false;
        YaGame._afterAd();
        resolve(!!ok);
      };
      try {
        YaGame.ysdk.adv.showRewardedVideo({
          onOpen: function () {},
          onRewarded: function () { rewarded = true; if (onReward) onReward(); },
          onClose: function () { finish(rewarded); },
          onError: function (e) { console.error('rewarded', e); finish(false); },
        });
      } catch (e) { finish(false); }
    });
  };

  /** Возобновить звук/геймплей после рекламы (треб. 4.2, 4.7). */
  YaGame._afterAd = function () {
    var onResume = YaGame._callbacks.onResume; if (onResume) onResume();
    YaGame.gameplayStart();
  };

  /* ------------------------------------------------------------------ */
  /* Прочее                                                              */
  /* ------------------------------------------------------------------ */

  YaGame.lang = function () { return YaGame._lang || 'ru'; };

  /** 'desktop' | 'mobile' | 'tablet' | 'tv' (детали — official-docs/sdk/sdk-params.md). */
  YaGame.device = function () {
    if (YaGame.mock) return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    var d = YaGame.ysdk.deviceInfo;
    if (!d) return 'desktop';
    if (d.isTV && d.isTV()) return 'tv';
    if (d.isTablet && d.isTablet()) return 'tablet';
    if (d.isMobile && d.isMobile()) return 'mobile';
    return 'desktop';
  };

  /** Надежное серверное время (мс) — для ежедневных бонусов, Date.now() накручивается. */
  YaGame.serverTime = function () {
    if (YaGame.mock) return Date.now();
    try { return YaGame.ysdk.serverTime(); } catch (e) { return Date.now(); }
  };

  /** Авторизация ТОЛЬКО по явной кнопке пользователя; вернуть успех. */
  YaGame.openAuthDialog = function () {
    if (YaGame.mock) { YaGame.player = null; return Promise.resolve(false); }
    return YaGame.ysdk.auth.openAuthDialog().then(function () {
      return YaGame.ysdk.getPlayer().then(function (p) { YaGame.player = p; return true; });
    }).catch(function () { return false; });
  };

  YaGame.isAuthorized = function () {
    return !!(YaGame.player && YaGame.player.isAuthorized && YaGame.player.isAuthorized());
  };

  /** Лидерборды — опциональная фича: ошибка не должна ломать игру. */
  YaGame.submitScore = function (boardName, score) {
    if (YaGame.mock || !YaGame.isAuthorized()) return Promise.resolve(false);
    try {
      return YaGame.ysdk.leaderboards.setScore(boardName, score)
        .then(function () { return true; })
        .catch(function (e) { console.error('leaderboard', e); return false; });
    } catch (e) { console.error('leaderboard unavailable', e); return Promise.resolve(false); }
  };

  /** Стики-баннер управляется из Консоли; здесь только опциональное скрытие/показ. */
  YaGame.hideStickyBanner = function () {
    if (YaGame.mock || !YaGame.ysdk || !YaGame.ysdk.adv) return Promise.resolve();
    try {
      var r = YaGame.ysdk.adv.hideBannerAdv();
      return (r && r.catch) ? r.catch(function () {}) : Promise.resolve();
    } catch (e) { console.error('hideBanner', e); return Promise.resolve(); }
  };
  YaGame.showStickyBanner = function () {
    if (YaGame.mock || !YaGame.ysdk || !YaGame.ysdk.adv) return Promise.resolve();
    try {
      var r = YaGame.ysdk.adv.showBannerAdv();
      return (r && r.catch) ? r.catch(function () {}) : Promise.resolve();
    } catch (e) { console.error('showBanner', e); return Promise.resolve(); }
  };

  /* ------------------------------------------------------------------ */
  /* Инап-покупки (п. 1.13). Постоянные покупки не консумируются:       */
  /* владение восстанавливается через getPurchases() на каждом старте.  */
  /* ------------------------------------------------------------------ */

  var _payP = null;
  YaGame._payments = function () {
    if (YaGame.mock) return Promise.resolve(null);
    if (!_payP) {
      var y = YaGame.ysdk;
      _payP = (y && y.getPayments ? y.getPayments() : Promise.resolve(y && y.payments))
        .then(function (p) { if (!p) throw new Error('payments unavailable'); return p; });
      _payP.catch(function () { _payP = null; });
    }
    return _payP;
  };

  /* Каталог: [{ id, title, priceValue, currency, icon }]. Цена и значок
     валюты — только из SDK (п. 1.13.2); в моках — заглушка для разработки. */
  YaGame.catalog = function () {
    if (YaGame.mock) {
      return Promise.resolve([{ id: 'trader_pass', title: 'Premium pass', priceValue: '200', currency: 'YAN', icon: '' }]);
    }
    return YaGame._payments().then(function (p) { return p.getCatalog(); }).then(function (list) {
      return (list || []).map(function (it) {
        var icon = '';
        try { icon = it.getPriceCurrencyImage ? it.getPriceCurrencyImage('svg') : ''; } catch (e) { icon = ''; }
        return { id: it.id, title: it.title, priceValue: it.priceValue, price: it.price, currency: it.priceCurrencyCode, icon: icon };
      });
    });
  };

  /* id купленных товаров. В моках — из localStorage, чтобы покупка
     переживала перезагрузку так же, как на платформе. */
  YaGame.purchases = function () {
    if (YaGame.mock) {
      try { return Promise.resolve(JSON.parse(localStorage.getItem(LS_PREFIX + 'purchases') || '[]')); } catch (e) { return Promise.resolve([]); }
    }
    return YaGame._payments().then(function (p) { return p.getPurchases(); }).then(function (list) {
      return (list || []).map(function (it) { return it.productID; });
    });
  };

  /** Покупка: Promise<boolean>. Отмена игроком и ошибки дают false. */
  YaGame.purchase = function (id) {
    if (YaGame.mock) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          try {
            var own = JSON.parse(localStorage.getItem(LS_PREFIX + 'purchases') || '[]');
            if (own.indexOf(id) < 0) own.push(id);
            localStorage.setItem(LS_PREFIX + 'purchases', JSON.stringify(own));
          } catch (e) {}
          resolve(true);
        }, YaGame._callbacks.mockAdDelay || 700);
      });
    }
    return YaGame._payments().then(function (p) { return p.purchase({ id: id }); })
      .then(function (r) { return !!(r && r.productID === id); })
      .catch(function (e) { console.warn('purchase', e); return false; });
  };

  global.YaGame = YaGame;
})(window);
