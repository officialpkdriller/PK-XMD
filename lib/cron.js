const fs = require('fs');
const path = require('path');

// Path to the JSON file storing cron data
const filePath = path.join(__dirname, '../asset/cron.json');

// The asset/ folder is created automatically, so the bot also starts when the folder is missing.
try { fs.mkdirSync(path.dirname(filePath), { recursive: true }); } catch (e) { /* read-only disk: handled by the callers' try/catch */ }
// Load data from JSON file
function loadCronData() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {}; // Default if file doesn't exist
  }
}

// Save data to JSON file
function saveCronData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Create default file if it doesn't exist
if (!fs.existsSync(filePath)) {
  saveCronData({});
}

// Function to create or update a cron entry
async function addCron(group_id, row, value) {
  try {
    const data = loadCronData();

    if (!data[group_id]) {
      // Create new entry if it doesn't exist
      data[group_id] = {};
    }

    // Update the specific field
    data[group_id][row] = value;
    saveCronData(data);
    console.log(`Cron data updated for group_id: ${group_id}`);
  } catch (error) {
    console.error("Error while adding/updating cron data:", error);
  }
}

// Function to get all cron entries
async function getCron() {
  try {
    const data = loadCronData();
    return Object.keys(data).map(group_id => ({
      group_id,
      ...data[group_id]
    }));
  } catch (error) {
    console.error("Error while retrieving cron data:", error);
    return [];
  }
}

// Function to get a specific cron entry by group_id
async function getCronById(group_id) {
  try {
    const data = loadCronData();
    return data[group_id] || null;
  } catch (error) {
    console.error("Error while retrieving cron data by group_id:", error);
    return null;
  }
}

// Function to delete a cron entry by group_id
async function delCron(group_id) {
  try {
    const data = loadCronData();
    if (data[group_id]) {
      delete data[group_id];
      saveCronData(data);
      console.log(`Cron data deleted for group_id: ${group_id}`);
    } else {
      console.log(`Group ID ${group_id} not found.`);
    }
  } catch (error) {
    console.error("Error while deleting cron data:", error);
  }
}

module.exports = {
  getCron,
  addCron,
  delCron,
  getCronById,
};
