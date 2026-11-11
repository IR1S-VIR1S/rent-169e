/* GENERATED from Rent.gs shared slice. Do not edit. */
//== SHARED START
var CFG = {
  APP_NAME: '169-E Rent',
  SCHEMA_VER: 1,
  INTO: ['Sehrish HBL', 'Irfan ABL', 'Cash (with receipt)'],
  BY: ['Tenant', 'Family', 'Other'],
  MAX_AMOUNT: 10000000,
  EARLIEST: '2019-01-01',
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
  var y = +mk.slice(0, 4), m = +mk.slice(5, 7);
  return CFG.MONTHS[m - 1] + ' ' + y;
}

/**
 * The whole rent ledger, worked out the same way on the phone and in the sheet.
 * D: {tenancy:{start, security}, rates:[{from:'YYYY-MM', rent, due_day}],
 *     payments:[{date, amount}], adjustments:[{date, kind:'credit'|'charge', amount}]}
 * A month counts as due once its due date has passed or is today.
 */
function computeLedger_(D, today) {
  var st = ymdParts_(D.tenancy.start);
  var curMonth = today.slice(0, 7), curYear = +today.slice(0, 4);
  var years = {}, months = [];
  function yr(y) {
    return years[y] || (years[y] = { year: y, due: 0, paid: 0, rent: 0, months: 0, credits: 0, charges: 0 });
  }
  var y = st.y, m = st.m, guard = 0;
  while (guard++ < 2400) {
    var mk = y + '-' + pad2_(m);
    if (mk > curMonth) break;
    var r = rateFor_(D.rates, mk);
    if (r) {
      var dd = Math.min(r.due_day || 1, daysInMonth_(y, m));
      var due = mk + '-' + pad2_(dd);
      if (due <= today) {
        months.push({ month: mk, year: y, rent: r.rent, due: due });
        var Y = yr(y);
        Y.due += r.rent; Y.rent += r.rent; Y.months++;
      }
    }
    m++; if (m > 12) { m = 1; y++; }
  }
  if (D.tenancy.security) yr(st.y).due += +D.tenancy.security;
  (D.adjustments || []).forEach(function (a) {
    if (!a.date || a.date > today) return;
    var Y = yr(+a.date.slice(0, 4)), amt = +a.amount || 0;
    if (a.kind === 'charge') { Y.due += amt; Y.charges += amt; } else { Y.due -= amt; Y.credits += amt; }
  });
  var pays = (D.payments || []).filter(function (p) { return p.date && +p.amount; })
    .slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  pays.forEach(function (p) { yr(+p.date.slice(0, 4)).paid += +p.amount; });
  yr(curYear);

  // Per month: paid in that calendar month, and on time = within its own year,
  // everything due so far was covered by the due date.
  var cumDueByYear = {};
  months.forEach(function (mo) {
    cumDueByYear[mo.year] = (cumDueByYear[mo.year] || 0) + mo.rent;
    var paidBy = 0, paidIn = 0;
    pays.forEach(function (p) {
      if (+p.date.slice(0, 4) === mo.year && p.date <= mo.due) paidBy += +p.amount;
      if (p.date.slice(0, 7) === mo.month) paidIn += +p.amount;
    });
    mo.paidInMonth = paidIn;
    mo.onTime = paidBy >= cumDueByYear[mo.year];
    var paidYearToDate = 0;
    pays.forEach(function (p) {
      if (+p.date.slice(0, 4) === mo.year && p.date.slice(0, 7) <= mo.month) paidYearToDate += +p.amount;
    });
    mo.yearBalanceAfter = cumDueByYear[mo.year] - paidYearToDate;
  });

  var list = Object.keys(years).map(function (k) { return years[k]; })
    .sort(function (a, b) { return a.year - b.year; });
  var cum = 0;
  list.forEach(function (Y) { Y.arrearsBefore = cum; Y.balance = Y.due - Y.paid; cum += Y.balance; });
  var cur = years[curYear];
  return {
    today: today,
    months: months,
    years: list,
    year: curYear,
    cur: cur,
    arrearsBefore: cur.arrearsBefore,
    yearBalance: cur.balance,
    total: cum,
    avgPaid: cur.months ? cur.paid / cur.months : 0,
    paidTotal: pays.reduce(function (s, p) { return s + (+p.amount); }, 0)
  };
}

function validatePayment_(p, today) {
  if (!isYmd_(p.date)) return 'Enter the date the money was received.';
  if (p.date < CFG.EARLIEST) return 'That date is too early.';
  if (p.date > addDaysYmd_(today, 1)) return 'The date cannot be in the future.';
  var a = Number(p.amount);
  if (!(a > 0) || Math.round(a) !== a) return 'Enter the amount in whole rupees.';
  if (a > CFG.MAX_AMOUNT) return 'That amount looks too large. Check it.';
  if (CFG.INTO.indexOf(p.into) < 0) return 'Choose where it was received.';
  if (CFG.BY.indexOf(p.by) < 0) return 'Choose who paid.';
  if (p.eur !== undefined && p.eur !== '' && p.eur !== null) {
    var e = Number(p.eur);
    if (!(e > 0) || e > 100000) return 'Check the euro amount.';
  }
  if (p.note && String(p.note).length > 300) return 'Keep the note under 300 characters.';
  return '';
}

function salut_(D) { return (D.tenancy && D.tenancy.salutation) || 'Sir'; }

function byLabel_(D, by) { return by === 'Tenant' && D.tenancy && D.tenancy.tenant ? D.tenancy.tenant : by; }

function balanceMessage_(D, L, pay, opts) {
  opts = opts || {};
  var lines = ['Assalam o Alaikum ' + salut_(D) + ',', ''];
  if (pay) lines.push('Received ' + fmtRs_(pay.amount) + ' on ' + fmtDate_(pay.date) + '. Thank you.', '');
  if (L.yearBalance > 0) lines.push('Remaining for ' + L.year + ': ' + fmtRs_(L.yearBalance) + '.');
  else if (L.yearBalance === 0) lines.push('Rent for ' + L.year + ' is clear up to now.');
  else lines.push('You are ' + fmtRs_(-L.yearBalance) + ' ahead for ' + L.year + '.');
  if (opts.arrears && L.arrearsBefore > 0) {
    lines.push('Earlier arrears (up to Dec ' + (L.year - 1) + '): ' + fmtRs_(L.arrearsBefore) + ', separate.');
  }
  lines.push('', 'JazakAllah');
  return lines.join('\n');
}

function reminderMessage_(D, L, today) {
  var mk = today.slice(0, 7), r = rateFor_(D.rates, mk);
  if (!r) return '';
  var y = +mk.slice(0, 4), m = +mk.slice(5, 7);
  var dd = Math.min(r.due_day || 1, daysInMonth_(y, m));
  var due = mk + '-' + pad2_(dd);
  var lines = ['Assalam o Alaikum ' + salut_(D) + ',', '',
    'A reminder that rent of ' + fmtRs_(r.rent) + ' for ' + monthName_(mk) + ' is due by ' + dd + ' ' + CFG.MONTHS[m - 1] + '.'];
  var bal = L.yearBalance;
  if (due <= today) {
    var thisMonth = L.months.filter(function (x) { return x.month === mk; })[0];
    if (thisMonth) bal -= thisMonth.rent;
  }
  if (bal > 0) lines.push('', 'Balance for ' + L.year + ' before this month: ' + fmtRs_(bal) + '.');
  lines.push('', 'JazakAllah');
  return lines.join('\n');
}

