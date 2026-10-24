"use strict";
/**
 * welcome.js
 *
 * Now backed by the unified database/db.js instead of its own separate
 * asset/events.json file. Function names/signatures (attribuerUnevaleur,
 * recupevents) are unchanged so index.js, plugins/Group/events.js, and
 * plugins/Group/setmessages.js keep working without modification.
 *
 * "row" names used elsewhere in the project map to group_settings
 * columns as follows:
 *   welcome, goodbye, antipromote, antidemote  -> same-named column ('on'/'off')
 *   welcometext                                -> custom_welcome
 *   goodbyetext                                -> custom_goodbye
 * Any other row name is stored as-is if the column exists, otherwise
 * this throws (matching the "Unknown group setting field" guard in
 * database/db.js) so a typo doesn't silently no-op.
 */
const db = require('../database/db');

const ROW_TO_COLUMN = {
  welcometext: 'custom_welcome',
  goodbyetext: 'custom_goodbye',
};

function resolveColumn(row) {
  return ROW_TO_COLUMN[row] || row;
}

async function attribuerUnevaleur(jid, row, valeur) {
  try {
    const column = resolveColumn(row);
    await db.updateGroupSetting(jid, column, valeur);
    console.log(`La colonne ${row} a été actualisée sur ${valeur} pour le jid ${jid}`);
  } catch (error) {
    console.error("Erreur lors de l'actualisation des événements :", error);
  }
}

async function recupevents(jid, row) {
  try {
    const column = resolveColumn(row);
    const settings = await db.getGroupSettings(jid);
    const value = settings[column];
    return value !== undefined && value !== null && value !== '' ? value : 'non';
  } catch (error) {
    console.error("Erreur lors de la récupération des événements :", error);
  }
}

module.exports = {
  attribuerUnevaleur,
  recupevents,
};
