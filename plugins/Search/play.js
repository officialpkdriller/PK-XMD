const { bmbtz } = require("../../devbmb/bmbtz");
const axios = require('axios');
const yts = require('yt-search');

const BOT_NAME = 'BMB-TECH'; // Change as you want
const NEWSLETTER_JID = '120363382023564830@newsletter';
const NEWSLETTER_NAME = 'Bmb Tech Info';

const API_BASE = 'https://apiziaul.vercel.app/api/downloader';
const API_TIMEOUT_MS = 30000;

/**
 * What the user sees (2 messages, nothing else):
 *   1. the picture with the details, sent as soon as the YouTube search is done
 *   2. the song / video itself
 *
 * To make it fast, the request that fetches the download link is started at the same time as
 * the search (audio) or at the same time as the caption is sent (video), instead of one after another.
 */

const buildCaption = (type, video) => {
  const banner = type === "video" ? `${BOT_NAME} VIDEO PLAYER` : `${BOT_NAME} SONG PLAYER`;
  return (
    `*${banner}*\n\n` +
    `╭───────────────◆\n` +
    `│⿻ *Title:* ${video.title}\n` +
    `│⿻ *Duration:* ${video.timestamp || 'LIVE'}\n` +
    `│⿻ *Views:* ${Number(video.views || 0).toLocaleString()}\n` +
    `│⿻ *Uploaded:* ${video.ago || '-'}\n` +
    `│⿻ *Channel:* ${(video.author && video.author.name) || '-'}\n` +
    `╰────────────────◆\n\n` +
    `🔗 ${video.url}`
  );
};

// getContextInfo takes the query and the bot name, and includes body and title
const getContextInfo = (query = '', botName = BOT_NAME) => ({
  forwardingScore: 1,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: NEWSLETTER_NAME,
    serverMessageId: -1
  },
  body: query ? `Requested song: ${query}` : undefined,
  title: botName
});

/** Asks the download API for a link. One retry, because this API sometimes fails on the first try. */
async function fetchDownloadLink(endpoint, params) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await axios.get(`${API_BASE}/${endpoint}`, { params, timeout: API_TIMEOUT_MS });
      const data = response && response.data;
      if (data && data.status && data.result && data.result.downloadUrl) return data.result;
      lastError = new Error('The download API did not return a link.');
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** Starts a request now and makes sure an early failure can never crash the bot while we wait for the search. */
function startEarly(promiseFactory) {
  const promise = promiseFactory();
  promise.catch(() => {});
  return promise;
}

const text = (client, to, ms, message) =>
  client.sendMessage(to, { text: message, contextInfo: getContextInfo() }, { quoted: ms });

/**
 * One implementation for the three commands.
 *   kind "audio"    -> .play  (audio message)
 *   kind "document" -> .song  (audio as a file)
 *   kind "video"    -> .video (mp4)
 */
function registerCommand({ nomCom, reaction, kind, askText, label }) {
  bmbtz(
    { nomCom, categorie: "Search", reaction },
    async (origineMessage, client, commandeOptions) => {
      const { ms, arg } = commandeOptions;
      const query = arg.join(' ');
      if (!query) return text(client, origineMessage, ms, askText);

      try {
        // Audio: the API takes the search words, so it can start at the same moment as the search.
        const audioLinkEarly = kind !== 'video'
          ? startEarly(() => fetchDownloadLink('ytplaymp3', { query }))
          : null;

        const search = await yts(query);
        const video = search.videos[0];
        if (!video) return text(client, origineMessage, ms, 'No results found for your query.');

        // Video: the API needs the YouTube link, so it starts right after the search...
        const videoLinkEarly = kind === 'video'
          ? startEarly(() => fetchDownloadLink('ytmp4', { url: video.url }))
          : null;

        // ...while the picture with the details is already on its way.
        await client.sendMessage(
          origineMessage,
          {
            image: { url: video.thumbnail },
            caption: buildCaption(kind === 'video' ? 'video' : (kind === 'document' ? 'song' : 'audio'), video),
            contextInfo: getContextInfo(kind === 'audio' ? query : '')
          },
          { quoted: ms }
        );

        let result;
        try {
          result = await (audioLinkEarly || videoLinkEarly);
        } catch (err) {
          console.error(`[${nomCom.toUpperCase()}] download link error:`, err && err.message ? err.message : err);
          return text(client, origineMessage, ms, `Failed to retrieve the ${label} download link.`);
        }

        const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '');
        const downloadUrl = result.downloadUrl;

        if (kind === 'audio') {
          const fileName = `${result.title || safeTitle}.mp3`;
          await client.sendMessage(
            origineMessage,
            {
              audio: { url: downloadUrl },
              mimetype: 'audio/mpeg',
              fileName,
              title: BOT_NAME,
              body: `Requested song :${query}`,
              image: { url: video.thumbnail, renderSmallThumbnail: true },
              contextInfo: getContextInfo()
            },
            { quoted: ms }
          );
        } else if (kind === 'document') {
          const fileName = `${result.title || safeTitle}.mp3`;
          await client.sendMessage(
            origineMessage,
            { document: { url: downloadUrl }, mimetype: 'audio/mpeg', fileName },
            { quoted: ms }
          );
        } else {
          const fileName = `${result.title || result.filename || safeTitle}.mp4`;
          await client.sendMessage(
            origineMessage,
            { video: { url: downloadUrl }, mimetype: 'video/mp4', fileName },
            { quoted: ms }
          );
        }
      } catch (err) {
        console.error(`[${nomCom.toUpperCase()}] Error:`, err);
        await text(client, origineMessage, ms, 'An error occurred while processing your request.');
      }
    }
  );
}

// PLAY COMMAND (audio)
registerCommand({ nomCom: "play", reaction: "🎵", kind: "audio", askText: 'Please provide a song name or keyword.', label: 'MP3' });

// SONG COMMAND (audio as document)
registerCommand({ nomCom: "song", reaction: "🎶", kind: "document", askText: 'Please provide a song name or keyword.', label: 'MP3' });

// VIDEO COMMAND (mp4)
registerCommand({ nomCom: "video", reaction: "🎬", kind: "video", askText: 'Please provide a video name or keyword.', label: 'MP4' });
