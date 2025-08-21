const { cmd, commands } = require('../command');
const moment = require('moment-timezone');
const { runtime } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "menu",
    desc: "Display NEXUS-AI Command Menu",
    category: "main",
    filename: __filename
}, async (conn, m, { reply }) => {
    try {
        // System Info
        const dateNow = moment().tz('Africa/Nairobi').format('dddd, MMMM Do YYYY, HH:mm:ss');
        const upTime = runtime(process.uptime());
        const botName = "PK-XMD";
        const ownerName = "PK-TECH";
        const totalCommands = Object.values(commands).length;
        const prefix = "*";
        const ramUsage = `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`;

        // Quote System
        const quotes = [
            "✨ Keep smiling, life is beautiful!",
            "🚀 Code, create, conquer!",
            "💡 Innovation distinguishes the leader from the follower.",
            "🎯 Focus on progress, not perfection.",
            "🌟 Stay positive and keep moving forward."
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        // Command Grouping (skip undefined ones)
        let categorized = {};
        for (let c of Object.values(commands)) {
            if (!c?.pattern || !c?.category) continue; // skip bad commands
            if (!categorized[c.category]) categorized[c.category] = [];
            categorized[c.category].push(c.pattern);
        }

        // Build Menu Header
        let menuText = `
╭─⋄⋅🌺⋅⋄──⋅🌷⋅──⋄⋅🌸⋅⋄─╮
       ${botName.toUpperCase()}
╰─⋄⋅🌼⋅⋄──⋅🌹⋅──⋄⋅💮⋅⋄─╯

╭────────────────────╮
⋅📆 .*DATE*  : ${dateNow}
─────────────────────
⋅⏰ .*UPTIME*: ${upTime}
─────────────────────
⋅👤 .*OWNER* : ${ownerName}
─────────────────────
⋅📜 .*CMDS*  : ${totalCommands}
─────────────────────
⋅🛡️ .*PREFIX*: ${prefix}
─────────────────────
⋅💎 .*RAM*   : ${ramUsage}
╰────────────────────╯

╭───────────────╮
│  *COMMAND LIST* │
╰───────────────╯
${'\u200B'.repeat(4001)}  💎
`;

        // List commands per category
        for (let category in categorized) {
            menuText += `\n★ *${category.toUpperCase()}*\n`;
            categorized[category].forEach(cmd => {
                menuText += `> ☆ *${cmd}*\n`;
            });
        }

        // Footer
        menuText += `
╭────────────────╮
│  💬 "${randomQuote}"
│  
│  ✨ Powered by Baileys
│  🏆 PK-TECH Edition
╰────────────────╯
`;

        // Send menu image
        await conn.sendMessage(m.chat, {
            image: { url: "https://files.catbox.moe/h4voyb.jpeg" },
            caption: menuText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363288304618280@newsletter",
                    newsletterName: "PK-XMD",
                    serverMessageId: -1
                }
            }
        }, { quoted: m });

        // Send PTT audio after menu
        await conn.sendMessage(m.chat, {
            audio: { url: "https://files.catbox.moe/340wh3.mp3" }, // weka link yako ya sauti hapa
            mimetype: 'audio/mpeg',
            ptt: true,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363288304618280@newsletter",
                    newsletterName: "PK-XMD",
                    serverMessageId: -1
                }
            }
        }, { quoted: m });

    } catch (e) {
        console.error("Menu Error:", e);
        reply("❌ Failed to display menu");
    }
});
