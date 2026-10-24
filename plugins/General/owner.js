const { bmbtz } = require("../../devbmb/bmbtz");

/**
 * owner
 *
 * Ported from NOVA-XMD's plugins/General/dev.js (aliased there as
 * 'owner' among others) — replaces BMB-TECH's previous owner.js.
 * Sends an interactive card (title/body/footer + buttons) via
 * relayMessage, followed by a vCard contact, matching NOVA-XMD's exact
 * output. Falls back to a plain text card + vCard if the interactive
 * message fails to send (e.g. unsupported on the recipient's client).
 */
const DEV_NUMBER = "255767862457";
const DEV_NAME = "bmb tech | Bmb Tech Dev";
const DEV_ORG = "BMB-TECH Bot";

bmbtz({
    nomCom: "owner",
    alias: ["developer", "dev", "creator", "devcontact"],
    categorie: "General",
    reaction: "👑",
}, async (dest, client, commandeOptions) => {
    const { ms, repondre } = commandeOptions;

    const react = (emoji) => client.sendMessage(dest, { react: { text: emoji, key: ms.key } }).catch(() => {});

    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${DEV_NAME}\nORG:${DEV_ORG};\nTEL;type=CELL;type=VOICE;waid=${DEV_NUMBER}:+${DEV_NUMBER}\nEND:VCARD`;

    await react("⌛");

    try {
        await client.relayMessage(dest, {
            interactiveMessage: {
                header: {
                    title: "𝗢 𝗪 𝗡 𝗘 𝗥   ◦   𝗗 𝗘 𝗧 𝗔 𝗜 𝗟 𝗦",
                    hasMediaAttachment: false
                },
                body: {
                    text: "*乂  𝗢 𝗪 𝗡 𝗘 𝗥     ◦     𝗜 𝗡 𝗙 𝗢*\n✧ Tag : \n      ◦ @" + DEV_NUMBER + " 🇹🇿\n\n✧ Rules : \n      ◦ _Don't call owner's number_\n      ◦ _Don't talk shit_\n      ◦ _Don't spam_\n      ◦ _Don't goon😡_"
                },
                footer: {
                    text: "bmb tech"
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: "booking_confirmation",
                            buttonParamsJson: JSON.stringify({
                                icon: "default",
                                start_datetime: "2026-06-10T10:37:10.967Z",
                                end_datetime: "2026-06-10T10:47:10.967Z",
                                location: "tech",
                                booking_url: `https://wa.me/${DEV_NUMBER}`,
                                phone_number: DEV_NUMBER,
                                booking_management_url: "https://whatsapp.com/channel/0029VawO6hgF6sn7k3SuVU3z",
                                description: "*◦ 👤 Name  :*  bmbtech\n*◦ 📞 Number  :*  +" + DEV_NUMBER + "\n*◦ 💭 Bio  :*  tech \n*◦ ⚡ Status  :*  _Developer_\n*◦ Country  :*  Tanzania\n",
                                email: "bmbxmd@gmail.com",
                                display_text: "𝐌𝐨𝐫𝐞 𝐎𝐰𝐧𝐞𝐫𝐈𝐧𝐟𝐨",
                                display_content: {
                                    display_language: "en",
                                    display_meeting_type: "𝐈𝐧𝐟𝐨",
                                    display_bottom_sheet_header: "々   P R O F I L E     ◦     I N F O   々",
                                    display_add_to_calendar_cta_text: "CALENDAR",
                                    display_view_on_maps_cta_text: "O W N E R     ◦     C O U N T R Y",
                                    display_manage_booking_cta_text: "🔥 𝐅𝐨𝐥𝐥𝐨𝐰",
                                    display_manage_booking_not_supported_text: "OWNER NOT REGISTERED",
                                    display_read_more: "READ MORE"
                                }
                            })
                        },
                        {
                            name: "cta_url",
                            buttonParamsJson: JSON.stringify({
                                display_text: "🫆 𝐎𝐰𝐧𝐞𝐫 𝐍𝐮𝐦𝐛𝐞𝐫",
                                url: `https://wa.me/${DEV_NUMBER}`
                            })
                        }
                    ],
                    messageParamsJson: ""
                },
                contextInfo: {
                    mentionedJid: [`${DEV_NUMBER}@s.whatsapp.net`]
                }
            }
        }, {});

        await react("✅");

        await client.sendMessage(dest, {
            contacts: { displayName: DEV_NAME, contacts: [{ vcard }] }
        });
    } catch (error) {
        console.error("Owner command error:", error);
        await react("❌");

        const fallbackText = `📌 *DEVELOPER INFO*\n━━━━━━━━━━━━━━━━\n👤 Name: ${DEV_NAME}\n🏢 Project: ${DEV_ORG}\n📞 Contact: +${DEV_NUMBER}\nDon't spam the dev or you'll regret your existence.\nSerious bugs only — no "how do I use this" questions.\n━━━━━━━━━━━━━━━━\n© bmb tech`;
        await repondre(fallbackText);

        await client.sendMessage(dest, {
            contacts: { displayName: DEV_NAME, contacts: [{ vcard }] }
        });
    }
});
