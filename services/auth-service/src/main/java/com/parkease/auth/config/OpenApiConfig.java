package com.parkease.auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI parkEaseOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("ParkEase Auth Service API")
            .description("Authentication and authorization API for the ParkEase microservices platform.")
            .version("v1")
            .contact(new Contact()
                .name("ParkEase Platform")
                .email("support@parkease.example.com")));
  }
}
