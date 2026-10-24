const { bmbtz } = require("../../devbmb/bmbtz");

bmbtz({ nomCom: "gdesc", alias: ["setgroupdesc", "groupdesc"], categorie: 'Group' }, async (dest, client, commandeOptions) => {
  const { arg, repondre, verifAdmin, superUser } = commandeOptions;

  if (!(verifAdmin || superUser)) {
    repondre("⚠️ This command is for *group admins only*.");
    return;
  }

  if (!arg[0]) {
    repondre("✏️ Please enter the new *group description*.");
    return;
  }

  const nom = arg.join(' ');
  await client.groupUpdateDescription(dest, nom);

  const msg =
`╭───❰ *GROUP DESCRIPTION UPDATED* ❱───✦
┃
┃ ✅ Description has been changed to:
┃ ${nom.replace(/\n/g, '\n┃ ')}
┃
╰─────────────────────────────✦`;

  repondre(msg);
});
