"use strict";
const { bmbtz } = require('../../devpk/bmbtz');
const ownerAccess = require('../../lib/ownerAccess');

/**
 * pin / unpin
 *
 * Pins (or unpins) the message the command is replying to.
 *   .pin            pin for 7 days (the WhatsApp default)
 *   .pin 24h        pin for 24 hours     (also: 1d)
 *   .pin 7d         pin for 7 days       (also: 1w)
 *   .pin 30d        pin for 30 days      (also: 1m)
 *   .unpin          remove the pin
 *
 * Baileys has no pinMessage() function. A pin is a special message that is sent to the chat:
 *   sock.sendMessage(jid, { pin: <message key>, type: 1, time: <seconds> })   // pin for everyone
 *   sock.sendMessage(jid, { pin: <message key>, type: 2 })                    // unpin for everyone
 */
const PIN_FOR_ALL = 1;
const UNPIN_FOR_ALL = 2;

const DURATIONS = [
    { seconds: 86400,   label: '24 hours', words: ['24h', '1d', 'day', '24'] },
    { seconds: 604800,  label: '7 days',   words: ['7d', '1w', 'week', '7'] },
    { seconds: 2592000, label: '30 days',  words: ['30d', '1m', 'month', '30'] },
];
const DEFAULT_DURATION = DURATIONS[1];

const d = (v) => ownerAccess.digits(v);
const isAdminMember = (p) => p && (p.admin === 'admin' || p.admin === 'superadmin' || p.admin === true);
const idsOf = (p) =>
    [p && p.id, p && p.lid, p && p.jid, p && p.phoneNumber, p && p.phone_number].filter(Boolean).map(d).filter(Boolean);

function parseDuration(arg) {
    const word = String((arg && arg[0]) || '').toLowerCase();
    if (!word) return DEFAULT_DURATION;
    return DURATIONS.find((x) => x.words.includes(word)) || null;
}

function registerPinCommand(nomCom, isUnpin) {
    bmbtz({
        nomCom,
        categorie: 'Group',
        reaction: '📌'
    }, async (dest, client, reponse) => {
        const { repondre, verifGroupe, verifAdmin, superUser, ms, mtype, mbre, auteurMessage, senderJid, idBot, arg, prefixe } = reponse;
        const p = prefixe || '.';

        // Who may use it: group admins (also when WhatsApp gives their id as @lid) and the bot owner.
        if (verifGroupe) {
            const participants = Array.isArray(mbre) ? mbre : [];
            const senderIds = [auteurMessage, senderJid].filter(Boolean).map(d);
            const senderIsAdmin = verifAdmin || participants.some((x) => isAdminMember(x) && idsOf(x).some((i) => senderIds.includes(i)));
            if (!(senderIsAdmin || superUser)) {
                return repondre('Sorry, only group admins can use this command.');
            }
        } else if (!superUser) {
            return repondre('🚫 *This command is for groups. In a private chat only the bot owner can use it.*');
        }

        const contextInfo = (ms && ms.message && ms.message[mtype] && ms.message[mtype].contextInfo) || {};
        const stanzaId = contextInfo.stanzaId;
        const participant = contextInfo.participant;

        if (!stanzaId) {
            return repondre(`Quote a message to ${isUnpin ? 'unpin' : 'pin'} it.`);
        }

        const duration = isUnpin ? null : parseDuration(arg);
        if (!isUnpin && !duration) {
            return repondre(`Use a valid time: ${p}pin 24h, ${p}pin 7d or ${p}pin 30d.`);
        }

        // The key of the message to pin. A message sent by the bot itself needs fromMe = true.
        const botIds = [idBot, client.user && client.user.id, client.user && client.user.lid].filter(Boolean).map(d);
        const isBotMessage = !!participant && botIds.includes(d(participant));
        const messageKey = isBotMessage
            ? { remoteJid: dest, fromMe: true, id: stanzaId }
            : { remoteJid: dest, fromMe: false, id: stanzaId, ...(participant ? { participant } : {}) };

        try {
            const content = isUnpin
                ? { pin: messageKey, type: UNPIN_FOR_ALL }
                : { pin: messageKey, type: PIN_FOR_ALL, time: duration.seconds };
            await client.sendMessage(dest, content);
            return repondre(isUnpin
                ? '📌 Message unpinned successfully.'
                : `📌 Message pinned successfully for ${duration.label}.`);
        } catch (e) {
            const msg = (e && e.message ? e.message : String(e));
            console.log(`[${nomCom}] failed:`, msg);
            if (/forbidden|not-authorized|403|401/i.test(msg)) {
                return repondre("Failed to " + nomCom + ". Make sure I'm an admin and that members are allowed to pin in this group.");
            }
            if (/invalid message content|unsupported|not supported/i.test(msg)) {
                return repondre('Pin is not supported by the installed Baileys version. Please update the baileys dependency.');
            }
            return repondre(`${isUnpin ? 'Unpin' : 'Pin'} failed: ` + msg.slice(0, 80));
        }
    });
}

registerPinCommand('pin', false);
registerPinCommand('unpin', true);

module.exports = { parseDuration };
