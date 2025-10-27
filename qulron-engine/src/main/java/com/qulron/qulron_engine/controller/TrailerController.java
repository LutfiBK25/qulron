package com.qulron.qulron_engine.controller;

import com.qulron.qulron_engine.dto.TrailerDTO;
import com.qulron.qulron_engine.service.TrailerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/trailer")
@Slf4j
public class TrailerController {

    private final TrailerService trailerService;


    public TrailerController(TrailerService trailerService) {
        this.trailerService = trailerService;
    }

    @GetMapping("/check")
    public ResponseEntity<TrailerDTO> checkForTrailer(HttpServletRequest request) {
        log.info("Trailer check request received from IP: {}", getClientIpAddress(request));

        try {
            TrailerDTO response = trailerService.trailerCheck(request);

            log.info("Trailer check completed - Status: {} Message: {}",
                    response.getStatusCode(), response.getMessage());

            return ResponseEntity.status(response.getStatusCode()).body(response);

        } catch (Exception e) {
            log.error("Error checking trailer", e);

            TrailerDTO errorResponse = new TrailerDTO();
            errorResponse.setStatusCode(500);
            errorResponse.setMessage("Internal server error occurred while checking trailer");

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/new")
    public ResponseEntity<TrailerDTO> createOrderTrailer(
            HttpServletRequest request,
            @RequestBody @NotBlank(message = "Trailer number is required") @Size(min = 1, max = 30, message = "Trailer number must be between 1 and 30 characters") @Pattern(regexp = "^[A-Z0-9-]+$", message = "Trailer number can only contain uppercase letters, numbers, and hyphens") String trailerNumber) {

        log.info("Trailer creation request received - Trailer: {} from IP: {}",
                trailerNumber, getClientIpAddress(request));

        try {
            TrailerDTO response = trailerService.createLoadTrailer(request, trailerNumber);

            if (response.getStatusCode() == 200) {
                log.info("Trailer created successfully - Trailer: {} Load: {}",
                        trailerNumber,
                        response.getTrailer() != null ? response.getTrailer().getLoadMaster().getLoadId() : "N/A");
            } else {
                log.warn("Trailer creation failed - Trailer: {} Status: {} Message: {}",
                        trailerNumber, response.getStatusCode(), response.getMessage());
            }

            return ResponseEntity.status(response.getStatusCode()).body(response);

        } catch (Exception e) {
            log.error("Error creating trailer - Trailer: {} Error: {}", trailerNumber, e.getMessage(), e);

            TrailerDTO errorResponse = new TrailerDTO();
            errorResponse.setStatusCode(500);
            errorResponse.setMessage("Internal server error occurred while creating trailer");

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
