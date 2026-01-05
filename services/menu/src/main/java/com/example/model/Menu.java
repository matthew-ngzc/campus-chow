package com.example.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "menu_item_id")
    private Long menuItemId;

    @Column(name = "merchant_id", nullable = false)
    private Long merchantId; // links to merchant-service ID

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false)
    private String type; // e.g., "food", "drink"

    @Column(name = "availability_status", nullable = false)
    private String availabilityStatus; // available, out_of_stock, removed
}