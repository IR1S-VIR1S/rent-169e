/**
 * 169-E Rent Tracker, main script.
 * Installed and updated by Loader.gs (menu "169-E Rent" > "Install update").
 * Never holds rent data: all data lives in the owner's Sheet and Drive.
 */
var VERSION = '2.9';
var RELEASE_NOTE = '2.9: days overdue are counted from the due date of the oldest month of the year not yet fully paid (payments clear the oldest months first), so a small payment cannot reset them. Before that, 2.8: the English name line is left out when his name is on the Urdu salam line. Before that, 2.7: messages and pictures open with his name in Urdu on the same line as the salam. Before that, 2.6: calls within an hour of the first call count as one try; contact counts include the calls and messages read from his WhatsApp chat (each day counted once, so a call logged by hand and the same call in the chat are not counted twice). Before that, 2.5: updates now install themselves when the phone app asks (no visit to the Sheet); the earlier version is kept for Undo. Before that, 2.4: the log accepts two new kinds, Call not answered and WhatsApp chat (for calls started from the app and imported chats); days overdue move into the OVERDUE stamp. Before that, 2.3: rent reminder changes to OVERDUE with the number of days once the due date has passed; advance reminder when this month is paid. 2.2: tenant page loads with a plain web request (works in Safari and any browser); clearer errors.\n' +
  '2.1: tenant page (a private link for the tenant, this year only, no login); link on/off from the menu or the app; shows when he last opened it.\n' +
  '2.0: one-tap updates; Arabic greeting and closing, "Bhai"; rent due by the 3rd (late after the 10th); ' +
  'maintenance claims; contact log with red flags; EME visit timer; receipt photos saved in Drive; tenant WhatsApp number.\n' +
  '1.1: pairing uses the /exec address you paste.\n1.0: first version.';

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
  return [salamLine_(D), ''].concat(urduSalut_(D) ? [] : [salut_(D) + ',', '']).concat(body).concat(['', CFG.JAZAK]).join('\n');
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
  var old = oldestUnpaid_(L), since = old && old.due < due ? old : null;
  var late = !!since || (!!thisMonth && today > due);
  return { month: mk, rent: r.rent, due: due, balanceBefore: bal, status: late ? 'overdue' : 'due',
    days: late ? dayNum_(today) - dayNum_(since ? since.due : due) : dayNum_(due) - dayNum_(today),
    monthDays: thisMonth && today > due ? dayNum_(today) - dayNum_(due) : 0, since: since ? since.month : '', sinceDue: since ? since.due : '',
    unpaid: thisMonth ? Math.min(r.rent, Math.max(L.yearBalance, 0)) : r.rent };
}
// The oldest month of this year not fully paid: what was paid for the year (and anything credited) clears the months in order.
function oldestUnpaid_(L) {
  if (!(L.yearBalance > 0)) return null;
  var ms = L.months.filter(function (m) { return m.year === L.year; }), covered = L.cur.rent - L.yearBalance, cum = 0;
  for (var i = 0; i < ms.length; i++) { cum += ms[i].rent; if (cum > covered) return ms[i]; }
  return null;
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
    ? (R.since ? ['Rent has been unpaid since ' + monthName_(R.since) + ' (due ' + fmtDate_(R.sinceDue) + '): ' + daysText_(R.days) + ' overdue.',
        'Rent of ' + fmtRs_(R.rent) + ' for ' + monthName_(R.month) + ' was due by ' + dueText_(R) + (R.monthDays ? ' (' + daysText_(R.monthDays) + ' ago).' : '.'), 'Kindly send it today.']
      : ['Rent of ' + fmtRs_(R.rent) + ' for ' + monthName_(R.month) + ' was due by ' + dueText_(R) + ' and is now ' + daysText_(R.days) + ' overdue.' +
        (R.unpaid < R.rent ? ' Still unpaid: ' + fmtRs_(R.unpaid) + '.' : ''), 'Kindly send it today.'])
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
//== SHARED END

// ===================== GOOGLE SERVICES (sheet side only) =====================

var MENU_ITEMS = [
  { label: 'Set up or repair', fn: 'setup' },
  { label: 'Refresh balances', fn: 'refreshMenu' },
  { label: 'Pair a phone', fn: 'pairPhone' },
  { label: 'Change web app address', fn: 'changeWebAppUrl' },
  { label: 'Disconnect all phones', fn: 'disconnectAll' },
  { label: 'Tenant page link', fn: 'tenantLinkMenu' },
  { label: 'Turn off tenant page', fn: 'tenantOffMenu' }
];
var PAGES_URL = 'https://ir1s-vir1s.github.io/rent-169e/t.html';

var TABS = {
  SUMMARY: ['item', 'value'],
  MONTHS: ['month', 'rent', 'due_date', 'late_after', 'paid_in_month', 'on_time', 'year_balance_after'],
  PAYMENTS: ['pay_id', 'tenancy_id', 'date', 'amount', 'received_into', 'paid_by', 'eur', 'note', 'req_id', 'entered_at', 'source'],
  CLAIMS: ['claim_id', 'tenancy_id', 'key', 'date', 'amount', 'description', 'status', 'entered_at', 'updated_at'],
  LOGS: ['log_id', 'tenancy_id', 'key', 'date', 'time', 'kind', 'flag', 'notes', 'entered_at'],
  VISITS: ['visit_id', 'tenancy_id', 'key', 'date', 'left_home', 'arrived', 'met', 'departed', 'outcome', 'notes', 'drive_min', 'wait_min', 'total_min', 'updated_at'],
  FILES: ['file_id', 'kind', 'ref_key', 'drive_id', 'name', 'mime', 'bytes', 'uploaded_at', 'req_id'],
  ADJUSTMENTS: ['adj_id', 'tenancy_id', 'date', 'kind', 'amount', 'note'],
  RATES: ['tenancy_id', 'from_month', 'monthly_rent', 'due_day', 'note', 'late_day'],
  TENANCIES: ['tenancy_id', 'property_id', 'tenant', 'salutation', 'start', 'security', 'status', 'note', 'phone'],
  PROPERTIES: ['property_id', 'name', 'note'],
  NOTES: ['date', 'tenancy_id', 'note'],
  DELETED: ['deleted_at', 'reason', 'pay_id', 'tenancy_id', 'date', 'amount', 'received_into', 'paid_by', 'eur', 'note', 'req_id'],
  LOG: ['time', 'event', 'detail']
};
var TEXT_COLS = { date: 1, start: 1, from_month: 1, due_date: 1, late_after: 1, month: 1, req_id: 1, pay_id: 1, key: 1,
  time: 1, left_home: 1, arrived: 1, met: 1, departed: 1, phone: 1, ref_key: 1 };
var HISTORY = (typeof RENT_HISTORY !== 'undefined') ? RENT_HISTORY : null;
var EXEC_RE = /^https:\/\/script\.google\.com\/(a\/macros\/[^\/]+|macros)\/s\/[A-Za-z0-9_-]+\/exec$/;

function today_() {
  if (typeof __TODAY__ !== 'undefined' && __TODAY__) return __TODAY__;
  return Utilities.formatDate(new Date(), 'Asia/Karachi', 'yyyy-MM-dd');
}

function nowStamp_() { return Utilities.formatDate(new Date(), 'Asia/Karachi', 'yyyy-MM-dd HH:mm:ss'); }

function sha_(s) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8);
  return b.map(function (x) { var h = ((x + 256) % 256).toString(16); return h.length < 2 ? '0' + h : h; }).join('');
}

function rand_(n) { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, n); }

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  var head = TABS[name];
  if (!sh) sh = ss.insertSheet(name);
  var have = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  var same = have.length >= head.length && head.every(function (h, i) { return have[i] === h; });
  if (!same) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
    head.forEach(function (h, i) {
      if (TEXT_COLS[h]) sh.getRange(2, i + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    });
  }
  return sh;
}

function cellText_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Karachi', 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : v;
}

function timeText_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Karachi', 'HH:mm');
  return v === null || v === undefined ? '' : String(v);
}

function readRows_(name) {
  var sh = sheet_(name), head = TABS[name], n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, head.length).getValues().map(function (r, i) {
    var o = { _row: i + 2 };
    head.forEach(function (h, j) {
      o[h] = (h === 'time' || h === 'left_home' || h === 'arrived' || h === 'met' || h === 'departed') ? timeText_(r[j]) : cellText_(r[j]);
    });
    return o;
  }).filter(function (o) { return head.some(function (h) { return o[h] !== ''; }); });
}

function append_(name, objs) {
  if (!objs.length) return;
  var sh = sheet_(name), head = TABS[name];
  var vals = objs.map(function (o) { return head.map(function (h) { return o[h] === undefined ? '' : o[h]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, vals.length, head.length).setValues(vals);
}

function writeRow_(name, rowNum, obj) {
  var head = TABS[name];
  sheet_(name).getRange(rowNum, 1, 1, head.length).setValues([head.map(function (h) { return obj[h] === undefined ? '' : obj[h]; })]);
}

function nextId_(rows, field, prefix) {
  var max = rows.reduce(function (m, p) { var n = +String(p[field]).replace(/\D/g, ''); return n > m ? n : m; }, 0);
  return prefix + ('000' + (max + 1)).slice(-4);
}

function log_(event, detail) {
  try { append_('LOG', [{ time: nowStamp_(), event: event, detail: detail || '' }]); } catch (e) { }
}

function activeTenancy_() {
  var t = readRows_('TENANCIES').filter(function (x) { return x.status === 'active'; })[0];
  if (!t) throw new Error('No active tenancy. Run "Set up or repair".');
  return t;
}

function loadData_() {
  var t = activeTenancy_(), tid = t.tenancy_id;
  function mine(r) { return r.tenancy_id === tid; }
  return {
    tenancy: { id: tid, tenant: t.tenant, salutation: t.salutation, start: t.start, security: +t.security || 0, phone: String(t.phone || '') },
    property: (readRows_('PROPERTIES').filter(function (p) { return p.property_id === t.property_id; })[0] || {}).name || '',
    rates: readRows_('RATES').filter(mine).map(function (r) {
      return { from: String(r.from_month), rent: +r.monthly_rent, due_day: +r.due_day || 1, late_day: +r.late_day || +r.due_day || 1, note: r.note };
    }),
    payments: readRows_('PAYMENTS').filter(mine).map(function (p) {
      return { pay_id: p.pay_id, key: String(p.req_id), date: String(p.date), amount: +p.amount, into: p.received_into, by: p.paid_by,
        eur: p.eur === '' ? '' : +p.eur, note: p.note, source: p.source };
    }),
    claims: readRows_('CLAIMS').filter(mine).map(function (c) {
      return { claim_id: c.claim_id, key: String(c.key), date: String(c.date), amount: +c.amount, desc: c.description, status: c.status || 'counted' };
    }),
    logs: readRows_('LOGS').filter(mine).map(function (g) {
      return { log_id: g.log_id, key: String(g.key), date: String(g.date), time: g.time, kind: g.kind, flag: g.flag, notes: g.notes };
    }),
    visits: readRows_('VISITS').filter(mine).map(function (v) {
      return { visit_id: v.visit_id, key: String(v.key), date: String(v.date), left: v.left_home, arrived: v.arrived, met: v.met,
        departed: v.departed, outcome: v.outcome, notes: v.notes };
    }),
    files: readRows_('FILES').map(function (f) {
      return { file_id: f.file_id, kind: f.kind, ref_key: String(f.ref_key), name: f.name, mime: f.mime, bytes: +f.bytes };
    }),
    adjustments: readRows_('ADJUSTMENTS').filter(mine).map(function (a) { return { date: String(a.date), kind: a.kind, amount: +a.amount, note: a.note }; }),
    notes: readRows_('NOTES').filter(mine).map(function (n) { return { date: String(n.date), note: n.note }; })
  };
}

function seed_() {
  if (!readRows_('PROPERTIES').length) append_('PROPERTIES', [{ property_id: 'P1', name: '169-E, EME Society, Lahore', note: '1 kanal house' }]);
  if (!readRows_('TENANCIES').length) {
    append_('TENANCIES', [{ tenancy_id: 'T1', property_id: 'P1', tenant: 'Kashif', salutation: 'Kashif Bhai',
      start: '2019-02-10', security: 450000, status: 'active', note: 'Whole house', phone: '' }]);
  }
  if (!readRows_('RATES').length) {
    append_('RATES', [
      { tenancy_id: 'T1', from_month: '2019-02', monthly_rent: 150000, due_day: 3, late_day: 10, note: 'Original rent' },
      { tenancy_id: 'T1', from_month: '2025-04', monthly_rent: 200000, due_day: 3, late_day: 10, note: 'From 1 April 2025' }
    ]);
  }
  if (!readRows_('ADJUSTMENTS').length) {
    append_('ADJUSTMENTS', [{ adj_id: 'A1', tenancy_id: 'T1', date: '2020-02-28', kind: 'credit', amount: 180000, note: 'Electricity hisaab (agreed figure)' }]);
  }
  if (!readRows_('PAYMENTS').length && HISTORY) {
    var i = 0;
    append_('PAYMENTS', HISTORY.pays.map(function (p) {
      i++;
      return { pay_id: 'P' + ('000' + i).slice(-4), tenancy_id: 'T1', date: p[0], amount: p[1], received_into: p[2],
        paid_by: p[3], eur: '', note: p[4], req_id: 'import-' + i, entered_at: nowStamp_(), source: 'import' };
    }));
    append_('NOTES', HISTORY.notes.map(function (n) { return { date: n[0], tenancy_id: 'T1', note: n[4] }; }));
    log_('import', HISTORY.pays.length + ' payments, ' + HISTORY.notes.length + ' notes');
  }
}

// Version 1 to 2: rent shown as due by the 3rd, late after the 10th; "sahib" becomes "Bhai".
function migrate_() {
  readRows_('RATES').forEach(function (r) {
    if (r.late_day === '' || r.late_day === null) {
      var old = +r.due_day || 10;
      r.late_day = old; r.due_day = 3;
      writeRow_('RATES', r._row, r);
    }
  });
  readRows_('TENANCIES').forEach(function (t) {
    if (t.salutation === 'Kashif sahib') { t.salutation = 'Kashif Bhai'; writeRow_('TENANCIES', t._row, t); }
  });
}

function refresh_() {
  var D = loadData_(), L = computeLedger_(D, today_());
  var ms = sheet_('MONTHS');
  if (ms.getLastRow() > 1) ms.getRange(2, 1, ms.getLastRow() - 1, TABS.MONTHS.length).clearContent();
  var rows = L.months.slice().reverse().map(function (m) {
    return [m.month, m.rent, m.due, m.late, m.paidInMonth, m.onTime ? 'Yes' : 'No', m.yearBalanceAfter];
  });
  if (rows.length) ms.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  var sm = sheet_('SUMMARY');
  if (sm.getLastRow() > 1) sm.getRange(2, 1, sm.getLastRow() - 1, 2).clearContent();
  var s = [
    ['As of', L.today],
    ['Tenant', D.tenancy.tenant + ', ' + D.property],
    [L.year + ' rent due so far', L.cur.rent],
    [L.year + ' received', L.cur.paid],
    [L.year + ' maintenance counted', L.cur.maint],
    [L.year + ' balance', L.yearBalance],
    ['Arrears up to Dec ' + (L.year - 1), L.arrearsBefore],
    ['Total outstanding', L.total],
    ['Average paid per month in ' + L.year, Math.round(L.avgPaid)],
    ['Received since start (incl. security)', L.paidTotal],
    ['Security deposit held', D.tenancy.security],
    ['Script version', VERSION]
  ];
  sm.getRange(2, 1, s.length, 2).setValues(s);
  return L;
}

// ---------- menu actions ----------
function setupCore_() {
  Object.keys(TABS).forEach(function (t) { sheet_(t); });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  seed_();
  migrate_();
  PropertiesService.getScriptProperties().setProperty('SCHEMA_VER', String(CFG.SCHEMA_VER));
  var L = refresh_();
  log_('setup', 'version ' + VERSION);
  return L;
}
function setup() {
  var L = setupCore_();
  SpreadsheetApp.getUi().alert('169-E Rent ' + VERSION + ' is ready.\n\n' +
    L.year + ' balance: ' + fmtRs_(L.yearBalance) + '\n' +
    'Arrears up to Dec ' + (L.year - 1) + ': ' + fmtRs_(L.arrearsBefore) + '\n' +
    'Total outstanding: ' + fmtRs_(L.total));
}

function refreshMenu() {
  var L = refresh_();
  SpreadsheetApp.getUi().alert('Balances refreshed. Total outstanding: ' + fmtRs_(L.total));
}

// The public /exec address. Apps Script sometimes reports its /dev test address instead,
// which needs a Google sign-in and fails on the phone, so the owner pastes /exec once.
function webAppUrl_(ui, ask) {
  var p = PropertiesService.getScriptProperties(), saved = p.getProperty('WEBAPP_URL');
  if (saved && !ask) return saved;
  var auto = '';
  try { auto = ScriptApp.getService().getUrl() || ''; } catch (e) { }
  if (!ask && EXEC_RE.test(auto)) { p.setProperty('WEBAPP_URL', auto); return auto; }
  var r = ui.prompt('Web app address',
    'In Apps Script: Deploy > Manage deployments. Copy the Web app URL (it ends in /exec) and paste it here.\n' +
    'If there is no deployment yet: Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return '';
  var v = String(r.getResponseText() || '').trim();
  if (!EXEC_RE.test(v)) {
    ui.alert('That is not the web app address. It starts with https://script.google.com/macros/s/ and ends with /exec. Nothing was changed.');
    return '';
  }
  p.setProperty('WEBAPP_URL', v);
  log_('web app address set', '');
  return v;
}

function changeWebAppUrl() {
  var ui = SpreadsheetApp.getUi();
  if (webAppUrl_(ui, true)) ui.alert('Saved. Now use "Pair a phone" to make a new code.');
}

function pairPhone() {
  var ui = SpreadsheetApp.getUi();
  var url = webAppUrl_(ui, false);
  if (!url) return;
  var code = rand_(12).toUpperCase();
  PropertiesService.getScriptProperties().setProperty('APPJOIN_' + sha_(code), JSON.stringify({ exp: Date.now() + 7 * 864e5 }));
  var invite = 'RENT1.' + Utilities.base64EncodeWebSafe(url).replace(/=+$/, '') + '.' + code;
  var me = Session.getEffectiveUser().getEmail();
  try {
    MailApp.sendEmail(me, '169-E Rent: pairing code for your iPhone',
      'Open the 169-E Rent app on your iPhone (from the Home Screen), tap "Paste code", and paste this whole line:\n\n' +
      invite + '\n\nIt works once, within 7 days. If you did not ask for this, ignore it.');
  } catch (e) { }
  log_('pair code made', 'sent to ' + me);
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial;font-size:14px">' +
    '<p>A pairing code has been e-mailed to you. You can also copy it from here:</p>' +
    '<textarea readonly style="width:100%;height:90px" onclick="this.select()">' + invite + '</textarea>' +
    '<p>Works once, within 7 days.</p></div>').setWidth(420).setHeight(240);
  ui.showModalDialog(html, 'Pair your iPhone');
}

function disconnectAll() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.alert('Disconnect every paired phone? Each will need a new pairing code.', ui.ButtonSet.OK_CANCEL);
  if (r !== ui.Button.OK) return;
  var p = PropertiesService.getScriptProperties(), all = p.getProperties(), n = 0;
  Object.keys(all).forEach(function (k) { if (k.indexOf('APP_') === 0 || k.indexOf('APPJOIN_') === 0) { p.deleteProperty(k); n++; } });
  log_('disconnect all', n + ' keys removed');
  ui.alert('Done. ' + n + ' pairing keys removed.');
}

// ---------- web app ----------
function doGet(e) {
  var q = (e && e.parameter) || {};
  if (q.op === 'tenant') {
    var out;
    try { out = String(PropertiesService.getScriptProperties().getProperty('SCHEMA_VER')) !== String(CFG.SCHEMA_VER)
      ? { ok: false, code: 409, error: 'The page is being updated. Please try again in a minute.' } : tenantPage_({ key: q.key }); }
    catch (err) { out = { ok: false, code: 500, error: 'Server error: ' + String(err && err.message || err) }; }
    return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('169-E Rent ' + VERSION + ' is running.');
}

function doPost(e) {
  var out;
  try { out = api_(JSON.parse(e.postData.contents)); }
  catch (err) { out = { ok: false, code: 400, error: 'Bad request: ' + String(err && err.message || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function api_(b) {
  var props = PropertiesService.getScriptProperties();
  if (String(props.getProperty('SCHEMA_VER')) !== String(CFG.SCHEMA_VER)) {
    return { ok: false, code: 409, error: 'The sheet is being updated. Open the Sheet and run "Set up or repair".' };
  }
  if (b.op === 'join') return join_(b);
  if (b.op === 'tenant') return tenantPage_(b);
  if (!b.token || !props.getProperty('APP_' + sha_(b.token))) {
    return { ok: false, code: 401, error: 'This phone is not paired. Use "Pair a phone" in the sheet.' };
  }
  if (b.op === 'pull') {
    var D = loadData_(); D.today = today_(); D.version = VERSION;
    D.tenantLink = tenantLink_(); D.tenantLastView = props.getProperty('TENANT_LAST_VIEW') || '';
    return { ok: true, data: D };
  }
  if (b.op === 'selfupdate') return selfUpdate_('the paired phone');
  if (b.op === 'push') return push_(b.items || []);
  if (b.op === 'upload') return upload_(b);
  if (b.op === 'file') return getFile_(b);
  return { ok: false, code: 400, error: 'Unknown request.' };
}

function join_(b) {
  var code = String(b.code || '').trim().toUpperCase(), props = PropertiesService.getScriptProperties();
  var key = 'APPJOIN_' + sha_(code), raw = props.getProperty(key);
  if (!code || !raw) return { ok: false, code: 403, error: 'That code is not valid or was already used.' };
  props.deleteProperty(key);
  if (JSON.parse(raw).exp < Date.now()) return { ok: false, code: 403, error: 'That code has expired. Make a new one.' };
  var token = rand_(40);
  props.setProperty('APP_' + sha_(token), JSON.stringify({ at: nowStamp_() }));
  log_('phone paired', '');
  return { ok: true, token: token };
}

function push_(items) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  var results = [], changed = false;
  try {
    var t = activeTenancy_(), tid = t.tenancy_id, today = today_(), stamp = nowStamp_();
    items.forEach(function (it) {
      var res;
      try { res = pushOne_(it, tid, today, stamp, t); } catch (err) { res = { ok: false, error: 'Server error: ' + String(err && err.message || err) }; }
      res.req_id = it && it.req_id;
      if (res.ok && !res.dup) changed = true;
      results.push(res);
    });
  } finally {
    lock.releaseLock();
  }
  if (changed) refresh_();
  return { ok: true, results: results };
}

function pushOne_(it, tid, today, stamp, ten) {
  if (!it || !it.req_id) return { ok: false, error: 'Missing request id.' };
  var e, rows, cur;
  switch (it.op) {
    case 'pay':
      rows = readRows_('PAYMENTS');
      cur = rows.filter(function (p) { return p.req_id === it.req_id; })[0];
      if (cur) return { ok: true, dup: true, pay_id: cur.pay_id };
      e = validatePayment_(it, today);
      if (e) return { ok: false, error: e };
      var row = { pay_id: nextId_(rows, 'pay_id', 'P'), tenancy_id: tid, date: it.date, amount: Number(it.amount),
        received_into: it.into, paid_by: it.by, eur: it.eur ? Number(it.eur) : '', note: String(it.note || '').slice(0, 300),
        req_id: it.req_id, entered_at: stamp, source: 'phone' };
      append_('PAYMENTS', [row]);
      log_('payment added', row.pay_id + ' ' + row.amount);
      return { ok: true, pay_id: row.pay_id };
    case 'del':
      cur = readRows_('PAYMENTS').filter(function (p) { return p.pay_id === it.pay_id; })[0];
      if (!cur) return { ok: true, dup: true, gone: true };
      append_('DELETED', [{ deleted_at: stamp, reason: String(it.reason || '').slice(0, 200), pay_id: cur.pay_id,
        tenancy_id: cur.tenancy_id, date: cur.date, amount: cur.amount, received_into: cur.received_into,
        paid_by: cur.paid_by, eur: cur.eur, note: cur.note, req_id: cur.req_id }]);
      sheet_('PAYMENTS').deleteRow(cur._row);
      log_('payment deleted', cur.pay_id + ' ' + cur.amount);
      return { ok: true, deleted: cur.pay_id };
    case 'claim':
      rows = readRows_('CLAIMS');
      cur = rows.filter(function (c) { return c.key === it.key; })[0];
      if (it.status && CFG.CLAIM_STATUS.indexOf(it.status) < 0) return { ok: false, error: 'Unknown claim status.' };
      if (cur && it.statusOnly) {
        cur.status = it.status; cur.updated_at = stamp; writeRow_('CLAIMS', cur._row, cur);
        log_('claim ' + it.status, cur.claim_id);
        return { ok: true, claim_id: cur.claim_id };
      }
      if (cur) return { ok: true, dup: true, claim_id: cur.claim_id };
      e = validateClaim_(it, today);
      if (e) return { ok: false, error: e };
      var c = { claim_id: nextId_(rows, 'claim_id', 'C'), tenancy_id: tid, key: it.key, date: it.date, amount: Number(it.amount),
        description: String(it.desc).trim().slice(0, 300), status: it.status || 'counted', entered_at: stamp, updated_at: stamp };
      append_('CLAIMS', [c]);
      log_('claim added', c.claim_id + ' ' + c.amount);
      return { ok: true, claim_id: c.claim_id };
    case 'log':
      rows = readRows_('LOGS');
      cur = rows.filter(function (g) { return g.key === it.key; })[0];
      if (cur) return { ok: true, dup: true, log_id: cur.log_id };
      e = validateLog_(it, today);
      if (e) return { ok: false, error: e };
      var g = { log_id: nextId_(rows, 'log_id', 'L'), tenancy_id: tid, key: it.key, date: it.date, time: it.time || '',
        kind: it.kind, flag: it.kind === 'flag' ? it.flag : '', notes: String(it.notes || '').slice(0, 1000), entered_at: stamp };
      append_('LOGS', [g]);
      return { ok: true, log_id: g.log_id };
    case 'logdel':
      cur = readRows_('LOGS').filter(function (x) { return x.key === it.key; })[0];
      if (!cur) return { ok: true, dup: true, gone: true };
      sheet_('LOGS').deleteRow(cur._row);
      log_('log entry deleted', cur.log_id + ' ' + cur.kind + ' ' + cur.date);
      return { ok: true, deleted: cur.log_id };
    case 'visit':
      e = validateVisit_(it, today);
      if (e) return { ok: false, error: e };
      rows = readRows_('VISITS');
      cur = rows.filter(function (v) { return v.key === it.key; })[0];
      var tm = visitTimes_(it);
      var v = { visit_id: cur ? cur.visit_id : nextId_(rows, 'visit_id', 'V'), tenancy_id: tid, key: it.key, date: it.date,
        left_home: it.left || '', arrived: it.arrived || '', met: it.met || '', departed: it.departed || '', outcome: it.outcome || '',
        notes: String(it.notes || '').slice(0, 1000), drive_min: tm.drive === null ? '' : tm.drive, wait_min: tm.wait === null ? '' : tm.wait,
        total_min: tm.total === null ? '' : tm.total, updated_at: stamp };
      if (cur) writeRow_('VISITS', cur._row, v); else append_('VISITS', [v]);
      return { ok: true, visit_id: v.visit_id };
    case 'visitdel':
      cur = readRows_('VISITS').filter(function (x) { return x.key === it.key; })[0];
      if (!cur) return { ok: true, dup: true, gone: true };
      sheet_('VISITS').deleteRow(cur._row);
      log_('visit deleted', cur.visit_id + ' ' + cur.date);
      return { ok: true, deleted: cur.visit_id };
    case 'tenantlink':
      if (it.action === 'off') { setTenantKey_(''); return { ok: true, link: '' }; }
      if (it.action === 'new') { setTenantKey_(rand_(24)); return { ok: true, link: tenantLink_() }; }
      return { ok: false, error: 'Unknown request.' };
    case 'phone':
      var ph = String(it.phone || '').trim();
      if (ph && !waPhone_(ph)) return { ok: false, error: 'Check the phone number, with country code, for example +34 612 345 678.' };
      var all = readRows_('TENANCIES'), tr = all.filter(function (x) { return x.tenancy_id === tid; })[0];
      tr.phone = ph; writeRow_('TENANCIES', tr._row, tr);
      log_('tenant phone set', ph ? 'set' : 'cleared');
      return { ok: true };
    default:
      return { ok: false, error: 'Unknown change.' };
  }
}

function receiptsFolder_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('RECEIPTS_FOLDER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var f = DriveApp.createFolder('169-E Rent receipts');
  p.setProperty('RECEIPTS_FOLDER', f.getId());
  return f;
}

function upload_(b) {
  if (['pay', 'claim'].indexOf(b.kind) < 0) return { ok: false, error: 'Unknown attachment.' };
  if (!/^image\/(jpeg|png)$/.test(b.mime || '')) return { ok: false, error: 'Only photos can be attached.' };
  if (!b.b64 || b.b64.length > 8 * 1024 * 1024) return { ok: false, error: 'That photo is too large.' };
  if (!b.req_id || !b.ref_key) return { ok: false, error: 'Missing details.' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var files = readRows_('FILES');
    var dup = files.filter(function (f) { return f.req_id === b.req_id; })[0];
    if (dup) return { ok: true, dup: true, file_id: dup.file_id };
    var tab = b.kind === 'pay' ? 'PAYMENTS' : 'CLAIMS', keyField = b.kind === 'pay' ? 'req_id' : 'key';
    var parent = readRows_(tab).filter(function (r) { return String(r[keyField]) === String(b.ref_key); })[0];
    if (!parent) return { ok: false, retry: true, error: 'The record for this photo has not reached the sheet yet.' };
    var pid = b.kind === 'pay' ? parent.pay_id : parent.claim_id;
    var bytes = Utilities.base64Decode(b.b64);
    var n = files.filter(function (f) { return f.ref_key === String(b.ref_key); }).length + 1;
    var name = pid + '_' + parent.date + '_' + n + (b.mime === 'image/png' ? '.png' : '.jpg');
    var file = receiptsFolder_().createFile(Utilities.newBlob(bytes, b.mime, name));
    var row = { file_id: nextId_(files, 'file_id', 'F'), kind: b.kind, ref_key: String(b.ref_key), drive_id: file.getId(),
      name: name, mime: b.mime, bytes: bytes.length, uploaded_at: nowStamp_(), req_id: b.req_id };
    append_('FILES', [row]);
    log_('photo saved', name);
    return { ok: true, file_id: row.file_id, name: name };
  } finally {
    lock.releaseLock();
  }
}

function getFile_(b) {
  var f = readRows_('FILES').filter(function (x) { return x.file_id === b.file_id; })[0];
  if (!f) return { ok: false, error: 'Photo not found.' };
  var blob = DriveApp.getFileById(f.drive_id).getBlob();
  return { ok: true, mime: f.mime, b64: Utilities.base64Encode(blob.getBytes()) };
}

// ---------- tenant page ----------
function setTenantKey_(k) {
  var p = PropertiesService.getScriptProperties();
  if (k) p.setProperty('TENANT_KEY', k); else p.deleteProperty('TENANT_KEY');
  log_(k ? 'tenant page link made' : 'tenant page turned off', '');
}

function tenantLink_() {
  var p = PropertiesService.getScriptProperties(), k = p.getProperty('TENANT_KEY'), url = p.getProperty('WEBAPP_URL');
  if (!k || !url) return '';
  return PAGES_URL + '#' + Utilities.base64EncodeWebSafe(url).replace(/=+$/, '') + '.' + k;
}

function tenantPage_(b) {
  var p = PropertiesService.getScriptProperties(), k = p.getProperty('TENANT_KEY');
  if (!k || String(b.key || '') !== k) return { ok: false, code: 403, error: 'This link is switched off. Please ask for a new one.' };
  var D = loadData_(), L = computeLedger_(D, today_());
  var last = p.getProperty('TENANT_LAST_VIEW') || '', now = nowStamp_();
  if (!last || now.slice(0, 13) !== last.slice(0, 13)) { p.setProperty('TENANT_LAST_VIEW', now); log_('tenant page opened', ''); }
  var V = tenantView_(D, L);
  return { ok: true, data: V.D, ledger: V.L, today: L.today };
}

function tenantLinkMenu() {
  var ui = SpreadsheetApp.getUi(), p = PropertiesService.getScriptProperties();
  if (!webAppUrl_(ui, false)) return;
  if (!p.getProperty('TENANT_KEY')) setTenantKey_(rand_(24));
  else if (ui.alert('Tenant page link', 'Keep the current link, or make a new one? A new link stops the old one working.\n\nOK = keep it, Cancel = make a new one.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) setTenantKey_(rand_(24));
  var link = tenantLink_(), last = p.getProperty('TENANT_LAST_VIEW');
  ui.showModalDialog(HtmlService.createHtmlOutput('<div style="font-family:Arial;font-size:14px"><p>Send this link to the tenant. Anyone with it can see this year\'s rent, payments, receipts and maintenance. Nothing else.</p>' +
    '<textarea readonly style="width:100%;height:80px" onclick="this.select()">' + link + '</textarea>' +
    '<p>' + (last ? 'Last opened: ' + last : 'Not opened yet.') + '</p></div>').setWidth(440).setHeight(250), 'Tenant page');
}

function tenantOffMenu() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert('Turn off the tenant page? The link stops working at once.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  setTenantKey_('');
  ui.alert('Tenant page turned off.');
}


// ---------- updates that install themselves (asked for by the owner's phone; no visit to the Sheet) ----------
var SELF_URL = 'https://raw.githubusercontent.com/IR1S-VIR1S/rent-169e/main/script/Rent.gs';
function verNum_(v) { var p = String(v || '').split('.'); return (+p[0] || 0) * 1e6 + (+p[1] || 0) * 1e3 + (+p[2] || 0); }
function selfCode_(p, prefix) { var n = +p.getProperty(prefix + 'N') || 0, s = ''; for (var i = 0; i < n; i++) s += p.getProperty(prefix + i) || ''; return s; }
function selfWrite_(p, prefix, code) {
  var old = +p.getProperty(prefix + 'N') || 0, n = Math.ceil(code.length / 7000), all = {};
  for (var i = 0; i < n; i++) all[prefix + i] = code.slice(i * 7000, (i + 1) * 7000);
  all[prefix + 'N'] = String(n);
  p.setProperties(all);
  for (var j = n; j < old; j++) p.deleteProperty(prefix + j);
}
function selfUpdate_(by) {
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty('CODE_N')) return { ok: false, error: 'This workbook was not installed with the Loader, so it cannot update itself.' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'The workbook is busy. It will try again.' };
  try {
    var r;
    try { r = UrlFetchApp.fetch(SELF_URL + '?t=' + Date.now(), { muteHttpExceptions: true, followRedirects: true }); }
    catch (e) { return { ok: false, error: 'Could not reach GitHub. Nothing was changed.' }; }
    if (r.getResponseCode() !== 200) return { ok: false, error: 'Could not download the update (GitHub said ' + r.getResponseCode() + '). Nothing was changed.' };
    var code = r.getContentText(), x;
    try {
      x = (new Function(code + '\n;return exports_();'))();
      ['setup', 'setupQuiet', 'doPost', 'doGet', 'MENU_ITEMS', 'VERSION'].forEach(function (k) { if (!x || x[k] === undefined) throw new Error('missing ' + k); });
    } catch (e2) { return { ok: false, error: 'The published update is broken (' + e2.message + '). Nothing was changed.' }; }
    if (verNum_(x.VERSION) <= verNum_(VERSION)) return { ok: true, updated: false, version: VERSION };
    var cur = selfCode_(p, 'CODE_'), curSha = p.getProperty('CODE_SHA') || '', curMenu = p.getProperty('MENU_JSON') || '[]';
    selfWrite_(p, 'CODE_', code);
    p.setProperty('CODE_SHA', sha_(code).slice(0, 8));
    p.setProperty('MENU_JSON', JSON.stringify(x.MENU_ITEMS.map(function (m) { return m.label; })));
    try { x.setupQuiet(); }
    catch (e3) {
      selfWrite_(p, 'CODE_', cur); p.setProperty('CODE_SHA', curSha); p.setProperty('MENU_JSON', curMenu);
      log_('self update failed, put back', VERSION + ' kept: ' + String(e3 && e3.message || e3));
      return { ok: false, error: 'The update could not be set up, so version ' + VERSION + ' was kept.' };
    }
    selfWrite_(p, 'PREV_', cur); p.setProperty('PREV_SHA', curSha);
    log_('updated itself', VERSION + ' to ' + x.VERSION + (by ? ', asked by ' + by : ''));
    return { ok: true, updated: true, from: VERSION, version: x.VERSION };
  } finally { lock.releaseLock(); }
}

function exports_() {
  return {
    VERSION: VERSION, RELEASE_NOTE: RELEASE_NOTE, MENU_ITEMS: MENU_ITEMS,
    setup: setup, setupQuiet: setupCore_, refreshMenu: refreshMenu, pairPhone: pairPhone, changeWebAppUrl: changeWebAppUrl,
    disconnectAll: disconnectAll, tenantLinkMenu: tenantLinkMenu, tenantOffMenu: tenantOffMenu, doPost: doPost, doGet: doGet
  };
}
