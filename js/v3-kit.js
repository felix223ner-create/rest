/* v3-kit — общие утилиты редизайна (концепты concept/*.html): одометр,
   вспышка изменившихся цифр, твины, пути спарклайнов, кольца отсчёта,
   всплывающие суммы и расширение словарей I18N из слоёв вкладок.
   Грузится до main.js, но функции игры (money, t) вызывает только в рантайме. */
'use strict';

var V3 = (function () {
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(mq && mq.matches); }
  /* Частицы и вспышки — только в «Продвинутых анимациях» (js/v3-motion.js). */
  function lite() { return reduced() || (typeof Motion !== 'undefined' && Motion.std()); }
  /* JS-длительности подчиняются тому же --k, что и CSS (inline на <html>,
     как у кнопки «Замедлить» концептов) — удобно для отладки анимаций. */
  function kMul() {
    var k = parseFloat(document.documentElement.style.getPropertyValue('--k'));
    return k > 0 ? k : 1;
  }
  function D(ms) { return reduced() ? 0 : ms * kMul(); }
  function reflow(el) { return el && el.offsetWidth; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

  /* Твин на rAF. Возвращает функцию остановки. */
  function tween(ms, step, done, ease) {
    ms = D(ms);
    if (!ms) { step(1); if (done) done(); return function () {}; }
    var t0 = performance.now(), stop = false;
    function f(ts) {
      if (stop) return;
      /* Метка rAF бывает раньше performance.now() из старта — без нижней
         границы первый кадр уходил в минус (счётчик показывал «-9»). */
      var p = Math.max(0, Math.min(1, (ts - t0) / ms));
      step(ease ? ease(p) : p);
      if (p < 1) requestAnimationFrame(f); else if (done) done();
    }
    requestAnimationFrame(f);
    return function () { stop = true; };
  }

  /* Число докручивается до to; fmt форматирует промежуточные значения. */
  function countTo(el, to, fmt, ms) {
    if (!el) return;
    if (el.__v3stop) el.__v3stop();
    var from = el.__v3v == null ? to : el.__v3v;
    el.__v3v = to;
    if (from === to || !ms) { el.textContent = fmt(to); return; }
    el.__v3stop = tween(ms, function (p) { el.textContent = fmt(lerp(from, to, easeOut(p))); });
  }

  /* ---------- Одометр ---------- */

  var DIG = '<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>';
  function odoHTML(txt) {
    var h = '', dot = false;
    for (var i = 0; i < txt.length; i++) {
      var ch = txt[i];
      if (ch === '.') dot = true;
      if (/\d/.test(ch)) h += '<span class="odo-d' + (dot ? ' cents' : '') + '"><span style="transform:translateY(-' + ch + 'em)">' + DIG + '</span></span>';
      else if (ch === '\u00a0' || ch === '\u202f' || ch === ' ') h += '<span class="odo-c sp"></span>';
      else h += '<span class="odo-c' + (dot ? ' cents' : '') + '">' + esc(ch) + '</span>';
    }
    return '<span class="odo">' + h + '</span>';
  }
  function odoApply(el, txt) {
    var cols = el.querySelectorAll('.odo-d > span'), k = 0;
    for (var i = 0; i < txt.length; i++) if (/\d/.test(txt[i])) { if (cols[k]) cols[k].style.transform = 'translateY(-' + txt[i] + 'em)'; k++; }
    el.__odoTxt = txt;
  }
  function flash(el, dir) {
    if (!el || !dir) return;
    el.classList.remove('v3-fl-up', 'v3-fl-down');
    reflow(el);
    el.classList.add(dir > 0 ? 'v3-fl-up' : 'v3-fl-down');
    clearTimeout(el.__v3ft);
    el.__v3ft = setTimeout(function () { el.classList.remove('v3-fl-up', 'v3-fl-down'); }, D(650) + 60);
  }
  /* opts: fmt (по умолчанию money), from — стартовое значение, flash — вспышка
     цветом при изменении. Повторные вызовы с тем же текстом ничего не делают. */
  function odo(el, v, opts) {
    if (!el) return;
    opts = opts || {};
    var fmt = opts.fmt || function (x) { return money(x, 2); };
    var txt = fmt(v), old = el.__odoTxt, prevV = el.__odoV;
    el.__odoV = v;
    if (opts.from != null || !old || old.length !== txt.length || !el.querySelector('.odo')) {
      var start = opts.from != null ? fmt(opts.from) : (old && el.querySelector('.odo') ? old : txt);
      if (start.length !== txt.length) start = txt.replace(/\d/g, '0');
      el.innerHTML = odoHTML(start);
      el.__odoTxt = start;
      if (start !== txt) { reflow(el); odoApply(el, txt); }
    } else if (old !== txt) odoApply(el, txt);
    if (opts.flash && prevV != null && Math.abs(v - prevV) > 0.009) flash(el, v > prevV ? 1 : -1);
  }

  /* Цена: вспыхивают только изменившиеся символы (с первого отличия). */
  function flashText(el, txt, dir) {
    if (!el) return;
    var old = el.__v3txt;
    el.__v3txt = txt;
    if (old == null || old === txt || old.length !== txt.length || !dir || reduced()) { el.textContent = txt; return; }
    var i = 0;
    while (i < txt.length && txt[i] === old[i]) i++;
    el.innerHTML = esc(txt.slice(0, i)) + '<span class="v3-fd ' + (dir > 0 ? 'up' : 'down') + '">' + esc(txt.slice(i)) + '</span>';
    clearTimeout(el.__v3fdt);
    el.__v3fdt = setTimeout(function () { if (el.__v3txt === txt) el.textContent = txt; }, 900);
  }

  /* ---------- Спарклайны ---------- */

  /* Пути линии и заливки для значений vals в рамке w×h (pad — поля по высоте). */
  function sparkPaths(vals, w, h, pad) {
    pad = pad == null ? 2 : pad;
    if (!vals || vals.length < 2) return { line: '', area: '', last: { x: w, y: h / 2 } };
    var mn = Infinity, mx = -Infinity;
    for (var i = 0; i < vals.length; i++) { if (vals[i] < mn) mn = vals[i]; if (vals[i] > mx) mx = vals[i]; }
    var rng = mx - mn || 1, n = vals.length - 1, d = '', x = 0, y = 0;
    for (var j = 0; j < vals.length; j++) {
      x = (j / n) * w;
      y = pad + (1 - (vals[j] - mn) / rng) * (h - pad * 2);
      d += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return { line: d, area: d + 'L' + w + ' ' + h + 'L0 ' + h + 'Z', last: { x: x, y: y } };
  }

  /* ---------- Кольцо отсчёта ---------- */

  function ringHTML(r) {
    r = r || 16;
    var c = 2 * Math.PI * r;
    return '<svg class="v3-ring" viewBox="0 0 ' + (r * 2 + 4) + ' ' + (r * 2 + 4) + '"><circle class="t" cx="' + (r + 2) + '" cy="' + (r + 2) + '" r="' + r + '"/>' +
      '<circle class="p" cx="' + (r + 2) + '" cy="' + (r + 2) + '" r="' + r + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="0"/></svg>';
  }
  /* frac — доля оставшегося времени (1 — полный круг). */
  function ringSet(svg, frac) {
    var p = svg && svg.querySelector('.p');
    if (!p) return;
    var c = parseFloat(p.getAttribute('stroke-dasharray'));
    p.style.strokeDashoffset = (c * (1 - Math.max(0, Math.min(1, frac)))).toFixed(2);
  }

  /* ---------- Прочее ---------- */

  /* Всплывающая сумма над узлом (+$1 000). */
  function floatAmt(anchor, text, color) {
    if (!anchor || reduced()) return;
    var r = anchor.getBoundingClientRect();
    var f = document.createElement('span');
    f.className = 'v3-float';
    f.textContent = text;
    if (color) f.style.color = color;
    f.style.left = (r.left + r.width / 2) + 'px';
    f.style.top = (r.top - 6) + 'px';
    document.body.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, D(1400) + 50);
  }

  /* Каскад появления: детям root проставляется --d с шагом step (мс). */
  function reveal(root, sel, step, base) {
    if (!root) return;
    var els = sel ? root.querySelectorAll(sel) : root.children;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      el.classList.remove('v3-rv');
      el.style.setProperty('--d', String((base || 0) + i * (step || 60)));
      reflow(el);
      el.classList.add('v3-rv');
    }
  }

  /* Слои вкладок дописывают свои строки в I18N, не трогая i18n.js. */
  function i18n(dict) {
    if (typeof I18N === 'undefined') return;
    for (var lang in dict) {
      if (!I18N[lang]) I18N[lang] = {};
      for (var k in dict[lang]) if (!(k in I18N[lang])) I18N[lang][k] = dict[lang][k];
    }
  }

  /* Обёртка глобальной функции игры: after(result, args) вызывается после
     оригинала. Внутренние вызовы main.js идут через глобальное имя, поэтому
     перехватываются тоже. */
  function after(name, fn) {
    var orig = window[name];
    if (typeof orig !== 'function') return false;
    window[name] = function () {
      var r = orig.apply(this, arguments);
      try { fn.call(this, r, arguments); } catch (e) { if (window.console) console.error('v3:' + name, e); }
      return r;
    };
    return true;
  }

  return {
    reduced: reduced, lite: lite, D: D, reflow: reflow, esc: esc, lerp: lerp, easeOut: easeOut, easeInOut: easeInOut,
    tween: tween, countTo: countTo, odo: odo, odoHTML: odoHTML, flash: flash, flashText: flashText,
    sparkPaths: sparkPaths, ringHTML: ringHTML, ringSet: ringSet, floatAmt: floatAmt, reveal: reveal,
    i18n: i18n, after: after
  };
})();
