package com.example.runner.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Component;

@Component
public class JwtUtils {

    private final String SECRET_KEY = "dev-secret-change-me-1234567890-abcdef"; 

    public String extractUserId(String token) {
         if (token == null || token.isEmpty()) {
            System.out.println("No Authorization header found");
            return null;
        }

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            System.out.println("Extracted claims: " + claims);
            return claims.get("id").toString(); 
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to parse JWT: " + e.getMessage());
            return null;
        } 
    }

    public String extractUserEmail(String token) {
        if (token == null || token.isEmpty()) return null;

        if (token.startsWith("Bearer ")) {
            token = token.substring(7);  // Remove "Bearer "
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.get("email", String.class);  // Assuming email is stored under "email"
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
