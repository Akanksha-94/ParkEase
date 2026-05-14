package com.parkease.auth.repository;

import com.parkease.auth.model.Role;
import com.parkease.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetToken(String token);

    Optional<User> findByUserId(Long userId);

    List<User> findAllByRole(Role role);

    Optional<User> findByVehiclePlate(String vehiclePlate);

    Optional<User> findByPhone(String phone);

    void deleteByUserId(Long userId);
}
