package com.smunch.admin;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class HealthController {
  @GetMapping("/api/admin/health")
  public Map<String, Object> health() {
    return Map.of("status", "ok", "service", "admin");
  }
}
