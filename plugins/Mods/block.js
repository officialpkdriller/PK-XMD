const { bmbtz } = require('../../devbmb/bmbtz');

bmbtz({
    nomCom: "block",
    alias: ["blockuser"],
    categorie: "Mods"
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, msgRepondu, superUser, auteurMsgRepondu } = commandeOptions;

    if (!superUser) {
        repondre("command reserved for the bot owner");
        return;
    }

    let jid;
    if (!msgRepondu) {
        if (verifGroupe) {
            repondre('Be sure to mention the person to block');
            return;
        }
        jid = dest;
        await client.updateBlockStatus(jid, "block").then(() => repondre('succes'));
    } else {
        jid = auteurMsgRepondu;
        await client.updateBlockStatus(jid, "block").then(() => repondre('succes'));
    }
});
