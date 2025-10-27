package com.qulron.qulron_engine.controller;

import com.qulron.qulron_engine.dto.DriverArrivalRequestDTO;
import com.qulron.qulron_engine.dto.DriverArrivalResponseDTO;
import com.qulron.qulron_engine.dto.DriverAuthDTO;
import com.qulron.qulron_engine.dto.DriverDashboardDataDTO;
import com.qulron.qulron_engine.service.DriverService;
import com.qulron.qulron_engine.utility.DeviceFingerprintUtils;
import com.qulron.qulron_engine.utility.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/driver")
public class DriverController {
    private static final Logger logger = LoggerFactory.getLogger(DriverController.class);


    private final DriverService driverService;

    private final JWTUtils jwtUtils;

    private final DeviceFingerprintUtils deviceFingerprintUtils;

    public DriverController(DriverService driverService, JWTUtils jwtUtils, DeviceFingerprintUtils deviceFingerprintUtils) {
        this.driverService = driverService;
        this.jwtUtils = jwtUtils;
        this.deviceFingerprintUtils = deviceFingerprintUtils;
    }

    @PostMapping("/auth/request-code")
    public ResponseEntity<DriverAuthDTO> requestVerificationCode(@Valid  @RequestBody DriverAuthDTO request) {
        DriverAuthDTO response = driverService.requestVerificationCode(request.getPhoneNumber());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/auth/verify-code")
    public ResponseEntity<DriverAuthDTO> verifyCodeAndLogin(@Valid @RequestBody DriverAuthDTO request,
                                                            HttpServletRequest httpRequest) {
        DriverAuthDTO response = driverService.verifyCodeAndLogin(httpRequest, request.getPhoneNumber(),
                request.getVerificationCode());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader, HttpServletRequest request) {
        String token = authHeader.replace("Bearer ", "");

        // Extract device fingerprint for audit logging
        String deviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
        String phoneNumber = jwtUtils.extractPhoneNumber(token);

        // Invalidate token on backend
        jwtUtils.blacklistToken(token);

        logger.info("User logged out - Phone: {} Device: {}", phoneNumber, deviceFingerprint);

        return ResponseEntity.ok().body(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/data/dashboard")
    public ResponseEntity<DriverDashboardDataDTO> getDriverDashboardData(
            HttpServletRequest request,
            @RequestParam(required = false) String lastUpdate) {

        // Add caching headers
        DriverDashboardDataDTO response = driverService.getDashboardData(request);

        // Set cache headers to reduce unnecessary requests
        return ResponseEntity.ok()
                .header("Cache-Control", "no-cache, must-revalidate")
                .header("ETag", generateETag(response))
                .body(response);
    }

    @PostMapping("/arrival")
    public ResponseEntity<DriverArrivalResponseDTO> driverArrival(@Valid @RequestBody DriverArrivalRequestDTO driverArrivalRequestDTO, HttpServletRequest request) {
        return ResponseEntity.ok(driverService.submitArrival(request,driverArrivalRequestDTO));
    }

    // Add this method to generate ETag
    private String generateETag(DriverDashboardDataDTO response) {
        // Create a hash based on the response content
        String content = response.getLoadId() +
                response.getCurrentDestinationArea() +
                response.getCurrentDestinationLocation() +
                response.getTrailerNumber() +
                response.getDriverArrived();

        // Simple hash generation (you can use more sophisticated methods)
        return "\"" + Integer.toHexString(content.hashCode()) + "\"";
    }
}
