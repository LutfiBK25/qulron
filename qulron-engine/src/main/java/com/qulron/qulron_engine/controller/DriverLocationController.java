package com.qulron.qulron_engine.controller;

import com.qulron.qulron_engine.dto.DriverLocationDTO;
import com.qulron.qulron_engine.service.DriverLocationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/driver/location")
@Slf4j
public class DriverLocationController {


    private final DriverLocationService driverLocationService;

    public DriverLocationController(DriverLocationService driverLocationService) {
        this.driverLocationService = driverLocationService;
    }

    /**
     * Update driver location - requires valid token and location data
     */
    @PostMapping("/update")
    public ResponseEntity<DriverLocationDTO> updateDriverLocation(
            @Valid @RequestBody DriverLocationDTO locationDTO,
            HttpServletRequest request) {

        log.info("Location update request received from IP: {}", getClientIpAddress(request));

        try {
            DriverLocationDTO response = driverLocationService.updateDriverLocation(request, locationDTO);

            // Log successful update
            if (response.getStatusCode() == 200) {
                log.info("Location updated successfully - Load: {} Coordinates: ({}, {})",
                        response.getLoadId(),
                        response.getLatitude(), response.getLongitude());
            } else {
                log.warn("Location update failed - Load: {} Status: {} Message: {}",
                        response.getLoadId(), response.getStatusCode(), response.getMessage());
            }

            return ResponseEntity.status(response.getStatusCode()).body(response);

        } catch (Exception e) {
            log.error("Error updating driver location - Load: {} Error: {}",
                    locationDTO.getLoadId(), e.getMessage(), e);

            // Create error response
            DriverLocationDTO errorResponse = new DriverLocationDTO();
            errorResponse.setStatusCode(500);
            errorResponse.setMessage("Internal server error occurred while updating location");

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Health check endpoint for location service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("Location service health check requested");
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