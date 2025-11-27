package com.qulron.qulron_admin.controller;

import com.qulron.qulron_admin.dto.ActiveLoadResponseDTO;
import com.qulron.qulron_admin.dto.UnBookedOrderResponseDTO;
import com.qulron.qulron_admin.dto.BookedOrderResponseDTO;
import com.qulron.qulron_admin.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/order_management")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/unbooked_orders")
    public ResponseEntity<UnBookedOrderResponseDTO> getUnBookedOrders(HttpServletRequest request) {
        return ResponseEntity.ok(orderService.getUnBookedOrders(request));
    }

    @GetMapping("/booked_orders")
    public ResponseEntity<BookedOrderResponseDTO> getBookedOrders(HttpServletRequest request) {
        return ResponseEntity.ok(orderService.getBookedOrders(request));
    }

    @PutMapping("/cancel/{load_id}")
    public ResponseEntity<BookedOrderResponseDTO> cancelOrder(@PathVariable String load_id, HttpServletRequest request) {
        return ResponseEntity.ok(orderService.clearOrderSubmission(request, load_id));
    }

    /**
     * Get all active orders with their latest driver locations
     */
    @GetMapping("/active-loads")
    public ResponseEntity<ActiveLoadResponseDTO> getActiveLoadsWithLocations(HttpServletRequest request) {

        logger.info("Active orders with locations request received from IP: {}", getClientIpAddress(request));

        try {
            ActiveLoadResponseDTO response = orderService.getActiveLoads(request);

            // Log successful retrieval
            if (response.getStatusCode() == 200) {
                int locationCount = response.getActiveLoadInfoList() != null ? response.getActiveLoadInfoList().size() : 0;
                logger.info("Active orders with locations retrieved successfully");
            } else {
                logger.warn("Failed to retrieve active orders - Status: {} Message: {}",
                        response.getStatusCode(), response.getMessage());
            }

            return ResponseEntity.status(response.getStatusCode()).body(response);

        } catch (Exception e) {
            logger.error("Error retrieving active orders with locations - Error: {}", e.getMessage(), e);

            // Create error response
            ActiveLoadResponseDTO errorResponse = new ActiveLoadResponseDTO();
            errorResponse.setStatusCode(500);
            errorResponse.setMessage("Internal server error occurred while retrieving active orders");

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get last location for a specific order
     */
//    @GetMapping("/order/{orderNumber}/last-location")
//    public ResponseEntity<DriverLocationDTO> getLastLocationForOrder(
//            @PathVariable String orderNumber,
//            HttpServletRequest request) {
//
//        logger.info("Last location request received for order: {} from IP: {}",
//                orderNumber, getClientIpAddress(request));
//
//        try {
//            DriverLocationDTO response = driverLocationService.getLastLocationForOrder(request, orderNumber);
//
//            // Log successful retrieval
//            if (response.getStatusCode() == 200) {
//                logger.info("Last location retrieved successfully for order: {} - Driver: {}",
//                        orderNumber, response.getDriverName());
//            } else {
//                logger.warn("Failed to retrieve last location for order: {} - Status: {} Message: {}",
//                        orderNumber, response.getStatusCode(), response.getMessage());
//            }
//
//            return ResponseEntity.status(response.getStatusCode()).body(response);
//
//        } catch (Exception e) {
//            logger.error("Error retrieving last location for order: {} - Error: {}",
//                    orderNumber, e.getMessage(), e);
//
//            // Create error response
//            DriverLocationDTO errorResponse = new DriverLocationDTO();
//            errorResponse.setStatusCode(500);
//            errorResponse.setMessage("Internal server error occurred while retrieving last location");
//
//            return ResponseEntity.status(500).body(errorResponse);
//        }
//    }

    /**
     * Get route history for a specific order
     */
//    @GetMapping("/order/{orderNumber}/route-history")
//    public ResponseEntity<DriverLocationDTO> getRouteHistory(
//            @PathVariable String orderNumber,
//            HttpServletRequest request) {
//
//        logger.info("Route history request received for order: {} from IP: {}",
//                orderNumber, getClientIpAddress(request));
//
//        try {
//            DriverLocationDTO response = driverLocationService.getRouteHistory(request, orderNumber);
//
//            // Log successful retrieval
//            if (response.getStatusCode() == 200) {
//                int pointCount = response.getDriverLocations() != null ? response.getDriverLocations().size() : 0;
//                logger.info("Route history retrieved successfully for order: {} - Points: {}",
//                        orderNumber, pointCount);
//            } else {
//                logger.warn("Failed to retrieve route history for order: {} - Status: {} Message: {}",
//                        orderNumber, response.getStatusCode(), response.getMessage());
//            }
//
//            return ResponseEntity.status(response.getStatusCode()).body(response);
//
//        } catch (Exception e) {
//            logger.error("Error retrieving route history for order: {} - Error: {}",
//                    orderNumber, e.getMessage(), e);
//
//            // Create error response
//            DriverLocationDTO errorResponse = new DriverLocationDTO();
//            errorResponse.setStatusCode(500);
//            errorResponse.setMessage("Internal server error occurred while retrieving route history");
//
//            return ResponseEntity.status(500).body(errorResponse);
//        }
//    }

    /**
     * Health check endpoint for location service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        logger.info("Location service health check requested");
        return ResponseEntity.ok(Map.of("status", "healthy", "service", "driver-location"));
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
