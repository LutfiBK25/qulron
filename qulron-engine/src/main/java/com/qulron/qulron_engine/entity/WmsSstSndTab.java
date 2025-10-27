package com.qulron.qulron_engine.entity;

import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.utility.StatusConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "t_wms_sst_snd_tab")
@Getter
@Setter
public class WmsSstSndTab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "msg_id")
    private Long id;

    @Column(name = "msg_type", nullable = false, length = 5)
    private String msgType;

    @Column(name = "sender", nullable = false, length = 30)
    private String sender;

    @Column(name = "receiver", nullable = false, length = 30)
    private String receiver;

    @Convert(converter = StatusConverter.class)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "err_text", length = 200)
    private String errorText;

    @Column(name = "warehouse_code", length = 5)
    private String warehouseCode;

    @Column(name = "warehouse", length = 30)
    private String warehouse;

    @Column(name = "load_id", length = 30, nullable = false)
    private String loadId;

    @Column(name = "order_numbers", length = 100)
    private String orderNumbers;

    @Column(name = "broker_name", length = 30)
    private String brokerName;

    @Column(name = "driver_name", length = 30)
    private String driverName;

    @Column(name = "phone_number", length = 12)
    private String phoneNumber;

    @Column(name = "trailer_number", length = 30)
    private String trailerNumber;

    @Column(name = "property_1", length = 200)
    private String property1;

    @Column(name = "property_2", length = 200)
    private String property2;

    @Column(name = "property_3", length = 200)
    private String property3;

    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

    @Column(name = "record_update_id", length = 30)
    private String recordUpdateId;

    @Column(name = "record_update_date")
    private LocalDateTime recordUpdateDate;
}
