const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../asset/alive.json');

// The asset/ folder is created automatically, so the bot also starts when the folder is missing.
try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* read-only disk: handled by the callers' try/catch */ }
// Load data from JSON file
function loadAliveData() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { id: 1, message: '', lien: '' }; // Default if file doesn't exist
  }
}

// Save data to JSON file
function saveAliveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create default data if not exists
if (!fs.existsSync(filePath)) {
  saveAliveData({ id: 1, message: '', lien: '' });
}

// Function to add or update data in 'alive'
async function addOrUpdateDataInAlive(message, lien) {
  try {
    const data = loadAliveData();
    data.message = message;
    data.lien = lien;
    saveAliveData(data);
    console.log("Data successfully added or updated in 'alive'.");
  } catch (error) {
    console.error("Error while adding or updating data in 'alive':", error);
  }
}

// Function to get data from 'alive'
async function getDataFromAlive() {
  try {
    const data = loadAliveData();
    if (data.message && data.lien) {
      return { message: data.message, lien: data.lien };
    } else {
      console.log("No data found in 'alive'.");
      return null;
    }
  } catch (error) {
    console.error("Error while retrieving data from 'alive':", error);
    return null;
  }
}

module.exports = {
  addOrUpdateDataInAlive,
  getDataFromAlive,
};
