const { bmbtz } = require('../../devbmb/bmbtz');
const s = require("../../settings");
const fs = require('fs');
const ownerAccess = require('../../lib/ownerAccess');

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
      vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:B.M.B VERIFIED ✅\nORG:BMB-TECH BOT;\nTEL;type=CELL;type=VOICE;waid=254700000001:+254 700 000001\nEND:VCARD"
    }
  }
};

// Context of the newsletter
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363382023564830@newsletter",
    newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

// SET PROFILE PICTURE
bmbtz({
  nomCom: 'setpp',
  categorie: 'General',
  reaction: '📸'
}, async (dest, client, commandeOptions) => {
  const { ms, repondre, msgRepondu, superUser, auteurMessage, idBot } = commandeOptions;

  const userJid = auteurMessage;
  const botJid = idBot;
  const ownerNumber = s.OWNER_NUMBER || 'default_owner_number';
  const isOwner = userJid === `${ownerNumber}@s.whatsapp.net`;
  const isConnectedUser = userJid === botJid;

  if (!isConnectedUser && !isOwner && !superUser) {
    return repondre("🚫 *Only the connected bot user or owner can change the profile picture!*");
  }

  if (!msgRepondu) {
    return repondre("📸 *Please reply to an image with .settingspp to set it as your profile picture!*");
  }

  const imageMessage =
    msgRepondu.message?.imageMessage ||
    msgRepondu.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
    msgRepondu.imageMessage || null;

  if (!imageMessage) {
    return repondre("🚫 *The replied message isn't an image!*");
  }

  try {
    const mediaPath = await client.downloadAndSaveMediaMessage(imageMessage);
    await client.updateProfilePicture(userJid, { url: mediaPath });
    fs.unlink(mediaPath, err => {
      if (err) console.error("Cleanup failed:", err);
    });

    // Success message in a box
    const successMsg = `┏━━━━━━━━━━━━━━━━━━
┃ ✅ *Profile Picture Updated!*
┃ 👤 *User:* @${userJid.split('@')[0]}
┃ 🤖 *Bot:* ${s.BOT}
┃ 🔧 *Status:* Success
┗━━━━━━━━━━━━━━━━━`;

    repondre(successMsg, { mentions: [userJid] });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    repondre(`❌ *Failed to update profile picture:* ${error.message}`);
  }
});

/**
 * Works out whose profile picture was asked for. First match wins:
 *   1. a phone number typed after the command      .getpp 254746277449
 *   2. someone mentioned in the message            .getpp @user
 *   3. the author of the message you replied to    (reply) .getpp
 *   4. the other person of the private chat you are in   .getpp   (inside a DM)
 */
async function findTarget(client, o) {
  const { arg, dest, verifGroupe, mentionedJid, msgRepondu, auteurMsgRepondu, mbre } = o;

  // 1. typed number (spaces, +, dashes and brackets are ignored)
  const typed = ownerAccess.digits((arg || []).join(''));
  if (typed.length >= 7) {
    if (typed.length > 15) return { error: "That number is too long. Please check it and try again." };
    if (typed.startsWith('0')) {
      return { error: "Please write the number with the country code and without 0 at the start.\nExample: .getpp 254746277449" };
    }
    let jid = typed + '@s.whatsapp.net';
    try {
      const found = await client.onWhatsApp(jid);
      if (Array.isArray(found) && found.length && found[0].exists === false) {
        return { error: `The number +${typed} is not on WhatsApp.` };
      }
      if (Array.isArray(found) && found[0] && found[0].jid) jid = found[0].jid;
    } catch (e) { /* keep the plain number */ }
    return { jid };
  }

  // 2. mention  3. reply
  let jid = (Array.isArray(mentionedJid) && mentionedJid[0]) || (msgRepondu && auteurMsgRepondu) || '';

  // 4. private chat: the other person
  if (!jid && !verifGroupe && dest) jid = dest;

  if (!jid) return { jid: '' };

  // WhatsApp may give an @lid id; turn it into the real phone number when we can
  try {
    jid = await ownerAccess.resolveSenderAsync(client, jid, Array.isArray(mbre) ? mbre : [], !!verifGroupe);
  } catch (e) { /* keep as is */ }
  return { jid };
}

// GET PROFILE PICTURE
bmbtz({
  nomCom: "getpp",
  alias: ["pp", "profilepic"],
  categorie: "General",
  reaction: "📷",
}, async (dest, client, commandeOptions) => {
  const { repondre, mybotpic, prefixe } = commandeOptions;

  try {
    const target = await findTarget(client, commandeOptions);

    if (target.error) return repondre(`❌ *${target.error}*`);
    if (!target.jid) {
      const p = prefixe || ".";
      return repondre(
        `❌ *Tell me whose profile picture you want:*\n` +
        `• ${p}getpp 254746277449\n` +
        `• mention someone: ${p}getpp @user\n` +
        `• reply to their message with ${p}getpp\n` +
        `• or use ${p}getpp inside their private chat`
      );
    }

    const user = target.jid;
    const tag = '@' + user.split('@')[0].split(':')[0];

    // Loading message (normal)
    await repondre(`🔁 *Load..... ${tag}*`, { mentions: [user] });

    let ppuser;
    let hidden = false;
    try {
      ppuser = await client.profilePictureUrl(user, 'image');
    } catch {
      hidden = true;
      ppuser = mybotpic();
      await repondre(
        `🚫 *Profile picture locked or not found!*  
🖼️ *Showing bot profile instead...*`,
        { mentions: [user] }
      );
    }

    // Box style caption
    const captionBox = `┏━━━━━━━━━━━━━━━━━━
┃ 🖼️ *Profile Picture*
┃ 👤 *User:* ${tag}
┃ 🤖 *Bot:* ${s.BOT}
┗━━━━━━━━━━━━━━━━━`;

    await client.sendMessage(dest, {
      image: { url: ppuser },
      caption: captionBox,
      mentions: [user],
      contextInfo
    }, { quoted: quotedContact });

  } catch (error) {
    console.error("Error in getpp:", error);
    await repondre(`❌ *Error while fetching profile picture:* ${error.message}`);
  }
});
