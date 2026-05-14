package com.parkease.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.parkease.payment.model.PaymentMode;
import com.parkease.payment.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long paymentId;
    private Long bookingId;
    private Long userId;
    private Long lotId;
    private BigDecimal amount;
    private PaymentStatus status;
    private PaymentMode mode;
    private String transactionId;
    private String currency;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime paidAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime refundedAt;

    private String description;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
