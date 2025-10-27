package com.qulron.qulron_engine.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_yard_location")
@Getter
@Setter
public class YardLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "yl_id")
    private Long id;

    @Column(name = "task_destination_area", length = 5)
    private String taskDestinationArea;

    @Column(name = "task_destination_location", length = 20)
    private String taskDestinationLocation;

    @Column(name = "area", length = 100)
    private String area;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "latitude", precision = 16, scale = 13)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 16, scale = 13)
    private BigDecimal longitude;

    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

    @Column(name = "record_update_id", length = 30)
    private String recordUpdateId;

    @Column(name = "record_update_date")
    private LocalDateTime recordUpdateDate;

}
