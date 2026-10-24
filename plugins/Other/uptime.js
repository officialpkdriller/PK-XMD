const { bmbtz } = require("../../devpk/bmbtz");
// Built into Node, so no extra package (performance-now) is needed.
const { performance } = require("perf_hooks");
const speed = () => performance.now();
const os = require('os');

// Function for delay simulation
function delay(ms) {
  console.log(`⏱️ delay for ${ms}ms`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to safely get the sender's name
function getName(dest, commandeOptions) {
  return (
    commandeOptions.pushName ||
    commandeOptions.name ||
    (dest.sender ? dest.sender.split('@')[0] : "Unknown User")
  );
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs > 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

// Function to measure ping
async function measurePing(client, dest) {
  const start = speed();
  try {
    const sent = await client.sendMessage(dest, { text: '🏓' });
    const end = speed();
    await client.sendMessage(dest, { delete: sent.key });
    return (end - start).toFixed(2);
  } catch (error) {
    return 'N/A';
  }
}

// Command: Uptime
bmbtz(
  {
    nomCom: 'uptime',
    desc: 'Check bot runtime & response speed',
    Categorie: 'General',
    reaction: '📊',
    fromMe: 'true',
  },
  async (dest, client, commandeOptions) => {
    const name = getName(dest, commandeOptions);
    
    // --- Get System Uptime ---
    const uptimeSeconds = process.uptime();
    const formattedUptime = formatUptime(uptimeSeconds);
    
    // --- Get Last Update Time from GitHub ---
    const lastUpdate = new Date('2026-06-27T00:00:00Z');
    const now = new Date();
    const diffSeconds = Math.floor((now - lastUpdate) / 1000);
    const formattedLastUpdate = formatUptime(diffSeconds);
    
    // --- Measure Ping ---
    const ping = await measurePing(client, dest);
    
    // --- Format Output ---
    const uptimeMessage = `◈━━━━━━━━━━━━━━◈
│❒  *PK-XMDSTATUS*
│❒ 
│❒ ⏳ *Uptime:* ${formattedUptime}
│❒ 
│❒ 🕒 *Last Updated:* ${formattedLastUpdate} ago
│❒ 
│❒ 💻 *System:* ${os.type()} ${os.release()}
│❒ 
◈━━━━━━━━━━━━━━◈`;

    // Constructing the contact message for quoting
    const con = {
      key: {
        fromMe: false,
        participant: `${dest.sender ? dest.sender.split('@')[0] : "unknown"}@s.whatsapp.net`,
        ...(dest.chat ? { remoteJid: dest.chat } : {}),
      },
      message: {
        contactMessage: {
          displayName: name,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nitem1.TEL;waid=${
            dest.sender ? dest.sender.split('@')[0] : "unknown"
          }:${
            dest.sender ? dest.sender.split('@')[0] : "unknown"
          }\nitem1.X-ABLabel:Mobile\nEND:VCARD`,
        },
      },
    };

    // Send the formatted message
    await client.sendMessage(dest, {
      text: uptimeMessage,
      contextInfo: {
        mentionedJid: [dest.sender || ""],
        forwardingScore: 999,
        isForwarded: true,
      },
      quoted: con,
    });

    console.log("Uptime with status sent successfully!");
  }
);

module.exports = {
  delay,
};
