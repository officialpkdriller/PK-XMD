"use strict";
/**
 * plugins/Owner/powner.js - makes the bot owner(s) admin of the current group.
 *   .powner   (aliases: .promoteowner, .makeowneradmin)
 *
 * Works when the bot is an admin of the group (for example a group admin
 * added the bot). Only the owner / creator can use it.
 * Owners = the creator number + every number in OWNER_NUMBER / NUMERO_OWNER.
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const ownerAccess = require("../../lib/ownerAccess");

const LINE = "━━━━━━━━━━━━━━━━";
const box = (title, body) => `📌 *${title}*\n${LINE}\n${body}\n${LINE}\n© bmb tech`;

const isAdminMember = (p) => p && (p.admin === "admin" || p.admin === "superadmin" || p.admin === true);
const idsOf = (p) =>
  [p && p.id, p && p.lid, p && p.jid, p && p.phoneNumber, p && p.phone_number]
    .filter(Boolean)
    .map((v) => ownerAccess.digits(v))
    .filter(Boolean);

bmbtz({
  nomCom: "powner",
  alias: ["promoteowner", "makeowneradmin"],
  categorie: "Owner",
  reaction: "👑",
}, async (dest, client, o) => {
  const { repondre, verifGroupe, fullOwner } = o;

  if (!verifGroupe) return repondre(box("POWNER", "This command only works in groups."));
  if (!fullOwner) return repondre(box("POWNER", "Only the bot owner can use this command."));

  let metadata;
  try {
    metadata = await client.groupMetadata(dest);
  } catch (e) {
    return repondre(box("POWNER", "I could not read the group members right now. Please try again."));
  }
  const participants = metadata.participants || [];

  const botIds = [client.user && client.user.id, client.user && client.user.lid].filter(Boolean).map((v) => ownerAccess.digits(v));
  const botMember = participants.find((p) => idsOf(p).some((x) => botIds.includes(x)));
  if (!isAdminMember(botMember)) {
    return repondre(box("POWNER", "I need to be a group admin to do this. Please make me an admin first."));
  }

  const owners = await ownerAccess.ownerNumberSet();
  const members = participants.filter((p) => idsOf(p).some((x) => owners.has(x)));
  if (!members.length) return repondre(box("POWNER", "No owner number was found in this group."));

  const pending = members.filter((p) => !isAdminMember(p));
  if (!pending.length) return repondre(box("POWNER", "The owner is already an admin here."));

  const promoted = [];
  const failed = [];
  for (const p of pending) {
    try {
      await ownerAccess.promoteWithRetry(client, dest, p.id, 5, 1500);
      promoted.push(p.id);
    } catch (e) {
      failed.push(e.message || "failed");
    }
  }

  if (promoted.length) {
    await client.sendMessage(dest, {
      text: box("OWNER PROMOTED", `👑 ${promoted.map((j) => "@" + j.split("@")[0].split(":")[0]).join(", ")} ${promoted.length > 1 ? "are" : "is"} now admin.`),
      mentions: promoted,
    }, { quoted: o.ms });
  }
  if (failed.length && !promoted.length) {
    await repondre(box("POWNER", `Could not promote the owner: ${failed[0]}`));
  }
});
