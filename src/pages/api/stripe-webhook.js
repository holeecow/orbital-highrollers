import Stripe from "stripe";
import { buffer } from "micro";
import admin from "firebase-admin";

// Securely initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Establish connection to Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.log(`❌ Error message: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { userId, credits } = session.metadata;

      console.log("userId:", userId, "credits:", credits);
      if (userId && credits > 0) {
        const db = admin.firestore();
        const userRef = db.collection("blackjackStats").doc(userId);
        try {
          const doc = await userRef.get();
          if (doc.exists) {
            const currentCredits = doc.data().credits || 0;
            await userRef.update({ credits: currentCredits + Number(credits) });
          } else {
            // Or create the document if it doesn't exist
            await userRef.set({ credits: Number(credits) });
          }
          console.log(
            `Successfully updated credits for user ${userId}. New total: ${
              doc.exists ? doc.data().credits + Number(credits) : Number(credits)
            }`
          );
        } catch (error) {
          console.error("Error updating credits:", error);
        }
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default handler;
