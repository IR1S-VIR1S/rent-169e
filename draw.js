/* 169-E Rent: the four shareable phone-screen images, one design. 1080 x 1920. */
'use strict';
var LOGO = new Image(); LOGO.src = 'logo-160.png';
var DRAW = { eurRate: 0, W: 1080, H: 1920, X: 56, F: '-apple-system, "Helvetica Neue", Arial, sans-serif',
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

// Shared layout for the tenant-facing pictures: header, greeting, a navy card, then rows and the month grid.
function greet_(g, y, D) {
  ar_(g, CFG.SALAM, DRAW.W - DRAW.X, y + 40, 46, DRAW.navy, 'right');
  txt_(g, salut_(D) + ',', DRAW.X, y + 116, 40, 700);
  return y + 150;
}
function cardLines_(g, x, y, w, lines) {
  lines.forEach(function (l, i) {
    var ly = y + i * 64;
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 40, ly - 44, w - 80, 2);
    txt_(g, l[0], x + 40, ly, 30, 400, '#CBD5E1'); txt_(g, fit_(g, l[1], w - 420, 34, 700), x + w - 40, ly, 34, 700, '#FFFFFF', 'right');
  });
}
function arrearsRows_(g, y, L) {
  if (!(L.arrearsBefore > 0)) return y;
  y = row_(g, y, 'Arrears up to Dec ' + (L.year - 1), 'separate from ' + L.year, groupNum_(L.arrearsBefore), '#FFFBEB', '#B45309', DRAW.ink);
  return row_(g, y, 'Total outstanding', 'all years', groupNum_(L.total), DRAW.ink, null, '#FFFFFF');
}
function gridBlock_(g, y, L, D) {
  y += 14; txt_(g, 'Received in ' + L.year, DRAW.X, y + 20, 36, 800); y += 44;
  return monthGrid_(g, y, L, D, true);
}
function eurTxt_(n) { var r = Number(DRAW.eurRate) || 0; return r > 0 ? '≈ €' + groupNum_(n / r) : ''; }
function stamp_(g, cx, cy, text, color, size, line2) {
  size = size || 76;
  g.save(); g.translate(cx, cy); g.rotate(line2 ? -0.1 : -0.26); g.globalAlpha = line2 ? 0.95 : 0.82;
  g.lineWidth = 9; g.strokeStyle = color; g.font = '900 ' + size + 'px ' + DRAW.F;
  var tw = g.measureText(text).width, s2 = Math.round(size * 1.5), tw2 = 0;
  if (line2) { g.font = '900 ' + s2 + 'px ' + DRAW.F; tw2 = g.measureText(line2).width; g.font = '900 ' + size + 'px ' + DRAW.F; }
  var bw = Math.max(tw, tw2) + 56, bh = line2 ? size + s2 + 60 : Math.round(size * 1.47);
  box_(g, -bw / 2, -bh / 2, bw, bh, null, null, 20); g.lineWidth = 9; g.strokeStyle = color; g.stroke();
  g.lineWidth = 3; box_(g, -bw / 2 + 14, -bh / 2 + 14, bw - 28, bh - 28, null, null, 12); g.strokeStyle = color; g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (line2) {
    g.fillText(text, 0, -bh / 2 + 26 + size / 2);
    g.font = '900 ' + s2 + 'px ' + DRAW.F; g.fillText(line2, 0, bh / 2 - 24 - s2 / 2 + 4);
  } else g.fillText(text, 0, 6);
  g.restore(); g.textBaseline = 'alphabetic';
}
// The OVERDUE stamp carries the number of days.
function overdueStamp_(g, x, w, y, days) { stamp_(g, x + w - 180, y + 158, 'OVERDUE', '#FF7A7A', 36, daysText_(days).toUpperCase()); }
// The big amount, made smaller only when the stamp needs the room beside it.
function amount_(g, s, x, y, maxW) {
  var size = 106; g.font = '800 ' + size + 'px ' + DRAW.F;
  while (size > 60 && g.measureText(s).width > maxW) { size -= 4; g.font = '800 ' + size + 'px ' + DRAW.F; }
  txt_(g, s, x, y, size, 800, '#FFFFFF');
}
// Contact this year, under the months received.
function contactBlock_(g, y, D, L) {
  var C = contactCounts_(D, L.year + '-01-01', L.today), x = DRAW.X, w = DRAW.W - 2 * x;
  var tiles = [['Calls made', C.calls], ['Not answered', C.unanswered], ['Messages sent', C.messages],
    ['Asked to call back', C.callbackReq], ['He called', C.calledBack], ['Visits to EME', C.visits]];
  if (!tiles.some(function (t) { return t[1] > 0; })) return y;
  y += 10; txt_(g, 'Contact in ' + L.year, x, y + 20, 36, 800); y += 44;
  var tw = (w - 5 * 12) / 6;
  tiles.forEach(function (t, i) {
    var tx = x + i * (tw + 12), bad = i === 1 && t[1] > 0;
    box_(g, tx, y, tw, 112, bad ? '#FDECEA' : '#F8FAFC', bad ? '#F5B8B3' : DRAW.line, 16);
    txt_(g, String(t[1] || 0), tx + tw / 2, y + 50, 42, 800, bad ? DRAW.red : DRAW.navy, 'center');
    var words = t[0].split(' '), l1 = words.length > 2 ? words.slice(0, 2).join(' ') : words[0], l2 = words.slice(words.length > 2 ? 2 : 1).join(' ');
    txt_(g, l1, tx + tw / 2, y + 78, 19, 600, DRAW.grey, 'center'); txt_(g, l2, tx + tw / 2, y + 100, 19, 600, DRAW.grey, 'center');
  });
  return y + 126;
}

// Payment receipt: same layout as the reminder, with a PAID stamp.
function drawReceipt(v, pay, arrears) {
  var L = v.L, D = v.D, o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', 'Payment Receipt',
    (pay.pay_id ? 'Receipt ' + pay.pay_id : 'Receipt (being saved)') + ' · ' + fmtDate_(pay.date));
  y = greet_(g, y, D);
  box_(g, x, y, w, 330 + 2 * 64 + 44, DRAW.navy, null, 28);
  txt_(g, 'Received with thanks', x + 40, y + 70, 36, 600, '#E5E7EB');
  txt_(g, fmtRs_(pay.amount), x + 40, y + 182, 106, 800, '#FFFFFF');
  if (pay.eur) txt_(g, '€' + pay.eur + ' sent', x + 40, y + 238, 34, 600, '#E0B65A');
  cardLines_(g, x, y + 330, w, [['Date', fmtDate_(pay.date)], ['Received into', pay.into || ''], ['Paid by', byLabel_(D, pay.by) || '']]);
  stamp_(g, x + w - 160, y + 96, 'PAID', '#22C55E');
  y += 330 + 2 * 64 + 44 + 30;
  y = row_(g, y, L.yearBalance > 0 ? 'Balance for ' + L.year : 'All clear for ' + L.year, L.yearBalance > 0 ? 'as of ' + fmtDate_(v.today) : 'thank you',
    groupNum_(Math.max(L.yearBalance, 0)), L.yearBalance > 0 ? DRAW.rustBg : '#F0FDF4', L.yearBalance > 0 ? '#FDBA74' : '#86EFAC', L.yearBalance > 0 ? DRAW.rust : DRAW.green);
  if (arrears) y = arrearsRows_(g, y, L);
  gridBlock_(g, y, L, D);
  footer_(g, rentLine_(D, v.today));
  return o.c;
}

// Balance update: picture that goes with the balance message.
function drawBalance(v, pay, arrears) {
  var L = v.L, D = v.D, Y = L.cur, o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', 'Balance Update', 'As of ' + fmtDate_(v.today));
  y = greet_(g, y, D);
  var clear = L.yearBalance <= 0;
  var lines = [['Rent due so far', groupNum_(Y.rent)], ['Received', groupNum_(Y.paid)]];
  if (Y.maint) lines.push(['Maintenance counted', groupNum_(Y.maint)]);
  var ch = 330 + (lines.length - 1) * 64 + 44;
  box_(g, x, y, w, ch, clear ? DRAW.green : DRAW.navy, null, 28);
  txt_(g, clear ? 'Rent for ' + L.year + ' is clear' : 'Remaining for ' + L.year, x + 40, y + 70, 36, 600, '#E5E7EB');
  var R = clear ? null : reminderInfo_(D, L, v.today), odb = !!R && R.status === 'overdue';
  amount_(g, fmtRs_(Math.max(L.yearBalance, 0)), x + 40, y + 182, odb ? w - 80 - 320 : w - 80);
  if (!clear) txt_(g, eurTxt_(L.yearBalance), x + 40, y + 238, 34, 600, '#E0B65A');
  cardLines_(g, x, y + 330, w, lines);
  if (odb) overdueStamp_(g, x, w, y, R.days);
  y += ch + 30;
  if (pay) y = row_(g, y, 'Thank you for ' + fmtRs_(pay.amount), 'received ' + fmtDate_(pay.date), '', '#F0FDF4', '#86EFAC', DRAW.green);
  if (arrears) y = arrearsRows_(g, y, L);
  y = gridBlock_(g, y, L, D);
  contactBlock_(g, y, D, L);
  footer_(g, rentLine_(D, v.today));
  return o.c;
}

function drawReminder(v, arrears) {
  var L = v.L, D = v.D, R = reminderInfo_(D, L, v.today), o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  if (!R) return o.c;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', R.status === 'overdue' ? 'Rent Overdue' : 'Rent Reminder', fmtDate_(v.today));
  y = greet_(g, y, D);
  var od = R.status === 'overdue', bh = od ? 290 : 330 + 44;
  box_(g, x, y, w, bh, DRAW.navy, null, 28);
  txt_(g, monthName_(R.month) + ' rent', x + 40, y + 70, 36, 600, '#E5E7EB');
  amount_(g, fmtRs_(R.rent), x + 40, y + 182, od ? w - 80 - 320 : w - 80);
  txt_(g, eurTxt_(R.rent), x + 40, y + 238, 34, 600, '#E0B65A');
  if (od) overdueStamp_(g, x, w, y, R.days);
  else { cardLines_(g, x, y + 330, w, [['Due by', dueText_(R) + ' ' + R.due.slice(0, 4) + (R.days === 0 ? ' (today)' : '')]]); stamp_(g, x + w - 150, y + 96, 'DUE', '#F59E0B'); }
  y += bh + 30;
  if (R.balanceBefore > 0) y = row_(g, y, 'Balance for ' + L.year, 'before this month', groupNum_(R.balanceBefore), DRAW.rustBg, '#FDBA74', DRAW.rust);
  if (arrears) y = arrearsRows_(g, y, L);
  gridBlock_(g, y, L, D);
  footer_(g, reminderLine_(R));
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
  var C = contactCounts_(D, from, to);
  var tiles = [['Calls made', C.calls], ['Not answered', C.unanswered], ['Messages sent', C.messages], ['His replies', C.hisMessages],
    ['Asked to call back', C.callbackReq], ['He called', C.calledBack], ['Visits to EME', S.visits], ['Red flags', S.flags]];
  var tw = (w - 3 * 14) / 4;
  tiles.forEach(function (t, i) {
    var tx = x + (i % 4) * (tw + 14), ty = y + Math.floor(i / 4) * 150, flag = i === 7 && t[1] > 0;
    box_(g, tx, ty, tw, 136, flag ? DRAW.red : '#F8FAFC', flag ? null : DRAW.line);
    txt_(g, String(t[1] || 0), tx + 22, ty + 70, 56, 800, flag ? '#FFFFFF' : DRAW.navy);
    txt_(g, fit_(g, t[0], tw - 34, 24, 600), tx + 22, ty + 112, 24, 600, flag ? '#FFFFFF' : DRAW.grey);
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
