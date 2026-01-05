# Multi-stage build for Spring Boot application

# Stage 1: Build stage
# FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
# For Apple Sillicon Macbook
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Configure Maven to use Google's Maven Central mirror for better reliability
RUN mkdir -p /root/.m2 && \
    echo '<?xml version="1.0" encoding="UTF-8"?>' > /root/.m2/settings.xml && \
    echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"' >> /root/.m2/settings.xml && \
    echo '          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' >> /root/.m2/settings.xml && \
    echo '          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">' >> /root/.m2/settings.xml && \
    echo '  <mirrors>' >> /root/.m2/settings.xml && \
    echo '    <mirror>' >> /root/.m2/settings.xml && \
    echo '      <id>google-maven-central</id>' >> /root/.m2/settings.xml && \
    echo '      <name>Google Maven Central</name>' >> /root/.m2/settings.xml && \
    echo '      <url>https://maven-central.storage-download.googleapis.com/maven2/</url>' >> /root/.m2/settings.xml && \
    echo '      <mirrorOf>central</mirrorOf>' >> /root/.m2/settings.xml && \
    echo '    </mirror>' >> /root/.m2/settings.xml && \
    echo '  </mirrors>' >> /root/.m2/settings.xml && \
    echo '</settings>' >> /root/.m2/settings.xml

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .

# Download dependencies with retry logic to handle transient network issues
RUN for i in 1 2 3; do \
      echo "Attempt $i to download dependencies..." && \
      mvn dependency:go-offline -B && break || \
      (echo "Download failed, waiting before retry..." && sleep 15); \
    done && \
    echo "Dependencies downloaded successfully"

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds, tests run in CI)
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
# FROM eclipse-temurin:17.0.9_9-jre-alpine
# For Apple Sillicon Macbook
FROM eclipse-temurin:17-jre

WORKDIR /app

# Create non-root user for security
# RUN addgroup -g 1001 -S spring && \
#     adduser -u 1001 -S spring -G spring

# For Apple Sillicon Macbook
RUN groupadd -g 1001 spring && \
    useradd -u 1001 -g spring -s /bin/sh -m spring

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership to non-root user
RUN chown -R spring:spring /app

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8082/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

# Optional: JVM tuning for containers
# ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]