"use strict";
/**
 * lidResolver.js
 *
 * Resolves WhatsApp's opaque "@lid" (Linked ID) identities to real
 * phone-number JIDs ("@s.whatsapp.net"), ported from NOVA-XMD's index.js
 * (its inline lidPhoneCache/resolveLidForStatus logic, not the simpler
 * unused lib/lidResolver.js file) to CommonJS.
 *
 * Why this exists: WhatsApp's newer identity system represents many
 * senders — especially on statuses — as an opaque @lid JID instead of
 * their phone number. This is a known, still-unresolved limitation in
 * Baileys itself (see WhiskeySockets/Baileys GitHub issues #1718, #2133,
 * #2154, #2263) — actions like status reactions sent against an
 * unresolved @lid are often accepted by WhatsApp's servers with no error,
 * but silently never actually show up. There's no single reliable way to
 * resolve @lid → phone number, so this tries several strategies in order
 * and caches whatever it finds (in memory + persisted to the database)
 * so repeat lookups for the same person are instant.
 */
const db = require('../database/db');

const lidPhoneCache = new Map();
const MAX_LID_CACHE = 500;

function _capMap(map, max) {
    if (map.size > max) {
        const firstKey = map.keys().next().value;
        map.delete(firstKey);
    }
}

/**
 * Records a learned LID -> phone number mapping, both in memory (for
 * instant sync lookups elsewhere) and persisted to the database (so it
 * survives restarts).
 */
function cacheLidPhone(lidNum, phoneNum) {
    if (!lidNum || !phoneNum || lidNum === phoneNum) return;
    lidPhoneCache.set(lidNum, phoneNum);
    _capMap(lidPhoneCache, MAX_LID_CACHE);
    db.mapLidToPhone(lidNum, phoneNum).catch(() => {});
}

/**
 * Fast, synchronous, cache-only lookup — safe to call from any hot path
 * (e.g. on every incoming message) without awaiting anything.
 */
function resolveLidToJid(jid) {
    if (!jid) return jid;
    if (jid.endsWith('@lid')) {
        const lidNum = jid.split('@')[0].split(':')[0];
        const mapped = lidPhoneCache.get(lidNum);
        if (mapped) return mapped + '@s.whatsapp.net';
        return jid;
    }
    return jid;
}

/**
 * Full multi-strategy resolver — tries, in order:
 *   1. In-memory cache
 *   2. Baileys' own signalRepository.lidMapping.getPNForLID (tried with
 *      a few JID variants, since the exact expected format varies)
 *   3. The persisted database mapping (survives restarts)
 *   4. Scanning every group the bot is in for a participant whose
 *      lid/id matches, reading their phoneNumber/id field
 *
 * Falls back to returning the original @lid JID unchanged if nothing
 * resolves it — callers should still attempt the action with it, since
 * it occasionally works anyway depending on WhatsApp's server-side state.
 */
async function resolveLidForStatus(client, rawLidJid) {
    if (!rawLidJid || !rawLidJid.endsWith('@lid')) return rawLidJid;
    const lidNum = rawLidJid.split('@')[0].split(':')[0];

    const fromCache = lidPhoneCache.get(lidNum);
    if (fromCache) {
        console.log(`[LID] Cache hit: ${rawLidJid} → ${fromCache}@s.whatsapp.net`);
        return fromCache + '@s.whatsapp.net';
    }

    if (client.signalRepository?.lidMapping?.getPNForLID) {
        const variants = [rawLidJid, `${lidNum}:0@lid`, `${lidNum}:1@lid`, `${lidNum}@s.whatsapp.net`];
        for (const v of variants) {
            try {
                const pn = await client.signalRepository.lidMapping.getPNForLID(v);
                if (pn && typeof pn === 'string') {
                    const n = pn.split('@')[0].split(':')[0].replace(/\D/g, '');
                    if (n && n.length >= 7 && n !== lidNum) {
                        cacheLidPhone(lidNum, n);
                        console.log(`[LID] signalRepo hit (${v}): ${rawLidJid} → ${n}@s.whatsapp.net`);
                        return n + '@s.whatsapp.net';
                    }
                }
            } catch (e) { /* try next variant */ }
        }
    }

    try {
        const stored = await db.getPhoneFromLid(lidNum);
        if (stored) {
            const n = String(stored).replace(/\D/g, '');
            if (n && n !== lidNum) {
                lidPhoneCache.set(lidNum, n);
                console.log(`[LID] Database hit: ${rawLidJid} → ${n}@s.whatsapp.net`);
                return n + '@s.whatsapp.net';
            }
        }
    } catch (e) { /* fall through */ }

    try {
        const allGroups = await client.groupFetchAllParticipating();
        for (const [, meta] of Object.entries(allGroups || {})) {
            for (const p of meta.participants || []) {
                const pLidNum = (p.lid || p.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');
                if (pLidNum !== lidNum) continue;

                const pPhone = (p.phoneNumber || p.phone_number || p.pn || '').toString().replace(/\D/g, '');
                if (pPhone && pPhone.length >= 7) {
                    cacheLidPhone(lidNum, pPhone);
                    console.log(`[LID] Group scan (phoneNumber): ${rawLidJid} → ${pPhone}@s.whatsapp.net`);
                    return pPhone + '@s.whatsapp.net';
                }

                const pBase = p.id || p.jid || '';
                if (pBase && !pBase.endsWith('@lid') && pBase.includes('@')) {
                    const n = pBase.split('@')[0].split(':')[0].replace(/\D/g, '');
                    if (n && n.length >= 7) {
                        cacheLidPhone(lidNum, n);
                        console.log(`[LID] Group scan (id): ${rawLidJid} → ${n}@s.whatsapp.net`);
                        return n + '@s.whatsapp.net';
                    }
                }
            }
        }
    } catch (e) {
        console.log(`[LID] Group scan error: ${e.message}`);
    }

    console.log(`[LID] All resolvers failed for ${rawLidJid} — will use LID directly (best-effort)`);
    return rawLidJid;
}

module.exports = {
    lidPhoneCache,
    cacheLidPhone,
    resolveLidToJid,
    resolveLidForStatus,
};
