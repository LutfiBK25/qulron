package com.qulron.qulron_admin.utility;


import com.qulron.qulron_admin.enums.Status;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StatusConverter implements AttributeConverter<Status, String> {

    @Override
    public String convertToDatabaseColumn(Status status) {
        if (status == null) {
            return null;
        }
        return status.getStatus(); // Returns "00", "10", "20", etc.
    }

    @Override
    public Status convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }

        for (Status status : Status.values()) {
            if (status.getStatus().equals(dbData.trim())) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown status value: " + dbData);
    }
}