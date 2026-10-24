const { bmbtz } = require("../../devbmb/bmbtz");
const conf = require("../../settings");

/**
 * boom
 *
 * Fixed two bugs from the previous version:
 *   - `settingsTimeout(...)` doesn't exist in JavaScript at all (the
 *     real function is `setTimeout`) — this was a typo that made every
 *     single call throw a ReferenceError immediately, so no text was
 *     ever sent, no matter what.
 *   - `conf.BOOM_MESSAGE_LIMIT` was never defined anywhere in
 *     settings.js, so the "limit" check compared against `undefined`
 *     (always false) — harmless on its own, but now given a sane
 *     default (20) directly here instead of adding another env var.
 *
 * Also tightened input validation (arg[0] < 0 on a string never
 * actually caught bad/non-numeric input) and switched to the live
 * `prefixe` from commandeOptions instead of the static settings.js
 * default, matching the rest of the project's convention.
 */
bmbtz(
  {
    nomCom: 'boom',
    categorie: 'Mods',
    reaction: '😈',
  },

  async (dest, client, commandeOptions) => {
    const { arg, repondre, superUser, verifAdmin, verifGroupe, prefixe } = commandeOptions;
    const limit = conf.BOOM_MESSAGE_LIMIT || 20;

    // Allowed for the bot owner/sudo (superUser) anywhere, or for group
    // admins inside their own group (verifAdmin is only meaningful
    // within a group — verifGroupe guards against it accidentally
    // applying outside one).
    if (!(superUser || (verifGroupe && verifAdmin))) {
      repondre('You are not authorised to use this command !!!');
      return;
    }

    const count = parseInt(arg[0]);
    const text = arg.slice(1).join(" ");

    if (!arg[0] || isNaN(count) || count <= 0 || !text) {
      repondre(`\nerror wrong format\n> try: ${prefixe}boom 10 hey`);
      return;
    }

    if (count > limit) {
      repondre(`can't send over ${limit} messages`);
      return;
    }

    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push(
        new Promise((resolve) => {
          setTimeout(() => {
            repondre(text);
            resolve();
          }, 1000 * i);
        })
      );
    }

    await Promise.all(tasks);
  }
);
