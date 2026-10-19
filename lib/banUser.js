const fs = require('fs');
const path = require('path');

// Path to the JSON file storing banned users
const filePath = path.join(__dirname, '../asset/banUser.json');

// The asset/ folder is created automatically, so the bot also starts when the folder is missing.
try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* read-only disk: handled by the callers' try/catch */ }
// Load data from JSON file
function loadBanUserData() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Default if file doesn't exist
  }
}

// Save data to JSON file
function saveBanUserData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create default file if it doesn't exist
if (!fs.existsSync(filePath)) {
  saveBanUserData({});
}

// Function to add a user to the ban list
async function addUserToBanList(jid) {
  try {
    const data = loadBanUserData();
    data[jid] = true; // Add the user to the ban list
    saveBanUserData(data);
    console.log(`JID ${jid} added to the banned user list.`);
  } catch (error) {
    console.error("Error while adding the banned user:", error);
  }
}

// Function to check if a user is banned
async function isUserBanned(jid) {
  try {
    const data = loadBanUserData();
    return data.hasOwnProperty(jid); // Check if the user is banned
  } catch (error) {
    console.error("Error while checking if the user is banned:", error);
    return false;
  }
}

// Function to remove a user from the ban list
async function removeUserFromBanList(jid) {
  try {
    const data = loadBanUserData();
    if (data.hasOwnProperty(jid)) {
      delete data[jid]; // Remove the user from the ban list
      saveBanUserData(data);
      console.log(`JID ${jid} removed from the banned user list.`);
    } else {
      console.log(`JID ${jid} is not in the banned user list.`);
    }
  } catch (error) {
    console.error("Error while removing the banned user:", error);
  }
}

module.exports = {
  addUserToBanList,
  isUserBanned,
  removeUserFromBanList,
};
