package com.qulron.qulron_engine.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverDashboardDataDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private String phoneNumber;
    private String loadId;
    private String orderNumbers;
    private String driverName;
    private String brokerName;
    private String destinationWarehouse;
    private String warehouseAddress;
    private String trailerNumber;
    private Boolean driverArrived;
    private String currentDestinationArea;
    private String currentDestinationLocation;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal potentialWeight;
    private String customerName;
    private String customerAddress;
}
