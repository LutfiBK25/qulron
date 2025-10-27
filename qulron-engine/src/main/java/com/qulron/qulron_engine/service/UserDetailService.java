package com.qulron.qulron_engine.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailService implements UserDetailsService {
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // This should never be called in JWT-only flow, but must exist for Spring Security
        throw new UsernameNotFoundException("No user database; authentication is JWT-only.");
    }
}
