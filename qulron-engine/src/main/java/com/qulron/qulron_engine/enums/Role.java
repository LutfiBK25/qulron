package com.qulron.qulron_engine.enums;

public enum Role {
    DRIVER("DRIVER"),
    BROKER("BROKER");

    private final String role;

    Role(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}
