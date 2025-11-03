package com.qulron.qulron_admin.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_driver_location")
@Getter
@Setter
public class DriverLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dl_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lm_id", referencedColumnName = "lm_id", nullable = false)
    private LoadMaster loadMaster;

    @Column(name = "latitude", nullable = false, precision = 16, scale = 13)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 16, scale = 13)
    private BigDecimal longitude;

    @Column(name = "accuracy", precision = 8, scale = 2)
    private BigDecimal accuracy;

    @Column(name = "speed", precision = 8, scale = 2)
    private BigDecimal speed;

    @Column(name = "heading", precision = 5, scale = 2)
    private BigDecimal heading;

    @Column(name = "altitude", precision = 8, scale = 2)
    private BigDecimal altitude;

    @Column(name = "is_moving")
    private Boolean isMoving = false;

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(name = "estimated_arrival")
    private Integer estimatedArrival;

    @Column(name = "destination_warehouse", length = 30)
    private String destinationWarehouse;

    @Column(name = "location_timestamp", nullable = false)
    private LocalDateTime locationTimestamp;

    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

}