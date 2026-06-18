const admin = require('firebase-admin');

// Note: To make this work, the FIREBASE_SERVICE_ACCOUNT_KEY env var should contain the base64 encoded JSON key
// Or we can use ADC (Application Default Credentials) if running on GCP.
// For now, we will try to initialize it. If it fails due to missing credentials, we'll log a warning.

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized successfully.");
  } else {
    // Fallback to application default credentials (works if GOOGLE_APPLICATION_CREDENTIALS is set)
    admin.initializeApp();
    console.log("Firebase Admin Initialized with Default Credentials.");
  }
} catch (error) {
  console.warn("Firebase Admin Initialization Warning: Missing or invalid credentials.", error.message);
}

module.exports = admin;
