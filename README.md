# Geo-Lead Distribution System

A Node.js based system for distributing leads (PDFs) based on postal codes (PLZ) with Stripe integration for payment handling.

## Features

- PDF retrieval from Dialfire API
- PLZ-based lead distribution
- Stripe integration for payment handling
- Delayed distribution for multiple subscribers
- Email notifications with PDF attachments
- Background job processing
- PostgreSQL database for data persistence
- Redis for job queues

## Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12
- Redis >= 6
- Stripe account
- SendGrid account
- Dialfire API access

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy the environment template and fill in your values:
```bash
cp .env.example .env
```

4. Set up the database:
```bash
# Create database
createdb lead_distribution

# Run migrations
npm run migrate
```

5. Start Redis server (if not already running):
```bash
redis-server
```

## Configuration

Edit the `.env` file with your configuration:

- Database credentials
- Redis connection details
- Stripe API keys
- SendGrid API key
- Dialfire API credentials
- Admin email for notifications

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Background Jobs

The system runs several background jobs:

- PDF Import (every 15 minutes)
- Lead Distribution (hourly)
- Payment Status Check (daily)

## API Endpoints

### Stripe Webhook
- POST `/webhook/stripe`
  - Handles Stripe webhook events
  - Requires Stripe signature header

### Customer Management
- POST `/customers`
  - Creates new customer with PLZ subscriptions
  - Required fields:
    - email
    - name
    - plzList (array of postal codes)

### Health Check
- GET `/health`
  - Returns system health status

## Database Schema

### Customers
- id (PK)
- name
- email
- stripe_customer_id
- status
- last_payment_date
- created_at
- updated_at

### Subscriptions
- id (PK)
- customer_id (FK)
- plz
- start_date
- end_date
- status
- created_at
- updated_at

### Leads
- id (PK)
- plz
- pdf_url
- pdf_data
- dialfire_id
- status
- created_at
- processed_at
- metadata

### Lead Distributions
- id (PK)
- lead_id (FK)
- customer_id (FK)
- scheduled_for
- sent_at
- status
- created_at
- updated_at

## Lead Distribution Logic

1. New PDF received from Dialfire
2. PLZ extracted from PDF
3. Check subscribers for PLZ:
   - Single subscriber: Immediate distribution
   - Multiple subscribers: 3-day delay
4. Verify payment status before distribution
5. Send email with PDF attachment
6. Update distribution status

## Error Handling

- Failed distributions are retried
- Payment failures trigger customer notifications
- System errors are logged and notified to admin
- Webhook validation for security

## Monitoring

Monitor the system through:
- Application logs
- Database queries
- Redis queue dashboard
- Stripe dashboard
- SendGrid analytics

## Development

```bash
# Run linter
npm run lint

# Run tests
npm test

# Format code
npm run format
```

## Security Considerations

- Webhook signatures are validated
- API authentication required
- PDF data is securely stored
- Payment information handled by Stripe
- Environment variables for sensitive data

## Support

For issues or questions, please contact the system administrator at the configured admin email address.
