const db = require('../config/database');
const emailService = require('./email.service');
const stripeService = require('./stripe.service');

class LeadDistributionService {
  async processNewLead(lead) {
    try {
      // Get all active subscribers for this PLZ
      const subscribers = await this.getActiveSubscribers(lead.plz);
      
      if (subscribers.length === 0) {
        await this.markLeadAsUnassigned(lead.id);
        return;
      }

      // Determine distribution strategy based on number of subscribers
      if (subscribers.length === 1) {
        await this.distributeImmediately(lead, subscribers[0]);
      } else {
        await this.scheduleDelayedDistribution(lead, subscribers);
      }
    } catch (error) {
      console.error('Error processing new lead:', error);
      throw error;
    }
  }

  async getActiveSubscribers(plz) {
    const query = `
      SELECT c.id, c.email, c.name, c.stripe_customer_id
      FROM customers c
      JOIN subscriptions s ON c.id = s.customer_id
      WHERE s.plz = $1
      AND s.status = 'active'
      AND c.status = 'paid'
    `;
    
    const { rows } = await db.query(query, [plz]);
    return rows;
  }

  async distributeImmediately(lead, subscriber) {
    try {
      // Verify customer is still in good standing
      const { isActive } = await stripeService.checkPaymentStatus(subscriber.stripe_customer_id);
      
      if (!isActive) {
        await this.updateCustomerStatus(subscriber.id, 'unpaid');
        return;
      }

      // Create distribution record
      await this.createDistributionRecord(lead.id, subscriber.id, new Date());
      
      // Send email with PDF
      await emailService.sendLeadEmail(subscriber.email, lead.pdf_data, lead.plz);
      
      // Update lead status
      await this.updateLeadStatus(lead.id, 'distributed');
    } catch (error) {
      console.error('Error in immediate distribution:', error);
      throw error;
    }
  }

  async scheduleDelayedDistribution(lead, subscribers) {
    try {
      const delayDate = new Date();
      delayDate.setDate(delayDate.getDate() + 3); // 3-day delay

      // Create delayed distribution records for all subscribers
      const distributionPromises = subscribers.map(subscriber => 
        this.createDistributionRecord(lead.id, subscriber.id, delayDate)
      );

      await Promise.all(distributionPromises);

      // Notify subscribers about delayed lead
      const notificationPromises = subscribers.map(subscriber =>
        emailService.sendDelayedLeadNotification(subscriber.email, lead.plz, 3)
      );

      await Promise.all(notificationPromises);

      // Update lead status
      await this.updateLeadStatus(lead.id, 'scheduled');
    } catch (error) {
      console.error('Error in delayed distribution scheduling:', error);
      throw error;
    }
  }

  async processScheduledDistributions() {
    try {
      const query = `
        SELECT ld.*, l.pdf_data, l.plz, c.email, c.stripe_customer_id
        FROM lead_distributions ld
        JOIN leads l ON ld.lead_id = l.id
        JOIN customers c ON ld.customer_id = c.id
        WHERE ld.status = 'pending'
        AND ld.scheduled_for <= NOW()
      `;

      const { rows: pendingDistributions } = await db.query(query);

      for (const distribution of pendingDistributions) {
        // Verify customer is still in good standing
        const { isActive } = await stripeService.checkPaymentStatus(distribution.stripe_customer_id);
        
        if (!isActive) {
          await this.updateDistributionStatus(distribution.id, 'cancelled');
          continue;
        }

        // Send email with PDF
        await emailService.sendLeadEmail(distribution.email, distribution.pdf_data, distribution.plz);
        
        // Update distribution status
        await this.updateDistributionStatus(distribution.id, 'completed');
      }
    } catch (error) {
      console.error('Error processing scheduled distributions:', error);
      throw error;
    }
  }

  async createDistributionRecord(leadId, customerId, scheduledFor) {
    const query = `
      INSERT INTO lead_distributions (lead_id, customer_id, scheduled_for, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id
    `;
    
    const { rows } = await db.query(query, [leadId, customerId, scheduledFor]);
    return rows[0].id;
  }

  async updateLeadStatus(leadId, status) {
    const query = `
      UPDATE leads
      SET status = $1, processed_at = NOW()
      WHERE id = $2
    `;
    
    await db.query(query, [status, leadId]);
  }

  async updateDistributionStatus(distributionId, status) {
    const query = `
      UPDATE lead_distributions
      SET status = $1, sent_at = NOW()
      WHERE id = $2
    `;
    
    await db.query(query, [status, distributionId]);
  }

  async updateCustomerStatus(customerId, status) {
    const query = `
      UPDATE customers
      SET status = $1
      WHERE id = $2
    `;
    
    await db.query(query, [status, customerId]);
  }

  async markLeadAsUnassigned(leadId) {
    const query = `
      UPDATE leads
      SET status = 'unassigned', processed_at = NOW()
      WHERE id = $1
    `;
    
    await db.query(query, [leadId]);
  }
}

module.exports = new LeadDistributionService();
