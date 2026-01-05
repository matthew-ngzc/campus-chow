# 💳 Campus Chow Payments Microservice

This service handles all payment-related operations for the **SMUNCH** ecosystem — including payment QR generation, verification, and integration with the Orders microservice.

---

## 🚀 Quick Start Guide

### 1. Clone the repository (skip this step if cloned from the github mono repo)

```bash
git clone https://gitlab.com/cs302-2025/g4-team2/services/payments.git
cd payments
```

### 2. Configure environment variables
Create a .env file in the project root using the example template ".env.example"


### 3. Start RabbitMq 
- The service name, user and password would affect the amqp connection string in `.env`. Below is the one that works
```yaml
volumes:
  rabbitmq_data:

services:
  ####################################
  # RabbitMQ: The messaging broker
  ####################################
  rabbitmq:
    image: rabbitmq:3-management
    hostname: rabbitmq
    restart: always
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: smunch
      RABBITMQ_DEFAULT_PASS: smunch
    networks:
      - smunch-network
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "check_port_connectivity"]
      interval: 10s
      timeout: 5s
      retries: 5


networks:
  smunch-network:
    external: true
```

### 4. Start Postgres , Postgres UI dashboard and Payments service
- start docker desktop
```bash
docker compose up -d --build
```
- use this for subsequent starts if there are no code changes (faster)
```bash
docker compose up -d
```

- If u are in dev mode and want the container to reset on code changes
```bash
docker compose -f docker-compose.dev.yml up --watch
```
- to close it just `ctrl + c`

- Database: available on port 5435
- DB Dashboard: available on port 8095
  - How to use:
    - Open your browser and visit: http://localhost:8095
    - login fields:
      - System: PostgreSQL
      - Server: postgres
      - Username: smunch
      - Password: smunch
      - Database: smunch_payments
- Payments service: available at port 8085

- command to stop
```bash
docker compose down
```

You should see something like this in the terminal
```bash
[payments] listening on :http://localhost:8085
[docs] Swagger UI: http://localhost:8085/api-docs
```

### 5. Configure Email Payment Processor

The service includes an automated email worker that monitors Gmail for DBS PayNow payment notifications and automatically adds transactions to the database.

**Setup Steps:**

1. **Enable Gmail API** in Google Cloud Console
2. **Create OAuth2 credentials** (Web application type)
3. **Add to `.env`:**
   ```bash
   GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=GOCSPX-your-secret
   GMAIL_REDIRECT_URI=http://localhost:3000/oauth2callback
   GMAIL_TOKEN_PATH=./gmail-token.json
   EMAIL_WORKER_INTERVAL_MS=60000
   ```
4. **Run one-time authorization:**
   ```bash
   node src/workers/email-processor/authorizeGmail.js
   ```
   Follow the prompts to authorize the application
5. **Add to `.gitignore`:**
   ```
   gmail-token.json
   ```

**How it works:**
- Checks Gmail every 60 seconds for unread DBS payment emails
- Extracts transaction details (ref, amount, sender, receiver, date)
- Converts SGD amounts to cents automatically
- Adds transactions via existing `addTransaction` service
- Marks processed emails as read
- Prevents duplicate entries

### 6. API Documentation
Follow the link in the terminal to use the Swagger UI

The documentation is only available when you run the microservice.

<br>

---

<br>
<br>

# 📤 OUTGOING AMQP Contracts

### 🧩 When a payment's status has changed
**Routing Key Pattern:**
```
payment.status.{new_status}
```
Example:
```
payment.status.payment_verified
```

**AMQP Properties (required):**
- `messageId`: string (UUID v4)

**AMQP Headers (required):**
- `sourceService`: `payment`
- `sentAt`: string timestamp (e.g. `2025-11-02T12:34:56+08:00`)

**Payload:**
```json
{
    "orderId":45,
    "newStatus":"payment_verified"
}
```

---

## 📥 INCOMING AMQP Contracts

### Getting transaction information from email via n8n (can possibly change to pure code but lazy)
**Routing Key:**
```
payment.command.add_transaction
```

**AMQP Properties (required):**
- `messageId`: string (UUID v4)

**AMQP Headers (required):**
- `sourceService`: `n8n`
- `sentAt`: string timestamp (e.g. `2025-11-02T12:34:56+08:00`)

**Payload:**
```json
{
  "transactionRef": "SM3P251009962794 C112347848203",
  "amountCents": 28000,
  "dateTime": "2025-10-09T17:35:00+08:00",
  "sender": "BOB",
  "receiver": "Your DBS/ POSB account ending 1234"
}
```