const { bmbtz } = require("../../devbmb/bmbtz");

bmbtz({ nomCom: "tagall", alias: ["everyone", "all", "tagmembers"], categorie: 'Group', reaction: "📣" }, async (dest, client, commandeOptions) => {

  const {
    ms,
    repondre,
    arg,
    verifGroupe,
    nomGroupe,
    infosGroupe,
    nomAuteurMessage,
    verifAdmin,
    superUser
  } = commandeOptions;

  if (!verifGroupe) {
    repondre("🚫 *This command is for group use only.*");
    return;
  }

  let mess = (!arg || arg === ' ') ? '🔔 No message provided.' : arg.join(' ');
  let membresGroupe = await infosGroupe.participants;

  let emoji = ['🦴', '👀', '😮‍💨', '❌', '✔️', '😇', '⚙️', '🔧', '🎊', '😡', '🙏🏿', '⛔️', '$', '😟', '🥵', '🐅'];
  let random = Math.floor(Math.random() * emoji.length);

  let tag =
`╭─────❰ *📣 GROUP TAG ALERT* ❱─────╮
│
│ 🏷️ *Group:* ${nomGroupe}
│ 👤 *By:* ${nomAuteurMessage}
│ 💬 *Message:* ${mess}
│
│ 👥 *Tagged Members:*
│────────────────────────────`;

  for (const membre of membresGroupe) {
    tag += `\n│ ${emoji[random]} @${membre.id.split("@")[0]}`;
  }

  tag += `\n╰────────────────────────────╯`;

  if (verifAdmin || superUser) {
    client.sendMessage(dest, {
      text: tag,
      mentions: membresGroupe.map((i) => i.id)
    }, { quoted: ms });
  } else {
    repondre("🚫 *Only group admins can use this command.*");
  }

});
