/* Свечный график на canvas. Без библиотек, поддержка Retina и тем. */
'use strict';

var Chart = (function () {
  var geo = null; // геометрия последней отрисовки — для хит-теста курсора

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    return {
      up: v('--up'), down: v('--down'), grid: v('--chart-grid'),
      text: v('--muted'), line: v('--chart-line'), entry: v('--accent'),
      bubble: v('--bubble-bg'), bubbleText: v('--bubble-text')
    };
  }

  function niceStep(min, max) {
    var raw = (max - min) / 4;
    /* Все цены равны → raw = 0 → log(0) = -Infinity → mag = 0 →
       norm = NaN → step = 0, и дальше вся сетка считается как NaN.
       На реальных данных недостижимо, но защита дешёвая. */
    if (!(raw > 0) || !isFinite(raw)) return 0;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
    return step * mag;
  }

  /* Скруглённый прямоугольник. ctx.roundRect есть не во всех браузерах,
     поэтому рисуем через quadraticCurveTo — работает везде. */
  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* Цветовые утилиты скинов: hex -> rgb, rgba-строка, смешение с белым
     или чёрным. Тема отдаёт цвета hex-ом; если разобрать не удалось,
     возвращаем исходную строку — цвет станет плоским, но не сломается. */
  function hex2rgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    if (!isFinite(r) || !isFinite(g) || !isFinite(b)) return null;
    return [r, g, b];
  }
  function rgba(h, a) {
    var c = hex2rgb(h);
    return c ? 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')' : h;
  }
  function mix(h, to, k) {
    var a = hex2rgb(h), b = hex2rgb(to);
    if (!a || !b) return h;
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * k) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * k) + ')';
  }

  /* HH:MM, а если между свечами меньше минуты — HH:MM:SS. */
  function fmtTime(ms, withSec) {
    var d = new Date(ms);
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    var s = p(d.getHours()) + ':' + p(d.getMinutes());
    if (withSec) s += ':' + p(d.getSeconds());
    return s;
  }

  /* canvas -> рисует свечи, сетку, метку последней цены и (опц.) линию входа в позицию. */
  function draw(canvas, data, opts) {
    opts = opts || {};
    /* Раньше стояло Math.max(2, dpr): на 1×-дисплеях canvas всё равно
       рендерился в 2× — лишняя память и CPU на слабых устройствах.
       Теперь честный devicePixelRatio с потолком 2 (Retina-чёткость
       сохраняется, буфер не раздувается). */
    var dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || !data.length) {
      /* Раньше просто выходили: если серия стала пустой, на canvas
         оставался «замёрзший» прошлый кадр. Теперь стираем. */
      try {
        var c0 = canvas.getContext('2d');
        c0.setTransform(1, 0, 0, 1, 0, 0);
        c0.clearRect(0, 0, canvas.width, canvas.height);
      } catch (e) { dbg('chart:clearEmpty', e); }
      return;
    }
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var col = colors();

    var padR = 64, padB = 26, padT = 8; /* padB — полоса под подписи времени */
    var plotW = w - padR, plotH = h - padB - padT;
    var hi = -Infinity, lo = Infinity;
    data.forEach(function (d) { hi = Math.max(hi, d.h); lo = Math.min(lo, d.l); });
    var live = opts.livePrice;
    if (live != null) { hi = Math.max(hi, live); lo = Math.min(lo, live); }
    /* Автошкала — ТОЛЬКО по свечам и живой цене (+6% паддинга).
       Цены лимитных ордеров сюда НЕ входят: далёкий ордер растягивал
       шкалу в десятки раз, и свечи сжимались в пунктир. Линии ордеров
       рисуются ниже и прижимаются к краю с ▲/▼-маркером, если цена
       вне диапазона, — их видно и без растягивания шкалы. */
    var pad = (hi - lo) * 0.06 || hi * 0.01;
    hi += pad; lo -= pad;
    if (lo <= 0) lo = hi * 0.05;
    /* Ручной масштаб оси цен (opts.yRange = {lo, hi}): игрок приблизил или
       отдалил шкалу, либо увёл её вверх/вниз. Авто-диапазон запоминаем в
       geo — от него стартует первый жест масштаба. */
    var autoLo = lo, autoHi = hi;
    var yz = opts.yZoom;
    if (yz && (yz.k !== 1 || yz.sh !== 0) && yz.k > 0) {
      /* Масштаб относительный: k — во сколько раз шире авто-окна, sh — сдвиг
         центра в долях авто-окна. Так график и после зума идёт за ценой. */
      var aSpan = autoHi - autoLo, cMid = (autoHi + autoLo) / 2 + yz.sh * aSpan, span = aSpan * yz.k;
      lo = cMid - span / 2; hi = cMid + span / 2;
      if (lo <= 0) { lo = Math.max(hi * 1e-4, 1e-12); }
    }

    var y = function (p) { return padT + (hi - p) / (hi - lo) * plotH; };
    var cw = plotW / data.length;
    var dec = opts.dec != null ? opts.dec : 2;
    geo = { w: w, h: h, plotW: plotW, plotH: plotH, padT: padT, cw: cw, n: data.length, y: y, lo: lo, hi: hi,
      autoLo: autoLo, autoHi: autoHi, padR: padR, dec: dec };
    canvas.__geo = geo;

    /* Уровни сетки — пунктирные линии, без подписей. Актуальная цена
       рисуется отдельной плашкой ниже, этого достаточно: столбик
       «2,000 / 1,900 / 1,800» только шумел. */
    var step = niceStep(lo, hi);
    var levels = [];
    for (var lp = Math.ceil(lo / step) * step; lp < hi; lp += step) levels.push(lp);

    ctx.font = '9px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    /* Ширина пузыря метки последней цены (используется ниже). */
    var lastLabel = fmt(live != null ? live : data[data.length - 1].c, dec);
    var boxW = Math.ceil(ctx.measureText(lastLabel).width) + 12;

    /* Сетка пунктиром — без подписей цен. */
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = col.grid;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1;
    levels.forEach(function (p) {
      var yy = y(p);
      ctx.beginPath();
      ctx.moveTo(0, yy); ctx.lineTo(plotW, yy);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    /* График. Тип: 'candle' (по умолчанию) или 'line' — переключатель
       в шапке графика (S.chartType). */
    var lastC = null;
    var skin = (opts.candles && typeof opts.candles === 'object') ? opts.candles : null;
    var upC0 = skin && skin.up ? skin.up : col.up;
    var dnC0 = skin && skin.down ? skin.down : col.down;
    /* Появление (canvas.__grow 0..1 ставит v3-market): свечи вырастают из
       середины тела слева направо, линия дорисовывается. */
    var grow = canvas.__grow >= 0 && canvas.__grow < 1 ? canvas.__grow : 1;
    var nData = data.length;
    function growK(i) {
      var g = Math.max(0, Math.min(1, grow * 1.7 - i / nData * 0.7));
      return 1 - Math.pow(1 - g, 3);
    }
    var bodyW0 = Math.max(1.5, Math.floor(cw * 0.74));
    var skinBW = skin && skin.bodyK > 0 ? Math.max(1, Math.floor(bodyW0 * skin.bodyK)) : bodyW0;

    if (opts.type === 'line') {
      /* Линия закрытий: сглаживание по серединам отрезков, мягкое
         свечение и градиентная заливка под кривой — как в референсе.
         Цвет — по тренду видимого окна. Сетка, метка последней цены,
         лимитки и перекрестие работают ниже как обычно. */
      var lUp = data[data.length - 1].c >= data[0].o;
      var lC = lUp ? upC0 : dnC0;
      var lN = grow < 1 ? Math.min(data.length, Math.max(2, Math.ceil(data.length * grow))) : data.length;
      ctx.save();
      ctx.beginPath();
      for (var li = 0; li < lN; li++) {
        var lx2 = li * cw + cw / 2, ly3 = y(data[li].c);
        if (!li) ctx.moveTo(lx2, ly3);
        else {
          var pxp = (li - 1) * cw + cw / 2, pyp = y(data[li - 1].c);
          ctx.quadraticCurveTo((pxp + lx2) / 2, pyp, lx2, ly3);
        }
      }
      ctx.strokeStyle = lC;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 14;
      ctx.shadowColor = rgba(lC, 0.5);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.lineTo((lN - 1) * cw + cw / 2, padT + plotH);
      ctx.lineTo(cw / 2, padT + plotH);
      ctx.closePath();
      var lg = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      lg.addColorStop(0, rgba(lC, 0.3));
      lg.addColorStop(1, rgba(lC, 0));
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.restore();
      lastC = data[data.length - 1].c;
    } else {
      /* Свечи. Скин из витрины (opts.candles): свои цвета, ширина тела,
         скругление, градиент, свечение. Без скина — цвета темы, но с той
         же базовой обработкой «Стандарта»: скруглённое тело с лёгким
         вертикальным градиентом и фитиль с прозрачностью (плоский
         fillRect выглядел дёшево — это главная замена). Параметры скина:
         up/down, bodyK, glow (px), radius (px), wick/wickA (толщина и
         альфа фитиля), grad (сила градиента 0..1), hollow (полое тело),
         sheen (блик на теле). */
      var st = {
        radius: skin && skin.radius != null ? skin.radius : 2.5,
        wick: skin && skin.wick != null ? skin.wick : 1.4,
        wickA: skin && skin.wickA != null ? skin.wickA : 0.9,
        grad: skin && skin.grad != null ? skin.grad : 0.22,
        hollow: !!(skin && skin.hollow),
        sheen: !!(skin && skin.sheen)
      };
      data.forEach(function (d, i) {
        var x = i * cw + cw / 2;
        var up = d.c >= d.o;
        lastC = d.c;
        var cC = up ? upC0 : dnC0;
        var yO = y(d.o), yC = y(d.c), yH = y(d.h), yL = y(d.l);
        var gk = grow < 1 ? growK(i) : 1;
        if (gk <= 0) return;
        if (gk < 1) {
          var ym = (yO + yC) / 2;
          yO = ym + (yO - ym) * gk; yC = ym + (yC - ym) * gk;
          yH = ym + (yH - ym) * gk; yL = ym + (yL - ym) * gk;
        }
        var top = Math.min(yO, yC);
        var hgt = Math.max(1.4, Math.abs(yC - yO));

        ctx.save();
        if (gk < 1) ctx.globalAlpha = Math.min(1, gk * 1.4);
        if (skin && skin.glow) {
          ctx.shadowBlur = typeof skin.glow === 'number' ? skin.glow : 6;
          ctx.shadowColor = cC;
        }
        /* Фитиль — тонкий, полупрозрачный по альфе скина. */
        ctx.strokeStyle = rgba(cC, st.wickA);
        ctx.lineWidth = st.wick;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, yH); ctx.lineTo(x, yL);
        ctx.stroke();

        /* Тело — скруглённый прямоугольник; цвет объёмный вертикальным
           градиентом (светлее к верху тела, темнее к низу). */
        var rad = Math.max(0, Math.min(st.radius, skinBW / 2, hgt / 2));
        roundRect(ctx, x - skinBW / 2, top, skinBW, hgt, rad);
        if (st.hollow) {
          ctx.fillStyle = rgba(cC, 0.12);
          ctx.fill();
          ctx.lineWidth = Math.min(2.2, Math.max(1.2, skinBW * 0.16));
          ctx.strokeStyle = cC;
          ctx.stroke();
        } else {
          if (st.grad > 0) {
            var bg = ctx.createLinearGradient(0, top, 0, top + hgt);
            bg.addColorStop(0, mix(cC, '#ffffff', st.grad * 0.62));
            bg.addColorStop(0.5, cC);
            bg.addColorStop(1, mix(cC, '#000000', st.grad * 0.5));
            ctx.fillStyle = bg;
          } else {
            ctx.fillStyle = cC;
          }
          ctx.fill();
          /* Блик на левом крае тела — «литой» вид (Золото). */
          if (st.sheen && skinBW > 4) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            roundRect(ctx, x - skinBW / 2 + skinBW * 0.16, top + 1, Math.max(1, skinBW * 0.2), Math.max(0, hgt - 2), 1);
            ctx.fill();
          }
        }
        ctx.restore();
      });
      ctx.shadowBlur = 0;
    }

    /* Линия входа в позицию. */
    if (opts.entryPrice != null && opts.entryPrice > lo && opts.entryPrice < hi) {
      var ey = y(opts.entryPrice);
      ctx.strokeStyle = col.entry;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, ey); ctx.lineTo(plotW, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* Лимитные ордера. Каждый рисуем пунктиром в цвет стороны
       (зелёный — покупка, красный — продажа), с подписью справа от
       графика. Подпись — тот же формат, что у метки последней цены,
       чтобы стили не разъезжались. Ордер вне диапазона НЕ входит
       в автошкалу (иначе свечи сжимались в пунктир), а рисуется
       прижатым к краю линией-маркером: игрок видит, что ордер
       ждёт выше/ниже видимого окна. */
    if (opts.limitOrders && opts.limitOrders.length) {
      ctx.font = '9px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.lineWidth = 1;
      for (var lj = 0; lj < opts.limitOrders.length; lj++) {
        var lo2 = opts.limitOrders[lj];
        var lp = lo2.price;
        if (!(lp > 0)) continue;
        var inR = lp > lo && lp < hi;
        var ly2 = inR ? y(lp) : (lp >= hi ? padT + 8 : padT + plotH - 8);
        var isBuy = lo2.side === 'buy';
        ctx.strokeStyle = isBuy ? col.up : col.down;
        ctx.globalAlpha = 0.75;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, ly2); ctx.lineTo(plotW, ly2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        var lblTxt = (isBuy ? '▲ ' : '▼ ') + fmt(lp, dec);
        var lblW = Math.ceil(ctx.measureText(lblTxt).width) + 10;
        var lx = Math.min(plotW + 2, w - lblW - 2);
        roundRect(ctx, lx, ly2 - 8, lblW, 16, 4);
        ctx.fillStyle = isBuy ? col.up : col.down;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(lblTxt, lx + 5, ly2);
      }
    }

    /* Произвольные подписанные уровни (фьючерсы: вход, ликвидация, TP/SL).
       Как и лимитные ордера, в автошкалу не входят: уровень вне окна
       прижимается к краю со стрелкой, чтобы свечи не сжимались. */
    if (opts.lines && opts.lines.length) {
      ctx.font = '600 9px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.lineWidth = 1;
      /* Метки уровней не должны лежать друг на друге: два уровня за краем
         окна прижимаются к одной точке. Раздвигаем подписи по вертикали,
         сами линии остаются на своих ценах. */
      var lnList = [];
      for (var lk0 = 0; lk0 < opts.lines.length; lk0++) {
        var l0 = opts.lines[lk0];
        if (!l0 || !(l0.price > 0)) continue;
        var in0 = l0.price > lo && l0.price < hi;
        var ly0 = in0 ? y(l0.price) : (l0.price >= hi ? padT + 8 : padT + plotH - 8);
        lnList.push({ ln: l0, lnIn: in0, lny: ly0, tagY: ly0 });
      }
      lnList.sort(function (a, b) { return (a.tagY - b.tagY) || (b.ln.price - a.ln.price); });
      /* Плашка живой цены стоит на месте, подписи уровней расходятся от неё
         вверх и вниз, не залезая на неё и друг на друга. */
      var liveTag = live != null ? y(live) : null;
      if (liveTag != null) {
        var lnUp = lnList.filter(function (it) { return it.tagY <= liveTag; });
        var lnDn = lnList.filter(function (it) { return it.tagY > liveTag; });
        var limU = liveTag - 17;
        for (var lu = lnUp.length - 1; lu >= 0; lu--) {
          if (lnUp[lu].tagY > limU) lnUp[lu].tagY = limU;
          limU = lnUp[lu].tagY - 17;
        }
        var limD = liveTag + 17;
        for (var ld = 0; ld < lnDn.length; ld++) {
          if (lnDn[ld].tagY < limD) lnDn[ld].tagY = limD;
          limD = lnDn[ld].tagY + 17;
        }
      } else {
        for (var lk1 = 1; lk1 < lnList.length; lk1++) {
          if (lnList[lk1].tagY - lnList[lk1 - 1].tagY < 17) lnList[lk1].tagY = lnList[lk1 - 1].tagY + 17;
        }
      }
      for (var lk2 = 0; lk2 < lnList.length; lk2++) {
        lnList[lk2].tagY = Math.max(padT + 8, Math.min(padT + plotH - 8, lnList[lk2].tagY));
      }
      for (var lk = 0; lk < lnList.length; lk++) {
        var ln = lnList[lk].ln;
        var lnIn = lnList[lk].lnIn;
        var lny = lnList[lk].lny;
        var tagY = lnList[lk].tagY;
        var lnCol = ln.color === 'up' ? col.up : ln.color === 'down' ? col.down
          : ln.color === 'gold' ? col.entry : (ln.color || col.text);
        ctx.strokeStyle = lnCol;
        ctx.globalAlpha = ln.dim ? 0.45 : 0.85;
        ctx.setLineDash(ln.solid ? [] : [5, 4]);
        ctx.beginPath();
        ctx.moveTo(0, lny); ctx.lineTo(plotW, lny);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        var lnTxt = (lnIn ? '' : (ln.price >= hi ? '\u25B2 ' : '\u25BC ')) + (ln.label ? ln.label + ' ' : '') + fmt(ln.price, dec);
        var lnW = Math.ceil(ctx.measureText(lnTxt).width) + 10;
        var lnX = Math.min(plotW + 2, w - lnW - 2);
        roundRect(ctx, lnX, tagY - 8, lnW, 16, 4);
        ctx.fillStyle = lnCol;
        ctx.fill();
        ctx.fillStyle = ln.color === 'gold' ? '#221703' : '#fff';
        ctx.fillText(lnTxt, lnX + 5, tagY);
      }
    }

    /* Уведомления по цене (opts.alerts): золотой пунктир и золотая плашка
       цены справа. Слева поверх canvas лежит DOM-метка с колокольчиком
       (js/v3-alerts.js) — за неё уровень тянут и открывают правку.
       Уровень вне окна прижимается к краю, как лимитки. */
    if (opts.alerts && opts.alerts.length) {
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      for (var ai = 0; ai < opts.alerts.length; ai++) {
        var al = opts.alerts[ai];
        if (!al || !(al.price > 0)) continue;
        var aIn = al.price > lo && al.price < hi;
        var ay = aIn ? y(al.price) : (al.price >= hi ? padT + 8 : padT + plotH - 8);
        ctx.save();
        ctx.strokeStyle = col.entry;
        ctx.lineWidth = al.hot ? 1.6 : 1.1;
        ctx.globalAlpha = al.off ? 0.35 : (al.hot ? 1 : 0.8);
        if (al.hot) { ctx.shadowBlur = 10; ctx.shadowColor = rgba(col.entry, 0.7); }
        ctx.setLineDash(al.hot ? [] : [6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, ay); ctx.lineTo(plotW, ay);
        ctx.stroke();
        ctx.restore();
        var aTxt = (aIn ? '' : (al.price >= hi ? '\u25B2 ' : '\u25BC ')) + fmt(al.price, dec);
        var aW = Math.ceil(ctx.measureText(aTxt).width) + 10;
        var aX = Math.min(plotW + 2, w - aW - 2);
        ctx.globalAlpha = al.off ? 0.5 : 1;
        roundRect(ctx, aX, ay - 8, aW, 16, 4);
        ctx.fillStyle = col.entry;
        ctx.fill();
        ctx.fillStyle = '#221703';
        ctx.fillText(aTxt, aX + 5, ay);
        ctx.globalAlpha = 1;
      }
    }

    /* Перекрестие: вертикаль по свече + горизонталь по курсору, цена на оси. */
    if (opts.crosshair && opts.crosshair.index >= 0 && opts.crosshair.index < data.length) {
      var cdx = opts.crosshair.index * cw + cw / 2;
      var candle = data[opts.crosshair.index];
      var my = opts.crosshair.y != null
        ? Math.min(Math.max(opts.crosshair.y, padT), padT + plotH)
        : y(candle.c);

      ctx.strokeStyle = col.text;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cdx, padT); ctx.lineTo(cdx, padT + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, my); ctx.lineTo(plotW, my);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      /* Цена ровно под курсором (обратная интерполяция по оси Y). */
      var cval = hi - (my - padT) / plotH * (hi - lo);
      var clabel = fmt(cval, dec);
      ctx.textAlign = 'left';
      var cw2 = ctx.measureText(clabel).width;
      ctx.fillStyle = col.bubble;
      roundRect(ctx, plotW + 2, my - 8, cw2 + 10, 16, 4);
      ctx.fill();
      ctx.fillStyle = col.bubbleText;
      ctx.fillText(clabel, plotW + 7, my);
    }

    /* Метка последней цены. */
    var lp = live != null ? live : lastC;
    if (lp != null) {
      var ly = Math.min(Math.max(y(lp), padT + 8), padT + plotH - 8);
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = col.line;
      ctx.beginPath();
      ctx.moveTo(0, ly); ctx.lineTo(plotW, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      var label = fmt(lp, dec);
      ctx.fillStyle = lp >= data[0].o ? col.up : col.down;
      var tw = ctx.measureText(label).width;
      var lw = Math.max(tw + 10, boxW);
      /* Прижимаем пузырь к правому краю, чтобы длинная цена типа
         «82,927.10» не уезжала за canvas на узких экранах. */
      var px = Math.min(plotW + 2, w - lw - 2);
      roundRect(ctx, px, ly - 8, lw, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 5, ly);
    }

    /* Ось времени — последней, чтобы ничего её не перекрывало. */
    drawTimeAxis(ctx, data, plotW, plotH, padT, col);
  }

  /* Подписи времени под графиком. Крайние метки прижимаем к краям, чтобы не
     вылезали за canvas; если соседняя наезжает — метку просто пропускаем. */
  function drawTimeAxis(ctx, data, plotW, plotH, padT, col) {
    if (data.length < 2 || !data[0].t) return;
    var withSec = (data[1].t - data[0].t) < 60000;

    ctx.font = '9px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = col.text;

    var cw = plotW / data.length;
    var count = Math.max(2, Math.min(6, Math.floor(plotW / 62)));
    var ty = padT + plotH + 6;
    var lastRight = -Infinity;

    for (var i = 0; i < count; i++) {
      var idx = Math.round(i * (data.length - 1) / (count - 1));
      var label = fmtTime(data[idx].t, withSec);
      var tw = ctx.measureText(label).width;
      var lx = (idx * cw + cw / 2) - tw / 2;
      if (lx < 2) lx = 2;
      if (lx + tw > plotW - 2) lx = plotW - 2 - tw;
      if (lx < lastRight + 6) continue;
      lastRight = lx + tw;
      ctx.fillText(label, lx, ty);
    }
  }

  function fmt(v, dec) {
    /* Тот же разделитель разрядов (узкий пробел), что у money() в UI —
       раньше крупная цена была «77,605.1», а рядом «77 605.1». */
    var s = v.toFixed(dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    return parts.join('.');
  }

  /* Индекс свечи под курсором (clientX), либо -1. */
  function hitTest(canvas, clientX) {
    if (!geo) return -1;
    var rect = canvas.getBoundingClientRect();
    var x = clientX - rect.left;
    if (x < 0 || x > geo.plotW) return -1;
    var idx = Math.floor(x / geo.cw);
    return Math.min(Math.max(idx, 0), geo.n - 1);
  }

  /* Ширина свечи в пикселях (для перевода перетаскивания в бары). */
  function cwPx() { return geo ? geo.cw : 10; }

  /* ---------- Масштаб графика (кнопки −/+, ось цен, «Авто») ----------
     host: { view: {yk, ysh}, getBars(), setBars(n), redraw(), gestures,
     label: {auto, zin, zout} }. view.yk/ysh читает draw через opts.yZoom.
     Слой ложится поверх canvas: полоса оси цен справа (тянуть вверх-вниз —
     растянуть/сжать шкалу, двойной тап — авто), кнопки масштаба слева
     снизу. С gestures (график фьючерсов, где своих жестов нет) — ещё
     колесо и щипок двумя пальцами. */
  var ZMIN = 0.12, ZMAX = 14;
  function zoomUI(canvas, host) {
    var card = canvas.parentNode;
    card.classList.add('cz-host');
    function lab(k, d) { var l = host.label && host.label[k]; return typeof l === 'function' ? l() : (l || d); }
    var lay = document.createElement('div');
    lay.className = 'cz-layer';
    lay.innerHTML = '<div class="cz-axis" aria-hidden="true"><i></i></div>' +
      '<div class="cz-btns"><button type="button" class="cz-b" data-cz="out" aria-label="' + lab('zout', '-') + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12"/></svg></button>' +
      '<button type="button" class="cz-b" data-cz="in" aria-label="' + lab('zin', '+') + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12M12 6v12"/></svg></button>' +
      '<button type="button" class="cz-auto hidden" data-cz="auto"></button></div>';
    card.appendChild(lay);
    var axis = lay.querySelector('.cz-axis'), autoB = lay.querySelector('.cz-auto');
    var v = host.view;
    if (v.yk == null) v.yk = 1;
    if (v.ysh == null) v.ysh = 0;
    function manual() { return Math.abs(v.yk - 1) > 1e-3 || Math.abs(v.ysh) > 1e-3; }
    function sync() {
      lay.style.left = canvas.offsetLeft + 'px';
      lay.style.top = canvas.offsetTop + 'px';
      lay.style.width = canvas.offsetWidth + 'px';
      lay.style.height = canvas.offsetHeight + 'px';
      var on = manual();
      autoB.textContent = lab('auto', 'Auto');
      autoB.classList.toggle('hidden', !on);
      card.classList.toggle('cz-man', on);
      canvas.classList.toggle('cz-man', on);
    }
    function zoomY(f) {
      v.yk = Math.max(ZMIN, Math.min(ZMAX, v.yk * f));
      if (Math.abs(v.yk - 1) < 0.02 && Math.abs(v.ysh) < 0.01) { v.yk = 1; v.ysh = 0; }
    }
    function panY(dyPx) {
      var g = geoOf(canvas);
      if (!g) return;
      v.ysh += dyPx / g.plotH * v.yk;
      v.ysh = Math.max(-40, Math.min(40, v.ysh));
    }
    function reset() { v.yk = 1; v.ysh = 0; }
    function done() { sync(); host.redraw(); }
    function zoom(f) {
      if (host.getBars && host.setBars) host.setBars(Math.round(host.getBars() * f));
      zoomY(f);
      done();
    }
    lay.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cz]');
      if (!b) return;
      e.stopPropagation();
      var k = b.getAttribute('data-cz');
      if (k === 'in') zoom(1 / 1.35);
      else if (k === 'out') zoom(1.35);
      else { reset(); done(); }
    });
    /* Ось цен: вертикальный жест растягивает шкалу вокруг центра. */
    var ax = null, lastTap = 0;
    axis.addEventListener('pointerdown', function (e) {
      ax = { y: e.clientY, k: v.yk, id: e.pointerId, moved: 0 };
      axis.classList.add('on');
      try { axis.setPointerCapture(e.pointerId); } catch (er) { /* старые WebView */ }
      e.preventDefault();
    });
    axis.addEventListener('pointermove', function (e) {
      if (!ax || e.pointerId !== ax.id) return;
      var dy = e.clientY - ax.y;
      ax.moved = Math.max(ax.moved, Math.abs(dy));
      v.yk = Math.max(ZMIN, Math.min(ZMAX, ax.k * Math.exp(dy / 140)));
      done();
    });
    function axEnd(e) {
      if (!ax || (e && e.pointerId !== ax.id)) return;
      var tap = ax.moved < 5;
      ax = null;
      axis.classList.remove('on');
      if (tap) {
        var n = Date.now();
        if (n - lastTap < 350) { reset(); done(); }
        lastTap = n;
      } else if (Math.abs(v.yk - 1) < 0.04 && Math.abs(v.ysh) < 0.01) { reset(); done(); }
    }
    axis.addEventListener('pointerup', axEnd);
    axis.addEventListener('pointercancel', axEnd);
    if (host.gestures) {
      canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15);
      }, { passive: false });
      var pts = new Map(), pd = null, pan = null;
      canvas.addEventListener('pointerdown', function (e) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 2) { var a = []; pts.forEach(function (q) { a.push(q); }); pd = { x: Math.abs(a[0].x - a[1].x), y: Math.abs(a[0].y - a[1].y) }; pan = null; }
        else if (pts.size === 1 && manual()) pan = { y: e.clientY };
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 2 && pd) {
          var a = []; pts.forEach(function (q) { a.push(q); });
          var nx = Math.abs(a[0].x - a[1].x), ny = Math.abs(a[0].y - a[1].y);
          if (host.setBars && pd.x > 24 && nx > 24) host.setBars(Math.round(host.getBars() * pd.x / nx));
          if (pd.y > 24 && ny > 24) zoomY(pd.y / ny);
          pd = { x: nx, y: ny };
          done();
        } else if (pan) {
          panY(e.clientY - pan.y);
          pan.y = e.clientY;
          done();
        }
      });
      var up = function (e) { pts.delete(e.pointerId); if (pts.size < 2) pd = null; if (!pts.size) pan = null; };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
    }
    if (window.ResizeObserver) { try { new ResizeObserver(sync).observe(canvas); } catch (e) { /* нет RO */ } }
    window.addEventListener('resize', sync);
    sync();
    return { sync: sync, zoomY: zoomY, panY: panY, reset: reset, zoom: zoom, manual: manual, layer: lay,
      /* Раздвинуть шкалу так, чтобы цена p попала в окно (с полем 12%). */
      fit: function (p) {
        var g = geoOf(canvas);
        if (!g || !(p > 0)) return;
        var aSpan = g.autoHi - g.autoLo;
        if (!(aSpan > 0)) return;
        var lo = g.lo, hi = g.hi, m = (hi - lo) * 0.12;
        if (p > lo + m && p < hi - m) return;
        var nlo = Math.min(lo, p - m), nhi = Math.max(hi, p + m);
        v.yk = Math.min(ZMAX, (nhi - nlo) / aSpan);
        v.ysh = ((nhi + nlo) / 2 - (g.autoHi + g.autoLo) / 2) / aSpan;
        done();
      }
    };
  }

  /* Перевод экран ↔ цена по последней отрисовке конкретного canvas. */
  function geoOf(canvas) { return (canvas && canvas.__geo) || null; }
  function yToPrice(canvas, clientY) {
    var g = geoOf(canvas);
    if (!g) return 0;
    var yy = clientY - canvas.getBoundingClientRect().top;
    return g.hi - (yy - g.padT) / g.plotH * (g.hi - g.lo);
  }
  function priceToY(canvas, price) {
    var g = geoOf(canvas);
    return g ? g.padT + (g.hi - price) / (g.hi - g.lo) * g.plotH : 0;
  }

  return { draw: draw, hitTest: hitTest, cwPx: cwPx, geoOf: geoOf, yToPrice: yToPrice, priceToY: priceToY, fmt: fmt, zoomUI: zoomUI };
})();
