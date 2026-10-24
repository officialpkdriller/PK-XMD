"use strict";
/**
 * plugins/Settings/chatbot.js - chatbot switches:
 *   .autoai on/off     -> reply to all DMs + @mention/reply in groups
 *   .chatbotpm on/off  -> reply to DMs only
 *   .allow <number>    -> allow specific numbers while autoai/chatbotpm are off
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const { getSetting, updateCachedSetting } = require("../../lib/settingsCache");
const { getAllowed, getFlag } = require("../../lib/chatbot");

const LINE = "━━━━━━━━━━━━━━━━";
const fmt = (title, lines) =>
  `📌 *${title}*\n${LINE}\n${(Array.isArray(lines) ? lines : [lines]).join("\n")}\n${LINE}\n© bmb tech`;
const ON = new Set(["on", "enable", "enabled", "true", "1", "yes", "start"]);
const OFF = new Set(["off", "disable", "disabled", "false", "0", "no", "stop"]);
const isOn = (key) => getFlag(key);

function toggle({ nomCom, alias, key, title, onLines, offLines }) {
  bmbtz({ nomCom, alias: alias || [], categorie: "Settings", reaction: "🤖" }, async (dest, client, o) => {
    const { arg, ms, repondre, superUser, prefixe } = o;
    if (!superUser) return repondre("*This command is only allowed to be controlled by the owner.👤*");
    const v = (arg?.[0] || "").toLowerCase();
    if (ON.has(v) || OFF.has(v)) {
      const want = ON.has(v);
      if (isOn(key) === want) return repondre(fmt(title, `already ${want ? "ON" : "OFF"} 🙄 stop pressing buttons`));
      await updateCachedSetting(key, want ? "on" : "off");
      return repondre(fmt(title, want ? onLines : offLines));
    }
    return repondre(fmt(title, [`Status: ${isOn(key) ? "ON ✅" : "OFF ❌"}`, "Options:", `${prefixe || "."}${nomCom} on`, `${prefixe || "."}${nomCom} off`]));
  });
}

toggle({
  nomCom: "autoai",
  alias: ["aireply", "smartai", "aimode", "airespond", "autogpt"],
  key: "AUTOAI",
  title: "AUTO AI",
  onLines: ["Status: ✅ ON", "Replies to all DMs + @mentions/replies in groups.", "God help them 😒"],
  offLines: ["Status: ❌ OFF", "Silent mode. Finally."],
});

toggle({
  nomCom: "chatbotpm",
  alias: ["chatbot", "aipm", "pmbot", "dmai"],
  key: "CHATBOTPM",
  title: "CHATBOT PM",
  onLines: ["Status: ✅ ON", "Replies to all private chats (DMs)."],
  offLines: ["Status: ❌ OFF", "DM chatbot disabled."],
});

bmbtz({ nomCom: "allow", alias: ["allowuser", "allowai"], categorie: "Settings", reaction: "✅" }, async (dest, client, o) => {
  const { arg, repondre, superUser, prefixe } = o;
  if (!superUser) return repondre("*This command is only allowed to be controlled by the owner.👤*");
  const p = prefixe || ".";
  if (isOn("AUTOAI")) {
    return repondre(fmt("ALLOW", ["AutoAI is ON — replies to everyone.", "Turn it off first to manage allowed list.", `Use: ${p}autoai off`]));
  }
  const clean = (s) => String(s || "").replace(/[\s+\-().]/g, "").trim();
  const sub = (arg?.[0] || "").toLowerCase();
  const list = getAllowed();

  if (sub === "list") {
    if (!list.length) return repondre(fmt("ALLOW LIST", "No one allowed. AutoAI is off for everyone 💀"));
    return repondre(fmt("ALLOW LIST", [`Total: ${list.length}`, ...list.map((n, i) => `${i + 1}. ${n}`)]));
  }
  if (["remove", "del", "delete"].includes(sub)) {
    const n = clean(arg.slice(1).join(""));
    if (n.length < 6) return repondre(fmt("ALLOW", ["Provide a valid number.", `Example: ${p}allow remove 255712345678`]));
    await updateCachedSetting("AI_ALLOWED", list.filter((x) => x !== n).join(","));
    return repondre(fmt("ALLOW", [`Removed: ${n}`, "AutoAI will no longer respond to them."]));
  }
  const n = clean(sub === "add" ? arg.slice(1).join("") : (arg || []).join(""));
  if (n.length < 6) {
    return repondre(fmt("ALLOW", ["Status: AutoAI OFF", `Allowed users: ${list.length}`, "", `Add: ${p}allow 255712345678`, `Remove: ${p}allow remove 255712345678`, `List: ${p}allow list`]));
  }
  if (list.includes(n)) return repondre(fmt("ALLOW", `${n} is already allowed.`));
  await updateCachedSetting("AI_ALLOWED", [...list, n].join(","));
  return repondre(fmt("ALLOW", [`Added: ${n}`, "AutoAI will now respond to them."]));
});
