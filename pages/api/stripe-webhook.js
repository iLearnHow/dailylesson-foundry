const { buffer } = require('micro');
const Stripe = require('stripe');
const userService = require('../../services/user/userService');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const rawBody = (await buffer(req)).toString();
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const user = await userService.getUserByStripeCustomerId(sub.customer);
      if (user) {
        user.subscription_id = sub.id;
        user.tier = sub.items.data[0]?.price?.nickname || 'paid';
        await userService.updateUser(user);
        console.log(`Updated subscription for user ${user.email}`);
      }
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const user = await userService.getUserByStripeCustomerId(invoice.customer);
      if (user) {
        // Example: grant 100 credits per payment
        await userService.incrementCredits(user.id, 100);
        console.log(`Granted credits to user ${user.email}`);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const user = await userService.getUserByStripeCustomerId(sub.customer);
      if (user) {
        user.tier = 'free';
        await userService.updateUser(user);
        console.log(`Subscription cancelled for user ${user.email}`);
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

export const config = {
  api: {
    bodyParser: false,
  },
}; 