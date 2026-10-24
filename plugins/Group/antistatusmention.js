const { bmbtz } = require("../../devbmb/bmbtz");
const { getGroupFeature, setGroupFeature } = require("../../lib/groupProtection");
const db = require("../../database/db");

/**
 * antistatusmention
 *
 * Ported from NOVA-XMD's updated antistatusmention settings command
 * (4 modes: off/delete/warn/kick), adapted to BMB-TECH's bmbtz()
 * command style and lib/groupProtection.js storage instead of
 * database/config.js's getGroupSettings/updateGroupSetting.
 *
 * The actual enforcement (detecting a status-mention message and
 * acting on it) lives in index.js — see the block guarded by
 * `mtype === 'groupStatusMentionMessage'`.
 */
function fmt(msg) {
    return `🛡️ *ANTISTATUSMENTION*\n━━━━━━━━━━━━━━━━\n${msg}\n━━━━━━━━━━━━━━━━\n© bmb tech`;
}

bmbtz({
    nomCom: "antistatusmention",
    alias: ["antimention"],
    categorie: "Group",
    reaction: "🛡️"
}, async (dest, client, commandeOptions) => {
    const { ms, repondre, arg, verifGroupe, verifAdmin, superUser } = commandeOptions;

    await client.sendMessage(dest, { react: { text: "⌛", key: ms.key } }).catch(() => {});

    if (!verifGroupe) {
        await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
        return repondre(fmt("Groups only, genius. 😤"));
    }

    if (!(verifAdmin || superUser)) {
        await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
        return repondre(fmt("Admins only. You're not special enough. 😒"));
    }

    try {
        const value = (arg || []).join(" ").toLowerCase();
        const validModes = ["off", "warn", "kick", "delete"];

        if (validModes.includes(value)) {
            const currentMode = (await getGroupFeature(dest, "antistatusmention")).toLowerCase();
            if (currentMode === value) {
                await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
                return repondre(fmt(`AntiStatusMention is already *${value.toUpperCase()}*. Pay attention. 😒`));
            }

            await setGroupFeature(dest, "antistatusmention", value);

            const desc =
                value === "off" ? "Status mentions are now allowed. Hope that's intentional. 🙄" :
                value === "warn" ? "Status mentions deleted + user warned.\nHit the warn limit and they're KICKED. 😈" :
                value === "delete" ? "Status mentions get deleted, no warn, no kick.\nJust silently wiped. 🗑️" :
                "Status mention = Instant kick. Zero tolerance. 😈";

            await client.sendMessage(dest, { react: { text: "✅", key: ms.key } }).catch(() => {});
            return repondre(fmt(`✅ AntiStatusMention set to *${value.toUpperCase()}*.\n│ ${desc}`));
        }

        const currentMode = (await getGroupFeature(dest, "antistatusmention")).toUpperCase();
        const warnLimit = await db.getWarnLimit(dest);

        await client.sendMessage(dest, { react: { text: "✅", key: ms.key } }).catch(() => {});
        await repondre(fmt(
            `Current mode: *${currentMode}*\n│ Warn limit: *${warnLimit}* (set with .setwarnlimit)\n│ \n│ 📖 *How to use:*\n│ .antistatusmention off — Allow status mentions\n│ .antistatusmention delete — Just delete, no warn/kick\n│ .antistatusmention warn — Delete + warn user\n│ .antistatusmention kick — Delete + instant kick\n│ \n│ In warn mode, hitting the limit\n│ = auto kick. 😈\n│ \n│ Aliases: .antimention`
        ));
    } catch (error) {
        await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
        console.error("[antistatusmention] command error:", error);
        await repondre(fmt("Something broke. Try again. 😤"));
    }
});
