package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.Task;
import com.qulron.qulron_engine.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepo extends JpaRepository<Task, Long> {
    Optional<Task> findByLoadMaster_Id(Long loadId);

    // Find top 1 task by LoadMaster id and list of statuses
    Optional<Task> findTop1ByLoadMaster_IdAndTaskStatusInOrderByIdDesc(Long loadMasterId, List<Status> statuses);

    //Find top 1 task by LoadMaster id and single status
    Optional<Task> findTop1ByLoadMaster_IdAndTaskStatusOrderByIdDesc(Long loadMasterId, Status status);
}
