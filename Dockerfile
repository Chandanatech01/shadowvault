# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot Backend
FROM maven:3.9-eclipse-temurin-17 AS backend-builder
WORKDIR /build/backend
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend/src ./src
# Copy built frontend assets into static resources directory
COPY --from=frontend-builder /build/frontend/dist ./src/main/resources/static
RUN mvn clean package -DskipTests -B

# Stage 3: Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S shadowgroup && adduser -S shadowuser -G shadowgroup
RUN mkdir -p /app/data && chown -R shadowuser:shadowgroup /app

COPY --from=backend-builder /build/backend/target/shadowvault-backend-1.0.0.jar /app/shadowvault.jar
RUN chown shadowuser:shadowgroup /app/shadowvault.jar

USER shadowuser
EXPOSE 8080


ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/shadowvault.jar"]
