package com.qulron.qulron_admin.repository;

import com.qulron.qulron_admin.entity.OpenOrder;
import com.qulron.qulron_admin.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OpenOrderRepo extends JpaRepository<OpenOrder, Long> {
    Optional<OpenOrder> findByOrderNumber(String orderNumber);

    List<OpenOrder> findByOrderStatus(Status orderStatus);

    List<OpenOrder> findByOrderNumberIn(List<String> orderNumbers);
}
