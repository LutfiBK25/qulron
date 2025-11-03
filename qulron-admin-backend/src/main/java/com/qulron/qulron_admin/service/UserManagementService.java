package com.qulron.qulron_admin.service;


import com.qulron.qulron_admin.dto.UserDTO;
import com.qulron.qulron_admin.entity.User;
import com.qulron.qulron_admin.repository.UserRepo;
import com.qulron.qulron_admin.utility.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserManagementService {


    private final UserRepo userRepo;
    private final JWTUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepo userRepo, JWTUtils jwtUtils, AuthenticationManager authenticationManager, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
    }

    public UserDTO registerUser(UserDTO registrationReq) {
        UserDTO response = new UserDTO();

        try {
            // Check if email already used
            if (userRepo.findByEmail(registrationReq.getEmail()).isPresent()) {
                response.setStatusCode(400);
                response.setMessage("Email is already in use");
                return response;
            }

            // Check if username already used
            if (userRepo.findByUsername(registrationReq.getUsername()).isPresent()) {
                response.setStatusCode(400);
                response.setMessage("Username is already in use");
                return response;
            }

            // Check if phone already used
            if (userRepo.findByPhone(registrationReq.getPhone()).isPresent()) {
                response.setStatusCode(400);
                response.setMessage("Phone is already in use");
                return response;
            }

            User user = new User();
            user.setUsername(registrationReq.getUsername());
            user.setFirstName(registrationReq.getFirstName());
            user.setLastName(registrationReq.getLastName());
            user.setEmail(registrationReq.getEmail());
            user.setPhone(registrationReq.getPhone());
            user.setPassword(passwordEncoder.encode(registrationReq.getPassword()));
            user.setRole(registrationReq.getRole());
            User userResult = userRepo.save(user);

            if (user.getId() > 0) {
                response.setUser(userResult);
                response.setStatusCode(200);
                response.setMessage("User Saved Successfully");
            }

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setError("Internal Server Error " + e.getMessage());
        }
        return response;
    }


    public UserDTO login(UserDTO loginReq) {
        UserDTO response = new UserDTO();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginReq.getUsername(), loginReq.getPassword()));
            User user = userRepo.findByUsername(loginReq.getUsername()).orElseThrow();

            var jwt = jwtUtils.generateToken(user);
            var refreshToken = jwtUtils.generateRefreshToken(new HashMap<>(), user);

            response.setToken(jwt);
            response.setRole(user.getRole());
            response.setRefreshToken(refreshToken);
            response.setExpirationTime("24Hrs");
            response.setStatusCode(200);
            response.setMessage("Successfully Logged In");
        } catch (BadCredentialsException e) {
            response.setStatusCode(401);
            response.setMessage("Invalid username or password"); // Avoid leaking info
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setError("Internal Server Error " + e.getMessage());
        }
        return response;
    }

    public UserDTO refreshToken(UserDTO refreshTokenRequest) {
        UserDTO response = new UserDTO();
        try {
            String ourUsername = jwtUtils.extractUsername(refreshTokenRequest.getToken());
            User user = userRepo.findByUsername(ourUsername).orElseThrow();
            if (jwtUtils.isTokenValid(refreshTokenRequest.getToken(), user)) {
                var jwt = jwtUtils.generateToken(user);
                response.setStatusCode(200);
                response.setToken(jwt);
                response.setRefreshToken(refreshTokenRequest.getToken());
                response.setExpirationTime("24Hr");
                response.setMessage("Successfully Refreshed Token");
            }
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setError("Internal Server Error " + e.getMessage());
        }
        return response;
    }

    public UserDTO getAllUsers() {
        UserDTO response = new UserDTO();
        try {
            List<User> usersList = userRepo.findAll();
            if (!usersList.isEmpty()) {
                response.setUserList(usersList);
                response.setStatusCode(200);
                response.setMessage("Users retrieved Successfully");
            } else {
                response.setStatusCode(404);
                response.setMessage("No Users Found");
            }
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setError("Internal Server Error " + e.getMessage());
        }
        return response;
    }

    public UserDTO getUserByUsername(String username) {
        UserDTO response = new UserDTO();
        try {
            User user = userRepo.findByUsername(username).orElseThrow(() -> new NoSuchElementException("User Not Found"));
            response.setUser(user);
            response.setStatusCode(200);
            response.setMessage("Users with id '" + username + "' found Successfully!");
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }

    public UserDTO updateUser(String username, UserDTO updatedUser) {
        UserDTO response = new UserDTO();
        try {
            Optional<User> userOptional = userRepo.findByUsername(username);
            if (userOptional.isEmpty()) {
                response.setStatusCode(404);
                response.setMessage("User not found for update");
                return response;
            }

            User curUser = userOptional.get();

            // Check email uniqueness only if email is provided and changed
            if (updatedUser.getUsername() != null &&
                    !updatedUser.getUsername().equalsIgnoreCase(curUser.getUsername()) &&
                    userRepo.findByEmail(updatedUser.getUsername()).isPresent()) {

                response.setStatusCode(400);
                response.setMessage("Email is already in use");
                return response;
            }

            // Check email uniqueness only if email is provided and changed
            if (updatedUser.getEmail() != null &&
                    !updatedUser.getEmail().equalsIgnoreCase(curUser.getEmail()) &&
                    userRepo.findByEmail(updatedUser.getEmail()).isPresent()) {

                response.setStatusCode(400);
                response.setMessage("Email is already in use");
                return response;
            }

            // Check phone uniqueness only if phone is provided and changed
            if (updatedUser.getPhone() != null &&
                    !updatedUser.getPhone().equals(curUser.getPhone()) &&
                    userRepo.findByPhone(updatedUser.getPhone()).isPresent()) {

                response.setStatusCode(400);
                response.setMessage("Phone is already in use");
                return response;
            }

            if (updatedUser.getUsername() != null) curUser.setUsername(updatedUser.getUsername());
            if (updatedUser.getRole() != null) curUser.setRole(updatedUser.getRole());
            if (updatedUser.getEmail() != null) curUser.setEmail(updatedUser.getEmail());
            if (updatedUser.getPhone() != null) curUser.setPhone(updatedUser.getPhone());
            if (updatedUser.getFirstName() != null) curUser.setFirstName(updatedUser.getFirstName());
            if (updatedUser.getLastName() != null) curUser.setLastName(updatedUser.getLastName());


            User savedUser = userRepo.save(curUser);
            response.setUser(savedUser);
            response.setStatusCode(200);
            response.setMessage("User updated successfully");

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }

    public UserDTO deleteUser(String username) {
        UserDTO response = new UserDTO();
        try {
            Optional<User> usersOptional = userRepo.findByUsername(username);
            if (usersOptional.isPresent()) {
                userRepo.deleteByUsername(username);
                response.setStatusCode(200);
                response.setMessage("Username '" + username + "' deleted Successfully!");
            } else {
                response.setStatusCode(404);
                response.setMessage("User not found");
            }
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }


    public UserDTO updateProfile(HttpServletRequest request, UserDTO updatedUser) {
        UserDTO response = new UserDTO();
        try {
            String token = extractToken(request);
            if (token == null) {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing or invalid");
                return response;
            }

            String ourUsername = jwtUtils.extractUsername(token);
            Optional<User> userOptional = userRepo.findByUsername(ourUsername);

            if (userOptional.isEmpty()) {
                response.setStatusCode(404);
                response.setMessage("User not found for update");
                return response;
            }


            User curUser = userOptional.get();

            // Check email uniqueness only if email is provided and changed
            if (updatedUser.getEmail() != null &&
                    !updatedUser.getEmail().equalsIgnoreCase(curUser.getEmail()) &&
                    userRepo.findByEmail(updatedUser.getEmail()).isPresent()) {

                response.setStatusCode(400);
                response.setMessage("Email is already in use");
                return response;
            }

            // Check phone uniqueness only if phone is provided and changed
            if (updatedUser.getPhone() != null &&
                    !updatedUser.getPhone().equals(curUser.getPhone()) &&
                    userRepo.findByPhone(updatedUser.getPhone()).isPresent()) {

                response.setStatusCode(400);
                response.setMessage("Phone is already in use");
                return response;
            }

            Optional.ofNullable(updatedUser.getEmail()).ifPresent(curUser::setEmail);
            Optional.ofNullable(updatedUser.getPhone()).ifPresent(curUser::setPhone);
            Optional.ofNullable(updatedUser.getFirstName()).ifPresent(curUser::setFirstName);
            Optional.ofNullable(updatedUser.getLastName()).ifPresent(curUser::setLastName);

            User savedUser = userRepo.save(curUser);
            response.setUser(savedUser);
            response.setStatusCode(200);
            response.setMessage("User updated successfully");


        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred: " + e.getMessage());
        }
        return response;
    }

    public UserDTO getMyInfo(HttpServletRequest request) {
        UserDTO response = new UserDTO();
        try {
            String token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            } else {
                response.setStatusCode(401);
                response.setMessage("Authorization token is missing or invalid");
                return response;
            }
            String ourUsername = jwtUtils.extractUsername(token);
            Optional<User> userOptional = userRepo.findByUsername(ourUsername);
            if (userOptional.isPresent()) {
                response.setUser(userOptional.get());
                response.setStatusCode(200);
                response.setMessage("User Found");
            } else {
                response.setStatusCode(404);
                response.setMessage("User not Found");
            }

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred while getting user info: " + e.getMessage());
        }
        return response;
    }

    // Password Management

    public UserDTO resetPassword(String username) {
        UserDTO response = new UserDTO();
        try {
            Optional<User> userOptional = userRepo.findByUsername(username);
            if (userOptional.isPresent()) {
                User userToReset = userOptional.get();
                String tempPassword = UUID.randomUUID().toString().substring(0, 8); // Generate 8-char random password
                userToReset.setPassword(passwordEncoder.encode(tempPassword));
                userToReset.setPasswordResetRequired(true); // Force password change
                User savedUser = userRepo.save(userToReset);

                response.setUser(savedUser);
                response.setStatusCode(200);
                response.setMessage("User password reset successfully, Password : " + tempPassword);
            } else {
                response.setStatusCode(404);
                response.setMessage("User not Found");
            }

        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred while getting user info: " + e.getMessage());
        }
        return response;
    }

    public UserDTO updatePassword(String username, String oldPassword, String newPassword) {
        UserDTO response = new UserDTO();
        try {
            Optional<User> userOptional = userRepo.findByUsername(username);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                    response.setStatusCode(401); // Unauthorized
                    response.setMessage("Old password is incorrect.");
                } else {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    user.setPasswordResetRequired(false); // Mark password reset as complete

                    User savedUser = userRepo.save(user);
                    response.setUser(savedUser);
                    response.setStatusCode(200);
                    response.setMessage("Password updated successfully.");
                }
            } else {
                response.setStatusCode(404);
                response.setMessage("User not found.");
            }
        } catch (Exception e) {
            response.setStatusCode(500);
            response.setMessage("Error occurred while updating password: " + e.getMessage());
        }
        return response;
    }

    private String extractToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        return (token != null && token.startsWith("Bearer ")) ? token.substring(7) : null;
    }


}

