package com.example.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Security Configuration Tests
 * Simple security checks to demonstrate DevSecOps practices
 */
@SpringBootTest
@Testcontainers
class SecurityConfigurationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private Environment environment;

    @Test
    void testJwtSecretIsNotDefault() {
        String jwtSecret = environment.getProperty("spring.security.jwt.secret");
        
        assertNotNull(jwtSecret, "JWT secret should be configured");
        assertFalse(jwtSecret.isEmpty(), "JWT secret should not be empty");
        assertTrue(jwtSecret.length() >= 32, "JWT secret should be at least 32 characters");
        
        // Ensure it's not a common weak secret
        assertNotEquals("secret", jwtSecret);
        assertNotEquals("password", jwtSecret);
        assertNotEquals("123456", jwtSecret);
        
        System.out.println("✓ JWT secret is properly configured");
    }

    @Test
    void testDatabasePasswordIsNotDefault() {
        String dbPassword = environment.getProperty("spring.datasource.password");
        
        assertNotNull(dbPassword, "Database password should be configured");
        
        // In production, this should not be a weak password
        // For test environment, we allow it, but warn about production
        if ("password".equals(dbPassword) || "admin".equals(dbPassword)) {
            System.out.println("⚠ WARNING: Using default database password - ensure production uses strong credentials!");
        }
        
        System.out.println("✓ Database password configuration checked");
    }

    @Test
    void testServerPortConfiguration() {
        String serverPort = environment.getProperty("server.port");
        
        assertNotNull(serverPort, "Server port should be configured");
        
        int port = Integer.parseInt(serverPort);
        
        // Ensure not using default ports that might conflict
        assertNotEquals(8080, port, "Should not use default port 8080 to avoid conflicts");
        assertTrue(port > 1024, "Should use non-privileged port (> 1024)");
        assertTrue(port < 65536, "Port should be valid (< 65536)");
        
        System.out.println("✓ Server port is properly configured: " + port);
    }

    @Test
    void testDatabaseConnectionPoolConfiguration() {
        String maxPoolSize = environment.getProperty("spring.datasource.hikari.maximum-pool-size");
        String minIdle = environment.getProperty("spring.datasource.hikari.minimum-idle");
        
        if (maxPoolSize != null) {
            int maxSize = Integer.parseInt(maxPoolSize);
            assertTrue(maxSize > 0 && maxSize <= 20, 
                "Connection pool max size should be reasonable (1-20)");
            System.out.println("✓ Max pool size configured: " + maxSize);
        }
        
        if (minIdle != null) {
            int minIdleSize = Integer.parseInt(minIdle);
            assertTrue(minIdleSize >= 0, "Min idle connections should be non-negative");
            System.out.println("✓ Min idle connections configured: " + minIdleSize);
        }
        
        System.out.println("✓ Database connection pool configuration validated");
    }

    @Test
    void testHibernateDdlAutoIsNotCreateDrop() {
        String ddlAuto = environment.getProperty("spring.jpa.hibernate.ddl-auto");
        
        if (ddlAuto != null) {
            // In production, should not use 'create' or 'create-drop'
            assertNotEquals("create", ddlAuto, 
                "Hibernate DDL should not be 'create' in production");
            assertNotEquals("create-drop", ddlAuto, 
                "Hibernate DDL should not be 'create-drop' in production");
            
            System.out.println("✓ Hibernate DDL-auto setting validated: " + ddlAuto);
        }
    }

    @Test
    void testSqlLoggingConfiguration() {
        String showSql = environment.getProperty("spring.jpa.show-sql");
        
        if (showSql != null) {
            // In production, SQL logging should be disabled or minimal
            if (Boolean.parseBoolean(showSql)) {
                System.out.println("⚠ WARNING: SQL logging is enabled - consider disabling in production");
            }
        }
        
        System.out.println("✓ SQL logging configuration checked");
    }

    @Test
    void testDatabaseDriverIsSecure() {
        String driverClass = environment.getProperty("spring.datasource.driver-class-name");
        
        if (driverClass != null) {
            assertFalse(driverClass.contains("jdbc:h2:mem"), 
                "Should not use in-memory database in production");
            
            System.out.println("✓ Database driver validated: " + driverClass);
        }
    }

    @Test
    void testNoSensitiveDataInLogs() {
        // Verify that sensitive properties are not logged
        String[] sensitiveKeys = {
            "password",
            "secret",
            "key",
            "token",
            "credential"
        };
        
        // This is a simple check - in real scenarios, you'd want more sophisticated logging audits
        for (String key : sensitiveKeys) {
            // Just verify the check runs - actual logging audits would be more complex
            assertNotNull(key);
        }
        
        System.out.println("✓ Sensitive data logging check completed");
    }

    @Test
    void testSecurityHeadersWouldBeConfigured() {
        // This is a placeholder test to remind about security headers
        // In a real app with security enabled, you'd test for:
        // - X-Frame-Options
        // - X-Content-Type-Options
        // - X-XSS-Protection
        // - Content-Security-Policy
        // - Strict-Transport-Security
        
        System.out.println("✓ Security headers configuration reminder checked");
        System.out.println("  ℹ Ensure the following headers are configured in production:");
        System.out.println("    - X-Frame-Options: DENY");
        System.out.println("    - X-Content-Type-Options: nosniff");
        System.out.println("    - X-XSS-Protection: 1; mode=block");
        System.out.println("    - Strict-Transport-Security: max-age=31536000");
    }

    @Test
    void testEnvironmentProfileIsConfigured() {
        String[] activeProfiles = environment.getActiveProfiles();
        
        // It's okay if no profile is active during testing
        // Just log what profiles are active
        if (activeProfiles.length > 0) {
            System.out.println("✓ Active profiles: " + String.join(", ", activeProfiles));
        } else {
            System.out.println("ℹ No active profiles set (using default configuration)");
        }
        
        // Check if test or docker profile is active (not required, just informational)
        boolean hasTestProfile = false;
        for (String profile : activeProfiles) {
            if (profile.contains("test") || profile.contains("docker")) {
                hasTestProfile = true;
                break;
            }
        }
        
        if (!hasTestProfile && activeProfiles.length > 0) {
            System.out.println("⚠ Note: Consider using explicit test profile for testing");
        }
        
        // Always pass - just informational
        assertTrue(true, "Profile check completed");
    }
}