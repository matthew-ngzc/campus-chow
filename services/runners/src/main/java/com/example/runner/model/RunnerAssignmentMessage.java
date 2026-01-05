package com.example.runner.model;

import lombok.Data;
import java.util.List;

@Data
public class RunnerAssignmentMessage {

    private Long runnerId;
    private String runnerEmail;
    private List<OrderDetails> orders;

    @Data
    public static class OrderDetails {
        private Long orderId;
        private String building;
        private String roomType;
        private String roomNumber;
        private String deliveryTime;
        private List<String> items;
        private double totalAmountCents;


        public OrderDetails(Long orderId, String building, String roomType, String roomNumber, String deliveryTime, List<String> items, double totalAmountCents) {
            this.orderId = orderId;
            this.building = building;
            this.roomType = roomType;
            this.roomNumber = roomNumber;
            this.deliveryTime = deliveryTime;
            this.items = items;
            this.totalAmountCents = totalAmountCents;
        }
    }

    
}
