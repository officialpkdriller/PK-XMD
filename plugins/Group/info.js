const { bmbtz } = require("../../devbmb/bmbtz");
const conf = require("../../settings");

/**
 * info
 *
 * Fixed: fell back to `conf.IMAGE_MENU` when the group has no profile
 * picture — that setting doesn't exist anywhere in settings.js, so it
 * would fall back to `undefined`, likely breaking the image send.
 * Uses `conf.URL` (the project's actual configured menu image) instead.
 */
bmbtz({ nomCom: "info", alias: ["ginfo", "groupinfo"], categorie: 'Group' }, async (dest, client, commandeOptions) => {
  const { ms, repondre, verifGroupe } = commandeOptions;
  if (!verifGroupe) {
    repondre("⚠️ This command is for groups only!");
    return;
  }

  let ppgroup;
  try {
    ppgroup = await client.profilePictureUrl(dest, 'image');
  } catch {
    ppgroup = conf.URL;
  }

  const info = await client.groupMetadata(dest);

  let mess = {
    image: { url: ppgroup },
    caption:
`╭━━━❰ *GROUP INFO PANEL* ❱━━━✦
┃
┃ 🏷️ *Group Name:* ${info.subject}
┃ 🆔 *Group ID:* ${dest}
┃ 📝 *Description:*
┃ ${info.desc?.replace(/\n/g, '\n┃ ') || 'No description available'}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━✦`
  };

  client.sendMessage(dest, mess, { quoted: ms });
});
