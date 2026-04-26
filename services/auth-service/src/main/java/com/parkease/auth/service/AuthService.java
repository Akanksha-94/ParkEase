package com.parkease.auth.service;

import com.parkease.auth.dto.request.*;
import com.parkease.auth.dto.response.*;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void logout(String token);
    boolean validateToken(String token);
    AuthResponse refreshToken(String token);
    UserResponse getUserByEmail(String email);
    UserResponse getUserById(Long userId);
    UserResponse updateProfile(Long userId, RegisterRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    void deactivateAccount(Long userId);
}
