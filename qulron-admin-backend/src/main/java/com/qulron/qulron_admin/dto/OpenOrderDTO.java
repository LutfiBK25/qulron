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
public class OpenOrderDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private List<UnbookedOrderInfo> orders;

    @Data
    public static class UnbookedOrderInfo {
        private String orderNumber;
        private String loadId;
        private String warehouse;
        private String warehouseCode;
        private String warehouseAddress;
        private LocalDateTime appointmentDateTime;
        private String brokerName;
        private String orderStatus;
    }
}
