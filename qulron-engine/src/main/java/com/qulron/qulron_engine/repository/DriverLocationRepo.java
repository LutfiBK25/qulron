package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverLocationRepo extends JpaRepository<DriverLocation, Long> {
}