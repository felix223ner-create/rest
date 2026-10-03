/*!
 * fx.js — игровые эффекты TradeUp: частицы, рябь, вспышки, баннеры, твины чисел.
 * Всё построено на DOM + CSS-анимациях, без библиотек.
 * Полностью отключается при prefers-reduced-motion.
 */
'use strict';

var FX = (function () {
  var layerEl = null;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(mq && mq.matches);
  /* Настройка «меньше движения» подхватывается сразу, без
     перезагрузки: слушаем смену системной настройки. */
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function (e) { reduced = e.matches; });
  } else if (mq && mq.addListener) {
    mq.addListener(function (e) { reduced = e.matches; });
  }

  function reducedMotion() { return reduced; }
  /* «Стандартные анимации» в настройках (js/v3-motion.js): без частиц,
     вспышек краёв и летящих монет — остаются короткие переходы. */
  function lite() { return reduced || (typeof Motion !== 'undefined' && Motion.std()); }

  function layer() {
    if (layerEl && layerEl.isConnected) return layerEl;
    layerEl = document.getElementById('fx-layer');
    if (!layerEl) {
      layerEl = document.createElement('div');
      layerEl.id = 'fx-layer';
      document.body.appendChild(layerEl);
    }
    return layerEl;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function put(el, life) {
    layer().appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, life);
    return el;
  }

  /* У скрытого узла rect нулевой — эффект улетал бы в левый верхний угол.
     Тогда берём центр экрана. */
  function center(el) {
    var r = el && el.getBoundingClientRect();
    if (!r || (!r.width && !r.height)) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* Монеты летят по дуге из точки from к узлу/точке to. opts: img (картинка
     монеты), count, size, onHit (при прилёте первой), arc (высота дуги). */
  function fly(from, to, opts) {
    opts = opts || {};
    var dst = to && to.getBoundingClientRect ? center(to) : to;
    if (lite() || !dst || !from) { if (opts.onHit) opts.onHit(); return; }
    var count = opts.count || 6, size = opts.size || 26, hit = false;
    var dx = dst.x - from.x, dy = dst.y - from.y;
    var arc = opts.arc != null ? opts.arc : Math.min(160, 60 + Math.hypot(dx, dy) * 0.25);
    for (var i = 0; i < count; i++) {
      (function (i) {
        var el = document.createElement('i');
        el.className = 'fx-fly';
        el.style.width = el.style.height = size + 'px';
        if (opts.img) el.style.backgroundImage = 'url("' + opts.img + '")';
        var jx = rnd(-26, 26), jy = rnd(-14, 14), side = rnd(-0.5, 0.5) * arc;
        var cx = from.x + dx * 0.35 + side, cy = Math.min(from.y, dst.y) - arc;
        var frames = [], steps = 14;
        for (var k = 0; k <= steps; k++) {
          var t = k / steps, u = 1 - t;
          var sx = from.x + jx * (1 - t), sy = from.y + jy * (1 - t);
          var x = u * u * sx + 2 * u * t * cx + t * t * dst.x;
          var y = u * u * sy + 2 * u * t * cy + t * t * dst.y;
          var sc = k === 0 ? 0.4 : 1 - t * 0.55;
          frames.push({ transform: 'translate(' + (x - size / 2).toFixed(1) + 'px,' + (y - size / 2).toFixed(1) + 'px) scale(' + sc.toFixed(2) + ') rotate(' + Math.round(t * rnd(-200, 200)) + 'deg)',
            opacity: k === 0 ? 0 : k === steps ? 0.2 : 1, offset: t });
        }
        var dur = rnd(560, 720), delay = i * 55;
        put(el, dur + delay + 60);
        if (!el.animate) { if (!hit && opts.onHit) { hit = true; opts.onHit(); } return; }
        var an = el.animate(frames, { duration: dur, delay: delay, easing: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)', fill: 'both' });
        an.onfinish = function () {
          if (el.parentNode) el.parentNode.removeChild(el);
          if (!hit && opts.onHit) { hit = true; if (typeof Snd !== 'undefined') Snd.play('coin_hit'); opts.onHit(); }
        };
      })(i);
    }
  }

  /* Короткая вибрация на мобильных. */
  function vibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }

  /* Перезапуск CSS-анимации на элементе (снять → reflow → поставить → убрать). */
  function pulse(el, cls, ms) {
    if (!el || reduced) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    /* Хэндл храним на элементе. Без этого повторный вызов до истечения ms
       запускал новую анимацию, но СТАРЫЙ таймер оставался жить и снимал
       класс раньше времени — вспышка обрывалась на середине. */
    clearTimeout(el.__fxPulse);
    el.__fxPulse = setTimeout(function () {
      el.__fxPulse = 0;
      el.classList.remove(cls);
    }, ms || 640);
  }

  /* ------------------------- Рябь от касания ------------------------- */

  function ripple(host, clientX, clientY) {
    if (reduced || !host) return;
    var r = host.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var el = document.createElement('span');
    el.className = 'fx-ripple';
    el.style.width = el.style.height = size + 'px';
    el.style.left = (clientX - r.left - size / 2) + 'px';
    el.style.top = (clientY - r.top - size / 2) + 'px';
    host.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 640);
  }

  /* ------------------------- Частицы ------------------------- */

  var GOLD = ['#f7d879', '#e9b640', '#c98f1b'];
  var GREEN = ['#3bffa3', '#2fbe6e', '#1d9e5a'];
  var RED = ['#ff5f57', '#f0524f', '#d64545'];

  /* Взрыв частиц из точки. kind: 'coin' | 'confetti' | 'paper'. */
  function burst(x, y, opts) {
    if (lite()) return;
    opts = opts || {};
    var count = opts.count || 18;
    var kind = opts.kind || 'coin';
    var palette = opts.colors || (kind === 'coin' ? GOLD : kind === 'confetti' ? GOLD.concat(GREEN, RED) : GREEN);
    var spread = opts.spread || 130;

    for (var i = 0; i < count; i++) {
      var el = document.createElement('i');
      el.className = 'fx-p fx-p--' + kind;
      var ang, dist;
      if (kind === 'confetti') {
        ang = rnd(-Math.PI * 0.95, -Math.PI * 0.05);
        dist = rnd(spread * 0.7, spread * 2.1);
      } else {
        ang = rnd(0, Math.PI * 2);
        dist = rnd(spread * 0.25, spread);
      }
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist - (kind === 'coin' ? rnd(30, 90) : 0);
      var size = kind === 'confetti' ? rnd(5, 9) : kind === 'coin' ? rnd(7, 13) : rnd(4, 8);
      var dur = rnd(620, 1150);

      el.style.setProperty('--x', x + 'px');
      el.style.setProperty('--y', y + 'px');
      el.style.setProperty('--dx', dx.toFixed(1) + 'px');
      el.style.setProperty('--dy', dy.toFixed(1) + 'px');
      el.style.setProperty('--s', size.toFixed(1) + 'px');
      el.style.setProperty('--e', (kind === 'confetti' ? rnd(0.5, 1) : rnd(0.25, 0.7)).toFixed(2));
      el.style.setProperty('--r', Math.round(rnd(-540, 540)) + 'deg');
      el.style.setProperty('--dur', Math.round(dur) + 'ms');
      el.style.setProperty('--delay', Math.round(rnd(0, 90)) + 'ms');
      el.style.setProperty('--c', pick(palette));
      put(el, dur + 220);
    }
  }

  /* Конфетти: два залпа из-за верхней кромки + фонтан из центра. */
  function confetti() {
    if (lite()) return;
    var w = window.innerWidth, h = window.innerHeight;
    var colors = GOLD.concat(GREEN, RED, ['#38bdf8', '#a78bfa']);
    for (var s = 0; s < 3; s++) {
      (function (i) {
        setTimeout(function () {
          burst(rnd(w * 0.15, w * 0.85), h * 0.34, {
            count: 26, kind: 'confetti', colors: colors, spread: 150
          });
        }, i * 170);
      })(s);
    }
  }

  /* ------------------------- Вспышка по краям экрана ------------------------- */

  var FLASH = {
    up: 'rgba(47,190,110,0.45)',
    down: 'rgba(240,82,79,0.45)',
    gold: 'rgba(233,182,64,0.5)'
  };

  function edgeFlash(kind) {
    if (lite()) return;
    var c = FLASH[kind] || FLASH.gold;
    ['top', 'bot'].forEach(function (side) {
      var el = document.createElement('div');
      el.className = 'fx-edge ' + side;
      el.style.setProperty('--c', c);
      put(el, 700);
    });
  }

  /* ------------------------- Шторка (смена темы) ------------------------- */

  function curtain(swap) {
    if (reduced) { swap(); return; }
    var el = document.createElement('div');
    el.className = 'fx-curtain';
    layer().appendChild(el);
    requestAnimationFrame(function () { el.classList.add('on'); });
    setTimeout(function () {
      try { swap(); } catch (e) { console.error(e); }
      requestAnimationFrame(function () { el.classList.remove('on'); });
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 160);
  }

  /* ------------------------- Всплывающий текст ------------------------- */

  function floatText(x, y, text, kind) {
    if (reduced) return;
    var el = document.createElement('div');
    el.className = 'fx-float' + (kind ? ' ' + kind : '');
    el.textContent = text;
    el.style.setProperty('--x', x + 'px');
    el.style.setProperty('--y', y + 'px');
    put(el, 1250);
  }

  /* ------------------------- Баннер достижения ------------------------- */

  function banner(title, sub) {
    if (reduced) return;
    var el = document.createElement('div');
    el.className = 'fx-banner';

    var ico = document.createElement('span');
    ico.className = 'fx-banner-ico';
    ico.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">' +
      '<path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 16.9 6.2 19.9l1.1-6.5L2.6 8.8l6.5-.9z"/></svg>';

    var b = document.createElement('b');
    b.textContent = title;
    var i = document.createElement('i');
    i.textContent = sub || '';

    el.appendChild(ico);
    el.appendChild(b);
    el.appendChild(i);
    put(el, 2400);
  }

  /* ------------------------- Комплексные игровые моменты ------------------------- */

  /* Сделка: вспышка края, фонтан монет, вибрация, (на продаже) всплывающий P&L. */
  function trade(kind, el, pnlText) {
    var pt = center(el);
    if (kind === 'buy') {
      edgeFlash('gold');
      burst(pt.x, pt.y, { kind: 'coin', count: 20, spread: 120 });
      vibrate([12, 38, 20]);
    } else {
      edgeFlash(pnlText && pnlText.charAt(0) === '-' ? 'down' : 'up');
      burst(pt.x, pt.y, { kind: 'paper', count: 18, spread: 110 });
      vibrate([14, 42, 24]);
      if (pnlText) floatText(pt.x, pt.y - 26, pnlText, pnlText.charAt(0) === '-' ? 'down' : 'up');
    }
  }

  /* Получение бонуса: монеты летят из кнопки. */
  function reward(el) {
    var pt = center(el);
    burst(pt.x, pt.y, { kind: 'coin', count: 22, spread: 135 });
    vibrate([10, 30, 16]);
  }

  /* Новый класс трейдера. */
  function levelUp(name, bonus) {
    confetti();
    edgeFlash('gold');
    banner(name, bonus);
    vibrate([18, 50, 18, 50, 26]);
  }

  /* ------------------------- Твин числа ------------------------- */

  function tweenNumber(el, to, opts) {
    if (!el) return;
    opts = opts || {};
    var fmt = opts.fmt || function (v) { return String(Math.round(v)); };
    if (el.__fxNum) { cancelAnimationFrame(el.__fxNum); el.__fxNum = 0; }
    var from = opts.from != null
      ? opts.from
      : (parseFloat(String(el.textContent).replace(/[^\d.\-]/g, '')) || 0);
    if (reduced || Math.abs(to - from) < 0.5) {
      /* Короткий путь: анимации нет, но хэндл надо погасить — иначе в
         el.__fxNum остаётся завершённый id, и следующий вызов зря
         дёргает cancelAnimationFrame по мусорному номеру. */
      el.__fxNum = 0;
      el.textContent = fmt(to);
      return;
    }
    var dur = opts.dur || 380;
    var t0 = 0;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) { el.__fxNum = requestAnimationFrame(step); }
      else { el.textContent = fmt(to); el.__fxNum = 0; }
    }
    el.__fxNum = requestAnimationFrame(step);
  }

  /* ------------------------- Тряска при ошибке ------------------------- */

  function nudge(el) {
    if (typeof Snd !== 'undefined') Snd.play('error');
    pulse(el, 'nudge', 500);
    vibrate(30);
  }

  return {
    center: center,
    fly: fly,
    pulse: pulse,
    ripple: ripple,
    burst: burst,
    confetti: confetti,
    edgeFlash: edgeFlash,
    curtain: curtain,
    floatText: floatText,
    banner: banner,
    trade: trade,
    reward: reward,
    levelUp: levelUp,
    tweenNumber: tweenNumber,
    nudge: nudge,
    vibrate: vibrate,
    reducedMotion: reducedMotion,
    lite: lite
  };
})();
