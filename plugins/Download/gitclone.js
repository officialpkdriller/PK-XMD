const { bmbtz } = require('../../devbmb/bmbtz');
const axios = require('axios');
const fs = require('fs-extra');
const { mediafireDl } = require("../../devbmb/Function");
const conf = require(__dirname + "/../../settings");

// VCard Contact
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

// Newsletter context
const contextInfo = {
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: "120363382023564830@newsletter",
    newsletterName: "𝙱.𝙼.𝙱-𝚇𝙼𝙳",
    serverMessageId: 1
  }
};

// GitHub ZIP Downloader
bmbtz({
  nomCom: "gitclone",
  aliases: ["zip", "clone"],
  categorie: "Download"
}, async (dest, client, context) => {
  const { ms, repondre, arg } = context;
  const githubLink = arg.join(" ");

  if (!githubLink || !githubLink.includes("github.com")) {
    return repondre("Please provide a valid GitHub repository link.");
  }

  let [, owner, repo] = githubLink.match(/(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i) || [];
  if (!owner || !repo) return repondre("Invalid GitHub repo URL.");
  repo = repo.replace(/.git$/, '');

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;

  try {
    const response = await axios.head(apiUrl);
    const fileName = response.headers["content-disposition"].match(/attachment; filename=(.*)/)[1];

    await client.sendMessage(dest, {
      document: { url: apiUrl },
      fileName: `${fileName}.zip`,
      mimetype: "application/zip",
      caption: `📦 Downloaded by ${conf.BOT}`,
      contextInfo: {
        ...contextInfo,
        externalAdReply: {
          title: `${conf.BOT} GIT CLONE`,
          body: conf.OWNER_NAME,
          thumbnailUrl: conf.URL,
          sourceUrl: conf.GURL,
          mediaType: 1,
          showAdAttribution: true
        }
      }
    }, { quoted: quotedContact });
  } catch (error) {
    console.error("GitHub zip error:", error);
    repondre("Failed to fetch GitHub repository.");
  }
});
        
