package com.qulron.qulron_engine.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// Exclude null fields from JSON output to reduce payload size.
@JsonInclude(JsonInclude.Include.NON_NULL)
// Ignore unknown fields in JSON input to prevent errors when deserializing.
@JsonIgnoreProperties(ignoreUnknown = true)
public class BrokerLoadDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;

    @NotBlank(message = "Order number is required")
    @Size(max = 30, message = "Order number cannot exceed 30 characters")
    private String orderNumber;

    @NotBlank(message = "Broker name is required")
    @Size(max = 5, message = "state name cannot exceed 5 characters")
    private String state;

    @NotBlank(message = "Driver name is required")
    @Size(max = 100, message = "Driver name cannot exceed 100 characters")
    private String driverName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{3}-\\d{3}-\\d{4}$", message = "Phone number must be in format XXX-XXX-XXXX")
    private String phoneNumber;
}
