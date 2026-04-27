package com.parkease.auth.service;

import com.parkease.auth.config.JwtUtil;
import com.parkease.auth.dto.request.ChangePasswordRequest;
import com.parkease.auth.dto.request.LoginRequest;
import com.parkease.auth.dto.request.RegisterRequest;
import com.parkease.auth.dto.request.UpdateProfileRequest;
import com.parkease.auth.dto.response.AuthResponse;
import com.parkease.auth.dto.response.UserResponse;
import com.parkease.auth.exception.InvalidCredentialsException;
import com.parkease.auth.exception.UserAlreadyExistsException;
import com.parkease.auth.exception.UserNotFoundException;
import com.parkease.auth.model.Role;
import com.parkease.auth.model.User;
import com.parkease.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
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
        if (userRepository.existsByEmail(request.getEmail())) {
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
        return mapToUserResponse(savedUser);
    }

    // ──────────────────────────────────────────────
    //  Authentication
    // ──────────────────────────────────────────────

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found for: " + request.getEmail()));

        if (!user.isActive()) {
            throw new InvalidCredentialsException("Account is deactivated. Please contact support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
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
        // For now this is a no-op; the client simply discards the token.
    }

    @Override
    public boolean validateToken(String token) {
        return jwtUtil.isTokenStructurallyValid(token);
    }

    @Override
    public AuthResponse refreshToken(String token) {
        if (!jwtUtil.isTokenStructurallyValid(token)) {
            throw new InvalidCredentialsException("Token is invalid or has expired.");
        }
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        // Verify the user still exists and is active
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User no longer exists."));

        if (!user.isActive()) {
            throw new InvalidCredentialsException("Account is deactivated.");
        }

        String newToken = jwtUtil.generateToken(email, role);
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
    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
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
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ──────────────────────────────────────────────
    //  Account Deactivation (soft delete)
    // ──────────────────────────────────────────────

    @Override
    @Transactional
    public void deactivateAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));
        user.setActive(false);
        userRepository.save(user);
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
