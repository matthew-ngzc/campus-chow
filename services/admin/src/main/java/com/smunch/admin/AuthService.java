package com.smunch.admin;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;


@Service @RequiredArgsConstructor
public class AuthService {
  private final AdminAccountRepo repo;
  private final PasswordEncoder encoder;

  @Value("${security.jwt.secret}")
  String secret;

  public void register(String email, String rawPassword) {
    var acc = new AdminAccount();
    acc.setEmail(email.toLowerCase());
    acc.setPasswordHash(encoder.encode(rawPassword));
    repo.save(acc);
  }

  public String login(String email, String rawPassword) {
    var acc = repo.findByEmail(email.toLowerCase())
        .orElseThrow(() -> new RuntimeException("invalid credentials"));
    if (!encoder.matches(rawPassword, acc.getPasswordHash()))
      throw new RuntimeException("invalid credentials");

    // HS256 key
    SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    var now = Instant.now();
    var exp = now.plusSeconds(60L * 60 * 6); // 6h

    return Jwts.builder()
    .setHeaderParam("typ", "JWT")
    .setSubject("admin_" + acc.getId())
    .setIssuer("auth-service")
    .claim("email", acc.getEmail())
    .claim("role", "ADMIN")
    .setIssuedAt(Date.from(now))
    .setExpiration(Date.from(exp))
    .signWith(key)
    .compact();
  }
}
