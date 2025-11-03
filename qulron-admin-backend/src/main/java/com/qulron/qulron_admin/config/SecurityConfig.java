package com.qulron.qulron_admin.config;


import com.qulron.qulron_admin.service.UserDetailService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration // This makes this class apply on the start
@EnableWebSecurity //  Enables Spring Security for the application
public class SecurityConfig {
    // Security configuration settings will go here

    private final UserDetailService userDetailService; // Custom service that loads user details from the database.


    private final JWTAuthFilter jwtAuthFilter; // The custom filter that handles JWT authentication (validates and sets user authentication).

    public SecurityConfig(UserDetailService userDetailService, JWTAuthFilter jwtAuthFilter) {
        this.userDetailService = userDetailService;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // Defines how HTTP security is handled, including authentication rules
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.csrf(AbstractHttpConfigurer::disable) // Since JWT is stateless authentication, CSRF protection is not needed.
                .cors(Customizer.withDefaults()) // Uses the default CORS settings (configured separately in CorsConfig).
                .authorizeHttpRequests(request ->
                        request.requestMatchers("/health").permitAll()
                                .requestMatchers("/user_management/admin/**").hasAnyAuthority("ADMIN")
                                .requestMatchers("/user_management/user/**", "/order_management/**").hasAnyAuthority("USER", "ADMIN")
                                .requestMatchers("/user_management/auth/**").permitAll()
                                .anyRequest().authenticated()) // any API endpoint not explicitly allowed for public access must be accessed by an authenticated user
                .sessionManagement(manager -> manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                //   Sets the authentication provider to manage user authentication.
                .authenticationProvider(authenticationProvider()).addFilterBefore(
                        jwtAuthFilter, UsernamePasswordAuthenticationFilter.class // Ensures JWT authentication happens before username/password authentication.
                );

        return httpSecurity.build();
    }

    //TODO : Figure the issue with deprecated Dao
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider();
        daoAuthenticationProvider.setUserDetailsService(userDetailService);
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder());
        return daoAuthenticationProvider;
    }

    // 	Ensures passwords are securely hashed using BCrypt.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Retrieves Spring Security’s default authentication manager.
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}