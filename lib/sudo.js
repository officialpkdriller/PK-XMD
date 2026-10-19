"use strict";
/**
 * sudo.js
 *
 * Now backed by the unified database/db.js (Postgres if DATABASE_URL is
 * set, otherwise a single JSON file) instead of its own separate
 * asset/sudo.json file. Function names/signatures are unchanged so
 * index.js and any other caller keeps working without modification.
 */
const db = require('../database/db');

async function issudo(jid) {
  try {
    const sudoUsers = await db.getSudoUsers();
    return sudoUsers.includes(jid);
  } catch (error) {
    console.error("Error checking if the group is sudo:", error);
    return false;
  }
}

async function addSudoNumber(jid) {
  try {
    const sudoUsers = await db.getSudoUsers();
    if (!sudoUsers.includes(jid)) {
      await db.addSudoUser(jid);
      console.log(`Phone number ${jid} added to the authorized list.`);
    } else {
      console.log(`Phone number ${jid} is already in the authorized list.`);
    }
  } catch (error) {
    console.error("Error adding the phone number to the authorized list:", error);
  }
}

async function removeSudoNumber(jid) {
  try {
    const sudoUsers = await db.getSudoUsers();
    if (sudoUsers.includes(jid)) {
      await db.removeSudoUser(jid);
      console.log(`Phone number ${jid} removed from the authorized list.`);
    } else {
      console.log(`Phone number ${jid} is not in the authorized list.`);
    }
  } catch (error) {
    console.error("Error removing the phone number from the authorized list:", error);
  }
}

async function getAllSudoNumbers() {
  try {
    return await db.getSudoUsers();
  } catch (error) {
    console.error("Error retrieving the authorized phone numbers:", error);
    return [];
  }
}

async function isSudoTableNotEmpty() {
  try {
    const sudoUsers = await db.getSudoUsers();
    return sudoUsers.length > 0;
  } catch (error) {
    console.error("Error checking if the sudo table is empty:", error);
    return false;
  }
}

module.exports = {
  issudo,
  addSudoNumber,
  removeSudoNumber,
  getAllSudoNumbers,
  isSudoTableNotEmpty,
};
