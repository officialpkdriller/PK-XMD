const { bmbtz } = require('../../devbmb/bmbtz');
const fs = require('fs');
const getFBInfo = require("@xaviabot/fb-downloader");
const { default: axios } = require('axios');

// VCard Contact
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅ nORG:BMB-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=255767862487:+255767862457\nEND:VCARD"
    }
  }
};

// Newsletter context
const newsletterContext = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363382023564830@newsletter",
    newsletterName: "B.M.B TECH",
    serverMessageId: 1
  }
};

bmbtz({
  nomCom: "facebook",
  categorie: "Download",
  reaction: "🔁"
}, async (dest, client, commandeOptions) => {
  const { repondre, ms, arg } = commandeOptions;

  if (!arg[0]) {
    repondre('Insert a public facebook video link!');
    return;
  }

  const queryURL = arg.join(" ");

  try {
    getFBInfo(queryURL)
      .then(async (result) => {
        let caption = `
titre: ${result.title}
Lien: ${result.url}
        `;
        await client.sendMessage(dest, {
          image: { url: result.thumbnail },
          caption: caption,
          contextInfo: newsletterContext
        }, { quoted: quotedContact });
        await client.sendMessage(dest, {
          video: { url: result.hd },
          caption: 'facebook video downloader powered by bmb tech',
          contextInfo: newsletterContext
        }, { quoted: quotedContact });
      })
      .catch((error) => {
        console.log("Error:", error);
        repondre('try facebook2 on this link');
      });
  } catch (error) {
    console.error('Erreur lors du t茅l茅chargement de la vid茅o :', error);
    repondre('Erreur lors du t茅l茅chargement de la vid茅o.', error);
  }
});

bmbtz({
  nomCom: "facebook2",
  categorie: "Download",
  reaction: "🔁"
}, async (dest, client, commandeOptions) => {
  const { repondre, ms, arg } = commandeOptions;

  if (!arg[0]) {
    repondre('Insert a public facebook video link! !');
    return;
  }

  const queryURL = arg.join(" ");

  try {
    getFBInfo(queryURL)
      .then(async (result) => {
        let caption = `
titre: ${result.title}
Lien: ${result.url}
        `;
        await client.sendMessage(dest, {
          image: { url: result.thumbnail },
          caption: caption,
          contextInfo: newsletterContext
        }, { quoted: quotedContact });
        await client.sendMessage(dest, {
          video: { url: result.sd },
          caption: 'facebook video downloader powered by bmb tech',
          contextInfo: newsletterContext
        }, { quoted: quotedContact });
      })
      .catch((error) => {
        console.log("Error:", error);
        repondre(error);
      });
  } catch (error) {
    console.error('Erreur lors du t茅l茅chargement de la vid茅o :', error);
    repondre('Erreur lors du t茅l茅chargement de la vid茅o.', error);
  }
});
