const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dbFile = path.join(__dirname, 'data', 'batzo.json');

function readDB() {
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function writeDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

async function registerUser(name, mobile, password) {
  const db = readDB();

  if (!name || !mobile || !password) {
    throw new Error('All fields are required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (db.users.some(user => user.mobile === mobile)) {
    throw new Error('Mobile number already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = {
    id: db.users.length + 1,
    name,
    mobile,
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  };

  db.users.push(user);
  writeDB(db);

  return {
    id: user.id,
    name: user.name,
    mobile: user.mobile
  };
}

module.exports = { registerUser };
