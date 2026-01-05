# Multi-stage build for Spring Boot application

# Stage 1: Build stage
# FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
# For Apple Silicon Macbook
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds, tests run in CI)
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
# FROM eclipse-temurin:17.0.9_9-jre-alpine
# For Apple Silicon Macbook
FROM eclipse-temurin:17-jre

WORKDIR /app

# Create non-root user for security
# RUN addgroup -g 1001 -S spring && \
#     adduser -u 1001 -S spring -G spring

# For Apple Silicon Macbook
RUN groupadd -g 1001 spring && \
    useradd -u 1001 -g spring -s /bin/sh -m spring

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R spring:spring /app

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8083/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

# Optional: JVM tuning for containers
# ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
