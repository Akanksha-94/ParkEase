package com.parkease.payment.resource;

import com.parkease.payment.common.response.ApiResponse;
import com.parkease.payment.dto.request.ProcessPaymentRequest;
import com.parkease.payment.dto.request.RefundPaymentRequest;
import com.parkease.payment.dto.response.PaymentResponse;
import com.parkease.payment.model.PaymentStatus;
import com.parkease.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/payments")
@Validated
@RequiredArgsConstructor
@Slf4j
public class PaymentResource {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> processPaymentAlias(
            @Valid @RequestBody ProcessPaymentRequest request) {
        return processPayment(request);
    }

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<PaymentResponse>> processPayment(
            @Valid @RequestBody ProcessPaymentRequest request) {
        log.info("POST /payments/process - bookingId: {}, amount: {}", request.getBookingId(), request.getAmount());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "Payment processed successfully", paymentService.processPayment(request)));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", paymentService.getByBooking(bookingId)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("User payments retrieved", paymentService.getByUser(userId)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getTransactionHistory(@RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Transaction history retrieved", paymentService.getTransactionHistory(userId)));
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<ApiResponse<PaymentResponse>> refundPayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody RefundPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment refunded", paymentService.refundPayment(paymentId, request)));
    }

    @GetMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<PaymentStatus>> getPaymentStatus(@PathVariable Long paymentId) {
        return ResponseEntity.ok(ApiResponse.success("Payment status retrieved", paymentService.getPaymentStatus(paymentId)));
    }

    @GetMapping("/{paymentId}/receipt")
    public ResponseEntity<ApiResponse<String>> generateReceipt(@PathVariable Long paymentId) {
        String receipt = new String(paymentService.generateReceipt(paymentId));
        return ResponseEntity.ok(ApiResponse.success("Receipt generated", receipt));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevenue(@RequestParam Long lotId) {
        return ResponseEntity.ok(ApiResponse.success("Total revenue retrieved", paymentService.getTotalRevenue(lotId)));
    }
}
