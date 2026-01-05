package com.smunch.admin;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;

@TestConfiguration
public class PgTestcontainersConfig {

  @Bean
  @ServiceConnection // wires spring.datasource.* automatically for the test context
  PostgreSQLContainer<?> postgres() {
    return new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("smunch_admin_test")
        .withUsername("postgres")
        .withPassword("password");
  }
}







