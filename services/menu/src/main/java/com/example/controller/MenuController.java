package com.example.controller;

import com.example.model.Menu;
import com.example.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/merchants/{merchantId}/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    // GET /api/merchants/{merchantId}/menu?includeUnavailable=true
    @GetMapping
    public ResponseEntity<List<Menu>> getMenuByMerchantId(
            @PathVariable Long merchantId,
            @RequestParam(defaultValue = "false") boolean includeUnavailable) {
        List<Menu> menuItems = menuService.getMenuItemsByMerchantId(merchantId, includeUnavailable);
        return ResponseEntity.ok(menuItems);
    }

    // POST /api/merchants/{merchantId}/menu
    @PostMapping
    public ResponseEntity<Menu> createMenuItem(
            @PathVariable Long merchantId,
            @RequestBody Menu menuItem) {
        menuItem.setMerchantId(merchantId);
        Menu created = menuService.createMenuItem(menuItem);
        return ResponseEntity.status(201).body(created);
    }

    // PUT /api/merchants/{merchantId}/menu/{menuItemId}
    @PutMapping("/{menuItemId}")
    public ResponseEntity<Menu> updateMenuItem(
            @PathVariable Long merchantId,
            @PathVariable Long menuItemId,
            @RequestBody Menu updates) {

        Menu updated = menuService.updateMenuItem(merchantId, menuItemId, updates);
        return ResponseEntity.ok(updated);
    }

    // POST /api/merchants/{merchantId}/menu/items
    @PostMapping("/items")
    public ResponseEntity<Map<String, Object>> getMenuItemsByIds(
            @PathVariable Long merchantId,
            @RequestBody Map<String, List<Long>> request) {
        
        List<Long> itemIds = request.get("itemIds");
        List<Map<String, Object>> items = menuService.getMenuItemsByIds(merchantId, itemIds);
        
        return ResponseEntity.ok(Map.of("items", items));
    }

}