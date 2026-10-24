const fs = require('fs-extra');
const { bmbtz } = require(__dirname + "/../../devbmb/bmbtz");
const s = require(__dirname + "/../../settings");
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// VCard Contact kwa quoting
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

bmbtz({ nomCom: "payment", categorie: "General" }, async (dest, client, commandeOptions) => {
  let { repondre, mybotpic } = commandeOptions;

  let infoMsg = `┏━━━━━━━━━━━━━━━━━━\n` +
                `┃ 💳 *Payment Details*\n` +
                `┃ \n` +
                `┃ 👤 *Name:* SAILAS ANTIM MAMSERI\n` +
                `┃ 📞 *Number:* 0767862457 (Vodacom)\n` +
                `┃ 🌐 *Method:* Online Payment\n` +
                `┃ 🌍 *Country:* Tanzania 🇹🇿\n` +
                `┗━━━━━━━━━━━━━━━━━`;

  let lien = mybotpic() || "https://files.catbox.moe/0pfgz3.jpg";

  try {
    const imageType = lien.match(/\.(jpeg|jpg|png|gif|mp4)$/i)?.[0];

    const contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363382023564830@newsletter",
        newsletterName: "𝙽𝙾𝚅𝙰-𝚇𝙼𝙳",
        serverMessageId: 1
      }
    };

    if (imageType?.includes('mp4') || imageType?.includes('gif')) {
      await client.sendMessage(dest, {
        video: { url: lien },
        caption: infoMsg,
        gifPlayback: true,
        contextInfo
      }, { quoted: quotedContact });
    } else {
      await client.sendMessage(dest, {
        image: { url: lien },
        caption: infoMsg,
        contextInfo
      }, { quoted: quotedContact });
    }

  } catch (e) {
    console.log("🥵 Menu error: " + e);
    repondre("🥵 Menu error: " + e.message);
  }
});
