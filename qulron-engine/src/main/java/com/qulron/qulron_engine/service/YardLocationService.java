package com.qulron.qulron_engine.service;

import com.qulron.qulron_engine.entity.YardLocation;
import com.qulron.qulron_engine.repository.YardLocationRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class YardLocationService {

    @Autowired
    private YardLocationRepo yardLocationRepo;

    public YardLocation getYardLocationData(String taskWarehouseCode, String taskLocation) {
        return yardLocationRepo.findByTaskDestinationAreaAndTaskDestinationLocation(taskWarehouseCode, taskLocation)
                .orElse(null);
    }
}
