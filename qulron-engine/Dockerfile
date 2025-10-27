# Build Stage
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /build

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

#################################
# Runtime stage
FROM eclipse-temurin:21-jre

# Set work directory
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /build/target/qulron-engine-1.0.0.jar app.jar

# Expose port (just documentation)
EXPOSE 30060

#ENV JAR_VERSION=${APP_VERSION}

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]