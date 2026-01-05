package com.example.runner.unit;

import com.example.runner.model.Timeslot;
import com.example.runner.security.JwtUtils;
import com.example.runner.service.RunnerAvailabilityService;
import com.example.runner.controller.RunnerAvailabilityController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class RunnerAvailabilityControllerTest {

    private RunnerAvailabilityService service;
    private JwtUtils jwtUtils;
    private RunnerAvailabilityController controller;

    @BeforeEach
    void setUp() {
        service = mock(RunnerAvailabilityService.class);
        jwtUtils = mock(JwtUtils.class);
        controller = new RunnerAvailabilityController(service, jwtUtils);
    }

    @Test
    void setAvailability_callsServiceAndReturnsMessage() {
        String auth = "Bearer token";
        List<Timeslot> slots = List.of(Timeslot.SLOT_1, Timeslot.SLOT_2);

        when(jwtUtils.extractUserId(auth)).thenReturn("42");
        when(jwtUtils.extractUserEmail(auth)).thenReturn("runner@example.com");

        String res = controller.setAvailability(auth, slots);

        assertThat(res).contains("Availability set successfully for 42runner@example.com");
        verify(jwtUtils).extractUserId(auth);
        verify(jwtUtils).extractUserEmail(auth);
        verify(service).setAvailability(42L, slots, "runner@example.com");
    }

    @Test
    void setAvailabilityToday_callsServiceAndReturnsMessage() {
        String auth = "Bearer t";
        List<Timeslot> slots = List.of(Timeslot.SLOT_3);

        when(jwtUtils.extractUserId(auth)).thenReturn("7");
        when(jwtUtils.extractUserEmail(auth)).thenReturn("r7@example.com");

        String res = controller.setAvailabilityToday(auth, slots);

        assertThat(res).contains("Availability set successfully for 7r7@example.com");
        verify(service).setAvailabilityToday(7L, slots, "r7@example.com");
    }

    @Test
    void removeAvailability_callsServiceAndReturnsMessage() {
        Long runnerId = 9L;
        List<Timeslot> toRemove = List.of(Timeslot.SLOT_1);

        String res = controller.removeAvailability(runnerId, toRemove);

        assertThat(res).contains("Removed timeslots successfully for 9");
        verify(service).removeTimeslots(9L, toRemove);
    }

    @Test
    void removeAvailabilityToday_callsServiceAndReturnsMessage() {
        Long runnerId = 11L;
        List<Timeslot> toRemove = List.of(Timeslot.SLOT_2, Timeslot.SLOT_3);

        String res = controller.removeAvailabilityToday(runnerId, toRemove);

        assertThat(res).contains("Removed timeslots successfully for 11");
        verify(service).removeTimeslotsToday(11L, toRemove);
    }

    @Test
    void getAvailabilityByDate_returnsSlotsForRunnerFromToken() {
        String auth = "Bearer z";
        LocalDate date = LocalDate.of(2025, 11, 12);
        when(jwtUtils.extractUserId(auth)).thenReturn("55");
        List<Timeslot> slots = List.of(Timeslot.SLOT_1);
        when(service.getAvailabilityByDate(55L, date)).thenReturn(slots);

        ResponseEntity<List<Timeslot>> resp = controller.getAvailabilityByDate(auth, date);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).containsExactly(Timeslot.SLOT_1);
        verify(jwtUtils).extractUserId(auth);
        verify(service).getAvailabilityByDate(55L, date);
    }

    @Test
    void getAllAvailableRunners_returnsIds() {
        LocalDate date = LocalDate.of(2025, 11, 12);
        Timeslot timeslot = Timeslot.SLOT_1;
        List<Long> ids = List.of(1L, 2L, 3L);
        when(service.getAvailableRunnerIds(date, timeslot)).thenReturn(ids);

        ResponseEntity<List<Long>> resp = controller.getAllAvailableRunners(date, timeslot);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).containsExactly(1L, 2L, 3L);
        verify(service).getAvailableRunnerIds(date, timeslot);
    }
}
