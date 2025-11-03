package com.qulron.qulron_admin.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
// Exclude null fields from JSON output to reduce payload size.
@JsonInclude(JsonInclude.Include.NON_NULL)
// Ignore unknown fields in JSON input to prevent errors when deserializing.
@JsonIgnoreProperties(ignoreUnknown = true)
public class ActiveLoadResponseDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private List<ActiveLoadInfo> activeLoadInfoList;


    @Getter
    @Setter
    public static class ActiveLoadInfo {
        private String loadId;
        private String orderNumbers;
        private String driverName;
        private String phoneNumber;
        private BigDecimal latitude;
        private BigDecimal longitude;
    }
}
