"use strict";
/**
 * antilien.js
 *
 * Rewritten to support THREE independent toggles instead of one
 * mutually-exclusive "action" mode:
 *
 *   antilink        (master) - when on, any detected link gets deleted
 *   antilink remove (modifier) - when on, the sender is ALSO kicked
 *                                immediately after the link is deleted
 *   antilink warn   (modifier) - when on, the sender is ALSO warned
 *                                (accumulating toward the group's warn
 *                                limit) after the link is deleted,
 *                                kicking automatically once the limit
 *                                is reached
 *
 * These can combine: delete-only, delete+remove, delete+warn, or all
 * three (remove takes priority over warn if both are on, since an
 * immediate kick makes warn-accumulation moot).
 *
 * Backed by the unified database/db.js (group_settings.antilink /
 * antilink_remove / antilink_warn columns).
 */
const db = require('../database/db');

/**
 * @param {string} jid
 * @param {'oui'|'non'} etat - kept for backward compatibility with the
 *   old JSON version's values ('oui' = on, 'non' = off)
 */
async function ajouterOuMettreAJourJid(jid, etat) {
  await db.updateGroupSetting(jid, 'antilink', etat === 'oui' ? 'on' : 'off');
}

async function verifierEtatJid(jid) {
  const settings = await db.getGroupSettings(jid);
  return settings.antilink === 'on';
}

async function setRemoveMode(jid, onOff) {
  await db.updateGroupSetting(jid, 'antilink_remove', onOff ? 'on' : 'off');
}

async function getRemoveMode(jid) {
  const settings = await db.getGroupSettings(jid);
  return settings.antilink_remove === 'on';
}

async function setWarnMode(jid, onOff) {
  await db.updateGroupSetting(jid, 'antilink_warn', onOff ? 'on' : 'off');
}

async function getWarnMode(jid) {
  const settings = await db.getGroupSettings(jid);
  return settings.antilink_warn === 'on';
}

module.exports = {
  ajouterOuMettreAJourJid,
  verifierEtatJid,
  setRemoveMode,
  getRemoveMode,
  setWarnMode,
  getWarnMode,
};
