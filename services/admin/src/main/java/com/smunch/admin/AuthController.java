package com.smunch.admin;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService auth;

  @PostMapping("/register") // consider restricting or seeding for prod
  public ResponseEntity<?> register(@RequestBody RegisterReq req) {
    auth.register(req.email, req.password);
    return ResponseEntity.status(201).build();
  }

  @PostMapping("/login")
  public TokenRes login(@RequestBody LoginReq req) {
    String token = auth.login(req.email, req.password);
    return new TokenRes(token);
  }

  @Data static class RegisterReq { public String email; public String password; }
  @Data static class LoginReq { public String email; public String password; }
  @Data static class TokenRes { public final String accessToken; }
}
