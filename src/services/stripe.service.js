const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

class StripeService {
  async createCustomer(email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name
      });
      
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  async createSubscription(customerId, plzList) {
    try {
      // Create a subscription for each PLZ
      const subscriptionPromises = plzList.map(async (plz) => {
        const query = `
          INSERT INTO subscriptions (customer_id, plz, status)
          VALUES ($1, $2, 'active')
          RETURNING id
        `;
        return db.query(query, [customerId, plz]);
      });

      await Promise.all(subscriptionPromises);
    } catch (error) {
      console.error('Error creating subscriptions:', error);
      throw error;
    }
  }

  async checkPaymentStatus(stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active'
      });

      return {
        isActive: subscriptions.data.length > 0,
        customer: customer
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(invoice) {
    const query = `
      UPDATE customers 
      SET status = 'paid', last_payment_date = NOW()
      WHERE stripe_customer_id = $1
    `;
    await db.query(query, [invoice.customer]);
  }

  async handlePaymentFailure(invoice) {
    const query = `
      UPDATE customers 
      SET status = 'unpaid'
      WHERE stripe_customer_id = $1
    `;
    await db.query(query, [invoice.customer]);
  }

  async handleSubscriptionCancelled(subscription) {
    const query = `
      UPDATE subscriptions 
      SET status = 'cancelled', end_date = NOW()
      WHERE customer_id = (
        SELECT id FROM customers WHERE stripe_customer_id = $1
      )
    `;
    await db.query(query, [subscription.customer]);
  }

  async validateWebhookSignature(payload, signature) {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();
