"use strict";
/**
 * lib/noPrefix.js - lets people run commands WITHOUT the prefix ("menu" works like ".menu").
 *
 * Modes (setting NOPREFIX, or the NOPREFIX env var; default "on"):
 *   on    - EVERYONE can run ANY command without the prefix, in groups and in private chats
 *   inbox - everyone, but only in private chats (groups still need the prefix)
 *   owner - only the owner / sudo users, everywhere
 *   off   - prefix always required
 *
 * A command typed without the prefix behaves exactly like the prefixed one: the command itself
 * still decides who may use it (admin-only, owner-only ...) and answers accordingly.
 *
 * Rules that keep normal chatting from triggering commands by accident:
 *   - the FIRST word of the message must be exactly a command name or alias
 *   - the message may have at most MAX_WORDS words (use the prefix for longer ones)
 *   - messages that the bot itself sent are never treated as commands (so it can not trigger itself);
 *     messages the owner types by hand on the bot's own WhatsApp account DO work
 *   - messages written by other bots are ignored
 */
const MAX_WORDS = 12;

const TEXT_TYPES = new Set(["conversation", "extendedTextMessage", "imageMessage", "videoMessage"]);

function normalizeMode(value) {
  const v = String(value == null ? "" : value).toLowerCase().trim();
  if (v === "on" || v === "yes" || v === "true" || v === "all") return "on";
  if (v === "inbox" || v === "dm" || v === "pm" || v === "private") return "inbox";
  if (v === "owner" || v === "sudo") return "owner";
  if (v === "off" || v === "no" || v === "false") return "off";
  return "on";
}

/** Setting value first, then the NOPREFIX env var, then the default ("on"). */
function resolveMode(storedValue) {
  const raw = storedValue != null && storedValue !== "" ? storedValue : process.env.NOPREFIX;
  return normalizeMode(raw);
}

function findCommand(commands, word) {
  return (commands || []).find(
    (c) => c.nomCom === word || (Array.isArray(c.alias) && c.alias.includes(word))
  );
}

/**
 * Returns the command word to run (e.g. "play"), or "" when the message is a normal chat message.
 *
 * ownMessageAllowed: true only for a message sent from the bot's own account that was typed by a
 * person (not sent by the bot). See lib/ownMessageGuard.js.
 */
function detect({ text, mtype, key, commands, mode, isGroup, superUser, ownMessageAllowed }) {
  const m = normalizeMode(mode);
  if (m === "off") return "";
  if (!text || !TEXT_TYPES.has(mtype)) return "";
  if (key && key.fromMe && !ownMessageAllowed) return "";
  if (key && typeof key.id === "string" && key.id.length === 16 && (key.id.startsWith("BAE5") || key.id.startsWith("BAES"))) return "";

  const words = String(text).trim().split(/\s+/);
  if (!words[0] || words.length > MAX_WORDS) return "";
  const first = words[0].toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(first)) return "";

  if (!findCommand(commands, first)) return "";

  if (m === "owner" && !superUser) return "";
  if (m === "inbox" && isGroup && !superUser) return "";

  return first;
}

module.exports = { detect, resolveMode, normalizeMode, MAX_WORDS };
