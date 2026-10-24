const axios = require("axios");
const { bmbtz } = require("../../devpk/bmbtz");

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
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅\nORG:PK-XMDBOT;\nTEL;type=CELL;type=VOICE;waid=254799056874:+254799056874\nEND:VCARD"
    }
  }
};

// Newsletter context
const newsletterContext = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: "120363417804135599@newsletterr",
      newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
      serverMessageId: 1
    }
  }
};

bmbtz({
  nomCom: "tiktok",
  categorie: "Download",
  reaction: "🎵",
  alias: ["ttdl", "tt", "tiktokdl"]
}, async (dest, client, commandeOptions) => {
  const { arg, repondre, ms } = commandeOptions;

  if (!arg[0]) return repondre("❌ Please provide a TikTok video link.");
  const q = arg.join(" ");
  if (!q.includes("tiktok.com")) return repondre("❌ Invalid TikTok link.");

  try {
    await client.sendMessage(dest, { react: { text: "⏳", key: ms.key } });

    const apiUrl = `https://bmb-api.zone.id/api/tiktok/download?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.success || !data.data || !data.data.status) {
      return repondre("⚠️ Failed to fetch TikTok video.");
    }

    const { title, thumbnail, downloads } = data.data;

    if (!downloads || !downloads.length) {
      return repondre("⚠️ Video not found in response.");
    }

    const noWmDownload = downloads.find(d => d.text === "Without watermark");
    if (!noWmDownload || !noWmDownload.url) return repondre("⚠️ Video download link not found in response.");

    const videoUrl = noWmDownload.url;

    const caption =
      "╔══════════════════❒\n" +
      `║ 🎵 *TikTok Video*\n` +
      `║\n` +
      `║ 📖 *Title:* ${title || "N/A"}\n` +
      "╚══════════════════❒";

    // 1. Send caption only
    await client.sendMessage(dest, {
      text: caption,
      ...newsletterContext
    }, { quoted: quotedContact });

    // 2. Send video only
    await client.sendMessage(dest, {
      video: { url: videoUrl },
      ...newsletterContext
    }, { quoted: quotedContact });

  } catch (error) {
    console.error("TikTok Error:", error);
    repondre("❌ An error occurred while downloading the TikTok video.");
  }
});
