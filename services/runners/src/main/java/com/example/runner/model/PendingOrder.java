package com.example.runner.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "pending_orders")
public class PendingOrder {

    @Id
    private Long orderId;

    private LocalDateTime deliveryTime; 
    private String building;
    private String roomType;
    private String roomNumber;
    private Long merchantId;
    private String customerEmail;
    private Integer deliveryFeeCents;
    private int totalAmountCents;
    private String itemsJson;

    @Enumerated(EnumType.STRING)
    private Timeslot timeslot;

    private boolean assigned = false; 
}