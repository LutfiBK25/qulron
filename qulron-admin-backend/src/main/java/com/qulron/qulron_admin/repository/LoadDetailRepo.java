package com.qulron.qulron_admin.repository;

import com.qulron.qulron_admin.entity.LoadDetail;
import com.qulron.qulron_admin.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoadDetailRepo extends JpaRepository<LoadDetail, Long> {
    List<LoadDetail> findByOrderStatusIn(List<Status> orderStatuses);
    List<LoadDetail> findByLoadIdAndOrderStatusIn(String loadId, List<Status> orderStatuses);
}
