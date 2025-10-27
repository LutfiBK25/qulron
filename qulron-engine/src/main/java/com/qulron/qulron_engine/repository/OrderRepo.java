package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.Order;
import com.qulron.qulron_engine.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepo extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);

    // Optional<Order> findByPhoneNumberAndOrderStatusIn(String phoneNumber, List<Status> statuses);

    // Find all orders by status
    List<Order> findByOrderStatus(Status status);

    // Find all orders by multiple statuses
    List<Order> findByOrderStatusIn(List<Status> statuses);
}
