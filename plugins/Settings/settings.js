"use strict";
/**
 * settings.js
 *
 * Bot-wide toggle commands (anticall, antidelete, autolikestatus, etc.)
 *
 * Rewritten to fix two problems in the previous version:
 *   1. Some commands wrote to a settings-object key that index.js never
 *      actually read (e.g. "antidelete" wrote to ADM, but index.js reads
 *      ANTIDELETE; "autoreact"/"autolikestatus" wrote to AUTO_REACT /
 *      AUTO_LIKE_STATUS, but index.js reads AUTO_REACT_STATUS) — so
 *      those toggles silently did nothing. Every command below now
 *      writes the exact key index.js reads.
 *   2. All of them mutated the settings.js module object in memory only
 *      — this is never persisted, so every setting silently reverted to
 *      its .env default on the next restart/redeploy (which on Heroku
 *      happens often). They now persist via database/db.js (through
 *      lib/settingsCache.js's write-through cache), matching how
 *      NOVA-XMD keeps bot settings in its database instead of app.json.
 *
 * BUTTONS (the same style as .antilink and .welcome):
 *   .anticall (and every other on/off command)  -> status + buttons  [On] [Off]
 *   .mode              -> status + buttons  [Public] [Private] [More]   ([More] -> [Group] [Inbox] [Back])
 *   .setwarnlimit      -> status + buttons with common limits (3, 5, 10)
 *   .setprefix         -> status + buttons with common prefixes (. ! /)
 * The typed commands (".anticall on", ".mode private", ".setwarnlimit 4", ".setprefix #") work as before.
 * Tapping a button runs the command on it as the person who tapped, so only the owner can change anything.
 */
const { bmbtz } = require("../../devpk/bmbtz");
const { getCachedSettingsSync, updateCachedSetting } = require("../../lib/settingsCache");
const s = require("../../settings");
const ownerAccess = require("../../lib/ownerAccess");

// If lib/buttons.js was not uploaded, every command must still answer (with plain text instead of buttons).
let buttons;
try {
  buttons = require("../../lib/buttons");
} catch (e) {
  console.log("⚠️ [settings] lib/buttons.js is missing - upload it to get the buttons. Using plain text for now.");
  buttons = {
    boldFont: (t) => String(t),
    sendButtons: async (client, jid, { body, buttons: list = [] }) =>
      client.sendMessage(jid, { text: `${body}\n\nType one of these:\n${list.map((b) => "• " + b.id).join("\n")}` }),
  };
}

const NEWSLETTER_JID = "120363417804135599@newsletterr";
const NEWSLETTER_NAME = "B.M.B TECH OFFICIAL";

const newsletterContext = {
  contextInfo: {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: NEWSLETTER_JID,
      newsletterName: NEWSLETTER_NAME
    }
  }
};

function boxText(title, message) {
  return `\n╔══════════════════╗\n    *${title}* \n╚══════════════════╝\n\n${message}\n  `;
}

async function sendBox(chatId, client, ms, title, message) {
  const box = boxText(title, message);
  try {
    await client.sendMessage(chatId, { text: box, ...newsletterContext }, { quoted: ms });
  } catch (error) {
    console.error(`Error sending box message (${title}):`, error);
    try {
      await client.sendMessage(chatId, { text: '⚠️ Error processing your request.' }, { quoted: ms });
    } catch (e) {
      console.error('Failed fallback send:', e);
    }
  }
}

/** The same box, but with buttons under it. */
function sendCard(chatId, client, title, message, buttonList) {
  return buttons.sendButtons(client, chatId, {
    body: boxText(title, message),
    footer: "Settings • PK-XMD",
    title,
    buttons: buttonList,
  });
}

const capitalize = (t) => String(t).charAt(0).toUpperCase() + String(t).slice(1);

/**
 * Generic on/off toggle registrar. `settingKey` MUST match a key that
 * index.js actually reads via getConf('KEY') — see index.js's
 * getConf() helper.
 */
function registerToggleCommand(commandName, settingKey, enabledValue, disabledValue, title, enabledText, disabledText, aliasList) {
  bmbtz({
    nomCom: commandName,
    alias: aliasList || [],
    categorie: "Settings"
  }, async (chatId, client, context) => {
    const { ms, repondre, superUser, arg, prefixe } = context;
    const p = prefixe || ".";

    if (!superUser) {
      return repondre("*This command is only allowed to be controlled by the owner.👤");
    }

    const current = getCachedSettingsSync()[settingKey] ?? s[settingKey];

    if (!arg[0]) {
      const isOn = String(current).toLowerCase() === String(enabledValue).toLowerCase();
      const name = capitalize(commandName);
      const card = `Status: ${isOn ? "ON ✅" : "OFF ❌"}\n\n👉 Choose an option below, or type:\n- *${p}${commandName} on*\n- *${p}${commandName} off*`;
      return sendCard(chatId, client, title, card, [
        { text: buttons.boldFont(`${name} On`), id: `${p}${commandName} on` },
        { text: buttons.boldFont(`${name} Off`), id: `${p}${commandName} off` },
      ]);
    }

    const option = arg.join(' ').toLowerCase();
    let responseMessage;

    switch (option) {
      case "on":
        await updateCachedSetting(settingKey, enabledValue);
        responseMessage = enabledText || "has been enabled successfully.";
        break;

      case "off":
        await updateCachedSetting(settingKey, disabledValue);
        responseMessage = disabledText || "has been disabled successfully.";
        break;

      default:
        return sendBox(chatId, client, ms, title, "❌ Invalid option.\nUse: *" + commandName + " on* or *" + commandName + " off*.");
    }

    return sendBox(chatId, client, ms, title, responseMessage);
  });
}

//=============== COMMAND REGISTRATIONS ===============//
// Each settingKey below matches exactly what index.js's getConf() reads.

registerToggleCommand("anticall", "ANTICALL", "on", "off", "ANTI-CALL MODE",
  "✅ Anti-call has been *enabled* successfully.",
  "❌ Anti-call has been *disabled* successfully.");

registerToggleCommand("autolikestatus", "AUTO_REACT_STATUS", "on", "off", "AUTO-LIKE STATUS",
  "✅ Auto-like status has been *enabled* successfully.",
  "❌ Auto-like status has been *disabled* successfully.",
  ["likestatus", "autolike"]);

registerToggleCommand("readstatus", "AUTO_READ_STATUS", "on", "off", "AUTO-READ STATUS",
  "✅ Auto-read status has been *enabled* successfully.",
  "❌ Auto-read status has been *disabled* successfully.");

registerToggleCommand("antidelete", "ANTIDELETE", "on", "off", "ANTI-DELETE MODE",
  "✅ Anti-delete has been *enabled* successfully.",
  "❌ Anti-delete has been *disabled* successfully.");

registerToggleCommand("downloadstatus", "AUTO_DOWNLOAD_STATUS", "on", "off", "DOWNLOAD STATUS",
  "✅ Auto-download status has been *enabled* successfully.",
  "❌ Auto-download status has been *disabled* successfully.");

registerToggleCommand("readmessage", "AUTO_READ", "on", "off", "AUTO-READ MESSAGES",
  "✅ Auto-read messages has been *enabled* successfully.",
  "❌ Auto-read messages has been *disabled* successfully.");

registerToggleCommand("pm-permit", "PM_PERMIT", "on", "off", "PM PERMIT",
  "✅ PM permit has been *enabled* successfully.",
  "❌ PM permit has been *disabled* successfully.");

// Presence state (ETAT): 1=online, 2=typing, 3=recording, off=none — one
// shared key, three convenience commands to set it (matches the
// original numeric scheme index.js's presenceType switch expects).
registerToggleCommand("autorecord", "ETAT", "3", "off", "AUTO-RECORD",
  "✅ Auto-record has been *enabled* successfully.",
  "❌ Auto-record has been *disabled* successfully.");

registerToggleCommand("autotyping", "ETAT", "2", "off", "AUTO-TYPING",
  "✅ Auto-typing has been *enabled* successfully.",
  "❌ Auto-typing has been *disabled* successfully.");

registerToggleCommand("alwaysonline", "ETAT", "1", "off", "ALWAYS ONLINE",
  "✅ Always-online has been *enabled* successfully.",
  "❌ Always-online has been *disabled* successfully.");

// mode (public / private / group / inbox)
bmbtz({
  nomCom: "mode",
  alias: ["botmode", "setmode", "changemode"],
  categorie: "Settings"
}, async (chatId, client, context) => {
  const { ms, repondre, superUser, arg, prefixe } = context;

  // Owner, creator (developer), the bot's own number and sudo users may switch the mode.
  if (!superUser) {
    return repondre("*This command is only allowed to be controlled by the owner.👤*");
  }

  const current = ownerAccess.normalizeMode(getCachedSettingsSync().MODE ?? s.MODE);
  const p = prefixe || ".";
  const first = String(arg[0] || "").toLowerCase();

  // [More] -> the two modes that did not fit on the first card
  if (first === "more") {
    const info = ownerAccess.MODE_INFO[current];
    return sendCard(chatId, client, "BOT MODE",
      `Current: ${info.emoji} *${info.label}*\n\n👥 *Group*  - commands work in groups only\n📩 *Inbox*  - commands work in DMs only\n\n👉 Choose an option below.`,
      [
        { text: buttons.boldFont("Mode Group"), id: `${p}mode group` },
        { text: buttons.boldFont("Mode Inbox"), id: `${p}mode inbox` },
        { text: buttons.boldFont("Mode Back"), id: `${p}mode` },
      ]);
  }

  if (!arg[0]) {
    const info = ownerAccess.MODE_INFO[current];
    const help =
      `Current: ${info.emoji} *${info.label}*\n${info.desc}\n\n` +
      `👉 Choose an option below, or type:\n` +
      `- *${p}mode public*  → everyone, everywhere\n` +
      `- *${p}mode private* → owner / sudo only\n` +
      `- *${p}mode group*   → groups only, DMs ignored\n` +
      `- *${p}mode inbox*   → DMs only, groups ignored\n\n` +
      `The owner can always use every command, in every mode.`;
    return sendCard(chatId, client, "BOT MODE", help, [
      { text: buttons.boldFont("Mode Public"), id: `${p}mode public` },
      { text: buttons.boldFont("Mode Private"), id: `${p}mode private` },
      { text: buttons.boldFont("Mode More"), id: `${p}mode more` },
    ]);
  }

  const requested = ownerAccess.normalizeMode(arg[0]);
  const known = ["public", "private", "group", "inbox", "on", "off", "groups", "dm", "pm", "yes", "no"];
  if (!known.includes(String(arg[0]).toLowerCase())) {
    return sendBox(chatId, client, ms, "BOT MODE", `❌ Invalid option.\nUse: *${p}mode public*, *${p}mode private*, *${p}mode group* or *${p}mode inbox*.`);
  }

  const info = ownerAccess.MODE_INFO[requested];
  if (requested === current) {
    return sendBox(chatId, client, ms, "BOT MODE", `${info.emoji} Already in *${info.label}* mode.`);
  }
  await updateCachedSetting("MODE", info.stored);
  return sendBox(chatId, client, ms, "BOT MODE", `${info.emoji} Bot is now in *${info.label}* mode.\n${info.desc}`);
});

//=============== SET PREFIX ===============//

bmbtz({
  nomCom: "setprefix",
  categorie: "Settings"
}, async (chatId, client, context) => {
  const { ms, repondre, superUser, arg, prefixe } = context;

  if (!superUser) {
    return repondre("*This command is only allowed to be controlled by the owner.👤");
  }

  const currentPrefix = getCachedSettingsSync().PREFIXE ?? s.PREFIXE;
  const p = prefixe || currentPrefix || ".";

  if (!arg[0]) {
    const help = `Current prefix: *${currentPrefix}*\n\n👉 Choose an option below, or type:\n- *${p}setprefix <newprefix>*`;
    return sendCard(chatId, client, "SET PREFIX", help, [
      { text: "Prefix  .", id: `${p}setprefix .` },
      { text: "Prefix  !", id: `${p}setprefix !` },
      { text: "Prefix  /", id: `${p}setprefix /` },
    ]);
  }

  const newPrefix = arg[0];

  if (!newPrefix || /\s/.test(newPrefix)) {
    return sendBox(chatId, client, ms, "SET PREFIX", "❌ Write prefix without spaces, example: *setprefix !*");
  }

  await updateCachedSetting("PREFIXE", newPrefix);

  return sendBox(
    chatId,
    client,
    ms,
    "SET PREFIX",
    `✅ Prefix has been changed to: *${newPrefix}*\n\nChanges are now active, no restart needed.`
  );
});

//=============== SET WARN LIMIT ===============//

bmbtz({
  nomCom: "setwarnlimit",
  categorie: "Settings"
}, async (chatId, client, context) => {
  const { ms, repondre, superUser, arg, prefixe } = context;
  const p = prefixe || ".";

  if (!superUser) {
    return repondre("*This command is only allowed to be controlled by the owner.👤");
  }

  const current = getCachedSettingsSync().WARN_COUNT ?? s.WARN_COUNT;

  if (!arg[0] || isNaN(Number(arg[0]))) {
    const help = `Current limit: *${current}*\n\n👉 Choose an option below, or type:\n- *${p}setwarnlimit <number>*`;
    return sendCard(chatId, client, "WARN LIMIT", help, [
      { text: buttons.boldFont("Warn Limit 3"), id: `${p}setwarnlimit 3` },
      { text: buttons.boldFont("Warn Limit 5"), id: `${p}setwarnlimit 5` },
      { text: buttons.boldFont("Warn Limit 10"), id: `${p}setwarnlimit 10` },
    ]);
  }

  await updateCachedSetting("WARN_COUNT", String(Number(arg[0])));

  return sendBox(chatId, client, ms, "WARN LIMIT", `✅ Warn limit set to *${Number(arg[0])}*.`);
});
