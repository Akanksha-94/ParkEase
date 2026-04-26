package com.parkease.auth.service;

import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.*;
import com.parkease.auth.exception.*;
import com.parkease.auth.model.Role;
import com.parkease.auth.model.User;
import com.parkease.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.parkease.auth.config.JwtUtil;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already in use");
        }

        Role assignedRole = parseRole(request.getRole());

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .build();
        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public void logout(String token) {
        // Token blacklisting can be implemented here if required.
    }

    @Override
    public boolean validateToken(String token) {
        return jwtUtil.isTokenStructurallyValid(token);
    }

    @Override
    public AuthResponse refreshToken(String token) {
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);
        String newToken = jwtUtil.generateToken(email, role);
        return AuthResponse.builder()
                .token(newToken)
                .email(email)
                .role(role)
                .build();
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse updateProfile(UUID userId, RegisterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (request.getEmail() != null)
            user.setEmail(request.getEmail());
        if (request.getRole() != null)
            user.setRole(parseRole(request.getRole()));

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public void deactivateAccount(UUID userId) {
        userRepository.deleteById(userId);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole().name())
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
            throw new InvalidCredentialsException("Invalid role: " + role);
        }
    }
}
