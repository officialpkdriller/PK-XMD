"use strict";
/**
 * plugins/Group/del.js - silent delete.
 *   Reply to any message with  .del  (or .delete / .clear)
 *   -> the replied message AND your command message are deleted.
 *   -> the bot never sends any message back.
 *
 * Who can use it:
 *   - groups : group admins and the bot owner / sudo users
 *   - private chats : anyone, for the bot's own messages
 *
 * WhatsApp rules the bot has to respect:
 *   - To delete other people's messages in a group, the bot must be a group admin.
 *   - The bot can always delete its own messages.
 *   - In a private chat it can only delete the command message if it was sent from the bot's own account.
 * When something cannot be deleted the command simply does nothing (a note is written to the log).
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const ownerAccess = require("../../lib/ownerAccess");

const d = (v) => ownerAccess.digits(v);
const isAdminMember = (p) => p && (p.admin === "admin" || p.admin === "superadmin" || p.admin === true);
const idsOf = (p) =>
  [p && p.id, p && p.lid, p && p.jid, p && p.phoneNumber, p && p.phone_number].filter(Boolean).map(d).filter(Boolean);

bmbtz({
  nomCom: "delele",
  alias: ["del", "clear"],
  categorie: "Group",
  reaction: "🧹",
}, async (dest, client, o) => {
  const { ms, mtype, verifGroupe, verifAdmin, superUser, idBot, mbre, auteurMessage, senderJid } = o;

  try {
    const ctx = (ms.message && ms.message[mtype] && ms.message[mtype].contextInfo) || {};
    const targetId = ctx.stanzaId;
    if (!targetId) return;                                   // nothing was replied to

    const botIds = [idBot, client.user && client.user.id, client.user && client.user.lid].filter(Boolean).map(d);
    const participants = Array.isArray(mbre) ? mbre : [];

    // Who is allowed to use it
    let allowed = true;
    if (verifGroupe) {
      const senderIds = [auteurMessage, senderJid].filter(Boolean).map(d);
      const senderIsAdmin = verifAdmin || participants.some((p) => isAdminMember(p) && idsOf(p).some((x) => senderIds.includes(x)));
      allowed = !!(senderIsAdmin || superUser);
    }
    if (!allowed) return;

    // Whose message is it, and can the bot delete it?
    const author = ctx.participant || "";
    const isBotMessage = !!author && botIds.includes(d(author));
    const botIsAdmin = participants.some((p) => isAdminMember(p) && idsOf(p).some((x) => botIds.includes(x)));
    const canDeleteOthers = verifGroupe && botIsAdmin;

    const targetKey = isBotMessage
      ? { remoteJid: dest, fromMe: true, id: targetId }
      : { remoteJid: dest, fromMe: false, id: targetId, ...(author ? { participant: author } : {}) };

    const commandKey = {
      remoteJid: dest,
      fromMe: !!ms.key.fromMe,
      id: ms.key.id,
      ...(ms.key.participant ? { participant: ms.key.participant } : {}),
    };

    const canDeleteTarget = isBotMessage || canDeleteOthers;
    const canDeleteCommand = !!ms.key.fromMe || canDeleteOthers;

    if (canDeleteTarget) {
      await client.sendMessage(dest, { delete: targetKey });
    } else {
      console.log("[del] cannot delete that message: the bot is not an admin of this chat.");
    }
    // The command message goes too, but only when something was actually deleted.
    if (canDeleteTarget && canDeleteCommand) {
      await client.sendMessage(dest, { delete: commandKey });
    }
  } catch (e) {
    console.log("[del] error:", e && e.message ? e.message : e);
  }
});
