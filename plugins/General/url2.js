const { bmbtz } = require("../../devbmb/bmbtz");
const pkg = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent, proto } = pkg;
const fs = require("fs-extra");
const axios = require("axios");
const FormData = require("form-data");

/* ===== IMGBB CONFIG ===== */
const IMGBB_API_KEY = "84b96ae2b8e45c7e957e1258e0e9e7c0";
const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

/* ===== QUOTED CONTACT ===== */
const quotedContact = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "B.M.B TECH VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:B.M.B TECH VERIFIED ✅
ORG:BMB-TECH BOT;
TEL;type=CELL;type=VOICE;waid=255767862457:+255767862457
END:VCARD`
    }
  }
};

/* ===== UPLOAD TO IMGBB ===== */
async function uploadToImgbb(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File not found");

  const form = new FormData();
  form.append("image", fs.createReadStream(filePath));

  const res = await axios.post(
    `${IMGBB_API_URL}?key=${IMGBB_API_KEY}`,
    form,
    { headers: form.getHeaders() }
  );

  return res.data.data.url;
}

/* ===== COMMAND ===== */
bmbtz(
  {
    nomCom: "url2",
    categorie: "General",
    reaction: "💗"
  },
  async (from, client, context) => {
    const { msgRepondu, ms, repondre } = context;

    /* ===== IMAGE CHECK ===== */
    const imageMessage =
      msgRepondu?.imageMessage || ms.message?.imageMessage;

    if (!imageMessage) {
      return repondre("❌ Reply picha kisha andika *.url*");
    }

    let imagePath;

    try {
      /* ===== DOWNLOAD IMAGE ===== */
      imagePath = await client.downloadAndSaveMediaMessage(imageMessage);

      /* ===== UPLOAD ===== */
      const imageUrl = await uploadToImgbb(imagePath);
      fs.unlinkSync(imagePath);

      /* ===== RESULT UI ===== */
      const textResult = `
╭───〔 B.M.B TECH IMAGE URL 〕───
│
│ 🔗 Generated Link:
│
│ ${imageUrl}
│
│ 📋 Use COPY button
│
╰────────────────────────
`;

      const buttons = [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 COPY URL",
            copy_code: imageUrl
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
            interactiveMessage:
              proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text: textResult
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

      const waMsg = generateWAMessageFromContent(
        from,
        viewOnceMessage,
        {}
      );

      await client.relayMessage(from, waMsg.message, {
        messageId: waMsg.key.id
      });

    } catch (err) {
      console.error("IMGBB URL ERROR:", err);
      repondre("❌ Failed to generate image URL.");
    }
  }
);
