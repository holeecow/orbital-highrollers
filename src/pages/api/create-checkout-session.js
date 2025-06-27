import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { amount, userId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({ error: "Missing amount or userId" });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: amount,
          },
        ],
        success_url: `${req.headers.origin}/profile?success=1`,
        cancel_url: `${req.headers.origin}/profile?canceled=1`,
        metadata: {
          userId,
          credits: amount,
        },
      });
      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error("Stripe session creation failed:", err.message);
      return res.status(500).json({ error: "Stripe session creation failed" });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
