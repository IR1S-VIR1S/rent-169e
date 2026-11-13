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
  var line = salamLine_(D), size = 46;
  g.font = '600 ' + size + 'px ' + DRAW.AR;
  while (size > 30 && g.measureText(line).width > DRAW.W - 2 * DRAW.X) { size -= 2; g.font = '600 ' + size + 'px ' + DRAW.AR; }
  ar_(g, line, DRAW.W - DRAW.X, y + 40, size, DRAW.navy, 'right');
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
// Contact since the last payment (the whole year when nothing was paid yet), under the months received:
// the Contact Log picture without its Latest list, drawn smaller. Parts that do not fit above the footer are left out.
function contactBlock_(g, y, v) {
  var D = v.D, L = v.L, to = v.today, x = DRAW.X, w = DRAW.W - 2 * x, end = DRAW.H - 124;
  var payDay = (D.payments || []).reduce(function (m, p) { return p.date > m && p.date <= to ? p.date : m; }, '');
  var payAmt = (D.payments || []).reduce(function (t, p) { return p.date === payDay ? t + (Number(p.amount) || 0) : t; }, 0);
  var from = payDay || L.year + '-01-01', R = contactStory_(D, from, to), PAYC = '#2563EB';
  if (!R.daysMe && !R.daysHe) return y;
  if (y + 44 + 170 > end) return y;
  var head = payDay ? 'Contact since last payment of ' + fmtRs_(payAmt) + ' (' + fmtDate_(payDay) + (payDay === to ? ', today)' : ', ' + daysText_(dayNum_(to) - dayNum_(payDay)) + ' ago)') : 'Contact in ' + L.year, hs = 32;
  g.font = '800 ' + hs + 'px ' + DRAW.F;
  while (hs > 24 && g.measureText(head).width > w) { hs -= 1; g.font = '800 ' + hs + 'px ' + DRAW.F; }
  y += 10; txt_(g, fit_(g, head, w, hs, 800), x, y + 22, hs, 800); y += 40;
  // who reached out
  var mine = R.mine + R.calls, his = R.his + R.heCalls, top = Math.max(mine, his, 1), bw = w - 40;
  box_(g, x, y, w, 158, '#F8FAFC', DRAW.line, 20);
  [['You', mine, plural2_(R.mine, 'message') + ' · ' + plural2_(R.calls, 'call'), DRAW.navy],
    ['He', his, plural2_(R.his, 'message') + ' · ' + plural2_(R.heCalls, 'call'), DRAW.gold]].forEach(function (r, i) {
    var by = y + 14 + i * 70;
    txt_(g, r[0] + ': ' + r[1], x + 20, by + 24, 26, 800, DRAW.ink);
    txt_(g, r[2], x + w - 20, by + 24, 22, 600, DRAW.grey, 'right');
    box_(g, x + 20, by + 34, bw, 22, '#E5E7EB', null, 11);
    if (r[1] > 0) box_(g, x + 20, by + 34, Math.max(22, bw * r[1] / top), 22, r[3], null, 11);
  });
  y += 170;
  // the numbers
  if (y + 118 > end) return y;
  var tiles = [['Calls made', String(R.calls), 'in ' + plural2_(R.tries, 'try').replace('trys', 'tries')],
    ['Tries answered', R.ans + ' of ' + R.tries, 'talked ' + talk_(R.sec), R.tries > 0 && R.ans < R.tries],
    ['Days no response', R.daysNone + ' of ' + R.daysMe, 'days I reached out', R.daysNone > 0],
    ['Last heard', R.lastHeard ? fmtDate_(R.lastHeard).replace(/ \d{4}$/, '') : 'Never', R.lastHeard ? (to === R.lastHeard ? 'today' : daysText_(dayNum_(to) - dayNum_(R.lastHeard)) + ' ago') : 'in this period']];
  var tw = (w - 3 * 12) / 4;
  tiles.forEach(function (t, i) {
    var tx = x + i * (tw + 12), bad = !!t[3];
    box_(g, tx, y, tw, 118, bad ? '#FDECEA' : '#F8FAFC', bad ? '#F5B8B3' : DRAW.line, 16);
    txt_(g, t[1], tx + 16, y + 44, 34, 800, bad ? DRAW.red : DRAW.navy);
    txt_(g, fit_(g, t[0], tw - 26, 20, 700), tx + 16, y + 74, 20, 700, DRAW.ink);
    txt_(g, fit_(g, t[2], tw - 26, 18, 500), tx + 16, y + 100, 18, 500, DRAW.grey);
  });
  y += 130;
  // day by day: up to 62 squares a row
  var n = dayNum_(to) - dayNum_(from) + 1, rows = Math.ceil(n / 62), per = Math.ceil(n / rows), ch = rows === 1 ? 36 : 20, gap = rows === 1 ? 4 : 3, cw = (w - (per - 1) * gap) / per;
  if (y + rows * (ch + gap) + 34 + 34 > end) return y;
  var tags = [];
  for (var i = 0; i < n; i++) {
    var k = addDaysYmd_(from, i), q = R.days[k], bx = x + (i % per) * (cw + gap);
    box_(g, bx, y + Math.floor(i / per) * (ch + gap), cw, ch, k === payDay ? PAYC : !q || (!q.me && !q.he) ? '#EEF0F3' : q.he ? DRAW.green : DRAW.red, null, rows === 1 ? 7 : 4);
    if (k === payDay) tags[0] = { cx: bx + cw / 2, ymd: k, color: PAYC };
    if (k === to) tags[1] = { cx: bx + cw / 2, ymd: k, color: DRAW.navy };
  }
  y = dateTags_(g, y + rows * (ch + gap) - gap, tags) + 2;
  return dayLegend_(g, x, y, 19, !!payDay);
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
  contactBlock_(g, y, v);
  footer_(g, '');
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

// What really happened day by day: entries made by hand and the imported chat can describe the same call, so each day takes the larger.
function chatSide_(notes, who) {
  var x = new RegExp(who + ' tried (?:once|\\d+ times): ([^.]*)').exec(String(notes || '')), r = { calls: 0, tries: 0, ans: 0, sec: 0 };
  if (!x) return r;
  x[1].split(';').forEach(function (p) {
    var n = /(\d+) calls?/.exec(p), t = /\((\d+) (sec|min)\)/.exec(p);
    r.tries++; r.calls += n ? +n[1] : 1;
    if (!/not answered/.test(p)) r.ans++;
    if (t) r.sec += +t[1] * (t[2] === 'min' ? 60 : 1);
  });
  return r;
}
function contactStory_(D, from, to) {
  var day = {}, T = { calls: 0, tries: 0, ans: 0, sec: 0, mine: 0, his: 0, heCalls: 0, daysMe: 0, daysHe: 0, daysNone: 0, lastHeard: '', days: day };
  function d(k) { return day[k] || (day[k] = { mCalls: 0, mAns: 0, mMsg: 0, mHe: 0, other: 0, c: { calls: 0, tries: 0, ans: 0, sec: 0 }, h: { calls: 0, ans: 0 }, cMsg: 0, his: 0 }); }
  (D.logs || []).forEach(function (g) {
    if (g.date < from || g.date > to) return;
    var x = d(g.date);
    if (g.kind === 'call') { x.mCalls++; x.mAns++; }
    else if (g.kind === 'no_answer') x.mCalls++;
    else if (g.kind === 'message') x.mMsg++;
    else if (g.kind === 'called_back') x.mHe++;
    else if (g.kind === 'wa_chat') { var n = chatNums_(g.notes); x.cMsg += n.mine; x.his += n.his; x.c = chatSide_(g.notes, 'You'); x.h = chatSide_(g.notes, 'He'); }
    else if (g.kind !== 'flag') x.other++;
  });
  (D.visits || []).forEach(function (v) { if (v.date >= from && v.date <= to) d(v.date).other++; });
  Object.keys(day).sort().forEach(function (k) {
    var x = day[k], calls = Math.max(x.mCalls, x.c.calls), tries = Math.max(x.mCalls, x.c.tries), ans = Math.max(x.mAns, x.c.ans);
    var msg = Math.max(x.mMsg, x.cMsg), he = Math.max(x.mHe, x.h.calls); // single calls, not tries
    T.calls += calls; T.tries += tries; T.ans += Math.min(ans, tries); T.sec += x.c.sec; T.mine += msg; T.his += x.his; T.heCalls += he;
    x.me = calls > 0 || msg > 0 || x.other > 0; x.he = x.his > 0 || he > 0 || ans > 0;
    if (x.me) T.daysMe++;
    if (x.he) { T.daysHe++; T.lastHeard = k; }
    if (x.me && !x.he) T.daysNone++;
  });
  return T;
}
function wrap_(g, s, maxW, size, weight, maxLines) {
  g.font = (weight || 400) + ' ' + size + 'px ' + DRAW.F;
  var words = String(s).split(/\s+/), lines = [], cur = '';
  words.forEach(function (wd) {
    var t = cur ? cur + ' ' + wd : wd;
    if (g.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = wd; }
  });
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = fit_(g, lines[maxLines - 1] + ' …', maxW, size, weight); }
  return lines.map(function (l) { return fit_(g, l, maxW, size, weight); });
}
function talk_(sec) { return !sec ? '0 min' : sec < 60 ? sec + ' sec' : Math.round(sec / 60) + ' min'; }

function drawLogSummary(v, from, to, title) {
  var D = v.D, S = logSummary_(D, from, to), o = canvas_(), g = o.g, x = DRAW.X, w = DRAW.W - 2 * x;
  var y = header_(g, (D.property || '169-E, EME') + ' · Rent', 'Contact Log', title + ': ' + fmtDate_(from) + ' to ' + fmtDate_(to));
  var C = contactCounts_(D, from, to), R = contactStory_(D, from, to);
  // 1. who reached out: two bars on the same scale
  var mine = R.mine + R.calls, his = R.his + R.heCalls, top = Math.max(mine, his, 1), bw = w - 48;
  box_(g, x, y, w, 236, '#F8FAFC', DRAW.line);
  [['You', mine, plural2_(R.mine, 'message') + ' · ' + plural2_(R.calls, 'call'), DRAW.navy],
    ['He', his, plural2_(R.his, 'message') + ' · ' + plural2_(R.heCalls, 'call'), DRAW.gold]].forEach(function (r, i) {
    var by = y + 24 + i * 104;
    txt_(g, r[0] + ': ' + r[1], x + 24, by + 30, 32, 800, DRAW.ink);
    txt_(g, r[2], x + w - 24, by + 30, 26, 600, DRAW.grey, 'right');
    box_(g, x + 24, by + 46, bw, 34, '#E5E7EB', null, 17);
    if (r[1] > 0) box_(g, x + 24, by + 46, Math.max(34, bw * r[1] / top), 34, r[3], null, 17);
  });
  y += 252;
  // 2. the numbers
  var tiles = [['Calls made', String(R.calls), 'in ' + plural2_(R.tries, 'try').replace('trys', 'tries')],
    ['Tries answered', R.ans + ' of ' + R.tries, 'talked ' + talk_(R.sec), R.tries > 0 && R.ans < R.tries],
    ['Days no response', R.daysNone + ' of ' + R.daysMe, 'days I reached out', R.daysNone > 0],
    ['Last heard', R.lastHeard ? fmtDate_(R.lastHeard).replace(/ \d{4}$/, '') : 'Never', R.lastHeard ? (to === R.lastHeard ? 'today' : daysText_(dayNum_(to) - dayNum_(R.lastHeard)) + ' ago') : 'in this period']];
  var tw = (w - 3 * 14) / 4;
  tiles.forEach(function (t, i) {
    var tx = x + i * (tw + 14), bad = !!t[3];
    box_(g, tx, y, tw, 168, bad ? '#FDECEA' : '#F8FAFC', bad ? '#F5B8B3' : DRAW.line);
    g.font = '800 46px ' + DRAW.F; var big = g.measureText(t[1]).width > tw - 36 ? 34 : 46;
    txt_(g, t[1], tx + 20, y + 62, big, 800, bad ? DRAW.red : DRAW.navy);
    txt_(g, fit_(g, t[0], tw - 30, 23, 700), tx + 20, y + 104, 23, 700, DRAW.ink);
    txt_(g, fit_(g, t[2], tw - 30, 21, 500), tx + 20, y + 136, 21, 500, DRAW.grey);
  });
  y += 184;
  var small = [['Asked to call back', C.callbackReq], ['Visits to EME', S.visits], ['Red flags', S.flags]].filter(function (t) { return t[1] > 0; });
  if (S.visits) small.push(['Waiting at EME', fmtMins_(S.totalWait)]);
  if (small.length) { txt_(g, small.map(function (t) { return t[0] + ': ' + t[1]; }).join('   ·   '), x, y + 26, 27, 700, S.flags ? DRAW.red : DRAW.ink); y += 52; }
  // 3. day by day (up to 62 days)
  var n = dayNum_(to) - dayNum_(from) + 1, legendAt;
  var payDay = (D.payments || []).reduce(function (m, p) { return p.date > m ? p.date : m; }, ''), PAYC = '#2563EB';
  var payAmt = (D.payments || []).reduce(function (t, p) { return p.date === payDay ? t + (Number(p.amount) || 0) : t; }, 0);
  function dayCol(k) { var q = R.days[k]; if (k === payDay) return PAYC; return !q || (!q.me && !q.he) ? '#EEF0F3' : q.he ? DRAW.green : DRAW.red; }
  if (n <= 62) {
    txt_(g, 'Day by day', x, y + 30, 34, 800); y += 48;
    var per = n <= 31 ? n : Math.ceil(n / 2), gap = 4, cw = (w - (per - 1) * gap) / per, tags = [];
    for (var i = 0; i < n; i++) {
      var k = addDaysYmd_(from, i), cx = x + (i % per) * (cw + gap), cy = y + Math.floor(i / per) * 62;
      box_(g, cx, cy, cw, 54, dayCol(k), null, 8);
      if (k === payDay) tags[0] = { cx: cx + cw / 2, ymd: k, color: PAYC };
      if (k === to) tags[1] = { cx: cx + cw / 2, ymd: k, color: DRAW.navy };
      if (i === 0) tags[2] = { cx: cx + cw / 2, ymd: k, color: DRAW.grey };
    }
    y = dateTags_(g, y + Math.ceil(n / per) * 62 - 8, tags) + 8;
  } else {
    // longer periods: one small row per month, the whole period (All entries: from the first entry, 12 months at most)
    var keys = Object.keys(R.days).sort(), first = n > 366 && keys.length && keys[0] > from ? keys[0] : from, months = [], ym = to.slice(0, 7);
    while (ym >= first.slice(0, 7) && months.length < 12) { months.unshift(ym); var yy = +ym.slice(0, 4), mm = +ym.slice(5, 7) - 1; if (mm < 1) { mm = 12; yy--; } ym = yy + '-' + pad2_(mm); }
    txt_(g, 'Day by day' + (months[0] > first.slice(0, 7) ? ' (last 12 months)' : ''), x, y + 30, 34, 800); y += 46;
    var lab = 132, g2 = 3, mw = (w - lab - 30 * g2) / 31, tags2 = [];
    months.forEach(function (m) {
      var yy = +m.slice(0, 4), mm = +m.slice(5, 7), dim = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
      txt_(g, CFG.MONTHS[mm - 1].slice(0, 3) + ' ' + yy, x, y + 20, 21, 700, DRAW.grey);
      for (var dd = 1; dd <= dim; dd++) {
        var k = m + '-' + pad2_(dd);
        if (k < from || k > to) continue;
        box_(g, x + lab + (dd - 1) * (mw + g2), y, mw, 24, dayCol(k), null, 5);
        if (k === payDay) tags2[0] = { cx: x + lab + (dd - 1) * (mw + g2) + mw / 2, ymd: k, color: PAYC };
        if (k === to) tags2[1] = { cx: x + lab + (dd - 1) * (mw + g2) + mw / 2, ymd: k, color: DRAW.navy };
      }
      y += 30;
    });
    y = dateTags_(g, y - 6, tags2) + 6;
  }
  {
    var showPay = !!payDay && payDay >= from && payDay <= to;
    y = dayLegend_(g, x, y, 21, showPay);
    if (showPay) {
      var L = v.L, bal = L ? L.yearBalance : 0;
      txt_(g, 'Rent paid: ' + fmtRs_(payAmt) + ' on ' + fmtDate_(payDay) + (payDay === to ? ' (today)' : ', ' + daysText_(dayNum_(to) - dayNum_(payDay)) + ' ago'), x, y + 20, 21, 700, DRAW.ink);
      y += 34;
      if (L && bal > 0) { txt_(g, 'Pending for ' + L.year + ' since that day: ' + fmtRs_(bal), x, y + 20, 21, 800, DRAW.rust); y += 34; }
      else if (L) { txt_(g, 'Rent for ' + L.year + ' is clear up to now', x, y + 20, 21, 700, DRAW.green); y += 34; }
    }
    y += 10;
  }
  // 4. latest entries, two lines each
  txt_(g, 'Latest', x, y + 30, 34, 800); y += 46;
  var max = 0;
  S.items.some(function (it) {
    var flag = it.kind === 'flag', lines = wrap_(g, it.notes && it.notes !== '.' ? it.notes : '·', w - 48, 26, 400, 2), h = 56 + lines.length * 34;
    if (y + h > DRAW.H - 190) return true;
    max++;
    box_(g, x, y, w, h, flag ? '#FDECEA' : null, flag ? '#F5B8B3' : DRAW.line, 16);
    txt_(g, fmtDate_(it.date) + (it.kind !== 'wa_chat' && it.time ? ' · ' + it.time : ''), x + 24, y + 36, 24, 600, DRAW.grey);
    txt_(g, flag ? 'RED FLAG: ' + it.flag : kindLabel_(it.kind), x + w - 24, y + 36, 26, 800, flag ? DRAW.red : DRAW.navy, 'right');
    lines.forEach(function (l, i) { txt_(g, l, x + 24, y + 72 + i * 34, 26, 400, DRAW.ink); });
    y += h + 10;
  });
  if (S.items.length > max) txt_(g, '+ ' + (S.items.length - max) + ' earlier entries', x, y + 22, 24, 600, DRAW.grey);
  if (!S.items.length) txt_(g, 'Nothing recorded in this period.', x, y + 30, 30, 400, DRAW.grey);
  footer_(g, '');
  return o.c;
}
// Date pills under the day squares: the payment day (blue), today (navy) and the first day (grey), each under its own square.
// tags: [{ cx, ymd, color }] in order of importance; one that would overlap a more important one is left out.
function dateTags_(g, top, tags) {
  var placed = [];
  g.font = '800 19px ' + DRAW.F;
  tags.forEach(function (t) {
    if (!t) return;
    var s = fmtDate_(t.ymd).replace(/ \d{4}$/, ''), tw = g.measureText(s).width + 16;
    var x0 = Math.min(Math.max(t.cx - tw / 2, DRAW.X), DRAW.W - DRAW.X - tw);
    if (placed.some(function (p) { return x0 < p[1] + 8 && x0 + tw > p[0] - 8; })) return;
    placed.push([x0, x0 + tw]);
    box_(g, x0, top + 4, tw, 24, '#FFFFFF', t.color, 8);
    txt_(g, s, x0 + tw / 2, top + 22, 19, 800, t.color, 'center');
    g.font = '800 19px ' + DRAW.F;
  });
  return top + 34;
}
// Legend for the day squares; the blue Rent paid key is added when the payment day is shown. Wraps to a second row if needed.
function dayLegend_(g, x, y, size, withPay) {
  var items = [[DRAW.red, 'I contacted, no response'], [DRAW.green, 'He replied, answered or called'], ['#EEF0F3', 'No contact']];
  if (withPay) items.push(['#2563EB', 'Rent paid']);
  var sq = size + 1, lx = x, step = size + 13;
  g.font = '600 ' + size + 'px ' + DRAW.F;
  items.forEach(function (l) {
    var wd = sq + 8 + g.measureText(l[1]).width;
    if (lx > x && lx + wd > DRAW.W - DRAW.X) { lx = x; y += step; }
    box_(g, lx, y + 2, sq, sq, l[0], null, 5); txt_(g, l[1], lx + sq + 8, y + size - 1, size, 600, DRAW.grey);
    g.font = '600 ' + size + 'px ' + DRAW.F; lx += wd + 20;
  });
  return y + step;
}
function plural2_(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
