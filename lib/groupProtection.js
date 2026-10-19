"use strict";
/**
 * groupProtection.js
 *
 * Now backed by the unified database/db.js (group_settings.antispam /
 * antisticker columns, and warn_data for per-user warn counts) instead
 * of its own separate JSON files. Function names/signatures are
 * unchanged so plugins/Group/antispam.js, antisticker.js, and index.js's
 * enforcement listener keep working without modification.
 *
 * Note: warn counts here are shared with lib/warn.js's per-group warn
 * tracking (both now read/write database/db.js's warn_data), so a
 * user's warn count is consistent across antispam, antisticker, and the
 * general .warn command for the same group.
 */
const db = require('../database/db');

/**
 * @param {string} groupId
 * @param {string} feature - "antispam" | "antisticker"
 * @returns {'off'|'warn'|'kick'}
 */
async function getGroupFeature(groupId, feature) {
    const settings = await db.getGroupSettings(groupId);
    return settings[feature] || 'off';
}

/**
 * @param {string} groupId
 * @param {string} feature
 * @param {'off'|'warn'|'kick'} value
 */
async function setGroupFeature(groupId, feature, value) {
    await db.updateGroupSetting(groupId, feature, value);
}

async function addGroupWarn(groupId, feature, userNum) {
    // Scoped per feature by folding the feature name into the stored
    // user key, since warn_data is a single (jid, user) -> count table.
    return db.addWarn(groupId, `${feature}:${userNum}`);
}

async function resetGroupWarn(groupId, feature, userNum) {
    return db.resetWarn(groupId, `${feature}:${userNum}`);
}

module.exports = {
    getGroupFeature,
    setGroupFeature,
    addGroupWarn,
    resetGroupWarn,
};
