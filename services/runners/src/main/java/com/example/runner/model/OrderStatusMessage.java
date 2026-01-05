package com.example.runner.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class OrderStatusMessage {

    @JsonProperty("order")
    private OrderStatusUpdate order;
}
