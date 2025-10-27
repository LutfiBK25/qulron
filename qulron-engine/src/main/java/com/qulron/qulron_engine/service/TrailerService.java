package com.qulron.qulron_engine.service;

import com.qulron.qulron_engine.dto.TrailerDTO;
import com.qulron.qulron_engine.entity.LoadMaster;
import com.qulron.qulron_engine.entity.Trailer;
import com.qulron.qulron_engine.enums.Status;
import com.qulron.qulron_engine.repository.LoadMasterRepo;
import com.qulron.qulron_engine.repository.TrailerRepo;
import com.qulron.qulron_engine.utility.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TrailerService {
    @Value("${app.system-user}")
    private String SYSTEM_USER;

    @Autowired
    private TrailerRepo trailerRepo;

    @Autowired
    private LoadMasterRepo loadMasterRepo;

    @Autowired
    private JWTUtils jwtUtils;

    public TrailerDTO createLoadTrailer(HttpServletRequest request, String trailerNumber) {
        TrailerDTO response = new TrailerDTO();
        try {
            String token = extractToken(request);
            if (token == null) {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing");
                response.setMessageCode("Message_Code_6");
                return response;
            }

            String phoneNumber = jwtUtils.extractPhoneNumber(token);
            Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(phoneNumber, List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            if (loadMaster.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Authorization token is invalid");
                response.setMessageCode("Message_Code_7");
                return response;
            }

            LoadMaster foundLoad = loadMaster.get();

            Optional<Trailer> existingTrailer = trailerRepo.findByLoadMaster_Id(foundLoad.getId());

            if (existingTrailer.isPresent()) {
                response.setStatusCode(400);
                response.setMessage("This load has been assigned a trailer already. Please contact us if you think this is wrong");
                response.setMessageCode("Message_Code_8");
                return response;
            }

            Trailer trailer = new Trailer();
            trailer.setTrailerNumber(trailerNumber);
            trailer.setLoadMaster(foundLoad);
            trailer.setRecordCreateId(SYSTEM_USER);
            trailer.setRecordCreateDate(LocalDateTime.now());

            Trailer result = trailerRepo.save(trailer);

            if (result.getId() > 0) {
                response.setStatusCode(200);
                response.setMessage("Trailer Submitted, Thank you!!!");
                response.setMessageCode("Message_Code_9");
            } else {
                response.setStatusCode(500);
                response.setMessage("Failed to save Trailer");
                response.setMessageCode("Message_Code_10");
            }


        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }

    public TrailerDTO trailerCheck(HttpServletRequest request) {

        TrailerDTO response = new TrailerDTO();

        try {
            String token = extractToken(request);
            if (token == null) {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing");
                response.setMessageCode("Message_Code_6");
                return response;
            }

            String phoneNumber = jwtUtils.extractPhoneNumber(token);

            Optional<LoadMaster> loadMaster = loadMasterRepo.findByPhoneNumberAndLoadStatusIn(phoneNumber, List.of(Status.CREATED, Status.ACTIVATED, Status.STARTED));

            if (loadMaster.isEmpty()) {
                response.setStatusCode(400);
                response.setMessage("Authorization token is invalid");
                response.setMessageCode("Message_Code_7");
                return response;
            }

            LoadMaster foundLoad = loadMaster.get();

            Optional<Trailer> existingTrailer = trailerRepo.findByLoadMaster_Id(foundLoad.getId());

            if (existingTrailer.isPresent()) {
                response.setTrailer(existingTrailer.get());
                response.setHasTrailer(true);
                response.setMessage("Trailer Found.");
                response.setMessageCode("Message_Code_11");
            } else {
                response.setMessage("Trailer is not assigned yet");
                response.setMessageCode("Message_Code_12");
                response.setHasTrailer(false);
            }
            response.setStatusCode(200);

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }

    public TrailerDTO trailerCheckOnLogin(Long loadId) {

        TrailerDTO response = new TrailerDTO();

        try {
            Optional<Trailer> existingTrailer = trailerRepo.findByLoadMaster_Id(loadId);

            if (existingTrailer.isPresent()) {
                response.setTrailer(existingTrailer.get());
                response.setHasTrailer(true);
            } else {
                response.setHasTrailer(false);
            }
            response.setStatusCode(200);

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }

    private String extractToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        return (token != null && token.startsWith("Bearer ")) ? token.substring(7) : null;
    }
}
