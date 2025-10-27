package com.qulron.qulron_engine.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "t_trailer")
@Getter
@Setter
public class Trailer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trailer_id")
    private Long id;

    @Column(name = "trailer_number", nullable = false, length = 30)
    private String TrailerNumber;

    @OneToOne
    @JoinColumn(name = "lm_id", referencedColumnName = "lm_id")
    private LoadMaster loadMaster;

    @Column(name = "record_create_id", nullable = false, length = 30)
    private String recordCreateId;

    @Column(name = "record_create_date", nullable = false)
    private LocalDateTime recordCreateDate;

    @Column(name = "record_update_id", length = 30)
    private String recordUpdateId;

    @Column(name = "record_update_date")
    private LocalDateTime recordUpdateDate;

}
