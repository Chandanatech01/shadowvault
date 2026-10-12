FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src
RUN mvn -f backend/pom.xml clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S shadowgroup && adduser -S shadowuser -G shadowgroup
RUN mkdir -p /app/data && chmod -R 777 /app/data && chown -R shadowuser:shadowgroup /app

COPY --from=builder /app/backend/target/shadowvault-backend-1.0.0.jar /app/shadowvault.jar
RUN chown shadowuser:shadowgroup /app/shadowvault.jar

USER shadowuser
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar /app/shadowvault.jar"]
