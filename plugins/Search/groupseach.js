const { bmbtz } = require("../../devbmb/bmbtz");
const axios = require("axios");

const GROUP_SEARCH_API = "https://api.deline.web.id/search/grubwa";

bmbtz({
  nomCom: "groupsearch",
  alias: ["gsearch", "groupsearch"],
  reaction: "🔍",
  desc: "Search public WhatsApp group links",
  categorie: "Search"
}, async (dest, client, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;
  const query = arg.join(" ");

  if (!query) {
    return repondre("❎ Please provide a search keyword.\n\n*Example:* .grupsearch ML indonesia");
  }

  try {
    await client.sendMessage(dest, { react: { text: "⏳", key: ms.key } });

    const { data } = await axios.get(GROUP_SEARCH_API, {
      params: { q: query },
      timeout: 30000
    });

    if (!data?.status || !data?.result || data.result.length === 0) {
      await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
      return repondre("❌ No groups found for: " + query);
    }

    const results = data.result;
    const sendCount = Math.min(results.length, 5);

    let text = `🔍 *GROUP SEARCH RESULTS*\n\n` +
      `📌 *Keyword:* ${query}\n` +
      `📊 *Found:* ${results.length} group(s), showing ${sendCount}\n\n` +
      `━━━━━━━━━━━━━━━━\n\n`;

    for (let i = 0; i < sendCount; i++) {
      const group = results[i];
      text += `*${i + 1}. ${group.Name}*\n` +
        `📝 ${group.Description || "No description"}\n` +
        `🔗 ${group.Link}\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━\n⚡ *Powered by B.M.B TECH*`;

    await client.sendMessage(dest, { text }, { quoted: ms });
    await client.sendMessage(dest, { react: { text: "✅", key: ms.key } });

  } catch (error) {
    console.error("GROUP SEARCH ERROR:", error.response?.data || error);
    await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
    repondre("❌ *Search Error*\n\n• API may be down\n• Try again later.\n• Try a different keyword.");
  }
});
