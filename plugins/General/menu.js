const { bmbtz } = require("../../devbmb/bmbtz");
const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const moment = require("moment-timezone");
const { format } = require(__dirname + "/../../devbmb/mesfonctions");
const s = require(__dirname + "/../../settings");

// ====== LOAD RANDOM IMAGE FROM /scs FOLDER ======
function getRandomScsImage() {
    const scsFolder = path.join(__dirname, "../scs");
    const images = fs.readdirSync(scsFolder).filter(f =>
        /^menu\d+\.(jpg|jpeg|png|mp4|gif)$/i.test(f)
    );
    
    if (images.length === 0) {
        return null;
    }
    
    // Get random image from folder
    const randomIndex = Math.floor(Math.random() * images.length);
    return path.join(scsFolder, images[randomIndex]);
}

// ====== CONTACT QUOTE ======
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard:
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "FN:B.M.B VERIFIED ✅\n" +
        "ORG:BMB-TECH BOT;\n" +
        "TEL;type=CELL;type=VOICE;waid=255767862457:+255767862457\n" +
        "END:VCARD"
    }
  }
};

// ====== CONTEXT INFO (Bila links) ======
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363382023564830@newsletter",
    newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

// ====== BOT INFO (Bila date na time) ======
function getBotInfo(mode, totalCommands) {
  const usedRAM = format(os.totalmem() - os.freemem());
  const totalRAM = format(os.totalmem());

  return `
╭───「 *BMB-TECH* 」─────⊛
┃⊛╭───────────────⊛
┃⊛│☢️ *Mode*: ${mode.toUpperCase()}
┃⊛│🖥️ *RAM*: ${usedRAM} / ${totalRAM}
┃⊛│📦 *Commands*: ${totalCommands}
┃⊛│✅ *Status*: ONLINE
┃⊛│👑 *Creator* : Bmb Tech
┃⊛│🌐 *website* : bmbtech.online
┃⊛╰━━━━━━━━━━━━━━⊛
╰━━━━━━━━━━━━━━━━━━━━⊛
`;
}

// ====== MAIN COMMAND ======
bmbtz({
  nomCom: "menu1",
  categorie: "General",
  reaction: "🌚",
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, prefixe } = commandeOptions;
  const { cm } = require(__dirname + "/../../devbmb/bmbtz");

  // ====== GROUP COMMANDS BY CATEGORY ======
  let coms = {};
  let mode = s.MODE.toLowerCase() !== "yes" ? "private" : "public";

  for (const com of cm) {
    if (!coms[com.categorie]) coms[com.categorie] = [];
    coms[com.categorie].push(com.nomCom);
  }

  const categories = Object.keys(coms);
  const totalCommands = cm.length;

  // ====== GET RANDOM IMAGE FROM /scs ======
  const imagePath = getRandomScsImage();
  
  // ====== BUILD OPTIONS TEXT ======
  let optionsText = `📑 *BMB TOOL MENU*\n\n`;
  optionsText += `Reply with category number:\n\n`;
  
  categories.forEach((cat, index) => {
    optionsText += `${index + 1} ➠ ${cat.toUpperCase()}\n`;
  });
  
  optionsText += `\n*Send number (1-${categories.length})*`;

  // ====== SEND OPTIONS WITH IMAGE ======
  let sentMessage;
  if (imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      sentMessage = await client.sendMessage(dest, {
        image: imageBuffer,
        caption: optionsText,
        contextInfo,
      }, { quoted: quotedContact });
    } catch (error) {
      // If image fails, send text only
      sentMessage = await client.sendMessage(dest, {
        text: optionsText,
        contextInfo,
      }, { quoted: quotedContact });
    }
  } else {
    // If no image found, send text only
    sentMessage = await client.sendMessage(dest, {
      text: optionsText,
      contextInfo,
    }, { quoted: quotedContact });
  }

  // ====== LISTENER ======
  client.ev.on('messages.upsert', async (update) => {
    const message = update.messages[0];
    if (!message.message || !message.message.extendedTextMessage) return;

    // Check if replying to menu options
    if (message.message.extendedTextMessage.contextInfo?.stanzaId !== sentMessage.key.id) return;

    const responseText = message.message.extendedTextMessage.text.trim();
    const categoryIndex = parseInt(responseText) - 1;

    // ====== VALIDATE NUMBER ======
    if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
      await repondre(`❌ Invalid number! Send 1-${categories.length}`);
      return;
    }

    try {
      // ====== REACT TO USER ======
      await client.sendMessage(message.key.remoteJid, {
        react: { text: "⏳", key: message.key }
      });

      const selectedCategory = categories[categoryIndex];
      const commands = coms[selectedCategory];

      // ====== BUILD CATEGORY MENU ======
      let menuText = `📂 *${selectedCategory.toUpperCase()}*\n\n`;
      commands.forEach((cmd) => {
        menuText += `🔹 *${prefixe}${cmd}\n`;
      });

      const infoText = getBotInfo(mode, totalCommands);
      const finalText = infoText + menuText;

      // ====== SEND MENU WITH RANDOM IMAGE ======
      const categoryImagePath = getRandomScsImage();
      if (categoryImagePath) {
        try {
          const categoryImageBuffer = fs.readFileSync(categoryImagePath);
          await client.sendMessage(dest, {
            image: categoryImageBuffer,
            caption: finalText,
            contextInfo,
          }, { quoted: ms });
        } catch (error) {
          // If image fails, send text only
          await client.sendMessage(dest, {
            text: finalText,
            contextInfo,
          }, { quoted: ms });
        }
      } else {
        await client.sendMessage(dest, {
          text: finalText,
          contextInfo,
        }, { quoted: ms });
      }

      // ====== REACT SUCCESS ======
      await client.sendMessage(message.key.remoteJid, {
        react: { text: "✅", key: message.key }
      });

    } catch (error) {
      console.error(error);
      await repondre(`❌ Error: ${error.message}`);
    }
  });
});
