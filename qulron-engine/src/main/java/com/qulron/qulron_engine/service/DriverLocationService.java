package com.qulron.qulron_engine.service;

import com.qulron.qulron_engine.dto.DriverLocationDTO;
import com.qulron.qulron_engine.entity.DriverLocation;
import com.qulron.qulron_engine.entity.LoadMaster;
import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.repository.DriverLocationRepo;
import com.qulron.qulron_engine.repository.LoadMasterRepo;
import com.qulron.qulron_engine.utility.DeviceFingerprintUtils;
import com.qulron.qulron_engine.utility.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class DriverLocationService {

    // Constants for validation
    private static final BigDecimal MAX_LATITUDE = new BigDecimal("90.0");
    private static final BigDecimal MIN_LATITUDE = new BigDecimal("-90.0");
    private static final BigDecimal MAX_LONGITUDE = new BigDecimal("180.0");
    private static final BigDecimal MIN_LONGITUDE = new BigDecimal("-180.0");
    private static final int MAX_BATTERY_LEVEL = 100;
    private static final int MIN_BATTERY_LEVEL = 0;
    @Value("${app.system-user}")
    private String SYSTEM_USER;

    private final DriverLocationRepo driverLocationRepo;
    private final LoadMasterRepo loadMasterRepo;
    private final JWTUtils jwtUtils;
    private final DeviceFingerprintUtils deviceFingerprintUtils;

    public DriverLocationService(DriverLocationRepo driverLocationRepo, LoadMasterRepo loadMasterRepo, JWTUtils jwtUtils, DeviceFingerprintUtils deviceFingerprintUtils) {
        this.driverLocationRepo = driverLocationRepo;
        this.loadMasterRepo = loadMasterRepo;
        this.jwtUtils = jwtUtils;
        this.deviceFingerprintUtils = deviceFingerprintUtils;
    }

    public DriverLocationDTO updateDriverLocation(HttpServletRequest request, @Valid DriverLocationDTO locationDTO) {
        DriverLocationDTO response = new DriverLocationDTO();

        try {
            // Step 1: Validate request and extract token
            String phoneNumber = validateAndExtractPhoneNumber(request, response);
            if (phoneNumber == null) {
                return response; // Error already set
            }

            // Step 2: Validate location data
            if (!validateLocationData(locationDTO, response)) {
                return response;
            }

            // Step 3: Get active load for this phone number
            LoadMaster foundLoad = getActiveLoadForPhoneNumber(phoneNumber, response);
            if (foundLoad == null) {
                return response; // Error already set
            }

            // Step 4: Create and save location record
            DriverLocation savedLocation = createAndSaveLocation(foundLoad, locationDTO);
            if (savedLocation == null) {
                response.setStatusCode(500);
                response.setMessage("Failed to save location data");
                return response;
            }

            // Step 5: Set successful response
            setSuccessfulLocationResponse(response, savedLocation);

            log.info("Location updated successfully for load: {} by phone: {} with coordinates: ({}, {})",
                    foundLoad.getLoadId(), phoneNumber,
                    savedLocation.getLatitude(), savedLocation.getLongitude());

        } catch (Exception e) {
            log.error("Unexpected error updating driver location", e);
            response.setStatusCode(500);
            response.setMessage("Internal server error occurred");
        }

        return response;
    }


    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Validate request and extract phone number from token
     */
    private String validateAndExtractPhoneNumber(HttpServletRequest request, DriverLocationDTO response) {
        String token = extractToken(request);
        if (token == null) {
            response.setStatusCode(401);
            response.setMessage("Authorization token is missing or invalid");
            return null;
        }

        String phoneNumber = jwtUtils.extractPhoneNumber(token);
        if (phoneNumber == null) {
            response.setStatusCode(401);
            response.setMessage("Invalid token: phone number not found");
            return null;
        }

        // Mobile-friendly token validation with device fingerprinting
        String currentDeviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
        String currentLocation = deviceFingerprintUtils.extractLocation(request);

        if (!jwtUtils.isTokenValid(token, phoneNumber, currentDeviceFingerprint, currentLocation)) {
            response.setStatusCode(401);
            response.setMessage("Invalid or expired token");
            log.warn("Invalid token for location service by phone: {} from device: {}",
                    phoneNumber, currentDeviceFingerprint);
            return null;
        }

        return phoneNumber;
    }

    /**
     * Validate location data for production use
     */
    private boolean validateLocationData(DriverLocationDTO locationDTO, DriverLocationDTO response) {
        // Validate required fields
        if (locationDTO.getLatitude() == null || locationDTO.getLongitude() == null) {
            response.setStatusCode(400);
            response.setMessage("Latitude and longitude are required");
            return false;
        }

        // Validate coordinate ranges
        if (locationDTO.getLatitude().compareTo(MAX_LATITUDE) > 0 ||
                locationDTO.getLatitude().compareTo(MIN_LATITUDE) < 0) {
            response.setStatusCode(400);
            response.setMessage("Latitude must be between -90 and 90 degrees");
            return false;
        }

        if (locationDTO.getLongitude().compareTo(MAX_LONGITUDE) > 0 ||
                locationDTO.getLongitude().compareTo(MIN_LONGITUDE) < 0) {
            response.setStatusCode(400);
            response.setMessage("Longitude must be between -180 and 180 degrees");
            return false;
        }

        // Validate battery level if provided
        if (locationDTO.getBatteryLevel() != null) {
            if (locationDTO.getBatteryLevel() < MIN_BATTERY_LEVEL ||
                    locationDTO.getBatteryLevel() > MAX_BATTERY_LEVEL) {
                response.setStatusCode(400);
                response.setMessage("Battery level must be between 0 and 100");
                return false;
            }
        }

        // Validate speed if provided
        if (locationDTO.getSpeed() != null && locationDTO.getSpeed().compareTo(BigDecimal.ZERO) < 0) {
            response.setStatusCode(400);
            response.setMessage("Speed must be positive");
            return false;
        }

        return true;
    }

    /**
     * Get active load for phone number with error handling
     */
    private LoadMaster getActiveLoadForPhoneNumber(String phoneNumber, DriverLocationDTO response) {
        Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(
                phoneNumber,
                List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

        if (loadMaster.isEmpty()) {
            response.setStatusCode(400);
            response.setMessage("No active load found for this phone number");
            return null;
        }

        return loadMaster.get();
    }

    /**
     * Create and save location record with transaction safety
     */
    @Transactional
    private DriverLocation createAndSaveLocation(LoadMaster foundLoad, DriverLocationDTO locationDTO) {
        try {
            DriverLocation location = new DriverLocation();

            location.setLoadMaster(foundLoad);

            // Set location data from DTO
            location.setLatitude(locationDTO.getLatitude());
            location.setLongitude(locationDTO.getLongitude());
            location.setAccuracy(locationDTO.getAccuracy());
            location.setSpeed(locationDTO.getSpeed());
            location.setHeading(locationDTO.getHeading());
            location.setAltitude(locationDTO.getAltitude());
            location.setIsMoving(locationDTO.getIsMoving());
            location.setBatteryLevel(locationDTO.getBatteryLevel());
            location.setEstimatedArrival(locationDTO.getEstimatedArrival());
            location.setDestinationWarehouse(locationDTO.getDestinationWarehouse());
            location.setLocationTimestamp(LocalDateTime.now());
            location.setRecordCreateId(SYSTEM_USER);
            location.setRecordCreateDate(LocalDateTime.now());

            // Set Lat and Long for Load
            foundLoad.setLastDriverLatitude(locationDTO.getLatitude());
            foundLoad.setLastDriverLongitude(locationDTO.getLongitude());
            loadMasterRepo.save(foundLoad);
            return driverLocationRepo.save(location);
        } catch (Exception e) {
            log.error("Error creating location record", e);
            return null;
        }
    }


    /**
     * Set successful location response
     */
    private void setSuccessfulLocationResponse(DriverLocationDTO response, DriverLocation location) {
        response.setStatusCode(200);
        response.setMessage("Location data retrieved successfully");
        response.setId(location.getId());
        response.setLoadId(location.getLoadMaster().getLoadId());
        response.setLatitude(location.getLatitude());
        response.setLongitude(location.getLongitude());
        response.setAccuracy(location.getAccuracy());
        response.setSpeed(location.getSpeed());
        response.setHeading(location.getHeading());
        response.setAltitude(location.getAltitude());
        response.setIsMoving(location.getIsMoving());
        response.setBatteryLevel(location.getBatteryLevel());
        response.setEstimatedArrival(location.getEstimatedArrival());
        response.setDestinationWarehouse(location.getDestinationWarehouse());
        response.setLocationTimestamp(location.getLocationTimestamp());
    }

    /**
     * Extract token from request with validation
     */
    private String extractToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        return (token != null && token.startsWith("Bearer ")) ? token.substring(7) : null;
    }
}