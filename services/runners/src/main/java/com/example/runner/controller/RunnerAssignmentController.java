package com.example.runner.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.*;

import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.security.JwtUtils;
import com.example.runner.service.PendingOrderService;
import com.example.runner.service.RunnerAssignmentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/runners/assign")
public class RunnerAssignmentController {

    private final RunnerAssignmentService assignmentService;
    private final PendingOrderService pendingOrderService;
    private final JwtUtils jwtUtils;

    public RunnerAssignmentController(RunnerAssignmentService assignmentService, PendingOrderService pendingOrderService, JwtUtils jwtUtils) {
        this.assignmentService = assignmentService;
        this.pendingOrderService = pendingOrderService;
        this.jwtUtils = jwtUtils;
    }
    
    @PostMapping
    public ResponseEntity<String> assignOrders(@RequestParam Timeslot timeslot, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            LocalDate targetDate = (date != null) ? date : LocalDate.now();
            
            List<PendingOrder> pendingOrders = pendingOrderService.getPendingOrdersByTimeslot(timeslot);

            if (pendingOrders.isEmpty()) {
                return ResponseEntity.ok("No pending orders to assign for " + timeslot);
            }

            assignmentService.assignOrdersToAvailableRunners(pendingOrders, targetDate, timeslot);
            return ResponseEntity.ok("Assigned " + pendingOrders.size() + " orders for " + timeslot);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning orders: " + e.getMessage());
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<PendingOrder>> getAssignedOrders( @RequestHeader("Authorization") String authHeader, @RequestParam(required = false) LocalDate date) {
        Long runnerId = Long.valueOf(jwtUtils.extractUserId(authHeader));

        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        List<PendingOrder> assignedOrders = assignmentService.getAssignedOrdersForRunner(runnerId, targetDate);
        return ResponseEntity.ok(assignedOrders);
    }

    @DeleteMapping("/reset")
    public ResponseEntity<String> resetAllAssignments() {
        assignmentService.resetAllAssignments();
        return ResponseEntity.ok("All assignments cleared and pending orders reset.");
    }

}
