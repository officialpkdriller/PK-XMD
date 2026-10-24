const { exec } = require("child_process");
const { bmbtz } = require("../../devbmb/bmbtz");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const { ajouterOuMettreAJourJid, mettreAJourAction, verifierEtatJid } = require('../../lib/antilien');
const { atbajouterOuMettreAJourJid, atbverifierEtatJid } = require('../../lib/antibot');
const { search, download } = require('aptoide-scraper');
const fs = require('fs-extra');
const conf = require("../../settings");
const { default: axios } = require("axios");
const { getBinaryNodeChild, getBinaryNodeChildren } = require("@whiskeysockets/baileys").default;


// ADD COMMAND — moved to plugins/Group/add.js (fixed: was superUser-only
// and used an invalid "settings" query type that silently failed against
// current WhatsApp servers; the new version matches NOVA-XMD's working add.js)


// REJECT COMMAND
bmbtz({
  nomCom: "reject",
  aliases: ["rejectall", "rej", "reject-all"],
  categorie: "Group",
  reaction: '😇'
}, async (jid, sock, ctx) => {
  const { repondre, verifGroupe, verifAdmin } = ctx;
  if (!verifGroupe) return repondre("This command works in groups only");
  if (!verifAdmin) return repondre("You are not an admin here!");

  const pending = await sock.groupRequestParticipantsList(jid);
  if (pending.length === 0) return repondre("There are no pending join requests for this group.");

  for (const p of pending) {
    await sock.groupRequestParticipantsUpdate(jid, [p.jid], "reject");
  }
  repondre("All pending join requests have been rejected.");
});


// APPROVE COMMAND
bmbtz({
  nomCom: 'approve',
  aliases: ["approve-all", "accept"],
  categorie: "Group",
  reaction: '🔎'
}, async (jid, sock, ctx) => {
  const { repondre, verifGroupe, verifAdmin } = ctx;
  if (!verifGroupe) return repondre("This command works in groups only");
  if (!verifAdmin) return repondre("You are not an admin here!");

  const pending = await sock.groupRequestParticipantsList(jid);
  if (pending.length === 0) return repondre("There are no pending join requests.");

  for (const p of pending) {
    await sock.groupRequestParticipantsUpdate(jid, [p.jid], 'approve');
  }
  repondre("All pending participants have been approved to join.");
});


// VCF COMMAND
bmbtz({
  nomCom: "vcf",
  aliases: ["savecontact", "savecontacts"],
  categorie: "Group",
  reaction: '♻️'
}, async (jid, sock, ctx) => {
  const { repondre, verifGroupe, verifAdmin, ms } = ctx;
  const fs = require('fs');
  if (!verifAdmin) return repondre("You are not an admin here!");
  if (!verifGroupe) return repondre("This command works in groups only");

  try {
    let metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants;
    let vcardData = '';

    for (let member of participants) {
      let number = member.id.split('@')[0];
      let name = member.name || member.notify || `[BMB-TECH] +${number}`;
      vcardData += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${number}:+${number}\nEND:VCARD\n`;
    }

    repondre(`A moment, *BMB-TECH* is compiling ${participants.length} contacts into a vcf...`);
    fs.writeFileSync("./contacts.vcf", vcardData.trim());

    await sock.sendMessage(jid, {
      document: fs.readFileSync("./contacts.vcf"),
      mimetype: "text/vcard",
      fileName: `${metadata.subject}.vcf`,
      caption: `VCF for ${metadata.subject}\nTotal Contacts: ${participants.length}\n*THANKS FOR USING BMB-TECH*`
    }, { ephemeralExpiration: 86400, quoted: ms });

    fs.unlinkSync('./contacts.vcf');

  } catch (err) {
    console.error("Error while creating or sending VCF:", err);
    repondre("An error occurred while creating or sending the VCF. Please try again.");
  }
});


// INVITE COMMAND
bmbtz({
  nomCom: 'invite',
  aliases: ["link"],
  categorie: 'Group',
  reaction: '🪄'
}, async (jid, sock, ctx) => {
  const { repondre, nomGroupe, nomAuteurMessage, verifGroupe } = ctx;
  if (!verifGroupe) return repondre("*This command works in groups only!*");

  try {
    const code = await sock.groupInviteCode(jid);
    repondre(`Hello ${nomAuteurMessage}, here is the group link of ${nomGroupe}:\n\nClick Here To Join: https://chat.whatsapp.com/${code}`);
  } catch (err) {
    console.error("Error fetching group invite link:", err);
    repondre("An error occurred while fetching the group invite link. Please try again.");
  }
});


// REVOKE COMMAND
bmbtz({
  nomCom: 'revoke',
  categorie: 'Group'
}, async (jid, sock, ctx) => {
  const { repondre, verifGroupe, verifAdmin } = ctx;
  if (!verifAdmin) return repondre("for admins.");
  if (!verifGroupe) return repondre("This command is only allowed in groups.");

  await sock.groupRevokeInvite(jid);
  repondre("Group link revoked.");
});