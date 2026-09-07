const {
  getApps,
  initializeApp
} = require("firebase-admin/app");

const {
  getAuth
} = require("firebase-admin/auth");

/*
 * BATZO FIREBASE AUTH VERIFIER
 *
 * Verifying a Firebase ID token only requires the Firebase
 * project ID and Google's public signing certificates.
 *
 * We intentionally do NOT require the Firebase service-account
 * private key for Wallet/login token verification.
 */

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  "batzo-369df";

const AUTH_APP_NAME =
  "batzo-auth-verifier";

function initFirebaseAdmin() {
  const existing =
    getApps().find(
      app => app.name === AUTH_APP_NAME
    );

  if (existing) {
    return existing;
  }

  const app =
    initializeApp(
      {
        projectId: FIREBASE_PROJECT_ID
      },
      AUTH_APP_NAME
    );

  console.log(
    "[BATZO FIREBASE] Auth verifier initialized:",
    FIREBASE_PROJECT_ID
  );

  return app;
}

async function verifyFirebaseToken(idToken) {
  if (
    !idToken ||
    typeof idToken !== "string" ||
    !idToken.trim()
  ) {
    const error =
      new Error(
        "Firebase ID token is required."
      );

    error.code =
      "FIREBASE_TOKEN_REQUIRED";

    throw error;
  }

  try {
    const app =
      initFirebaseAdmin();

    const decoded =
      await getAuth(app).verifyIdToken(
        idToken.trim(),
        false
      );

    if (!decoded?.uid) {
      const error =
        new Error(
          "Firebase token does not contain a user ID."
        );

      error.code =
        "FIREBASE_UID_MISSING";

      throw error;
    }

    return decoded;

  } catch (error) {
    console.error(
      "[BATZO FIREBASE VERIFY]",
      error?.code || "",
      error?.message || error
    );

    throw error;
  }
}

module.exports = {
  initFirebaseAdmin,
  verifyFirebaseToken
};
