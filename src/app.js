require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { scheduleJobs } = require('./jobs/processors');
const stripeService = require('./services/stripe.service');

const app = express();

// Middleware
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/webhook/stripe')) {
      req.rawBody = buf.toString();
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Stripe webhook endpoint
app.post('/webhook/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    const event = await stripeService.validateWebhookSignature(
      req.rawBody,
      signature
    );
    
    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Customer management endpoints
app.post('/customers', async (req, res) => {
  try {
    const { email, name, plzList } = req.body;
    
    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer(email, name);
    
    // Create customer in our database
    const query = `
      INSERT INTO customers (name, email, stripe_customer_id, status)
      VALUES ($1, $2, $3, 'unpaid')
      RETURNING id
    `;
    
    const { rows } = await db.query(query, [
      name,
      email,
      stripeCustomer.id
    ]);
    
    // Create subscriptions for PLZ list
    await stripeService.createSubscription(rows[0].id, plzList);
    
    res.status(201).json({
      id: rows[0].id,
      stripeCustomerId: stripeCustomer.id
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start background jobs
scheduleJobs();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
