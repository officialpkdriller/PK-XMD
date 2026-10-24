const axios = require("axios");
const { bmbtz } = require("../../devbmb/bmbtz");

// VCard Contact (optional)
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅\nORG:BMB-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=255767862457:+255767862457\nEND:VCARD"
    }
  }
};

// Newsletter context
const newsletterContext = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363382023564830@newsletter",
      newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
      serverMessageId: 1
    }
  }
};

bmbtz({
  nomCom: "instagram",
  categorie: "Download",
  reaction: "📸",
  alias: ["ig", "igdl", "instadl"]
}, async (dest, client, commandeOptions) => {
  const { arg, repondre, ms } = commandeOptions;

  if (!arg[0]) return repondre("❌ Please provide an Instagram link.");
  const q = arg.join(" ");
  if (!q.includes("instagram.com")) return repondre("❌ Invalid Instagram link.");

  try {
    await client.sendMessage(dest, { react: { text: "⏳", key: ms.key } });

    const apiUrl = `https://bmb-api.zone.id/api/instagram/download?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.success || !data.data || !data.data.status) {
      return repondre("⚠️ Failed to fetch Instagram media.");
    }

    const items = data.data.data;
    if (!items || !items.length) return repondre("⚠️ Media not found in response.");

    const caption =
      "╔══════════════════❒\n" +
      `║ 📸 *Instagram Media*\n` +
      "╚══════════════════❒";

    // 1. Send caption only
    await client.sendMessage(dest, {
      text: caption,
      ...newsletterContext
    }, { quoted: quotedContact });

    // 2. Send each media item (handles carousel posts with multiple items)
    for (const item of items) {
      if (!item.url) continue;
      const isVideo = /\.mp4(\?|$)/i.test(item.url);

      await client.sendMessage(dest, isVideo
        ? { video: { url: item.url }, ...newsletterContext }
        : { image: { url: item.url }, ...newsletterContext }
      , { quoted: quotedContact });
    }

  } catch (error) {
    console.error("Instagram Error:", error);
    repondre("❌ An error occurred while downloading the Instagram media.");
  }
});
