const { bmbtz } = require("../../devbmb/bmbtz");

bmbtz({ nomCom: "promote", alias: ["makeadmin"], categorie: 'Group', reaction: "🔃" }, async (dest, client, commandeOptions) => {
  let { repondre, verifGroupe, verifAdmin, superUser, utilisateur } = commandeOptions;
  if (!verifGroupe) { return repondre("For groups only"); }
  if (!(verifAdmin || superUser)) { return repondre("Sorry I cannot perform this action because you are not an administrator of the group."); }
  if (!utilisateur) { return repondre("Tag or reply to the member you want to promote."); }

  // No pre-check of the bot's own admin status here — comparing the
  // bot's JID against groupMetadata().participants is unreliable on
  // this Baileys fork's LID system (a participant can be listed under
  // a different JID form than what client.user.id decodes to), which
  // caused this command to wrongly report "I am not an administrator"
  // even when the bot WAS admin. Instead, just attempt the action and
  // let WhatsApp's own response tell us if it failed — same approach
  // NOVA-XMD's promote.js uses.
  try {
    await client.groupParticipantsUpdate(dest, [utilisateur], "promote");
    var txt = `🎊🎊🎊  @${utilisateur.split("@")[0]} rose in rank.\n
                      he/she has been named group administrator.`
    await client.sendMessage(dest, { text: txt, mentions: [utilisateur] })
  } catch (e) {
    const msg = (e.message || e).toString();
    if (msg.includes('forbidden') || msg.includes('not-authorized') || msg.includes('403')) {
      return repondre("Failed to promote. Make sure I'm an admin and the user is in the group.");
    }
    repondre("oups " + e)
  }

})
