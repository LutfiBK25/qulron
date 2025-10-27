package com.qulron.qulron_engine.service;

import com.qulron.qulron_engine.entity.Task;
import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.repository.TaskRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepo taskRepo;

    public Task getTask(Long loadId) {
        return taskRepo.findTop1ByLoadMaster_IdAndTaskStatusInOrderByIdDesc(loadId, List.of(Status.CREATED, Status.STARTED))
                .orElse(null);
    }
}
