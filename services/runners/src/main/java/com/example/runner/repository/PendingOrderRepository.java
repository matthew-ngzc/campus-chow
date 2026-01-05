package com.example.runner.repository;

import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PendingOrderRepository extends JpaRepository<PendingOrder, Long> {
    List<PendingOrder> findByTimeslotAndAssignedFalse(Timeslot timeslot);
    List<PendingOrder> findByDeliveryTimeBetweenAndAssignedFalse(LocalDateTime start, LocalDateTime end);
    List<PendingOrder> findByAssignedTrue();
}
