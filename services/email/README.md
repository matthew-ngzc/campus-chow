# Email Service - RabbitMQ Event Listener

## Overview
Spring Boot component that listens to RabbitMQ queues and sends templated emails based on various system events (order updates, payment reminders, runner assignments, account notifications).

---

## Event Listeners

### 1. Payment Reminder Email

**Queue:** `email.command.send_payment_reminder`

**Trigger:** When a payment reminder needs to be sent for an unpaid order.

**Payload Structure:**
```json
{
  "order": {
    "order_id": 12345,
    "customer_email": "customer@example.com",
    "delivery_time": "2025-11-15T09:30:00Z",
    "payment_deadline_time": "2025-11-14T23:59:59Z",
    "building": "Building A",
    "room_type": "Single",
    "room_number": "101",
    "amounts": {
      "total_amount_cents": 2500
    },
    "items": [
      {
        "name": "Chicken Rice",
        "quantity": 2,
        "price": 5.00
      }
    ]
  }
}
```

**Email Template:** `payment_reminder`

**Template Variables:**
- `orderId` - Order ID
- `deliveryTime` - Delivery time in SGT format (yyyy-MM-dd HH:mm:ss)
- `paymentDeadlineTime` - Payment deadline in SGT format
- `building` - Delivery building
- `roomType` - Room type
- `roomNumber` - Room number
- `totalAmount` - Total amount in dollars (converted from cents)
- `items` - List of order items

**Code:**
```java
@RabbitListener(queues = "email.command.send_payment_reminder")
public void handlePaymentReminderEmail(Map<String, Object> payload) {
    try {
        Map<String, Object> order = (Map<String, Object>) payload.get("order");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        String deliveryTimeSgt = "";
        String paymentDeadlineSgt = "";
        try {
            if (order.get("delivery_time") != null) {
                deliveryTimeSgt = Instant.parse(order.get("delivery_time").toString())
                    .atZone(ZoneId.of("Asia/Singapore"))
                    .format(formatter);
            }
            if (order.get("payment_deadline_time") != null) {
                paymentDeadlineSgt = Instant.parse(order.get("payment_deadline_time").toString())
                    .atZone(ZoneId.of("Asia/Singapore"))
                    .format(formatter);
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed to parse time: " + e.getMessage());
        }

        String to = (String) order.get("customer_email"); 
        String subject = "Payment Reminder for Order #" + order.get("order_id");

        Map<String, Object> amounts = (Map<String, Object>) order.get("amounts");
        double totalAmount = 0.0;
        if (amounts != null && amounts.get("total_amount_cents") != null) {
            Object totalObj = amounts.get("total_amount_cents");
            if (totalObj instanceof Integer) {
                totalAmount = ((Integer) totalObj) / 100.0;
            } else if (totalObj instanceof Long) {
                totalAmount = ((Long) totalObj) / 100.0;
            }
        }
        
        Map<String, Object> variables = Map.of(
            "orderId", order.get("order_id"),
            "deliveryTime", deliveryTimeSgt,
            "paymentDeadlineTime", paymentDeadlineSgt,
            "building", order.get("building"),
            "roomType", order.get("room_type"),
            "roomNumber", order.get("room_number"),
            "totalAmount", totalAmount,
            "items", order.get("items") 
        );

        emailService.sendTemplatedEmail(to, subject, "payment_reminder", variables);
        System.out.println("Sent Payment Reminder Email for Order #" + order.get("order_id"));
    } catch (Exception e) {
        System.err.println("Failed to process Payment Reminder Email: " + e.getMessage());
    }
}
```

---

### 2. Runner Assignment Email

**Queue:** `runner.assignment.queue`

**Trigger:** When orders are assigned to a runner for delivery.

**Payload Structure:**
```json
{
  "runnerEmail": "runner@example.com",
  "orders": [
    {
      "orderId": 12345,
      "building": "Building A",
      "roomNumber": "101",
      "deliveryTime": "09:30 AM"
    },
    {
      "orderId": 12346,
      "building": "Building B",
      "roomNumber": "205",
      "deliveryTime": "10:00 AM"
    }
  ]
}
```

**Email Template:** `order_assignment_template`

**Template Variables:**
- `orders` - List of assigned orders with details

**Code:**
```java
@RabbitListener(queues = "runner.assignment.queue")
public void handleRunnerAssignment(Map<String, Object> payload) {
    try {
        String runnerEmail = (String) payload.get("runnerEmail");
        List<Map<String, Object>> orders = (List<Map<String, Object>>) payload.get("orders");

        String subject = "Delivery Orders";

        Map<String, Object> variables = Map.of(
            "orders", orders
        );

        emailService.sendTemplatedEmail(runnerEmail, subject, "order_assignment_template", variables);

        System.out.println("Sent order assignment email to runner: " + runnerEmail);

    } catch (Exception e) {
        System.err.println("Failed to process order assignment email: " + e.getMessage());
    }
}
```

---

### 3. Runner Order Ready Email

**Queue:** `runner.order.ready.queue`

**Trigger:** When an order is ready for pickup by the runner.

**Payload Structure:**
```json
{
  "to": "runner@example.com",
  "subject": "Order #12345 Ready for Pickup",
  "variables": {
    "orderId": 12345,
    "pickupLocation": "Canteen A",
    "customerName": "John Doe"
  }
}
```

**Email Template:** `order_ready_template`

**Template Variables:** Flexible - passed in payload

**Code:**
```java
@RabbitListener(queues = "runner.order.ready.queue")
public void handleRunnerOrderReady(Map<String, Object> payload) {
    try {
        String to = (String) payload.get("to");
        String subject = (String) payload.get("subject");
        Map<String, Object> variables = (Map<String, Object>) payload.get("variables");

        emailService.sendTemplatedEmail(to, subject, "order_ready_template", variables);
        System.out.println("Sent runner order ready email to " + to);
    } catch (Exception e) {
        System.err.println("Failed to send runner order ready email: " + e.getMessage());
    }
}
```

---

### 4. Order Cancelled Email

**Queue:** `order.status.cancelled.queue`

**Trigger:** When a customer's order is cancelled.

**Payload Structure:**
```json
{
  "order": {
    "order_id": 12345,
    "customer_email": "customer@example.com",
    "building": "Building A",
    "room_type": "Single",
    "room_number": "101",
    "delivery_time": "2025-11-15T09:30:00"
  }
}
```

**Email Template:** `order_cancelled_template`

**Template Variables:**
- `orderId` - Order ID
- `building` - Delivery building
- `roomType` - Room type
- `roomNumber` - Room number
- `deliveryTime` - Original delivery time

**Code:**
```java
@RabbitListener(queues = "order.status.cancelled.queue")
public void handleOrderCancelledEmail(Map<String, Object> payload) {
    try {
        Map<String, Object> order = (Map<String, Object>) payload.get("order");

        String to = (String) order.get("customer_email");
        String subject = "Your CampusChow Order Has Been Cancelled";

        Map<String, Object> variables = Map.of(
            "orderId", order.get("order_id"),
            "building", order.get("building"),
            "roomType", order.get("room_type"),
            "roomNumber", order.get("room_number"),
            "deliveryTime", order.get("delivery_time")
        );

        emailService.sendTemplatedEmail(to, subject, "order_cancelled_template", variables);
        System.out.println("Sent order-cancelled email to " + to);
    } catch (Exception e) {
        System.err.println("Failed to send cancellation email: " + e.getMessage());
    }
}
```

---

### 5. Payment Complete Email

**Queue:** `RabbitMQConfig.PAYMENT_COMPLETE_QUEUE`

**Trigger:** When payment is successfully completed for an order.

**Payload Structure:**
```json
{
  "to": "customer@example.com",
  "subject": "Payment Confirmation",
  "template": "payment_complete",
  "variables": {
    "orderId": 12345,
    "amount": 25.00,
    "paymentMethod": "Credit Card"
  }
}
```

**Payload Type:** `EmailEvent` DTO

**Code:**
```java
@RabbitListener(queues = RabbitMQConfig.PAYMENT_COMPLETE_QUEUE)
public void handlePaymentComplete(EmailEvent event) {
    System.out.println("Received: payment.complete");
    emailService.sendTemplatedEmail(
        event.getTo(),
        event.getSubject(),
        event.getTemplate(),
        event.getVariables()
    );
}
```

---

### 6. Password Reset Email

**Queue:** `RabbitMQConfig.PASSWORD_RESET_QUEUE`

**Trigger:** When a user requests a password reset.

**Payload Structure:**
```json
{
  "to": "user@example.com",
  "subject": "Reset Your Password",
  "template": "password_reset",
  "variables": {
    "resetLink": "https://app.com/reset?token=abc123",
    "expiryTime": "24 hours"
  }
}
```

**Payload Type:** `EmailEvent` DTO

**Code:**
```java
@RabbitListener(queues = RabbitMQConfig.PASSWORD_RESET_QUEUE)
public void handlePasswordReset(EmailEvent event) {
    System.out.println("Received: account.password_reset");
    emailService.sendTemplatedEmail(
        event.getTo(),
        event.getSubject(),
        event.getTemplate(),
        event.getVariables()
    );
}
```

---

### 7. Welcome Email

**Queue:** `RabbitMQConfig.WELCOME_QUEUE`

**Trigger:** When a new user registers/creates an account.

**Payload Structure:**
```json
{
  "to": "newuser@example.com",
  "subject": "Welcome to CampusChow",
  "template": "welcome",
  "variables": {
    "firstName": "John",
    "activationLink": "https://app.com/activate?token=xyz789"
  }
}
```

**Payload Type:** `EmailEvent` DTO

**Code:**
```java
@RabbitListener(queues = RabbitMQConfig.WELCOME_QUEUE)
public void handleWelcome(EmailEvent event) {
    System.out.println("Received: account.welcome");
    emailService.sendTemplatedEmail(
        event.getTo(),
        event.getSubject(),
        event.getTemplate(),
        event.getVariables()
    );
}
```

---

### 8. Internal Test Email

**Queue:** `RabbitMQConfig.INTERNAL_TEST_QUEUE`

**Trigger:** For testing email functionality.

**Payload Structure:**
```json
{
  "to": "test@example.com",
  "subject": "Test Email",
  "template": "test_template",
  "variables": {
    "message": "This is a test"
  }
}
```

**Payload Type:** `EmailEvent` DTO

**Code:**
```java
@RabbitListener(queues = RabbitMQConfig.INTERNAL_TEST_QUEUE)
public void handleInternalTest(EmailEvent event) {
    System.out.println("Received: internal.test");
    emailService.sendTemplatedEmail(
        event.getTo(),
        event.getSubject(),
        event.getTemplate(),
        event.getVariables()
    );
}
```

---

## Complete Listener Class
```java
package com.example.email.listener;

import java.util.List;
import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import com.example.email.config.RabbitMQConfig;
import com.example.email.dto.EmailEvent;
import com.example.email.service.EmailService;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
public class EmailEventListener {

    @Autowired
    private EmailService emailService;

    @RabbitListener(queues = "email.command.send_payment_reminder")
    public void handlePaymentReminderEmail(Map<String, Object> payload) {

        try {
            Map<String, Object> order = (Map<String, Object>) payload.get("order");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            String deliveryTimeSgt = "";
            String paymentDeadlineSgt = "";
            try {
                if (order.get("delivery_time") != null) {
                    deliveryTimeSgt = Instant.parse(order.get("delivery_time").toString())
                        .atZone(ZoneId.of("Asia/Singapore"))
                        .format(formatter);
                }
                if (order.get("payment_deadline_time") != null) {
                    paymentDeadlineSgt = Instant.parse(order.get("payment_deadline_time").toString())
                        .atZone(ZoneId.of("Asia/Singapore"))
                        .format(formatter);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Failed to parse time: " + e.getMessage());
            }


            String to = (String) order.get("customer_email"); 
            String subject = "Payment Reminder for Order #" + order.get("order_id");

            Map<String, Object> amounts = (Map<String, Object>) order.get("amounts");
            double totalAmount = 0.0;
            if (amounts != null && amounts.get("total_amount_cents") != null) {
                Object totalObj = amounts.get("total_amount_cents");
                if (totalObj instanceof Integer) {
                    totalAmount = ((Integer) totalObj) / 100.0;
                } else if (totalObj instanceof Long) {
                    totalAmount = ((Long) totalObj) / 100.0;
                }
            }
            
            Map<String, Object> variables = Map.of(
                "orderId", order.get("order_id"),
                "deliveryTime", deliveryTimeSgt,
                "paymentDeadlineTime", paymentDeadlineSgt,
                "building", order.get("building"),
                "roomType", order.get("room_type"),
                "roomNumber", order.get("room_number"),
                "totalAmount", totalAmount,
                "items", order.get("items") 
            );

            emailService.sendTemplatedEmail(to, subject, "payment_reminder", variables);
            System.out.println("Sent Payment Reminder Email for Order #" + order.get("order_id"));
        } catch (Exception e) {
            System.err.println("Failed to process Payment Reminder Email: " + e.getMessage());
        }
    }

    @RabbitListener(queues = "runner.assignment.queue")
    public void handleRunnerAssignment(Map<String, Object> payload) {
        try {
            String runnerEmail = (String) payload.get("runnerEmail");
            List<Map<String, Object>> orders = (List<Map<String, Object>>) payload.get("orders");

            String subject = "Delivery Orders";

            Map<String, Object> variables = Map.of(
                "orders", orders
            );

            emailService.sendTemplatedEmail( runnerEmail, subject, "order_assignment_template", variables );

            System.out.println("Sent order assignment email to runner: " + runnerEmail);

        } catch (Exception e) {
            System.err.println("Failed to process order assignment email: " + e.getMessage());
        }
    }

    @RabbitListener(queues = "runner.order.ready.queue")
    public void handleRunnerOrderReady(Map<String, Object> payload) {
        try {
            String to = (String) payload.get("to");
            String subject = (String) payload.get("subject");
            Map<String, Object> variables = (Map<String, Object>) payload.get("variables");

            emailService.sendTemplatedEmail(to, subject, "order_ready_template", variables);
            System.out.println("Sent runner order ready email to " + to);
        } catch (Exception e) {
            System.err.println(" Failed to send runner order ready email: " + e.getMessage());
        }
    }

    @RabbitListener(queues = "order.status.cancelled.queue")
    public void handleOrderCancelledEmail(Map<String, Object> payload) {
        try {
            Map<String, Object> order = (Map<String, Object>) payload.get("order");

            String to = (String) order.get("customer_email");
            String subject = "Your CampusChow Order Has Been Cancelled";

            Map<String, Object> variables = Map.of(
                "orderId", order.get("order_id"),
                "building", order.get("building"),
                "roomType", order.get("room_type"),
                "roomNumber", order.get("room_number"),
                "deliveryTime", order.get("delivery_time")
            );

            emailService.sendTemplatedEmail(to, subject, "order_cancelled_template", variables);
            System.out.println(" Sent order-cancelled email to " + to);
        } catch (Exception e) {
            System.err.println(" Failed to send cancellation email: " + e.getMessage());
        }
    }

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_COMPLETE_QUEUE)
    public void handlePaymentComplete(EmailEvent event) {
        System.out.println("Received: payment.complete");
        emailService.sendTemplatedEmail(
            event.getTo(),
            event.getSubject(),
            event.getTemplate(),
            event.getVariables()
        );
    }

    @RabbitListener(queues = RabbitMQConfig.PASSWORD_RESET_QUEUE)
    public void handlePasswordReset(EmailEvent event) {
        System.out.println("Received: account.password_reset");
        emailService.sendTemplatedEmail(
            event.getTo(),
            event.getSubject(),
            event.getTemplate(),
            event.getVariables()
        );
    }

    @RabbitListener(queues = RabbitMQConfig.WELCOME_QUEUE)
    public void handleWelcome(EmailEvent event) {
        System.out.println("Received: account.welcome");
        emailService.sendTemplatedEmail(
            event.getTo(),
            event.getSubject(),
            event.getTemplate(),
            event.getVariables()
        );
    }

    @RabbitListener(queues = RabbitMQConfig.INTERNAL_TEST_QUEUE)
    public void handleInternalTest(EmailEvent event) {
        System.out.println("Received: internal.test");
        emailService.sendTemplatedEmail(
            event.getTo(),
            event.getSubject(),
            event.getTemplate(),
            event.getVariables()
        );
    }
}
```

---

## Queue Summary

| Queue Name | Event Type | Payload Type | Template |
|------------|-----------|--------------|----------|
| `email.command.send_payment_reminder` | Payment reminder | `Map<String, Object>` | `payment_reminder` |
| `runner.assignment.queue` | Runner assignment | `Map<String, Object>` | `order_assignment_template` |
| `runner.order.ready.queue` | Order ready | `Map<String, Object>` | `order_ready_template` |
| `order.status.cancelled.queue` | Order cancelled | `Map<String, Object>` | `order_cancelled_template` |
| `RabbitMQConfig.PAYMENT_COMPLETE_QUEUE` | Payment complete | `EmailEvent` | Variable |
| `RabbitMQConfig.PASSWORD_RESET_QUEUE` | Password reset | `EmailEvent` | Variable |
| `RabbitMQConfig.WELCOME_QUEUE` | Welcome | `EmailEvent` | Variable |
| `RabbitMQConfig.INTERNAL_TEST_QUEUE` | Test | `EmailEvent` | Variable |

---

## Key Features

- **Timezone Conversion**: Automatically converts UTC timestamps to Singapore Time (SGT)
- **Currency Conversion**: Converts cents to dollars for display
- **Error Handling**: All listeners wrapped in try-catch blocks
- **Logging**: Console output for successful sends and errors
- **Templated Emails**: Uses Thymeleaf or similar templating engine
- **Flexible Payloads**: Supports both structured maps and DTO objects

---

## Dependencies

- Spring Boot
- Spring AMQP (RabbitMQ)
- EmailService (for sending templated emails)
- RabbitMQConfig (queue configuration)

---

## Configuration Required

Make sure your `RabbitMQConfig` defines the following queue constants:
- `PAYMENT_COMPLETE_QUEUE`
- `PASSWORD_RESET_QUEUE`
- `WELCOME_QUEUE`
- `INTERNAL_TEST_QUEUE`

---

## Testing

To test any listener, publish a message to the corresponding queue with the expected payload structure:
```bash
# Example: Test payment reminder
rabbitmqadmin publish routing_key=email.command.send_payment_reminder \
  payload='{"order": {"order_id": 123, "customer_email": "test@example.com", ...}}'
```

---

## Notes

- All timestamps are converted to Singapore timezone (Asia/Singapore)
- Amount fields are expected in cents and converted to dollars
- Error logging uses `System.err` for visibility
- Success logging uses `System.out`

---
