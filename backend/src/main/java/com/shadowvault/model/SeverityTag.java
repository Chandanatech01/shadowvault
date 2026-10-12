package com.shadowvault.model;

public enum SeverityTag {
    THREAT(30),
    PHYSICAL_HARM(40),
    REPEATED_INCIDENT(20),
    HARASSMENT(10),
    STALKING(25);

    private final int weight;

    SeverityTag(int weight) {
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }
}
