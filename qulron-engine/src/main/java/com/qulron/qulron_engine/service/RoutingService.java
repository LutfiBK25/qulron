package com.qulron.qulron_engine.service;

import com.qulron.qulron_engine.dto.RouteRequest;
import com.qulron.qulron_engine.dto.RouteResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RoutingService {

    @Value("${osrm.service.url}")
    private String OSRM_URL;

    public RouteResponse calculateRoute(RouteRequest request) {
        RouteResponse response = new RouteResponse();
        try {
            log.info("Received route request: {}", request);

            String coordinates = request.getWaypoints().stream()
                    .map(wp -> wp.getLng() + "," + wp.getLat())
                    .collect(Collectors.joining(";"));

            String osrmUrl = OSRM_URL + "/route/v1/driving/" + coordinates
                    + "?overview=false&alternatives=true&steps=true&hints="
                    + String.join(";", Collections.nCopies(request.getWaypoints().size(), ""));

            log.info("OSRM Request Url Generated: {}", osrmUrl);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> osrmResponse = restTemplate.getForEntity(osrmUrl, String.class);

            log.info("OSRM Response Status: {}", osrmResponse.getStatusCode());
            log.info("OSRM Response Body Fetched Successfully");

            if (!osrmResponse.getStatusCode().is2xxSuccessful()) {
                log.error("OSRM request failed with status: {}", response.getStatusCode());
                response.setStatusCode(HttpStatusCode.valueOf(500));
                response.setBody("{\"error\": \"OSRM request failed\"}");
                return response;
            }

            String responseBody = osrmResponse.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                log.error("Empty response from OSRM");
                response.setStatusCode(HttpStatusCode.valueOf(500));
                response.setBody("{\"error\": \"Empty response from OSRM\"}");
                return response;
            }

            response.setStatusCode(osrmResponse.getStatusCode());
            response.setBody(osrmResponse.getBody());

            return response;
        } catch (Exception e) {
            log.error("Error calculating route", e);
            response.setStatusCode(HttpStatusCode.valueOf(500));
            response.setBody("Internal Server Error");
            return response;
        }
    }
}
