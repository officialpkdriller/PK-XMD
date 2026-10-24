const { bmbtz } = require("../../devbmb/bmbtz");
let { Sticker, StickerTypes } = require('wa-sticker-formatter');

bmbtz({ nomCom: "tag", alias: ["hidetag", "announce"], categorie: 'Group', reaction: "🎤" }, async (dest, client, commandeOptions) => {
  const { repondre, msgRepondu, verifGroupe, arg, verifAdmin, superUser } = commandeOptions;

  if (!verifGroupe) return repondre("🚫 *This command is allowed only in groups.*");
  if (!(verifAdmin || superUser)) return repondre("🚀 *This command is for group admins only.*");

  const metadata = await client.groupMetadata(dest);
  const tag = metadata.participants.map(p => p.id);

  let msg;

  if (msgRepondu) {
    if (msgRepondu.imageMessage) {
      let media = await client.downloadAndSaveMediaMessage(msgRepondu.imageMessage);
      msg = {
        image: { url: media },
        caption: `📢 *Broadcast Message:*\n\n${msgRepondu.imageMessage.caption || ''}`,
        mentions: tag
      };
    } else if (msgRepondu.videoMessage) {
      let media = await client.downloadAndSaveMediaMessage(msgRepondu.videoMessage);
      msg = {
        video: { url: media },
        caption: `🎥 *Video Broadcast:*\n\n${msgRepondu.videoMessage.caption || ''}`,
        mentions: tag
      };
    } else if (msgRepondu.audioMessage) {
      let media = await client.downloadAndSaveMediaMessage(msgRepondu.audioMessage);
      msg = {
        audio: { url: media },
        mimetype: 'audio/mp4',
        mentions: tag
      };
    } else if (msgRepondu.stickerMessage) {
      let media = await client.downloadAndSaveMediaMessage(msgRepondu.stickerMessage, '', true, 'sticker');
      let stickerMess = new Sticker(media, {
        pack: 'bmb-tech',
        type: StickerTypes.CROPPED,
        categories: ["🤩", "🎉"],
        id: "12345",
        quality: 70,
        background: "transparent",
      });
      const stickerBuffer = await stickerMess.toBuffer();
      msg = {
        sticker: stickerBuffer,
        mentions: tag
      };
    } else {
      msg = {
        text: `📢 *Message:*\n\n${msgRepondu.conversation}`,
        mentions: tag
      };
    }

    client.sendMessage(dest, msg);

  } else {
    if (!arg || !arg[0]) return repondre("ℹ️ *Enter the text to announce* or reply to a media message.");

    let text =
`╭──❰ *HIDE TAG ANNOUNCEMENT* ❱──╮
│
│ 💬 ${arg.join(' ')}
│
╰────────────────────────────╯`;

    client.sendMessage(dest, {
      text: text,
      mentions: tag
    });
  }
});
