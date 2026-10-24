"use strict";
/**
 * plugins/Owner/sudo.js - manage sudo users (people who get owner-level command access).
 *   .addsudo <number | @mention | reply>   add a sudo user      (owner only)
 *   .delsudo <number | @mention | reply>   remove a sudo user   (owner only)
 *   .sudolist                              list sudo users      (owner / sudo)
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const sudoLib = require("../../lib/sudo");
const ownerAccess = require("../../lib/ownerAccess");

const LINE = "━━━━━━━━━━━━━━━━";
const box = (title, body) => `📌 *${title}*\n${LINE}\n${body}\n${LINE}\n© bmb tech`;

/** Find the target number from an argument, a mention or a replied-to message. */
function findTarget(o) {
  const { arg, utilisateur, mbre } = o;
  const typed = ownerAccess.digits((arg || []).join(""));
  if (typed.length >= 6) return { jid: typed + "@s.whatsapp.net" };

  const raw = utilisateur || (o.mentionedJid && o.mentionedJid[0]) || "";
  if (!raw) return { jid: "" };
  const resolved = ownerAccess.resolveSenderJid(raw, Array.isArray(mbre) ? mbre : []);
  if (String(resolved).endsWith("@lid")) return { jid: "", unresolved: true };
  return { jid: ownerAccess.toJid(resolved) };
}

const NO_OWNER = box("SUDO", "Only the bot owner can manage sudo users.");
const USAGE = (p, cmd) => box("SUDO", `Reply to a user, mention them, or type a number.\nExample: ${p}${cmd} 255712345678`);
const NO_TARGET = box("SUDO", "I could not read that user's phone number.\nPlease type the number instead.\nExample: .addsudo 255712345678");

bmbtz({ nomCom: "addsudo", alias: ["setsudo", "addowner"], categorie: "Owner", reaction: "➕" }, async (dest, client, o) => {
  const { repondre, fullOwner, prefixe } = o;
  if (!fullOwner) return repondre(NO_OWNER);
  const t = findTarget(o);
  if (!t.jid) return repondre(t.unresolved ? NO_TARGET : USAGE(prefixe || ".", "addsudo"));

  const current = await sudoLib.getAllSudoNumbers();
  if (current.some((j) => ownerAccess.digits(j) === ownerAccess.digits(t.jid))) {
    return repondre(box("SUDO", `@${ownerAccess.digits(t.jid)} is already a sudo user.`));
  }
  await sudoLib.addSudoNumber(t.jid);
  process.emit("bmb:sudo-changed");
  await client.sendMessage(dest, {
    text: box("SUDO ADDED", `✅ @${ownerAccess.digits(t.jid)} now has owner-level access.`),
    mentions: [t.jid],
  }, { quoted: o.ms });
});

bmbtz({ nomCom: "delsudo", alias: ["removesudo", "rmsudo", "delowner"], categorie: "Owner", reaction: "➖" }, async (dest, client, o) => {
  const { repondre, fullOwner, prefixe } = o;
  if (!fullOwner) return repondre(NO_OWNER);
  const t = findTarget(o);
  if (!t.jid) return repondre(t.unresolved ? NO_TARGET : USAGE(prefixe || ".", "delsudo"));

  const current = await sudoLib.getAllSudoNumbers();
  const stored = current.find((j) => ownerAccess.digits(j) === ownerAccess.digits(t.jid));
  if (!stored) return repondre(box("SUDO", `@${ownerAccess.digits(t.jid)} is not a sudo user.`));

  await sudoLib.removeSudoNumber(stored);
  process.emit("bmb:sudo-changed");
  await client.sendMessage(dest, {
    text: box("SUDO REMOVED", `✅ @${ownerAccess.digits(t.jid)} no longer has owner-level access.`),
    mentions: [t.jid],
  }, { quoted: o.ms });
});

bmbtz({ nomCom: "sudolist", alias: ["getsudo", "checksudo", "listsudo", "owners"], categorie: "Owner", reaction: "📋" }, async (dest, client, o) => {
  const { repondre, superUser } = o;
  if (!superUser) return repondre(box("SUDO", "This command is only for the owner and sudo users."));
  const list = await sudoLib.getAllSudoNumbers();
  if (!list.length) return repondre(box("SUDO LIST", "No sudo users yet.\nAdd one with .addsudo <number>"));
  const lines = list.map((j, i) => `${i + 1}. +${ownerAccess.digits(j)}`);
  await client.sendMessage(dest, { text: box("SUDO LIST", `Total: ${list.length}\n${lines.join("\n")}`) }, { quoted: o.ms });
});
