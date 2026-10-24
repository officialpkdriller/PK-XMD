"use strict";
/** AI conversation memory (per user) - 60 minutes, last 24 messages. */
const TTL = 60 * 60 * 1000;
const MAX = 24;
const _mem = new Map();

function getHistory(uid) {
  const e = _mem.get(uid);
  if (!e || Date.now() - e.ts > TTL) { _mem.delete(uid); return []; }
  return e.msgs.slice();
}

function addMessage(uid, role, content) {
  const e = _mem.get(uid) || { msgs: [], ts: Date.now() };
  e.msgs.push({ role, content: String(content) });
  if (e.msgs.length > MAX) e.msgs = e.msgs.slice(-MAX);
  e.ts = Date.now();
  _mem.set(uid, e);
}

function clearHistory(uid) { _mem.delete(uid); }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _mem) if (now - v.ts > TTL) _mem.delete(k);
}, 15 * 60 * 1000).unref();

module.exports = { getHistory, addMessage, clearHistory };
