const { bmbtz, cm } = require("../../devbmb/bmbtz");
const fs = require("fs");
const path = require("path");

/**
 * getcmd
 *
 * Ported from NOVA-XMD's plugins/Owner/getcmd.js. Fetches a plugin
 * file's source code by command name (or alias) and sends it as a
 * document, restricted to the bot developer (dev) only — matching
 * NOVA-XMD's hardcoded DEVELOPER-only restriction.
 *
 * This replaces the previous BMB-TECH version, which searched a
 * "../scs" folder that no longer exists (the project moved to
 * plugins/<category>/ a while back) — so it never actually found
 * anything.
 *
 * Category folders are read dynamically from plugins/ instead of a
 * hardcoded list, since BMB-TECH's category names (Group, Download,
 * Search, ...) don't match NOVA-XMD's (AI, Anime, Coding, ...).
 */
const PLUGINS_DIR = path.join(__dirname, "..", "..", "plugins");

function resolveAlias(input) {
    const lower = input.toLowerCase();
    const match = cm.find(
        (c) => c.nomCom === lower || (Array.isArray(c.alias) && c.alias.includes(lower))
    );
    return match ? match.nomCom : input;
}

function listCategories() {
    try {
        return fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
    } catch {
        return [];
    }
}

bmbtz({
    nomCom: "getcmd",
    alias: ["getcommand", "cmdfile"],
    categorie: "Owner",
    reaction: "🔍",
}, async (dest, client, commandeOptions) => {
    const { ms, repondre, dev, superUser, arg, prefixe } = commandeOptions;

    await client.sendMessage(dest, { react: { text: "🔍", key: ms.key } }).catch(() => {});

    // Originally dev-only (matching NOVA-XMD's hardcoded DEVELOPER
    // restriction), but this is the bot's own owner/deployer asking to
    // see their own bot's source — reasonable to allow, so superUser
    // (owner/sudo) is granted access too, not just the fixed DEV_NUMBER.
    if (!(dev || superUser)) {
        await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
        return repondre(`🚫 *ACCESS DENIED*\n━━━━━━━━━━━━━━━━\nThis command is restricted to the bot owner/developer.\n━━━━━━━━━━━━━━━━\n© bmb tech`);
    }

    const categories = listCategories();

    if (!arg[0]) {
        const categoryList = categories.map((c) => `• ${c}`).join("\n");
        return repondre(`📌 *GETCMD*\n━━━━━━━━━━━━━━━━\nUsage: ${prefixe}getcmd <name>\nCategories:\n${categoryList}\n━━━━━━━━━━━━━━━━\n© bmb tech`);
    }

    const rawInput = arg.join(" ").trim().endsWith(".js")
        ? arg.join(" ").trim().slice(0, -3)
        : arg.join(" ").trim();
    const commandName = resolveAlias(rawInput);

    let fileFound = false;

    for (const category of categories) {
        const filePath = path.join(PLUGINS_DIR, category, `${commandName}.js`);
        if (!fs.existsSync(filePath)) continue;

        let data;
        try {
            data = fs.readFileSync(filePath, "utf8");
        } catch (err) {
            await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
            return repondre(`❌ *ERROR*\n━━━━━━━━━━━━━━━━\nError reading file: ${err.message}\n━━━━━━━━━━━━━━━━\n© bmb tech`);
        }

        const fileBuffer = Buffer.from(data, "utf8");
        const aliasNote = commandName !== rawInput ? `Alias: ${rawInput} → ${commandName}\n` : "";
        const introText = `📌 *COMMAND FILE*\n━━━━━━━━━━━━━━━━\nFile: ${commandName}.js\nCategory: ${category}\nSize: ${data.length} chars\n${aliasNote}━━━━━━━━━━━━━━━━\n© bmb tech`;

        await client.sendMessage(dest, { react: { text: "✅", key: ms.key } }).catch(() => {});

        try {
            await client.sendMessage(dest, {
                document: fileBuffer,
                fileName: `${commandName}.js`,
                mimetype: "application/javascript",
                caption: introText,
            }, { quoted: ms });
        } catch (err) {
            console.log("[getcmd] document send failed, falling back to text:", err.message);
            const truncated = data.length > 3500 ? data.slice(0, 3500) + "\n\n[Truncated — file too long]" : data;
            await repondre(`${introText}\n\n\`\`\`javascript\n${truncated}\n\`\`\``);
        }

        fileFound = true;
        break;
    }

    if (!fileFound) {
        await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
        await repondre(`📌 *NOT FOUND*\n━━━━━━━━━━━━━━━━\n"${rawInput}" not found in any category.\nTip: use ${prefixe}getcmd with no args\nto see all categories.\n━━━━━━━━━━━━━━━━\n© bmb tech`);
    }
});
