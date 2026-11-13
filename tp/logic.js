/* GENERATED from Rent.gs shared slice. Do not edit. */
//== SHARED START
var CFG = {
  APP_NAME: '169-E Rent',
  SCHEMA_VER: 2,
  INTO: ['Sehrish HBL', 'Irfan ABL', 'Cash (with receipt)'],
  BY: ['Tenant', 'Family', 'Other'],
  LOG_KINDS: [
    { k: 'message', label: 'Message sent' },
    { k: 'call', label: 'Called him' },
    { k: 'no_answer', label: 'Call not answered' },
    { k: 'callback_req', label: 'Asked for call back' },
    { k: 'called_back', label: 'He called back' },
    { k: 'meeting', label: 'Meeting' },
    { k: 'wa_chat', label: 'WhatsApp chat' },
    { k: 'flag', label: 'Red flag' }
  ],
  FLAGS: ['Sehrish called his wife', 'Missed a promised date', 'No answer / no reply', 'Rude or threatening'],
  OUTCOMES: ['Paid', 'Promised a date', 'Met, no payment', 'Not home', 'Refused', 'Other'],
  CLAIM_STATUS: ['counted', 'rejected'],
  MAX_AMOUNT: 10000000,
  EARLIEST: '2019-01-01',
  SALAM: '\u0627\u0644\u0633\u064e\u0651\u0644\u0627\u064e\u0645\u064f \u0639\u064e\u0644\u064e\u064a\u0652\u0643\u064f\u0645\u0652 \u0648\u064e\u0631\u064e\u062d\u0652\u0645\u064e\u0629\u064f \u0627\u0644\u0644\u0647\u0650 \u0648\u064e\u0628\u064e\u0631\u064e\u0643\u064e\u0627\u062a\u064f\u0647\u064f',
  JAZAK: '\u062c\u0632\u0627\u0643 \u0627\u0644\u0644\u0647\u064f \u062e\u064a\u0631\u0627\u064b',
  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

function pad2_(n) { return (n < 10 ? '0' : '') + n; }

function ymdParts_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}

function isYmd_(s) {
  var p = ymdParts_(s);
  if (!p) return false;
  var dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  return dt.getUTCFullYear() === p.y && dt.getUTCMonth() === p.m - 1 && dt.getUTCDate() === p.d;
}

function isHm_(s) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s || '')); }

function addDaysYmd_(s, n) {
  var p = ymdParts_(s);
  var dt = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return dt.getUTCFullYear() + '-' + pad2_(dt.getUTCMonth() + 1) + '-' + pad2_(dt.getUTCDate());
}

function daysInMonth_(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

function rateFor_(rates, mk) {
  var best = null;
  (rates || []).forEach(function (r) {
    if (r.from <= mk && (!best || r.from >= best.from)) best = r;
  });
  return best;
}

function dueDateFor_(r, mk) {
  var y = +mk.slice(0, 4), m = +mk.slice(5, 7), n = daysInMonth_(y, m);
  return mk + '-' + pad2_(Math.min(r.due_day || 1, n));
}

function lateDateFor_(r, mk) {
  var y = +mk.slice(0, 4), m = +mk.slice(5, 7), n = daysInMonth_(y, m);
  return mk + '-' + pad2_(Math.min(Math.max(r.late_day || r.due_day || 1, r.due_day || 1), n));
}

function groupNum_(n) {
  var neg = n < 0, s = String(Math.round(Math.abs(n))), out = '';
  while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
  return (neg ? '-' : '') + s + out;
}

function fmtRs_(n) { return 'Rs ' + groupNum_(n); }

function fmtDate_(ymd) {
  var p = ymdParts_(ymd);
  if (!p) return String(ymd || '');
  return p.d + ' ' + CFG.MONTHS[p.m - 1].slice(0, 3) + ' ' + p.y;
}

function monthName_(mk) {
  return CFG.MONTHS[+mk.slice(5, 7) - 1] + ' ' + mk.slice(0, 4);
}

function ordinal_(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

function minutesBetween_(a, b) {
  if (!isHm_(a) || !isHm_(b)) return null;
  var d = (+b.slice(0, 2) * 60 + +b.slice(3)) - (+a.slice(0, 2) * 60 + +a.slice(3));
  return d < 0 ? d + 1440 : d;
}

function fmtMins_(m) {
  if (m === null || m === undefined) return '';
  return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min';
}

function claimCredits_(D) {
  return (D.claims || []).filter(function (c) { return c.status !== 'rejected' && +c.amount > 0 && c.date; })
    .map(function (c) { return { date: c.date, kind: 'credit', amount: +c.amount, claim: true }; });
}

/**
 * The whole rent ledger, worked out the same way on the phone and in the sheet.
 * A month counts as due from its due day (the 3rd). It is late only if, within its own year,
 * what was due so far was not covered by its late day (the 10th).
 */
function computeLedger_(D, today) {
  var st = ymdParts_(D.tenancy.start);
  var curMonth = today.slice(0, 7), curYear = +today.slice(0, 4);
  var years = {}, months = [];
  function yr(y) {
    return years[y] || (years[y] = { year: y, due: 0, paid: 0, rent: 0, months: 0, credits: 0, charges: 0, maint: 0 });
  }
  var y = st.y, m = st.m, guard = 0;
  while (guard++ < 2400) {
    var mk = y + '-' + pad2_(m);
    if (mk > curMonth) break;
    var r = rateFor_(D.rates, mk);
    if (r) {
      var due = dueDateFor_(r, mk);
      if (due <= today) {
        months.push({ month: mk, year: y, rent: r.rent, due: due, late: lateDateFor_(r, mk) });
        var Y = yr(y);
        Y.due += r.rent; Y.rent += r.rent; Y.months++;
      }
    }
    m++; if (m > 12) { m = 1; y++; }
  }
  if (D.tenancy.security) yr(st.y).due += +D.tenancy.security;
  (D.adjustments || []).concat(claimCredits_(D)).forEach(function (a) {
    if (!a.date || a.date > today) return;
    var Y = yr(+a.date.slice(0, 4)), amt = +a.amount || 0;
    if (a.kind === 'charge') { Y.due += amt; Y.charges += amt; }
    else { Y.due -= amt; Y.credits += amt; if (a.claim) Y.maint += amt; }
  });
  var pays = (D.payments || []).filter(function (p) { return p.date && +p.amount; })
    .slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  pays.forEach(function (p) { yr(+p.date.slice(0, 4)).paid += +p.amount; });
  yr(curYear);

  var cumDueByYear = {};
  months.forEach(function (mo) {
    cumDueByYear[mo.year] = (cumDueByYear[mo.year] || 0) + mo.rent;
    var paidBy = 0, paidIn = 0, paidYtd = 0;
    pays.forEach(function (p) {
      var py = +p.date.slice(0, 4);
      if (py === mo.year && p.date <= mo.late) paidBy += +p.amount;
      if (p.date.slice(0, 7) === mo.month) paidIn += +p.amount;
      if (py === mo.year && p.date.slice(0, 7) <= mo.month) paidYtd += +p.amount;
    });
    mo.paidInMonth = paidIn;
    mo.onTime = paidBy >= cumDueByYear[mo.year];
    mo.lateNow = !mo.onTime && today > mo.late;
    mo.yearBalanceAfter = cumDueByYear[mo.year] - paidYtd;
  });

  var list = Object.keys(years).map(function (k) { return years[k]; })
    .sort(function (a, b) { return a.year - b.year; });
  var cum = 0;
  list.forEach(function (Y) { Y.arrearsBefore = cum; Y.balance = Y.due - Y.paid; cum += Y.balance; });
  var cur = years[curYear];
  return {
    today: today, months: months, years: list, year: curYear, cur: cur,
    arrearsBefore: cur.arrearsBefore, yearBalance: cur.balance, total: cum,
    avgPaid: cur.months ? cur.paid / cur.months : 0,
    paidTotal: pays.reduce(function (s, p) { return s + (+p.amount); }, 0)
  };
}

function checkAmount_(a) {
  a = Number(a);
  if (!(a > 0) || Math.round(a) !== a) return 'Enter the amount in whole rupees.';
  if (a > CFG.MAX_AMOUNT) return 'That amount looks too large. Check it.';
  return '';
}

function checkDate_(d, today) {
  if (!isYmd_(d)) return 'Enter the date.';
  if (d < CFG.EARLIEST) return 'That date is too early.';
  if (d > addDaysYmd_(today, 1)) return 'The date cannot be in the future.';
  return '';
}

function validatePayment_(p, today) {
  var e = checkDate_(p.date, today) || checkAmount_(p.amount);
  if (e) return e;
  if (CFG.INTO.indexOf(p.into) < 0) return 'Choose where it was received.';
  if (CFG.BY.indexOf(p.by) < 0) return 'Choose who paid.';
  if (p.eur !== undefined && p.eur !== '' && p.eur !== null) {
    var x = Number(p.eur);
    if (!(x > 0) || x > 100000) return 'Check the euro amount.';
  }
  if (p.note && String(p.note).length > 300) return 'Keep the note under 300 characters.';
  return '';
}

function validateClaim_(c, today) {
  var e = checkDate_(c.date, today) || checkAmount_(c.amount);
  if (e) return e;
  if (!String(c.desc || '').trim()) return 'Say what the money was spent on.';
  if (String(c.desc).length > 300) return 'Keep the description under 300 characters.';
  return '';
}

function validateLog_(g, today) {
  var e = checkDate_(g.date, today);
  if (e) return e;
  if (g.time && !isHm_(g.time)) return 'Check the time.';
  var kinds = CFG.LOG_KINDS.map(function (x) { return x.k; });
  if (kinds.indexOf(g.kind) < 0) return 'Choose what happened.';
  if (g.kind === 'flag' && CFG.FLAGS.indexOf(g.flag) < 0) return 'Choose the red flag.';
  if (g.notes && String(g.notes).length > 1000) return 'Keep notes under 1000 characters.';
  return '';
}

function validateVisit_(v, today) {
  var e = checkDate_(v.date, today);
  if (e) return e;
  var bad = ['left', 'arrived', 'met', 'departed'].filter(function (k) { return v[k] && !isHm_(v[k]); });
  if (bad.length) return 'Check the times.';
  if (!v.left) return 'Start the visit with "Leaving for EME".';
  if (v.outcome && CFG.OUTCOMES.indexOf(v.outcome) < 0) return 'Choose an outcome.';
  if (v.notes && String(v.notes).length > 1000) return 'Keep notes under 1000 characters.';
  return '';
}

function visitTimes_(v) {
  return {
    drive: minutesBetween_(v.left, v.arrived),
    wait: minutesBetween_(v.arrived, v.met || v.departed),
    meeting: v.met ? minutesBetween_(v.met, v.departed) : null,
    total: minutesBetween_(v.left, v.departed)
  };
}

function waPhone_(raw) {
  var d = String(raw || '').replace(/[^\d+]/g, '');
  if (!d) return '';
  if (d.charAt(0) === '+') d = d.slice(1);
  else if (d.slice(0, 2) === '00') d = d.slice(2);
  else if (d.charAt(0) === '0' && d.length === 11) d = '92' + d.slice(1);
  d = d.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15 ? d : '';
}

function salut_(D) {
  var t = D.tenancy || {};
  return t.salutation || ((t.tenant || 'Tenant') + ' Bhai');
}

function byLabel_(D, by) { return by === 'Tenant' && D.tenancy && D.tenancy.tenant ? D.tenancy.tenant : by; }

// His name in Urdu for the salam line ("Kashif" > کاشف بھائی); empty for a name not in the list.
var URDU_NAMES = { kashif: '\u06a9\u0627\u0634\u0641' };
function urduSalut_(D) {
  var t = D.tenancy || {}, first = String(t.tenant || '').trim().split(/\s+/)[0].toLowerCase();
  return URDU_NAMES[first] ? URDU_NAMES[first] + ' \u0628\u06be\u0627\u0626\u06cc' : '';
}
// Name first, an Urdu comma, then the salam: read right to left as one line.
function salamLine_(D) { var u = urduSalut_(D); return u ? u + '\u060c ' + CFG.SALAM : CFG.SALAM; }

function wrapMsg_(D, body) {
  return [salamLine_(D), '', salut_(D) + ',', ''].concat(body).concat(['', CFG.JAZAK]).join('\n');
}

function balanceMessage_(D, L, pay, opts) {
  opts = opts || {};
  var b = [];
  if (pay) b.push('Received ' + fmtRs_(pay.amount) + ' on ' + fmtDate_(pay.date) + '. Thank you.', '');
  if (L.yearBalance > 0) b.push('Remaining for ' + L.year + ': ' + fmtRs_(L.yearBalance) + '.');
  else if (L.yearBalance === 0) b.push('Rent for ' + L.year + ' is clear up to now.');
  else b.push('You are ' + fmtRs_(-L.yearBalance) + ' ahead for ' + L.year + '.');
  if (opts.arrears && L.arrearsBefore > 0) {
    b.push('Earlier arrears (up to Dec ' + (L.year - 1) + '): ' + fmtRs_(L.arrearsBefore) + ', separate.');
  }
  return wrapMsg_(D, b);
}

function dayNum_(ymd) { var p = ymdParts_(ymd); return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 86400000); }
// The reminder picks its month and tone from today's date:
//  - this month's rent not yet due (on or before the 3rd): "due", with days left;
//  - due date passed and the year still owes money: "overdue", with days overdue (payments clear the oldest months first);
//  - this month already covered: an advance reminder for next month.
function reminderInfo_(D, L, today) {
  var mk = today.slice(0, 7), r = rateFor_(D.rates, mk);
  if (!r) return null;
  var due = dueDateFor_(r, mk), bal = L.yearBalance;
  var thisMonth = L.months.filter(function (x) { return x.month === mk; })[0];
  if (thisMonth && bal <= 0) {
    var ny = +mk.slice(0, 4), nm = +mk.slice(5, 7) + 1; if (nm > 12) { nm = 1; ny++; }
    var nk = ny + '-' + pad2_(nm), nr = rateFor_(D.rates, nk) || r, nd = dueDateFor_(nr, nk);
    return { month: nk, rent: nr.rent, due: nd, balanceBefore: 0, status: 'due', days: dayNum_(nd) - dayNum_(today), unpaid: nr.rent };
  }
  if (thisMonth) bal -= thisMonth.rent;
  var late = !!thisMonth && today > due;
  return { month: mk, rent: r.rent, due: due, balanceBefore: bal, status: late ? 'overdue' : 'due',
    days: late ? dayNum_(today) - dayNum_(due) : dayNum_(due) - dayNum_(today),
    unpaid: thisMonth ? Math.min(r.rent, Math.max(L.yearBalance, 0)) : r.rent };
}
function dueText_(R) { return (+R.due.slice(8)) + ' ' + CFG.MONTHS[+R.due.slice(5, 7) - 1]; }
function daysText_(n) { return n + (n === 1 ? ' day' : ' days'); }
// One line for the bottom of the picture, matching the date it is sent.
function reminderLine_(R) {
  if (R.status === 'overdue') return 'Kindly send it today. Thank you.';
  if (R.days === 0) return 'Due today. Kindly send it today. Thank you.';
  return 'Kindly send by the ' + ordinal_(+R.due.slice(8)) + '. Thank you.';
}
function reminderMessage_(D, L, today, opts) {
  var R = reminderInfo_(D, L, today);
  if (!R) return '';
  var b = R.status === 'overdue'
    ? ['Rent of ' + fmtRs_(R.rent) + ' for ' + monthName_(R.month) + ' was due by ' + dueText_(R) + ' and is now ' + daysText_(R.days) + ' overdue.' +
        (R.unpaid < R.rent ? ' Still unpaid: ' + fmtRs_(R.unpaid) + '.' : ''), 'Kindly send it today.']
    : ['A reminder that rent of ' + fmtRs_(R.rent) + ' for ' + monthName_(R.month) + ' is due by ' + dueText_(R) + '.' +
        (R.days === 0 ? ' That is today.' : '')];
  if (R.balanceBefore > 0) b.push('', 'Balance for ' + L.year + ' before this month: ' + fmtRs_(R.balanceBefore) + '.');
  if (opts && opts.arrears && L.arrearsBefore > 0) b.push('Earlier arrears (up to Dec ' + (L.year - 1) + '): ' + fmtRs_(L.arrearsBefore) + ', separate.');
  return wrapMsg_(D, b);
}

// What the tenant may see: this year only, no arrears, no log, flags, visits, notes, phone or deposit.
function tenantView_(D, L) {
  var yr = L.year, mk = L.today.slice(0, 7), r = rateFor_(D.rates, mk);
  var inYear = function (x) { return +String(x.date).slice(0, 4) === yr; };
  return {
    D: {
      tenancy: { tenant: D.tenancy.tenant, salutation: D.tenancy.salutation },
      property: D.property,
      rates: r ? [{ from: r.from, rent: r.rent, due_day: r.due_day, late_day: r.late_day }] : [],
      payments: (D.payments || []).filter(inYear).map(function (p) {
        return { pay_id: p.pay_id, key: p.pay_id, date: p.date, amount: p.amount, into: p.into, by: p.by, eur: p.eur };
      }),
      claims: (D.claims || []).map(function (c) { return { claim_id: c.claim_id, date: c.date, amount: c.amount, desc: c.desc, status: c.status }; })
    },
    L: {
      today: L.today, year: yr, yearBalance: L.yearBalance, arrearsBefore: 0, total: L.yearBalance,
      cur: { year: yr, rent: L.cur.rent, paid: L.cur.paid, maint: L.cur.maint, months: L.cur.months },
      avgPaid: L.avgPaid,
      months: L.months.filter(function (m) { return m.year === yr; }).map(function (m) {
        return { month: m.month, year: m.year, rent: m.rent, due: m.due, paidInMonth: m.paidInMonth, onTime: m.onTime };
      })
    }
  };
}

function logSummary_(D, from, to) {
  var logs = (D.logs || []).filter(function (g) { return g.date >= from && g.date <= to; });
  var visits = (D.visits || []).filter(function (v) { return v.date >= from && v.date <= to; });
  var count = {};
  CFG.LOG_KINDS.forEach(function (x) { count[x.k] = 0; });
  logs.forEach(function (g) { count[g.kind] = (count[g.kind] || 0) + 1; });
  var waits = visits.map(function (v) { return visitTimes_(v).wait; }).filter(function (x) { return x !== null; });
  var items = logs.map(function (g) { return { date: g.date, time: g.time || '', kind: g.kind, flag: g.flag || '', notes: g.notes || '' }; })
    .concat(visits.map(function (v) {
      var t = visitTimes_(v);
      return { date: v.date, time: v.left || '', kind: 'visit', flag: '', outcome: v.outcome || '',
        notes: [t.wait !== null ? 'waited ' + fmtMins_(t.wait) : '', v.outcome || '', v.notes || ''].filter(Boolean).join(' \u00b7 ') };
    }))
    .sort(function (a, b) { return (b.date + b.time) < (a.date + a.time) ? -1 : (b.date + b.time) > (a.date + a.time) ? 1 : 0; });
  return { from: from, to: to, count: count, visits: visits.length, flags: count.flag || 0,
    totalWait: waits.reduce(function (s, x) { return s + x; }, 0), items: items };
}
// Numbers in a WhatsApp chat log line, e.g. "He sent 1, you sent 4. You tried 2 times: 10:00 3 calls not answered; 15:00 2 calls answered (47 sec). He tried once: 18:10 1 call answered (20 sec)."
// A try is the calls within an hour of its first call; i and he count tries, iNo and heNo the tries not answered.
function chatNums_(notes) {
  var t = String(notes || ''), r = { mine: 0, his: 0, i: 0, iNo: 0, he: 0, heNo: 0 }, m;
  if ((m = /He sent (\d+), you sent (\d+)/.exec(t))) { r.his = +m[1]; r.mine = +m[2]; }
  [['You', 'i', 'iNo'], ['He', 'he', 'heNo']].forEach(function (w) {
    var x = new RegExp(w[0] + ' tried (?:once|\\d+ times): ([^.]*)').exec(t);
    if (!x) return;
    var parts = x[1].split(';');
    r[w[1]] = parts.length;
    r[w[2]] = parts.filter(function (p) { return /not answered/.test(p); }).length;
  });
  return r;
}
// Contact counts for a period: used by the pictures and by the follow-up messages.
// Entries made by hand and the imported WhatsApp chat can describe the same call, so each day takes the larger of the two.
function contactCounts_(D, from, to) {
  var S = logSummary_(D, from, to), day = {};
  function d(k) { return day[k] || (day[k] = { calls: 0, no: 0, msg: 0, he: 0, wCalls: 0, wNo: 0, wMsg: 0, wHe: 0, his: 0, cb: 0, noReply: 0 }); }
  (D.logs || []).forEach(function (g) {
    if (g.date < from || g.date > to) return;
    var x = d(g.date);
    if (g.kind === 'call') x.calls++;
    if (g.kind === 'no_answer') { x.calls++; x.no++; }
    if (g.kind === 'message') x.msg++;
    if (g.kind === 'called_back') x.he++;
    if (g.kind === 'callback_req') x.cb++;
    if (g.kind === 'flag' && g.flag === 'No answer / no reply') x.noReply++;
    if (g.kind === 'wa_chat') { var n = chatNums_(g.notes); x.wCalls += n.i; x.wNo += n.iNo; x.wMsg += n.mine; x.wHe += n.he; x.his += n.his; }
  });
  var C = { calls: 0, unanswered: 0, messages: 0, hisMessages: 0, callbackReq: 0, calledBack: 0, visits: S.visits, flags: S.flags };
  Object.keys(day).forEach(function (k) {
    var x = day[k];
    C.calls += Math.max(x.calls, x.wCalls); C.unanswered += Math.max(x.no, x.wNo) + x.noReply;
    C.messages += Math.max(x.msg, x.wMsg); C.calledBack += Math.max(x.he, x.wHe);
    C.hisMessages += x.his; C.callbackReq += x.cb;
  });
  return C;
}

var NEED_SCRIPT = '2.7';
