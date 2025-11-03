package com.qulron.qulron_engine.config;

import com.qulron.qulron_engine.utility.DeviceFingerprintUtils;
import com.qulron.qulron_engine.utility.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JWTAuthFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JWTAuthFilter.class);


    private final JWTUtils jwtUtils;

    private final DeviceFingerprintUtils deviceFingerprintUtils;

    public JWTAuthFilter(JWTUtils jwtUtils, DeviceFingerprintUtils deviceFingerprintUtils) {
        this.jwtUtils = jwtUtils;
        this.deviceFingerprintUtils = deviceFingerprintUtils;
    }

    // This method is executed for every request passing through the filter
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwtToken;
        final String phoneNumber;

        // Checking if the Token is Present
        // If the Authorization header is null or empty, the filter simple passes the
        // request to the next filter without doing anything.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // substring(7) -> Skips the word "Bearer " and extracts only the token.
            jwtToken = authHeader.substring(7);

            // Check if token is blacklisted
            if (jwtUtils.isBlacklisted(jwtToken)) {
                logger.warn("Blacklisted token attempted to access: {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            // Calls extractPhoneNumber(jwtToken) to decode the JWT and retrieve the phone
            // number.
            phoneNumber = jwtUtils.extractPhoneNumber(jwtToken);

            // Checks if the User is Already Authenticated
            // Ensures:
            // A valid username is extracted from the JWT
            // The user is not already authenticated (prevents re-authenticating an already
            // authenticated request).
            if (phoneNumber != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Generate current device fingerprint and location
                String currentDeviceFingerprint = deviceFingerprintUtils.generateDeviceFingerprint(request);
                String currentLocation = deviceFingerprintUtils.extractLocation(request);

                // Validate the token with mobile-friendly approach
                if (jwtUtils.isTokenValid(jwtToken, phoneNumber, currentDeviceFingerprint, currentLocation)) {
                    // Extract roles/authorities from the token
                    String role = jwtUtils.extractRole(jwtToken);
                    var authorities = List.of(new SimpleGrantedAuthority(role));

                    UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                            phoneNumber, null, authorities);
                    token.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
                    securityContext.setAuthentication(token);
                    SecurityContextHolder.setContext(securityContext);

                    logger.debug("Successfully authenticated user: {} with role: {} from device: {}",
                            phoneNumber, role, currentDeviceFingerprint);
                } else {
                    logger.warn("Invalid token for user: {} accessing: {} from device: {}",
                            phoneNumber, request.getRequestURI(), currentDeviceFingerprint);
                }
            }
        } catch (Exception e) {
            logger.error("Error processing JWT token for request: {}", request.getRequestURI(), e);
        }

        filterChain.doFilter(request, response);
    }
}
