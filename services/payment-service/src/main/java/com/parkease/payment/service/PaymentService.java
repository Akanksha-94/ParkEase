package com.parkease.payment.service;

import com.parkease.payment.dto.request.ProcessPaymentRequest;
import com.parkease.payment.dto.request.RefundPaymentRequest;
import com.parkease.payment.dto.response.PaymentResponse;
import com.parkease.payment.model.PaymentStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PaymentService {

    PaymentResponse processPayment(ProcessPaymentRequest request);

    PaymentResponse getByBooking(UUID bookingId);

    List<PaymentResponse> getByUser(UUID userId);

    PaymentResponse refundPayment(UUID paymentId, RefundPaymentRequest request);

    PaymentStatus getPaymentStatus(UUID paymentId);

    PaymentResponse updateStatus(UUID paymentId, PaymentStatus status);

    byte[] generateReceipt(UUID paymentId);

    BigDecimal getTotalRevenue(UUID lotId);

    List<PaymentResponse> getTransactionHistory(UUID userId);
}
