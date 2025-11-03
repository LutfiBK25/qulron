package com.qulron.qulron_admin.config;

import com.qulron.qulron_admin.entity.User;
import com.qulron.qulron_admin.service.UserDetailService;
import com.qulron.qulron_admin.utility.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// OncePerRequestFilter, ensuring the filter is executed once per request
@Component
public class JWTAuthFilter extends OncePerRequestFilter {
    public static final Logger logger = LoggerFactory.getLogger(JWTAuthFilter.class);

    // A utility class responsible for handling JWTs(creating, parsing, and validating tokens)
    private final JWTUtils jwtUtils;

    // Loads user details from the database based on the username
    private final UserDetailService userDetailService;

    public JWTAuthFilter(JWTUtils jwtUtils, UserDetailService userDetailService) {
        this.jwtUtils = jwtUtils;
        this.userDetailService = userDetailService;
    }

    // This method is executed for every request passing through the filter
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwtToken;
        final String username;

        // Checking if the Token is Present
        // If the Authorization header is null or empty, the filter simple passes the request to the next filter without doing anything.
        if (authHeader == null || authHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            // substring(7) -> Skips the word "Bearer " and extracts only the token.
            jwtToken = authHeader.substring(7);

            // Calls extractUsername(jwtToken) to decode the JWT and retrieve the username.
            username = jwtUtils.extractUsername(jwtToken);

            // Checks if the User is Already Authenticated
            // Ensures:
            // A valid username is extracted from the JWT
            // The user is not already authenticated (prevents re-authenticating an already authenticated request).
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userDetailService.loadUserByUsername(username);

                // to verify if the token is not expired and belongs to the user.
                // Creates a security context for the user.
                // Creates a UsernamePasswordAuthenticationToken, which:
                //      Stores the authenticated user (user).
                //      Sets null as credentials (since JWT authentication doesn't use a password after login).
                //      Passes user roles/authorities.
                // Registers the authentication token in Spring Security’s SecurityContextHolder, allowing the user to be recognized in the system.
                if (jwtUtils.isTokenValid(jwtToken, user)) {
                    // TODO: Add Role and Device
                    UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities()
                    );
                    SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
                    token.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    securityContext.setAuthentication(token);
                    SecurityContextHolder.setContext(securityContext);

                    logger.debug("Successfully authenticated user: {} with role: , from device: ", username);
                }
            }
        } catch (Exception e) {
            logger.error("Error processing JWT token for request: {}", request.getRequestURI(), e);
        }


        // the request is passed to the next filter
        filterChain.doFilter(request, response);
    }
}