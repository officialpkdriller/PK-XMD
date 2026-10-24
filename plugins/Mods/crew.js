const { bmbtz } = require('../../devbmb/bmbtz');

/**
 * crew
 *
 * Added detailed [crew] logging and proper error handling — the
 * previous version had no try/catch around groupCreate at all, so any
 * failure (invalid participant JID, WhatsApp rejecting group creation,
 * etc) would throw silently with no visible feedback to the user.
 */
bmbtz({
    nomCom: "crew",
    alias: ["newgroup", "creategroup"],
    categorie: "Mods"
}, async (dest, client, commandeOptions) => {
    const { arg, superUser, auteurMessage, auteurMsgRepondu, msgRepondu, repondre } = commandeOptions;

    if (!superUser) { repondre("only modds can use this command"); return };

    if (!arg[0]) { repondre('Please enter the name of the group to create'); return };
    if (!msgRepondu) { repondre('Please mention a member added '); return; }
    if (!auteurMsgRepondu) { repondre('Could not identify the mentioned member — try replying directly to their message.'); return; }

    const name = arg.join(" ");
    const participants = [...new Set([auteurMessage, auteurMsgRepondu])].filter(Boolean);

    console.log('[crew] creating group:', name, '| participants:', JSON.stringify(participants));

    try {
        const group = await client.groupCreate(name, participants);
        console.log('[crew] groupCreate result:', JSON.stringify({ id: group?.id, gid: group?.gid, subject: group?.subject }));

        const groupId = group?.id || group?.gid;
        if (!groupId) {
            repondre('Group creation returned no group ID — something went wrong. Check logs.');
            return;
        }

        await client.sendMessage(groupId, { text: `Bienvenue dans ${name}` });
        repondre(`✅ Group "${name}" created successfully.`);
    } catch (e) {
        console.log('[crew] groupCreate failed:', e?.message || e);
        repondre(`Failed to create group: ${e?.message || e}`);
    }
});
