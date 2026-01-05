package com.example.runner.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestHeader;

import com.example.runner.model.RunnerAvailability;
import com.example.runner.repository.RunnerAvailabilityRepository;

import jakarta.transaction.Transactional;

import com.example.runner.model.Timeslot;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@Transactional
public class RunnerAvailabilityService {

    private final RunnerAvailabilityRepository repository;

    public RunnerAvailabilityService(RunnerAvailabilityRepository repository) {
        this.repository = repository;
    }

    public void setAvailability( Long runnerId, List<Timeslot> slots, String runnerEmail) {
        LocalDate targetDate = LocalDate.now(ZoneId.of("Asia/Singapore")).plusDays(1);
        
        if (!repository.findByRunnerIdAndDate(runnerId, targetDate).isEmpty()) {
            throw new IllegalStateException("You have already set availability for tomorrow. Use update instead.");
        }

        for (Timeslot slot : slots) {
            repository.save(new RunnerAvailability(null, runnerId, slot, targetDate, runnerEmail));
        }
    }

    public void setAvailabilityToday( Long runnerId, List<Timeslot> slots, String runnerEmail) {
        LocalDate targetDate = LocalDate.now(ZoneId.of("Asia/Singapore"));
        
        if (!repository.findByRunnerIdAndDate(runnerId, targetDate).isEmpty()) {
            throw new IllegalStateException("You have already set availability for tomorrow. Use update instead.");
        }

        for (Timeslot slot : slots) {
            repository.save(new RunnerAvailability(null, runnerId, slot, targetDate, runnerEmail));
        }
    }

    // public void addTimeslots(Long runnerId, List<Timeslot> slotsToAdd) {
    //     LocalDate targetDate = LocalDate.now().plusDays(1);

    //     // Fetch existing availability for tomorrow
    //     List<RunnerAvailability> existing = repository.findByRunnerIdAndDate(runnerId, targetDate);
    //     Set<Timeslot> existingSlots = new HashSet<>();
    //     for (RunnerAvailability r : existing) {
    //         existingSlots.add(r.getTimeslot());
    //     }

    //     // Add only those not already existing
    //     for (Timeslot slot : slotsToAdd) {
    //         if (!existingSlots.contains(slot)) {
    //             RunnerAvailability availability = new RunnerAvailability(null, runnerId, slot, targetDate);
    //             repository.save(availability);
    //         }
    //     }
    // }

    public void removeTimeslots(Long runnerId, List<Timeslot> slotsToRemove) {
        LocalDate targetDate = LocalDate.now().plusDays(1);

        for (Timeslot slot : slotsToRemove) {
            repository.deleteByRunnerIdAndDateAndTimeslot(runnerId, targetDate, slot);
        }
    }

    public void removeTimeslotsToday(Long runnerId, List<Timeslot> slotsToRemove) {
        LocalDate targetDate = LocalDate.now();

        for (Timeslot slot : slotsToRemove) {
            repository.deleteByRunnerIdAndDateAndTimeslot(runnerId, targetDate, slot);
        }
    }

    public List<Timeslot> getAvailabilityByDate( Long runnerId, LocalDate date) {
        List<RunnerAvailability> records = repository.findByRunnerIdAndDate(runnerId, date);
        List<Timeslot> slots = new ArrayList<>();

        for (RunnerAvailability record : records) {
            slots.add(record.getTimeslot());
        }

        return slots;
    }

    @Scheduled(cron = "0 0 0 * * *")  
    public void cleanupOldAvailability() {
        LocalDate today = LocalDate.now();
        repository.deleteByDateBefore(today); 
    }

    // Get available runners for matching 
    public List<Long> getAvailableRunnerIds(LocalDate date, Timeslot timeslot) {
        return repository.findRunnerIdsByDateAndTimeslot(date, timeslot);
    }
}