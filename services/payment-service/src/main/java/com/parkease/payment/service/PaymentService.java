package com.parkease.payment.service;

import com.parkease.payment.dto.request.ProcessPaymentRequest;
import com.parkease.payment.dto.request.RefundPaymentRequest;
import com.parkease.payment.dto.response.PaymentResponse;
import com.parkease.payment.model.PaymentStatus;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {

    PaymentResponse processPayment(ProcessPaymentRequest request);

    PaymentResponse getByBooking(Long bookingId);

    List<PaymentResponse> getByUser(Long userId);

    PaymentResponse refundPayment(Long paymentId, RefundPaymentRequest request);

    PaymentStatus getPaymentStatus(Long paymentId);

    PaymentResponse updateStatus(Long paymentId, PaymentStatus status);

    byte[] generateReceipt(Long paymentId);

    BigDecimal getTotalRevenue(Long lotId);

    List<PaymentResponse> getTransactionHistory(Long userId);
}
