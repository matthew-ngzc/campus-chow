package com.example.runner.repository;

import java.time.LocalDate;
import java.util.*;
import com.example.runner.model.RunnerAssignment;
import com.example.runner.model.Timeslot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RunnerAssignmentRepository extends JpaRepository<RunnerAssignment, Long> {
    List<RunnerAssignment> findByDateAndTimeslot(LocalDate date, Timeslot timeslot);
    List<RunnerAssignment> findByRunnerIdAndDate(Long runnerId, LocalDate date);
    Optional<RunnerAssignment> findByOrderId(Long orderId);
}
