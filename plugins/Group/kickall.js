"use strict";
const { bmbtz } = require("../../devbmb/bmbtz");
const ownerAccess = require("../../lib/ownerAccess");

/**
 * kickall - removes EVERY non-admin member of the group.
 *   - Admins and super admins are never removed (and never demoted).
 *   - The bot and the person who sent the command are never removed.
 *   - Members are removed in small batches; anything that fails is retried one by one.
 *   - Allowed for: the bot owner / creator / sudo, or the group creator (super admin).
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BATCH_SIZE = 5;
const BATCH_GAP_MS = 1500;

const isAdminMember = (p) => p && (p.admin === "admin" || p.admin === "superadmin" || p.admin === true);

/** All the number forms a participant can be known by (phone number, LID, id). */
function idsOf(p) {
  return [p && p.id, p && p.lid, p && p.jid, p && p.phoneNumber, p && p.phone_number]
    .filter(Boolean)
    .map((v) => ownerAccess.digits(v))
    .filter(Boolean);
}

function isSameUser(p, wanted) {
  const mine = idsOf(p);
  return wanted.some((w) => w && mine.includes(w));
}

/** WhatsApp answers a batch with one status per member; "200" means removed. */
function statusOk(entry) {
  if (!entry) return true;
  const st = String(entry.status == null ? "200" : entry.status);
  return st === "200";
}

async function removeBatch(client, groupId, ids) {
  const res = await client.groupParticipantsUpdate(groupId, ids, "remove");
  if (!Array.isArray(res)) return { ok: ids.slice(), bad: [] };
  const ok = [];
  const bad = [];
  ids.forEach((id, i) => {
    const entry = res.find((r) => r && r.jid === id) || res[i];
    (statusOk(entry) ? ok : bad).push(id);
  });
  return { ok, bad };
}

/** Removes the given members; returns how many were removed and which failed. */
async function removeMembers(client, groupId, ids) {
  let removed = 0;
  let failed = [];
  let stopped = false;

  for (let i = 0; i < ids.length && !stopped; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    try {
      const { ok, bad } = await removeBatch(client, groupId, batch);
      removed += ok.length;
      failed = failed.concat(bad);
    } catch (e) {
      if (/not-authorized|forbidden|403/i.test(String(e && e.message))) { stopped = true; failed = failed.concat(ids.slice(i)); break; }
      failed = failed.concat(batch); // retried one by one below
    }
    await sleep(BATCH_GAP_MS);
  }

  // Retry every failure individually, once.
  const retry = failed.slice();
  failed = [];
  for (const id of retry) {
    try {
      const { ok } = await removeBatch(client, groupId, [id]);
      if (ok.length) removed += 1; else failed.push(id);
    } catch {
      failed.push(id);
    }
    await sleep(800);
  }
  return { removed, failed };
}

bmbtz({
  nomCom: "kickall",
  alias: ["clearmembers", "removeall"],
  categorie: "Group",
  reaction: "📣",
}, async (dest, client, o) => {
  const { auteurMessage, senderJid, repondre, verifGroupe, superUser, idBot } = o;

  if (!verifGroupe) return repondre("✋ This command can only be used in groups.");

  let metadata;
  try {
    metadata = await client.groupMetadata(dest);
  } catch (e) {
    return repondre("⚠️ I could not read the group members right now. Please try again in a moment.");
  }
  const participants = (metadata && metadata.participants) || [];

  const senderIds = [auteurMessage, senderJid].filter(Boolean).map((v) => ownerAccess.digits(v));
  const botIds = [idBot, client.user && client.user.id, client.user && client.user.lid].filter(Boolean).map((v) => ownerAccess.digits(v));

  const senderMember = participants.find((p) => isSameUser(p, senderIds));
  const isGroupCreator = !!senderMember && senderMember.admin === "superadmin";

  if (!(superUser || isGroupCreator)) {
    return repondre("🔒 This command is reserved for the bot owner and the group creator for security reasons.");
  }

  const botMember = participants.find((p) => isSameUser(p, botIds));
  if (!isAdminMember(botMember)) {
    return repondre("⚠️ I need to be a group admin to remove members. Please make me an admin and try again.");
  }

  const admins = participants.filter(isAdminMember);
  const targets = participants.filter((p) => !isAdminMember(p) && !isSameUser(p, botIds) && !isSameUser(p, senderIds));

  if (!targets.length) {
    return repondre("✅ Nobody to remove. Everyone left in this group is an admin.");
  }

  await repondre(`📣 Removing ${targets.length} member${targets.length === 1 ? "" : "s"}.\nAdmins (${admins.length}) will stay in the group.`);

  const { removed, failed } = await removeMembers(client, dest, targets.map((p) => p.id));

  let report = `✅ Done.\nRemoved: ${removed}\nAdmins kept: ${admins.length}`;
  if (failed.length) report += `\nCould not remove: ${failed.length} (WhatsApp refused or they already left)`;
  await repondre(report);
});

module.exports = { removeMembers, isAdminMember };
