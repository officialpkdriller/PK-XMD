"use strict";
/**
 * lib/ownerAccess.js - who is the owner, and what the bot mode allows.
 * Works like NOVA-XMD: the owner can do everything, in every chat, in every mode.
 *
 * Two kinds of "full owner" exist, and both can switch the bot between modes:
 *   - the bot's own WhatsApp number
 *   - the creator / developer number (DEV_NUMBER in index.js)
 *   - any number listed in the OWNER_NUMBER or NUMERO_OWNER env var (comma separated)
 * Sudo users (added with .addsudo) get the same command access, but cannot add or
 * remove other sudo users.
 */
const { resolveLidToJid, cacheLidPhone, resolveLidForStatus } = require("./lidResolver");

/** "255712345678:12@s.whatsapp.net" -> "255712345678" */
function digits(v) {
  return String(v || "").split("@")[0].split(":")[0].replace(/\D/g, "");
}

function toJid(num) {
  const d = digits(num);
  return d ? d + "@s.whatsapp.net" : "";
}

/**
 * Turns "255712345678, +255 700 000 000" (or several values) into a Set of digit strings.
 * Numbers can be separated by commas / semicolons; a list separated only by spaces also works
 * when every piece looks like a full phone number.
 */
function numberSet(...values) {
  const out = new Set();
  for (const v of values) {
    String(v || "")
      .split(/[,;\n]+/)
      .forEach((part) => {
        const tokens = part.trim().split(/\s+/).filter(Boolean);
        if (tokens.length > 1 && tokens.every((t) => digits(t).length >= 9)) {
          tokens.forEach((t) => out.add(digits(t)));
        } else {
          const d = digits(part);
          if (d.length >= 6) out.add(d);
        }
      });
  }
  return out;
}

/**
 * Groups often send the sender as "<number>@lid". Convert it to the real phone
 * number JID using the cache, then the group participant list.
 */
function resolveSenderJid(senderJid, participants) {
  if (!senderJid || !String(senderJid).endsWith("@lid")) return senderJid;
  const cached = resolveLidToJid(senderJid);
  if (cached && cached !== senderJid) return cached;

  const lidNum = digits(senderJid);
  for (const p of participants || []) {
    const ids = [p.id, p.lid, p.jid].filter(Boolean);
    if (!ids.some((x) => String(x).endsWith("@lid") && digits(x) === lidNum)) continue;
    const pn = p.phoneNumber || p.jid || (p.id && !String(p.id).endsWith("@lid") ? p.id : "");
    const pnDigits = digits(pn);
    if (pnDigits && !String(pn).endsWith("@lid")) {
      try { cacheLidPhone(lidNum, pnDigits); } catch {}
      return pnDigits + "@s.whatsapp.net";
    }
  }
  return senderJid;
}

// LIDs that could not be resolved are remembered for a while so the bot does not keep retrying.
const _failedLids = new Map();
const FAIL_TTL_MS = 10 * 60 * 1000;

/**
 * Same as resolveSenderJid, but also asks WhatsApp when the cache and participant list are not enough.
 *   - In a DM it uses the full resolver (cache, WhatsApp mapping, database, group scan).
 *   - In a group it only uses the cheap WhatsApp mapping, so busy groups never trigger heavy scans.
 */
async function resolveSenderAsync(client, senderJid, participants, isGroup) {
  const quick = resolveSenderJid(senderJid, participants);
  if (!String(quick || "").endsWith("@lid")) return quick;

  const lidNum = digits(quick);
  if ((_failedLids.get(lidNum) || 0) > Date.now()) return quick;

  let found = "";
  try {
    if (isGroup) {
      const repo = client && client.signalRepository && client.signalRepository.lidMapping;
      if (repo && repo.getPNForLID) {
        for (const v of [quick, lidNum + ":0@lid"]) {
          try {
            const n = digits(await repo.getPNForLID(v));
            if (n.length >= 7 && n !== lidNum) { cacheLidPhone(lidNum, n); found = n + "@s.whatsapp.net"; break; }
          } catch {}
        }
      }
    } else {
      const r = await resolveLidForStatus(client, quick);
      if (r && !String(r).endsWith("@lid")) found = r;
    }
  } catch {}

  if (found) return found;
  _failedLids.set(lidNum, Date.now() + FAIL_TTL_MS);
  if (_failedLids.size > 2000) _failedLids.delete(_failedLids.keys().next().value);
  return quick;
}

/**
 * Decide what the sender is allowed to do.
 *   superUser  -> may run every owner command (owner, creator, bot itself, sudo)
 *   fullOwner  -> owner / creator / bot itself (may also manage sudo users)
 */
function classifySender({ senderJid, botJid, botLid, devNumber, ownerNumbers, sudoJids }) {
  const sender = digits(senderJid);
  const isLidUnresolved = String(senderJid || "").endsWith("@lid");

  const isBot = !!sender && (sender === digits(botJid) || (!!botLid && sender === digits(botLid)));
  const isDev = !!sender && !isLidUnresolved && sender === digits(devNumber);
  const owners = numberSet(...(ownerNumbers || []));
  const isEnvOwner = !!sender && !isLidUnresolved && owners.has(sender);
  const isSudo = !!sender && !isLidUnresolved && (sudoJids || []).some((j) => digits(j) === sender);

  const fullOwner = isBot || isDev || isEnvOwner;
  return { isBot, isDev, isEnvOwner, isSudo, fullOwner, superUser: fullOwner || isSudo };
}

// ---------------------------------------------------------------------
// Owner lists (used by antipromote / antidemote / .powner)
// ---------------------------------------------------------------------
/** The creator / developer number (same value as DEV_NUMBER in index.js). */
const DEV_NUMBER = "255767862457";

/** Numbers of the full owners: creator + OWNER_NUMBER / NUMERO_OWNER (env or saved setting). */
async function ownerNumberSet() {
  let saved = "";
  try {
    const conf = require("../settings");
    saved = require("./settingsCache").getSetting("NUMERO_OWNER", conf.NUMERO_OWNER);
  } catch {}
  const out = numberSet(DEV_NUMBER, saved, process.env.NUMERO_OWNER, process.env.OWNER_NUMBER);
  return out;
}

/** Full owners + sudo users: these people are protected from antipromote / antidemote. */
async function protectedNumberSet() {
  const out = await ownerNumberSet();
  try {
    const list = await require("./sudo").getAllSudoNumbers();
    (list || []).forEach((j) => { const d = digits(j); if (d) out.add(d); });
  } catch {}
  return out;
}

/** Promote with a few retries (WhatsApp sometimes needs a moment after the bot becomes admin). */
async function promoteWithRetry(client, groupId, jid, tries = 3, baseDelayMs = 1500) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      await client.groupParticipantsUpdate(groupId, [jid], "promote");
      return true;
    } catch (e) {
      if (attempt === tries) throw e;
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }
  }
  return false;
}

// ---------------------------------------------------------------------
// Bot modes (MODE setting). Old values stay valid: "on" = public, "off" = private.
// ---------------------------------------------------------------------
function normalizeMode(value) {
  const v = String(value == null ? "on" : value).toLowerCase().trim();
  if (v === "on" || v === "public" || v === "yes") return "public";
  if (v === "off" || v === "private" || v === "no") return "private";
  if (v === "group" || v === "groups") return "group";
  if (v === "inbox" || v === "dm" || v === "pm") return "inbox";
  return "public";
}

/** true when a NON-owner must be ignored in this chat type. */
function modeBlocks(value, isGroup) {
  const m = normalizeMode(value);
  if (m === "private") return true;
  if (m === "group" && !isGroup) return true;
  if (m === "inbox" && isGroup) return true;
  return false;
}

const MODE_INFO = {
  public: { emoji: "🌐", label: "PUBLIC", desc: "Everyone can use commands, anywhere.", stored: "on" },
  private: { emoji: "🔒", label: "PRIVATE", desc: "Only the owner (and sudo users) can use commands.", stored: "off" },
  group: { emoji: "👥", label: "GROUP", desc: "Commands work in groups only. DMs are ignored.", stored: "group" },
  inbox: { emoji: "📩", label: "INBOX", desc: "Commands work in DMs only. Groups are ignored.", stored: "inbox" },
};

function modeLabel(value) {
  return MODE_INFO[normalizeMode(value)].label;
}

module.exports = {
  DEV_NUMBER, ownerNumberSet, protectedNumberSet, promoteWithRetry,
  digits, toJid, numberSet,
  resolveSenderJid, resolveSenderAsync, classifySender,
  normalizeMode, modeBlocks, modeLabel, MODE_INFO,
};
