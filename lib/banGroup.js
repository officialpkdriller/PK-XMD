const fs = require('fs');
const path = require('path');

// Path to the JSON file storing banned groups
const filePath = path.join(__dirname, '../asset/banGroup.json');

// The asset/ folder is created automatically, so the bot also starts when the folder is missing.
try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* read-only disk: handled by the callers' try/catch */ }
// Load data from JSON file
function loadBanGroupData() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Default if file doesn't exist
  }
}

// Save data to JSON file
function saveBanGroupData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create default file if it doesn't exist
if (!fs.existsSync(filePath)) {
  saveBanGroupData({});
}

// Function to add a group to the ban list
async function addGroupToBanList(groupeJid) {
  try {
    const data = loadBanGroupData();
    data[groupeJid] = true; // Add the group to the ban list
    saveBanGroupData(data);
    console.log(`Group JID ${groupeJid} added to the banned list.`);
  } catch (error) {
    console.error("Error while adding the banned group:", error);
  }
}

// Function to check if a group is banned
async function isGroupBanned(groupeJid) {
  try {
    const data = loadBanGroupData();
    return data.hasOwnProperty(groupeJid); // Check if the group is banned
  } catch (error) {
    console.error("Error while checking if the group is banned:", error);
    return false;
  }
}

// Function to remove a group from the ban list
async function removeGroupFromBanList(groupeJid) {
  try {
    const data = loadBanGroupData();
    if (data.hasOwnProperty(groupeJid)) {
      delete data[groupeJid]; // Remove the group from the ban list
      saveBanGroupData(data);
      console.log(`Group JID ${groupeJid} removed from the banned list.`);
    } else {
      console.log(`Group JID ${groupeJid} is not in the banned list.`);
    }
  } catch (error) {
    console.error("Error while removing the banned group:", error);
  }
}

module.exports = {
  addGroupToBanList,
  isGroupBanned,
  removeGroupFromBanList,
};
