package com.smunch.admin;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final SecretKey key;

  public JwtAuthFilter(@Value("${security.jwt.secret}") String secret) {
    // make sure your secret is >= 32 chars for HS256 key
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      String token = h.substring(7);
      try {
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
            .parseClaimsJws(token).getBody();
        String role = String.valueOf(claims.get("role"));// "ADMIN" / "USER"
        String email = String.valueOf(claims.get("email")); 
        var auth = new UsernamePasswordAuthenticationToken(
          email, // principal
          null,
          List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
      } catch (JwtException ignored) { /* invalid token → remain unauthenticated */ }
    }
    chain.doFilter(req, res);
  }
}

