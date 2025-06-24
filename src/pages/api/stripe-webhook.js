import { buffer } from "micro";
import Stripe from "stripe";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../../../serviceAccountKey.json";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("Webhook handler called");
  if (req.method !== "POST") {
    console.log("Not a POST request");
    return res.status(405).end("Method Not Allowed");
  }
  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Stripe event type:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const credits = parseInt(session.metadata.credits, 10);
    console.log("userId:", userId, "credits:", credits);
    if (userId && credits > 0) {
      const userRef = db.collection("blackjackStats").doc(userId);
      try {
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userRef);
          const prevCredits = userDoc.exists ? userDoc.data().credits || 0 : 0;
          t.set(userRef, { credits: prevCredits + credits }, { merge: true });
        });
        console.log("Credits updated successfully for user:", userId);
      } catch (err) {
        console.error("Firestore transaction error:", err);
      }
    } else {
      console.error("Missing userId or credits in metadata");
    }
  }
  res.status(200).json({ received: true });
}
