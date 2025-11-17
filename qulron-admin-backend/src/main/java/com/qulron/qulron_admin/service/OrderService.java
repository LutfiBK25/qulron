package com.qulron.qulron_admin.service;

import com.qulron.qulron_admin.dto.ActiveLoadResponseDTO;
import com.qulron.qulron_admin.dto.UnBookedOrderResponseDTO;
import com.qulron.qulron_admin.dto.BookedOrderResponseDTO;
import com.qulron.qulron_admin.entity.*;
import com.qulron.qulron_admin.enums.Status;
import com.qulron.qulron_admin.repository.*;
import com.qulron.qulron_admin.utility.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OrderService {

    private final JWTUtils jwtUtils;
    private final OrderRepo orderRepo;
    private final OpenLoadRepo openLoadRepo;
    private final OpenLoadDetailRepo openLoadDetailRepo;
    private final OpenOrderRepo openOrderRepo;
    private final LoadMasterRepo loadMasterRepo;
    private final LoadDetailRepo loadDetailRepo;

    public OrderService(JWTUtils jwtUtils, OrderRepo orderRepo, OpenLoadRepo openLoadRepo, OpenLoadDetailRepo openLoadDetailRepo, OpenOrderRepo openOrderRepo, LoadMasterRepo loadMasterRepo, LoadDetailRepo loadDetailRepo) {
        this.jwtUtils = jwtUtils;
        this.orderRepo = orderRepo;
        this.openLoadRepo = openLoadRepo;
        this.openLoadDetailRepo = openLoadDetailRepo;
        this.openOrderRepo = openOrderRepo;
        this.loadMasterRepo = loadMasterRepo;
        this.loadDetailRepo = loadDetailRepo;
    }

    public UnBookedOrderResponseDTO getUnBookedOrders(HttpServletRequest request) {
        UnBookedOrderResponseDTO response = new UnBookedOrderResponseDTO();

        try {
            log.info("Request for all unbooked orders");

            // Load IDs where status = CREATED
            List<OpenLoad> openLoads = openLoadRepo.findByLoadStatus(Status.CREATED);

            if (openLoads.isEmpty()) {
                log.info("There are no unbooked orders");
                response.setStatusCode(200);
                response.setMessage("There are currently no unbooked orders");
                return response;
            }

            List<OpenLoadDetail> loadDetails = openLoadDetailRepo.findByOrderStatus(Status.CREATED);
            List<OpenOrder> orders = openOrderRepo.findByOrderStatus(Status.CREATED);

            // Maps for lookup
            Map<String, OpenLoad> loadMap = openLoads.stream()
                    .collect(Collectors.toMap(OpenLoad::getLoadId, l -> l));

            Map<String, OpenOrder> orderMap = orders.stream()
                    .collect(Collectors.toMap(OpenOrder::getOrderNumber, o -> o));

            List<UnBookedOrderResponseDTO.UnbookedOrderInfo> unbookedOrders = new ArrayList<>();

            // Group load details by loadId (like booked orders method)
            Map<String, List<OpenLoadDetail>> loadDetailsMap = loadDetails.stream()
                    .collect(Collectors.groupingBy(OpenLoadDetail::getLoadId));

            for (var entry : loadDetailsMap.entrySet()) {

                String loadId = entry.getKey();
                List<OpenLoadDetail> detailsForLoad = entry.getValue();

                OpenLoad openLoad = loadMap.get(loadId);
                if (openLoad == null) continue;

                // Extract order numbers that exist in orderMap
                List<String> orderNumbers = detailsForLoad.stream()
                        .map(OpenLoadDetail::getOrderNumber)
                        .filter(orderMap::containsKey)
                        .distinct()
                        .toList();

                if (orderNumbers.isEmpty()) continue;

                // Get the first order for warehouse/audit fields
                OpenOrder firstOrder = orderMap.get(orderNumbers.getFirst());

                UnBookedOrderResponseDTO.UnbookedOrderInfo dto =
                        new UnBookedOrderResponseDTO.UnbookedOrderInfo();

                dto.setId(openLoad.getId());
                dto.setLoadId(openLoad.getLoadId());
                dto.setOrderNumbers(String.join(", ", orderNumbers));
                dto.setWarehouse(firstOrder.getWarehouse());
                dto.setWarehouseCode(firstOrder.getWarehouse_code());
                dto.setWarehouseAddress(firstOrder.getWarehouseAddress());
                dto.setOrderStatus(firstOrder.getOrderStatus().name());
                dto.setBrokerName(openLoad.getBrokerName());
                dto.setAppointmentDateTime(openLoad.getAppointmentDateTime());

                unbookedOrders.add(dto);
            }

            // Sort by appointment
            unbookedOrders.sort(
                    Comparator.comparing(UnBookedOrderResponseDTO.UnbookedOrderInfo::getAppointmentDateTime)
            );

            response.setUnbookedOrderInfoList(unbookedOrders);
            response.setStatusCode(200);
            response.setMessage("Unbooked orders retrieved successfully");

        } catch (Exception e) {
            log.error("Error retrieving unbooked orders", e);
            response.setStatusCode(500);
            response.setMessage("Internal Server Error");
        }

        return response;
    }

    public BookedOrderResponseDTO getBookedOrders(HttpServletRequest request) {
        BookedOrderResponseDTO response = new BookedOrderResponseDTO();

        try {
            log.info("Request for all booked orders");

            // Get all loads with CREATED, ACTIVATED, STARTED statuses
            List<LoadMaster> loadMasters = loadMasterRepo.findByLoadStatusIn(
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            if (loadMasters.isEmpty()) {
                log.info("There are no booked orders");
                response.setStatusCode(200);
                response.setMessage("No Booked Orders Found");
                return response;
            }

            List<LoadDetail> loadDetails = loadDetailRepo.findByOrderStatusIn(
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            List<Order> orders = orderRepo.findByOrderStatusIn(
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            // Maps for quick lookup
            Map<String, LoadMaster> loadMap = loadMasters.stream()
                    .collect(Collectors.toMap(LoadMaster::getLoadId, lm -> lm));

            Map<String, Order> orderMap = orders.stream()
                    .collect(Collectors.toMap(Order::getOrderNumber, o -> o));

            List<BookedOrderResponseDTO.CurrentOrderInfo> bookedLoads = new ArrayList<>();

            // Group LoadDetails by loadId
            Map<String, List<LoadDetail>> loadDetailsMap = loadDetails.stream()
                    .collect(Collectors.groupingBy(LoadDetail::getLoadId));

            // Process each load
            for (var entry : loadDetailsMap.entrySet()) {

                String loadId = entry.getKey();
                List<LoadDetail> detailsForLoad = entry.getValue();
                LoadMaster loadMaster = loadMap.get(loadId);

                if (loadMaster == null) continue;

                // Default coordinates if null
                if (loadMaster.getLastDriverLatitude() == null || loadMaster.getLastDriverLongitude() == null) {
                    loadMaster.setLastDriverLatitude(BigDecimal.ZERO);
                    loadMaster.setLastDriverLongitude(BigDecimal.ZERO);
                }

                // Extract distinct order numbers for this load
                List<String> orderNumbers = detailsForLoad.stream()
                        .map(LoadDetail::getOrderNumber)
                        .filter(orderMap::containsKey)
                        .distinct()
                        .toList();

                if (orderNumbers.isEmpty()) continue;

                // Pick *any order* for warehouse + audit details
                // (all orders in the load generally share same warehouse)
                Order firstOrder = orderMap.get(orderNumbers.getFirst());

                BookedOrderResponseDTO.CurrentOrderInfo dto = new BookedOrderResponseDTO.CurrentOrderInfo();
                dto.setId(loadMaster.getId());
                dto.setOrderNumbers(String.join(", ", orderNumbers));
                dto.setLoadId(loadId);
                dto.setWarehouse(firstOrder.getWarehouse());
                dto.setWarehouseCode(firstOrder.getWarehouse_code());
                dto.setWarehouseAddress(firstOrder.getWarehouseAddress());
                dto.setOrderStatus(firstOrder.getOrderStatus().name());
                dto.setBrokerName(loadMaster.getBrokerName());
                dto.setDriverName(loadMaster.getDriverName());
                dto.setPhoneNumber(loadMaster.getPhoneNumber());
                dto.setAppointmentDateTime(loadMaster.getAppointmentDateTime());
                dto.setRecordCreateId(firstOrder.getRecordCreateId());
                dto.setRecordCreateDate(firstOrder.getRecordCreateDate());
                dto.setRecordUpdateId(firstOrder.getRecordUpdateId());
                dto.setRecordUpdateDate(firstOrder.getRecordUpdateDate());

                bookedLoads.add(dto);
            }

            response.setStatusCode(200);
            response.setMessage("Success");
            response.setBookedOrders(bookedLoads);
            return response;

        } catch (Exception ex) {
            log.error("Error retrieving booked orders", ex);
            response.setStatusCode(500);
            response.setMessage("Internal Server Error");
            return response;
        }
    }

    public BookedOrderResponseDTO clearOrderSubmission(HttpServletRequest request, Long Id) {
        BookedOrderResponseDTO response = new BookedOrderResponseDTO();
        try {
            String token = jwtUtils.extractToken(request);
            if (token == null) {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing or invalid");
                return response;
            }

            String username = jwtUtils.extractUsername(token);

            Optional<Order> order = orderRepo.findById(Id);
            if (order.isPresent()) {
                Order foundOrder = order.get();

                if (foundOrder.getOrderStatus() == Status.CREATED) {
                    // Find Load Id Using Load Detail
                    List<LoadDetail> loadDetails = loadDetailRepo.findByOrderNumber(foundOrder.getOrderNumber());

                    if (!loadDetails.isEmpty()) {
                        LoadDetail loadDetail = loadDetails.getFirst();
                        String loadId = loadDetail.getLoadId();

                        // Find all orders for this load
                        List<LoadDetail> allLoadDetails = loadDetailRepo.findByLoadId(loadId);
                        List<String> orderNumbers = allLoadDetails.stream()
                                .map(LoadDetail::getOrderNumber)
                                .collect(Collectors.toList());

                        List<Order> allOrders = orderRepo.findByOrderNumberIn(orderNumbers);

                        // Find the LoadMaster
                        Optional<LoadMaster> loadMasterOpt = loadMasterRepo.findByLoadId(loadId);

                        // Update all orders to CANCELLED
                        for (Order orderToUpdate : allOrders) {
                            orderToUpdate.setOrderStatus(Status.CANCELLED);
                            orderToUpdate.setRecordUpdateId(username);
                            orderToUpdate.setRecordUpdateDate(LocalDateTime.now());
                            orderRepo.save(orderToUpdate);
                        }

                        // Update LoadMaster to CANCELLED
                        if (loadMasterOpt.isPresent()) {
                            LoadMaster loadMaster = loadMasterOpt.get();
                            loadMaster.setLoadStatus(Status.CANCELLED);
                            loadMaster.setRecordUpdateId(username);
                            loadMaster.setRecordUpdateDate(LocalDateTime.now());
                            loadMasterRepo.save(loadMaster);
                        }

                        // Update all LoadDetails to CANCELLED
                        for (LoadDetail detail : allLoadDetails) {
                            detail.setOrderStatus(Status.CANCELLED);
                            loadDetailRepo.save(detail);
                        }

                        // Find and update OpenOrder, OpenLoad, OpenLoadDetail to CREATED
                        List<OpenOrder> openOrders = openOrderRepo.findByOrderNumberIn(orderNumbers);
                        for (OpenOrder openOrder : openOrders) {
                            openOrder.setOrderStatus(Status.CREATED);
                            openOrder.setRecordUpdateId(username);
                            openOrder.setRecordUpdateDate(LocalDateTime.now());
                            openOrderRepo.save(openOrder);
                        }

                        // Find OpenLoad
                        Optional<OpenLoad> openLoadOpt = openLoadRepo.findByLoadId(loadId);
                        if (openLoadOpt.isPresent()) {
                            OpenLoad openLoad = openLoadOpt.get();
                            openLoad.setLoadStatus(Status.CREATED);
                            openLoad.setRecordUpdateId(username);
                            openLoad.setRecordUpdateDate(LocalDateTime.now());
                            openLoadRepo.save(openLoad);
                        }

                        // Find and update OpenLoadDetails
                        List<OpenLoadDetail> openLoadDetails = openLoadDetailRepo.findByLoadId(loadId);
                        for (OpenLoadDetail openLoadDetail : openLoadDetails) {
                            openLoadDetail.setOrderStatus(Status.CREATED);
                            openLoadDetailRepo.save(openLoadDetail);
                        }

                        response.setStatusCode(200);
                        response.setMessage("Order cancelled successfully");
                    } else {
                        response.setStatusCode(404);
                        response.setMessage("Load details not found for this order");
                    }
                } else {
                    response.setStatusCode(404);
                    response.setMessage("Invalid Order To Delete, Driver is in the facility");
                }
            } else {
                response.setStatusCode(404);
                response.setMessage("Invalid Order");
            }
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Internal Error : " + e.getMessage());
        }
        return response;
    }

    public ActiveLoadResponseDTO getActiveLoads(HttpServletRequest request) {
        ActiveLoadResponseDTO response = new ActiveLoadResponseDTO();
        try {
            log.info("Request for all active orders");
            // Get all loads with CREATED, ACTIVATED, STARTED statuses
            List<LoadMaster> loadMasters = loadMasterRepo.findByLoadStatusIn(
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            if (loadMasters.isEmpty()) {
                log.info("There is no active orders");
                response.setStatusCode(200);
                response.setMessage("There is currently no live orders");
                return response;
            } else {
                response.setStatusCode(404);
                response.setMessage("No Booked Orders Found");
            }
            List<LoadDetail> loadDetails = loadDetailRepo.findByOrderStatusIn(
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));
            List<Order> orders = orderRepo.findByOrderStatusIn(
                    List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            // Create maps for fast lookup
            Map<String, LoadMaster> loadMap = loadMasters.stream()
                    .collect(Collectors.toMap(LoadMaster::getLoadId, load -> load));

            Map<String, Order> orderMap = orders.stream()
                    .collect(Collectors.toMap(Order::getOrderNumber, order -> order));

            List<ActiveLoadResponseDTO.ActiveLoadInfo> bookedLoads = new ArrayList<>();

            // Group load details by loadId to collect all order numbers for each load
            Map<String, List<LoadDetail>> loadDetailsMap = loadDetails.stream()
                    .collect(Collectors.groupingBy(LoadDetail::getLoadId));

            // Now process each unique load
            for (Map.Entry<String, List<LoadDetail>> entry : loadDetailsMap.entrySet()) {
                String loadId = entry.getKey();
                List<LoadDetail> loadDetailsForLoad = entry.getValue();
                LoadMaster loadMaster = loadMap.get(loadId);

                if (loadMaster != null) {
                    // Set default coordinates if null
                    if (loadMaster.getLastDriverLatitude() == null || loadMaster.getLastDriverLongitude() == null) {
                        loadMaster.setLastDriverLatitude(BigDecimal.valueOf(0));
                        loadMaster.setLastDriverLongitude(BigDecimal.valueOf(0));
                    }

                    // Collect all order numbers for this load and join them with commas
                    List<String> orderNumbersForLoad = loadDetailsForLoad.stream()
                            .map(LoadDetail::getOrderNumber)
                            .filter(orderMap::containsKey)
                            .distinct()
                            .collect(Collectors.toList());

                    if (!orderNumbersForLoad.isEmpty()) {
                        ActiveLoadResponseDTO.ActiveLoadInfo loadInfo = new ActiveLoadResponseDTO.ActiveLoadInfo();
                        loadInfo.setLoadId(loadId);
                        loadInfo.setOrderNumbers(String.join(", ", orderNumbersForLoad));
                        loadInfo.setDriverName(loadMaster.getDriverName());
                        loadInfo.setPhoneNumber(loadMaster.getPhoneNumber());
                        loadInfo.setLatitude(loadMaster.getLastDriverLatitude());
                        loadInfo.setLongitude(loadMaster.getLastDriverLongitude());

                        bookedLoads.add(loadInfo);
                    }
                }
            }

            response.setActiveLoadInfoList(bookedLoads);
            response.setStatusCode(200);
            response.setMessage("Live orders retrieved successfully");
            log.info("Live orders retrieved successfully");

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Internal Server Error " + e.getMessage());
        }
        return response;
    }

}
