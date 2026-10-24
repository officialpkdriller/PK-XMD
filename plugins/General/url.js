const { bmbtz } = require("../../devbmb/bmbtz");
const pkg = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent, proto } = pkg;
const axios = require("axios");
const FormData = require('form-data');
const fs = require("fs-extra");
const path = require("path");

const BMB_API = 'https://url.bmbxmd.workers.dev/api/upload';

// Function to generate random 6 characters (A-Z, 0-9)
function generateShortId(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

bmbtz({
  nomCom: "url",
  categorie: "General",
  reaction: "🖇",
  desc: "Convert media to BMB URL"
}, async (dest, client, commandeOptions) => {
  const { repondre, msgRepondu, ms } = commandeOptions;

  try {
    // Check if replying to media
    const imageMessage = msgRepondu?.imageMessage || ms.message?.imageMessage;
    const videoMessage = msgRepondu?.videoMessage || ms.message?.videoMessage;
    const audioMessage = msgRepondu?.audioMessage || ms.message?.audioMessage;
    const documentMessage = msgRepondu?.documentMessage || ms.message?.documentMessage;

    const mediaMessage = imageMessage || videoMessage || audioMessage || documentMessage;

    if (!mediaMessage) {
      return repondre("❌ Please reply to an image, video, or audio file.\n\nExample: .url (reply to media)");
    }

    // Send initial reaction
    await client.sendMessage(dest, {
      react: { text: "⏳", key: ms.key }
    });

    // Get mime type
    let mimeType = mediaMessage.mimetype || '';
    let mediaBuffer;

    // Download media
    try {
      mediaBuffer = await client.downloadAndSaveMediaMessage(mediaMessage);
    } catch (error) {
      return repondre("❌ Failed to download media. Please try again.");
    }

    // Check file size (100MB limit)
    const stats = fs.statSync(mediaBuffer);
    if (stats.size > 100 * 1024 * 1024) {
      fs.unlinkSync(mediaBuffer);
      return repondre("❌ File size exceeds 100MB limit.");
    }

    // Determine extension
    let extension = '';
    if (mimeType.includes('image/jpeg')) extension = '.jpg';
    else if (mimeType.includes('image/png')) extension = '.png';
    else if (mimeType.includes('image/webp')) extension = '.webp';
    else if (mimeType.includes('image/gif')) extension = '.gif';
    else if (mimeType.includes('video')) extension = '.mp4';
    else if (mimeType.includes('audio')) extension = '.mp3';
    else if (mimeType.includes('application')) extension = '.pdf';
    else extension = '.bin';

    // Generate filename: 6 random chars + extension
    const shortId = generateShortId(6);
    const filename = `${shortId}${extension}`;

    // Upload to BMB API
    const form = new FormData();
    form.append('file', fs.createReadStream(mediaBuffer), {
      filename: filename,
      contentType: mimeType
    });

    const response = await axios.post(BMB_API, form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    // Clean up temp file
    fs.unlinkSync(mediaBuffer);

    const data = response.data;
    if (!data || !data.url) {
      throw new Error("Upload failed. BMB did not return a valid URL.");
    }

    const mediaUrl = data.url;

    // Determine media type
    let mediaType = 'File';
    if (mimeType.includes('image')) mediaType = 'Image';
    else if (mimeType.includes('video')) mediaType = 'Video';
    else if (mimeType.includes('audio')) mediaType = 'Audio';

    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Build response text
    const textMessage = `📤 *FILE UPLOAD SUCCESS*
━━━━━━━━━━━━━━━━
📁 *Type:* ${mediaType}
📦 *Size:* ${fileSizeMB} MB
🔑 *ID:* ${shortId}
🌐 *Link:* ${mediaUrl}
━━━━━━━━━━━━━━━━
© BMB-TECH`;

    // Create buttons
    const buttons = [
      {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
          display_text: "📋 COPY LINK",
          copy_code: mediaUrl
        })
      }
    ];

    // Send interactive message with buttons
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
                text: textMessage
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© BMB-TECH"
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
      dest,
      viewOnceMessage,
      {}
    );

    await client.relayMessage(dest, waMsg.message, {
      messageId: waMsg.key.id
    });

    // React with success
    await client.sendMessage(dest, {
      react: { text: "✅", key: ms.key }
    });

  } catch (error) {
    console.error("URL Upload Error:", error);
    await repondre(`❌ Error: ${error.message || error}`);
  }
});
