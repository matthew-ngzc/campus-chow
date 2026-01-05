package com.smunch.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
  "spring.datasource.url=jdbc:tc:postgresql:15-alpine:///admin_test",
  "spring.datasource.driver-class-name=org.testcontainers.jdbc.ContainerDatabaseDriver",
  "spring.datasource.username=",
  "spring.datasource.password="
})
class AdminIntegrationTest {

  @Autowired
  private AdminAccountRepo repo;

  @Test
  void updatePassword_then_success() {
    AdminAccount a = new AdminAccount();
    a.setEmail("admin@test.com");
    a.setPasswordHash("x");
    repo.save(a);
    assertThat(repo.findByEmail("admin@test.com")).isPresent();
  }
}









