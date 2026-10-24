const { bmbtz } = require('../../devbmb/bmbtz');
let { Sticker, StickerTypes } = require('wa-sticker-formatter');

bmbtz({
    nomCom: "save",
    alias: ["grab", "dm", "ok", "😂", "🤗", "😡", "😁", "❤️", "🥰", "viewdm", "keep"],
    categorie: "Mods"
}, async (dest, client, commandeOptions) => {
    const { repondre, msgRepondu, superUser, auteurMessage } = commandeOptions;

    if (!superUser) {
        repondre('only mods can use this command');
        return;
    }

    if (!msgRepondu) {
        repondre('Mention the message that you want to save');
        return;
    }

    let msg;

    if (msgRepondu.imageMessage) {
        let media = await client.downloadAndSaveMediaMessage(msgRepondu.imageMessage);
        msg = {
            image: { url: media },
            caption: msgRepondu.imageMessage.caption,
        };

    } else if (msgRepondu.videoMessage) {
        let media = await client.downloadAndSaveMediaMessage(msgRepondu.videoMessage);
        msg = {
            video: { url: media },
            caption: msgRepondu.videoMessage.caption,
        };

    } else if (msgRepondu.audioMessage) {
        let media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
        msg = {
            audio: { url: media },
            mimetype: 'audio/mp4',
        };

    } else if (msgRepondu.stickerMessage) {
        let media = await client.downloadAndSaveMediaMessage(msgRepondu.stickerMessage, '', true, 'sticker');

        let stickerMess = new Sticker(media, {
            pack: 'BMB-TECH',
            type: StickerTypes.CROPPED,
            categories: ["🤩", "🎉"],
            id: "12345",
            quality: 70,
            background: "transparent",
        });
        const stickerBuffer2 = await stickerMess.toBuffer();

        msg = { sticker: stickerBuffer2 };

    } else {
        msg = { text: msgRepondu.conversation };
    }

    client.sendMessage(auteurMessage, msg);
});
