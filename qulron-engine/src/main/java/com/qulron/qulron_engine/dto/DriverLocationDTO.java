package com.qulron.qulron_engine.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.qulron.qulron_engine.entity.DriverLocation;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverLocationDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;

    // Location data
    private Long id;

    @Size(max = 30, message = "Load ID cannot exceed 30 characters")
    private String loadId;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private BigDecimal longitude;

    @DecimalMin(value = "0.0", message = "Accuracy must be positive")
    private BigDecimal accuracy;

    @DecimalMin(value = "0.0", message = "Speed must be positive")
    private BigDecimal speed;

    @DecimalMin(value = "0.0", message = "Heading must be between 0 and 360")
    @DecimalMax(value = "360.0", message = "Heading must be between 0 and 360")
    private BigDecimal heading;

    private BigDecimal altitude;
    private Boolean isMoving;

    @DecimalMin(value = "0", message = "Battery level must be between 0 and 100")
    @DecimalMax(value = "100", message = "Battery level must be between 0 and 100")
    private Integer batteryLevel;

    @DecimalMin(value = "0", message = "Estimated arrival must be positive")
    private Integer estimatedArrival;

    @Size(max = 30, message = "Destination warehouse cannot exceed 30 characters")
    private String destinationWarehouse;

    @NotNull(message = "Location timestamp is required")
    private LocalDateTime locationTimestamp;

    private List<DriverLocation> driverLocations;
    // Additional fields for API responses
    private String distanceToDestination;
    private String estimatedTimeToDestination;
    private String currentStatus;
    private Boolean isNearDestination;
}