const { bmbtz } = require("../../devbmb/bmbtz")
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { ajouterOuMettreAJourJid, mettreAJourAction, verifierEtatJid } = require("../../lib/antilien")
const { atbajouterOuMettreAJourJid, atbverifierEtatJid } = require("../../lib/antibot")
const fs = require("fs-extra");
const conf = require("../../settings");
const { default: axios } = require('axios');

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

bmbtz({ nomCom: "tagadmin", categorie: 'Group', reaction: "🪰" }, async (dest, client, commandeOptions) => {
  const { ms, repondre, arg, verifGroupe, nomGroupe, infosGroupe, nomAuteurMessage, verifAdmin, superUser } = commandeOptions;

  if (!verifGroupe) return repondre("❌ This command is for groups only.");
  if (!verifAdmin && !superUser) return repondre("❌ You must be an admin or superuser to use this command.");

  let mess = arg && arg.length > 0 ? arg.join(' ') : 'No Message';

  let adminsGroupe = infosGroupe.participants.filter(m => m.admin);

  let tag = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏷️ *Group:* ${nomGroupe}
┃ 🙋 *Sender:* ${nomAuteurMessage}
┃ 📢 *Message:* ${mess}
┣━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  let emoji = ['🤔', '🥏', '📛', '🫡', '🚨'];
  let random = Math.floor(Math.random() * emoji.length);

  for (const membre of adminsGroupe) {
    tag += `┃ ${emoji[random]} @${membre.id.split("@")[0]}\n`;
  }

  tag += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

  await client.sendMessage(dest, {
    text: tag,
    mentions: adminsGroupe.map(i => i.id),
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true,
      mentionedJid: adminsGroupe.map(i => i.id),
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363382023564830@newsletter",
        newsletterName: "𝙽𝙾𝚅𝙰-𝚇𝙼𝙳",
        serverMessageId: 1
      }
    }
  }, { quoted: quotedContact });  // <=== Hii ni sehemu ya quoting contact
});
