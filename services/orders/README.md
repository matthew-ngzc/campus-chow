# 💳 Campus Chow Orders Microservice 

## 🚀 Quick Start Guide

### 1. Clone the repository (skip this step if cloned from the github mono repo)

```bash
git clone https://gitlab.com/cs302-2025/g4-team2/services/orders.git
cd orders
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

- Database: available on port 5434
- DB Dashboard: available on port 8094
  - How to use:
    - Open your browser and visit: http://localhost:8094
    - login fields:
      - System: PostgreSQL
      - Server: postgres
      - Username: smunch
      - Password: smunch
      - Database: smunch_orders
- Payments service: available at port 8084

- command to stop
```bash
docker compose down
```

You should see something like this in the terminal
```bash
[orders] listening on :http://localhost:8084
[docs] Swagger UI: http://localhost:8084/api-docs
```

### 5. API Documentation
Follow the link in the terminal to use the Swagger UI

The documentation is only available when you run the microservice.

<br>

---

<br>
<br>

## 📤 OUTGOING AMQP Contracts

### 🧩 When an order's status has changed
**Routing Key Pattern:**
```
order.status.{new_status}
```
Example:
```
order.status.ready_for_collection
```

**AMQP Properties (required):**
- `messageId`: string (UUID v4)

**AMQP Headers (required):**
- `sourceService`: `order`
- `sentAt`: string timestamp (e.g. `2025-11-02T12:34:56+08:00`)

**Payload:**
```json
{
  "order": {
    "order_id": 49,
    "order_status": "ready_for_collection",
    "delivery_time": "2025-06-05T12:00:00.000Z",
    "payment_deadline_time": "2025-06-05T11:20:00.000Z",
    "building": "sob",
    "room_type": "Seminar Room",
    "room_number": "2-7",
    "merchant_id": 1,
    "amounts": {
      "food_amount_cents": 2100,
      "delivery_fee_cents": 100,
      "total_amount_cents": 2200
    },
    "items": [
      {
        "qty": 2,
        "name": "Chicken Rice",
        "options": { "noodle": "yellow" },
        "menuItemId": 1,
        "unitPriceCents": 550
      },
      {
        "qty": 1,
        "name": "Soup",
        "options": {},
        "menuItemId": 2,
        "unitPriceCents": 1000
      }
    ],
    "created_time": "2025-10-26T19:52:50.373Z",
    "updated_time": null
  }
}
```

---

### 🆕 On Order Creation (awaiting payment)
**Routing Key:**
```
order.created
```

**AMQP Properties (required):**
- `messageId`: string (UUID v4)

**AMQP Headers (required):**
- `sourceService`: `order`
- `sentAt`: string timestamp (e.g. `2025-11-02T12:34:56+08:00`)

**Payload:**
```json
{
  "order": {
    "order_id": 49,
    "order_status": "awaiting_payment",
    "delivery_time": "2025-06-05T12:00:00.000Z",
    "payment_deadline_time": "2025-06-05T11:20:00.000Z",
    "building": "sob",
    "room_type": "Seminar Room",
    "room_number": "2-7",
    "merchant_id": 1,
    "amounts": {
      "food_amount_cents": 2100,
      "delivery_fee_cents": 100,
      "total_amount_cents": 2200
    },
    "items": [
      {
        "qty": 2,
        "name": "Chicken Rice",
        "options": { "noodle": "yellow" },
        "menuItemId": 1,
        "unitPriceCents": 550
      },
      {
        "qty": 1,
        "name": "Soup",
        "options": {},
        "menuItemId": 2,
        "unitPriceCents": 1000
      }
    ],
    "created_time": "2025-10-26T19:52:50.373Z",
    "updated_time": null
  }
}
```

---

## 📤 ORDER → EMAIL

### 📧 Payment Reminder Emails
**Routing Key:**
```
email.command.send_payment_reminder
```

**AMQP Properties (required):**
- `messageId`: string (UUID v4)

**AMQP Headers (required):**
- `sourceService`: `order`
- `sentAt`: string timestamp (e.g. `2025-11-02T12:34:56+08:00`)

**Payload:**
```json
{
  "order": {
    "order_id": 49,
    "order_status": "awaiting_payment",
    "delivery_time": "2025-06-05T12:00:00.000Z",
    "payment_deadline_time": "2025-06-05T11:20:00.000Z",
    "building": "sob",
    "room_type": "Seminar Room",
    "room_number": "2-7",
    "merchant_id": 1,
    "amounts": {
      "food_amount_cents": 2100,
      "delivery_fee_cents": 100,
      "total_amount_cents": 2200
    },
    "items": [
      {
        "qty": 2,
        "name": "Chicken Rice",
        "options": { "noodle": "yellow" },
        "menuItemId": 1,
        "unitPriceCents": 550
      },
      {
        "qty": 1,
        "name": "Soup",
        "options": {},
        "menuItemId": 2,
        "unitPriceCents": 1000
      }
    ],
    "created_time": "2025-10-26T19:52:50.373Z",
    "updated_time": null
  }
}
```

---

## 📥 INCOMING AMQP Contracts

### 🔁 Informing Orders Microservice of Status Change
**Source Services:**
- `runner` → `delivering`, `delivered`  
- `merchant` → `preparing`, `ready_for_collection`  
- `payment` → `payment_verified`, `cancelled`

**Routing Key:**
```
order.command.status_update
```

**AMQP Properties (required):**
- `messageId`: string (UUID v4)

**AMQP Headers (required):**
- `sourceService`: `runner` | `merchant` | `payment`
- `sentAt`: string timestamp (e.g. `2025-11-02T12:34:56+08:00`)

**Payload:**
```json
{
  "orderId": 123,
  "newStatus": "ready_for_collection"
}
```

---

✅ **Notes**
- All messages must include `messageId`, `sourceService`, and `sentAt` headers.  
- `order` objects are **snapshots** at time of event emission.  
- Routing keys follow dot notation for service-scoped event categorization.
