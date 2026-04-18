import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin
const serviceAccountPath = resolve("config", "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

// Get the Firebase web app configuration
const projectId = serviceAccount.project_id;
const webAppConfig = {
  apiKey: "AIzaSyDummyKeyForTesting", // This needs to be obtained from Firebase console
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: "123456789", // This needs to be obtained from Firebase console
  appId: "1:123456789:web:abcdef123456" // This needs to be obtained from Firebase console
};

console.log("Firebase Web App Configuration:");
console.log("Copy this to your frontend .env file:");
console.log("");
console.log(`VITE_FIREBASE_API_KEY=${webAppConfig.apiKey}`);
console.log(`VITE_FIREBASE_AUTH_DOMAIN=${webAppConfig.authDomain}`);
console.log(`VITE_FIREBASE_PROJECT_ID=${webAppConfig.projectId}`);
console.log(`VITE_FIREBASE_STORAGE_BUCKET=${webAppConfig.storageBucket}`);
console.log(`VITE_FIREBASE_MESSAGING_SENDER_ID=${webAppConfig.messagingSenderId}`);
console.log(`VITE_FIREBASE_APP_ID=${webAppConfig.appId}`);
console.log("");
console.log("Note: You need to get the actual API key, messaging sender ID, and app ID from Firebase Console");
console.log("Go to: https://console.firebase.google.com/project/" + projectId + "/settings/general");
