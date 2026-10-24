const { bmbtz } = require("../../devpk/bmbtz");
const axios = require("axios");

const PINTEREST_API = "https://api.deline.web.id/downloader/pinterest";

bmbtz({
  nomCom: "pinterest",
  alias: ["pint", "pindl"],
  reaction: "📌",
  desc: "Download Pinterest image or video",
  categorie: "Download"
}, async (dest, client, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;
  const url = arg[0];

  if (!url) {
    return repondre("❎ Please provide a Pinterest link.\n\n*Example:* .pinterest https://pin.it/5eZaegP8s");
  }

  const pinRegex = /(pinterest\.com|pin\.it)/;
  if (!pinRegex.test(url)) {
    return repondre("⚠️ Invalid Pinterest link. Please provide a valid Pinterest URL.");
  }

  try {
    await client.sendMessage(dest, { react: { text: "⏳", key: ms.key } });

    const { data } = await axios.get(PINTEREST_API, {
      params: { url },
      timeout: 60000
    });

    if (!data?.status || !data?.result) {
      await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
      return repondre("❌ Failed to fetch media. Please check the link and try again.");
    }

    const { video, image, thumbnail } = data.result;
    const hasVideo = video && video !== "Tidak ada";
    const hasImage = image && image !== "Tidak ada";

    let mediaType, mediaUrl;

    if (hasVideo) {
      mediaType = "Video";
      mediaUrl = video;
    } else if (hasImage) {
      mediaType = "Image";
      mediaUrl = image;
    } else if (thumbnail) {
      mediaType = "Image";
      mediaUrl = thumbnail;
    } else {
      await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
      return repondre("❌ No media found for this Pinterest link.");
    }

    /* ===== CAPTION WITH DETAILS BOX ===== */
    const caption = `📤 *PINTEREST DOWNLOAD SUCCESS*
━━━━━━━━━━━━━━━━
📁 *Type:* ${mediaType}
🔗 *Source:* ${url}
━━━━━━━━━━━━━━━━
⚡ *Powered by B.M.B TECH*`;

    if (mediaType === "Video") {
      await client.sendMessage(dest, {
        video: { url: mediaUrl },
        caption
      }, { quoted: ms });
    } else {
      await client.sendMessage(dest, {
        image: { url: mediaUrl },
        caption
      }, { quoted: ms });
    }

    await client.sendMessage(dest, { react: { text: "✅", key: ms.key } });

  } catch (error) {
    console.error("PINTEREST ERROR:", error.response?.data || error);
    await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
    repondre("❌ *Download Error*\n\n• API may be down\n• Try again later.\n• Check the link is correct.");
  }
});
