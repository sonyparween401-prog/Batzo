const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('./firebase-auth');

const dbFile = path.join(__dirname, 'data', 'batzo.json');

function readDB() {
  if (!fs.existsSync(dbFile)) {
    return { users: [], matches: [], teams: [] };
  }

  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function writeDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function createBatzoToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }

  return jwt.sign(
    {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      provider: user.provider
    },
    secret,
    {
      expiresIn: '7d',
      issuer: 'batzo-api'
    }
  );
}

async function loginWithFirebaseIdToken(idToken) {
  const decoded = await verifyFirebaseToken(idToken);

  const uid = decoded.uid;
  const phone = decoded.phone_number || '';
  const email = decoded.email || '';
  const name =
    decoded.name ||
    decoded.email?.split('@')[0] ||
    'Batzo Player';

  const provider =
    decoded.firebase?.sign_in_provider ||
    'firebase';

  const db = readDB();

  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  let user = db.users.find(
    item => item.firebaseUid === uid
  );

  if (!user && phone) {
    user = db.users.find(
      item => item.mobile === phone.replace(/^\+91/, '')
    );
  }

  if (!user) {
    user = {
      id: db.users.length + 1,
      name,
      mobile: phone ? phone.replace(/^\+91/, '') : '',
      email,
      firebaseUid: uid,
      provider,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
  } else {
    user.firebaseUid = uid;
    user.provider = provider;

    if (email) user.email = email;
    if (name) user.name = name;

    if (phone) {
      user.mobile = phone.replace(/^\+91/, '');
    }
  }

  writeDB(db);

  const token = createBatzoToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      provider: user.provider
    }
  };
}

module.exports = {
  loginWithFirebaseIdToken
};
