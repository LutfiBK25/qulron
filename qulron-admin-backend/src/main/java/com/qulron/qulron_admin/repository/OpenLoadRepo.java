package com.qulron.qulron_admin.repository;

import com.qulron.qulron_admin.entity.OpenLoad;
import com.qulron.qulron_admin.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OpenLoadRepo extends JpaRepository<OpenLoad, Long> {
    Optional<OpenLoad> findByLoadIdAndBrokerName(String loadId, String brokerName);

    Optional<OpenLoad> findByLoadId(String loadId);

    List<OpenLoad> findByLoadStatusOrderByAppointmentDateTimeAsc(Status loadStatus);

    List<OpenLoad> findByLoadStatus(Status loadStatus);
}