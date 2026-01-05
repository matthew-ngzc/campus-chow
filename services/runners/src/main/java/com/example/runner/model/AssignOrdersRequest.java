package com.example.runner.model;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data
public class AssignOrdersRequest {
    private List<PendingOrder> orders;
    private LocalDate date;
    private Timeslot timeslot;
}

