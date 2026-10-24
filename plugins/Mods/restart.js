"use strict";
/**
 * plugins/Mods/restart.js - restarts the whole bot.
 *   .restart   (aliases: .reboot, .restartbot)       owner / sudo only
 *
 * How the restart is done depends on where the bot runs:
 *   - Heroku, PM2, Docker, Railway, Render, Fly, Koyeb, Kubernetes, panels ...
 *       The bot exits and the host starts it again automatically ("exit" mode).
 *   - A plain `node index.js` (Termux, VPS without a process manager)
 *       The bot starts a fresh copy of itself and then exits ("spawn" mode).
 * Force a mode with the RESTART_MODE env var ("exit" or "spawn") if the automatic choice is wrong.
 */
const { bmbtz } = require("../../devbmb/bmbtz");
const fs = require("fs");
const { spawn } = require("child_process");

const RESTART_DELAY_MS = 1500; // lets the "restarting" message reach WhatsApp first

/** "exit" when a supervisor restarts the process for us, otherwise "spawn". */
function chooseMode(env, hasDockerFile) {
  const forced = String(env.RESTART_MODE || "").toLowerCase();
  if (forced === "exit" || forced === "spawn") return forced;

  const supervised =
    env.DYNO ||                                   // Heroku
    env.pm_id !== undefined || env.PM2_HOME || env.PM2_USAGE || // PM2
    env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID ||
    env.RENDER || env.FLY_APP_NAME || env.KOYEB_APP_NAME ||
    env.K_SERVICE || env.KUBERNETES_SERVICE_HOST ||
    env.P_SERVER_UUID ||                          // Pterodactyl panels
    hasDockerFile;
  return supervised ? "exit" : "spawn";
}

/** Saves what must not be lost, then restarts. Returns the mode that was used. */
function performRestart({ env = process.env, exit = (code) => process.exit(code), spawnFn = spawn, argv = process.argv, execPath = process.execPath, cwd = process.cwd(), hasDockerFile = false } = {}) {
  try { require("../../lib/cmdStats").flush(); } catch (e) { /* stats are optional */ }

  const mode = chooseMode(env, hasDockerFile);
  if (mode === "spawn") {
    const child = spawnFn(execPath, argv.slice(1), {
      cwd,
      env: { ...env, BMB_RESTARTED: "1" },
      detached: true,
      stdio: "inherit",
    });
    if (child && typeof child.unref === "function") child.unref();
  }
  exit(0);
  return mode;
}

bmbtz({
  nomCom: "restart",
  alias: ["reboot", "restartbot"],
  categorie: "Mods",
  reaction: "♻️",
}, async (dest, client, o) => {
  const { ms, repondre, superUser } = o;

  if (!superUser) return repondre("This command is for the bot owner only.");

  try {
    await client.sendMessage(dest, { text: "♻️ *Restarting the bot...*\nI will be back online in a few seconds." }, { quoted: ms });
  } catch (e) { /* restart anyway */ }

  setTimeout(() => {
    try {
      const mode = performRestart({ hasDockerFile: fs.existsSync("/.dockerenv") });
      console.log(`[restart] restart requested (${mode} mode)`);
    } catch (e) {
      console.log("[restart] could not restart:", e && e.message ? e.message : e);
      client.sendMessage(dest, { text: `❌ I could not restart automatically: ${e && e.message ? e.message : e}\nPlease restart the bot from your host.` }).catch(() => {});
    }
  }, RESTART_DELAY_MS);
});

module.exports = { chooseMode, performRestart };
