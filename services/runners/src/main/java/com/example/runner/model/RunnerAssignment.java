package com.example.runner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "runner_assignments")
public class RunnerAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long runnerId;
    private Long orderId;
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    private Timeslot timeslot;

}
