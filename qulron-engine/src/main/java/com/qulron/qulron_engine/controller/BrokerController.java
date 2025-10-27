package com.qulron.qulron_engine.controller;

import com.qulron.qulron_engine.dto.BrokerLoadDTO;
import com.qulron.qulron_engine.service.BrokerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/broker") // Remove /api since context-path adds it
public class BrokerController {
    private static final Logger logger = LoggerFactory.getLogger(BrokerController.class);

    private final BrokerService brokerService;

    public BrokerController(BrokerService brokerService) {
        this.brokerService = brokerService;
    }

    @PostMapping("/order_submission")
    public ResponseEntity<BrokerLoadDTO> submitOrder(
            @Valid @RequestBody BrokerLoadDTO submitReq,
            HttpServletRequest request) {

        logger.info("Order submission request received from IP: {}", getClientIpAddress(request));

        try {

            // Log successful submission
            logger.info("request to submit order - Order: {} Driver: {} Phone: {}",
                    submitReq.getOrderNumber(), submitReq.getDriverName(), submitReq.getPhoneNumber());

            BrokerLoadDTO response = brokerService.submitLoad(submitReq);


            // Return appropriate HTTP status based on service response
            return ResponseEntity.status(response.getStatusCode()).body(response);

        } catch (Exception e) {
            logger.error("Error submitting order - Order: {} Error: {}",
                    submitReq.getOrderNumber(), e.getMessage(), e);

            // Create error response
            BrokerLoadDTO errorResponse = new BrokerLoadDTO();
            errorResponse.setStatusCode(500);
            errorResponse.setMessage("Internal server error occurred while processing order");

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get client IP address with proxy support
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
