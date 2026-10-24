"use strict";
/**
 * lib/buttons.js - quick-reply buttons under a message.
 *
 * Three styles (BUTTON_STYLE env var, or the owner command .buttonstyle):
 *
 *   toxic            - the Toxic-MD look: every button is its own rounded button under the message,
 *                      label centred, no arrow icon. A classic "buttonsMessage" sent with relayMessage
 *                      plus the <biz><interactive type="native_flow"> node (what Toxic-MD's ButtonV2 does).
 *   native (default) - buttons stuck to the message with a small reply arrow. An interactiveMessage with
 *                      "quick_reply" native-flow buttons (the way plugins/General/pair.js sends its
 *                      COPY PAIR CODE button).
 *   text             - no buttons: the options are listed as commands to type.
 *
 * Whatever the style, a button tap comes back carrying the button's id; replyId() reads it and the bot
 * treats that id exactly like a typed command.
 *
 * If a style cannot be sent, the next one is tried (toxic -> native -> text), so the options are never lost.
 * If the buttons are accepted by WhatsApp but simply not shown on your phone, switch style with .buttonstyle.
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

// A small built-in picture. The Toxic-style card ALWAYS needs a picture in its header (location header),
// exactly like Toxic-MD's ButtonV2; a card without one is accepted by WhatsApp but never shown.
const FALLBACK_THUMBNAIL = Buffer.from(
  "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",
  "base64"
);

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------
const STYLES = ["toxic", "native", "text"];

// This extra node is what makes WhatsApp show the classic buttons on normal accounts.
const BIZ_NODE = [
  {
    tag: "biz",
    attrs: {},
    content: [
      {
        tag: "interactive",
        attrs: { type: "native_flow", v: "1" },
        content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }],
      },
    ],
  },
];

/** The style in use: the owner's choice (.buttonstyle) first, then the BUTTON_STYLE env var, then "native". */
function currentStyle() {
  let value = process.env.BUTTON_STYLE;
  try {
    const stored = require("./settingsCache").getSetting("BUTTON_STYLE", "");
    if (stored) value = stored;
  } catch (e) { /* settings not available: use the env var */ }
  value = String(value || "native").toLowerCase().trim();
  return STYLES.includes(value) ? value : "native";
}

function plainTextVersion(body, footer, buttons) {
  const lines = buttons.map((b) => `• ${b.id}`);
  return `${body}\n\nType one of these:\n${lines.join("\n")}${footer ? `\n\n${footer}` : ""}`;
}

/** "toxic": a classic buttonsMessage, relayed with the native_flow node (the Toxic-MD ButtonV2 method). */
async function sendToxicStyle(client, jid, { body, footer, buttons, thumbnail, mentions, mybotpic }) {
  const { generateWAMessageFromContent } = require("@whiskeysockets/baileys");
  const contextInfo = {};
  if (mentions && mentions.length) contextInfo.mentionedJid = mentions;

  // Always a picture in the header: the one given, else a random menu picture, else the built-in one.
  const picture = thumbnail || (await defaultThumbnail(mybotpic)) || FALLBACK_THUMBNAIL;

  const msg = generateWAMessageFromContent(
    jid,
    {
      buttonsMessage: {
        contentText: body,
        footerText: footer,
        headerType: 6,
        locationMessage: { degreesLatitude: 0, degreesLongitude: 0, name: "", address: "", jpegThumbnail: picture },
        viewOnce: true,
        contextInfo,
        buttons: buttons.map((b) => ({ buttonId: b.id, buttonText: { displayText: b.text }, type: 1 })),
      },
    },
    { userJid: client.user && client.user.id }
  );
  if (typeof client.rememberSentId === "function") client.rememberSentId(msg.key.id);
  await client.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes: BIZ_NODE });
}

/** "native": an interactiveMessage with quick_reply native-flow buttons (the pair.js way). */
async function sendNativeStyle(client, jid, { body, footer, title, buttons, mentions }) {
  const { generateWAMessageFromContent, proto } = require("@whiskeysockets/baileys");
  const Interactive = proto.Message.InteractiveMessage;

  const interactive = Interactive.create({
    body: Interactive.Body.create({ text: body }),
    footer: Interactive.Footer.create({ text: footer }),
    header: Interactive.Header.create({ title, subtitle: "", hasMediaAttachment: false }),
    ...(mentions && mentions.length ? { contextInfo: { mentionedJid: mentions } } : {}),
    nativeFlowMessage: Interactive.NativeFlowMessage.create({
      buttons: buttons.map((b) => ({
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
  if (typeof client.rememberSentId === "function") client.rememberSentId(msg.key.id);
  await client.relayMessage(jid, msg.message, { messageId: msg.key.id });
}

/**
 * Sends a message with up to 3 buttons.
 *   buttons: [{ text: "shown on the button", id: ".command that runs when it is tapped" }]
 *   style:   optional, overrides the global style ("toxic" | "native" | "text")
 *   thumbnail: optional JPEG Buffer shown at the top (toxic style only)
 * Returns the style that was really used: "toxic", "native" or "text".
 */
async function sendButtons(client, jid, { body, footer = "", buttons, title = "", subtitle = "", mentions = [], thumbnail = null, style, mybotpic } = {}) {
  const list = (buttons || []).slice(0, MAX_BUTTONS);
  const asText = async () => {
    await client.sendMessage(jid, { text: plainTextVersion(body, footer, list), mentions });
    return "text";
  };

  if (!list.length || String(process.env.BUTTONS || "").toLowerCase() === "off") return asText();

  const wanted = STYLES.includes(style) ? style : currentStyle();
  if (wanted === "text") return asText();

  // The chosen style first, then the next ones, so the options are never lost.
  const order = wanted === "toxic" ? ["toxic", "native"] : ["native"];
  const args = { body, footer, title, subtitle, buttons: list, thumbnail, mentions, mybotpic };

  for (const name of order) {
    try {
      if (name === "toxic") await sendToxicStyle(client, jid, args);
      else await sendNativeStyle(client, jid, args);
      return name;
    } catch (e) {
      console.log(`[buttons] "${name}" style could not be sent:`, e && e.message ? e.message : e);
    }
  }
  return asText();
}

module.exports = { sendButtons, replyId, boldFont, makeThumbnail, defaultThumbnail, plainTextVersion, currentStyle, STYLES, MAX_BUTTONS };
