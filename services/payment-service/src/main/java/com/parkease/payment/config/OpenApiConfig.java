package com.parkease.payment.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_AUTH = "bearerAuth";

    @Bean
    public OpenAPI parkEaseOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ParkEase Payment Service API")
                        .description("API for managing payments in the ParkEase platform.")
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
                                .description("Enter JWT token obtained from Auth Service")));
    }
}
