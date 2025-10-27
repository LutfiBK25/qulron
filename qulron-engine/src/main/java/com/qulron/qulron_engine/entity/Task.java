package com.qulron.qulron_engine.entity;

import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.utility.StatusConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "t_task")
@Getter
@Setter
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "lm_id", referencedColumnName = "lm_id")
    private LoadMaster loadMaster;

    @Convert(converter = StatusConverter.class)
    @Column(name = "status", nullable = false)
    private Status taskStatus;

    @Column(name = "destination_area", nullable = false, length = 5)
    private String destinationArea;

    @Column(name = "destination_location", nullable = false, length = 30)
    private String destinationLocation;

    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

    @Column(name = "record_update_id", length = 30)
    private String recordUpdateId;

    @Column(name = "record_update_date")
    private LocalDateTime recordUpdateDate;

}
