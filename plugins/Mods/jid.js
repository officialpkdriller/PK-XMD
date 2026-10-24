const { bmbtz } = require('../../devbmb/bmbtz');

/**
 * jid
 *
 * Enhanced: previously only worked by replying to a message (to get
 * that person's JID) or with no args (to get the current chat's JID).
 * Now also accepts a WhatsApp group invite link or a raw JID directly
 * as an argument, resolving it to the group's JID.
 *
 * Usage:
 *   .jid                         -> JID of the current chat
 *   .jid (as a reply to someone) -> that person's JID
 *   .jid <group invite link>     -> resolves and returns the group's JID
 *   .jid <jid>                   -> echoes it back, cleaned up
 */
bmbtz({
    nomCom: "jid",
    alias: ["getjid", "myjid"],
    categorie: "Mods"
}, async (dest, client, commandeOptions) => {
    const { ms, repondre, arg, msgRepondu, superUser, verifAdmin, auteurMsgRepondu } = commandeOptions;

    if (!(superUser || verifAdmin)) {
        repondre("command reserved for the bot owner or group admins");
        return;
    }

    const input = (arg || []).join(' ').trim();

    // Case 1: a group invite link or raw JID was provided directly.
    if (input) {
        if (input.includes('chat.whatsapp.com')) {
            let code;
            try {
                const url = new URL(input);
                code = url.pathname.replace(/^\/+/, '');
            } catch {
                code = input.split('/').pop();
            }
            try {
                const info = await client.groupGetInviteInfo(code);
                const groupJid = info?.id || info?.groupId || info?.gid;
                if (!groupJid) throw new Error('no id in invite info');
                return client.sendMessage(dest, { text: groupJid }, { quoted: ms });
            } catch (e) {
                return repondre('Could not resolve that invite link — it may be invalid or expired.');
            }
        }

        if (input.includes('@')) {
            return client.sendMessage(dest, { text: input.trim() }, { quoted: ms });
        }

        return repondre('That doesn\'t look like a group link or JID.');
    }

    // Case 2: replying to someone — return their JID.
    // Case 3: no input, no reply — return the current chat's JID.
    let jid;
    if (!msgRepondu) {
        jid = dest;
    } else {
        jid = auteurMsgRepondu;
    }

    client.sendMessage(dest, { text: jid }, { quoted: ms });
});
