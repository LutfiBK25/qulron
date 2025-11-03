package com.qulron.qulron_admin.service;

import com.qulron.qulron_admin.entity.User;
import com.qulron.qulron_admin.enums.Role;
import com.qulron.qulron_admin.repository.UserRepo;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {
    private final UserRepo userRepo;

    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    private void createAdminAccount() {
        List<User> optionalUser = userRepo.findByRole(Role.ADMIN);
        if (optionalUser.isEmpty()) {
            User user = new User();
            user.setUsername("admin");
            user.setFirstName("Qulron");
            user.setLastName("Admin");
            user.setEmail("admin@qulron.com");
            user.setPhone("9738551518");
            user.setPassword(passwordEncoder.encode("admin"));
            user.setRole(Role.ADMIN);
            user.setPasswordResetRequired(false);
            userRepo.save(user);
            System.out.println("Admin account created successfully");
        } else {
            System.out.println("Admin Account is already exist!");
        }
    }
}
