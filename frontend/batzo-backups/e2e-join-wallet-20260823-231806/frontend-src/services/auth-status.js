export function getAuthConfigStatus() {
  return {
    firebaseConfig:
      Boolean(import.meta.env.VITE_FIREBASE_API_KEY),

    apiBase:
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_CRICKET_API_URL ||
      "",

    google:
      Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),

    phoneOtp:
      Boolean(import.meta.env.VITE_FIREBASE_API_KEY)
  };
}
