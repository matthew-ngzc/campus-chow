package com.example.runner.controller;

import com.example.runner.service.RunnerAvailabilityService;
import com.example.runner.model.*;
import com.example.runner.security.JwtUtils;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/runners/availability")
public class RunnerAvailabilityController {

    private final RunnerAvailabilityService service;
    private final JwtUtils jwtUtils;

    public RunnerAvailabilityController(RunnerAvailabilityService service, JwtUtils jwtUtils) {
        this.service = service;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping
    public String setAvailability( @RequestHeader("Authorization") String authHeader, @RequestBody List<Timeslot> selectedSlots) {
        String runnerId = jwtUtils.extractUserId(authHeader);
        String runnerEmail = jwtUtils.extractUserEmail(authHeader);
        service.setAvailability(Long.valueOf(runnerId), selectedSlots, runnerEmail);
        return "Availability set successfully for " + runnerId + runnerEmail;
    }

    @PostMapping("/today")
    public String setAvailabilityToday( @RequestHeader("Authorization") String authHeader, @RequestBody List<Timeslot> selectedSlots) {
        String runnerId = jwtUtils.extractUserId(authHeader);
        String runnerEmail = jwtUtils.extractUserEmail(authHeader);
        service.setAvailabilityToday(Long.valueOf(runnerId), selectedSlots, runnerEmail);
        return "Availability set successfully for " + runnerId + runnerEmail;
    }

    //  @PatchMapping("/{runnerId}/add")
    // public String addAvailability( @PathVariable Long runnerId, @RequestBody List<Timeslot> slotsToAdd) {
    //     service.addTimeslots(runnerId, slotsToAdd);
    //     return "Added timeslots successfully for " + runnerId;
    // }

    @PatchMapping("/{runnerId}/remove")
    public String removeAvailability( @PathVariable Long runnerId, @RequestBody List<Timeslot> slotsToRemove) {
        service.removeTimeslots(runnerId, slotsToRemove);
        return "Removed timeslots successfully for " + runnerId;
    }

    @PatchMapping("/{runnerId}/remove/today")
    public String removeAvailabilityToday( @PathVariable Long runnerId, @RequestBody List<Timeslot> slotsToRemove) {
        service.removeTimeslotsToday(runnerId, slotsToRemove);
        return "Removed timeslots successfully for " + runnerId;
    }

    @GetMapping("/{date}")
    public ResponseEntity<List<Timeslot>> getAvailabilityByDate( @RequestHeader("Authorization") String authHeader, @PathVariable LocalDate date) {
        String runnerId = jwtUtils.extractUserId(authHeader);
        List<Timeslot> slots = service.getAvailabilityByDate(Long.valueOf(runnerId), date);
        return ResponseEntity.ok(slots);
    }


    @GetMapping("/available/{date}/{timeslot}")
    public ResponseEntity<List<Long>> getAllAvailableRunners(@PathVariable LocalDate date, @PathVariable Timeslot timeslot) {
        List<Long> runnerIds = service.getAvailableRunnerIds(date, timeslot);
        return ResponseEntity.ok(runnerIds);
    }
}
