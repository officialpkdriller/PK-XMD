"use strict";
/**
 * settingsCache.js
 *
 * A lightweight in-memory cache for global bot settings (database/db.js's
 * getSettings()/updateSetting()). Loaded once at startup and kept in sync
 * on every write, so hot-path code in index.js (checked on every message)
 * can read settings synchronously instead of awaiting the database on
 * every single message.
 *
 * This is simpler than NOVA-XMD's TTL+pubsub settingsCache.js (which
 * exists to stay consistent across multiple processes/dynos) since this
 * project runs a single dyno — a write-through cache is enough and avoids
 * any staleness window entirely.
 */
const db = require('../database/db');

let _cache = {};
let _loaded = false;

async function loadSettingsCache() {
    try {
        _cache = await db.getSettings();
    } catch (e) {
        console.log('⚠️ [settingsCache] failed to load settings, using empty cache:', e.message);
        _cache = {};
    }
    _loaded = true;
    return _cache;
}

/**
 * Synchronous read — safe to call from anywhere once loadSettingsCache()
 * has run at startup (index.js calls it before connecting).
 */
function getCachedSettingsSync() {
    return _cache;
}

/**
 * Reads one setting, falling back to `fallback` if the key was never set
 * (e.g. a fresh install where the command has never been used) — this is
 * how index.js keeps its existing settings.js/env defaults as the
 * effective default until someone actually runs the toggle command.
 */
function getSetting(key, fallback) {
    if (!_loaded) return fallback;
    const v = _cache[key];
    return v !== undefined ? v : fallback;
}

/**
 * Persists a setting to the database AND updates the in-memory cache
 * immediately, so the very next message handled reflects the new value —
 * no restart, no cache-staleness window.
 */
async function updateCachedSetting(key, value) {
    await db.updateSetting(key, value);
    _cache[key] = String(value);
}

module.exports = {
    loadSettingsCache,
    getCachedSettingsSync,
    getSetting,
    updateCachedSetting,
};
