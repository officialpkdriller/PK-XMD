const { bmbtz } = require("../../devpk/bmbtz");
const axios = require("axios");
const pkg = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent, proto } = pkg;
const ownerAccess = require("../../lib/ownerAccess");

/* ===== NEWSLETTER CONTEXT ===== */
const newsletterContext = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363417804135599@newsletterr",
    newsletterName: "B.M.B TECH",
    serverMessageId: 1
  }
};

// Fake quoted contact (status style)
const quotedStatus = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:B.M.B VERIFIED
ORG:PK-XMD;
TEL;type=CELL;type=VOICE;waid=254799056874:+254799056874
END:VCARD`
    }
  }
};

const PAIR_API = "https://bmb-pair-zone.onrender.com/code";
const API_TIMEOUT_MS = 60000; // the pairing server can be slow to wake up

const isPhoneLength = (n) => n.length >= 8 && n.length <= 15;

/**
 * The phone number of the person who sent the command.
 *
 * WhatsApp often shows a sender as "<long id>@lid" (always in groups, sometimes in private chats).
 * That long id is NOT a phone number, so it must never be used for pairing. The sender is turned into
 * the real phone number first; when that is not possible, an empty string is returned.
 */
async function senderPhoneNumber(client, o) {
  const raw = [o.senderJid, o.auteurMessage].filter(Boolean);

  // 1. an id that is already a phone-number JID
  for (const jid of raw) {
    if (!String(jid).endsWith("@lid")) {
      const n = ownerAccess.digits(jid);
      if (isPhoneLength(n)) return n;
    }
  }

  // 2. an @lid id: look up the real number (cache, group member list, WhatsApp mapping)
  for (const jid of raw) {
    if (!String(jid).endsWith("@lid")) continue;
    try {
      const resolved = await ownerAccess.resolveSenderAsync(client, jid, Array.isArray(o.mbre) ? o.mbre : [], !!o.verifGroupe);
      if (resolved && !String(resolved).endsWith("@lid")) {
        const n = ownerAccess.digits(resolved);
        if (isPhoneLength(n)) return n;
      }
    } catch (e) { /* try the next one */ }
  }
  return "";
}

const COMMAND_NAMES = ["paircode", "session", "qrcode"];

bmbtz(
  {
    nomCom: "pair",
    alias: COMMAND_NAMES,     // the key the bot reads
    aliases: COMMAND_NAMES,   // kept as well, because the old file used this spelling
    categorie: "General",
    reaction: "🔐"
  },
  async (dest, client, context) => {
    const { arg, repondre, ms, prefixe } = context;
    const p = prefixe || ".";

    try {
      let number;

      if (arg && arg.length) {
        // The person typed a number: spaces, + and dashes are ignored (".pair +255 717 179 577").
        number = ownerAccess.digits(arg.join(""));
        if (number.startsWith("0")) {
          return repondre(`❌ Please write the number with the country code and without 0 at the start.\nExample: ${p}pair 255717179577`);
        }
        if (!isPhoneLength(number)) {
          return repondre(`❌ That does not look like a phone number.\nExample: ${p}pair 255717179577`);
        }
      } else {
        // No number typed: use the phone number of the person who sent the command.
        number = await senderPhoneNumber(client, context);
        if (!number) {
          return repondre(`❌ I could not read your phone number from this chat.\nPlease type it with the country code, for example: ${p}pair 255717179577`);
        }
      }

      const apiUrl = `${PAIR_API}?number=${encodeURIComponent(number)}`;
      const { data } = await axios.get(apiUrl, { timeout: API_TIMEOUT_MS });

      if (!data || !data.code) {
        return repondre("❌ Failed to generate pair code.");
      }

      // 🔹 Caption (status style) + newsletterJid
      const caption = `
🔐 *PAIRING SUCCESSFUL* 🔐

📱 *Number:* ${number}

━━━━━━━━━━━━━━━
🔑 *PAIR CODE*
━━━━━━━━━━━━━━━
`;

      await client.sendMessage(
        dest,
        {
          text: caption,
          contextInfo: newsletterContext
        },
        { quoted: quotedStatus }
      );

      // 🔹 COPY BUTTON (the code, on its own, without a reply)
      const buttons = [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 COPY PAIR CODE",
            copy_code: data.code
          })
        }
      ];

      const viewOnceMessage = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: data.code
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: ""
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "",
                subtitle: "",
                hasMediaAttachment: false
              }),
              nativeFlowMessage:
                proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons
                })
            })
          }
        }
      };

      const waMsg = generateWAMessageFromContent(dest, viewOnceMessage, {});
      await client.relayMessage(dest, waMsg.message, {
        messageId: waMsg.key.id
      });

    } catch (error) {
      console.error("PAIR ERROR:", error);
      repondre("❌ Error occurred while generating pair code.");
    }
  }
);

module.exports = { senderPhoneNumber };
