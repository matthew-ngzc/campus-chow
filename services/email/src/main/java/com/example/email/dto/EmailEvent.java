package com.example.email.dto;

import java.io.Serializable;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailEvent implements Serializable {
    private String to;  
    private String subject;  
    private String template; 
    private Map<String, Object> variables;  
}