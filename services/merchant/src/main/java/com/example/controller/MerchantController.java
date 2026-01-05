package com.example.controller;

import com.example.model.Merchant;
import com.example.service.MerchantService;
import com.example.dto.CreateMerchantRequest;
import com.example.dto.UpdateMerchantRequest;
import com.example.dto.MerchantResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    /**
     * GET /api/merchants
     * Returns all merchants. You may want to add pagination later.
     */
    @GetMapping
    public ResponseEntity<List<MerchantResponse>> getAllMerchants(
            @RequestParam(required = false) String parentId) {

        List<Merchant> merchants;

        if (parentId == null) {
            // Case 1: no query param → return all merchants
            merchants = merchantService.getAllMerchants();
        } else if (parentId.equalsIgnoreCase("null")) {
            // Case 3: parentId=null → return top-level merchants
            merchants = merchantService.getTopLevelMerchants();
        } else {
            // Case 2: parentId=<number> → return children
            Long parentIdLong;
            try {
                parentIdLong = Long.valueOf(parentId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().build();
            }
            merchants = merchantService.getMerchantsByParentId(parentIdLong);
        }

        List<MerchantResponse> responses = merchants.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }



    /**
     * GET /api/merchants/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MerchantResponse> getMerchant(@PathVariable("id") Long id) {
        Merchant m = merchantService.getMerchantById(id);
        MerchantResponse resp = toResponseWithHasChildren(m);
        return ResponseEntity.ok(resp);
    }


    /**
     * POST /api/merchants
     * Create merchant
     */
    @PostMapping
    public ResponseEntity<MerchantResponse> createMerchant(@RequestBody CreateMerchantRequest req) {
        Merchant toCreate = Merchant.builder()
                .name(req.getName())
                .location(req.getLocation())
                .contactNumber(req.getContactNumber())
                .imageUrl(req.getImageUrl())
                .payoutFrequency(req.getPayoutFrequency())
                .email(req.getEmail())
                .build();

        // parent if provided
        if (req.getParentMerchantId() != null) {
            Merchant parent = Merchant.builder().merchantId(req.getParentMerchantId()).build();
            toCreate.setParentMerchant(parent);
        }

        Merchant saved = merchantService.createMerchant(toCreate);
        MerchantResponse resp = toResponse(saved);
        URI location = URI.create("/api/merchants/" + saved.getMerchantId());
        return ResponseEntity.created(location).body(resp);
    }

    /**
     * PATCH /api/merchants/{id}
     * Partial update
     */
    @PatchMapping("/{id}")
    public ResponseEntity<MerchantResponse> patchMerchant(@PathVariable("id") Long id,
                                                          @RequestBody UpdateMerchantRequest req) {
        Merchant updates = new Merchant();
        updates.setName(req.getName());
        updates.setLocation(req.getLocation());
        updates.setContactNumber(req.getContactNumber());
        updates.setImageUrl(req.getImageUrl());
        updates.setPayoutFrequency(req.getPayoutFrequency());
        updates.setEmail(req.getEmail());
        if (req.getParentMerchantId() != null) {
            updates.setParentMerchant(Merchant.builder().merchantId(req.getParentMerchantId()).build());
        }

        Merchant updated = merchantService.updateMerchantPartial(id, updates);
        MerchantResponse resp = toResponseWithHasChildren(updated);
        return ResponseEntity.ok(resp);
    }

    /* ----- Helpers to convert entity <-> DTO ----- */

    private MerchantResponse toResponse(Merchant m) {
        MerchantResponse resp = new MerchantResponse();
        resp.setMerchantId(m.getMerchantId());
        resp.setName(m.getName());
        resp.setLocation(m.getLocation());
        resp.setContactNumber(m.getContactNumber());
        resp.setImageUrl(m.getImageUrl());
        resp.setPayoutFrequency(m.getPayoutFrequency());
        resp.setEmail(m.getEmail());
        resp.setParentMerchantId(m.getParentMerchant() != null ? m.getParentMerchant().getMerchantId() : null);
        resp.setHasChildren(null); // left null — use other method if you want it computed
        return resp;
    }

    private MerchantResponse toResponseWithHasChildren(Merchant m) {
        MerchantResponse resp = toResponse(m);
        Long id = m.getMerchantId();
        boolean hasChildren = merchantService.merchantHasChildren(id);
        resp.setHasChildren(hasChildren);
        return resp;
    }
}
