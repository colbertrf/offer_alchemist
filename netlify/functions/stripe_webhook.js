// netlify/functions/stripe_webhook.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

async function subscribe_to_tag(tag_id, email) {
  const res = await fetch(`https://api.convertkit.com/v3/tags/${tag_id}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_secret: process.env.CONVERTKIT_API_SECRET,
      email
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ConvertKit error (${res.status}): ${text}`);
  }

  return res.json();
}

exports.handler = async (event) => {
  const signature = event.headers["stripe-signature"];
  const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripe_event;

  try {
    stripe_event = stripe.webhooks.constructEvent(event.body, signature, webhook_secret);
  } catch (err) {
    console.error("Signature error:", err.message);
    return { statusCode: 400, body: "Invalid signature" };
  }

  if (stripe_event.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "Ignored" };
  }

  const session = stripe_event.data.object;
  const email = session.customer_details.email;
  const price_id = session.metadata?.price_id;
  const affiliate = session.metadata?.affiliate;

  const PRODUCT_TAGS = {
    [process.env.STRIPE_PRICE_PRO]: [
      process.env.CK_TAG_APP_USER,
      process.env.CK_TAG_OS_USER,
      process.env.CK_TAG_PRO
    ],
    [process.env.STRIPE_PRICE_CREATOR]: [
      process.env.CK_TAG_APP_USER,
      process.env.CK_TAG_OS_USER,
      process.env.CK_TAG_CREATOR
    ],
    [process.env.STRIPE_PRICE_LIFETIME]: [
      process.env.CK_TAG_APP_USER,
      process.env.CK_TAG_OS_USER,
      process.env.CK_TAG_LIFETIME
    ],
    [process.env.STRIPE_PRICE_ACCELERATOR]: [
      process.env.CK_TAG_ACCELERATOR_ACTIVE
    ]
  };

  const tags_to_apply = PRODUCT_TAGS[price_id] || [];

  try {
    for (const tag_id of tags_to_apply) {
      await subscribe_to_tag(tag_id, email);
    }

    if (affiliate) {
      await subscribe_to_tag(process.env.CK_TAG_AFFILIATE, email);
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("ConvertKit tagging failed:", err.message);
    return { statusCode: 500, body: "Retry later" };
  }
};
