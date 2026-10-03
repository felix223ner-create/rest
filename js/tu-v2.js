/* ==========================================================================
   tu-v2-trade — поведение для визуала шита покупки/продажи.

   Слой только читает DOM и вешает классы: ничего не считает, не подменяет
   тексты и не трогает функции игры. Задачи: сторона сделки в data-атрибуте,
   залитая часть ползунка, подгонка кегля длинных чисел и короткие реакции
   на действия игрока. Откат — удалить файл и ссылку на него в index.html.

   Адаптация к модальной системе игры: шит открывается снятием .hidden
   (и закрытием через .modal-out), а не классом .show из демо-референса.
   ========================================================================== */
(function () {
  'use strict';

  var MODAL_ID = 'modal-trade';
  /* Цифры, которые могут коротко «перекатываться». Текущая цена сюда
     сознательно не входит: она тикает сама и мигала бы постоянно. */
  var FLIP_IDS = ['tr-out-value', 'tr-amt-value', 'tr-det-get', 'tr-det-amt', 'tr-det-commission', 'tr-det-target'];
  var FIT_IDS = ['tr-amt-value', 'tr-out-value'];
  var TOUCH_WINDOW = 700;
  var FLIP_THROTTLE = 380;

  var lastTouch = 0;
  var lastSweep = 0;
  var lastTick = 0;
  var prevMarket = null;
  var syncTimer = null;

  function $(sel) { return document.querySelector(sel); }
  function byId(id) { return document.getElementById(id); }

  function reduced() {
    try {
      if (window.FX && typeof FX.reducedMotion !== 'undefined') {
        return typeof FX.reducedMotion === 'function' ? FX.reducedMotion() : !!FX.reducedMotion;
      }
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /* Шит «жив» с момента снятия .hidden и до ухода в .modal-out: на
     modal-out входные анимации перезапускать нельзя (кадр закрытия). */
  function isOpen(m) {
    return !!m && !m.classList.contains('hidden') && !m.classList.contains('modal-out');
  }

  function sheetEl() { return $('#' + MODAL_ID + ' .trade-sheet'); }

  /* Сторона сделки берётся из класса кнопки подтверждения (его ставит
     openSheet): up → покупка, down → продажа. Своего состояния не держим. */
  function applySide() {
    var sheet = sheetEl();
    var btn = byId('sheet-confirm');
    if (!sheet || !btn) return;
    var side = btn.classList.contains('down') ? 'sell' : (btn.classList.contains('up') ? 'buy' : '');
    if (side) sheet.setAttribute('data-tu-side', side);
  }

  /* Кегль крупных чисел под ширину колонки: «0.00060387 BTC» раньше
     обрезалось троеточием — именно то число, за которым шит и открывают. */
  /* Ширина текста мерится на canvas: у строки с text-overflow: ellipsis
     scrollWidth в Chromium равен clientWidth, так что по нему обрезку не поймать. */
  var measureCtx = null;
  function textWidth(el, text) {
    if (!text) return 0;
    if (!measureCtx) {
      var cv = document.createElement('canvas');
      measureCtx = cv.getContext ? cv.getContext('2d') : null;
    }
    if (!measureCtx) return 0;
    var cs = getComputedStyle(el);
    measureCtx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var w = measureCtx.measureText(text).width;
    /* measureText игнорирует letter-spacing — добавляем его вручную. */
    var ls = parseFloat(cs.letterSpacing);
    if (isFinite(ls)) w += ls * text.length;
    return w;
  }
  function contentWidth(box) {
    var total = 0;
    for (var i = 0; i < box.childNodes.length; i++) {
      var n = box.childNodes[i];
      if (n.nodeType === 3) total += textWidth(box, n.nodeValue);
      else if (n.nodeType === 1 && !n.hidden) total += textWidth(n, n.textContent) + 4;
    }
    return total;
  }

  function fit(node) {
    if (!node) return;
    /* Значение может быть инлайновым span внутри .tr-io-big (так сделан левый
       столбец со знаком валюты) — мерим и классифицируем контейнер. */
    var el = node.classList && node.classList.contains('tr-io-big')
      ? node
      : (node.closest ? (node.closest('.tr-io-big') || node) : node);
    el.classList.remove('tu-len-2', 'tu-len-3');
    var avail = el.clientWidth;
    if (!avail) return;
    var cs = getComputedStyle(el);
    avail -= (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    if (contentWidth(el) <= avail - 1) return;
    el.classList.add('tu-len-2');
    if (contentWidth(el) <= avail - 1) return;
    el.classList.remove('tu-len-2');
    el.classList.add('tu-len-3');
  }
  function fitAll() { FIT_IDS.forEach(function (id) { fit(byId(id)); }); }

  /* Подгонка кегля читает геометрию, поэтому ждём кадра: внутри
     обработчика мутаций синхронные замеры дают лишние reflow. */
  var fitQueue = [];
  function queueFit(el) {
    if (!el || fitQueue.indexOf(el) >= 0) return;
    fitQueue.push(el);
    if (fitQueue.length > 1) return;
    requestAnimationFrame(function () {
      var list = fitQueue.slice();
      fitQueue.length = 0;
      list.forEach(fit);
    });
  }

  /* Залитая часть трека ползунка. Игра правит value кодом (без события
     input), поэтому кроме слушателей есть тихий опрос. */
  function syncSlider() {
    var sl = byId('tr-slider');
    if (!sl) return;
    var wrap = sl.closest('.tr-slider-wrap') || sl.parentNode;
    var min = parseFloat(sl.min || '0');
    var max = parseFloat(sl.max || '100');
    var val = parseFloat(sl.value || '0');
    if (!isFinite(min) || !isFinite(max) || max === min) return;
    var pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
    if (wrap && wrap.style) wrap.style.setProperty('--tu-sl', pct.toFixed(2) + '%');
  }

  function restart(el, cls) {
    if (!el || reduced()) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function flash(el, cls, ms) {
    if (!el || reduced()) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, ms);
  }

  /* Реагируем только на изменения от действий игрока: иначе тик цены
     заставил бы цифры мигать непрерывно. */
  function onValueChange(el) {
    if (reduced()) return;
    var now = Date.now();
    if (now - lastTouch > TOUCH_WINDOW) return;
    if (el.__tuFlip && now - el.__tuFlip < FLIP_THROTTLE) return;
    el.__tuFlip = now;
    flash(el, 'tu-flip', 360);
    if (el.id === 'tr-out-value' && now - lastSweep > 520) {
      lastSweep = now;
      var io = el.closest('.tr-io');
      flash(io, 'tu-sweep', 640);
    }
  }

  /* Текущая цена в лимитном режиме: направление тика краской. */
  function onMarketTick(el) {
    if (reduced()) return;
    var num = parseFloat((el.textContent || '').replace(/[^\d.,-]/g, '').replace(/\s/g, '').replace(',', '.'));
    if (!isFinite(num)) return;
    var now = Date.now();
    if (prevMarket !== null && now - lastTick > 480) {
      if (num > prevMarket) { lastTick = now; flash(el, 'tu-up', 460); }
      else if (num < prevMarket) { lastTick = now; flash(el, 'tu-dn', 460); }
    }
    prevMarket = num;
  }

  function onOpen() {
    var sheet = sheetEl();
    if (!sheet) return;
    applySide();
    prevMarket = null;
    lastTouch = 0;
    restart(sheet, 'tu-tr');
    fitAll();
    requestAnimationFrame(fitAll);
    setTimeout(fitAll, 120);
    syncSlider();
    /* Тихий опрос ползунка, пока шит открыт. */
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = setInterval(function () {
      var m = byId(MODAL_ID);
      if (!isOpen(m)) { clearInterval(syncTimer); syncTimer = null; return; }
      syncSlider();
    }, 160);
  }

  function init() {
    var modal = byId(MODAL_ID);
    if (!modal) return;

    /* Открытие шита = снятие .hidden (закрытие уходит через .modal-out —
       это НЕ открытие, входные анимации на нём не перезапускаем).
       Сравниваем с ПРЕДЫДУЩИМ состоянием, а не просто «открыт ли сейчас»:
       иначе любая смена класса на открытом шите (кнопка подтверждения
       переключает up/down, applySide ставит акцент) считалась открытием и
       перезапускала каскад анимаций, обнуляла prevMarket и пересоздавала
       setInterval — на каждый тап. */
    var wasOpen = isOpen(modal);
    new MutationObserver(function () {
      var o = isOpen(modal);
      if (o && !wasOpen) onOpen();
      wasOpen = o;
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    if (wasOpen) onOpen();

    /* Кнопка подтверждения меняет класс up/down — вместе с ней меняется
       акцент всего шита. */
    var confirm = byId('sheet-confirm');
    if (confirm) {
      new MutationObserver(applySide).observe(confirm, { attributes: true, attributeFilter: ['class'] });
    }

    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var el = recs[i].target;
        if (el.nodeType === 3) el = el.parentNode;
        if (!el || !el.id) {
          el = el && el.closest ? el.closest('[id]') : null;
          if (!el) continue;
        }
        if (el.id === 'tr-limit-current') { onMarketTick(el); continue; }
        if (FLIP_IDS.indexOf(el.id) >= 0) {
          if (FIT_IDS.indexOf(el.id) >= 0) queueFit(el);
          onValueChange(el);
        }
      }
    }).observe(modal, { childList: true, characterData: true, subtree: true });

    /* Любое действие игрока открывает окно, в котором пересчёт считается
       реакцией на его тап, а не фоновым тиком цены. */
    ['pointerdown', 'input', 'keydown', 'change'].forEach(function (ev) {
      modal.addEventListener(ev, function () { lastTouch = Date.now(); }, true);
    });

    var sl = byId('tr-slider');
    if (sl) {
      var wrap = sl.closest('.tr-slider-wrap') || sl.parentNode;
      sl.addEventListener('input', syncSlider);
      sl.addEventListener('change', syncSlider);
      ['pointerdown', 'touchstart', 'focus'].forEach(function (ev) {
        sl.addEventListener(ev, function () { if (wrap) wrap.classList.add('is-drag'); }, { passive: true });
      });
      ['pointerup', 'pointercancel', 'touchend', 'blur', 'mouseleave'].forEach(function (ev) {
        sl.addEventListener(ev, function () { if (wrap) wrap.classList.remove('is-drag'); }, { passive: true });
      });
    }

    var pcts = byId('tr-pcts');
    if (pcts) {
      pcts.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('button') : null;
        if (b) flash(b, 'tu-pop', 260);
      });
    }

    if (confirm) {
      confirm.addEventListener('pointerdown', function () {
        if (!confirm.disabled) flash(confirm, 'tu-press', 360);
      });
    }

    var mkt = byId('tr-mode-market');
    if (mkt) {
      mkt.addEventListener('click', function () {
        flash(byId('size-fields'), 'tu-swap', 620);
        setTimeout(function () { syncSlider(); fitAll(); }, 40);
      });
    }
    var lim = byId('tr-mode-limit');
    if (lim) {
      lim.addEventListener('click', function () { setTimeout(fitAll, 40); });
    }

    window.addEventListener('resize', function () { syncSlider(); fitAll(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
