"use strict";
/**
 * commandHandler.js
 *
 * Recursive plugin loader for BMB-TECH.
 * Replaces the old flat "require every file in /scs" loop in index.js.
 * Walks /plugins/<category>/*.js and requires each one, so each command
 * file's own bmbtz({...}) call registers it exactly like before.
 */
const fs = require("fs");
const path = require("path");

/**
 * Recursively load every .js file under a root directory.
 * @param {string} rootDir - absolute path to the plugins folder
 * @param {(msg: string) => void} [logger] - optional logger, defaults to console.log
 * @returns {{ loaded: string[], failed: { file: string, error: string }[] }}
 */
function loadPlugins(rootDir, logger = console.log) {
    const loaded = [];
    const failed = [];

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".js") {
                const relPath = path.relative(rootDir, fullPath);
                try {
                    require(fullPath);
                    loaded.push(relPath);
                    logger(`${relPath} Installed Successfully✔️`);
                } catch (e) {
                    failed.push({ file: relPath, error: String(e) });
                    logger(`${relPath} could not be installed due to : ${e}`);
                }
            }
        }
    }

    walk(rootDir);
    return { loaded, failed };
}

module.exports = { loadPlugins };
