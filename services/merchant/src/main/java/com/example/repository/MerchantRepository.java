package com.example.repository;

import com.example.model.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantRepository extends JpaRepository<Merchant, Long> {

    Optional<Merchant> findByEmail(String email);

    // Top-level merchants
    @Query("SELECT m FROM Merchant m WHERE m.parentMerchant IS NULL ORDER BY m.merchantId ASC")
    List<Merchant> findTopLevelMerchants();

    // Child merchants
    @Query("SELECT m FROM Merchant m WHERE m.parentMerchant.merchantId = :parentId ORDER BY m.merchantId ASC")
    List<Merchant> findChildrenByParentId(Long parentId);

    boolean existsByNameAndLocationAndContactNumberAndImageUrlAndPayoutFrequencyAndEmail(
            String name, String location, String contactNumber, String imageUrl, String payoutFrequency, String email
    );

    @Query("SELECT CASE WHEN (COUNT(c) > 0) THEN true ELSE false END FROM Merchant c WHERE c.parentMerchant.merchantId = :parentId")
    boolean hasChildren(Long parentId);
}
