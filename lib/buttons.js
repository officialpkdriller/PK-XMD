"use strict";
/**
 * lib/buttons.js - quick-reply buttons under a message.
 *
 * The buttons are sent the SAME way plugins/General/pair.js sends its "COPY PAIR CODE" button, which is
 * known to display on this bot: an interactiveMessage with a native-flow button list, wrapped in a
 * viewOnceMessage and sent with relayMessage. Every button here is a "quick_reply" button.
 *
 * When a person taps a button, WhatsApp sends back an answer that carries the button's id.
 * replyId() reads it, and the bot treats that id exactly like a typed command.
 *
 * If the buttons cannot be sent, the same message is sent as plain text that lists the commands to type,
 * so nobody is ever left without the options.
 */
const fs = require("fs");
const path = require("path");

let sharp = null;
try { sharp = require("sharp"); } catch (e) { sharp = null; }

const MAX_BUTTONS = 3;
const THUMB_SIZE = 300;


// ---------------------------------------------------------------------------
// Fancy bold letters for button labels (same style as Toxic-MD): "Antilink" -> "𝐀𝐧𝐭𝐢𝐥𝐢𝐧𝐤"
// ---------------------------------------------------------------------------
function boldFont(text) {
  return String(text).replace(/[A-Za-z0-9]/g, (ch) => {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(0x1d400 + (c - 65));
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1d41a + (c - 97));
    if (c >= 48 && c <= 57) return String.fromCodePoint(0x1d7ce + (c - 48));
    return ch;
  });
}

// ---------------------------------------------------------------------------
// Reading the answer when a person taps a button / list row
// ---------------------------------------------------------------------------
function unwrap(message) {
  let m = message || {};
  for (let i = 0; i < 4; i++) {
    const inner =
      (m.ephemeralMessage && m.ephemeralMessage.message) ||
      (m.viewOnceMessage && m.viewOnceMessage.message) ||
      (m.deviceSentMessage && m.deviceSentMessage.message) ||
      (m.documentWithCaptionMessage && m.documentWithCaptionMessage.message);
    if (!inner) break;
    m = inner;
  }
  return m;
}

/** The id of the tapped button, or "" when the message is not a button answer. */
function replyId(message) {
  const m = unwrap(message);
  if (m.buttonsResponseMessage && m.buttonsResponseMessage.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId;
  if (m.templateButtonReplyMessage && m.templateButtonReplyMessage.selectedId) return m.templateButtonReplyMessage.selectedId;
  if (m.listResponseMessage && m.listResponseMessage.singleSelectReply && m.listResponseMessage.singleSelectReply.selectedRowId) {
    return m.listResponseMessage.singleSelectReply.selectedRowId;
  }
  const flow = m.interactiveResponseMessage && m.interactiveResponseMessage.nativeFlowResponseMessage;
  if (flow && flow.paramsJson) {
    try {
      const parsed = typeof flow.paramsJson === "string" ? JSON.parse(flow.paramsJson) : flow.paramsJson;
      if (parsed && parsed.id) return String(parsed.id);
    } catch (e) { /* not JSON */ }
  }
  return "";
}

// ---------------------------------------------------------------------------
// Picture for the header
// ---------------------------------------------------------------------------
const thumbCache = new Map();

/** Any image (Buffer, file path or http link) -> small JPEG thumbnail, or null. */
async function makeThumbnail(source) {
  if (!source || !sharp) return null;
  const cacheKey = Buffer.isBuffer(source) ? null : String(source);
  if (cacheKey && thumbCache.has(cacheKey)) return thumbCache.get(cacheKey);
  try {
    let buffer = source;
    if (!Buffer.isBuffer(source)) {
      if (/^https?:\/\//i.test(source)) {
        const res = await fetch(source, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        buffer = fs.readFileSync(source);
      }
    }
    const thumb = await sharp(buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "center" })
      .jpeg({ quality: 70 })
      .toBuffer();
    if (cacheKey) {
      thumbCache.set(cacheKey, thumb);
      if (thumbCache.size > 12) thumbCache.delete(thumbCache.keys().next().value);
    }
    return thumb;
  } catch (e) {
    return null;
  }
}

/** A random picture from plugins/scs, else the bot picture link (mybotpic), as a thumbnail. */
async function defaultThumbnail(mybotpic) {
  try {
    const dir = path.join(__dirname, "..", "plugins", "scs");
    const files = fs.readdirSync(dir).filter((f) => /^menu\d+\.(jpg|jpeg|png)$/i.test(f));
    if (files.length) {
      const picked = path.join(dir, files[Math.floor(Math.random() * files.length)]);
      const thumb = await makeThumbnail(picked);
      if (thumb) return thumb;
    }
  } catch (e) { /* use the link below */ }
  try {
    const url = typeof mybotpic === "function" ? mybotpic() : "";
    if (url) return await makeThumbnail(url);
  } catch (e) { /* no picture */ }
  return null;
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------
function plainTextVersion(body, footer, buttons) {
  const lines = buttons.map((b) => `• ${b.id}`);
  return `${body}\n\nType one of these:\n${lines.join("\n")}${footer ? `\n\n${footer}` : ""}`;
}

/**
 * Sends a message with up to 3 buttons.
 *   buttons: [{ text: "shown on the button", id: ".command that runs when it is tapped" }]
 * Returns "buttons" when the buttons were sent, or "text" when the plain-text version had to be used.
 */
async function sendButtons(client, jid, { body, footer = "", buttons, title = "", mentions = [] } = {}) {
  const list = (buttons || []).slice(0, MAX_BUTTONS);
  const asText = () => client.sendMessage(jid, { text: plainTextVersion(body, footer, list), mentions });

  if (!list.length || String(process.env.BUTTONS || "").toLowerCase() === "off") {
    await asText();
    return "text";
  }

  try {
    const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
    const Interactive = proto.Message.InteractiveMessage;

    const interactive = Interactive.create({
      body: Interactive.Body.create({ text: body }),
      footer: Interactive.Footer.create({ text: footer }),
      header: Interactive.Header.create({ title, subtitle: "", hasMediaAttachment: false }),
      ...(mentions && mentions.length ? { contextInfo: { mentionedJid: mentions } } : {}),
      nativeFlowMessage: Interactive.NativeFlowMessage.create({
        buttons: list.map((b) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id }),
        })),
      }),
    });

    const content = {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: interactive,
        },
      },
    };

    const msg = generateWAMessageFromContent(jid, content, {});

    // The bot must recognise its own copy of this message and never run it as a command.
    if (typeof client.rememberSentId === "function") client.rememberSentId(msg.key.id);

    await client.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return "buttons";
  } catch (e) {
    console.log("[buttons] could not send buttons, sending plain text instead:", e && e.message ? e.message : e);
    await asText();
    return "text";
  }
}

module.exports = { sendButtons, replyId, boldFont, makeThumbnail, defaultThumbnail, plainTextVersion, MAX_BUTTONS };
