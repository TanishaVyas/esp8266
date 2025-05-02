// server/firebase-admin.js
const admin = require("firebase-admin");
const fs = require("fs");

// Read the base64-encoded service account key from the file
const encodedServiceAccount = fs.readFileSync(
  "./encoded-serviceAccountKey.txt",
  "utf8"
);

// Decode the base64 content to get the JSON data
const serviceAccount = JSON.parse(
  Buffer.from(encodedServiceAccount, "base64").toString("utf8")
);

// Initialize Firebase Admin SDK with the decoded service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
