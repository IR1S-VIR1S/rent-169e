/* 169-E Rent: receipt photos. Shrunk on the phone, kept encrypted in IndexedDB until sent to Drive. */
'use strict';
var PHOTO_DB = 'r169-photos';
var PHOTO_MAX = 1600;

function idb_() {
  return new Promise(function (res, rej) {
    var q = indexedDB.open(PHOTO_DB, 1);
    q.onupgradeneeded = function () { q.result.createObjectStore('blobs'); };
    q.onsuccess = function () { res(q.result); };
    q.onerror = function () { rej(q.error); };
  });
}
function idbDo_(mode, fn) {
  return idb_().then(function (db) {
    return new Promise(function (res, rej) {
      var tx = db.transaction('blobs', mode), st = tx.objectStore('blobs'), out;
      var r = fn(st);
      if (r) r.onsuccess = function () { out = r.result; };
      tx.oncomplete = function () { db.close(); res(out); };
      tx.onerror = function () { db.close(); rej(tx.error); };
    });
  });
}
function photoPut(id, buf, key) {
  var iv = crypto.getRandomValues(new Uint8Array(12));
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, buf).then(function (ct) {
    return idbDo_('readwrite', function (st) { return st.put({ iv: iv, ct: ct }, id); });
  });
}
function photoGet(id, key) {
  return idbDo_('readonly', function (st) { return st.get(id); }).then(function (rec) {
    if (!rec) return null;
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: rec.iv }, key, rec.ct);
  });
}
function photoDel(id) { return idbDo_('readwrite', function (st) { return st.delete(id); }); }
function photoWipe() {
  return new Promise(function (res) { var q = indexedDB.deleteDatabase(PHOTO_DB); q.onsuccess = q.onerror = q.onblocked = function () { res(); }; });
}

// Turn a picked file into a JPEG no wider or taller than PHOTO_MAX.
function shrinkPhoto(file) {
  return new Promise(function (res, rej) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var s = Math.min(1, PHOTO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { b ? b.arrayBuffer().then(res, rej) : rej(new Error('photo')); }, 'image/jpeg', 0.82);
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That file is not a photo this phone can read.')); };
    img.src = url;
  });
}
function bufToB64(buf) {
  var a = new Uint8Array(buf), s = '', step = 0x8000;
  for (var i = 0; i < a.length; i += step) s += String.fromCharCode.apply(null, a.subarray(i, i + step));
  return btoa(s);
}
function b64ToBuf(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; }
