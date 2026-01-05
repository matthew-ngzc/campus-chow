package com.example.runner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "runners_availability")
public class RunnerAvailability {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long runnerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Timeslot timeslot;

    @Column(nullable = false)
    private LocalDate date; 

    private String runnerEmail;

}