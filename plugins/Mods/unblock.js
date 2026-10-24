const { bmbtz } = require('../../devbmb/bmbtz');

bmbtz({
    nomCom: "unblock",
    alias: ["unblockuser"],
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
            repondre('Please mention the person to be unlocked');
            return;
        }
        jid = dest;
        await client.updateBlockStatus(jid, "unblock").then(() => repondre('succes'));
    } else {
        jid = auteurMsgRepondu;
        await client.updateBlockStatus(jid, "unblock").then(() => repondre('succes'));
    }
});
