package com.qulron.qulron_engine.service;

import com.qulron.qulron_engine.dto.BrokerLoadDTO;
import com.qulron.qulron_engine.entity.*;
import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BrokerService {

    @Value("${app.system-user}")
    private String SYSTEM_USER;


    private final OpenLoadRepo openLoadRepo;
    private final OpenLoadDetailRepo openLoadDetailRepo;
    private final OpenOrderRepo openOrderRepo;
    private final LoadMasterRepo loadMasterRepo;
    private final LoadDetailRepo loadDetailRepo;

    private final OrderRepo orderRepo;

    public BrokerService(OpenLoadRepo openLoadRepo, OpenLoadDetailRepo openLoadDetailRepo, OpenOrderRepo openOrderRepo, LoadMasterRepo loadMasterRepo, LoadDetailRepo loadDetailRepo, OrderRepo orderRepo) {
        this.openLoadRepo = openLoadRepo;
        this.openLoadDetailRepo = openLoadDetailRepo;
        this.openOrderRepo = openOrderRepo;
        this.loadMasterRepo = loadMasterRepo;
        this.loadDetailRepo = loadDetailRepo;
        this.orderRepo = orderRepo;
    }

    // Submit An Order
    @Transactional
    public BrokerLoadDTO submitLoad(BrokerLoadDTO submitReq) {

        BrokerLoadDTO response = new BrokerLoadDTO();

        // Basic Validation
        if (submitReq == null) {
            response.setStatusCode(400);
            response.setMessage("Request cannot be null");
            return response;
        }

        if (submitReq.getOrderNumber() == null || submitReq.getOrderNumber().trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Order number is required");
            return response;
        }

        if (submitReq.getState() == null || submitReq.getState().trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Broker name is required");
            return response;
        }

        if (submitReq.getDriverName() == null || submitReq.getDriverName().trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Driver name is required");
            return response;
        }

        if (submitReq.getPhoneNumber() == null || submitReq.getPhoneNumber().trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Phone number is required");
            return response;
        }

        try {
            // Check if order already in the YMS system
            Optional<OpenLoadDetail> validateOpenOrder = openLoadDetailRepo
                    .findByOrderNumber(submitReq.getOrderNumber());
            if (validateOpenOrder.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Order doesn't exist, If you think this is wrong please contact us");
                response.setMessageCode("Message_Code_2");
                log.info("Order: {} does not exist", submitReq.getOrderNumber());
                return response;
            }

            OpenLoadDetail foundOrder = validateOpenOrder.get();
            if (foundOrder.getOrderStatus() != Status.CREATED) {
                response.setStatusCode(400);
                response.setMessage("Order had been already assigned, If you think this is wrong please contact us");
                response.setMessageCode("Message_Code_3");
                log.info("Order: {} had been already assigned", submitReq.getOrderNumber());
                return response;
            }

            // Check if phone number already has an order attached to it
            Optional<LoadMaster> existingLoadForPhone = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(
                    submitReq.getPhoneNumber(),
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            if (existingLoadForPhone.isPresent()) {
                response.setStatusCode(400);
                response.setMessage(
                        "This phone number already has an active order. Please use a different phone number or contact us if you think this is wrong");
                response.setMessageCode("Message_Code_4");
                log.info("This phone number: {} already has an active order.", submitReq.getPhoneNumber());
                return response;
            }

            // Check if order is in WMS with correct state
            Optional<OpenOrder> openOrder = openOrderRepo.findByOrderNumberAndOrderStatusAndDestState(
                    foundOrder.getOrderNumber(),
                    Status.CREATED,
                    submitReq.getState()
            );
            if (openOrder.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage(
                        "Order number or state is incorrect. Please verify both fields and try again. If you think this is wrong please contact us");
                response.setMessageCode("Message_Code_5");
                return response;
            }

            Optional<OpenLoad> openLoad = openLoadRepo.findByLoadIdAndLoadStatus(foundOrder.getLoadId(), Status.CREATED);
            if (openLoad.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage(
                        "Load is not found, please contact us");
                response.setMessageCode("Message_Code_5");
                return response;
            }

            OpenLoad foundOpenLoad = openLoad.get();

            LoadMaster loadMaster = new LoadMaster();
            loadMaster.setLoadId(foundOpenLoad.getLoadId());
            loadMaster.setLoadStatus(Status.CREATED);
            loadMaster.setBrokerName(foundOpenLoad.getBrokerName());
            loadMaster.setDriverName(submitReq.getDriverName());
            loadMaster.setPhoneNumber(submitReq.getPhoneNumber());
            loadMaster.setAppointmentDateTime(foundOpenLoad.getAppointmentDateTime());
            loadMaster.setPotentialWeight(foundOpenLoad.getPotentialWeight());
            loadMaster.setRecordCreateId(SYSTEM_USER);
            loadMaster.setRecordCreateDate(LocalDateTime.now());

            LoadMaster loadResult = loadMasterRepo.save(loadMaster);

            if (loadResult.getId() > 0) {
                StringBuilder orderNumbers = new StringBuilder();
                List<OpenLoadDetail> openLoadDetailList = openLoadDetailRepo.findByLoadId(loadResult.getLoadId());
                // Go through each and add save LoadDetail Class and Save Order Class
                for (OpenLoadDetail openLoadDetail : openLoadDetailList) {
                    try {
                        // Create LoadDetail entry
                        LoadDetail loadDetail = new LoadDetail();
                        loadDetail.setLoadId(openLoadDetail.getLoadId());
                        loadDetail.setOrderNumber(openLoadDetail.getOrderNumber());
                        loadDetail.setOrderStatus(Status.CREATED);
                        loadDetail.setIsMarriedLoad(openLoadDetail.getIsMarriedLoad());

                        LoadDetail savedLoadDetail = loadDetailRepo.save(loadDetail);

                        if (savedLoadDetail.getId() > 0) {
                            Optional<OpenOrder> openOrderInProcess = openOrderRepo
                                    .findByOrderNumber(savedLoadDetail.getOrderNumber());
                            if (openOrderInProcess.isPresent()) {
                                OpenOrder foundOpenOrder = openOrderInProcess.get();
                                // Create Order entry
                                Order order = new Order();
                                order.setOrderNumber(foundOpenOrder.getOrderNumber());
                                order.setOrderStatus(Status.CREATED);
                                order.setWarehouse(foundOpenOrder.getWarehouse());
                                order.setWarehouse_code(foundOpenOrder.getWarehouse_code());
                                order.setWarehouseAddress(foundOpenOrder.getWarehouseAddress());
                                order.setCustomerName(foundOpenOrder.getCustomerName());
                                order.setDestAddr(foundOpenOrder.getDestAddr());
                                order.setDestCity(foundOpenOrder.getDestCity());
                                order.setDestState(foundOpenOrder.getDestState());
                                order.setDest_zip(foundOpenOrder.getDest_zip());
                                order.setDestCountryCode(foundOpenOrder.getDestCountryCode());
                                order.setRecordCreateId(SYSTEM_USER);
                                order.setRecordCreateDate(LocalDateTime.now());
                                Order savedOrder = orderRepo.save(order);
                                if (savedOrder.getId() <= 0) {
                                    log.error("Failed to save order for order number: {}",
                                            openLoadDetail.getOrderNumber());
                                    throw new RuntimeException("Failed to save order");
                                }
                                orderNumbers.append(savedOrder.getOrderNumber()).append(" ");
                                foundOpenOrder.setOrderStatus(Status.ACTIVATED);
                                openOrderRepo.save(foundOpenOrder);
                            } else {
                                log.error("Failed to save order for order number: {} , it was not found",
                                        openLoadDetail.getOrderNumber());
                                throw new RuntimeException("Failed to save order, order was not found");
                            }

                            // Update OpenLoadDetail status to ACTIVATED
                            openLoadDetail.setOrderStatus(Status.ACTIVATED);
                            openLoadDetailRepo.save(openLoadDetail);


                        } else {
                            log.error("Failed to save load detail for order number: {}",
                                    openLoadDetail.getOrderNumber());
                            throw new RuntimeException("Failed to save load detail");
                        }

                    } catch (Exception e) {
                        log.error("Error processing open load detail for order number: {}",
                                openLoadDetail.getOrderNumber(), e);
                        throw new RuntimeException("Failed to process load detail: " + e.getMessage());
                    }

                }

                foundOpenLoad.setLoadStatus(Status.ACTIVATED);
                openLoadRepo.save(foundOpenLoad);

                // Set success response
                response.setStatusCode(200);
                response.setMessage("Order submitted successfully, Driver can now login using their phone number upon arriving to the facility");
                response.setMessageCode("Message_Code_1");
                log.info("Load: {} with Order Numbers: {} was submitted successfully", loadResult.getLoadId(), orderNumbers);

            } else {
                response.setStatusCode(500);
                response.setMessage("Failed to save load");
            }

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setError("Internal Server Error " + e.getMessage());
            return response;
        }

        return response;
    }
}
