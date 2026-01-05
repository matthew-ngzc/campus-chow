package com.example.email.controller;

import com.example.email.dto.EmailEvent;
import com.example.email.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<String> sendEmail(@RequestBody EmailEvent request) {
        emailService.sendTemplatedEmail(
                request.getTo(),
                request.getSubject(),
                request.getTemplate(),
                request.getVariables());
        return ResponseEntity.ok(" Email sent using template: " + request.getTemplate());
    }

}
