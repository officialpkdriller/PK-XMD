"use strict";
/**
 * eventHandler.js
 *
 * Handles group-participants.update events: welcome, goodbye,
 * anti-promote, and anti-demote.
 *
 * FIXED (again): the previous version assumed `group.participants` was
 * an array of plain JID strings (e.g. "12345@lid"). Live logs showed
 * this is no longer true — WhatsApp/Baileys now sends an array of
 * OBJECTS instead:
 *
 *   participants: [{ id: "126302740856945@lid",
 *                     phoneNumber: "255767862457@s.whatsapp.net",
 *                     admin: null }]
 *
 * Calling `.endsWith()` on one of these objects threw
 * "rawMembre?.endsWith is not a function" every single time, so
 * welcome/goodbye/antipromote/antidemote never got past that line.
 *
 * The good news: WhatsApp already includes the real phone-number JID
 * directly as `.phoneNumber` on each participant object — no LID
 * lookup needed at all when it's present. `extractJid()` below handles
 * both this new object shape AND the old plain-string shape
 * defensively, so this keeps working even if the payload shape
 * changes again in either direction.
 */
const { recupevents } = require('../lib/welcome');
const { resolveLidForStatus } = require('../lib/lidResolver');
const ownerAccess = require('../lib/ownerAccess');

/**
 * Pulls a usable JID string out of a participant entry, whichever
 * shape it comes in.
 * @param {string|{id?:string, jid?:string, phoneNumber?:string, phone_number?:string}} p
 */
function extractJid(p) {
    if (!p) return null;
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
        return p.phoneNumber || p.phone_number || p.id || p.jid || null;
    }
    return null;
}

/**
 * @param {import('@whiskeysockets/baileys').WASocket} client
 * @param {string} jid - possibly @lid, possibly already a phone JID
 */
async function resolveIfLid(client, jid) {
    if (jid && jid.endsWith('@lid')) {
        return resolveLidForStatus(client, jid);
    }
    return jid;
}


// ---------------------------------------------------------------------------
// Owner protection (same idea as NOVA-XMD)
//
// Protected people: the bot itself, the creator, every owner number
// (OWNER_NUMBER / NUMERO_OWNER), sudo users and the group's own creator.
//   - antidemote : a protected admin who gets demoted is promoted again.
//   - antipromote: nothing happens when a protected person is the one promoting.
//   - auto-promote: when an owner joins a group where the bot is admin,
//     the bot makes them admin (turn off with AUTO_PROMOTE_OWNER=off).
// ---------------------------------------------------------------------------
const d = (v) => ownerAccess.digits(v);

/** Every number/ID a participant entry can be known by. */
function idsOf(p) {
    if (!p) return [];
    if (typeof p === 'string') return [d(p)].filter(Boolean);
    return [p.id, p.lid, p.jid, p.phoneNumber, p.phone_number].filter(Boolean).map(d).filter(Boolean);
}

/** Builds isProtected(...idsOrJids) for one group event. */
async function buildProtector(client, metadata) {
    const people = await ownerAccess.protectedNumberSet();
    const botIds = [client.user && client.user.id, client.user && client.user.lid].filter(Boolean).map(d);
    const groupOwnerIds = [metadata.owner, metadata.ownerPn].filter(Boolean).map(d);
    for (const p of metadata.participants || []) {
        if (p.admin === 'superadmin') idsOf(p).forEach((x) => groupOwnerIds.push(x));
    }
    return (...jids) => jids
        .flat()
        .filter(Boolean)
        .map(d)
        .some((n) => n && (people.has(n) || botIds.includes(n) || groupOwnerIds.includes(n)));
}

const at = (jid) => '@' + String(jid || '').split('@')[0].split(':')[0];

async function handleAntiDemote(client, group, metadata, membres, isProtected, author) {
    const target = membres[0];
    const targetIds = [target, ...idsOf(group.participants[0])];

    // Someone stepping down on their own is left alone.
    if (author.ids.some((a) => targetIds.map(d).includes(d(a)))) return;

    if (isProtected(targetIds)) {
        try {
            await ownerAccess.promoteWithRetry(client, group.id, target);
            await client.sendMessage(group.id, {
                text: `🛡️ *ANTIDEMOTE*\n${at(target)} is protected and cannot be demoted.\nAdmin rights have been restored.`,
                mentions: [target],
            });
        } catch (e) {
            console.log('❌ [eventHandler] Anti-demote (protected) failed:', e.message || e);
        }
        return;
    }

    if (!author.jid || isProtected(author.ids)) return;

    try {
        await client.groupParticipantsUpdate(group.id, [author.jid], 'demote');
        await client.groupParticipantsUpdate(group.id, [target], 'promote');
        await client.sendMessage(group.id, {
            text: `🚫 ${at(author.jid)} broke the anti-demotion rule by demoting ${at(target)}.\n${at(author.jid)} has lost admin rights and ${at(target)} is an admin again.`,
            mentions: [author.jid, target],
        });
    } catch (e) {
        console.log('❌ [eventHandler] Anti-demote action failed:', e.message || e);
    }
}

async function handleAntiPromote(client, group, metadata, membres, isProtected, author) {
    const target = membres[0];
    const targetIds = [target, ...idsOf(group.participants[0])];

    if (!author.jid) return;
    if (isProtected(author.ids)) return;                      // owners / creator / bot may promote freely
    if (author.ids.some((a) => targetIds.map(d).includes(d(a)))) return;
    if (isProtected(targetIds)) return;                       // promoting an owner is always fine

    try {
        await client.groupParticipantsUpdate(group.id, [author.jid, target], 'demote');
        await client.sendMessage(group.id, {
            text: `🚫 ${at(author.jid)} broke the anti-promotion rule.\nBoth ${at(author.jid)} and ${at(target)} have been removed from admin.`,
            mentions: [author.jid, target],
        });
    } catch (e) {
        console.log('❌ [eventHandler] Anti-promote action failed:', e.message || e);
    }
}

/** An owner just joined: make them admin if the bot is allowed to. */
async function autoPromoteOwners(client, group, membres) {
    if (String(process.env.AUTO_PROMOTE_OWNER || 'on').toLowerCase() === 'off') return;
    const owners = await ownerAccess.ownerNumberSet();
    const joined = group.participants.map((p, i) => ({ jid: membres[i], ids: [membres[i], ...idsOf(p)] }));
    const wanted = joined.filter((j) => j.jid && j.ids.some((x) => owners.has(d(x))));
    if (!wanted.length) return;

    const fresh = await client.groupMetadata(group.id);
    const botIds = [client.user && client.user.id, client.user && client.user.lid].filter(Boolean).map(d);
    const botIsAdmin = (fresh.participants || []).some((p) => p.admin && idsOf(p).some((x) => botIds.includes(x)));
    if (!botIsAdmin) return;

    for (const w of wanted) {
        const member = (fresh.participants || []).find((p) => idsOf(p).some((x) => w.ids.map(d).includes(x)));
        if (!member || member.admin) continue;
        try {
            await ownerAccess.promoteWithRetry(client, group.id, member.id);
            await client.sendMessage(group.id, {
                text: `📌 *OWNER PROMOTED*\n👑 ${at(w.jid)} (bot owner) joined and is now an admin.`,
                mentions: [w.jid],
            });
        } catch (e) {
            console.log('❌ [eventHandler] Auto-promote owner failed:', e.message || e);
        }
    }
}

/** Author of the event: raw + resolved ids, ready for protection checks. */
async function readAuthor(client, group) {
    const raw = extractJid(group.author);
    const resolved = await resolveIfLid(client, group.authorPn || raw);
    const jid = resolved || raw || null;
    return { jid, ids: [raw, group.authorPn, resolved].filter(Boolean) };
}


// ---------------------------------------------------------------------------
// Default welcome / goodbye layout (used when no custom text was set with
// .setwelcome / .setgoodbye). Header and lines are monospace, the details are
// plain "emoji LABEL : value" rows.
// ---------------------------------------------------------------------------
const TICKS = '```';
const RULE = TICKS + '========================' + TICKS;
const row = (emoji, label, value) => `${emoji} ${label.padEnd(7, ' ')}: ${value}`;

function shortDesc(desc) {
    const text = String(desc || '').trim();
    if (!text) return '';
    return text.length > 350 ? text.slice(0, 350).trim() + '…' : text;
}

function buildWelcomeText({ userJid, groupName, groupDesc, date, time, count }) {
    const about = shortDesc(groupDesc);
    return [
        `${TICKS}[ WELCOME ]${TICKS}`,
        RULE,
        row('👋', 'USER', `@${String(userJid).split('@')[0].split(':')[0]}`),
        row('🏷️', 'GROUP', groupName),
        row('👥', 'MEMBERS', count || '-'),
        row('📅', 'DATE', date),
        row('🕒', 'TIME', time),
        row('🌐', 'WEB', 'bmbtech.zone.id'),
        ...(about ? [`📝 ABOUT  :\n${about}`] : []),
        RULE,
    ].join('\n');
}

function buildGoodbyeText({ userJid, groupName, date, time, count }) {
    return [
        `${TICKS}[ GOODBYE ]${TICKS}`,
        RULE,
        row('👋', 'USER', `@${String(userJid).split('@')[0].split(':')[0]}`),
        row('🏷️', 'GROUP', groupName),
        row('👥', 'MEMBERS', count || '-'),
        row('📅', 'DATE', date),
        row('🕒', 'TIME', time),
        row('🌐', 'WEB', 'bmbtech.zone.id'),
        RULE,
    ].join('\n');
}

/**
 * @param {import('@whiskeysockets/baileys').WASocket} client
 * @param {{ id: string, participants: any[], action: string, author?: any }} group
 */
async function groupEvents(client, group) {
    console.log('[eventHandler] Group participants update triggered:', JSON.stringify(group));

    try {
        const metadata = await client.groupMetadata(group.id);

        // Extract + resolve every participant JID up front — membres is
        // now guaranteed to be an array of usable JID strings, whatever
        // shape the raw event gave us.
        const rawJids = group.participants.map(extractJid).filter(Boolean);
        const membres = [];
        for (const jid of rawJids) {
            membres.push(await resolveIfLid(client, jid));
        }

        console.log('[eventHandler] participants resolved:', JSON.stringify(rawJids), '->', JSON.stringify(membres));

        if (membres.length === 0) {
            console.log('[eventHandler] no usable participant JID found, aborting.');
            return;
        }

        const groupName = metadata.subject || "Group";
        const groupDesc = metadata.desc || "no group information";

        const now = new Date();
        const date = now.toLocaleDateString('en-GB');
        const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        // 👑 AUTO-PROMOTE OWNER (runs on every join, independent of the welcome message)
        if (group.action === 'add') {
            try { await autoPromoteOwners(client, group, membres); } catch (e) {
                console.log('❌ [eventHandler] Auto-promote error:', e.message || e);
            }
        }

        // 🟢 WELCOME
        if (group.action === 'add' && (await recupevents(group.id, "welcome")) === 'on') {
            let ppuser;
            try {
                ppuser = await client.profilePictureUrl(membres[0], 'image');
            } catch (error) {
                ppuser = 'https://files.catbox.moe/f9jxiv.jpg';
            }

            const customWelcome = await recupevents(group.id, "welcometext");
            let msg;
            if (customWelcome && customWelcome !== 'non') {
                msg = customWelcome
                    .replace(/{user}/g, `@${membres[0].split("@")[0]}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{desc}/g, groupDesc)
                    .replace(/{date}/g, date)
                    .replace(/{time}/g, time)
                    .replace(/{count}/g, String(metadata.participants?.length || ''));
            } else {
                msg = buildWelcomeText({
                    userJid: membres[0], groupName, groupDesc, date, time,
                    count: String(metadata.participants?.length || ''),
                });
            }

            try {
                await client.sendMessage(group.id, {
                    image: { url: ppuser },
                    caption: msg,
                    mentions: membres
                });
                console.log('✅ Welcome message sent.');
            } catch (e) {
                console.log('❌ [eventHandler] Welcome sendMessage failed:', e.message || e);
            }
        }

        // 🔴 GOODBYE
        else if (group.action === 'remove' && (await recupevents(group.id, "goodbye")) === 'on') {
            let ppuser;
            try {
                ppuser = await client.profilePictureUrl(membres[0], 'image');
            } catch (error) {
                ppuser = 'https://files.catbox.moe/f9jxiv.jpg';
            }

            const customGoodbye = await recupevents(group.id, "goodbyetext");
            let msg;
            if (customGoodbye && customGoodbye !== 'non') {
                msg = customGoodbye
                    .replace(/{user}/g, `@${membres[0].split("@")[0]}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{desc}/g, groupDesc)
                    .replace(/{date}/g, date)
                    .replace(/{time}/g, time)
                    .replace(/{count}/g, String(metadata.participants?.length || ''));
            } else {
                msg = buildGoodbyeText({
                    userJid: membres[0], groupName, date, time,
                    count: String(metadata.participants?.length || ''),
                });
            }

            try {
                await client.sendMessage(group.id, {
                    image: { url: ppuser },
                    caption: msg,
                    mentions: membres
                });
                console.log('✅ Goodbye message sent.');
            } catch (e) {
                console.log('❌ [eventHandler] Goodbye sendMessage failed:', e.message || e);
            }
        }

        // 🛑 ANTI-PROMOTE
        else if (group.action === 'promote' && (await recupevents(group.id, "antipromote")) === 'on') {
            const isProtected = await buildProtector(client, metadata);
            const author = await readAuthor(client, group);
            await handleAntiPromote(client, group, metadata, membres, isProtected, author);
        }

        // 🟡 ANTI-DEMOTE
        else if (group.action === 'demote' && (await recupevents(group.id, "antidemote")) === 'on') {
            const isProtected = await buildProtector(client, metadata);
            const author = await readAuthor(client, group);
            await handleAntiDemote(client, group, metadata, membres, isProtected, author);
        }

    } catch (e) {
        console.error('❌ [eventHandler] Error handling group participants update:', e);
    }
}

module.exports = { groupEvents, buildProtector, autoPromoteOwners, buildWelcomeText, buildGoodbyeText };
