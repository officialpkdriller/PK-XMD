"use strict";
/**
 * warn.js
 *
 * Now backed by the unified database/db.js instead of its own separate
 * asset/warn_users.json file. Function names/signatures are unchanged
 * so plugins/Group/warn.js and index.js keep working without
 * modification.
 *
 * This was (and remains) a single GLOBAL warn count per jid, not
 * per-group — stored under the fixed group key "global" in
 * database/db.js's warn_data table/object, which is otherwise keyed
 * by (group jid, user). This keeps counts isolated from
 * groupProtection.js's per-group-per-feature warns (antispam,
 * antisticker), which use their own "feature:user" key shape.
 */
const db = require('../database/db');

const GLOBAL_KEY = 'global';

async function ajouterUtilisateurAvecWarnCount(jid) {
  try {
    const count = await db.addWarn(GLOBAL_KEY, jid);
    console.log(`Utilisateur ${jid} ajouté ou mis à jour avec un warn_count de ${count}.`);
  } catch (error) {
    console.error("Erreur lors de l'ajout ou de la mise à jour de l'utilisateur :", error);
  }
}

async function getWarnCountByJID(jid) {
  try {
    return await db.getWarnCount(GLOBAL_KEY, jid);
  } catch (error) {
    console.error("Erreur lors de la récupération du warn_count :", error);
    return -1;
  }
}

async function resetWarnCountByJID(jid) {
  try {
    await db.resetWarn(GLOBAL_KEY, jid);
    console.log(`Le warn_count de l'utilisateur ${jid} a été réinitialisé à 0.`);
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du warn_count :", error);
  }
}

module.exports = {
  ajouterUtilisateurAvecWarnCount,
  getWarnCountByJID,
  resetWarnCountByJID,
};
