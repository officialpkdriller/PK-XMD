"use strict";
/**
 * antibot.js
 *
 * Now backed by the unified database/db.js (group_settings.antibot /
 * antibot_action columns) instead of its own separate JSON file.
 * Function names/signatures — including the atb-prefixed aliases
 * index.js and plugins/Group/groupe.js already depend on — are
 * unchanged so no caller needs modification.
 */
const db = require('../database/db');

/**
 * @param {string} jid
 * @param {'oui'|'non'} etat - kept for backward compatibility with the
 *   old JSON version's values ('oui' = on, 'non' = off)
 */
async function addOrUpdateJidState(jid, etat) {
  await db.updateGroupSetting(jid, 'antibot', etat === 'oui' ? 'on' : 'off');
}

async function updateJidAction(jid, action) {
  await db.updateGroupSetting(jid, 'antibot_action', action || 'remove');
}

async function checkJidState(jid) {
  const settings = await db.getGroupSettings(jid);
  return settings.antibot === 'on';
}

async function getJidAction(jid) {
  const settings = await db.getGroupSettings(jid);
  return settings.antibot_action || 'remove';
}

module.exports = {
  updateJidAction,
  addOrUpdateJidState,
  checkJidState,
  getJidAction,
  // Aliases used elsewhere in the project (index.js, plugins/Group/groupe.js,
  // plugins/Group/antibot.js) so those existing require() calls resolve.
  atbverifierEtatJid: checkJidState,
  atbrecupererActionJid: getJidAction,
  atbajouterOuMettreAJourJid: addOrUpdateJidState,
  atbmettreAJourAction: updateJidAction,
};
