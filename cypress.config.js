const { defineConfig } = require("cypress");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      on("task", {
        async setStats({ email, stats }) {
          try {
            const userRecord = await admin.auth().getUserByEmail(email);
            const uid = userRecord.uid;
            const userRef = db.collection("blackjackStats").doc(uid);
            await userRef.set(stats, { merge: true });
            return null;
          } catch (error) {
            console.error("Error in setStats task:", error);
            throw error; // Fail the test if the user isn't found
          }
        },
      });
    },
  },
});
