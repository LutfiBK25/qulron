package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.LoadMaster;
import com.qulron.qulron_engine.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoadMasterRepo extends JpaRepository<LoadMaster, Long> {
    Optional<LoadMaster> findByPhoneNumberAndLoadStatusIn(String phoneNumber, List<Status> statuses);
}
