package com.qulron.qulron_admin.service;


import com.qulron.qulron_admin.dto.DriverLocationDTO;
import com.qulron.qulron_admin.entity.Order;
import com.qulron.qulron_admin.enums.Status;
import com.qulron.qulron_admin.repository.DriverLocationRepo;
import com.qulron.qulron_admin.repository.OrderRepo;
import com.qulron.qulron_admin.utility.DeviceFingerprintUtils;
import com.qulron.qulron_admin.utility.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
public class DriverLocationService {


    private final DriverLocationRepo driverLocationRepo;

    private final OrderRepo orderRepo;

    private final JWTUtils jwtUtils;

    private final DeviceFingerprintUtils deviceFingerprintUtils;

    public DriverLocationService(DriverLocationRepo driverLocationRepo, OrderRepo orderRepo, JWTUtils jwtUtils, DeviceFingerprintUtils deviceFingerprintUtils) {
        this.driverLocationRepo = driverLocationRepo;
        this.orderRepo = orderRepo;
        this.jwtUtils = jwtUtils;
        this.deviceFingerprintUtils = deviceFingerprintUtils;
    }


    /**
     * Get all active orders with their latest driver locations
     * Production-ready with pagination support and performance optimization
     */


    public DriverLocationDTO getActiveLoadsWithLocations(HttpServletRequest request) {
        DriverLocationDTO response = new DriverLocationDTO();

        try {
            // Step 1: Validate request and extract token (for authentication only)
            String username = validateAndExtractUsername(request, response);
            if (username == null) {
                return response; // Error already set
            }


        } catch (Exception e) {
            log.error("Unexpected error retrieving active orders with locations", e);
            response.setStatusCode(500);
            response.setMessage("Internal server error occurred");
        }

        return response;
    }


    /**
     * Get last location for a specific order
     * Production-ready with caching considerations
     */

    /*
    public DriverLocationDTO getLastLocationForOrder(HttpServletRequest request, String orderNumber) {
        DriverLocationDTO response = new DriverLocationDTO();

        try {
            // Step 1: Validate request and extract token
            String username = validateAndExtractUsername(request, response);
            if (username == null) {
                return response; // Error already set
            }

            // Step 2: Validate order number
            if (orderNumber == null || orderNumber.trim().isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Order number is required");
                return response;
            }

            // Step 3: Get last location for the order
            Optional<DriverLocation> lastLocation = driverLocationRepo
                    .findLastLocationByOrderNumber(orderNumber.trim());

            if (lastLocation.isEmpty()) {
                response.setStatusCode(404);
                response.setMessage("No location found for order: " + orderNumber);
                return response;
            }

            // Step 4: Set successful response
            DriverLocation location = lastLocation.get();
            setSuccessfulLocationResponse(response, location);

            log.info("Last location retrieved for order: {} by phone: {}", orderNumber, username);

        } catch (Exception e) {
            log.error("Unexpected error retrieving last location for order: {}", orderNumber, e);
            response.setStatusCode(500);
            response.setMessage("Internal server error occurred");
        }

        return response;
    }

     */

    /**
     * Get route history for a specific order with pagination
     * Production-ready with performance optimization
     */

    /*
    public DriverLocationDTO getRouteHistory(HttpServletRequest request, String orderNumber) {
        DriverLocationDTO response = new DriverLocationDTO();

        try {
            // Step 1: Validate request and extract token
            String username = validateAndExtractUsername(request, response);
            if (username == null) {
                return response; // Error already set
            }

            // Step 2: Validate order number
            if (orderNumber == null || orderNumber.trim().isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Order number is required");
                return response;
            }

            // Step 3: Get route history for the order (limit to last 1000 points for
            // performance)
            List<DriverLocation> routeHistory = driverLocationRepo
                    .findByOrderNumberOrderByLocationTimestampDesc(orderNumber.trim());

            if (routeHistory.isEmpty()) {
                response.setStatusCode(404);
                response.setMessage("No route history found for order: " + orderNumber);
                return response;
            }

            // Step 4: Limit results for performance (last 1000 points)
            if (routeHistory.size() > 1000) {
                routeHistory = routeHistory.subList(0, 1000);
                log.warn("Route history truncated to 1000 points for order: {}", orderNumber);
            }

            // Step 5: Set successful response
            response.setStatusCode(200);
            response.setMessage("Route history retrieved successfully");
            response.setOrderNumber(orderNumber);
            response.setDriverLocations(routeHistory);

            log.info("Route history retrieved for order: {}. Points: {} by phone: {}",
                    orderNumber, routeHistory.size(), username);

        } catch (Exception e) {
            log.error("Unexpected error retrieving route history for order: " + orderNumber, e);
            response.setStatusCode(500);
            response.setMessage("Internal server error occurred");
        }

        return response;
    }

    */

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Validate request and extract phone number from token
     */
    private String validateAndExtractUsername(HttpServletRequest request, DriverLocationDTO response) {
        String token = extractToken(request);
        if (token == null) {
            response.setStatusCode(401);
            response.setMessage("Authorization token is missing or invalid");
            return null;
        }

        String username = jwtUtils.extractUsername(token);
        if (username == null) {
            response.setStatusCode(401);
            response.setMessage("Invalid token: phone number not found");
            return null;
        }

        // Mobile-friendly token validation with device fingerprinting
//        String currentDeviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
//        String currentLocation = deviceFingerprintUtils.extractLocation(request);
//
//        if (!jwtUtils.isTokenValid(token, username, currentDeviceFingerprint, currentLocation)) {
//            response.setStatusCode(401);
//            response.setMessage("Invalid or expired token");
//            log.warn("Invalid token for location service by phone: {} from device: {}",
//                    username, currentDeviceFingerprint);
//            return null;
//        }

        return username;
    }


    /**
     * Get active orders with performance optimization
     */
    private List<Order> getActiveOrdersOptimized() {
        return orderRepo.findByOrderStatusIn(
                List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));
    }


    /**
     * Set successful location response
     */
//    private void setSuccessfulLocationResponse(DriverLocationDTO response, DriverLocation location) {
//        response.setStatusCode(200);
//        response.setMessage("Location data retrieved successfully");
//        response.setId(location.getId());
//        response.setOrderId(location.getOrder().getId());
//        response.setOrderNumber(location.getOrderNumber());
//        response.setDriverName(location.getDriverName());
//        response.setPhoneNumber(location.getPhoneNumber());
//        response.setLatitude(location.getLatitude());
//        response.setLongitude(location.getLongitude());
//        response.setAccuracy(location.getAccuracy());
//        response.setSpeed(location.getSpeed());
//        response.setHeading(location.getHeading());
//        response.setAltitude(location.getAltitude());
//        response.setIsMoving(location.getIsMoving());
//        response.setBatteryLevel(location.getBatteryLevel());
//        response.setEstimatedArrival(location.getEstimatedArrival());
//        response.setDestinationWarehouse(location.getDestinationWarehouse());
//        response.setLocationTimestamp(location.getLocationTimestamp());
//    }

    /**
     * Extract token from request with validation
     */
    private String extractToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        return (token != null && token.startsWith("Bearer ")) ? token.substring(7) : null;
    }
}