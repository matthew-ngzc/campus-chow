package com.example.runner;

import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.service.PendingOrderService;
import com.example.runner.service.RunnerAssignmentService;
import com.example.runner.scheduler.OrderAssignmentScheduler;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@SpringBootTest
class OrderAssignmentSchedulerTest {

    @MockitoBean
    private PendingOrderService pendingOrderService;

    @MockitoBean
    private RunnerAssignmentService runnerAssignmentService;

    @Autowired
    private OrderAssignmentScheduler scheduler;

    @Test
    void shouldTriggerAssignmentAtExactSlotStart() {
        // Arrange
        LocalDateTime now = LocalDate.now().atTime(7, 15);
        Timeslot slot = Timeslot.SLOT_1;

        List<PendingOrder> fakeOrders = List.of(new PendingOrder());
        Mockito.when(pendingOrderService.getPendingOrdersByTimeslot(slot)).thenReturn(fakeOrders);

        // Act
        scheduler.assignUpcomingOrders(now);

        // Assert
        Mockito.verify(runnerAssignmentService)
                .assignOrdersToAvailableRunners(fakeOrders, LocalDate.now(), slot);
    }

    @Test
    void shouldNotTriggerAssignmentBeforeSlotStart() {
        LocalDateTime now = LocalDate.now().atTime(7, 14);
        scheduler.assignUpcomingOrders(now);

        Mockito.verifyNoInteractions(runnerAssignmentService);
    }
}
