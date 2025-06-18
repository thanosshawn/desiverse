
// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database'; // Import Realtime Database
import { getStorage } from 'firebase/storage';

const placeholderApiKey = "YOUR_API_KEY"; // Used for explicit check
const placeholderDatabaseUrl = "YOUR_DATABASE_URL"; // Used for explicit check

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || placeholderApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || placeholderDatabaseUrl,
};

// Check for placeholder or invalid API Key
if (
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === placeholderApiKey ||
  firebaseConfig.apiKey.length < 10 // Basic sanity check
) {
  throw new Error(
    `Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or invalid in your .env.local file.
    1. Please ensure it's set to your actual Firebase Web API Key.
    2. You can find this key in your Firebase project:
       Project settings (gear icon) > General tab > Your apps > Web app > SDK setup and configuration > apiKey.
    Current value detected: "${firebaseConfig.apiKey}"`
  );
}

// Check for placeholder or invalid Database URL
if (
  !firebaseConfig.databaseURL ||
  firebaseConfig.databaseURL === placeholderDatabaseUrl ||
  !firebaseConfig.databaseURL.startsWith('https://') ||
  !(firebaseConfig.databaseURL.includes('.firebaseio.com') || firebaseConfig.databaseURL.includes('.firebasedatabase.app'))
) {
  throw new Error(
    `Firebase Realtime Database URL (NEXT_PUBLIC_FIREBASE_DATABASE_URL) is missing or invalid in your .env.local file.
    1. Please ensure it's set to your actual Firebase Realtime Database URL.
    2. It should look like: https://<your-project-id>.firebaseio.com or https://<your-project-id>-default-rtdb.<region>.firebasedatabase.app.
    3. You can find this URL in your Firebase project:
       Realtime Database section > Data tab (it's the URL at the top, e.g., https://your-project-id-default-rtdb.firebaseio.com/).
    Current value detected: "${firebaseConfig.databaseURL}"`
  );
}


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app); // Initialize Realtime Database
const storage = getStorage(app);

export { app, auth, db, storage, firebaseConfig }; // Export db (RTDB instance)
