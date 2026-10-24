const { bmbtz } = require('../../devbmb/bmbtz');
const { getGroupFeature, setGroupFeature } = require('../../lib/groupProtection');

const ON = new Set(['on', 'enable', 'enabled', 'warn', 'start']);
const OFF = new Set(['off', 'disable', 'disabled', 'stop']);
const KICK = new Set(['kick', 'remove', 'ban', 'hard', 'strict']);

bmbtz({
    nomCom: 'antisticker',
    alias: ['nosticker'],
    categorie: 'Group',
    reaction: '🌟'
}, async (dest, client, commandeOptions) => {
    const { arg, repondre, superUser, verifAdmin, verifGroupe, prefixe } = commandeOptions;

    if (!verifGroupe) {
        return repondre('🚫 *This command is for group use only.*');
    }
    if (!(verifAdmin || superUser)) {
        return repondre(
`╭───〔 ACCESS DENIED 〕───
│
│ Admin only command
│
╰──────────────`
        );
    }

    const val = (arg[0] || '').toLowerCase();
    const current = await getGroupFeature(dest, 'antisticker');

    if (!val) {
        return repondre(
`╭───〔 ANTISTICKER 〕───
│
│ Status: ${current.toUpperCase()}
│
│ ▶ ${prefixe}antisticker on   (warn on sticker)
│ ▶ ${prefixe}antisticker kick (kick on sticker)
│ ▶ ${prefixe}antisticker off  (disable)
│
╰──────────────`
        );
    }

    let newVal;
    if (KICK.has(val)) newVal = 'kick';
    else if (ON.has(val)) newVal = 'warn';
    else if (OFF.has(val)) newVal = 'off';
    else {
        return repondre(`Invalid option: ${val}\nUse: on, off, or kick`);
    }

    await setGroupFeature(dest, 'antisticker', newVal);
    const desc = newVal === 'off' ? 'disabled ❌' : newVal === 'kick' ? 'enabled in KICK mode 🦾' : 'enabled in WARN mode ⚠️';
    return repondre(
`╭───〔 ANTISTICKER 〕───
│
│ Anti-Sticker ${desc}
│ Stickers will be
│ ${newVal === 'off' ? 'allowed' : newVal === 'kick' ? 'deleted + sender kicked' : 'deleted + sender warned'}
│
╰──────────────`
    );
});
