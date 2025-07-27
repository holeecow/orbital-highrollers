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
        async setCredits({ email, amount }) {
          try {
            const user = await admin.auth().getUserByEmail(email);
            await db.collection('blackjackStats').doc(user.uid).set({
              credits: amount,
            }, { merge: true });
            return null;
          } catch (error) {
            console.error('Error setting credits:', error);
            return null;
          }
        },
        async getCredits({ email }) {
          try {
            const user = await admin.auth().getUserByEmail(email);
            const statsDoc = await db.collection('blackjackStats').doc(user.uid).get();
            if (!statsDoc.exists) {
              return 0;
            }
            return statsDoc.data().credits || 0;
          } catch (error) {
            console.error('Error getting credits:', error);
            return null;
          }
        },
      });
    },
  },
});
