package com.shadowvault.model;

public enum SeverityLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public static SeverityLevel fromScore(int score) {
        if (score < 40) {
            return LOW;
        } else if (score < 100) {
            return MEDIUM;
        } else if (score < 200) {
            return HIGH;
        } else {
            return CRITICAL;
        }
    }
}
