package com.qulron.qulron_admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverLocationDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private List<activeLoadInfo> activeLoadInfoList;


    @Data
    private static class activeLoadInfo {
        @NotBlank(message = "Order number is required")
        @Size(max = 30, message = "Order number cannot exceed 30 characters")
        private String loadId;

        @NotBlank(message = "Order number is required")
        @Size(max = 100, message = "Order number cannot exceed 100 characters")
        private String orderNumbers;

        @NotBlank(message = "Driver name is required")
        @Size(max = 100, message = "Driver name cannot exceed 100 characters")
        private String driverName;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\d{3}-\\d{3}-\\d{4}$", message = "Phone number must be in format XXX-XXX-XXXX")
        private String phoneNumber;

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        private BigDecimal latitude;

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        private BigDecimal longitude;

    }
}