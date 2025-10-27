package com.qulron.qulron_engine.controller;

import com.qulron.qulron_engine.dto.RouteRequest;
import com.qulron.qulron_engine.dto.RouteResponse;
import com.qulron.qulron_engine.service.RoutingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


// We are not using this controller anymore, we are using the OSRM service directly
@RestController
@RequestMapping("/routing")
@Slf4j
public class RoutingController {


    private final RoutingService routingService;

    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }


    @PostMapping("/calculate-route")
    public ResponseEntity<?> calculateRoute(@RequestBody RouteRequest request) {
        try {
            RouteResponse response = routingService.calculateRoute(request);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("OSRM request failed with status: {}", response.getStatusCode());
                return ResponseEntity.status(500).body("{\"error\": \"OSRM request failed\"}");
            }

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                log.error("Empty response from OSRM");
                return ResponseEntity.status(500).body("{\"error\": \"Empty response from OSRM\"}");
            }

            // Return proper JSON response
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(responseBody);

        } catch (Exception e) {
            log.error("Error calculating route", e);
            return ResponseEntity.status(500)
                    .header("Content-Type", "application/json")
                    .body("{\"error\": \"Route calculation failed: " + e.getMessage() + "\"}");
        }
    }
}