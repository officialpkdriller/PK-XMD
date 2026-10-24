"use strict";
/**
 * plugins/Settings/buttonstyle.js - choose how the buttons look (owner only).
 *
 *   .buttonstyle           shows the style in use
 *   .buttonstyle native    buttons stuck to the message, with a small reply arrow (default, shows everywhere)
 *   .buttonstyle toxic     separate rounded buttons, like the Toxic-MD menu (send .buttonstyle test to check it shows)
 *   .buttonstyle text      no buttons, the commands are listed instead
 *   .buttonstyle test      sends a sample message with two buttons in the style in use
 *
 * This works even when the buttons are not shown on your phone: the command answers with plain text.
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const { getCachedSettingsSync, updateCachedSetting } = require("../../lib/settingsCache");
const buttons = require("../../lib/buttons");

const LINE = "━━━━━━━━━━━━━━━━";
const box = (title, body) => `📌 *${title}*\n${LINE}\n${body}\n${LINE}\n© bmb tech`;

const INFO = {
  toxic: "Separate rounded buttons under the message, like the Toxic-MD menu.",
  native: "Buttons stuck to the message, with a small reply arrow.",
  text: "No buttons. The options are listed as commands to type.",
};

bmbtz({
  nomCom: "buttonstyle",
  alias: ["btnstyle", "buttonmode"],
  categorie: "Settings",
  reaction: "🔘",
}, async (dest, client, o) => {
  const { arg, repondre, superUser, prefixe } = o;
  if (!superUser) return repondre("*This command is only allowed to be controlled by the owner.👤*");

  const p = prefixe || ".";
  const current = buttons.currentStyle();
  const wanted = String((arg && arg[0]) || "").toLowerCase();

  if (!wanted) {
    return repondre(box("BUTTON STYLE",
      `Current: *${current.toUpperCase()}*\n${INFO[current]}\n\n` +
      `${p}buttonstyle toxic\n${p}buttonstyle native\n${p}buttonstyle text\n${p}buttonstyle test\n\n` +
      `If you can not see a card at all, send ${p}buttonstyle native.`));
  }

  if (wanted === "test") {
    const used = await buttons.sendButtons(client, dest, {
      body: `${LINE}\n🔘 Button test\nStyle: ${current.toUpperCase()}\n\nTap a button below.\n${LINE}`,
      footer: "Button test • BMB-TECH",
      title: "BUTTON TEST",
      buttons: [
        { text: buttons.boldFont("Show Style"), id: `${p}buttonstyle` },
        { text: buttons.boldFont("Test Again"), id: `${p}buttonstyle test` },
      ],
    });
    if (used === "text") {
      await repondre(box("BUTTON STYLE", "The buttons could not be sent, so the options were sent as text."));
    }
    return;
  }

  if (!buttons.STYLES.includes(wanted)) {
    return repondre(box("BUTTON STYLE", `Invalid option.\nUse: ${p}buttonstyle toxic | native | text | test`));
  }

  if (wanted === current && String(getCachedSettingsSync().BUTTON_STYLE || "") === wanted) {
    return repondre(box("BUTTON STYLE", `Already *${wanted.toUpperCase()}*.\n${INFO[wanted]}`));
  }
  await updateCachedSetting("BUTTON_STYLE", wanted);
  return repondre(box("BUTTON STYLE", `Now *${wanted.toUpperCase()}*.\n${INFO[wanted]}\n\nSend ${p}buttonstyle test to see it.`));
});
