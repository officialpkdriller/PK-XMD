const { bmbtz } = require("../../devbmb/bmbtz");
const axios = require("axios");

const YT_API = "https://apiziaul.vercel.app/api/downloader/ytmp3";

/* ===== Newsletter context ===== */
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363382023564830@newsletter",
    newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

bmbtz({
  nomCom: "youtube",
  alias: ["ytmp3", "yta", "ytaudio"],
  reaction: "🎧",
  desc: "Download YouTube audio from link",
  categorie: "Download"
}, async (dest, client, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;
  const url = arg[0];

  if (!url) {
    return repondre("❎ Please provide a YouTube link.\n\n*Example:* .youtube https://youtu.be/uRxwAvIvLko");
  }

  const ytRegex = /(youtube\.com|youtu\.be)/;
  if (!ytRegex.test(url)) {
    return repondre("⚠️ Invalid YouTube link. Please provide a valid YouTube URL.");
  }

  try {
    await client.sendMessage(dest, { react: { text: "⏳", key: ms.key } });

    const { data } = await axios.get(YT_API, {
      params: { url },
      timeout: 60000
    });

    if (!data?.status || !data?.result?.downloadUrl) {
      await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
      return repondre("❌ Failed to fetch audio. Please check the link and try again.");
    }

    const { title, downloadUrl } = data.result;

    await client.sendMessage(dest, {
      audio: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName: `${title || "audio"}.mp3`,
      caption: `🎧 *${title || "YouTube Audio"}*\n\n⚡ *Powered by B.M.B TECH*`,
      contextInfo
    }, { quoted: ms });

    await client.sendMessage(dest, { react: { text: "✅", key: ms.key } });

  } catch (error) {
    console.error("YOUTUBE AUDIO ERROR:", error.response?.data || error);
    await client.sendMessage(dest, { react: { text: "❌", key: ms.key } });
    repondre("❌ *Download Error*\n\n• API may be down\n• Try again later.\n• Check the link is correct.");
  }
});
