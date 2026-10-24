"use strict";
/**
 * plugins/Settings/noprefix.js - choose who can run commands without the prefix.
 *   .noprefix on      everyone, any command, everywhere
 *   .noprefix inbox   everyone, private chats only
 *   .noprefix owner   only the owner and sudo users
 *   .noprefix off     prefix always required
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const { getCachedSettingsSync, updateCachedSetting } = require("../../lib/settingsCache");
const noPrefix = require("../../lib/noPrefix");

const LINE = "━━━━━━━━━━━━━━━━";
const box = (body) => `📌 *NO-PREFIX COMMANDS*\n${LINE}\n${body}\n${LINE}\n© bmb tech`;

const INFO = {
  on: "Everyone can run any command without the prefix, in groups and private chats.",
  inbox: "Everyone can run commands without the prefix in private chats only. Groups still need the prefix.",
  owner: "Only the owner and sudo users can run commands without the prefix.",
  off: "The prefix is always required.",
};

bmbtz({
  nomCom: "noprefix",
  alias: ["nopref", "prefixless"],
  categorie: "Settings",
  reaction: "⌨️",
}, async (dest, client, o) => {
  const { arg, repondre, superUser, prefixe } = o;
  if (!superUser) return repondre("*This command is only allowed to be controlled by the owner.👤*");

  const p = prefixe || ".";
  const current = noPrefix.resolveMode(getCachedSettingsSync().NOPREFIX);
  const wanted = (arg && arg[0] ? String(arg[0]).toLowerCase() : "");

  if (!wanted) {
    return repondre(box(
      `Current: *${current.toUpperCase()}*\n${INFO[current]}\n\n` +
      `${p}noprefix on\n${p}noprefix inbox\n${p}noprefix owner\n${p}noprefix off\n\n` +
      `Tip: only messages of up to ${noPrefix.MAX_WORDS} words starting with a command name are treated as commands.`
    ));
  }
  const known = ["on", "yes", "true", "all", "inbox", "dm", "pm", "private", "owner", "sudo", "off", "no", "false"];
  if (!known.includes(wanted)) {
    return repondre(box(`Invalid option.\nUse: ${p}noprefix on | inbox | owner | off`));
  }
  const mode = noPrefix.normalizeMode(wanted);
  if (mode === current) return repondre(box(`Already *${mode.toUpperCase()}*.\n${INFO[mode]}`));

  await updateCachedSetting("NOPREFIX", mode);
  return repondre(box(`Now *${mode.toUpperCase()}*.\n${INFO[mode]}`));
});
