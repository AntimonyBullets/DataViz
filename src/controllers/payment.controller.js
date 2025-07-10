import Stripe from 'stripe'
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment } from '../models/payment.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const userId = session.metadata.userId; // sent from frontend
    const amount = session.amount_total / 100; // in ₹
    const plan = 'Premium';    
    const paymentMethod = session.payment_method_types[0]; // directly use Stripe's payment method
    
    // Fetch the payment intent to get payment ID
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    const paymentId = paymentIntent.id;

    // Save to DB
    await Payment.create({
      plan,
      paidBy: userId,
      amount,
      paymentMethod,
      paymentId
    });

    // Update user to premium and set expiry date to 30 days from now
    await User.findByIdAndUpdate(
      userId, 
      {
        type: 'premium',
        premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, 
      {new: true}
    );

  }

  res.status(200).send('Webhook received');
});

const checkoutSession = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'inr',
        product_data: { name: 'Premium Plan' },
        unit_amount: 40000, // ₹400
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/payment/success.html`,
    cancel_url: `${process.env.BASE_URL}/payment/cancel.html`,
    metadata: { userId },
  });

  if(!session){
    throw new ApiError(500, "Failed to create checkout session");
  }

  res.send({ url: session.url });
});

export {checkoutSession, stripeWebhook};