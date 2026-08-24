const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'batzo.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dbFile)) {
  const database = {
    users: [],
    matches: [],
    teams: []
  };

  fs.writeFileSync(dbFile, JSON.stringify(database, null, 2));
}

console.log('Batzo database initialized successfully');
console.log(`Database: ${dbFile}`);
