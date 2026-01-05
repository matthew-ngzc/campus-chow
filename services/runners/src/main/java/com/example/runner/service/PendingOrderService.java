package com.example.runner.service;

import com.example.runner.model.OrderStatusUpdate;
import com.example.runner.model.PendingOrder;
import com.example.runner.model.Timeslot;
import com.example.runner.repository.PendingOrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class PendingOrderService {

    private final PendingOrderRepository repository;

    public PendingOrderService(PendingOrderRepository repository) {
        this.repository = repository;
    }

    private String convertItemsToJson(List<OrderStatusUpdate.Item> items) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.writeValueAsString(items);
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }

    public void savePendingOrder(OrderStatusUpdate update) {
        PendingOrder order = new PendingOrder();
        order.setOrderId(update.getOrderId());

        LocalDateTime sgTime = update.getDeliveryTime()
            .atOffset(ZoneOffset.UTC)
            .atZoneSameInstant(ZoneId.of("Asia/Singapore"))
            .toLocalDateTime();

        order.setDeliveryTime(sgTime);
        order.setBuilding(update.getBuilding());
        order.setRoomType(update.getRoomType());
        order.setRoomNumber(update.getRoomNumber());
        order.setMerchantId(update.getMerchantId());
        order.setCustomerEmail(update.getCustomerEmail());
        order.setDeliveryFeeCents(update.getAmounts().getDeliveryFeeCents());
        order.setTotalAmountCents(update.getAmounts().getTotalAmountCents());
        order.setTimeslot(Timeslot.fromDeliveryTime(sgTime));
        order.setItemsJson(convertItemsToJson(update.getItems()));

        repository.save(order);
    }

   
    public List<PendingOrder> getPendingOrdersByTimeslot(Timeslot slot) {
        return repository.findByTimeslotAndAssignedFalse(slot);
    }

    public List<PendingOrder> getPendingOrdersByDeliveryTime(LocalDateTime start, LocalDateTime end) {
        return repository.findByDeliveryTimeBetweenAndAssignedFalse(start, end);
    }
}
