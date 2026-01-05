package com.example.service;

import com.example.exception.DuplicateException;
import com.example.exception.NotFoundException;
import com.example.model.Menu;
import com.example.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;

    public List<Menu> getMenuItemsByMerchantId(Long merchantId, boolean includeUnavailable) {
        List<Menu> items = menuRepository.findByMerchantId(merchantId, includeUnavailable);
        if (items.isEmpty()) {
            throw new NotFoundException("Menu Item", "merchantId", merchantId.toString());
        }
        return items;
    }

    public Menu createMenuItem(Menu menuItem) {
        boolean exists = menuRepository
                .findByMerchantIdAndNameAndDescriptionAndPriceCentsAndImageUrlAndAvailabilityStatusAndType(
                        menuItem.getMerchantId(),
                        menuItem.getName(),
                        menuItem.getDescription(),
                        menuItem.getPriceCents(),
                        menuItem.getImageUrl(),
                        menuItem.getAvailabilityStatus(),
                        menuItem.getType()
                ).isPresent();

        if (exists) {
            throw new DuplicateException("Menu Item", "name", menuItem.getName());
        }

        return menuRepository.save(menuItem);
    }

    public Menu getMenuItemById(Long menuItemId) {
        return menuRepository.findById(menuItemId)
                .orElseThrow(() -> new NotFoundException("Menu Item", "ID", menuItemId.toString()));
    }

    public Menu updateMenuItem(Long merchantId, Long menuItemId, Menu updates) {
        // 1) Ensure the menu item exists
        Menu existing = getMenuItemById(menuItemId); // throws NotFoundException if missing

        // 2) Ownership check: item must belong to the merchant in the path
        if (!existing.getMerchantId().equals(merchantId)) {
            // Match monolith behavior: 403 when the item doesn't belong to that merchant
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This menu item does not belong to the specified merchant"
            );
        }

        // 3) Apply partial updates
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getPriceCents() != null) existing.setPriceCents(updates.getPriceCents());
        if (updates.getImageUrl() != null) existing.setImageUrl(updates.getImageUrl());
        if (updates.getType() != null) existing.setType(updates.getType());
        if (updates.getAvailabilityStatus() != null) existing.setAvailabilityStatus(updates.getAvailabilityStatus());

        return menuRepository.save(existing);
    }

    public List<Map<String, Object>> getMenuItemsByIds(Long merchantId, List<Long> itemIds) {
        List<Menu> menuItems = menuRepository.findByMerchantIdAndMenuItemIdIn(merchantId, itemIds);
        
        // Check if all requested items were found
        if (menuItems.size() != itemIds.size()) {
            List<Long> foundIds = menuItems.stream()
                    .map(Menu::getMenuItemId)
                    .collect(Collectors.toList());
            
            List<Long> missingIds = itemIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            
            throw new NotFoundException(
                    "Menu Item(s)", 
                    "IDs", 
                    missingIds.toString() + " for merchantId=" + merchantId
            );
        }
        
        return menuItems.stream()
                .map(menu -> {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("itemId", menu.getMenuItemId());
                    item.put("name", menu.getName());
                    item.put("priceCents", menu.getPriceCents());
                    item.put("available", "available".equals(menu.getAvailabilityStatus()));
                    return item;
                })
                .collect(Collectors.toList());
    }
}