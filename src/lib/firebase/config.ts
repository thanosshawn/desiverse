// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database'; // Import Realtime Database
import { getStorage } from 'firebase/storage';

const placeholderDatabaseUrl = "YOUR_DATABASE_URL";
const placeholderApiKey = "YOUR_API_KEY"; // Added for completeness if needed for other checks

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || placeholderApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || placeholderDatabaseUrl, 
};

// Check for placeholder or invalid Database URL before initializing Firebase
if (
  !firebaseConfig.databaseURL ||
  firebaseConfig.databaseURL === placeholderDatabaseUrl ||
  !firebaseConfig.databaseURL.startsWith('https://') ||
  !(firebaseConfig.databaseURL.includes('.firebaseio.com') || firebaseConfig.databaseURL.includes('.firebasedatabase.app'))
) {
  throw new Error(
    `Firebase Realtime Database URL is not configured correctly.
    Please ensure NEXT_PUBLIC_FIREBASE_DATABASE_URL in your .env.local file is set to your actual Firebase Realtime Database URL.
    It should look like: https://<your-project-id>.firebaseio.com or https://<your-project-id>-default-rtdb.<region>.firebasedatabase.app.
    Current value found: "${firebaseConfig.databaseURL}"
    If other Firebase services fail, also check NEXT_PUBLIC_FIREBASE_API_KEY and other NEXT_PUBLIC_FIREBASE_ variables in your .env.local file.`
  );
}


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Initialize Realtime Database
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig }; // Export db (RTDB instance)
