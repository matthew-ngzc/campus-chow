package com.example.email.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateRenderer templateRenderer;

    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        String htmlBody = templateRenderer.render(templateName, variables);
        
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8"); 
            
            helper.setText(htmlBody, true);
            helper.setTo(to);
            helper.setSubject(subject);
            
            mailSender.send(mimeMessage);
            System.out.println(" Email sent successfully to " + to);
        } catch (MessagingException e) {
            System.err.println(" Failed to send email: " + e.getMessage());
        }
    }

}

