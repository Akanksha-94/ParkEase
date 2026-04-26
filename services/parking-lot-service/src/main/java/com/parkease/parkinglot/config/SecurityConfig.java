package com.parkease.parkinglot.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for parking-lot-service.
 *
 * <p>Access rules:
 * <ul>
 *   <li>Public  — GET /api/v1/lots (list), GET /api/v1/lots/{id}, GET /api/v1/lots/nearby, GET /api/v1/lots/search</li>
 *   <li>MANAGER — POST /api/v1/lots (create), PUT (update/toggle), DELETE</li>
 *   <li>ADMIN   — PUT /api/v1/lots/{id}/approve</li>
 *   <li>Internal — PUT /api/v1/lots/{id}/decrement|increment (service-to-service, ADMIN or MANAGER)</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ── Swagger / OpenAPI ─────────────────────────────────────────
                .requestMatchers(
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/api-docs/**",
                        "/v3/api-docs/**"
                ).permitAll()

                // ── Public read-only lot endpoints ────────────────────────────
                .requestMatchers(HttpMethod.GET,
                        "/api/v1/lots",
                        "/api/v1/lots/{id}",
                        "/api/v1/lots/city/**",
                        "/api/v1/lots/nearby",
                        "/api/v1/lots/search"
                ).permitAll()

                // ── Admin-only: approve lot ───────────────────────────────────
                .requestMatchers(HttpMethod.PUT, "/api/v1/lots/*/approve").hasRole("ADMIN")

                // ── Manager or Admin: create, update, toggle, delete ──────────
                .requestMatchers(HttpMethod.POST, "/api/v1/lots").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT,  "/api/v1/lots/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE,"/api/v1/lots/**").hasAnyRole("MANAGER", "ADMIN")

                // ── Internal service-to-service: spot counters ─────────────
                .requestMatchers("/api/v1/lots/*/decrement",
                                 "/api/v1/lots/*/increment").hasAnyRole("ADMIN", "MANAGER")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
