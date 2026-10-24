const { bmbtz } = require("../../devbmb/bmbtz");
const os = require("os");
const moment = require("moment-timezone");
const conf = require("../../settings");

bmbtz({
  nomCom: "ping",
  alias: ["speed", "p", "pong"],
  desc: "Check bot speed and status.",
  categorie: "General",
  reaction: "💫"
}, async (dest, client, commandeOptions) => {
  const { ms } = commandeOptions;

  try {
    const start = Date.now();
    await client.sendMessage(dest, { text: "💥 Pinging..." }, { quoted: ms });
    const ping = Date.now() - start;

    const time = moment().format("HH:mm:ss");
    const date = moment().format("DD/MM/YYYY");
    const uptime = process.uptime();
    const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

    const msg = `*📡 BMB-TECH PING*\n` +
      `\n` +
      `⏱️ Response: *${ping}ms*\n` +
      `📆 Date: *${date}*\n` +
      `🕒 Time: *${time}*\n` +
      `⚡ Uptime: *${uptimeStr}*\n` +
      `\n` +
      `◈━━━━━━━━━━━━━━◈`;

    await client.sendMessage(dest, {
      text: msg,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "120363382023564830@newsletter",
          newsletterName: "bmb tech",
          serverMessageId: 143
        },
        externalAdReply: {
          title: "⚡ BMB-TECH SYSTEM STATUS",
          body: "Bot is running smoothly 🚀",
          thumbnailUrl: conf.URL,
          sourceUrl: conf.URL,
          mediaType: 1
        }
      }
    }, { quoted: ms });

  } catch (e) {
    console.log("❌ Ping Command Error:", e);
    await client.sendMessage(dest, { text: `❌ Error: ${e}` }, { quoted: ms }).catch(() => {});
  }
});
