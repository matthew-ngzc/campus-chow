// com/smunch/admin/AdminController.java
package com.smunch.admin;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final AdminAccountRepo repo;
  private final PasswordEncoder encoder;

  public AdminController(AdminAccountRepo repo, PasswordEncoder encoder) {
    this.repo = repo;
    this.encoder = encoder;
  }

  private String meEmail() {
    return (String) SecurityContextHolder.getContext()
        .getAuthentication().getPrincipal(); // set by JwtAuthFilter
  }
  private AdminAccount requireMe() {
    return repo.findByEmail(meEmail())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "admin not found"));
  }

  @GetMapping("/me")
  public Map<String, Object> me() {
    String email = meEmail();
    return Map.of("name", email.split("@")[0], "email", email, "role", "ADMIN");
  }

  //Update Email (needs current password)
  record UpdateEmailBody(String currentPassword, String newEmail) {}
  @PatchMapping("/account/email")
  public Map<String, Object> updateEmail(@RequestBody UpdateEmailBody body) {
    if (body == null || body.currentPassword() == null || body.newEmail() == null)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currentPassword and newEmail required");

    AdminAccount me = requireMe();
    if (!encoder.matches(body.currentPassword(), me.getPasswordHash()))
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "current password is wrong");

    String next = body.newEmail().trim().toLowerCase();
    if (next.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid email");
    if (!me.getEmail().equalsIgnoreCase(next) && repo.existsByEmail(next))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "email already in use");

    me.setEmail(next);
    repo.save(me);

    // FE should logout & re-login so JWT subject matches new email
    return Map.of("email", next, "message", "email updated; please sign in again");
  }

  //Update Password (needs current password)
  record UpdatePasswordBody(String currentPassword, String newPassword) {}
  @PatchMapping("/account/password")
  public Map<String, String> updatePassword(@RequestBody UpdatePasswordBody body) {
    if (body == null || body.currentPassword() == null || body.newPassword() == null)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currentPassword and newPassword required");
    if (body.newPassword().length() < 8)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password must be at least 8 chars");

    AdminAccount me = requireMe();
    if (!encoder.matches(body.currentPassword(), me.getPasswordHash()))
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "current password is wrong");
    if (encoder.matches(body.newPassword(), me.getPasswordHash()))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "new password same as old");

    me.setPasswordHash(encoder.encode(body.newPassword()));
    repo.save(me);

    return Map.of("message", "password updated");
  }
}
