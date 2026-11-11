/* 169-E Rent: offline iPhone app. Rules come from logic.js (generated from the sheet script). */
'use strict';
var BUILD_ID = '44d2ca84';
var STORE = 'r169.v1';
var IDLE_MS = 5 * 60 * 1000;

var T = { screen: 'boot', key: null, S: null, syncing: false, err: '', form: null, msg: null, img: null, sheet: null,
  tab: 'pays', idleAt: Date.now(), thumbs: {} };

// ---------- helpers ----------
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
var ICONS = {
  home: 'M3 11l9-8 9 8|M5 10v10h14V10',
  pays: 'M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2z|M8 8h8|M8 12h8|M8 16h5',
  log: 'M9 2h6v4H9z|M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M8 12h8|M8 16h5',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  plus: 'M12 5v14|M5 12h14',
  sync: 'M21 12a9 9 0 1 1-3-6.7L21 8|M21 3v5h-5',
  wa: 'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5z|M9 9.5c.5 2.5 2.5 4.5 5 5',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8|M16 6l-4-4-4 4|M12 2v13',
  copy: 'M9 9h11v11H9z|M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M8 13h8|M8 17h8',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  callout: 'M16 3h5v5|M21 3l-6 6|M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  callin: 'M16 2v6h6|M22 2l-6 6|M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M23 21v-2a4 4 0 0 0-3-3.9|M16 3.1a4 4 0 0 1 0 7.8',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22v-7',
  car: 'M5 17H3v-5l2-5h14l2 5v5h-2|M3 12h18|M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z|M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z|M9 17h6',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z|M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  check: 'M20 6L9 17l-5-5',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z|M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z',
  trash: 'M3 6h18|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6|M10 11v6|M14 11v6|M9 6V4h6v2',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 6v6l4 2',
  x: 'M18 6L6 18|M6 6l12 12',
  image: 'M3 3h18v18H3z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M21 15l-5-5L5 21',
  back: 'M15 18l-6-6 6-6',
  faceid: 'M7 3H5a2 2 0 0 0-2 2v2|M17 3h2a2 2 0 0 1 2 2v2|M7 21H5a2 2 0 0 1-2-2v-2|M17 21h2a2 2 0 0 0 2-2v-2|M9 9v1|M15 9v1|M12 9v4h-1|M9 16c1.7 1.3 4.3 1.3 6 0',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7|M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  update: 'M12 3v12|M7 10l5 5 5-5|M5 21h14'
};
var LOG_ICON = { message: 'msg', call: 'callout', callback_req: 'bell', called_back: 'callin', meeting: 'users', flag: 'flag', visit: 'car' };
function svg(name) {
  var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  (ICONS[name] || '').split('|').forEach(function (d) { var p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.appendChild(p); });
  return s;
}
function btn(cls, icon, label, onclick, id) {
  return el('button', { class: 'btn ' + (cls || ''), id: id, type: 'button', onclick: onclick }, icon ? svg(icon) : null, el('span', { text: label }));
}
function toast(t) {
  var old = document.querySelector('.toast'); if (old) old.remove();
  var d = el('div', { class: 'toast', role: 'status', text: t }); document.body.appendChild(d);
  setTimeout(function () { d.remove(); }, 2800);
}
function nowPk() {
  var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  var parts = {}; f.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
  return { date: parts.year + '-' + parts.month + '-' + parts.day, time: parts.hour + ':' + parts.minute };
}
function todayPk() { return nowPk().date; }
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  var a = crypto.getRandomValues(new Uint8Array(16));
  return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}
function eur(n) { var r = Number(T.S.settings.eurRate) || 0; return r > 0 ? '≈ €' + groupNum_(n / r) : ''; }
function byDateDesc(a, b) { var x = a.date + (a.time || ''), y = b.date + (b.time || ''); return x < y ? 1 : x > y ? -1 : 0; }

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
    localStorage.setItem(STORE, JSON.stringify({ v: 1, salt: st.salt, n: st.n || 0, iv: b64(iv), ct: b64(ct) }));
  });
}
function unlock(pin) {
  var st = stored();
  return deriveKey(pin, unb64(st.salt)).then(function (key) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(st.iv) }, key, unb64(st.ct)).then(function (pt) {
      T.key = key; T.S = JSON.parse(new TextDecoder().decode(pt));
      T.S.uploads = T.S.uploads || []; T.S.settings = T.S.settings || { eurRate: 310.7 };
    });
  });
}
function lock() {
  T.bioTried = false;
  T.key = null; T.S = null; T.form = null; T.msg = null; T.img = null; T.sheet = null; T.thumbs = {};
  T.screen = stored() ? 'unlock' : 'join'; render();
}
function resetPhone() {
  localStorage.removeItem(STORE); localStorage.removeItem(BIO);
  return photoWipe().then(lock);
}

// ---------- server ----------
function api(body) {
  var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, 45000);
  return fetch(T.S ? T.S.api : T.joinApi, { method: 'POST', body: JSON.stringify(body), redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal })
    .then(function (r) { return r.json(); })
    .finally(function () { clearTimeout(timer); });
}
function queue(item) {
  var S = T.S;
  if (item.op === 'visit') S.outbox = S.outbox.filter(function (o) { return !(o.op === 'visit' && o.key === item.key && !o.error); });
  if (item.op === 'phone') S.outbox = S.outbox.filter(function (o) { return o.op !== 'phone'; });
  S.outbox.push(item);
  return saveState();
}
function sync(quiet) {
  if (T.syncing) { T.syncAgain = true; return T.syncP || Promise.resolve(); }
  if (!T.S || !T.S.token) return Promise.resolve();
  if (!navigator.onLine) { if (!quiet) toast('No signal. Saved on this phone.'); softRender(); return Promise.resolve(); }
  T.syncing = true; renderTop();
  var S = T.S, items = S.outbox.filter(function (x) { return !x.error; }), done = {};
  var p = items.length ? api({ op: 'push', token: S.token, items: items }) : Promise.resolve({ ok: true, results: [] });
  var chain = p.then(function (r) {
    if (!r.ok) throw r;
    (r.results || []).forEach(function (res) {
      var i = S.outbox.findIndex(function (x) { return x.req_id === res.req_id; });
      if (i < 0) return;
      if (res.ok) done[res.req_id] = 1; else S.outbox[i].error = res.error;
    });
    return sendPhotos(S);
  }).then(function () {
    return api({ op: 'pull', token: S.token });
  }).then(function (r) {
    if (!r.ok) throw r;
    if (T.S !== S) return;
    S.data = r.data; S.lastSync = Date.now(); S.syncErr = '';
    S.outbox = S.outbox.filter(function (x) { return !done[x.req_id]; });
    return saveState();
  }).catch(function (e) {
    if (T.S !== S) return;
    S.outbox = S.outbox.filter(function (x) { return !done[x.req_id]; });
    S.syncErr = (e && e.error) || 'Could not reach the sheet. Will try again.';
    if (e && e.code === 401) S.syncErr = 'This phone was disconnected. Pair it again from the sheet.';
  }).finally(function () {
    T.syncing = false; T.syncP = null;
    if (T.S === S) softRender(); else renderTop();
    if (T.syncAgain && T.S === S) { T.syncAgain = false; return sync(true); }
    T.syncAgain = false;
  });
  T.syncP = chain;
  return chain;
}
function sendPhotos(S) {
  var list = S.uploads.slice();
  return list.reduce(function (chain, u) {
    return chain.then(function () {
      if (T.S !== S) return;
      return photoGet(u.id, T.key).then(function (buf) {
        if (!buf) { S.uploads = S.uploads.filter(function (x) { return x.id !== u.id; }); return; }
        return api({ op: 'upload', token: S.token, req_id: u.id, kind: u.kind, ref_key: u.ref_key, mime: 'image/jpeg', b64: bufToB64(buf) })
          .then(function (r) {
            if (r.ok) { S.uploads = S.uploads.filter(function (x) { return x.id !== u.id; }); T.thumbs['F:' + r.file_id] = T.thumbs['U:' + u.id]; return photoDel(u.id); }
            if (!r.retry) u.error = r.error;
          });
      });
    });
  }, Promise.resolve()).then(function () { return saveState(); });
}

// ---------- data view (server copy plus unsent changes) ----------
function view() {
  var S = T.S, D = JSON.parse(JSON.stringify(S.data)), gone = {};
  D.claims = D.claims || []; D.logs = D.logs || []; D.visits = D.visits || []; D.files = D.files || [];
  S.outbox.forEach(function (o) {
    if (o.op === 'del') gone['P:' + o.pay_id] = 1;
    if (o.op === 'logdel') gone['L:' + o.key] = 1;
    if (o.op === 'visitdel') gone['V:' + o.key] = 1;
  });
  D.payments = D.payments.filter(function (p) { return !gone['P:' + p.pay_id]; });
  D.logs = D.logs.filter(function (g) { return !gone['L:' + g.key]; });
  D.visits = D.visits.filter(function (v) { return !gone['V:' + v.key]; });
  S.outbox.forEach(function (o) {
    var mark = { pending: true, error: o.error };
    if (o.op === 'pay') D.payments.push(Object.assign({ pay_id: '', key: o.req_id, date: o.date, amount: o.amount, into: o.into, by: o.by, eur: o.eur, note: o.note }, mark));
    if (o.op === 'claim' && !o.statusOnly && !D.claims.some(function (c) { return c.key === o.key; })) {
      D.claims.push(Object.assign({ claim_id: '', key: o.key, date: o.date, amount: o.amount, desc: o.desc, status: o.status || 'counted' }, mark));
    }
    if (o.op === 'claim' && o.statusOnly) D.claims.forEach(function (c) { if (c.key === o.key) { c.status = o.status; c.pending = true; } });
    if (o.op === 'log' && !D.logs.some(function (g) { return g.key === o.key; })) {
      D.logs.push(Object.assign({ log_id: '', key: o.key, date: o.date, time: o.time, kind: o.kind, flag: o.flag, notes: o.notes }, mark));
    }
    if (o.op === 'visit') {
      D.visits = D.visits.filter(function (v) { return v.key !== o.key; });
      D.visits.push(Object.assign({ key: o.key, date: o.date, left: o.left, arrived: o.arrived, met: o.met, departed: o.departed, outcome: o.outcome, notes: o.notes }, mark));
    }
    if (o.op === 'phone') D.tenancy.phone = o.phone;
  });
  S.uploads.forEach(function (u) { D.files.push({ file_id: '', upload: u.id, kind: u.kind, ref_key: u.ref_key, pending: true, error: u.error }); });
  var today = todayPk();
  return { D: D, L: computeLedger_(D, today), today: today };
}

// ---------- rendering ----------
var BAR = [['home', 'home', 'Home'], ['pays', 'pays', 'Payments'], ['log', 'log', 'Log'], ['settings', 'gear', 'Settings']];
function render() {
  var app = document.getElementById('app');
  var bar = T.S && BAR.some(function (b) { return b[0] === T.screen; });
  app.className = bar ? '' : 'nobar';
  var fn = SCREENS[T.screen] || SCREENS.boot;
  app.replaceChildren(fn());
  document.querySelectorAll('.bar,.fab,.sheet-bg').forEach(function (x) { x.remove(); });
  if (bar) document.body.appendChild(barEl());
  var fab = bar && FAB[T.screen] && FAB[T.screen]();
  if (fab) document.body.appendChild(el('button', { class: 'fab', id: 'fab', type: 'button', onclick: fab[2] }, svg(fab[0]), fab[1]));
  if (T.sheet) document.body.appendChild(T.sheet());
}
var FAB = {
  home: function () { return ['plus', 'Add payment', openAdd]; },
  pays: function () { return T.tab === 'claims' ? ['wrench', 'Add maintenance', openClaim] : ['plus', 'Add payment', openAdd]; },
  log: function () { return ['plus', 'Add entry', function () { openLog('call'); }]; }
};
function softRender() {
  var ae = document.activeElement, typing = ae && ae.matches && ae.matches('#app input, #app textarea');
  if (['unlock', 'join', 'setpin'].indexOf(T.screen) >= 0) return; // never redraw a PIN pad under his fingers
  if (['add', 'claim', 'logadd'].indexOf(T.screen) >= 0 || T.sheet || typing) { renderTop(); return; }
  if (T.screen === 'settings') {
    var tc = document.getElementById('tenantcard'); if (tc) tc.replaceWith(tenantCard());
    renderTop(); return;
  }
  render();
}
function renderTop() {
  var s = document.getElementById('syncpill');
  if (s && T.S) s.replaceWith(syncPill());
}
function go(screen) { T.screen = screen; T.sheet = null; render(); window.scrollTo(0, 0); if (screen === 'settings' && T.S && T.S.data) sync(true); }
function barEl() {
  return el('nav', { class: 'bar' }, BAR.map(function (b) {
    var n = b[0] === 'settings' && T.S.outbox.some(function (o) { return o.error; }) ? el('span', { class: 'dot' }) : null;
    return el('button', { class: T.screen === b[0] ? 'on' : '', type: 'button', 'aria-label': b[2], onclick: function () { go(b[0]); } }, svg(b[1]), b[2], n);
  }));
}
function syncPill() {
  var S = T.S, n = S.outbox.length + S.uploads.length, t;
  if (T.syncing) t = 'Syncing…';
  else if (!navigator.onLine) t = n ? 'Offline, ' + n + ' waiting' : 'Offline';
  else if (S.syncErr) t = 'Not synced';
  else if (n) t = n + ' waiting';
  else t = S.lastSync ? 'Synced ' + new Date(S.lastSync).toTimeString().slice(0, 5) : 'Not synced yet';
  return el('button', { class: 'sync', id: 'syncpill', type: 'button', 'aria-label': 'Sync now', onclick: function () { sync(); } }, svg('sync'), t);
}
function clockText() {
  function t(z) { return new Intl.DateTimeFormat('en-GB', { timeZone: z, hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).format(new Date()); }
  var mad = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' })), hr = mad.getHours();
  var note = hr >= 22 || hr < 8 ? 'night in Madrid' : hr >= 9 && hr < 18 ? 'working hours in Madrid' : 'evening in Madrid';
  return { lahore: t('Asia/Karachi'), madrid: t('Europe/Madrid'), note: hr >= 8 && hr < 9 ? 'morning in Madrid' : note };
}
function clockEl() {
  var c = clockText();
  return el('div', { class: 'clocks', id: 'clocks' },
    el('div', null, svg('clock'), el('span', { text: 'Lahore ' }), el('b', { text: c.lahore })),
    el('div', null, el('span', { text: 'Madrid ' }), el('b', { id: 'madrid', text: c.madrid }), el('span', { class: 'sm', text: ' · ' + c.note })));
}
function topBar(title) {
  return el('div', null, el('div', { class: 'top' }, el('div', { class: 'brand' }, el('img', { src: 'logo-160.png', alt: '', class: 'logo' }), el('div', { class: 'title', text: title })), syncPill()),
    T.screen === 'home' || T.screen === 'log' ? clockEl() : null);
}
function backBar(title, to) {
  return el('div', { class: 'top' },
    el('button', { class: 'back', type: 'button', onclick: function () { T.form = null; T.msg = null; T.img = null; go(to || 'home'); } }, svg('back'), 'Back'),
    el('div', { class: 'title small', text: title }), el('span'));
}
function chips(list, cur, onPick, id, labelFn) {
  return el('div', { class: 'chips', id: id }, list.map(function (x) {
    return el('button', { class: cur === x ? 'on' : '', type: 'button', 'data-v': x, onclick: function (e) {
      onPick(x); e.currentTarget.parentNode.querySelectorAll('button').forEach(function (b) { b.className = b.getAttribute('data-v') === x ? 'on' : ''; });
    } }, labelFn ? labelFn(x) : x);
  }));
}
function sheetOpen(build) { T.sheet = build; render(); }
function sheetClose() { T.sheet = null; render(); }
function sheetWrap(label, kids) {
  return el('div', { class: 'sheet-bg', onclick: function (e) { if (e.target === e.currentTarget) sheetClose(); } },
    el('div', { class: 'sheet', role: 'dialog', 'aria-label': label }, kids));
}

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
    if (/\/dev$/.test(url)) { err.textContent = 'This code points to the test address (ending /dev), which does not work on a phone. In the sheet choose 169-E Rent > Change web app address, paste the address ending /exec, then Pair a phone again.'; return; }
    T.joinApi = url; err.textContent = 'Connecting…';
    api({ op: 'join', code: m[2] }).then(function (r) {
      if (!r.ok) { err.textContent = r.error || 'Could not pair.'; return; }
      T.pending = { api: url, token: r.token }; go('setpin');
    }).catch(function () {
      err.textContent = navigator.onLine ? 'The sheet did not answer. Check in Apps Script: Deploy > Manage deployments shows a Web app with Execute as: Me and Who has access: Anyone (not "Anyone with Google account"). Fix it, then make a new code with Pair a phone.' : 'No internet on this phone. Connect and try again.';
    });
  }
  return el('div', null,
    el('img', { src: 'logo-160.png', alt: '169 E Rental Management', class: 'biglogo' }),
    el('h1', { text: '169-E Rent' }),
    el('p', { text: 'Pair this phone with your rent sheet.' }),
    el('div', { class: 'note' }, 'On iPhone, first add this page to your Home Screen (Share, then Add to Home Screen) and open it from there, then pair.'),
    el('label', { class: 'f', for: 'code', text: 'Pairing code from your e-mail' }),
    ta = el('textarea', { id: 'code', placeholder: 'RENT1…', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' }),
    btn('wide', 'copy', 'Paste code', function () {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { ta.value = t.trim(); }).catch(function () { });
    }),
    btn('primary wide', 'check', 'Connect', connect, 'connect'), err);
};

SCREENS.setpin = function () {
  var a, b, err = el('div', { class: 'err' });
  function done() {
    if (!/^\d{4,6}$/.test(a.value)) { err.textContent = 'Use 4 to 6 digits.'; return; }
    if (a.value !== b.value) { err.textContent = 'The two PINs do not match.'; return; }
    var salt = crypto.getRandomValues(new Uint8Array(16));
    deriveKey(a.value, salt).then(function (key) {
      localStorage.setItem(STORE, JSON.stringify({ v: 1, salt: b64(salt), n: a.value.length, iv: '', ct: '' }));
      T.key = key;
      T.S = { api: T.pending.api, token: T.pending.token, data: null, outbox: [], uploads: [], lastSync: 0, syncErr: '',
        settings: { eurRate: 310.7, arrearsInMsg: false }, visit: null };
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
    btn('primary wide', 'check', 'Save PIN', done, 'savepin'), err);
};

SCREENS.loading = function () {
  var S = T.S;
  return el('div', null, el('h1', { text: '169-E Rent' }),
    el('p', { text: S && S.syncErr ? S.syncErr : 'Downloading your rent records…' }),
    S && S.syncErr ? btn('primary wide', 'sync', 'Try again', function () { sync().then(function () { if (T.S.data) go('home'); }); }) : null);
};

SCREENS.unlock = function () {
  var pin = '', st = stored() || {}, n = +st.n || 0, err = el('div', { class: 'err', id: 'pinerr', role: 'alert' });
  var dots = el('div', { class: 'dots', id: 'dots', 'aria-label': 'PIN' });
  function drawDots() {
    var k = Math.max(n || 4, pin.length);
    dots.replaceChildren.apply(dots, Array.apply(null, Array(k)).map(function (_, i) { return el('span', { class: i < pin.length ? 'on' : '' }); }));
  }
  function opened() { T.fails = 0; T.idleAt = Date.now(); go(T.S.data ? 'home' : 'loading'); sync(true); }
  function tryIt() {
    if (T.waitUntil && Date.now() < T.waitUntil) { err.textContent = 'Wait a few seconds and try again.'; pin = ''; drawDots(); return; }
    var p = pin;
    unlock(p).then(function () {
      if (!n) { var s2 = stored(); s2.n = p.length; localStorage.setItem(STORE, JSON.stringify(s2)); }
      opened();
    }).catch(function () {
      T.fails = (T.fails || 0) + 1; pin = ''; drawDots();
      if (T.fails >= 5) T.waitUntil = Date.now() + 30000;
      err.textContent = 'Wrong PIN.';
      dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
    });
  }
  function press(k) {
    T.unlockPresses = (T.unlockPresses || 0) + 1;
    err.textContent = '';
    if (k === 'del') pin = pin.slice(0, -1);
    else if (pin.length < 6) pin += k;
    drawDots();
    if (n && pin.length === n) tryIt();
  }
  function face(auto) {
    if (!bioReady() || T.bioBusy) return;
    if (auto === true && (pin || T.unlockPresses !== startPresses)) return; // he is already typing his PIN
    if (auto !== true) err.textContent = '';
    var typed = T.unlockPresses = T.unlockPresses || 0;
    bioUnlock().then(function () { if (T.screen === 'unlock') opened(); }).catch(function (e) {
      if (T.screen !== 'unlock' || T.unlockPresses !== typed) return; // he has started typing: keep his digits and messages
      err.textContent = e && e.message === 'cancel' ? 'Tap the Face ID key or type your PIN.' : 'Face ID did not work. Type your PIN.';
    });
  }
  drawDots();
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', bioReady() ? 'face' : (n ? '' : 'ok'), '0', 'del'];
  var pad = el('div', { class: 'keypad', id: 'keypad' }, keys.map(function (k) {
    if (!k) return el('span');
    if (k === 'face') return el('button', { class: 'key fn', type: 'button', id: 'bioUnlock', 'aria-label': 'Unlock with Face ID', onclick: face }, svg('faceid'));
    if (k === 'del') return el('button', { class: 'key fn', type: 'button', 'aria-label': 'Delete', 'data-k': 'del', onclick: function () { press('del'); } }, svg('back'));
    if (k === 'ok') return el('button', { class: 'key fn', type: 'button', id: 'unlockbtn', 'aria-label': 'Unlock', onclick: tryIt }, svg('check'));
    return el('button', { class: 'key', type: 'button', 'data-k': k, onclick: function () { press(k); } }, k);
  }));
  function onKey(e) {
    if (T.screen !== 'unlock') { document.removeEventListener('keydown', onKey); return; }
    if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') tryIt();
  }
  document.removeEventListener('keydown', T.unlockKeys || function () { });
  T.unlockKeys = onKey; document.addEventListener('keydown', onKey);
  var startPresses = T.unlockPresses = T.unlockPresses || 0;
  if (bioReady() && !T.bioTried) { T.bioTried = true; setTimeout(function () { face(true); }, 350); }
  return el('div', { class: 'unlock' },
    el('img', { src: 'logo-160.png', alt: '169 E Rental Management', class: 'biglogo' }),
    el('h1', { text: '169-E Rent' }),
    el('p', { class: 'muted', text: bioReady() ? 'Face ID or your PIN' : 'Enter your PIN' }),
    dots, err, pad,
    el('button', { class: 'linkbtn', type: 'button', onclick: function () {
      if (confirm('Reset this phone? You will need a new pairing code from the sheet. Anything not yet sent from this phone will be lost.')) resetPhone();
    } }, 'Forgot PIN'));
};

// ---------- home ----------
function monthCells(L, D) {
  var yr = L.year, cells = [];
  for (var m = 1; m <= 12; m++) {
    var k = yr + '-' + pad2_(m), mo = L.months.filter(function (x) { return x.month === k; })[0];
    var paidIn = D.payments.filter(function (p) { return p.date.slice(0, 7) === k; }).reduce(function (s, p) { return s + (+p.amount); }, 0);
    var cls = !mo ? (paidIn ? 'paid' : 'future') : mo.onTime ? 'ontime' : paidIn > 0 ? 'paid' : 'nil';
    cells.push(el('div', { class: 'm ' + cls }, el('b', { text: CFG.MONTHS[m - 1].slice(0, 3) }), !mo && !paidIn ? '·' : paidIn ? groupNum_(paidIn) : 'Nil'));
  }
  return cells;
}
SCREENS.home = function () {
  var v = view(), L = v.L, D = v.D, Y = L.cur, yr = L.year;
  var mk = v.today.slice(0, 7), r = rateFor_(D.rates, mk), thisM = L.months.filter(function (m) { return m.month === mk; })[0];
  var status;
  if (!thisM) status = el('span', { class: 'chip wait', text: 'Not due yet' });
  else if (thisM.onTime) status = el('span', { class: 'chip ok', text: 'Paid' });
  else if (!thisM.lateNow) status = el('span', { class: 'chip wait', text: 'Due now' });
  else status = el('span', { class: 'chip late', text: 'Late' });
  var recent = D.payments.slice().sort(byDateDesc).slice(0, 4);
  var lastFlag = D.logs.filter(function (g) { return g.kind === 'flag'; }).sort(byDateDesc)[0];
  return el('div', null,
    topBar('169-E Rent'),
    T.S.syncErr ? el('div', { class: 'note', text: T.S.syncErr }) : null,
    el('div', { class: 'card hero' + (L.yearBalance <= 0 ? ' clear' : ''), id: 'hero' },
      el('div', { class: 'lbl', text: yr + ' balance' }),
      el('div', { class: 'big', id: 'yearbal', text: fmtRs_(Math.max(L.yearBalance, 0)) }),
      el('div', { class: 'sub', text: (L.yearBalance > 0 ? eur(L.yearBalance) + ' · ' : L.yearBalance < 0 ? fmtRs_(-L.yearBalance) + ' ahead · ' : 'Clear · ') +
        'Due ' + groupNum_(Y.rent) + ', received ' + groupNum_(Y.paid) + (Y.maint ? ', maintenance ' + groupNum_(Y.maint) : '') })),
    el('div', { class: 'two' },
      el('div', { class: 'card stat' }, el('div', { class: 'lbl', text: 'Arrears to Dec ' + (yr - 1) }), el('div', { class: 'val', id: 'arrears', text: fmtRs_(L.arrearsBefore) })),
      el('div', { class: 'card stat' }, el('div', { class: 'lbl', text: 'Total outstanding' }), el('div', { class: 'val', id: 'total', text: fmtRs_(L.total) }))),
    lastFlag ? el('button', { class: 'card flagcard', type: 'button', onclick: function () { go('log'); } }, svg('flag'),
      el('div', null, el('b', { text: 'Red flag: ' + lastFlag.flag }), el('div', { class: 'sm', text: fmtDate_(lastFlag.date) + (lastFlag.time ? ' · ' + lastFlag.time : '') }))) : null,
    el('div', { class: 'card' },
      el('div', { class: 'row' },
        el('div', null, el('b', { text: monthName_(mk) }), el('div', { class: 'sm', text: r ? fmtRs_(r.rent) + ' due by the ' + ordinal_(r.due_day) : '' })),
        status),
      el('div', { class: 'row' }, el('div', { class: 'sm', text: 'Average paid per month in ' + yr }), el('div', { class: 'amt', text: fmtRs_(L.avgPaid) }))),
    el('h2', { text: 'Received in ' + yr }),
    el('div', { class: 'grid', id: 'grid' }, monthCells(L, D)),
    el('div', { class: 'legend' }, 'Green: paid by the 10th · Blue: paid, but late · Red: nothing paid'),
    el('h2', { text: 'Send to ' + (D.tenancy.tenant || 'tenant') }),
    el('div', { class: 'tiles' },
      tile('sand', 'msg', 'Balance update', 'Picture and text', function () { openImg('balance', null); }, 'b-balance'),
      tile('sand', 'bell', 'Rent reminder', 'Picture and text', function () { openImg('reminder'); }, 'b-remind'),
      tile('sand', 'doc', 'Statement', 'Picture of ' + yr, function () { openImg('statement'); }, 'b-stmt'),
      tile('sand', 'pays', 'Receipt', 'Latest payment', function () { if (recent[0]) openImg('receipt', recent[0]); else toast('No payments yet.'); }, 'b-receipt')),
    el('h2', { text: 'Latest payments' }),
    el('div', { class: 'card list' }, recent.length ? recent.map(payRow) : el('p', { class: 'muted', text: 'None yet.' })));
};
function tile(cls, icon, title, sub, onclick, id) {
  return el('button', { class: 'tile ' + cls, type: 'button', id: id, onclick: onclick }, svg(icon), el('b', { text: title }), el('span', { text: sub }));
}

// ---------- payments and maintenance ----------
function photoCount(D, kind, key) { return D.files.filter(function (f) { return f.kind === kind && f.ref_key === key; }).length; }
function payRow(p) {
  var v = view(), n = photoCount(v.D, 'pay', p.key);
  return el('button', { class: 'row', type: 'button', onclick: function () { openPay(p); } },
    el('div', null, el('div', { text: fmtDate_(p.date) }),
      el('div', { class: 'sm', text: [p.into, byLabel_(v.D, p.by), n ? n + ' photo' + (n > 1 ? 's' : '') : ''].filter(Boolean).join(' · ') }),
      p.pending ? el('div', { class: 'pending', text: p.error ? 'Refused: ' + p.error : 'Waiting to send' }) : null),
    el('div', { class: 'amt', text: fmtRs_(p.amount) }));
}
function claimRow(c) {
  var v = view(), n = photoCount(v.D, 'claim', c.key);
  return el('button', { class: 'row', type: 'button', onclick: function () { openClaimSheet(c); } },
    el('div', null, el('div', { text: c.desc }),
      el('div', { class: 'sm', text: [fmtDate_(c.date), c.status === 'rejected' ? 'Not counted' : 'Counted against rent', n ? n + ' photo' + (n > 1 ? 's' : '') : ''].filter(Boolean).join(' · ') }),
      c.pending ? el('div', { class: 'pending', text: c.error ? 'Refused: ' + c.error : 'Waiting to send' }) : null),
    el('div', { class: 'amt' + (c.status === 'rejected' ? ' struck' : ''), text: fmtRs_(c.amount) }));
}
SCREENS.pays = function () {
  var v = view(), L = v.L;
  var seg = el('div', { class: 'seg', role: 'tablist' },
    el('button', { type: 'button', role: 'tab', class: T.tab === 'pays' ? 'on' : '', id: 'tab-pays', onclick: function () { T.tab = 'pays'; render(); } }, svg('pays'), 'Payments'),
    el('button', { type: 'button', role: 'tab', class: T.tab === 'claims' ? 'on' : '', id: 'tab-claims', onclick: function () { T.tab = 'claims'; render(); } }, svg('wrench'), 'Maintenance'));
  if (T.tab === 'claims') {
    var cs = v.D.claims.slice().sort(byDateDesc), counted = cs.filter(function (c) { return c.status !== 'rejected'; });
    return el('div', null, topBar('Payments'), seg,
      el('p', { class: 'muted', text: 'Money he spent on the house, counted against rent as soon as it is entered. Mark one "Not counted" if you disagree.' }),
      el('div', { class: 'note', id: 'maintnote', text: MAINT_NOTE }),
      el('p', { class: 'muted', text: counted.length + ' counted, ' + fmtRs_(counted.reduce(function (s, c) { return s + c.amount; }, 0)) + ' in all.' }),
      el('div', { class: 'card list', id: 'claimlist' }, cs.length ? cs.map(claimRow) : el('p', { class: 'muted', text: 'None yet.' })));
  }
  var byYear = {};
  v.D.payments.forEach(function (p) { (byYear[p.date.slice(0, 4)] = byYear[p.date.slice(0, 4)] || []).push(p); });
  return el('div', null, topBar('Payments'), seg,
    el('p', { class: 'muted', text: v.D.payments.length + ' payments, ' + fmtRs_(L.paidTotal) + ' in all (security included).' }),
    Object.keys(byYear).sort().reverse().map(function (y) {
      var Ye = L.years.filter(function (x) { return String(x.year) === y; })[0];
      return [el('div', { class: 'yearhead' }, el('span', { text: y }), el('span', { text: fmtRs_(Ye ? Ye.paid : 0) })),
        el('div', { class: 'card list' }, byYear[y].sort(byDateDesc).map(payRow))];
    }));
};
function photoStrip(kind, key) {
  var v = view(), files = v.D.files.filter(function (f) { return f.kind === kind && f.ref_key === key; });
  var strip = el('div', { class: 'photos', id: 'photos' });
  files.forEach(function (f) {
    var id = f.file_id ? 'F:' + f.file_id : 'U:' + f.upload;
    var img = el('img', { alt: 'Receipt photo', class: 'thumb' });
    var wrap = el('button', { class: 'thumbwrap', type: 'button', onclick: function () { if (img.src) window.open(img.src, '_blank'); } }, img,
      f.pending ? el('span', { class: 'tag', text: f.error ? 'Refused' : 'Waiting' }) : null);
    strip.appendChild(wrap);
    loadThumb(id, f).then(function (url) { if (url) img.src = url; else wrap.classList.add('missing'); });
  });
  var input = el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'hidden', id: 'photoinput', onchange: function (e) {
    addPhotos(kind, key, e.target.files).then(function (n) { if (n) { toast(n + ' photo' + (n > 1 ? 's' : '') + ' added.'); render(); sync(true); } });
  } });
  return el('div', null, el('label', { class: 'f', text: 'Receipt photos' }), strip, input,
    btn('wide', 'camera', 'Add receipt photo', function () { input.click(); }, 'addphoto'));
}
function loadThumb(id, f) {
  if (T.thumbs[id]) return Promise.resolve(T.thumbs[id]);
  if (f.upload) return photoGet(f.upload, T.key).then(function (buf) {
    if (!buf) return null; return (T.thumbs[id] = URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' })));
  });
  if (!navigator.onLine) return Promise.resolve(null);
  return api({ op: 'file', token: T.S.token, file_id: f.file_id }).then(function (r) {
    if (!r.ok) return null;
    return (T.thumbs[id] = URL.createObjectURL(new Blob([b64ToBuf(r.b64)], { type: r.mime || 'image/jpeg' })));
  }).catch(function () { return null; });
}
function addPhotos(kind, key, fileList) {
  var files = Array.prototype.slice.call(fileList || []), n = 0;
  return files.reduce(function (chain, f) {
    return chain.then(function () {
      return shrinkPhoto(f).then(function (buf) {
        var id = 'up-' + uuid();
        return photoPut(id, buf, T.key).then(function () {
          T.thumbs['U:' + id] = URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' }));
          T.S.uploads.push({ id: id, kind: kind, ref_key: key, bytes: buf.byteLength }); n++;
        });
      }).catch(function (e) { toast(e.message || 'Could not add that photo.'); });
    });
  }, Promise.resolve()).then(function () { return saveState(); }).then(function () { return n; });
}
function openPay(p) {
  sheetOpen(function () {
    var reason;
    return sheetWrap('Payment', [
      el('h2', { text: fmtRs_(p.amount) + ' on ' + fmtDate_(p.date) }),
      el('p', { class: 'muted', text: [p.into, byLabel_(T.S.data, p.by), p.eur ? '€' + p.eur + ' sent' : '', p.pay_id].filter(Boolean).join(' · ') }),
      p.note ? el('p', { text: p.note }) : null,
      el('div', { class: 'actions2' },
        btn('primary', 'pays', 'Receipt picture', function () { openImg('receipt', p); }, 'receiptbtn'),
        btn('', 'msg', 'Balance picture', function () { openImg('balance', p); })),
      photoStrip('pay', p.key),
      el('label', { class: 'f', for: 'delreason', text: 'Delete this payment (entered by mistake)' }),
      reason = el('input', { id: 'delreason', placeholder: 'Reason, for example typed twice' }),
      btn('danger wide', 'trash', 'Delete', function () {
        if (!reason.value.trim()) { reason.focus(); toast('Give a reason first.'); return; }
        if (p.pending) T.S.outbox = T.S.outbox.filter(function (o) { return o.req_id !== p.key; });
        else T.S.outbox.push({ op: 'del', req_id: uuid(), pay_id: p.pay_id, reason: reason.value.trim() });
        T.sheet = null; saveState().then(function () { render(); toast('Deleted.'); sync(true); });
      }, 'delbtn'),
      btn('wide', 'x', 'Close', sheetClose)]);
  });
}
function openClaimSheet(c) {
  sheetOpen(function () {
    var rejected = c.status === 'rejected';
    return sheetWrap('Maintenance', [
      el('h2', { text: fmtRs_(c.amount) + ': ' + c.desc }),
      el('p', { class: 'muted', text: fmtDate_(c.date) + (c.claim_id ? ' · ' + c.claim_id : '') + ' · ' + (rejected ? 'Not counted against rent' : 'Counted against rent') }),
      photoStrip('claim', c.key),
      c.pending && !c.claim_id ? null : btn(rejected ? 'primary wide' : 'danger wide', rejected ? 'check' : 'x', rejected ? 'Count it against rent again' : 'Do not count it', function () {
        queue({ op: 'claim', req_id: uuid(), key: c.key, statusOnly: true, status: rejected ? 'counted' : 'rejected' }).then(function () { T.sheet = null; render(); sync(true); });
      }, 'claimstatus'),
      btn('wide', 'x', 'Close', sheetClose)]);
  });
}

// ---------- add payment ----------
function openAdd() { T.form = { key: uuid(), date: todayPk(), amount: '', eur: '', into: 'Sehrish HBL', by: 'Tenant', note: '', photos: [] }; T.err = ''; go('add'); }
function amountField(f, id) {
  var hint = el('div', { class: 'hint', id: id + 'hint' });
  function upd() { var a = Number(f.amount); hint.textContent = a > 0 ? fmtRs_(a) + '  ' + eur(a) : ''; }
  var inp = el('input', { id: id, inputmode: 'numeric', autocomplete: 'off', placeholder: 'e.g. 200000', value: f.amount,
    oninput: function (e) { f.amount = e.target.value.replace(/[^\d]/g, ''); if (e.target.value !== f.amount) e.target.value = f.amount; upd(); } });
  upd();
  return [inp, hint];
}
function pickPhotosField(f) {
  var count = el('div', { class: 'hint', id: 'pickcount', text: f.photos.length ? f.photos.length + ' photo(s) ready' : '' });
  var input = el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'hidden', id: 'formphotos', onchange: function (e) {
    Array.prototype.push.apply(f.photos, Array.prototype.slice.call(e.target.files || [])); count.textContent = f.photos.length + ' photo(s) ready';
  } });
  return [el('label', { class: 'f', text: 'Receipt photos (optional)' }), input, btn('wide', 'camera', 'Add receipt photo', function () { input.click(); }), count];
}
SCREENS.add = function () {
  var f = T.form, D = T.S.data, err = el('div', { class: 'err', id: 'adderr', text: T.err });
  function save() {
    var p = { op: 'pay', req_id: f.key, date: f.date, amount: Number(f.amount), into: f.into, by: f.by, eur: f.eur === '' ? '' : Number(f.eur), note: f.note.trim() };
    var e = validatePayment_(p, todayPk());
    if (e) { T.err = e; err.textContent = e; return; }
    T.S.outbox.push(p); var photos = f.photos; T.form = null; T.err = '';
    addPhotos('pay', p.req_id, photos).then(function () {
      openImg('receipt', { key: p.req_id, date: p.date, amount: p.amount, into: p.into, by: p.by, eur: p.eur });
      sync(true);
      toast(navigator.onLine ? 'Saved.' : 'Saved on this phone. It will send when there is signal.');
    });
  }
  return el('div', null, backBar('Add payment'),
    el('label', { class: 'f', for: 'date', text: 'Date received' }),
    el('input', { id: 'date', type: 'date', value: f.date, max: todayPk(), oninput: function (e) { f.date = e.target.value; } }),
    el('label', { class: 'f', for: 'amount', text: 'Amount received (Rs)' }), amountField(f, 'amount'),
    el('label', { class: 'f', text: 'Received into' }), chips(CFG.INTO, f.into, function (x) { f.into = x; }, 'chips-into'),
    el('label', { class: 'f', text: 'Paid by' }), chips(CFG.BY, f.by, function (x) { f.by = x; }, 'chips-by', function (x) { return byLabel_(D, x); }),
    el('label', { class: 'f', for: 'eur', text: 'Euros he sent (optional)' }),
    el('input', { id: 'eur', inputmode: 'decimal', autocomplete: 'off', value: f.eur, oninput: function (e) { f.eur = e.target.value.replace(/[^\d.]/g, ''); } }),
    pickPhotosField(f),
    el('label', { class: 'f', for: 'note', text: 'Note (optional)' }),
    el('textarea', { id: 'note', maxlength: '300', oninput: function (e) { f.note = e.target.value; } }, f.note),
    btn('primary wide', 'check', 'Save payment', save, 'savepay'), err);
};

// ---------- add maintenance ----------
function openClaim() { T.form = { key: uuid(), date: todayPk(), amount: '', desc: '', photos: [] }; T.err = ''; go('claim'); }
SCREENS.claim = function () {
  var f = T.form, err = el('div', { class: 'err', id: 'claimerr', text: T.err });
  function save() {
    var c = { op: 'claim', req_id: f.key, key: f.key, date: f.date, amount: Number(f.amount), desc: f.desc.trim(), status: 'counted' };
    var e = validateClaim_(c, todayPk());
    if (e) { T.err = e; err.textContent = e; return; }
    T.S.outbox.push(c); var photos = f.photos; T.form = null; T.err = '';
    addPhotos('claim', c.key, photos).then(function () { T.tab = 'claims'; go('pays'); sync(true); toast('Saved. It counts against rent now.'); });
  }
  return el('div', null, backBar('Add maintenance', 'pays'),
    el('div', { class: 'note', text: 'Money the tenant spent on the house. It is counted against rent as soon as you save it.' }),
    el('label', { class: 'f', for: 'cdate', text: 'Date spent' }),
    el('input', { id: 'cdate', type: 'date', value: f.date, max: todayPk(), oninput: function (e) { f.date = e.target.value; } }),
    el('label', { class: 'f', for: 'camount', text: 'Amount (Rs)' }), amountField(f, 'camount'),
    el('label', { class: 'f', for: 'cdesc', text: 'What was it for?' }),
    el('textarea', { id: 'cdesc', maxlength: '300', placeholder: 'e.g. Water pump repair, plumber and parts', oninput: function (e) { f.desc = e.target.value; } }, f.desc),
    pickPhotosField(f),
    btn('primary wide', 'check', 'Save maintenance', save, 'saveclaim'), err);
};

// ---------- contact log and visits ----------
function openLog(kind) { var n = nowPk(); T.form = { key: uuid(), kind: kind, date: n.date, time: n.time, flag: '', notes: '' }; T.err = ''; go('logadd'); }
SCREENS.logadd = function () {
  var f = T.form, err = el('div', { class: 'err', id: 'logerr', text: T.err }), flagBox = el('div');
  function drawFlags() {
    flagBox.replaceChildren(f.kind === 'flag' ? el('div', null, el('label', { class: 'f', text: 'Which red flag?' }),
      chips(CFG.FLAGS, f.flag, function (x) { f.flag = x; }, 'chips-flag')) : '');
  }
  drawFlags();
  function save() {
    var g = { op: 'log', req_id: f.key, key: f.key, date: f.date, time: f.time, kind: f.kind, flag: f.kind === 'flag' ? f.flag : '', notes: f.notes.trim() };
    var e = validateLog_(g, todayPk());
    if (e) { T.err = e; err.textContent = e; return; }
    T.form = null; T.err = '';
    queue(g).then(function () { go('log'); sync(true); toast('Saved in the log.'); });
  }
  return el('div', null, backBar('Log entry', 'log'),
    el('label', { class: 'f', text: 'What happened?' }),
    el('div', { class: 'chips', id: 'chips-kind' }, CFG.LOG_KINDS.map(function (x) {
      return el('button', { type: 'button', 'data-v': x.k, class: (f.kind === x.k ? 'on' : '') + (x.k === 'flag' ? ' redchip' : ''), onclick: function (e) {
        f.kind = x.k; e.currentTarget.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === x.k); }); drawFlags();
      } }, svg(LOG_ICON[x.k]), x.label);
    })),
    flagBox,
    el('div', { class: 'two' },
      el('div', null, el('label', { class: 'f', for: 'ldate', text: 'Date' }), el('input', { id: 'ldate', type: 'date', value: f.date, max: todayPk(), oninput: function (e) { f.date = e.target.value; } })),
      el('div', null, el('label', { class: 'f', for: 'ltime', text: 'Time' }), el('input', { id: 'ltime', type: 'time', value: f.time, oninput: function (e) { f.time = e.target.value; } }))),
    el('label', { class: 'f', for: 'lnotes', text: 'Notes' }),
    el('textarea', { id: 'lnotes', maxlength: '1000', placeholder: 'What was said, what he promised, dates given', oninput: function (e) { f.notes = e.target.value; } }, f.notes),
    btn('primary wide', 'check', 'Save', save, 'savelog'), err);
};
function visitPush(v) {
  return queue({ op: 'visit', req_id: uuid(), key: v.key, date: v.date, left: v.left, arrived: v.arrived || '', met: v.met || '',
    departed: v.departed || '', outcome: v.outcome || '', notes: v.notes || '' }).then(function () { sync(true); });
}
function visitCard() {
  var V = T.S.visit;
  if (!V) {
    return el('button', { class: 'card visitstart', type: 'button', id: 'visitstart', onclick: function () {
      var n = nowPk(); T.S.visit = { key: uuid(), date: n.date, left: n.time };
      visitPush(T.S.visit).then(render);
    } }, svg('car'), el('div', null, el('b', { text: 'Leaving for EME' }), el('span', { text: 'Tap when you set off. The timer starts.' })));
  }
  var now = nowPk().time, t = visitTimes_({ left: V.left, arrived: V.arrived || now, met: V.met || (V.arrived ? now : ''), departed: V.departed || now });
  function step(label, icon, val, field, live) {
    return el('div', { class: 'step' + (val ? ' done' : '') }, svg(icon),
      el('div', null, el('b', { text: label }), el('span', { text: val ? val : (live || '') })),
      val ? null : btn('primary small', 'check', 'Now', function () {
        V[field] = nowPk().time; if (field === 'met' && !V.arrived) V.arrived = V[field];
        visitPush(V).then(render);
      }, 'v-' + field));
  }
  return el('div', { class: 'card visit', id: 'visitcard' },
    el('div', { class: 'row' }, el('b', { text: 'Visit to EME, ' + fmtDate_(V.date) }), el('span', { class: 'chip wait', text: V.departed ? 'Done' : 'In progress' })),
    step('Left for EME', 'car', V.left, 'left'),
    step('Arrived', 'pin', V.arrived, 'arrived', 'Driving ' + fmtMins_(t.drive)),
    step('Met him', 'users', V.met, 'met', V.arrived ? 'Waiting ' + fmtMins_(t.wait) : ''),
    step('Left EME', 'out', V.departed, 'departed'),
    el('div', { class: 'durations', id: 'durations' }, 'Driving ' + fmtMins_(t.drive) + (V.arrived ? ' · waited ' + fmtMins_(t.wait) : '') + (V.departed ? ' · total ' + fmtMins_(t.total) : '')),
    el('label', { class: 'f', text: 'Outcome' }),
    chips(CFG.OUTCOMES, V.outcome || '', function (x) { V.outcome = x; saveState(); }, 'chips-outcome'),
    el('label', { class: 'f', for: 'vnotes', text: 'Notes' }),
    el('textarea', { id: 'vnotes', placeholder: 'What he said, promises, dates', onchange: function (e) { V.notes = e.target.value; saveState(); } }, V.notes || ''),
    el('div', { class: 'actions2' },
      btn('primary', 'check', 'Finish visit', function () {
        if (!V.arrived) { toast('Tap Arrived first, or cancel the visit.'); return; }
        if (!V.departed) V.departed = nowPk().time;
        var n = document.getElementById('vnotes'); if (n) V.notes = n.value;
        var done = V; T.S.visit = null;
        visitPush(done).then(function () { render(); toast('Visit saved.'); });
      }, 'v-finish'),
      btn('danger', 'trash', 'Cancel visit', function () {
        if (!confirm('Cancel this visit and remove it?')) return;
        var k = V.key; T.S.visit = null;
        T.S.outbox = T.S.outbox.filter(function (o) { return !(o.op === 'visit' && o.key === k); });
        queue({ op: 'visitdel', req_id: uuid(), key: k }).then(function () { render(); sync(true); });
      })));
}
SCREENS.log = function () {
  var v = view(), D = v.D;
  var items = D.logs.map(function (g) { return Object.assign({ type: 'log' }, g); })
    .concat(D.visits.filter(function (x) { return !T.S.visit || x.key !== T.S.visit.key; }).map(function (x) { return Object.assign({ type: 'visit', kind: 'visit', time: x.left }, x); }))
    .sort(byDateDesc);
  return el('div', null, topBar('Contact log'),
    visitCard(),
    el('h2', { text: 'Record' }),
    el('div', { class: 'tiles six' }, CFG.LOG_KINDS.map(function (x) {
      return tile(x.k === 'flag' ? 'red' : 'white', LOG_ICON[x.k], x.label, '', function () { openLog(x.k); }, 'lk-' + x.k);
    })),
    btn('sand wide', 'image', 'Summary picture for WhatsApp', function () { openImg('log'); }, 'logsummary'),
    el('h2', { text: 'History' }),
    el('div', { class: 'card list', id: 'loglist' }, items.length ? items.map(logRow) : el('p', { class: 'muted', text: 'Nothing recorded yet.' })));
};
function logRow(it) {
  var flag = it.kind === 'flag', t = it.type === 'visit' ? visitTimes_(it) : null;
  var sub = it.type === 'visit' ? [t.drive !== null ? 'drive ' + fmtMins_(t.drive) : '', t.wait !== null ? 'waited ' + fmtMins_(t.wait) : '', it.outcome || ''].filter(Boolean).join(' · ') : (it.notes || '');
  return el('button', { class: 'row logrow' + (flag ? ' flagrow' : ''), type: 'button', onclick: function () { openLogSheet(it); } },
    el('span', { class: 'lic' }, svg(LOG_ICON[it.kind] || 'log')),
    el('div', { class: 'grow' }, el('b', { text: flag ? 'Red flag: ' + it.flag : kindLabel_(it.kind) }),
      el('div', { class: 'sm', text: sub }),
      it.pending ? el('div', { class: 'pending', text: it.error ? 'Refused: ' + it.error : 'Waiting to send' }) : null),
    el('div', { class: 'sm right', text: fmtDate_(it.date) + (it.time ? '\n' + it.time : '') }));
}
function openLogSheet(it) {
  sheetOpen(function () {
    return sheetWrap('Log entry', [
      el('h2', { text: it.kind === 'flag' ? 'Red flag: ' + it.flag : kindLabel_(it.kind) }),
      el('p', { class: 'muted', text: fmtDate_(it.date) + (it.time ? ' · ' + it.time : '') }),
      it.type === 'visit' ? el('p', { text: ['Left ' + (it.left || '?'), 'arrived ' + (it.arrived || '?'), it.met ? 'met ' + it.met : '', 'left EME ' + (it.departed || '?')].filter(Boolean).join(', ') }) : null,
      it.notes ? el('p', { class: 'pre', text: it.notes }) : null,
      btn('danger wide', 'trash', 'Delete this entry', function () {
        if (!confirm('Delete this entry?')) return;
        var op = it.type === 'visit' ? 'visitdel' : 'logdel', pop = it.type === 'visit' ? 'visit' : 'log';
        T.S.outbox = T.S.outbox.filter(function (o) { return !(o.op === pop && o.key === it.key); });
        (it.pending && !it.log_id && !it.visit_id ? saveState() : queue({ op: op, req_id: uuid(), key: it.key })).then(function () { T.sheet = null; render(); sync(true); });
      }, 'logdel'),
      btn('wide', 'x', 'Close', sheetClose)]);
  });
}

// ---------- messages ----------
function waLink(text) {
  var ph = waPhone_(view().D.tenancy.phone);
  return 'https://wa.me/' + (ph || '') + '?text=' + encodeURIComponent(text);
}
function openMsg(kind, pay) { T.msg = { kind: kind, pay: pay, arrears: !!T.S.settings.arrearsInMsg }; go('message'); }
SCREENS.message = function () {
  var v = view(), M = T.msg, text, ph = waPhone_(v.D.tenancy.phone);
  if (M.kind === 'balance') {
    var pay = M.pay || v.D.payments.slice().sort(byDateDesc)[0] || null;
    text = balanceMessage_(v.D, v.L, pay, { arrears: M.arrears });
  } else text = reminderMessage_(v.D, v.L, v.today);
  return el('div', null, backBar(M.kind === 'balance' ? 'Balance message' : 'Reminder text'),
    M.kind === 'balance' ? el('label', { class: 'switch', for: 'inclarr' }, el('span', { text: 'Include earlier arrears' }),
      el('input', { id: 'inclarr', type: 'checkbox', checked: M.arrears, onchange: function (e) { M.arrears = e.target.checked; render(); } })) : null,
    el('div', { class: 'msg', id: 'msgtext' }, text.split('\n').map(function (l) { return el('div', { dir: 'auto', class: l ? '' : 'gap', text: l }); })),
    el('a', { class: 'btn primary wide wa', id: 'wa', href: waLink(text), target: '_blank', rel: 'noopener' }, svg('wa'),
      el('span', { text: ph ? 'Open ' + (v.D.tenancy.tenant || 'his') + "'s WhatsApp chat" : 'Open WhatsApp' })),
    ph ? null : el('p', { class: 'hint', text: 'Add his WhatsApp number in Settings to open his chat directly.' }),
    el('div', { class: 'actions2' },
      navigator.share ? btn('', 'share', 'Share', function () { navigator.share({ text: text }).catch(function () { }); }) : null,
      btn('', 'copy', 'Copy', function () { navigator.clipboard.writeText(text).then(function () { toast('Copied.'); }, function () { toast('Could not copy.'); }); })));
};

// ---------- pictures ----------
function openImg(kind, pay) {
  var t = todayPk();
  T.img = { kind: kind, pay: pay, arrears: !!T.S.settings.arrearsInMsg, period: '30', url: '', blob: null };
  go('image');
}
function logPeriod(p, today) {
  if (p === 'year') return { from: today.slice(0, 4) + '-01-01', title: 'This year' };
  if (p === 'all') return { from: CFG.EARLIEST, title: 'All entries' };
  return { from: addDaysYmd_(today, -30), title: 'Last 30 days' };
}
SCREENS.image = function () {
  var v = view(), I = T.img, c, title, name, caption = '';
  DRAW.eurRate = T.S.settings.eurRate;
  if (I.kind === 'statement') { c = drawStatement(v, I.arrears); title = 'Statement'; name = 'Rent_Statement_' + v.L.year; }
  else if (I.kind === 'balance') {
    var bp = I.pay ? (v.D.payments.filter(function (x) { return x.key === I.pay.key; })[0] || I.pay) : null;
    c = drawBalance(v, bp, I.arrears); title = 'Balance update'; name = 'Rent_Balance';
    caption = balanceMessage_(v.D, v.L, bp, { arrears: I.arrears });
  }
  else if (I.kind === 'receipt') {
    var p = v.D.payments.filter(function (x) { return x.key === I.pay.key; })[0] || I.pay;
    c = drawReceipt(v, p, I.arrears); title = 'Receipt'; name = 'Rent_Receipt_' + (p.pay_id || p.date);
    caption = balanceMessage_(v.D, v.L, p, { arrears: I.arrears });
  } else if (I.kind === 'reminder') { c = drawReminder(v, I.arrears); title = 'Rent reminder'; name = 'Rent_Reminder_' + v.today.slice(0, 7); caption = reminderMessage_(v.D, v.L, v.today, { arrears: I.arrears }); }
  else { var P = logPeriod(I.period, v.today); c = drawLogSummary(v, P.from, v.today, P.title); title = 'Contact log summary'; name = 'Contact_Log_' + v.today; }
  name += '_' + v.today + '.png';
  var img = el('img', { class: 'stmt', id: 'stmtimg', alt: title });
  c.toBlob(function (b) {
    if (I.url) URL.revokeObjectURL(I.url);
    I.blob = b; I.url = URL.createObjectURL(b); img.src = I.url; img.setAttribute('data-bytes', String(b.size));
  }, 'image/png');
  var ph = waPhone_(v.D.tenancy.phone);
  return el('div', null, backBar(title, I.kind === 'log' ? 'log' : 'home'),
    I.kind === 'log' ? chips(['30', 'year', 'all'], I.period, function (x) { I.period = x; render(); }, 'chips-period', function (x) { return logPeriod(x, v.today).title; }) : null,
    I.kind !== 'log' ? el('label', { class: 'switch', for: 'starr' }, el('span', { text: 'Mention earlier arrears in the picture' + (I.kind === 'statement' ? '' : ' and text') }),
      el('input', { id: 'starr', type: 'checkbox', checked: I.arrears, onchange: function (e) { I.arrears = e.target.checked; render(); } })) : null,
    btn('primary wide', 'share', 'Share picture', function () {
      if (!I.blob) return;
      var file = new File([I.blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(function () { });
      else { var a = el('a', { href: I.url, download: name }); document.body.appendChild(a); a.click(); a.remove(); }
    }, 'sharestmt'),
    el('p', { class: 'hint', text: 'Choose WhatsApp, then ' + (v.D.tenancy.tenant || 'his chat') + '. ' + (caption ? 'Then send the matching text below.' : '') }),
    caption ? el('a', { class: 'btn wide wa', id: 'wa', href: waLink(caption), target: '_blank', rel: 'noopener' }, svg('wa'),
      el('span', { text: ph ? 'Send the text in his chat' : 'Send the text on WhatsApp' })) : null,
    img);
};

// ---------- settings ----------
SCREENS.settings = function () {
  var S = T.S, D = view().D, phone;
  var refused = S.outbox.filter(function (o) { return o.error; });
  return el('div', null, topBar('Settings'),
    refused.length ? el('div', { class: 'card' }, el('b', { text: 'Not accepted by the sheet' }),
      refused.map(function (o) {
        return el('div', { class: 'row' }, el('div', null, el('div', { text: o.op + (o.amount ? ' ' + fmtRs_(o.amount) : '') + (o.date ? ' ' + fmtDate_(o.date) : '') }), el('div', { class: 'sm', text: o.error })),
          btn('danger small', 'trash', 'Remove', function () { S.outbox = S.outbox.filter(function (x) { return x !== o; }); saveState().then(render); }));
      })) : null,
    el('div', { class: 'card' },
      el('label', { class: 'f', for: 'tphone', text: (D.tenancy.tenant || 'Tenant') + "'s WhatsApp number" }),
      phone = el('input', { id: 'tphone', type: 'tel', autocomplete: 'off', placeholder: '+34 612 345 678', value: D.tenancy.phone || '' }),
      el('div', { class: 'hint', text: 'With country code. Kept in your Sheet. Messages then open his chat directly.' }),
      btn('wide', 'check', 'Save number', function () {
        var v = phone.value.trim();
        if (v && !waPhone_(v)) { toast('Check the number, with country code.'); return; }
        queue({ op: 'phone', req_id: uuid(), phone: v }).then(function () { toast('Saved.'); render(); sync(true); });
      }, 'savephone')),
    el('div', { class: 'card' },
      el('label', { class: 'f', for: 'rate', text: 'Euro rate (Rs for €1)' }),
      el('input', { id: 'rate', inputmode: 'decimal', value: String(S.settings.eurRate || ''), onchange: function (e) {
        var n = Number(e.target.value); if (n > 0 && n < 10000) { S.settings.eurRate = n; saveState(); toast('Saved.'); } else toast('Enter a rate like 310.7');
      } }),
      el('div', { class: 'hint', text: 'Used only to show approximate euro amounts.' }),
      el('label', { class: 'switch', for: 'arrdef' }, el('span', { text: 'Mention earlier arrears in messages by default' }),
        el('input', { id: 'arrdef', type: 'checkbox', checked: !!S.settings.arrearsInMsg, onchange: function (e) { S.settings.arrearsInMsg = e.target.checked; saveState(); } }))),
    tenantCard(),
    bioCard(),
    el('div', { class: 'card' },
      btn('wide', 'update', 'Update app', updateApp, 'updapp'),
      el('p', { class: 'muted', text: 'App ' + BUILD_ID + (S.data && S.data.version ? ' · sheet script ' + S.data.version : '') })),
    btn('danger wide', 'trash', 'Reset this phone', function () {
      var w = S.outbox.length + S.uploads.length;
      if (prompt('Type RESET to remove the rent data from this phone.' + (w ? ' ' + w + ' unsent item(s) will be lost.' : '')) === 'RESET') resetPhone();
    }, 'reset'));
};
// ---------- tenant page ----------
function tenantAction(action) {
  if (!navigator.onLine) { toast('Needs signal.'); return; }
  api({ op: 'push', token: T.S.token, items: [{ op: 'tenantlink', req_id: uuid(), action: action }] }).then(function (r) {
    if (!r.ok || !r.results[0].ok) throw r;
    return sync(true);
  }).then(function () { toast(action === 'off' ? 'Tenant page turned off.' : 'New tenant link ready.'); })
    .catch(function () { toast('Could not reach the sheet. Try again.'); });
}
function tenantCard() {
  var D = T.S.data || {}, link = D.tenantLink;
  return el('div', { class: 'card', id: 'tenantcard' },
    el('div', { class: 'row' }, el('div', null, el('b', { text: (D.tenancy && D.tenancy.tenant || 'Tenant') + "'s page" }),
      el('div', { class: 'sm', text: link ? (D.tenantLastView ? 'Last opened ' + D.tenantLastView.slice(0, 16) : 'Not opened yet') : 'Off' })),
      el('span', { class: 'chip ' + (link ? 'ok' : 'wait'), text: link ? 'On' : 'Off' })),
    el('p', { class: 'hint', text: 'A private link he can open without any login. It shows only this year: rent, payments, receipts and maintenance.' }),
    link ? el('div', null,
      el('a', { class: 'btn primary wide wa', id: 'sendlink', target: '_blank', rel: 'noopener',
        href: 'https://wa.me/' + (waPhone_(D.tenancy && D.tenancy.phone) || '') + '?text=' + encodeURIComponent(wrapMsg_(D, ['Your rent page for 169-E: ' + link])) }, svg('wa'), el('span', { text: 'Send him the link' })),
      el('div', { class: 'actions2' },
        btn('', 'copy', 'Copy link', function () { navigator.clipboard.writeText(link).then(function () { toast('Copied.'); }, function () { toast('Could not copy.'); }); }),
        btn('', 'link', 'Open it', function () { window.open(link, '_blank'); })),
      el('div', { class: 'actions2' },
        btn('', 'sync', 'New link', function () { if (confirm('Make a new link? The old one stops working.')) tenantAction('new'); }, 'newlink'),
        btn('danger', 'x', 'Turn off', function () { if (confirm('Turn off his page? The link stops working.')) tenantAction('off'); }, 'linkoff')))
      : btn('primary wide', 'link', 'Make his page link', function () { tenantAction('new'); }, 'makelink'));
}

// ---------- Face ID: the PIN is kept wrapped by a key only Face ID can release (WebAuthn PRF) ----------
var BIO = 'r169.bio';
var MAINT_NOTE = 'Maintenance before November 2026 is not listed here. Maintenance is added only when a written receipt has been sent as a photo on WhatsApp.';
function bioReady() { return !!localStorage.getItem(BIO) && !!window.PublicKeyCredential; }
function prfSalt() { return new TextEncoder().encode('169-E Rent unlock key, version 1'); }
function prfAesKey(out) {
  return crypto.subtle.importKey('raw', out, 'HKDF', false, ['deriveKey']).then(function (k) {
    return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(16), info: new TextEncoder().encode('pin-wrap') },
      k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  });
}
function bioGet(id) {
  return navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rpId: location.hostname,
    allowCredentials: [{ type: 'public-key', id: unb64(id) }], userVerification: 'required', timeout: 60000,
    extensions: { prf: { eval: { first: prfSalt() } } } } }).then(function (a) {
    var r = a && a.getClientExtensionResults().prf;
    if (!r || !r.results || !r.results.first) throw new Error('noprf');
    return r.results.first;
  });
}
function bioEnable(pin) {
  if (T.bioBusy) return Promise.reject(new Error('busy'));
  T.bioBusy = true;
  var salt = prfSalt();
  return navigator.credentials.create({ publicKey: { rp: { name: '169-E Rent', id: location.hostname },
    user: { id: crypto.getRandomValues(new Uint8Array(16)), name: '169-E Rent', displayName: '169-E Rent' },
    challenge: crypto.getRandomValues(new Uint8Array(32)), timeout: 60000,
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
    extensions: { prf: { eval: { first: salt } } } } }).then(function (cred) {
    var ext = cred.getClientExtensionResults().prf || {}, id = b64(cred.rawId);
    if (ext.enabled === false) throw new Error('noprf');
    var first = ext.results && ext.results.first;
    return (first ? Promise.resolve(first) : bioGet(id)).then(prfAesKey).then(function (key) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(pin)).then(function (ct) {
        localStorage.setItem(BIO, JSON.stringify({ id: id, iv: b64(iv), ct: b64(ct) }));
      });
    });
  }).finally(function () { T.bioBusy = false; });
}
function bioUnlock() {
  if (T.bioBusy) return Promise.reject(new Error('busy'));
  T.bioBusy = true;
  var b = JSON.parse(localStorage.getItem(BIO));
  return bioGet(b.id).then(prfAesKey).then(function (key) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(b.iv) }, key, unb64(b.ct));
  }).then(function (pt) { return unlock(new TextDecoder().decode(pt)); })
    .catch(function (e) { if (e && e.name === 'NotAllowedError') throw new Error('cancel'); throw e; })
    .finally(function () { T.bioBusy = false; });
}
function bioCard() {
  if (!window.PublicKeyCredential) return null;
  var on = bioReady(), pin;
  return el('div', { class: 'card', id: 'biocard' },
    el('div', { class: 'row' }, el('b', { text: 'Unlock with Face ID' }), el('span', { class: 'chip ' + (on ? 'ok' : 'wait'), text: on ? 'On' : 'Off' })),
    on ? btn('wide', 'x', 'Turn off Face ID', function () { localStorage.removeItem(BIO); render(); toast('Face ID unlock turned off.'); }, 'biooff')
      : el('div', null,
        el('label', { class: 'f', for: 'biopin', text: 'Type your PIN to turn it on' }),
        pin = el('input', { id: 'biopin', class: 'pin', type: 'password', inputmode: 'numeric', maxlength: '6', autocomplete: 'off' }),
        btn('primary wide', 'faceid', 'Turn on Face ID', function () {
          var v = pin.value, st = stored();
          deriveKey(v, unb64(st.salt)).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(st.iv) }, k, unb64(st.ct)); })
            .then(function () { return bioEnable(v); })
            .then(function () { render(); toast('Face ID unlock is on. Your PIN still works too.'); })
            .catch(function (e) {
              toast(e && e.message === 'noprf' ? 'This phone cannot do Face ID unlock for web apps. Keep using the PIN.' : e && e.name === 'OperationError' ? 'Wrong PIN.' : 'Face ID was not set up.');
            });
        }, 'bioon')),
    el('p', { class: 'hint', text: 'Needs iOS 18 or newer. The PIN always works as a backup.' }));
}

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
setInterval(function () {
  if (T.key && Date.now() - T.idleAt > IDLE_MS) { lock(); return; }
  var ck = document.getElementById('clocks'); if (ck) ck.replaceWith(clockEl());
  if (T.S && T.screen === 'log' && T.S.visit && !T.sheet && !document.activeElement.matches('textarea,input')) render();
}, 15000);
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
