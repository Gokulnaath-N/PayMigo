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

// Test with a simple UID
async function testSimpleToken() {
  try {
    console.log("Testing custom token with simple UID...");
    
    // Use a simple string UID (Firebase expects string)
    const uid = "test-user-123";
    
    const customToken = await admin.auth().createCustomToken(uid);
    console.log("Custom token generated for UID:", uid);
    console.log("Token length:", customToken.length);
    
    // Test the token with Firebase REST API
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyCOyOylcA8LxpO1BqhJF6H4EKU1O6Ejm84`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    
    const result = await response.json();
    console.log("Firebase API Response:", response.status);
    console.log("Response body:", result);
    
    if (response.ok) {
      console.log("✅ Custom token is VALID!");
    } else {
      console.log("❌ Custom token is INVALID");
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testSimpleToken();
