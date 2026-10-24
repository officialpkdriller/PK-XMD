const { bmbtz } = require("../../devbmb/bmbtz");
const axios = require("axios");

/**
 * github
 *
 * Rewritten from scratch — the previous version had a hard
 * SyntaxError ("Invalid or unexpected token"), meaning the file
 * failed to even parse, so nothing in it could have been working.
 *
 * Looks up a GitHub user or repository (owner/repo) using GitHub's
 * public REST API — no API key needed for basic lookups.
 *
 * Usage:
 *   .github torvalds            -> user info
 *   .github torvalds/linux      -> repo info
 */
bmbtz({
    nomCom: "github",
    alias: ["gh", "ghinfo"],
    categorie: "General",
    reaction: "🔄"
}, async (dest, client, commandeOptions) => {
    const { ms, repondre, arg, prefixe } = commandeOptions;

    const query = (arg || []).join(" ").trim();
    if (!query) {
        return repondre(`Usage:\n${prefixe}github <username>\n${prefixe}github <owner/repo>`);
    }

    await client.sendMessage(dest, { react: { text: "🐙", key: ms.key } }).catch(() => {});

    try {
        if (query.includes("/")) {
            // owner/repo lookup
            const { data } = await axios.get(`https://api.github.com/repos/${query}`, { timeout: 15000 });
            const text =
`📦 *${data.full_name}*
━━━━━━━━━━━━━━━━
📝 ${data.description || "No description"}
⭐ Stars: ${data.stargazers_count}
🍴 Forks: ${data.forks_count}
👁️ Watchers: ${data.watchers_count}
🐛 Open issues: ${data.open_issues_count}
🔤 Language: ${data.language || "N/A"}
📄 License: ${data.license?.name || "None"}
🔗 ${data.html_url}
━━━━━━━━━━━━━━━━
© bmb tech`;
            await client.sendMessage(dest, { text }, { quoted: ms });
        } else {
            // user lookup
            const { data } = await axios.get(`https://api.github.com/users/${query}`, { timeout: 15000 });
            const text =
`👤 *${data.name || data.login}*
━━━━━━━━━━━━━━━━
🔖 Username: ${data.login}
📝 Bio: ${data.bio || "No bio"}
📦 Public repos: ${data.public_repos}
👥 Followers: ${data.followers} | Following: ${data.following}
📍 Location: ${data.location || "N/A"}
🔗 ${data.html_url}
━━━━━━━━━━━━━━━━
© bmb tech`;
            await client.sendMessage(dest, {
                image: { url: data.avatar_url },
                caption: text
            }, { quoted: ms }).catch(() => client.sendMessage(dest, { text }, { quoted: ms }));
        }
        await client.sendMessage(dest, { react: { text: "✅", key: ms.key } }).catch(() => {});
    } catch (e) {
        console.log("[github] lookup failed:", e.message);
        await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
        if (e.response?.status === 404) {
            repondre(`Not found on GitHub: *${query}*`);
        } else {
            repondre(`GitHub lookup failed: ${e.message}`);
        }
    }
});
