const { bmbtz } = require('../../devbmb/bmbtz');
const axios = require("axios");
let { Sticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * telesticker
 *
 * Split out of the old combined mods.js. Fixed a real bug: it built
 * the Telegram API URL with `encodeURIComponent(packname)` — but
 * `packname` was never declared anywhere in the function (only `name`
 * was, extracted from the sticker pack link) — that's a
 * ReferenceError, so this command threw immediately every time it
 * ran. Now correctly uses `name`.
 */
bmbtz({
    nomCom: "telesticker",
    alias: ["tstick", "tgsticker"],
    categorie: "Mods"
}, async (dest, client, commandeOptions) => {
    const { ms, repondre, arg, nomAuteurMessage, superUser } = commandeOptions;

    if (!superUser) {
        repondre('Only Mods can use this command'); return;
    }

    if (!arg[0]) {
        repondre("put a telegram sticker link ");
        return;
    }

    let lien = arg.join(' ');
    let name = lien.split('/addstickers/')[1];

    if (!name) {
        repondre("That doesn't look like a valid Telegram sticker pack link.");
        return;
    }

    let api = 'https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getStickerSet?name=' + encodeURIComponent(name);

    try {
        let stickers = await axios.get(api);
        let type = (stickers.data.result.is_animated === true || stickers.data.result.is_video === true) ? 'animated sticker' : 'not animated sticker';

        let msg = `   bmb-tech-stickers-dl
      
*Name :* ${stickers.data.result.name}
*Type :* ${type} 
*Length :* ${(stickers.data.result.stickers).length}

    Downloading...`;

        await repondre(msg);

        for (let i = 0; i < (stickers.data.result.stickers).length; i++) {
            let file = await axios.get(`https://api.telegram.org/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/getFile?file_id=${stickers.data.result.stickers[i].file_id}`);

            let buffer = await axios({
                method: 'get',
                url: `https://api.telegram.org/file/bot891038791:AAHWB1dQd-vi0IbH2NjKYUk-hqQ8rQuzPD4/${file.data.result.file_path}`,
                responseType: 'arraybuffer',
            });

            const sticker = new Sticker(buffer.data, {
                pack: nomAuteurMessage,
                author: "bmbtech",
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: '#000000'
            });

            const stickerBuffer = await sticker.toBuffer();

            await client.sendMessage(
                dest,
                { sticker: stickerBuffer },
                { quoted: ms }
            );
        }

    } catch (e) {
        repondre("we got an error \n" + e);
    }
});
