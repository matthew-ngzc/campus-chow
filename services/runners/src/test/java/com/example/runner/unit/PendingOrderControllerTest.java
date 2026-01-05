package com.example.runner.unit;

import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.repository.PendingOrderRepository;
import com.example.runner.service.PendingOrderService;
import com.example.runner.controller.PendingOrderController;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

public class PendingOrderControllerTest {

    private PendingOrderRepository repository;
    private PendingOrderService pendingOrderService;
    private PendingOrderController controller;

    @BeforeEach
    void setup() {
        repository = mock(PendingOrderRepository.class);
        pendingOrderService = mock(PendingOrderService.class);
        controller = new PendingOrderController(repository, pendingOrderService);
    }

    @Test
    void testGetAllPendingOrders() {
        // Arrange
        PendingOrder order = new PendingOrder();
        when(repository.findAll()).thenReturn(List.of(order));

        // Act
        List<PendingOrder> result = controller.getAllPendingOrders();

        // Assert
        assertThat(result).hasSize(1);
        verify(repository, times(1)).findAll();
    }

    @Test
    void testGetPendingOrdersByTimeslot() {
        // Arrange
        Timeslot timeslot = Timeslot.SLOT_1; // assuming you have an enum
        PendingOrder order1 = new PendingOrder();
        PendingOrder order2 = new PendingOrder();

        when(pendingOrderService.getPendingOrdersByTimeslot(timeslot))
                .thenReturn(List.of(order1, order2));

        // Act
        ResponseEntity<List<PendingOrder>> response = controller.getPendingOrdersByTimeslot(timeslot);

        // Assert
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pendingOrderService, times(1)).getPendingOrdersByTimeslot(timeslot);
    }

    @Test
    void testGetPendingOrdersByDeliveryTime() {
        // Arrange
        String start = "2025-11-12T10:00:00";
        String end = "2025-11-12T12:00:00";
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);

        PendingOrder order = new PendingOrder();
        when(pendingOrderService.getPendingOrdersByDeliveryTime(startDate, endDate))
                .thenReturn(List.of(order));

        // Act
        ResponseEntity<List<PendingOrder>> response = controller.getPendingOrdersByDeliveryTime(start, end);

        // Assert
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(pendingOrderService).getPendingOrdersByDeliveryTime(startDate, endDate);
    }
}