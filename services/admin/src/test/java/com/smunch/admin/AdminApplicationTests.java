package com.smunch.admin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
  "spring.datasource.url=jdbc:tc:postgresql:15-alpine:///admin_test",
  "spring.datasource.driver-class-name=org.testcontainers.jdbc.ContainerDatabaseDriver",
  // nuke any leaking env vars
  "spring.datasource.username=",
  "spring.datasource.password="
})
class AdminApplicationTests {
  @Test
  void contextLoads() {}
}



