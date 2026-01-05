package com.example.service;

import com.example.model.Merchant;
import com.example.repository.MerchantRepository;
import com.example.exception.DuplicateException;
import com.example.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;

    /**
     * Returns all merchants (unspecified whether top-level only or all – here we return all).
     */
    @Transactional(readOnly = true)
    public List<Merchant> getAllMerchants() {
        return merchantRepository.findAll();
    }

    /**
     * Returns top-level merchants (parentMerchant is null).
     */
    @Transactional(readOnly = true)
    public List<Merchant> getTopLevelMerchants() {
        return merchantRepository.findTopLevelMerchants();
    }

    /**
     * Returns children of a parent merchant. If parentId is null, return top-level merchants.
     */
    @Transactional(readOnly = true)
    public List<Merchant> getMerchantsByParentId(Long parentId) {
        if (parentId == null) {
            return merchantRepository.findTopLevelMerchants();
        } else {
            return merchantRepository.findChildrenByParentId(parentId);
        }
    }

    @Transactional(readOnly = true)
    public Merchant getMerchantById(Long merchantId) {
        return merchantRepository.findById(merchantId)
                .orElseThrow(() -> new NotFoundException("Merchant", "ID", merchantId.toString()));
    }

    @Transactional(readOnly = true)
    public Merchant getMerchantByEmail(String email) {
        return merchantRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Merchant", "email", email));
    }

    /**
     * Create a merchant after checking for duplicates (based on same fields).
     */
    @Transactional
    public Merchant createMerchant(Merchant payload) {
        boolean exists = merchantRepository.existsByNameAndLocationAndContactNumberAndImageUrlAndPayoutFrequencyAndEmail(
                payload.getName(), payload.getLocation(), payload.getContactNumber(),
                payload.getImageUrl(), payload.getPayoutFrequency(), payload.getEmail()
        );
        if (exists) {
            // attempt to fetch the existing record to get its ID
            Optional<Merchant> existingOpt = merchantRepository.findByEmail(payload.getEmail());
            Long existingId = existingOpt.map(Merchant::getMerchantId).orElse(null);
            throw new DuplicateException("Merchant", "ID", existingId == null ? "unknown" : existingId.toString());
        }

        // Save merchant to DB
        Merchant savedMerchant = merchantRepository.save(payload);
        System.out.println("Merchant created: " + savedMerchant.getMerchantId());

        return savedMerchant;
    }

    /**
     * Partial update: only non-null fields of 'updates' are applied.
     * Returns updated merchant or throws NotFoundException if merchant doesn't exist.
     */
    @Transactional
    public Merchant updateMerchantPartial(Long merchantId, Merchant updates) {
        Merchant existing = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new NotFoundException("Merchant", "ID", merchantId.toString()));

        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        if (updates.getContactNumber() != null) existing.setContactNumber(updates.getContactNumber());
        if (updates.getImageUrl() != null) existing.setImageUrl(updates.getImageUrl());
        if (updates.getPayoutFrequency() != null) existing.setPayoutFrequency(updates.getPayoutFrequency());
        if (updates.getEmail() != null) existing.setEmail(updates.getEmail());
        if (updates.getParentMerchant() != null) existing.setParentMerchant(updates.getParentMerchant());

        return merchantRepository.save(existing);
    }

    /**
     * Helper: determine if a merchant has children.
     */
    @Transactional(readOnly = true)
    public boolean merchantHasChildren(Long merchantId) {
        return merchantRepository.hasChildren(merchantId);
    }
}