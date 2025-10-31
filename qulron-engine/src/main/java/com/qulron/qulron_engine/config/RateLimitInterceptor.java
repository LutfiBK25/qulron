package com.qulron.qulron_engine.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);

    private static class BucketInfo{
        final Bucket bucket;
        final long createdAt;

        BucketInfo(Bucket bucket){
            this.bucket = bucket;
            this.createdAt = System.currentTimeMillis();
        }
    }
    // Global rate limiting (Tier 1) - will be initialized in @PostConstruct
    private Bucket globalBucket;
    // Per-IP rate limiting (Tier 2)
    private final Map<String, BucketInfo> ipBuckets = new ConcurrentHashMap<>();

    /// Configurations
    // Global rate limits
    @Value("${rate.limit.requests-per-minute-global}")
    private int requestsPerMinuteGlobal;
    // Rate limits per IP
    @Value("${rate.limit.requests-per-minute-per-ip}")
    private int requestsPerMinutePerIp;
    @Value("${rate.limit.strict-requests-per-time-interval-per-ip}")
    private int strictRequestsPerTimeIntervalPerIp;
    @Value("${rate.limit.strict-time-interval-minutes}")
    private int timeIntervalMinutes;
    // Cleaning the bucket used for ip
    @Value("${rate.limit.bucket-cleanup-minutes:120}")
    private int bucketCleanupMinutes;
    @Value("${rate.limit.bucket-max-age-minutes:1440}") // 24 hours default
    private int bucketMaxAgeMinutes;


    // Initialize the global bucket
    @PostConstruct
    public void init() {
        // Create global bucket AFTER properties are injected
        globalBucket = createBucket(requestsPerMinuteGlobal, Duration.ofMinutes(1));

        // Get Back to This
        startBucketCleanupTask();
    }

    // Rate limits Handler
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        String clientIP = getClientIP(request);
        String path = request.getRequestURI();

        // Tier 1: Check global rate limit first
        if (!globalBucket.tryConsume(1)) {
            handleRateLimitExceeded(response, "GLOBAL", request.getMethod(), path, clientIP,"Server is experiencing high load. Please try again later." );
            return false;
        }

        // Tier 2: Check per-IP rate limit
        Bucket ipBucket = getIPBucket(clientIP, request);
        if (!ipBucket.tryConsume(1)) {
            handleRateLimitExceeded(response,"IP", request.getMethod(), path, clientIP, "Rate limit exceeded for your IP: " + clientIP + ". Please try again later.");
            return false;
        }

        logger.debug("Rate limit check passed for {} {} from IP: {}",
                request.getMethod(), path, clientIP);
        return true;
    }

    private Bucket getIPBucket(String clientIP, HttpServletRequest request) {
        boolean isStrictEndpoint = shouldUseStrictBucket(request);
        String bucketKey = clientIP + (isStrictEndpoint ? "_strict" : "_normal");

        // Double-checking locking pattern to ensure thread-safe bucket creation
        BucketInfo existingBucket = ipBuckets.get(bucketKey);
        if (existingBucket != null){
            return existingBucket.bucket;
        }

        synchronized (this){
            // Check again that bucket doesn't exist in sync block
            existingBucket = ipBuckets.get(bucketKey);
            if (existingBucket != null){
                return existingBucket.bucket;
            }

            // Create a new ip bucket
            Bucket newBucket;
            if(isStrictEndpoint) {
                newBucket = createBucket(strictRequestsPerTimeIntervalPerIp, Duration.ofMinutes(timeIntervalMinutes));
            } else {
                newBucket = createBucket(requestsPerMinutePerIp, Duration.ofMinutes(1));
            }
            BucketInfo newBucketInfo = new BucketInfo(newBucket);
            ipBuckets.put(bucketKey,newBucketInfo);
            return newBucket;
        }
    }

    private Bucket createBucket(int capacity, Duration duration) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillGreedy(capacity, duration)
                        .build())
                .build();
    }

    private void handleRateLimitExceeded(HttpServletResponse response, String limitType, String requestMethod, String path, String clientIP, String message) throws Exception{
        logger.warn("{} rate limit exceeded for {} {} from IP: {}",
                limitType ,requestMethod, path, clientIP);
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("text/plain");
        response.getWriter().write(message);
    }

    private void startBucketCleanupTask(){
        Thread cleanupThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()){
                try{
                    Thread.sleep(Duration.ofMinutes(bucketCleanupMinutes).toMillis());
                    cleanUpOldBuckets();

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        cleanupThread.setDaemon(true);
        cleanupThread.setName("rate-limiting-cleanup");
        cleanupThread.start();
    }

    private void cleanUpOldBuckets() {
        int initialSize = ipBuckets.size();
        if (initialSize == 0){
            return;
        }

        long maxAgeMillis = Duration.ofMinutes(bucketMaxAgeMinutes).toMillis();
        long currentTime = System.currentTimeMillis();
        AtomicInteger removedCount = new AtomicInteger(0); //this is an overkill since it is a single thread, but it is what it is

        // Remove buckets older than max age
        ipBuckets.entrySet().removeIf(entry -> {
            long bucketAge = currentTime - entry.getValue().createdAt;
            if (bucketAge > maxAgeMillis) {
                logger.debug("Removing old bucket for IP: {}",
                        entry.getKey().replace("_strict", "").replace("_normal", ""));
                removedCount.incrementAndGet();
                return true;
            }
            return false;
        });

        if (removedCount.get() > 0) {
            logger.info("Bucket cleanup: removed {} old buckets, {} remaining",
                    removedCount.get(), ipBuckets.size());
        }
    }

    // TODO: Add more endpoints to the list and remove the ones that are not
    // sensitive
    private boolean shouldUseStrictBucket(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.contains("/broker") ||
                path.contains("/auth/request-code") ||
                path.contains("/auth/verify-code") ||
                path.contains("/trailer/new") ||
                path.contains("/driver/arrival");
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty() && !"unknown".equalsIgnoreCase(xRealIP)) {
            return xRealIP;
        }

        return request.getRemoteAddr();
    }
}