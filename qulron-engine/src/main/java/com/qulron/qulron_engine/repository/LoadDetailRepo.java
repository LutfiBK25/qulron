package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.LoadDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoadDetailRepo extends JpaRepository<LoadDetail, Long> {
    List<LoadDetail> findByLoadId(String loadId);
}
