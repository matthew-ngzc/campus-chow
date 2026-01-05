package com.example.runner.service;

import com.example.runner.model.*;
import com.example.runner.model.RunnerAssignmentMessage.OrderDetails;
import com.example.runner.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class RunnerAssignmentService {
    private final RunnerAvailabilityRepository availabilityRepo;
    private final RunnerAssignmentRepository assignmentRepo;
    private final PendingOrderRepository pendingOrderRepo;
    private final RunnerAvailabilityService availabilityService;
    
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public RunnerAssignmentService(RunnerAvailabilityRepository availabilityRepo, 
        RunnerAssignmentRepository assignmentRepo, PendingOrderRepository pendingOrderRepo, RunnerAvailabilityService availabilityService) {
        this.availabilityRepo = availabilityRepo;
        this.assignmentRepo = assignmentRepo;
        this.pendingOrderRepo = pendingOrderRepo;
        this.availabilityService = availabilityService;
    }

    // public Map<Long, List<Long>> assignOrdersToRunners(LocalDate date, Timeslot timeslot, List<Long> orderIds) {
    //     List<Long> runnerIds = availabilityRepo.findRunnerIdsByDateAndTimeslot(date, timeslot);
    //     if (runnerIds.isEmpty()) {
    //         throw new IllegalStateException("No available runners for " + date + " " + timeslot);
    //     }

    //     Map<Long, List<Long>> assignments = new HashMap<>();
    //     int totalOrders = orderIds.size();
    //     int totalRunners = runnerIds.size();

    //     int base = totalOrders / totalRunners;
    //     int remainder = totalOrders % totalRunners;

    //     int index = 0;
    //     for (int i = 0; i < runnerIds.size(); i++) {
    //         int count = base + (i < remainder ? 1 : 0); 
    //         List<Long> assignedOrders = orderIds.subList(index, Math.min(index + count, totalOrders));
    //         index += count;

    //         assignments.put(runnerIds.get(i), new ArrayList<>(assignedOrders));

    //         for (Long orderId : assignedOrders) {
    //             assignmentRepo.save(new RunnerAssignment(null, runnerIds.get(i), orderId, date, timeslot));
    //         }
    //     }

    //     return assignments; 
    // }


    // public void sendOrderStatusUpdate(Long orderId, String newStatus) {
    //     Map<String, Object> payload = Map.of(
    //         "orderId", orderId,
    //         "newStatus", newStatus
    //     );

    //     String messageId = UUID.randomUUID().toString();

    //     rabbitTemplate.convertAndSend(
    //         "order.command.exchange",  
    //         "order.command.status_update",  
    //         payload,  
    //         message -> {
    //             message.getMessageProperties().setMessageId(messageId);  
    //             message.getMessageProperties().setHeader("sourceService", "runner");  
    //             message.getMessageProperties().setHeader("sentAt", java.time.OffsetDateTime.now().toString());  
    //             return message;
    //         }
    //     );
    //     System.out.println(" Sent order status update for Order ID: " + orderId);
    // }

    public void handleReadyForCollection(OrderStatusUpdate orderStatusUpdate) {
        Long orderId = orderStatusUpdate.getOrderId();
    

        RunnerAssignment assignment = assignmentRepo.findByOrderId(orderId)
                .orElse(null);

        if (assignment == null) {
            System.out.println("No runner assignment found for order " + orderId);
            return;
        }

        Long runnerId = assignment.getRunnerId();

        LocalDate date = orderStatusUpdate.getDeliveryTime().toLocalDate();
        String runnerEmail = availabilityRepo.findEmailByRunnerId(runnerId, date);
     
        Map<String, Object> payload = Map.of(
            "to", runnerEmail,
            "subject", "Order Ready for Collection",
            "template", "order_ready_template",
            "variables", Map.of(
                "orderId", orderId,
                "building", orderStatusUpdate.getBuilding(),
                "roomType", orderStatusUpdate.getRoomType(),
                "roomNumber", orderStatusUpdate.getRoomNumber(),
                "deliveryTime", orderStatusUpdate.getDeliveryTime().toString()
            )
        );

        rabbitTemplate.convertAndSend( "smunch.events", "runner.order.ready", payload );

        System.out.println("Sent ready-for-collection email for order " + orderId + " to " + runnerEmail);
    }


    public void assignOrdersToAvailableRunners(List<PendingOrder> orders, LocalDate date, Timeslot slot) {
        List<Long> availableRunners = availabilityService.getAvailableRunnerIds(date, slot);

        if (availableRunners.isEmpty()) {
            System.out.println(" No available runners for this timeslot.");
            return;
        }

        int runnerCount = availableRunners.size();
        int orderIndex = 0;

        Map<Long, List<OrderDetails>> ordersByRunner = new HashMap<>();

        for (PendingOrder order : orders) {
            Long runnerId = availableRunners.get(orderIndex % runnerCount);

            RunnerAssignment assignment = new RunnerAssignment();
            assignment.setRunnerId(runnerId);
            assignment.setOrderId(order.getOrderId());
            assignment.setDate(date);
            assignment.setTimeslot(slot);
            assignmentRepo.save(assignment);

            order.setAssigned(true);
            pendingOrderRepo.save(order);

            List<String> itemNames = new ArrayList<>();
            try {
                ObjectMapper mapper = new ObjectMapper();
                List<Map<String, Object>> items = mapper.readValue(order.getItemsJson(), List.class);
                itemNames = items.stream()
                    .map(i -> (String) i.get("name"))
                    .toList();
            } catch (Exception e) {}

            OrderDetails orderDetails = new OrderDetails(
                order.getOrderId(),
                order.getBuilding(),
                order.getRoomType(),
                order.getRoomNumber(),
                order.getDeliveryTime().toString(),
                itemNames,
                order.getTotalAmountCents()/ 100.0
            );

            ordersByRunner.computeIfAbsent(runnerId, k -> new ArrayList<>()).add(orderDetails);

            orderIndex++;
        }

        for (Map.Entry<Long, List<OrderDetails>> entry : ordersByRunner.entrySet()) {
            Long runnerId = entry.getKey();
            List<OrderDetails> assignedOrders = entry.getValue();

            String runnerEmail = availabilityRepo.findEmailByRunnerId(runnerId, date);

            Map<String, Object> payload = Map.of(
                "runnerEmail", runnerEmail,
                "orders", assignedOrders
            );

            rabbitTemplate.convertAndSend("smunch.events", "runner.assignment", payload);
        }
    }

    public List<PendingOrder> getAssignedOrdersForRunner(Long runnerId, LocalDate date) {
        List<RunnerAssignment> assignments = assignmentRepo.findByRunnerIdAndDate(runnerId, date);
        List<Long> orderIds = assignments.stream()
                                         .map(RunnerAssignment::getOrderId)
                                         .toList();
        return pendingOrderRepo.findAllById(orderIds);
    }

    public void resetAllAssignments() {
        List<PendingOrder> assignedOrders = pendingOrderRepo.findByAssignedTrue();

        for (PendingOrder order : assignedOrders) {
            order.setAssigned(false);
        }
        pendingOrderRepo.saveAll(assignedOrders);

        assignmentRepo.deleteAll();

        System.out.println("All runner assignments deleted and pending orders reset.");
    }

}
