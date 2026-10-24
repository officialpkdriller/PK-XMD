const axios = require("axios");
const { bmbtz } = require("../../devbmb/bmbtz");

// VCard Contact for quoting
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

bmbtz({
  nomCom: "rw",
  categorie: "Download",
  reaction: "🌌"
}, async (jid, sock, { arg, ms, repondre }) => {
  try {
    const query = arg.join(" ") || "random";
    const apiUrl = `https://pikabotzapi.vercel.app/random/randomwall/?apikey=anya-md&query=${encodeURIComponent(query)}`;

    const { data } = await axios.get(apiUrl);

    if (data.status && data.imgUrl) {
      const caption = `🌌 *Random Wallpaper: ${query}*\n\n> *© Powered by 𝙱.𝙼.𝙱-𝚃𝙴𝙲𝙷*`;

      await sock.sendMessage(jid, {
        image: { url: data.imgUrl },
        caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363382023564830@newsletter",
            newsletterName: "𝗕.𝗠.𝗕-𝗧𝗘𝗖𝗛",
            serverMessageId: 2
          }
        }
      }, { quoted: quotedContact }); // Use quoting with VCard contact here
    } else {
      repondre(`❌ No wallpaper found for *"${query}"*.`);
    }
  } catch (error) {
    console.error("Wallpaper Error:", error);
    repondre("❌ An error occurred while fetching the wallpaper. Please try again.");
  }
});
