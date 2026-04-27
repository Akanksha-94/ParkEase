package com.parkease.payment.service;

import com.parkease.payment.dto.request.ProcessPaymentRequest;
import com.parkease.payment.dto.request.RefundPaymentRequest;
import com.parkease.payment.dto.response.PaymentResponse;
import com.parkease.payment.exception.PaymentException;
import com.parkease.payment.exception.PaymentNotFoundException;
import com.parkease.payment.model.Payment;
import com.parkease.payment.model.PaymentStatus;
import com.parkease.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public PaymentResponse processPayment(ProcessPaymentRequest request) {
        // Mocking payment gateway processing logic
        log.info("Processing payment for booking {}", request.getBookingId());

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .userId(request.getUserId())
                .lotId(request.getLotId())
                .amount(request.getAmount())
                .mode(request.getMode())
                .currency(request.getCurrency())
                .description(request.getDescription())
                .status(PaymentStatus.PAID) // Assuming successful payment
                .transactionId(UUID.randomUUID().toString())
                .paidAt(LocalDateTime.now())
                .build();

        return toResponse(paymentRepository.save(payment));
    }

    @Override
    public PaymentResponse getByBooking(UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for booking: " + bookingId));
        return toResponse(payment);
    }

    @Override
    public List<PaymentResponse> getByUser(UUID userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(UUID paymentId, RefundPaymentRequest request) {
        Payment payment = findOrThrow(paymentId);

        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new PaymentException("Only paid payments can be refunded");
        }

        log.info("Processing refund for payment {}, reason: {}", paymentId, request.getReason());

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundedAt(LocalDateTime.now());
        payment.setDescription(payment.getDescription() + " | Refund Reason: " + request.getReason());

        return toResponse(paymentRepository.save(payment));
    }

    @Override
    public PaymentStatus getPaymentStatus(UUID paymentId) {
        return findOrThrow(paymentId).getStatus();
    }

    @Override
    @Transactional
    public PaymentResponse updateStatus(UUID paymentId, PaymentStatus status) {
        Payment payment = findOrThrow(paymentId);
        payment.setStatus(status);
        
        if (status == PaymentStatus.PAID && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }
        
        return toResponse(paymentRepository.save(payment));
    }

    @Override
    public byte[] generateReceipt(UUID paymentId) {
        Payment payment = findOrThrow(paymentId);
        
        // Mock receipt generation (instead of full PDF library to keep it lightweight)
        String receiptContent = String.format(
                "--- PARKEASE RECEIPT ---\n" +
                "Receipt ID: %s\n" +
                "Date: %s\n" +
                "Transaction ID: %s\n" +
                "Booking ID: %s\n" +
                "Status: %s\n" +
                "Amount: %s %s\n" +
                "Mode: %s\n" +
                "------------------------",
                payment.getPaymentId(),
                payment.getPaidAt() != null ? payment.getPaidAt() : LocalDateTime.now(),
                payment.getTransactionId(),
                payment.getBookingId(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getMode()
        );

        return receiptContent.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public BigDecimal getTotalRevenue(UUID lotId) {
        return paymentRepository.sumAmountByLotId(lotId);
    }

    @Override
    public List<PaymentResponse> getTransactionHistory(UUID userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Payment findOrThrow(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found: " + paymentId));
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .lotId(payment.getLotId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .mode(payment.getMode())
                .transactionId(payment.getTransactionId())
                .currency(payment.getCurrency())
                .paidAt(payment.getPaidAt())
                .refundedAt(payment.getRefundedAt())
                .description(payment.getDescription())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
