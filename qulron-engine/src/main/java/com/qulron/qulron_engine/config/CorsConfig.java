package com.qulron.qulron_engine.config;

import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// CORS (Cross-Origin Resource Sharing) rules for your application.
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    // This allows modifying Spring MVC settings
    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**") // allowed api calls
                        .allowedMethods("GET", "POST", "PUT", "DELETE") // allowed methods to be called
                        .allowedOrigins(allowedOrigins) // allowed links to call
                        // the api
                        .allowCredentials(true) // ✅ Required when using `withCredentials: true`
                        .allowedHeaders("Authorization", "Content-Type")
                        .maxAge(3600);
            }
        };
    }
}
