package com.parkease.payment.resource;

import com.parkease.payment.dto.request.ProcessPaymentRequest;
import com.parkease.payment.dto.request.RefundPaymentRequest;
import com.parkease.payment.dto.response.PaymentResponse;
import com.parkease.payment.model.PaymentStatus;
import com.parkease.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@Validated
@RequiredArgsConstructor
public class PaymentResource {

    private final PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody ProcessPaymentRequest request) {
        return ResponseEntity.ok(paymentService.processPayment(request));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getByBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(paymentService.getByBooking(bookingId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentResponse>> getByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(paymentService.getByUser(userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PaymentResponse>> getTransactionHistory(@RequestParam UUID userId) {
        return ResponseEntity.ok(paymentService.getTransactionHistory(userId));
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(
            @PathVariable UUID paymentId,
            @Valid @RequestBody RefundPaymentRequest request) {
        return ResponseEntity.ok(paymentService.refundPayment(paymentId, request));
    }

    @GetMapping("/{paymentId}/status")
    public ResponseEntity<PaymentStatus> getPaymentStatus(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentStatus(paymentId));
    }

    @GetMapping("/{paymentId}/receipt")
    public ResponseEntity<byte[]> generateReceipt(@PathVariable UUID paymentId) {
        byte[] receiptData = paymentService.generateReceipt(paymentId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN); // Change to APPLICATION_PDF if using real PDF
        headers.setContentDispositionFormData("attachment", "receipt_" + paymentId + ".txt");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(receiptData);
    }

    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getTotalRevenue(@RequestParam UUID lotId) {
        return ResponseEntity.ok(paymentService.getTotalRevenue(lotId));
    }
}
