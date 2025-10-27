package com.qulron.qulron_engine.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("") // Remove /api since context-path adds it
public class ApiController {
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = Map.of(
                "status", "UP",
                "timestamp", System.currentTimeMillis(),
                "version", "1.0.0");
        return ResponseEntity.ok(health);
    }
}
