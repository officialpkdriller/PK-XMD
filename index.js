"use strict";
// Verify the core command registry (devbmb/bmbtz.js) hasn't been
// renamed, removed, or tampered with before anything else loads — see
// lib/integrityGuard.js for what exactly this checks and why.
require("./lib/integrityGuard").verifyIntegrity(__dirname);

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc); 
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';
const pino = require("pino");
const boom_1 = require("@hapi/boom");
const conf = require("./settings");
const { loadSettingsCache, getCachedSettingsSync } = require('./lib/settingsCache');

function getConf(key) {
    const cached = getCachedSettingsSync();
    return (cached && cached[key] !== undefined) ? cached[key] : conf[key];
}

const { cacheLidPhone, resolveLidToJid, resolveLidForStatus } = require('./lib/lidResolver');
const axios = require("axios");
let fs = require("fs-extra");
let path = require("path");
const os = require("os");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

try {
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    console.log('✅ ffmpeg path set to bundled binary:', ffmpegInstaller.path);
} catch (e) {
    console.log('⚠️ Could not set bundled ffmpeg path:', e.message);
}

const { verifierEtatJid } = require("./lib/antilien");
const { atbverifierEtatJid , atbrecupererActionJid } = require("./lib/antibot");
let evt = require(__dirname + "/devbmb/bmbtz");
const {isUserBanned , addUserToBanList , removeUserFromBanList} = require("./lib/banUser");
const  {addGroupToBanList,isGroupBanned,removeGroupFromBanList} = require("./lib/banGroup");
const {isGroupOnlyAdmin,addGroupToOnlyAdminList,removeGroupFromOnlyAdminList} = require("./lib/onlyAdmin");
let { reagir } = require(__dirname + "/devbmb/app");
const { getAllSudoNumbers } = require("./lib/sudo");
const ownerAccess = require("./lib/ownerAccess");
const noPrefix = require("./lib/noPrefix");
// Tapped buttons are read with lib/buttons.js. The bot still starts if that file is missing (taps just do nothing).
let buttonKit = { replyId: () => "" };
try { buttonKit = require("./lib/buttons"); } catch (e) { console.log("⚠️ lib/buttons.js is missing - button taps will not work until it is uploaded."); }
const cmdStats = require("./lib/cmdStats");
let cachedSudoNumbers = [];
async function refreshSudoCache() {
    try { cachedSudoNumbers = await getAllSudoNumbers(); } catch (e) {}
}
refreshSudoCache();
setInterval(refreshSudoCache, 30000);
// .addsudo / .delsudo emit this event so the change applies immediately.
process.on("bmb:sudo-changed", refreshSudoCache);
var session = conf.session.replace(/BMB-TECH~/g,"");
const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206)
const readmore = more.repeat(4001)
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/public/creds.json")) {
            console.log("connexion en cour ...");
            await fs.writeFileSync(__dirname + "/public/creds.json", atob(session), "utf8");
        }
        else if (fs.existsSync(__dirname + "/public/creds.json") && session != "zokk") {
            await fs.writeFileSync(__dirname + "/public/creds.json", atob(session), "utf8");
        }
    }
    catch (e) {
        console.log("Session Invalid " + e);
        return;
    }
}
authentification();
const { makeStore } = require(__dirname + "/lib/MakeStore");
const store = makeStore();

let isReconnecting = false;
function safeReconnect(reason) {
    if (isReconnecting) {
        console.log(`Reconnect already in progress, skipping duplicate trigger (${reason})`);
        return;
    }
    isReconnecting = true;
    console.log(`Reconnecting... (${reason})`);
    setTimeout(() => {
        main();
    }, 2000);
}

const CHANNEL_JID = '120363382023564830@newsletter';
const CHANNEL_EMOJIS = ['❤️', '🫪', '👍🏻', '🤩', '⚡', '🗿', '😮'];
const STATUS_EMOJIS = ['❤️', '🩶', '🔥', '🤍', '♦️', '🎉', '💚', '💯', '✨', '☢️', '😍', '🎊'];
let hasFollowedChannel = false;

let boundedAttempts = 0;
const MAX_BOUNDED_ATTEMPTS = 5;
function boundedReconnect(reason) {
    if (isReconnecting) {
        console.log(`Reconnect already in progress, skipping duplicate trigger (${reason})`);
        return;
    }
    boundedAttempts++;
    if (boundedAttempts > MAX_BOUNDED_ATTEMPTS) {
        console.log(`❌ Failed to reconnect after ${MAX_BOUNDED_ATTEMPTS} attempts (${reason}). Please generate a new SESSION_ID and redeploy.`);
        return;
    }
    isReconnecting = true;
    const backoffMs = Math.min(5000 * boundedAttempts, 30000);
    console.log(`Reconnecting (bounded, attempt ${boundedAttempts}/${MAX_BOUNDED_ATTEMPTS})... (${reason}) in ${backoffMs}ms`);
    setTimeout(() => {
        main();
    }, backoffMs);
}

async function main() {
        await loadSettingsCache().catch((e) => console.log('⚠️ settings cache load failed:', e.message));

        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/public");
        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['Bmb-Tech', "safari", "1.0.0"],
            printQRInTerminal: true,
            fireInitQueries: false,
            shouldSyncHistoryMessage: (msg) => {
                return msg?.syncType !== 2;
            },
            downloadHistory: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            keepAliveIntervalMs: 30_000,
            auth: {
                creds: state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return {
                    conversation: 'An Error Occurred, Repeat Command!'
                };
            }
        };
        const client = (0, baileys_1.default)(sockOptions);
// Remembers the IDs of the messages this bot sends, so a message typed by a person on the bot's own
// account can run as a command without the bot ever triggering itself. See lib/ownMessageGuard.js.
const ownGuard = require('./lib/ownMessageGuard').install(
    client,
    typeof baileys_1.generateMessageID === 'function'
        ? baileys_1.generateMessageID
        : (typeof baileys_1.generateMessageIDV2 === 'function' ? () => baileys_1.generateMessageIDV2(client.user && client.user.id) : null)
);
store.bind(client.ev);

if (client.signalRepository?.lidMapping?.on) {
    client.signalRepository.lidMapping.on('update', (updates) => {
        for (const update of updates) {
            if (update.lid && update.pn) {
                const lidNum = update.lid.split('@')[0].split(':')[0];
                const phoneNum = update.pn.split('@')[0].split(':')[0].replace(/\D/g, '');
                cacheLidPhone(lidNum, phoneNum);
            }
        }
    });
}
client.ev.on('lid-mapping.update', (map) => {
    for (const [lid, phoneNumber] of Object.entries(map || {})) {
        const lidClean = lid.split('@')[0].split(':')[0];
        const phoneClean = String(phoneNumber).split('@')[0].split(':')[0].replace(/\D/g, '');
        cacheLidPhone(lidClean, phoneClean);
    }
});

   const rateLimit = new Map();

function isRateLimited(jid) {
    const now = Date.now();
    if (!rateLimit.has(jid)) {
        rateLimit.set(jid, now);
        return false;
    }
    const lastRequestTime = rateLimit.get(jid);
    if (now - lastRequestTime < 3000) {
        return true;
    }
    rateLimit.set(jid, now);
    return false;
}

const groupMetadataCache = new Map();
async function getGroupMetadata(client, groupId) {
    if (groupMetadataCache.has(groupId)) {
        return groupMetadataCache.get(groupId);
    }

    try {
        const metadata = await client.groupMetadata(groupId);
        groupMetadataCache.set(groupId, metadata);
        setTimeout(() => groupMetadataCache.delete(groupId), 60000);
        return metadata;
    } catch (error) {
        if (error.message.includes("rate-overlimit")) {
            await new Promise(res => setTimeout(res, 5000));
        }
        return null;
    }
}

process.on("uncaughtException", (err) => { console.log("UNCAUGHT EXCEPTION:", err); });
process.on("unhandledRejection", (err) => { console.log("UNHANDLED REJECTION:", err); });

client.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    if (!messages || messages.length === 0) return;

    for (const ms of messages) {
        if (!ms.message) continue;
        const from = ms.key.remoteJid;
        if (isRateLimited(from)) continue;
    }
});

client.ev.on("messages.upsert", async (m) => {
    try {
        const { messages } = m;
        if (!messages || messages.length === 0) return;

        for (const mek of messages) {
            const remoteJid = mek.key?.remoteJid;
            if (!remoteJid || mek.message?.protocolMessage) continue;
            const _mtype = (0, baileys_1.getContentType)(mek.message);
            if (_mtype === 'reactionMessage') continue;

            if (remoteJid === "status@broadcast") {
                if ((getConf('AUTO_REACT_STATUS') || "").toLowerCase() === "on") {
                    try {
                        if (!global._statusSeen) global._statusSeen = new Set();
                        const statusId = mek.key?.id || '';
                        if (statusId) {
                            if (global._statusSeen.has(statusId)) continue;
                            global._statusSeen.add(statusId);
                            if (global._statusSeen.size > 300) global._statusSeen.delete(global._statusSeen.values().next().value);
                        }

                        let posterJid = mek.key?.participant || mek.participant;
                        if (!posterJid) {
                            console.log('[autolikestatus] skipped: no posterJid on status message');
                            continue;
                        }

                        const resolvedJid = posterJid.endsWith('@lid')
                            ? await resolveLidForStatus(client, posterJid)
                            : posterJid;

                        let botJid;
                        try {
                            botJid = client.decodeJid ? client.decodeJid(client.user.id) : null;
                        } catch (e) { botJid = null; }
                        if (!botJid) {
                            botJid = (client.user.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
                        }

                        const emoji = STATUS_EMOJIS[Math.floor(Math.random() * STATUS_EMOJIS.length)];

                        await client.sendMessage(
                            "status@broadcast",
                            { react: { text: emoji, key: { ...mek.key, participant: resolvedJid } } },
                            { statusJidList: [resolvedJid, botJid].filter(Boolean) }
                        );

                        console.log(
                            '[autolikestatus] reacted to status from', posterJid,
                            resolvedJid !== posterJid ? `(resolved to ${resolvedJid})` : '(unresolved @lid — best-effort, may not show on WhatsApp)',
                            'with', emoji
                        );
                    } catch (e) {
                        console.log('[autolikestatus] failed:', e.message || e);
                    }
                }
                continue;
            }

            if (remoteJid === CHANNEL_JID) {
                try {
                    const messageId = mek.key?.server_id || mek.newsletterServerId || mek.key.id;
                    if (!messageId || !client?.user?.id) continue;
                    const emoji = CHANNEL_EMOJIS[Math.floor(Math.random() * CHANNEL_EMOJIS.length)];
                    const delay = 3000 + Math.floor(Math.random() * 7000);
                    await new Promise((r) => setTimeout(r, delay));
                    if (typeof client.newsletterReactMessage === "function") {
                        await client.newsletterReactMessage(remoteJid, messageId.toString(), emoji);
                    }
                } catch (e) {}
            }
        }
    } catch (e) {}
});

client.ev.on("groups.update", async (updates) => {
    for (const update of updates) {
        const { id } = update;
        if (!id.endsWith("@g.us")) continue;
        await getGroupMetadata(client, id);
    }
});     

const { getGroupFeature, addGroupWarn, resetGroupWarn } = require(__dirname + "/lib/groupProtection");
const _spamMsgLog = new Map();
const SPAM_THRESHOLD = 5;
const SPAM_WINDOW_MS = 5000;
const GROUP_PROTECTION_MAX_WARNS = 3;

function _trackSpamMessage(key) {
    const now = Date.now();
    if (!_spamMsgLog.has(key)) _spamMsgLog.set(key, []);
    const timestamps = _spamMsgLog.get(key).filter((t) => now - t < SPAM_WINDOW_MS);
    timestamps.push(now);
    _spamMsgLog.set(key, timestamps);
    if (_spamMsgLog.size > 5000) {
        const first = _spamMsgLog.keys().next().value;
        _spamMsgLog.delete(first);
    }
    return timestamps.length;
}

client.ev.on("messages.upsert", async (m) => {
    try {
        const { messages } = m;
        if (!messages || messages.length === 0) return;

        for (const mek of messages) {
            if (mek.key?.fromMe) continue;
            if ((0, baileys_1.getContentType)(mek.message) === 'reactionMessage') continue;
            const groupId = mek.key?.remoteJid;
            if (!groupId || !groupId.endsWith("@g.us")) continue;

            const sender = mek.key?.participant;
            if (!sender) continue;
            const senderNum = sender.split("@")[0];

            let meta;
            try {
                meta = await getGroupMetadata(client, groupId);
            } catch (e) { continue; }
            if (!meta || !Array.isArray(meta.participants)) continue;

            const botNum = (client.user?.id || "").split(":")[0].split("@")[0];
            const isSenderAdmin = meta.participants.some((p) => p.id?.split("@")[0] === senderNum && (p.admin === "admin" || p.admin === "superadmin"));
            const isBotAdmin = meta.participants.some((p) => p.id?.split("@")[0] === botNum && (p.admin === "admin" || p.admin === "superadmin"));
            if (isSenderAdmin) continue;

            if (mek.message?.stickerMessage) {
                const mode = await getGroupFeature(groupId, "antisticker");
                if (mode !== "off") {
                    if (!isBotAdmin) {
                    } else {
                        const deleteKey = { remoteJid: groupId, fromMe: false, id: mek.key.id, participant: sender };
                        await client.sendMessage(groupId, { delete: deleteKey }).catch(() => {});

                        if (mode === "kick") {
                            await client.groupParticipantsUpdate(groupId, [sender], "remove").catch(() => {});
                            await client.sendMessage(groupId, { text: `🌟 *ANTISTICKER*\n@${senderNum} was removed for sending a sticker.`, mentions: [sender] }).catch(() => {});
                        } else {
                            const count = await addGroupWarn(groupId, "antisticker", senderNum);
                            if (count >= GROUP_PROTECTION_MAX_WARNS) {
                                await resetGroupWarn(groupId, "antisticker", senderNum);
                                await client.groupParticipantsUpdate(groupId, [sender], "remove").catch(() => {});
                                await client.sendMessage(groupId, { text: `🌟 *ANTISTICKER*\n@${senderNum} removed after reaching the warn limit.`, mentions: [sender] }).catch(() => {});
                            } else {
                                await client.sendMessage(groupId, { text: `🌟 *ANTISTICKER*\n@${senderNum} warned (${count}/${GROUP_PROTECTION_MAX_WARNS}) — stickers aren't allowed here.`, mentions: [sender] }).catch(() => {});
                            }
                        }
                    }
                }
                continue;
            }

            const spamMode = await getGroupFeature(groupId, "antispam");
            if (spamMode !== "off" && mek.message) {
                const count = _trackSpamMessage(groupId + ":" + senderNum);
                if (count >= SPAM_THRESHOLD) {
                    _spamMsgLog.delete(groupId + ":" + senderNum);
                    if (isBotAdmin) {
                        if (spamMode === "kick") {
                            await client.groupParticipantsUpdate(groupId, [sender], "remove").catch(() => {});
                            await client.sendMessage(groupId, { text: `🛡️ *ANTISPAM*\n@${senderNum} was kicked for spamming.`, mentions: [sender] }).catch(() => {});
                        } else {
                            const warnCount = await addGroupWarn(groupId, "antispam", senderNum);
                            if (warnCount >= GROUP_PROTECTION_MAX_WARNS) {
                                await resetGroupWarn(groupId, "antispam", senderNum);
                                await client.groupParticipantsUpdate(groupId, [sender], "remove").catch(() => {});
                                await client.sendMessage(groupId, { text: `🛡️ *ANTISPAM*\n@${senderNum} removed after reaching the warn limit.`, mentions: [sender] }).catch(() => {});
                            } else {
                                await client.sendMessage(groupId, { text: `🛡️ *ANTISPAM*\n@${senderNum}, stop spamming! (${warnCount}/${GROUP_PROTECTION_MAX_WARNS})`, mentions: [sender] }).catch(() => {});
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {}
});

// ================== ANTI STATUS MENTION ENFORCEMENT ==================
// Was created in lib/antiStatusMention.js but never actually wired up
// anywhere in index.js — that's why .antistatusmention had no effect
// even after being configured. Wiring it in here, as its own dedicated
// listener (matches the modular pattern already used for antispam/
// antisticker/autolike/antidelete above).
const { checkStatusMention } = require('./lib/antiStatusMention');
client.ev.on("messages.upsert", async (m) => {
    try {
        const { messages } = m;
        if (!messages || messages.length === 0) return;
        for (const mek of messages) {
            await checkStatusMention(client, mek).catch((e) => console.log('[antistatusmention] error:', e.message || e));
        }
    } catch (e) {}
});


const moment = require("moment-timezone");

client.ev.on("messages.upsert", async (m) => {
    if (getConf('ANTIDELETE') === "on") {
        const { messages } = m;
        const ms = messages[0];
        if (!ms.message) return;
        if ((0, baileys_1.getContentType)(ms.message) === 'reactionMessage') return;

        const messageKey = ms.key;
        const remoteJid = messageKey.remoteJid;

        if (!store.chats[remoteJid]) {
            store.chats[remoteJid] = [];
        }

        store.chats[remoteJid].push(ms);

        if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0) {
            const deletedKey = ms.message.protocolMessage.key;
            const chatMessages = store.chats[remoteJid];
            const deletedMessage = chatMessages.find(
                (msg) => msg.key.id === deletedKey.id
            );

            if (deletedMessage) {
                try {
                    const participant = deletedMessage.key.participant || deletedMessage.key.remoteJid;
                    const name = `@${participant.split("@")[0]}`;
                    const ownerNumForDelete = (getConf('NUMERO_OWNER') || conf.NUMERO_OWNER || '').replace(/[^0-9]/g, '');
                    const botOwnJid = (client.user?.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';
                    const botOwnerJid = ownerNumForDelete
                        ? `${ownerNumForDelete}@s.whatsapp.net`
                        : botOwnJid;

                    const date = moment().tz("Africa/Nairobi").format("DD/MM/YYYY");
                    const time = moment().tz("Africa/Nairobi").format("HH:mm:ss");

                    const boxHeader = `╭───────────────━⊷\n`;
                    const boxFooter = `╰───────────────━⊷`;
                    const boxBody = `
║ *🗑️ 𝗗𝗘𝗟𝗘𝗧𝗘𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘*
║══════════════════════
║ 👤 From: ${name}
║══════════════════════
║ 📅 Date: ${date}
║══════════════════════
║ 🕒 Time: ${time}
║══════════════════════`;

                    const fullText = `${boxHeader}${boxBody}\n${boxFooter}`;

                    if (deletedMessage.message.conversation) {
                        await client.sendMessage(botOwnerJid, {
                            text: `${fullText}\n\n📝 *Message:* ${deletedMessage.message.conversation}`,
                            mentions: [participant],
                        });
                    } else if (deletedMessage.message.imageMessage) {
                        const caption = deletedMessage.message.imageMessage.caption || '';
                        const imagePath = await client.downloadAndSaveMediaMessage(deletedMessage.message.imageMessage);
                        await client.sendMessage(botOwnerJid, {
                            image: { url: imagePath },
                            caption: `${fullText}\n\n🖼️ ${caption}`,
                            mentions: [participant],
                        });
                    } else if (deletedMessage.message.videoMessage) {
                        const caption = deletedMessage.message.videoMessage.caption || '';
                        const videoPath = await client.downloadAndSaveMediaMessage(deletedMessage.message.videoMessage);
                        await client.sendMessage(botOwnerJid, {
                            video: { url: videoPath },
                            caption: `${fullText}\n\n🎬 ${caption}`,
                            mentions: [participant],
                        });
                    } else if (deletedMessage.message.audioMessage) {
                        const audioPath = await client.downloadAndSaveMediaMessage(deletedMessage.message.audioMessage);
                        await client.sendMessage(botOwnerJid, {
                            audio: { url: audioPath },
                            ptt: true,
                            caption: `${fullText}\n🔊 Deleted Voice`,
                            mentions: [participant],
                        });
                    } else if (deletedMessage.message.stickerMessage) {
                        const stickerPath = await client.downloadAndSaveMediaMessage(deletedMessage.message.stickerMessage, '', true, 'sticker');
                        await client.sendMessage(botOwnerJid, {
                            sticker: { url: stickerPath },
                            caption: `${fullText}\n🗑️ Deleted Sticker`,
                            mentions: [participant],
                        });
                    }
                } catch (error) {
                    console.error('❌ Error handling deleted message:', error);
                }
            }
        }
    }
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let lastReactionTime = 0;

client.ev.on("messages.upsert", async (m) => {
    const { messages } = m;
    const ms = messages[0];

    if (!ms.message) return;

    const messageContent = ms.message.conversation || ms.message.extendedTextMessage?.text || '';
    const sender = ms.key.remoteJid;

    const prefixUsed = messageContent.charAt(0);

    if (messageContent.slice(1).toLowerCase() === "vcf") {
        if (!sender.endsWith("@g.us")) {
            await client.sendMessage(sender, {
                text: `❌ This command only works in groups.\n\n🚀 Bmb Tech`,
            });
            return;
        }

        const baseName = "Charles family";

        await createAndSendGroupVCard(sender, baseName, client);
    }
});

        client.ev.on("call", async (callData) => {
  if (getConf('ANTICALL') === 'on') {
    const callId = callData[0].id;
    await client.rejectCall(callId, callData[0].from);
  }
});
        
        client.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            if (!ms.message)
                return;
            const decodeJid = (jid) => {
                if (!jid)
                    return jid;
                if (/:\d+@/gi.test(jid)) {
                    let decode = (0, baileys_1.jidDecode)(jid) || {};
                    return decode.user && decode.server && decode.user + '@' + decode.server || jid;
                }
                else
                    return jid;
            };
            var mtype = (0, baileys_1.getContentType)(ms.message);

            if (ms.key?.participant?.endsWith('@lid') && ms.key?.participantAlt && !ms.key.participantAlt.endsWith('@lid')) {
                const lidNum = ms.key.participant.split('@')[0].split(':')[0];
                const phoneNum = ms.key.participantAlt.split('@')[0].split(':')[0].replace(/\D/g, '');
                cacheLidPhone(lidNum, phoneNum);
            }

            if (ms.key?.remoteJid?.endsWith('@lid') && ms.key?.remoteJidAlt && !ms.key.remoteJidAlt.endsWith('@lid')) {
                const lidNum = ms.key.remoteJid.split('@')[0].split(':')[0];
                const phoneNum = ms.key.remoteJidAlt.split('@')[0].split(':')[0].replace(/\D/g, '');
                cacheLidPhone(lidNum, phoneNum);
            }

            if (mtype === 'reactionMessage') return;
            var texte = mtype == "conversation" ? ms.message.conversation : mtype == "imageMessage" ? ms.message.imageMessage?.caption : mtype == "videoMessage" ? ms.message.videoMessage?.caption : mtype == "extendedTextMessage" ? ms.message?.extendedTextMessage?.text : mtype == "buttonsResponseMessage" ?
                ms?.message?.buttonsResponseMessage?.selectedButtonId : mtype == "listResponseMessage" ?
                ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId : mtype == "messageContextInfo" ?
                (ms?.message?.buttonsResponseMessage?.selectedButtonId || ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text) : (mtype == "interactiveResponseMessage" || mtype == "templateButtonReplyMessage") ? buttonKit.replyId(ms.message) : mtype == "groupInviteMessage" ?
                `https://chat.whatsapp.com/${ms.message?.groupInviteMessage?.inviteCode || ''}` : "";
            var origineMessage = ms.key.remoteJid;
            var idBot = decodeJid(client.user.id);
            var servBot = idBot.split('@')[0];
            const verifGroupe = origineMessage?.endsWith("@g.us");
            var infosGroupe = verifGroupe ? await getGroupMetadata(client, origineMessage) : "";
            var nomGroupe = verifGroupe ? (infosGroupe?.subject || "") : "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            var mr = ms.message?.extendedTextMessage?.contextInfo?.mentionedJid
                || ms.message?.[mtype]?.contextInfo?.mentionedJid
                || [];
            var utilisateur = (mr && mr.length > 0) ? mr[0] : (msgRepondu ? auteurMsgRepondu : "");
            var auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }
            
            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const nomAuteurMessage = ms.pushName;
            const sudo = cachedSudoNumbers;

            const DEV_NUMBER = '255767862457';

            // Owner detection (NOVA-XMD style): numbers are compared as plain digits, and
            // "@lid" senders in groups are converted to their real phone number first.
            // Owners: the bot's own number, the creator (DEV_NUMBER), every number in the
            // OWNER_NUMBER / NUMERO_OWNER env vars (comma separated), and sudo users.
            const senderResolved = await ownerAccess.resolveSenderAsync(client, auteurMessage, verifGroupe ? (infosGroupe?.participants || []) : [], verifGroupe);
            const access = ownerAccess.classifySender({
                senderJid: senderResolved,
                botJid: idBot,
                botLid: client.user?.lid,
                devNumber: DEV_NUMBER,
                ownerNumbers: [getConf('NUMERO_OWNER'), conf.NUMERO_OWNER, process.env.OWNER_NUMBER],
                sudoJids: sudo,
            });
            const superUser = access.superUser;
            const fullOwner = access.fullOwner;

            const dev = access.isDev;
            function repondre(mes) { client.sendMessage(origineMessage, { text: mes }, { quoted: ms }); }
            console.log("\t🌍BMB-TECH ONLINE🌍");
            console.log("=========== incoming message ===========");
            if (verifGroupe) {
                console.log("message from group: " + nomGroupe);
            }
            console.log("message sent by: " + "[" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + " ]");
            console.log("message type: " + mtype);
            console.log("------ message content ------");
            console.log(texte);
            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (m of membreGroupe) {
                    if (m.admin == null)
                        continue;
                    admin.push(m.id);
                }
                return admin;
            }

            var etat = getConf('ETAT');
            const presenceType = etat==1 ? "available" : etat==2 ? "composing" : etat==3 ? "recording" : "unavailable";
            client.sendPresenceUpdate(presenceType, origineMessage).catch(()=>{});

            const mbre = verifGroupe ? (infosGroupe?.participants || []) : '';
            let admins = verifGroupe ? groupeAdmin(mbre) : '';
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifBmbtzAdmin = verifGroupe ? admins.includes(idBot) : false;
            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;

            const ALL_PREFIXES = ['.', '!', '#', '/', '$', '?', '+', '-', '*', '~', '@', '%', '&', '^', '=', '|'];
            const configuredPrefix = getConf('PREFIXE') || '.';
            let usedPrefix = null;
            if (texte) {
                if (texte.startsWith(configuredPrefix)) {
                    usedPrefix = configuredPrefix;
                } else {
                    usedPrefix = ALL_PREFIXES.find((p) => texte.startsWith(p)) || null;
                }
            }
            // Commands typed WITHOUT a prefix ("menu" works like ".menu"). See lib/noPrefix.js for the rules.
            let noPrefixCommand = '';
            if (!usedPrefix && texte) {
                noPrefixCommand = noPrefix.detect({
                    text: texte, mtype, key: ms.key, commands: evt.cm,
                    mode: noPrefix.resolveMode(getConf('NOPREFIX')),
                    isGroup: verifGroupe, superUser,
                    ownMessageAllowed: !!ms.key.fromMe && ownGuard.isTypedByHuman(ms.key.id),
                }) || '';
            }
            const verifCom = !!usedPrefix || !!noPrefixCommand;
            const com = usedPrefix
                ? texte.slice(usedPrefix.length).trim().split(/ +/).shift().toLowerCase()
                : (noPrefixCommand || false);
           
         
            const lien = conf.URL.split(',')  

            
function mybotpic() {
     const indiceAleatoire = Math.floor(Math.random() * lien.length);
     const lienAleatoire = lien[indiceAleatoire];
     return lienAleatoire;
  }
            var commandeOptions = {
    superUser, dev, fullOwner, isSudo: access.isSudo, senderJid: senderResolved,
    verifGroupe,
    mbre,
    membreGroupe,
    verifAdmin,
    infosGroupe,
    nomGroupe,
    auteurMessage,
    nomAuteurMessage,
    idBot,
    verifBmbtzAdmin,
    prefixe: getConf('PREFIXE'),
    arg,
    repondre,
    mtype,
    groupeAdmin,
    msgRepondu,
    auteurMsgRepondu,
    mentionedJid: mr,
    utilisateur,
    ms,
    mybotpic
};


if (getConf('AUTO_READ') === 'on' && !ms.key.fromMe) {
    client.readMessages([ms.key]).catch(()=>{});
}
            if (ms.key && ms.key.remoteJid === "status@broadcast" && getConf('AUTO_READ_STATUS') === "on") {
                await client.readMessages([ms.key]);
            }
            if (ms.key && ms.key.remoteJid === 'status@broadcast' && getConf('AUTO_DOWNLOAD_STATUS') === "on") {
                if (ms.message.extendedTextMessage) {
                    var stTxt = ms.message.extendedTextMessage.text;
                    await client.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                }
                else if (ms.message.imageMessage) {
                    var stMsg = ms.message.imageMessage.caption;
                    var stImg = await client.downloadAndSaveMediaMessage(ms.message.imageMessage);
                    await client.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                }
                else if (ms.message.videoMessage) {
                    var stMsg = ms.message.videoMessage.caption;
                    var stVideo = await client.downloadAndSaveMediaMessage(ms.message.videoMessage);
                    await client.sendMessage(idBot, {
                        video: { url: stVideo }, caption: stMsg
                    }, { quoted: ms });
                }
            }
            if (!dev && origineMessage == "120363158701337904@g.us") {
                return;
            }
            
             if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
  const { ajouterOuMettreAJourUserData } = require("./lib/level"); 
  try {
    await ajouterOuMettreAJourUserData(auteurMessage);
  } catch (e) {
    console.error(e);
  }
              }
            
              try {
        
                if (ms.message[mtype].contextInfo.mentionedJid && (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) ||  ms.message[mtype].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))) {
            
                    if (origineMessage == "120363382023564830@newsletter") {
                        return;
                    } ;
            
                    if(superUser) {console.log('hummm') ; return ;} 
                    
                    let mbd = require('./lib/mention') ;
            
                    let alldata = await mbd.recupererToutesLesValeurs() ;
            
                        let data = alldata[0] ;
            
                    if ( data.status === 'non') { console.log('mention not active') ; return ;}
            
                    let msg ;
            
                    if (data.type.toLocaleLowerCase() === 'image') {
            
                        msg = {
                                image : { url : data.url},
                                caption : data.message
                        }
                    } else if (data.type.toLocaleLowerCase() === 'video' ) {
            
                            msg = {
                                    video : {   url : data.url},
                                    caption : data.message
                            }
            
                    } else if (data.type.toLocaleLowerCase() === 'sticker') {
            
                        let stickerMess = new Sticker(data.url, {
                            pack: conf.NOM_OWNER,
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"],
                            id: "12345",
                            quality: 70,
                            background: "transparent",
                          });
            
                          const stickerBuffer2 = await stickerMess.toBuffer();
            
                          msg = {
                                sticker : stickerBuffer2 
                          }
            
                    }  else if (data.type.toLocaleLowerCase() === 'audio' ) {
            
                            msg = {
            
                                audio : { url : data.url } ,
                                mimetype:'audio/mp4',
                                 }
                        
                    }
            
                    client.sendMessage(origineMessage,msg,{quoted : ms})
            
                }
            } catch (error) {
                
            } 


     //anti-link
     try {
        const linkRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|www\.[^\s]+)/i;
        const { getRemoveMode: getAntilinkRemoveMode, getWarnMode: getAntilinkWarnMode } = require('./lib/antilien');
        const yes = verifGroupe ? await verifierEtatJid(origineMessage) : false;

        if (verifGroupe && yes) {
            console.log('[antilink] check — texte:', JSON.stringify(texte), '| mtype:', mtype, '| matches regex:', texte ? linkRegex.test(texte) : false);
        }

        if (yes && verifGroupe && texte && linkRegex.test(texte)) {
            console.log('[antilink] link detected, sender admin/superUser bypass:', (superUser || verifAdmin));

            if (!(superUser || verifAdmin)) {

                let isOwnGroupLink = false;
                try {
                    const ownCode = await client.groupInviteCode(origineMessage);
                    if (ownCode && texte.includes(ownCode)) isOwnGroupLink = true;
                } catch (e) { }

                if (!isOwnGroupLink) {
                    console.log("link detected");

                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };

                    // The master "antilink on" toggle always means: delete
                    // the offending message. "remove" and "warn" are
                    // independent modifiers layered on top of that —
                    // see plugins/Group/antilink.js for the new
                    // .antilink / .antilink remove / .antilink warn
                    // command syntax this replaces the old single-mode
                    // (delete/warn/remove) design with. No sticker is
                    // sent for any of this anymore (previously "remove"
                    // sent a gif sticker — removed per request).
                    try {
                        await client.sendMessage(origineMessage, { delete: key });
                    } catch (e) {
                        console.log('antilink delete failed:', e.message || e);
                    }

                    const removeOn = await getAntilinkRemoveMode(origineMessage);
                    const warnOn = await getAntilinkWarnMode(origineMessage);

                    if (removeOn) {
                        // Immediate kick takes priority over warn-accumulation
                        // when both are enabled — no point tracking a warn
                        // count if the sender is being removed right now.
                        const txt = `link detected \nmessage deleted \n@${auteurMessage.split("@")[0]} removed from group.`;
                        await client.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] });
                        try {
                            await client.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        } catch (e) {
                            console.log("antilink remove failed: " + e);
                        }
                    }

                    else if (warnOn) {
                        const { addGroupWarn, resetGroupWarn } = require('./lib/groupProtection');
                        const warnLimit = Number(getConf('WARN_COUNT')) || 3;
                        const senderNum = auteurMessage.split('@')[0];
                        const warnCount = await addGroupWarn(origineMessage, 'antilink', senderNum);

                        if (warnCount >= warnLimit) {
                            await resetGroupWarn(origineMessage, 'antilink', senderNum);
                            const kikmsg = `link detected , you will be removed because of reaching warn-limit`;
                            await client.sendMessage(origineMessage, { text: kikmsg, mentions: [auteurMessage] });
                            try {
                                await client.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            } catch (e) {
                                console.log("antilink warn-kick failed: " + e);
                            }
                        } else {
                            const rest = warnLimit - warnCount;
                            const msg = `Link detected , your warn_count was upgraded ;\n rest : ${rest} `;
                            await client.sendMessage(origineMessage, { text: msg, mentions: [auteurMessage] });
                        }
                    }

                    else {
                        // Neither remove nor warn is on — just delete,
                        // silently, no follow-up message.
                        const txt = `link detected \nmessage deleted \n@${auteurMessage.split("@")[0]} avoid sending link.`;
                        await client.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] });
                    }
                }
            }
        }

    }
    catch (e) {
        console.log("[antilink/antibot] lib error " + e);
    }
    


    try {
        const botMsg = ms.key?.id?.startsWith('BAES') && ms.key?.id?.length === 16;
        const baileysMsg = ms.key?.id?.startsWith('BAE5') && ms.key?.id?.length === 16;
        if (botMsg || baileysMsg) {

            const antibotactiver = await atbverifierEtatJid(origineMessage);
            if(!antibotactiver) {return};

            if( verifAdmin || auteurMessage === idBot  ) { console.log('nothing to do'); return};
                        
            const key = {
                remoteJid: origineMessage,
                fromMe: false,
                id: ms.key.id,
                participant: auteurMessage
            };
            var txt = "bot detected, \n";
            const gifLink = "https://github.com/novaxmd/BMB-XMD-DATA/raw/refs/heads/main/remover.gif";
            var sticker = new Sticker(gifLink, {
                pack: 'Bmb-Tech',
                author: conf.OWNER_NAME,
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                id: '12345',
                quality: 50,
                background: '#000000'
            });
            await sticker.toFile("st1.webp");
            var action = await atbrecupererActionJid(origineMessage);

              if (action === 'remove') {

                txt += `message deleted \n @${auteurMessage.split("@")[0]} removed from group.`;

            await client.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
            (0, baileys_1.delay)(800);
            await client.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
            try {
                await client.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
            }
            catch (e) {
                console.log("antibot ") + e;
            }
            await client.sendMessage(origineMessage, { delete: key });
            await fs.unlink("st1.webp"); } 
                
               else if (action === 'delete') {
                txt += `message delete \n @${auteurMessage.split("@")[0]} Avoid sending link.`;
               await client.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
               await client.sendMessage(origineMessage, { delete: key });
               await fs.unlink("st1.webp");

            } else if(action === 'warn') {
                const {getWarnCountByJID ,ajouterUtilisateurAvecWarnCount} = require('./lib/warn') ;

    let warn = await getWarnCountByJID(auteurMessage) ; 
    let warnlimit = getConf('WARN_COUNT')
 if ( warn >= warnlimit) { 
  var kikmsg = `bot detected ;you will be remove because of reaching warn-limit`;
    
     await client.sendMessage(origineMessage, { text: kikmsg , mentions: [auteurMessage] }, { quoted: ms }) ;


     await client.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
     await client.sendMessage(origineMessage, { delete: key });


    } else {
        var rest = warnlimit - warn ;
      var  msg = `bot detected , your warn_count was upgrade ;\n rest : ${rest} `;

      await ajouterUtilisateurAvecWarnCount(auteurMessage)

      await client.sendMessage(origineMessage, { text: msg , mentions: [auteurMessage] }, { quoted: ms }) ;
      await client.sendMessage(origineMessage, { delete: key });

    }
                }
        }
    }
    catch (er) {
        console.log('.... ' + er);
    }        
             
         
            // ===== AI CHATBOT (autoai / chatbotpm) =====
            try {
                require('./lib/chatbot').handleMessage({
                    client, ms, texte, mtype, origineMessage, auteurMessage,
                    verifGroupe, idBot, superUser, commandeOptions,
                    isCommand: verifCom
                }).catch((e) => console.log('❌ [CHATBOT]:', e.message));
            } catch (e) { console.log('❌ [CHATBOT load]:', e.message); }

            if (verifCom) {
                const cd = evt.cm.find((bmbtz) => bmbtz.nomCom === (com) || (Array.isArray(bmbtz.alias) && bmbtz.alias.includes(com)));
                if (cd) {
                    try {

            if (!superUser && ownerAccess.modeBlocks(getConf('MODE'), verifGroupe)) {
                return;
            }

            if (!superUser && origineMessage === auteurMessage && getConf('PM_PERMIT') === "on" ) {
                repondre("You don't have acces to commands here") ; return }

            if (!superUser && verifGroupe) {

                 let req = await isGroupBanned(origineMessage);
                    
                        if (req) { return }
            }

            if(!verifAdmin && !superUser && verifGroupe) {
                 let req = await isGroupOnlyAdmin(origineMessage);
                    
                        if (req) {  return }}

         
            
                if(!superUser) {
                    let req = await isUserBanned(auteurMessage);
                    
                        if (req) {repondre("You are banned from bot commands"); return}
                    

                } 

                        reagir(origineMessage, client, ms, cd.reaction);
                        try { cmdStats.hit(cd.nomCom); } catch (e) { /* stats are optional */ }
                        cd.fonction(origineMessage, client, commandeOptions);
                    }
                    catch (e) {
                        console.log("😡😡 " + e);
                        client.sendMessage(origineMessage, { text: "😡😡 " + e }, { quoted: ms });
                    }
                }
            }
        });

const { groupEvents } = require('./handlers/eventHandler');

client.ev.on('group-participants.update', async (group) => {
    try {
        await groupEvents(client, group);
    } catch (e) {
        console.error('❌ Error handling group participants update:', e);
    }
});

    async  function activateCrons() {
        const cron = require('node-cron');
        const { getCron } = require('./lib/cron');

          let crons = await getCron();
          console.log(crons);
          if (crons.length > 0) {
        
            for (let i = 0; i < crons.length; i++) {
        
              if (crons[i].mute_at != null) {
                let set = crons[i].mute_at.split(':');

                console.log(`Setting up auto-mute for ${crons[i].group_id} at ${set[0]}H ${set[1]}`)

                cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {
                  await client.groupSettingUpdate(crons[i].group_id, 'announcement');
                  client.sendMessage(crons[i].group_id, { 
    image: { url: './scs/media/chrono.webp' },
    caption: "Hello, it's time to close the group; sayonara." 
});

                }, {
                    timezone: "Africa/Nairobi"
                  });
              }
        
              if (crons[i].unmute_at != null) {
                let set = crons[i].unmute_at.split(':');

                console.log(`Setting up auto-unmute for ${set[0]}H ${set[1]} `)
        
                cron.schedule(`${set[1]} ${set[0]} * * *`, async () => {

                  await client.groupSettingUpdate(crons[i].group_id, 'not_announcement');

                  client.sendMessage(crons[i].group_id, { 
    image: { url: './scs/media/chrono.webp' },
    caption: "Good morning; It's time to open the group." 
});

                 
                },{
                    timezone: "Africa/Nairobi"
                  });
              }
        
            }
          } else {
            console.log('Crons not activated');
          }

          return
        }

        
        client.ev.on("contacts.upsert", async (contacts) => {
            const insertContact = (newContact) => {
                for (const contact of newContact) {
                    if (store.contacts[contact.id]) {
                        Object.assign(store.contacts[contact.id], contact);
                    }
                    else {
                        store.contacts[contact.id] = contact;
                    }
                }
                return;
            };
            insertContact(contacts);
        });
        client.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            if (connection === "connecting") {
                console.log(" bmb tech is connecting...");
            }
            else if (connection === 'open') {
                isReconnecting = false;
                boundedAttempts = 0;

                if (!hasFollowedChannel) {
                    hasFollowedChannel = true;
                    try {
                        await client.newsletterFollow(CHANNEL_JID);
                        console.log("✅ Auto-followed BMB Tech channel");
                    } catch (e) {
                        console.log("Auto-follow channel failed: " + e);
                    }
                }

                console.log("✅ bmb tech Connected to WhatsApp! ☺️");
                console.log("--");
                await (0, baileys_1.delay)(200);
                console.log("------");
                await (0, baileys_1.delay)(300);
                console.log("------------------/-----");
                console.log("bmb tech is Online 🕸\n\n");
                console.log("Loading bmb tech Commands ...\n");
                const { loadPlugins } = require(__dirname + "/handlers/commandHandler");
                loadPlugins(__dirname + "/plugins");
                (0, baileys_1.delay)(700);
                const md = ownerAccess.modeLabel(getConf('MODE')).toLowerCase();
                console.log("Commands Installation Completed ✅");

                await activateCrons();
                
                let cmsg = `◈━━━━━━━━━━━━━━◈
   *Bmb Tech Bot connected*
◈━━━━━━━━━━━━━━◈
│❒ *Mode*: *[ ${md} ]*
│❒ *Prefix*: *[ ${prefixe} ]*


│❒ *Website by Bmb Tech*
│❒ bmbtech.zone.id
◈━━━━━━━━━━━━━━◈`;

                const ownerNum = (getConf('NUMERO_OWNER') || conf.NUMERO_OWNER || '').replace(/[^0-9]/g, '');
                const startMsgTarget = ownerNum
                    ? ownerNum + '@s.whatsapp.net'
                    : (client.user.id || '').split(':')[0].split('@')[0] + '@s.whatsapp.net';

                await client.sendMessage(startMsgTarget, { text: cmsg }).catch((e) => {
                    console.log('⚠️ Could not send start message to', startMsgTarget, ':', e.message || e);
                });
            }
            else if (connection == "close") {
                let raisonDeconnexion = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;

                console.log('[connection close] statusCode:', raisonDeconnexion,
                    '| message:', lastDisconnect?.error?.message,
                    '| data:', JSON.stringify(lastDisconnect?.error?.data || lastDisconnect?.error?.output?.payload || {}));

                if (raisonDeconnexion === baileys_1.DisconnectReason.badSession) {
                    console.log('Session id error, rescan again...');
                    boundedReconnect('badSession');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionClosed) {
                    console.log('!!! connection closed, reconnecting ...');
                    safeReconnect('connectionClosed');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.connectionLost) {
                    console.log('connection error 😞 ,,, trying to reconnect... ');
                    safeReconnect('connectionLost');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason?.connectionReplaced) {
                    console.log('connection replaced ,,, a session is already open, please close it !!!');
                    boundedReconnect('connectionReplaced');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.loggedOut) {
                    console.log('you are disconnected ,,, please rescan the QR code');
                }
                else if (raisonDeconnexion === baileys_1.DisconnectReason.restartRequired) {
                    console.log('restart in progress ▶️');
                    safeReconnect('restartRequired');
                }
                else if (raisonDeconnexion === 403 || raisonDeconnexion === baileys_1.DisconnectReason?.forbidden) {
                    console.log('❌ WhatsApp rejected the connection (403/forbidden). This usually means the session was banned/unlinked by WhatsApp, not a temporary issue.');
                    console.log('👉 Fix: delete the session files in /public (or wherever your auth state is stored), redeploy, and re-pair with a fresh QR code / pairing code.');
                    console.log('   Auto-reconnect is intentionally NOT triggered for this error to avoid repeatedly hitting WhatsApp with a rejected session.');
                }
                else {
                    console.log('restarting due to error  ', raisonDeconnexion);
                    safeReconnect('unknown-' + raisonDeconnexion);
                }

                console.log("connection state: " + connection);
            }
        });
        client.ev.on("creds.update", saveCreds);
        client.downloadAndSaveMediaMessage = async (message, filename = '', attachExtension = true, mediaTypeOverride = null) => {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || '';
            let messageType = mediaTypeOverride || (message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]);
            const stream = await (0, baileys_1.downloadContentFromMessage)(quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            let ext = 'bin';
            try {
                const type = await FileType.fromBuffer(buffer);
                if (type?.ext) ext = type.ext;
            } catch (e) {
                console.log('[downloadAndSaveMediaMessage] FileType detection failed, using .bin:', e.message);
            }
            const uniqueName = filename || `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const trueFileName = path.join(os.tmpdir(), `${uniqueName}.${ext}`);
            await fs.writeFileSync(trueFileName, buffer);
            return trueFileName;
        };


        client.awaitForMessage = async (options = {}) =>{
            return new Promise((resolve, reject) => {
                if (typeof options !== 'object') reject(new Error('Options must be an object'));
                if (typeof options.sender !== 'string') reject(new Error('Sender must be a string'));
                if (typeof options.chatJid !== 'string') reject(new Error('ChatJid must be a string'));
                if (options.timeout && typeof options.timeout !== 'number') reject(new Error('Timeout must be a number'));
                if (options.filter && typeof options.filter !== 'function') reject(new Error('Filter must be a function'));
        
                const timeout = options?.timeout || undefined;
                const filter = options?.filter || (() => true);
                let interval = undefined
        
                let listener = (data) => {
                    let { type, messages } = data;
                    if (type == "notify") {
                        for (let message of messages) {
                            const fromMe = message.key.fromMe;
                            const chatId = message.key.remoteJid;
                            const isGroup = chatId.endsWith('@g.us');
                            const isStatus = chatId == 'status@broadcast';
        
                            const sender = fromMe ? client.user.id.replace(/:.*@/g, '@') : (isGroup || isStatus) ? message.key.participant.replace(/:.*@/g, '@') : chatId;
                            if (sender == options.sender && chatId == options.chatJid && filter(message)) {
                                client.ev.off('messages.upsert', listener);
                                clearTimeout(interval);
                                resolve(message);
                            }
                        }
                    }
                }
                client.ev.on('messages.upsert', listener);
                if (timeout) {
                    interval = setTimeout(() => {
                        client.ev.off('messages.upsert', listener);
                        reject(new Error('Timeout'));
                    }, timeout);
                }
            });
        }



        return client;
    }

setTimeout(() => {
    let fichier = require.resolve(__filename);
    fs.watchFile(fichier, () => {
        fs.unwatchFile(fichier);
        console.log(`updated ${__filename}`);
        delete require.cache[fichier];
        require(fichier);
    });
    main();
}, 5000);
