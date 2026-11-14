/* 169-E Rent: the text messages to the tenant in Urdu (the default). Pictures stay in English.
   Same facts and the same rules as the English messages in logic.js and nudge.js: no threats, nothing about family or health, no legal claims. */
'use strict';

function msgLang() { return (T.S && T.S.settings && T.S.settings.msgLang) === 'en' ? 'en' : 'ur'; }
function setMsgLang(x) { T.S.settings.msgLang = x === 'en' ? 'en' : 'ur'; return saveState(); }
// Urdu or English switch, shown on every screen that drafts a message.
function langChips() {
  return chips(['ur', 'en'], msgLang(), function (x) { setMsgLang(x).then(render); }, 'chips-lang', function (x) { return x === 'ur' ? 'اردو' : 'English'; });
}
// Preview box: Urdu set right to left in Nastaliq where the phone has it.
function msgBox(text, id) {
  var ur = msgLang() === 'ur';
  return el('div', { class: 'msg' + (ur ? ' ur' : ''), id: id, lang: ur ? 'ur' : null }, text.split('\n').map(function (l) { return el('div', { dir: 'auto', class: l ? '' : 'gap', text: l }); }));
}

function urRs(n) { return groupNum_(Math.round(n)) + ' روپے'; }
function urMonth(mk) { return UR_MONTHS[+mk.slice(5, 7) - 1] + ' ' + mk.slice(0, 4); }
function urDays(n) { return n + ' دن'; }

function balanceMessageUr(D, L, pay, opts) {
  opts = opts || {};
  var b = [];
  if (pay) b.push(urDate(pay.date) + ' کو ' + urRs(pay.amount) + ' موصول ہوئے۔ شکریہ۔', '');
  if (L.yearBalance > 0) b.push(L.year + ' کا بقایا: ' + urRs(L.yearBalance) + '۔');
  else if (L.yearBalance === 0) b.push(L.year + ' کا کرایہ اب تک مکمل ادا ہو چکا ہے۔');
  else b.push(L.year + ' کے لیے آپ ' + urRs(-L.yearBalance) + ' پیشگی ادا کر چکے ہیں۔');
  if (opts.arrears && L.arrearsBefore > 0) b.push('پچھلا بقایا (دسمبر ' + (L.year - 1) + ' تک): ' + urRs(L.arrearsBefore) + '، الگ سے۔');
  return wrapMsg_(D, b);
}

function reminderMessageUr(D, L, today, opts) {
  var R = reminderInfo_(D, L, today);
  if (!R) return '';
  var b;
  if (R.status === 'overdue' && R.since) {
    b = [urMonth(R.since) + ' سے کرایہ ادا نہیں ہوا (آخری تاریخ ' + urDate(R.sinceDue) + ')، اب ' + urDays(R.days) + ' کی تاخیر ہو چکی ہے۔',
      urMonth(R.month) + ' کا ' + urRs(R.rent) + ' کرایہ ' + urDate(R.due) + ' تک واجب تھا' + (R.monthDays ? ' (' + urDays(R.monthDays) + ' پہلے)' : '') + '۔',
      'براہِ کرم آج ہی بھیج دیں۔'];
  } else if (R.status === 'overdue') {
    b = [urMonth(R.month) + ' کا ' + urRs(R.rent) + ' کرایہ ' + urDate(R.due) + ' تک واجب تھا اور اب ' + urDays(R.days) + ' کی تاخیر ہو چکی ہے۔' +
      (R.unpaid < R.rent ? ' ابھی ' + urRs(R.unpaid) + ' باقی ہیں۔' : ''), 'براہِ کرم آج ہی بھیج دیں۔'];
  } else {
    b = ['یاد دہانی: ' + urMonth(R.month) + ' کا ' + urRs(R.rent) + ' کرایہ ' + urDate(R.due) + ' تک واجب ہے۔' + (R.days === 0 ? ' یعنی آج۔' : '')];
  }
  if (R.balanceBefore > 0) b.push('', 'اس مہینے سے پہلے ' + L.year + ' کا بقایا: ' + urRs(R.balanceBefore) + '۔');
  if (opts && opts.arrears && L.arrearsBefore > 0) b.push('پچھلا بقایا (دسمبر ' + (L.year - 1) + ' تک): ' + urRs(L.arrearsBefore) + '، الگ سے۔');
  return wrapMsg_(D, b);
}

function nudgeMessageUr(v, stage, K, F) {
  var D = v.D, L = v.L, R = K.R, b = [], bal = urRs(Math.max(L.yearBalance, 0));
  var rent = urRs(R ? R.unpaid || R.rent : Math.max(L.yearBalance, 0)), month = R ? urMonth(R.month) : String(L.year);
  var days = R && K.overdue ? urDays(R.days) : '', due = R ? urDate(R.due) : '';
  var state = K.overdue && R.since ? urMonth(R.since) + ' سے کرایہ ادا نہیں ہوا (آخری تاریخ ' + urDate(R.sinceDue) + ')، اب ' + days + ' کی تاخیر ہو چکی ہے۔ ' + L.year + ' کا بقایا ' + bal + ' ہے۔'
    : K.overdue ? month + ' کا ' + rent + ' کرایہ ' + due + ' کو واجب تھا اور اب ' + days + ' کی تاخیر ہو چکی ہے۔'
    : L.year + ' کا بقایا ' + bal + ' ہے۔';
  var silence = K.C.unanswered > 0 ? urDate(K.from) + ' سے میں نے ' + K.C.unanswered + ' بار کال کی مگر جواب نہیں ملا۔'
    : K.waUnanswered ? urDate(K.waUnanswered.hisLast) + ' سے یہاں میرے آخری ' + K.waUnanswered.mineAfter + ' پیغامات کا کوئی جواب نہیں آیا۔' : '';
  if (stage === 1) {
    b.push(state);
    if (F.commitment) b.push('', F.commitment);
    b.push('', 'مجھے آپ کی بات پر بھروسا ہے۔ براہِ کرم آج ہی بھیج دیں اور اس کا اسکرین شاٹ یہاں بھیج دیں۔');
  } else if (stage === 2) {
    if (K.promise) b.push(urDate(K.promise.on) + ' کو آپ نے کہا تھا کہ ادائیگی ' + urDate(K.promise.by) + ' تک ہو جائے گی۔ وہ تاریخ گزر چکی ہے اور ابھی تک کچھ نہیں آیا۔');
    else b.push(state);
    if (silence) b.push(silence);
    b.push('', 'میں نے ہمیشہ آپ کو ایسا آدمی سمجھا ہے جس کی بات اور عمل ایک ہوتے ہیں۔' + (days ? ' آج ان میں ' + days + ' کا فاصلہ ہے۔' : '') + ' براہِ کرم آج یہ فاصلہ ختم کر دیں۔',
      '', 'براہِ کرم ادائیگی کسی اور کے ذریعے نہیں بلکہ براہِ راست اپنے اکاؤنٹ سے بھیجیں، تاکہ راستے میں کوئی تاخیر نہ ہو۔');
  } else if (stage === 3) {
    var yrs = K.since ? L.year - K.since : 0;
    b.push((K.since ? 'آپ ' + K.since + ' سے ہمارے گھر میں ہیں' + (yrs > 1 ? '، یعنی ' + yrs + ' سال' : '') + '۔ ' : '') + 'ہمارے لیے یہ کبھی صرف کرائے کا معاملہ نہیں رہا، یہ اعتماد کا رشتہ رہا ہے۔');
    if (F.trust) b.push('', F.trust);
    b.push('', 'ہر تاخیر والا مہینہ' + (silence ? ' اور ہر بے جواب کال' : '') + ' اس اعتماد کو کم کرتا ہے، اور میں اسے کھونا نہیں چاہتا۔',
      '', (K.overdue ? month + ' کا ' + rent + ' کرایہ ' + days + ' سے واجب الادا ہے۔ ' : '') + 'براہِ کرم آج ہی ادا کر دیں۔');
  } else if (stage === 4) {
    b.push('میں نے تاخیر کی ہر وجہ صبر سے سنی ہے، اور آپ کی مشکلات پر سوال نہیں اٹھاتا۔',
      '', 'لیکن وجہ ہر مہینے بدل جاتی ہے اور نتیجہ وہی رہتا ہے: کرایہ دیر سے آتا ہے۔ کرایہ اس بات پر منحصر نہیں کہ مہینہ کیسا گزرا، یہ اپنی تاریخ پر واجب ہوتا ہے۔',
      '', 'اب میں ادائیگی کی جگہ وضاحت قبول نہیں کر سکتا۔ ' + (K.overdue ? month + ' کے ' + rent + '، ' + days + ' کی تاخیر۔' : state) + ' براہِ کرم آج ہی بھیج دیں۔');
  } else if (stage === 5) {
    var dl = addDaysYmd_(v.today, 2);
    b.push(state, '', urDate(dl) + ' کو پاکستانی وقت کے مطابق رات 8 بجے تک مجھے آپ کی طرف سے ان دو میں سے ایک چیز چاہیے:',
      '1. پورے ' + rent + ' اکاؤنٹ میں، اور اس کا اسکرین شاٹ یہاں، یا',
      '2. یہاں آپ کا تحریری پیغام، جس میں ادائیگی کی صحیح تاریخ اور صحیح رقم لکھی ہو۔',
      '', 'براہِ کرم کسی اور کے ذریعے نہ بھیجیں۔ اگر مجھے ان میں سے کچھ بھی نہ ملا تو میں سمجھوں گا کہ آپ کی طرف سے کوئی وعدہ نہیں، اور اسی کے مطابق فیصلہ کروں گا۔');
  } else {
    b.push('یہ پیغام ریکارڈ کے لیے ہے، ' + urDate(v.today) + ' تک۔', '', L.year + ' کا واجب الادا کرایہ: ' + bal + '۔');
    if (K.overdue) b.push(month + ' کا کرایہ: ' + days + ' کی تاخیر (آخری تاریخ ' + due + ')۔');
    var rec = [K.C.messages ? K.C.messages + ' پیغامات بھیجے' : '', K.C.calls ? K.C.calls + ' کالیں کیں' : '',
      K.C.unanswered ? K.C.unanswered + ' کا جواب نہیں ملا' : '', K.C.visits ? 'EME کے ' + K.C.visits + ' چکر لگائے' : ''].filter(Boolean);
    if (rec.length) b.push(urDate(K.from) + ' سے: ' + rec.join('، ') + '۔');
    if (F.consequence) b.push('', F.consequence);
    b.push('', 'میں یہ قدم نہیں اٹھانا چاہتا۔ بقایا ادا کرنے سے یہ رک جائے گا۔ براہِ کرم یہاں اپنی ادائیگی کی تاریخ بتا دیں۔');
  }
  return wrapMsg_(D, b);
}

function linkMessageUr(D, link) { return wrapMsg_(D, ['169-E کے کرائے کا آپ کا صفحہ، جس پر اس سال کا کرایہ، ادائیگیاں اور رسیدیں ہیں:', link]); }

// One place that picks the language for every drafted message.
function draftBalance(D, L, pay, opts) { return msgLang() === 'en' ? balanceMessage_(D, L, pay, opts) : balanceMessageUr(D, L, pay, opts); }
function draftReminder(D, L, today, opts) { return msgLang() === 'en' ? reminderMessage_(D, L, today, opts) : reminderMessageUr(D, L, today, opts); }
function draftNudge(v, stage, K, F) { return msgLang() === 'en' ? nudgeMessage(v, stage, K, F) : nudgeMessageUr(v, stage, K, F); }
function draftNoReply(v, N) { return msgLang() === 'en' ? noReplyMessage(v, N) : noReplyMessageUr(v, N); }
function draftLink(D, link) { return msgLang() === 'en' ? wrapMsg_(D, ['Your rent page for 169-E: ' + link]) : linkMessageUr(D, link); }
