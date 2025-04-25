# Project Plan: Geo-Lead Distribution System

## System Overview
A Node.js based system that:
1. Retrieves PDFs from Dialfire
2. Manages PLZ (postal code) based subscriptions via Stripe
3. Distributes leads to real estate agents based on PLZ regions
4. Implements delay logic for multiple subscribers in same PLZ

## Technical Stack
- Backend: Node.js with Express/NestJS
- Database: PostgreSQL
- Queue System: Redis with Bull for job processing
- Payment: Stripe API
- Email: SendGrid/NodeMailer
- PDF Processing: pdf-lib or similar
- Testing: Jest

## Database Schema

### 1. customers
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid',
    last_payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. subscriptions
```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    plz VARCHAR(10) NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(customer_id, plz)
);
```

### 3. leads
```sql
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    plz VARCHAR(10) NOT NULL,
    pdf_url TEXT NOT NULL,
    dialfire_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);
```

### 4. lead_distributions
```sql
CREATE TABLE lead_distributions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    customer_id INTEGER REFERENCES customers(id),
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);
```

## Core Components

### 1. Dialfire Integration Service
- Authenticate with Dialfire API
- Poll for new PDFs
- Download and store PDF metadata
- Extract PLZ information

### 2. Stripe Integration Service
- Handle webhook events (payments, failures)
- Manage customer subscriptions
- Daily payment status verification

### 3. Lead Distribution Service
- Check for new leads
- Determine eligible customers by PLZ
- Apply 3-day delay logic for multiple subscribers
- Queue email distributions

### 4. Email Service
- Template management
- PDF attachment handling
- Delivery tracking
- Error handling

## Background Jobs

### 1. PDF Import Job (Every 15 minutes)
```javascript
// Pseudo-code
async function importPDFs() {
    const newLeads = await dialfireService.getNewLeads();
    for (const lead of newLeads) {
        await downloadPDF(lead);
        await extractPLZ(lead);
        await queueForDistribution(lead);
    }
}
```

### 2. Payment Status Check Job (Daily)
```javascript
// Pseudo-code
async function checkPaymentStatus() {
    const customers = await getActiveCustomers();
    for (const customer of customers) {
        const status = await stripeService.checkStatus(customer);
        await updateCustomerStatus(customer, status);
    }
}
```

### 3. Lead Distribution Job (Hourly)
```javascript
// Pseudo-code
async function distributeLeads() {
    const pendingLeads = await getPendingLeads();
    for (const lead of pendingLeads) {
        const subscribers = await getSubscribersByPLZ(lead.plz);
        if (subscribers.length === 1) {
            await sendImmediately(lead, subscribers[0]);
        } else {
            await scheduleWithDelay(lead, subscribers, '3d');
        }
    }
}
```

## Implementation Steps

### Phase 1: Basic Setup (Week 1)
1. Initialize Node.js project
2. Set up PostgreSQL database
3. Create basic API structure
4. Implement database models
5. Set up Redis for job queues

### Phase 2: Core Services (Week 2)
1. Implement Dialfire integration
2. Set up Stripe webhooks
3. Create email service
4. Build lead distribution logic

### Phase 3: Background Jobs (Week 3)
1. Implement PDF import job
2. Create payment status check job
3. Build lead distribution scheduler
4. Set up error handling and monitoring

### Phase 4: Testing & Optimization (Week 4)
1. Write unit tests
2. Implement integration tests
3. Performance optimization
4. Security hardening

## Security Considerations
1. API Authentication
2. PDF storage security
3. Webhook validation
4. Rate limiting
5. Data encryption

## Monitoring & Logging
1. Job execution metrics
2. PDF processing status
3. Email delivery rates
4. Payment status changes
5. Error tracking

## Next Steps
1. Set up development environment
2. Initialize project structure
3. Create database migrations
4. Begin implementing core services

Would you like to proceed with the initial project setup?
