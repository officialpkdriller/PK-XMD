"use strict";
/**
 * integrityGuard.js
 *
 * Verifies at startup that devbmb/bmbtz.js (the core command registry
 * every plugin depends on via require("../../devbmb/bmbtz")) is present,
 * unmodified in the ways that matter, and still referenced correctly
 * throughout the codebase. If someone renames the "devbmb" folder,
 * renames "bmbtz.js", or edits enough require() paths / references to
 * break the wiring, the bot refuses to start with a clear message
 * instead of failing later with confusing "module not found" errors
 * scattered across dozens of plugin files.
 *
 * This runs TWO checks:
 *
 *   1. STRUCTURAL — devbmb/bmbtz.js must exist at its exact path and
 *      export { bmbtz: function, cm: array, __integrityToken: the
 *      expected watermark string }. This catches the file being
 *      deleted, moved, or rewritten in a way that breaks its contract
 *      (even if the watermark string is left in by accident but the
 *      exports are wrong, or vice versa).
 *
 *   2. REFERENCE COUNT — scans every .js file in the project (except
 *      node_modules) and counts how many still contain the literal
 *      strings "devbmb" and "bmbtz". This catches someone doing a
 *      mass find-and-replace across plugin files (renaming the
 *      require() path or the destructured import name everywhere)
 *      WITHOUT necessarily touching devbmb/bmbtz.js itself — which
 *      the structural check alone wouldn't notice, since the file
 *      would still be intact and correctly exporting things, just no
 *      longer being called from anywhere.
 *
 * The thresholds below are set comfortably under the project's actual
 * current counts (as of when this guard was added) so ordinary future
 * development (adding/editing a handful of plugins) never trips it,
 * while a deliberate mass rename clearly would.
 */
const fs = require("fs");
const path = require("path");

const EXPECTED_TOKEN = "DEVBMB_BMBTZ_INTEGRITY_v1";
const BMBTZ_PATH = path.join(__dirname, "..", "devbmb", "bmbtz.js");

const MIN_FILES_REFERENCING_DEVBMB = 40;
const MIN_FILES_REFERENCING_BMBTZ = 40;
const MIN_TOTAL_OCCURRENCES_DEVBMB = 50;
const MIN_TOTAL_OCCURRENCES_BMBTZ = 150;

function countReferences(rootDir) {
    let filesWithDevbmb = 0;
    let filesWithBmbtz = 0;
    let totalDevbmb = 0;
    let totalBmbtz = 0;

    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name === "node_modules" || entry.name === ".git") continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith(".js")) {
                let content;
                try {
                    content = fs.readFileSync(fullPath, "utf8");
                } catch {
                    continue;
                }
                const devbmbMatches = content.match(/devbmb/g);
                const bmbtzMatches = content.match(/bmbtz/g);
                if (devbmbMatches) {
                    filesWithDevbmb++;
                    totalDevbmb += devbmbMatches.length;
                }
                if (bmbtzMatches) {
                    filesWithBmbtz++;
                    totalBmbtz += bmbtzMatches.length;
                }
            }
        }
    }

    walk(rootDir);
    return { filesWithDevbmb, filesWithBmbtz, totalDevbmb, totalBmbtz };
}

/**
 * Runs both checks. On failure, prints a clear message and terminates
 * the process (process.exit(1)) — this is intentionally fatal, since a
 * bot running with a broken/tampered command registry would otherwise
 * fail in confusing, hard-to-diagnose ways command-by-command.
 */
function verifyIntegrity(projectRoot) {
    // --- Check 1: structural ---
    if (!fs.existsSync(BMBTZ_PATH)) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("devbmb/bmbtz.js is missing or was moved/renamed.");
        console.error("This file is the bot's core command registry — restore it at:");
        console.error("  " + BMBTZ_PATH);
        console.error("to continue.");
        process.exit(1);
    }

    let mod;
    try {
        delete require.cache[require.resolve(BMBTZ_PATH)];
        mod = require(BMBTZ_PATH);
    } catch (e) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("devbmb/bmbtz.js failed to load:", e.message);
        process.exit(1);
    }

    if (
        typeof mod.bmbtz !== "function" ||
        !Array.isArray(mod.cm) ||
        mod.__integrityToken !== EXPECTED_TOKEN
    ) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("devbmb/bmbtz.js has been modified in a way that breaks its contract.");
        console.error("Restore the original devbmb/bmbtz.js — it must export");
        console.error('  { bmbtz: function, cm: array, __integrityToken: "' + EXPECTED_TOKEN + '" }');
        console.error("to continue.");
        process.exit(1);
    }

    // --- Check 2: reference count across the whole project ---
    const { filesWithDevbmb, filesWithBmbtz, totalDevbmb, totalBmbtz } = countReferences(projectRoot);

    if (
        filesWithDevbmb < MIN_FILES_REFERENCING_DEVBMB ||
        filesWithBmbtz < MIN_FILES_REFERENCING_BMBTZ ||
        totalDevbmb < MIN_TOTAL_OCCURRENCES_DEVBMB ||
        totalBmbtz < MIN_TOTAL_OCCURRENCES_BMBTZ
    ) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("References to \"devbmb\"/\"bmbtz\" across the codebase dropped below the expected minimum —");
        console.error("this usually means something renamed how plugins require() the command registry.");
        console.error(
            `  devbmb: ${filesWithDevbmb} files / ${totalDevbmb} occurrences (need >= ${MIN_FILES_REFERENCING_DEVBMB} files / ${MIN_TOTAL_OCCURRENCES_DEVBMB} occurrences)`
        );
        console.error(
            `  bmbtz:  ${filesWithBmbtz} files / ${totalBmbtz} occurrences (need >= ${MIN_FILES_REFERENCING_BMBTZ} files / ${MIN_TOTAL_OCCURRENCES_BMBTZ} occurrences)`
        );
        console.error('Revert those changes back to using "devbmb"/"bmbtz" to continue.');
        process.exit(1);
    }

    console.log("✅ Integrity check passed (devbmb/bmbtz.js intact).");
}

module.exports = { verifyIntegrity };
