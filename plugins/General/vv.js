const { bmbtz } = require('../../devbmb/bmbtz');
let { Sticker, StickerTypes } = require('wa-sticker-formatter');

bmbtz({
    nomCom: "vv",
    alias: ["view", "keep", "grab"],
    categorie: "General"
}, async (dest, client, commandeOptions) => {
    const { repondre, msgRepondu, superUser } = commandeOptions;

    // Check kama ni superUser
    if (!superUser) {
        await repondre('❌ Only mods can use this command');
        return;
    }

    // Check kama kuna message iliyoreply
    if (!msgRepondu) {
        await repondre('📥 Reply to the message you want to save');
        return;
    }

    let msg;
    const contextInfo = {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363382023564830@newsletter",
            newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
            serverMessageId: 1
        }
    };

    // quoted contact kama ile ya awali
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

    try {
        // Handle image message
        if (msgRepondu.imageMessage) {
            let media = await client.downloadAndSaveMediaMessage(msgRepondu.imageMessage);
            msg = {
                image: { url: media },
                caption: msgRepondu.imageMessage.caption || "",
                contextInfo
            };

        // Handle video message
        } else if (msgRepondu.videoMessage) {
            let media = await client.downloadAndSaveMediaMessage(msgRepondu.videoMessage);
            msg = {
                video: { url: media },
                caption: msgRepondu.videoMessage.caption || "",
                gifPlayback: true,
                contextInfo
            };

        // Handle audio message
        } else if (msgRepondu.audioMessage) {
            let media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
            msg = {
                audio: { url: media },
                mimetype: 'audio/mp4',
                contextInfo
            };

        // Handle sticker message
        } else if (msgRepondu.stickerMessage) {
            let media = await client.downloadAndSaveMediaMessage(msgRepondu.stickerMessage, '', true, 'sticker');
            let stickerMess = new Sticker(media, {
                pack: 'BMB-TECH',
                type: StickerTypes.CROPPED,
                categories: ["🤩", "🎉"],
                id: "12345",
                quality: 70,
                background: "transparent"
            });
            const stickerBuffer2 = await stickerMess.toBuffer();
            msg = { sticker: stickerBuffer2 };

        // Handle text message
        } else {
            msg = { 
                text: msgRepondu.conversation || "📝 Message copied",
                contextInfo 
            };
        }

        // Tuma hapo hapo kwenye dest (group au chat) kama vv ya awali
        await client.sendMessage(dest, msg, { quoted: quotedContact });
        
        await repondre('✅ Message saved successfully!');

    } catch (error) {
        console.error("Error processing the message:", error);
        await repondre("❌ Failed to process the message. Try again.");
    }
});
