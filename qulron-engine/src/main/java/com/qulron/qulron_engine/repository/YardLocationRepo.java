package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.YardLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface YardLocationRepo extends JpaRepository<YardLocation, Long> {
    Optional<YardLocation> findByTaskDestinationAreaAndTaskDestinationLocation(String taskDestinationArea, String taskDestinationLocation);


}
