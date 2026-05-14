package com.parkease.gateway.filter;

import com.parkease.gateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

/**
 * Gateway-level JWT authentication filter.
 * Validates Bearer token, then injects identity headers for downstream services.
 *
 * Injected headers:
 *   X-User-Name            – JWT subject (email)
 *   X-User-Roles           – role claim from token
 *   X-User-Id              – userId claim from token
 *   X-Internal-Gateway-Secret – shared secret proving request came from gateway
 */
@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private static final String INTERNAL_SECRET = "ParkEaseGateway2024";
    private static final String BEARER_PREFIX   = "Bearer ";

    private final JwtUtil jwtUtil;

    public AuthenticationFilter(JwtUtil jwtUtil) {
        super(Config.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {

            ServerHttpRequest request = exchange.getRequest();

            // ── 1. Allow CORS preflight through without auth ─────────────────
            if ("OPTIONS".equalsIgnoreCase(request.getMethod().name())) {
                return chain.filter(exchange);
            }

            // ── 2. Strip any client-supplied gateway secret (anti-spoofing) ──
            ServerHttpRequest mutated = request.mutate()
                    .headers(h -> h.remove("X-Internal-Gateway-Secret"))
                    .build();

            // ── 3. Extract Authorization header ──────────────────────────────
            String authHeader = mutated.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                return reject(exchange, "Missing or malformed Authorization header");
            }

            String token = authHeader.substring(BEARER_PREFIX.length()).trim();

            // ── 4. Validate token ─────────────────────────────────────────────
            if (!jwtUtil.isTokenValid(token)) {
                return reject(exchange, "Token is invalid or has expired");
            }

            // ── 5. Extract claims and forward identity headers ─────────────
            try {
                Claims claims  = jwtUtil.extractAllClaims(token);
                String subject = claims.getSubject();                           // email
                String role    = claims.get("role",   String.class);
                String userId  = claims.get("userId", String.class);

                ServerHttpRequest enriched = mutated.mutate()
                        .header("X-User-Name",             subject)
                        .header("X-User-Roles",            role != null ? role : "")
                        .header("X-User-Id",               userId != null ? userId : "")
                        .header("X-Internal-Gateway-Secret", INTERNAL_SECRET)
                        .build();

                log.debug("Authenticated request from {} [role={}] → {}", subject, role, request.getPath());
                return chain.filter(exchange.mutate().request(enriched).build());

            } catch (Exception ex) {
                log.warn("Failed to read JWT claims: {}", ex.getMessage());
                return reject(exchange, "Invalid token claims");
            }
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Mono<Void> reject(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String path = exchange.getRequest().getPath().value();
        String body = String.format(
                "{\"status\":401,\"message\":\"%s\",\"timestamp\":\"%s\",\"path\":\"%s\"}",
                message, Instant.now(), path);

        byte[]     bytes  = body.getBytes(StandardCharsets.UTF_8);
        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    /** Empty config class required by AbstractGatewayFilterFactory */
    public static class Config { }
}
