package com.qulron.qulron_admin.repository;

import com.qulron.qulron_admin.entity.LoadMaster;
import com.qulron.qulron_admin.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoadMasterRepo extends JpaRepository<LoadMaster, Long> {
    List<LoadMaster> findByLoadStatusIn(List<Status> statuses);
    Optional<LoadMaster> findByLoadIdAndLoadStatusIn(String loadId, List<Status> loadStatuses);

}
