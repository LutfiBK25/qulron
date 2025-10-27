package com.qulron.qulron_engine.entity;

import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.utility.StatusConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_load_master")
@Getter
@Setter
public class LoadMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lm_id")
    private Long id;

    @Column(name = "load_id", nullable = false, length = 30)
    private String loadId;

    @Convert(converter = StatusConverter.class)
    @Column(name = "status", nullable = false)
    private Status loadStatus;

    @Column(name = "broker_name", nullable = false, length = 100)
    private String brokerName;

    @Column(name = "driver_name", nullable = false, length = 100)
    private String driverName;

    @Column(name = "phone_number", nullable = false, length = 12)
    private String phoneNumber;

    @Column(name = "last_driver_latitude", precision = 16, scale = 13)
    private BigDecimal lastDriverLatitude;

    @Column(name = "last_driver_longitude", precision = 16, scale = 13)
    private BigDecimal lastDriverLongitude;

    @Column(name = "appointment_datetime", nullable = false)
    private LocalDateTime appointmentDateTime;

    @Column(name = "potential_weight")
    private BigDecimal potentialWeight;


    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

    @Column(name = "record_update_id", length = 30)
    private String recordUpdateId;

    @Column(name = "record_update_date")
    private LocalDateTime recordUpdateDate;
}
