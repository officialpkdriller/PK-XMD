const { bmbtz } = require("../../devbmb/bmbtz");
const pkg = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg;

bmbtz({
  nomCom: "groupid",
  alias: ["gcid", "gid"],
  reaction: "🆔",
  desc: "Get WhatsApp Group ID and info",
  categorie: "Group"
}, async (dest, client, commandeOptions) => {
  const { repondre, ms } = commandeOptions;

  try {
    if (!dest.endsWith("@g.us")) {
      return repondre("❎ This command can only be used inside a group.");
    }

    let metadata;
    try {
      metadata = await client.groupMetadata(dest);
    } catch (e) {
      return repondre("❌ Failed to fetch group metadata.");
    }

    if (!metadata || !metadata.id) return repondre("❌ Group not found or inaccessible.");

    let pfpUrl;
    try {
      pfpUrl = await client.profilePictureUrl(dest, "image");
    } catch (e) {
      pfpUrl = null;
    }

    const infoText = `*— 乂 Group Info —*\n\n` +
      `🆔 *ID:* ${metadata.id}\n` +
      `📌 *Name:* ${metadata.subject}\n` +
      `👥 *Members:* ${metadata.participants?.length || "N/A"}\n` +
      `📅 *Created on:* ${metadata.creation ? new Date(metadata.creation * 1000).toLocaleString("id-ID") : "Unknown"}\n` +
      `👑 *Owner:* ${metadata.owner ? metadata.owner.split("@")[0] : "Unknown"}`;

    /* ===== COPY BUTTON (group ID) ===== */
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
      title: pfpUrl ? "" : infoText,
      subtitle: "",
      hasMediaAttachment: false
    };

    if (pfpUrl) {
      const media = await prepareWAMessageMedia(
        { image: { url: pfpUrl } },
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
    console.error("❌ Error in .groupid plugin:", error);
    repondre("⚠️ An unexpected error occurred.");
  }
});
