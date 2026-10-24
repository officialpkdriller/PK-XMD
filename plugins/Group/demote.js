const { bmbtz } = require("../../devbmb/bmbtz");

bmbtz({ nomCom: "demote", alias: ["removeadmin"], categorie: 'Group', reaction: "🔃" }, async (dest, client, commandeOptions) => {
  let { repondre, verifGroupe, verifAdmin, superUser, utilisateur } = commandeOptions;
  if (!verifGroupe) { return repondre("For groups only"); }
  if (!(verifAdmin || superUser)) { return repondre("Sorry I cannot perform this action because you are not an administrator of the group."); }
  if (!utilisateur) { return repondre("Tag or reply to the member you want to demote."); }

  // (See the comment in promote.js — no bot-admin JID pre-check here
  // either, for the same LID-related reason.)
  try {
    await client.groupParticipantsUpdate(dest, [utilisateur], "demote");
    var txt = `@${utilisateur.split("@")[0]} was removed from his position as a group administrator\n`
    await client.sendMessage(dest, { text: txt, mentions: [utilisateur] })
  } catch (e) {
    const msg = (e.message || e).toString();
    if (msg.includes('forbidden') || msg.includes('not-authorized') || msg.includes('403')) {
      return repondre("Failed to demote. Make sure I'm an admin and the user is in the group.");
    }
    repondre("oups " + e)
  }

})
