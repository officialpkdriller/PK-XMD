const { bmbtz } = require("../../devbmb/bmbtz");
const pkg = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg;

bmbtz({
  nomCom: "id",
  alias: ["newsletter", "id"],
  reaction: "📡",
  desc: "Get WhatsApp Channel info from link",
  categorie: "Group"
}, async (dest, client, commandeOptions) => {
  const { repondre, arg, ms } = commandeOptions;
  const q = arg.join(" ");

  try {
    if (!q) return repondre("❎ Please provide a WhatsApp Channel link.\n\n*Example:* .channel https://whatsapp.com/channel/123456789");

    const match = q.match(/whatsapp\.com\/channel\/([\w-]+)/);
    if (!match) return repondre("⚠️ *Invalid channel link format.*\n\nMake sure it looks like:\nhttps://whatsapp.com/channel/xxxxxxxxx");

    const inviteId = match[1];

    let metadata;
    try {
      metadata = await client.newsletterMetadata("invite", inviteId);
    } catch (e) {
      return repondre("❌ Failed to fetch channel metadata. Make sure the link is correct.");
    }

    if (!metadata || !metadata.id) return repondre("❌ Channel not found or inaccessible.");

    const infoText = `*— 乂 Channel Info —*\n\n` +
      `🆔 *ID:* ${metadata.id}\n` +
      `📌 *Name:* ${metadata.name}\n` +
      `👥 *Followers:* ${metadata.subscribers?.toLocaleString() || "N/A"}\n` +
      `📅 *Created on:* ${metadata.creation_time ? new Date(metadata.creation_time * 1000).toLocaleString("id-ID") : "Unknown"}`;

    /* ===== COPY BUTTON (channel ID) ===== */
    const buttons = [
      {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
          display_text: "📋 COPY ID",
          copy_code: metadata.id
        })
      }
    ];

    /* ===== BUILD HEADER (with or without image) ===== */
    let headerProps = {
      title: metadata.preview ? "" : infoText,
      subtitle: "",
      hasMediaAttachment: false
    };

    if (metadata.preview) {
      const media = await prepareWAMessageMedia(
        { image: { url: `https://pps.whatsapp.net${metadata.preview}` } },
        { upload: client.waUploadToServer }
      );
      headerProps = {
        ...proto.Message.InteractiveMessage.Header.fromObject({
          hasMediaAttachment: true,
          ...media
        })
      };
    }

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
                text: infoText
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© BMB-TECH"
              }),
              header: proto.Message.InteractiveMessage.Header.create(headerProps),
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
    console.error("❌ Error in .channel plugin:", error);
    repondre("⚠️ An unexpected error occurred.");
  }
});
