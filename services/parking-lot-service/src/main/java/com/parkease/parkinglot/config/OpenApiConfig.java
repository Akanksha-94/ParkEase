package com.parkease.parkinglot.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration for parking-lot-service.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI parkingLotOpenAPI() {
        final String schemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("ParkEase — Parking Lot Service API")
                        .description("REST API for managing parking lot facilities: CRUD, geo-proximity search, admin approval, and spot counters.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ParkEase Team")
                                .email("support@parkease.com")))
                .addSecurityItem(new SecurityRequirement().addList(schemeName))
                .components(new Components()
                        .addSecuritySchemes(schemeName, new SecurityScheme()
                                .name(schemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Paste a valid JWT issued by auth-service")));
    }
}
