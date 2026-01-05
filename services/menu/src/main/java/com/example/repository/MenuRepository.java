package com.example.repository;

import com.example.model.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    @Query("""
        SELECT m FROM Menu m
        WHERE m.merchantId = :merchantId
        AND (:includeUnavailable = true OR m.availabilityStatus = 'available')
        ORDER BY m.type ASC, m.name ASC
    """)
    List<Menu> findByMerchantId(Long merchantId, boolean includeUnavailable);

    Optional<Menu> findByMerchantIdAndNameAndDescriptionAndPriceCentsAndImageUrlAndAvailabilityStatusAndType(
        Long merchantId, String name, String description, Integer priceCents,
        String imageUrl, String availabilityStatus, String type
    );

    List<Menu> findByMerchantIdAndMenuItemIdIn(Long merchantId, List<Long> menuItemIds);
}
