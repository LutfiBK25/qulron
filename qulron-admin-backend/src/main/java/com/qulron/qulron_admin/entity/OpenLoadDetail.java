package com.qulron.qulron_admin.entity;

import com.qulron.qulron_admin.enums.Status;
import com.qulron.qulron_admin.utility.StatusConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "t_open_load_detail")
@Getter
@Setter
public class OpenLoadDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "old_id")
    private Long id;

    @Column(name = "load_id", nullable = false, length = 30)
    private String loadId;

    @Column(name = "order_number", nullable = false, length = 30)
    private String orderNumber;

    @Convert(converter = StatusConverter.class)
    @Column(name = "status", nullable = false)
    private Status orderStatus;

    @Column(name = "is_married_load")
    private Boolean isMarriedLoad = false;
}
