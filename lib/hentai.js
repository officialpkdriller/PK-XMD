const fs = require('fs');
const path = require('path');

// Path to the JSON file storing hentai data
const filePath = path.join(__dirname, '../asset/hentai.json');

// The asset/ folder is created automatically, so the bot also starts when the folder is missing.
try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* read-only disk: handled by the callers' try/catch */ }
// Load data from JSON file
function loadHentaiData() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Default if file doesn't exist
  }
}

// Save data to JSON file
function saveHentaiData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create default file if it doesn't exist
if (!fs.existsSync(filePath)) {
  saveHentaiData({});
}

// Function to add a group to the hentai list
async function addToHentaiList(groupeJid) {
  try {
    const data = loadHentaiData();
    
    // Add the group if it doesn't already exist
    if (!data[groupeJid]) {
      data[groupeJid] = true;
      saveHentaiData(data);
      console.log(`Group JID ${groupeJid} has been added to the hentai list.`);
    } else {
      console.log(`Group JID ${groupeJid} is already in the hentai list.`);
    }
  } catch (error) {
    console.error("Error while adding the group to the hentai list:", error);
  }
}

// Function to check if a group is in the hentai list
async function checkFromHentaiList(groupeJid) {
  try {
    const data = loadHentaiData();
    return !!data[groupeJid];
  } catch (error) {
    console.error("Error while checking the group's presence in the hentai list:", error);
    return false;
  }
}

// Function to remove a group from the hentai list
async function removeFromHentaiList(groupeJid) {
  try {
    const data = loadHentaiData();
    
    if (data[groupeJid]) {
      delete data[groupeJid];
      saveHentaiData(data);
      console.log(`Group JID ${groupeJid} has been removed from the hentai list.`);
    } else {
      console.log(`Group JID ${groupeJid} is not in the hentai list.`);
    }
  } catch (error) {
    console.error("Error while removing the group from the hentai list:", error);
  }
}

module.exports = {
  addToHentaiList,
  checkFromHentaiList,
  removeFromHentaiList,
};
