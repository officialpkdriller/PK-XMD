const { bmbtz } = require('../../devbmb/bmbtz');
const { attribuerUnevaleur, recupevents } = require('../../lib/welcome');

/**
 * setwelcome / setgoodbye
 *
 * Lets group admins set a custom welcome/goodbye message. Supports the
 * placeholders: {user} {group} {desc} {date} {time} {count}
 * index.js substitutes these when it actually sends the message.
 *
 * Storage reuses lib/welcome.js's existing attribuerUnevaleur(jid, row, value)
 * — same file/mechanism the on/off toggles already use — under the row
 * names "welcometext" / "goodbyetext".
 */
function registerSetMessageCommand(nomCom, row, label) {
    bmbtz({
        nomCom,
        categorie: 'Group',
        reaction: '📝'
    }, async (dest, client, commandeOptions) => {
        const { arg, repondre, superUser, verifAdmin, verifGroupe } = commandeOptions;

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

        const text = (arg || []).join(' ').trim();

        if (!text) {
            const current = await recupevents(dest, row);
            return repondre(
`╭───〔 ${label.toUpperCase()} 〕───
│
│ Current: ${current === 'non' ? '(default message)' : current}
│
│ Usage:
│ ${nomCom} <text>
│ ${nomCom} reset
│
│ Placeholders:
│ {user} {group} {desc} {date} {time} {count}
│
╰──────────────`
            );
        }

        if (text.toLowerCase() === 'reset') {
            await attribuerUnevaleur(dest, row, 'non');
            return repondre(`✅ ${label} reset to the default message.`);
        }

        await attribuerUnevaleur(dest, row, text);
        return repondre(`✅ ${label} updated.`);
    });
}

registerSetMessageCommand('setwelcome', 'welcometext', 'Welcome message');
registerSetMessageCommand('setgoodbye', 'goodbyetext', 'Goodbye message');
