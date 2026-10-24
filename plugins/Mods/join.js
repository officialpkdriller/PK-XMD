"use strict";
/**
 * join - makes the bot join a WhatsApp group.
 *   .join <invite link>           (any form of the link works)
 *   .join  (as a reply to a message that contains the link, or to a forwarded group invite)
 *
 * Accepted forms:  https://chat.whatsapp.com/CODE   chat.whatsapp.com/CODE
 *                  links ending in ?mode=...        a bare 22-character invite code
 * Owner / sudo only.
 */
const { bmbtz } = require("../../devbmb/bmbtz");

const LINK_RE = /(?:https?:\/\/)?chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]{16,32})/i;
const BARE_CODE_RE = /^[A-Za-z0-9_-]{20,24}$/;

/** Finds the invite code in the typed arguments or in the replied-to message. */
function findInviteCode(args, quoted) {
  const typed = (args || []).join(" ");
  let m = typed.match(LINK_RE);
  if (m) return m[1];

  const bare = (args || []).find((a) => BARE_CODE_RE.test(a) && /[A-Za-z]/.test(a) && /[0-9A-Z_-]/.test(a));
  if (bare) return bare;

  if (quoted) {
    const invite = quoted.groupInviteMessage && quoted.groupInviteMessage.inviteCode;
    if (invite) return invite;
    const text =
      quoted.conversation ||
      (quoted.extendedTextMessage && quoted.extendedTextMessage.text) ||
      (quoted.imageMessage && quoted.imageMessage.caption) ||
      (quoted.videoMessage && quoted.videoMessage.caption) ||
      "";
    m = String(text).match(LINK_RE);
    if (m) return m[1];
  }
  return "";
}

/** Turns a WhatsApp / Baileys error into a clear sentence. */
function explainError(e) {
  const status = (e && e.output && e.output.statusCode) || (e && e.data) || (e && e.status) || 0;
  const msg = String((e && e.message) || "");
  const text = `${status} ${msg}`.toLowerCase();
  if (/conflict|409/.test(text)) return "I am already a member of that group.";
  if (/gone|410/.test(text)) return "That invite link has been revoked or has expired. Please ask for a new one.";
  if (/not-found|404/.test(text)) return "That invite link is invalid. Please check it and try again.";
  if (/not-authorized|401/.test(text)) return "I cannot join that group (I may have been removed from it before).";
  if (/forbidden|403/.test(text)) return "WhatsApp refused the request. The group may not allow new members right now.";
  if (/resource-limit|full|500/.test(text)) return "That group is full or has reached its limit.";
  if (/bad-request|400/.test(text)) return "WhatsApp rejected that invite code. Please copy the link again.";
  if (/rate|429|overlimit/.test(text)) return "WhatsApp is limiting requests right now. Please wait a minute and try again.";
  return msg || "Unknown error.";
}

bmbtz({
  nomCom: "join",
  alias: ["joingroup", "groupjoin"],
  categorie: "Mods",
  reaction: "🔗",
}, async (dest, client, o) => {
  const { arg, repondre, superUser, msgRepondu, prefixe } = o;

  if (!superUser) return repondre("This command is reserved for the bot owner.");

  const code = findInviteCode(arg, msgRepondu);
  if (!code) {
    return repondre(`Please send a WhatsApp group invite link.\nExample: ${prefixe || "."}join https://chat.whatsapp.com/XXXXXXXXXXXXXXXXXXXXXX\nYou can also reply to a message that contains the link.`);
  }

  // Look the group up first, so a bad or revoked link gives a clear answer.
  let info = null;
  try {
    info = await client.groupGetInviteInfo(code);
  } catch (e) {
    console.log("[join] groupGetInviteInfo failed:", e && e.message ? e.message : e);
    return repondre(`Failed to join: ${explainError(e)}`);
  }

  try {
    await client.groupAcceptInvite(code);
    const name = info && info.subject ? ` *${info.subject}*` : "";
    const size = info && info.size ? ` (${info.size} members)` : "";
    return repondre(`✅ Joined${name}${size}.\nIf the group needs admin approval, a join request has been sent.`);
  } catch (e) {
    console.log("[join] groupAcceptInvite failed:", e && e.message ? e.message : e, e && e.data ? e.data : "");
    return repondre(`Failed to join: ${explainError(e)}`);
  }
});

module.exports = { findInviteCode, explainError };
