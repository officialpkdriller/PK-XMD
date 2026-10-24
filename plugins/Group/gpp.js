const { bmbtz } = require("../../devbmb/bmbtz");
const fs = require("fs-extra");

bmbtz({ nomCom: "gpp", alias: ["setgpp", "groupicon"], categorie: 'Group' }, async (dest, client, commandeOptions) => {

  const { repondre, msgRepondu, verifAdmin, superUser } = commandeOptions;

  if (!(verifAdmin || superUser)) {
    repondre("order reserved for administrators of the group");
    return;
  };
  if (msgRepondu && msgRepondu.imageMessage) {
    const pp = await client.downloadAndSaveMediaMessage(msgRepondu.imageMessage);

    await client.updateProfilePicture(dest, { url: pp })
      .then(() => {
        client.sendMessage(dest, { text: "Group pfp changed" })
        fs.unlinkSync(pp)
      }).catch((err) => client.sendMessage(dest, { text: 'Failed to update group picture: ' + err })
      )

  } else {
    repondre('Please reply to an image')
  }

});
