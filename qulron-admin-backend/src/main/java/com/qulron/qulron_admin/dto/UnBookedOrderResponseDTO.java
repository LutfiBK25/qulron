package com.qulron.qulron_admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
// Exclude null fields from JSON output to reduce payload size.
@JsonInclude(JsonInclude.Include.NON_NULL)
// Ignore unknown fields in JSON input to prevent errors when deserializing.
@JsonIgnoreProperties(ignoreUnknown = true)
public class UnBookedOrderResponseDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private List<UnbookedOrderInfo> unbookedOrderInfoList;

    @Getter
    @Setter
    public static class UnbookedOrderInfo {
        private Long id;
        private String loadId;
        private String orderNumbers;
        private String warehouse;
        private String warehouseCode;
        private String warehouseAddress;
        private LocalDateTime appointmentDateTime;
        private String brokerName;
        private String orderStatus;
    }
}
