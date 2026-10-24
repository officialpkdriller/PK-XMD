const { bmbtz } = require("../../devbmb/bmbtz");
const axios = require("axios");
const fs = require("fs-extra");

bmbtz({
  nomCom: "npm",
  categorie: "Search",
  reaction: "📦",
  desc: "Search for npm package information"
}, async (dest, client, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;

  // Check if package name is provided
  if (!arg || arg.length === 0) {
    return repondre(`❌ *Usage:* .npm <package-name>\n\n*Example:* .npm bmbxmd-baileys`);
  }

  const packageName = arg.join(" ").trim();

  try {
    // Send initial reaction
    await client.sendMessage(dest, {
      react: { text: "⏳", key: ms.key }
    });

    // Fetch package info from npm registry
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
      timeout: 10000
    });

    const data = response.data;
    const latestVersion = data["dist-tags"]?.latest || "N/A";
    const description = data.description || "No description available";
    const repository = data.repository?.url || "N/A";
    const homepage = data.homepage || "N/A";

    // Build response message - using emojis only, no box lines
    const responseText = `
📦 *NPM PACKAGE:* ${packageName}
📝 *Description:* ${description}
🏷️ *Version:* ${latestVersion}
📂 *Repository:* ${repository}
🌐 *Homepage:* ${homepage}
🔗 *NPM URL:* https://www.npmjs.com/package/${packageName}
    `;

    // Send the response
    await client.sendMessage(dest, { 
      text: responseText,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363382023564830@newsletter",
          newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
          serverMessageId: 1
        }
      }
    }, { quoted: ms });

    // React with success
    await client.sendMessage(dest, {
      react: { text: "✅", key: ms.key }
    });

  } catch (error) {
    console.error("NPM Search Error:", error);
    
    if (error.response && error.response.status === 404) {
      await repondre(`❌ Package *"${packageName}"* not found on npm registry.\n\nCheck spelling or try another package.`);
    } else if (error.code === 'ECONNABORTED') {
      await repondre(`❌ Request timeout. Please try again later.`);
    } else {
      await repondre(`❌ Error: ${error.message}`);
    }
  }
});
