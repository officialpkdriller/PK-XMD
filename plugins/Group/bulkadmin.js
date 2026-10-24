const { bmbtz } = require('../../devbmb/bmbtz');

/**
 * promoteall / demoteall
 *
 * Bulk-promotes/demotes every eligible group member. Both require the
 * bot itself to be a group admin, and the command caller to be an
 * admin or bot superUser (owner) — same access rules the existing
 * promote/demote commands in groupe.js already use.
 */
function registerBulkCommand(nomCom, action, label, reaction) {
    bmbtz({
        nomCom,
        categorie: 'Group',
        reaction
    }, async (dest, client, commandeOptions) => {
        const { repondre, infosGroupe, verifGroupe, verifAdmin, superUser, idBot } = commandeOptions;

        if (!verifGroupe) {
            return repondre('🚫 *This command is for group use only.*');
        }
        if (!(verifAdmin || superUser)) {
            return repondre('Sorry, I cannot perform this action because you are not an administrator of the group.');
        }

        const membresGroupe = await infosGroupe.participants;

        // No pre-check of the bot's own admin status via groupMetadata
        // here — comparing JIDs against groupMetadata().participants is
        // unreliable on this Baileys fork's LID system and wrongly
        // reported "not an administrator" even when the bot was admin.
        // We just attempt each update below and skip ones that fail.

        let targets;
        if (action === 'promote') {
            targets = membresGroupe.filter((m) => m.admin == null && m.id !== idBot).map((m) => m.id);
        } else {
            targets = membresGroupe.filter((m) => m.admin != null && m.id !== idBot).map((m) => m.id);
        }

        if (targets.length === 0) {
            return repondre(`No members to ${nomCom.replace('all', '')}.`);
        }

        await repondre(`⏳ ${label} ${targets.length} member(s)...`);

        let success = 0;
        for (const jid of targets) {
            try {
                await client.groupParticipantsUpdate(dest, [jid], action);
                success++;
                await new Promise((r) => setTimeout(r, 700)); // avoid rate limiting
            } catch (e) {
                // continue with the rest even if one fails
            }
        }

        return repondre(`✅ ${label} complete: ${success}/${targets.length} member(s).`);
    });
}

registerBulkCommand('promoteall', 'promote', 'Promoting', '⬆️');
registerBulkCommand('demoteall', 'demote', 'Demoting', '⬇️');
