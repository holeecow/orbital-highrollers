import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("API route called:", req.method);

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, userId } = req.body;
  console.log("Request body:", { amount, userId });

  if (!amount || !userId) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "Missing amount or userId" });
  }

  // Check if environment variables are set
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set");
    return res.status(500).json({ error: "Stripe configuration error" });
  }

  if (!process.env.STRIPE_PRICE_ID) {
    console.error("STRIPE_PRICE_ID is not set");
    return res.status(500).json({ error: "Stripe price configuration error" });
  }

  try {
    console.log("Creating Stripe session...");
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

    console.log("Stripe session created successfully");
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({
      error: "Stripe session creation failed",
      details: err.message,
    });
  }
}
