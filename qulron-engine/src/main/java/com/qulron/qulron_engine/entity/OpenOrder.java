package com.qulron.qulron_engine.entity;

import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.utility.StatusConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "t_open_order")
@Getter
@Setter
public class OpenOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oo_id")
    private Long id;

    @Column(name = "order_number", unique = true, nullable = false, length = 30)
    private String orderNumber;

    @Convert(converter = StatusConverter.class)
    @Column(name = "status", nullable = false)
    private Status orderStatus;

    @Column(name = "warehouse", nullable = false, length = 30)
    private String warehouse;

    @Column(name = "warehouse_code", nullable = false, length = 5)
    private String warehouse_code;

    @Column(name = "warehouse_address", nullable = false, length = 100)
    private String warehouseAddress;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "dest_addr", nullable = false, length = 100)
    private String destAddr;

    @Column(name = "dest_city", nullable = false, length = 50)
    private String destCity;

    @Column(name = "dest_state", nullable = false, length = 5)
    private String destState;

    @Column(name = "dest_zip", nullable = false, length = 20)
    private String dest_zip;

    @Column(name = "dest_country_code", nullable = false, length = 10)
    private String destCountryCode;

    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

    @Column(name = "record_update_id", length = 30)
    private String recordUpdateId;

    @Column(name = "record_update_date")
    private LocalDateTime recordUpdateDate;
}
