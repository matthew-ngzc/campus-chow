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
