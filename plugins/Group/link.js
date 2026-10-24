const { bmbtz } = require("../../devbmb/bmbtz");

bmbtz({ nomCom: "link", alias: ["grouplink", "invitelink"], categorie: 'Group', reaction: "🙋" }, async (dest, client, commandeOptions) => {
  const { repondre, nomGroupe, nomAuteurMessage, verifGroupe } = commandeOptions;

  if (!verifGroupe) {
    repondre("😅 Wait bro, you want the link to my DM? This command is for *groups only*.");
    return;
  }

  var link = await client.groupInviteCode(dest);
  var lien = `https://chat.whatsapp.com/${link}`;

  let mess =
`╭───❰ *GROUP LINK REQUESTED* ❱───╮
│
│ 🙋 Hello *${nomAuteurMessage}*,
│ 🔗 Here is the link for group *${nomGroupe}*:
│
│ 👉 ${lien}
│
│ © B.M.B-TECH 𝐬𝐜𝐢𝐞𝐧𝐜𝐞
╰────────────────────────────╯`;

  repondre(mess);

});
