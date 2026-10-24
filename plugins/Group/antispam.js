const { bmbtz } = require('../../devbmb/bmbtz');
const { getGroupFeature, setGroupFeature } = require('../../lib/groupProtection');

const ON = new Set(['on', 'enable', 'enabled', 'warn', 'start']);
const OFF = new Set(['off', 'disable', 'disabled', 'stop']);
const KICK = new Set(['kick', 'remove', 'ban', 'hard', 'strict']);

bmbtz({
    nomCom: 'antispam',
    alias: ['nospam', 'antiflood'],
    categorie: 'Group',
    reaction: '🛡️'
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
    const current = await getGroupFeature(dest, 'antispam');

    if (!val) {
        return repondre(
`╭───〔 ANTISPAM 〕───
│
│ Status: ${current.toUpperCase()}
│ Threshold: 5 messages / 5 seconds
│
│ ▶ ${prefixe}antispam on   (warn spammers)
│ ▶ ${prefixe}antispam kick (kick spammers)
│ ▶ ${prefixe}antispam off  (disable)
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

    await setGroupFeature(dest, 'antispam', newVal);
    const desc = newVal === 'off' ? 'disabled ❌' : newVal === 'kick' ? 'enabled in KICK mode 🦾' : 'enabled in WARN mode ⚠️';
    return repondre(
`╭───〔 ANTISPAM 〕───
│
│ Anti-Spam ${desc}
│ Spammers (5+ msgs in 5s) will be
│ ${newVal === 'off' ? 'ignored' : newVal === 'kick' ? 'deleted + kicked' : 'deleted + warned'}
│
╰──────────────`
    );
});
