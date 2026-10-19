"use strict";
/**
 * antiStatusMention.js
 *
 * Enforcement logic for the .antistatusmention feature (see
 * plugins/Group/antistatusmention.js for the settings command).
 * Ported from NOVA-XMD's updated antistatusmention handler.
 *
 * Detects WhatsApp's "status mention" message type inside a group
 * (someone tagging/mentioning a status in the chat), and depending on
 * the group's configured mode:
 *   off    - does nothing
 *   delete - deletes the message only
 *   warn   - deletes + warns; auto-kicks once the warn limit is hit
 *   kick   - deletes + kicks immediately
 *
 * Admins are always exempt. If the bot itself isn't admin, it tells
 * the group instead of silently failing.
 *
 * HOW TO WIRE THIS UP:
 * In index.js, inside the same messages.upsert loop that already
 * handles antilink (the one iterating `for (const mek of messages)`),
 * add near the top of that loop body:
 *
 *   const { checkStatusMention } = require('./lib/antiStatusMention');
 *   await checkStatusMention(client, mek).catch((e) =>
 *       console.log('[antistatusmention] error:', e.message)
 *   );
 *
 * This file is self-contained (does its own group-JID/fromMe checks),
 * so it's safe to call unconditionally for every incoming message —
 * it no-ops immediately for anything that isn't a status-mention
 * message in a group.
 */
const { getGroupFeature, addGroupWarn, resetGroupWarn } = require('../lib/groupProtection');
const { resolveLidForStatus } = require('./lidResolver');
const db = require('../database/db');

function _num(jid) {
    return (jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function _participantNum(p) {
    const phone = p.phoneNumber || p.phone_number || '';
    if (phone) return _num(phone);
    const base = p.id || p.jid || '';
    if (base && !base.endsWith('@lid')) return _num(base);
    return _num(p.lid || base);
}

async function checkStatusMention(client, mek) {
    if (!mek?.message) return;
    if (mek.key?.fromMe) return;

    const groupId = mek.key?.remoteJid;
    if (!groupId || !groupId.endsWith('@g.us')) return;

    if (!mek.message.groupStatusMentionMessage) return;

    const mode = (await getGroupFeature(groupId, 'antistatusmention') || 'off').toLowerCase();
    if (!mode || mode === 'off') return;

    let groupMetadata;
    try {
        groupMetadata = await client.groupMetadata(groupId);
    } catch (e) {
        return;
    }

    const rawSender = mek.key?.participant || mek.participant;
    if (!rawSender) return;

    const sender = rawSender.endsWith('@lid')
        ? await resolveLidForStatus(client, rawSender)
        : rawSender;

    const senderNum = _num(sender);

    const botRaw = (client.user?.id || '');
    const botNum = _num(botRaw);

    const isAdmin = groupMetadata.participants.some((p) => {
        return _participantNum(p) === senderNum && (p.admin === 'admin' || p.admin === 'superadmin');
    });
    const isBotAdmin = groupMetadata.participants.some((p) => {
        return _participantNum(p) === botNum && (p.admin === 'admin' || p.admin === 'superadmin');
    });

    const username = senderNum || sender.split('@')[0];

    if (isAdmin) {
        await client.sendMessage(groupId, {
            text: `status mention detected\n@${username} you're admin, this one stays.`,
            mentions: [sender]
        });
        return;
    }

    if (!isBotAdmin) {
        await client.sendMessage(groupId, {
            text: `status mention detected\n@${username} make me admin to enforce this.`,
            mentions: [sender]
        });
        return;
    }

    try {
        await client.sendMessage(groupId, {
            delete: {
                remoteJid: groupId,
                fromMe: false,
                id: mek.key.id,
                participant: mek.key.participant || sender
            }
        });
    } catch (e) {
        // best-effort — continue even if delete fails, the mode-specific
        // messages below still communicate what happened/should happen
    }

    if (mode === 'delete') {
        await client.sendMessage(groupId, {
            text: `status mention detected, message deleted\n@${username} avoid mentioning status.`,
            mentions: [sender]
        });
        return;
    }

    if (mode === 'kick') {
        try {
            await client.groupParticipantsUpdate(groupId, [sender], 'remove');
            await client.sendMessage(groupId, {
                text: `status mention detected, message deleted\n@${username} kicked for status mention.`,
                mentions: [sender]
            });
        } catch (e) {
            await client.sendMessage(groupId, {
                text: `status mention detected, message deleted\n@${username} tried to kick but failed, check my permissions.`,
                mentions: [sender]
            });
        }
        return;
    }

    // mode === 'warn'
    const warnLimit = await db.getWarnLimit(groupId);
    const newCount = await addGroupWarn(groupId, 'antistatusmention', username);

    if (newCount >= warnLimit) {
        await resetGroupWarn(groupId, 'antistatusmention', username);
        try { await client.groupParticipantsUpdate(groupId, [sender], 'remove'); } catch (e) {}
        await client.sendMessage(groupId, {
            text: `status mention detected, message deleted\n@${username} kicked, warn limit ${newCount}/${warnLimit} reached.`,
            mentions: [sender]
        });
        return;
    }

    await client.sendMessage(groupId, {
        text: `status mention detected, message deleted\n@${username} avoid mentioning status. Warn ${newCount}/${warnLimit}.`,
        mentions: [sender]
    });
}

module.exports = { checkStatusMention };
