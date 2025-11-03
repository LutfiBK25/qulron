package com.qulron.qulron_admin.controller;

import com.qulron.qulron_admin.dto.PasswordUpdateDTO;
import com.qulron.qulron_admin.dto.UserDTO;
import com.qulron.qulron_admin.service.UserManagementService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user_management")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @PostMapping("/admin/new_user")
    public ResponseEntity<UserDTO> register(@RequestBody UserDTO registerReq) {
        return ResponseEntity.ok(userManagementService.registerUser(registerReq));
    }

    @PostMapping("auth/login")
    public ResponseEntity<UserDTO> login(@RequestBody UserDTO loginReq) {
        return ResponseEntity.ok(userManagementService.login(loginReq));
    }

    @PostMapping("/user/refresh")
    public ResponseEntity<UserDTO> refreshToken(@RequestBody UserDTO refreshTokenReq) {
        return ResponseEntity.ok(userManagementService.refreshToken(refreshTokenReq));
    }

    @GetMapping("/admin/all_users")
    public ResponseEntity<UserDTO> getAllUsers() {
        return ResponseEntity.ok(userManagementService.getAllUsers());
    }

    @GetMapping("/admin/user/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userManagementService.getUserByUsername(username));
    }

    @PutMapping("/admin/user/update/{username}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String username, @RequestBody UserDTO updateReq) {
        return ResponseEntity.ok(userManagementService.updateUser(username, updateReq));
    }

    @PutMapping("/user/profile/update")
    public ResponseEntity<UserDTO> updateProfile(
            HttpServletRequest request,
            @RequestBody UserDTO updateReq) {

        UserDTO updatedUser = userManagementService.updateProfile(request, updateReq);

        return ResponseEntity
                .status(updatedUser.getStatusCode())
                .body(updatedUser);
    }

    @PutMapping("admin/passwordreset/{username}")
    public ResponseEntity<UserDTO> resetUserPassword(@PathVariable String username) {
        return ResponseEntity.ok(userManagementService.resetPassword(username));
    }

    @GetMapping("/user/me")
    public ResponseEntity<UserDTO> getMyProfile(HttpServletRequest request) {
        UserDTO response = userManagementService.getMyInfo(request);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @PutMapping("/user/updatepassword")
    public ResponseEntity<UserDTO> updatePassword(@RequestBody PasswordUpdateDTO passwordUpdateDTO) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        return ResponseEntity.ok(userManagementService.updatePassword(username, passwordUpdateDTO.getOldPassword(), passwordUpdateDTO.getNewPassword()));
    }

    @DeleteMapping("/admin/delete/{username}")
    public ResponseEntity<UserDTO> deleteUser(@PathVariable String username) {
        return ResponseEntity.ok(userManagementService.deleteUser(username));
    }
}
