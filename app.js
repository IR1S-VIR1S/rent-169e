/* 169-E Rent: offline iPhone app. Rules come from logic.js (generated from the sheet script). */
'use strict';
var BUILD_ID = 'ba5d85d8';
var STORE = 'r169.v1';
var IDLE_MS = 5 * 60 * 1000;

var T = { screen: 'boot', key: null, S: null, syncing: false, err: '', form: null, msg: null, stmt: null, sheet: null, idleAt: Date.now() };

// ---------- small helpers ----------
function el(tag, attrs) {
  var e = document.createElement(tag);
  var kids = Array.prototype.slice.call(arguments, 2);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  });
  kids.forEach(function add(k) {
    if (k === null || k === undefined || k === false) return;
    if (Array.isArray(k)) return k.forEach(add);
    e.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
  });
  return e;
}
function svg(path) {
  var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  path.split('|').forEach(function (d) { var p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.appendChild(p); });
  return s;
}
var ICONS = {
  home: 'M3 11l9-8 9 8|M5 10v10h14V10',
  list: 'M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  plus: 'M12 5v14|M5 12h14',
  sync: 'M21 12a9 9 0 1 1-3-6.7L21 8|M21 3v5h-5'
};
function toast(t) {
  var old = document.querySelector('.toast'); if (old) old.remove();
  var d = el('div', { class: 'toast', role: 'status', text: t }); document.body.appendChild(d);
  setTimeout(function () { d.remove(); }, 2600);
}
function todayPk() {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  catch (e) { var d = new Date(); return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate()); }
}
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  var a = crypto.getRandomValues(new Uint8Array(16));
  return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}
function eur(n) { var r = Number(T.S.settings.eurRate) || 0; return r > 0 ? '≈ €' + groupNum_(n / r) : ''; }

// ---------- encrypted storage ----------
function b64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function deriveKey(pin, salt) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']).then(function (base) {
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, base,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  });
}
function stored() { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { return null; } }
function saveState() {
  if (!T.key || !T.S) return Promise.resolve();
  var iv = crypto.getRandomValues(new Uint8Array(12)), st = stored();
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, T.key, new TextEncoder().encode(JSON.stringify(T.S))).then(function (ct) {
    localStorage.setItem(STORE, JSON.stringify({ v: 1, salt: st.salt, iv: b64(iv), ct: b64(ct) }));
  });
}
function unlock(pin) {
  var st = stored();
  return deriveKey(pin, unb64(st.salt)).then(function (key) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(st.iv) }, key, unb64(st.ct)).then(function (pt) {
      T.key = key; T.S = JSON.parse(new TextDecoder().decode(pt));
    });
  });
}
function lock() {
  T.key = null; T.S = null; T.form = null; T.msg = null; T.stmt = null; T.sheet = null;
  T.screen = stored() ? 'unlock' : 'join'; render();
}

// ---------- server ----------
function api(body) {
  var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, 25000);
  return fetch(T.S ? T.S.api : T.joinApi, { method: 'POST', body: JSON.stringify(body), redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal })
    .then(function (r) { return r.json(); })
    .finally(function () { clearTimeout(timer); });
}
function sync(quiet) {
  if (T.syncing || !T.S || !T.S.token) return Promise.resolve();
  if (!navigator.onLine) { if (!quiet) toast('No signal. Saved on this phone.'); softRender(); return Promise.resolve(); }
  T.syncing = true; renderTop();
  var S = T.S, items = S.outbox.filter(function (x) { return !x.error; });
  var p = items.length ? api({ op: 'push', token: S.token, items: items }) : Promise.resolve({ ok: true, results: [] });
  return p.then(function (r) {
    if (!r.ok) throw r;
    (r.results || []).forEach(function (res) {
      var i = S.outbox.findIndex(function (x) { return x.req_id === res.req_id; });
      if (i < 0) return;
      if (res.ok) S.outbox.splice(i, 1); else S.outbox[i].error = res.error;
    });
    return api({ op: 'pull', token: S.token });
  }).then(function (r) {
    if (!r.ok) throw r;
    if (T.S !== S) return;
    S.data = r.data; S.lastSync = Date.now(); S.syncErr = '';
    return saveState();
  }).catch(function (e) {
    if (T.S === S) S.syncErr = (e && e.error) || 'Could not reach the sheet. Will try again.';
    if (e && e.code === 401) S.syncErr = 'This phone was disconnected. Pair it again from the sheet.';
  }).finally(function () {
    T.syncing = false;
    if (T.S === S) softRender(); else renderTop();
  });
}

// ---------- data view (server copy plus unsent changes) ----------
function view() {
  var S = T.S, D = JSON.parse(JSON.stringify(S.data));
  var dels = {};
  S.outbox.forEach(function (o) { if (o.op === 'del') dels[o.pay_id] = 1; });
  D.payments = D.payments.filter(function (p) { return !dels[p.pay_id]; });
  S.outbox.forEach(function (o) {
    if (o.op === 'pay') D.payments.push({ pay_id: '', req_id: o.req_id, date: o.date, amount: o.amount, into: o.into, by: o.by, eur: o.eur, note: o.note, pending: true, error: o.error });
  });
  var today = todayPk();
  return { D: D, L: computeLedger_(D, today), today: today };
}

// ---------- rendering ----------
function render() {
  var app = document.getElementById('app');
  var bar = T.S && ['home', 'pays', 'settings'].indexOf(T.screen) >= 0;
  app.className = bar ? '' : 'nobar';
  var fn = SCREENS[T.screen] || SCREENS.boot;
  app.replaceChildren(fn());
  document.querySelectorAll('.bar,.fab,.sheet-bg').forEach(function (x) { x.remove(); });
  if (bar) document.body.appendChild(barEl());
  if (bar && T.screen !== 'settings') document.body.appendChild(el('button', { class: 'fab', id: 'fab', onclick: openAdd }, svg(ICONS.plus), 'Add payment'));
  if (T.sheet) document.body.appendChild(T.sheet());
}
function softRender() { if (T.screen === 'add' || T.sheet) renderTop(); else render(); }
function renderTop() {
  var s = document.getElementById('syncpill');
  if (s && T.S) s.replaceWith(syncPill());
}
function go(screen) { T.screen = screen; render(); window.scrollTo(0, 0); }
function barEl() {
  function b(id, icon, label) {
    return el('button', { class: T.screen === id ? 'on' : '', 'aria-label': label, onclick: function () { go(id); } }, svg(ICONS[icon]), label);
  }
  return el('nav', { class: 'bar' }, b('home', 'home', 'Home'), b('pays', 'list', 'Payments'), b('settings', 'gear', 'Settings'));
}
function syncPill() {
  var S = T.S, n = S.outbox.length, t;
  if (T.syncing) t = 'Syncing…';
  else if (!navigator.onLine) t = n ? 'Offline, ' + n + ' waiting' : 'Offline';
  else if (S.syncErr) t = 'Not synced';
  else if (n) t = n + ' waiting';
  else t = S.lastSync ? 'Synced ' + new Date(S.lastSync).toTimeString().slice(0, 5) : 'Not synced yet';
  return el('button', { class: 'sync', id: 'syncpill', 'aria-label': 'Sync now', onclick: function () { sync(); } }, svg(ICONS.sync), t);
}
function topBar(title) { return el('div', { class: 'top' }, el('div', { class: 'title', text: title }), syncPill()); }

var SCREENS = {};
SCREENS.boot = function () { return el('p', { class: 'muted', text: 'Loading…' }); };

SCREENS.join = function () {
  var ta, err = el('div', { class: 'err', id: 'joinerr' });
  function connect() {
    var v = ta.value.trim(), m = /^RENT1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9]+)$/.exec(v);
    if (!m) { err.textContent = 'That does not look like a pairing code. Copy the whole line from the e-mail.'; return; }
    var url;
    try { url = atob(m[1].replace(/-/g, '+').replace(/_/g, '/')); } catch (e) { url = ''; }
    if (!/^https?:\/\//.test(url)) { err.textContent = 'The code is damaged. Make a new one.'; return; }
    T.joinApi = url; err.textContent = 'Connecting…';
    api({ op: 'join', code: m[2] }).then(function (r) {
      if (!r.ok) { err.textContent = r.error || 'Could not pair.'; return; }
      T.pending = { api: url, token: r.token }; go('setpin');
    }).catch(function () { err.textContent = 'No connection to the sheet. Check the signal and try again.'; });
  }
  return el('div', null,
    el('h1', { text: '169-E Rent' }),
    el('p', { text: 'Pair this phone with your rent sheet.' }),
    el('div', { class: 'note' }, 'On iPhone, first add this page to your Home Screen (Share, then Add to Home Screen) and open it from there, then pair.'),
    el('label', { class: 'f', for: 'code', text: 'Pairing code from your e-mail' }),
    ta = el('textarea', { id: 'code', placeholder: 'RENT1…', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' }),
    el('button', { class: 'btn wide', onclick: function () {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { ta.value = t.trim(); }).catch(function () { });
    } }, 'Paste code'),
    el('button', { class: 'btn primary wide', id: 'connect', onclick: connect }, 'Connect'),
    err);
};

SCREENS.setpin = function () {
  var a, b, err = el('div', { class: 'err' });
  function done() {
    if (!/^\d{4,6}$/.test(a.value)) { err.textContent = 'Use 4 to 6 digits.'; return; }
    if (a.value !== b.value) { err.textContent = 'The two PINs do not match.'; return; }
    var salt = crypto.getRandomValues(new Uint8Array(16));
    deriveKey(a.value, salt).then(function (key) {
      localStorage.setItem(STORE, JSON.stringify({ v: 1, salt: b64(salt), iv: '', ct: '' }));
      T.key = key;
      T.S = { api: T.pending.api, token: T.pending.token, data: null, outbox: [], lastSync: 0, syncErr: '',
        settings: { eurRate: 310.7, arrearsInMsg: false } };
      T.pending = null;
      return saveState();
    }).then(function () { T.screen = 'loading'; render(); return sync(true); }).then(function () {
      go(T.S && T.S.data ? 'home' : 'loading');
    });
  }
  return el('div', null,
    el('h1', { text: 'Choose a PIN' }),
    el('p', { text: 'The PIN locks the rent data on this phone. It is never sent anywhere.' }),
    el('label', { class: 'f', for: 'pin1', text: 'PIN (4 to 6 digits)' }),
    a = el('input', { id: 'pin1', class: 'pin', type: 'password', inputmode: 'numeric', autocomplete: 'off', maxlength: '6' }),
    el('label', { class: 'f', for: 'pin2', text: 'Type it again' }),
    b = el('input', { id: 'pin2', class: 'pin', type: 'password', inputmode: 'numeric', autocomplete: 'off', maxlength: '6' }),
    el('button', { class: 'btn primary wide', id: 'savepin', onclick: done }, 'Save PIN'), err);
};

SCREENS.loading = function () {
  var S = T.S;
  return el('div', null, el('h1', { text: '169-E Rent' }),
    el('p', { text: S && S.syncErr ? S.syncErr : 'Downloading your rent records…' }),
    S && S.syncErr ? el('button', { class: 'btn primary wide', onclick: function () { sync().then(function () { if (T.S.data) go('home'); }); } }, 'Try again') : null);
};

SCREENS.unlock = function () {
  var p, err = el('div', { class: 'err' });
  function tryIt() {
    if (T.waitUntil && Date.now() < T.waitUntil) { err.textContent = 'Wait a few seconds and try again.'; return; }
    unlock(p.value).then(function () {
      T.fails = 0; T.idleAt = Date.now();
      go(T.S.data ? 'home' : 'loading'); sync(true);
    }).catch(function () {
      T.fails = (T.fails || 0) + 1; p.value = '';
      if (T.fails >= 5) T.waitUntil = Date.now() + 30000;
      err.textContent = 'Wrong PIN.';
    });
  }
  setTimeout(function () { if (p) p.focus(); }, 50);
  return el('div', null,
    el('h1', { text: '169-E Rent' }),
    el('label', { class: 'f', for: 'pin', text: 'Enter your PIN' }),
    p = el('input', { id: 'pin', class: 'pin', type: 'password', inputmode: 'numeric', autocomplete: 'off', maxlength: '6',
      onkeydown: function (e) { if (e.key === 'Enter') tryIt(); } }),
    el('button', { class: 'btn primary wide', id: 'unlockbtn', onclick: tryIt }, 'Unlock'), err,
    el('button', { class: 'btn wide', onclick: forgotPin }, 'Forgot PIN'));
};
function forgotPin() {
  if (!confirm('Reset this phone? You will need a new pairing code from the sheet. Payments not yet sent from this phone will be lost.')) return;
  localStorage.removeItem(STORE); lock();
}

SCREENS.home = function () {
  var v = view(), L = v.L, D = v.D, Y = L.cur, yr = L.year;
  var hero = el('div', { class: 'card hero' + (L.yearBalance <= 0 ? ' clear' : ''), id: 'hero' },
    el('div', { class: 'lbl', text: yr + ' balance' }),
    el('div', { class: 'big', id: 'yearbal', text: fmtRs_(Math.max(L.yearBalance, 0)) }),
    el('div', { class: 'sub', text: (L.yearBalance > 0 ? eur(L.yearBalance) + ' · ' : (L.yearBalance < 0 ? fmtRs_(-L.yearBalance) + ' ahead · ' : 'Clear · ')) +
      'Due ' + groupNum_(Y.rent) + ', received ' + groupNum_(Y.paid) }));
  var mk = v.today.slice(0, 7), r = rateFor_(D.rates, mk), thisM = L.months.filter(function (m) { return m.month === mk; })[0];
  var status;
  if (!thisM) status = el('span', { class: 'chip wait', text: 'Not due yet' });
  else if (thisM.onTime) status = el('span', { class: 'chip ok', text: 'Paid on time' });
  else status = el('span', { class: 'chip late', text: 'Late' });
  var dueDay = r ? Math.min(r.due_day || 1, daysInMonth_(+mk.slice(0, 4), +mk.slice(5, 7))) : '';
  var cells = [];
  for (var m = 1; m <= 12; m++) {
    var k = yr + '-' + pad2_(m), mo = L.months.filter(function (x) { return x.month === k; })[0];
    var paidIn = (D.payments || []).filter(function (p) { return p.date.slice(0, 7) === k; }).reduce(function (s, p) { return s + (+p.amount); }, 0);
    var cls = !mo ? 'future' : mo.onTime ? 'ontime' : paidIn > 0 ? 'paid' : 'nil';
    if (!mo && paidIn > 0) cls = 'paid';
    cells.push(el('div', { class: 'm ' + cls }, el('b', { text: CFG.MONTHS[m - 1].slice(0, 3) }), !mo && !paidIn ? '·' : paidIn ? groupNum_(paidIn) : 'Nil'));
  }
  var recent = D.payments.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 4);
  return el('div', null,
    topBar('169-E Rent'),
    T.S.syncErr ? el('div', { class: 'note', text: T.S.syncErr }) : null,
    hero,
    el('div', { class: 'two' },
      el('div', { class: 'card stat' }, el('div', { class: 'lbl', text: 'Arrears to Dec ' + (yr - 1) }), el('div', { class: 'val', id: 'arrears', text: fmtRs_(L.arrearsBefore) })),
      el('div', { class: 'card stat' }, el('div', { class: 'lbl', text: 'Total outstanding' }), el('div', { class: 'val', id: 'total', text: fmtRs_(L.total) }))),
    el('div', { class: 'card' },
      el('div', { class: 'row' },
        el('div', null, el('b', { text: monthName_(mk) }), el('div', { class: 'sm', text: r ? fmtRs_(r.rent) + ' due by ' + dueDay + ' ' + CFG.MONTHS[+mk.slice(5, 7) - 1].slice(0, 3) : '' })),
        status),
      el('div', { class: 'row' }, el('div', { class: 'sm', text: 'Average paid per month in ' + yr }), el('div', { class: 'amt', text: fmtRs_(L.avgPaid) }))),
    el('h2', { text: 'Received in ' + yr }),
    el('div', { class: 'grid', id: 'grid' }, cells),
    el('div', { class: 'legend' }, 'Green: on time \u00b7 Blue: paid, but late \u00b7 Red: nothing paid'),
    el('h2', { text: 'Send to tenant' }),
    el('div', { class: 'actions' },
      el('button', { class: 'btn sand', id: 'b-balance', onclick: function () { openMsg('balance', null); } }, 'Balance message'),
      el('button', { class: 'btn sand', id: 'b-remind', onclick: function () { openMsg('remind'); } }, 'Reminder text'),
      el('button', { class: 'btn sand', id: 'b-stmt', onclick: openStatement }, 'Statement image')),
    el('h2', { text: 'Latest payments' }),
    el('div', { class: 'card list' }, recent.length ? recent.map(payRow) : el('p', { class: 'muted', text: 'None yet.' })));
};

function payRow(p) {
  return el('button', { class: 'row', onclick: function () { openPay(p); } },
    el('div', null, el('div', { text: fmtDate_(p.date) }),
      el('div', { class: 'sm', text: [p.into, p.by].filter(Boolean).join(' · ') }),
      p.pending ? el('div', { class: 'pending', text: p.error ? 'Refused: ' + p.error : 'Waiting to send' }) : null),
    el('div', { class: 'amt', text: fmtRs_(p.amount) }));
}

SCREENS.pays = function () {
  var v = view(), L = v.L, byYear = {};
  v.D.payments.forEach(function (p) { (byYear[p.date.slice(0, 4)] = byYear[p.date.slice(0, 4)] || []).push(p); });
  var years = Object.keys(byYear).sort().reverse();
  return el('div', null, topBar('Payments'),
    el('p', { class: 'muted', text: v.D.payments.length + ' payments, ' + fmtRs_(L.paidTotal) + ' in all (security included).' }),
    years.map(function (y) {
      var ps = byYear[y].sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      var Ye = L.years.filter(function (x) { return String(x.year) === y; })[0];
      return [el('div', { class: 'yearhead' }, el('span', { text: y }), el('span', { text: fmtRs_(Ye ? Ye.paid : 0) })),
        el('div', { class: 'card list' }, ps.map(payRow))];
    }));
};

function openPay(p) {
  T.sheet = function () {
    var reason;
    function close() { T.sheet = null; render(); }
    return el('div', { class: 'sheet-bg', onclick: function (e) { if (e.target === e.currentTarget) close(); } },
      el('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Payment' },
        el('h2', { text: fmtRs_(p.amount) + ' on ' + fmtDate_(p.date) }),
        el('p', { class: 'muted', text: [p.into, p.by, p.eur ? '€' + p.eur + ' sent' : '', p.pay_id].filter(Boolean).join(' · ') }),
        p.note ? el('p', { text: p.note }) : null,
        el('button', { class: 'btn wide', onclick: function () { T.sheet = null; openMsg('balance', p); } }, 'Send balance message for this payment'),
        el('label', { class: 'f', for: 'delreason', text: 'Delete this payment (entered by mistake)' }),
        reason = el('input', { id: 'delreason', placeholder: 'Reason, for example typed twice' }),
        el('button', { class: 'btn danger wide', id: 'delbtn', onclick: function () {
          if (!reason.value.trim()) { reason.focus(); toast('Give a reason first.'); return; }
          if (p.pending) T.S.outbox = T.S.outbox.filter(function (o) { return o.req_id !== p.req_id; });
          else T.S.outbox.push({ op: 'del', req_id: uuid(), pay_id: p.pay_id, reason: reason.value.trim() });
          T.sheet = null; saveState().then(function () { render(); toast('Deleted.'); sync(true); });
        } }, 'Delete'),
        el('button', { class: 'btn wide', onclick: close }, 'Close')));
  };
  render();
}

// ---------- add payment ----------
function openAdd() {
  T.form = { date: todayPk(), amount: '', eur: '', into: 'Sehrish HBL', by: 'Kashif', note: '' };
  T.err = ''; go('add');
}
SCREENS.add = function () {
  var f = T.form, amtHint = el('div', { class: 'hint', id: 'amthint' }), err = el('div', { class: 'err', id: 'adderr', text: T.err });
  function hint() { var a = Number(f.amount); amtHint.textContent = a > 0 ? fmtRs_(a) + '  ' + eur(a) : ''; }
  function chips(list, key) {
    return el('div', { class: 'chips', id: 'chips-' + key }, list.map(function (x) {
      return el('button', { class: f[key] === x ? 'on' : '', type: 'button', onclick: function (e) {
        f[key] = x; e.currentTarget.parentNode.querySelectorAll('button').forEach(function (b) { b.className = b.textContent === x ? 'on' : ''; });
      } }, x);
    }));
  }
  var amount = el('input', { id: 'amount', inputmode: 'numeric', autocomplete: 'off', placeholder: 'e.g. 200000', value: f.amount,
    oninput: function (e) { f.amount = e.target.value.replace(/[^\d]/g, ''); if (e.target.value !== f.amount) e.target.value = f.amount; hint(); } });
  hint();
  function save() {
    var p = { op: 'pay', req_id: uuid(), date: f.date, amount: Number(f.amount), into: f.into, by: f.by,
      eur: f.eur === '' ? '' : Number(f.eur), note: f.note.trim() };
    var e = validatePayment_(p, todayPk());
    if (e) { T.err = e; err.textContent = e; return; }
    T.S.outbox.push(p); T.form = null; T.err = '';
    saveState().then(function () {
      openMsg('balance', p);
      sync(true);
      toast(navigator.onLine ? 'Saved.' : 'Saved on this phone. It will send when there is signal.');
    });
  }
  return el('div', null,
    el('button', { class: 'back', onclick: function () { T.form = null; go('home'); } }, '‹ Back'),
    el('h1', { text: 'Add payment' }),
    el('label', { class: 'f', for: 'date', text: 'Date received' }),
    el('input', { id: 'date', type: 'date', value: f.date, max: todayPk(), oninput: function (e) { f.date = e.target.value; } }),
    el('label', { class: 'f', for: 'amount', text: 'Amount received (Rs)' }), amount, amtHint,
    el('label', { class: 'f', text: 'Received into' }), chips(CFG.INTO, 'into'),
    el('label', { class: 'f', text: 'Paid by' }), chips(CFG.BY, 'by'),
    el('label', { class: 'f', for: 'eur', text: 'Euros he sent (optional)' }),
    el('input', { id: 'eur', inputmode: 'decimal', autocomplete: 'off', value: f.eur, oninput: function (e) { f.eur = e.target.value.replace(/[^\d.]/g, ''); } }),
    el('label', { class: 'f', for: 'note', text: 'Note (optional)' }),
    el('textarea', { id: 'note', maxlength: '300', oninput: function (e) { f.note = e.target.value; } }, f.note),
    el('button', { class: 'btn primary wide', id: 'savepay', onclick: save }, 'Save payment'), err);
};

// ---------- messages ----------
function openMsg(kind, pay) {
  T.msg = { kind: kind, pay: pay, arrears: !!T.S.settings.arrearsInMsg }; go('message');
}
SCREENS.message = function () {
  var v = view(), M = T.msg, text;
  if (M.kind === 'balance') {
    var pay = M.pay;
    if (!pay) pay = v.D.payments.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0] || null;
    text = balanceMessage_(v.D, v.L, pay, { arrears: M.arrears });
  } else text = reminderMessage_(v.D, v.L, v.today);
  return el('div', null,
    el('button', { class: 'back', onclick: function () { T.msg = null; go('home'); } }, '‹ Done'),
    el('h1', { text: M.kind === 'balance' ? 'Balance message' : 'Reminder text' }),
    M.kind === 'balance' ? el('label', { class: 'switch', for: 'inclarr' }, el('span', { text: 'Include earlier arrears' }),
      el('input', { id: 'inclarr', type: 'checkbox', checked: M.arrears, onchange: function (e) { M.arrears = e.target.checked; render(); } })) : null,
    el('div', { class: 'msg', id: 'msgtext', text: text }),
    el('a', { class: 'btn primary wide', id: 'wa', href: 'https://wa.me/?text=' + encodeURIComponent(text), target: '_blank', rel: 'noopener' }, 'Open in WhatsApp'),
    navigator.share ? el('button', { class: 'btn wide', onclick: function () { navigator.share({ text: text }).catch(function () { }); } }, 'Share') : null,
    el('button', { class: 'btn wide', onclick: function () {
      navigator.clipboard.writeText(text).then(function () { toast('Copied.'); }, function () { toast('Could not copy.'); });
    } }, 'Copy'));
};

// ---------- statement image ----------
function drawStatement(v, withArrears) {
  var L = v.L, D = v.D, W = 1080, H = 1920, c = document.createElement('canvas');
  c.width = W; c.height = H;
  var g = c.getContext('2d'), F = '-apple-system, "Helvetica Neue", Arial, sans-serif';
  function txt(s, x, y, size, weight, color, align) { g.font = (weight || 400) + ' ' + size + 'px ' + F; g.fillStyle = color || '#111827'; g.textAlign = align || 'left'; g.fillText(s, x, y); }
  function box(x, y, w, h, fill, stroke) {
    g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, 22); else g.rect(x, y, w, h);
    if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = 3; g.strokeStyle = stroke; g.stroke(); }
  }
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  var yr = L.year, Y = L.cur, x = 56, w = W - 112, y = 110;
  txt((D.property || '169-E, EME') .toUpperCase().slice(0, 40) + ' · RENT', x, y, 30, 700, '#4B5563'); y += 100;
  txt(yr + ' Rent Statement', x, y, 84, 800); y += 56;
  txt('As of ' + fmtDate_(v.today) + ' · amounts in Rs', x, y, 32, 400, '#4B5563'); y += 60;
  function row(label, sub, val, fill, stroke, col) {
    box(x, y, w, 130, fill, stroke);
    txt(label, x + 34, y + 58, 38, 700, col); txt(sub, x + 34, y + 102, 28, 400, col);
    txt(val, x + w - 34, y + 86, 60, 800, col, 'right'); y += 146;
  }
  row('Rent due', Y.months + ' months', groupNum_(Y.rent), null, '#D1D5DB', '#111827');
  row('Received', 'in ' + yr, groupNum_(Y.paid), '#EFF6FF', '#93C5FD', '#1E3A8A');
  row(L.yearBalance > 0 ? 'Balance ' + yr : 'All clear', L.yearBalance > 0 ? 'still unpaid' : 'thank you', groupNum_(Math.max(L.yearBalance, 0)),
    L.yearBalance > 0 ? '#9A3412' : '#1D6B3A', null, '#FFFFFF');
  y += 40; txt('Received month by month', x, y, 40, 800); y += 26;
  var cw = (w - 5 * 12) / 6;
  for (var m = 1; m <= 12; m++) {
    var k = yr + '-' + pad2_(m), mo = L.months.filter(function (q) { return q.month === k; })[0];
    var paidIn = D.payments.filter(function (p) { return p.date.slice(0, 7) === k; }).reduce(function (s, p) { return s + (+p.amount); }, 0);
    var cx = x + ((m - 1) % 6) * (cw + 12), cy = y + Math.floor((m - 1) / 6) * 112;
    var fill = !mo && !paidIn ? '#F1F3F5' : paidIn ? '#EFF6FF' : '#FFEDD5', col = !mo && !paidIn ? '#6B7280' : paidIn ? '#1E3A8A' : '#9A3412';
    box(cx, cy, cw, 98, fill);
    txt(CFG.MONTHS[m - 1].slice(0, 3), cx + cw / 2, cy + 40, 28, 700, col, 'center');
    txt(!mo && !paidIn ? '' : paidIn ? groupNum_(paidIn) : 'Nil', cx + cw / 2, cy + 78, 27, 800, col, 'center');
  }
  y += 112 * 2 + 30;
  box(x, y, w, 120, null, '#D1D5DB');
  txt('Average paid per month', x + 34, y + 54, 34, 700, '#374151'); txt('against ' + groupNum_(rateFor_(D.rates, v.today.slice(0, 7)) ? rateFor_(D.rates, v.today.slice(0, 7)).rent : 0) + ' due', x + 34, y + 94, 26, 400, '#4B5563');
  txt(groupNum_(L.avgPaid), x + w - 34, y + 80, 54, 800, '#111827', 'right'); y += 140;
  if (withArrears) {
    box(x, y, w, 120, '#FFFBEB', '#B45309');
    txt('Arrears up to Dec ' + (yr - 1), x + 34, y + 54, 34, 700, '#92400E'); txt('separate from ' + yr, x + 34, y + 94, 26, 400, '#4B5563');
    txt(groupNum_(L.arrearsBefore), x + w - 34, y + 80, 54, 800, '#111827', 'right'); y += 140;
    box(x, y, w, 120, '#111827');
    txt('Total outstanding', x + 34, y + 72, 36, 700, '#FFFFFF');
    txt(groupNum_(L.total), x + w - 34, y + 80, 56, 800, '#FFFFFF', 'right'); y += 140;
  }
  var r = rateFor_(D.rates, v.today.slice(0, 7));
  if (r) {
    y += 20;
    txt('Rent ' + fmtRs_(r.rent) + ' a month, due by the ' + ordinal(r.due_day) + '.', x, y + 30, 32, 600, '#111827');
  }
  txt('JazakAllah', x, H - 70, 30, 600, '#4B5563');
  return c;
}
function ordinal(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function openStatement() { T.stmt = { arrears: !!T.S.settings.arrearsInMsg, url: '', blob: null }; go('statement'); }
SCREENS.statement = function () {
  var v = view(), st = T.stmt, img = el('img', { class: 'stmt', id: 'stmtimg', alt: 'Rent statement' });
  var c = drawStatement(v, st.arrears);
  c.toBlob(function (b) {
    if (st.url) URL.revokeObjectURL(st.url);
    st.blob = b; st.url = URL.createObjectURL(b); img.src = st.url; img.setAttribute('data-bytes', String(b.size));
  }, 'image/png');
  var name = 'Rent_Statement_' + v.L.year + '_' + v.today + '.png';
  return el('div', null,
    el('button', { class: 'back', onclick: function () { T.stmt = null; go('home'); } }, '‹ Done'),
    el('h1', { text: 'Statement image' }),
    el('label', { class: 'switch', for: 'starr' }, el('span', { text: 'Include earlier arrears and total' }),
      el('input', { id: 'starr', type: 'checkbox', checked: st.arrears, onchange: function (e) { st.arrears = e.target.checked; render(); } })),
    el('button', { class: 'btn primary wide', id: 'sharestmt', onclick: function () {
      if (!st.blob) return;
      var file = new File([st.blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(function () { });
      else { var a = el('a', { href: st.url, download: name }); document.body.appendChild(a); a.click(); a.remove(); }
    } }, 'Share image'),
    el('p', { class: 'hint', text: 'Share sends it to WhatsApp or saves it to Photos.' }),
    img);
};

// ---------- settings ----------
SCREENS.settings = function () {
  var S = T.S, rate;
  return el('div', null, topBar('Settings'),
    el('div', { class: 'card' },
      el('label', { class: 'f', for: 'rate', text: 'Euro rate (Rs for €1)' }),
      rate = el('input', { id: 'rate', inputmode: 'decimal', value: String(S.settings.eurRate || ''), onchange: function (e) {
        var n = Number(e.target.value); if (n > 0 && n < 10000) { S.settings.eurRate = n; saveState(); toast('Saved.'); } else toast('Enter a rate like 310.7');
      } }),
      el('div', { class: 'hint', text: 'Used only to show approximate euro amounts.' }),
      el('label', { class: 'switch', for: 'arrdef' }, el('span', { text: 'Include earlier arrears in messages by default' }),
        el('input', { id: 'arrdef', type: 'checkbox', checked: !!S.settings.arrearsInMsg, onchange: function (e) { S.settings.arrearsInMsg = e.target.checked; saveState(); } }))),
    el('div', { class: 'card' },
      el('button', { class: 'btn wide', id: 'updapp', onclick: updateApp }, 'Update app'),
      el('p', { class: 'muted', text: 'Version ' + BUILD_ID + (S.data && S.data.version ? ' · sheet script ' + S.data.version : '') })),
    el('button', { class: 'btn danger wide', id: 'reset', onclick: function () {
      var w = S.outbox.length ? ' ' + S.outbox.length + ' unsent change(s) will be lost.' : '';
      if (prompt('Type RESET to remove the rent data from this phone.' + w) === 'RESET') { localStorage.removeItem(STORE); lock(); }
    } }, 'Reset this phone'));
};
function updateApp() {
  if (!('serviceWorker' in navigator)) return toast('Updates need the Home Screen app.');
  navigator.serviceWorker.getRegistration().then(function (reg) {
    if (reg && reg.waiting) { reg.waiting.postMessage('skip'); return; }
    return fetch('sw.js', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
      if (t.indexOf(BUILD_ID) >= 0) toast('Already the newest version.');
      else if (reg) reg.update().then(function () { toast('Downloading the new version. Close and reopen the app.'); });
    });
  }).catch(function () { toast('Could not check for updates.'); });
}

// ---------- start ----------
function touch() { T.idleAt = Date.now(); }
['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, touch, true); });
setInterval(function () { if (T.key && Date.now() - T.idleAt > IDLE_MS) lock(); }, 15000);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    if (T.key && Date.now() - T.idleAt > IDLE_MS) lock();
    else if (T.S) sync(true);
  }
});
window.addEventListener('online', function () { if (T.S) sync(true); });
window.addEventListener('offline', function () { if (T.S) renderTop(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(function () { });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (!T.key || T.screen === 'unlock') location.reload(); });
}
(function boot() {
  var st = stored();
  T.screen = st && st.ct ? 'unlock' : 'join';
  if (st && !st.ct) localStorage.removeItem(STORE);
  render();
})();
