package com.example.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "merchants",
       uniqueConstraints = {
           @UniqueConstraint(name = "uc_merchant_email", columnNames = {"email"})
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merchant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "merchant_id")
    private Long merchantId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 500)
    private String location;

    @Column(name = "contact_number", length = 50)
    private String contactNumber;

    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @Column(name = "payout_frequency", length = 50)
    private String payoutFrequency;

    @Column(length = 255, unique = true)
    private String email;

    /**
     * Self-referencing many-to-one to represent parent merchant (nullable for top-level merchants).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_merchant_id")
    private Merchant parentMerchant;

    /**
     * hasChildren is derived dynamically (not persisted): true if merchant has any children.
     */
    @Transient
    public boolean isHasChildren() {
        // This is a convenience getter—data layer (repository/service) should determine it.
        // When serializing, the service can set this if desired; or rely on the controller to compute it.
        return false;
    }
}
