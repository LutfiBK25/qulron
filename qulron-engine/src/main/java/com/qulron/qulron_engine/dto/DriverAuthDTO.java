package com.qulron.qulron_engine.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DriverAuthDTO {
    private int statusCode;
    private String error;
    private String message;
    private String messageCode;
    private String token;
    private String refreshToken;
    private String expirationTime;
    private String phoneNumber;
    private String driverName;
    private String verificationCode;
    private boolean hasTrailer;
}
