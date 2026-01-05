package com.example.runner.model;

import java.time.*;

public enum Timeslot {
    SLOT_1("07:15-08:15"), 
    SLOT_2("11:00-12:00"), 
    SLOT_3("14:30-15:30"), 
    SLOT_4("18:00-19:00"); 

    private String timeWindow;

    Timeslot(String timeWindow) {
        this.timeWindow = timeWindow;
    }

    public String getTimeWindow() {
        return timeWindow;
    }

    public static Timeslot fromDeliveryTime(LocalDateTime deliveryTime) {
        int hour = deliveryTime.getHour();
        int minute = deliveryTime.getMinute();

        if (hour == 7 && minute >= 15 || (hour == 8 && minute <= 15)) return SLOT_1;      
        if (hour == 11 || (hour == 12 && minute == 0)) return SLOT_2;                     
        if ((hour == 14 && minute >= 30) || (hour == 15 && minute <= 30)) return SLOT_3;  
        if ((hour == 18) || (hour == 19 && minute <= 0)) return SLOT_4;      
        return null; 
    }
}

