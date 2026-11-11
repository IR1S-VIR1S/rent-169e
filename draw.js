/* 169-E Rent: the four shareable phone-screen images, one design. 1080 x 1920. */
'use strict';
var LOGO = new Image(); LOGO.src = 'logo-160.png';
var DRAW = { W: 1080, H: 1920, X: 56, F: '-apple-system, "Helvetica Neue", Arial, sans-serif',
  AR: '"Geeza Pro", "Noto Naskh Arabic", "Noto Sans Arabic", "Arial", sans-serif',
  navy: '#0b2a5b', gold: '#b07d1e', ink: '#111827', grey: '#4B5563', line: '#D1D5DB',
  blueBg: '#EFF6FF', blueLine: '#93C5FD', blueInk: '#1E3A8A', rust: '#9A3412', rustBg: '#FFEDD5', green: '#1D6B3A', red: '#B3261E' };

function canvas_() {
  var c = document.createElement('canvas'); c.width = DRAW.W; c.height = DRAW.H;
  var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, DRAW.W, DRAW.H);
  return { c: c, g: g };
}
function txt_(g, s, x, y, size, weight, color, align, font) {
  g.font = (weight || 400) + ' ' + size + 'px ' + (font || DRAW.F); g.fillStyle = color || DRAW.ink;
  g.textAlign = align || 'left'; g.direction = 'ltr'; g.fillText(s, x, y);
}
function ar_(g, s, x, y, size, color, align) {
  g.font = '600 ' + size + 'px ' + DRAW.AR; g.fillStyle = color || DRAW.ink; g.direction = 'rtl';
  g.textAlign = align || 'right'; g.fillText(s, x, y); g.direction = 'ltr';
}
function box_(g, x, y, w, h, fill, stroke, r) {
  g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r === undefined ? 22 : r); else g.rect(x, y, w, h);
  if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = 3; g.strokeStyle = stroke; g.stroke(); }
}
function fit_(g, s, maxW, size, weight) {
  g.font = (weight || 400) + ' ' + size + 'px ' + DRAW.F;
  if (g.measureText(s).width <= maxW) return s;
  while (s.length > 1 && g.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}
// Header: kicker, title, sub line, logo top right. Returns the next y.
function header_(g, kicker, title, sub) {
  var x = DRAW.X, W = DRAW.W;
  if (LOGO.complete && LOGO.naturalWidth) {
    g.save(); g.beginPath(); if (g.roundRect) g.roundRect(W - x - 150, 56, 150, 150, 30); else g.rect(W - x - 150, 56, 150, 150);
    g.clip(); g.drawImage(LOGO, W - x - 150, 56, 150, 150); g.restore();
  }
  txt_(g, kicker.toUpperCase(), x, 110, 30, 700, DRAW.grey);
  txt_(g, fit_(g, title, W - 2 * x - 180, 70, 800), x, 200, 70, 800);
  txt_(g, sub, x, 256, 32, 400, DRAW.grey);
  return 300;
}
function row_(g, y, label, sub, val, fill, stroke, col) {
  var x = DRAW.X, w = DRAW.W - 2 * x;
  box_(g, x, y, w, 128, fill, stroke);
  txt_(g, label, x + 34, y + 56, 38, 700, col); txt_(g, sub, x + 34, y + 100, 27, 400, col);
  txt_(g, val, x + w - 34, y + 84, 58, 800, col, 'right');
  return y + 144;
}
function monthGrid_(g, y, L, D, small, x0, w0) {
  var x = x0 || DRAW.X, w = w0 || DRAW.W - 2 * DRAW.X, cw = (w - 5 * 12) / 6, ch = small ? 96 : 98, yr = L.year;
  for (var m = 1; m <= 12; m++) {
    var k = yr + '-' + pad2_(m), mo = L.months.filter(function (q) { return q.month === k; })[0];
    var paidIn = D.payments.filter(function (p) { return p.date.slice(0, 7) === k; }).reduce(function (s, p) { return s + (+p.amount); }, 0);
    var cx = x + ((m - 1) % 6) * (cw + 12), cy = y + Math.floor((m - 1) / 6) * (ch + 14);
    var none = !mo && !paidIn;
    var fill = none ? '#F1F3F5' : paidIn ? DRAW.blueBg : DRAW.rustBg, col = none ? '#6B7280' : paidIn ? DRAW.blueInk : DRAW.rust;
    box_(g, cx, cy, cw, ch, fill);
    txt_(g, CFG.MONTHS[m - 1].slice(0, 3), cx + cw / 2, cy + (small ? 36 : 40), small ? 25 : 28, 700, col, 'center');
    txt_(g, none ? '' : paidIn ? groupNum_(paidIn) : 'Nil', cx + cw / 2, cy + (small ? 70 : 78), small ? 24 : 27, 800, col, 'center');
  }
  return y + 2 * (ch + 14) + 10;
}
function footer_(g, line) {
  if (line) txt_(g, line, DRAW.X, DRAW.H - 140, 30, 600, DRAW.ink);
  ar_(g, CFG.JAZAK, DRAW.W - DRAW.X, DRAW.H - 70, 44, DRAW.navy, 'right');
  txt_(g, '169-E Rent', DRAW.X, DRAW.H - 72, 26, 600, DRAW.grey);
}
function rentLine_(D, today) {
  var r = rateFor_(D.rates, today.slice(0, 7));
  return r ? 'Rent ' + fmtRs_(r.rent) + ' a month, due by the ' + ordinal_(r.due_day) + '.' : '';
}

function drawStatement(v, withArrears) {
  var L = v.L, D = v.D, Y = L.cur, yr = L.year, o = canvas_(), g = o.g;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', yr + ' Rent Statement', 'As of ' + fmtDate_(v.today) + ' · amounts in Rs');
  y = row_(g, y, 'Rent due', Y.months + ' months', groupNum_(Y.rent), null, DRAW.line, DRAW.ink);
  if (Y.maint) y = row_(g, y, 'Maintenance counted', 'spent by tenant', groupNum_(Y.maint), '#F0FDF4', '#86EFAC', DRAW.green);
  y = row_(g, y, 'Received', 'in ' + yr, groupNum_(Y.paid), DRAW.blueBg, DRAW.blueLine, DRAW.blueInk);
  y = row_(g, y, L.yearBalance > 0 ? 'Balance ' + yr : 'All clear', L.yearBalance > 0 ? 'still unpaid' : 'thank you',
    groupNum_(Math.max(L.yearBalance, 0)), L.yearBalance > 0 ? DRAW.rust : DRAW.green, null, '#FFFFFF');
  y += 30; txt_(g, 'Received month by month', DRAW.X, y, 40, 800); y += 24;
  y = monthGrid_(g, y, L, D, false) + 10;
  var r = rateFor_(D.rates, v.today.slice(0, 7));
  y = row_(g, y, 'Average paid per month', 'against ' + groupNum_(r ? r.rent : 0) + ' due', groupNum_(L.avgPaid), null, DRAW.line, DRAW.ink);
  if (withArrears) {
    y = row_(g, y, 'Arrears up to Dec ' + (yr - 1), 'separate from ' + yr, groupNum_(L.arrearsBefore), '#FFFBEB', '#B45309', DRAW.ink);
    y = row_(g, y, 'Total outstanding', 'all years', groupNum_(L.total), DRAW.ink, null, '#FFFFFF');
  }
  footer_(g, rentLine_(D, v.today));
  return o.c;
}

// A payment receipt with the year's statement stapled underneath.
function drawReceipt(v, pay) {
  var L = v.L, D = v.D, Y = L.cur, yr = L.year, o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', 'Payment Receipt',
    (pay.pay_id ? 'Receipt ' + pay.pay_id : 'Receipt (being saved)') + ' · ' + fmtDate_(pay.date));
  box_(g, x, y, w, 520, DRAW.navy, null, 28);
  txt_(g, 'Received with thanks', x + 40, y + 70, 34, 600, '#E5E7EB');
  txt_(g, fmtRs_(pay.amount), x + 40, y + 180, 104, 800, '#FFFFFF');
  if (pay.eur) txt_(g, '€' + pay.eur + ' sent', x + 40, y + 236, 32, 600, '#E0B65A');
  var lines = [['Date', fmtDate_(pay.date)], ['Received into', pay.into || ''], ['Paid by', byLabel_(D, pay.by) || '']];
  lines.forEach(function (l, i) {
    var ly = y + 310 + i * 66;
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 40, ly - 46, w - 80, 2);
    txt_(g, l[0], x + 40, ly, 30, 400, '#CBD5E1'); txt_(g, fit_(g, l[1], w - 420, 32, 700), x + w - 40, ly, 32, 700, '#FFFFFF', 'right');
  });
  y += 560;
  // the stapled statement
  var sy = y + 30, sh = 134 + 58 * (Y.maint ? 4 : 3) + 230 + 40;
  g.save(); g.translate(DRAW.W / 2, sy); g.rotate(-0.012); g.translate(-DRAW.W / 2, -sy);
  g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
  box_(g, x + 8, sy, w - 16, sh, '#FFFFFF', null, 18); g.shadowColor = 'transparent';
  g.strokeStyle = DRAW.line; g.lineWidth = 2; g.stroke();
  // staples
  [x + 70, x + w - 150].forEach(function (sx) { box_(g, sx, sy - 14, 80, 12, '#9CA3AF', null, 6); });
  var iy = sy + 70;
  txt_(g, yr + ' statement', x + 40, iy, 44, 800); txt_(g, 'as of ' + fmtDate_(v.today), x + w - 40, iy, 28, 400, DRAW.grey, 'right'); iy += 64;
  [['Rent due', groupNum_(Y.rent), DRAW.ink], ['Received', groupNum_(Y.paid), DRAW.blueInk],
   [L.yearBalance > 0 ? 'Balance' : 'All clear', groupNum_(Math.max(L.yearBalance, 0)), L.yearBalance > 0 ? DRAW.rust : DRAW.green]]
    .forEach(function (r) { txt_(g, r[0], x + 40, iy, 32, 600, DRAW.grey); txt_(g, r[1], x + w - 40, iy, 40, 800, r[2], 'right'); iy += 58; });
  if (Y.maint) { txt_(g, 'Maintenance counted', x + 40, iy, 32, 600, DRAW.grey); txt_(g, groupNum_(Y.maint), x + w - 40, iy, 40, 800, DRAW.green, 'right'); iy += 58; }
  monthGrid_(g, iy + 4, L, D, true, x + 36, w - 72);
  g.restore();
  footer_(g, rentLine_(D, v.today));
  return o.c;
}

function drawReminder(v) {
  var L = v.L, D = v.D, R = reminderInfo_(D, L, v.today), o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  if (!R) return o.c;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', 'Rent Reminder', fmtDate_(v.today));
  ar_(g, CFG.SALAM, DRAW.W - x, y + 40, 46, DRAW.navy, 'right');
  txt_(g, salut_(D) + ',', x, y + 120, 40, 700);
  y += 160;
  box_(g, x, y, w, 470, DRAW.navy, null, 28);
  txt_(g, monthName_(R.month) + ' rent', x + 40, y + 74, 38, 600, '#E5E7EB');
  txt_(g, fmtRs_(R.rent), x + 40, y + 190, 110, 800, '#FFFFFF');
  var rate = Number(T.S && T.S.settings.eurRate) || 0;
  if (rate) txt_(g, '≈ €' + groupNum_(R.rent / rate), x + 40, y + 250, 36, 600, '#E0B65A');
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 40, y + 300, w - 80, 2);
  txt_(g, 'Due by', x + 40, y + 380, 34, 400, '#CBD5E1');
  txt_(g, (+R.due.slice(8)) + ' ' + CFG.MONTHS[+R.month.slice(5) - 1] + ' ' + R.month.slice(0, 4), x + w - 40, y + 386, 50, 800, '#FFFFFF', 'right');
  y += 510;
  if (R.balanceBefore > 0) y = row_(g, y, 'Balance for ' + L.year, 'before this month', groupNum_(R.balanceBefore), DRAW.rustBg, '#FDBA74', DRAW.rust);
  y += 20; txt_(g, 'Received in ' + L.year, x, y, 38, 800); y += 24;
  monthGrid_(g, y, L, D, false);
  footer_(g, 'Kindly send by the ' + ordinal_(+R.due.slice(8)) + '. Thank you.');
  return o.c;
}

function kindLabel_(k) {
  if (k === 'visit') return 'Visit to EME';
  var f = CFG.LOG_KINDS.filter(function (x) { return x.k === k; })[0];
  return f ? f.label : k;
}

function drawLogSummary(v, from, to, title) {
  var D = v.D, S = logSummary_(D, from, to), o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', 'Contact Log', title + ': ' + fmtDate_(from) + ' to ' + fmtDate_(to));
  var tiles = [['Calls made', S.count.call], ['Messages', S.count.message], ['Asked to call back', S.count.callback_req],
    ['He called back', S.count.called_back], ['Visits to EME', S.visits], ['Red flags', S.flags]];
  var tw = (w - 2 * 14) / 3;
  tiles.forEach(function (t, i) {
    var tx = x + (i % 3) * (tw + 14), ty = y + Math.floor(i / 3) * 150, flag = i === 5 && t[1] > 0;
    box_(g, tx, ty, tw, 136, flag ? DRAW.red : '#F8FAFC', flag ? null : DRAW.line);
    txt_(g, String(t[1] || 0), tx + 26, ty + 70, 56, 800, flag ? '#FFFFFF' : DRAW.navy);
    txt_(g, t[0], tx + 26, ty + 112, 26, 600, flag ? '#FFFFFF' : DRAW.grey);
  });
  y += 330;
  if (S.visits) { txt_(g, 'Time spent waiting at EME: ' + fmtMins_(S.totalWait), x, y, 32, 700, DRAW.ink); y += 50; }
  txt_(g, 'Latest', x, y + 20, 38, 800); y += 50;
  var max = Math.floor((DRAW.H - 220 - y) / 104);
  S.items.slice(0, max).forEach(function (it) {
    var flag = it.kind === 'flag';
    box_(g, x, y, w, 92, flag ? '#FDECEA' : null, flag ? '#F5B8B3' : DRAW.line, 16);
    txt_(g, fmtDate_(it.date) + (it.time ? ' · ' + it.time : ''), x + 24, y + 38, 26, 600, DRAW.grey);
    txt_(g, flag ? 'RED FLAG: ' + it.flag : kindLabel_(it.kind), x + w - 24, y + 38, 28, 800, flag ? DRAW.red : DRAW.navy, 'right');
    txt_(g, fit_(g, it.notes || '·', w - 48, 28, 400), x + 24, y + 76, 28, 400, DRAW.ink);
    y += 104;
  });
  if (S.items.length > max) txt_(g, '+ ' + (S.items.length - max) + ' earlier entries', x, y + 24, 26, 600, DRAW.grey);
  if (!S.items.length) txt_(g, 'Nothing recorded in this period.', x, y + 30, 30, 400, DRAW.grey);
  footer_(g, '');
  return o.c;
}
