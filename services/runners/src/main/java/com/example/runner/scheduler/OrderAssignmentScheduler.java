package com.example.runner.scheduler;

import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.service.PendingOrderService;
import com.example.runner.service.RunnerAssignmentService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class OrderAssignmentScheduler {

    private final PendingOrderService pendingOrderService;
    private final RunnerAssignmentService runnerAssignmentService;

    public OrderAssignmentScheduler(PendingOrderService pendingOrderService,
                                    RunnerAssignmentService runnerAssignmentService) {
        this.pendingOrderService = pendingOrderService;
        this.runnerAssignmentService = runnerAssignmentService;
    }

    @Scheduled(cron = "0 * * * * *")  
     public void scheduledAssign() {
        assignUpcomingOrders(LocalDateTime.now());
    }

    public void assignUpcomingOrders(LocalDateTime now) {
        for (Timeslot slot : Timeslot.values()) {
            LocalDateTime slotStart = getSlotStart(slot);

            if (slotStart.truncatedTo(ChronoUnit.MINUTES).equals(now.truncatedTo(ChronoUnit.MINUTES))) {
                List<PendingOrder> pendingOrders = pendingOrderService.getPendingOrdersByTimeslot(slot);
                if (!pendingOrders.isEmpty()) {
                    runnerAssignmentService.assignOrdersToAvailableRunners(pendingOrders, now.toLocalDate(), slot);
                }
            }
        }
    }


    private LocalDateTime getSlotStart(Timeslot slot) {
        switch (slot) {
            case SLOT_1: return LocalDateTime.now().withHour(7).withMinute(15).withSecond(0).withNano(0);
            case SLOT_2: return LocalDateTime.now().withHour(11).withMinute(0).withSecond(0).withNano(0);
            case SLOT_3: return LocalDateTime.now().withHour(14).withMinute(30).withSecond(0).withNano(0);
            case SLOT_4: return LocalDateTime.now().withHour(18).withMinute(0).withSecond(0).withNano(0);
            default: return LocalDateTime.now(); 
        }
    }
}