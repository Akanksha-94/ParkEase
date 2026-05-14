package com.parkease.auth.service;

import com.parkease.auth.config.JwtUtil;
import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.AuthResponse;
import com.parkease.auth.dto.response.UserResponse;
import com.parkease.auth.exception.InvalidCredentialsException;
import com.parkease.auth.exception.UserAlreadyExistsException;
import com.parkease.auth.exception.UserNotFoundException;
import com.parkease.auth.model.Role;
import com.parkease.auth.model.User;
import com.parkease.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ──────────────────────────────────────────────
    //  Registration
    // ──────────────────────────────────────────────

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed - email already in use: {}", request.getEmail());
            throw new UserAlreadyExistsException("Email already in use: " + request.getEmail());
        }

        Role assignedRole = parseRole(request.getRole());

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .phone(request.getPhone())
                .vehiclePlate(request.getVehiclePlate())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getUserId());
        return mapToUserResponse(savedUser);
    }

    // ──────────────────────────────────────────────
    //  Authentication
    // ──────────────────────────────────────────────

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found for: " + request.getEmail()));

        if (!user.isActive()) {
            log.warn("Login blocked - account deactivated: {}", request.getEmail());
            throw new InvalidCredentialsException("Account is deactivated. Please contact support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - invalid credentials for: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());
        log.info("Login successful for userId: {}, role: {}", user.getUserId(), user.getRole());
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public void logout(String token) {
        // Stateless JWT — token blacklisting can be added here (e.g., Redis TTL-based cache).
        log.info("Logout requested (stateless - client discards token)");
    }

    @Override
    public boolean validateToken(String token) {
        boolean valid = jwtUtil.isTokenStructurallyValid(token);
        log.debug("Token validation result: {}", valid);
        return valid;
    }

    @Override
    public AuthResponse refreshToken(String token) {
        log.info("Token refresh requested");
        if (!jwtUtil.isTokenStructurallyValid(token)) {
            log.warn("Token refresh failed - invalid or expired token");
            throw new InvalidCredentialsException("Token is invalid or has expired.");
        }
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        // Verify the user still exists and is active
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User no longer exists."));

        if (!user.isActive()) {
            log.warn("Token refresh denied - account deactivated: {}", email);
            throw new InvalidCredentialsException("Account is deactivated.");
        }

        String newToken = jwtUtil.generateToken(email, role, user.getUserId());
        log.info("Token refreshed for userId: {}", user.getUserId());
        return AuthResponse.builder()
                .token(newToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(email)
                .role(role)
                .build();
    }

    // ──────────────────────────────────────────────
    //  Profile
    // ──────────────────────────────────────────────

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + email));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            // Make sure the new email is not already taken by another user
            if (!request.getEmail().equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmail(request.getEmail())) {
                throw new UserAlreadyExistsException("Email already in use: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getVehiclePlate() != null) {
            user.setVehiclePlate(request.getVehiclePlate());
        }
        if (request.getProfilePicUrl() != null) {
            user.setProfilePicUrl(request.getProfilePicUrl());
        }
        if (request.getRole() != null && !request.getRole().isBlank()) {
            user.setRole(parseRole(request.getRole()));
        }

        User updatedUser = userRepository.save(user);
        log.info("Profile updated for userId: {}", userId);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for userId: {}", userId);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password requested for email: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found for: " + request.getEmail()));

        // Generate a simple UUID token for recovery
        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        // IN PRODUCTION: Send this token via email.
        // FOR DEVELOPMENT: Log it so the user can use it.
        log.info("RECOVERY TOKEN GENERATED for {}: {}", request.getEmail(), token);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Password reset attempt with token: {}", request.getToken());
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired recovery token."));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            log.warn("Password reset failed - token expired for userId: {}", user.getUserId());
            throw new InvalidCredentialsException("Recovery token has expired.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        log.info("Password reset successful for userId: {}", user.getUserId());
    }

    // ──────────────────────────────────────────────
    //  Account Deactivation (soft delete)
    // ──────────────────────────────────────────────

    @Override
    @Transactional
    public void deactivateAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        user.setActive(false);
        userRepository.save(user);
        log.info("Account deactivated for userId: {}", userId);
    }

    // ──────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .vehiclePlate(user.getVehiclePlate())
                .profilePicUrl(user.getProfilePicUrl())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private Role parseRole(String role) {
        if (role == null || role.isBlank()) {
            return Role.DRIVER;
        }
        try {
            return Role.valueOf(role.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException ex) {
            throw new InvalidCredentialsException("Invalid role value: '" + role
                    + "'. Allowed values: DRIVER, MANAGER, ADMIN");
        }
    }
}
