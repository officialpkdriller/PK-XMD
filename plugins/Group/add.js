const { bmbtz } = require('../../devbmb/bmbtz');
const { getBinaryNodeChild, getBinaryNodeChildren } = require('@whiskeysockets/baileys');

/**
 * add
 *
 * Fixed/ported from NOVA-XMD's plugins/Groups/add.js. The old BMB-TECH
 * version (previously in popsstand1.js) had two bugs that made it
 * effectively unusable:
 *   1. It required superUser (bot owner) in addition to being a group
 *      admin — normal group admins could never use it.
 *   2. The WhatsApp query used tag "settings" (attrs.type: "settings")
 *      instead of "set", which is not a valid add-participant request
 *      and fails silently against current WhatsApp servers.
 * This version fixes both, matching NOVA-XMD's working implementation.
 */
bmbtz({
    nomCom: 'add',
    categorie: 'Group',
    reaction: '🪄'
}, async (dest, client, commandeOptions) => {
    const { repondre, verifAdmin, verifGroupe, superUser, idBot, arg, ms, nomAuteurMessage } = commandeOptions;

    if (!verifGroupe) return repondre('*This command works in groups only!*');

    // Caller check: admin OR the bot owner (superUser) — matches
    // NOVA-XMD's middleware.js `!isDev && !context.isAdmin` bypass logic.
    // The previous version required verifAdmin with no bypass at all, so
    // even the owner typing the command on their own device could get
    // blocked if verifAdmin's JID comparison didn't line up perfectly
    // (the same LID/PN mismatch class of issue fixed elsewhere in this
    // project for promote/demote/remove/antibot).
    if (!(verifAdmin || superUser)) {
        return repondre('You are not an admin here!');
    }

    let groupMetadata;
    try {
        groupMetadata = await client.groupMetadata(dest);
    } catch {
        return repondre('Failed to fetch group metadata.');
    }

    // Bot-admin check, ported from NOVA-XMD's middleware.js style
    // (tolerant substring/suffix match instead of strict JID equality).
    // NON-BLOCKING: only logged, not enforced. Reasoning — .link in this
    // same project calls client.groupInviteCode() with NO pre-check at
    // all, which only succeeds if the bot really is a group admin; since
    // that command works, the bot genuinely IS admin, yet this same
    // fuzzy-match logic still reported "not admin" here — meaning the
    // mismatch runs deeper than a simple LID/PN suffix difference for
    // this fork/session. Rather than block a working feature on a
    // check we can't yet trust, we log what we see (for diagnosis) and
    // let the actual add-participant request below decide via its own
    // WhatsApp error codes (401/403/408) — the same pattern already
    // proven reliable for promote/demote/remove/antibot in this project.
    const botNum = (idBot || client.user?.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');
    let isBotAdmin = false;

    console.log('[add] idBot:', idBot, '| botNum:', botNum);
    console.log('[add] participants:', JSON.stringify(
        (groupMetadata.participants || []).map(p => ({ id: p.id, jid: p.jid, lid: p.lid, admin: p.admin }))
    ));

    for (const p of groupMetadata.participants || []) {
        const isAdminRole = p.admin === 'admin' || p.admin === 'superadmin';
        if (!isAdminRole) continue;

        const candidates = [p.id, p.jid, p.lid].filter(Boolean);
        for (const c of candidates) {
            const pNum = c.split('@')[0].split(':')[0].replace(/\D/g, '');
            if (pNum && botNum && (pNum === botNum || pNum.endsWith(botNum) || botNum.endsWith(pNum))) {
                isBotAdmin = true;
                break;
            }
        }
        if (isBotAdmin) break;
    }

    console.log('[add] isBotAdmin resolved to:', isBotAdmin, isBotAdmin ? '' : '(proceeding anyway — see comment above)');

    if (!arg[0]) return repondre('Provide number to be added. Example:\nadd 255XXXXX457');

    const participants = groupMetadata.participants;
    const existingMembers = participants.map((p) => p.id.split(':')[0] + '@s.whatsapp.net');

    const numberList = arg.join(' ').split(',')
        .map((v) => v.replace(/[^0-9]/g, ''))
        .filter((v) => v.length > 4 && v.length < 20 && !existingMembers.includes(v + '@s.whatsapp.net'));

    if (numberList.length === 0) {
        return repondre('That number is already in the group, or no valid number was provided.');
    }

    let checkedUsers;
    try {
        checkedUsers = await Promise.all(
            numberList.map(async (v) => {
                try {
                    const exists = await client.onWhatsApp(v + '@s.whatsapp.net');
                    console.log(`[add] onWhatsApp(${v}) ->`, JSON.stringify(exists));
                    return { num: v, exists: exists?.[0]?.exists };
                } catch (innerErr) {
                    // onWhatsApp itself failed for this number (network hiccup,
                    // fork quirk, etc) — don't silently drop the number, let
                    // the actual group-add request below decide instead.
                    console.log(`[add] onWhatsApp(${v}) threw:`, innerErr?.message || innerErr);
                    return { num: v, exists: 'unknown' };
                }
            })
        );
    } catch {
        return repondre('Error validating phone numbers.');
    }

    // Numbers confirmed to exist, PLUS numbers where the existence check
    // itself failed (exists: 'unknown') — those go straight to the
    // add-participant request below and let WhatsApp's own response
    // decide, instead of being silently filtered out here.
    const users = checkedUsers
        .filter((v) => v.exists === true || v.exists === 'unknown')
        .map((v) => v.num + '@s.whatsapp.net');

    if (users.length === 0) {
        return repondre("None of those numbers exist on WhatsApp, or they're already in the group.");
    }

    let response;
    try {
        response = await client.query({
            tag: 'iq',
            attrs: { type: 'set', xmlns: 'w:g2', to: dest },
            content: users.map((jid) => ({
                tag: 'add',
                attrs: {},
                content: [{ tag: 'participant', attrs: { jid } }],
            })),
        });
    } catch (queryErr) {
        console.log('[add] group-add query failed:', queryErr?.message || queryErr);
        const msg = (queryErr?.message || queryErr || '').toString();
        if (msg.includes('forbidden') || msg.includes('not-authorized') || msg.includes('403')) {
            return repondre('👮 *BOT NOT ADMIN*\n━━━━━━━━━━━━━━━━\nWhatsApp rejected this — I need admin rights to add members.\nMake me admin first.\n━━━━━━━━━━━━━━━━\n© bmb tech');
        }
        return repondre('Failed to add user(s) to the group!');
    }

    const add = getBinaryNodeChild(response, 'add');
    const participantResults = getBinaryNodeChildren(add, 'participant');
    console.log('[add] participant results:', JSON.stringify(participantResults?.map(p => p.attrs)));

    for (const item of participantResults) {
        if (!item.attrs.error) {
            await repondre(`Successfully added @${item.attrs.jid.split('@')[0]}`);
        }
    }

    let inviteCode;
    try {
        inviteCode = await client.groupInviteCode(dest);
    } catch {
        inviteCode = null;
    }

    const failedAdds = participantResults.filter(
        (item) => item.attrs.error === '401' || item.attrs.error === '403' || item.attrs.error === '408'
    );

    for (const fail of failedAdds) {
        const jid = fail.attrs.jid;
        let reason = 'could not be added.';
        if (fail.attrs.error === '401') reason = 'has blocked the bot.';
        else if (fail.attrs.error === '403') reason = 'has privacy settings preventing group adding — sending an invite instead.';
        else if (fail.attrs.error === '408') reason = 'recently left the group — sending an invite instead.';

        await repondre(`I cannot add @${jid.split('@')[0]}: ${reason}`);

        if (inviteCode) {
            await client.sendMessage(jid, {
                text: `You have been invited to join the group *${groupMetadata.subject}*:\n\nhttps://chat.whatsapp.com/${inviteCode}\n\n*POWERED BY BMB-TECH*`,
            }).catch(() => {});
        }
    }
});
