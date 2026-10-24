const { bmbtz } = require("../../devbmb/bmbtz");
const axios = require("axios");

/**
 * lyrics
 *
 * Rewritten to use https://api.nexray.eu.cc/search/lyrics (the old
 * dreaded.site/some-random-api/davidcyriltech endpoints all stopped
 * working). Also fixes two bugs from the previous version:
 *   - `s.PREFIXE` referenced an undefined variable `s` (would throw if
 *     no song name was given) — now uses `prefixe` from commandeOptions.
 *   - `aliases:` isn't a real field the command registry reads (the
 *     correct one is `alias`), so the old aliases never worked — fixed.
 */
bmbtz({
  nomCom: "lyrics",
  reaction: '🎵',
  categorie: "Search",
  alias: ["lyric", "mistari"]
}, async (dest, client, commandeOptions) => {
  const { repondre, arg, ms, prefixe } = commandeOptions;
  const songName = arg.join(" ").trim();

  if (!songName) {
    return repondre(`Please provide a song name. Example: *${prefixe}lyrics Shape of You*`);
  }

  await client.sendMessage(dest, { react: { text: "🔎", key: ms.key } }).catch(() => {});

  let data;
  try {
    const response = await axios.get(
      `https://api.nexray.eu.cc/search/lyrics?q=${encodeURIComponent(songName)}`,
      { timeout: 15000 }
    );
    data = response.data;
  } catch (error) {
    console.log("[lyrics] API request failed:", error.message);
    await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
    return repondre(`❌ Couldn't reach the lyrics service. Try again in a bit.`);
  }

  if (!data?.status || !data?.result) {
    await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
    return repondre(`❌ Couldn't find lyrics for *${songName}*`);
  }

  const { title, artist, thumbnail } = data.result;
  const lyricsInfo = data.result.lyrics || {};
  let lyricsText = lyricsInfo.plain_lyrics;

  if (!lyricsText || lyricsText === "-") {
    // Fall back to synced lyrics with the [mm:ss.xx] timestamps stripped,
    // if that's all the API returned for this track.
    if (lyricsInfo.synced_lyrics && lyricsInfo.synced_lyrics !== "-") {
      lyricsText = lyricsInfo.synced_lyrics.replace(/\[\d{2}:\d{2}\.\d{2}\]\s?/g, "");
    }
  }

  if (!lyricsText || lyricsText === "-") {
    await client.sendMessage(dest, { react: { text: "❌", key: ms.key } }).catch(() => {});
    return repondre(`🎶 *${title}* - ${artist}\n\n(No lyrics text available for this track — only metadata was found.)`);
  }

  const caption = `🎶 *${title}* - ${artist}\n\n${lyricsText}\n\n*Powered by BMB-TECH*`;
  const imageUrl = thumbnail && thumbnail !== "-" ? thumbnail : "https://files.catbox.moe/rpea5k.jpg";

  try {
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 15000 });
    const imageBuffer = Buffer.from(imageResponse.data);

    await client.sendMessage(dest, {
      image: imageBuffer,
      caption,
      contextInfo: {
        externalAdReply: {
          title: "BMB-TECH Lyrics Finder",
          body: "Get any song lyrics instantly",
          thumbnail: imageBuffer,
          mediaType: 1,
          renderLargerThumbnail: false,
        }
      }
    }, { quoted: ms });

    await client.sendMessage(dest, { react: { text: "✅", key: ms.key } }).catch(() => {});
  } catch (error) {
    console.log("[lyrics] image send failed, falling back to text:", error.message);
    await repondre(caption.length > 4000 ? caption.slice(0, 4000) + "\n\n*[Truncated]*" : caption);
    await client.sendMessage(dest, { react: { text: "✅", key: ms.key } }).catch(() => {});
  }
});
