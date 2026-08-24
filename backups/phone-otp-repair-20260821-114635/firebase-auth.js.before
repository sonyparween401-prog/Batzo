const admin = require('firebase-admin');

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not configured on the Batzo backend.'
    );
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  initialized = true;
  return admin;
}

async function verifyFirebaseToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Firebase ID token is required.');
  }

  const firebase = initFirebaseAdmin();
  return firebase.auth().verifyIdToken(idToken);
}

module.exports = {
  initFirebaseAdmin,
  verifyFirebaseToken
};
