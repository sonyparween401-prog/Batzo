import React, { useEffect, useState } from "react";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPopup,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth } from "./firebase";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_CRICKET_API_URL ||
  "http://${BATZO_API_HOST}:3000";

function saveSession(data) {
  if (data?.token) {
    localStorage.setItem("batzo_token", data.token);

      /* BATZO_RESUME_PENDING_ACTION */
      setBatzoAuthRequired(false);

      const pending =
        BATZO_PENDING_AUTH_ACTION ||
        window.__BATZO_PENDING_ACTION__ ||
        null;

      BATZO_PENDING_AUTH_ACTION = null;
      window.__BATZO_PENDING_ACTION__ = null;

      if (typeof pending === "function") {
        setTimeout(() => pending(), 0);
      }


    localStorage.setItem("batzo_auth_token", data.token);
    localStorage.setItem("batzo_user", JSON.stringify(data.user || {}));
  }
}


function saveFirebaseUserLocally(user) {
  if (!user) return;

  const account = {
    uid: user.uid || "",
    name: user.displayName || user.name || "",
    email: user.email || "",
    mobile: user.phoneNumber || user.mobile || "",
    phoneNumber: user.phoneNumber || "",
    photoURL: user.photoURL || "",
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneNumber)
  };

  localStorage.setItem(
    "batzo_firebase_user",
    JSON.stringify(account)
  );

  localStorage.setItem(
    "batzo_user",
    JSON.stringify(account)
  );

  if (account.email) {
    localStorage.setItem(
      "batzo_google_email",
      account.email
    );
  }

  if (account.mobile) {
    localStorage.setItem(
      "batzo_verified_mobile",
      account.mobile
    );
  }
}


function batzoSaveFirebaseAccount(user) {
  if (!user) return;

  const account = {
    uid: user.uid || "",
    name: user.displayName || "",
    email: user.email || "",
    mobile: user.phoneNumber || "",
    photoURL: user.photoURL || "",
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneNumber
  };

  localStorage.setItem(
    "batzo_firebase_user",
    JSON.stringify(account)
  );

  localStorage.setItem(
    "batzo_account_settings",
    JSON.stringify(account)
  );

  if (account.email) {
    localStorage.setItem("batzo_google_email", account.email);
  }

  if (account.phoneVerified) {
    localStorage.setItem(
      "batzo_verified_mobile",
      account.mobile
    );
  }

  window.dispatchEvent(
    new CustomEvent("batzo-account-updated", {
      detail: account
    })
  );
}

async function firebaseBackendLogin(user, nativeIdToken = null) {
  const idToken =
    nativeIdToken ||
    (user && typeof user.getIdToken === "function"
      ? await user.getIdToken(true)
      : null);

  if (!idToken) {
    throw new Error("Firebase ID token was not available");
  }

  const response = await fetch(
    API.replace(/\/$/, "") + "/api/auth/firebase",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "Firebase authentication failed"
    );
  }

  saveSession(data);
  return data;
}


/* BATZO_HOME_FIRST_AUTH_GATE */
let BATZO_PENDING_AUTH_ACTION = null;

function batzoRequestAuth(action) {
  BATZO_PENDING_AUTH_ACTION =
    typeof action === "function" ? action : null;

  window.dispatchEvent(new Event("batzo-auth-required"));
}

if (typeof window !== "undefined") {
  window.BATZO_REQUIRE_AUTH = batzoRequestAuth;
}

export default function AuthGate({ children }) {
  const [batzoAuthRequired, setBatzoAuthRequired] = React.useState(false);
  const [mode, setMode] = useState("login");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  /*
   * BATZO AUTH BACK
   * Exactly one handler.
   * Android Back on Login/OTP/Register returns to the
   * normal Batzo application screen.
   */
  useEffect(() => {
    const authBack = () => {
      if (!batzoAuthRequired) return false;

      console.log("[BATZO] Android Back: leaving AuthGate");

      BATZO_PENDING_AUTH_ACTION = null;
      window.__BATZO_PENDING_ACTION__ = null;

      setBatzoAuthRequired(false);
      setConfirmation(null);
      setOtp("");
      setNotice("");
      setLoading(false);
      setMode("login");

      return true;
    };

    window.__BATZO_AUTH_BACK__ = authBack;

    return () => {
      if (window.__BATZO_AUTH_BACK__ === authBack) {
        delete window.__BATZO_AUTH_BACK__;
      }
    };
  }, [batzoAuthRequired]);
useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        return;
      }

      try {
        await firebaseBackendLogin(user);
        setFirebaseUser(user);
      } catch (error) {
        console.error("BATZO Firebase session:", error);
        setNotice(error.message);
      }
    });
  }, []);

  /*
   * BATZO HOME-FIRST AUTH
   *
   * App startup:
   *   -> show Batzo Home
   *
   * Protected action:
   *   -> BATZO_REQUIRE_AUTH(...)
   *   -> show login
   *
   * Successful login:
   *   -> save JWT
   *   -> resume pending action
   */

  const hasBatzoToken =
    Boolean(localStorage.getItem("batzo_token")) ||
    Boolean(localStorage.getItem("batzo_auth_token"));

  /*
   * NO AUTH REQUEST = NEVER SHOW LOGIN AT STARTUP.
   * Home / Match / Contest remain publicly viewable.
   */
  /*
   * BATZO HOME-FIRST AUTH
   *
   * IMPORTANT:
   * AuthGate never blocks application startup.
   * Home, Matches, Contests and My Team remain accessible.
   * Login is opened only through BATZO_REQUIRE_AUTH().
   */

  const hasBatzoSession =
    Boolean(localStorage.getItem("batzo_token")) ||
    Boolean(localStorage.getItem("batzo_auth_token"));

  if (!batzoAuthRequired) {
    if (mode === "session" || hasBatzoSession || firebaseUser) {
      return (
        <>
          {children}

          <button
            type="button"
            onClick={logout}
            style={{
              position: "fixed",
              right: 12,
              bottom: 86,
              zIndex: 99999,
              border: 0,
              borderRadius: 12,
              padding: "8px 12px",
              fontWeight: 800,
              background: "#111",
              color: "#fff"
            }}
          >
            LOGOUT
          </button>
        </>
      );
    }

    return children;
  }

  async function passwordAuth() {
    setLoading(true);
    setNotice("");

    try {
      const endpoint =
        mode === "register"
          ? "/api/register"
          : "/api/login";

      const body =
        mode === "register"
          ? { name, mobile, password }
          : { mobile, password };

      const response = await fetch(
        API.replace(/\/$/, "") + endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Authentication failed"
        );
      }

      if (mode === "register") {
        setMode("login");
        setNotice("Registration successful. Please login.");
      } else {
        batzoSaveFirebaseAccount(user);
    saveSession(data);
        setMode("session");
        setNotice("");
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
  setLoading(true);
  setNotice("");

  try {
    let user;
    let nativeIdToken = null;

    if (Capacitor.isNativePlatform()) {
      console.log("[BATZO] Starting native Google login");
      console.log("[BATZO] Firebase native provider: google.com");

      const result = await FirebaseAuthentication.signInWithGoogle();

      user = result?.user || null;

      const tokenResult =
        await FirebaseAuthentication.getIdToken({
          forceRefresh: true
        });

      nativeIdToken = tokenResult?.token || null;

      if (!user) {
        throw new Error("Google login succeeded but user was not returned");
      }

      if (!nativeIdToken) {
        throw new Error(
          "Google login succeeded but Firebase ID token was not returned"
        );
      }

      console.log("[BATZO] Native Google login successful");
    } else {
      console.log("[BATZO] Starting web Google login");

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      user = result.user;
    }

    await firebaseBackendLogin(user, nativeIdToken);

    saveFirebaseUserLocally(user);
      batzoSaveFirebaseAccount(user);
      setFirebaseUser(user);
    setMode("session");
  } catch (error) {
    console.error("[BATZO] Google login error:", error);
    setNotice(error?.message || "Google login failed");
  } finally {
    setLoading(false);
  }
}


async function batzoNativeFacebookLogin() {
  setLoading(true);
  setNotice("");

  try {
    console.log("[BATZO] Starting native Facebook login");

    const result =
      await FirebaseAuthentication.signInWithFacebook();

    const user = result?.user || null;

    const tokenResult =
      await FirebaseAuthentication.getIdToken({
        forceRefresh: true
      });

    const idToken = tokenResult?.token || null;

    if (!user || !idToken) {
      throw new Error(
        "Facebook login succeeded but Firebase session was not returned"
      );
    }

    await firebaseBackendLogin(user, idToken);
    saveFirebaseUserLocally(user);
      batzoSaveFirebaseAccount(user);
      setFirebaseUser(user);
    setMode("session");

    console.log("[BATZO] Native Facebook login successful");
  } catch (error) {
    console.error("[BATZO] Facebook login error:", error);
    setNotice(error?.message || "Facebook login failed");
  } finally {
    setLoading(false);
  }
}

async function batzoNativePhoneStart(phoneNumber) {
  const phone =
    phoneNumber.startsWith("+")
      ? phoneNumber
      : "+91" + phoneNumber.replace(/\D/g, "");

  const result =
    await FirebaseAuthentication.signInWithPhoneNumber({
      phoneNumber: phone
    });

  return result?.verificationId || null;
}

async function batzoNativePhoneVerify(verificationId, verificationCode) {
  if (!verificationId) {
    throw new Error("Verification ID missing");
  }

  await FirebaseAuthentication.confirmVerificationCode({
    verificationId,
    verificationCode
  });

  const tokenResult =
    await FirebaseAuthentication.getIdToken({
      forceRefresh: true
    });

  if (!tokenResult?.token) {
    throw new Error("Firebase ID token was not returned");
  }

  const current =
    await FirebaseAuthentication.getCurrentUser();

  const user = current?.user || null;

  if (!user) {
    throw new Error("Phone login succeeded but user was not returned");
  }

  await firebaseBackendLogin(user, tokenResult.token);
    batzoSaveFirebaseAccount(user);
  saveFirebaseUserLocally(user);
      batzoSaveFirebaseAccount(user);
      setFirebaseUser(user);
  setMode("session");
}


async function requestPhoneOtp() {
    setLoading(true);
    setNotice("");

    try {
      const phone =
        mobile.startsWith("+")
          ? mobile
          : "+91" + mobile.replace(/\D/g, "");

      if (!/^\+91\d{10}$/.test(phone)) {
        throw new Error("Enter a valid 10-digit Indian mobile number.");
      }

      if (Capacitor.isNativePlatform()) {
        console.log("[BATZO] Starting native Phone OTP");

        const verificationId =
          await batzoNativePhoneStart(phone);

        if (!verificationId) {
          throw new Error(
            "Firebase did not return a verification ID."
          );
        }

        setConfirmation({
          native: true,
          verificationId
        });

        setNotice("OTP sent successfully.");
        return;
      }

      if (!window.batzoRecaptcha) {
        window.batzoRecaptcha = new RecaptchaVerifier(
          auth,
          "batzo-recaptcha",
          {
            size: "invisible"
          }
        );
      }

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        window.batzoRecaptcha
      );

      setConfirmation({
        native: false,
        confirmationResult: result
      });

      setNotice("OTP sent successfully.");
    } catch (error) {
      console.error("[BATZO] Phone OTP error:", error);

      if (window.batzoRecaptcha) {
        try {
          window.batzoRecaptcha.clear();
        } catch (_) {}
        window.batzoRecaptcha = null;
      }

      setConfirmation(null);

      setNotice(
        error?.message ||
        "OTP request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp() {
    if (!confirmation) {
      setNotice("Request OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setNotice("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      if (
        Capacitor.isNativePlatform() &&
        confirmation.native
      ) {
        console.log("[BATZO] Verifying native Phone OTP");

        await batzoNativePhoneVerify(
          confirmation.verificationId,
          otp.trim()
        );

        setNotice("");
        return;
      }

      const result =
        await confirmation.confirmationResult.confirm(
          otp.trim()
        );

      await firebaseBackendLogin(result.user);

      setFirebaseUser(result.user);
      setMode("session");
    } catch (error) {
      console.error(
        "[BATZO] Phone OTP verify error:",
        error
      );

      setNotice(
        error?.message ||
        "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("batzo_token");
    localStorage.removeItem("batzo_auth_token");
    localStorage.removeItem("batzo_user");
    auth.signOut().catch(() => {});
    setFirebaseUser(null);
    setMode("login");
  }

  if (mode === "session" || firebaseUser) {
    return (
      <>
        {children}

        <button
          type="button"
          onClick={logout}
          style={{
            position: "fixed",
            right: 12,
            bottom: 86,
            zIndex: 99999,
            border: 0,
            borderRadius: 12,
            padding: "8px 12px",
            fontWeight: 800,
            background: "#111",
            color: "#fff"
          }}
        >
          LOGOUT
        </button>
      </>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background:
          "linear-gradient(135deg,#07111f,#102a43,#06101c)"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)"
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontWeight: 1000,
            fontSize: 32,
            letterSpacing: 2
          }}
        >
          BATZO
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 4,
            marginBottom: 20,
            color: "#666",
            fontWeight: 700
          }}
        >
          Cricket Hub
        </div>

        {mode !== "otp" && (
          <>
            {mode === "register" && (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                style={inputStyle}
              />
            )}

            <input
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="Mobile Number"
              inputMode="numeric"
              style={inputStyle}
            />

            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              type="password"
              style={inputStyle}
            />

            <button
              type="button"
              disabled={loading}
              onClick={passwordAuth}
              style={primaryButton}
            >
              {loading
                ? "PLEASE WAIT..."
                : mode === "register"
                  ? "CREATE ACCOUNT"
                  : "LOGIN"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={googleLogin}
              style={secondaryButton}
            >
              CONTINUE WITH GOOGLE
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setMode("otp")}
              style={secondaryButton}
            >
              LOGIN WITH PHONE OTP
            </button>

            <button
              type="button"
              onClick={() =>
                setMode(
                  mode === "register"
                    ? "login"
                    : "register"
                )
              }
              style={linkButton}
            >
              {mode === "register"
                ? "Already have an account? Login"
                : "New user? Create account"}
            </button>
          </>
        )}

        {mode === "otp" && (
          <>
            <input
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10 digit mobile number"
              inputMode="numeric"
              style={inputStyle}
            />

            {!confirmation ? (
              <button
                type="button"
                disabled={loading}
                onClick={requestPhoneOtp}
                style={primaryButton}
              >
                {loading
                  ? "SENDING..."
                  : "SEND OTP"}
              </button>
            ) : (
              <>
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  style={inputStyle}
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={verifyPhoneOtp}
                  style={primaryButton}
                >
                  {loading
                    ? "VERIFYING..."
                    : "VERIFY OTP"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setConfirmation(null);
                setMode("login");
              }}
              style={linkButton}
            >
              BACK TO LOGIN
            </button>
          </>
        )}

        <div id="batzo-recaptcha" />

        {notice && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: "#fff3cd",
              color: "#664d03",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: 12,
  padding: "14px 12px",
  border: "1px solid #ddd",
  borderRadius: 12,
  fontSize: 15
};

const primaryButton = {
  width: "100%",
  border: 0,
  borderRadius: 12,
  padding: "14px",
  marginBottom: 10,
  background: "#111",
  color: "#fff",
  fontWeight: 900
};

const secondaryButton = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: "13px",
  marginBottom: 10,
  background: "#fff",
  color: "#111",
  fontWeight: 800
};

const linkButton = {
  width: "100%",
  border: 0,
  background: "transparent",
  padding: 10,
  color: "#1769aa",
  fontWeight: 800
};
