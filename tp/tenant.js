/* 169-E Rent: the tenant's own page. Read only, this year only, opened from a private link. Nothing is stored on his phone. */
'use strict';
var TP = { data: null, ledger: null, today: '', err: '', img: null };

function el(tag, attrs) {
  var e = document.createElement(tag);
  var kids = Array.prototype.slice.call(arguments, 2);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v === null || v === undefined || v === false) return;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2).toLowerCase(), v); else e.setAttribute(k, v === true ? '' : v);
  });
  kids.forEach(function add(k) {
    if (k === null || k === undefined || k === false) return;
    if (Array.isArray(k)) return k.forEach(add);
    e.appendChild(typeof k === 'string' || typeof k === 'number' ? document.createTextNode(String(k)) : k);
  });
  return e;
}

function parseLink() {
  var m = /^#([A-Za-z0-9_-]+)\.([A-Za-z0-9]+)$/.exec(location.hash || '');
  if (!m) return null;
  try { return { api: atob(m[1].replace(/-/g, '+').replace(/_/g, '/')), key: m[2] }; } catch (e) { return null; }
}

function getJson(url, opts) {
  var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 30000);
  opts = opts || {}; opts.signal = ctl.signal; opts.redirect = 'follow'; opts.credentials = 'omit'; opts.cache = 'no-store';
  return fetch(url, opts).then(function (r) {
    return r.text().then(function (txt) {
      try { return JSON.parse(txt); }
      catch (e) { throw new Error(/<html/i.test(txt) ? 'The server sent a web page instead of data (HTTP ' + r.status + '). The web app may need "Who has access: Anyone".' : 'Unexpected answer (HTTP ' + r.status + ').'); }
    });
  }).finally(function () { clearTimeout(t); });
}
function fetchTenant(L) {
  var sep = L.api.indexOf('?') >= 0 ? '&' : '?';
  return getJson(L.api + sep + 'op=tenant&key=' + encodeURIComponent(L.key) + '&t=' + Date.now())
    .catch(function () {
      return getJson(L.api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ op: 'tenant', key: L.key }) });
    });
}
function load(attempt) {
  attempt = attempt || 1;
  var L = parseLink();
  if (!L || !/^https?:\/\//.test(L.api)) { TP.err = 'This link is not complete. Please ask for the link again.'; render(); return; }
  TP.err = ''; TP.detail = ''; TP.loading = true; render();
  fetchTenant(L).then(function (r) {
    TP.loading = false;
    if (!r.ok) { TP.err = r.error || 'This page is not available.'; render(); return; }
    TP.data = r.data; TP.data.files = []; TP.ledger = r.ledger; TP.today = r.today; render();
  }).catch(function (e) {
    if (attempt < 3 && navigator.onLine !== false) { setTimeout(function () { load(attempt + 1); }, attempt * 1500); return; }
    TP.loading = false;
    TP.err = navigator.onLine === false ? 'No internet. Connect and try again.' : 'Could not load the page right now. Please try again.';
    TP.detail = String(e && e.message || e || '');
    render();
  });
}

function v() { return { D: TP.data, L: TP.ledger, today: TP.today }; }

function render() {
  var app = document.getElementById('app');
  app.className = 'nobar';
  if (TP.loading) { app.replaceChildren(el('p', { class: 'muted', text: 'Loading…' })); return; }
  if (TP.err || !TP.data) {
    app.replaceChildren(el('div', null, el('img', { src: 'logo-160.png', alt: '169 E Rental Management', class: 'biglogo' }),
      el('h1', { text: '169-E Rent' }), el('p', { id: 'tperr', text: TP.err || 'Loading…' }),
      TP.detail ? el('p', { class: 'hint', id: 'tpdetail', text: 'Details: ' + TP.detail }) : null,
      el('button', { class: 'btn primary wide', type: 'button', onclick: function () { load(1); } }, 'Try again')));
    return;
  }
  var D = TP.data, L = TP.ledger, Y = L.cur, yr = L.year, r = D.rates[0];
  var cells = [];
  for (var m = 1; m <= 12; m++) {
    var k = yr + '-' + pad2_(m), mo = L.months.filter(function (x) { return x.month === k; })[0];
    var paid = D.payments.filter(function (p) { return p.date.slice(0, 7) === k; }).reduce(function (s, p) { return s + (+p.amount); }, 0);
    cells.push(el('div', { class: 'm ' + (!mo ? (paid ? 'paid' : 'future') : paid ? 'paid' : 'nil') },
      el('b', { text: CFG.MONTHS[m - 1].slice(0, 3) }), !mo && !paid ? '·' : paid ? groupNum_(paid) : 'Nil'));
  }
  var pays = D.payments.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var claims = D.claims.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  app.replaceChildren(el('div', null,
    el('div', { class: 'top' }, el('div', { class: 'brand' }, el('img', { src: 'logo-160.png', alt: '', class: 'logo' }),
      el('div', { class: 'title', text: '169-E Rent' })), el('span', { class: 'sm muted', text: fmtDate_(TP.today) })),
    el('p', { class: 'arabic', dir: 'rtl', text: CFG.SALAM }),
    el('p', null, el('b', { text: salut_(D) + ',' }), ' this page shows your rent for ' + yr + '.'),
    el('div', { class: 'card hero' + (L.yearBalance <= 0 ? ' clear' : ''), id: 'tbal' },
      el('div', { class: 'lbl', text: L.yearBalance > 0 ? 'Remaining for ' + yr : 'Rent for ' + yr + ' is clear' }),
      el('div', { class: 'big', id: 'tbalval', text: fmtRs_(Math.max(L.yearBalance, 0)) }),
      el('div', { class: 'sub', text: 'Due so far ' + groupNum_(Y.rent) + ', received ' + groupNum_(Y.paid) + (Y.maint ? ', maintenance ' + groupNum_(Y.maint) : '') })),
    r ? el('div', { class: 'card' }, el('div', { class: 'row' }, el('b', { text: 'Monthly rent' }), el('span', { class: 'amt', text: fmtRs_(r.rent) })),
      el('div', { class: 'row' }, el('span', { text: 'Due by' }), el('b', { text: 'the ' + ordinal_(r.due_day) + ' of each month' }))) : null,
    el('h2', { text: 'Received in ' + yr }),
    el('div', { class: 'grid', id: 'tgrid' }, cells),
    el('h2', { text: 'Your payments' }),
    el('div', { class: 'card list', id: 'tpays' }, pays.length ? pays.map(function (p) {
      return el('button', { class: 'row', type: 'button', onclick: function () { openReceipt(p); } },
        el('div', null, el('div', { text: fmtDate_(p.date) }), el('div', { class: 'sm', text: (p.pay_id || '') + ' · Tap for receipt' })),
        el('div', { class: 'amt', text: fmtRs_(p.amount) }));
    }) : el('p', { class: 'muted', text: 'No payments yet this year.' })),
    el('h2', { text: 'Maintenance' }),
    el('div', { class: 'note', id: 'tmaintnote', text: 'Maintenance before November 2026 is not listed here. Maintenance is added only when a written receipt has been sent as a photo on WhatsApp.' }),
    el('div', { class: 'card list', id: 'tclaims' }, claims.length ? claims.map(function (c) {
      var counted = c.status !== 'rejected';
      return el('div', { class: 'row' },
        el('div', null, el('div', { text: c.desc }), el('div', { class: 'sm', text: fmtDate_(c.date) }),
          el('span', { class: 'chip ' + (counted ? 'ok' : 'wait'), text: counted ? 'Counted against rent' : 'Not counted' })),
        el('div', { class: 'amt' + (counted ? '' : ' struck'), text: fmtRs_(c.amount) }));
    }) : el('p', { class: 'muted', text: 'None recorded.' })),
    el('p', { class: 'arabic', dir: 'rtl', text: CFG.JAZAK }),
    el('p', { class: 'hint', text: 'Questions about this page? Please contact the owner.' })));
}

function openReceipt(p) {
  var c = drawReceipt(v(), p, false), name = 'Rent_Receipt_' + (p.pay_id || p.date) + '.png';
  var img = el('img', { class: 'stmt', id: 'treceipt', alt: 'Receipt' }), blob = null, url = '';
  c.toBlob(function (b) { blob = b; url = URL.createObjectURL(b); img.src = url; img.setAttribute('data-bytes', String(b.size)); }, 'image/png');
  var bg = el('div', { class: 'sheet-bg', onclick: function (e) { if (e.target === e.currentTarget) close(); } },
    el('div', { class: 'sheet tall', role: 'dialog', 'aria-label': 'Receipt' },
      el('button', { class: 'btn primary wide', type: 'button', id: 'tsave', onclick: function () {
        if (!blob) return;
        var f = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(function () { });
        else { var a = el('a', { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); }
      } }, 'Save or share receipt'),
      img,
      el('button', { class: 'btn wide', type: 'button', onclick: close }, 'Close')));
  function close() { bg.remove(); if (url) URL.revokeObjectURL(url); }
  document.body.appendChild(bg);
}

// If this browser once held the owner's phone app, nudge its offline copy to update; the page itself never uses it.
try { if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(function (r) { if (r) { r.update().catch(function () { }); if (r.waiting) r.waiting.postMessage('skip'); } }).catch(function () { }); } catch (e) { }
window.addEventListener('hashchange', function () { load(1); });
load(1);
