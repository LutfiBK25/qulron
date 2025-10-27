package com.qulron.qulron_engine.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

// This is not used anymore, we are using the OSRM service directly
@Setter
@Getter
public class RouteRequest {
    private List<Waypoint> waypoints;
    private String profile = "driving"; // default profile

    public RouteRequest() {
    }

    public RouteRequest(List<Waypoint> waypoints, String profile) {
        this.waypoints = waypoints;
        this.profile = profile;
    }

    @Override
    public String toString() {
        return "RouteRequest{waypoints=" + waypoints + ", profile='" + profile + "'}";
    }

    @Getter
    @Setter
    // Nested Waypoint class
    public static class Waypoint {
        private double lat;
        private double lng;


        public Waypoint() {
        }

        public Waypoint(double lat, double lng) {
            this.lat = lat;
            this.lng = lng;
        }

        @Override
        public String toString() {
            return "Waypoint{lat=" + lat + ", lng=" + lng + "}";
        }
    }
}