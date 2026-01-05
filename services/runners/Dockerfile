FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Download dependencies
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN mvn dependency:go-offline 

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar ./app.jar

EXPOSE 8088

ENTRYPOINT ["java", "-jar", "app.jar"]