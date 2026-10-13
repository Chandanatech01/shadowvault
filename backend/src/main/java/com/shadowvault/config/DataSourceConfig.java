package com.shadowvault.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url:}")
    private String defaultUrl;

    @Value("${spring.datasource.username:root}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Value("${spring.datasource.driverClassName:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = defaultUrl;
        String username = defaultUsername;
        String password = defaultPassword;

        if (System.getenv("DB_PASS") != null && !System.getenv("DB_PASS").isBlank()) {
            password = System.getenv("DB_PASS");
        }
        if (System.getenv("DB_USER") != null && !System.getenv("DB_USER").isBlank()) {
            username = System.getenv("DB_USER");
        }
        if (System.getenv("DB_URL") != null && !System.getenv("DB_URL").isBlank()) {
            dbUrl = System.getenv("DB_URL");
        }

        // Auto-detect cloud environment variables (MYSQL_URL, DATABASE_URL)
        String envUrl = System.getenv("MYSQL_URL");
        if (envUrl == null || envUrl.isBlank()) {
            envUrl = System.getenv("DATABASE_URL");
        }

        if (envUrl != null && !envUrl.isBlank()) {
            try {
                if (envUrl.startsWith("mysql://")) {
                    URI uri = new URI(envUrl);
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        username = parts[0];
                        password = parts[1];
                    }
                    String host = uri.getHost();
                    int port = uri.getPort() != -1 ? uri.getPort() : 3306;
                    String path = uri.getPath();
                    if (path != null && path.startsWith("/")) {
                        path = path.substring(1);
                    }
                    dbUrl = "jdbc:mysql://" + host + ":" + port + "/" + path + "?allowPublicKeyRetrieval=true&useSSL=false";
                } else if (envUrl.startsWith("jdbc:")) {
                    dbUrl = envUrl;
                }
            } catch (Exception e) {
                // Keep defaultUrl fallback
            }
        }

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName(driverClassName);
        return new HikariDataSource(config);
    }
}
