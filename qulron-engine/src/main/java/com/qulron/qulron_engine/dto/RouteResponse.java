package com.qulron.qulron_engine.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatusCode;

@Getter
@Setter
public class RouteResponse {
    private HttpStatusCode statusCode;
    private String body;
}
