import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBrukpC1baONIt_2KdJBLZ8ZPhjpo6nIFs",
  authDomain: "batzo-369df.firebaseapp.com",
  projectId: "batzo-369df",
  storageBucket: "batzo-369df.firebasestorage.app",
  messagingSenderId: "962823937275",
  appId: "1:962823937275:android:bcac963ff91c4e9205e45e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
