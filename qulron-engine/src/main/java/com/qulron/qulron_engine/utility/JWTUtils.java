package com.qulron.qulron_engine.utility;

import com.qulron.qulron_engine.enums.Role;
import com.qulron.qulron_engine.exception.JwtAuthenticationException;
import io.jsonwebtoken.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

@Component
public class JWTUtils {
    private static final int MAX_BLACKLIST_SIZE = 10000;
    private final long EXPIRATION_TIME;
    private final long REFRESH_EXPIRATION_TIME;
    private final long BLACKLIST_CLEANUP_INTERVAL;
    private final long BLACKLIST_TOKEN_LIFETIME;
    // Store token with timestamp
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();
    private SecretKey key;
    @Value("${jwt.secret}")
    private String secretString;
    private ScheduledExecutorService scheduler;

    public JWTUtils(@Value("${jwt.expiration:21600000}") long expirationTime,
                    @Value("${jwt.refresh-expiration:604800000}") long refreshExpirationTime,
                    @Value("${jwt.blacklist-cleanup-interval:3600000}") long blacklistCleanupInterval,
                    @Value("${jwt.blacklist-token-lifetime:86400000}") long blacklistTokenLifetime) {
        EXPIRATION_TIME = expirationTime;
        REFRESH_EXPIRATION_TIME = refreshExpirationTime;
        BLACKLIST_CLEANUP_INTERVAL = blacklistCleanupInterval;
        BLACKLIST_TOKEN_LIFETIME = blacklistTokenLifetime;
    }

    @PostConstruct
    public void init() {
        // Initialize the secret key
        byte[] keyBytes = Base64.getDecoder().decode(secretString.getBytes(StandardCharsets.UTF_8));
        this.key = new SecretKeySpec(keyBytes, "HmacSHA256");

        // Create scheduler
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "JWT-Blacklist-Cleanup");
            t.setDaemon(true);
            return t;
        });

        // Start cleanup scheduler
        startCleanupScheduler();
    }

    public String generateToken(String phoneNumber, Role role, String deviceFingerprint, String location) {
        return Jwts.builder()
                .subject(phoneNumber)
                .claim("role", role)
                .claim("device", deviceFingerprint)
                .claim("location", location)
                .claim("loginTime", Instant.now().toEpochMilli())
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusMillis(EXPIRATION_TIME)))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(HashMap<String, Object> claims, String phoneNumber) {
        return Jwts.builder()
                .claims(claims)
                .subject(phoneNumber)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    @PreDestroy
    public void shutdown() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    public String extractPhoneNumber(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractDeviceFingerprint(String token) {
        return extractAllClaims(token).get("device", String.class);
    }

    public String extractLocation(String token) {
        return extractAllClaims(token).get("location", String.class);
    }

    public Long extractLoginTime(String token) {
        return extractAllClaims(token).get("loginTime", Long.class);
    }

    public Claims extractAllClaims(String token) {
        try {
            return Jwts.parser().verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new JwtAuthenticationException("JWT token has expired", e);
        } catch (MalformedJwtException | UnsupportedJwtException | IllegalArgumentException | SecurityException e) {
            throw new JwtAuthenticationException("Invalid JWT token", e);
        }

    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction) {
        return claimsTFunction.apply(extractAllClaims(token));
    }

    public boolean isTokenValid(String token, String phoneNumber, String currentDeviceFingerprint,
                                String currentLocation) {
        if (isBlacklisted(token)) {
            return false;
        }
        try {
            Claims claims = extractAllClaims(token);
            return isPhoneNumberValid(claims, phoneNumber) &&
                    isTokenNotExpired(claims) &&
                    isDeviceFingerprintValid(claims, currentDeviceFingerprint) &&
                    isLocationValid(claims, currentLocation) &&
                    isNotTooOld(claims);
        } catch (JwtAuthenticationException e) {
            return false;
        }
    }

    private boolean isPhoneNumberValid(Claims claims, String phoneNumber) {
        return claims.getSubject().equals(phoneNumber);
    }

    private boolean isTokenNotExpired(Claims claims) {
        return !claims.getExpiration().before(new Date());
    }

    private boolean isDeviceFingerprintValid(Claims claims, String currentDeviceFingerprint) {
        String tokenDevice = claims.get("device", String.class);
        return tokenDevice == null || currentDeviceFingerprint == null || tokenDevice.equals(currentDeviceFingerprint);
    }

    private boolean isLocationValid(Claims claims, String currentLocation) {
        String tokenLocation = claims.get("location", String.class);
        return tokenLocation == null || currentLocation == null || isLocationReasonable(tokenLocation, currentLocation);
    }

    private boolean isNotTooOld(Claims claims) {
        Long loginTime = claims.get("loginTime", Long.class);
        return loginTime == null || (Instant.now().toEpochMilli() - loginTime) <= EXPIRATION_TIME;
    }

    public boolean isTokenValid(String token, String phoneNumber) {
        return isTokenValid(token, phoneNumber, null, null);
    }

    public void blacklistToken(String token) {
        if (blacklistedTokens.size() >= MAX_BLACKLIST_SIZE) {
            cleanupExpiredTokens(); // force cleanup if size grows too much
        }
        blacklistedTokens.put(token, System.currentTimeMillis());
    }

    public boolean isBlacklisted(String token) {
        Long blacklistTime = blacklistedTokens.get(token);
        if (blacklistTime == null)
            return false;

        // Check if token is older than configured lifetime
        if (System.currentTimeMillis() - blacklistTime > BLACKLIST_TOKEN_LIFETIME) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    private boolean isLocationReasonable(String tokenLocation, String currentLocation) {
        // Simple location validation - can be enhanced with geolocation services
        // For now, we'll allow any location change (mobile-friendly)
        // In production, you could integrate with geolocation APIs
        return true;
    }

    private void startCleanupScheduler() {
        scheduler.scheduleAtFixedRate(this::cleanupExpiredTokens,
                BLACKLIST_CLEANUP_INTERVAL, BLACKLIST_CLEANUP_INTERVAL, TimeUnit.MILLISECONDS);
    }

    private void cleanupExpiredTokens() {
        long currentTime = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> currentTime - entry.getValue() > BLACKLIST_TOKEN_LIFETIME);
    }
}

