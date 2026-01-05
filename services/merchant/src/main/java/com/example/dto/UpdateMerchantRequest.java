package com.example.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating merchant information.
 * Allows partial updates — any field can be null if not being updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMerchantRequest {

    private String name;

    private String location;

    private String contactNumber;

    private String imageUrl;

    @Email
    private String email;

    private String payoutFrequency;

    private Long parentMerchantId; // Optional: for assigning child to a parent
}
