const axios = require("axios");
const { bmbtz } = require("../../devpk/bmbtz");

bmbtz({
  nomCom: "screenshot",
  categorie: "Download",
  reaction: "📷"
}, async (jid, sock, { arg, ms, repondre }) => {
  try {
    const url = arg[0];
    if (!url) return repondre("❌ Please provide a URL\nExample: .screenshot https://google.com");
    if (!url.startsWith("http")) return repondre("❌ URL must start with http:// or https://");

    const ssUrl = `https://image.thum.io/get/fullpage/${url}`;

    // Pakua image kama buffer
    const response = await axios.get(ssUrl, { responseType: "arraybuffer" });

    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363417804135599@newsletterr",
        newsletterName: "B.M.B TECH",
        serverMessageId: 0x8f
      }
    };

    // Tuma image kama file
    await sock.sendMessage(jid, {
      image: Buffer.from(response.data),
      caption: "🖼️ *Screenshot Captured Successfully*\n\n> Powered by 𝙱.𝙼.𝙱-𝚃𝙴𝙲𝙷 🤖",
      contextInfo
    }, { quoted: ms });

  } catch (error) {
    console.error("Screenshot Error:", error);
    repondre("❌ Failed to capture screenshot. The site may be blocking capture or invalid.");
  }
});
