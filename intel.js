/* 169-E Rent: what he said (his reasons, from imported chats and call notes) and drafts written by Claude.
   His words are quoted only for neutral reasons (bank, delay, someone else paying, travel, business, busy).
   Anything about health or family is never collected or quoted (owner's rule). */
'use strict';

var EXCUSE_KINDS = [
  ['bank', 'bank or transfer', /bank|transfer|online|app\b|system|atm|account|ibft|raast/i],
  ['someone', 'someone else paying', /someone|somebody|friend|banda|person|through|via|bhej dega|de dega|uncle|cousin/i],
  ['travel', 'travelling or guests', /travel|abroad|guest|madrid|spain|airport|flight|trip|safar|out of (town|country)/i],
  ['business', 'business or work', /business|work|kaam|market|client|order|salary|payment from|stuck|pending/i],
  ['busy', 'busy at the time', /shower|sleep|slept|woke|busy|meeting|driving|call (you )?back|baad mein|abhi nahi/i],
  ['soon', 'paying soon', /tomorrow|kal\b|today|soon|in \d+ days?|in a day|by (mon|tues|wednes|thurs|fri|satur|sun)day|will (send|pay|transfer)|kar (deta|dunga)|bhej (deta|dunga)|inshallah|in sha allah/i]
];
var EXCUSE_SKIP = /sick|ill\b|illness|hospital|doctor|tumou?r|diabet|sugar|operation|surgery|mother|mom\b|wife|begum|child|kids?\b|son\b|daughter|beta|beti|ammi|walida|bimar|funeral|death|died|expens|kharch/i;

// His words in the log: quotes from imported chat days ("He said: ...") and what follows "said" in call notes.
function hisWords(v, from) {
  var out = [];
  v.D.logs.forEach(function (g) {
    if (from && g.date < from) return;
    var t = String(g.notes || ''), said = [];
    if (g.kind === 'wa_chat') { var m = /He said: (.*)$/.exec(t); if (m) said = (m[1].match(/"([^"]+)"/g) || []).map(function (q) { return q.slice(1, -1); }); }
    else if (g.kind === 'call' || g.kind === 'called_back' || g.kind === 'meeting' || g.kind === 'message') { var c = /(?:he|kashif) said:?\s*(.+)$/i.exec(t); if (c) said = [c[1]]; }
    said.forEach(function (s) { out.push({ date: g.date, text: s.replace(/\s+/g, ' ').trim() }); });
  });
  return out;
}
// Reasons he gave since a date, newest first, one per kind per day, never health or family.
function excuses(v, from) {
  var seen = {}, out = [];
  hisWords(v, from).forEach(function (w) {
    if (EXCUSE_SKIP.test(w.text)) return;
    var k = EXCUSE_KINDS.filter(function (x) { return x[2].test(w.text); })[0];
    if (!k || seen[w.date + k[0]]) return;
    seen[w.date + k[0]] = 1;
    out.push({ date: w.date, kind: k[0], label: k[1], text: w.text.length > 90 ? w.text.slice(0, 87) + '...' : w.text });
  });
  return out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
}
// Lines for the messages: the last three reasons with their dates, and what followed.
function excuseLines(v, K, lang) {
  var lp = lastPayDate(v.D), from = lp && lp < v.today ? lp : K.from, E = excuses(v, from).slice(0, 3).reverse();
  if (!E.length) return [];
  var list = E.map(function (e) { return (lang === 'ur' ? urDate(e.date) : fmtDate_(e.date)) + ': "' + e.text + '"'; });
  return lang === 'ur'
    ? ['پچھلی ادائیگی کے بعد آپ نے یہ کہا:'].concat(list, ['ہر بار کرایہ پھر بھی نہیں آیا۔'])
    : ['Since your last payment you have told me:'].concat(list, ['Each time, the rent still did not arrive.']);
}

// ---------- drafts from Claude: written into the DRAFTS tab of the Sheet, shown here, sent with the usual ask-then-log ----------
function claudeBrief(v) {
  var K = nudgeCues(v), L = v.L, lp = lastPayDate(v.D), from = lp && lp < v.today ? lp : K.from, R = contactStory_(v.D, from, v.today);
  var E = excuses(v, from), sent = v.D.logs.filter(function (g) { return g.kind === 'message' && g.date >= from; }).sort(byDateDesc).slice(0, 6);
  var calls = v.D.logs.filter(function (g) { return (g.kind === 'call' || g.kind === 'called_back') && g.date >= from && g.notes; }).sort(byDateDesc).slice(0, 5);
  return [
    'Draft the next WhatsApp message to my tenant for the 169-E Rent app. Write it in Urdu (Urdu script), unless I say otherwise.',
    'Escalation ladder (one step at a time, each step firmer than the last; the app suggests the step after the last one sent):',
    NUDGES.map(function (x) { return '  ' + x.n + '. ' + x.name + ': ' + x.aim + (x.n === K.next ? '   <- write this step' : x.n <= K.lastStage ? '   (sent)' : ''); }).join('\n'),
    'Write step ' + K.next + ' (' + NUDGES[K.next - 1].name + ') only' + (K.lastStage ? '; the last step sent was ' + K.lastStage + ' on ' + fmtDate_(K.lastDate) : '') + '. It must not repeat the wording or angle of the messages already sent.',
    'Rules: polite and firm; use only the facts below; do not mention illness, his wife or children; no threats, no harassment, no legal claims; the only consequence that may be stated is the plan below; no em dashes. Start with: ' + salamLine_(v.D) + ' and end with: ' + CFG.JAZAK + '.',
    '',
    'Facts as of ' + fmtDate_(v.today) + ':',
    '- Balance for ' + L.year + ': ' + fmtRs_(Math.max(L.yearBalance, 0)) + (K.overdue ? ', ' + daysText_(K.R.days) + ' overdue (oldest unpaid month ' + monthName_(K.R.since || K.R.month) + ')' : ''),
    '- Last payment: ' + (lp ? fmtRs_(v.D.payments.filter(function (p) { return p.date === lp; }).reduce(function (s, p) { return s + Number(p.amount); }, 0)) + ' on ' + fmtDate_(lp) : 'none this year'),
    '- Average paid per month in ' + L.year + ': ' + fmtRs_(Math.round(L.avgPaid)) + ' against ' + fmtRs_(K.R ? K.R.rent : 0) + ' agreed',
    '- Since ' + fmtDate_(from) + ': I reached out on ' + R.daysMe + ' days, no response on ' + R.daysNone + '; calls ' + R.calls + ' in ' + R.tries + ' tries, ' + R.ans + ' answered; he called ' + R.heCalls + ' times; he sent ' + R.his + ' messages',
    K.promise ? '- He promised payment by ' + fmtDate_(K.promise.by) + ' (said on ' + fmtDate_(K.promise.on) + '); it did not come' : K.promiseOpen ? '- He has promised payment by ' + fmtDate_(K.promiseOpen.by) : '',
    E.length ? '- Reasons he gave (newest first):\n' + E.slice(0, 8).map(function (e) { return '  ' + fmtDate_(e.date) + ' (' + e.label + '): "' + e.text + '"'; }).join('\n') : '- No reasons recorded',
    calls.length ? '- My call notes:\n' + calls.map(function (g) { return '  ' + fmtDate_(g.date) + ': ' + g.notes; }).join('\n') : '',
    sent.length ? '- Messages already sent:\n' + sent.map(function (g) { return '  ' + fmtDate_(g.date) + ': ' + g.notes; }).join('\n') : '',
    '- Plan if the year is not cleared (may be stated, nothing harsher): ' + factDefaults(v, 'en').consequence,
    '',
    'Then save the draft in my Google Sheet (id ' + (v.D.sheetId || 'see the 169-E Rent workbook') + '), tab DRAFTS, as a new row: draft_id (D + date and time), made_at (now), lang (ur or en), text (the whole message), why (one line on the angle), approach exactly "Approach ' + K.next + ' (' + NUDGES[K.next - 1].name + ')", status = new. Save it there only: I send every message from the app so that it is logged, so do not ask me to copy it from the chat. The app shows it at the top of Follow-up message, ready to send.'
  ].filter(function (x) { return x !== ''; }).join('\n');
}
function askClaude() {
  var b = claudeBrief(view());
  (navigator.clipboard ? navigator.clipboard.writeText(b) : Promise.reject()).then(function () { toast('Brief copied. Paste it in Claude if it is not filled in.'); }, function () { });
  window.open('https://claude.ai/new?q=' + encodeURIComponent(b), '_blank', 'noopener');
}
function draftCard(v) {
  var stepOf = function (d) { var m = /^\s*Approach\s*([1-6])/i.exec(d.approach || ''); return m ? +m[1] : 9; };
  var list = (v.D.drafts || []).filter(function (d) { return !(T.S.draftsDone || {})[d.draft_id]; })
    .sort(function (a, b) { return stepOf(a) - stepOf(b); });
  return el('div', { id: 'claudedrafts' },
    list.slice(0, 2).map(function (d) {
      var ur = /[؀-ۿ]/.test(d.text);
      return el('div', { class: 'card', 'data-draft': d.draft_id },
        el('div', { class: 'row' }, el('b', { text: 'Draft from Claude' + (d.approach ? ': ' + d.approach : '') }), el('span', { class: 'sm', text: String(d.made_at).slice(0, 16) })),
        d.why ? el('p', { class: 'sm', text: d.why }) : null,
        el('div', { class: 'msg' + (ur ? ' ur' : ''), lang: ur ? 'ur' : null }, String(d.text).split('\n').map(function (l) { return el('div', { dir: 'auto', class: l ? '' : 'gap', text: l }); })),
        el('div', { class: 'actions2' },
          el('a', { class: 'btn primary wa', href: waLink(d.text), target: waTarget(), rel: 'noopener', id: 'draftsend', onclick: function () {
            var st = /^\s*Approach\s*([1-6])/i.exec(d.approach || ''), n = st ? +st[1] : 0;
            askSent(n ? 'Follow-up message, approach ' + n : 'Draft from Claude', 'text', false,
              n ? 'Approach ' + n + ' (' + NUDGES[n - 1].name + ') sent on WhatsApp (Claude draft).' : 'Claude draft' + (d.approach ? ' (' + d.approach + ')' : '') + ' sent on WhatsApp.');
            T.S.pendingSent.draft = d.draft_id; saveState();
          } }, svg('wa'), el('span', { text: 'Send' })),
          btn('', 'x', 'Dismiss', function () { draftDone(d.draft_id, 'dismissed'); }, 'draftdismiss')));
    }),
    btn('wide', 'msg', 'Ask Claude for a draft', askClaude, 'askclaude'),
    el('p', { class: 'hint', text: 'Opens Claude with a brief of the balance, his replies, the reasons he gave and the next step of the ladder. Claude writes the message into your Sheet; it appears at the top of this screen after the next sync, and Send logs it as that step.' }));
}
function draftDone(id, status) {
  T.S.draftsDone = T.S.draftsDone || {}; T.S.draftsDone[id] = status;
  return queue({ op: 'draftdone', req_id: uuid(), id: id, status: status }).then(function () { render(); sync(true); });
}
