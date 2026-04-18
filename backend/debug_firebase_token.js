import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin
const serviceAccountPath = resolve("config", "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

console.log("Service Account Project ID:", serviceAccount.project_id);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log("Firebase Admin initialized successfully");
}

// Test custom token generation
async function testCustomToken() {
  try {
    console.log("Testing custom token generation...");
    const customToken = await admin.auth().createCustomToken("test-user-123");
    console.log("Custom token generated successfully:");
    console.log("Token length:", customToken.length);
    console.log("Token starts with:", customToken.substring(0, 50) + "...");
    
    // Test token verification
    const decodedToken = await admin.auth().verifyCustomToken(customToken);
    console.log("Token verification successful:");
    console.log("UID:", decodedToken.uid);
    console.log("Is custom token:", decodedToken.firebase.sign_in_provider === "custom");
    
  } catch (error) {
    console.error("Error generating/verifying custom token:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  }
}

testCustomToken().then(() => {
  console.log("Debug script completed");
  process.exit(0);
}).catch((error) => {
  console.error("Debug script failed:", error);
  process.exit(1);
});
