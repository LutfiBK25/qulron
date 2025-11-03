package com.qulron.qulron_admin.utility;


import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;

@Component
public class DeviceFingerprintUtils {

    // Headers that help identify the device
    private static final List<String> FINGERPRINT_HEADERS = Arrays.asList(
            "User-Agent",
            "Accept-Language",
            "Accept-Encoding",
            "Accept",
            "Cache-Control",
            "Connection",
            "Upgrade-Insecure-Requests");

    /**
     * Generate a device fingerprint from request headers
     * This creates a unique but stable identifier for the device
     */
    public String generateDeviceFingerprint(HttpServletRequest request) {
        StringBuilder fingerprint = new StringBuilder();

        // Add User-Agent (most important for device identification)
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null) {
            fingerprint.append("UA:").append(normalizeUserAgent(userAgent));
        }

        // Add Accept-Language
        String acceptLanguage = request.getHeader("Accept-Language");
        if (acceptLanguage != null) {
            fingerprint.append("|LANG:").append(acceptLanguage.split(",")[0].trim());
        }

        // Add Accept-Encoding
        String acceptEncoding = request.getHeader("Accept-Encoding");
        if (acceptEncoding != null) {
            fingerprint.append("|ENC:").append(acceptEncoding);
        }

        // Add screen resolution if available (from custom header)
        String screenResolution = request.getHeader("X-Screen-Resolution");
        if (screenResolution != null) {
            fingerprint.append("|RES:").append(screenResolution);
        }

        // Add device model if available (from custom header)
        String deviceModel = request.getHeader("X-Device-Model");
        if (deviceModel != null) {
            fingerprint.append("|DEV:").append(deviceModel);
        }

        // Hash the fingerprint for security and consistency
        return hashFingerprint(fingerprint.toString());
    }

    /**
     * Normalize User-Agent to focus on device characteristics
     */
    private String normalizeUserAgent(String userAgent) {
        if (userAgent == null)
            return "";

        // Extract key device information
        String normalized = userAgent.toLowerCase();

        // Focus on mobile device indicators
        if (normalized.contains("mobile") || normalized.contains("android") ||
                normalized.contains("iphone") || normalized.contains("ipad")) {
            // Extract device family
            if (normalized.contains("android")) {
                return "android";
            } else if (normalized.contains("iphone")) {
                return "iphone";
            } else if (normalized.contains("ipad")) {
                return "ipad";
            } else {
                return "mobile";
            }
        }

        // For desktop browsers, use a more generic approach
        if (normalized.contains("chrome")) {
            return "chrome";
        } else if (normalized.contains("firefox")) {
            return "firefox";
        } else if (normalized.contains("safari")) {
            return "safari";
        } else if (normalized.contains("edge")) {
            return "edge";
        }

        return "unknown";
    }

    /**
     * Hash the fingerprint for security and consistency
     */
    private String hashFingerprint(String fingerprint) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(fingerprint.getBytes());
            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }

            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            // Fallback to simple hash if SHA-256 is not available
            return String.valueOf(fingerprint.hashCode());
        }
    }

    /**
     * Extract location information from request
     * This is a simplified approach - in production, you might use geolocation APIs
     */
    public String extractLocation(HttpServletRequest request) {
        // For now, we'll use a simple approach
        // In production, you could integrate with geolocation services

        // Check for custom location header (if client provides it)
        String customLocation = request.getHeader("X-Client-Location");
        if (customLocation != null && !customLocation.isEmpty()) {
            return customLocation;
        }

        // Use IP-based location (simplified)
        String clientIp = getClientIpAddress(request);
        return "IP:" + clientIp;
    }

    /**
     * Get client IP address with proxy support
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * Validate if two device fingerprints are compatible
     * Allows for some variation in mobile devices
     */
    public boolean isDeviceCompatible(String tokenFingerprint, String currentFingerprint) {
        if (tokenFingerprint == null || currentFingerprint == null) {
            return true; // Allow if no fingerprint available
        }

        // For now, require exact match
        // In production, you could implement fuzzy matching
        return tokenFingerprint.equals(currentFingerprint);
    }
}
