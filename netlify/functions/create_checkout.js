// netlify/functions/create_checkout.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { price_id, affiliate } = JSON.parse(event.body || "{}");

    if (!price_id) {
      return { statusCode: 400, body: "Missing price_id" };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: "https://yourdomain.com/thank_you",
      cancel_url: "https://yourdomain.com/",
      metadata: {
        price_id,
        affiliate: affiliate || ""
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error("Checkout error:", err);
    return { statusCode: 500, body: "Checkout session failed" };
  }
};
