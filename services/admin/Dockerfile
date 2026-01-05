# ===== Build stage =====
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -e -DskipTests package

# ===== Runtime stage =====
FROM eclipse-temurin:17-jre
WORKDIR /app
ENV JAVA_OPTS=""
# Ports: using 8086 per your map
EXPOSE 8086
# copy jar
COPY --from=build /app/target/*.jar /app/app.jar
# healthcheck (optional)
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD curl -fsS http://localhost:8086/health || exit 1
# run
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
