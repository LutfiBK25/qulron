package com.qulron.qulron_engine.service;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.qulron.qulron_engine.dto.*;
import com.qulron.qulron_engine.entity.*;
import com.qulron.qulron_engine.enums.Role;
import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.repository.*;
import com.qulron.qulron_engine.utility.DeviceFingerprintUtils;
import com.qulron.qulron_engine.utility.JWTUtils;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DriverService {

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
    // In-memory storage for verification codes and rate limiting
    private final Cache<String, String> verificationCodes = CacheBuilder.newBuilder().expireAfterWrite(10, TimeUnit.MINUTES).maximumSize(10_000).build();
    private final Cache<String, Integer> loginAttempts = CacheBuilder.newBuilder().expireAfterWrite(15, TimeUnit.MINUTES).maximumSize(10_000).build();
    private final Cache<String, Long> lastAttemptTime = CacheBuilder.newBuilder().expireAfterWrite(15, TimeUnit.MINUTES).maximumSize(10_000).build();
    private final LoadMasterRepo loadMasterRepo;
    private final LoadDetailRepo loadDetailRepo;
    private final OrderRepo orderRepo;
    private final TrailerRepo trailerRepo;
    private final WmsSstSndTabRepo wmsSstSndTabRepo;
    private final JWTUtils jwtUtils;
    private final DeviceFingerprintUtils deviceFingerprintUtils;
    private final TrailerService trailerService;
    private final TaskService taskService;
    private final YardLocationService yardLocationService;
    @Value("${app.system-user}")
    private String SYSTEM_USER;
    @Value("${twilio.account.sid}")
    private String TWILIO_ACCOUNT_SID;
    @Value("${twilio.auth.token}")
    private String TWILIO_AUTH_TOKEN;
    @Value("${twilio.account.phone}")
    private String TWILIO_PHONE;
    private static final double[][] FACILITY_BOUNDARY = {
            {40.52302959924054, -74.32324877112171}, // Point 1
            {40.523202602650116, -74.32639714054851}, // Point 2
            {40.522228010948794, -74.32654886919558}, // Point 3
            {40.52255095415221, -74.3299172453026}, // Point 4
            {40.51962710810491, -74.3305014006403}, // Point 5
            {40.5191945756738, -74.3267461166252}, // Point 6
            {40.51901579475845, -74.32685232666907}, // Point 7
            {40.51868130020615, -74.32425018037173}, // Point 8
            {40.52066517452486, -74.32373430297169}, // Point 9
            {40.5205556016006, -74.32201976919733}, // Point 10
            {40.51801230609231, -74.32154182395904}, // Point 11
            {40.518219925668284, -74.32056317406513}, // Point 12
            {40.520930455590985, -74.32133699016521}, // Point 13
            {40.52114383308044, -74.32358257414191}, // Point 14
            {40.52298923171724, -74.32334739472645}  // Point 15
    };

    public DriverService(LoadMasterRepo loadMasterRepo, LoadDetailRepo loadDetailRepo, OrderRepo orderRepo, TrailerRepo trailerRepo, WmsSstSndTabRepo wmsSstSndTabRepo, JWTUtils jwtUtils, DeviceFingerprintUtils deviceFingerprintUtils, TrailerService trailerService, TaskService taskService, YardLocationService yardLocationService) {
        this.loadMasterRepo = loadMasterRepo;
        this.loadDetailRepo = loadDetailRepo;
        this.orderRepo = orderRepo;
        this.trailerRepo = trailerRepo;
        this.wmsSstSndTabRepo = wmsSstSndTabRepo;
        this.jwtUtils = jwtUtils;
        this.deviceFingerprintUtils = deviceFingerprintUtils;
        this.trailerService = trailerService;
        this.taskService = taskService;
        this.yardLocationService = yardLocationService;
    }

    private static WmsSstSndTab getWmsSstSndTab(LoadMaster foundLoad, String orderNumbers, Trailer founderTrailer, String SYSTEM_USER) {
        WmsSstSndTab msg = new WmsSstSndTab();
        msg.setMsgType("ADD01");
        msg.setSender("YMS");
        msg.setReceiver("WMS");
        msg.setStatus(Status.CREATED);
        msg.setLoadId(foundLoad.getLoadId());
        msg.setOrderNumbers(orderNumbers);
        msg.setBrokerName(foundLoad.getBrokerName());
        msg.setDriverName(foundLoad.getDriverName());
        msg.setPhoneNumber(foundLoad.getPhoneNumber());
        msg.setTrailerNumber(founderTrailer.getTrailerNumber());
        msg.setRecordCreateId(SYSTEM_USER);
        msg.setRecordCreateDate(LocalDateTime.now());
        return msg;
    }

    // Request verification code
    public DriverAuthDTO requestVerificationCode(String phoneNumber) {
        log.info("Verification code requested for phone: {}", phoneNumber);

        DriverAuthDTO response = new DriverAuthDTO();

        // Basic validation
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Phone number is required");
            response.setMessageCode("Message_Code_13");
            return response;
        }
        // Format validation - must be XXX-XXX-XXXX
        String phoneRegex = "^\\d{3}-\\d{3}-\\d{4}$";
        if (!phoneNumber.matches(phoneRegex)) {
            response.setStatusCode(400);
            response.setMessage("Phone number must be in format: XXX-XXX-XXXX (e.g., 201-341-2426)");
            response.setMessageCode("Message_Code_14");
            return response;
        }

        // Check rate limiting
        if (isRateLimited(phoneNumber)) {
            log.warn("Too many login attempts for phone: {}. Please try again in 15 minutes.", phoneNumber);
            response.setStatusCode(429);
            response.setMessage("Too many login attempts. Please try again in 15 minutes.");
            response.setMessageCode("Message_Code_15");
            return response;
        }

        // Check if phone number already has an order with NEW or ACTIVE status
        Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(phoneNumber, List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

        if (loadMaster.isEmpty()) {
            log.warn("No active order found for phone: {}", phoneNumber);

            response.setStatusCode(400);
            response.setMessage("No active order found for this phone number. Please contact your broker or use a different phone number.");
            response.setMessageCode("Message_Code_16");
            return response;
        }

        // Generate verification code (6 digits)
        String verificationCode = generateVerificationCode();
        verificationCodes.put(phoneNumber, verificationCode);

        // Format phone number for Twilio
        String formattedPhoneNumber = formatPhoneNumberForTwilio(phoneNumber);

         Twilio.init(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
         Message.creator(
         new PhoneNumber(formattedPhoneNumber),
         new PhoneNumber(TWILIO_PHONE),
         "Welcome to Arizona Beverages,Your Verification code: " + verificationCode)
         .create();

        response.setStatusCode(200);
        response.setMessage("Verification code sent to your phone number");
        response.setMessageCode("Message_Code_17");
        response.setPhoneNumber(phoneNumber);

        log.info("Verification code sent successfully to: {}", phoneNumber);
        return response;
    }

    // Verify code and login
    public DriverAuthDTO verifyCodeAndLogin(HttpServletRequest request, String phoneNumber, String verificationCode) {
        log.info("Login attempt for phone: {}", phoneNumber);

        DriverAuthDTO response = new DriverAuthDTO();

        // Basic validation
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Phone number is required");
            response.setMessageCode("Message_Code_13");
            return response;
        }

        // Add this after basic validation
        String phoneRegex = "^\\d{3}-\\d{3}-\\d{4}$";
        if (!phoneNumber.matches(phoneRegex)) {
            response.setStatusCode(400);
            response.setMessage("Phone number must be in format: XXX-XXX-XXXX (e.g., 201-341-2426)");
            response.setMessageCode("Message_Code_14");
            return response;
        }

        if (verificationCode == null || verificationCode.trim().isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("Verification code is required");
            response.setMessageCode("Message_Code_18");
            return response;
        }

        // Check rate limiting
        if (isRateLimited(phoneNumber)) {
            response.setStatusCode(429);
            response.setMessage("Too many login attempts. Please try again in 15 minutes.");
            response.setMessageCode("Message_Code_15");
            return response;
        }

        // Verify the code
        String storedCode = verificationCodes.getIfPresent(phoneNumber);
        if (storedCode == null || !storedCode.equals(verificationCode)) {
            log.warn("Invalid verification code for phone: {}", phoneNumber);

            incrementLoginAttempts(phoneNumber);
            response.setStatusCode(401);
            response.setMessage("Invalid verification code. Please check the code and try again.");
            response.setMessageCode("Message_Code_19");
            return response;
        }

        // Get order details
        Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(phoneNumber, List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

        if (loadMaster.isEmpty()) {
            response.setStatusCode(404);
            response.setMessage("No active order found for this phone number.");
            response.setMessageCode("Message_Code_16");
            return response;
        }

        // Clear verification code and login attempts on successful login
        verificationCodes.invalidate(phoneNumber);
        loginAttempts.invalidate(phoneNumber);
        lastAttemptTime.invalidate(phoneNumber);

        try {
            // Generate device fingerprint and location for mobile-friendly authentication
            String deviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
            String location = deviceFingerprintUtils.extractLocation(request);
            var jwt = jwtUtils.generateToken(phoneNumber, Role.DRIVER, deviceFingerprint, location);

            LoadMaster foundLoadMaster = loadMaster.get();

            TrailerDTO trailer = trailerService.trailerCheckOnLogin(foundLoadMaster.getId());

            response.setHasTrailer(trailer.isHasTrailer());

            response.setToken(jwt);
            response.setStatusCode(200);
            response.setMessage("Login successful");
            response.setDriverName(foundLoadMaster.getDriverName());
            log.info("Successful login for phone: {} from device: {}", phoneNumber, deviceFingerprint);

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setError("Internal Server Error " + e.getMessage());
        }

        return response;
    }

    @Transactional
    public DriverArrivalResponseDTO submitArrival(HttpServletRequest request, DriverArrivalRequestDTO driverArrivalRequestDTO) {
        DriverArrivalResponseDTO response = new DriverArrivalResponseDTO();
        try {
            String token = extractToken(request);
            if (token == null) {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing");
                response.setMessageCode("Message_Code_6");
                return response;
            }

            String phoneNumber = jwtUtils.extractPhoneNumber(token);

            // Mobile-friendly token validation with device fingerprinting
            String currentDeviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
            String currentLocation = deviceFingerprintUtils.extractLocation(request);

            if (!jwtUtils.isTokenValid(token, phoneNumber, currentDeviceFingerprint, currentLocation)) {
                response.setStatusCode(401);
                response.setMessage("Invalid or expired token");
                response.setMessageCode("Message_Code_20");
                log.warn("Invalid token for arrival submission by phone: {} from device: {}", phoneNumber, currentDeviceFingerprint);
                return response;
            }

            if(driverArrivalRequestDTO.isLocationTracking()){
                if (!isDriverInsideFacilityBoundary(driverArrivalRequestDTO.getDriverLat(),driverArrivalRequestDTO.getDriverLng())){
                    response.setStatusCode(400);
                    response.setMessage("Driver is not within the facility");
                    response.setMessageCode("Message_Code_25");
                    return response;
                }

            }

            // Get load details
            Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(phoneNumber, List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            if (loadMaster.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("This phone number has no current order. Please use a different phone number or contact us if you think this is wrong");
                response.setMessageCode("Message_Code_16");
                return response;
            }

            LoadMaster foundLoadMaster = loadMaster.get();

            boolean isDriverHere = foundLoadMaster.getLoadStatus() != Status.CREATED && foundLoadMaster.getLoadStatus() != Status.CANCELLED;

            if (isDriverHere) {
                response.setStatusCode(400);
                response.setMessage("Driver has already confirmed to be here");
                response.setMessageCode("Message_Code_22");
                return response;
            }

            List<LoadDetail> loadDetailList = loadDetailRepo.findByLoadId(foundLoadMaster.getLoadId());
            if (loadDetailList.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("No Orders Found in the load, Please contact Us");
                response.setMessageCode("Message_Code_21");
            }

            Optional<Trailer> trailer = trailerRepo.findByLoadMaster_Id(foundLoadMaster.getId());
            if (trailer.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Arrival can't be submitted without a trailer entered. Please use a different phone number or contact us if you think this is wrong");
                response.setMessageCode("Message_Code_23");
                return response;
            }

            Trailer foundTrailer = trailer.get();

            foundLoadMaster.setLoadStatus(Status.ACTIVATED);
            foundLoadMaster.setRecordUpdateId(SYSTEM_USER);
            foundLoadMaster.setRecordUpdateDate(LocalDateTime.now());
            LoadMaster loadResult = loadMasterRepo.save(foundLoadMaster);
            if (loadResult.getId() > 0) {
                StringBuilder orderNumbers = new StringBuilder();
                for (LoadDetail loadDetail : loadDetailList) {
                    loadDetail.setOrderStatus(Status.ACTIVATED);
                    LoadDetail savedLoadDetail = loadDetailRepo.save(loadDetail);

                    if (savedLoadDetail.getId() > 0) {
                        Optional<Order> order = orderRepo.findByOrderNumber(savedLoadDetail.getOrderNumber());
                        if (order.isEmpty()) {
                            log.error("Failed to save order for order number: {} , it was not found", loadDetail.getOrderNumber());
                            throw new RuntimeException("Failed to save order, order was not found");
                        }
                        Order foundOrder = new Order();
                        foundOrder = order.get();
                        foundOrder.setOrderStatus(Status.ACTIVATED);
                        foundOrder.setRecordUpdateId(SYSTEM_USER);
                        foundOrder.setRecordUpdateDate(LocalDateTime.now());
                        Order savedOrder = orderRepo.save(foundOrder);
                        orderNumbers.append(savedOrder.getOrderNumber()).append(" ");
                        if (savedOrder.getId() <= 0) {
                            log.error("Failed to save order for order number: {}", foundOrder.getOrderNumber());
                            throw new RuntimeException("Failed to save order");
                        }

                    } else {
                        log.error("Failed to save load detail for order number: {}", loadDetail.getOrderNumber());
                        throw new RuntimeException("Failed to save load detail");
                    }

                }

                WmsSstSndTab msg = getWmsSstSndTab(foundLoadMaster, String.valueOf(orderNumbers), foundTrailer, SYSTEM_USER);
                WmsSstSndTab result = wmsSstSndTabRepo.save(msg);

                if (result.getId() <= 0) {
                    log.error("Failed to send message to HighJump for load number: {}", foundLoadMaster.getLoadId());
                    throw new RuntimeException("Failed to submit arrival for order");
                }

                response.setStatusCode(200);
                response.setMessage("Arrival Confirmed");
                log.info("Arrival confirmed for phone: {} from device: {}", phoneNumber, currentDeviceFingerprint);

            } else {
                log.error("Failed to save load detail for load number: {}", foundLoadMaster.getLoadId());
                throw new RuntimeException("Failed to save load detail");
            }

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
            response.setMessageCode("Message_Code_24");
            log.error("Error submitting arrival", e);
            throw new RuntimeException("Failed to process load : " + e.getMessage());
        }
        return response;
    }

    private boolean isDriverInsideFacilityBoundary(double driverLat, double driverLng) {
        boolean isInside = false;
        int prev = FACILITY_BOUNDARY.length - 1;

        for (int i = 0; i < FACILITY_BOUNDARY.length; i++) {
            double currentLat = FACILITY_BOUNDARY[i][0];
            double currentLng = FACILITY_BOUNDARY[i][1];
            double prevLat = FACILITY_BOUNDARY[prev][0];
            double prevLng = FACILITY_BOUNDARY[prev][1];

            // Ray casting algorithm
            boolean intersects = ((currentLat > driverLat) != (prevLat > driverLat)) &&
                    (driverLng < (prevLng - currentLng) * (driverLat - currentLat) /
                            (prevLat - currentLat) + currentLng);

            if (intersects) {
                isInside = !isInside;
            }
            prev = i;
        }
        return isInside;
    }

    public DriverDashboardDataDTO getDashboardData(HttpServletRequest request) {
        DriverDashboardDataDTO response = new DriverDashboardDataDTO();
        try {
            String token = extractToken(request);
            if (token == null) {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing");
                response.setMessageCode("Message_Code_6");
                return response;
            }

            String phoneNumber = jwtUtils.extractPhoneNumber(token);

            // Mobile-friendly token validation with device fingerprinting
            String currentDeviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
            String currentLocation = deviceFingerprintUtils.extractLocation(request);

            if (!jwtUtils.isTokenValid(token, phoneNumber, currentDeviceFingerprint, currentLocation)) {
                response.setStatusCode(401);
                response.setMessage("Invalid or expired token");
                response.setMessageCode("Message_Code_20");
                log.warn("Invalid token for dashboard access by phone: {} from device: {}", phoneNumber, currentDeviceFingerprint);
                return response;
            }

            Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(phoneNumber, List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));
            if (loadMaster.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("This phone number has no current order. Please use a different phone number or contact us if you think this is wrong");
                response.setMessageCode("Message_Code_16");
                return response;
            }
            LoadMaster foundLoad = loadMaster.get();

            List<LoadDetail> loadDetailList = loadDetailRepo.findByLoadId(foundLoad.getLoadId());
            if (loadDetailList.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("No Orders Found in the load, Please contact Us");
                response.setMessageCode("Message_Code_21");
            }

            // Get order numbers as comma-separated string
            String orderNumbers = loadDetailList.stream().map(LoadDetail::getOrderNumber).collect(Collectors.joining(", "));

            LoadDetail firstLoadDetail = loadDetailList.getFirst();

            Optional<Order> firstOrder = orderRepo.findByOrderNumber(firstLoadDetail.getOrderNumber());
            if (firstOrder.isEmpty()) {
                log.error("Failed to find order for order number: {} , it was not found", firstLoadDetail.getOrderNumber());
                throw new RuntimeException("Failed to save order, order was not found");
            }
            Order foundFirstOrder = firstOrder.get();
            String destinationWarehouse = foundFirstOrder.getWarehouse();
            String warehouseAddress = foundFirstOrder.getWarehouseAddress();

            Optional<Trailer> trailer = trailerRepo.findByLoadMaster_Id(foundLoad.getId());
            if (trailer.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Arrival can't be submitted without a trailer entered. Please use a different phone number or contact us if you think this is wrong");
                response.setMessageCode("Message_Code_23");
                return response;
            }

            Trailer foundTrailer = trailer.get();

            boolean isDriverHere = foundLoad.getLoadStatus() != Status.CREATED && foundLoad.getLoadStatus() != Status.CANCELLED;

            Task task = taskService.getTask(foundLoad.getId());

            response.setStatusCode(200);
            response.setMessage("Order Data Retrieved");
            response.setLoadId(foundLoad.getLoadId());
            response.setPhoneNumber(foundLoad.getPhoneNumber());
            response.setOrderNumbers(orderNumbers);
            response.setDriverName(foundLoad.getDriverName());
            response.setBrokerName(foundLoad.getBrokerName());
            response.setDriverArrived(isDriverHere);
            response.setDestinationWarehouse(destinationWarehouse);
            response.setWarehouseAddress(warehouseAddress);
            response.setTrailerNumber(foundTrailer.getTrailerNumber());
            response.setPotentialWeight(foundLoad.getPotentialWeight());
            response.setCustomerName(foundFirstOrder.getCustomerName());

            String address = foundFirstOrder.getDestCity() + " " + foundFirstOrder.getDestState() + " " + foundFirstOrder.getDestCountryCode();
            response.setCustomerAddress(address);

            if (task != null) {
                YardLocation yardLocation = yardLocationService.getYardLocationData(task.getDestinationArea(), task.getDestinationLocation());

                if (yardLocation != null) {
                    response.setCurrentDestinationArea(yardLocation.getArea());
                    response.setCurrentDestinationLocation(yardLocation.getLocation());
                    response.setLatitude(yardLocation.getLatitude());
                    response.setLongitude(yardLocation.getLongitude());
                } else {
                    response.setCurrentDestinationArea(task.getDestinationArea());
                    response.setCurrentDestinationLocation(task.getDestinationLocation());
                    response.setLatitude(null);
                    response.setLongitude(null);
                }

            } else {
                response.setCurrentDestinationArea(null);
                response.setCurrentDestinationLocation(null);
                response.setLatitude(null);
                response.setLongitude(null);
            }

            log.debug("Dashboard data retrieved for phone: {} from device: {}", phoneNumber, currentDeviceFingerprint);

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
            log.error("Error retrieving dashboard data", e);
        }
        return response;
    }

    private String generateVerificationCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    private boolean isRateLimited(String phoneNumber) {
        Integer attempts = loginAttempts.getIfPresent(phoneNumber);
        Long lastAttempt = lastAttemptTime.getIfPresent(phoneNumber);

        if (attempts == null || lastAttempt == null) {
            return false;
        }

        // Check if rate limit window has passed
        if (System.currentTimeMillis() - lastAttempt > RATE_LIMIT_WINDOW) {
            loginAttempts.invalidate(phoneNumber);
            lastAttemptTime.invalidate(phoneNumber);
            return false;
        }

        return attempts >= MAX_LOGIN_ATTEMPTS;
    }

    private void incrementLoginAttempts(String phoneNumber) {
        Integer attempts = loginAttempts.getIfPresent(phoneNumber);
        if (attempts == null) attempts = 0;
        loginAttempts.put(phoneNumber, attempts + 1);
        lastAttemptTime.put(phoneNumber, System.currentTimeMillis());
    }

    private String extractToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        return (token != null && token.startsWith("Bearer ")) ? token.substring(7) : null;
    }

    // Helper method to format phone number for Twilio
    private String formatPhoneNumberForTwilio(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return phoneNumber;
        }

        // Remove all non-digit characters
        String digitsOnly = phoneNumber.replaceAll("[^0-9]", "");

        // If it's a 10-digit number, add +1 prefix
        if (digitsOnly.length() == 10) {
            return "+1" + digitsOnly;
        }

        // If it already has country code (11 digits starting with 1), add + prefix
        if (digitsOnly.length() == 11 && digitsOnly.startsWith("1")) {
            return "+" + digitsOnly;
        }

        // If it already has + prefix, return as is
        if (phoneNumber.startsWith("+")) {
            return phoneNumber;
        }

        // Default case: assume it's a 10-digit number and add +1
        return "+1" + digitsOnly;
    }

}
