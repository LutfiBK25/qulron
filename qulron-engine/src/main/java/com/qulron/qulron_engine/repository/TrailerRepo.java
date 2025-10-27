package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.Trailer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrailerRepo extends JpaRepository<Trailer, Long> {
    Optional<Trailer> findByLoadMaster_Id(Long loadId);

}
