const fs = require('fs');
const path = require('path');

// Path to the JSON file storing user rank data
const filePath = path.join(__dirname, '../asset/users_rank.json');

// The asset/ folder is created automatically, so the bot also starts when the folder is missing.
try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* read-only disk: handled by the callers' try/catch */ }
// Load user data from JSON file
function loadUserData() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Default if file doesn't exist
  }
}

// Save user data to JSON file
function saveUserData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create default file if it doesn't exist
if (!fs.existsSync(filePath)) {
  saveUserData({});
}

// Function to add or update user data
async function ajouterOuMettreAJourUserData(jid) {
  try {
    const data = loadUserData();

    // Check if the JID exists and update or add
    if (data[jid]) {
      data[jid].xp += 10;
      data[jid].messages += 1;
    } else {
      data[jid] = { xp: 10, messages: 1 };
    }

    saveUserData(data);
  } catch (error) {
    console.error("Error updating user data:", error);
  }
}

// Function to get messages and XP by JID
async function getMessagesAndXPByJID(jid) {
  try {
    const data = loadUserData();

    // Return user data if JID exists, otherwise default values
    if (data[jid]) {
      return { messages: data[jid].messages, xp: data[jid].xp };
    } else {
      return { messages: 0, xp: 0 };
    }
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return { messages: 0, xp: 0 }; // Default values in case of error
  }
}

// Function to get the bottom 10 users by XP
async function getBottom10Users() {
  try {
    const data = loadUserData();

    // Convert data to an array of objects and sort by XP in ascending order
    const sortedUsers = Object.keys(data)
      .map(jid => ({ jid, xp: data[jid].xp, messages: data[jid].messages }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10); // Get top 10 users

    return sortedUsers;
  } catch (error) {
    console.error("Error retrieving bottom 10 users:", error);
    return []; // Return an empty array in case of error
  }
}

module.exports = {
  ajouterOuMettreAJourUserData,
  getMessagesAndXPByJID,
  getBottom10Users,
};
