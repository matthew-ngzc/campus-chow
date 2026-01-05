package com.example.runner.controller;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.example.runner.service.PendingOrderService;
import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.repository.PendingOrderRepository;

import org.springframework.web.bind.annotation.*;
import java.time.*;

@RestController
@RequestMapping("/api/orders")
public class PendingOrderController {

    private final PendingOrderService pendingOrderService;
    private final PendingOrderRepository repository;

    public PendingOrderController(PendingOrderRepository repository, PendingOrderService pendingOrderService) {
        this.repository = repository;
        this.pendingOrderService = pendingOrderService;
    }

    @GetMapping("/pending")
    public List<PendingOrder> getAllPendingOrders() {
        return repository.findAll();
    }

    @GetMapping("/pending/{timeslot}")
    public ResponseEntity<List<PendingOrder>> getPendingOrdersByTimeslot(@PathVariable Timeslot timeslot) {
        List<PendingOrder> pendingOrders = pendingOrderService.getPendingOrdersByTimeslot(timeslot);
        return ResponseEntity.ok(pendingOrders);
    }

    @GetMapping("/pending/delivery-time")
    public ResponseEntity<List<PendingOrder>> getPendingOrdersByDeliveryTime(
            @RequestParam String start, @RequestParam String end) {
        LocalDateTime startDate = LocalDateTime.parse(start);
        LocalDateTime endDate = LocalDateTime.parse(end);
        List<PendingOrder> pendingOrders = pendingOrderService.getPendingOrdersByDeliveryTime(startDate, endDate);
        return ResponseEntity.ok(pendingOrders);
    }
}
