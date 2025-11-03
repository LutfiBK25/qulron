package com.qulron.qulron_admin.repository;

import com.qulron.qulron_admin.entity.OpenLoadDetail;
import com.qulron.qulron_admin.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OpenLoadDetailRepo extends JpaRepository<OpenLoadDetail, Long> {
    Optional<OpenLoadDetail> findByOrderNumber(String orderNumber);

    List<OpenLoadDetail> findByLoadId(String loadId);

    List<OpenLoadDetail> findByOrderStatus(Status orderStatus);
}
