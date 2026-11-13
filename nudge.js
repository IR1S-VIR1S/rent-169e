/* 169-E Rent: follow-up messages, WhatsApp call with outcome, WhatsApp chat import. Loaded after app.js. */
'use strict';

// ---------- facts the owner types once (kept on this phone only, never in the published files) ----------
var FACT_KEYS = ['commitment', 'trust', 'consequence'];
var FACT_HELP = 'commitment: what he promised you, in one sentence\ntrust: one sentence about trust (for example the meaning of his name)\nconsequence: what you will really do if the year is not cleared, with the date';
function factsOf() {
  var out = {};
  String((T.S.settings && T.S.settings.facts) || '').split('\n').forEach(function (l) {
    var m = /^\s*([a-z_]+)\s*:\s*(.+)$/i.exec(l);
    if (m && FACT_KEYS.indexOf(m[1].toLowerCase()) >= 0) out[m[1].toLowerCase()] = m[2].trim();
  });
  return out;
}

// ---------- cues from the ledger and the contact log ----------
var NUDGES = [
  { n: 1, name: 'Personal accountability', aim: 'Reminds him of his own commitment' },
  { n: 2, name: 'Consistency', aim: 'Shows the gap between his word and what happened' },
  { n: 3, name: 'Relationship and trust', aim: 'Years of goodwill are being damaged' },
  { n: 4, name: 'Reasons no longer settle it', aim: 'An explanation is not a payment' },
  { n: 5, name: 'Firm boundary', aim: 'Payment or a written date, by a deadline' },
  { n: 6, name: 'Formal record', aim: 'From personal requests to a documented step' }
];
function nudgeCues(v) {
  var D = v.D, L = v.L, R = reminderInfo_(D, L, v.today), od = !!R && R.status === 'overdue' && L.yearBalance > 0;
  var from = od ? R.due : addDaysYmd_(v.today, -30);
  var C = contactCounts_(D, from, v.today), last = 0, lastDate = '', promise = null;
  D.logs.forEach(function (g) {
    var m = /^Approach (\d)/.exec(g.notes || '');
    if (m && g.kind === 'message' && g.date >= from && (g.date > lastDate || (g.date === lastDate && +m[1] > last))) { last = +m[1]; lastDate = g.date; }
    var p = /Promised by (\d{4}-\d{2}-\d{2})/.exec(g.notes || '');
    if (p && (!promise || g.date > promise.on)) promise = { on: g.date, by: p[1] };
  });
  var wa = (T.S.settings && T.S.settings.wa) || null;
  return { R: R, overdue: od, from: from, C: C, lastStage: last, lastDate: lastDate, next: Math.min(last + 1, 6),
    promise: promise && promise.by < v.today && promise.on >= addDaysYmd_(v.today, -60) ? promise : null,
    promiseOpen: promise && promise.by >= v.today ? promise : null,
    since: /^(19|20)\d\d/.test(String(D.tenancy.start || '')) ? +String(D.tenancy.start).slice(0, 4) : 0,
    waUnanswered: wa && wa.mineAfter > 0 && wa.hisLast ? wa : null };
}
function plural_(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function nudgeMessage(v, stage, K, F) {
  var D = v.D, L = v.L, R = K.R, b = [];
  var rent = fmtRs_(R ? R.unpaid || R.rent : Math.max(L.yearBalance, 0)), month = R ? monthName_(R.month) : String(L.year);
  var days = R && K.overdue ? daysText_(R.days) : '', due = R ? fmtDate_(R.due) : '';
  var state = K.overdue ? 'Rent of ' + rent + ' for ' + month + ' was due on ' + due + ' and is now ' + days + ' overdue.'
    : 'The balance for ' + L.year + ' stands at ' + fmtRs_(Math.max(L.yearBalance, 0)) + '.';
  var silence = K.C.unanswered > 0 ? 'Since ' + fmtDate_(K.from) + ' I have called ' + plural_(K.C.unanswered, 'time') + ' without an answer.'
    : K.waUnanswered ? 'My last ' + plural_(K.waUnanswered.mineAfter, 'message') + ' here since ' + fmtDate_(K.waUnanswered.hisLast) + ' have had no reply.' : '';
  if (stage === 1) {
    b.push(state);
    if (F.commitment) b.push('', F.commitment);
    b.push('', 'I am relying on your word. Kindly send it today and share the screenshot here.');
  } else if (stage === 2) {
    if (K.promise) b.push('On ' + fmtDate_(K.promise.on) + ' you told me it would be paid by ' + fmtDate_(K.promise.by) + '. That date has passed and nothing has arrived.');
    else b.push(state);
    if (silence) b.push(silence);
    b.push('', 'I have always taken you as a man whose word and action are the same.' + (days ? ' Today they are ' + days + ' apart.' : '') + ' Kindly close that gap today.',
      '', 'Please send it directly from your own account rather than through anyone else, so that nothing is delayed on the way.');
  } else if (stage === 3) {
    var yrs = K.since ? L.year - K.since : 0;
    b.push(K.since ? 'You have been in our house since ' + K.since + (yrs > 1 ? ', ' + yrs + ' years' : '') + '. For us this was never only about rent. It has been a relationship of trust.'
      : 'For us this was never only about rent. It has been a relationship of trust.');
    if (F.trust) b.push('', F.trust);
    b.push('', 'Each late month' + (silence ? ' and each unanswered call' : '') + ' takes something away from that trust, and I do not want to lose it.',
      '', (K.overdue ? month + ' rent of ' + rent + ' is ' + days + ' overdue. ' : '') + 'Kindly clear it today.');
  } else if (stage === 4) {
    b.push('I have listened to every reason for delay with patience, and I do not question your difficulties.',
      '', 'But the reason changes every month and the result stays the same: the rent arrives late. The rent does not depend on how the month went. It is due on its date.',
      '', 'I am no longer able to accept an explanation in place of the payment. ' + (K.overdue ? rent + ' for ' + month + ', ' + days + ' overdue.' : state) + ' Kindly send it today.');
  } else if (stage === 5) {
    var dl = addDaysYmd_(v.today, 2);
    b.push(state, '', 'I need one of two things from you by 8 pm Pakistan time on ' + fmtDate_(dl) + ':',
      '1. The full ' + rent + ' in the account, with the screenshot here, or',
      '2. A written message from you here with the exact date and the exact amount you will pay.',
      '', 'Kindly do not send it through anyone else. If I receive neither, I will take it that there is no commitment from your side and decide accordingly.');
  } else {
    b.push('This message is for the record, as of ' + fmtDate_(v.today) + '.', '',
      'Rent outstanding for ' + L.year + ': ' + fmtRs_(Math.max(L.yearBalance, 0)) + '.');
    if (K.overdue) b.push(month + ' rent: ' + days + ' overdue (due ' + due + ').');
    var rec = [K.C.messages ? plural_(K.C.messages, 'message') + ' sent' : '', K.C.calls ? plural_(K.C.calls, 'call') + ' made' : '',
      K.C.unanswered ? K.C.unanswered + ' not answered' : '', K.C.visits ? plural_(K.C.visits, 'visit') + ' to EME' : ''].filter(Boolean);
    if (rec.length) b.push('Since ' + fmtDate_(K.from) + ': ' + rec.join(', ') + '.');
    if (F.consequence) b.push('', F.consequence);
    b.push('', 'I would much prefer not to take this step. Clearing the balance stops it. Kindly reply here with your payment date.');
  }
  return wrapMsg_(D, b);
}

function openNudge() { T.nudge = { stage: 0 }; go('nudge'); }
function saveFacts(text) { T.S.settings.facts = String(text || '').slice(0, 2000); return saveState(); }
function openFacts() {
  var ta;
  sheetOpen(function () {
    return sheetWrap('Message facts', [
      el('h2', { text: 'Facts used in the messages' }),
      el('p', { class: 'muted', text: 'One per line. Kept on this phone only. A line left out is simply not used.' }),
      ta = el('textarea', { id: 'factsbox', rows: '9', placeholder: FACT_HELP }, T.S.settings.facts || ''),
      btn('primary wide', 'check', 'Save', function () { saveFacts(ta.value).then(function () { T.sheet = null; render(); toast('Saved.'); }); }, 'factssave'),
      btn('wide', 'x', 'Close', sheetClose)]);
  });
}
SCREENS.nudge = function () {
  var v = view(), K = nudgeCues(v), F = factsOf(), N = T.nudge || (T.nudge = { stage: 0 }), ph = waPhone_(v.D.tenancy.phone);
  var stage = N.stage || K.next, info = NUDGES[stage - 1], text = nudgeMessage(v, stage, K, F);
  var facts = [K.overdue ? daysText_(K.R.days) + ' overdue' : 'Nothing overdue today',
    K.C.unanswered ? plural_(K.C.unanswered, 'call') + ' not answered since ' + fmtDate_(K.from) : '',
    K.promise ? 'promised ' + fmtDate_(K.promise.by) + ', missed' : K.promiseOpen ? 'promise open until ' + fmtDate_(K.promiseOpen.by) : '',
    K.lastStage ? 'last sent: approach ' + K.lastStage + ' on ' + fmtDate_(K.lastDate) : 'no follow-up sent yet'].filter(Boolean).join(' · ');
  var missing = FACT_KEYS.filter(function (k) { return !F[k]; });
  function sent() {
    var n = nowPk();
    queue({ op: 'log', req_id: uuid(), key: uuid(), date: n.date, time: n.time, kind: 'message', flag: '', notes: 'Approach ' + stage + ' (' + info.name + ') sent on WhatsApp.' })
      .then(function () { T.nudge.stage = 0; sync(true); toast('Recorded in the log.'); });
  }
  return el('div', null, backBar('Follow-up message'),
    el('div', { class: 'note', id: 'nudgecues', text: facts }),
    K.promiseOpen ? el('p', { class: 'hint', text: 'He has a promise still running. Consider waiting until ' + fmtDate_(K.promiseOpen.by) + '.' }) : null,
    el('label', { class: 'f', text: 'Approach' }),
    el('div', { class: 'chips', id: 'chips-nudge' }, NUDGES.map(function (x) {
      return el('button', { type: 'button', 'data-v': String(x.n), class: x.n === stage ? 'on' : '', onclick: function () { N.stage = x.n; render(); } },
        x.n + '. ' + x.name + (x.n === K.next ? ' (suggested)' : ''));
    })),
    el('p', { class: 'hint', id: 'nudgeaim', text: info.aim + '. Each approach is a different angle, not a louder version of the last.' }),
    el('div', { class: 'msg', id: 'nudgetext' }, text.split('\n').map(function (l) { return el('div', { dir: 'auto', class: l ? '' : 'gap', text: l }); })),
    el('a', { class: 'btn primary wide wa', id: 'nudgewa', href: waLink(text), target: '_blank', rel: 'noopener', onclick: sent }, svg('wa'),
      el('span', { text: ph ? 'Send in his WhatsApp chat' : 'Open WhatsApp' })),
    el('p', { class: 'hint', text: 'Tapping Send records it in the contact log. Read it once before you press send in WhatsApp.' }),
    el('div', { class: 'actions2' },
      btn('', 'copy', 'Copy', function () { navigator.clipboard.writeText(text).then(function () { toast('Copied.'); }, function () { toast('Could not copy.'); }); }, 'nudgecopy'),
      btn('', 'doc', 'Facts' + (missing.length ? ' (' + missing.length + ' missing)' : ''), openFacts, 'nudgefacts')));
};

// ---------- WhatsApp call started from the app; the outcome is asked on the next opening ----------
function startCall() {
  var S = T.S, ph = waPhone_(view().D.tenancy.phone);
  if (!ph) { toast('Add his WhatsApp number in Settings first.'); return; }
  if (S.pendingCall) { render(); return; }
  var n = nowPk(), key = uuid();
  window.open('https://wa.me/' + ph, '_blank', 'noopener');
  S.pendingCall = { key: key, date: n.date, time: n.time, at: Date.now() };
  queue({ op: 'log', req_id: key, key: key, date: n.date, time: n.time, kind: 'call', flag: '', notes: 'WhatsApp call started from the app. Outcome not filled in yet.' })
    .then(function () { sync(true); });
}
var CALL_OUTCOMES = [['spoke', 'We spoke'], ['none', 'He did not answer'], ['callback', 'Left a message to call me back'], ['skip', 'I did not call']];
function callSheet() {
  var P = T.S.pendingCall, f = T.callForm || (T.callForm = { out: '', notes: '', promise: '' }), extra = el('div');
  function draw() {
    extra.replaceChildren.apply(extra, !f.out || f.out === 'skip' ? [] : [
      f.out === 'spoke' ? el('label', { class: 'f', for: 'cpromise', text: 'Did he promise a date? (optional)' }) : null,
      f.out === 'spoke' ? el('input', { id: 'cpromise', type: 'date', value: f.promise, min: P.date, oninput: function (e) { f.promise = e.target.value; } }) : null,
      el('label', { class: 'f', for: 'cnotes', text: f.out === 'spoke' ? 'What did he say?' : 'Notes (optional)' }),
      el('textarea', { id: 'cnotes', maxlength: '900', placeholder: f.out === 'spoke' ? 'His reason, what he agreed to, dates and amounts' : '', oninput: function (e) { f.notes = e.target.value; } }, f.notes)
    ].filter(Boolean));
  }
  function save() {
    if (!f.out) { toast('Choose what happened.'); return; }
    var S = T.S, notes = f.notes.trim(), item = null;
    if (f.out === 'spoke') item = { kind: 'call', notes: (f.promise ? 'Promised by ' + f.promise + '. ' : '') + (notes || 'Spoke on WhatsApp.') };
    if (f.out === 'none') item = { kind: 'no_answer', notes: 'WhatsApp call, not answered.' + (notes ? ' ' + notes : '') };
    if (f.out === 'callback') item = { kind: 'callback_req', notes: 'WhatsApp call not answered. Left a message asking him to call back.' + (notes ? ' ' + notes : '') };
    var unsent = S.outbox.some(function (o) { return o.op === 'log' && o.key === P.key && !o.error; });
    S.outbox = S.outbox.filter(function (o) { return !(o.op === 'log' && o.key === P.key); });
    var jobs = [];
    if (!unsent) jobs.push({ op: 'logdel', req_id: uuid(), key: P.key });
    if (item) { var k = uuid(); jobs.push({ op: 'log', req_id: k, key: k, date: P.date, time: P.time, kind: item.kind, flag: '', notes: item.notes }); }
    S.pendingCall = null; T.callForm = null; T.sheet = null;
    S.outbox = S.outbox.concat(jobs);
    saveState().then(function () { render(); sync(true); toast(item ? 'Recorded in the log.' : 'Removed.'); });
  }
  draw();
  return el('div', { class: 'sheet-bg' },
    el('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Call outcome', id: 'callsheet' },
      el('h2', { text: 'Your WhatsApp call' }),
      el('p', { class: 'muted', text: fmtDate_(P.date) + ' · ' + P.time + '. What happened?' }),
      el('div', { class: 'chips', id: 'chips-call' }, CALL_OUTCOMES.map(function (x) {
        return el('button', { type: 'button', 'data-v': x[0], class: f.out === x[0] ? 'on' : '', onclick: function (e) {
          f.out = x[0]; e.currentTarget.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === x[0]); }); draw();
        } }, x[1]);
      })),
      extra,
      btn('primary wide', 'check', 'Save', save, 'callsave'),
      btn('wide', 'clock', 'Later', function () { T.callLater = Date.now(); T.sheet = null; render(); }, 'calllater')));
}
// Called by render(): the sheet returns until the outcome is filled in.
function callDue() {
  var P = T.S && T.S.pendingCall;
  return !!P && Date.now() - P.at > 4000 && !(T.callLater && Date.now() - T.callLater < 10 * 60 * 1000);
}

// ---------- WhatsApp chat import (read on this phone; only day summaries go to the log) ----------
function u16_(a, i) { return a[i] | (a[i + 1] << 8); }
function u32_(a, i) { return (a[i] | (a[i + 1] << 8) | (a[i + 2] << 16) | (a[i + 3] << 24)) >>> 0; }
function readChatFile(file) {
  return file.arrayBuffer().then(function (buf) {
    var a = new Uint8Array(buf);
    if (!(a[0] === 0x50 && a[1] === 0x4b)) return new TextDecoder('utf-8').decode(a);
    var e = -1;
    for (var i = a.length - 22; i >= 0 && i > a.length - 70000; i--) if (u32_(a, i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('This zip could not be read.');
    var n = u16_(a, e + 10), p = u32_(a, e + 16), pick = null;
    for (var k = 0; k < n && u32_(a, p) === 0x02014b50; k++) {
      var nl = u16_(a, p + 28), name = new TextDecoder().decode(a.subarray(p + 46, p + 46 + nl));
      if (/\.txt$/i.test(name) && (!pick || /_chat\.txt$/i.test(name))) pick = { method: u16_(a, p + 10), size: u32_(a, p + 20), off: u32_(a, p + 42) };
      p += 46 + nl + u16_(a, p + 30) + u16_(a, p + 32);
    }
    if (!pick) throw new Error('No chat text file inside this zip. Export the chat again, Without Media.');
    var start = pick.off + 30 + u16_(a, pick.off + 26) + u16_(a, pick.off + 28), data = a.subarray(start, start + pick.size);
    if (pick.method === 0) return new TextDecoder('utf-8').decode(data);
    if (pick.method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('This phone cannot open the zip. In Files, press and hold the zip, choose Uncompress, then pick the _chat.txt file.');
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  });
}
var CHAT_IOS = /^\[(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s?([AaPp])?\.?[Mm]?\.?\]\s(.*)$/;
var CHAT_AND = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s(\d{1,2})[:.](\d{2})\s?([AaPp])?\.?[Mm]?\.?\s[-–]\s(.*)$/;
var CHAT_PROMISE = /\b(tomorrow|tonight|today|kal|aaj|parso|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|by the \d|inshallah|insha ?allah|will (send|pay|transfer|do)|bhej|kar d[eu]|transfer|sending|sent)\b/i;
function parseChat(text) {
  var msgs = [], cur = null, raw = [];
  String(text).split(/\r?\n/).forEach(function (line) {
    line = line.replace(/[‎‏‪-‮⁦-⁩﻿]/g, '').replace(/ | /g, ' ');
    var m = CHAT_IOS.exec(line) || CHAT_AND.exec(line);
    if (!m) { if (cur) cur.text += '\n' + line; return; }
    var rest = m[7], c = rest.indexOf(': ');
    cur = { a: +m[1], b: +m[2], y: +m[3] < 100 ? 2000 + +m[3] : +m[3], h: +m[4], mi: m[5], ap: (m[6] || '').toLowerCase(),
      who: c > 0 ? rest.slice(0, c) : '', text: c > 0 ? rest.slice(c + 2) : rest };
    raw.push(cur);
  });
  var mdy = raw.some(function (r) { return r.b > 12; }) && !raw.some(function (r) { return r.a > 12; });
  raw.forEach(function (r) {
    if (!r.who) return;
    var d = mdy ? r.b : r.a, mo = mdy ? r.a : r.b, h = r.h;
    if (r.ap === 'p' && h < 12) h += 12; if (r.ap === 'a' && h === 12) h = 0;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return;
    msgs.push({ date: r.y + '-' + pad2_(mo) + '-' + pad2_(d), time: pad2_(h) + ':' + r.mi, who: r.who.trim(), text: r.text.trim() });
  });
  var names = {};
  msgs.forEach(function (m) { names[m.who] = (names[m.who] || 0) + 1; });
  return { msgs: msgs, names: Object.keys(names).sort(function (x, y) { return names[y] - names[x]; }) };
}
function guessTenant(names, tenant) {
  var t = String(tenant || '').trim().toLowerCase().split(/\s+/)[0];
  var hit = t ? names.filter(function (n) { return n.toLowerCase().indexOf(t) >= 0; }) : [];
  return hit.length === 1 ? hit[0] : '';
}
function chatHash_(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
// One log line per day: who wrote how much, the calls each way (not answered, minutes talked), and up to three of his own messages (shortened), those about paying first.
var CHAT_VER = 2; // raise when the reader changes, so the next import rewrites every day already imported
var CHAT_SYS = /^(you )?pinned a message$|^(you deleted this message|this message was deleted)\.?$|end-to-end encrypted|^null$/i;
function chatSecs_(t) {
  var m = /(\d+)\s*(hr|hour|min|sec)/gi, x, s = 0;
  while ((x = m.exec(t))) s += +x[1] * (/^h/i.test(x[2]) ? 3600 : /^m/i.test(x[2]) ? 60 : 1);
  return s;
}
// Calls less than an hour apart (by the same caller) count as one try; a try is answered if any call in it was.
function chatTries_(list) {
  var tries = [];
  list.forEach(function (c) {
    var t = tries[tries.length - 1];
    if (t && c.at - t.last <= 60) { t.calls++; t.last = c.at; t.ans = t.ans || c.ans; t.sec += c.sec; }
    else tries.push({ calls: 1, last: c.at, ans: c.ans, sec: c.sec });
  });
  return tries;
}
function chatDays(msgs, him, from, to) {
  var days = {};
  msgs.forEach(function (m) {
    if (m.date < from || m.date > to) return;
    var t = m.text, isHim = m.who === him;
    if (CHAT_SYS.test(t)) return;
    var d = days[m.date] || (days[m.date] = { date: m.date, time: m.time, his: 0, mine: 0, iC: [], heC: [], said: [], other: [] });
    var at = (+m.time.slice(0, 2)) * 60 + (+m.time.slice(3, 5)), call = null;
    if (/^missed (voice|video) call\b/i.test(t) && t.length < 60) call = { at: at, ans: false, sec: 0 };
    else if (/^(voice|video) call\b/i.test(t) && t.length < 60) { var no = /no answer|declined|missed|cancel/i.test(t); call = { at: at, ans: !no, sec: no ? 0 : chatSecs_(t) }; }
    if (call) { (isHim ? d.heC : d.iC).push(call); return; }
    if (isHim) { d.his++; if (!/omitted>?$|^<attached/i.test(t) && t) (CHAT_PROMISE.test(t) ? d.said : d.other).push(t.replace(/\s+/g, ' ').slice(0, 140)); } else d.mine++;
  });
  function calls(who, list) {
    if (!list.length) return '';
    var tries = chatTries_(list), n = tries.length, no = tries.filter(function (x) { return !x.ans; }).length;
    var sec = tries.reduce(function (s, x) { return s + x.sec; }, 0), x = [plural_(list.length, 'call')];
    if (no) x.push(no === n ? (n === 1 ? 'not answered' : 'none answered') : plural_(no, 'try') .replace('trys', 'tries') + ' not answered');
    if (sec) x.push('talked ' + (sec < 60 ? sec + ' sec' : Math.round(sec / 60) + ' min'));
    return who + ' tried ' + (n === 1 ? 'once' : n + ' times') + ' (' + x.join(', ') + ')';
  }
  return Object.keys(days).sort().map(function (k) {
    var d = days[k], bits = [];
    if (d.his || d.mine) bits.push('He sent ' + d.his + ', you sent ' + d.mine);
    bits.push(calls('You', d.iC), calls('He', d.heC));
    bits = bits.filter(Boolean);
    d.said = d.said.concat(d.other).slice(0, 3); // what he said about paying first, then his other words
    var notes = (bits.join('. ') + '.' + (d.said.length ? ' He said: ' + d.said.map(function (x) { return '"' + x + '"'; }).join(' | ') : '')).slice(0, 1000);
    return { date: d.date, time: d.time, notes: notes, key: 'wa-' + d.date + '-' + chatHash_(notes) };
  }).filter(function (r) { return r.notes !== '.'; });
}
function chatStale() {
  var wa = T.S.settings.wa;
  if (!wa || !wa.at) return { never: true, days: 0 };
  var n = dayNum_(todayPk()) - dayNum_(wa.at);
  return { never: false, days: n, due: n >= 7 || wa.ver !== CHAT_VER, redo: wa.ver !== CHAT_VER };
}
function applyChat(parsed, him) {
  var S = T.S, v = view(), today = v.today, wa = S.settings.wa;
  var from = wa && wa.at && wa.ver === CHAT_VER ? addDaysYmd_(wa.at, -1) : addDaysYmd_(today, -60);
  if (!wa || wa.ver !== CHAT_VER) v.D.logs.forEach(function (g) { if (g.kind === 'wa_chat' && g.date < from) from = g.date; }); // improved reader: read every imported day again
  S.outbox.forEach(function (o) { if (o.op === 'log' && o.kind === 'wa_chat' && o.date < from) from = o.date; }); // days not yet in the sheet are read again
  var rows = chatDays(parsed.msgs, him, from, today), added = 0, changed = 0, jobs = [];
  rows.forEach(function (r) {
    var old = v.D.logs.filter(function (g) { return g.kind === 'wa_chat' && String(g.key).indexOf('wa-' + r.date + '-') === 0; });
    if (old.some(function (g) { return g.key === r.key; })) return;
    old.forEach(function (g) {
      S.outbox = S.outbox.filter(function (o) { return !(o.op === 'log' && o.key === g.key); });
      if (g.log_id || !g.pending) jobs.push({ op: 'logdel', req_id: uuid(), key: g.key });
    });
    if (old.length) changed++; else added++;
    jobs.push({ op: 'log', req_id: r.key, key: r.key, date: r.date, time: r.time, kind: 'wa_chat', flag: '', notes: r.notes });
  });
  var hisAll = parsed.msgs.filter(function (m) { return m.who === him; }), hisLast = hisAll.length ? hisAll[hisAll.length - 1] : null;
  var mineAfter = parsed.msgs.filter(function (m) { return m.who !== him && (!hisLast || (m.date + m.time) > (hisLast.date + hisLast.time)); }).length;
  S.settings.wa = { ver: CHAT_VER, at: today, him: him, hisLast: hisLast ? hisLast.date : '', mineAfter: hisLast ? mineAfter : 0,
    last: parsed.msgs.length ? parsed.msgs[parsed.msgs.length - 1].date : '' };
  S.outbox = S.outbox.concat(jobs);
  return saveState().then(function () { return { added: added, changed: changed, total: parsed.msgs.length, from: from }; });
}
function openChatImport() {
  var I = T.chat = { err: '', parsed: null, him: '', done: null };
  function pick(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    I.err = 'Reading';
    render();
    readChatFile(f).then(function (text) {
      var P = parseChat(text);
      if (!P.msgs.length) throw new Error('No messages found in that file. Choose the file made by WhatsApp > Export Chat.');
      I.parsed = P; I.err = '';
      I.him = (T.S.settings.wa && P.names.indexOf(T.S.settings.wa.him) >= 0 ? T.S.settings.wa.him : '') || guessTenant(P.names, view().D.tenancy.tenant);
      if (I.him) return finish(); render();
    }).catch(function (x) { I.err = (x && x.message) || 'Could not read that file.'; I.parsed = null; render(); });
  }
  function finish() { return applyChat(I.parsed, I.him).then(function (r) { I.done = r; I.parsed = null; render(); sync(true); }); }
  sheetOpen(function () {
    var st = chatStale();
    return sheetWrap('Import WhatsApp chat', [
      el('h2', { text: 'Import his WhatsApp chat' }),
      I.done ? el('div', { class: 'note', id: 'chatdone', text: I.done.total + ' messages read. ' + I.done.added + ' day(s) added to the log, ' + I.done.changed + ' updated (from ' + fmtDate_(I.done.from) + ').' }) : null,
      I.done ? null : el('p', { class: 'muted', text: st.never ? 'Not imported yet.' : 'Last imported ' + (st.days === 0 ? 'today' : daysText_(st.days) + ' ago') + '.' }),
      I.done || I.parsed ? null : el('div', { class: 'card', id: 'chatsteps' },
        el('div', { class: 'row' }, el('b', { text: '1' }), el('div', { class: 'grow', text: 'In WhatsApp open his chat, tap his name at the top, scroll down, Export Chat, Without Media.' })),
        el('div', { class: 'row' }, el('b', { text: '2' }), el('div', { class: 'grow', text: 'Choose Save to Files.' })),
        el('div', { class: 'row' }, el('b', { text: '3' }), el('div', { class: 'grow', text: 'Come back here, tap Choose the file and pick that zip.' }))),
      I.parsed && !I.him ? el('div', null, el('label', { class: 'f', text: 'Which name is his?' }),
        chips(I.parsed.names, '', function (x) { I.him = x; finish(); }, 'chips-him')) : null,
      I.done || I.parsed ? null : el('label', { class: 'btn primary wide', for: 'chatfile' }, svg('doc'), el('span', { text: 'Choose the file' })),
      I.done || I.parsed ? null : el('input', { id: 'chatfile', type: 'file', accept: '.zip,.txt,application/zip,text/plain', class: 'hidefile', onchange: pick }),
      el('div', { class: 'err', id: 'chaterr', text: I.err }),
      el('p', { class: 'hint', text: 'The chat is read on this phone. Only one line per day goes to the log: counts, missed calls and up to three of his messages, shortened.' }),
      btn('wide', 'x', I.done ? 'Done' : 'Close', sheetClose, 'chatclose')]);
  });
}
function chatCard() {
  var st = chatStale();
  if (!st.never && !st.due) return null;
  return el('button', { class: 'card flagcard chatcard', type: 'button', id: 'chatcard', onclick: openChatImport }, svg('wa'),
    el('div', null, el('b', { text: st.never ? 'Import his WhatsApp chat' : 'Refresh his WhatsApp chat' }),
      el('div', { class: 'sm', text: st.never ? 'Adds his replies, missed calls and promises to the log' : st.redo ? 'The chat reader was improved. Import the same chat again to correct the earlier days.' : 'Last imported ' + daysText_(st.days) + ' ago. Weekly keeps the messages accurate.' })));
}
