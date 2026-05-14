package com.parkease.payment.repository;

import com.parkease.payment.model.Payment;
import com.parkease.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    List<Payment> findByUserId(Long userId);

    List<Payment> findByStatus(PaymentStatus status);

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByPaidAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.lotId = :lotId AND p.status = 'PAID'")
    BigDecimal sumAmountByLotId(@Param("lotId") Long lotId);

    long countByUserId(Long userId);
}
