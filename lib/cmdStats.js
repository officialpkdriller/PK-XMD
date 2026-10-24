"use strict";
/**
 * lib/cmdStats.js - counts how often each command is used (for the "TOP COMMANDS" part of the menu).
 * Counts are kept in memory and saved to the settings database at most once a minute.
 */
const { getSetting, updateCachedSetting } = require("./settingsCache");

const KEY = "CMD_STATS";
const SAVE_EVERY_MS = 60 * 1000;

let counts = null;
let dirty = false;
let timer = null;

function load() {
  if (counts) return counts;
  try {
    const parsed = JSON.parse(getSetting(KEY, "{}") || "{}");
    counts = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    counts = {};
  }
  return counts;
}

function schedule() {
  if (timer) return;
  timer = setTimeout(async () => {
    timer = null;
    if (!dirty) return;
    dirty = false;
    try { await updateCachedSetting(KEY, JSON.stringify(counts)); } catch {}
  }, SAVE_EVERY_MS);
  if (timer.unref) timer.unref();
}

function hit(name) {
  if (!name) return;
  load();
  counts[name] = (counts[name] || 0) + 1;
  dirty = true;
  schedule();
}

/** Saves the counts right now (used before a restart). */
function flush() {
  if (!dirty || !counts) return;
  dirty = false;
  try { updateCachedSetting(KEY, JSON.stringify(counts)); } catch {}
}

/** [{ name, uses }] most used first */
function top(limit = 3) {
  load();
  return Object.entries(counts)
    .map(([name, uses]) => ({ name, uses: Number(uses) || 0 }))
    .filter((x) => x.uses > 0)
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
    .slice(0, limit);
}

module.exports = { hit, top, flush };
