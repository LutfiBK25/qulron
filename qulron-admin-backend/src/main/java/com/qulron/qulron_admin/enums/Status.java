package com.qulron.qulron_admin.enums;

import lombok.Getter;

@Getter
public enum Status {
    CREATED("00"),
    ACTIVATED("10"),
    STARTED("20"),
    CANCELLED("80"),
    FINISHED("90"),
    ERROR("91");


    private final String status;

    Status(String status) {
        this.status = status;
    }

}