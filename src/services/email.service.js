const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  async sendLeadEmail(customerEmail, pdfData, plz) {
    try {
      const msg = {
        to: customerEmail,
        from: process.env.FROM_EMAIL,
        subject: `New Lead Available for PLZ: ${plz}`,
        text: `A new lead is available for your subscribed postal code ${plz}.`,
        html: `
          <h2>New Lead Notification</h2>
          <p>A new lead is available for your subscribed postal code ${plz}.</p>
          <p>Please find the attached PDF document with the lead details.</p>
          <p>Best regards,<br>Your Lead Distribution Team</p>
        `,
        attachments: [
          {
            content: pdfData.toString('base64'),
            filename: `lead-${plz}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Error sending lead email:', error);
      throw error;
    }
  }

  async sendPaymentFailureNotification(customerEmail, customerName) {
    try {
      const msg = {
        to: customerEmail,
        from: process.env.FROM_EMAIL,
        subject: 'Payment Failure Notice',
        text: `Dear ${customerName}, your recent payment has failed. Please update your payment information to continue receiving leads.`,
        html: `
          <h2>Payment Failure Notice</h2>
          <p>Dear ${customerName},</p>
          <p>Your recent payment has failed. To ensure uninterrupted service and continue receiving leads, 
          please update your payment information in your account dashboard.</p>
          <p>If you need assistance, please contact our support team.</p>
          <p>Best regards,<br>Your Lead Distribution Team</p>
        `
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Error sending payment failure notification:', error);
      throw error;
    }
  }

  async sendDelayedLeadNotification(customerEmail, plz, delayDays) {
    try {
      const msg = {
        to: customerEmail,
        from: process.env.FROM_EMAIL,
        subject: `Lead Notification - PLZ: ${plz}`,
        text: `A new lead for PLZ ${plz} has been received and will be delivered in ${delayDays} days due to multiple subscriptions in this area.`,
        html: `
          <h2>Lead Notification</h2>
          <p>A new lead has been received for postal code ${plz}.</p>
          <p>Due to multiple subscriptions in this area, this lead will be delivered to you in ${delayDays} days.</p>
          <p>Best regards,<br>Your Lead Distribution Team</p>
        `
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Error sending delayed lead notification:', error);
      throw error;
    }
  }

  async sendErrorNotification(adminEmail, error) {
    try {
      const msg = {
        to: adminEmail,
        from: process.env.FROM_EMAIL,
        subject: 'System Error Alert',
        text: `System Error: ${error.message}\n\nStack: ${error.stack}`,
        html: `
          <h2>System Error Alert</h2>
          <p><strong>Error Message:</strong> ${error.message}</p>
          <pre>${error.stack}</pre>
        `
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Error sending error notification:', error);
      // Don't throw here to prevent error notification loops
      return false;
    }
  }
}

module.exports = new EmailService();
