"use strict";
/**
 * plugins/Owner/whoami.js - shows how the bot sees YOU (available to everyone).
 * Use it to find out why a command says "only the owner" and which value to set.
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const ownerAccess = require("../../lib/ownerAccess");

const LINE = "━━━━━━━━━━━━━━━━";

bmbtz({ nomCom: "whoami", alias: ["myid", "checkowner", "whoami2"], categorie: "Owner", reaction: "🪪" }, async (dest, client, o) => {
  const { ms, auteurMessage, senderJid, verifGroupe, idBot, superUser, fullOwner, dev, isSudo } = o;

  const rawId = String(auteurMessage || "");
  const resolved = String(senderJid || rawId);
  const unresolved = resolved.endsWith("@lid");
  const number = unresolved ? "" : ownerAccess.digits(resolved);

  let role = "Regular user";
  if (dev) role = "Creator (developer)";
  else if (fullOwner) role = "Owner";
  else if (isSudo) role = "Sudo user";

  const configured = ownerAccess.numberSet(process.env.OWNER_NUMBER, process.env.NUMERO_OWNER).size;
  const lines = [
    `Chat: ${verifGroupe ? "Group" : "Private chat"}`,
    `Your ID: ${rawId.split("@")[0] || "unknown"}${rawId.endsWith("@lid") ? " (LID)" : ""}`,
    `Your number: ${number ? "+" + number : "could not be read"}`,
    `Bot number: +${ownerAccess.digits(idBot)}`,
    `Your role: ${role}`,
    `Owner access: ${superUser ? "YES ✅" : "NO ❌"}`,
    `OWNER_NUMBER set: ${configured ? "yes (" + configured + ")" : "no"}`,
  ];

  const tips = [];
  if (!superUser) {
    if (number) {
      tips.push("To become the owner, add this Config Var on your host and restart:", `OWNER_NUMBER = ${number}`, "", `Or ask the owner to send: .addsudo ${number}`);
    } else {
      tips.push(
        "The bot could not read your phone number from this chat.",
        "Try again in a private chat with the bot, then run .whoami once more.",
        "You can also ask the owner to send: .addsudo <your number>"
      );
    }
  }

  await client.sendMessage(dest, {
    text: `🪪 *WHO AM I*\n${LINE}\n${lines.join("\n")}${tips.length ? "\n\n" + tips.join("\n") : ""}\n${LINE}\n© bmb tech`,
  }, { quoted: ms });
});
