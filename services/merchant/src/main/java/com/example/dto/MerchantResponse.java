package com.example.dto;

import lombok.Data;

@Data
public class MerchantResponse {
    private Long merchantId;
    private String name;
    private String location;
    private String contactNumber;
    private String imageUrl;
    private String payoutFrequency;
    private String email;
    private Long parentMerchantId;
    private Boolean hasChildren; // computed by controller/service
}
