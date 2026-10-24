const { bmbtz } = require('../../devbmb/bmbtz');

/**
 * close / open
 *
 * Restricts (close) or allows (open) regular members from sending
 * messages in the group — Baileys' groupSettingUpdate 'announcement'
 * mode (only admins can post) vs 'not_announcement' (everyone can post).
 */
bmbtz({
    nomCom: 'close',
    alias: ['groupclose'],
    categorie: 'Group',
    reaction: '🔒'
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = commandeOptions;

    if (!verifGroupe) {
        return repondre('🚫 *This command is for group use only.*');
    }
    if (!(verifAdmin || superUser)) {
        return repondre('Sorry, only group admins can use this command.');
    }

    try {
        await client.groupSettingUpdate(dest, 'announcement');
        return repondre('🔒 Group closed. Only admins can send messages now.');
    } catch (e) {
        return repondre('Failed to close group: ' + (e.message || e).toString().slice(0, 60));
    }
});

bmbtz({
    nomCom: 'open',
    alias: ['groupopen'],
    categorie: 'Group',
    reaction: '🔓'
}, async (dest, client, commandeOptions) => {
    const { repondre, verifGroupe, verifAdmin, superUser } = commandeOptions;

    if (!verifGroupe) {
        return repondre('🚫 *This command is for group use only.*');
    }
    if (!(verifAdmin || superUser)) {
        return repondre('Sorry, only group admins can use this command.');
    }

    try {
        await client.groupSettingUpdate(dest, 'not_announcement');
        return repondre('🔓 Group opened. Everyone can send messages now.');
    } catch (e) {
        return repondre('Failed to open group: ' + (e.message || e).toString().slice(0, 60));
    }
});
