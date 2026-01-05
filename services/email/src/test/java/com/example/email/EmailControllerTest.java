package com.example.email;

import com.example.email.service.EmailService;
import com.example.email.controller.EmailController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(EmailController.class)  
public class EmailControllerTest {
    @Autowired
    private MockMvc mockMvc; 

    @MockitoBean
    private EmailService emailService; 

    @Test
    public void testSendEmail() throws Exception {
      
        String requestBody = "{\n" +
                "  \"to\": \"test@smunch.com\",\n" +
                "  \"subject\": \"Payment Confirmation\",\n" +
                "  \"template\": \"payment_success\",\n" +
                "  \"variables\": {\n" +
                "    \"customerName\": \"Smunchie\",\n" +
                "    \"orderId\": \"239\",\n" +
                "    \"paymentRef\": \"SMUNCH239\",\n" +
                "    \"deliveryLocation\": \"Scis2 Seminar room 3-3\",\n" +
                "    \"scheduledTime\": \"18/07/2025, 12:00:00 pm\",\n" +
                "    \"items\": [\n" +
                "      {\"name\": \"1x Muscle Bowl\", \"price\": \"$7.20\"}\n" +
                "    ],\n" +
                "    \"deliveryFee\": \"$1.00\",\n" +
                "    \"total\": \"$8.20\"\n" +
                "  }\n" +
                "}";

        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), anyMap());

        mockMvc.perform(post("/api/email/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk()) 
                .andExpect(content().string(" Email sent using template: payment_success"));  // Check the response body

        // Verify that the emailService.sendTemplatedEmail() was called with the expected parameters
        verify(emailService, times(1)).sendTemplatedEmail(
                "test@smunch.com", 
                "Payment Confirmation", 
                "payment_success", 
                Map.of(
                        "customerName", "Smunchie", 
                        "orderId", "239",
                        "paymentRef", "SMUNCH239",
                        "deliveryLocation", "Scis2 Seminar room 3-3",
                        "scheduledTime", "18/07/2025, 12:00:00 pm",
                        "items", List.of(Map.of("name", "1x Muscle Bowl", "price", "$7.20")),
                        "deliveryFee", "$1.00",
                        "total", "$8.20"
                )
        );
    }
}
