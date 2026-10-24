const { bmbtz } = require("../../devbmb/bmbtz");

bmbtz({ nomCom: "group", alias: ["groupsetting"], categorie: 'Group' }, async (dest, client, commandeOptions) => {

  const { repondre, verifGroupe, verifAdmin, superUser, arg } = commandeOptions;

  if (!verifGroupe) {
    return repondre("🚫 *This command is for group use only.*");
  }

  if (!(superUser || verifAdmin)) {
    return repondre("🌚 *Only group admins can use this command.*");
  }

  if (!arg[0]) {
    return repondre(
`📌 *Usage Instructions:*

Type:
- *group open*  → To allow everyone to send messages
- *group close* → To restrict messages to admins only`);
  }

  const option = arg.join(' ').toLowerCase();

  switch (option) {
    case "open":
      await client.groupSettingUpdate(dest, 'not_announcement');
      repondre(
`╭──❰ *GROUP STATUS UPDATE* ❱──╮
│
│ 🔓 The group has been *opened*.
│ ✉️ All members can now send messages.
│
╰────────────────────────────╯`);
      break;

    case "close":
      await client.groupSettingUpdate(dest, 'announcement');
      repondre(
`╭──❰ *GROUP STATUS UPDATE* ❱──╮
│
│ 🔐 The group has been *closed*.
│ 👑 Only *admins* can send messages now.
│
╰────────────────────────────╯`);
      break;

    default:
      repondre("❌ *Invalid option.* Use: group open | group close");
  }
});
