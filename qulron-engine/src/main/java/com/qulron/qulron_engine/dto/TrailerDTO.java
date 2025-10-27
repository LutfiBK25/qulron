package com.qulron.qulron_engine.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.qulron.qulron_engine.entity.Trailer;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// Exclude null fields from JSON output to reduce payload size.
@JsonInclude(JsonInclude.Include.NON_NULL)
// Ignore unknown fields in JSON input to prevent errors when deserializing.
@JsonIgnoreProperties(ignoreUnknown = true)
public class TrailerDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private String trailerNumber;
    private Long orderId;
    private Trailer trailer;
    private boolean hasTrailer;
}
