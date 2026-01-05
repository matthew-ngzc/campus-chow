// package com.example.runner;

// import static org.junit.jupiter.api.Assertions.assertEquals;
// import static org.junit.jupiter.api.Assertions.assertThrows;
// import static org.junit.jupiter.api.Assertions.assertTrue;
// import static org.mockito.ArgumentMatchers.any;
// import static org.mockito.ArgumentMatchers.eq;
// import static org.mockito.Mockito.times;
// import static org.mockito.Mockito.verify;
// import static org.mockito.Mockito.when;

// import java.time.LocalDate;
// import java.util.*;

// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.InjectMocks;
// import org.mockito.Mock;
// import org.mockito.junit.jupiter.MockitoExtension;

// import com.example.runner.model.RunnerAvailability;
// import com.example.runner.model.Timeslot;
// import com.example.runner.repository.RunnerAvailabilityRepository;
// import com.example.runner.service.RunnerAvailabilityService;

// @ExtendWith(MockitoExtension.class)
// public class RunnerAvailabilityServiceTest {
//     @Mock
//     private RunnerAvailabilityRepository repository;

//     @InjectMocks
//     private RunnerAvailabilityService service;

//     private Long runnerId;
//     private LocalDate tomorrow;

//     @BeforeEach
//     void setup() {
//         runnerId = 101L;
//         tomorrow = LocalDate.now().plusDays(1);
//     }

//     @Test
//     void testSetAvailability_Success() {
//         when(repository.findByRunnerIdAndDate(runnerId, tomorrow)).thenReturn(Collections.emptyList());

//         service.setAvailability(runnerId, Arrays.asList(Timeslot.SLOT_1, Timeslot.SLOT_2));

//         verify(repository, times(2)).save(any(RunnerAvailability.class));
//     }

//     @Test
//     void testSetAvailability_AlreadyExists_ThrowsException() {
//         when(repository.findByRunnerIdAndDate(runnerId, tomorrow))
//                 .thenReturn(List.of(new RunnerAvailability(1L, runnerId, Timeslot.SLOT_1, tomorrow)));

//         assertThrows(IllegalStateException.class, () ->
//                 service.setAvailability(runnerId, List.of(Timeslot.SLOT_2)));
//     }


//     @Test
//     void testAddTimeslots_AddsNewOnesOnly() {
//         when(repository.findByRunnerIdAndDate(runnerId, tomorrow))
//                 .thenReturn(List.of(new RunnerAvailability(1L, runnerId, Timeslot.SLOT_1, tomorrow)));

//         service.addTimeslots(runnerId, List.of(Timeslot.SLOT_1, Timeslot.SLOT_2));

//         verify(repository, times(1)).save(any(RunnerAvailability.class)); // Only AFTERNOON should be added
//     }

//     @Test
//     void testRemoveTimeslots_CallsRepositoryDelete() {
//         service.removeTimeslots(runnerId, List.of(Timeslot.SLOT_1, Timeslot.SLOT_3));
//         verify(repository, times(2)).deleteByRunnerIdAndDateAndTimeslot(eq(runnerId), any(), any());
//     }

//     @Test
//     void testGetAvailabilityByDate_ReturnsAllSlots() {
//         List<RunnerAvailability> records = List.of(
//                 new RunnerAvailability(1L, runnerId, Timeslot.SLOT_1, tomorrow),
//                 new RunnerAvailability(2L, runnerId, Timeslot.SLOT_3, tomorrow)
//         );

//         when(repository.findByRunnerIdAndDate(runnerId, tomorrow)).thenReturn(records);

//         List<Timeslot> result = service.getAvailabilityByDate(runnerId, tomorrow);

//         assertEquals(2, result.size());
//         assertTrue(result.contains(Timeslot.SLOT_1));
//         assertTrue(result.contains(Timeslot.SLOT_3));

//         verify(repository).findByRunnerIdAndDate(runnerId, tomorrow);
//     }

//     @Test
//     void testGetAvailableRunnerIds_ReturnsCorrectList() {
//         List<Long> runnerIds = List.of(101L, 102L, 103L);
//         when(repository.findRunnerIdsByDateAndTimeslot(tomorrow, Timeslot.SLOT_1))
//                 .thenReturn(runnerIds);

//         List<Long> result = service.getAvailableRunnerIds(tomorrow, Timeslot.SLOT_1);

//         assertEquals(3, result.size());
//         assertTrue(result.contains(102L));

//         verify(repository).findRunnerIdsByDateAndTimeslot(tomorrow, Timeslot.SLOT_1);
//     }
// }
