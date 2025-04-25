const Queue = require('bull');
const Redis = require('redis');

// Queue configurations
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
};

// Create queues for different jobs
const pdfImportQueue = new Queue('pdf-import', queueConfig);
const leadDistributionQueue = new Queue('lead-distribution', queueConfig);
const paymentCheckQueue = new Queue('payment-check', queueConfig);

// Error handling for queues
[pdfImportQueue, leadDistributionQueue, paymentCheckQueue].forEach(queue => {
  queue.on('error', (error) => {
    console.error(`Queue error: ${error}`);
  });

  queue.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed: ${error}`);
  });
});

module.exports = {
  pdfImportQueue,
  leadDistributionQueue,
  paymentCheckQueue
};
