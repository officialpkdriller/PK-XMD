"use strict";
/**
 * settings.js
 *
 * Trimmed down to identity/deploy config plus sane starting DEFAULTS for
 * the toggle-style settings — matching NOVA-XMD's minimal config/settings.js
 * approach. The toggle settings below (ANTICALL, ANTIDELETE, MODE, etc.)
 * are only used as fallbacks now: once a command like .anticall or
 * .setprefix is used, the persisted value in the database (see
 * lib/settingsCache.js / database/db.js) takes over, and survives
 * restarts. These defaults just decide the starting behavior on a fresh
 * install before anyone has run a command yet.
 *
 * Removed from the previous version:
 *   - A hardcoded PostgreSQL connection string (leaked credential,
 *     completely unused — database/db.js reads process.env.DATABASE_URL
 *     directly and doesn't need it here).
 *   - Sequelize require (unused ORM, dead dependency).
 *   - DP / AUTO_BIO / HEROKU_API_KEY / HEROKU_APP_NAME — none of these
 *     were referenced anywhere else in the codebase (dead config).
 */
const fs = require('fs-extra');
if (fs.existsSync('settings.env')) {
    require('dotenv').config({ path: __dirname + '/settings.env' });
}

module.exports = {
    session: process.env.SESSION_ID || '',
    PREFIXE: process.env.PREFIX || ".",
    OWNER_NAME: process.env.OWNER_NAME || "𝐛𝐦𝐛 𝐭𝐞𝐜𝐡",
    NUMERO_OWNER: process.env.NUMERO_OWNER || "",
    BOT: process.env.BOT_NAME || '𝐛𝐦𝐛 𝐭𝐞𝐜𝐡',
    URL: process.env.BOT_MENU_LINKS || 'https://url.bmbxmd.workers.dev/bmbrepos.png',

    // Fallback defaults for the database-backed toggle settings (see
    // plugins/Settings/settings.js for the commands that override these
    // persistently).
    ANTICALL: process.env.ANTICALL || 'off',
    ANTIDELETE: process.env.ANTIDELETE || 'off',
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || 'on',
    AUTO_DOWNLOAD_STATUS: process.env.AUTO_DOWNLOAD_STATUS || 'off',
    AUTO_REACT_STATUS: process.env.AUTO_REACT_STATUS || 'on',
    AUTO_READ: process.env.AUTO_READ || 'off',
    MODE: process.env.PUBLIC_MODE || 'on',
    PM_PERMIT: process.env.PM_PERMIT || 'off',
    WARN_COUNT: process.env.WARN_COUNT || '3',
    ETAT: process.env.PRESENCE || '',
};

let fichier = require.resolve(__filename);
fs.watchFile(fichier, () => {
    fs.unwatchFile(fichier);
    console.log(`mise à jour ${__filename}`);
    delete require.cache[fichier];
    require(fichier);
});
