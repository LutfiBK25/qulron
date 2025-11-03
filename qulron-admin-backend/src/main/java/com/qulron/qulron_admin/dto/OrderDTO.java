package com.qulron.qulron_admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
// Exclude null fields from JSON output to reduce payload size.
@JsonInclude(JsonInclude.Include.NON_NULL)
// Ignore unknown fields in JSON input to prevent errors when deserializing.
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private List<CurrentOrderInfo> orders;

    @Data
    public static class CurrentOrderInfo {
        private Long id;
        private String orderNumber;
        private String loadId;
        private String warehouse;
        private String warehouseCode;
        private String warehouseAddress;
        private String orderStatus;
        private String brokerName;
        private String driverName;
        private String phoneNumber;
        private LocalDateTime appointmentDateTime;
        private String recordCreateId;
        private LocalDateTime recordCreateDate;
        private String recordUpdateId;
        private LocalDateTime recordUpdateDate;
    }


}
