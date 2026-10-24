/* carica i moduli delle sezioni nel framework BSIFisica, fuori dal browser,
   e restituisce BSIFisica.calcolo: le funzioni pure che le verifiche provano */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const RADICE = path.join(__dirname, '..', '..', '..');
module.exports = function (files) {
  const ctx = { console, Math, Float64Array, Float32Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Date, Number, Array, Object, String, Boolean, JSON, isFinite, isNaN, parseFloat, parseInt, Infinity, NaN, BigInt, RegExp, Error, TypeError, Map, Set, Promise, setTimeout, clearTimeout };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {}, getContext: () => null }), querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js'].concat(files).forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica.calcolo;
};
