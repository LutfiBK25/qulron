package com.qulron.qulron_admin.repository;

import com.qulron.qulron_admin.entity.Order;
import com.qulron.qulron_admin.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepo extends JpaRepository<Order, Long> {
    // Find all orders by multiple statuses
    List<Order> findByOrderStatusIn(List<Status> statuses);

    // Find all orders by multiple order numbers
    List<Order> findByOrderNumberInAndOrderStatus(List<String> orderNumbers, Status status);

}