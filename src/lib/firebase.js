import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: "G-8E8G6GV27J"
};

// Safe Config Logging (For Debugging)
console.log("🔧 KIX: Loading Firebase Config:", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    apiKey: firebaseConfig.apiKey ? "***EXISTS***" : "!!! MISSING !!!"
});

// Initialize Firebase with Safeguards
let app;
let auth;
let db;

try {
    console.log("🔌 KIX: Initializing Firebase...");
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ KIX: Firebase Connected Successfully");
} catch (error) {
    console.error("🚨 KIX ERROR: Firebase Initialization Failed!", error);
    // Provide minimal fallbacks to prevent screen from going completely black
    auth = {};
    db = {};
}

export { auth, db };
