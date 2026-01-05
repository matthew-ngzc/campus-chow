package com.example.runner.unit;

import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.security.JwtUtils;
import com.example.runner.service.PendingOrderService;
import com.example.runner.service.RunnerAssignmentService;
import com.example.runner.controller.RunnerAssignmentController;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

public class RunnerAssignmentControllerTest {

    private RunnerAssignmentService assignmentService;
    private PendingOrderService pendingOrderService;
    private JwtUtils jwtUtils;
    private RunnerAssignmentController controller;

    @BeforeEach
    void setup() {
        assignmentService = mock(RunnerAssignmentService.class);
        pendingOrderService = mock(PendingOrderService.class);
        jwtUtils = mock(JwtUtils.class);

        controller = new RunnerAssignmentController(assignmentService, pendingOrderService, jwtUtils);
    }

    @Test
    void testAssignOrders_NoPendingOrders() {
        Timeslot timeslot = Timeslot.SLOT_1;
        LocalDate today = LocalDate.now();

        when(pendingOrderService.getPendingOrdersByTimeslot(timeslot)).thenReturn(List.of());

        ResponseEntity<String> response = controller.assignOrders(timeslot, today);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("No pending orders");
        verify(pendingOrderService).getPendingOrdersByTimeslot(timeslot);
        verifyNoInteractions(assignmentService);
    }

    @Test
    void testAssignOrders_SuccessfulAssignment() {
        Timeslot timeslot = Timeslot.SLOT_2;
        LocalDate today = LocalDate.now();

        PendingOrder order1 = new PendingOrder();
        PendingOrder order2 = new PendingOrder();
        List<PendingOrder> orders = List.of(order1, order2);

        when(pendingOrderService.getPendingOrdersByTimeslot(timeslot)).thenReturn(orders);

        ResponseEntity<String> response = controller.assignOrders(timeslot, today);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Assigned 2 orders for " + timeslot);
        verify(assignmentService).assignOrdersToAvailableRunners(orders, today, timeslot);
    }

    @Test
    void testAssignOrders_ExceptionThrown() {
        Timeslot timeslot = Timeslot.SLOT_3;

        when(pendingOrderService.getPendingOrdersByTimeslot(timeslot))
                .thenThrow(new RuntimeException("Database error"));

        ResponseEntity<String> response = controller.assignOrders(timeslot, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).contains("Error assigning orders");
    }

    @Test
    void testGetAssignedOrders_Success() {
        String token = "Bearer abc.def.ghi";
        Long runnerId = 99L;
        LocalDate today = LocalDate.now();

        when(jwtUtils.extractUserId(token)).thenReturn(String.valueOf(runnerId));

        PendingOrder order = new PendingOrder();
        when(assignmentService.getAssignedOrdersForRunner(runnerId, today)).thenReturn(List.of(order));

        ResponseEntity<List<PendingOrder>> response = controller.getAssignedOrders(token, today);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        verify(jwtUtils).extractUserId(token);
        verify(assignmentService).getAssignedOrdersForRunner(runnerId, today);
    }

    @Test
    void testResetAllAssignments() {
        ResponseEntity<String> response = controller.resetAllAssignments();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("All assignments cleared");
        verify(assignmentService, times(1)).resetAllAssignments();
    }
}