package com.qulron.qulron_engine.repository;

import com.qulron.qulron_engine.entity.WmsSstSndTab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WmsSstSndTabRepo extends JpaRepository<WmsSstSndTab, Long> {
}
