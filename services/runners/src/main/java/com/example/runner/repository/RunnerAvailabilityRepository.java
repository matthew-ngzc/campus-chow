package com.example.runner.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.*;
import com.example.runner.model.RunnerAvailability;
import com.example.runner.model.Timeslot;

@Repository
public interface RunnerAvailabilityRepository extends JpaRepository<RunnerAvailability, Long> {
    List<RunnerAvailability> findByRunnerIdAndDate(Long runnerId, LocalDate date);
    List<RunnerAvailability> findByTimeslotAndDate(Timeslot timeslot, LocalDate date);
    
    @Query("SELECT DISTINCT r.runnerEmail FROM RunnerAvailability r WHERE r.runnerId = :runnerId AND r.date = :date")
    String findEmailByRunnerId(@Param("runnerId") Long runnerId, @Param("date") LocalDate date);
    
    void deleteByRunnerIdAndDate(Long runnerId, LocalDate date);
    
    @Query("SELECT r.runnerId FROM RunnerAvailability r WHERE r.date = :date AND r.timeslot = :timeslot")
    List<Long> findRunnerIdsByDateAndTimeslot(LocalDate date, Timeslot timeslot);
    void deleteByDateBefore(LocalDate date);

    @Transactional
    @Modifying
    @Query("DELETE FROM RunnerAvailability r WHERE r.runnerId = :runnerId AND r.date = :date AND r.timeslot = :timeslot")
    void deleteByRunnerIdAndDateAndTimeslot(
        @Param("runnerId") Long runnerId,
        @Param("date") LocalDate date,
        @Param("timeslot") Timeslot timeslot
    );
}
