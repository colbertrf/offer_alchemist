// netlify/functions/create_portal_session.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { customer_id } = JSON.parse(event.body || "{}");

    if (!customer_id) {
      return { statusCode: 400, body: "Missing customer_id" };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: "https://yourdomain.com/account"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error("Portal error:", err);
    return { statusCode: 500, body: "Portal session failed" };
  }
};
