package com.parkease.auth.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration.
 * Registers Bearer JWT as the global security scheme so the "Authorize" button
 * in Swagger UI works for protected endpoints.
 */
@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI parkEaseOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ParkEase Auth Service API")
                        .description("Authentication and authorization API for the ParkEase microservices platform.")
                        .version("v1")
                        .contact(new Contact()
                                .name("ParkEase Platform")
                                .email("support@parkease.example.com")))
                .components(new Components()
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token obtained from POST /api/v1/auth/login")));
    }
}
