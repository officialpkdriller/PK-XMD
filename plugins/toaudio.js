const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg'); // npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg

cmd({
    pattern: "toaudio",
    alias: ["mp3", "convertmp3"],
    desc: "Convert video to audio",
    category: "converter",
    react: "🎶",
    filename: __filename
},
async (conn, mek, m) => {
    try {
        const quoted = mek.quoted ? mek.quoted : mek;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/video/.test(mime)) {
            return await conn.sendMessage(mek.chat, { text: "❌ Please reply to a *video* to convert it to audio (mp3)." }, { quoted: mek });
        }

        // Download video
        const videoPath = await conn.downloadAndSaveMediaMessage(quoted);
        const audioPath = path.join(__dirname, '../tmp/' + Date.now() + '.mp3');

        // Convert to audio using ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .audioCodec('libmp3lame')
                .toFormat('mp3')
                .on('end', resolve)
                .on('error', reject)
                .save(audioPath);
        });

        // Send audio back
        await conn.sendMessage(mek.chat, {
            audio: fs.readFileSync(audioPath),
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });

        // Cleanup
        fs.unlinkSync(videoPath);
        fs.unlinkSync(audioPath);

    } catch (err) {
        console.error(err);
        await conn.sendMessage(mek.chat, { text: "⚠️ Failed to convert video to audio." }, { quoted: mek });
    }
});
