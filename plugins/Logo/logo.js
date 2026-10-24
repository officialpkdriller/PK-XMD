const { bmbtz } = require("../../devbmb/bmbtz");
const mumaker = require("mumaker");

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
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅\nORG:BMB-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=255767862457:+255767862457\nEND:VCARD"
    }
  }
};

// Newsletter context
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363382023564830@newsletter",
    newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

const logoCommands = [
  {
    nomCom: "hacker",
    categorie: "Logo",
    reaction: "👨🏿‍💻",
    makerUrl: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html"
  },
  {
    nomCom: "4d",
    categorie: "Logo",
    reaction: "👁️‍🗨️",
    makerUrl: "https://en.ephoto360.com/create-glowing-text-effects-online-706.html"
  },
  {
    nomCom: "boken",
    categorie: "Logo",
    reaction: "🔺",
    makerUrl: "https://en.ephoto360.com/bokeh-text-effect-86.html"
  },
  {
    nomCom: "starnight",
    categorie: "Logo",
    reaction: "🌃",
    makerUrl: "https://en.ephoto360.com/stars-night-online-84.html"
  },
  {
    nomCom: "xmd",
    categorie: "Logo",
    reaction: "🛰",
    makerUrl: "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html"
  },
  {
    nomCom: "3d",
    categorie: "Logo",
    reaction: "🎟",
    makerUrl: "https://en.ephoto360.com/create-3d-gradient-text-effect-online-600.html"
  },
  {
    nomCom: "luxury",
    categorie: "Logo",
    reaction: "🌄",
    makerUrl: "https://en.ephoto360.com/create-a-luxury-gold-text-effect-online-594.html"
  },
  {
    nomCom: "american",
    categorie: "Logo",
    reaction: "🇱🇷",
    makerUrl: "https://en.ephoto360.com/free-online-american-flag-3d-text-effect-generator-725.html"
  },
  {
    nomCom: "matrix",
    categorie: "Logo",
    reaction: "🔳",
    makerUrl: "https://en.ephoto360.com/matrix-text-effect-154.html"
  },
  {
    nomCom: "nova",
    categorie: "Logo",
    reaction: "⚗️",
    makerUrl: "https://en.ephoto360.com/1917-style-text-effect-523.html"
  },
  {
    nomCom: "thunder",
    categorie: "Logo",
    reaction: "🔷",
    makerUrl: "https://en.ephoto360.com/thunder-text-effect-online-97.html"
  }
  
];

// Process each logo command
logoCommands.forEach(({ nomCom, categorie, reaction, makerUrl }) => {
  bmbtz({ nomCom, categorie, reaction }, async (dest, client, commandeOptions) => {
    const { arg, repondre, ms, prefixe } = commandeOptions;

    if (!arg || arg == "") {
      return repondre(`Exemple of using:\n ${prefixe}${nomCom} bmb-tech`);
    }

    try {
      repondre("Processing...");

      const img = await mumaker.textpro(makerUrl, arg.join(" "));

      await client.sendMessage(dest, {
        image: { url: img.image },
        caption: `
╭──────────━⊷
║ 𝗕.𝗠.𝗕-𝗧𝗘𝗖𝗛
╰──────────━⊷
╭──────────━⊷
  ʙ.ᴍ.ʙ-ᴛᴇᴄʜ ᴄʜᴀɴɴᴇʟ ᴜᴘᴅᴀᴛᴇs
  ᴛᴀᴘ: https://bmbtech.zone.id
╰──────────━⊷

> 𝙱.𝙼.𝙱-𝚇𝙼𝙳
`,
        contextInfo
      }, { quoted: quotedContact });
    } catch (e) {
      repondre(`🥵🥵 ${e}`);
    }
  });
});
