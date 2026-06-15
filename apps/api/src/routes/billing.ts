import { Router } from 'express';
import Stripe from 'stripe';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/errorHandler';

export const billingRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const PLANS = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    name: 'Starter',
    price: 19,
    clients: 10,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Pro',
    price: 49,
    clients: -1, // unlimited
  },
};

// POST /v1/billing/checkout
billingRouter.post('/checkout', async (req: any, res, next) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan as keyof typeof PLANS]) throw new AppError(400, 'bad_request', 'Invalid plan');

    const user = await queryOne<{ email: string; stripe_customer_id: string | null }>(
      'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    if (!user) throw new AppError(404, 'not_found', 'User not found');

    // Create or reuse Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { userId: req.userId } });
      customerId = customer.id;
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.userId]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan as keyof typeof PLANS].priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing`,
      metadata: { userId: req.userId, plan },
    });

    res.json({ checkout_url: session.url });
  } catch (err) { next(err); }
});

// POST /v1/billing/portal
billingRouter.post('/portal', async (req: any, res, next) => {
  try {
    const user = await queryOne<{ stripe_customer_id: string | null }>(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );
    if (!user?.stripe_customer_id) throw new AppError(400, 'bad_request', 'No billing account found');

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({ portal_url: session.url });
  } catch (err) { next(err); }
});

// POST /v1/webhooks/stripe  (public — no auth middleware)
billingRouter.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan } = session.metadata!;
        await query(
          'UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE id = $3',
          [plan, session.subscription, userId]
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await query(
          "UPDATE users SET plan = 'free', stripe_subscription_id = NULL WHERE stripe_subscription_id = $1",
          [sub.id]
        );
        break;
      }
      case 'invoice.payment_failed': {
        // Could send dunning email here
        console.log('Payment failed for subscription:', (event.data.object as Stripe.Invoice).subscription);
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});
