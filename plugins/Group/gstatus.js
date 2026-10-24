const { bmbtz } = require("../../devbmb/bmbtz");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

/**
 * gstatus
 *
 * Ported from NOVA-XMD's plugins/Groups/gstatus.js. Posts media (image,
 * video, audio) or plain text into a group as a "silent group status" —
 * a WhatsApp feature that shows the content the same way a status does
 * (contextInfo.isGroupStatus / statusSourceType / statusAttributions),
 * but delivered directly into the group's chat.
 *
 * Usage inside the group:
 *   .gstatus <text>                          (posts text)
 *   reply to an image/video/audio + .gstatus  (posts that media)
 *
 * Usage outside the group (DM to the bot):
 *   .gstatus <group invite link or JID> <text>
 *   reply to media + .gstatus <group invite link or JID>
 */
async function getBuffer(msg, type) {
    const stream = await downloadContentFromMessage(msg, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

function statusContext(sourceType) {
    return {
        isGroupStatus: true,
        statusSourceType: sourceType,
        statusAttributions: [{ type: 10 }],
        statusAudienceMetadata: { audienceType: "CLOSE_FRIENDS" },
    };
}

bmbtz({
    nomCom: "gstatus",
    alias: ["groupstatus", "gs"],
    categorie: "Group",
    reaction: "👥",
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, arg, ms, msgRepondu, prefixe } = commandeOptions;

    const react = (emoji) => client.sendMessage(dest, { react: { text: emoji, key: ms.key } }).catch(() => {});

    try {
        const afterCmd = (arg || []).join(" ").trim();

        let targetGroupJid = null;
        let inlineText = null;

        if (verifGroupe) {
            targetGroupJid = dest;
            inlineText = afterCmd || null;
        } else {
            if (!afterCmd) {
                await react("❌");
                return repondre(
                    `👥 *GROUP STATUS*\n━━━━━━━━━━━━━━━━\nReply to media and provide a group link or JID.\nExample:\n${prefixe}gstatus https://chat.whatsapp.com/xxxxx\n${prefixe}gstatus 120363@g.us\n━━━━━━━━━━━━━━━━\n© bmb tech`
                );
            }
            const parts = afterCmd.split(/\s+/);
            const input = parts[0];
            const rest = parts.slice(1).join(" ").trim();

            if (input.includes("chat.whatsapp.com")) {
                let code;
                try {
                    const url = new URL(input);
                    code = url.pathname.replace(/^\/+/, "");
                } catch {
                    code = input.split("/").pop();
                }
                try {
                    const res = await client.groupGetInviteInfo(code);
                    targetGroupJid = res?.id || res?.groupId || res?.gid;
                    if (!targetGroupJid) throw new Error("no id");
                } catch {
                    await react("❌");
                    return repondre(`👥 *GROUP STATUS*\n━━━━━━━━━━━━━━━━\nInvalid or expired group link.\n━━━━━━━━━━━━━━━━\n© bmb tech`);
                }
            } else if (input.includes("@g.us")) {
                targetGroupJid = input.trim();
            } else {
                await react("❌");
                return repondre(`👥 *GROUP STATUS*\n━━━━━━━━━━━━━━━━\nInvalid group link or JID.\n━━━━━━━━━━━━━━━━\n© bmb tech`);
            }

            inlineText = rest || null;
        }

        await react("⌛");

        let caption = null;
        let sourceMsg = null;
        let mediaType = null;

        const quoted = msgRepondu;

        if (ms.message?.imageMessage) {
            sourceMsg = ms.message.imageMessage;
            mediaType = "image";
            caption = ms.message.imageMessage?.caption || inlineText || null;
        } else if (ms.message?.videoMessage) {
            sourceMsg = ms.message.videoMessage;
            mediaType = "video";
            caption = ms.message.videoMessage?.caption || inlineText || null;
        } else if (ms.message?.audioMessage) {
            sourceMsg = ms.message.audioMessage;
            mediaType = "audio";
        } else if (quoted) {
            if (quoted.imageMessage) {
                sourceMsg = quoted.imageMessage;
                mediaType = "image";
                caption = quoted.imageMessage?.caption || inlineText || null;
            } else if (quoted.videoMessage) {
                sourceMsg = quoted.videoMessage;
                mediaType = "video";
                caption = quoted.videoMessage?.caption || inlineText || null;
            } else if (quoted.audioMessage) {
                sourceMsg = quoted.audioMessage;
                mediaType = "audio";
            } else if (quoted.conversation) {
                caption = quoted.conversation || inlineText || null;
            } else if (quoted.extendedTextMessage?.text) {
                caption = quoted.extendedTextMessage.text || inlineText || null;
            }
        } else {
            caption = inlineText || null;
        }

        if (!mediaType && !caption) {
            await react("❌");
            return repondre(
                `👥 *GROUP STATUS*\n━━━━━━━━━━━━━━━━\nReply to an image, video, audio, or include text.\nExample: ${prefixe}gstatus Check out this update!\n━━━━━━━━━━━━━━━━\n© bmb tech`
            );
        }

        if (mediaType === "image") {
            const buffer = await getBuffer(sourceMsg, "image");
            const messageObj = { image: buffer, contextInfo: statusContext("IMAGE") };
            if (caption) messageObj.caption = caption;
            await client.sendMessage(targetGroupJid, messageObj);
        } else if (mediaType === "video") {
            const buffer = await getBuffer(sourceMsg, "video");
            const messageObj = { video: buffer, contextInfo: statusContext("VIDEO") };
            if (caption) messageObj.caption = caption;
            await client.sendMessage(targetGroupJid, messageObj);
        } else if (mediaType === "audio") {
            const buffer = await getBuffer(sourceMsg, "audio");
            await client.sendMessage(targetGroupJid, {
                audio: buffer,
                mimetype: "audio/mp4",
                contextInfo: statusContext("AUDIO"),
            });
        } else {
            await client.sendMessage(targetGroupJid, {
                text: caption,
                contextInfo: statusContext("TEXT"),
            });
        }

        await react("✅");
        if (!verifGroupe) {
            return repondre(`👥 *GROUP STATUS*\n━━━━━━━━━━━━━━━━\n✅ Status posted to group!\n━━━━━━━━━━━━━━━━\n© bmb tech`);
        }
    } catch (error) {
        console.error("GStatus Error:", error);
        await react("❌");
        return repondre(`👥 *GROUP STATUS*\n━━━━━━━━━━━━━━━━\nError: ${error.message}\n━━━━━━━━━━━━━━━━\n© bmb tech`);
    }
});
