# =========================================================================
# Stage 1: Build Environment
# =========================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy pom.xml to cache maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Copy source and build package
COPY src ./src
RUN mvn clean package -DskipTests -q

# =========================================================================
# Stage 2: Runtime Environment
# =========================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-privileged user and group for security hardening
RUN addgroup -S parkease && adduser -S parkease -G parkease
USER parkease

# Copy only the compiled JAR from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# Expose Service Port
EXPOSE 8082

# Optimized JVM flags for containerized environments
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
