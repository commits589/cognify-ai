// src/firebase.ts
//
// Single place Firebase is initialized. All config comes from Vite env vars
// (VITE_FIREBASE_*) set in .env / Netlify site settings — see .env.example.
// These values are safe to expose to the browser (that's how every Firebase
// web app works); access is controlled by Firestore/Storage security rules,
// not by hiding this config.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  // Don't throw at import time (breaks the whole bundle with a blank screen);
  // surface a clear, visible error instead. App.tsx checks firebaseConfigured.
  // eslint-disable-next-line no-console
  console.error(
    `Firebase is not configured. Missing env vars: ${missing.join(", ")}. ` +
      `Copy .env.example to .env and fill in your Firebase project's web config.`
  );
}

export const firebaseConfigured = missing.length === 0;

export const app: FirebaseApp = getApps().length
  ? getApps()[0]!
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
