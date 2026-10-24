const { bmbtz } = require('../../devbmb/bmbtz');

bmbtz({
    nomCom: "left",
    alias: ["leave", "exitgroup"],
    categorie: "Mods"
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, superUser } = commandeOptions;

    if (!verifGroupe) { repondre("group only"); return };
    if (!superUser) {
        repondre("order reserved for the owner");
        return;
    }

    await client.groupLeave(dest);
});
