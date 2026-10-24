"use strict";
/**
 * lib/chatbot.js - BMB-TECH AI Chatbot (ported from NOVA-XMD features/autoai.js)
 *
 *  - AUTOAI on     : replies to every DM, and in groups when mentioned (@) or replied to
 *  - CHATBOTPM on  : replies to DMs only (never in groups)
 *  - both off      : replies only to numbers added with .allow
 *  - Understands images (vision), documents, stickers, voice notes, polls
 *  - If the AI decides a message is a command (CMD:play ...), the bot runs it itself
 *  - Keys are used one at a time through lib/groq.js + keys.js
 */
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const groq = require("./groq");
const mem = require("./aiMemory");
const { getSetting } = require("./settingsCache");

// ---------------------------------------------------------------------
// Allowed numbers list (stored in the settings DB under AI_ALLOWED)
// ---------------------------------------------------------------------
function getAllowed() {
  return String(getSetting("AI_ALLOWED", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
}

// A switch (AUTOAI / CHATBOTPM) is read from the settings DB first. If it was
// never set there, the environment variable of the same name is the default
// (e.g. AUTOAI=on in Heroku Config Vars). This matters on hosts with an
// ephemeral disk, where the JSON database is wiped on every restart.
function getFlag(key) {
  const def = String(process.env[key] || "off");
  return String(getSetting(key, def)).toLowerCase() === "on";
}

// Set CHATBOT_DEBUG=off to silence the diagnostic logs below.
const DEBUG = String(process.env.CHATBOT_DEBUG || "on").toLowerCase() !== "off";
function dbg(msg) { if (DEBUG) console.log("[CHATBOT] " + msg); }
let _warnedSelf = false;

// ---------------------------------------------------------------------
// Commands the AI is allowed to run (only ones that really exist in BMB-TECH).
// Dangerous owner commands (restart, kickall, block, mode, boom ...) are NOT in this list.
// ---------------------------------------------------------------------
const RUNNABLE = new Set([
  "menu", "menu1", "ping", "alive", "uptime", "owner", "repo", "profile", "info", "url", "jid", "groupid", "vv",
  "play", "song", "video", "youtube", "tiktok", "instagram", "facebook", "fb", "pinterest", "apk", "img",
  "lyrics", "movie", "weather", "npm", "github", "screenshot", "short",
  "sticker", "take", "photo", "write", "trt", "fancy", "say",
  "tagall", "hidetag", "tagadmin", "add", "remove", "promote", "demote", "link", "revoke", "close", "open",
  "gname", "gdesc", "del",
  "gpt", "chat", "groq", "gemini", "vision", "aicode", "stt", "imagine", "sora",
]);

const COMMAND_CATALOG = `COMMANDS (exact names):
MEDIA: play <song> | song <song> | video <name> | youtube <url> | tiktok <url> | instagram <url> | facebook <url> | pinterest <q> | apk <app> | img <q>
AI: gpt <prompt> | groq <prompt> | gemini <prompt> | imagine <prompt> | sora <prompt> | vision | aicode <lang> <prompt> | stt
EDIT: sticker | take <pack> | photo | write <text> | trt <lang> | fancy <n> <text> | say <text>
SEARCH: lyrics <song> | movie <title> | weather <city> | npm <pkg> | github <user> | screenshot <url> | short <url>
GENERAL: menu | ping | alive | uptime | owner | repo | profile | info | url | jid | vv
GROUP: tagall [msg] | hidetag [msg] | tagadmin | add <num> | remove @user | promote @user | demote @user | link | revoke | close | open | gname <name> | gdesc <desc> | groupid | del`;

const SYSTEM_PROMPT = `You are BMB-TECH AI, a friendly and polite WhatsApp assistant created by bmb tech.

===RULES===
1. When the user's request matches a bot command, output EXACTLY ONE LINE that starts with CMD: and nothing else. Format: CMD:<command> <args>
2. For normal conversation, reply with text only. Never include a CMD: line.
3. Never put text and a CMD: line in the same response. Pick one.
4. Never narrate what you are doing (no "Running...", no "Here is the command").
5. Always be polite, warm and respectful. Never insult, mock, roast or tease the user. No swearing, no rude words, no sarcasm.
6. Keep replies short and clear: 1 to 3 sentences for normal chat. Be longer only when the answer really needs it.
7. Plain text only: no markdown, no asterisks, no headings. Use an emoji now and then when it feels natural, not in every message.
8. IDENTITY: your name is BMB-TECH AI and you were created by bmb tech. If anyone asks who you are, what your name is, who made you, or which model or company is behind you, answer that you are BMB-TECH AI, created by bmb tech. Never say you are ChatGPT, OpenAI, Google, Gemini, Meta, Llama, Qwen, Groq or any other model or company.
9. LANGUAGE: always reply in the same language the user writes in. If the user writes Swahili, reply in correct, natural Swahili only (do not mix English words into Swahili sentences, except common technical terms). If the user writes English, reply in English. Do the same for French, Arabic, Hindi and every other language.
10. If you do not know something, say so honestly and offer to help in another way.

STYLE GUIDE:
- If the user just says hello, greet them back warmly and offer to help.
- If the user greets you in Swahili, greet back in Swahili and ask how you can help, written entirely in Swahili.
- If the user asks your name in any language, answer in that same language: your name is BMB-TECH AI and you were created by bmb tech.
- If the user says they are fine, be glad for them in their own language and ask whether they need anything.
- Never repeat or mock what the user wrote. Just answer helpfully.

COMMAND MAPPING (STRICT):
- "menu" / "help" / "show commands" / "what can you do" → CMD:menu
- "ping" / "speed test" → CMD:ping
- "alive" / "are you there" → CMD:alive
- "uptime" → CMD:uptime
- "sticker" / "make sticker" → CMD:sticker
- "play <song>" → CMD:play <song>
- "download tiktok <url>" → CMD:tiktok <url>
- "download youtube <url>" → CMD:youtube <url>
- "download instagram <url>" → CMD:instagram <url>
- "download facebook <url>" → CMD:facebook <url>
- "generate image of X" / "draw X" / "imagine X" → CMD:imagine X
- "weather in X" / "weather X" → CMD:weather X
- "lyrics of X" / "lyrics X" → CMD:lyrics X
- "translate" → CMD:trt <2-letter-code>  (only works as a reply to a text message)
  CODES: ja=Japanese, es=Spanish, fr=French, de=German, zh=Chinese, ar=Arabic, hi=Hindi, ko=Korean, ru=Russian, pt=Portuguese, sw=Swahili
- "change group name to X" → CMD:gname X
- "change group description to X" → CMD:gdesc X
- "tag everyone" / "mention all" → CMD:tagall
- "kick @user" / "remove @user" → CMD:remove @user
- "promote @user" → CMD:promote @user
- "demote @user" → CMD:demote @user
- "group link" → CMD:link
- "close group" → CMD:close
- "open group" → CMD:open
- "add <number>" → CMD:add <number>
- "shorten <url>" → CMD:short <url>

FULL COMMAND LIST:
${COMMAND_CATALOG}`;

// ---------------------------------------------------------------------
const ALL_PREFIXES = [".", "!", "#", "/", "$", "?", "+", "-", "*", "~", "%", "&", "^", "=", "|"];
const META_KEYS = new Set(["messageContextInfo", "senderKeyDistributionMessage", "messageSecret"]);
const SKIP_TYPES = new Set([
  "videoMessage", "reactionMessage", "protocolMessage", "keepInChatMessage",
  "encReactionMessage", "senderKeyDistributionMessage", "messageContextInfo",
]);

function num(jid) { return String(jid || "").split("@")[0].split(":")[0]; }

function extractCmds(text) {
  const cmds = [];
  const rest = [];
  for (const line of String(text || "").split("\n")) {
    const t = line.trim();
    if (/^CMD:/i.test(t)) {
      const c = t.replace(/^CMD:/i, "").trim();
      if (c) cmds.push(c);
    } else rest.push(line);
  }
  return { cmds, textOnly: rest.join("\n").trim() };
}

function boxWrap(text) {
  return `🤖 *BMB-AI*\n━━━━━━━━━━━━━━━━\n${String(text).trim()}\n━━━━━━━━━━━━━━━━\n© bmb tech`;
}

async function downloadBuf(inner, type) {
  try {
    const stream = await downloadContentFromMessage(inner, type);
    const chunks = [];
    for await (const ch of stream) chunks.push(ch);
    return Buffer.concat(chunks);
  } catch { return null; }
}

async function runCmd(ctx, cmdStr) {
  const { client, origineMessage, commandeOptions } = ctx;
  const { cm } = require("../devbmb/bmbtz");
  const parts = cmdStr.trim().split(/\s+/);
  const name = (parts[0] || "").toLowerCase();
  const args = parts.slice(1);
  const cd = cm.find((c) => c.nomCom === name || (Array.isArray(c.alias) && c.alias.includes(name)));
  if (!cd || !RUNNABLE.has(cd.nomCom)) return { ok: false, notFound: true, name };
  try {
    await cd.fonction(origineMessage, client, { ...commandeOptions, arg: args });
    return { ok: true, name };
  } catch (e) {
    console.log("[CHATBOT] cmd error:", name, e.message);
    return { ok: false, name };
  }
}

/**
 * handleMessage - called from index.js for every incoming message.
 */
async function handleMessage(ctx) {
  const { client, ms, texte, origineMessage, auteurMessage, verifGroupe, idBot, superUser } = ctx;
  if (!ms || !ms.message) return;
  if (ctx.isCommand) return; // already being handled as a command (with or without prefix)
  if (ms.key.fromMe) {
    // Messages sent from the bot's own WhatsApp account (including the bot's own
    // replies) are ignored on purpose - otherwise the bot would answer itself forever.
    if (!_warnedSelf && !verifGroupe && texte) {
      _warnedSelf = true;
      dbg("ignoring messages sent from the bot's own number. Test the chatbot from a DIFFERENT WhatsApp number.");
    }
    return;
  }
  if (!origineMessage || origineMessage === "status@broadcast" || origineMessage.endsWith("@newsletter") || origineMessage.endsWith("@broadcast")) return;
  if (!groq.hasKeys()) { dbg("skipped: no GROQ API keys found (check keys.js / GROQ_KEY_1 env var)."); return; }

  const autoai = getFlag("AUTOAI");
  const chatbotpm = getFlag("CHATBOTPM");
  const senderNum = num(auteurMessage);

  if (!autoai && !chatbotpm) {
    if (!getAllowed().includes(senderNum)) {
      if (!verifGroupe) dbg(`skipped DM from ${senderNum}: chatbot is OFF. Send .autoai on (or .chatbotpm on, or .allow ${senderNum}).`);
      return;
    }
  } else if (!autoai && chatbotpm && verifGroupe) {
    return;
  }

  // Respect the bot mode (private) and user / group bans
  if (!superUser) {
    if (require("./ownerAccess").modeBlocks(getSetting("MODE", "on"), verifGroupe)) { dbg("skipped: bot mode does not allow this chat for non-owners."); return; }
    try {
      if (verifGroupe && (await require("./banGroup").isGroupBanned(origineMessage))) return;
      if (await require("./banUser").isUserBanned(auteurMessage)) return;
    } catch {}
  }

  const raw = ms.message;
  const msgType = Object.keys(raw).find((k) => !META_KEYS.has(k)) || Object.keys(raw)[0] || "";
  if (SKIP_TYPES.has(msgType) || raw.videoMessage) return;

  // Group: the bot must be mentioned or replied to
  if (verifGroupe) {
    const botNum = num(idBot);
    const botLid = num(client.user?.lid || "");
    const isBot = (j) => { const n = num(j); return !!n && (n === botNum || (botLid && n === botLid)); };
    const ctxInfo = raw[msgType]?.contextInfo || raw.extendedTextMessage?.contextInfo || {};
    const mentioned = ctxInfo.mentionedJid || [];
    const body = texte || "";
    const byBody = (botNum.length > 4 && body.includes("@" + botNum)) || (botLid.length > 4 && body.includes("@" + botLid));
    const byList = mentioned.some(isBot);
    const replyToBot = isBot(ctxInfo.participant);
    if (!byBody && !byList && !replyToBot) return;
  }

  const textContent = (
    raw.conversation ||
    raw.extendedTextMessage?.text ||
    raw.imageMessage?.caption ||
    raw.documentMessage?.caption ||
    raw.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    texte || ""
  ).trim();

  // Normal prefixed commands are handled by the command handler, not the chatbot
  if (textContent && ALL_PREFIXES.some((p) => textContent.startsWith(p))) return;

  // Clear memory
  if (textContent && /^(clear|reset|wipe|delete|flush|erase)\s*(this\s*)?(conv(ersation)?|chat|hist(ory)?|messages?|thread|memory|mem)$/i.test(textContent)) {
    mem.clearHistory(senderNum);
    client.sendMessage(origineMessage, { react: { text: "🗑️", key: ms.key } }).catch(() => {});
    await client.sendMessage(origineMessage, { text: boxWrap("Done! I have cleared our conversation history 🗑️ Let's start fresh.") });
    return;
  }

  const imageMsg = raw.imageMessage || null;
  const docMsg = raw.documentMessage || raw.documentWithCaptionMessage?.message?.documentMessage || null;
  let userContent;
  let useVision = false;
  let noCmd = false;

  if (imageMsg) {
    useVision = true;
    const buf = await downloadBuf(imageMsg, "image");
    if (buf && buf.length) {
      const mime = imageMsg.mimetype || "image/jpeg";
      userContent = [
        { type: "text", text: textContent || "What do you see in this image?" },
        { type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}` } },
      ];
    } else {
      userContent = textContent || "Describe this image";
      useVision = false;
    }
  } else if (docMsg) {
    const fname = docMsg.fileName || "document";
    userContent = textContent ? `[Document: "${fname}"] ${textContent}` : `[Document: "${fname}"] Help me with this.`;
  } else if (textContent) {
    userContent = textContent;
  } else if (raw.stickerMessage) {
    noCmd = true;
    userContent = "[The user sent a sticker — respond naturally, do NOT output CMD:]";
  } else if (raw.audioMessage) {
    noCmd = true;
    userContent = "[The user sent a voice note or audio message]";
  } else if (raw.pollCreationMessage || raw.pollCreationMessageV3) {
    noCmd = true;
    const poll = raw.pollCreationMessage || raw.pollCreationMessageV3;
    userContent = poll ? `[A poll was created: "${poll.name || "Poll"}"]` : "[The user created a poll]";
  } else {
    return;
  }

  dbg(`replying to ${senderNum}${verifGroupe ? " in group" : " (DM)"}`);
  client.sendMessage(origineMessage, { react: { text: "🤖", key: ms.key } }).catch(() => {});

  const history = mem.getHistory(senderNum).slice(-16);
  const base = [{ role: "system", content: SYSTEM_PROMPT }, ...history];
  let response = null;

  try {
    if (useVision) {
      try {
        response = await groq.chat({
          models: groq.visionModels(),
          messages: [...base, { role: "user", content: userContent }],
          max_tokens: 500, temperature: 0.7, timeoutMs: 25000,
        });
      } catch (e) {
        if (e.code === "NO_KEYS" || e.code === "ALL_KEYS_EXHAUSTED") throw e;
      }
      if (!response) {
        const fb = textContent
          ? `[The user sent an image with this caption: "${textContent}". Vision is unavailable, acknowledge you got the image and respond to the caption.]`
          : `[The user sent an image but vision is unavailable. Acknowledge you received their image and tell them to try the .vision command.]`;
        response = await groq.chat({ models: groq.fastModels(), messages: [...base, { role: "user", content: fb }], max_tokens: 300, timeoutMs: 20000 });
      }
    } else {
      response = await groq.chat({
        models: groq.fastModels(),
        messages: [...base, { role: "user", content: userContent }],
        max_tokens: 300, temperature: 0.7, timeoutMs: 20000,
      });
    }
  } catch (e) {
    console.log("[CHATBOT] AI error:", e.code || "", e.message);
    client.sendMessage(origineMessage, { react: { text: "❌", key: ms.key } }).catch(() => {});
    // The owner gets the real reason in the chat; everyone else only sees the reaction.
    if (superUser) {
      client.sendMessage(origineMessage, { text: boxWrap(`AI request failed.\n${String(e.message).slice(0, 300)}\n\nOwner tip: send .aikeys test`) }, { quoted: ms }).catch(() => {});
    }
    return;
  }
  if (!response) {
    client.sendMessage(origineMessage, { react: { text: "❌", key: ms.key } }).catch(() => {});
    return;
  }

  const histUser = typeof userContent === "string" ? userContent : textContent || "[media]";
  const { cmds: rawCmds, textOnly } = extractCmds(response);
  const cmds = noCmd ? [] : rawCmds;

  if (cmds.length) {
    mem.addMessage(senderNum, "user", histUser);
    mem.addMessage(senderNum, "assistant", `[Executed: ${cmds.map((c) => c.split(/\s+/)[0]).join(", ")}]`);
    let allOk = true;
    const notFound = [];
    for (const c of cmds) {
      const r = await runCmd(ctx, c);
      if (!r.ok) { allOk = false; if (r.notFound) notFound.push(r.name); }
    }
    if (notFound.length) {
      client.sendMessage(origineMessage, { text: boxWrap(`Sorry, I don't have a command called ${notFound.join(", ")}. Type .menu to see the available commands.`) }).catch(() => {});
    }
    client.sendMessage(origineMessage, { react: { text: allOk ? "✅" : "❌", key: ms.key } }).catch(() => {});
    if (textOnly) client.sendMessage(origineMessage, { text: textOnly }, { quoted: ms }).catch(() => {});
  } else {
    mem.addMessage(senderNum, "user", histUser);
    mem.addMessage(senderNum, "assistant", response);
    await client.sendMessage(origineMessage, { text: response }, { quoted: ms });
    client.sendMessage(origineMessage, { react: { text: "✅", key: ms.key } }).catch(() => {});
  }
}

module.exports = { handleMessage, getAllowed, getFlag };
