/**
 * 169-E Rent loader. Paste this ONCE into Extensions > Apps Script (replacing everything), save,
 * and set the manifest (appsscript.json). After that, updates come from the menu:
 * "169-E Rent" > "Install update". The web app address and phone pairing never change.
 */
var LOADER_VERSION = '1';
var SOURCE_URL = 'https://raw.githubusercontent.com/IR1S-VIR1S/rent-169e/main/script/Rent.gs';
var CHUNK = 7000;
var APP_ = null;

function readCode_(prefix) {
  var p = PropertiesService.getScriptProperties(), n = +p.getProperty(prefix + 'N') || 0, s = '';
  for (var i = 0; i < n; i++) s += p.getProperty(prefix + i) || '';
  return s;
}

function writeCode_(prefix, code) {
  var p = PropertiesService.getScriptProperties(), old = +p.getProperty(prefix + 'N') || 0, n = Math.ceil(code.length / CHUNK), all = {};
  for (var i = 0; i < n; i++) all[prefix + i] = code.slice(i * CHUNK, (i + 1) * CHUNK);
  all[prefix + 'N'] = String(n);
  p.setProperties(all);
  for (var j = n; j < old; j++) p.deleteProperty(prefix + j);
}

function compile_(code) {
  var x = (new Function(code + '\n;return exports_();'))();
  ['setup', 'doPost', 'doGet', 'MENU_ITEMS', 'VERSION'].forEach(function (k) {
    if (!x || x[k] === undefined) throw new Error('missing ' + k);
  });
  return x;
}

function app_() {
  if (APP_) return APP_;
  var code = readCode_('CODE_');
  if (!code) return null;
  APP_ = compile_(code);
  return APP_;
}

function sha8_(s) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return b.map(function (x) { var h = ((x + 256) % 256).toString(16); return h.length < 2 ? '0' + h : h; }).join('').slice(0, 8);
}

function onOpen() {
  var ui = SpreadsheetApp.getUi(), m = ui.createMenu('169-E Rent');
  var labels = [];
  try { labels = JSON.parse(PropertiesService.getScriptProperties().getProperty('MENU_JSON') || '[]'); } catch (e) { }
  labels.slice(0, 12).forEach(function (l, i) { m.addItem(l, 'm' + (i + 1)); });
  if (labels.length) m.addSeparator();
  m.addItem('Install update', 'installUpdate').addItem('Undo last update', 'undoUpdate').addToUi();
}

function run_(i) {
  var a = app_();
  if (!a) { SpreadsheetApp.getUi().alert('Nothing installed yet. Use "Install update" first.'); return; }
  var item = a.MENU_ITEMS[i];
  if (!item || typeof a[item.fn] !== 'function') { SpreadsheetApp.getUi().alert('That menu item is out of date. Reload the Sheet.'); return; }
  return a[item.fn]();
}
function m1() { return run_(0); } function m2() { return run_(1); } function m3() { return run_(2); }
function m4() { return run_(3); } function m5() { return run_(4); } function m6() { return run_(5); }
function m7() { return run_(6); } function m8() { return run_(7); } function m9() { return run_(8); }
function m10() { return run_(9); } function m11() { return run_(10); } function m12() { return run_(11); }

function saveMenu_(a) {
  PropertiesService.getScriptProperties().setProperty('MENU_JSON', JSON.stringify(a.MENU_ITEMS.map(function (x) { return x.label; })));
}

function installUpdate() {
  var ui = SpreadsheetApp.getUi(), p = PropertiesService.getScriptProperties();
  var r = UrlFetchApp.fetch(SOURCE_URL + '?t=' + Date.now(), { muteHttpExceptions: true, followRedirects: true });
  if (r.getResponseCode() !== 200) { ui.alert('Could not download the update (GitHub said ' + r.getResponseCode() + '). Nothing was changed. Try again later.'); return; }
  var code = r.getContentText(), x;
  try { x = compile_(code); } catch (e) { ui.alert('The downloaded update is broken (' + e.message + '). Nothing was changed.'); return; }
  var sha = sha8_(code);
  if (sha === p.getProperty('CODE_SHA')) { ui.alert('Already up to date (version ' + x.VERSION + ').'); return; }
  var cur = app_();
  var ok = ui.alert('Install version ' + x.VERSION + '?',
    (cur ? 'You have version ' + cur.VERSION + '.\n\n' : '') + 'What is new:\n' + String(x.RELEASE_NOTE || '').slice(0, 900) + '\n\nUpdate code ' + sha,
    ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;
  var prev = readCode_('CODE_');
  if (prev) { writeCode_('PREV_', prev); p.setProperty('PREV_SHA', p.getProperty('CODE_SHA') || ''); }
  writeCode_('CODE_', code);
  p.setProperty('CODE_SHA', sha);
  APP_ = x;
  saveMenu_(x);
  x.setup();
  onOpen();
}

function undoUpdate() {
  var ui = SpreadsheetApp.getUi(), p = PropertiesService.getScriptProperties();
  var prev = readCode_('PREV_');
  if (!prev) { ui.alert('There is no earlier version to go back to.'); return; }
  var x;
  try { x = compile_(prev); } catch (e) { ui.alert('The earlier version could not be loaded. Nothing was changed.'); return; }
  if (ui.alert('Go back to version ' + x.VERSION + '?', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  var cur = readCode_('CODE_'), curSha = p.getProperty('CODE_SHA') || '';
  writeCode_('CODE_', prev); p.setProperty('CODE_SHA', p.getProperty('PREV_SHA') || '');
  writeCode_('PREV_', cur); p.setProperty('PREV_SHA', curSha);
  APP_ = x;
  saveMenu_(x);
  x.setup();
  onOpen();
}

function doPost(e) {
  var a = app_();
  if (!a) return ContentService.createTextOutput(JSON.stringify({ ok: false, code: 503, error: 'Nothing installed in the sheet yet.' })).setMimeType(ContentService.MimeType.JSON);
  return a.doPost(e);
}

function doGet(e) {
  var a = app_();
  return a ? a.doGet(e) : ContentService.createTextOutput('169-E Rent loader: nothing installed yet.');
}
