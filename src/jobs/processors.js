const { 
  pdfImportQueue, 
  leadDistributionQueue, 
  paymentCheckQueue 
} = require('../config/queue');
const dialfireService = require('../services/dialfire.service');
const stripeService = require('../services/stripe.service');
const leadDistributionService = require('../services/lead-distribution.service');
const db = require('../config/database');

// PDF Import Job Processor
pdfImportQueue.process(async (job) => {
  try {
    // Fetch new PDFs from Dialfire
    const newPDFs = await dialfireService.fetchNewPDFs();
    
    for (const pdf of newPDFs) {
      // Download PDF
      const pdfData = await dialfireService.downloadPDF(pdf.id);
      
      // Extract PLZ from PDF
      const { plz, metadata } = await dialfireService.extractPLZFromPDF(pdfData.buffer);
      
      // Save lead to database
      const query = `
        INSERT INTO leads (plz, pdf_url, dialfire_id, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING id
      `;
      
      const { rows } = await db.query(query, [plz, pdf.url, pdf.id]);
      const leadId = rows[0].id;
      
      // Queue lead for distribution
      await leadDistributionQueue.add({ leadId }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
      
      // Mark as processed in Dialfire
      await dialfireService.markProcessed(pdf.id);
    }
    
    return { processed: newPDFs.length };
  } catch (error) {
    console.error('Error in PDF import job:', error);
    throw error;
  }
});

// Lead Distribution Job Processor
leadDistributionQueue.process(async (job) => {
  try {
    const { leadId } = job.data;
    
    // Get lead details
    const query = `
      SELECT * FROM leads 
      WHERE id = $1 AND status = 'pending'
    `;
    
    const { rows } = await db.query(query, [leadId]);
    if (rows.length === 0) {
      throw new Error(`Lead ${leadId} not found or not pending`);
    }
    
    const lead = rows[0];
    
    // Process lead distribution
    await leadDistributionService.processNewLead(lead);
    
    return { leadId, status: 'processed' };
  } catch (error) {
    console.error('Error in lead distribution job:', error);
    throw error;
  }
});

// Payment Status Check Job Processor
paymentCheckQueue.process(async (job) => {
  try {
    // Get all active customers
    const query = `
      SELECT id, email, name, stripe_customer_id 
      FROM customers 
      WHERE status = 'paid'
    `;
    
    const { rows: customers } = await db.query(query);
    const results = {
      checked: customers.length,
      updated: 0
    };
    
    for (const customer of customers) {
      const { isActive } = await stripeService.checkPaymentStatus(customer.stripe_customer_id);
      
      if (!isActive) {
        // Update customer status
        await db.query(
          'UPDATE customers SET status = $1 WHERE id = $2',
          ['unpaid', customer.id]
        );
        
        results.updated++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in payment status check job:', error);
    throw error;
  }
});

// Schedule recurring jobs
const scheduleJobs = () => {
  // Import PDFs every 15 minutes
  pdfImportQueue.add({}, {
    repeat: {
      cron: '*/15 * * * *' // Every 15 minutes
    }
  });

  // Process scheduled lead distributions every hour
  leadDistributionQueue.add({ type: 'scheduled' }, {
    repeat: {
      cron: '0 * * * *' // Every hour
    }
  });

  // Check payment status daily at midnight
  paymentCheckQueue.add({}, {
    repeat: {
      cron: '0 0 * * *' // Every day at midnight
    }
  });
};

module.exports = {
  scheduleJobs
};
