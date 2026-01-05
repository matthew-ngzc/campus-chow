package com.example.runner.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class OrderStatusUpdate {
    @JsonProperty("order_id")
    private Long orderId;

    @JsonProperty("order_status")
    private String orderStatus;

    @JsonProperty("delivery_time")
    private LocalDateTime deliveryTime;

    @JsonProperty("payment_deadline_time")
    private LocalDateTime paymentDeadlineTime;

    private String building;

    @JsonProperty("room_type")
    private String roomType;

    @JsonProperty("room_number")
    private String roomNumber;

    @JsonProperty("merchant_id")
    private Long merchantId;

    @JsonProperty("customer_email")
    private String customerEmail;

    @JsonProperty("amounts")
    private Amount amounts;

    @JsonProperty("items")
    private List<Item> items;

    @JsonProperty("created_time")
    private LocalDateTime createdTime;

    @JsonProperty("updated_time")
    private LocalDateTime updatedTime;

    @Data
    public static class Amount {
        @JsonProperty("food_amount_cents")
        private int foodAmountCents;

        @JsonProperty("delivery_fee_cents")
        private int deliveryFeeCents;

        @JsonProperty("total_amount_cents")
        private int totalAmountCents;
    }

    @Data
    public static class Item {
        private int qty;
        private String name;

        @JsonProperty("menuItemId")
        private Long menuItemId;

        @JsonProperty("unitPriceCents")
        private int unitPriceCents;
    }
}
