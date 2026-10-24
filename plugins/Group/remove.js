const { bmbtz } = require("../../devbmb/bmbtz");

/**
 * remove
 *
 * Fixed a real bug while splitting this out: the alias field was
 * spelled `aliases: ["kick"]`, but the command registry only reads
 * `alias` (see devbmb/bmbtz.js / how index.js checks
 * `bmbtz.alias.includes(com)`) — so ".kick" has never actually worked
 * as an alias for this command until now.
 */
bmbtz({ nomCom: "remove", alias: ["kick"], categorie: 'Group', reaction: "🦵" }, async (dest, client, commandeOptions) => {
  let { repondre, verifGroupe, verifAdmin, superUser, idBot, utilisateur } = commandeOptions;

  if (!verifGroupe) { return repondre("for groups only"); }
  if (!(verifAdmin || superUser)) { return repondre("Sorry, I cannot perform this action because you are not an administrator of the group."); }
  if (!utilisateur) { return repondre("Tag or reply to the member you want to remove."); }
  if (utilisateur === idBot) { return repondre("I cannot remove myself."); }

  // No pre-check of the bot's own admin status via groupMetadata here —
  // see the comment on promote.js for why (LID JID mismatch on this
  // Baileys fork made that check unreliable and wrongly reported "not
  // an administrator" even when the bot was admin).

  try {
    await client.groupParticipantsUpdate(dest, [utilisateur], "remove");
    await client.sendMessage(dest, {
      text: `╭───〔 🦵 MEMBER REMOVED 〕───\n│\n│ 👤 User: @${utilisateur.split("@")[0]}\n│\n│ ✅ Removed from group successfully\n│\n╰────────────────────`,
      mentions: [utilisateur]
    });
  } catch (e) {
    const msg = (e.message || e).toString();
    if (msg.includes('forbidden') || msg.includes('not-authorized') || msg.includes('403')) {
      return repondre("Failed to remove. Make sure I'm an admin and the user isn't a group admin themselves.");
    }
    repondre("oups " + e);
  }
});
