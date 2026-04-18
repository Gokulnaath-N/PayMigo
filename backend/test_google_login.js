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

// Test creating a custom token for the existing user
async function testUserToken() {
  try {
    console.log("Testing custom token for existing user...");
    
    // Use the worker ID from the database (you can get this from Prisma Studio)
    const workerId = "00c2e88c-f6fd-4978-979e-"; // First part of the UUID I saw
    
    const customToken = await admin.auth().createCustomToken(workerId);
    console.log("Custom token generated for worker:", workerId);
    console.log("Token:", customToken.substring(0, 100) + "...");
    
    // Test the token with Firebase REST API (same as frontend)
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyCOyOylcA8LxpO1BqhJF6H4EKU1O6Ejm84`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true })
    });
    
    const result = await response.json();
    console.log("Firebase API Response:", response.status);
    console.log("Response body:", result);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testUserToken();
