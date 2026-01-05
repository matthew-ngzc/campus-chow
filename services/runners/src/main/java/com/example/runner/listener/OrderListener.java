package com.example.runner.listener;

import com.example.runner.model.OrderStatusMessage;
import com.example.runner.model.OrderStatusUpdate;
import com.example.runner.service.RunnerAssignmentService;
import com.example.runner.service.PendingOrderService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;


@Component
public class OrderListener {

    private final RunnerAssignmentService assignmentService;
    private final PendingOrderService pendingOrderService;

    public OrderListener(RunnerAssignmentService assignmentService, PendingOrderService pendingOrderService) {
        this.assignmentService = assignmentService;
        this.pendingOrderService = pendingOrderService;
    }

    @RabbitListener(queues = "order.inbox")
    public void handleOrderStatusUpdate(OrderStatusMessage message) {
        OrderStatusUpdate orderStatusUpdate = message.getOrder();

        String status = orderStatusUpdate.getOrderStatus();
        System.out.println(" Received order status update: " + status + " for order " + orderStatusUpdate.getOrderId());

        switch (status) {
            case "payment_verified" -> {
                pendingOrderService.savePendingOrder(orderStatusUpdate);
                System.out.println(" Saved payment-verified order " + orderStatusUpdate.getOrderId() + " to pending list.");
            }

            case "ready_for_collection" -> {
                assignmentService.handleReadyForCollection(orderStatusUpdate);
                System.out.println(" Order " + orderStatusUpdate.getOrderId() + " is ready for collection.");
            }

            default -> System.out.println("Ignoring status: " + status);
        }
    }
}