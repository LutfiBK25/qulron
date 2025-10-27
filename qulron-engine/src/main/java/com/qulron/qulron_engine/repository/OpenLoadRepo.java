package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.OpenLoad;
import com.qulron.qulron_engine.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OpenLoadRepo extends JpaRepository<OpenLoad, Long> {
    Optional<OpenLoad> findByLoadIdAndLoadStatus(String loadId, Status status);
}
