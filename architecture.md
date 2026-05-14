# Microservices Architecture Blueprint Prompt

> **Usage**: Copy everything below the line and paste it as your first message in a new conversation. Replace the placeholder values (`[PROJECT_NAME]`, service names, etc.) with your actual project details.

---

## ✂️ COPY FROM HERE ✂️

---

I want you to build a **production-grade Java microservices backend** for a project called **[PROJECT_NAME]**. Follow this exact architecture, technology stack, and design patterns precisely. Do NOT deviate.

## Technology Stack (Mandatory — No Substitutions)

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 21 |
| Framework | Spring Boot | 3.2.4 |
| Cloud | Spring Cloud | 2023.0.0 |
| Gateway | Spring Cloud Gateway (Reactive, WebFlux-based) | — |
| Discovery | Netflix Eureka (Server + Client) | — |
| Security | Spring Security + JJWT (io.jsonwebtoken) | jjwt 0.12.3 |
| Database | MySQL | 8.x |
| ORM | Spring Data JPA + Hibernate | — |
| Migrations | Flyway | — |
| Mapping | MapStruct | 1.5.5.Final |
| Build | Maven (individual pom.xml per module, NO parent aggregator POM) | — |
| Utility | Lombok | — |
| Serialization | Jackson (ISO-8601 dates, no timestamps) | — |

## Project Directory Structure

```
[PROJECT_NAME]/
├── discovery-server/          # Eureka Server (port 8761)
├── api-gateway/               # Spring Cloud Gateway (port 8080)
├── services/
│   ├── auth-service/          # Authentication & User management (port 8081)
│   ├── [service-1]/           # (port 8082)
│   ├── [service-2]/           # (port 8083)
│   ├── [service-3]/           # (port 8084)
│   ├── [service-4]/           # (port 8085)
│   ├── [service-5]/           # (port 8086)
│   └── [service-6]/           # (port 8087)
└── scripts/
    ├── build-all.sh
    ├── start-all.sh
    ├── stop-all.sh
    └── clean-all.sh
```

Each service is a **standalone Spring Boot application** with its own `pom.xml`. There is NO parent aggregator POM. Each module is built independently.

---

## Module 1: Discovery Server (`discovery-server/`)

### Purpose
Netflix Eureka Server for service registration and discovery.

### Implementation
- **Port**: 8761
- **Main Class**: Annotated with `@SpringBootApplication` and `@EnableEurekaServer`
- **`application.properties`**:
  ```properties
  server.port=8761
  spring.application.name=discovery-server
  eureka.client.register-with-eureka=false
  eureka.client.fetch-registry=false
  logging.level.com.[groupId]=INFO
  ```
- **POM Dependencies**: Only `spring-cloud-starter-netflix-eureka-server` and `spring-boot-starter-test`.
- **Spring Cloud BOM** managed via `<dependencyManagement>` with version `2023.0.0`.

---

## Module 2: API Gateway (`api-gateway/`)

### Purpose
Single entry point for ALL frontend/client requests. Handles JWT authentication centrally, CORS, and route-based forwarding.

### Critical Design Rules
1. This is a **Spring Cloud Gateway (reactive/WebFlux)** project. It does NOT use `spring-boot-starter-web`.
2. JWT validation happens ONLY here. Downstream services NEVER validate JWTs.
3. After validating a JWT, the gateway injects these headers into the downstream request:
   - `X-User-Name` (email/username from JWT subject)
   - `X-User-Roles` (role claim from JWT)
   - `X-User-Id` (userId claim from JWT)
   - `X-Internal-Gateway-Secret` (a hardcoded secret string like `"[PROJECT_NAME]Gateway2024"` to prove the request came from the gateway)
4. The gateway **strips** any incoming `X-Internal-Gateway-Secret` header from clients to prevent spoofing.

### POM Dependencies
- `spring-cloud-starter-gateway` (reactive gateway)
- `spring-cloud-starter-netflix-eureka-client`
- `jjwt-api`, `jjwt-impl` (runtime), `jjwt-jackson` (runtime) — version `0.12.3`
- `lombok`
- `spring-boot-starter-json` (Jackson)
- `spring-boot-starter-actuator`
- `spring-boot-starter-test`
- Spring Cloud BOM `2023.0.0` in `<dependencyManagement>`

### Configuration (`application.yml`)
```yaml
server:
  port: ${GATEWAY_PORT:8080}

spring:
  application:
    name: api-gateway
  main:
    banner-mode: off
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:4200,http://localhost:5173}
            allowed-methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
            allowed-headers: "*"
            allow-credentials: false
            max-age: 3600
      routes:
        # Public routes (NO AuthenticationFilter)
        - id: auth-service-public
          uri: lb://auth-service
          predicates:
            - Path=/api/v1/auth/login,/api/v1/auth/register
          filters:
            - StripPrefix=2
          metadata:
            response-timeout: 5000
        # Secured auth routes
        - id: auth-service-secured
          uri: lb://auth-service
          predicates:
            - Path=/api/v1/auth/**
          filters:
            - name: AuthenticationFilter
            - StripPrefix=2
        # For each downstream service, follow this pattern:
        - id: [service-name]
          uri: lb://[service-name]
          predicates:
            - Path=/api/v1/[resource-path]/**
          filters:
            - name: AuthenticationFilter
            - StripPrefix=2

eureka:
  client:
    serviceUrl:
      defaultZone: ${EUREKA_SERVER:http://localhost:8761/eureka/}
  instance:
    prefer-ip-address: false
    hostname: localhost

jwt:
  secret: ${JWT_SECRET:4f6b6a6c6d6e6f707172737475767778797a3132333435363738393061626364}
```

**Key**: `StripPrefix=2` removes `/api/v1` so downstream services receive requests at their own root path (e.g., `/products/**`).

### Java Classes

#### `JwtUtil.java` (in `util/` package)
```java
@Slf4j
@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String jwtSecret;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(signingKey()).build()
                .parseSignedClaims(token).getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (JwtException ex) {
            log.debug("Token validation failed: {}", ex.getMessage());
            return false;
        }
    }
}
```

#### `AuthenticationFilter.java` (in `filter/` package)
- Extends `AbstractGatewayFilterFactory<AuthenticationFilter.Config>` (this is critical for Spring Cloud Gateway YAML integration).
- Has an empty static inner `Config` class.
- In the `apply()` method:
  1. Allow OPTIONS requests (CORS preflight).
  2. Strip any client-supplied `X-Internal-Gateway-Secret` header.
  3. Extract `Authorization: Bearer <token>` header. If missing → return structured JSON 401.
  4. Validate token via `JwtUtil`. If invalid → return structured JSON 401.
  5. Extract claims (`sub`, `role`, `userId`) and inject `X-User-Name`, `X-User-Roles`, `X-User-Id`, `X-Internal-Gateway-Secret` headers.
  6. Rejection responses are structured JSON: `{ "status": 401, "message": "...", "timestamp": "...", "path": "..." }`

---

## Module 3: Auth Service (`services/auth-service/`)

### Purpose
Handles user registration, login (JWT generation), profile management, and user administration.

### Key Design
- This is the ONLY service that has `jjwt` dependencies (for token generation).
- Uses BCrypt for password hashing.
- JWT claims include: `sub` (email), `role`, `userId`.
- User entity fields: `userId`, `fullName`, `email`, `passwordHash`, `phone`, `role` (enum), `department`, `isActive`, `createdAt`, `lastLoginAt`.
- Role enum values: `STAFF`, `MANAGER`, `OFFICER`, `ADMIN` (adapt to your domain).

### REST Endpoints (all prefixed with `/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |
| POST | `/auth/logout` | Required | Invalidate session |
| POST | `/auth/refresh` | Required | Get new JWT |
| GET | `/auth/profile/{userId}` | Required | Get user profile |
| PUT | `/auth/profile/{userId}` | Required | Update profile |
| PUT | `/auth/password/{userId}` | Required | Change password |
| PUT | `/auth/deactivate/{userId}` | ADMIN | Soft-delete user |
| GET | `/auth/users` | ADMIN/MANAGER | List all users |

---

## Downstream Service Template (applies to ALL services except auth-service)

Every downstream service follows this EXACT pattern:

### POM Dependencies (NO jjwt dependencies)
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `mysql-connector-j` (runtime)
- `lombok`
- `flyway-core`, `flyway-mysql`
- `spring-boot-starter-actuator`
- `spring-cloud-starter-netflix-eureka-client`
- `spring-boot-starter-test`, `spring-security-test`, `h2` (test)
- `mapstruct` + `mapstruct-processor` (annotation processor alongside lombok)
- Spring Cloud BOM `2023.0.0`

### `application.properties` (Base)
```properties
spring.config.import=optional:file:.env[.properties],optional:file:services/[service-name]/.env[.properties]
spring.application.name=${APP_NAME:[service-name]}
server.port=${SERVER_PORT:[port]}
spring.profiles.active=${SPRING_PROFILES_ACTIVE:dev}

# Eureka Discovery
eureka.client.serviceUrl.defaultZone=${EUREKA_SERVER:http://localhost:8761/eureka/}
eureka.instance.prefer-ip-address=false
eureka.instance.hostname=localhost

# JPA / Hibernate
spring.jpa.properties.hibernate.format_sql=${JPA_FORMAT_SQL:true}
spring.jpa.open-in-view=false

# Flyway
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true

# Jackson — ISO-8601 dates
spring.jackson.serialization.write-dates-as-timestamps=false

# Error Handling
spring.mvc.throw-exception-if-no-handler-found=true
spring.web.resources.add-mappings=false
spring.main.banner-mode=off
```

### `application-dev.properties` (Dev Profile)
```properties
spring.datasource.url=${LOCAL_DB_URL}
spring.datasource.username=${LOCAL_DB_USERNAME}
spring.datasource.password=${LOCAL_DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=${LOCAL_JPA_SHOW_SQL:false}
spring.flyway.clean-disabled=false
spring.flyway.out-of-order=false
```

### `.env` File (per service)
```properties
APP_NAME=[service-name]
SERVER_PORT=[port]
LOCAL_DB_URL=jdbc:mysql://localhost:3306/[db_name]?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
LOCAL_DB_USERNAME=root
LOCAL_DB_PASSWORD=
LOCAL_JPA_SHOW_SQL=false
```

### Security Classes (COPY INTO EVERY DOWNSTREAM SERVICE)

#### `InternalSecurityFilter.java` (in `config/` package)
- Extends `OncePerRequestFilter` (Jakarta Servlet filter).
- Checks `X-Internal-Gateway-Secret` header against expected secret (`"[PROJECT_NAME]Gateway2024"`).
- If secret is missing/wrong → return structured JSON 401 response.
- If valid → extract `X-User-Name` and `X-User-Roles` headers, reconstruct Spring Security context with `UsernamePasswordAuthenticationToken` and `SimpleGrantedAuthority` (prefixed with `ROLE_`).
- Skip `/actuator/**` paths.

#### `SecurityConfig.java` (in `config/` package)
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final InternalSecurityFilter internalSecurityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(internalSecurityFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### Common Classes (COPY INTO EVERY SERVICE)

#### `ApiResponse<T>` (in `common/response/` package)
A unified response wrapper used by ALL endpoints:
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private int status;
    private String message;
    private T data;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(int status, String message, T data) { ... }
    public static <T> ApiResponse<T> success(String message, T data) { return success(200, message, data); }
    public static <T> ApiResponse<T> error(int status, String message) { ... }
}
```

#### `CustomException.java` (in `exception/` package)
```java
@Getter
public class CustomException extends RuntimeException {
    private final HttpStatus status;
    public CustomException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
```

#### `GlobalExceptionHandler.java` (in `exception/` package)
Handles: `CustomException`, `MethodArgumentNotValidException`, `DataIntegrityViolationException`, and generic `Exception`. All return `ApiResponse<Void>`.

### Package Structure (per service)
```
com.[groupId].[service]/
├── config/
│   ├── InternalSecurityFilter.java
│   └── SecurityConfig.java
├── common/
│   └── response/
│       └── ApiResponse.java
├── controller/
│   └── [Domain]Controller.java      # or [Domain]Resource.java
├── dto/
│   ├── request/
│   │   └── [Domain]Request.java
│   └── response/
│       └── [Domain]Response.java
├── entity/
│   └── [Domain].java
├── exception/
│   ├── CustomException.java
│   └── GlobalExceptionHandler.java
├── mapper/
│   └── [Domain]Mapper.java           # MapStruct interface
├── repository/
│   └── [Domain]Repository.java       # Spring Data JPA
├── service/
│   └── [Domain]Service.java
└── [ServiceName]Application.java     # @SpringBootApplication
```

### Controller Pattern
- Annotated with `@RestController` and `@RequestMapping("/[resource]")`.
- All methods return `ResponseEntity<ApiResponse<T>>`.
- Use `@Validated` with `ValidationGroups` for create vs. update validation.
- Use `@PreAuthorize("hasRole('ADMIN')")` for role-restricted endpoints.
- The request header `X-User-Name` can be accessed via `@RequestHeader("X-User-Name") String username` when needed.

### Flyway Migrations
- Located at `src/main/resources/db/migration/`.
- Named: `V1__create_[table]_table.sql`, `V2__seed_[table]_data.sql`, etc.
- Hibernate `ddl-auto=none` — Flyway owns the schema.

---

## Inter-Service Communication

When one service needs data from another (e.g., purchase-service needs product names from product-service), use **`RestTemplate`** or **`WebClient`** calling the other service via its Eureka-registered name: `http://[service-name]/[endpoint]`. The calling service must forward the gateway headers (`X-Internal-Gateway-Secret`, `X-User-Name`, `X-User-Roles`).

---

## Build & Lifecycle Scripts (`scripts/`)

Create these 4 bash scripts:

- **`build-all.sh`**: Iterates over `discovery-server`, `api-gateway`, and every service in `services/`, running `mvn clean package -DskipTests -q` in each.
- **`start-all.sh`**: Starts discovery-server first (with a sleep for registration), then api-gateway, then all services. Runs each as a background process with `java -jar target/*.jar &`. Writes PIDs to a `.pids` file.
- **`stop-all.sh`**: Reads `.pids` file and kills all processes.
- **`clean-all.sh`**: Runs `mvn clean -q` in all modules.

---

## My Services

Here are the specific services I need you to create for **[PROJECT_NAME]**:

| # | Service Name | Port | Resource Path | Description |
|---|---|---|---|---|
| 1 | auth-service | 8081 | `/auth` | User registration, login, JWT generation |
| 2 | [service-name] | 8082 | `/[resource]` | [Description] |
| 3 | [service-name] | 8083 | `/[resource]` | [Description] |
| 4 | [service-name] | 8084 | `/[resource]` | [Description] |
| ... | ... | ... | ... | ... |

### Entity Definitions

For each service, here are the entities and their fields:

#### [Service 1] — `[EntityName]`
| Field | Type | Constraints |
|---|---|---|
| `id` | Integer (PK, auto) | — |
| `name` | String | @NotBlank |
| ... | ... | ... |

*(Repeat for each service and entity)*

### Endpoint Definitions

For each service, here are the REST endpoints:

#### [Service 1]
| Method | Path | Auth/Role | Description |
|---|---|---|---|
| GET | `/[resource]` | Authenticated | List all |
| GET | `/[resource]/{id}` | Authenticated | Get by ID |
| POST | `/[resource]` | ADMIN/MANAGER | Create |
| PUT | `/[resource]/{id}` | ADMIN/MANAGER | Update |
| DELETE | `/[resource]/{id}` | ADMIN | Delete |

*(Repeat for each service)*

---

## Build Order

1. `discovery-server` first
2. `api-gateway` second
3. `services/auth-service` third
4. All other services in any order

## Database Setup

Each service has its own MySQL database:
- `auth-service` → `[project]_auth_db`
- `[service-1]` → `[project]_[service1]_db`
- etc.

Create each database manually or via a script: `CREATE DATABASE [db_name];`

---

**Start building. Create each module one by one in the order specified above. For each module, create the complete `pom.xml`, all Java source files, `application.properties`/`application.yml`, `.env`, and Flyway migrations. Make sure everything compiles with `mvn clean package -DskipTests`.**

---

## ✂️ END COPY ✂️

