package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.OpenOrder;
import com.qulron.qulron_engine.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OpenOrderRepo extends JpaRepository<OpenOrder, Long> {
    Optional<OpenOrder> findByOrderNumber(String orderNumber);

    Optional<OpenOrder> findByOrderNumberAndOrderStatusAndDestState(String orderNumber, Status status, String destState);
}
